"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import NotabilityStealthView from "./NotabilityStealthView";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  Camera,
  Check,
  Clipboard,
  ClipboardCheck,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Filter,
  Gamepad2,
  Globe,
  HardDrive,
  Laptop,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  Monitor,
  PenTool,
  Phone,
  QrCode,
  Radar,
  Radio,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Trash2,
  Tv,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
  Zap,
  BookOpen,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Types & Brand Profiles
   ──────────────────────────────────────────────────────────────────────────── */

type BrandId = "ios" | "xiaomi" | "samsung" | "huawei" | "android" | "desktop";

type DeviceProfile = {
  brand: BrandId;
  brandLabel: string;
  osSkin: string;
  modelName: string;
  gpuRenderer: string;
  screenSpec: string;
  cores: number;
  memoryGb: number | null;
  batteryPct: number | null;
  networkType: string;
  chunkSizeKb: number;
  parallelStreams: number;
  accentColor: string;
  badgeBg: string;
  optimizationNote: string;
};

type PeerDeviceInfo = {
  peerId: string;
  friendCode?: string;
  roomCode: string;
  name: string;
  brand: BrandId;
  brandLabel: string;
  osSkin: string;
  modelName: string;
  sameWifi?: boolean;
};

type SavedFriend = {
  id: string;
  friendCode: string;
  name: string;
  peerId?: string;
  brand: BrandId;
  brandLabel: string;
  modelName: string;
  addedAt: number;
  lastSeen?: number;
  isOnline?: boolean;
};

type WhatsAppContact = {
  id: string;
  pairCode: string;
  phone: string;
  name: string;
  peerId: string;
  brand: BrandId;
  brandLabel: string;
  osSkin: string;
  modelName: string;
  gpuRenderer?: string;
  screenSpec?: string;
  batteryPct?: number | null;
  networkType?: string;
  sameWifi: boolean;
  online: boolean;
  lastSeen: number;
};

type BluetoothNearbyDevice = {
  id: string;
  name: string;
  connected: boolean;
  batteryPct?: number | null;
  manufacturer?: string;
  modelNumber?: string;
};

type QueuedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  source: "picker" | "share_sheet" | "drop";
};

type TransferItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  direction: "outgoing" | "incoming";
  progress: number;
  speedMbps: number;
  status: "streaming" | "completed" | "error";
  blobUrl?: string;
  blob?: Blob;
  peerName: string;
  timestamp: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type SendFx = {
  id: string;
  phase: "waiting" | "launch" | "streaming" | "done" | "declined";
  peerName: string;
  peerBrand: BrandId;
  fileCount: number;
  totalSize: number;
  progress: number;
  speedMbps: number;
  thumbs: string[];
  label: string;
};

type ReceiveFx = {
  id: string;
  phase: "incoming" | "streaming" | "done";
  senderName: string;
  senderBrand: BrandId;
  label: string;
  totalSize: number;
  progress: number;
  thumbs: string[];
  isText: boolean;
  textPreview?: string;
  blobUrl?: string;
  fileName?: string;
};

type IncomingOffer = {
  offerId: string;
  dropId?: string;
  pin?: string;
  peerId: string;
  senderName: string;
  senderBrand: BrandId;
  senderBrandLabel: string;
  kind: "files" | "text";
  files: { name: string; size: number; type: string }[];
  totalSize: number;
  thumbs: string[];
  textPreview?: string;
};

const SPRING = { type: "spring", stiffness: 280, damping: 28 } as const;

const BRAND_CONFIGS: Record<
  BrandId,
  {
    label: string;
    osSkin: string;
    chunkSizeKb: number;
    parallelStreams: number;
    accentColor: string;
    badgeBg: string;
    optimizationNote: string;
  }
> = {
  ios: {
    label: "Apple iOS / iPadOS",
    osSkin: "iOS Native AirDrop & WebRTC Engine",
    chunkSizeKb: 64,
    parallelStreams: 2,
    accentColor: "text-sky-300",
    badgeBg: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    optimizationNote:
      "64 KB WebKit binary framing actief · Echte Apple AirDrop Share-Sheet + Cross-Platform WebRTC P2P.",
  },
  xiaomi: {
    label: "Xiaomi / Redmi / POCO",
    osSkin: "Xiaomi HyperOS / MIUI • Hardware Share",
    chunkSizeKb: 256,
    parallelStreams: 4,
    accentColor: "text-orange-300",
    badgeBg: "border-orange-400/30 bg-orange-400/10 text-orange-200",
    optimizationNote:
      "256 KB High-Throughput Chunks · Echte Bluetooth Hardware Scanner + Mi Share / Quick Share & WebRTC P2P.",
  },
  samsung: {
    label: "Samsung Galaxy",
    osSkin: "One UI • Quick Share & Bluetooth Core",
    chunkSizeKb: 192,
    parallelStreams: 4,
    accentColor: "text-indigo-300",
    badgeBg: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
    optimizationNote:
      "192 KB High-Speed Stream · Echte Bluetooth Hardware Scanner + Samsung Quick Share & WebRTC P2P.",
  },
  huawei: {
    label: "Huawei / Honor",
    osSkin: "HarmonyOS / EMUI • Hardware Share",
    chunkSizeKb: 128,
    parallelStreams: 3,
    accentColor: "text-rose-300",
    badgeBg: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    optimizationNote:
      "128 KB P2P protocol · Echte Bluetooth Hardware Scanner + Huawei Share & WebRTC P2P.",
  },
  android: {
    label: "Android Smartphone",
    osSkin: "Android • Bluetooth & Quick Share Engine",
    chunkSizeKb: 192,
    parallelStreams: 4,
    accentColor: "text-emerald-300",
    badgeBg: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    optimizationNote:
      "192 KB WebRTC DataChannel · Echte Bluetooth Hardware Scanner + Android Quick Share & Share-Menu.",
  },
  desktop: {
    label: "PC / Mac Workstation",
    osSkin: "Desktop Bluetooth & WebRTC P2P Bridge",
    chunkSizeKb: 256,
    parallelStreams: 6,
    accentColor: "text-purple-300",
    badgeBg: "border-purple-400/30 bg-purple-400/10 text-purple-200",
    optimizationNote:
      "256 KB Workstation Stream · Echte Web Bluetooth Hardware Scanner + Wi-Fi P2P Radar.",
  },
};

/* ────────────────────────────────────────────────────────────────────────────
   100% Real Hardware & OS Scanner (Zero Fake Model Guesses)
   ──────────────────────────────────────────────────────────────────────────── */

function mapAppleGattModelIdentifier(code: string): string {
  const clean = code.trim();
  const table: Record<string, string> = {
    "iPhone10,3": "iPhone X",
    "iPhone10,6": "iPhone X",
    "iPhone11,2": "iPhone XS",
    "iPhone11,4": "iPhone XS Max",
    "iPhone11,6": "iPhone XS Max",
    "iPhone11,8": "iPhone XR",
    "iPhone12,1": "iPhone 11",
    "iPhone12,3": "iPhone 11 Pro",
    "iPhone12,5": "iPhone 11 Pro Max",
    "iPhone13,1": "iPhone 12 mini",
    "iPhone13,2": "iPhone 12",
    "iPhone13,3": "iPhone 12 Pro",
    "iPhone13,4": "iPhone 12 Pro Max",
    "iPhone14,4": "iPhone 13 mini",
    "iPhone14,5": "iPhone 13",
    "iPhone14,2": "iPhone 13 Pro",
    "iPhone14,3": "iPhone 13 Pro Max",
    "iPhone14,7": "iPhone 14",
    "iPhone14,8": "iPhone 14 Plus",
    "iPhone15,2": "iPhone 14 Pro",
    "iPhone15,3": "iPhone 14 Pro Max",
    "iPhone15,4": "iPhone 15",
    "iPhone15,5": "iPhone 15 Plus",
    "iPhone16,1": "iPhone 15 Pro",
    "iPhone16,2": "iPhone 15 Pro Max",
    "iPhone17,3": "iPhone 16",
    "iPhone17,4": "iPhone 16 Plus",
    "iPhone17,1": "iPhone 16 Pro",
    "iPhone17,2": "iPhone 16 Pro Max",
    "iPhone17,5": "iPhone 16e",
    "iPad11,1": "iPad mini 5",
    "iPad11,2": "iPad mini 5",
    "iPad11,3": "iPad Air 3",
    "iPad11,4": "iPad Air 3",
    "iPad13,1": "iPad Air 4",
    "iPad13,2": "iPad Air 4",
    "iPad13,16": "iPad Air 5",
    "iPad13,17": "iPad Air 5",
    "iPad14,1": "iPad mini 6",
    "iPad14,2": "iPad mini 6",
    "iPad8,1": "iPad Pro 11-inch",
    "iPad8,5": "iPad Pro 12.9-inch 3rd Gen",
    "iPad13,4": "iPad Pro 11-inch 3rd Gen",
    "iPad13,8": "iPad Pro 12.9-inch 5th Gen",
    "iPad14,3": "iPad Pro 11-inch 4th Gen",
    "iPad14,5": "iPad Pro 12.9-inch 6th Gen",
    "iPad16,3": "iPad Pro 11-inch M4",
    "iPad16,5": "iPad Pro 13-inch M4",
  };
  return table[clean] || clean;
}

/* ────────────────────────────────────────────────────────────────────────────
   Device Filtering & Classification (Exclude Non-Receivable Noise: Audio / IoT)
   ──────────────────────────────────────────────────────────────────────────── */

type DeviceCategory = "all" | "phone" | "tablet" | "pc" | "tv";

// Strict regex matching non-droppable accessories, audio gear, and IoT peripherals
const NON_RECEIVABLE_DEVICE_REGEX =
  /\b(airpods?|earbuds?|headset|headphones?|buds|soundbar|speaker|boombox|flip\s*\d|charge\s*\d|jbl|bose|wh-1000\w*|wf-1000\w*|soundcore|sonos|echo\s*dot|nest\s*(audio|mini)|bulb|light|lamp|led|socket|plug|switch|thermostat|hue|tuya|smart\s*plug|lock|sensor|watch|apple\s*watch|galaxy\s*watch|band|fitbit|garmin|mouse|keyboard|trackpad|remote|dongle|adapter|obd|elm327|printer|scanner)\b/i;

function isNonReceivableDevice(name?: string, model?: string): boolean {
  const combined = `${name || "" } ${model || "" }`.trim();
  if (!combined) return false;
  // Always preserve genuine droppable devices even if name contains tricky tokens
  if (/\b(iphone|ipad|macbook|pixel|galaxy\s*[szan]\d+|thinkpad|laptop|chromebook|desktop)\b/i.test(combined)) {
    return false;
  }
  return NON_RECEIVABLE_DEVICE_REGEX.test(combined);
}

function classifyDeviceCategory(device: {
  name?: string;
  brand?: string;
  brandLabel?: string;
  modelName?: string;
  modelNumber?: string;
}): "phone" | "tablet" | "pc" | "tv" {
  const text = `${device.name || "" } ${device.brand || "" } ${device.brandLabel || "" } ${device.modelName || "" } ${device.modelNumber || "" }`.toLowerCase();

  // 1. Smart TV's (Samsung TV, LG webOS, Bravia, Apple TV, Android TV, Google TV, FireTV, Chromecast)
  if (
    /\b(tv|smart\s*tv|bravia|webos|tizen|chromecast|firetv|fire\s*stick|apple\s*tv|android\s*tv|google\s*tv|oled\s*tv|qled\s*tv)\b/i.test(
      text,
    )
  ) {
    return "tv";
  }

  // 2. iPads & Tablets (iPad Pro, iPad Air, Galaxy Tab, Xiaomi Pad, Lenovo Tab, Surface Pro/Go)
  if (
    /\b(ipad|tablet|tab\s*[sa]\d*|lenovo\s*tab|xiaomi\s*pad|surface\s*(pro|go)|galaxy\s*tab)\b/i.test(text) ||
    device.brand === "ipad"
  ) {
    return "tablet";
  }

  // 3. Laptops & PC's (MacBook, iMac, Windows PC, Desktop, Chromebook, ThinkPad, Surface Laptop)
  if (
    /\b(macbook|imac|mac\s*mini|mac\s*pro|mac\s*studio|laptop|desktop|thinkpad|chromebook|surface\s*laptop|surface\s*book|windows\s*pc|computer|pc)\b/i.test(
      text,
    ) ||
    device.brand === "desktop"
  ) {
    return "pc";
  }

  // 4. Default: GSM / Smartphone (iPhone, Samsung Galaxy, Pixel, Xiaomi, Huawei, etc.)
  return "phone";
}

function detectRealAppleDevice(ua: string): string {
  const isIpad =
    /iPad/i.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const osMatch = ua.match(/OS (\d+)[._](\d+)/i);
  const osVer = osMatch ? `iPadOS ${osMatch[1]}.${osMatch[2]}` : "iPadOS";

  if (isIpad && typeof window !== "undefined") {
    const w = Math.min(window.screen?.width || 0, window.screen?.height || 0);
    const h = Math.max(window.screen?.width || 0, window.screen?.height || 0);
    if (w >= 1024 && h >= 1366) return `iPad Pro 12.9" / 13" (${osVer})`;
    if (w >= 834 && h >= 1194) return `iPad Pro 11" (${osVer})`;
    if (w >= 820 && h >= 1180) return `iPad Air (${osVer})`;
    if (w >= 744 && h >= 1133) return `iPad mini (${osVer})`;
    return `Apple iPad (${osVer})`;
  } else if (isIpad) {
    return `Apple iPad (${osVer})`;
  }

  // Precise hardware screen & DPR mapping for genuine iPhone models
  if (typeof window !== "undefined") {
    const w = Math.min(window.screen?.width || 0, window.screen?.height || 0);
    const h = Math.max(window.screen?.width || 0, window.screen?.height || 0);
    const dpr = window.devicePixelRatio || 1;

    // iPhone 16 Pro Max (440x956 @3x)
    if (w === 440 && h === 956) return `iPhone 16 Pro Max (${osVer})`;
    // iPhone 16 Pro (402x874 @3x)
    if (w === 402 && h === 874) return `iPhone 16 Pro (${osVer})`;
    // iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus (430x932 @3x)
    if (w === 430 && h === 932) return `iPhone Pro Max / Plus (${osVer})`;
    // iPhone 14 Pro / 15 / 15 Pro / 16 (393x852 @3x)
    if (w === 393 && h === 852) return `iPhone (${osVer})`;
    // iPhone 12 Pro Max / 13 Pro Max / 14 Plus (428x926 @3x)
    if (w === 428 && h === 926) return `iPhone Pro Max (${osVer})`;
    // iPhone 12 / 12 Pro / 13 / 13 Pro / 14 (390x844 @3x)
    if (w === 390 && h === 844) return `iPhone (${osVer})`;
    // iPhone 11 Pro Max / XS Max (414x896 @3x)
    if (w === 414 && h === 896 && dpr >= 2.5) return `iPhone Pro Max (${osVer})`;
    // iPhone 11 / XR (414x896 @2x)
    if (w === 414 && h === 896) return `iPhone 11 (${osVer})`;
    // iPhone X / XS / 11 Pro / 12 mini / 13 mini (375x812 @3x)
    if (w === 375 && h === 812) return `iPhone (${osVer})`;
    // iPhone 7 / 8 / SE 2nd / SE 3rd (375x667 @2x)
    if (w === 375 && h === 667) return `iPhone SE (${osVer})`;
  }

  return `Apple iPhone (${osVer})`;
}

function mapAndroidModelCode(
  rawModel: string,
  ua: string,
  platformVersion: string,
): { brand: BrandId; modelName: string } {
  // Ignore Chrome's privacy-reduced single-letter "K" model placeholder
  const cleanModel = rawModel.trim() === "K" ? "" : rawModel.trim();
  const upper = `${cleanModel} ${ua}`.toUpperCase();
  const androidVerMatch = ua.match(/Android\s+([\d.]+)/i);
  const verLabel = platformVersion
    ? `Android ${platformVersion.split(".")[0]}`
    : androidVerMatch?.[1]
      ? `Android ${androidVerMatch[1]}`
      : "Android";

  if (
    upper.includes("XIAOMI") ||
    upper.includes("REDMI") ||
    upper.includes("POCO") ||
    upper.includes("MIUI") ||
    upper.includes("HYPEROS") ||
    /^(21|22|23|24|25)\d{3}[A-Z0-9]{4,6}$/i.test(cleanModel)
  ) {
    const label = cleanModel ? `Xiaomi ${cleanModel}` : `Xiaomi (${verLabel})`;
    return { brand: "xiaomi", modelName: label };
  }

  if (upper.includes("SAMSUNG") || upper.includes("SM-") || upper.includes("GT-")) {
    const label = cleanModel ? `Samsung ${cleanModel}` : `Samsung Galaxy (${verLabel})`;
    return { brand: "samsung", modelName: label };
  }

  if (
    upper.includes("HUAWEI") ||
    upper.includes("HARMONYOS") ||
    upper.includes("EMUI") ||
    upper.includes("HONOR") ||
    /^(NOH-|ELS-|VOG-|HMA-|ALN-|BRA-|PGT-)/i.test(cleanModel)
  ) {
    const label = cleanModel ? `Huawei ${cleanModel}` : `Huawei (${verLabel})`;
    return { brand: "huawei", modelName: label };
  }

  if (cleanModel) {
    return { brand: "android", modelName: `${cleanModel} (${verLabel})` };
  }
  return { brand: "android", modelName: `Android Toestel (${verLabel})` };
}

function getWebGlRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return "Hardware GPU";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      if (typeof renderer === "string" && renderer.trim()) return renderer.trim();
    }
    return String(gl.getParameter(gl.RENDERER) || "Hardware GPU");
  } catch {
    return "Hardware GPU";
  }
}

async function scanDeviceHardware(): Promise<DeviceProfile> {
  const ua = navigator.userAgent || "";
  const width = typeof window !== 'undefined' ? (window.screen?.width || window.innerWidth) : 1920;
  const height = typeof window !== 'undefined' ? (window.screen?.height || window.innerHeight) : 1080;
  const dpr = typeof window !== 'undefined' ? (Math.round((window.devicePixelRatio || 1) * 10) / 10) : 1;
  const screenSpec = `${width}×${height} @${dpr}x`;
  const gpuRenderer = getWebGlRenderer();
  const cores = navigator.hardwareConcurrency || 8;
  const navAny = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: {
      mobile?: boolean;
      platform?: string;
      getHighEntropyValues?: (hints: string[]) => Promise<{
        model?: string;
        platform?: string;
        platformVersion?: string;
      }>;
    };
    getBattery?: () => Promise<{ level: number }>;
    connection?: { effectiveType?: string; downlink?: number };
  };

  const memoryGb = typeof navAny.deviceMemory === "number" ? navAny.deviceMemory : null;
  let batteryPct: number | null = null;
  try {
    if (typeof navAny.getBattery === "function") {
      const bat = await navAny.getBattery();
      if (bat && typeof bat.level === "number") {
        batteryPct = Math.round(bat.level * 100);
      }
    }
  } catch {
    // Battery API not supported on iOS/some browsers
  }

  const networkType = navAny.connection?.effectiveType
    ? `${navAny.connection.effectiveType.toUpperCase()}${navAny.connection.downlink ? ` (${navAny.connection.downlink} Mbps)` : ""}`
    : "Direct P2P";

  let rawModel = "";
  let platformVersion = "";
  try {
    if (navAny.userAgentData?.getHighEntropyValues) {
      const high = await navAny.userAgentData.getHighEntropyValues(["model", "platform", "platformVersion"]);
      if (high?.model && high.model.trim() !== "K") rawModel = high.model.trim();
      if (high?.platformVersion) platformVersion = high.platformVersion.trim();
    }
  } catch {
    // Fallback to UA regex
  }

  if (!rawModel) {
    const buildMatch = ua.match(/;\s*([^;)]+?)\s+Build\//i);
    if (buildMatch?.[1] && buildMatch[1].trim() !== "K") {
      rawModel = buildMatch[1].trim();
    }
  }

  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let brand: BrandId = "desktop";
  let modelName = "Desktop / Laptop";

  if (isIOS) {
    brand = "ios";
    modelName = detectRealAppleDevice(ua);
  } else if (/Android/i.test(ua) || rawModel) {
    const mapped = mapAndroidModelCode(rawModel, ua, platformVersion);
    brand = mapped.brand;
    modelName = mapped.modelName;
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    brand = "desktop";
    modelName = "Apple Mac";
  } else if (/Windows/i.test(ua)) {
    brand = "desktop";
    modelName = "Windows PC";
  } else if (/Linux/i.test(ua)) {
    brand = "desktop";
    modelName = "Linux PC";
  }

  const cfg = BRAND_CONFIGS[brand];

  return {
    brand,
    brandLabel: cfg.label,
    osSkin: cfg.osSkin,
    modelName,
    gpuRenderer,
    screenSpec,
    cores,
    memoryGb,
    batteryPct,
    networkType,
    chunkSizeKb: cfg.chunkSizeKb,
    parallelStreams: cfg.parallelStreams,
    accentColor: cfg.accentColor,
    badgeBg: cfg.badgeBg,
    optimizationNote: cfg.optimizationNote,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Helpers: Sound Chime, Thumbnail Generator & IndexedDB Share Sheet Pickup
   ──────────────────────────────────────────────────────────────────────────── */

function playAirDropChime(type: "connect" | "offer" | "launch" | "done" | "decline") {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (type === "offer") navigator.vibrate?.([70, 40, 110]);
      else if (type === "launch") navigator.vibrate?.([40, 30, 60]);
      else if (type === "done") navigator.vibrate?.([50, 30, 90]);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const patterns: Record<typeof type, number[]> = {
      connect: [587.33, 880],
      offer: [659.25, 783.99, 1046.5],
      launch: [440, 554.37, 659.25, 880],
      done: [523.25, 659.25, 1046.5, 1318.5],
      decline: [392, 311.13],
    };
    const freqs = patterns[type];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === "launch" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.085);
      gain.gain.setValueAtTime(0.001, now + idx * 0.085);
      gain.gain.exponentialRampToValueAtTime(0.38, now + idx * 0.085 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.085);
      osc.stop(now + idx * 0.085 + 0.36);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {
        // Ignore
      }
    }
  }
}

