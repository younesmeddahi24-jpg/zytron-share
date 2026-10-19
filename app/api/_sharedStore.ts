import { NextRequest } from "next/server";

export type RadarPeer = {
  peerId: string;
  friendCode?: string;
  name: string;
  brand: string;
  brandLabel: string;
  osSkin: string;
  modelName: string;
  ipHash: string;
  lastSeen: number;
};

export type DropItem = {
  dropId: string;
  pin: string;
  senderPeerId: string;
  senderName: string;
  senderBrand: string;
  senderBrandLabel: string;
  senderIpHash: string;
  targetPeerId?: string;
  targetFriendCode?: string;
  targetName?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
  textContent?: string;
  thumbs: string[];
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  consumedBy: string[];
};

const globalStore = globalThis as unknown as {
  __zytronRadarPeers?: Map<string, RadarPeer>;
  __zytronDrops?: Map<string, DropItem>;
};

if (!globalStore.__zytronRadarPeers) {
  globalStore.__zytronRadarPeers = new Map<string, RadarPeer>();
}

if (!globalStore.__zytronDrops) {
  globalStore.__zytronDrops = new Map<string, DropItem>();
}

export function getRadarStore(): Map<string, RadarPeer> {
  return globalStore.__zytronRadarPeers!;
}

export function getDropStore(): Map<string, DropItem> {
  return globalStore.__zytronDrops!;
}

export function getClientIpHash(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const rawIp = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local-net";
  let hash = 2166136261;
  for (let i = 0; i < rawIp.length; i++) {
    hash ^= rawIp.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).slice(0, 8);
}

export function pruneRadarStore(store: Map<string, RadarPeer>) {
  const now = Date.now();
  for (const [id, peer] of store.entries()) {
    if (now - peer.lastSeen > 14_000) {
      store.delete(id);
    }
  }
}

export function pruneDropStore(store: Map<string, DropItem>) {
  const now = Date.now();
  for (const [id, item] of store.entries()) {
    if (now - item.createdAt > 600_000) {
      store.delete(id);
    }
  }
}

export function getIncomingDropsForPeer(
  peerId: string,
  ipHash: string,
  friendCode?: string,
): DropItem[] {
  const store = getDropStore();
  pruneDropStore(store);
  const now = Date.now();
  const cleanCode = friendCode ? friendCode.trim().toUpperCase() : "";

  return Array.from(store.values()).filter((d) => {
    // 1. Must be reasonably recent (10 min)
    if (now - d.createdAt > 600_000) return false;
    // 2. Never deliver to the sender themselves
    if (peerId && d.senderPeerId === peerId) return false;
    // 3. Never deliver if already consumed by this peer
    if (peerId && d.consumedBy.includes(peerId)) return false;
    // 4. Ignore legacy test drops
    if (d.textContent?.includes("test") && d.textContent?.includes("Kamehameha")) return false;
    if (d.fileName === "test.png") return false;

    // Direct match by permanent Friend Code (e.g. ZY-8609, works school <-> home)
    if (cleanCode && d.targetFriendCode && d.targetFriendCode.trim().toUpperCase() === cleanCode) {
      return true;
    }
    // Direct match by target Peer ID
    if (d.targetPeerId && peerId && d.targetPeerId === peerId) {
      return true;
    }
    // Same local Wi-Fi / IP hash
    if (d.senderIpHash === ipHash) {
      return true;
    }
    // Universal 3-minute broadcast: Any fresh drop with no conflicting target or within 3 minutes
    // will be delivered to any active listening peer so nothing is ever missed!
    if (now - d.createdAt < 180_000) {
      return true;
    }

    return false;
  });
}

