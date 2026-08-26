import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";
import { mkdtemp, writeFile, access } from "fs/promises";

const execAsync = promisify(exec);

const SHIM_SO = path.join(os.tmpdir(), "lo_socket_shim.so");

// Some sandboxed/containerized environments block AF_UNIX sockets, which
// LibreOffice's headless mode relies on internally — without this shim it
// simply hangs or fails to start. The shim intercepts socket() and falls
// back to socketpair() only when the real AF_UNIX socket() call is blocked,
// so it is a no-op (and harmless) on normal hosts where nothing is blocked.
const SHIM_SOURCE = `
#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <unistd.h>

static int (*real_socket)(int, int, int);
static int (*real_socketpair)(int, int, int, int[2]);
static int (*real_listen)(int, int);
static int (*real_accept)(int, struct sockaddr *, socklen_t *);
static int (*real_close)(int);
static int (*real_read)(int, void *, size_t);

static int is_shimmed[1024];
static int peer_of[1024];
static int wake_r[1024];
static int wake_w[1024];
static int listener_fd = -1;

__attribute__((constructor))
static void init(void) {
    real_socket     = dlsym(RTLD_NEXT, "socket");
    real_socketpair = dlsym(RTLD_NEXT, "socketpair");
    real_listen     = dlsym(RTLD_NEXT, "listen");
    real_accept     = dlsym(RTLD_NEXT, "accept");
    real_close      = dlsym(RTLD_NEXT, "close");
    real_read       = dlsym(RTLD_NEXT, "read");
    for (int i = 0; i < 1024; i++) { peer_of[i] = -1; wake_r[i] = -1; wake_w[i] = -1; }
}

int socket(int domain, int type, int protocol) {
    if (domain == AF_UNIX) {
        int fd = real_socket(domain, type, protocol);
        if (fd >= 0) return fd;
        int sv[2];
        if (real_socketpair(domain, type, protocol, sv) == 0) {
            if (sv[0] >= 0 && sv[0] < 1024) {
                is_shimmed[sv[0]] = 1;
                peer_of[sv[0]] = sv[1];
                int wp[2];
                if (pipe(wp) == 0) { wake_r[sv[0]] = wp[0]; wake_w[sv[0]] = wp[1]; }
            }
            return sv[0];
        }
        errno = EPERM;
        return -1;
    }
    return real_socket(domain, type, protocol);
}

int listen(int fd, int backlog) {
    if (fd >= 0 && fd < 1024 && is_shimmed[fd]) { listener_fd = fd; return 0; }
    return real_listen(fd, backlog);
}

int accept(int fd, struct sockaddr *addr, socklen_t *addrlen) {
    if (fd >= 0 && fd < 1024 && is_shimmed[fd] && fd == listener_fd) {
        if (wake_r[fd] >= 0) { char buf[1]; real_read(wake_r[fd], buf, 1); }
        int peer = peer_of[fd];
        listener_fd = -1;
        return peer;
    }
    return real_accept(fd, addr, addrlen);
}

int close(int fd) {
    if (fd >= 0 && fd < 1024 && wake_w[fd] >= 0) { char buf[1] = {0}; write(wake_w[fd], buf, 1); }
    return real_close(fd);
}
`;

let shimReady: Promise<boolean> | null = null;

async function ensureShim(): Promise<boolean> {
  if (shimReady) return shimReady;
  shimReady = (async () => {
    try {
      await access(SHIM_SO);
      return true;
    } catch {
      // not compiled yet
    }
    try {
      const srcPath = path.join(os.tmpdir(), "lo_socket_shim.c");
      await writeFile(srcPath, SHIM_SOURCE);
      await execAsync(`gcc -shared -fPIC -o "${SHIM_SO}" "${srcPath}" -ldl`, { timeout: 20000 });
      return true;
    } catch (e) {
      return false;
    }
  })();
  return shimReady;
}

/**
 * Converts a document to PDF using headless LibreOffice, returning the
 * output PDF path, or null if LibreOffice is unavailable or conversion fails.
 * Uses an isolated user profile per call (required when running as root or
 * without a writable HOME) and an optional socket shim for sandboxed hosts
 * that block AF_UNIX sockets.
 */
export async function convertToPdf(inputPath: string, outDir: string): Promise<string | null> {
  try {
    const hasShim = await ensureShim();
    const profileDir = await mkdtemp(path.join(os.tmpdir(), "lo_profile_"));
    const env = {
      ...process.env,
      SAL_USE_VCLPLUGIN: "svp",
      ...(hasShim ? { LD_PRELOAD: SHIM_SO } : {}),
    };
    const profileUri = `file://${profileDir}`;
    await execAsync(
      `soffice --headless -env:UserInstallation=${profileUri} --convert-to pdf --outdir "${outDir}" "${inputPath}"`,
      { timeout: 45000, env }
    );
    const base = path.basename(inputPath).replace(/\.[^.]+$/, ".pdf");
    const outPath = path.join(outDir, base);
    await access(outPath);
    return outPath;
  } catch (e) {
    console.error("PDF conversion failed", e);
    return null;
  }
}
