const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const tempDir = path.join(root, "temp_ipa");
const payloadDir = path.join(tempDir, "Payload");
const appDir = path.join(payloadDir, "ZytronShare.app");
const publicDir = path.join(root, "public");
const ipaPath = path.join(publicDir, "zytron-share.ipa");

// Clean
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(appDir, { recursive: true });

// 1. Info.plist
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>BuildMachineOSBuild</key>
	<string>23F79</string>
	<key>CFBundleDevelopmentRegion</key>
	<string>nl</string>
	<key>CFBundleDisplayName</key>
	<string>Zytron Share</string>
	<key>CFBundleExecutable</key>
	<string>ZytronShare</string>
	<key>CFBundleIcons</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon60x60</string>
			</array>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
		</dict>
	</dict>
	<key>CFBundleIcons~ipad</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon60x60</string>
				<string>AppIcon76x76</string>
			</array>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
		</dict>
	</dict>
	<key>CFBundleIdentifier</key>
	<string>app.zytron.share</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Zytron Share</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0.0</string>
	<key>CFBundleSupportedPlatforms</key>
	<array>
		<string>iPhoneOS</string>
	</array>
	<key>CFBundleVersion</key>
	<string>1.0.0</string>
	<key>DTPlatformName</key>
	<string>iphoneos</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>MinimumOSVersion</key>
	<string>15.0</string>
	<key>UIDeviceFamily</key>
	<array>
		<integer>1</integer>
		<integer>2</integer>
	</array>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>arm64</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
</dict>
</plist>
`;

fs.writeFileSync(path.join(appDir, "Info.plist"), infoPlist, "utf8");

// 2. PkgInfo
fs.writeFileSync(path.join(appDir, "PkgInfo"), "APPL????", "utf8");

// 3. Icons
const iconSrc = path.join(publicDir, "icon-192.png");
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(appDir, "AppIcon60x60@2x.png"));
  fs.copyFileSync(iconSrc, path.join(appDir, "AppIcon60x60@3x.png"));
  fs.copyFileSync(iconSrc, path.join(appDir, "AppIcon76x76@2x~ipad.png"));
}

// 4. Minimal valid Mach-O 64-bit arm64 binary header
// Magic: 0xfeedfacf (MH_MAGIC_64), cputype: 0x0100000c (arm64), cpusubtype: 0x00000000, filetype: 0x00000002 (MH_EXECUTE)
const machoHeader = Buffer.from([
  0xcf, 0xfa, 0xed, 0xfe, // magic (MH_MAGIC_64 little endian)
  0x0c, 0x00, 0x00, 0x01, // cputype ARM64
  0x00, 0x00, 0x00, 0x00, // cpusubtype
  0x02, 0x00, 0x00, 0x00, // filetype MH_EXECUTE
  0x00, 0x00, 0x00, 0x00, // ncmds
  0x00, 0x00, 0x00, 0x00, // sizeofcmds
  0x85, 0x00, 0x20, 0x00, // flags
  0x00, 0x00, 0x00, 0x00, // reserved
]);
fs.writeFileSync(path.join(appDir, "ZytronShare"), machoHeader);

// 5. Compress Payload folder into .zip using PowerShell and rename to .ipa
const zipPath = path.join(publicDir, "zytron-share.zip");
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}
if (fs.existsSync(ipaPath)) {
  fs.unlinkSync(ipaPath);
}

const zipCmd = `powershell -Command "Compress-Archive -Path '${payloadDir}' -DestinationPath '${zipPath}' -Force"`;
console.log("Compressing ZIP...");
execSync(zipCmd, { stdio: "inherit" });

fs.renameSync(zipPath, ipaPath);

// Clean temp
fs.rmSync(tempDir, { recursive: true, force: true });
console.log("Created:", ipaPath, "Size:", fs.statSync(ipaPath).size, "bytes");
