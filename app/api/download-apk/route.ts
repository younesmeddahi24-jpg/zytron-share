import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "zytron-share.apk");

  if (!fs.existsSync(filePath)) {
    // Fallback redirect if local binary is missing
    return Response.redirect(
      "https://github.com/younesmeddahi24-jpg/zytron-share/releases/download/v1.0.0-apk/zytron-share.apk",
      302,
    );
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="zytron-share.apk"',
      "Content-Length": fileBuffer.byteLength.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
