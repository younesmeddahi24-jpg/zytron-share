import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type PairedNodeInfo = {
  pairCode: string;
  peerId: string;
  name: string;
  phone: string;
  brand: string;
  brandLabel: string;
  osSkin: string;
  modelName: string;
  gpuRenderer: string;
  screenSpec: string;
  batteryPct: number | null;
  networkType: string;
  ipHash: string;
  lastSeen: number;
};

type PairRoom = {
  pairCode: string;
  nodes: Map<string, PairedNodeInfo>;
  createdAt: number;
  updatedAt: number;
};

const globalPairs = globalThis as unknown as {
  __zytronPairRooms?: Map<string, PairRoom>;
  __zytronPhoneIndex?: Map<string, string>; // normalizedPhone -> pairCode
};

if (!globalPairs.__zytronPairRooms) {
  globalPairs.__zytronPairRooms = new Map<string, PairRoom>();
}
if (!globalPairs.__zytronPhoneIndex) {
  globalPairs.__zytronPhoneIndex = new Map<string, string>();
}

function getClientIpHash(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const rawIp = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local-net";
  let hash = 2166136261;
  for (let i = 0; i < rawIp.length; i++) {
    hash ^= rawIp.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).slice(0, 8);
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function prunePairs(store: Map<string, PairRoom>) {
  const now = Date.now();
  for (const [code, room] of store.entries()) {
    // Keep pair rooms alive for 24 hours
    if (now - room.updatedAt > 86_400_000) {
      store.delete(code);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ipHash = getClientIpHash(req);
    const rooms = globalPairs.__zytronPairRooms!;
    const phoneIdx = globalPairs.__zytronPhoneIndex!;
    prunePairs(rooms);

    let pairCode = String(body.pairCode || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const normPhone = normalizePhone(rawPhone);
    const peerId = String(body.peerId || "").trim();

    if (!pairCode && normPhone && phoneIdx.has(normPhone)) {
      pairCode = phoneIdx.get(normPhone)!;
    }
    if (!pairCode) {
      pairCode = `wa-${Math.random().toString(36).slice(2, 9)}`;
    }

    if (normPhone) {
      phoneIdx.set(normPhone, pairCode);
    }

    let room = rooms.get(pairCode);
    if (!room) {
      room = {
        pairCode,
        nodes: new Map<string, PairedNodeInfo>(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      rooms.set(pairCode, room);
    }

    room.updatedAt = Date.now();

    if (peerId) {
      room.nodes.set(peerId, {
        pairCode,
        peerId,
        name: String(body.name || "Toestel"),
        phone: rawPhone,
        brand: String(body.brand || "ios"),
        brandLabel: String(body.brandLabel || "Toestel"),
        osSkin: String(body.osSkin || "WebRTC P2P"),
        modelName: String(body.modelName || "Toestel"),
        gpuRenderer: String(body.gpuRenderer || "Hardware GPU"),
        screenSpec: String(body.screenSpec || ""),
        batteryPct: typeof body.batteryPct === "number" ? body.batteryPct : null,
        networkType: String(body.networkType || "Direct P2P"),
        ipHash,
        lastSeen: Date.now(),
      });
    }

    const partners = Array.from(room.nodes.values())
      .filter((n) => n.peerId !== peerId)
      .map((n) => ({
        ...n,
        sameWifi: n.ipHash === ipHash,
        online: Date.now() - n.lastSeen < 25_000,
      }));

    return NextResponse.json({
      ok: true,
      pairCode,
      ipHash,
      partners,
    });
  } catch {
    return NextResponse.json({ ok: false, partners: [] }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pairCode = (searchParams.get("pairCode") || "").trim();
  const rawPhone = (searchParams.get("phone") || "").trim();
  const peerId = (searchParams.get("peerId") || "").trim();
  const ipHash = getClientIpHash(req);

  const rooms = globalPairs.__zytronPairRooms!;
  const phoneIdx = globalPairs.__zytronPhoneIndex!;
  prunePairs(rooms);

  const resolvedCode = pairCode || (rawPhone ? phoneIdx.get(normalizePhone(rawPhone)) || "" : "");
  if (!resolvedCode || !rooms.has(resolvedCode)) {
    return NextResponse.json({ ok: true, pairCode: resolvedCode, partners: [] });
  }

  const room = rooms.get(resolvedCode)!;
  const partners = Array.from(room.nodes.values())
    .filter((n) => !peerId || n.peerId !== peerId)
    .map((n) => ({
      ...n,
      sameWifi: n.ipHash === ipHash,
      online: Date.now() - n.lastSeen < 25_000,
    }));

  return NextResponse.json({
    ok: true,
    pairCode: resolvedCode,
    ipHash,
    partners,
  });
}