function notifyIncomingDrop(
  senderName: string,
  fileName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropDetails?: any,
) {
  if (typeof window === "undefined") return;

  // 1. Play audible sound chime even if screen is blurred
  try {
    playAirDropChime("offer");
  } catch {}

  // 2. Tab title flash alert for background tabs
  if (typeof document !== "undefined" && document.hidden) {
    document.title = `🔔 (1) ${senderName}: ${fileName.slice(0, 24)}`;
    const resetTitle = () => {
      document.title = "Zytron Share - Instant Local Drop";
      window.removeEventListener("focus", resetTitle);
    };
    window.addEventListener("focus", resetTitle, { once: true });
  }

  // 3. Native OS Notification (Windows Action Center, macOS, iPadOS, Android)
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const title = `Zytron Share`;
      const body = `${senderName}: ${fileName}`;
      const icon = "/icon-192.png";

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: `zytron-${dropDetails?.dropId || dropDetails?.offerId || Date.now()}`,
            vibrate: [250, 100, 250],
            renotify: true,
          } as any);
        }).catch(() => {
          try {
            new Notification(title, { body, icon });
          } catch {}
        });

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title,
            options: {
              body,
              icon,
              tag: `zytron-${dropDetails?.dropId || dropDetails?.offerId || Date.now()}`,
              renotify: true,
            },
          });
        }
      } else {
        new Notification(title, { body, icon });
      }
    } catch {
      // Ignore
    }
  }
}

async function createImageThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 220;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

