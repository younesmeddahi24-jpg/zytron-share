import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  let iconBase64 = "";
  try {
    const iconPath = path.join(process.cwd(), "public", "icon-192.png");
    const buf = fs.readFileSync(iconPath);
    iconBase64 = buf.toString("base64");
  } catch {
    iconBase64 = "";
  }

  const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>IgnoreManifestScope</key>
      <false/>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>Zytron Drop</string>
      <key>PayloadDescription</key>
      <string>Installeert de native Zytron Drop AirDrop &amp; P2P App op je iPhone of iPad</string>
      <key>PayloadDisplayName</key>
      <string>Zytron Drop Native App</string>
      <key>PayloadIdentifier</key>
      <string>app.zytron.drop.webclip</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>8A9C4E12-5B21-4F90-9D3A-1E2B3C4D5E6F</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PreComposed</key>
      <true/>
      <key>URL</key>
      <string>https://zytron-share.vercel.app/?source=native-ios</string>
      ${
        iconBase64
          ? `<key>Icon</key>
      <data>${iconBase64}</data>`
          : ""
      }
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Installeert Zytron Drop als echte native full-screen app op iOS / iPadOS.</string>
  <key>PayloadDisplayName</key>
  <string>Zytron Drop — Native iOS App</string>
  <key>PayloadIdentifier</key>
  <string>app.zytron.drop.profile</string>
  <key>PayloadOrganization</key>
  <string>Zytron</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>2F7B9A01-3C44-4E88-A122-9B8C7D6E5F40</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

  return new NextResponse(mobileConfigXml, {
    status: 200,
    headers: {
      "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Zytron-Drop.mobileconfig"',
      "Cache-Control": "no-store",
    },
  });
}
