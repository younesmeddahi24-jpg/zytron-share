"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AiChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  imagePreview?: string;
  time?: string;
};

export type IncomingNoteItem = {
  id: string;
  text: string;
  sender?: string;
  time?: string;
};

export interface ZytronAIProps {
  showToast: (msg: string) => void;
  onSendAnswerToRadar?: (text: string) => void;
  onSendText?: (text: string) => void;
  incomingNotes?: IncomingNoteItem[];
  onToggleNotability?: () => void;
}

type DocPiP = {
  requestWindow: (opts: { width: number; height: number }) => Promise<Window>;
};

function getDocPiP(): DocPiP | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((window as any).documentPictureInPicture as DocPiP) || null;
}

export function SparkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="none">
      <defs>
        <linearGradient id="zy-spark-g" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c.45 4.55 2.95 7.05 7.5 7.5-4.55.45-7.05 2.95-7.5 7.5-.45-4.55-2.95-7.05-7.5-7.5 4.55-.45 7.05-2.95 7.5-7.5Z"
        fill="url(#zy-spark-g)"
      />
      <circle cx="19" cy="18.5" r="1.6" fill="url(#zy-spark-g)" />
      <circle cx="5" cy="17.5" r="1.2" fill="url(#zy-spark-g)" />
    </svg>
  );
}

function RichText({ text }: { text: string }) {
  const inline = (s: string, k: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={`${k}${i}`} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
        return (
          <code key={`${k}${i}`} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em] text-sky-200">
            {p.slice(1, -1)}
          </code>
        );
      return <span key={`${k}${i}`}>{p}</span>;
    });

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
      {text.split(/\n{2,}/).map((b, bi) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-4">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""), `${bi}-${li}-`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="whitespace-pre-wrap">
            {inline(b, `${bi}-`)}
          </p>
        );
      })}
    </div>
  );
}

