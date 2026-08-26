/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Uploads/documentos gerados são servidos por uma rota de API própria
  // (src/app/api/files/[...path]) em vez do serving estático padrão do
  // Next, que não segue de forma confiável o link simbólico usado para
  // apontar public/uploads para o volume persistente do Railway.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/files/:path*" }];
  },
};

module.exports = nextConfig;
