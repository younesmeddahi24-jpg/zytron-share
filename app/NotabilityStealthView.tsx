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
}

const NOTABILITY_SUBJECTS: SubjectFolder[] = [
  { id: "wiskunde-b", name: "Wiskunde B", color: "#007AFF", divider: "Exacte Vakken" },
  { id: "natuurkunde", name: "Natuurkunde", color: "#5856D6", divider: "Exacte Vakken" },
  { id: "scheikunde", name: "Scheikunde", color: "#34C759", divider: "Exacte Vakken" },
  { id: "nederlands", name: "Nederlands", color: "#AF52DE", divider: "Talen" },
  { id: "engels", name: "Engels", color: "#FF9500", divider: "Talen" },
  { id: "economie", name: "Economie", color: "#FF2D55", divider: "Maatschappij" },
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

const QUICK_INK_SWATCHES = ["#1C1C1E", "#007AFF", "#FF3B30", "#34C759"];

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

export interface QuizQuestionItem {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export const NOTABILITY_QUIZ_QUESTIONS: QuizQuestionItem[] = [
  {
    id: 1,
    question: "Wie introduceerde de kwantumhypothese in 1900, waarbij elektromagnetische energie in gekwantiseerde pakketjes wordt uitgezonden?",
    options: ["Max Planck", "Albert Einstein", "Niels Bohr", "Louis de Broglie"],
    correctIndex: 0,
  },
  {
    id: 2,
    question: "Welk wiskundig kader is vereist om de wetten van de kwantummechanica te formuleren?",
    options: ["Reële vectorruimtes", "Complexe vectorruimtes (Hilbertruimte)", "Euclidische meetkunde", "Niet-lineaire algebra"],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "Welke differentiaalvergelijking beschrijft de tijdsontwikkeling van een kwantummechanische golffunctie?",
    options: ["Maxwell-Boltzmann vergelijking", "Schrödingervergelijking", "Navier-Stokes vergelijking", "Lorentzkrachtwet"],
    correctIndex: 1,
  },
  {
    id: 4,
    question: "Wat stelt de statistische interpretatie van Born over het kwadraat van de modulus |ψ(x)|²?",
    options: [
      "Totale kinetische energiedichtheid",
      "Kansdichtheid om een deeltje op positie x aan te treffen",
      "Gravitatiepotentiaalgradiënt",
      "Lokale elektrische ladingsverplaatsing",
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "Welk fundamenteel principe stelt dat plaats en impuls niet tegelijkertijd met willekeurige precisie bepaald kunnen worden?",
    options: [
      "Onzekerheidsrelatie van Heisenberg",
      "Uitsluitingsprincipe van Pauli",
      "No-Cloning theorema",
      "Correspondentieprincipe",
    ],
    correctIndex: 0,
  },
  {
    id: 6,
    question: "Welk verschijnsel beschrijft twee of meer deeltjes met gecorreleerde toestanden ongeacht hun onderlinge afstand?",
    options: [
      "Kwantumverstrengeling (Entanglement)",
      "Golfpakketdispersie",
      "Comptonverstrooiing",
      "Kwantumtunneling",
    ],
    correctIndex: 0,
  },
  {
    id: 7,
    question: "Welke lineaire Hermitische operator komt overeen met de totale energie van een kwantumsysteem?",
    options: ["Hamiltoniaan Ĥ", "Impulsoperator p̂", "Positieoperator x̂", "Impulsmomentoperator L̂"],
    correctIndex: 0,
  },
  {
    id: 8,
    question: "Wat is de fysische betekenis van het uitsluitingsprincipe van Pauli in atomaire systemen?",
    options: [
      "Geen twee identieke fermionen kunnen tegelijk dezelfde kwantumtoestand bezetten",
      "Fotonen kunnen geen identieke ruimtelijke orbitalen bezetten",
      "Alle observabelen hebben zuiver imaginaire eigenwaarden",
      "Energieniveaus zijn continu in gebonden systemen",
    ],
    correctIndex: 0,
  },
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
  // Active Subject & Note Title (Starts pure clean blank!)
  const [activeSubjectId, setActiveSubjectId] = useState<string>("wiskunde-b");
  const activeSubject =
    NOTABILITY_SUBJECTS.find((s) => s.id === activeSubjectId) || NOTABILITY_SUBJECTS[0];

  const [noteTitle, setNoteTitle] = useState<string>("");
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

  // Paper appearance (Default pure blank sheet)
  const [paperGrid, setPaperGrid] = useState<PaperGridType>("blank");
  const [paperColor, setPaperColor] = useState<PaperColorType>("white");

  // Toolbox state
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [openPopoverTool, setOpenPopoverTool] = useState<
    "pen" | "pencil" | "highlighter" | "eraser" | "tape" | "insert" | null
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

  // Sticky Note dragging state
  const draggingStickyRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  // Uploaded Image dragging state
  const draggingImageRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Floating Toolbox position & drag state (freely draggable anywhere or docked in header!)
  const [customToolboxPos, setCustomToolboxPos] = useState<{ x: number; y: number } | null>(null);
  const [isToolboxMinimized, setIsToolboxMinimized] = useState<boolean>(false);
  const isDraggingToolboxRef = useRef<boolean>(false);
  const toolboxDragStartRef = useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number }>({
    mouseX: 0,
    mouseY: 0,
    boxX: 0,
    boxY: 0,
  });

  // Authentic Notability Smart Notes / Quiz Split Screen State
  const [smartNotesTab, setSmartNotesTab] = useState<"notes" | "quiz" | "chat">("notes");
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<number>(1);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({ 1: 1 });
  const [quizFeedback, setQuizFeedback] = useState<Record<number, "up" | "down" | null>>({});
  const [smartNotesDropdownOpen, setSmartNotesDropdownOpen] = useState<boolean>(false);

  // Multi-page state
  const [pages, setPages] = useState<NotePageData[]>([
    {
      id: "page-1",
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
  const paperContainerRef = useRef<HTMLDivElement | null>(null);
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
    setShowLibrarySidebar(false);
    showToast(`Vak geselecteerd: ${subj.name}`);
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
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      } else if (stroke.isShape && stroke.shapeType === "rect" && pts.length >= 2) {
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      } else if (stroke.isShape && stroke.shapeType === "circle" && pts.length >= 2) {
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

  // Notability Shape Recognition Detection
  const detectShape = (pts: StrokePoint[]): { isShape: boolean; shapeType?: "line" | "rect" | "circle" } => {
    if (pts.length < 12) return { isShape: false };

    const first = pts[0];
    const last = pts[pts.length - 1];
    const startEndDist = Math.hypot(last.x - first.x, last.y - first.y);

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

    let maxDeviation = 0;
    const totalDist = Math.hypot(last.x - first.x, last.y - first.y);
    if (totalDist > 60) {
      for (const p of pts) {
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
    showToast("Pagina gewist (Schoon blanco blad)");
  };

  // Add Sticky Note (Plaknotitie)
  const handleAddStickyNote = (color: StickyNoteItem["color"] = "yellow") => {
    const newSticky: StickyNoteItem = {
      id: `sticky-${Date.now()}`,
      x: 280 + (currentPage.stickies.length * 28) % 200,
      y: 120 + (currentPage.stickies.length * 28) % 180,
      width: 240,
      height: 175,
      text: "",
      color,
    };
    setPages((prev) =>
      prev.map((pg, idx) =>
        idx === currentPageIndex ? { ...pg, stickies: [...pg.stickies, newSticky] } : pg
      )
    );
    showToast("Plaknotitie toegevoegd — versleep bij de bovenbalk");
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

  // Drag & drop file over state
  const [isDraggingFileOver, setIsDraggingFileOver] = useState<boolean>(false);
  const [pressureSensitivity, setPressureSensitivity] = useState<boolean>(true);

  // Upload or Drop Document / Image / Worksheet directly onto Notability Page
  const handleFilesDrop = useCallback(
    (fileList: FileList, dropX?: number, dropY?: number) => {
      setIsDraggingFileOver(false);
      const files = Array.from(fileList);
      if (files.length === 0) return;

      if (onUploadFileToZytron) {
        onUploadFileToZytron(fileList);
      }

      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || "");
            const imgItem: UploadedDocImage = {
              id: `doc-img-${Date.now()}-${Math.random()}`,
              name: file.name,
              dataUrl,
              x: dropX ?? 48,
              y: dropY ?? 90,
              width: 640,
              height: 460,
            };
            setPages((prev) =>
              prev.map((pg, idx) =>
                idx === currentPageIndex ? { ...pg, images: [...pg.images, imgItem] } : pg
              )
            );
            showToast(`Afbeelding "${file.name}" op pagina geplaatst!`);
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
                        (pg.typedText ? pg.typedText + "\n\n" : "") +
                        `📄 [Geïmporteerd Document: ${file.name} (${Math.round(file.size / 1024)} KB)]\n` +
                        `──────────────────────────────────────────────────\n`,
                    }
                  : pg
              )
            );
            showToast(`Document "${file.name}" op je pagina geplaatst!`);
          };
          reader.readAsArrayBuffer(file);
        }
      });
    },
    [currentPageIndex, onUploadFileToZytron, showToast]
  );

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleFilesDrop(files);
    e.target.value = "";
  };

  // Export current note as PNG download
  const handleExportNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const safeTitle = (noteTitle || "Notitie").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${safeTitle}_Notability.png`;
      a.click();
      showToast("Notitie geëxporteerd als PNG!");
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
    showToast(`Pagina ${pages.length + 1} toegevoegd`);
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
        backgroundImage: `linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: "100% 30px",
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

  const stickyThemeMap: Record<
    StickyNoteItem["color"],
    { bg: string; border: string; headerText: string }
  > = {
    yellow: { bg: "#FEF9C3", border: "#FDE047", headerText: "#854D0E" },
    blue: { bg: "#E0F2FE", border: "#7DD3FC", headerText: "#075985" },
    green: { bg: "#DCFCE7", border: "#86EFAC", headerText: "#166534" },
    grid: { bg: "#FFF7ED", border: "#FDBA74", headerText: "#9A3412" },
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#E5E5EA] text-[#1C1C1E] select-none overflow-hidden font-sans antialiased">
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
          1. AUTHENTIC NOTABILITY iPadOS 26.5 FLOATING ISLANDS HEADER
         ===================================================================== */}
      <div className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none select-none gap-2">
        {/* Island 1: Library Toggle + Subject Badge + Editable Note Title + Search */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.10),0_0_0_0.5px_rgba(0,0,0,0.05)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setShowLibrarySidebar((v) => !v)}
            onDoubleClick={onExitStealth}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 ${
              showLibrarySidebar
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#007AFF] hover:bg-[#007AFF]/10"
            }`}
            title="Vakken Bibliotheek • Dubbelklik op '<' om terug naar Zytron te gaan"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-1 pr-2 border-l border-black/[0.08]">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: activeSubject.color }}
              title={`Vak: ${activeSubject.name}`}
            />
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={activeSubject.name}
              className="w-28 md:w-40 bg-transparent text-xs font-bold text-[#1C1C1E] placeholder-[#3C3C43]/75 focus:outline-none focus:w-48 transition-all truncate"
              title="Klik om notitietitel aan te passen"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSearchBar((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              showSearchBar ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Zoek in notitie"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Island 3: Floating Utilities Capsule (Undo, Redo, Zoom, More ···, Smart Notes ✨, Pages ❐) */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.10),0_0_0_0.5px_rgba(0,0,0,0.05)] backdrop-blur-2xl">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={currentPage.strokes.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#3C3C43] hover:bg-black/[0.05] active:scale-90 disabled:opacity-30 transition"
            title="Ongedaan maken (Ctrl+Z)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={currentPage.redoStack.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#3C3C43] hover:bg-black/[0.05] active:scale-90 disabled:opacity-30 transition"
            title="Opnieuw (Ctrl+Shift+Z)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14l5-5-5-5" />
              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
            </svg>
          </button>

          {/* Subtle Zoom Pill (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-full bg-[#F2F2F7] px-1.5 py-0.5 mx-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              className="h-6 w-5 flex items-center justify-center text-xs font-bold text-[#3C3C43] hover:text-black"
              title="Uitzoomen"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1 font-mono text-[10px] font-bold text-[#3C3C43] hover:text-[#007AFF]"
              title="Reset zoom naar 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="h-6 w-5 flex items-center justify-center text-xs font-bold text-[#3C3C43] hover:text-black"
              title="Inzoomen"
            >
              +
            </button>
          </div>

          {/* More Options (··· in circle) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplateMenu((v) => !v);
                setOpenPopoverTool(null);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                showTemplateMenu ? "bg-[#007AFF]/15 text-[#007AFF]" : "text-[#3C3C43] hover:bg-black/[0.05]"
              }`}
              title="Notitie-opties (Papier, Sjabloon & Export)"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                ···
              </div>
            </button>

            {/* Authentic Notability Paper & Template Popover */}
            {showTemplateMenu && (
              <div className="absolute right-0 top-11 z-50 w-76 rounded-3xl border border-black/10 bg-white/98 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2.5 mb-3">
                  <span className="text-xs font-bold text-[#1C1C1E]">Papier &amp; Notitie-opties</span>
                  <button
                    type="button"
                    onClick={() => setShowTemplateMenu(false)}
                    className="text-xs font-bold text-[#007AFF]"
                  >
                    Gereed
                  </button>
                </div>

                {/* Paper Template Type */}
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
                  Papiersjabloon
                </p>
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {(
                    [
                      { id: "blank", label: "Blanco" },
                      { id: "lined", label: "Gelijnd" },
                      { id: "grid", label: "Ruitjes" },
                      { id: "dotted", label: "Stippels" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPaperGrid(t.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10.5px] font-medium transition ${
                        paperGrid === t.id
                          ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] font-bold shadow-2xs"
                          : "border-[#E5E5EA] text-[#3C3C43] hover:bg-[#F2F2F7]"
                      }`}
                    >
                      <div className="h-6 w-6 rounded border border-[#C7C7CC] bg-white flex items-center justify-center text-[10px]">
                        {t.id === "grid" ? "⊞" : t.id === "lined" ? "☰" : t.id === "dotted" ? "∷" : "□"}
                      </div>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Paper Color */}
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
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
                        paperColor === c.id ? "border-[#007AFF] ring-1 ring-[#007AFF] bg-[#007AFF]/5 font-bold" : "border-[#E5E5EA]"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-black/15 shadow-2xs"
                        style={{ backgroundColor: c.bg }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="divide-y divide-[#E5E5EA] overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      docUploadInputRef.current?.click();
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between bg-white px-3.5 py-2.5 text-xs font-semibold text-[#007AFF] hover:bg-[#F2F2F7] transition"
                  >
                    <span>Document of Foto Invoegen</span>
                    <span>📂</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddStickyNote("yellow");
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between bg-white px-3.5 py-2.5 text-xs font-medium text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                  >
                    <span>Plaknotitie Toevoegen</span>
                    <span>🟨</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExportNote();
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between bg-white px-3.5 py-2.5 text-xs font-medium text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                  >
                    <span>Exporteer als Afbeelding (PNG)</span>
                    <span>📥</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClearPage();
                      setShowTemplateMenu(false);
                    }}
                    className="flex w-full items-center justify-between bg-white px-3.5 py-2.5 text-xs font-semibold text-[#FF3B30] hover:bg-[#F2F2F7] transition"
                  >
                    <span>Pagina Wissen (Schoon Blad)</span>
                    <span>⌫</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExitStealth}
                    className="flex w-full items-center justify-between bg-[#F2F2F7]/60 px-3.5 py-2.5 text-xs font-bold text-[#007AFF] hover:bg-[#F2F2F7] transition"
                  >
                    <span>Terug naar Zytron Share</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Smart Notes & Klasgenoten Split-Screen Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowNotabilityAiDrawer((v) => !v);
              if (!showNotabilityAiDrawer) setSmartNotesTab("notes");
            }}
            className={`relative flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
              showNotabilityAiDrawer
                ? "bg-[#007AFF] text-white shadow-xs"
                : "bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/18"
            }`}
            title="Smart Notes, Quiz & Klasgenoten (iPadOS Split-Screen)"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            </svg>
            <span className="hidden sm:inline text-[11px]">Smart Notes</span>
            {incomingNotes.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#34C759] px-1 text-[9px] font-black text-white shadow-2xs">
                {incomingNotes.length}
              </span>
            )}
          </button>

          {/* Content / Page Manager (❐) */}
          <button
            type="button"
            onClick={() => setShowPagesSidebar((v) => !v)}
            className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition ${
              showPagesSidebar ? "bg-black/[0.08] text-[#1C1C1E]" : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Paginabeheer & Miniaturen"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="13" height="16" rx="2" />
              <path d="M16 18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
            </svg>
            <span className="hidden md:inline font-mono text-[10.5px]">{currentPageIndex + 1}/{pages.length}</span>
          </button>
        </div>
      </div>

      {/* Note Replay Audio Playback Bar (When audio was recorded) */}
      {hasRecordedAudio && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-black/10 bg-white/95 px-4 py-1.5 text-xs text-[#1C1C1E] shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsPlayingRecordedAudio((p) => !p)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007AFF] text-white text-[10px] shadow-xs"
          >
            {isPlayingRecordedAudio ? "❚❚" : "▶"}
          </button>
          <span className="font-mono text-[11px] font-semibold text-[#3C3C43]">
            {formatTimer(recordingSeconds)}
          </span>
          <div className="h-1.5 w-36 sm:w-48 rounded-full bg-[#E5E5EA] overflow-hidden">
            <div className={`h-full bg-[#007AFF] rounded-full transition-all ${isPlayingRecordedAudio ? "w-full duration-1000" : "w-2/3"}`} />
          </div>
          <span className="hidden sm:inline text-[10.5px] font-semibold text-[#8E8E93]">
            Audio Gesynchroniseerd
          </span>
          <button
            type="button"
            onClick={() => setHasRecordedAudio(false)}
            className="text-xs text-[#8E8E93] hover:text-black ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Discreet "Zoek in notitie" Popover Bar */}
      {showSearchBar && (
        <div className="fixed left-4 top-16 z-50 flex w-80 items-center gap-2 rounded-2xl border border-black/10 bg-white/98 px-3.5 py-2.5 shadow-xl backdrop-blur-2xl">
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
            placeholder="Zoek in notitie (of druk Enter om te delen)…"
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
              className="rounded-lg bg-[#007AFF] px-2.5 py-1 text-[10.5px] font-bold text-white shadow-2xs"
            >
              Stuur
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSearchBar(false)}
            className="text-xs text-[#8E8E93] hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          2. ICONIC FREELY DRAGGABLE NOTABILITY 15 FLOATING PENCIL TOOLBOX
         ===================================================================== */}
      <div
        style={
          customToolboxPos
            ? {
                left: `${customToolboxPos.x}px`,
                top: `${customToolboxPos.y}px`,
                transform: "none",
              }
            : {
                left: showNotabilityAiDrawer ? "calc((100vw - 440px) / 2)" : "50%",
                top: "12px",
                transform: "translateX(-50%)",
              }
        }
        className="fixed z-40 transition-all select-none pointer-events-auto max-w-[94vw]"
      >
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-full border border-black/[0.08] bg-white/95 px-2.5 py-1.5 shadow-[0_10px_32px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
          {/* Draggable Gripper Handle (⋮⋮) */}
          <div
            onPointerDown={(e) => {
              isDraggingToolboxRef.current = true;
              const currentX = customToolboxPos ? customToolboxPos.x : window.innerWidth / 2 - 220;
              const currentY = customToolboxPos ? customToolboxPos.y : 12;
              toolboxDragStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                boxX: currentX,
                boxY: currentY,
              };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDraggingToolboxRef.current) return;
              const dx = e.clientX - toolboxDragStartRef.current.mouseX;
              const dy = e.clientY - toolboxDragStartRef.current.mouseY;
              setCustomToolboxPos({
                x: Math.max(10, Math.min(window.innerWidth - 360, toolboxDragStartRef.current.boxX + dx)),
                y: Math.max(10, Math.min(window.innerHeight - 80, toolboxDragStartRef.current.boxY + dy)),
              });
            }}
            onPointerUp={() => {
              isDraggingToolboxRef.current = false;
            }}
            onDoubleClick={() => {
              setCustomToolboxPos(null);
            }}
            className="flex h-8 w-5 items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] cursor-grab active:cursor-grabbing"
            title="Versleep werkbalk overal op het scherm (Dubbelklik om te centreren)"
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
              {/* 1. FOUNTAIN PEN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "pen") {
                      setOpenPopoverTool(openPopoverTool === "pen" ? null : "pen");
                    } else {
                      setActiveTool("pen");
                      setOpenPopoverTool(null);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                    activeTool === "pen"
                      ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Vulpen (Klik nogmaals voor dikte & kleuren)"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" fill={penColor} />
                  </svg>
                  <span
                    className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: penColor }}
                  />
                </button>

                {openPopoverTool === "pen" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-64 rounded-3xl border border-black/10 bg-white/98 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Vulpen Lijnstijl</span>
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
                    <div className="mb-3.5 flex items-center gap-3 rounded-xl bg-[#F2F2F7] px-3 py-2">
                      <span className="rounded-full" style={{ width: 4, height: 4, backgroundColor: penColor }} />
                      <input
                        type="range"
                        min={1}
                        max={14}
                        step={0.5}
                        value={penSize}
                        onChange={(e) => setPenSize(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer accent-[#007AFF]"
                      />
                      <span className="rounded-full" style={{ width: 12, height: 12, backgroundColor: penColor }} />
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
                    <div className="flex items-center justify-between py-1 border-t border-[#E5E5EA] mt-3 pt-2.5">
                      <span className="text-[11px] font-medium text-[#1C1C1E]">Drukgevoeligheid</span>
                      <button
                        type="button"
                        onClick={() => setPressureSensitivity((p) => !p)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          pressureSensitivity ? "bg-[#34C759]" : "bg-[#E5E5EA]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            pressureSensitivity ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Inline Color Swatches for Pen/Pencil */}
              <div className="hidden md:flex items-center gap-1 px-1 border-r border-black/[0.07] mr-0.5">
                {QUICK_INK_SWATCHES.map((swatch) => {
                  const isActiveColor =
                    (activeTool === "pen" && penColor === swatch) ||
                    (activeTool === "pencil" && pencilColor === swatch);
                  return (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => {
                        if (activeTool === "pencil") {
                          setPencilColor(swatch);
                        } else {
                          setActiveTool("pen");
                          setPenColor(swatch);
                        }
                      }}
                      className={`h-4.5 w-4.5 rounded-full border transition-transform ${
                        isActiveColor
                          ? "scale-115 ring-2 ring-[#007AFF] ring-offset-1 border-white"
                          : "border-black/20 opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: swatch }}
                      title="Snelle inktkleur"
                    />
                  );
                })}
              </div>

              {/* 2. PENCIL (With Popover!) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "pencil") {
                      setOpenPopoverTool(openPopoverTool === "pencil" ? null : "pencil");
                    } else {
                      setActiveTool("pencil");
                      setOpenPopoverTool(null);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                    activeTool === "pencil"
                      ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Potlood (Schetsen)"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    <path d="M15 5l4 4" />
                  </svg>
                  <span
                    className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: pencilColor }}
                  />
                </button>

                {openPopoverTool === "pencil" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-60 rounded-3xl border border-black/10 bg-white/98 p-4 shadow-2xl backdrop-blur-2xl">
                    <span className="block text-[11px] font-bold text-[#8E8E93] uppercase mb-2">Potlood Dikte &amp; Kleur</span>
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#F2F2F7] px-3 py-2">
                      <input
                        type="range"
                        min={1}
                        max={12}
                        step={0.5}
                        value={pencilSize}
                        onChange={(e) => setPencilSize(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer accent-[#007AFF]"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {PEN_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPencilColor(c)}
                          className={`h-6.5 w-6.5 rounded-full border ${
                            pencilColor === c ? "ring-2 ring-[#007AFF] scale-110" : "border-black/15"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. HIGHLIGHTER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "highlighter") {
                      setOpenPopoverTool(openPopoverTool === "highlighter" ? null : "highlighter");
                    } else {
                      setActiveTool("highlighter");
                      setOpenPopoverTool(null);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                    activeTool === "highlighter"
                      ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Markeerstift"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="m9 11-6 6v3h3l6-6" />
                    <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
                  </svg>
                  <span
                    className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: highlighterColor }}
                  />
                </button>

                {openPopoverTool === "highlighter" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-56 rounded-3xl border border-black/10 bg-white/98 p-3.5 shadow-2xl backdrop-blur-2xl">
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

              {/* 4. ERASER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "eraser") {
                      setOpenPopoverTool(openPopoverTool === "eraser" ? null : "eraser");
                    } else {
                      setActiveTool("eraser");
                      setOpenPopoverTool(null);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                    activeTool === "eraser"
                      ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Gum (Klik nogmaals voor hele lijn of pagina wissen)"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                    <path d="M22 21H7" />
                    <path d="m5 11 9 9" />
                  </svg>
                </button>

                {openPopoverTool === "eraser" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-56 rounded-3xl border border-black/10 bg-white/98 p-3.5 shadow-2xl backdrop-blur-2xl">
                    <span className="block text-[10.5px] font-bold text-[#8E8E93] uppercase mb-2">Gummodus</span>
                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
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
                      className="w-full rounded-xl bg-[#FF3B30]/10 py-2 text-[11px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/20 transition"
                    >
                      🗑️ Wis hele pagina
                    </button>
                  </div>
                )}
              </div>

              {/* 5. TEXT TOOL (Tt) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("text");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  activeTool === "text"
                    ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Tekst typen (Tt)"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h10v3" />
                  <path d="M9 4v16" />
                  <path d="M15 11v-2h6v2" />
                  <path d="M18 9v11" />
                </svg>
              </button>

              {/* 6. LASSO TOOL */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("lasso");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  activeTool === "lasso"
                    ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Lasso selectie"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeDasharray="2 2">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                </svg>
              </button>

              {/* 7. LASER POINTER */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("laser");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  activeTool === "laser"
                    ? "bg-rose-500/15 text-rose-600 shadow-2xs"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Laserpointer (Tijdelijke gloeiende aanwijzer)"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
                </svg>
              </button>

              {/* 8. NOTABILITY STUDY TAPE TOOL */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTool === "tape") {
                      setOpenPopoverTool(openPopoverTool === "tape" ? null : "tape");
                    } else {
                      setActiveTool("tape");
                      setOpenPopoverTool(null);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                    activeTool === "tape"
                      ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                      : "text-[#3C3C43] hover:bg-black/[0.04]"
                  }`}
                  title="Studie Tape (Antwoorden afdekken om actief te leren)"
                >
                  <div
                    className="h-3 w-5 rounded-xs border border-dashed border-amber-700 shadow-2xs"
                    style={{ backgroundColor: selectedTapeColor }}
                  />
                </button>

                {openPopoverTool === "tape" && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-52 rounded-3xl border border-black/10 bg-white/98 p-3.5 shadow-2xl backdrop-blur-2xl">
                    <span className="block text-[11px] font-bold text-[#8E8E93] uppercase mb-2">Studie Tape Kleur</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TAPE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedTapeColor(c)}
                          className={`h-7 w-7 rounded-lg border ${
                            selectedTapeColor === c ? "ring-2 ring-[#007AFF] scale-110" : "border-black/10"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 9. RULER */}
              <button
                type="button"
                onClick={() => setShowRuler((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  showRuler
                    ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Liniaal tonen/verbergen"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
                  <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2" />
                </svg>
              </button>

              {/* Separator */}
              <div className="mx-0.5 h-5 w-px bg-black/[0.08]" />

              {/* 10. INSERT MENU (+ Media / Sticky / Page) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenPopoverTool(openPopoverTool === "insert" ? null : "insert")}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    openPopoverTool === "insert"
                      ? "bg-[#007AFF] text-white shadow-xs"
                      : "text-[#007AFF] hover:bg-[#007AFF]/10"
                  }`}
                  title="Invoegen (Document, Foto, Plaknotitie)"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                {openPopoverTool === "insert" && (
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-3xl border border-black/10 bg-white/98 p-2 shadow-2xl backdrop-blur-2xl text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        docUploadInputRef.current?.click();
                        setOpenPopoverTool(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                    >
                      <span className="text-base">🖼️</span>
                      <div className="text-left">
                        <p className="font-bold">Foto of Werkblad</p>
                        <p className="text-[10px] text-[#8E8E93]">Plaats afbeelding of PDF op blad</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddStickyNote("yellow");
                        setOpenPopoverTool(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                    >
                      <span className="text-base">🟨</span>
                      <div className="text-left">
                        <p className="font-bold">Plaknotitie (Sticky)</p>
                        <p className="text-[10px] text-[#8E8E93]">Versleepbaar geel kladblaadje</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddPage();
                        setOpenPopoverTool(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                    >
                      <span className="text-base">📄</span>
                      <div className="text-left">
                        <p className="font-bold">Nieuwe Pagina</p>
                        <p className="text-[10px] text-[#8E8E93]">Voeg extra blanco blad toe</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 11. AUDIO RECORDER */}
              {isRecordingAudio ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingAudio(false);
                    setHasRecordedAudio(true);
                    showToast("Audio-opname opgeslagen bij notitie");
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-white shadow-sm hover:bg-rose-600 transition animate-pulse"
                  title="Stop audio-opname"
                >
                  <span className="h-2 w-2 rounded-xs bg-white" />
                  <span className="font-mono text-[11px] font-bold">
                    {formatTimer(recordingSeconds)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingAudio(true);
                    setRecordingSeconds(0);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#3C3C43] hover:bg-black/[0.05] transition"
                  title="Audio-opname starten (Note Replay)"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              )}

              {/* 12. HAND TOOL (Pan / Scroll) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("hand");
                  setOpenPopoverTool(null);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  activeTool === "hand"
                    ? "bg-[#007AFF]/14 text-[#007AFF] shadow-2xs"
                    : "text-[#3C3C43] hover:bg-black/[0.04]"
                }`}
                title="Handje (Verschuiven / Scrollen)"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M18 11V6a2 2 0 0 0-4 0v5" />
                  <path d="M14 10V4a2 2 0 0 0-4 0v7" />
                  <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </button>

              {/* Minimize Toolbox Chevron */}
              <button
                type="button"
                onClick={() => setIsToolboxMinimized(true)}
                className="flex h-8 w-5 items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] transition"
                title="Werkbalk inklappen"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsToolboxMinimized(false)}
              className="flex h-8 items-center gap-1.5 px-3 text-xs font-bold text-[#007AFF]"
            >
              <span>✎</span>
              <span>Werkbalk</span>
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
          <aside className="z-30 flex w-72 shrink-0 flex-col border-r border-[#D1D1D6] bg-[#F2F2F7]/98 pt-16 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007AFF] text-white text-xs font-black shadow-xs">
                  ✎
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1C1C1E] block leading-tight">Notability</span>
                  <span className="text-[10px] text-[#8E8E93] font-medium">iCloud Gesynchroniseerd</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleClearPage();
                  setNoteTitle("");
                  setShowLibrarySidebar(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF] text-white text-sm font-bold shadow-xs hover:bg-[#0062CC]"
                title="Nieuwe lege notitie"
              >
                +
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1C1C1E] shadow-2xs">
                  <span>📄 Alle notities</span>
                  <span className="text-[#8E8E93] font-mono text-[11px]">18</span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#3C3C43] hover:bg-black/[0.04]">
                  <span>⭐ Favorieten</span>
                  <span className="text-[#8E8E93] font-mono text-[11px]">4</span>
                </div>
              </div>

              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Mijn Vakken
                </p>
                <div className="space-y-1">
                  {NOTABILITY_SUBJECTS.map((subj) => {
                    const isSelected = subj.id === activeSubjectId;
                    return (
                      <button
                        key={subj.id}
                        type="button"
                        onClick={() => handleSelectSubject(subj)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#007AFF] text-white shadow-xs"
                            : "text-[#1C1C1E] hover:bg-black/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-white/40 shadow-2xs"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="truncate">{subj.name}</span>
                        </div>
                        <span className={`font-mono text-[10px] ${isSelected ? "text-white/80" : "text-[#8E8E93]"}`}>
                          3
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-[#E5E5EA] p-3 space-y-2">
              <a
                href="https://zytron-phi.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E5EA] bg-white py-2 text-xs font-bold text-[#1C1C1E] shadow-2xs hover:bg-[#F9F9FB]"
              >
                <span>🌐 Open Zytron Hoofd App</span>
              </a>
              <button
                type="button"
                onClick={onExitStealth}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007AFF] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0062CC]"
              >
                <span>Terug naar Zytron Share</span>
              </button>
            </div>
          </aside>
        )}

        {/* CENTER SCROLLABLE PAPER CANVAS AREA */}
        <main
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsDraggingFileOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDraggingFileOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFileOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesDrop(e.dataTransfer.files, 60, 100);
            }
          }}
          className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[#E5E5EA] px-2 pt-20 pb-24 sm:px-6 sm:pt-22 md:px-10 flex justify-center"
        >
          {isDraggingFileOver && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#007AFF]/15 border-4 border-dashed border-[#007AFF] backdrop-blur-xs pointer-events-none transition-all">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl text-[#007AFF] mb-4 animate-bounce">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <p className="text-xl font-bold text-[#1C1C1E]">Laat bestand los om op je blad te plaatsen</p>
              <p className="text-sm font-medium text-[#3C3C43] mt-1">PDF&apos;s, werkbladen en foto&apos;s worden direct op je notitieblad gezet</p>
            </div>
          )}

          {/* PAPER SHEET */}
          <div
            ref={paperContainerRef}
            style={{
              ...getPaperStyles(),
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
            }}
            onPointerMove={(e) => {
              if (draggingStickyRef.current && paperContainerRef.current) {
                const rect = paperContainerRef.current.getBoundingClientRect();
                const newX = Math.max(8, Math.min(rect.width - 180, (e.clientX - rect.left) / zoomLevel - draggingStickyRef.current.offsetX));
                const newY = Math.max(8, Math.min(rect.height - 120, (e.clientY - rect.top) / zoomLevel - draggingStickyRef.current.offsetY));
                const targetId = draggingStickyRef.current.id;
                setPages((prev) =>
                  prev.map((pg, idx) =>
                    idx === currentPageIndex
                      ? {
                          ...pg,
                          stickies: pg.stickies.map((s) => (s.id === targetId ? { ...s, x: newX, y: newY } : s)),
                        }
                      : pg
                  )
                );
              }
              if (draggingImageRef.current && paperContainerRef.current) {
                const rect = paperContainerRef.current.getBoundingClientRect();
                const newX = Math.max(0, Math.min(rect.width - 120, (e.clientX - rect.left) / zoomLevel - draggingImageRef.current.offsetX));
                const newY = Math.max(0, Math.min(rect.height - 120, (e.clientY - rect.top) / zoomLevel - draggingImageRef.current.offsetY));
                const targetId = draggingImageRef.current.id;
                setPages((prev) =>
                  prev.map((pg, idx) =>
                    idx === currentPageIndex
                      ? {
                          ...pg,
                          images: pg.images.map((im) => (im.id === targetId ? { ...im, x: newX, y: newY } : im)),
                        }
                      : pg
                  )
                );
              }
            }}
            onPointerUp={() => {
              draggingStickyRef.current = null;
              draggingImageRef.current = null;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              setIsDraggingFileOver(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingFileOver(false);
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(24, e.clientX - rect.left - 100);
                const y = Math.max(60, e.clientY - rect.top - 50);
                handleFilesDrop(files, x, y);
              }
            }}
            className="relative w-full max-w-[880px] min-h-[1220px] rounded-[14px] shadow-[0_12px_45px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.05)] border border-black/[0.07] transition-transform duration-150"
          >
            {/* Subtle Title Area (Only shown if user typed a title, otherwise 100% pure blank sheet) */}
            {noteTitle.trim().length > 0 && (
              <div className="flex items-center justify-between px-8 sm:px-14 pt-6 pb-2 border-b border-black/[0.05]">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className={`w-full bg-transparent text-lg sm:text-xl font-bold tracking-tight focus:outline-none ${
                    isDarkPaper ? "text-white" : "text-[#1C1C1E]"
                  }`}
                />
                <span className="shrink-0 font-mono text-[10px] text-[#8E8E93] ml-4">
                  p.{currentPageIndex + 1}
                </span>
              </div>
            )}

            {/* Text Mode Helper Pill when Text tool is active */}
            {activeTool === "text" && (
              <div className="relative z-30 mx-8 sm:mx-14 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#007AFF]/25 bg-[#007AFF]/5 px-3.5 py-2 text-xs text-[#007AFF]">
                <span className="font-semibold">⌨️ Tekstmodus actief — Klik op het blad en begin direct met typen</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddStickyNote("yellow")}
                    className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#1C1C1E] shadow-2xs border border-black/10 hover:bg-gray-50"
                  >
                    + Plaknotitie
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool("pen")}
                    className="rounded-lg bg-[#007AFF] px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    Terug naar Pen
                  </button>
                </div>
              </div>
            )}

            {/* 1. Uploaded Documents / Worksheets Layer (Draggable & Resizable!) */}
            {currentPage.images.map((img) => (
              <div
                key={img.id}
                style={{ left: img.x, top: img.y, width: img.width }}
                className="absolute z-15 rounded-xl border border-black/15 shadow-md overflow-hidden bg-white group"
              >
                {/* Top Drag & Resize Bar on Hover */}
                <div
                  onPointerDown={(e) => {
                    if (!paperContainerRef.current) return;
                    const rect = paperContainerRef.current.getBoundingClientRect();
                    draggingImageRef.current = {
                      id: img.id,
                      offsetX: (e.clientX - rect.left) / zoomLevel - img.x,
                      offsetY: (e.clientY - rect.top) / zoomLevel - img.y,
                    };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  className="flex items-center justify-between bg-black/75 px-3 py-1.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition cursor-move"
                >
                  <span className="truncate font-semibold max-w-[180px]">✥ {img.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPages((prev) =>
                          prev.map((pg, idx) =>
                            idx === currentPageIndex
                              ? {
                                  ...pg,
                                  images: pg.images.map((i) =>
                                    i.id === img.id ? { ...i, width: Math.max(200, i.width - 80) } : i
                                  ),
                                }
                              : pg
                          )
                        )
                      }
                      className="rounded bg-white/20 px-1.5 py-0.5 font-bold hover:bg-white/30"
                      title="Kleiner"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPages((prev) =>
                          prev.map((pg, idx) =>
                            idx === currentPageIndex
                              ? {
                                  ...pg,
                                  images: pg.images.map((i) =>
                                    i.id === img.id ? { ...i, width: Math.min(820, i.width + 80) } : i
                                  ),
                                }
                              : pg
                          )
                        )
                      }
                      className="rounded bg-white/20 px-1.5 py-0.5 font-bold hover:bg-white/30"
                      title="Groter"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPages((prev) =>
                          prev.map((pg, idx) =>
                            idx === currentPageIndex
                              ? {
                                  ...pg,
                                  images: pg.images.map((i) =>
                                    i.id === img.id ? { ...i, x: 24, y: 40, width: 820 } : i
                                  ),
                                }
                              : pg
                          )
                        )
                      }
                      className="rounded bg-[#007AFF] px-2 py-0.5 font-bold"
                      title="Volledige breedte"
                    >
                      Vol blad
                    </button>
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
                      className="rounded bg-rose-500 px-2 py-0.5 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-auto object-contain pointer-events-none select-none"
                />
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
                className={`absolute z-25 cursor-pointer rounded-md transition-all duration-200 border-2 select-none group flex items-center justify-between px-2.5 ${
                  tape.isRevealed
                    ? "border-dashed border-black/30 bg-black/[0.03]"
                    : "border-black/20 shadow-xs"
                }`}
                title="Tik om antwoord te onthullen of verbergen"
              >
                <span className="text-[9.5px] font-mono font-bold text-black/55 truncate">
                  {tape.isRevealed ? "👀 ONTHULD (Tik om af te dekken)" : "▤ STUDIE TAPE (Tik om te tonen)"}
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
            <div className="relative z-10 px-8 sm:px-16 pt-6">
              <textarea
                value={currentPage.typedText}
                onChange={(e) => {
                  const val = e.target.value;
                  setPages((prev) =>
                    prev.map((pg, idx) => (idx === currentPageIndex ? { ...pg, typedText: val } : pg))
                  );
                }}
                placeholder={activeTool === "text" ? "Typ hier je aantekeningen of plak tekst…" : ""}
                rows={16}
                className={`w-full resize-none bg-transparent font-sans text-sm sm:text-[15.5px] leading-[30px] focus:outline-none ${
                  isDarkPaper ? "text-gray-100 placeholder-gray-600" : "text-[#1C1C1E] placeholder-[#AEAEB2]"
                } ${activeTool === "text" ? "pointer-events-auto" : "pointer-events-none"}`}
              />

              {/* Natural-looking Classmate Notes at the bottom of the page */}
              {incomingNotes.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-3 pointer-events-auto">
                  {incomingNotes.map((ans) => (
                    <div
                      key={ans.id}
                      onClick={() => {
                        navigator.clipboard.writeText(ans.text);
                        showToast("Uitwerking gekopieerd naar klembord");
                      }}
                      className={`group flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 cursor-pointer transition ${
                        isDarkPaper ? "hover:bg-white/5 text-gray-200" : "hover:bg-black/[0.03] text-[#1C1C1E]"
                      }`}
                      title="Klik om te kopiëren"
                    >
                      <p className="font-mono text-[13.5px] leading-[24px]">
                        <span className="font-semibold text-[#007AFF] mr-2">• Notitie ({ans.sender}):</span>
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

            {/* 4. Draggable & Color-Customizable Sticky Notes (Plaknotities) */}
            {currentPage.stickies.map((st) => {
              const theme = stickyThemeMap[st.color] || stickyThemeMap.yellow;
              return (
                <div
                  key={st.id}
                  style={{
                    left: st.x,
                    top: st.y,
                    width: st.width,
                    minHeight: st.height,
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                  }}
                  className="absolute z-30 flex flex-col rounded-2xl border-2 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                >
                  <div
                    onPointerDown={(e) => {
                      if (!paperContainerRef.current) return;
                      const rect = paperContainerRef.current.getBoundingClientRect();
                      draggingStickyRef.current = {
                        id: st.id,
                        offsetX: (e.clientX - rect.left) / zoomLevel - st.x,
                        offsetY: (e.clientY - rect.top) / zoomLevel - st.y,
                      };
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    style={{ borderColor: theme.border, color: theme.headerText }}
                    className="flex items-center justify-between border-b pb-1.5 mb-2 cursor-move select-none"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>✥</span> Notitie
                    </span>
                    <div className="flex items-center gap-1">
                      {(["yellow", "blue", "green", "grid"] as const).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPages((prev) =>
                              prev.map((pg, idx) =>
                                idx === currentPageIndex
                                  ? {
                                      ...pg,
                                      stickies: pg.stickies.map((s) => (s.id === st.id ? { ...s, color: col } : s)),
                                    }
                                  : pg
                              )
                            );
                          }}
                          className="h-3 w-3 rounded-full border border-black/20"
                          style={{ backgroundColor: stickyThemeMap[col].bg }}
                          title="Kleur wijzigen"
                        />
                      ))}
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
                        className="ml-1 text-xs font-bold opacity-60 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
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
                    className="flex-1 resize-none bg-transparent text-xs text-[#1C1C1E] placeholder-black/35 focus:outline-none leading-relaxed"
                  />
                </div>
              );
            })}

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
                className="absolute z-30 h-14 w-[520px] cursor-move rounded-xl border border-black/20 bg-white/85 backdrop-blur-md shadow-xl flex flex-col justify-between px-4 py-1 select-none"
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

          {/* =====================================================================
              BOTTOM FLOATING PAGE & QUICK-ACTION PILL (Effortless Multi-Page UX)
             ===================================================================== */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/95 px-3 py-1.5 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
            <button
              type="button"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#3C3C43] hover:bg-black/5 disabled:opacity-30"
              title="Vorige pagina"
            >
              ‹
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-[#1C1C1E]">
              Pagina {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              disabled={currentPageIndex >= pages.length - 1}
              onClick={() => setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#3C3C43] hover:bg-black/5 disabled:opacity-30"
              title="Volgende pagina"
            >
              ›
            </button>

            <span className="h-4 w-px bg-black/10 mx-1" />

            <button
              type="button"
              onClick={handleAddPage}
              className="rounded-full bg-[#007AFF]/10 px-2.5 py-1 text-[11px] font-bold text-[#007AFF] hover:bg-[#007AFF]/20 transition"
            >
              + Pagina
            </button>

            <button
              type="button"
              onClick={() => handleAddStickyNote("yellow")}
              className="hidden sm:inline-flex rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-400/30 transition"
            >
              + Plaknotitie
            </button>

            <button
              type="button"
              onClick={() => docUploadInputRef.current?.click()}
              className="hidden sm:inline-flex rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-semibold text-[#1C1C1E] hover:bg-black/[0.09] transition"
            >
              📂 Document
            </button>

            {connectedCount > 0 && (
              <>
                <span className="h-4 w-px bg-black/10 mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowNotabilityAiDrawer(true);
                    setSmartNotesTab("chat");
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700"
                  title="Klasgenoten verbonden op radar"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{connectedCount} online</span>
                </button>
              </>
            )}
          </div>
        </main>

        {/* RIGHT DRAWER 1: Authentic Notability Smart Notes & Quiz Split Screen */}
        {showNotabilityAiDrawer && (
          <>
            <div className="hidden sm:flex z-30 w-2.5 shrink-0 items-center justify-center bg-[#E5E5EA]/70 hover:bg-[#D1D1D6] cursor-col-resize select-none transition-colors border-l border-[#D1D1D6]">
              <div className="h-9 w-1 rounded-full bg-[#8E8E93]/70" />
            </div>

            <aside className="z-30 flex w-full max-w-[460px] sm:w-[420px] md:w-[460px] shrink-0 flex-col border-l border-[#D1D1D6] bg-white pt-16 shadow-2xl transition-all">
              {/* Segmented Tab Switcher inside Sidecar Header */}
              <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 pb-3">
                <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#F2F2F7] p-1">
                  <button
                    type="button"
                    onClick={() => setSmartNotesTab("notes")}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      smartNotesTab === "notes"
                        ? "bg-white text-[#1C1C1E] shadow-2xs"
                        : "text-[#8E8E93] hover:text-[#1C1C1E]"
                    }`}
                  >
                    ✨ Samenvatting
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartNotesTab("quiz")}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      smartNotesTab === "quiz"
                        ? "bg-white text-[#1C1C1E] shadow-2xs"
                        : "text-[#8E8E93] hover:text-[#1C1C1E]"
                    }`}
                  >
                    📝 Quiz ({quizQuestionIndex + 1}/{NOTABILITY_QUIZ_QUESTIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartNotesTab("chat")}
                    className={`relative flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      smartNotesTab === "chat"
                        ? "bg-white text-[#1C1C1E] shadow-2xs"
                        : "text-[#8E8E93] hover:text-[#1C1C1E]"
                    }`}
                  >
                    💬 Klas ({incomingNotes.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotabilityAiDrawer(false)}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[#8E8E93] hover:bg-black/5 hover:text-[#1C1C1E] transition"
                  title="Sluit paneel"
                >
                  ✕
                </button>
              </div>

              {/* Content Tab 1: Smart Notes (100% Clean & Dynamic Dutch Summary) */}
              {smartNotesTab === "notes" && (
                <div className="flex-1 overflow-y-auto p-6 text-[#1C1C1E] font-sans custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: activeSubject.color }}
                      >
                        {activeSubject.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#8E8E93]">
                        Pagina {currentPageIndex + 1} van {pages.length}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E] mb-2">
                        {noteTitle.trim() || "Slimme Samenvatting"}
                      </h2>
                      <p className="text-sm leading-relaxed text-[#3C3C43] rounded-2xl bg-[#F2F2F7]/70 p-4 border border-black/[0.04]">
                        {currentPage.typedText.trim()
                          ? currentPage.typedText
                          : "Je werkt momenteel op een schoon blanco notitieblad. Schrijf met de vulpen, typ aantekeningen met het Tt-gereedschap of sleep een werkblad/foto op je pagina."}
                      </p>
                    </div>

                    {/* Live Notitie Statistieken & Overzicht */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Inhoud op deze pagina
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] p-3">
                          <p className="text-lg font-black text-[#007AFF]">{currentPage.strokes.length}</p>
                          <p className="text-[10.5px] font-semibold text-[#8E8E93]">Inktlijnen</p>
                        </div>
                        <div className="rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] p-3">
                          <p className="text-lg font-black text-[#5856D6]">{currentPage.stickies.length}</p>
                          <p className="text-[10.5px] font-semibold text-[#8E8E93]">Plaknotities</p>
                        </div>
                        <div className="rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] p-3">
                          <p className="text-lg font-black text-[#34C759]">{currentPage.images.length}</p>
                          <p className="text-[10.5px] font-semibold text-[#8E8E93]">Documenten</p>
                        </div>
                      </div>
                    </div>

                    {/* Snelkoppelingen */}
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                        Snelle Studie-acties
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleAddStickyNote("yellow")}
                        className="flex w-full items-center justify-between rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-bold text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                      >
                        <span>🟨 Plaknotitie op blad plaatsen</span>
                        <span className="text-[#007AFF]">+</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => docUploadInputRef.current?.click()}
                        className="flex w-full items-center justify-between rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-bold text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                      >
                        <span>📂 Werkblad of Screenshot toevoegen</span>
                        <span className="text-[#007AFF]">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-4 border-t border-[#E5E5EA] mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8E8E93]">
                      ✦ Notability AI Gereed
                    </span>
                    <button
                      type="button"
                      onClick={() => setSmartNotesTab("quiz")}
                      className="flex items-center gap-1.5 rounded-full bg-[#007AFF] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0062CC] transition active:scale-95"
                    >
                      <span>Start Oefenquiz</span>
                      <span>›</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Content Tab 2: Quiz Flashcards */}
              {smartNotesTab === "quiz" && (() => {
                const totalQuestions = NOTABILITY_QUIZ_QUESTIONS.length;
                const safeIndex = Math.min(Math.max(0, quizQuestionIndex), totalQuestions - 1);
                const currentQ = NOTABILITY_QUIZ_QUESTIONS[safeIndex] || NOTABILITY_QUIZ_QUESTIONS[0];
                const currentAnswer = quizAnswers[safeIndex];
                const progressPct = Math.round(((safeIndex + 1) / totalQuestions) * 100);

                return (
                  <div className="flex-1 overflow-y-auto p-6 text-sm text-[#1C1C1E] space-y-5 font-sans custom-scrollbar flex flex-col justify-between">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-sm text-[#007AFF] tracking-tight">
                          Vraag {safeIndex + 1} van {totalQuestions}
                        </span>
                        <span className="font-mono text-xs text-[#8E8E93]">{progressPct}%</span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-[#E5E5EA] overflow-hidden mb-6">
                        <div
                          className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#1C1C1E] leading-snug mb-5">
                        {currentQ.question}
                      </h3>

                      <div className="space-y-3">
                        {currentQ.options.map((optText, optIdx) => {
                          const isSelected = currentAnswer === optIdx;
                          const isCorrectOption = optIdx === currentQ.correctIndex;
                          const hasAnswered = currentAnswer !== undefined;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [safeIndex]: optIdx,
                                }));
                              }}
                              className={`w-full rounded-2xl border p-4 text-left text-sm font-medium leading-snug transition-all relative flex items-center justify-between shadow-2xs bg-white ${
                                hasAnswered
                                  ? isCorrectOption
                                    ? "border-2 border-[#34C759] bg-[#34C759]/5 text-[#1C1C1E] font-bold"
                                    : isSelected
                                      ? "border-2 border-[#FF3B30] bg-[#FF3B30]/5 text-[#1C1C1E] font-bold"
                                      : "border-[#E5E5EA] text-[#1C1C1E]"
                                  : "border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E] active:scale-[0.99]"
                              }`}
                            >
                              <span className="pr-8">{optText}</span>
                              {hasAnswered && isCorrectOption && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#34C759] text-white text-xs font-bold shadow-xs">
                                  ✓
                                </span>
                              )}
                              {hasAnswered && isSelected && !isCorrectOption && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] text-white text-xs font-bold shadow-xs">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 mt-6 text-[#8E8E93]">
                        <button
                          type="button"
                          onClick={() =>
                            setQuizFeedback((prev) => ({
                              ...prev,
                              [safeIndex]: prev[safeIndex] === "up" ? null : "up",
                            }))
                          }
                          className={`hover:text-[#1C1C1E] transition ${
                            quizFeedback[safeIndex] === "up" ? "text-[#007AFF]" : ""
                          }`}
                          title="Nuttige vraag"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQuizFeedback((prev) => ({
                              ...prev,
                              [safeIndex]: prev[safeIndex] === "down" ? null : "down",
                            }))
                          }
                          className={`hover:text-[#1C1C1E] transition ${
                            quizFeedback[safeIndex] === "down" ? "text-[#FF3B30]" : ""
                          }`}
                          title="Verbetering nodig"
                        >
                          👎
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#E5E5EA] text-sm font-bold text-[#007AFF]">
                      <button
                        type="button"
                        disabled={safeIndex === 0}
                        onClick={() => setQuizQuestionIndex((i) => Math.max(0, i - 1))}
                        className={`flex items-center gap-1 transition ${
                          safeIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:opacity-75"
                        }`}
                      >
                        <span>←</span> Vorige
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizQuestionIndex((i) => (i + 1) % totalQuestions)}
                        className="flex items-center gap-1 rounded-xl bg-[#007AFF] px-4 py-2 text-xs text-white hover:bg-[#0062CC] transition"
                      >
                        Volgende <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Content Tab 3: Klasgenoten Stealth Chat */}
              {smartNotesTab === "chat" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {incomingNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-56 text-center text-[#8E8E93] px-4">
                        <span className="text-3xl mb-2">📐</span>
                        <p className="text-xs font-bold text-[#1C1C1E]">Geen gedeelde klasnotities</p>
                        <p className="text-[11px] mt-1 leading-relaxed">
                          Typ hieronder een formule, antwoord of notitie om direct met verbonden klasgenoten te delen.
                        </p>
                      </div>
                    ) : (
                      incomingNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            navigator.clipboard.writeText(note.text);
                            showToast("Gekopieerd naar klembord");
                          }}
                          className="cursor-pointer rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-[#1C1C1E] hover:bg-indigo-50 transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#007AFF] text-[11px] flex items-center gap-1">
                              <span>●</span> {note.sender}
                            </span>
                            <span className="font-mono text-[10px] text-[#8E8E93]">{note.time} • Tik om te kopiëren</span>
                          </div>
                          <p className="font-mono text-xs leading-relaxed text-[#1C1C1E]">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Prompt / Query Bar */}
              <div className="border-t border-[#E5E5EA] p-3 bg-white">
                <div className="flex items-center gap-2 rounded-2xl border border-[#D1D1D6] bg-[#F2F2F7]/60 px-3.5 py-2 focus-within:border-[#007AFF] focus-within:bg-white transition">
                  <span className="text-sm">✨</span>
                  <input
                    type="text"
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && aiChatInput.trim()) {
                        onSendNote(aiChatInput.trim());
                        setAiChatInput("");
                      }
                    }}
                    placeholder={
                      smartNotesTab === "chat"
                        ? "Deel direct een antwoord of formule met de klas…"
                        : "Stuur een notitie of vraag naar verbonden toestellen…"
                    }
                    className="flex-1 bg-transparent text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (aiChatInput.trim()) {
                        onSendNote(aiChatInput.trim());
                        setAiChatInput("");
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF] text-white text-xs font-bold hover:bg-[#0062CC] transition"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* RIGHT DRAWER 2: Authentic Notability Page Manager (Thumbnails) */}
        {showPagesSidebar && (
          <aside className="z-30 flex w-60 shrink-0 flex-col border-l border-[#D1D1D6] bg-[#F2F2F7]/98 pt-16 backdrop-blur-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 pb-3">
              <span className="text-xs font-bold text-[#1C1C1E]">Pagina&apos;s ({pages.length})</span>
              <button
                type="button"
                onClick={handleAddPage}
                className="rounded-xl bg-[#007AFF] px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0062CC]"
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
                    className={`cursor-pointer rounded-2xl border-2 p-2.5 transition ${
                      active
                        ? "border-[#007AFF] bg-white shadow-md"
                        : "border-transparent bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div
                      className="h-28 w-full rounded-xl border border-black/10 p-2.5 overflow-hidden text-[8px] text-[#3C3C43] leading-tight"
                      style={getPaperStyles()}
                    >
                      <p className="font-bold truncate">{noteTitle || "Blanco blad"}</p>
                      <p className="mt-1 line-clamp-5 text-[#8E8E93]">{pg.typedText || "Lege pagina"}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-[#1C1C1E]">Pagina {idx + 1}</span>
                      <span className="font-mono text-[10px] text-[#8E8E93]">{pg.strokes.length} lijnen</span>
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
