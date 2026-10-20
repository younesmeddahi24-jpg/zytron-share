"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  ArrowRight,
  Radio,
  Copy,
  Check,
  AlertTriangle,
  Tablet,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export default function InstallPage() {
  const [platform, setPlatform] = useState<"ios" | "android">("android");
  const [isIpad, setIsIpad] = useState(false);
  const [isNonSafari, setIsNonSafari] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeIosTab, setActiveIosTab] = useState<"homescreen" | "profile">("homescreen");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const ipad =
        /iPad/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isApple = ipad || /iPhone|iPod/.test(ua);
      setIsIpad(ipad);

      // Check if browsing in Chrome on iOS, or Instagram / WhatsApp in-app browser
      const isChromeIos = /CriOS/i.test(ua);
      const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Line|musical_ly|BytedanceWebview/i.test(ua);
      const isSafari = /Version\/.*Safari/i.test(ua) && !isChromeIos && !isInApp;

      if (isApple && !isSafari) {
        setIsNonSafari(true);
      }

      if (isApple) {
        setPlatform("ios");
      } else {
        setPlatform("android");
      }
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAndroidDownload = () => {
    setDownloadStarted(true);
    const a = document.createElement("a");
    a.href = "/api/download-apk";
    a.download = "zytron-share.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleIosProfileDownload = () => {
    window.location.href = "/api/ios-app";
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-sky-500 selection:text-black">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-500/15 via-cyan-400/10 to-indigo-500/15 blur-3xl" />
      </div>

      {/* Header */}
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
          <span>Naar App</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        {/* Platform Selector Tabs */}
        <div className="flex rounded-2xl bg-white/[0.05] p-1 border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setPlatform("ios")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              platform === "ios"
                ? "bg-white text-black shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>🍎 Apple (iPad / iPhone)</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform("android")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              platform === "android"
                ? "bg-sky-400 text-black shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>🤖 Android / Samsung</span>
          </button>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-center">
          {/* App Icon */}
          <div className="relative inline-flex items-center justify-center mx-auto mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-600 p-[2px] shadow-2xl shadow-sky-500/30">
              <div className="w-full h-full rounded-[20px] bg-[#090d16] flex items-center justify-center overflow-hidden">
                <img src="/apple-touch-icon.png" alt="Zytron Share Icon" className="w-14 h-14 object-contain" />
              </div>
            </div>
            <span
              className={`absolute -bottom-1 -right-1 text-black text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md ${
                platform === "ios" ? "bg-white" : "bg-emerald-400"
              }`}
            >
              {platform === "ios" ? (isIpad ? "iPad" : "iOS") : "APK"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Zytron Share {platform === "ios" ? (isIpad ? "voor iPad" : "voor iPhone") : "voor Android"}
          </h1>
          <p className="text-xs font-mono text-sky-300 mt-1 uppercase tracking-widest font-bold">
            {platform === "ios"
              ? isIpad
                ? "Echte app in je iPad Dock & Apps"
                : "Echte app op je Beginscherm & Apps"
              : "Officiële Native Android App"}
          </p>

          {/* IPHONE / IPAD / IOS INSTRUCTIONS */}
          {platform === "ios" ? (
            <div className="mt-6 text-left space-y-4">
              {/* NON-SAFARI WARNING (e.g. Chrome / WhatsApp) */}
              {isNonSafari && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Open in Safari vereist</span>
                  </div>
                  <p className="text-[11.5px] text-white/80 leading-relaxed">
                    Je zit nu in Chrome of een in-app browser. <strong>Apple staat web-apps installeren ALLEEN toe in Safari!</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-xl bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition hover:bg-amber-300"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Link Gekopieerd! Open nu Safari" : "Kopieer Link en open Safari"}</span>
                  </button>
                </div>
              )}

              {/* Sub-Tabs: Beginscherm (Aanbevolen) vs Profiel */}
              <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveIosTab("homescreen")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    activeIosTab === "homescreen"
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  ⚡ Methode 1: Safari (Aanbevolen)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIosTab("profile")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    activeIosTab === "profile"
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  ⚙️ Methode 2: WebClip Profiel
                </button>
              </div>

              {activeIosTab === "homescreen" ? (
                /* METHOD 1: SAFARI ADD TO HOME SCREEN */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/25 text-left">
                    <p className="text-xs font-extrabold text-sky-200 flex items-center gap-1.5">
                      {isIpad ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      <span>
                        {isIpad
                          ? "Op iPad: Deelknop zit RECHTSBOVEN naast de zoekbalk"
                          : "Op iPhone: Deelknop zit ONDERAAN in het midden"}
                      </span>
                    </p>
                    <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                      Zodra je dit doet, krijgt Zytron Share een eigen icoon tussen je apps en start hij zonder Safari-balk!
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Stap 1: Tik op het Deel-icoon [⎋]</p>
                        <p className="text-[11.5px] text-white/60 mt-0.5">
                          {isIpad
                            ? "Kijk rechtsboven in Safari (naast de adresbalk) en tik op het vierkantje met de pijl omhoog [⎋]."
                            : "Kijk onderaan in Safari en tik op het vierkantje met de pijl omhoog [⎋]."}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Stap 2: Tik op &ldquo;Zet op beginscherm&rdquo;</p>
                        <p className="text-[11.5px] text-white/60 mt-0.5">
                          Scroll een klein stukje omlaag in het menu en tik op <strong>&ldquo;Zet op beginscherm&rdquo;</strong> (Add to Home Screen).
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Stap 3: Tik rechtsboven op &ldquo;Voeg toe&rdquo;</p>
                        <p className="text-[11.5px] text-white/60 mt-0.5">
                          Klaar! Zytron Share staat nu direct met het echte logo tussen je apps op je {isIpad ? "iPad" : "iPhone"}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="/"
                    className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-white/10 hover:bg-white/90 transition cursor-pointer"
                  >
                    <span>👉 Open Zytron Share &amp; Voeg Toe</span>
                  </a>
                </div>
              ) : (
                /* METHOD 2: 1-TAP WEBCLIP PROFILE */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/25 text-left">
                    <p className="text-xs font-extrabold text-indigo-200">
                      ⚙️ Direct Apple WebClip Profiel Installeren:
                    </p>
                    <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                      Download het officiële Apple configuratiebestand. iOS zet Zytron Share dan direct op je beginscherm via Instellingen.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleIosProfileDownload}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 hover:scale-[1.01] transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>📲 Download iOS App Profiel</span>
                  </button>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <span className="text-white/80">Tik op de knop hierboven en kies <strong>&ldquo;Sta toe&rdquo;</strong> in Safari.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <span className="text-white/80">Open de app <strong>Instellingen</strong> op je iPad/iPhone.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <span className="text-white/80">Tik helemaal bovenaan op <strong>&ldquo;Profiel gedownload&rdquo;</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                      <span className="text-white/80">Tik rechtsboven op <strong>Installeer</strong>. De app verschijnt nu direct op je scherm!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ANDROID INSTRUCTIONS */
            <div className="mt-6 text-left space-y-4">
              {/* Feature Badges */}
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/[0.08]">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-extrabold text-white">8.3 MB</span>
                  <span className="text-[10px] text-white/50">Grootte</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/10">
                  <span className="text-xs font-extrabold text-emerald-400">BLE Mesh</span>
                  <span className="text-[10px] text-white/50">Achtergrond</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-extrabold text-sky-400">100% P2P</span>
                  <span className="text-[10px] text-white/50">Zonder Cloud</span>
                </div>
              </div>

              {/* Download Action Button */}
              <button
                onClick={handleAndroidDownload}
                type="button"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>{downloadStarted ? "Opnieuw Downloaden" : "📲 Download Android APK"}</span>
              </button>

              {downloadStarted && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-left">
                  <p className="text-xs font-extrabold text-emerald-300">Download gestart!</p>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    Open <strong>zytron-share.apk</strong> in je meldingen en tik op <strong>Installeren</strong>.
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span className="text-white/80">Tik op <strong>Download Android APK</strong>.</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span className="text-white/80">Open het gedownloade bestand <strong>zytron-share.apk</strong>.</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span className="text-white/80">Kies <strong>Installeren</strong> om de app op je telefoon te zetten.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-2 text-[11px] text-white/40">
        <p>Zytron Share • Direct P2P Mesh voor iOS &amp; Android</p>
      </footer>
    </div>
  );
}
