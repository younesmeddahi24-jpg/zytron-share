import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "zytron-share.ipa");

  if (!fs.existsSync(filePath)) {
    return new Response("IPA file not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="zytron-share.ipa"',
      "Content-Length": fileBuffer.byteLength.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