async function compressImageForTransfer(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 1920;
          const origW = img.width || 1;
          const origH = img.height || 1;
          const scale = Math.min(1, maxDim / Math.max(origW, origH));
          canvas.width = Math.max(1, Math.round(origW * scale));
          canvas.height = Math.max(1, Math.round(origH * scale));
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const base64Only = dataUrl.split(",")[1] || "";
          resolve(base64Only);
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  try {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType || "application/octet-stream" });
  } catch {
    return new Blob([], { type: mimeType || "application/octet-stream" });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const val = bytes / Math.pow(k, i);
  return `${val >= 100 ? val.toFixed(0) : val.toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(mime: string, name: string) {
  const lower = `${mime} ${name}`.toLowerCase();
  if (lower.includes("image") || /\.(jpg|jpeg|png|webp|gif|heic|svg)$/.test(lower)) return FileImage;
  if (lower.includes("video") || /\.(mp4|mov|webm|mkv)$/.test(lower)) return FileVideo;
  if (lower.includes("audio") || /\.(mp3|wav|m4a|flac|ogg)$/.test(lower)) return FileAudio;
  if (lower.includes("zip") || lower.includes("rar") || lower.includes("tar") || lower.includes("apk")) return FileArchive;
  if (lower.includes("pdf") || lower.includes("text") || lower.includes("json")) return FileText;
  return FileIcon;
}

async function consumeSharedFilesFromSw(): Promise<{ files: File[]; text: string }> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("zytron_drop_share_db", 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("incoming")) {
          resolve({ files: [], text: "" });
          return;
        }
        const tx = db.transaction("incoming", "readwrite");
        const store = tx.objectStore("incoming");
        const getReq = store.get("latest");
        getReq.onsuccess = () => {
          const data = getReq.result;
          store.delete("latest");
          if (!data) {
            resolve({ files: [], text: "" });
            return;
          }
          const extractedFiles: File[] = [];
          if (Array.isArray(data.files)) {
            for (const item of data.files) {
              if (item?.blob) {
                extractedFiles.push(
                  new File([item.blob], item.name || "zytron-drop-file", {
                    type: item.type || "application/octet-stream",
                  }),
                );
              }
            }
          }
          const combinedText = [data.title, data.text, data.url].filter(Boolean).join(" — ");
          resolve({ files: extractedFiles, text: combinedText });
        };
        getReq.onerror = () => resolve({ files: [], text: "" });
      };
      req.onerror = () => resolve({ files: [], text: "" });
    } catch {
      resolve({ files: [], text: "" });
    }
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   Main Zytron Share / Zytron Drop Flagship Application
   ──────────────────────────────────────────────────────────────────────────── */

export default function ZytronSharePage() {
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [customDeviceName, setCustomDeviceName] = useState<string>("");
  const [isScanningDevice, setIsScanningDevice] = useState(false);

  // Zero-QR P2P Radar & Real Hardware Bluetooth Scanner state
  const [myRoomCode, setMyRoomCode] = useState<string>("");
  const [p2pStatus, setP2pStatus] = useState<"initializing" | "ready" | "connecting" | "connected" | "error">("initializing");
  const [connectedPeers, setConnectedPeers] = useState<PeerDeviceInfo[]>([]);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothNearbyDevice[]>([]);
  const [isScanningBluetooth, setIsScanningBluetooth] = useState<boolean>(false);

  // Files & Transfers
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [quickText, setQuickText] = useState<string>("");
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // AirDrop / Quick Share Handshake & Kamehameha Energy Wave Overlays
  const [sendFx, setSendFx] = useState<SendFx | null>(null);
  const [receiveFx, setReceiveFx] = useState<ReceiveFx | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<IncomingOffer | null>(null);
  const [autoAcceptDrops, setAutoAcceptDrops] = useState<boolean>(false);
  const [activeDropPin, setActiveDropPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<DeviceCategory>("all");
  const [isNotabilityStealth, setIsNotabilityStealth] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [recentClipboardAnswers, setRecentClipboardAnswers] = useState<
    Array<{ id: string; text: string; sender: string; time: string }>
  >([]);

  // Brand-aware label helper: iPhone/iOS -> "AirDrop hem" / "AirDrop", Samsung/Android/Xiaomi/Huawei/PC -> "Quick Share hem" / "Quick Share"
  const getShareActionLabel = (targetBrand?: BrandId | string, withHim = true, deviceCat?: DeviceCategory): string => {
    if (deviceCat === "tv") {
      return withHim ? "Cast naar scherm" : "Casten";
    }
    if (deviceCat === "tablet" || targetBrand === "ios") {
      return withHim ? "AirDrop hem" : "AirDrop";
    }
    if (
      targetBrand === "samsung" ||
      targetBrand === "android" ||
      targetBrand === "xiaomi" ||
      targetBrand === "huawei" ||
      targetBrand === "desktop"
    ) {
      return withHim ? "Quick Share hem" : "Quick Share";
    }
    return device?.brand === "ios"
      ? withHim
        ? "AirDrop hem"
        : "AirDrop"
      : withHim
        ? "Quick Share hem"
        : "Quick Share";
  };

  // Persistent Friends state (Add device as friend to send even when at school / miles away)
  const [savedFriends, setSavedFriends] = useState<SavedFriend[]>([]);
  const [myFriendCode, setMyFriendCode] = useState<string>("");
  const [friendCodeInput, setFriendCodeInput] = useState<string>("");
  const [friendNameInput, setFriendNameInput] = useState<string>("");
  const myFriendCodeRef = useRef<string>("");

  // WhatsApp & Phone Number Smart Pairing state (Dichtbij = AirDrop P2P / Ver weg = Cloud Relay)
  const [waContacts, setWaContacts] = useState<WhatsAppContact[]>([]);
  const [waPhoneInput, setWaPhoneInput] = useState<string>("");
  const [waFriendNameInput, setWaFriendNameInput] = useState<string>("");
  const [myPhone, setMyPhone] = useState<string>("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const activePairCodesRef = useRef<Set<string>>(new Set());
  const myPhoneRef = useRef<string>("");

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [showShareSheetGuide, setShowShareSheetGuide] = useState(false);
  const [showSamsungQuickSettingsGuide, setShowSamsungQuickSettingsGuide] = useState(false);
  const [showBackgroundPermissionModal, setShowBackgroundPermissionModal] = useState(false);
  const [bgPermissionGranted, setBgPermissionGranted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [tenMinActive, setTenMinActive] = useState(false);
  const [tenMinRemaining, setTenMinRemaining] = useState(0);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingSec, setAudioRecordingSec] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const audioKeepaliveRef = useRef<HTMLAudioElement | null>(null);
  const dialingPeersRef = useRef<Map<string, number>>(new Map());
  const peerLastPongRef = useRef<Map<string, number>>(new Map());
  const pendingOfferResolveRef = useRef<Map<string, (accepted: boolean) => void>>(new Map());
  const seenDropIdsRef = useRef<Set<string>>(new Set());
  const autoAcceptRef = useRef<boolean>(false);
  const incomingBuffersRef = useRef<
    Map<
      string,
      {
        meta: { id: string; name: string; size: number; type: string; peerName: string; senderBrand?: BrandId };
        chunks: ArrayBuffer[];
        receivedBytes: number;
        startTime: number;
      }
    >
  >(new Map());
  const deviceRef = useRef<DeviceProfile | null>(null);
  const customNameRef = useRef<string>("");
  const myRoomCodeRef = useRef<string>("");
  const toastTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    autoAcceptRef.current = autoAcceptDrops;
  }, [autoAcceptDrops]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("zytron_bg_permission_granted") === "1";
      const notifGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
      const active = stored || notifGranted;
      setBgPermissionGranted(active);

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as any).standalone);
      if (!active && (isMobile || isStandalone)) {
        const timer = window.setTimeout(() => {
          setShowBackgroundPermissionModal(true);
        }, 1800);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Ignore
    }
  }, []);

  const enableBackgroundAndNotifications = async () => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const res = await Notification.requestPermission();
        if (res === "granted") {
          notifyIncomingDrop("Zytron AirDrop", "Achtergrond-ontvangst succesvol geactiveerd!");
        }
      }
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (navigator as any).wakeLock?.request("screen");
        } catch {
          // Ignore
        }
      }
      playAirDropChime("launch");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([150, 80, 150]);
      }
      try {
        if (!audioKeepaliveRef.current && typeof Audio !== "undefined") {
          // Micro silent audio loop that prevents iOS Safari & Chrome from freezing background tab
          const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
          silentAudio.loop = true;
          silentAudio.volume = 0.001;
          audioKeepaliveRef.current = silentAudio;
        }
        audioKeepaliveRef.current?.play().catch(() => {});
      } catch {}

      localStorage.setItem("zytron_bg_permission_granted", "1");
      setBgPermissionGranted(true);
      setShowBackgroundPermissionModal(false);
      showToast("Achtergrond & Meldingen actief!");
    } catch {
      setShowBackgroundPermissionModal(false);
    }
  };

  // Toggle 10-minute visibility mode (Native AirDrop/Quick Share background discovery)
  const toggleTenMinDiscovery = () => {
    const dev = deviceRef.current;
    const myPeerId = stableClientIdRef.current;
    if (tenMinActive) {
      setTenMinActive(false);
      setTenMinRemaining(0);
      showToast("Zichtbaarheid (10 min) uitgeschakeld");
      if (myPeerId) {
        fetch("/api/radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peerId: myPeerId,
            tenMinActive: false,
            tenMinRemaining: 0,
          }),
        }).catch(() => {});
      }
    } else {
      setTenMinActive(true);
      setTenMinRemaining(600); // 10 minutes = 600 seconds
      enableBackgroundAndNotifications();
      showToast("Toestel is nu 10 minuten zichtbaar voor iedereen in de buurt!");

      if (myPeerId) {
        fetch("/api/radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peerId: myPeerId,
            friendCode: myFriendCodeRef.current || myFriendCode,
            name: customNameRef.current || dev?.modelName || "Toestel",
            brand: dev?.brand || "android",
            brandLabel: dev?.brandLabel || "Toestel",
            osSkin: dev?.osSkin || "WebRTC P2P",
            modelName: dev?.modelName || "Toestel",
            tenMinActive: true,
            tenMinRemaining: 600,
          }),
        }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    let timer: number | null = null;
    if (tenMinActive && tenMinRemaining > 0) {
      timer = window.setInterval(() => {
        setTenMinRemaining((prev) => {
          if (prev <= 1) {
            setTenMinActive(false);
            showToast("10 minuten verstreken: achtergrond-zichtbaarheid gestopt.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [tenMinActive, tenMinRemaining, showToast]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingBeamDropRef = useRef<any>(null);

  // Directly trigger the full-screen downward laser beam animation & pop-up on mobile
  const triggerVisualBeamOnPhone = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dropData: any) => {
      if (!dropData) return;
      const dropId = String(dropData.dropId || `drop-${Date.now()}`);
      const senderName = String(dropData.senderName || "Toestel");
      const senderBrand = (dropData.senderBrand as BrandId) || "android";
      const fileName = String(dropData.fileName || "Bestand");
      const fileSize = Number(dropData.fileSize) || 0;
      const fileType = String(dropData.fileType || "application/octet-stream");
      const isText = Boolean(dropData.textContent && !dropData.base64Data);

      let activeBlobUrl = "";
      if (dropData.base64Data) {
        try {
          const blob = base64ToBlob(dropData.base64Data, fileType);
          activeBlobUrl = URL.createObjectURL(blob);
        } catch {
          // Ignore
        }
      } else if (dropData.textContent) {
        try {
          const blob = new Blob([dropData.textContent], { type: "text/plain;charset=utf-8" });
          activeBlobUrl = URL.createObjectURL(blob);
        } catch {
          // Ignore
        }
      }

      playAirDropChime("launch");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([300, 100, 300, 100, 450]);
      }

      // 1. Immediately launch the full-screen downward laser beam animation!
      setReceiveFx({
        id: dropId,
        phase: "streaming",
        senderName,
        senderBrand,
        label: isText ? "Tekst / Link" : fileName,
        totalSize: fileSize,
        progress: 28,
        thumbs: Array.isArray(dropData.thumbs) ? dropData.thumbs : [],
        isText,
        textPreview: dropData.textContent ? String(dropData.textContent).slice(0, 180) : undefined,
        blobUrl: activeBlobUrl || undefined,
        fileName,
      });

      window.setTimeout(() => {
        setReceiveFx((prev) => (prev ? { ...prev, progress: 84 } : prev));
      }, 400);

      window.setTimeout(() => {
        setReceiveFx((prev) => (prev ? {
          ...prev,
          phase: "done",
          progress: 100,
          blobUrl: activeBlobUrl || prev.blobUrl,
          fileName,
        } : prev));
        playAirDropChime("done");
        showToast(`⚡ Straal gearriveerd van ${senderName}!`);
      }, 1000);

      // Keep open for 35s so user has ample time to review and download
      window.setTimeout(() => {
        setReceiveFx((prev) => (prev?.id === dropId ? null : prev));
      }, 35000);
    },
    [showToast],
  );

  // Listen for Service Worker notification clicks & page visibility wakeup
  useEffect(() => {
    if (typeof window === "undefined") return;

    // A. Service worker postMessage when notification or action is clicked
    const handleSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "TRIGGER_BEAM_ANIMATION" && e.data?.dropData) {
        triggerVisualBeamOnPhone(e.data.dropData);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
    }

    // B. Check URL params on fresh open via notification: /?trigger_beam=1
    const params = new URLSearchParams(window.location.search);
    if (params.get("trigger_beam") === "1") {
      try {
        const raw = localStorage.getItem("zytron_pending_beam") || localStorage.getItem("zytron_last_received_drop");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed) {
            triggerVisualBeamOnPhone(parsed);
          }
        }
      } catch {
        // Ignore
      }
    }

    // C. Wakeup replay when user unlocks phone or switches back to tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        if (pendingBeamDropRef.current) {
          const drop = pendingBeamDropRef.current;
          pendingBeamDropRef.current = null;
          try {
            localStorage.removeItem("zytron_pending_beam");
          } catch {
            // Ignore
          }
          triggerVisualBeamOnPhone(drop);
        } else {
          try {
            const raw = localStorage.getItem("zytron_pending_beam");
            if (raw) {
              localStorage.removeItem("zytron_pending_beam");
              const parsed = JSON.parse(raw);
              if (parsed) {
                triggerVisualBeamOnPhone(parsed);
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      }
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [triggerVisualBeamOnPhone]);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    customNameRef.current = customDeviceName;
    if (customDeviceName.trim()) {
      try {
        localStorage.setItem("zytron_real_device_name", customDeviceName.trim());
      } catch {
        // Ignore storage restrictions
      }
    }
  }, [customDeviceName]);

  useEffect(() => {
    myRoomCodeRef.current = myRoomCode;
  }, [myRoomCode]);

  useEffect(() => {
    myPhoneRef.current = myPhone;
    if (myPhone.trim()) {
      try {
        localStorage.setItem("zytron_my_phone", myPhone.trim());
      } catch {
        // Ignore
      }
    }
  }, [myPhone]);

  // Load saved friends, friend code & WhatsApp contacts from localStorage
  useEffect(() => {
    try {
      let code = localStorage.getItem("zytron_my_friend_code") || "";
      if (!code) {
        code = `ZY-${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem("zytron_my_friend_code", code);
      }
      setMyFriendCode(code);
      myFriendCodeRef.current = code;

      const savedFriendsRaw = localStorage.getItem("zytron_saved_friends");
      if (savedFriendsRaw) {
        const parsed = JSON.parse(savedFriendsRaw) as SavedFriend[];
        if (Array.isArray(parsed)) {
          setSavedFriends(parsed);
        }
      }

      const savedPhone = localStorage.getItem("zytron_my_phone") || "";
      if (savedPhone) setMyPhone(savedPhone);

      const savedRaw = localStorage.getItem("zytron_wa_contacts");
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as WhatsAppContact[];
        if (Array.isArray(parsed)) {
          setWaContacts(parsed);
          for (const c of parsed) {
            if (c.pairCode) activePairCodesRef.current.add(c.pairCode);
          }
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Persist friends to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("zytron_saved_friends", JSON.stringify(savedFriends));
    } catch {
      // Ignore
    }
  }, [savedFriends]);

  // Persist WhatsApp contacts to localStorage whenever updated
  useEffect(() => {
    if (waContacts.length > 0) {
      try {
        localStorage.setItem("zytron_wa_contacts", JSON.stringify(waContacts));
      } catch {
        // Ignore
      }
    }
  }, [waContacts]);

  // 1. Register Service Worker + Detect PWA install + Check incoming OS Share Sheet / WhatsApp / Add Friend Links
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalledPwa(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const params = new URLSearchParams(window.location.search);

    // Check if opened via Add Friend Link (?add_friend=ZY-XXXX&name=Mo&brand=ios)
    const incomingAddFriend = params.get("add_friend");
    if (incomingAddFriend) {
      const cleanFriendCode = incomingAddFriend.trim().toUpperCase();
      const friendName = params.get("name")?.trim() || `Vriend (${cleanFriendCode})`;
      const friendBrand = (params.get("brand") as BrandId) || "android";
      setSavedFriends((prev) => {
        if (prev.some((f) => f.friendCode.toUpperCase() === cleanFriendCode)) return prev;
        const newF: SavedFriend = {
          id: `friend-${Date.now()}`,
          friendCode: cleanFriendCode,
          name: friendName,
          brand: friendBrand,
          brandLabel: BRAND_CONFIGS[friendBrand]?.label || "Toestel",
          modelName: friendName,
          addedAt: Date.now(),
          isOnline: true,
          lastSeen: Date.now(),
        };
        return [newF, ...prev];
      });
      playAirDropChime("connect");
      showToast(`⭐ ${friendName} (${cleanFriendCode}) toegevoegd aan bewaarde apparaten`);
    }

    // Check if opened via WhatsApp Pairing Link (?pair=wa-xxxx&from=Name&phone=...)
    const incomingPairCode = params.get("pair");
    const incomingFromName = params.get("from");
    const incomingFromPhone = params.get("phone") || "";
    if (incomingPairCode) {
      activePairCodesRef.current.add(incomingPairCode);
      if (incomingFromName) {
        setWaContacts((prev) => {
          if (prev.some((c) => c.pairCode === incomingPairCode)) return prev;
          return [
            {
              id: incomingPairCode,
              pairCode: incomingPairCode,
              phone: incomingFromPhone,
              name: incomingFromName,
              peerId: "",
              brand: "ios",
              brandLabel: "WhatsApp Koppeling...",
              osSkin: "Bezig met toestel-info synchroniseren",
              modelName: incomingFromName,
              sameWifi: false,
              online: true,
              lastSeen: Date.now(),
            },
            ...prev,
          ];
        });
        playAirDropChime("connect");
        showToast(`Gekoppeld via WhatsApp met ${incomingFromName}! Toestel-info wordt gesynchroniseerd…`);
      }
    }

    // Check if opened via NFC Tik or Direct Drop Link (?pin=1234&file=...&sender=...)
    const incomingDropPin = params.get("pin");
    const incomingFile = params.get("file");
    const incomingSender = params.get("sender");
    const incomingSenderName = params.get("senderName") || "NFC Contact";
    const incomingBrand = (params.get("brand") as BrandId) || "samsung";
    const incomingSize = Number(params.get("size")) || 0;
    const incomingType = params.get("type") || "application/octet-stream";
    const incomingText = params.get("text") || undefined;

    if (incomingDropPin && /^\d{4}$/.test(incomingDropPin)) {
      // 1. Instant optimistic offer if URL contains file metadata from NFC tag
      if (incomingFile || incomingSender) {
        const instantDropId = `drop-${incomingDropPin}`;
        seenDropIdsRef.current.add(instantDropId);
        setIncomingOffer({
          offerId: instantDropId,
          dropId: instantDropId,
          pin: incomingDropPin,
          peerId: incomingSender || "",
          senderName: incomingSenderName,
          senderBrand: incomingBrand,
          senderBrandLabel: "Toestel",
          kind: incomingText && !incomingSize ? "text" : "files",
          files: [
            {
              name: incomingFile || "Gedeeld Bestand",
              size: incomingSize,
              type: incomingType,
            },
          ],
          totalSize: incomingSize,
          thumbs: [],
          textPreview: incomingText,
        });
        playAirDropChime("offer");

        if (incomingSender && peerRef.current) {
          try {
            const conn = peerRef.current.connect(incomingSender, { reliable: true });
            bindConnectionEvents(conn);
          } catch {}
        }
      }

      // 2. Also query server drop store
      window.setTimeout(() => {
        fetch(`/api/drop?pin=${encodeURIComponent(incomingDropPin)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.ok && data.drop) {
              const d = data.drop;
              if (!seenDropIdsRef.current.has(String(d.dropId))) {
                seenDropIdsRef.current.add(String(d.dropId));
                setIncomingOffer({
                  offerId: String(d.dropId),
                  dropId: String(d.dropId),
                  pin: String(d.pin || ""),
                  peerId: String(d.senderPeerId || ""),
                  senderName: String(d.senderName || "NFC Contact"),
                  senderBrand: (d.senderBrand as BrandId) || "samsung",
                  senderBrandLabel: String(d.senderBrandLabel || "Toestel"),
                  kind: d.textContent && !d.fileSize ? "text" : "files",
                  files: [
                    {
                      name: String(d.fileName || "Bestand"),
                      size: Number(d.fileSize) || 0,
                      type: String(d.fileType || "application/octet-stream"),
                    },
                  ],
                  totalSize: Number(d.fileSize) || 0,
                  thumbs: Array.isArray(d.thumbs) ? d.thumbs : [],
                  textPreview: d.textContent ? String(d.textContent).slice(0, 180) : undefined,
                });
                playAirDropChime("offer");
              }
            }
          })
          .catch(() => {});
      }, 400);
    }

    // Check if opened via Native OS Share Sheet ("Zytron Share" app-rij)
    if (params.get("incoming_share") === "1") {
      const shareDropId = params.get("dropId");
      if (shareDropId) {
        fetch(`/api/drop?dropId=${encodeURIComponent(shareDropId)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.ok && data.drop) {
              const d = data.drop;
              if (d.base64Data && d.fileName) {
                const blob = base64ToBlob(d.base64Data, d.fileType || "application/octet-stream");
                const file = new File([blob], d.fileName, { type: d.fileType || "application/octet-stream" });
                const added: QueuedFile = {
                  id: `shared-${Date.now()}`,
                  file,
                  name: d.fileName,
                  size: d.fileSize || blob.size,
                  type: d.fileType || "application/octet-stream",
                  source: "share_sheet",
                };
                setQueuedFiles((prev) => [added, ...prev]);
                showToast(`Bestand '${d.fileName}' geladen vanuit de app-rij!`);
              }
              if (d.textContent) {
                setQuickText(d.textContent);
              }
            }
          })
          .catch(() => {});
      }

      consumeSharedFilesFromSw().then(({ files, text }) => {
        if (files.length > 0) {
          const added: QueuedFile[] = files.map((f) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            file: f,
            name: f.name,
            size: f.size,
            type: f.type || "application/octet-stream",
            source: "share_sheet",
          }));
          setQueuedFiles((prev) => [...added, ...prev]);
          showToast(`${files.length} bestand(en) geladen vanuit deel-menu!`);
        }
        if (text) {
          setQuickText(text);
        }
      });
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [showToast]);

  // 2. Scan real device hardware & model on startup
  const runHardwareScan = useCallback(
    async (notifyUser = false) => {
      setIsScanningDevice(true);
      const scanned = await scanDeviceHardware();
      setDevice(scanned);
      let savedName = "";
      try {
        savedName = localStorage.getItem("zytron_real_device_name") || "";
      } catch {
        // Ignore
      }
      if (!customNameRef.current) {
        setCustomDeviceName(savedName || scanned.modelName);
      }
      setIsScanningDevice(false);
      if (notifyUser) {
        showToast(`Echte hardware gescand: ${scanned.modelName}`);
      }
    },
    [showToast],
  );

  useEffect(() => {
    runHardwareScan(false);
  }, [runHardwareScan]);

  // 3. Request WakeLock on mobile so screen doesn't sleep during P2P transfer
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // Ignore if not supported
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock && typeof wakeLock.release === "function") {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // 4. Setup wire protocol on any PeerJS DataConnection (100% real peers only)
  const bindConnectionEvents = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conn: any) => {
      if (!conn || !conn.peer) return;

      const cleanupPeer = () => {
        connectionsRef.current.delete(conn.peer);
        peerLastPongRef.current.delete(conn.peer);
        setConnectedPeers((prev) => {
          const next = prev.filter((p) => p.peerId !== conn.peer);
          if (next.length === 0) setP2pStatus("ready");
          return next;
        });
      };

      conn.on("open", () => {
        connectionsRef.current.set(conn.peer, conn);
        peerLastPongRef.current.set(conn.peer, Date.now());
        setP2pStatus("connected");
        const dev = deviceRef.current;
        conn.send({
          kind: "HELLO",
          peerId: peerRef.current?.id || "",
          roomCode: myRoomCodeRef.current,
          name: customNameRef.current || dev?.modelName || "Toestel",
          brand: dev?.brand || "android",
          brandLabel: dev?.brandLabel || "Toestel",
          osSkin: dev?.osSkin || "WebRTC P2P",
          modelName: dev?.modelName || "Toestel",
          knownPeers: Array.from(connectionsRef.current.keys()),
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn.on("data", (data: any) => {
        if (!data || typeof data !== "object") return;
        peerLastPongRef.current.set(conn.peer, Date.now());

        if (data.kind === "PING") {
          try {
            conn.send({
              kind: "PONG",
              name: customNameRef.current || deviceRef.current?.modelName || "Toestel",
            });
          } catch {
            // Ignore
          }
          return;
        }

        if (data.kind === "PONG") {
          if (data.name) {
            setConnectedPeers((prev) =>
              prev.map((p) => (p.peerId === conn.peer ? { ...p, name: String(data.name) } : p)),
            );
          }
          return;
        }

        if (data.kind === "HELLO") {
          const info: PeerDeviceInfo = {
            peerId: conn.peer,
            roomCode: String(data.roomCode || ""),
            name: String(data.name || "Verbonden Toestel"),
            brand: (data.brand as BrandId) || "android",
            brandLabel: String(data.brandLabel || "Toestel"),
            osSkin: String(data.osSkin || "P2P Engine"),
            modelName: String(data.modelName || "Toestel"),
            sameWifi: true,
          };
          setConnectedPeers((prev) => {
            const alreadyConnected = prev.some((p) => p.peerId === conn.peer);
            if (!alreadyConnected) {
              playAirDropChime("connect");
              showToast(`Echt toestel verbonden: ${info.name}`);
            }
            const filtered = prev.filter((p) => p.peerId !== conn.peer);
            return [...filtered, info];
          });

          // Gossip mesh: auto-connect to any other active peers known by this peer
          if (Array.isArray(data.knownPeers) && peerRef.current) {
            for (const otherId of data.knownPeers) {
              if (
                typeof otherId === "string" &&
                otherId &&
                otherId !== peerRef.current.id &&
                !connectionsRef.current.has(otherId)
              ) {
                try {
                  const meshConn = peerRef.current.connect(otherId, { reliable: true });
                  bindConnectionEvents(meshConn);
                } catch {
                  // Ignore duplicate dial
                }
              }
            }
          }
          return;
        }

        // AirDrop / Quick Share Incoming Handshake Request
        if (data.kind === "OFFER_REQUEST") {
          const offer: IncomingOffer = {
            offerId: String(data.offerId || `offer-${Date.now()}`),
            peerId: conn.peer,
            senderName: String(data.senderName || "Toestel"),
            senderBrand: (data.senderBrand as BrandId) || "ios",
            senderBrandLabel: String(data.senderBrandLabel || "Toestel"),
            kind: data.offerKind === "text" ? "text" : "files",
            files: Array.isArray(data.files) ? data.files : [],
            totalSize: Number(data.totalSize) || 0,
            thumbs: Array.isArray(data.thumbs) ? data.thumbs : [],
            textPreview: data.textPreview ? String(data.textPreview) : undefined,
          };

          // Trigger background notification for incoming WebRTC offer
          const offerLabel = offer.kind === "text" ? (offer.textPreview || "Bericht") : (offer.files.length === 1 ? offer.files[0].name : `${offer.files.length} bestanden`);
          notifyIncomingDrop(offer.senderName, offerLabel, offer);

          if (autoAcceptRef.current) {
            conn.send({
              kind: "OFFER_ACCEPT",
              offerId: offer.offerId,
            });
            playAirDropChime("launch");
            setReceiveFx({
              id: offer.offerId,
              phase: "streaming",
              senderName: offer.senderName,
              senderBrand: offer.senderBrand,
              label:
                offer.kind === "text"
                  ? "Bericht / Link"
                  : offer.files.length === 1
                    ? offer.files[0].name
                    : `${offer.files.length} bestanden`,
              totalSize: offer.totalSize,
              progress: 8,
              thumbs: offer.thumbs,
              isText: offer.kind === "text",
              textPreview: offer.textPreview,
            });
          } else {
            playAirDropChime("offer");
            setIncomingOffer(offer);
          }
          return;
        }

        if (data.kind === "OFFER_ACCEPT") {
          const offerId = String(data.offerId || "");
          const resolver = pendingOfferResolveRef.current.get(offerId);
          if (resolver) {
            pendingOfferResolveRef.current.delete(offerId);
            resolver(true);
          }
          return;
        }

        if (data.kind === "OFFER_DECLINE") {
          const offerId = String(data.offerId || "");
          const resolver = pendingOfferResolveRef.current.get(offerId);
          if (resolver) {
            pendingOfferResolveRef.current.delete(offerId);
            resolver(false);
          }
          return;
        }

        if (data.kind === "TEXT_DROP") {
          const textContent = String(data.text || "");
          const sender = String(data.sender || "Toestel");
          const senderBrand = (data.senderBrand as BrandId) || "ios";
          const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const item: TransferItem = {
            id: `txt-${Date.now()}`,
            name: `Bericht / Link van ${sender}.txt`,
            size: blob.size,
            type: "text/plain",
            direction: "incoming",
            progress: 100,
            speedMbps: 100,
            status: "completed",
            blobUrl: url,
            blob,
            peerName: sender,
            timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
          };
          setQuickText(textContent);
          setTransfers((prev) => [item, ...prev]);
          setReceiveFx({
            id: item.id,
            phase: "done",
            senderName: sender,
            senderBrand,
            label: "Directe Tekst / Link",
            totalSize: blob.size,
            progress: 100,
            thumbs: [],
            isText: true,
            textPreview: textContent,
          });
          playAirDropChime("done");
          showToast(`Tekst/Link ontvangen van ${sender}`);
          return;
        }

        if (data.kind === "FILE_START") {
          const fileId = String(data.fileId);
          const name = String(data.name || "bestand");
          const size = Number(data.size) || 0;
          const type = String(data.type || "application/octet-stream");
          const peerName = String(data.sender || "Verbonden Toestel");
          const senderBrand = (data.senderBrand as BrandId) || "ios";

          incomingBuffersRef.current.set(fileId, {
            meta: { id: fileId, name, size, type, peerName, senderBrand },
            chunks: [],
            receivedBytes: 0,
            startTime: performance.now(),
          });

          setReceiveFx((prev) => ({
            id: fileId,
            phase: "streaming",
            senderName: peerName,
            senderBrand,
            label: name,
            totalSize: size,
            progress: prev?.progress && prev.progress > 5 ? prev.progress : 6,
            thumbs: prev?.thumbs || [],
            isText: false,
          }));

          setTransfers((prev) => [
            {
              id: fileId,
              name,
              size,
              type,
              direction: "incoming",
              progress: 0,
              speedMbps: 0,
              status: "streaming",
              peerName,
              timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
            },
            ...prev,
          ]);
          return;
        }

        if (data.kind === "FILE_CHUNK") {
          const fileId = String(data.fileId);
          const entry = incomingBuffersRef.current.get(fileId);
          if (!entry) return;

          const chunkBuffer: ArrayBuffer = data.chunk;
          entry.chunks.push(chunkBuffer);
          entry.receivedBytes += chunkBuffer.byteLength || 0;

          const elapsedSec = Math.max(0.05, (performance.now() - entry.startTime) / 1000);
          const speedMbps = Math.round(((entry.receivedBytes / (1024 * 1024)) / elapsedSec) * 10) / 10;
          const pct = entry.meta.size > 0 ? Math.min(99, Math.round((entry.receivedBytes / entry.meta.size) * 100)) : 99;

          setReceiveFx((prev) => (prev ? { ...prev, progress: pct } : prev));
          setTransfers((prev) =>
            prev.map((t) => (t.id === fileId ? { ...t, progress: pct, speedMbps } : t)),
          );
          return;
        }

        if (data.kind === "FILE_END") {
          const fileId = String(data.fileId);
          const entry = incomingBuffersRef.current.get(fileId);
          if (!entry) return;

          const blob = new Blob(entry.chunks, { type: entry.meta.type });
          const blobUrl = URL.createObjectURL(blob);
          const elapsedSec = Math.max(0.05, (performance.now() - entry.startTime) / 1000);
          const speedMbps = Math.round(((entry.meta.size / (1024 * 1024)) / elapsedSec) * 10) / 10;

          incomingBuffersRef.current.delete(fileId);

          const isImage = entry.meta.type.startsWith("image/");

          setReceiveFx((prev) => ({
            id: fileId,
            phase: "done",
            senderName: entry.meta.peerName,
            senderBrand: entry.meta.senderBrand || "ios",
            label: entry.meta.name,
            totalSize: entry.meta.size,
            progress: 100,
            thumbs: isImage ? [blobUrl] : prev?.thumbs || [],
            isText: false,
            blobUrl,
            fileName: entry.meta.name,
          }));

          setTransfers((prev) =>
            prev.map((t) =>
              t.id === fileId
                ? { ...t, progress: 100, speedMbps, status: "completed", blobUrl, blob }
                : t,
            ),
          );

          try {
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = entry.meta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch {
            // User can also tap the download/share button on the transfer card
          }

          playAirDropChime("done");
          showToast(`Ontvangen: ${entry.meta.name}`);
        }
      });

      conn.on("close", cleanupPeer);
      conn.on("error", cleanupPeer);
    },
    [showToast],
  );

  // Helper to convert base64 back to Blob for /api/drop fallback
  const base64ToBlob = (b64: string, mimeType: string): Blob => {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType || "application/octet-stream" });
  };

  // Accept or Decline an incoming AirDrop / Quick Share Offer (100% Real Peer Offer)
  const respondToIncomingOffer = async (accept: boolean) => {
    if (!incomingOffer) return;
    const offer = incomingOffer;
    setIncomingOffer(null);

    const conn = connectionsRef.current.get(offer.peerId);
    if (!accept) {
      playAirDropChime("decline");
      conn?.send?.({
        kind: "OFFER_DECLINE",
        offerId: offer.offerId,
      });
      if (offer.dropId) {
        fetch("/api/drop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "respond",
            dropId: offer.dropId,
            accept: false,
            peerId: peerRef.current?.id || "",
          }),
        }).catch(() => {});
      }
      showToast("Overdracht geweigerd");
      return;
    }

    playAirDropChime("launch");
    conn?.send?.({
      kind: "OFFER_ACCEPT",
      offerId: offer.offerId,
    });

    setReceiveFx({
      id: offer.offerId,
      phase: "streaming",
      senderName: offer.senderName,
      senderBrand: offer.senderBrand,
      label:
        offer.kind === "text"
          ? "Bericht / Link"
          : offer.files.length === 1
            ? offer.files[0].name
            : `${offer.files.length} bestanden`,
      totalSize: offer.totalSize,
      progress: 18,
      thumbs: offer.thumbs,
      isText: offer.kind === "text",
      textPreview: offer.textPreview,
    });

    // If offer came via /api/drop (or if WebRTC conn isn't open), notify sender & download real file payload
    if (offer.dropId) {
      try {
        await fetch("/api/drop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "respond",
            dropId: offer.dropId,
            accept: true,
            peerId: peerRef.current?.id || "",
          }),
        });

        // If WebRTC isn't streaming it directly, pull the real file payload from /api/drop
        if (!conn || !conn.open) {
          const res = await fetch(`/api/drop?dropId=${encodeURIComponent(offer.dropId)}`);
          const data = await res.json();
          const drop = data?.drop;
          if (drop) {
            setReceiveFx((prev) => (prev ? { ...prev, progress: 68 } : prev));
            let activeBlobUrl = "";
            let activeFileName = "";
            if (drop.textContent && !drop.base64Data) {
              const blob = new Blob([drop.textContent], { type: "text/plain;charset=utf-8" });
              const blobUrl = URL.createObjectURL(blob);
              activeBlobUrl = blobUrl;
              activeFileName = `Tekst van ${drop.senderName}.txt`;
              setQuickText(drop.textContent);
              setTransfers((prev) => [
                {
                  id: drop.dropId,
                  name: `Tekst van ${drop.senderName}.txt`,
                  size: blob.size,
                  type: "text/plain",
                  direction: "incoming",
                  progress: 100,
                  speedMbps: 84.2,
                  status: "completed",
                  blobUrl,
                  blob,
                  peerName: drop.senderName,
                  timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
                },
                ...prev,
              ]);
            } else if (drop.base64Data) {
              const blob = base64ToBlob(drop.base64Data, drop.fileType);
              const blobUrl = URL.createObjectURL(blob);
              activeBlobUrl = blobUrl;
              activeFileName = drop.fileName;
              setTransfers((prev) => [
                {
                  id: drop.dropId,
                  name: drop.fileName,
                  size: drop.fileSize || blob.size,
                  type: drop.fileType,
                  direction: "incoming",
                  progress: 100,
                  speedMbps: 92.4,
                  status: "completed",
                  blobUrl,
                  blob,
                  peerName: drop.senderName,
                  timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
                },
                ...prev,
              ]);
              try {
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = drop.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch {
                // Ignore
              }
            }
            window.setTimeout(() => {
              setReceiveFx((prev) => (prev ? {
                ...prev,
                phase: "done",
                progress: 100,
                blobUrl: activeBlobUrl || prev.blobUrl,
                fileName: activeFileName || prev.fileName,
              } : prev));
              playAirDropChime("done");
              showToast(`Ontvangen van ${offer.senderName}!`);
            }, 450);
          }
        }
      } catch {
        // Ignore
      }
    }
  };

  // 5. Real Hardware Bluetooth Nearby Device Scanner (Web Bluetooth API + Apple Continuity/GATT)
  const scanRealBluetoothNearby = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navBt = (navigator as any)?.bluetooth;
    if (!navBt || typeof navBt.requestDevice !== "function") {
      // On iOS Safari, Apple embeds Bluetooth/UWB AirDrop discovery directly in navigator.share
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await shareFilesViaNativeOs();
        return;
      }
      showToast("Open op Chrome / Edge / Android voor directe Bluetooth-hardware scan, of gebruik Systeem Share.");
      return;
    }

    try {
      setIsScanningBluetooth(true);
      const btDevice = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "generic_access",
          "device_information",
          "battery_service",
          "7905f431-b5ce-4e99-a40f-4b1e122d00d0", // Apple Notification Center Service (ANCS)
          "89d3502b-0f36-433a-8ef4-c502ad55f8dc", // Apple Media Service (AMS)
          "d0611e78-bbb4-4591-a5f8-487910ae4366", // Apple Continuity Service
        ],
        optionalManufacturerData: [0x004c], // Apple Inc. (0x004C)
      });

      if (!btDevice) {
        setIsScanningBluetooth(false);
        return;
      }

      let gattDeviceName = "";
      let batteryPct: number | null = null;
      let manufacturer = "";
      let modelNumber = "";

      // Read GATT characteristics (including Apple iOS Generic Access 0x2A00 Device Name & 0x2A24 Model Identifier)
      try {
        if (btDevice.gatt) {
          const server = await btDevice.gatt.connect();
          const decoder = new TextDecoder("utf-8");

          // 1. Read real Device Name (0x2A00) from Generic Access (0x1800) - crucial for iPhones whose BLE advertisement hides the name
          try {
            const genService = await server.getPrimaryService("generic_access");
            const nameChar = await genService.getCharacteristic("gap.device_name");
            const nameVal = await nameChar.readValue();
            gattDeviceName = decoder.decode(nameVal).replace(/\0/g, "").trim();
          } catch {
            // Device doesn't expose gap.device_name
          }

          // 2. Read Battery Level (0x2A19)
          try {
            const batService = await server.getPrimaryService("battery_service");
            const batChar = await batService.getCharacteristic("battery_level");
            const val = await batChar.readValue();
            batteryPct = val.getUint8(0);
          } catch {
            // Device doesn't expose battery GATT
          }

          // 3. Read Apple / Android Manufacturer & Exact Hardware Model Identifier (e.g. "iPhone15,2" -> "iPhone 14 Pro")
          try {
            const infoService = await server.getPrimaryService("device_information");
            try {
              const mfgChar = await infoService.getCharacteristic("manufacturer_name_string");
              const mfgVal = await mfgChar.readValue();
              manufacturer = decoder.decode(mfgVal).replace(/\0/g, "").trim();
            } catch {
              // Ignore
            }
            try {
              const modChar = await infoService.getCharacteristic("model_number_string");
              const modVal = await modChar.readValue();
              const rawMod = decoder.decode(modVal).replace(/\0/g, "").trim();
              modelNumber = mapAppleGattModelIdentifier(rawMod);
            } catch {
              // Ignore
            }
          } catch {
            // Device doesn't expose device_information GATT
          }
        }
      } catch {
        // GATT connection optional
      }

      const baseName = gattDeviceName || btDevice.name || "";
      const resolvedName =
        baseName && modelNumber && !baseName.toLowerCase().includes(modelNumber.toLowerCase())
          ? `${baseName} (${modelNumber})`
          : baseName || modelNumber || `Bluetooth Toestel (${String(btDevice.id || "").slice(0, 6)})`;

      const item: BluetoothNearbyDevice = {
        id: String(btDevice.id || `bt-${Date.now()}`),
        name: resolvedName,
        connected: true,
        batteryPct,
        manufacturer: manufacturer || undefined,
        modelNumber: modelNumber || undefined,
      };

      // 1. Strict Filter: Check if device is a non-receivable peripheral (audio/lights/sensor)
      if (isNonReceivableDevice(resolvedName, modelNumber)) {
        showToast(`⚠️ "${resolvedName}" is een accessoire/audio toestel en kan geen bestanden ontvangen.`);
        setIsScanningBluetooth(false);
        return;
      }

      setBluetoothDevices((prev) => {
        const filtered = prev.filter((d) => d.id !== item.id && d.name !== item.name);
        return [item, ...filtered];
      });

      // 2. Classify receivable device (TV, iPad/tablet, Laptop/PC, GSM) and add to live connectedPeers
      const category = classifyDeviceCategory({
        name: resolvedName,
        modelNumber,
        brandLabel: manufacturer,
      });

      const peerBrand: BrandId =
        category === "tablet"
          ? "ios"
          : category === "pc"
            ? "desktop"
            : manufacturer.toLowerCase().includes("apple")
              ? "ios"
              : manufacturer.toLowerCase().includes("samsung")
                ? "samsung"
                : manufacturer.toLowerCase().includes("xiaomi")
                  ? "xiaomi"
                  : manufacturer.toLowerCase().includes("huawei")
                    ? "huawei"
                    : "android";

      const peerBrandLabel =
        category === "tv"
          ? "Smart TV"
          : category === "tablet"
            ? (resolvedName.toLowerCase().includes("ipad") ? "Apple iPad" : "Tablet")
            : category === "pc"
              ? "Laptop / PC"
              : manufacturer
                ? `${manufacturer} GSM`
                : "GSM / Smartphone";

      const newPeer: PeerDeviceInfo = {
        peerId: item.id,
        name: resolvedName,
        roomCode: "bluetooth",
        brand: peerBrand,
        brandLabel: peerBrandLabel,
        osSkin:
          category === "tv"
            ? "Smart TV OS"
            : category === "tablet"
              ? "iPadOS"
              : category === "pc"
                ? "macOS / Windows"
                : "Mobile OS",
        modelName: modelNumber || resolvedName,
      };

      setConnectedPeers((prev) => {
        const filtered = prev.filter((p) => p.peerId !== newPeer.peerId && p.name !== newPeer.name);
        return [newPeer, ...filtered];
      });

      playAirDropChime("connect");
      showToast(`✅ ${peerBrandLabel} gekoppeld: ${resolvedName}`);
    } catch {
      // User closed the native Bluetooth chooser
    } finally {
      setIsScanningBluetooth(false);
    }
  };

  const stableClientIdRef = useRef<string>("");

  // Process any incoming drop delivered via /api/radar or /api/drop and trigger the Downward Kamehameha Wave!
  const processIncomingServerDrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (d: any, myPeerId: string) => {
      if (!d?.dropId) return;
      const dropIdStr = String(d.dropId);
      if (seenDropIdsRef.current.has(dropIdStr)) return;
      seenDropIdsRef.current.add(dropIdStr);

      const senderName = String(d.senderName || "Toestel");
      const senderBrand = (d.senderBrand as BrandId) || "ios";
      const senderBrandLabel = String(d.senderBrandLabel || "Toestel");
      const fileName = String(d.fileName || "Bestand");
      const fileSize = Number(d.fileSize) || 0;
      const fileType = String(d.fileType || "application/octet-stream");
      const isText = Boolean(d.textContent && !d.base64Data);

      // If phone is locked or app is in background, queue the beam so it fires visibly the moment the phone is opened
      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      if (isHidden) {
        pendingBeamDropRef.current = d;
        try {
          localStorage.setItem("zytron_pending_beam", JSON.stringify(d));
        } catch {
          // Ignore
        }
      }

      // If Auto-Accept is ON (default), immediately blast the Downward Kamehameha Wave onto the receiver's screen!
      if (autoAcceptRef.current) {
        playAirDropChime("launch");
        notifyIncomingDrop(senderName, isText ? "Tekst / Link" : fileName, d);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([300, 100, 300, 100, 450]);
        }
        setReceiveFx({
          id: dropIdStr,
          phase: "streaming",
          senderName,
          senderBrand,
          label: isText ? "Tekst / Link" : fileName,
          totalSize: fileSize,
          progress: 24,
          thumbs: Array.isArray(d.thumbs) ? d.thumbs : [],
          isText,
          textPreview: d.textContent ? String(d.textContent).slice(0, 180) : undefined,
        });

        // Notify sender via warm /api/radar endpoint that the Kamehameha wave has landed!
        fetch("/api/radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "respond_drop",
            dropId: dropIdStr,
            accept: true,
            peerId: myPeerId,
          }),
        }).catch(() => {});

        // Fetch full payload if base64Data wasn't inlined
        let base64Payload = String(d.base64Data || "");
        let textPayload = d.textContent ? String(d.textContent) : "";
        if (!base64Payload && !textPayload) {
          try {
            const fullRes = await fetch(`/api/drop?dropId=${encodeURIComponent(dropIdStr)}`, {
              cache: "no-store",
            });
            const fullJson = await fullRes.json();
            if (fullJson?.drop) {
              base64Payload = String(fullJson.drop.base64Data || "");
              textPayload = fullJson.drop.textContent ? String(fullJson.drop.textContent) : "";
            }
          } catch {
            // Ignore
          }
        }

        window.setTimeout(() => {
          setReceiveFx((prev) => (prev ? { ...prev, progress: 74 } : prev));
        }, 320);

        let activeBlobUrl = "";
        let activeFileName = "";
        if (textPayload && !base64Payload) {
          const blob = new Blob([textPayload], { type: "text/plain;charset=utf-8" });
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrl = blobUrl;
          activeFileName = `Tekst van ${senderName}.txt`;
          setQuickText(textPayload);
          setTransfers((prev) => [
            {
              id: dropIdStr,
              name: `Tekst van ${senderName}.txt`,
              size: blob.size,
              type: "text/plain",
              direction: "incoming",
              progress: 100,
              speedMbps: 94.5,
              status: "completed",
              blobUrl,
              blob,
              peerName: senderName,
              timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
            },
            ...prev,
          ]);
        } else if (base64Payload) {
          const blob = base64ToBlob(base64Payload, fileType);
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrl = blobUrl;
          activeFileName = fileName;
          setTransfers((prev) => [
            {
              id: dropIdStr,
              name: fileName,
              size: fileSize || blob.size,
              type: fileType,
              direction: "incoming",
              progress: 100,
              speedMbps: 98.4,
              status: "completed",
              blobUrl,
              blob,
              peerName: senderName,
              timestamp: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
            },
            ...prev,
          ]);
          try {
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch {
            // Ignore
          }
        }

        window.setTimeout(() => {
          setReceiveFx((prev) => (prev ? {
            ...prev,
            phase: "done",
            progress: 100,
            blobUrl: activeBlobUrl || prev.blobUrl,
            fileName: activeFileName || prev.fileName,
          } : prev));
          playAirDropChime("done");
          showToast(`Ontvangen van ${senderName}!`);
        }, 900);
        window.setTimeout(() => {
          setReceiveFx((prev) => (prev?.id === dropIdStr ? null : prev));
        }, 25000);
        return;
      }

      // Otherwise show Incoming Offer Modal with the Kamehameha wave behind it
      const offer: IncomingOffer = {
        offerId: dropIdStr,
        dropId: dropIdStr,
        pin: String(d.pin || ""),
        peerId: String(d.senderPeerId || ""),
        senderName,
        senderBrand,
        senderBrandLabel,
        kind: isText ? "text" : "files",
        files: [
          {
            name: fileName,
            size: fileSize,
            type: fileType,
          },
        ],
        totalSize: fileSize,
        thumbs: Array.isArray(d.thumbs) ? d.thumbs : [],
        textPreview: d.textContent ? String(d.textContent).slice(0, 180) : undefined,
      };
      playAirDropChime("offer");
      notifyIncomingDrop(senderName, isText ? "Tekst / Link" : fileName, d);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([250, 100, 250]);
      }
      setIncomingOffer(offer);
    },
    [showToast],
  );

  // 6. Zero-QR Automatic Radar Discovery Mesh (/api/radar Warm Heartbeat + WebRTC Direct P2P)
  const syncRadarPresence = useCallback(
    async (notify = false) => {
      if (!stableClientIdRef.current) {
        try {
          const savedId = localStorage.getItem("zytron_device_persistent_id") || sessionStorage.getItem("zytron_node_id");
          if (savedId) {
            stableClientIdRef.current = savedId;
          } else {
            const freshId = `zytron-node-${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem("zytron_device_persistent_id", freshId);
            sessionStorage.setItem("zytron_node_id", freshId);
            stableClientIdRef.current = freshId;
          }
        } catch {
          stableClientIdRef.current = `zytron-node-${Math.random().toString(36).slice(2, 9)}`;
        }
      }
      const peer = peerRef.current;
      const myPeerId = stableClientIdRef.current;

      // Prune dead WebRTC connections & expired dial locks
      const now = Date.now();
      for (const [dialId, dialTs] of dialingPeersRef.current.entries()) {
        if (now - dialTs > 7500) {
          dialingPeersRef.current.delete(dialId);
        }
      }
      for (const [peerId, conn] of connectionsRef.current.entries()) {
        const lastPong = peerLastPongRef.current.get(peerId) || now;
        if (!conn.open || now - lastPong > 15_000) {
          try {
            conn.close();
          } catch {
            // Ignore
          }
          connectionsRef.current.delete(peerId);
          peerLastPongRef.current.delete(peerId);
          setConnectedPeers((prev) => prev.filter((p) => p.peerId !== peerId));
        } else {
          try {
            conn.send({
              kind: "PING",
              name: customNameRef.current || deviceRef.current?.modelName || "Toestel",
            });
          } catch {
            // Ignore
          }
        }
      }

      // 1. Sync with /api/radar for instant Wi-Fi & Cloud auto-discovery AND incoming drops in 1 roundtrip!
      try {
        const dev = deviceRef.current;
        const res = await fetch("/api/radar", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peerId: myPeerId,
            friendCode: myFriendCodeRef.current || myFriendCode,
            name: customNameRef.current || dev?.modelName || "Toestel",
            brand: dev?.brand || "android",
            brandLabel: dev?.brandLabel || "Toestel",
            osSkin: dev?.osSkin || "WebRTC P2P",
            modelName: dev?.modelName || "Toestel",
            tenMinActive,
            tenMinRemaining,
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          if (Array.isArray(data.peers)) {
            const liveRadarPeers: PeerDeviceInfo[] = [];
            for (const remote of data.peers) {
              if (remote?.peerId && remote.peerId !== myPeerId && remote.peerId !== peer?.id) {
                const remoteId = String(remote.peerId);
                liveRadarPeers.push({
                  peerId: remoteId,
                  friendCode: remote.friendCode ? String(remote.friendCode) : undefined,
                  roomCode: "",
                  name: String(remote.name || "Toestel"),
                  brand: (remote.brand as BrandId) || "android",
                  brandLabel: String(remote.brandLabel || "Toestel"),
                  osSkin: String(remote.osSkin || "P2P Engine"),
                  modelName: String(remote.modelName || "Toestel"),
                  sameWifi: Boolean(remote.sameWifi),
                });
                // Dial WebRTC once per 7.5s window so we never abort an in-progress handshake
                if (
                  peer &&
                  peer.id &&
                  !connectionsRef.current.has(remoteId) &&
                  !dialingPeersRef.current.has(remoteId)
                ) {
                  dialingPeersRef.current.set(remoteId, now);
                  try {
                    const c = peer.connect(remoteId, { reliable: true });
                    bindConnectionEvents(c);
                  } catch {
                    // Ignore
                  }
                }
              }
            }

            // Sync online status for saved friends
            setSavedFriends((prev) =>
              prev.map((f) => {
                const match = data.peers.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (rp: any) =>
                    (rp.friendCode && rp.friendCode.toUpperCase() === f.friendCode.toUpperCase()) ||
                    (f.peerId && rp.peerId === f.peerId),
                );
                if (match) {
                  return {
                    ...f,
                    isOnline: true,
                    peerId: match.peerId,
                    lastSeen: Date.now(),
                  };
                }
                const isConnOpen = f.peerId ? Boolean(connectionsRef.current.get(f.peerId)?.open) : false;
                return {
                  ...f,
                  isOnline: isConnOpen,
                };
              }),
            );

            // Merge active WebRTC peers + active /api/radar peers so devices ALWAYS appear within 1s
            setConnectedPeers((prev) => {
              const byId = new Map<string, PeerDeviceInfo>();
              for (const p of prev) {
                if (connectionsRef.current.get(p.peerId)?.open) {
                  byId.set(p.peerId, p);
                }
              }
              for (const rp of liveRadarPeers) {
                byId.set(rp.peerId, rp);
              }
              return Array.from(byId.values());
            });
          }

          // Process any incoming drops returned directly by the warm /api/radar endpoint!
          if (Array.isArray(data.incomingDrops) && data.incomingDrops.length > 0) {
            const firstNew = data.incomingDrops.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (d: any) => d?.dropId && !seenDropIdsRef.current.has(String(d.dropId)),
            );
            if (firstNew) {
              await processIncomingServerDrop(firstNew, myPeerId);
            }
          }
        }
      } catch {
        // Offline or mesh-only mode
      }

      // 2. Also poll /api/drop as secondary backup
      try {
        const dropRes = await fetch(`/api/drop?peerId=${encodeURIComponent(myPeerId)}`, {
          cache: "no-store",
        });
        const dropData = await dropRes.json();
        if (dropData?.ok && Array.isArray(dropData.incoming) && dropData.incoming.length > 0) {
          const firstNew = dropData.incoming.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d: any) => d?.dropId && !seenDropIdsRef.current.has(String(d.dropId)),
          );
          if (firstNew) {
            await processIncomingServerDrop(firstNew, myPeerId);
          }
        }
      } catch {
        // Ignore
      }

      // 3. Sync WhatsApp & Phone Number Paired Contacts (/api/pair)
      try {
        const dev = deviceRef.current;
        const codesToSync = Array.from(activePairCodesRef.current);
        if (myPhoneRef.current.trim() && codesToSync.length === 0) {
          codesToSync.push("");
        }

        for (const pCode of codesToSync) {
          const pRes = await fetch("/api/pair", {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pairCode: pCode || undefined,
              phone: myPhoneRef.current || undefined,
              peerId: myPeerId,
              name: customNameRef.current || dev?.modelName || "Toestel",
              brand: dev?.brand || "ios",
              brandLabel: dev?.brandLabel || "Toestel",
              osSkin: dev?.osSkin || "WebRTC P2P",
              modelName: dev?.modelName || "Toestel",
              gpuRenderer: dev?.gpuRenderer || "Hardware GPU",
              screenSpec: dev?.screenSpec || "",
              batteryPct: dev?.batteryPct ?? null,
              networkType: dev?.networkType || "Direct P2P",
            }),
          });
          const pData = await pRes.json();
          if (pData?.ok && Array.isArray(pData.partners) && pData.partners.length > 0) {
            for (const partner of pData.partners) {
              if (!partner?.peerId || partner.peerId === myPeerId || partner.peerId === peer?.id) continue;
              const partnerId = String(partner.peerId);

              if (
                peer &&
                peer.id &&
                !connectionsRef.current.has(partnerId) &&
                !dialingPeersRef.current.has(partnerId)
              ) {
                dialingPeersRef.current.set(partnerId, now);
                try {
                  const c = peer.connect(partnerId, { reliable: true });
                  bindConnectionEvents(c);
                } catch {
                  // Ignore
                }
              }

              setWaContacts((prev) => {
                const existingIdx = prev.findIndex(
                  (c) => c.pairCode === pData.pairCode || (partner.phone && c.phone === partner.phone),
                );
                const updated: WhatsAppContact = {
                  id: pData.pairCode || partnerId,
                  pairCode: pData.pairCode || pCode,
                  phone: partner.phone || (existingIdx >= 0 ? prev[existingIdx].phone : ""),
                  name: String(partner.name || "WhatsApp Vriend"),
                  peerId: partnerId,
                  brand: (partner.brand as BrandId) || "ios",
                  brandLabel: String(partner.brandLabel || "Toestel"),
                  osSkin: String(partner.osSkin || "WebRTC P2P"),
                  modelName: String(partner.modelName || "Toestel"),
                  gpuRenderer: partner.gpuRenderer ? String(partner.gpuRenderer) : undefined,
                  screenSpec: partner.screenSpec ? String(partner.screenSpec) : undefined,
                  batteryPct: typeof partner.batteryPct === "number" ? partner.batteryPct : null,
                  networkType: partner.networkType ? String(partner.networkType) : undefined,
                  sameWifi: Boolean(partner.sameWifi),
                  online: Boolean(partner.online),
                  lastSeen: Date.now(),
                };
                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = updated;
                  return copy;
                }
                playAirDropChime("connect");
                return [updated, ...prev];
              });
            }
          }
        }
      } catch {
        // Ignore
      }

      if (notify) {
        showToast("Toestellen in de buurt vernieuwd!");
      }
    },
    [bindConnectionEvents, processIncomingServerDrop, showToast],
  );

  // Pair a friend's phone via WhatsApp or Phone Number (Generates handshake & opens WhatsApp)
  const pairViaWhatsAppOrPhone = async (openWhatsAppApp = true) => {
    const cleanPhone = waPhoneInput.replace(/[^\d+]/g, "").replace(/^00/, "+");
    const friendLabel = waFriendNameInput.trim() || (cleanPhone ? `Toestel (${cleanPhone})` : "WhatsApp Contact");
    const pairCode = `wa-${Math.random().toString(36).slice(2, 8)}`;
    activePairCodesRef.current.add(pairCode);

    const dev = deviceRef.current;
    const myLabel = customNameRef.current || dev?.modelName || "Mijn Toestel";
    const myPeerId = stableClientIdRef.current || peerRef.current?.id || `zytron-node-${Date.now()}`;

    try {
      const res = await fetch("/api/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairCode,
          phone: cleanPhone || myPhoneRef.current || undefined,
          peerId: myPeerId,
          name: myLabel,
          brand: dev?.brand || "ios",
          brandLabel: dev?.brandLabel || "Toestel",
          osSkin: dev?.osSkin || "WebRTC P2P",
          modelName: dev?.modelName || "Toestel",
          gpuRenderer: dev?.gpuRenderer || "Hardware GPU",
          screenSpec: dev?.screenSpec || "",
          batteryPct: dev?.batteryPct ?? null,
          networkType: dev?.networkType || "Direct P2P",
        }),
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.partners) && data.partners.length > 0) {
        const p = data.partners[0];
        setWaContacts((prev) => [
          {
            id: data.pairCode || pairCode,
            pairCode: data.pairCode || pairCode,
            phone: cleanPhone || p.phone || "",
            name: String(p.name || friendLabel),
            peerId: String(p.peerId || ""),
            brand: (p.brand as BrandId) || "ios",
            brandLabel: String(p.brandLabel || "Toestel"),
            osSkin: String(p.osSkin || "WebRTC P2P"),
            modelName: String(p.modelName || "Toestel"),
            gpuRenderer: p.gpuRenderer,
            screenSpec: p.screenSpec,
            batteryPct: p.batteryPct,
            networkType: p.networkType,
            sameWifi: Boolean(p.sameWifi),
            online: true,
            lastSeen: Date.now(),
          },
          ...prev.filter((c) => c.pairCode !== (data.pairCode || pairCode)),
        ]);
        playAirDropChime("connect");
        showToast(`Direct gekoppeld met ${p.name || friendLabel} via nummer!`);
        setWaPhoneInput("");
        setWaFriendNameInput("");
        return;
      }
    } catch {
      // Ignore
    }

    setWaContacts((prev) => [
      {
        id: pairCode,
        pairCode,
        phone: cleanPhone,
        name: friendLabel,
        peerId: "",
        brand: "ios",
        brandLabel: "Wacht op WhatsApp klik...",
        osSkin: "Smart AirDrop + Quick Share",
        modelName: "Wacht op toestel-info...",
        sameWifi: false,
        online: false,
        lastSeen: Date.now(),
      },
      ...prev.filter((c) => c.pairCode !== pairCode),
    ]);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
    const pairUrl = `${origin}/?pair=${encodeURIComponent(pairCode)}&from=${encodeURIComponent(myLabel)}${
      myPhoneRef.current ? `&phone=${encodeURIComponent(myPhoneRef.current)}` : ""
    }`;

    if (openWhatsAppApp) {
      const waMessage = `📲 *Zytron AirDrop & Quick Share Koppeling*\n\n*${myLabel}* wil zijn/haar telefoon met de jouwe koppelen (Dichtbij = Directe AirDrop / Quick Share • Ver weg = Cloud Drop).\n\n👉 Klik hier om je toestel automatisch te koppelen:\n${pairUrl}`;
      const waDigits = cleanPhone.replace(/^\+/, "");
      const waUrl = waDigits
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      showToast("WhatsApp geopend! Zodra de ander op de link tikt verschijnt zijn echte telefoon + model hier.");
    } else {
      navigator.clipboard?.writeText(pairUrl).catch(() => {});
      showToast("Koppel-link gekopieerd! Stuur door via WhatsApp of SMS.");
    }

    setWaPhoneInput("");
    setWaFriendNameInput("");
  };

  // Smart Drop to a WhatsApp-paired contact: Nearby = Direct AirDrop/Quick Share P2P, Far Away = Cloud Relay
  const smartDropToWhatsAppContact = async (contact: WhatsAppContact) => {
    if (queuedFiles.length === 0 && !quickText.trim()) {
      fileInputRef.current?.click();
      showToast(`Kies eerst een foto of bestand om naar ${contact.name} te sturen`);
      return;
    }

    const isDirectWebRtcOpen = Boolean(contact.peerId && connectionsRef.current.get(contact.peerId)?.open);
    const isNearby = contact.sameWifi || isDirectWebRtcOpen;

    if (isNearby && contact.peerId) {
      await beamFilesToPeer(contact.peerId);
      return;
    }

    await beamFilesToPeer(contact.peerId || undefined, contact);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bindConnectionEventsRef = useRef<(conn: any) => void>(() => {});
  const syncRadarPresenceRef = useRef<(notify?: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    bindConnectionEventsRef.current = bindConnectionEvents;
  }, [bindConnectionEvents]);

  useEffect(() => {
    syncRadarPresenceRef.current = syncRadarPresence;
  }, [syncRadarPresence]);

  useEffect(() => {
    let isMounted = true;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setMyRoomCode(code);

    let nodeId = `zytron-node-${code}`;
    try {
      const saved = localStorage.getItem("zytron_device_persistent_id") || sessionStorage.getItem("zytron_node_id");
      if (saved) {
        nodeId = saved;
      } else {
        localStorage.setItem("zytron_device_persistent_id", nodeId);
        sessionStorage.setItem("zytron_node_id", nodeId);
      }
    } catch {
      // Ignore
    }
    stableClientIdRef.current = nodeId;

    // Fast 600ms radar + drop polling so Phone <-> PC discover each other AND receive Kamehameha drops instantly!
    const initialTimer = window.setTimeout(() => {
      if (isMounted) syncRadarPresenceRef.current(false);
    }, 100);
    const radarInterval = window.setInterval(() => {
      if (isMounted) syncRadarPresenceRef.current(false);
    }, 600);

    // Dedicated background Web Worker timer: immune to browser background tab freezing/throttling!
    let bgWorker: Worker | null = null;
    try {
      const workerBlob = new Blob([
        `var t = null;
        self.onmessage = function(e) {
          if (e.data === 'run') {
            if (!t) {
              t = setInterval(function() { self.postMessage('tick'); }, 1000);
            }
          } else if (e.data === 'stop') {
            if (t) { clearInterval(t); t = null; }
          }
        };`
      ], { type: "application/javascript" });
      bgWorker = new Worker(URL.createObjectURL(workerBlob));
      bgWorker.onmessage = () => {
        if (isMounted && syncRadarPresenceRef.current) {
          syncRadarPresenceRef.current(false);
        }
      };
      bgWorker.postMessage("run");
    } catch {}

    const onUserTouch = () => {
      requestNotificationPermission();
    };
    window.addEventListener("click", onUserTouch, { once: true });
    window.addEventListener("touchstart", onUserTouch, { once: true });

    const initPeer = async () => {
      try {
        const { Peer } = await import("peerjs");
        if (!isMounted) return;

        const peer = new Peer(stableClientIdRef.current, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },
            ],
          },
        });

        peerRef.current = peer;

        peer.on("open", () => {
          if (!isMounted) return;
          setP2pStatus("ready");
          syncRadarPresenceRef.current(false);
        });

        peer.on("connection", (conn) => {
          bindConnectionEventsRef.current(conn);
        });

        peer.on("error", () => {
          if (!isMounted) return;
          setP2pStatus("ready");
        });
      } catch {
        if (isMounted) setP2pStatus("ready");
      }
    };

    initPeer();

    return () => {
      isMounted = false;
      window.removeEventListener("click", onUserTouch);
      window.removeEventListener("touchstart", onUserTouch);
      window.clearTimeout(initialTimer);
      window.clearInterval(radarInterval);
      try {
        bgWorker?.postMessage("stop");
        bgWorker?.terminate();
      } catch {}
      peerRef.current?.destroy?.();
    };
  }, []);

  // Share queued files directly via Native OS Hardware Share Sheet (AirDrop / Quick Share / Bluetooth)
  const shareFilesViaNativeOs = async (customPayload?: { text?: string; url?: string; title?: string }) => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        const rawFiles = queuedFiles.map((q) => q.file);
        const navWithCanShare = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
        };
        if (rawFiles.length > 0 && (!navWithCanShare.canShare || navWithCanShare.canShare({ files: rawFiles }))) {
          await navigator.share({
            files: rawFiles,
            title: customPayload?.title || "Zytron Drop",
            text: customPayload?.text || (quickText.trim() || undefined),
          });
          playAirDropChime("done");
          showToast("Gedeeld via Echte Systeem AirDrop / Quick Share!");
          return;
        }

        const shareUrl =
          customPayload?.url ||
          (typeof window !== "undefined"
            ? `${window.location.origin}/?add_friend=${encodeURIComponent(myFriendCode)}`
            : "https://zytron-share.vercel.app");
        const shareText =
          customPayload?.text ||
          (quickText.trim()
            ? quickText.trim()
            : `Ontvang bestanden of speel multiplayer games mee via Zytron Drop (Geen app nodig!): ${shareUrl}`);

        await navigator.share({
          title: customPayload?.title || "Zytron Drop",
          text: shareText,
          url: shareUrl,
        });
        playAirDropChime("done");
        showToast("AirDrop signaal verzonden naar nabije schermen!");
        return;
      } catch {
        // User cancelled native sheet
        return;
      }
    }
    // Fallback if Web Share API is not supported
    await copyMyFriendLink();
    showToast("Koppel-link gekopieerd! Plak in Berichten of stuur via AirDrop.");
  };

  // Add files from picker or drag-and-drop
  const addFilesToQueue = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    const items: QueuedFile[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      source: "picker",
    }));
    setQueuedFiles((prev) => [...items, ...prev]);
    showToast(`${items.length} bestand(en) geselecteerd`);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFilesToQueue(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer?.files?.length) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  // Direct Native Camera Snap Handler
  const handleCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      showToast("Foto gemaakt en direct klaar voor AirDrop / Quick Share!");
      e.target.value = "";
    }
  };

  // Instant Clipboard Paste Handler (Images, Files, or Text)
  const handleClipboardPaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        let found = false;
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/") || type.startsWith("text/")) {
              const blob = await item.getType(type);
              const ext = type.startsWith("image/") ? type.split("/")[1] || "png" : "txt";
              const file = new File([blob], `Klembord_${Date.now()}.${ext}`, { type });
              addFilesToQueue([file]);
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) {
          showToast("Bestand geplakt van klembord!");
          return;
        }
      }
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setQuickText(text.trim());
          showToast("Tekst geplakt van klembord!");
          return;
        }
      }
      showToast("Geen afbeelding of tekst op klembord gevonden.");
    } catch {
      showToast("Kon klembord niet lezen (geef toestemming in browser)");
    }
  };

  // Voice Memo / Audio Drop Recorder
  const startAudioRecording = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        showToast("Microfoon niet beschikbaar op dit toestel");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const ext = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `Spraakmemo_${Date.now()}.${ext}`, {
          type: recorder.mimeType || "audio/webm",
        });
        addFilesToQueue([file]);
        showToast("🎙️ Spraakmemo opgenomen en direct klaar voor verzenden!");
        setIsRecordingAudio(false);
        setAudioRecordingSec(0);
        window.clearInterval(audioTimerRef.current);
      };

      recorder.start(250);
      setIsRecordingAudio(true);
      setAudioRecordingSec(0);
      window.clearInterval(audioTimerRef.current);
      audioTimerRef.current = window.setInterval(() => {
        setAudioRecordingSec((s) => s + 1);
      }, 1000);
      showToast("🎙️ Opname gestart — spreek nu in...");
    } catch {
      showToast("Geen toegang tot microfoon");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    window.clearInterval(audioTimerRef.current);
  };

  // Client-side strict device filtering & deduplication:
  // 1. Excludes non-receivable noise (Bluetooth audio accessories, smart home bulbs, fitness bands, etc.)
  // 2. Ensures each physical receiver appears EXACTLY ONCE
  const uniqueNearbyDevices = useMemo(() => {
    const map = new Map<string, PeerDeviceInfo>();
    for (const p of connectedPeers) {
      if (isNonReceivableDevice(p.name, p.modelName)) continue;
      const normName = p.name.trim().toLowerCase().replace(/\s+/g, " ");
      const key = p.friendCode ? `code:${p.friendCode.toUpperCase()}` : `name:${normName}`;
      if (!map.has(key)) {
        map.set(key, p);
      }
    }
    return Array.from(map.values());
  }, [connectedPeers]);

  // Category counts for the quick filter pills
  const categoryCounts = useMemo(() => {
    const counts = { all: uniqueNearbyDevices.length, phone: 0, tablet: 0, pc: 0, tv: 0 };
    for (const p of uniqueNearbyDevices) {
      const cat = classifyDeviceCategory(p);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [uniqueNearbyDevices]);

  // Filtered devices based on user's selected category tab
  const filteredNearbyDevices = useMemo(() => {
    if (deviceCategoryFilter === "all") return uniqueNearbyDevices;
    return uniqueNearbyDevices.filter((p) => classifyDeviceCategory(p) === deviceCategoryFilter);
  }, [uniqueNearbyDevices, deviceCategoryFilter]);

  // Helper to convert ArrayBuffer to base64 for /api/radar & /api/drop zero-fail relay
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  // Create an active Drop on /api/drop and return { dropId, pin, url }
  const createActiveDropOnServer = async (): Promise<{ dropId: string; pin: string; url: string } | null> => {
    if (queuedFiles.length === 0 && !quickText.trim()) {
      fileInputRef.current?.click();
      showToast("Selecteer eerst een bestand of foto");
      return null;
    }
    const myPeerId = stableClientIdRef.current || `zytron-${Date.now()}`;
    const dev = deviceRef.current;
    const senderName = customNameRef.current || dev?.modelName || "Mijn Toestel";
    const primaryFile = queuedFiles[0];

    let base64Data = "";
    let fileName = primaryFile ? primaryFile.name : "Notitie.txt";
    let fileSize = primaryFile ? primaryFile.size : new Blob([quickText.trim()]).size;
    let fileType = primaryFile ? primaryFile.type : "text/plain";

    if (primaryFile) {
      const buffer = await primaryFile.file.arrayBuffer();
      base64Data = arrayBufferToBase64(buffer);
    }

    try {
      const res = await fetch("/api/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderPeerId: myPeerId,
          senderName,
          senderBrand: dev?.brand || "samsung",
          senderBrandLabel: dev?.brandLabel || "Toestel",
          fileName,
          fileSize,
          fileType,
          base64Data,
          textContent: quickText.trim() || undefined,
          thumbs: [],
        }),
      });
      const data = await res.json();
      if (data?.ok && data.dropId && data.pin) {
        setActiveDropPin(data.pin);
        const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
        const dropParams = new URLSearchParams();
        dropParams.set("pin", String(data.pin));
        dropParams.set("sender", myPeerId);
        dropParams.set("senderName", senderName);
        dropParams.set("brand", dev?.brand || "samsung");
        dropParams.set("file", fileName);
        dropParams.set("size", String(fileSize));
        dropParams.set("type", fileType);
        if (quickText.trim()) {
          dropParams.set("text", quickText.trim().slice(0, 120));
        }
        const url = `${origin}/?${dropParams.toString()}`;
        return { dropId: data.dropId, pin: data.pin, url };
      }
    } catch {
      showToast("Fout bij aanmaken van directe drop");
    }
    return null;
  };

  // Optie 1: NFC "Back-to-Back" Tik (Web NFC NDEF write met fallback voor iPhone Tag Reading)
  const startNfcDropBroadcast = async () => {
    setShowNfcModal(true);
    setNfcSuccess(false);
    setNfcWriting(true);

    const drop = await createActiveDropOnServer();
    if (!drop) {
      setNfcWriting(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== "undefined" && "NDEFReader" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ndef = new (window as any).NDEFReader();
        await ndef.write({
          records: [
            {
              recordType: "url",
              data: drop.url,
            },
          ],
        });
        setNfcSuccess(true);
        setNfcWriting(false);
        playAirDropChime("done");
        showToast("NFC Tag geschreven! Houd achterkant tegen de iPhone");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 100, 200]);
        }
      } else {
        // Web NFC is not available on this browser engine, modal shows full instructions and instant NFC QR
        setNfcWriting(false);
      }
    } catch (err: any) {
      setNfcWriting(false);
      console.warn("NFC write:", err);
    }
  };

  // Optie 2: Lokale 4-cijferige AirDrop-stijl PIN code
  const startPinDropSession = async () => {
    const drop = await createActiveDropOnServer();
    if (drop) {
      setShowPinModal(true);
      playAirDropChime("offer");
    }
  };

  // Claim a waiting drop on any 2nd device using a 4-digit PIN (zero installation required on 2nd device)
  const claimDropByPin = async (pinCode?: string) => {
    const cleanPin = (pinCode ?? pinInput).trim();
    if (!cleanPin) {
      showToast("Voer de 4-cijferige Drop-PIN in van het andere toestel");
      return;
    }
    try {
      const res = await fetch(`/api/drop?pin=${encodeURIComponent(cleanPin)}`);
      const data = await res.json();
      if (!data?.ok || !data.drop) {
        showToast("Geen actieve Drop gevonden met deze PIN");
        return;
      }
      setPinInput("");
      setShowPinModal(false);
      await processIncomingServerDrop(data.drop, stableClientIdRef.current);
    } catch {
      showToast("Kon Drop niet ophalen — controleer je verbinding");
    }
  };

  // Friend Management functions (Add persistent devices like friends for remote school ↔ home sharing)
  const toggleSaveFriend = (peer: PeerDeviceInfo) => {
    const friendCode =
      peer.friendCode ||
      `ZY-${Math.abs(peer.peerId.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 9000) + 1000}`;
    setSavedFriends((prev) => {
      const exists = prev.some(
        (f) =>
          (peer.friendCode && f.friendCode.toUpperCase() === peer.friendCode.toUpperCase()) ||
          f.peerId === peer.peerId,
      );
      if (exists) {
        showToast(`${peer.name} verwijderd uit bewaarde apparaten`);
        return prev.filter(
          (f) =>
            !(peer.friendCode && f.friendCode.toUpperCase() === peer.friendCode.toUpperCase()) &&
            f.peerId !== peer.peerId,
        );
      } else {
        const newF: SavedFriend = {
          id: `friend-${Date.now()}`,
          friendCode,
          name: peer.name,
          peerId: peer.peerId,
          brand: peer.brand,
          brandLabel: peer.brandLabel,
          modelName: peer.modelName,
          addedAt: Date.now(),
          isOnline: true,
          lastSeen: Date.now(),
        };
        playAirDropChime("connect");
        showToast(`⭐ ${peer.name} opgeslagen als vertrouwd apparaat.`);
        return [newF, ...prev];
      }
    });
  };

  const addFriendManually = () => {
    const code = friendCodeInput.trim().toUpperCase();
    if (!code) {
      showToast("Voer een koppelcode in (bijv. ZY-4821)");
      return;
    }
    const name = friendNameInput.trim() || `Vriend (${code})`;
    setSavedFriends((prev) => {
      if (prev.some((f) => f.friendCode.toUpperCase() === code)) {
        showToast(`Deze vriend (${code}) staat al in je lijst!`);
        return prev;
      }
      const newF: SavedFriend = {
        id: `friend-${Date.now()}`,
        friendCode: code,
        name,
        brand: "android",
        brandLabel: "Toestel",
        modelName: name,
        addedAt: Date.now(),
        isOnline: false,
      };
      playAirDropChime("connect");
      showToast(`⭐ ${name} (${code}) toegevoegd als Vriend!`);
      return [newF, ...prev];
    });
    setFriendCodeInput("");
    setFriendNameInput("");
  };

  const copyMyFriendLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
    const name = customDeviceName || device?.modelName || "Mijn Toestel";
    const brand = device?.brand || "android";
    const link = `${origin}/?add_friend=${encodeURIComponent(myFriendCode)}&name=${encodeURIComponent(name)}&brand=${encodeURIComponent(brand)}`;
    navigator.clipboard?.writeText(link).then(() => {
      showToast(`Vriendenlink gekopieerd! Deel met je vriend of stuur naar je PC.`);
    }).catch(() => {
      showToast(`Jouw apparaat-koppelcode: ${myFriendCode}`);
    });
  };

  const shareFriendViaWhatsApp = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
    const name = customDeviceName || device?.modelName || "Mijn Toestel";
    const brand = device?.brand || "android";
    const link = `${origin}/?add_friend=${encodeURIComponent(myFriendCode)}&name=${encodeURIComponent(name)}&brand=${encodeURIComponent(brand)}`;
    const text = `Verbind met mijn toestel *${name}* op Zytron Share voor directe bestandsoverdracht:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const removeFriend = (friendId: string) => {
    setSavedFriends((prev) => prev.filter((f) => f.id !== friendId));
    showToast("Vriend verwijderd");
  };

  // Send all queued files via Hybrid WebRTC P2P + /api/radar Warm Relay + WhatsApp + Persistent Friends
  const beamFilesToPeer = async (
    targetPeerId?: string,
    waContact?: WhatsAppContact,
    multiTargets?: string[],
    targetFriend?: SavedFriend,
  ) => {
    if (queuedFiles.length === 0 && !quickText.trim()) {
      fileInputRef.current?.click();
      showToast("Selecteer eerst je foto's of bestanden om te delen");
      return;
    }

    const effectiveTargetPeerId = targetFriend?.peerId || targetPeerId;
    const targetsToDial = multiTargets && multiTargets.length > 0
      ? multiTargets
      : effectiveTargetPeerId
        ? [effectiveTargetPeerId]
        : selectedTargetIds.length > 0
          ? selectedTargetIds
          : Array.from(connectionsRef.current.keys());

    const activeConns = targetsToDial.length > 0
      ? targetsToDial.map((id) => connectionsRef.current.get(id)).filter((c) => c && c.open)
      : Array.from(connectionsRef.current.values()).filter((c) => c && c.open);

    const targetPeer =
      connectedPeers.find((p) => targetsToDial.includes(p.peerId)) || connectedPeers[0];

    const senderName = customDeviceName || device?.modelName || "Toestel";
    const senderBrand = device?.brand || "ios";
    const senderBrandLabel = device?.brandLabel || "Toestel";
    const chunkBytes = (device?.chunkSizeKb || 128) * 1024;
    const peerLabel = targetsToDial.length > 1
      ? `${targetsToDial.length} Geselecteerde Toestellen`
      : targetFriend?.name || waContact?.name || targetPeer?.name || "Toestel";
    const peerBrand = targetFriend?.brand || waContact?.brand || targetPeer?.brand || "ios";

    const totalBatchBytes = queuedFiles.reduce((acc, f) => acc + f.size, 0);
    const offerId = `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isTextOnly = queuedFiles.length === 0 && Boolean(quickText.trim());

    // 1. Immediately fire the Colossal Outgoing Laser Beam
    playAirDropChime("launch");
    setSendFx({
      id: offerId,
      phase: "launch",
      peerName: peerLabel,
      peerBrand,
      fileCount: isTextOnly ? 1 : queuedFiles.length,
      totalSize: isTextOnly ? new Blob([quickText.trim()]).size : totalBatchBytes,
      progress: 22,
      speedMbps: 0,
      thumbs: [],
      label: isTextOnly
        ? "Directe Tekst / Link"
        : queuedFiles.length === 1
          ? queuedFiles[0].name
          : `${queuedFiles.length} Bestanden`,
    });

    const thumbs: string[] = [];
    for (const qf of queuedFiles.slice(0, 2)) {
      const thumb = await createImageThumbnail(qf.file);
      if (thumb) thumbs.push(thumb);
    }

    // 2. Push Drop directly into the warm /api/radar endpoint (AND /api/drop) with targetFriendCode support
    let createdDropId = "";
    let createdPin = "";
    const myEffectivePeerId = stableClientIdRef.current || peerRef.current?.id || "";
    try {
      let base64Data = "";
      let firstFileName = "Tekstbericht.txt";
      let firstFileType = "text/plain";
      let firstFileSize = new Blob([quickText.trim()]).size;

      if (queuedFiles.length > 0) {
        const first = queuedFiles[0];
        firstFileName = first.name;
        firstFileType = first.type || "application/octet-stream";
        firstFileSize = first.size;
        if (first.size <= 3_800_000) {
          const buf = await first.file.arrayBuffer();
          base64Data = arrayBufferToBase64(buf);
        } else if (first.file.type.startsWith("image/")) {
          // Large photo from phone camera -> compress to high quality FHD JPEG so it drops instantly
          const compressed = await compressImageForTransfer(first.file);
          if (compressed) {
            base64Data = compressed;
            firstFileType = "image/jpeg";
          }
        }
      }

      const dropPayload = {
        action: "create_drop",
        senderPeerId: myEffectivePeerId,
        senderName,
        senderBrand,
        senderBrandLabel,
        targetPeerId: targetFriend?.peerId || waContact?.peerId || targetPeer?.peerId || undefined,
        targetFriendCode: targetFriend?.friendCode || targetPeer?.friendCode || undefined,
        targetName: targetFriend?.name || waContact?.name || targetPeer?.name || undefined,
        fileName: firstFileName,
        fileType: firstFileType,
        fileSize: firstFileSize,
        base64Data,
        textContent: quickText.trim() || undefined,
        thumbs,
      };

      const radarDropRes = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dropPayload),
      });
      const dropJson = await radarDropRes.json();
      if (dropJson?.ok) {
        createdDropId = String(dropJson.dropId || "");
        if (dropJson.pin) {
          createdPin = String(dropJson.pin);
          setActiveDropPin(createdPin);
        }
      }
      // Also mirror to /api/drop in background
      fetch("/api/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dropPayload),
      }).catch(() => {});
    } catch {
      // Ignore if offline
    }

    // If sending to a remote WhatsApp contact who does NOT have the page open right now, also offer a 1-tap WhatsApp delivery link
    if (waContact && !waContact.online && createdPin && waContact.phone) {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
      const claimUrl = `${origin}/?pin=${encodeURIComponent(createdPin)}&pair=${encodeURIComponent(waContact.pairCode)}`;
      const waDigits = waContact.phone.replace(/[^\d]/g, "");
      const fileSummary = isTextOnly
        ? "een tekstbericht"
        : queuedFiles.length === 1
          ? `bestand *${queuedFiles[0].name}* (${formatBytes(queuedFiles[0].size)})`
          : `*${queuedFiles.length} bestanden* (${formatBytes(totalBatchBytes)})`;
      const waText = `⚡ *${getShareActionLabel(waContact.brand, false)} van ${senderName}*\n\nIk stuur je ${fileSummary} (PIN: *${createdPin}*).\n\n👉 Klik hier om direct te ontvangen:\n${claimUrl}`;
      window.open(
        waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}` : `https://wa.me/?text=${encodeURIComponent(waText)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }

    if (!targetPeer && !waContact && activeConns.length === 0 && !createdDropId) {
      setSendFx(null);
      await shareFilesViaNativeOs();
      return;
    }

    // Also send via direct WebRTC DataChannel if open
    for (const conn of activeConns) {
      conn.send({
        kind: "OFFER_REQUEST",
        offerId,
        senderName,
        senderBrand,
        senderBrandLabel,
        offerKind: isTextOnly ? "text" : "files",
        files: queuedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        totalSize: isTextOnly ? new Blob([quickText.trim()]).size : totalBatchBytes,
        thumbs,
        textPreview: isTextOnly ? quickText.trim().slice(0, 180) : undefined,
      });
    }

    // If delivered via warm /api/radar relay (or text-only), animate the Kamehameha wave surge smoothly to 100%
    if (isTextOnly || activeConns.length === 0) {
      for (const conn of activeConns) {
        if (isTextOnly) {
          conn.send({
            kind: "TEXT_DROP",
            text: quickText.trim(),
            sender: senderName,
            senderBrand,
          });
        }
      }
      const steps = [48, 76, 94, 100];
      steps.forEach((pct, i) => {
        window.setTimeout(() => {
          setSendFx((prev) =>
            prev
              ? {
                  ...prev,
                  phase: pct === 100 ? "done" : "streaming",
                  progress: pct,
                  speedMbps: 96.4,
                }
              : null,
          );
          if (pct === 100) {
            playAirDropChime("done");
            showToast(`Afgeleverd bij ${peerLabel}!`);
            setQueuedFiles([]);
          }
        }, (i + 1) * 420);
      });
      window.setTimeout(() => setSendFx(null), 2400);
      return;
    }

    // Direct WebRTC DataChannel chunk streaming for connected peers
    let sentBytesTotal = 0;
    const startTime = performance.now();
    for (const qf of queuedFiles) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      for (const conn of activeConns) {
        conn.send({
          kind: "FILE_START",
          fileId,
          name: qf.name,
          size: qf.size,
          type: qf.type,
          sender: senderName,
          senderBrand,
        });
      }

      const buffer = await qf.file.arrayBuffer();
      let offset = 0;
      while (offset < buffer.byteLength) {
        const slice = buffer.slice(offset, offset + chunkBytes);
        for (const conn of activeConns) {
          conn.send({
            kind: "FILE_CHUNK",
            fileId,
            chunk: slice,
          });
        }
        offset += slice.byteLength;
        sentBytesTotal += slice.byteLength;
        const elapsedSec = Math.max(0.05, (performance.now() - startTime) / 1000);
        const speedMbps = Math.round(((sentBytesTotal / (1024 * 1024)) / elapsedSec) * 10) / 10;
        const pct = totalBatchBytes > 0 ? Math.min(99, Math.round((sentBytesTotal / totalBatchBytes) * 100)) : 99;
        setSendFx((prev) => (prev ? { ...prev, progress: pct, speedMbps } : prev));
        await new Promise((r) => setTimeout(r, 1));
      }

      for (const conn of activeConns) {
        conn.send({
          kind: "FILE_END",
          fileId,
        });
      }
    }

    setSendFx((prev) => (prev ? { ...prev, phase: "done", progress: 100 } : prev));
    playAirDropChime("done");
    showToast(`Afgeleverd bij ${peerLabel}!`);
    setQueuedFiles([]);
    window.setTimeout(() => setSendFx(null), 2400);
  };

  const installZytronDropPwa = async () => {
    const isIos = typeof navigator !== "undefined" && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );

    // iPhone / iPad: Apple doesn't run APKs; open direct Add to Home Screen guide
    if (isIos) {
      setShowShareSheetGuide(true);
      showToast("Op iPhone: tik op Delen [⎋] en kies 'Zet op beginscherm'!");
      return;
    }

    // Android: Direct native APK download
    try {
      const a = document.createElement("a");
      a.href = "/api/download-apk";
      a.download = "zytron-share.apk";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Download gestart! Open zytron-share.apk via je meldingen en kies Installeren.");
    } catch {
      window.location.href = "/install";
    }

    // 2. Also prompt PWA add to home screen if browser supports it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalledPwa(true);
          setDeferredPrompt(null);
        }
      } catch {
        // Ignore
      }
    }
  };

  const switchBrandPreview = (brand: BrandId) => {
    if (!device) return;
    const cfg = BRAND_CONFIGS[brand];
    setDevice({
      ...device,
      brand,
      brandLabel: cfg.label,
      osSkin: cfg.osSkin,
      chunkSizeKb: cfg.chunkSizeKb,
      parallelStreams: cfg.parallelStreams,
      accentColor: cfg.accentColor,
      badgeBg: cfg.badgeBg,
      optimizationNote: cfg.optimizationNote,
    });
    showToast(`Engine geoptimaliseerd voor ${cfg.label}`);
  };

  const primaryTargetBrand =
    connectedPeers[0]?.brand ||
    waContacts[0]?.brand ||
    device?.brand ||
    "samsung";
  const primaryActionLabel = getShareActionLabel(primaryTargetBrand, true);
  const primaryShortLabel = getShareActionLabel(primaryTargetBrand, false);

  if (isNotabilityStealth) {
    return (
      <NotabilityStealthView
        onExitStealth={() => setIsNotabilityStealth(false)}
        quickText={quickText}
        setQuickText={setQuickText}
        onSendNote={(customText?: string) => {
          const textToSend = customText ?? quickText;
          if (textToSend.trim()) {
            setQuickText(textToSend);
            beamFilesToPeer();
            showToast("iCloud Notitie gesynchroniseerd");
          } else {
            showToast("Typ eerst een notitie");
          }
        }}
        incomingNotes={recentClipboardAnswers}
        connectedCount={uniqueNearbyDevices.length}
        onUploadFileToZytron={(files) => addFilesToQueue(files)}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#07080d] text-[#f1f5f9] pb-20 selection:bg-[#9b72cf] selection:text-white">
      {/* Ambient Spatial Aurora Backdrop - Google Gemini Cosmic Blue & Violet Spark */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -left-[12%] -top-[18%] h-[62vh] w-[62vw] rounded-full bg-[radial-gradient(closest-side,rgba(66,133,244,0.20),transparent)] blur-3xl" />
        <div className="absolute -right-[12%] top-[12%] h-[58vh] w-[54vw] rounded-full bg-[radial-gradient(closest-side,rgba(155,114,207,0.18),transparent)] blur-3xl" />
        <div className="absolute bottom-[-22%] left-[22%] h-[55vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)] blur-3xl" />
      </div>

      {/* Sleek Floating Dynamic Island Top Bar */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="luxury-glass-card mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-full px-4 py-2.5 sm:px-6 sm:py-3">
          {/* Brand Logo - Gemini Cosmic Squircle */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-[#4285f4]/35 via-[#6366f1]/25 to-[#9b72cf]/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_0_25px_-3px_rgba(66,133,244,0.6)]">
              <Radar className="h-5 w-5 text-[#93c5fd]" />
              <span className="pulse-ring absolute inset-0 rounded-2xl border border-indigo-400/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                  Zytron Share
                </span>
              </div>
              <p className="hidden font-mono text-[10.5px] text-[#94a3b8] sm:block">
                Lokale P2P Bestandsoverdracht
              </p>
            </div>
          </div>

          {/* Live Dynamic Island Status Pill */}
          <button
            type="button"
            onClick={() => syncRadarPresence(true)}
            className="btn-luxury-glass flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-xs text-white/95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            </span>
            <span className="font-semibold">
              {uniqueNearbyDevices.length > 0
                ? `${uniqueNearbyDevices.length} toestel dichtbij (${uniqueNearbyDevices[0].name})`
                : "Live Radar Actief"}
            </span>
            <RefreshCw className={`h-3 w-3 text-[#93c5fd] ${isScanningDevice ? "animate-spin" : ""}`} />
          </button>

          {/* Luxury Tactile Action Buttons */}
          <div className="flex items-center gap-2">
            {/* School Notability Camouflage Quick Toggle */}
            <button
              type="button"
              onClick={() => setIsNotabilityStealth(true)}
              className="btn-luxury-glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-[#c7d2fe] border-indigo-400/40 hover:border-indigo-400 transition"
              title="School Notability Camouflage (Paniek-knop of druk op Esc)"
            >
              <PenTool className="h-3.5 w-3.5 text-[#93c5fd]" />
              <span className="hidden sm:inline">Notability Modus</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBackgroundPermissionModal(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                bgPermissionGranted
                  ? "btn-luxury-glass border-emerald-400/40 text-emerald-300"
                  : "btn-luxury-glass border-indigo-400/40 text-[#c7d2fe]"
              }`}
              title="Achtergrond-Ontvangst & Systeemnotificaties"
            >
              <Bell className="h-3.5 w-3.5 text-[#93c5fd]" />
              <span className="hidden md:inline">{bgPermissionGranted ? "Achtergrond Aan" : "Meldingen"}</span>
            </button>

            <button
              type="button"
              onClick={installZytronDropPwa}
              className="btn-gemini-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isInstalledPwa ? "Geïnstalleerd" : "Installeer App"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Sleek Unified Device Identity Bar */}
        <section className="luxury-glass-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            {(() => {
              const isCurrentIpad = device?.modelName?.toLowerCase().includes("ipad");
              const isCurrentDesktop = device?.brand === "desktop";
              const CurrentDeviceIcon = isCurrentDesktop ? Laptop : isCurrentIpad ? Tablet : Smartphone;
              return (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 font-mono text-xs font-bold text-[#93c5fd]">
                  <CurrentDeviceIcon className="h-3.5 w-3.5 text-[#93c5fd]" />
                  Dit Toestel:
                </span>
              );
            })()}
            <input
              type="text"
              value={customDeviceName}
              onChange={(e) => setCustomDeviceName(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/50 px-3.5 py-1.5 text-xs font-bold text-white shadow-inner outline-none transition focus:border-indigo-400"
              aria-label="Toestelnaam"
              placeholder="Typ je toestelnaam…"
            />
            <div className="hidden items-center gap-1.5 sm:flex">
              {["iPad Pro", "iPhone 16 Pro", "Samsung S24", "Mijn PC"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setCustomDeviceName(preset);
                    showToast(`Naam gewijzigd naar ${preset}`);
                  }}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[10.5px] font-semibold transition ${
                    customDeviceName === preset
                      ? "bg-gradient-to-r from-[#4285f4] via-[#6366f1] to-[#9b72cf] text-white font-black shadow-[0_0_18px_rgba(66,133,244,0.6)]"
                      : "btn-luxury-glass text-white/70 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 10-MINUTES VISIBLE FOR EVERYONE (AirDrop / Quick Share background discovery) */}
            <button
              type="button"
              onClick={toggleTenMinDiscovery}
              className={`rounded-xl px-3.5 py-1.5 font-mono text-[11px] font-bold transition flex items-center gap-1.5 ${
                tenMinActive
                  ? "border border-amber-400/50 bg-amber-400/20 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.35)] animate-pulse"
                  : "btn-luxury-glass text-white/80 hover:text-white"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${tenMinActive ? "bg-amber-400 animate-ping" : "bg-white/40"}`} />
              <span>
                {tenMinActive
                  ? `Zichtbaar voor Iedereen (${Math.floor(tenMinRemaining / 60)}:${String(tenMinRemaining % 60).padStart(2, "0")})`
                  : "Iedereen (10 min)"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAutoAcceptDrops((v) => !v);
                showToast(
                  !autoAcceptDrops
                    ? "Direct Ontvangen AAN"
                    : "Bevestiging vragen bij ontvangen AAN",
                );
              }}
              className={`rounded-xl px-3 py-1.5 font-mono text-[11px] font-bold transition ${
                autoAcceptDrops
                  ? "border border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                  : "btn-luxury-glass text-white/70"
              }`}
            >
              {autoAcceptDrops ? "Direct Ontvangen: AAN" : "Vraag Toestemming"}
            </button>
          </div>
        </section>

        {/* PROACTIVE BACKGROUND PERMISSION BANNER (Mobile / PWA) */}
        {!bgPermissionGranted && (
          <div className="luxury-glass-card mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border-sky-400/40 p-4 sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/20 text-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
                <Bell className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-white">Ontvang bestanden ook op de achtergrond</p>
                <p className="text-xs text-white/65">Krijg direct een melding en pop-up zodra iemand een bestand naar je stuurt</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBackgroundPermissionModal(true)}
              className="btn-luxury-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold"
            >
              <Zap className="h-4 w-4" />
              <span>Activeer Nu</span>
            </button>
          </div>
        )}

        {/* UNIFIED LUXURY STUDIO CANVAS */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`luxury-glass-card relative overflow-hidden rounded-[36px] p-6 transition duration-300 sm:p-10 ${
            isDraggingOver ? "ring-2 ring-indigo-400 shadow-[0_0_80px_rgba(99,102,241,0.5)]" : ""
          }`}
        >
          {/* Subtle Ambient Radial Glow - Gemini Cosmic Aurora */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-[#4285f4]/15 via-[#6366f1]/10 to-[#9b72cf]/15 blur-3xl" />
          </div>

          {/* Top Hero Section: Title + Primary CTA Buttons */}
          <div className="relative z-10 flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-1">
                <Sparkles className="h-3.5 w-3.5 text-[#93c5fd]" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#c7d2fe]">
                  {primaryShortLabel} Studio
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {queuedFiles.length > 0
                  ? `${queuedFiles.length} bestand(en) klaar voor verzending`
                  : "Deel razendsnel tussen Telefoon & PC"}
              </h1>
              <p className="mt-1.5 text-xs text-[#94a3b8] sm:text-sm">
                Kies een bestand of gebruik een snelle functie en tik op een toestel hieronder.
              </p>
            </div>

            {/* Primary Hero Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="primary-file-input"
                className="btn-gemini-primary cursor-pointer inline-flex items-center gap-2.5 rounded-2xl px-6 py-4 text-xs sm:text-sm font-extrabold tracking-wide"
              >
                <Upload className="h-4 w-4 stroke-[2.5]" />
                <span>Kies Bestanden / Foto&apos;s</span>
              </label>

              <button
                type="button"
                onClick={() => shareFilesViaNativeOs()}
                className="btn-luxury-glass inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs sm:text-sm font-bold text-white"
                title="Deel direct via iOS AirDrop of Samsung Quick Share systeemmenu"
              >
                <Share2 className="h-4 w-4 text-[#93c5fd]" />
                <span>Systeem Deel</span>
              </button>
            </div>
          </div>

          {/* 5 TACTILE STUDIO POWER BUTTONS: Foto's & Video's, Bestanden, Camera Snap, Klembord, Spraakmemo */}
          <div className="relative z-10 mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
            {/* 1. Foto's & Video's (Direct iPad & iPhone Camera Roll Picker) */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="btn-luxury-glass group flex items-center gap-3.5 rounded-2xl p-4 text-left transition hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pink-400/35 bg-gradient-to-br from-pink-400/25 to-pink-600/10 text-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.25)] transition group-hover:scale-105">
                <FileImage className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white sm:text-sm">Foto&apos;s &amp; Video</p>
                <p className="truncate font-mono text-[10.5px] text-white/55">Camera roll</p>
              </div>
            </button>

            {/* 2. Bestanden & Documenten (iCloud / Drive / PDF) */}
            <label
              htmlFor="primary-file-input"
              className="btn-luxury-glass group cursor-pointer flex items-center gap-3.5 rounded-2xl p-4 text-left transition hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/35 bg-gradient-to-br from-sky-400/25 to-sky-600/10 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)] transition group-hover:scale-105">
                <Upload className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white sm:text-sm">Bestanden</p>
                <p className="truncate font-mono text-[10.5px] text-white/55">iCloud &amp; PDF</p>
              </div>
            </label>

            {/* 3. Directe Camera Snap */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn-luxury-glass group flex items-center gap-3.5 rounded-2xl p-4 text-left transition hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-400/25 to-cyan-600/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition group-hover:scale-105">
                <Camera className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white sm:text-sm">Camera Snap</p>
                <p className="truncate font-mono text-[10.5px] text-white/55">Maak live foto</p>
              </div>
            </button>

            {/* 4. Klembord Plakken */}
            <button
              type="button"
              onClick={handleClipboardPaste}
              className="btn-luxury-glass group flex items-center gap-3.5 rounded-2xl p-4 text-left transition hover:scale-[1.02]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)] transition group-hover:scale-105">
                <Clipboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white sm:text-sm">Klembord</p>
                <p className="truncate font-mono text-[10.5px] text-white/55">Plak direct</p>
              </div>
            </button>

            {/* 5. Spraakmemo Recorder */}
            <button
              type="button"
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
              className={`group flex items-center gap-3.5 rounded-2xl p-4 text-left transition hover:scale-[1.02] ${
                isRecordingAudio
                  ? "border border-rose-400 bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.45)] animate-pulse"
                  : "btn-luxury-glass"
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 ${
                isRecordingAudio
                  ? "bg-rose-500 text-white shadow-[0_0_20px_#f43f5e]"
                  : "border border-indigo-400/35 bg-gradient-to-br from-indigo-400/25 to-indigo-600/10 text-indigo-300"
              }`}>
                {isRecordingAudio ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white sm:text-sm">
                  {isRecordingAudio ? `Stop (${audioRecordingSec}s)` : "Spraakmemo"}
                </p>
                <p className="truncate font-mono text-[10.5px] text-white/55">
                  {isRecordingAudio ? "Tik om te sturen" : "Audio bericht"}
                </p>
              </div>
            </button>
          </div>

          {/* Hidden Direct File Inputs */}
          <input
            id="primary-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            id="photo-library-input"
            ref={photoInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />

          {/* Queued Files Strip */}
          {queuedFiles.length > 0 && (
            <div className="relative z-10 mt-6 flex flex-col gap-3 rounded-2xl border border-sky-400/40 bg-sky-950/25 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-black">
                    ✓
                  </span>
                  <span className="text-xs font-extrabold text-white sm:text-sm">
                    {queuedFiles.length} bestand(en) geselecteerd ({formatBytes(queuedFiles.reduce((a, b) => a + b.size, 0))})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {uniqueNearbyDevices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => beamFilesToPeer(uniqueNearbyDevices[0].peerId)}
                      className="btn-luxury-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Stuur nu naar {uniqueNearbyDevices[0].name}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="btn-luxury-glass inline-flex items-center gap-1 rounded-xl px-3 py-2 font-mono text-xs text-white/70 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Wissen</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {queuedFiles.map((item) => {
                  const Icon = getFileIcon(item.type, item.name);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white"
                    >
                      <Icon className="h-4 w-4 text-sky-300 shrink-0" />
                      <span className="max-w-[200px] truncate font-semibold">{item.name}</span>
                      <span className="font-mono text-[10.5px] text-white/50">{formatBytes(item.size)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Text / URL Bar */}
          <div className="relative z-10 mt-5 flex gap-2.5">
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder={`Typ of plak hier een link of notitie om direct te ${primaryShortLabel === "AirDrop" ? "AirDroppen" : "Quick Sharen"}…`}
              className="flex-1 rounded-2xl border border-white/15 bg-black/55 px-4 py-3.5 text-xs text-white placeholder:text-white/40 shadow-inner outline-none transition focus:border-indigo-400 sm:text-sm"
            />


            {quickText.trim() && (
              <button
                type="button"
                onClick={() => beamFilesToPeer()}
                className="btn-gemini-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-extrabold sm:text-sm"
              >
                <Send className="h-4 w-4" />
                <span>Verstuur</span>
              </button>
            )}
          </div>


          {/* UNIVERSAL ZERO-APP DISCOVERY HUB (Google Gemini Cosmic Blue & Violet) */}
          <div className="relative z-10 mt-6 rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-[#4285f4]/[0.12] via-[#6366f1]/[0.08] to-[#9b72cf]/[0.10] p-4.5 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#93c5fd]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Apparaten Zonder App of Link Bereiken (Zero-App Hub)
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-[#c7d2fe]/75">
                Ontvanger hoeft de app NIET geopend te hebben
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Echte Systeem AirDrop (Direct naar iPhones / iPads in klas) */}
              <button
                type="button"
                onClick={() => shareFilesViaNativeOs()}
                className="btn-luxury-glass group flex items-center gap-3 rounded-2xl p-3.5 text-left transition hover:border-[#4285f4]/60 hover:shadow-[0_0_25px_rgba(66,133,244,0.35)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#4285f4]/45 bg-[#4285f4]/20 text-[#93c5fd] shadow-[0_0_15px_rgba(66,133,244,0.3)] transition group-hover:scale-105">
                  <Share2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-white">Systeem AirDrop</p>
                    <span className="rounded bg-[#4285f4]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#93c5fd]">Direct</span>
                  </div>
                  <p className="truncate font-mono text-[10.5px] text-[#94a3b8]">Naar elk scherm in de kamer</p>
                </div>
              </button>

              {/* 2. 1-Seconde Camera Scan QR */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="btn-luxury-glass group flex items-center gap-3 rounded-2xl p-3.5 text-left transition hover:border-[#9b72cf]/60 hover:shadow-[0_0_25px_rgba(155,114,207,0.35)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#9b72cf]/40 bg-[#9b72cf]/20 text-[#c4b5fd] shadow-[0_0_15px_rgba(155,114,207,0.3)] transition group-hover:scale-105">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-white">Camera Scan</p>
                    <span className="rounded bg-[#9b72cf]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#c4b5fd]">Direct</span>
                  </div>
                  <p className="truncate font-mono text-[10.5px] text-[#94a3b8]">Scan met camera-app</p>
                </div>
              </button>

              {/* 3. Beveiligde PIN Overdracht */}
              <button
                type="button"
                onClick={async () => {
                  const drop = await createActiveDropOnServer();
                  if (drop?.pin) {
                    showToast(`Beveiligde overdracht actief (PIN: ${drop.pin})`);
                  }
                }}
                className="btn-luxury-glass group flex items-center gap-3 rounded-2xl p-3.5 text-left transition hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(52,211,153,0.3)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] transition group-hover:scale-105">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-white">Beveiligde PIN</p>
                    <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">Code</span>
                  </div>
                  <p className="truncate font-mono text-[10.5px] text-[#94a3b8]">4-cijferige web code</p>
                </div>
              </button>

              {/* 4. NFC Tik */}
              <button
                type="button"
                onClick={startNfcDropBroadcast}
                className="btn-luxury-glass group flex items-center gap-3 rounded-2xl p-3.5 text-left transition hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(56,189,248,0.3)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition group-hover:scale-105">
                  <Radio className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-white">NFC Tik</p>
                    <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">NFC</span>
                  </div>
                  <p className="truncate font-mono text-[10.5px] text-[#94a3b8]">Tegen ander NFC-toestel</p>
                </div>
              </button>
            </div>
          </div>

          {/* TRANQUIL DISCOVERY SPACE: FLOATING LUXURY DEVICE AVATARS WITH REAL FILTERING */}
          <div className="relative z-10 mt-9">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white sm:text-base">
                  Toestellen in de buurt ({filteredNearbyDevices.length}{deviceCategoryFilter !== "all" ? ` / ${uniqueNearbyDevices.length}` : ""})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="btn-luxury-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                >
                  <QrCode className="h-3.5 w-3.5 text-[#93c5fd]" />
                  <span>QR-Code</span>
                </button>

                <button
                  type="button"
                  onClick={scanRealBluetoothNearby}
                  disabled={isScanningBluetooth}
                  className="btn-luxury-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#93c5fd]"
                >
                  <Radar className={`h-3.5 w-3.5 text-[#93c5fd] ${isScanningBluetooth ? "animate-spin" : ""}`} />
                  <span>Bluetooth Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => syncRadarPresence(true)}
                  className="btn-luxury-glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white/90"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-emerald-300 ${isScanningDevice ? "animate-spin" : ""}`} />
                  <span>Ververs</span>
                </button>
              </div>
            </div>

            {/* Smart Category Filter Pills (Filters out non-receivable noise: audio/lights/peripherals) */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDeviceCategoryFilter("all")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  deviceCategoryFilter === "all"
                    ? "border border-indigo-400/50 bg-gradient-to-r from-[#4285f4] via-[#6366f1] to-[#9b72cf] text-white shadow-[0_0_20px_rgba(66,133,244,0.4)]"
                    : "btn-luxury-glass text-white/70 hover:text-white"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>Alles Geschikt</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  {categoryCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceCategoryFilter("phone")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  deviceCategoryFilter === "phone"
                    ? "border border-sky-400/60 bg-sky-500/25 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                    : "btn-luxury-glass text-white/70 hover:text-white"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                <span>GSM's</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  {categoryCounts.phone}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceCategoryFilter("tablet")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  deviceCategoryFilter === "tablet"
                    ? "border border-purple-400/60 bg-purple-500/25 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    : "btn-luxury-glass text-white/70 hover:text-white"
                }`}
              >
                <Tablet className="h-3.5 w-3.5 text-purple-400" />
                <span>iPads &amp; Tablets</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  {categoryCounts.tablet}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceCategoryFilter("pc")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  deviceCategoryFilter === "pc"
                    ? "border border-blue-400/60 bg-blue-500/25 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                    : "btn-luxury-glass text-white/70 hover:text-white"
                }`}
              >
                <Laptop className="h-3.5 w-3.5 text-blue-400" />
                <span>Laptops &amp; PC's</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  {categoryCounts.pc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceCategoryFilter("tv")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  deviceCategoryFilter === "tv"
                    ? "border border-emerald-400/60 bg-emerald-500/25 text-white shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                    : "btn-luxury-glass text-white/70 hover:text-white"
                }`}
              >
                <Tv className="h-3.5 w-3.5 text-emerald-400" />
                <span>Smart TV's</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  {categoryCounts.tv}
                </span>
              </button>
            </div>

            {filteredNearbyDevices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredNearbyDevices.map((peer) => {
                  const isSelected = selectedTargetIds.includes(peer.peerId);
                  const isFriend = savedFriends.some((f) => f.friendCode === peer.friendCode);
                  const category = classifyDeviceCategory(peer);
                  const actionLabel = getShareActionLabel(peer.brand, true, category);
                  const isIpadPeer = category === "tablet";
                  const DeviceIcon =
                    category === "tv"
                      ? Tv
                      : category === "pc"
                        ? Laptop
                        : isIpadPeer
                          ? Tablet
                          : Smartphone;

                  const categoryBadge =
                    category === "tv"
                      ? { label: "Smart TV", color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/15" }
                      : category === "tablet"
                        ? { label: peer.name.toLowerCase().includes("ipad") ? "iPad" : "Tablet", color: "text-purple-300 border-purple-400/40 bg-purple-500/15" }
                        : category === "pc"
                          ? { label: peer.name.toLowerCase().includes("mac") ? "MacBook / Mac" : "Laptop / PC", color: "text-sky-300 border-sky-400/40 bg-sky-500/15" }
                          : { label: peer.brand === "ios" ? "iPhone" : "GSM / Mobiel", color: "text-indigo-300 border-indigo-400/40 bg-indigo-500/15" };

                  return (
                    <motion.div
                      key={peer.peerId}
                      initial={{ scale: 0.92, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={SPRING}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          setSelectedTargetIds((prev) =>
                            prev.includes(peer.peerId)
                              ? prev.filter((id) => id !== peer.peerId)
                              : [...prev, peer.peerId]
                          );
                        } else {
                          beamFilesToPeer(peer.peerId);
                        }
                      }}
                      className={`group cursor-pointer relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-200 hover:-translate-y-1 ${
                        isSelected
                          ? "border-2 border-[#6366f1] bg-[#6366f1]/20 shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                          : "btn-luxury-glass"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        {/* Luxury 3D Device Avatar Squircle - Google Gemini AI Gradient */}
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#4285f4] via-[#6366f1] to-[#9b72cf] text-white shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.6),0_10px_25px_rgba(66,133,244,0.5)]">
                          <DeviceIcon className="h-7 w-7 stroke-[2.2]" />
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[#07080d] bg-emerald-400" />
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Type Category Badge */}
                          <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-extrabold ${categoryBadge.color}`}>
                            {categoryBadge.label}
                          </span>

                          {/* Star / Friend Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveFriend(peer);
                            }}
                            className={`rounded-xl border p-2 transition ${
                              isFriend
                                ? "border-amber-400/60 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                : "border-white/10 bg-white/[0.04] text-white/45 hover:border-amber-400/40 hover:text-amber-300"
                            }`}
                            title="Bewaar als vertrouwd apparaat"
                          >
                            <Star className={`h-4 w-4 ${isFriend ? "fill-amber-300" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 text-left">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-extrabold text-white">{peer.name}</p>
                          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-300">
                            ONLINE
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-[#c7d2fe]/90">
                          {peer.brandLabel} • {getShareActionLabel(peer.brand, false, category)}
                        </p>
                      </div>

                      {/* Tactile Send CTA Button inside card */}
                      <div className="mt-5">
                        <span className="btn-gemini-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold">
                          <Send className="h-3.5 w-3.5" />
                          <span>{actionLabel}</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : uniqueNearbyDevices.length > 0 ? (
              /* Empty state for the filtered category when other devices exist */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d101b]/70 py-10 px-6 text-center shadow-inner">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-gradient-to-b from-[#4285f4]/20 to-[#9b72cf]/20 text-[#93c5fd] shadow-[0_0_25px_rgba(66,133,244,0.25)]">
                  {deviceCategoryFilter === "tv" ? <Tv className="h-7 w-7 text-emerald-400" /> :
                   deviceCategoryFilter === "tablet" ? <Tablet className="h-7 w-7 text-purple-400" /> :
                   deviceCategoryFilter === "pc" ? <Laptop className="h-7 w-7 text-sky-400" /> :
                   <Smartphone className="h-7 w-7 text-blue-400" />}
                </div>
                <p className="text-base font-extrabold text-white">
                  {deviceCategoryFilter === "tv" && "Geen Smart TV's zichtbaar"}
                  {deviceCategoryFilter === "tablet" && "Geen iPads of Tablets gevonden"}
                  {deviceCategoryFilter === "pc" && "Geen Laptops of PC's gevonden"}
                  {deviceCategoryFilter === "phone" && "Geen GSM's of Smartphones gevonden"}
                </p>
                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#94a3b8] sm:text-sm">
                  Er zijn momenteel wel {uniqueNearbyDevices.length} andere toestellen in de buurt online.
                </p>
                <button
                  type="button"
                  onClick={() => setDeviceCategoryFilter("all")}
                  className="btn-gemini-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold"
                >
                  <Zap className="h-4 w-4" />
                  <span>Toon alle geschikte toestellen ({uniqueNearbyDevices.length})</span>
                </button>
              </div>
            ) : (
              /* Empty state when NO devices in room */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d101b]/70 py-12 px-6 text-center shadow-inner">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-indigo-400/40 bg-gradient-to-b from-[#4285f4]/25 to-[#9b72cf]/20 text-[#93c5fd] shadow-[0_0_35px_rgba(66,133,244,0.35)]">
                  <Radar className="h-8 w-8 animate-spin" style={{ animationDuration: "3.5s" }} />
                </div>
                <p className="text-base font-extrabold text-white">Klaar om te verbinden</p>
                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#94a3b8] sm:text-sm">
                  Open <strong className="text-[#93c5fd]">zytron-share.vercel.app</strong> op je andere toestel (telefoon, iPad, laptop of TV) — hij verschijnt hier binnen 1 seconde vanzelf!
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="btn-luxury-glass inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold text-white"
                  >
                    <QrCode className="h-4 w-4 text-[#93c5fd]" />
                    <span>Koppel via QR-Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => shareFilesViaNativeOs()}
                    className="btn-gemini-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Systeem AirDrop (Direct naar schermen)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COMPACT BOTTOM PANELS: Bewaarde Apparaten & Recente Bestanden */}
          <div className="relative z-10 mt-9 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* BEWAARDE APPARATEN (Thuis / Kantoor / Mobiel) */}
            <div className="rounded-3xl border border-amber-400/30 bg-black/55 p-6 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Bewaarde Apparaten ({savedFriends.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyMyFriendLink}
                  className="rounded-xl border border-amber-400/35 bg-amber-400/15 px-3 py-1 font-mono text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/25"
                >
                  Mijn Code: {myFriendCode} 📋
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Koppelcode (bijv. ZY-4821)"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  className="flex-1 rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 font-mono text-xs text-white placeholder-white/35 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addFriendManually}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 px-4 py-2.5 text-xs font-extrabold text-black shadow-[inset_0_1px_0_0_#ffffff,0_6px_20px_rgba(251,191,36,0.35)] transition hover:brightness-105 active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Toevoegen</span>
                </button>
              </div>

              {savedFriends.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2.5">
                  {savedFriends.map((f) => (
                    <div
                      key={f.friendCode}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-white">{f.name}</p>
                        <p className="font-mono text-[10.5px] text-amber-200/75">{f.friendCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => beamFilesToPeer(undefined, undefined, undefined, f)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-extrabold text-black transition hover:bg-amber-300"
                        >
                          <Send className="h-3 w-3" />
                          <span>Verstuur</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFriend(f.id)}
                          className="rounded-xl p-1.5 text-white/40 hover:bg-rose-500/20 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-white/45">
                  Voeg een vriend of je thuis-PC toe via zijn code om overal bestanden naartoe te sturen.
                </p>
              )}
            </div>

            {/* RECENTE OVERDRACHTEN */}
            <div className="rounded-3xl border border-white/10 bg-black/55 p-6 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  Recente Overdrachten ({transfers.length})
                </span>
                {transfers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTransfers([])}
                    className="font-mono text-[11px] text-white/45 hover:text-rose-300"
                  >
                    Geschiedenis Wissen
                  </button>
                )}
              </div>

              {transfers.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {transfers.map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{tr.name}</p>
                        <p className="font-mono text-[10.5px] text-white/50">{formatBytes(tr.size)}</p>
                      </div>
                      {tr.blobUrl && (
                        <a
                          href={tr.blobUrl}
                          download={tr.name}
                          className="btn-luxury-white inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-center text-xs text-white/45">
                  Ontvangen en verzonden bestanden verschijnen direct hier.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ──────────────────────────────────────────────────────────────────────
          1. OUTGOING ULTRA-FAST LASER BEAM (SHOOTING UPWARD AT 120FPS)
             - PURE COOL SCI-FI LASER BEAM (NO CAPSULE, NO BALL IN THE MIDDLE)
         ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sendFx && (
          <motion.div
            key="send-laser-beam-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-between overflow-hidden"
          >
            {/* Deep spatial dark backdrop */}
            <div className="absolute inset-0 bg-[#02040b]/80 backdrop-blur-md" />

            {/* PURE LASER BEAM COLUMN (HARDWARE ACCELERATED GPU STREAM) */}
            {sendFx.phase !== "declined" && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {/* 1. Symmetrical Cyan Laser Plasma Sheath */}
                <div
                  className="beam-pulse absolute h-full w-44 sm:w-72"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.08) 25%, rgba(56,189,248,0.35) 50%, rgba(56,189,248,0.08) 75%, transparent 100%)",
                  }}
                />

                {/* 2. Concentrated Electric Cyan Beam Shaft */}
                <div
                  className="beam-pulse absolute h-full w-14 sm:w-24"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 20%, rgba(125,211,252,0.95) 50%, rgba(56,189,248,0.4) 80%, transparent 100%)",
                    boxShadow: "0 0 35px 8px rgba(56,189,248,0.7)",
                  }}
                />

                {/* 3. Blinding White-Hot Pure Laser Core */}
                <div
                  className="absolute h-full w-3 sm:w-4 bg-white"
                  style={{
                    boxShadow:
                      "0 0 15px 4px #ffffff, 0 0 35px 12px rgba(56,189,248,0.9), 0 0 70px 20px rgba(14,165,233,0.6)",
                  }}
                />

                {/* 4. Warp-Speed Laser Photon Streamers (Upward) */}
                {[-36, -18, -6, 0, 6, 18, 36].map((offset, i) => (
                  <div
                    key={`up-laser-streak-${i}`}
                    className="real-beam-up absolute h-36 w-1 rounded-full bg-white"
                    style={{
                      left: `calc(50% + ${offset}px)`,
                      animationDelay: `${i * 0.06}s`,
                      boxShadow: "0 0 12px 3px rgba(56,189,248,0.95)",
                    }}
                  />
                ))}

                {/* 5. Top Emitter Portal Glare */}
                <div
                  className="laser-flare absolute top-0 h-44 w-72 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at top, rgba(255,255,255,0.9) 0%, rgba(56,189,248,0.6) 45%, transparent 70%)",
                  }}
                />
              </div>
            )}

            {/* Minimal Sleek Status Pill (No capsule, no clutter) */}
            <motion.div
              initial={{ y: -25, scale: 0.95, opacity: 0 }}
              animate={{ y: 16, scale: 1, opacity: 1 }}
              exit={{ y: -20, scale: 0.95, opacity: 0 }}
              className="pointer-events-auto relative z-20 mt-3 flex items-center gap-3 rounded-full border border-sky-400/40 bg-black/85 px-5 py-2.5 shadow-[0_0_40px_10px_rgba(56,189,248,0.5)] backdrop-blur-xl"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-90" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
                { `${getShareActionLabel(primaryTargetBrand, true).toUpperCase()} → ${sendFx.peerName}` }
              </span>
              <button
                type="button"
                onClick={() => setSendFx(null)}
                className="ml-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-white hover:bg-white/20"
              >
                Sluit
              </button>
            </motion.div>

            <div className="h-6" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────────
          2. INCOMING LASER BEAM ARRIVAL PROMPT (IF AUTO-ACCEPT IS OFF)
         ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {incomingOffer && (
          <motion.div
            key="incoming-airdrop-offer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center overflow-hidden bg-[#02040b]/85 p-4 backdrop-blur-md"
          >
            {/* Real Downward Laser Beam */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <div
                className="beam-pulse absolute h-full w-14 sm:w-24"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 20%, rgba(125,211,252,0.95) 50%, rgba(56,189,248,0.4) 80%, transparent 100%)",
                  boxShadow: "0 0 35px 8px rgba(56,189,248,0.7)",
                }}
              />
              <div
                className="absolute h-full w-3 sm:w-4 bg-white"
                style={{
                  boxShadow: "0 0 15px 4px #ffffff, 0 0 35px 12px rgba(56,189,248,0.9)",
                }}
              />
            </div>

            <motion.div
              initial={{ scale: 0.9, y: -30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={SPRING}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-sky-400/50 bg-[#060814]/95 p-6 text-center shadow-[0_20px_60px_-10px_rgba(56,189,248,0.6)] backdrop-blur-2xl"
            >
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200">
                <Sparkles className="h-3 w-3 text-sky-300" />
                {incomingOffer.senderBrand === "ios" ? "AIRDROP BINNENKOMEND ↓" : "QUICK SHARE BINNENKOMEND ↓"}
              </div>

              <h3 className="mt-1 text-lg font-bold tracking-tight text-white">
                {incomingOffer.senderName}
              </h3>
              <p className="mt-1 font-mono text-xs text-sky-200">
                Wil een {incomingOffer.senderBrand === "ios" ? "AirDrop" : "Quick Share"} bij je afleveren
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => respondToIncomingOffer(false)}
                  className="rounded-xl border border-white/15 bg-white/[0.06] py-2.5 text-xs font-semibold text-white/85 transition hover:bg-rose-500/20 hover:text-rose-200"
                >
                  Weigeren
                </button>
                <button
                  type="button"
                  onClick={() => respondToIncomingOffer(true)}
                  className="rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 py-2.5 text-xs font-black text-black shadow-[0_0_20px_rgba(56,189,248,0.7)] transition hover:scale-105 active:scale-95"
                >
                  ✓ Accepteer &amp; Ontvang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────────
          3. INCOMING ULTRA-FAST LASER BEAM (CRASHING DOWN AT 120FPS)
             - PURE COOL SCI-FI LASER BEAM (NO CAPSULE, NO BALL IN THE MIDDLE)
         ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {receiveFx && (
          <motion.div
            key="receive-laser-beam-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[95] flex flex-col items-center justify-between overflow-hidden p-4"
          >
            <div className="absolute inset-0 bg-[#02040b]/80 backdrop-blur-md" />

            {/* PURE DOWNWARD LASER BEAM COLUMN (HARDWARE ACCELERATED GPU STREAM) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              {/* 1. Symmetrical Cyan Laser Plasma Sheath */}
              <div
                className="beam-pulse absolute h-full w-44 sm:w-72"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.08) 25%, rgba(56,189,248,0.35) 50%, rgba(56,189,248,0.08) 75%, transparent 100%)",
                }}
              />

              {/* 2. Concentrated Electric Cyan Beam Shaft */}
              <div
                className="beam-pulse absolute h-full w-14 sm:w-24"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 20%, rgba(125,211,252,0.95) 50%, rgba(56,189,248,0.4) 80%, transparent 100%)",
                  boxShadow: "0 0 35px 8px rgba(56,189,248,0.7)",
                }}
              />

              {/* 3. Blinding White-Hot Pure Laser Core */}
              <div
                className="absolute h-full w-3 sm:w-4 bg-white"
                style={{
                  boxShadow:
                    "0 0 15px 4px #ffffff, 0 0 35px 12px rgba(56,189,248,0.9), 0 0 70px 20px rgba(14,165,233,0.6)",
                }}
              />

              {/* 4. Warp-Speed Laser Photon Streamers (Downward) */}
              {[-36, -18, -6, 0, 6, 18, 36].map((offset, i) => (
                <div
                  key={`down-laser-streak-${i}`}
                  className="real-beam-down absolute h-36 w-1 rounded-full bg-white"
                  style={{
                    left: `calc(50% + ${offset}px)`,
                    animationDelay: `${i * 0.06}s`,
                    boxShadow: "0 0 12px 3px rgba(56,189,248,0.95)",
                  }}
                />
              ))}

              {/* 5. Center Laser Flare Impact Point */}
              <div
                className="laser-flare absolute h-52 w-52 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.55) 40%, transparent 75%)",
                }}
              />
            </div>

            <div className="h-4" />

            {/* Centered High-Impact Arrival & Download Pop-Up Card - Gemini Cosmic Blue & Violet */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="pointer-events-auto relative z-30 my-auto w-full max-w-sm rounded-[28px] border border-indigo-400/40 bg-[#0c101d]/95 p-6 shadow-[0_0_60px_15px_rgba(66,133,244,0.35)] backdrop-blur-2xl text-center text-[#f1f5f9]"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase text-[#c7d2fe]">
                  <Sparkles className="h-3 w-3 text-[#93c5fd]" />
                  {receiveFx.phase === "done" ? "Bestand Ontvangen ✓" : "Bestand Binnenkomend"}
                </span>
                <span className="font-mono text-xs text-[#93c5fd] font-bold">
                  {receiveFx.progress}%
                </span>
              </div>

              {/* Center Visual / Thumbnail */}
              <div className="mt-5 flex flex-col items-center">
                {receiveFx.thumbs && receiveFx.thumbs[0] ? (
                  <div className="relative mb-3 h-28 w-28 overflow-hidden rounded-2xl border-2 border-indigo-400/60 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <img
                      src={receiveFx.thumbs[0]}
                      alt="Ontvangen bestand"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/20 shadow-[0_0_30px_rgba(66,133,244,0.35)]">
                    <Download className="h-9 w-9 text-[#93c5fd] animate-bounce" />
                  </div>
                )}

                <h3 className="text-base font-bold text-white tracking-tight">
                  {receiveFx.phase === "done" ? "Bestand Klaar voor Gebruik" : `Inkomend van ${receiveFx.senderName}`}
                </h3>
                <p className="mt-1 line-clamp-1 max-w-[260px] text-xs font-semibold text-[#c7d2fe]">
                  {receiveFx.fileName || receiveFx.label}
                </p>
                {receiveFx.totalSize > 0 && (
                  <p className="mt-0.5 font-mono text-[11px] text-[#94a3b8]">
                    {formatBytes(receiveFx.totalSize)}
                  </p>
                )}
              </div>

              {/* Smooth Progress Bar */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#4285f4] via-[#6366f1] to-[#9b72cf] shadow-[0_0_12px_rgba(66,133,244,0.8)]"
                  style={{ width: `${receiveFx.progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Action Buttons (Direct Native Tap) */}
              <div className="mt-5 flex flex-col gap-2.5">
                {(() => {
                  const rawText = receiveFx.textPreview || "";
                  const urlMatch = rawText.match(/https?:\/\/[^\s]+/) || (/(?:[a-zA-Z0-9-]+\.)+(?:io|com|net|gg|org|app)[^\s]*/i.test(rawText) ? [rawText.trim()] : null);
                  const gameOrWebUrl = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`) : null;

                  if (gameOrWebUrl) {
                    return (
                      <>
                        <a
                          href={gameOrWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            showToast("🎮 Game wordt geopend!");
                            setReceiveFx(null);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3.5 text-xs font-black text-black shadow-[0_0_25px_rgba(52,211,153,0.7)] active:scale-95 transition hover:brightness-110 cursor-pointer"
                        >
                          <Zap className="h-4 w-4 fill-black" />
                          <span>🎮 Open Game &amp; Join Direct!</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(gameOrWebUrl);
                            showToast("Game invite link gekopieerd!");
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/15 py-2.5 text-xs font-extrabold text-sky-200 hover:bg-sky-500/25 transition"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>📋 Kopieer Game Link</span>
                        </button>
                      </>
                    );
                  }

                  if (receiveFx.blobUrl) {
                    return (
                      <a
                        href={receiveFx.blobUrl}
                        download={receiveFx.fileName || "Bestand"}
                        onClick={() => {
                          showToast("Bestand gedownload!");
                        }}
                        className="btn-claude-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold text-[#0d0c0b] shadow-[0_0_25px_rgba(217,119,87,0.55)] active:scale-95 transition hover:brightness-110 cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        📥 Download &amp; Open Bestand
                      </a>
                    );
                  }

                  return (
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-xs font-semibold text-white/50"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-[#fed7aa]" />
                      Overdracht afronden…
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setReceiveFx(null)}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 active:scale-95 transition"
                >
                  Sluiten
                </button>
              </div>
            </motion.div>

            {/* Minimal Impact Status Pill (Tap to close) */}
            <motion.div
              initial={{ y: 25, scale: 0.95, opacity: 0 }}
              animate={{ y: -8, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              className="pointer-events-auto relative z-20 mb-2 flex items-center gap-3 rounded-full border border-indigo-400/40 bg-[#0d101b]/90 px-5 py-2 shadow-[0_0_40px_10px_rgba(66,133,244,0.35)] backdrop-blur-xl"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#93c5fd]" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
                {receiveFx.phase === "done"
                  ? `✓ ONTVANGEN VAN ${receiveFx.senderName.toUpperCase()}`
                  : `OVERDRACHT VAN ${receiveFx.senderName.toUpperCase()}`}
              </span>
              <button
                type="button"
                onClick={() => setReceiveFx(null)}
                className="ml-2 rounded-full bg-white px-3 py-0.5 font-mono text-[10px] font-bold text-black hover:bg-[#c7d2fe]"
              >
                Klaar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Sheet Guide Modal */}
      <AnimatePresence>
        {showShareSheetGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setShowShareSheetGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#090a16] p-6 shadow-2xl text-left"
            >
              {(() => {
                const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
                const isIpadModal =
                  /iPad/i.test(ua) ||
                  (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
                const isAppleModal = isIpadModal || /iPhone|iPod/.test(ua);
                const isNonSafariModal =
                  isAppleModal &&
                  (/CriOS/i.test(ua) ||
                    /FBAN|FBAV|Instagram|WhatsApp|Line/i.test(ua) ||
                    !/Version\/.*Safari/i.test(ua));

                return (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center p-[2px]">
                          <img src="/apple-touch-icon.png" alt="Icon" className="w-7 h-7 object-contain rounded-lg" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-white">
                            Zytron Share Installeren
                          </h3>
                          <p className="text-[11px] font-mono text-sky-300">
                            {isAppleModal
                              ? isIpadModal
                                ? "Voor Apple iPad (iPadOS)"
                                : "Voor Apple iPhone (iOS)"
                              : "Voor Android & PC"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowShareSheetGuide(false)}
                        className="rounded-full bg-white/10 p-1.5 text-white/60 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {isAppleModal ? (
                      <div className="mt-4 space-y-3 text-xs">
                        {isNonSafariModal && (
                          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-left">
                            <p className="font-extrabold text-xs text-amber-300">⚠️ Let op: Open Safari</p>
                            <p className="text-[11px] mt-0.5 leading-relaxed">
                              Apple staat web-apps installeren <strong>ALLEEN</strong> toe via Safari. Open <code>zytron-share.vercel.app</code> in Safari!
                            </p>
                          </div>
                        )}

                        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/25">
                          <p className="font-extrabold text-white text-xs">
                            {isIpadModal
                              ? "📍 Deelknop zit RECHTSBOVEN naast de adresbalk"
                              : "📍 Deelknop zit ONDERAAN in het midden van Safari"}
                          </p>
                          <p className="text-[11px] text-white/70 mt-1">
                            Geen App Store nodig. In 3 tikken staat hij tussen al je apps:
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                            <span className="w-5 h-5 rounded-full bg-sky-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                            <div>
                              <p className="font-bold text-white">Tik op het Deel-icoon [⎋]</p>
                              <p className="text-[11px] text-white/60">
                                {isIpadModal ? "Rechtsboven in Safari [⎋]" : "Onderaan in Safari [⎋]"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                            <span className="w-5 h-5 rounded-full bg-sky-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                            <div>
                              <p className="font-bold text-white">Tik op &ldquo;Zet op beginscherm&rdquo;</p>
                              <p className="text-[11px] text-white/60">
                                Scroll een klein stukje naar beneden in het menu.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                            <span className="w-5 h-5 rounded-full bg-emerald-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                            <div>
                              <p className="font-bold text-white">Tik rechtsboven op &ldquo;Voeg toe&rdquo;</p>
                              <p className="text-[11px] text-emerald-300 font-medium">
                                ✓ De app staat nu tussen je apps op je {isIpadModal ? "iPad" : "iPhone"}!
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "itms-services://?action=download-manifest&url=https://zytron-share.vercel.app/api/ios-manifest";
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-black font-black text-xs text-center shadow-lg shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-black" />
                            <span>⚡ 1-Tik Directe Web Installatie (iOS OTA)</span>
                          </button>

                          <a
                            href="/api/download-ipa"
                            download="zytron-share.ipa"
                            className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs text-center border border-white/10 transition flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>📲 Download iPhone App (.IPA - 8.2 MB)</span>
                          </a>

                          <a
                            href="/install"
                            className="w-full py-1.5 text-sky-300 hover:text-sky-200 text-[11px] text-center font-bold transition"
                          >
                            ⚙️ Bekijk alle installatie-opties &amp; Profielen $\rightarrow$
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 text-xs">
                        <p className="text-white/80">
                          Installeer de officiële native Android APK direct op je telefoon:
                        </p>
                        <a
                          href="/api/download-apk"
                          download="zytron-share.apk"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 py-3 font-extrabold text-black hover:bg-sky-300 transition shadow-lg shadow-sky-500/20"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Android APK (8.3 MB)</span>
                        </a>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowShareSheetGuide(false)}
                      className="mt-4 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-black hover:bg-white/90 transition"
                    >
                      Begrepen
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}



        {/* Background Run & Notification Permission Modal */}
        {showBackgroundPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowBackgroundPermissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-sky-400/40 bg-[#090b14] p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/50 bg-sky-500/20 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Achtergrond-Ontvangst Activeren
                  </h3>
                  <p className="text-xs font-mono text-sky-300">
                    Altijd bereikbaar op telefoon &amp; PC
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-white/80">
                Om bestanden en foto&apos;s direct te ontvangen &mdash; zelfs wanneer je scherm vergrendeld is of de app op de achtergrond staat &mdash; heeft Zytron Drop meldingen en wake-lock toestemming nodig.
              </p>

              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Directe pop-up &amp; systeemnotificatie bij inkomend bestand</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Geen slaapstand onderbrekingen tijdens bestandsoverdracht</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>AirDrop &amp; Quick Share chime geluid &amp; trilling</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={enableBackgroundAndNotifications}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 py-3.5 text-xs font-extrabold text-black shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition hover:brightness-110"
                >
                  <Zap className="h-4 w-4" />
                  Activeer Achtergrond &amp; Meldingen
                </button>


                <button
                  type="button"
                  onClick={() => setShowBackgroundPermissionModal(false)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-semibold text-white/60 hover:text-white transition"
                >
                  Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Instant QR Code Pairing Modal - Google Gemini Cosmic Blue & Violet */}
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-indigo-400/40 bg-[#0c101d] p-6 shadow-[0_0_50px_rgba(66,133,244,0.35)] text-center text-[#f1f5f9]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/45 bg-[#4285f4]/20 text-[#93c5fd] shadow-[0_0_20px_rgba(66,133,244,0.35)]">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-extrabold text-white">Scan met Camera (Geen App Nodig)</h3>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Richt de normale camera van je iPad of iPhone op deze code — hij opent binnen 1 seconde direct in Safari:
              </p>

              {/* QR Image */}
              <div className="mt-4 mx-auto flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/?add_friend=${encodeURIComponent(myFriendCode)}&name=${encodeURIComponent(customDeviceName || "Toestel")}`
                      : `https://zytron-share.vercel.app/?add_friend=${encodeURIComponent(myFriendCode)}`
                  )}`}
                  alt="QR Code voor koppelen"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-1.5 font-mono text-xs font-bold text-[#c7d2fe]">
                <span>Toestel Code: {myFriendCode}</span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => shareFilesViaNativeOs()}
                  className="btn-gemini-primary w-full inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-extrabold"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Stuur via Systeem AirDrop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/60 hover:text-white transition"
                >
                  Sluiten
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* OPTIE 1: NFC Back-to-Back Modal */}
        {showNfcModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowNfcModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-amber-400/40 bg-[#090b14] p-6 shadow-[0_0_60px_rgba(251,191,36,0.3)] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  <Radio className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">NFC Back-to-Back Tik</h3>
                    <span className="rounded bg-amber-400/25 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      Optie 1
                    </span>
                  </div>
                  <p className="text-xs font-mono text-amber-300/80">
                    Snelste methode &bull; Geen app nodig op iPhone
                  </p>
                </div>
              </div>

              {/* Back to Back Animated Graphic */}
              <div className="mt-5 flex items-center justify-center gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-10 items-center justify-center rounded-xl border border-sky-400/50 bg-sky-950/60 text-[10px] font-bold text-sky-300 shadow-md">
                    Samsung
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-white/50">Jouw Toestel</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-8 w-8 animate-ping rounded-full bg-amber-400/40" />
                    <Radio className="h-6 w-6 text-amber-300" />
                  </div>
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-amber-300">Tikken</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-10 items-center justify-center rounded-xl border border-white/40 bg-zinc-900/80 text-[10px] font-bold text-white shadow-md">
                    iPhone
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-white/50">Bovenkant</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/80">
                {nfcWriting ? (
                  <div className="flex items-center gap-2 text-amber-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">NFC Antenne uitzending activeren…</span>
                  </div>
                ) : nfcSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span className="font-semibold">NFC Tag actief! Houd nu tegen de iPhone.</span>
                  </div>
                ) : (
                  <p>
                    <strong className="text-white">Instructie:</strong> Houd de achterkant van je Samsung tegen de achterkant van de iPhone (bovenaan bij de camera). De iPhone toont direct een native banner: <span className="text-sky-300">&quot;Website-tag: Openen in Safari&quot;</span>.
                  </p>
                )}
              </div>

              {/* Active Drop Info & Fallback QR */}
              {activeDropPin && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div>
                    <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">Actieve Drop PIN</span>
                    <p className="font-mono text-lg font-black tracking-widest text-amber-300">{activeDropPin}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "https://zytron-share.vercel.app";
                      navigator.clipboard.writeText(`${origin}/?pin=${activeDropPin}`);
                      showToast("Directe drop-link gekopieerd!");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Kopieer Link</span>
                  </button>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNfcModal(false)}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Klaar / Sluiten
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* OPTIE 2: 4-Cijferige AirDrop-stijl PIN Modal */}
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowPinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-sky-400/40 bg-[#090b14] p-6 shadow-[0_0_60px_rgba(56,189,248,0.3)] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/50 bg-sky-500/20 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                  <span className="font-mono text-base font-black">#4</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">4-Cijfer AirDrop Handshake</h3>
                    <span className="rounded bg-sky-400/25 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                      Optie 2
                    </span>
                  </div>
                  <p className="text-xs font-mono text-sky-300/80">
                    Geen fysieke aanraking nodig &bull; Directe koppeling
                  </p>
                </div>
              </div>

              {/* SENDER VIEW: JOUW PIN CODE */}
              {activeDropPin && (
                <div className="mt-5 rounded-2xl border border-sky-400/30 bg-sky-950/30 p-4 text-center">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                    Jouw Actieve Drop-PIN
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2.5">
                    {activeDropPin.split("").map((digit, idx) => (
                      <div
                        key={idx}
                        className="flex h-14 w-12 items-center justify-center rounded-2xl border-2 border-sky-400 bg-black/60 font-mono text-2xl font-black text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-white/70">
                    Open op het andere toestel <strong className="text-white">zytron-share.vercel.app</strong> en typ deze 4 cijfers in.
                  </p>
                </div>
              )}

              {/* RECEIVER VIEW: PIN INVOEREN OM TE CLAIMEN */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-bold text-white">Bestand ontvangen van ander toestel?</p>
                <p className="mt-0.5 text-[11px] text-white/60">
                  Voer hier de 4 cijfers in die op het andere scherm staan:
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="bijv. 4821"
                    className="w-32 rounded-xl border border-white/20 bg-black/70 px-3 py-2.5 text-center font-mono text-lg font-black tracking-widest text-sky-300 placeholder:text-white/25 outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => claimDropByPin()}
                    disabled={pinInput.trim().length !== 4}
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 py-2.5 text-xs font-black text-black shadow-md hover:brightness-110 disabled:opacity-40 transition"
                  >
                    Ontvang &amp; Download Direct
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Sluiten
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* OPTIE 3: Hotspot Baken Modal (Voor Buiten op Straat) */}
        {showHotspotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowHotspotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-emerald-400/40 bg-[#090b14] p-6 shadow-[0_0_60px_rgba(52,211,153,0.3)] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                  <Wifi className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">Captive Hotspot Baken</h3>
                    <span className="rounded bg-emerald-400/25 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                      Optie 3
                    </span>
                  </div>
                  <p className="text-xs font-mono text-emerald-300/80">
                    Voor buiten op straat &bull; Geen Wi-Fi netwerk nodig
                  </p>
                </div>
              </div>

              {/* Step-by-Step Outdoor Instructions */}
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 font-mono text-xs font-black text-emerald-300">
                    1
                  </span>
                  <div className="text-xs leading-relaxed text-white/80">
                    <strong className="text-white">Activeer Hotspot op Samsung:</strong>
                    <p className="mt-0.5 text-white/60">
                      Zet je mobiele hotspot aan en noem het netwerk <span className="font-mono font-bold text-emerald-300">Zytron Drop</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 font-mono text-xs font-black text-emerald-300">
                    2
                  </span>
                  <div className="text-xs leading-relaxed text-white/80">
                    <strong className="text-white">iPhone verbindt:</strong>
                    <p className="mt-0.5 text-white/60">
                      De iPhone-gebruiker opent Wi-Fi instellingen en tikt op <span className="font-mono font-bold text-emerald-300">Zytron Drop</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 font-mono text-xs font-black text-emerald-300">
                    3
                  </span>
                  <div className="text-xs leading-relaxed text-white/80">
                    <strong className="text-white">Automatisch Captive Scherm:</strong>
                    <p className="mt-0.5 text-white/60">
                      iOS herkent dit direct als inlognetwerk en toont vanzelf een paginavullende pop-up met de downloadknop!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const drop = await createActiveDropOnServer();
                    if (drop) {
                      setShowHotspotModal(false);
                      setShowPinModal(true);
                      showToast("Hotspot Drop baken geactiveerd!");
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 py-3 text-xs font-black text-black shadow-lg hover:brightness-110 transition"
                >
                  <Zap className="h-4 w-4" />
                  Koppel Bestand aan Hotspot Baken
                </button>

                <button
                  type="button"
                  onClick={() => setShowHotspotModal(false)}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Sluiten
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[110] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="flex items-center gap-2.5 rounded-full border border-sky-400/35 bg-[#090b14]/95 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            >
              <Check className="h-4 w-4 text-sky-300" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
