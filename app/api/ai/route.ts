import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

const SYSTEM_INSTRUCTION =
  "Je bent Zytron AI, de officiële geavanceerde studie-, reken- en productiviteitsassistent van Zytron Share. " +
  "Antwoord standaard in het Nederlands, tenzij de gebruiker een andere taal spreekt. " +
  "Wees direct, uiterst helder, professioneel, to-the-point en accuraat. " +
  "Bij school-, wiskunde- of studievraagstukken leg je de logica of berekening stap voor stap uit.";

type ChatMessage = {
  role: "user" | "model";
  text: string;
  image?: { data: string; mimeType: string };
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Zytron AI is nog niet geconfigureerd (GEMINI_API_KEY ontbreekt op de server)." },
      { status: 503 },
    );
  }

  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  // Filter valid messages and limit context window
  messages = messages.slice(-20).filter((m) => m && typeof m.text === "string");
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Geen vraag ontvangen." }, { status: 400 });
  }

  // Construct Gemini generateContent payload
  const contents = messages.map((m) => {
    const parts: Array<Record<string, unknown>> = [];
    if (m.text && m.text.trim()) {
      parts.push({ text: m.text.slice(0, 8000) });
    }
    if (m.image?.data && m.image.mimeType?.startsWith("image/")) {
      parts.push({
        inline_data: {
          mime_type: m.image.mimeType,
          data: m.image.data,
        },
      });
    }
    return {
      role: m.role === "model" ? "model" : "user",
      parts: parts.length > 0 ? parts : [{ text: " " }],
    };
  });

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const callModel = async (modelName: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  try {
    let res = await callModel(PRIMARY_MODEL);
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      // Fallback to 1.5-flash
      res = await callModel(FALLBACK_MODEL);
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return NextResponse.json(
        { error: data?.error?.message || `Zytron AI fout (${res.status}).` },
        { status: 502 },
      );
    }

    const candidate = data.candidates?.[0];
    const textParts =
      candidate?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .filter(Boolean) || [];
    const text = textParts.join("\n").trim();

    return NextResponse.json({
      text: text || "Ik kon geen antwoord genereren. Probeer het opnieuw.",
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Kon Zytron AI niet bereiken.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
