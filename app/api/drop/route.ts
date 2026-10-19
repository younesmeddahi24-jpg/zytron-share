import { NextRequest, NextResponse } from "next/server";
import {
  DropItem,
  getClientIpHash,
  getDropStore,
  getIncomingDropsForPeer,
  pruneDropStore,
} from "../_sharedStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const store = getDropStore();
    pruneDropStore(store);
    const body = await req.json();
    const senderIpHash = getClientIpHash(req);

    if (body.action === "respond" && body.dropId) {
      const item = store.get(String(body.dropId));
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

    const dropId = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const item: DropItem = {
      dropId,
      pin,
      senderPeerId: String(body.senderPeerId || ""),
      senderName: String(body.senderName || "Toestel"),
      senderBrand: String(body.senderBrand || "android"),
      senderBrandLabel: String(body.senderBrandLabel || "Toestel"),
      senderIpHash,
      targetPeerId: body.targetPeerId ? String(body.targetPeerId) : undefined,
      targetFriendCode: body.targetFriendCode ? String(body.targetFriendCode).trim().toUpperCase() : undefined,
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

    store.set(dropId, item);

    return NextResponse.json(
      {
        ok: true,
        dropId,
        pin,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }
}

export async function GET(req: NextRequest) {
  const store = getDropStore();
  pruneDropStore(store);
  const ipHash = getClientIpHash(req);

  const { searchParams } = new URL(req.url);
  const dropId = searchParams.get("dropId");
  const pin = searchParams.get("pin");
  const peerId = searchParams.get("peerId") || "";
  const friendCode = searchParams.get("friendCode") || "";

  if (dropId) {
    const item = store.get(dropId);
    return NextResponse.json(
      { ok: Boolean(item), drop: item || null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }

  if (pin) {
    const found = Array.from(store.values()).find((d) => d.pin === pin.trim());
    return NextResponse.json(
      { ok: Boolean(found), drop: found || null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }

  const incoming = getIncomingDropsForPeer(peerId, ipHash, friendCode).map((d) => ({
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
      incoming,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
