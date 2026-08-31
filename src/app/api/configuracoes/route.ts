import { NextRequest, NextResponse } from "next/server";
import { getFirmProfile, setFirmProfile } from "@/lib/firm";
import { saveUploadedFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getFirmProfile());
}

const TEXT_FIELDS = [
  "name",
  "lawyer",
  "oab",
  "cpf",
  "cnpj",
  "companyName",
  "address",
  "city",
  "state",
  "phone",
  "email",
  "bank",
] as const;

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const updates: Record<string, string> = {};
  for (const field of TEXT_FIELDS) {
    const value = form.get(field);
    if (typeof value === "string") updates[field] = value;
  }

  const logo = form.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const { filePath } = await saveUploadedFile(logo, "firm");
    updates.logoPath = filePath;
  }

  const logoFull = form.get("logoFull") as File | null;
  if (logoFull && logoFull.size > 0) {
    const { filePath } = await saveUploadedFile(logoFull, "firm");
    updates.logoFullPath = filePath;
  }

  const profile = await setFirmProfile(updates);
  return NextResponse.json(profile);
}
