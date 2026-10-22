"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface WisprFlowIncomingNote {
  id: string;
  text: string;
  sender: string;
  time: string;
}

interface WisprFlowOverlayProps {
  onSendText: (text: string) => void;
  incomingNotes: WisprFlowIncomingNote[];
  onToggleNotability?: () => void;
  showToast: (msg: string) => void;
}

export default function WisprFlowOverlay({
  onSendText,
  incomingNotes,
  onToggleNotability,
  showToast,
}: WisprFlowOverlayProps) {
  // Visibility: visible, dismissed (hidden), or minimized pill
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);

  // Position coordinates (freely draggable across the entire screen)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 90) : 320,
    y: typeof window !== "undefined" ? Math.max(120, Math.floor(window.innerHeight / 2 - 40)) : 240,
  });

  const isDraggingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });

  // Hidden PiP Video element for cross-app OS floating mode
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard shortcut: Alt + W (or Option + W on Mac/iPad) to toggle/reappear Wispr Flow!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && (e.key.toLowerCase() === "w" || e.code === "KeyW")) {
        e.preventDefault();
        setIsVisible((prev) => {
          const next = !prev;
          if (next) {
            showToast("✨ Wispr Flow AI actief!");
          } else {
            showToast("Wispr Flow verborgen (druk Alt+W om terug te halen)");
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  // Pointer dragging events with boundary clamping
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from non-interactive handles
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    const maxX = window.innerWidth - (isExpanded ? 340 : 64);
    const maxY = window.innerHeight - (isExpanded ? 380 : 64);

    setPosition({
      x: Math.max(10, Math.min(maxX, dragStartRef.current.posX + dx)),
      y: Math.max(10, Math.min(maxY, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Magnetic snap to nearest edge when closed
    if (!isExpanded && hasMovedRef.current) {
      const screenMid = window.innerWidth / 2;
      setPosition((prev) => ({
        ...prev,
        x: prev.x < screenMid ? 14 : window.innerWidth - 74,
      }));
    }
  };

  // Click on the floating orb
  const handleOrbClick = () => {
    if (hasMovedRef.current) return;
    setIsExpanded((v) => !v);
  };

  // Voice dictation toggle
  const toggleVoiceDictation = () => {
    if (!isListening) {
      // Check SpeechRecognition
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "nl-NL";
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((r: any) => r[0].transcript)
              .join("");
            setInputText(transcript);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);

          recognition.start();
          showToast("🎙️ Spreek nu je vraag of formule in…");
        } catch {
          setIsListening(false);
        }
      } else {
        showToast("Spraakherkenning niet beschikbaar in deze browser");
      }
    } else {
      setIsListening(false);
    }
  };

  // Launch Picture-in-Picture mode (Floats over all native apps on OS!)
  const launchPictureInPicture = async () => {
    // 1. Try modern Document Picture-in-Picture API first (Chrome 116+, Edge, desktop)
    const docPip = (window as unknown as { documentPictureInPicture?: any }).documentPictureInPicture;
    if (docPip && typeof docPip.requestWindow === "function") {
      try {
        const pipWin = await docPip.requestWindow({
          width: 330,
          height: 220,
        });

        // Copy styles to PiP window
        document.querySelectorAll("link[rel='stylesheet'], style").forEach((elem) => {
          pipWin.document.head.appendChild(elem.cloneNode(true));
        });

        // Render sleek floating AI pill inside the OS-level floating window
        const container = pipWin.document.createElement("div");
        container.style.cssText =
          "background: #0B0F19; color: #fff; font-family: system-ui, sans-serif; padding: 14px; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;";
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">✨</span>
              <span style="font-weight: 800; font-size: 12px; background: linear-gradient(to right, #93c5fd, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Wispr Flow AI</span>
            </div>
            <span style="font-size: 10px; color: #34d399; font-weight: bold; background: rgba(52,211,153,0.15); padding: 2px 6px; rounded: 6px;">Overal actief</span>
          </div>
          <div id="pip-latest-note" style="margin: 8px 0; font-size: 12px; color: #e2e8f0; font-family: monospace; background: rgba(255,255,255,0.06); padding: 8px; border-radius: 8px; max-height: 80px; overflow-y: auto;">
            ${incomingNotes.length > 0 ? `<b>${incomingNotes[0].sender}:</b> ${incomingNotes[0].text}` : "Wachten op antwoorden of formules…"}
          </div>
          <div style="display: flex; gap: 6px;">
            <input id="pip-input" type="text" placeholder="Typ vraag of antwoord…" style="flex: 1; background: #1e293b; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 12px; outline: none;" />
            <button id="pip-send" style="background: #6366f1; border: none; color: #fff; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px;">Deel</button>
          </div>
        `;
        pipWin.document.body.style.margin = "0";
        pipWin.document.body.appendChild(container);

        const inputElem = container.querySelector("#pip-input") as HTMLInputElement;
        const sendBtn = container.querySelector("#pip-send") as HTMLButtonElement;
        const sendAction = () => {
          if (inputElem.value.trim()) {
            onSendText(inputElem.value.trim());
            inputElem.value = "";
          }
        };
        sendBtn.onclick = sendAction;
        inputElem.onkeydown = (e) => {
          if (e.key === "Enter") sendAction();
        };

        setIsPipActive(true);
        showToast("✨ Wispr Flow zweeft nu over al je apps!");
        pipWin.addEventListener("pagehide", () => setIsPipActive(false));
        return;
      } catch {
        // Fallback to video PiP
      }
    }

    // 2. Fallback: Canvas to Video Picture-in-Picture (Universally supported on iOS & browsers)
    try {
      const canvas = pipCanvasRef.current || document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      pipCanvasRef.current = canvas;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0B0F19";
        ctx.fillRect(0, 0, 320, 180);

        // Gradient banner
        const grad = ctx.createLinearGradient(0, 0, 320, 0);
        grad.addColorStop(0, "#4F46E5");
        grad.addColorStop(1, "#9333EA");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 320, 34);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px system-ui";
        ctx.fillText("✨ Wispr Flow • Live Klasgenoten Feed", 14, 22);

        ctx.fillStyle = "#E2E8F0";
        ctx.font = "12px monospace";
        const latest = incomingNotes[0];
        if (latest) {
          ctx.fillText(`${latest.sender}: ${latest.text.slice(0, 32)}`, 14, 70);
          ctx.fillText(latest.text.slice(32, 64), 14, 90);
        } else {
          ctx.fillText("Live gekoppeld met Zytron Radar", 14, 70);
          ctx.fillText("Antwoorden verschijnen direct hier!", 14, 90);
        }

        ctx.fillStyle = "#38BDF8";
        ctx.font = "10px sans-serif";
        ctx.fillText("Zweeft over Notability & andere apps", 14, 150);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (canvas as any).captureStream?.(30);
      if (stream) {
        let video = pipVideoRef.current;
        if (!video) {
          video = document.createElement("video");
          video.muted = true;
          video.playsInline = true;
          video.style.display = "none";
          document.body.appendChild(video);
          pipVideoRef.current = video;
        }
        video.srcObject = stream;
        await video.play();
        await video.requestPictureInPicture();
        setIsPipActive(true);
        showToast("✨ Zwevende widget geactiveerd over andere apps!");
      }
    } catch {
      showToast("Picture-in-Picture zweefvenster niet toegestaan door de browser");
    }
  };

  const handleSend = () => {
    if (inputText.trim()) {
      onSendText(inputText.trim());
      setInputText("");
      showToast("Bericht verzonden!");
    }
  };

  return (
    <>
      {/* =====================================================================
          1. INVISIBLE REAPPEAR HOT-ZONES (Bottom-Right & Bottom-Left Screen Corners)
             When Wispr Flow is dismissed, clicking/tapping the corner brings it back!
         ===================================================================== */}
      {!isVisible && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(true);
            showToast("✨ Wispr Flow AI hersteld!");
          }}
          className="fixed bottom-2 right-2 z-[250] flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 backdrop-blur-md opacity-25 hover:opacity-100 hover:scale-110 hover:bg-indigo-600 hover:text-white transition-all duration-200"
          title="Klik om Wispr Flow AI te herstellen (of druk Alt+W)"
        >
          <span className="text-xs">✨</span>
        </button>
      )}

      {/* =====================================================================
          2. THE FLOATING WISPR FLOW ORB & CAPSULE (Always on top of the page)
         ===================================================================== */}
      {isVisible && (
        <div
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          className="fixed z-[250] select-none transition-shadow duration-200"
        >
          {!isExpanded ? (
            /* COLLAPSED: Minimalist Glowing Wispr Flow Orb */
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleOrbClick}
              className="group relative flex h-14 w-14 cursor-grab active:cursor-grabbing items-center justify-center rounded-full border border-indigo-400/40 bg-[#0F172A]/90 p-1 shadow-[0_8px_32px_rgba(99,102,241,0.35),0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
              title="Wispr Flow AI • Versleep overal • Tik om te openen"
            >
              {/* Animated Glowing Radial Ambient Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6366F1]/30 via-[#38BDF8]/25 to-[#C084FC]/30 animate-pulse pointer-events-none" />

              {/* Pulsing Audio/AI Ring */}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/15">
                <span className="text-base text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 drop-shadow">
                  ✨
                </span>
                {/* Incoming Notification Indicator Badge */}
                {incomingNotes.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 text-[8px] font-black text-black items-center justify-center">
                      {incomingNotes.length}
                    </span>
                  </span>
                )}
              </div>

              {/* Small Dismiss Button on Hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  showToast("Wispr Flow verborgen (druk Alt+W om terug te halen)");
                }}
                className="absolute -top-1.5 -left-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#1E293B] border border-white/20 text-[9px] text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-rose-600 transition"
                title="Wegdoen (verbergen)"
              >
                ✕
              </button>
            </div>
          ) : (
            /* EXPANDED: Sleek Floating Wispr Flow Assistant Capsule */
            <div className="w-80 sm:w-88 rounded-3xl border border-indigo-400/40 bg-[#0B0F19]/96 p-4 text-[#F1F5F9] shadow-[0_16px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.25)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Header Handle & Controls */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="flex cursor-grab active:cursor-grabbing items-center justify-between border-b border-white/10 pb-3 select-none"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] text-white text-xs shadow-xs">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold tracking-tight bg-gradient-to-r from-sky-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                      Wispr Flow AI
                    </h3>
                    <p className="text-[9.5px] font-mono text-[#94A3B8]">Zwevende Assistent</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* PiP Button: Float over all desktop/iPad apps */}
                  <button
                    type="button"
                    onClick={launchPictureInPicture}
                    className={`flex h-6 items-center gap-1 rounded-lg px-2 text-[10px] font-bold border transition ${
                      isPipActive
                        ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                        : "border-white/15 bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
                    }`}
                    title="Zweef over álle vensters en apps (Picture-in-Picture)"
                  >
                    <span>🗔</span>
                    <span>Zweef OS</span>
                  </button>

                  {/* Collapse to Orb */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs text-[#94A3B8] hover:bg-white/10 hover:text-white"
                    title="Minimaliseer naar zwevend icoontje"
                  >
                    ⚊
                  </button>

                  {/* Dismiss completely (Wegdoen) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsVisible(false);
                      setIsExpanded(false);
                      showToast("Wispr Flow verborgen (druk Alt+W om terug te halen)");
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs text-[#94A3B8] hover:bg-rose-500 hover:text-white"
                    title="Wegdoen (verberg tot Alt+W)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Latest Incoming Classmate Note / Math Answer Preview */}
              <div className="mt-3 rounded-2xl border border-indigo-500/25 bg-[#1E293B]/60 p-2.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-[#94A3B8] mb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Klasgenoot Sync</span>
                  </span>
                  {incomingNotes[0] && <span>{incomingNotes[0].time}</span>}
                </div>
                {incomingNotes.length > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-white truncate">
                      <b className="text-[#93C5FD] mr-1.5">{incomingNotes[0].sender}:</b>
                      {incomingNotes[0].text}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(incomingNotes[0].text);
                        showToast("Gekopieerd naar klembord!");
                      }}
                      className="shrink-0 rounded-lg bg-indigo-500/30 border border-indigo-400/40 px-2 py-0.5 text-[10px] font-bold text-[#A5B4FC] hover:bg-indigo-500 hover:text-white transition"
                    >
                      Kopieer
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#64748B] italic">
                    Nog geen nieuwe formules of antwoorden ontvangen…
                  </p>
                )}
              </div>

              {/* Quick Math / Question Chips */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {["x = ?", "D = b² - 4ac", "Opgave 14?", "Wat heb jij?"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      onSendText(chip);
                      showToast(`"${chip}" verstuurd!`);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10.5px] text-[#CBD5E1] hover:border-indigo-400 hover:text-indigo-300 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Row: Voice Dictation + Text Input + Send Button */}
              <div className="mt-3 flex items-center gap-1.5">
                {/* Voice Whisper Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                    isListening
                      ? "border-rose-400 bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                      : "border-white/15 bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
                  }`}
                  title={isListening ? "Aan het luisteren… tik om te stoppen" : "Fluister vraag of formule (spraak)"}
                >
                  🎙️
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Fluister of typ antwoord…"
                  className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder-[#64748B] focus:border-indigo-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#38BDF8] px-3 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  Deel
                </button>
              </div>

              {/* Bottom Quick-Action Row: Camouflage & Hotkey reminder */}
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-[#94A3B8]">
                {onToggleNotability ? (
                  <button
                    type="button"
                    onClick={onToggleNotability}
                    className="flex items-center gap-1 text-[#93C5FD] hover:underline font-semibold"
                  >
                    <span>✎</span>
                    <span>Wissel Notability modus</span>
                  </button>
                ) : (
                  <span />
                )}
                <span className="font-mono text-[#64748B]">Sneltoets: Alt + W</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
