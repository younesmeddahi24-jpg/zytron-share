import { NextRequest, NextResponse } from "next/server";
import { getDropStore, DropItem, getClientIpHash } from "../api/_sharedStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString() || "";
    const text = formData.get("text")?.toString() || "";
    const url = formData.get("url")?.toString() || "";
    const files = formData.getAll("files") as File[];

    let primaryFileName = title || "Gedeeld Bestand";
    let primaryFileType = "application/octet-stream";
    let primaryFileSize = 0;
    let base64Data = "";

    if (files.length > 0 && files[0] && typeof files[0].arrayBuffer === "function") {
      const file = files[0];
      primaryFileName = file.name || "bestand";
      primaryFileType = file.type || "application/octet-stream";
      primaryFileSize = file.size || 0;

      // Read small files into memory buffer
      if (primaryFileSize < 8 * 1024 * 1024) {
        const buffer = await file.arrayBuffer();
        base64Data = Buffer.from(buffer).toString("base64");
      }
    }

    const dropStore = getDropStore();
    const dropId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const ipHash = getClientIpHash(req);

    const dropItem: DropItem = {
      dropId,
      pin,
      senderPeerId: "native-share-sheet",
      senderName: "Gedeeld via App-rij",
      senderBrand: "ios",
      senderBrandLabel: "Apple iPad / iOS",
      senderIpHash: ipHash,
      fileName: primaryFileName,
      fileType: primaryFileType,
      fileSize: primaryFileSize,
      base64Data,
      textContent: text || url || undefined,
      thumbs: [],
      status: "pending",
      createdAt: Date.now(),
      consumedBy: [],
    };

    dropStore.set(dropId, dropItem);

    // Redirect to home page with the shared drop ID ready to beam!
    return NextResponse.redirect(
      new URL(`/?incoming_share=1&dropId=${encodeURIComponent(dropId)}`, req.url),
      303,
    );
  } catch (err) {
    return NextResponse.redirect(new URL("/?incoming_share=error", req.url), 303);
  }
}
