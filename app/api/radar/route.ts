import { NextRequest, NextResponse } from "next/server";
import {
  DropItem,
  getClientIpHash,
  getDropStore,
  getIncomingDropsForPeer,
  getRadarStore,
  pruneDropStore,
  pruneRadarStore,
  RadarPeer,
} from "../_sharedStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const radarStore = getRadarStore();
    const dropStore = getDropStore();
    pruneRadarStore(radarStore);
    pruneDropStore(dropStore);

    const body = await req.json();
    const ipHash = getClientIpHash(req);

    // 1. Handle Drop creation directly inside the warm Radar endpoint
    if (body.action === "create_drop") {
      const dropId = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));

      const item: DropItem = {
        dropId,
        pin,
        senderPeerId: String(body.senderPeerId || ""),
        senderName: String(body.senderName || "Toestel"),
        senderBrand: String(body.senderBrand || "android"),
        senderBrandLabel: String(body.senderBrandLabel || "Toestel"),
        senderIpHash: ipHash,
        targetPeerId: body.targetPeerId ? String(body.targetPeerId) : undefined,
        targetFriendCode: body.targetFriendCode
          ? String(body.targetFriendCode).trim().toUpperCase()
          : undefined,
        targetName: body.targetName ? String(body.targetName) : undefined,
        fileName: String(body.fileName || "bestand"),
        fileType: String(body.fileType || "application/octet-stream"),
        fileSize: Number(body.fileSize) || 0,
        base64Data: String(body.base64Data || ""),
        textContent: body.textContent ? String(body.textContent) : undefined,
        thumbs: Array.isArray(body.thumbs) ? body.thumbs : [],
        status: "pending",
        createdAt: Date.now(),
        consumedBy: [],
      };

      dropStore.set(dropId, item);
      return NextResponse.json(
        { ok: true, dropId, pin },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    // 2. Handle Drop accept/decline response inside the warm Radar endpoint
    if (body.action === "respond_drop" && body.dropId) {
      const item = dropStore.get(String(body.dropId));
      if (item) {
        item.status = body.accept ? "accepted" : "declined";
        if (body.peerId && !item.consumedBy.includes(String(body.peerId))) {
          item.consumedBy.push(String(body.peerId));
        }
      }
      return NextResponse.json(
        { ok: true, drop: item || null },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    // 3. Handle normal Radar Heartbeat + Auto-Return Incoming Drops in 1 roundtrip!
    const peerId = String(body.peerId || "").trim();
    const friendCode = body.friendCode ? String(body.friendCode).trim().toUpperCase() : "";

    if (body.leave && peerId) {
      radarStore.delete(peerId);
      return NextResponse.json(
        { ok: true, peers: [], incomingDrops: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    if (peerId) {
      const cleanName = String(body.name || "Toestel").slice(0, 60);
      const normName = cleanName.trim().toLowerCase();
      // Remove any stale duplicate entry from the same device name OR friend code
      for (const [existingId, existingPeer] of radarStore.entries()) {
        const matchName = existingPeer.name.trim().toLowerCase() === normName;
        const matchCode = friendCode && existingPeer.friendCode && existingPeer.friendCode === friendCode;
        if (existingId !== peerId && (matchName || matchCode)) {
          radarStore.delete(existingId);
        }
      }

      radarStore.set(peerId, {
        peerId,
        friendCode: friendCode || undefined,
        name: cleanName,
        brand: String(body.brand || "android").slice(0, 24),
        brandLabel: String(body.brandLabel || "Toestel").slice(0, 48),
        osSkin: String(body.osSkin || "WebRTC P2P").slice(0, 48),
        modelName: String(body.modelName || "Toestel").slice(0, 60),
        ipHash,
        lastSeen: Date.now(),
      });
    }

    // Strictly deduplicate allPeers by name & friendCode so each device appears EXACTLY ONCE
    const seenNames = new Set<string>();
    const seenCodes = new Set<string>();
    const allPeers: (RadarPeer & { sameWifi: boolean })[] = [];

    const sortedPeers = Array.from(radarStore.values())
      .filter((p) => p.peerId !== peerId)
      .sort((a, b) => b.lastSeen - a.lastSeen);

    for (const p of sortedPeers) {
      const normName = p.name.trim().toLowerCase();
      const normCode = p.friendCode ? p.friendCode.trim().toUpperCase() : "";
      if (seenNames.has(normName)) continue;
      if (normCode && seenCodes.has(normCode)) continue;
      seenNames.add(normName);
      if (normCode) seenCodes.add(normCode);

      allPeers.push({
        ...p,
        sameWifi: p.ipHash === ipHash,
      });
    }

    allPeers.sort((a, b) => Number(b.sameWifi) - Number(a.sameWifi) || b.lastSeen - a.lastSeen);

    const incomingDrops = getIncomingDropsForPeer(peerId, ipHash, friendCode).map((d) => ({
      dropId: d.dropId,
      pin: d.pin,
      senderPeerId: d.senderPeerId,
      senderName: d.senderName,
      senderBrand: d.senderBrand,
      senderBrandLabel: d.senderBrandLabel,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      thumbs: d.thumbs,
      textContent: d.textContent,
      base64Data: d.base64Data,
      createdAt: d.createdAt,
    }));

    return NextResponse.json(
      {
        ok: true,
        ipHash,
        peers: allPeers,
        incomingDrops,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, peers: [], incomingDrops: [] },
      { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }
}

export async function GET(req: NextRequest) {
  const radarStore = getRadarStore();
  pruneRadarStore(radarStore);
  const ipHash = getClientIpHash(req);
  const { searchParams } = new URL(req.url);
  const excludeId = searchParams.get("peerId") || "";

  const peers = Array.from(radarStore.values())
    .filter((p) => p.peerId !== excludeId)
    .map((p) => ({
      ...p,
      sameWifi: p.ipHash === ipHash,
    }))
    .sort((a, b) => Number(b.sameWifi) - Number(a.sameWifi) || b.lastSeen - a.lastSeen);

  const incomingDrops = getIncomingDropsForPeer(excludeId, ipHash);

  return NextResponse.json(
    {
      ok: true,
      ipHash,
      peers,
      incomingDrops,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
