"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface NotabilityIncomingNote {
  id: string;
  text: string;
  sender: string;
  time: string;
}

interface NotabilityStealthViewProps {
  onExitStealth: () => void;
  quickText: string;
  setQuickText: (val: string) => void;
  onSendNote: (customText?: string) => void;
  incomingNotes: NotabilityIncomingNote[];
  connectedCount: number;
  onUploadFileToZytron?: (files: FileList) => void;
  showToast: (msg: string) => void;
}

type ToolType =
  | "pen"
  | "pencil"
  | "highlighter"
  | "eraser"
  | "lasso"
  | "text"
  | "tape"
  | "hand"
  | "laser";

type PaperGridType = "grid" | "lined" | "dotted" | "blank";
type PaperColorType = "white" | "cream" | "dark" | "blue";

interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

interface DrawStroke {
  id: string;
  tool: "pen" | "pencil" | "highlighter" | "eraser" | "laser";
  color: string;
  size: number;
  dash: "solid" | "dashed" | "dotted";
  points: StrokePoint[];
  isShape?: boolean;
  shapeType?: "line" | "rect" | "circle";
  createdAt?: number;
}

interface TapeStrip {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isRevealed: boolean;
}

interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: "yellow" | "blue" | "green" | "grid";
}

interface UploadedDocImage {
  id: string;
  name: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NotePageData {
  id: string;
  strokes: DrawStroke[];
  redoStack: DrawStroke[];
  typedText: string;
  tapes: TapeStrip[];
  stickies: StickyNoteItem[];
  images: UploadedDocImage[];
}

interface SubjectFolder {
  id: string;
  name: string;
  color: string;
  divider: string;
  defaultTitle: string;
  defaultContent: string;
}

const NOTABILITY_SUBJECTS: SubjectFolder[] = [
  {
    id: "wiskunde-b",
    name: "Wiskunde B",
    color: "#007AFF",
    divider: "Exacte Vakken",
    defaultTitle: "H4.3 Kwadratische Vergelijkingen & Parabolen",
    defaultContent:
      "§4.3 De ABC-formule en Discriminant\n\nAlgemene vorm: f(x) = ax² + bx + c = 0\nDiscriminant: D = b² - 4ac\n\n• D > 0  ⇒  2 reële oplossingen (snijpunten met x-as): x = (-b ± √D) / 2a\n• D = 0  ⇒  1 raakpunt (top op x-as): x = -b / 2a\n• D < 0  ⇒  Geen reële oplossingen\n\nOpgave 14a:\n2x² - 7x + 3 = 0\nD = (-7)² - 4 · 2 · 3 = 49 - 24 = 25\nx₁ = (7 + 5) / 4 = 3   ∨   x₂ = (7 - 5) / 4 = ½",
  },
  {
    id: "natuurkunde",
    name: "Natuurkunde",
    color: "#5856D6",
    divider: "Exacte Vakken",
    defaultTitle: "H3 Kracht en Beweging — Wetten van Newton",
    defaultContent:
      "§3.2 Tweede Wet van Newton\n\nF_res = m · a\n• F_res : resulterende kracht in Newton (N)\n• m : massa in kilogram (kg)\n• a : versnelling in m/s²\n\nZwaartekracht: F_z = m · g   (g = 9,81 m/s²)\nArbeid: W = F · s · cos(α)",
  },
  {
    id: "scheikunde",
    name: "Scheikunde",
    color: "#34C759",
    divider: "Exacte Vakken",
    defaultTitle: "H5 Chemisch Rekenen & Molariteit",
    defaultContent:
      "§5.1 Molmassa en Concentratie\n\nn = m / M\n• n = aantal mol (mol)\n• m = massa in gram (g)\n• M = molaire massa (g/mol)\n\nMolariteit: [A] = n / V  (in mol/L)",
  },
  {
    id: "nederlands",
    name: "Nederlands",
    color: "#AF52DE",
    divider: "Talen",
    defaultTitle: "Argumentatiestructuren & Drogredenen",
    defaultContent:
      "Overzicht Argumentatieschema's:\n1. Oorzaak en gevolg\n2. Vergelijkingsargumentatie\n3. Kenmerk of symptoom\n\nVeelvoorkomende drogredenen:\n• Persoonlijke aanval (ad hominem)\n• Overhaaste generalisatie\n• Cirkelredenering",
  },
  {
    id: "engels",
    name: "Engels",
    color: "#00C7BE",
    divider: "Talen",
    defaultTitle: "Grammar — Present Perfect vs. Past Simple",
    defaultContent:
      "1. Past Simple: finished actions at a specific time in the past (yesterday, in 2022, last week).\n2. Present Perfect: have/has + past participle. Started in the past and continues now, or result is still visible.",
  },
  {
    id: "economie",
    name: "Economie",
    color: "#FF2D55",
    divider: "Maatschappij",
    defaultTitle: "H2 Markt, Vraag en Aanbod — Prijselasticiteit",
    defaultContent:
      "Prijselasticiteit van de vraag (Ev):\nEv = (% verandering gevraagde hoeveelheid) / (% verandering prijs)\n\nTotale Winst (TW) = TO - TK\nBreak-even punt: TO = TK  (of MO = MK voor maximale winst)",
  },
];

const PEN_COLORS = [
  "#1C1C1E", // Notability Charcoal Black
  "#007AFF", // Classic iOS Blue
  "#0A84FF", // Sky Blue
  "#5856D6", // Indigo
  "#AF52DE", // Purple
  "#FF2D55", // Rose Pink
  "#FF3B30", // Crimson Red
  "#34C759", // Emerald Green
  "#00C7BE", // Mint Teal
  "#8E8E93", // Slate Gray
];

const HIGHLIGHTER_COLORS = [
  "#FACC15", // Neon Yellow
  "#4ADE80", // Pastel Green
  "#60A5FA", // Ice Blue
  "#C084FC", // Soft Violet
  "#F472B6", // Highlighter Pink
  "#2DD4BF", // Aqua
];

const TAPE_COLORS = [
  "#FACC15", // Classic Yellow Caution Tape
  "#38BDF8", // Sky Blue
  "#F472B6", // Bubblegum Pink
  "#A78BFA", // Lavender
  "#4ADE80", // Mint
];

export default function NotabilityStealthView({
  onExitStealth,
  quickText,
  setQuickText,
  onSendNote,
  incomingNotes,
  connectedCount,
  onUploadFileToZytron,
  showToast,
}: NotabilityStealthViewProps) {
  // Active Subject & Note Title
  const [activeSubjectId, setActiveSubjectId] = useState<string>("wiskunde-b");
  const activeSubject =
    NOTABILITY_SUBJECTS.find((s) => s.id === activeSubjectId) || NOTABILITY_SUBJECTS[0];

  const [noteTitle, setNoteTitle] = useState<string>(activeSubject.defaultTitle);
  const [showLibrarySidebar, setShowLibrarySidebar] = useState<boolean>(false);
  const [showPagesSidebar, setShowPagesSidebar] = useState<boolean>(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState<boolean>(false);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [searchOrBeamInput, setSearchOrBeamInput] = useState<string>("");

  // Secret Notability AI Chat & Math Solver Drawer (Camouflaged Classmate Messenger!)
  const [showNotabilityAiDrawer, setShowNotabilityAiDrawer] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>("");

  // Audio Recording state (Notability iconic voice memo with waveform)
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hasRecordedAudio, setHasRecordedAudio] = useState<boolean>(false);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState<boolean>(false);

  // Zoom level (Notability zoom pill: 75%, 100%, 125%, 150%)
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Paper appearance
  const [paperGrid, setPaperGrid] = useState<PaperGridType>("grid");
  const [paperColor, setPaperColor] = useState<PaperColorType>("white");

  // Toolbox state
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [openPopoverTool, setOpenPopoverTool] = useState<
    "pen" | "pencil" | "highlighter" | "eraser" | "tape" | null
  >(null);
  const [penColor, setPenColor] = useState<string>("#007AFF");
  const [penSize, setPenSize] = useState<number>(2.5);
  const [penDash, setPenDash] = useState<"solid" | "dashed" | "dotted">("solid");

  const [pencilColor, setPencilColor] = useState<string>("#1C1C1E");
  const [pencilSize, setPencilSize] = useState<number>(3);

  const [highlighterColor, setHighlighterColor] = useState<string>("#FACC15");
  const [highlighterSize, setHighlighterSize] = useState<number>(18);

  const [eraserSize, setEraserSize] = useState<number>(22);
  const [eraserMode, setEraserMode] = useState<"whole" | "partial">("partial");

  const [selectedTapeColor, setSelectedTapeColor] = useState<string>("#FACC15");

  // Ruler overlay
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [rulerPos, setRulerPos] = useState<{ x: number; y: number }>({
    x: 160,
    y: 280,
  });
  const isDraggingRulerRef = useRef<boolean>(false);
  const rulerDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating Toolbox position & drag state (freely draggable anywhere!)
  const [toolboxPos, setToolboxPos] = useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? Math.max(20, Math.floor(window.innerWidth / 2 - 240)) : 200,
    y: 56,
  });
  const [isToolboxMinimized, setIsToolboxMinimized] = useState<boolean>(false);
  const isDraggingToolboxRef = useRef<boolean>(false);
  const toolboxDragStartRef = useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number }>({
    mouseX: 0,
    mouseY: 0,
    boxX: 0,
    boxY: 0,
  });

  // Multi-page state
  const [pages, setPages] = useState<NotePageData[]>([
    {
      id: "page-1",
      strokes: [],
      redoStack: [],
      typedText: activeSubject.defaultContent,
      tapes: [],
      stickies: [],
      images: [],
    },
    {
      id: "page-2",
      strokes: [],
      redoStack: [],
      typedText: "",
      tapes: [],
      stickies: [],
      images: [],
    },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const currentPage = pages[currentPageIndex] || pages[0];

  // Canvas & Drawing Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<DrawStroke | null>(null);
  const laserStrokesRef = useRef<DrawStroke[]>([]);
  const docUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Shape Recognition Timer (Hold pointer still for 400ms at stroke end to auto-snap!)
  const shapeHoldTimerRef = useRef<number | null>(null);
  const lastPointRef = useRef<StrokePoint | null>(null);

  // Switch subject handler
  const handleSelectSubject = (subj: SubjectFolder) => {
    setActiveSubjectId(subj.id);
    setNoteTitle(subj.defaultTitle);
    setPages((prev) => {
      const copy = [...prev];
      if (copy[0]) {
        copy[0] = { ...copy[0], typedText: subj.defaultContent };
      }
      return copy;
    });
    setCurrentPageIndex(0);
    setShowLibrarySidebar(false);
  };

  // Audio Recording Timer
  useEffect(() => {
    if (!isRecordingAudio) return;
    const t = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [isRecordingAudio]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Render all strokes onto the active HTML5 Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const drawSingleStroke = (stroke: DrawStroke) => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;

      if (stroke.dash === "dashed") {
        ctx.setLineDash([stroke.size * 3, stroke.size * 2]);
      } else if (stroke.dash === "dotted") {
        ctx.setLineDash([stroke.size * 0.5, stroke.size * 2.2]);
      } else {
        ctx.setLineDash([]);
      }

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.36;
        ctx.strokeStyle = stroke.color;
        ctx.lineCap = "butt";
      } else if (stroke.tool === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.78;
        ctx.strokeStyle = stroke.color;
      } else if (stroke.tool === "laser") {
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowColor = "#FF3B30";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#FF3B30";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.strokeStyle = stroke.color;
      }

      ctx.beginPath();
      const pts = stroke.points;

      if (stroke.isShape && stroke.shapeType === "line" && pts.length >= 2) {
        // Snapped straight line
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      } else if (stroke.isShape && stroke.shapeType === "rect" && pts.length >= 2) {
        // Snapped rectangle
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      } else if (stroke.isShape && stroke.shapeType === "circle" && pts.length >= 2) {
        // Snapped ellipse/circle
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rx = Math.abs(maxX - minX) / 2;
        const ry = Math.abs(maxY - minY) / 2;
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pts.length === 1) {
        ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
        ctx.fill();
      } else {
        // Smooth Quadratic Bézier Ink Interpolation
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
      ctx.restore();
    };

    for (const s of currentPage.strokes) {
      drawSingleStroke(s);
    }
    if (currentStrokeRef.current) {
      drawSingleStroke(currentStrokeRef.current);
    }
    for (const ls of laserStrokesRef.current) {
      drawSingleStroke(ls);
    }

    ctx.restore();
  }, [currentPage.strokes]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, currentPageIndex, paperGrid, paperColor, zoomLevel]);

  useEffect(() => {
    const onResize = () => renderCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderCanvas]);

  // Keyboard shortcuts: Esc for Stealth Exit, Ctrl+Z for Undo, Ctrl+Shift+Z for Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onExitStealth();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag !== "INPUT" && tag !== "TEXTAREA") {
            e.preventDefault();
            handleUndo();
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Calculate canvas coordinates
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoomLevel;
    let y = (e.clientY - rect.top) / zoomLevel;

    // Snap to ruler edge if active and nearby
    if (showRuler) {
      const distY = Math.abs(y - rulerPos.y);
      if (distY < 28) {
        y = rulerPos.y;
      }
    }

    return {
      x,
      y,
      pressure: e.pressure || 0.5,
      time: Date.now(),
    };
  };

  // Notability Shape Recognition Detection (Auto-detect straight lines, circles, boxes when held!)
  const detectShape = (pts: StrokePoint[]): { isShape: boolean; shapeType?: "line" | "rect" | "circle" } => {
    if (pts.length < 12) return { isShape: false };

    const first = pts[0];
    const last = pts[pts.length - 1];
    const startEndDist = Math.hypot(last.x - first.x, last.y - first.y);

    // If start and end meet -> Closed shape (Circle or Rectangle)
    if (startEndDist < 35 && pts.length > 20) {
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      const w = maxX - minX;
      const h = maxY - minY;
      const aspectRatio = w / Math.max(1, h);

      if (aspectRatio > 0.75 && aspectRatio < 1.35) {
        return { isShape: true, shapeType: "circle" };
      }
      return { isShape: true, shapeType: "rect" };
    }

    // Straight line detection (check if points deviate from the chord line)
    let maxDeviation = 0;
    const totalDist = Math.hypot(last.x - first.x, last.y - first.y);
    if (totalDist > 60) {
      for (const p of pts) {
        // Distance from point to line between first and last
        const num = Math.abs((last.y - first.y) * p.x - (last.x - first.x) * p.y + last.x * first.y - last.y * first.x);
        const dist = num / totalDist;
        if (dist > maxDeviation) maxDeviation = dist;
      }
      if (maxDeviation < 24) {
        return { isShape: true, shapeType: "line" };
      }
    }

    return { isShape: false };
  };

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === "hand" || activeTool === "text" || activeTool === "lasso") return;
    setOpenPopoverTool(null);
    setShowTemplateMenu(false);

    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;

    // Tape Tool: places a colored study tape strip over the line
    if (activeTool === "tape") {
      isDrawingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      currentStrokeRef.current = {
        id: `tape-stroke-${Date.now()}`,
        tool: "pen",
        color: selectedTapeColor,
        size: 24,
        dash: "solid",
        points: [pt],
      };
      renderCanvas();
      return;
    }

    // Whole-stroke eraser check
    if (activeTool === "eraser" && eraserMode === "whole") {
      isDrawingRef.current = true;
      eraseWholeStrokeAt(pt.x, pt.y);
      return;
    }

    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const color =
      activeTool === "pen"
        ? penColor
        : activeTool === "pencil"
          ? pencilColor
          : activeTool === "highlighter"
            ? highlighterColor
            : "#FF3B30";

    const size =
      activeTool === "pen"
        ? penSize
        : activeTool === "pencil"
          ? pencilSize
          : activeTool === "highlighter"
            ? highlighterSize
            : activeTool === "eraser"
              ? eraserSize
              : 4;

    currentStrokeRef.current = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      tool: activeTool as DrawStroke["tool"],
      color,
      size,
      dash: activeTool === "pen" ? penDash : "solid",
      points: [pt],
      createdAt: Date.now(),
    };
    renderCanvas();
  };

  const eraseWholeStrokeAt = (x: number, y: number) => {
    const threshold = eraserSize;
    setPages((prev) =>
      prev.map((pg, idx) => {
        if (idx !== currentPageIndex) return pg;
        const filtered = pg.strokes.filter((s) => {
          if (s.tool === "eraser") return true;
          return !s.points.some((p) => Math.hypot(p.x - x, p.y - y) <= threshold);
        });
        if (filtered.length === pg.strokes.length) return pg;
        return { ...pg, strokes: filtered };
      })
    );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasPoint(e);

    if (activeTool === "eraser" && eraserMode === "whole") {
      eraseWholeStrokeAt(pt.x, pt.y);
      return;
    }

    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(pt);

    // Check for Hold-to-Snap Shape recognition
    if (shapeHoldTimerRef.current) {
      window.clearTimeout(shapeHoldTimerRef.current);
    }
    shapeHoldTimerRef.current = window.setTimeout(() => {
      if (isDrawingRef.current && currentStrokeRef.current) {
        const shape = detectShape(currentStrokeRef.current.points);
        if (shape.isShape) {
          currentStrokeRef.current.isShape = true;
          currentStrokeRef.current.shapeType = shape.shapeType;
          renderCanvas();
          showToast(`Vorm herkend: ${shape.shapeType === "line" ? "Rechte lijn" : shape.shapeType === "circle" ? "Cirkel" : "Rechthoek"}`);
        }
      }
    }, 420);

    renderCanvas();
  };

  const handlePointerUp = () => {
    if (shapeHoldTimerRef.current) {
      window.clearTimeout(shapeHoldTimerRef.current);
      shapeHoldTimerRef.current = null;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const finished = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (!finished) return;

    // Handle Tape tool placement
    if (activeTool === "tape") {
      const pts = finished.points;
      if (pts.length >= 2) {
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        const newTape: TapeStrip = {
          id: `tape-${Date.now()}`,
          x: minX,
          y: minY - 4,
          width: Math.max(60, maxX - minX),
          height: Math.max(26, maxY - minY + 8),
          color: selectedTapeColor,
          isRevealed: false,
        };
        setPages((prev) =>
          prev.map((pg, idx) =>
            idx === currentPageIndex ? { ...pg, tapes: [...pg.tapes, newTape] } : pg
          )
        );
      }
      renderCanvas();
      return;
    }

    if (finished.tool === "laser") {
      laserStrokesRef.current.push(finished);
      renderCanvas();
      window.setTimeout(() => {
        laserStrokesRef.current = laserStrokesRef.current.filter((s) => s.id !== finished.id);
        renderCanvas();
      }, 1100);
      return;
    }

    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex
          ? {
              ...pg,
              strokes: [...pg.strokes, finished],
              redoStack: [],
            }
          : pg
      )
    );
  };

  const handleUndo = () => {
    setPages((prev) =>
      prev.map((pg, idx) => {
        if (idx !== currentPageIndex || pg.strokes.length === 0) return pg;
        const last = pg.strokes[pg.strokes.length - 1];
        return {
          ...pg,
          strokes: pg.strokes.slice(0, -1),
          redoStack: [last, ...pg.redoStack],
        };
      })
    );
  };

  const handleRedo = () => {
    setPages((prev) =>
      prev.map((pg, idx) => {
        if (idx !== currentPageIndex || pg.redoStack.length === 0) return pg;
        const [next, ...rest] = pg.redoStack;
        return {
          ...pg,
          strokes: [...pg.strokes, next],
          redoStack: rest,
        };
      })
    );
  };

  const handleClearPage = () => {
    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex ? { ...pg, strokes: [], redoStack: [], images: [], stickies: [], tapes: [] } : pg
      )
    );
    showToast("Pagina gewist");
  };

  // Add Sticky Note (Plaknotitie)
  const handleAddStickyNote = () => {
    const newSticky: StickyNoteItem = {
      id: `sticky-${Date.now()}`,
      x: 340 + (currentPage.stickies.length * 24) % 180,
      y: 120 + (currentPage.stickies.length * 24) % 160,
      width: 230,
      height: 165,
      text: "",
      color: "yellow",
    };
    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex ? { ...pg, stickies: [...pg.stickies, newSticky] } : pg
      )
    );
  };

  // Toggle reveal state of a tape strip
  const handleToggleTape = (tapeId: string) => {
    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex
          ? {
              ...pg,
              tapes: pg.tapes.map((t) => (t.id === tapeId ? { ...t, isRevealed: !t.isRevealed } : t)),
            }
          : pg
      )
    );
  };

  // Delete tape strip
  const handleDeleteTape = (tapeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex ? { ...pg, tapes: pg.tapes.filter((t) => t.id !== tapeId) } : pg
      )
    );
  };

  // Upload Document / Image / Worksheet directly onto Notability Page
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (onUploadFileToZytron) {
      onUploadFileToZytron(files);
    }

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || "");
          const imgItem: UploadedDocImage = {
            id: `doc-img-${Date.now()}-${Math.random()}`,
            name: file.name,
            dataUrl,
            x: 48,
            y: 110,
            width: 580,
            height: 420,
          };
          setPages((prev) =>
            prev.map((pg, idx) =>
              idx === currentPageIndex ? { ...pg, images: [...pg.images, imgItem] } : pg
            )
          );
          showToast(`Werkblad "${file.name}" ingevoegd — teken direct op de pagina!`);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setPages((prev) =>
            prev.map((pg, idx) =>
              idx === currentPageIndex
                ? {
                    ...pg,
                    typedText:
                      pg.typedText +
                      `\n\n📄 [Geïmporteerd Document: ${file.name} (${Math.round(file.size / 1024)} KB)]\n` +
                      `--------------------------------------------------\n`,
                  }
                : pg
            )
          );
          showToast(`Document "${file.name}" geüpload in notitie!`);
        };
        reader.readAsArrayBuffer(file);
      }
    });
    e.target.value = "";
  };

  // Export current note as PDF / Image download
  const handleExportNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${noteTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Notability.png`;
      a.click();
      showToast("Notitie geëxporteerd als afbeelding!");
    } catch {
      showToast("Exporteren voltooid");
    }
  };

  // Add new page
  const handleAddPage = () => {
    const newPage: NotePageData = {
      id: `page-${pages.length + 1}-${Date.now()}`,
      strokes: [],
      redoStack: [],
      typedText: "",
      tapes: [],
      stickies: [],
      images: [],
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  };

  // Paper Background CSS
  const getPaperStyles = (): React.CSSProperties => {
    const bgColors: Record<PaperColorType, string> = {
      white: "#FFFFFF",
      cream: "#FBF8EC",
      dark: "#1C1C1E",
      blue: "#F2F7FF",
    };
    const lineColors: Record<PaperColorType, string> = {
      white: "#E2E8F0",
      cream: "#E6DEC3",
      dark: "#2C2C2E",
      blue: "#CFE2FF",
    };

    const bg = bgColors[paperColor];
    const line = lineColors[paperColor];

    if (paperGrid === "grid") {
      return {
        backgroundColor: bg,
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      };
    }
    if (paperGrid === "lined") {
      return {
        backgroundColor: bg,
        backgroundImage: `linear-gradient(90deg, transparent 55px, #FCA5A5 55px, #FCA5A5 56.5px, transparent 56.5px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 100% 30px",
      };
    }
    if (paperGrid === "dotted") {
      return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(${line} 1.4px, transparent 1.4px)`,
        backgroundSize: "24px 24px",
      };
    }
    return {
      backgroundColor: bg,
    };
  };

  const isDarkPaper = paperColor === "dark";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F2F2F7] text-[#1C1C1E] select-none overflow-hidden font-sans antialiased">
      {/* Hidden File Input for Uploading Worksheets / Photos / PDFs */}
      <input
        ref={docUploadInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleDocumentUpload}
        className="hidden"
      />


      {/* =====================================================================
          1. AUTHENTIC NOTABILITY iPadOS TOP NAVIGATION BAR
         ===================================================================== */}
      <header className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b border-[#D1D1D6]/80 bg-[#F9F9FB]/95 px-3 backdrop-blur-md">
        {/* Left Navigation Group: Back to Library, Sidebar Toggle, Document Import */}
        <div className="flex items-center gap-1.5">
          {/* Back Arrow (<) : Single click toggles Subject Library, Double click exits to Zytron */}
          <button
            type="button"
            onClick={() => setShowLibrarySidebar((v) => !v)}
            onDoubleClick={onExitStealth}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[#007AFF] hover:bg-black/[0.05] active:scale-95 transition"
            title="Klik voor Vakken-bibliotheek • Dubbelklik (of Esc) voor Zytron Radar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[13px] font-semibold hidden sm:inline">Bibliotheek</span>
          </button>

          {/* Sidebar Icon */}
          <button
            type="button"
            onClick={() => setShowLibrarySidebar((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              showLibrarySidebar ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Zijbalk Vakken & Onderwerpen"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2.5" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>

          {/* Import Worksheet / PDF / Photo Icon */}
          <button
            type="button"
            onClick={() => docUploadInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#3C3C43] hover:bg-black/[0.05] transition"
            title="Importeer Werkblad / PDF / Foto"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {/* Center Note Title & Subject Pill */}
        <div className="flex flex-col items-center justify-center min-w-0 max-w-[42%] sm:max-w-[48%]">
          <div className="flex items-center gap-1.5 w-full justify-center">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: activeSubject.color }}
            />
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full truncate bg-transparent text-center text-[13.5px] font-semibold text-[#1C1C1E] focus:bg-white focus:px-2 focus:rounded-md focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
          <span className="text-[10px] text-[#8E8E93] leading-tight truncate">
            {activeSubject.name} • Pagina {currentPageIndex + 1} van {pages.length}
            {connectedCount > 0 ? ` • iCloud Sync (${connectedCount})` : " • iCloud"}
          </span>
        </div>

        {/* Right Group: Zoom Pill, Microphone, Notability AI (Secret Chat), Search, Page Thumbnails, Paper Settings (...) */}
        <div className="flex items-center gap-1">
          {/* Zoom Level Indicator Pill */}
          <div className="hidden md:flex items-center gap-1 rounded-lg border border-[#E5E5EA] bg-white px-2 py-0.5 text-[10.5px] font-mono font-bold text-[#636366]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
              className="hover:text-black"
            >
              -
            </button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.25).toFixed(2))))}
              className="hover:text-black"
            >
              +
            </button>
          </div>

          {/* Notability Iconic Microphone Audio Recorder with Live Bouncing Waveform */}
          <button
            type="button"
            onClick={() => {
              if (!isRecordingAudio) {
                setIsRecordingAudio(true);
                setRecordingSeconds(0);
              } else {
                setIsRecordingAudio(false);
                setHasRecordedAudio(true);
                showToast("Spraakopname gesynchroniseerd met notitietijdlijn");
              }
            }}
            className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition ${
              isRecordingAudio
                ? "bg-[#FF3B30] text-white animate-pulse shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Geluidsopname starten/stoppen (Note Replay)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {isRecordingAudio && <span className="font-mono text-[11px]">{formatTimer(recordingSeconds)}</span>}
          </button>

          {/* NOTABILITY AI (Camouflaged Secret Classmate Messenger!) */}
          <button
            type="button"
            onClick={() => setShowNotabilityAiDrawer((v) => !v)}
            className={`flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-bold transition ${
              showNotabilityAiDrawer
                ? "bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white shadow-xs"
                : "text-[#6366F1] hover:bg-[#6366F1]/10"
            }`}
            title="Notability AI Helper • Opgave-assistent & Formules (Geheime Chat)"
          >
            <span className="text-sm">✨</span>
            <span className="hidden sm:inline font-sans text-[11.5px]">AI</span>
            {incomingNotes.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Search Icon */}
          <button
            type="button"
            onClick={() => setShowSearchBar((v) => !v)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition ${
              showSearchBar ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Zoek in notitie"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Page Manager (Stacked Pages Icon) */}
          <button
            type="button"
            onClick={() => setShowPagesSidebar((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              showPagesSidebar ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Pagina-overzicht"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="13" height="16" rx="2" />
              <path d="M16 18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
            </svg>
          </button>

          {/* More / Paper Settings (...) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                showTemplateMenu ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
              }`}
              title="Papier, Rooster & Opties"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="19" cy="12" r="1.75" />
              </svg>
            </button>

            {/* Authentic Notability Paper & Template Popover */}
            {showTemplateMenu && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-black/10 bg-white/98 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2.5 mb-3">
                  <span className="text-xs font-bold text-[#1C1C1E]">Notitie-instellingen</span>
                  <button
                    type="button"
                    onClick={() => setShowTemplateMenu(false)}
                    className="text-xs font-semibold text-[#007AFF]"
                  >
                    Gereed
                  </button>
                </div>

                {/* Paper Template Type */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Papiersjabloon
                </p>
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {(
                    [
                      { id: "grid", label: "Ruitjes" },
                      { id: "lined", label: "Gelijnd" },
                      { id: "dotted", label: "Stippels" },
                      { id: "blank", label: "Blanco" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPaperGrid(t.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10.5px] font-medium transition ${
                        paperGrid === t.id
                          ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-bold"
                          : "border-[#E5E5EA] text-[#3C3C43] hover:bg-[#F2F2F7]"
                      }`}
                    >
                      <div className="h-6 w-6 rounded border border-[#C7C7CC] bg-white flex items-center justify-center text-[9px]">
                        {t.id === "grid" ? "⊞" : t.id === "lined" ? "☰" : t.id === "dotted" ? "∷" : "□"}
                      </div>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Paper Color */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Papierkleur
                </p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(
                    [
                      { id: "white", label: "Wit", bg: "#FFFFFF" },
                      { id: "cream", label: "Crème", bg: "#FBF8EC" },
                      { id: "blue", label: "Blauw", bg: "#F2F7FF" },
                      { id: "dark", label: "Donker", bg: "#1C1C1E" },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPaperColor(c.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] font-medium transition ${
                        paperColor === c.id ? "border-[#007AFF] ring-1 ring-[#007AFF]" : "border-[#E5E5EA]"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-black/15"
                        style={{ backgroundColor: c.bg }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-1.5 border-t border-[#E5E5EA] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportNote();
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs font-semibold text-[#1C1C1E] hover:bg-[#E5E5EA] transition"
                  >
                    <span>Exporteer Notitie (Afbeelding / PDF)</span>
                    <span>📥</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClearPage();
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs font-semibold text-[#FF3B30] hover:bg-[#E5E5EA] transition"
                  >
                    <span>Pagina leegmaken</span>
                    <span>⌫</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExitStealth}
                    className="flex w-full items-center justify-between rounded-xl bg-[#007AFF]/10 px-3 py-2 text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/20 transition"
                  >
                    <span>Terug naar Zytron Radar</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Note Replay Audio Playback Bar (When audio was recorded) */}
      {hasRecordedAudio && (
        <div className="relative z-30 flex h-8 items-center justify-between border-b border-[#D1D1D6] bg-amber-50/95 px-6 text-xs text-[#1C1C1E]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingRecordedAudio((p) => !p)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1C1C1E] text-white text-[9px]"
            >
              {isPlayingRecordedAudio ? "❚❚" : "▶"}
            </button>
            <span className="font-mono text-[11px] text-[#636366]">
              {formatTimer(recordingSeconds)} / {formatTimer(recordingSeconds)}
            </span>
            <div className="h-1.5 w-48 rounded-full bg-amber-200 overflow-hidden">
              <div className="h-full w-2/3 bg-amber-500 rounded-full" />
            </div>
            <span className="text-[10.5px] font-semibold text-[#78350F]">
              Note Replay • Audio gekoppeld aan inktlijnen
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHasRecordedAudio(false)}
            className="text-[11px] text-[#8E8E93] hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Discreet "Zoek in notitie" Popover Bar */}
      {showSearchBar && (
        <div className="absolute right-4 top-18 z-50 flex w-80 items-center gap-2 rounded-2xl border border-black/10 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xl">
          <svg className="h-4 w-4 text-[#8E8E93] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchOrBeamInput}
            onChange={(e) => {
              setSearchOrBeamInput(e.target.value);
              setQuickText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchOrBeamInput.trim()) {
                onSendNote(searchOrBeamInput.trim());
                setSearchOrBeamInput("");
              }
            }}
            placeholder="Zoek in notitie…"
            autoFocus
            className="flex-1 bg-transparent text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
          />
          {searchOrBeamInput.trim() && (
            <button
              type="button"
              onClick={() => {
                onSendNote(searchOrBeamInput.trim());
                setSearchOrBeamInput("");
              }}
              className="rounded-lg bg-[#007AFF] px-2 py-1 text-[10.5px] font-bold text-white"
            >
              Zoek
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          2. ICONIC FREELY DRAGGABLE NOTABILITY 14/15 FLOATING TOOLBOX
         ===================================================================== */}
      <div
        style={{
          left: `${toolboxPos.x}px`,
          top: `${toolboxPos.y}px`,
        }}
        className="fixed z-40 transition-shadow select-none"
      >
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-[22px] border border-black/[0.08] bg-white/95 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          {/* Draggable Gripper Handle (⋮⋮) */}
          <div
            onPointerDown={(e) => {
              isDraggingToolboxRef.current = true;
              toolboxDragStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                boxX: toolboxPos.x,
                boxY: toolboxPos.y,
              };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDraggingToolboxRef.current) return;
              const dx = e.clientX - toolboxDragStartRef.current.mouseX;
              const dy = e.clientY - toolboxDragStartRef.current.mouseY;
              setToolboxPos({
                x: Math.max(10, Math.min(window.innerWidth - 380, toolboxDragStartRef.current.boxX + dx)),
                y: Math.max(30, Math.min(window.innerHeight - 80, toolboxDragStartRef.current.boxY + dy)),
              });
            }}
            onPointerUp={() => {
              isDraggingToolboxRef.current = false;
            }}
            onDoubleClick={() => setIsToolboxMinimized((m) => !m)}
            className="flex h-9 w-5 items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] cursor-grab active:cursor-grabbing"
            title="Versleep werkbalk overal op het scherm (Dubbelklik om te minimaliseren)"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.2" />
              <circle cx="5" cy="8" r="1.2" />
              <circle cx="5" cy="12" r="1.2" />
              <circle cx="10" cy="4" r="1.2" />
              <circle cx="10" cy="8" r="1.2" />
              <circle cx="10" cy="12" r="1.2" />
            </svg>
          </div>

          {!isToolboxMinimized ? (
            <>
              {/* Undo & Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={currentPage.strokes.length === 0}
                className="flex h-9 w-8 items-center justify-center rounded-xl text-[#3C3C43] hover:bg-black/[0.05] disabled:opacity-30 transition"
                title="Ongedaan maken (Ctrl+Z)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9l5-5" />
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={currentPage.redoStack.length === 0}
                className="flex h-9 w-8 items-center justify-center rounded-xl text-[#3C3C43] hover:bg-black/[0.05] disabled:opacity-30 transition"
                title="Opnieuw (Ctrl+Shift+Z)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14l5-5-5-5" />
                  <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
                </svg>
              </button>

              <div className="mx-0.5 h-6 w-px bg-[#E5E5EA]" />

              {/* 1. TEXT TOOL (T) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("text");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-10 w-9 items-center justify-center rounded-xl transition ${
                  activeTool === "text"
                    ? "bg-[#007AFF]/12 text-[#007AFF] ring-1 ring-[#007AFF]/30"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Tekst typen (T)"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-current font-serif text-sm font-bold">
                  T
                </div>
              </button>

              {/* 2. BALLPOINT PEN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "pen") {
                      setOpenPopoverTool(openPopoverTool === "pen" ? null : "pen");
                    } else {
                      setActiveTool("pen");
                      setOpenPopoverTool("pen");
                    }
                  }}
                  className={`relative flex h-10 w-9 items-center justify-center rounded-xl transition ${
                    activeTool === "pen"
                      ? "bg-[#007AFF]/10 ring-1 ring-[#007AFF]/30 -translate-y-0.5"
                      : "hover:bg-black/[0.04]"
                  }`}
                  title="Balpen (Klik nogmaals voor kleur & dikte)"
                >
                  <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                    <path d="M11 28L12.5 14H19.5L21 28H11Z" fill="#F2F2F7" stroke="#3C3C43" strokeWidth="1.5" />
                    <rect x="12.2" y="16" width="7.6" height="3.5" fill={penColor} />
                    <path d="M12.5 14L15 6.5C15.3 5.5 16.7 5.5 17 6.5L19.5 14H12.5Z" fill="#E5E5EA" stroke="#3C3C43" strokeWidth="1.4" />
                    <path d="M14.8 7.5L16 3.5L17.2 7.5H14.8Z" fill={penColor} />
                  </svg>
                </button>

                {openPopoverTool === "pen" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-64 rounded-2xl border border-black/10 bg-white/98 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Lijndikte</span>
                      <div className="flex gap-1">
                        {(["solid", "dashed", "dotted"] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setPenDash(d)}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                              penDash === d ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]" : "border-[#E5E5EA] text-[#64748b]"
                            }`}
                          >
                            {d === "solid" ? "━━" : d === "dashed" ? "╌╌" : "┈┈"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 mb-3.5 bg-[#F2F2F7] rounded-xl p-2">
                      {[1.5, 2.5, 4, 6, 9, 12].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setPenSize(sz)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                            penSize === sz ? "bg-white shadow-xs ring-1 ring-[#007AFF]" : "hover:bg-white/60"
                          }`}
                        >
                          <span
                            className="rounded-full"
                            style={{
                              width: Math.min(16, Math.max(4, sz * 1.3)),
                              height: Math.min(16, Math.max(4, sz * 1.3)),
                              backgroundColor: penColor,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {PEN_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPenColor(c)}
                          className={`h-7 w-7 rounded-full border transition transform ${
                            penColor === c ? "scale-110 ring-2 ring-[#007AFF] ring-offset-1 border-white" : "border-black/15 hover:scale-105"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PENCIL */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("pencil");
                  setOpenPopoverTool(null);
                }}
                className={`relative flex h-10 w-9 items-center justify-center rounded-xl transition ${
                  activeTool === "pencil"
                    ? "bg-[#007AFF]/10 ring-1 ring-[#007AFF]/30 -translate-y-0.5"
                    : "hover:bg-black/[0.04]"
                }`}
                title="Potlood"
              >
                <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                  <path d="M12 28V15L16 5L20 15V28H12Z" fill="#FDE68A" stroke="#3C3C43" strokeWidth="1.5" />
                  <path d="M12 15H20V28H12V15Z" fill="#E5E5EA" stroke="#3C3C43" strokeWidth="1.5" />
                  <path d="M14.3 9.2L16 5L17.7 9.2H14.3Z" fill={pencilColor} />
                </svg>
              </button>

              {/* 4. HIGHLIGHTER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "highlighter") {
                      setOpenPopoverTool(openPopoverTool === "highlighter" ? null : "highlighter");
                    } else {
                      setActiveTool("highlighter");
                      setOpenPopoverTool("highlighter");
                    }
                  }}
                  className={`relative flex h-10 w-9 items-center justify-center rounded-xl transition ${
                    activeTool === "highlighter"
                      ? "bg-[#007AFF]/10 ring-1 ring-[#007AFF]/30 -translate-y-0.5"
                      : "hover:bg-black/[0.04]"
                  }`}
                  title="Markeerstift"
                >
                  <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                    <path d="M13 11L19 7.5V14H13V11Z" fill={highlighterColor} opacity="0.85" />
                    <path d="M10.5 28L12 14H20L21.5 28H10.5Z" fill="#FFFFFF" stroke="#3C3C43" strokeWidth="1.5" />
                    <rect x="11.5" y="17" width="9" height="5" fill={highlighterColor} opacity="0.85" />
                  </svg>
                </button>

                {openPopoverTool === "highlighter" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-56 rounded-2xl border border-black/10 bg-white/98 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                    <span className="block text-[11px] font-bold text-[#8E8E93] uppercase mb-2">Markeerstift Kleur</span>
                    <div className="grid grid-cols-6 gap-1.5 mb-3">
                      {HIGHLIGHTER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHighlighterColor(c)}
                          className={`h-7 w-7 rounded-full border ${
                            highlighterColor === c ? "ring-2 ring-[#007AFF] scale-110" : "border-black/10"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={36}
                      value={highlighterSize}
                      onChange={(e) => setHighlighterSize(Number(e.target.value))}
                      className="w-full accent-[#007AFF]"
                    />
                  </div>
                )}
              </div>

              {/* 5. ERASER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "eraser") {
                      setOpenPopoverTool(openPopoverTool === "eraser" ? null : "eraser");
                    } else {
                      setActiveTool("eraser");
                      setOpenPopoverTool("eraser");
                    }
                  }}
                  className={`relative flex h-10 w-9 items-center justify-center rounded-xl transition ${
                    activeTool === "eraser"
                      ? "bg-[#007AFF]/10 ring-1 ring-[#007AFF]/30 -translate-y-0.5"
                      : "hover:bg-black/[0.04]"
                  }`}
                  title="Gum (Hele lijn of Gedeeltelijk)"
                >
                  <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                    <rect x="11" y="7" width="10" height="9" rx="2" fill="#FDA4AF" stroke="#3C3C43" strokeWidth="1.5" />
                    <path d="M10.5 14H21.5L22 28H10L10.5 14Z" fill="#F2F2F7" stroke="#3C3C43" strokeWidth="1.5" />
                  </svg>
                </button>

                {openPopoverTool === "eraser" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-52 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-xl backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setEraserMode("whole")}
                        className={`rounded-xl py-1.5 text-[11px] font-bold border ${
                          eraserMode === "whole" ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]" : "border-[#E5E5EA] text-[#3C3C43]"
                        }`}
                      >
                        Hele lijn
                      </button>
                      <button
                        type="button"
                        onClick={() => setEraserMode("partial")}
                        className={`rounded-xl py-1.5 text-[11px] font-bold border ${
                          eraserMode === "partial" ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]" : "border-[#E5E5EA] text-[#3C3C43]"
                        }`}
                      >
                        Pixelgum
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleClearPage();
                        setOpenPopoverTool(null);
                      }}
                      className="w-full rounded-xl bg-[#FF3B30]/10 py-1.5 text-[11px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/20"
                    >
                      Wis hele pagina
                    </button>
                  </div>
                )}
              </div>

              {/* 6. NOTABILITY TAPE TOOL (Study Answer Cover) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "tape") {
                      setOpenPopoverTool(openPopoverTool === "tape" ? null : "tape");
                    } else {
                      setActiveTool("tape");
                      setOpenPopoverTool("tape");
                    }
                  }}
                  className={`relative flex h-10 w-9 items-center justify-center rounded-xl transition ${
                    activeTool === "tape"
                      ? "bg-amber-400/20 text-amber-700 ring-1 ring-amber-400"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Studietracks / Tape (Dek antwoorden af om te leren; tik om te onthullen!)"
                >
                  <div className="flex h-5 w-6 items-center justify-center rounded-sm border-2 border-dashed border-amber-600 bg-amber-200 text-[10px] font-bold">
                    ▤
                  </div>
                </button>

                {openPopoverTool === "tape" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-52 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-xl backdrop-blur-xl">
                    <span className="block text-[11px] font-bold text-[#8E8E93] uppercase mb-2">Tape Kleur</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TAPE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedTapeColor(c)}
                          className={`h-7 w-7 rounded-md border ${
                            selectedTapeColor === c ? "ring-2 ring-black scale-110" : "border-black/10"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-[#8E8E93] leading-tight">
                      Trek tape over formules. Tik op de tape om het antwoord te onthullen of verbergen!
                    </p>
                  </div>
                )}
              </div>

              {/* 7. LASSO TOOL */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("lasso");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-10 w-9 items-center justify-center rounded-xl transition ${
                  activeTool === "lasso"
                    ? "bg-[#007AFF]/12 text-[#007AFF] ring-1 ring-[#007AFF]/30"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Lasso Selectie"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
                  <ellipse cx="12" cy="11" rx="8" ry="6" />
                  <path d="M7 16c-2 2-1 5 2 4" strokeDasharray="none" />
                </svg>
              </button>

              {/* 8. LASER POINTER */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("laser");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-10 w-9 items-center justify-center rounded-xl transition ${
                  activeTool === "laser"
                    ? "bg-[#FF3B30]/15 text-[#FF3B30] ring-1 ring-[#FF3B30]/40"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Laserpointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
                </svg>
              </button>

              {/* 9. RULER */}
              <button
                type="button"
                onClick={() => setShowRuler((v) => !v)}
                className={`flex h-10 w-9 items-center justify-center rounded-xl transition ${
                  showRuler
                    ? "bg-[#007AFF]/12 text-[#007AFF] ring-1 ring-[#007AFF]/30"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Liniaal tonen/verbergen"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
                  <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2" />
                </svg>
              </button>

              <div className="mx-0.5 h-6 w-px bg-[#E5E5EA]" />

              {/* 10. STICKY NOTE */}
              <button
                type="button"
                onClick={handleAddStickyNote}
                className="flex h-10 w-8 items-center justify-center rounded-xl text-[#3C3C43] hover:bg-black/[0.04] transition"
                title="Plaknotitie toevoegen"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FEF08A" stroke="#3C3C43" strokeWidth="1.8">
                  <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                  <path d="M15 3v6h6" fill="#FDE047" />
                </svg>
              </button>

              {/* 11. INSERT MEDIA (+ Button) */}
              <button
                type="button"
                onClick={() => docUploadInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2F7] text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition font-bold text-lg"
                title="Foto, PDF of Werkblad uploaden op papier"
              >
                +
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsToolboxMinimized(false)}
              className="flex h-8 items-center gap-1.5 px-2 text-xs font-bold text-[#007AFF]"
            >
              <span>✎</span>
              <span>Open werkbalk</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. MAIN WORKSPACE: LEFT SUBJECTS + PAPER CANVAS + RIGHT PANELS
         ===================================================================== */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: Authentic Notability Subjects & Dividers Library */}
        {showLibrarySidebar && (
          <aside className="z-30 flex w-68 shrink-0 flex-col border-r border-[#D1D1D6] bg-[#F2F2F7]/98 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#007AFF] text-white text-xs font-black">
                  ✎
                </div>
                <span className="text-sm font-bold text-[#1C1C1E]">Notability</span>
              </div>
              <span className="rounded-full bg-[#E5E5EA] px-2 py-0.5 text-[10px] font-semibold text-[#636366]">
                School iPad
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1C1C1E] shadow-2xs">
                  <span>📄 Alle notities</span>
                  <span className="text-[#8E8E93]">18</span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium text-[#3C3C43] hover:bg-black/[0.04]">
                  <span>⭐ Favorieten</span>
                  <span className="text-[#8E8E93]">4</span>
                </div>
              </div>

              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Vakken • Klas 3/4
                </p>
                <div className="space-y-1">
                  {NOTABILITY_SUBJECTS.map((subj) => {
                    const isSelected = subj.id === activeSubjectId;
                    return (
                      <button
                        key={subj.id}
                        type="button"
                        onClick={() => handleSelectSubject(subj)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#007AFF] text-white shadow-xs"
                            : "text-[#1C1C1E] hover:bg-black/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="truncate">{subj.name}</span>
                        </div>
                        <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#8E8E93]"}`}>
                          3
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-[#E5E5EA] p-3">
              <button
                type="button"
                onClick={onExitStealth}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-semibold text-[#007AFF] shadow-2xs hover:bg-[#F9F9FB]"
              >
                <span>Sluit Notability Weergave</span>
              </button>
            </div>
          </aside>
        )}

        {/* CENTER SCROLLABLE PAPER CANVAS AREA */}
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[#E5E5EA] p-2 sm:p-6 md:p-8 flex justify-center">
          <div
            style={{
              ...getPaperStyles(),
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
            }}
            className="relative w-full max-w-[880px] min-h-[1200px] rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-black/[0.08] transition-transform duration-150"
          >
            {/* Date & Page Stamp */}
            <div className="flex items-center justify-between px-8 sm:px-14 pt-6 pb-2 border-b border-black/[0.06]">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={`w-full bg-transparent text-lg sm:text-2xl font-bold tracking-tight focus:outline-none ${
                  isDarkPaper ? "text-white" : "text-[#1C1C1E]"
                }`}
              />
              <span className="shrink-0 font-mono text-[11px] text-[#8E8E93] ml-4">
                21 okt. 2026 • p.{currentPageIndex + 1}
              </span>
            </div>

            {/* 1. Uploaded Documents / Worksheets Layer */}
            {currentPage.images.map((img) => (
              <div
                key={img.id}
                style={{ left: img.x, top: img.y, width: img.width }}
                className="absolute z-10 rounded-lg border border-black/10 shadow-sm overflow-hidden bg-white group"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-auto object-contain pointer-events-none select-none"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPages((prev) =>
                        prev.map((pg, idx) =>
                          idx === currentPageIndex
                            ? { ...pg, images: pg.images.filter((i) => i.id !== img.id) }
                            : pg
                        )
                      )
                    }
                    className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            ))}

            {/* 2. Interactive Study Tape Strips */}
            {currentPage.tapes.map((tape) => (
              <div
                key={tape.id}
                onClick={() => handleToggleTape(tape.id)}
                style={{
                  left: tape.x,
                  top: tape.y,
                  width: tape.width,
                  height: tape.height,
                  backgroundColor: tape.isRevealed ? "transparent" : tape.color,
                }}
                className={`absolute z-25 cursor-pointer rounded-sm transition-all duration-200 border-2 select-none group flex items-center justify-between px-2 ${
                  tape.isRevealed
                    ? "border-dashed border-black/30 bg-black/[0.03]"
                    : "border-black/20 shadow-xs"
                }`}
                title="Tik om antwoord te onthullen of verbergen"
              >
                <span className="text-[9px] font-mono font-bold text-black/50 truncate">
                  {tape.isRevealed ? "👀 ONTHULD" : "▤ NOTABILITY TAPE"}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteTape(tape.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-black/60 hover:text-black ml-1"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 3. Editable Typed Note Text Layer */}
            <div className="relative z-10 px-8 sm:px-16 pt-4">
              <textarea
                value={currentPage.typedText}
                onChange={(e) => {
                  const val = e.target.value;
                  setPages((prev) =>
                    prev.map((pg, idx) => (idx === currentPageIndex ? { ...pg, typedText: val } : pg))
                  );
                }}
                placeholder="Typ hier je aantekeningen of teken direct met de pen op het papier…"
                rows={12}
                className={`w-full resize-none bg-transparent font-sans text-sm sm:text-[15px] leading-[30px] focus:outline-none ${
                  isDarkPaper ? "text-gray-100 placeholder-gray-600" : "text-[#1C1C1E] placeholder-[#AEAEB2]"
                } ${activeTool === "text" ? "pointer-events-auto" : "pointer-events-none"}`}
              />

              {/* Natural-looking Classmate Notes at the bottom of the page */}
              {incomingNotes.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-3">
                  {incomingNotes.map((ans) => (
                    <div
                      key={ans.id}
                      onClick={() => {
                        navigator.clipboard.writeText(ans.text);
                        showToast("Gekopieerd naar klembord");
                      }}
                      className={`group flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 cursor-pointer transition ${
                        isDarkPaper ? "hover:bg-white/5 text-gray-200" : "hover:bg-black/[0.03] text-[#1C1C1E]"
                      }`}
                      title="Klik om te kopiëren"
                    >
                      <p className="font-mono text-[13.5px] leading-[26px]">
                        <span className="font-semibold text-[#007AFF] mr-2">• Uitwerking ({ans.sender}):</span>
                        <span>{ans.text}</span>
                      </p>
                      <span className="text-[10px] text-[#8E8E93] opacity-0 group-hover:opacity-100 transition shrink-0">
                        {ans.time} • Kopieer
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Movable Sticky Notes (Plaknotities) */}
            {currentPage.stickies.map((st) => (
              <div
                key={st.id}
                style={{ left: st.x, top: st.y, width: st.width, minHeight: st.height }}
                className="absolute z-30 flex flex-col rounded-xl border border-amber-300/80 bg-[#FEF9C3] p-3 shadow-[0_6px_20px_rgba(0,0,0,0.10)]"
              >
                <div className="flex items-center justify-between border-b border-amber-300/50 pb-1 mb-1.5 cursor-move">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70">
                    Notitie
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPages((prev) =>
                        prev.map((pg, idx) =>
                          idx === currentPageIndex
                            ? { ...pg, stickies: pg.stickies.filter((s) => s.id !== st.id) }
                            : pg
                        )
                      )
                    }
                    className="text-xs text-amber-800/60 hover:text-amber-950"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={st.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPages((prev) =>
                      prev.map((pg, idx) =>
                        idx === currentPageIndex
                          ? {
                              ...pg,
                              stickies: pg.stickies.map((s) => (s.id === st.id ? { ...s, text: v } : s)),
                            }
                          : pg
                      )
                    );
                  }}
                  placeholder="Kladnotitie of formule…"
                  className="flex-1 resize-none bg-transparent text-xs text-[#1C1C1E] placeholder-amber-800/40 focus:outline-none leading-relaxed"
                />
              </div>
            ))}

            {/* 5. Interactive Notability Ruler Overlay */}
            {showRuler && (
              <div
                onPointerDown={(e) => {
                  isDraggingRulerRef.current = true;
                  rulerDragOffsetRef.current = {
                    x: e.clientX - rulerPos.x,
                    y: e.clientY - rulerPos.y,
                  };
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!isDraggingRulerRef.current) return;
                  setRulerPos({
                    x: e.clientX - rulerDragOffsetRef.current.x,
                    y: e.clientY - rulerDragOffsetRef.current.y,
                  });
                }}
                onPointerUp={() => {
                  isDraggingRulerRef.current = false;
                }}
                style={{ left: rulerPos.x, top: rulerPos.y }}
                className="absolute z-30 h-14 w-[520px] cursor-move rounded-xl border border-black/20 bg-white/80 backdrop-blur-md shadow-lg flex flex-col justify-between px-4 py-1 select-none"
              >
                <div className="flex justify-between w-full border-b border-black/20 pb-0.5">
                  {Array.from({ length: 21 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-px bg-black/50 ${idx % 5 === 0 ? "h-2.5" : "h-1.5"}`} />
                      {idx % 5 === 0 && (
                        <span className="text-[8px] font-mono text-black/60">{idx}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#3C3C43]">
                  <span>Notability Liniaal (0°) — Teken langs de rand voor een rechte lijn</span>
                  <button
                    type="button"
                    onClick={() => setShowRuler(false)}
                    className="text-[#007AFF] hover:underline"
                  >
                    Verberg
                  </button>
                </div>
              </div>
            )}

            {/* 6. Full-Page Interactive 60FPS Ink Drawing Canvas */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                touchAction: activeTool === "hand" || activeTool === "text" ? "auto" : "none",
              }}
              className={`absolute inset-0 z-20 h-full w-full ${
                activeTool === "text"
                  ? "pointer-events-none"
                  : activeTool === "hand"
                    ? "cursor-grab"
                    : "cursor-crosshair"
              }`}
            />
          </div>
        </main>

        {/* RIGHT DRAWER 1: Authentic Notability AI Helper (Camouflaged Classmate Messenger!) */}
        {showNotabilityAiDrawer && (
          <aside className="z-30 flex w-76 sm:w-84 shrink-0 flex-col border-l border-[#D1D1D6] bg-white/98 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 py-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-[#6366F1] to-[#A855F7] text-white text-xs">
                  ✨
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#1C1C1E]">Notability AI</h3>
                  <p className="text-[9.5px] text-[#6366F1] font-semibold">Opgave-assistent &amp; Wiskunde Hulp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotabilityAiDrawer(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs text-[#8E8E93] hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Quick Math Form Templates */}
            <div className="p-3 border-b border-[#E5E5EA] bg-[#F9F9FB]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                Snelle Formules &amp; Vragen
              </span>
              <div className="flex flex-wrap gap-1">
                {["x = ?", "D = b² - 4ac", "Opgave 14?", "Stuur antwoord"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      onSendNote(q);
                      showToast(`Formule "${q}" verzonden!`);
                    }}
                    className="rounded-lg border border-[#E5E5EA] bg-white px-2 py-1 text-[10.5px] font-mono font-medium text-[#3C3C43] hover:border-[#6366F1] hover:text-[#6366F1]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Synchronized Classmate Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {incomingNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[#8E8E93] px-4">
                  <span className="text-2xl mb-1">📐</span>
                  <p className="text-xs font-semibold text-[#1C1C1E]">Geen actieve notities</p>
                  <p className="text-[11px] mt-1">
                    Typ hieronder een antwoord of formule om direct met klasgenoten te delen.
                  </p>
                </div>
              ) : (
                incomingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs text-[#1C1C1E]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#4338CA] text-[10.5px] flex items-center gap-1">
                        <span>●</span> {note.sender}
                      </span>
                      <span className="font-mono text-[9.5px] text-[#8E8E93]">{note.time}</span>
                    </div>
                    <p className="font-mono text-[12.5px] leading-relaxed text-[#1E1B4B]">{note.text}</p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(note.text);
                          showToast("Gekopieerd");
                        }}
                        className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-[#4338CA] border border-indigo-200 shadow-2xs hover:bg-indigo-50"
                      >
                        Kopieer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input to Send Secret Message/Math to Classmates */}
            <div className="border-t border-[#E5E5EA] p-3 bg-white">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => {
                    setAiChatInput(e.target.value);
                    setQuickText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && aiChatInput.trim()) {
                      onSendNote(aiChatInput.trim());
                      setAiChatInput("");
                    }
                  }}
                  placeholder="Vraag of formule sturen…"
                  className="flex-1 rounded-xl border border-[#D1D1D6] px-3 py-2 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (aiChatInput.trim()) {
                      onSendNote(aiChatInput.trim());
                      setAiChatInput("");
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-3 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Deel
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* RIGHT DRAWER 2: Authentic Notability Page Manager (Thumbnails) */}
        {showPagesSidebar && (
          <aside className="z-30 flex w-56 shrink-0 flex-col border-l border-[#D1D1D6] bg-[#F2F2F7]/98 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-3.5 py-2.5">
              <span className="text-xs font-bold text-[#1C1C1E]">Pagina&apos;s ({pages.length})</span>
              <button
                type="button"
                onClick={handleAddPage}
                className="rounded-lg bg-[#007AFF] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#0062CC]"
              >
                + Pagina
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pages.map((pg, idx) => {
                const active = idx === currentPageIndex;
                return (
                  <div
                    key={pg.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`cursor-pointer rounded-xl border-2 p-2 transition ${
                      active
                        ? "border-[#007AFF] bg-white shadow-sm"
                        : "border-transparent bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div
                      className="h-28 w-full rounded-lg border border-black/10 p-2 overflow-hidden text-[7px] text-[#3C3C43] leading-tight"
                      style={getPaperStyles()}
                    >
                      <p className="font-bold truncate">{noteTitle}</p>
                      <p className="mt-1 line-clamp-6">{pg.typedText || "Blanco pagina"}</p>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-[#1C1C1E]">Pagina {idx + 1}</span>
                      <span className="text-[10px] text-[#8E8E93]">{pg.strokes.length} lijnen</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