export default function ZytronAI({
  showToast,
  onSendAnswerToRadar,
  onSendText,
  incomingNotes = [],
  onToggleNotability,
}: ZytronAIProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hallo! Ik ben **Zytron AI**. Vraag me om uitleg, formules, berekeningen of studiebegeleiding.",
      time: "Nu",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Position of floating orb
  const [pos, setPos] = useState({
    x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 80) : 320,
    y: typeof window !== "undefined" ? Math.max(120, Math.floor(window.innerHeight / 2 - 40)) : 240,
  });

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Global hotkey: Alt + W / Option + W to toggle/reappear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        setIsVisible((v) => {
          const next = !v;
          showToast(next ? "✨ Zytron AI geactiveerd" : "Zytron AI verborgen (Alt+W om te herstellen)");
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  // Dragging handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    const maxX = window.innerWidth - (isExpanded ? 360 : 64);
    const maxY = window.innerHeight - (isExpanded ? 520 : 64);

    setPos({
      x: Math.max(10, Math.min(maxX, dragStartRef.current.posX + dx)),
      y: Math.max(10, Math.min(maxY, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Magnetic snap to side if collapsed
    if (!isExpanded && hasMovedRef.current) {
      const screenMid = window.innerWidth / 2;
      setPos((prev) => ({
        ...prev,
        x: prev.x < screenMid ? 14 : window.innerWidth - 74,
      }));
    }
  };

  const handleShareToRadar = useCallback(
    (text: string) => {
      if (onSendAnswerToRadar) onSendAnswerToRadar(text);
      else if (onSendText) onSendText(text);
      showToast("Antwoord doorgestuurd naar Zytron Radar");
    },
    [onSendAnswerToRadar, onSendText, showToast],
  );

  // Send message to real Gemini API backend (/api/ai)
  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputText).trim();
    if (!textToSend && !selectedImage) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: textToSend,
      imagePreview: selectedImage?.preview,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText("");
    const imgToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const payload = {
        messages: nextHistory.map((m) => ({
          role: m.role,
          text: m.text,
          image: m.id === userMsg.id && imgToSend ? { data: imgToSend.data, mimeType: imgToSend.mimeType } : undefined,
        })),
      };

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Fout bij AI antwoord (${res.status})`);
      }

      const botMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: data.text || "Geen antwoord ontvangen.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Er is een fout opgetreden bij het verbinden met Zytron AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          text: `⚠️ **Fout:** ${errText}`,
          time: "Zojuist",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Image Upload Handler
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Kies een geldige afbeelding");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      const base64Data = res.split(",")[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        preview: res,
      });
      showToast("Afbeelding bijgevoegd");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Speech Recognition (Dictation)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Spraakherkenning niet beschikbaar in deze browser");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "nl-NL";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r[0].transcript)
          .join("");
        setInputText(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      showToast("🎙️ Spreek nu je vraag in…");
    } catch {
      setIsListening(false);
    }
  };

  // Zweef OS (Picture-in-Picture window that hovers over every desktop app!)
  const launchPictureInPicture = async () => {
    const pip = getDocPiP();
    if (!pip) {
      showToast("Zweef OS over andere apps vereist Chrome of Edge op desktop. Op iPad kun je Split View gebruiken!");
      return;
    }

    try {
      const win = await pip.requestWindow({
        width: 360,
        height: 540,
      });

      // Copy stylesheets
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = win.document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            win.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = win.document.createElement("style");
            Array.from(sheet.cssRules).forEach((rule) => {
              style.appendChild(win.document.createTextNode(rule.cssText));
            });
            win.document.head.appendChild(style);
          }
        } catch {
          // Ignore cross-origin rules
        }
      });

      win.document.body.className = "bg-[#090D16] text-white m-0 p-0 font-sans antialiased overflow-hidden";
      setPipWindow(win);
      setIsExpanded(false);
      showToast("✨ Zytron AI zweeft nu over al je apps!");

      win.addEventListener("pagehide", () => {
        setPipWindow(null);
      });
    } catch {
      showToast("Picture-in-Picture kon niet worden gestart");
    }
  };

  // Reusable Chat UI Content
  const renderChatContent = (isInsidePip = false) => (
    <div className={`flex flex-col ${isInsidePip ? "h-screen w-screen" : "h-[490px] w-80 sm:w-88"} bg-[#090D16] text-[#F1F5F9] overflow-hidden`}>
      {/* Header */}
      <div
        onPointerDown={!isInsidePip ? handlePointerDown : undefined}
        onPointerMove={!isInsidePip ? handlePointerMove : undefined}
        onPointerUp={!isInsidePip ? handlePointerUp : undefined}
        className="flex items-center justify-between border-b border-white/10 bg-[#0F172A]/80 px-4 py-2.5 backdrop-blur-md cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <SparkIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight bg-gradient-to-r from-sky-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Zytron AI
            </h3>
            <p className="text-[9.5px] font-mono text-[#94A3B8]">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleNotability && !isInsidePip && (
            <button
              type="button"
              onClick={onToggleNotability}
              className="flex h-6 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Schakel Notability modus in/uit"
            >
              <span>📝</span>
              <span className="hidden sm:inline">Notitie</span>
            </button>
          )}

          {!isInsidePip && (
            <button
              type="button"
              onClick={launchPictureInPicture}
              className="flex h-6 items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2 text-[10px] font-bold text-indigo-300 hover:bg-indigo-500/25 transition"
              title="Zweef over álle vensters en apps (Picture-in-Picture)"
            >
              <span>🗔</span>
              <span>Zweef OS</span>
            </button>
          )}

          {!isInsidePip && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs text-[#94A3B8] hover:bg-white/10 hover:text-white"
              title="Minimaliseer naar zwevend icoon"
            >
              ⚊
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isInsidePip && pipWindow) {
                pipWindow.close();
              } else {
                setIsVisible(false);
                setIsExpanded(false);
                showToast("Zytron AI verborgen (druk Alt+W om terug te halen)");
              }
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs text-[#94A3B8] hover:bg-rose-500 hover:text-white"
            title="Sluiten"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Prompts & Incoming Notes */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/5 bg-[#0B1120] px-3 py-1.5 no-scrollbar">
        {["Leg formule uit", "Vat notities samen", "Los op naar x", "Controleer stap"].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10.5px] font-medium text-[#CBD5E1] hover:border-indigo-400 hover:bg-indigo-500/15 hover:text-white transition"
          >
            {prompt}
          </button>
        ))}
        {incomingNotes.length > 0 && (
          <button
            type="button"
            onClick={() => sendMessage(`Leg deze klasgenoot-notitie uit: "${incomingNotes[0].text}"`)}
            className="shrink-0 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-2.5 py-0.5 text-[10.5px] font-medium text-indigo-200 hover:bg-indigo-500/30 transition"
          >
            💬 Analyseer notitie ({incomingNotes.length})
          </button>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-3 shadow-xs ${
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs"
                    : "border border-white/10 bg-[#161F30] text-[#E2E8F0] rounded-bl-xs"
                }`}
              >
                {m.imagePreview && (
                  <img
                    src={m.imagePreview}
                    alt="Bijlage"
                    className="mb-2 max-h-36 rounded-lg object-contain border border-white/10"
                  />
                )}
                <RichText text={m.text} />
              </div>
              <div className="mt-1 flex items-center gap-2 px-1 text-[9px] text-[#64748B]">
                <span>{m.time}</span>
                {!isUser && (onSendAnswerToRadar || onSendText) && (
                  <button
                    type="button"
                    onClick={() => handleShareToRadar(m.text)}
                    className="text-indigo-400 hover:underline"
                  >
                    Deel via Radar
                  </button>
                )}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(m.text);
                      showToast("Gekopieerd naar klembord");
                    }}
                    className="hover:text-white"
                  >
                    Kopieer
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#161F30] p-3 text-xs text-[#94A3B8]">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Zytron AI denkt na…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Thumbnail preview */}
      {selectedImage && (
        <div className="flex items-center justify-between border-t border-white/10 bg-[#0F172A] px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <img src={selectedImage.preview} alt="Thumb" className="h-7 w-7 rounded object-cover" />
            <span className="text-[11px] text-[#CBD5E1]">Foto bijgevoegd</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="text-xs text-[#94A3B8] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="border-t border-white/10 bg-[#0F172A] p-2.5">
        <div className="flex items-center gap-1.5">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-[#94A3B8] hover:bg-white/10 hover:text-white transition"
            title="Foto van opgave of formule toevoegen"
          >
            📷
          </button>

          <button
            type="button"
            onClick={toggleListening}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              isListening
                ? "border-rose-400 bg-rose-500 text-white animate-pulse"
                : "border-white/10 bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
            }`}
            title="Spreek vraag in (spraak)"
          >
            🎙️
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Vraag Zytron AI iets…"
            className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder-[#64748B] focus:border-indigo-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!inputText.trim() && !selectedImage}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Stuur
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hot-corner restore button when hidden */}
      {!isVisible && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(true);
            showToast("✨ Zytron AI hersteld");
          }}
          className="fixed bottom-3 right-3 z-[250] flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 backdrop-blur-md opacity-30 hover:opacity-100 hover:scale-110 hover:bg-indigo-600 hover:text-white transition-all"
          title="Herstel Zytron AI (of druk Alt+W)"
        >
          <SparkIcon className="h-4 w-4" />
        </button>
      )}

      {/* Portal to Picture-in-Picture window if active */}
      {pipWindow && createPortal(renderChatContent(true), pipWindow.document.body)}

      {/* Floating in-page widget (when not in PiP) */}
      {isVisible && !pipWindow && (
        <div
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
          }}
          className="fixed z-[250] select-none transition-shadow"
        >
          {!isExpanded ? (
            /* COLLAPSED FLOATING ORB */
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={() => {
                if (!hasMovedRef.current) setIsExpanded(true);
              }}
              className="group relative flex h-14 w-14 cursor-grab active:cursor-grabbing items-center justify-center rounded-full border border-indigo-400/40 bg-[#0F172A]/90 p-1 shadow-[0_8px_32px_rgba(99,102,241,0.35),0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
              title="Zytron AI • Versleep overal • Tik om te openen"
            >
              {/* Radial Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 via-sky-400/25 to-purple-500/30 animate-pulse pointer-events-none" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/15">
                <SparkIcon className="h-5 w-5" />
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  showToast("Zytron AI verborgen (druk Alt+W om terug te halen)");
                }}
                className="absolute -top-1.5 -left-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#1E293B] border border-white/20 text-[9px] text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-rose-600 transition"
                title="Verberg"
              >
                ✕
              </button>
            </div>
          ) : (
            /* EXPANDED CAPSULE */
            <div className="rounded-3xl border border-indigo-400/35 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_35px_rgba(99,102,241,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {renderChatContent(false)}
            </div>
          )}
        </div>
      )}
    </>
  );
}
