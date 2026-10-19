"use client";

import { useState } from "react";
import { Download, Smartphone, ShieldCheck, Zap, Radio, CheckCircle2, ArrowRight } from "lucide-react";

export default function InstallPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    // Direct download without leaving the page or opening GitHub
    const a = document.createElement("a");
    a.href = "/api/download-apk";
    a.download = "zytron-share.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-sky-500 selection:text-black">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-500/15 via-cyan-400/10 to-indigo-500/15 blur-3xl" />
      </div>

      {/* Header bar */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <a href="/" className="flex items-center gap-2.5 text-white/80 hover:text-white transition">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">Zytron Share</span>
        </a>
        <a
          href="/"
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
        >
          <span>Naar Web App</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Main Install Card */}
      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
          {/* App Icon */}
          <div className="relative inline-flex items-center justify-center mx-auto mb-5">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-600 p-[2px] shadow-2xl shadow-sky-500/30">
              <div className="w-full h-full rounded-[22px] bg-[#090d16] flex items-center justify-center overflow-hidden">
                <img src="/icon-192.png" alt="Zytron Share Icon" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
              APK
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Zytron Share
          </h1>
          <p className="text-xs font-mono text-sky-300 mt-1 uppercase tracking-widest font-bold">
            Officiële Native Android App
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-2 my-6 pt-2 border-t border-b border-white/[0.08] py-4">
            <div className="flex flex-col items-center">
              <span className="text-xs font-extrabold text-white">4.1 MB</span>
              <span className="text-[10px] text-white/50">Grootte</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-xs font-extrabold text-emerald-400">BLE Mesh</span>
              <span className="text-[10px] text-white/50">Achtergrond</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-extrabold text-sky-400">100% P2P</span>
              <span className="text-[10px] text-white/50">Privé & Direct</span>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleDownload}
            type="button"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{downloadStarted ? "Opnieuw Downloaden" : "📲 Installeer Nu (Direct)"}</span>
          </button>

          {/* Download Notification Banner */}
          {downloadStarted && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-left animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-emerald-300">Download is gestart!</p>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5 leading-relaxed">
                    Kijk in je meldingen of Downloads map, tik op <strong>zytron-share.apk</strong> en kies <strong>Installeren</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3 Steps instructions */}
          <div className="mt-6 text-left space-y-3">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider text-center">
              Hoe te installeren op je Samsung / Android:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span className="text-white/80">Tik hierboven op <strong>Installeer Nu</strong> om de APK te downloaden.</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span className="text-white/80">Open <strong>zytron-share.apk</strong> via je meldingen of Downloads.</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span className="text-white/80">Kies <strong>Installeren</strong> (geef toestemming voor &apos;onbekende bronnen&apos; als Samsung erom vraagt).</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-3 text-[11px] text-white/40">
        <p>Zytron Share v1.0 • Native Android Package • Veilig &amp; Zonder Advertenties</p>
      </footer>
    </div>
  );
}
