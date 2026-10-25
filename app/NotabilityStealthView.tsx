"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Undo2,
  Redo2,
  Mic,
  Square,
  Plus,
  MoreHorizontal,
  Share,
  Sparkles,
  BookOpen,
  Layers,
  Check,
  X,
  Search,
  Trash2,
  Copy,
  Send,
  FileText,
  Image as ImageIcon,
  Folder,
  Star,
  Clock,
  Users,
  Grid,
  List as ListIcon,
  Settings,
  Volume2,
  Play,
  Pause,
  Bookmark,
  HelpCircle,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Move,
  Globe,
  ArrowUpRight,
  Download,
  Printer,
  Sliders,
  MessageSquare,
  CreditCard,
} from "lucide-react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface IncomingStealthNote {
  id: string;
  sender: string;
  text: string;
  time: string | number;
}

export interface NotabilityStealthViewProps {
  onExitStealth: () => void;
  quickText: string;
  setQuickText: (text: string) => void;
  onSendNote: (customText?: string) => void;
  incomingNotes: IncomingStealthNote[];
  connectedCount: number;
  onUploadFileToZytron: (files: FileList | File[]) => void;
  showToast: (msg: string) => void;
}

type ToolType =
  | "pen"
  | "pencil"
  | "highlighter"
  | "eraser"
  | "text"
  | "lasso"
  | "laser"
  | "tape"
  | "hand";

type EraserMode = "whole" | "partial";
type PenStyle = "solid" | "dashed" | "dotted";
type PaperTemplate = "grid" | "lined" | "dotted" | "blank";
type PaperColor = "#FFFFFF" | "#FBF8F1" | "#FFFBEB" | "#F0F7FF" | "#F2FBF4" | "#1C1C1E";
type GridSpacing = "small" | "medium" | "large";
type ToolboxDock = "top" | "bottom" | "left";

interface StrokePoint {
  x: number;
  y: number;
}

interface InkStroke {
  id: string;
  pageIndex: number;
  tool: "pen" | "pencil" | "highlighter" | "tape";
  color: string;
  width: number;
  style?: PenStyle;
  points: StrokePoint[];
  revealed?: boolean;
}

interface StickyNoteItem {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: "#FFF9C4" | "#FFE4E6" | "#E0F2FE" | "#DCFCE7" | "#FFFFFF";
  pattern: "blank" | "lined" | "grid";
  text: string;
}

interface UploadedImageItem {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  src: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
  color: string;
  divider: string;
}

interface NoteDocument {
  id: string;
  title: string;
  subjectId: string;
  updatedAt: string;
  createdAt: string;
  favorite: boolean;
  template: PaperTemplate;
  paperColor: PaperColor;
  spacing: GridSpacing;
  pages: number[];
  bookmarkedPages: number[];
  typedContentByPage: Record<number, string>;
}

const NOTABILITY_SUBJECTS: SubjectItem[] = [
  { id: "wis-b", name: "Wiskunde B", color: "#007AFF", divider: "Exacte Vakken" },
  { id: "nat", name: "Natuurkunde", color: "#5856D6", divider: "Exacte Vakken" },
  { id: "sch", name: "Scheikunde", color: "#34C759", divider: "Exacte Vakken" },
  { id: "bio", name: "Biologie", color: "#FF9500", divider: "Exacte Vakken" },
  { id: "ned", name: "Nederlands", color: "#AF52DE", divider: "Talen & Maatschappij" },
  { id: "eng", name: "Engels", color: "#FF2D55", divider: "Talen & Maatschappij" },
  { id: "eco", name: "Economie", color: "#5AC8FA", divider: "Talen & Maatschappij" },
  { id: "ges", name: "Geschiedenis", color: "#FFCC00", divider: "Talen & Maatschappij" },
];

const NOTABILITY_INK_COLORS = [
  "#1C1C1E",
  "#007AFF",
  "#FF3B30",
  "#34C759",
  "#FF9500",
  "#AF52DE",
  "#5856D6",
  "#5AC8FA",
  "#FF2D55",
  "#FFCC00",
  "#8E8E93",
  "#A2845E",
  "#00C7BE",
  "#30B0C7",
  "#INDIGO",
  "#6366F1",
].map((c) => (c === "#INDIGO" ? "#4F46E5" : c));

const PAPER_COLORS: { color: PaperColor; label: string; border: string }[] = [
  { color: "#FFFFFF", label: "Wit", border: "#D1D1D6" },
  { color: "#FBF8F1", label: "Crème", border: "#E5DEC9" },
  { color: "#FFFBEB", label: "Geel", border: "#FDE68A" },
  { color: "#F0F7FF", label: "Blauw", border: "#BFDBFE" },
  { color: "#F2FBF4", label: "Mint", border: "#BBF7D0" },
  { color: "#1C1C1E", label: "Donker", border: "#3A3A3C" },
];

const INITIAL_NOTES: NoteDocument[] = [
  {
    id: "note-1",
    title: "Nieuwe Notitie",
    subjectId: "wis-b",
    updatedAt: "Zojuist",
    createdAt: "25 okt 2026",
    favorite: true,
    template: "grid",
    paperColor: "#FFFFFF",
    spacing: "medium",
    pages: [1],
    bookmarkedPages: [],
    typedContentByPage: { 0: "" },
  },
  {
    id: "note-2",
    title: "Hoofdstuk 4 — Differentiaalrekening",
    subjectId: "wis-b",
    updatedAt: "Gisteren",
    createdAt: "24 okt 2026",
    favorite: false,
    template: "grid",
    paperColor: "#FBF8F1",
    spacing: "medium",
    pages: [1, 2],
    bookmarkedPages: [0],
    typedContentByPage: { 0: "", 1: "" },
  },
  {
    id: "note-3",
    title: "Practicum Verslag Kracht & Beweging",
    subjectId: "nat",
    updatedAt: "23 okt",
    createdAt: "23 okt 2026",
    favorite: true,
    template: "lined",
    paperColor: "#FFFFFF",
    spacing: "medium",
    pages: [1],
    bookmarkedPages: [],
    typedContentByPage: { 0: "" },
  },
  {
    id: "note-4",
    title: "Samenvatting Organische Chemie",
    subjectId: "sch",
    updatedAt: "21 okt",
    createdAt: "21 okt 2026",
    favorite: false,
    template: "dotted",
    paperColor: "#FFFFFF",
    spacing: "medium",
    pages: [1],
    bookmarkedPages: [],
    typedContentByPage: { 0: "" },
  },
];

// ============================================================================
// MAIN NOTABILITY 15/16 REPLICA COMPONENT
// ============================================================================
export default function NotabilityStealthView({
  onExitStealth,
  onSendNote,
  incomingNotes,
  connectedCount,
  onUploadFileToZytron,
  showToast,
}: NotabilityStealthViewProps) {
  const onToggleNotability = onExitStealth;
  const onSendQuickNote = (text: string) => {
    onSendNote(text);
  };
  // ─── Core Screen Mode: "editor" (Note Editor) vs "library" (Full Library Home Screen) ───
  const [screenMode, setScreenMode] = useState<"editor" | "library">("editor");

  // ─── Library State ───
  const [notes, setNotes] = useState<NoteDocument[]>(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string>("note-1");
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState<string>("wis-b");
  const [libraryViewMode, setLibraryViewMode] = useState<"grid" | "list">("grid");
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>("");
  const [collapsedDividers, setCollapsedDividers] = useState<Record<string, boolean>>({});
  const [showNewNoteMenu, setShowNewNoteMenu] = useState<boolean>(false);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const activeSubject =
    NOTABILITY_SUBJECTS.find((s) => s.id === activeNote.subjectId) || NOTABILITY_SUBJECTS[0];

  // ─── Active Page & View Settings ───
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"seamless" | "single">("seamless");
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showZoomLoupe, setShowZoomLoupe] = useState<boolean>(false);

  // ─── Toolbox & Drawing State ───
  const [toolboxDock, setToolboxDock] = useState<ToolboxDock>("top");
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [activePopover, setActivePopover] = useState<
    | null
    | "pen"
    | "pencil"
    | "highlighter"
    | "eraser"
    | "insert"
    | "options"
    | "share"
    | "noteSwitcher"
    | "toolboxSettings"
  >(null);

  const [penColor, setPenColor] = useState<string>("#1C1C1E");
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [penStyle, setPenStyle] = useState<PenStyle>("solid");

  const [pencilColor, setPencilColor] = useState<string>("#3A3A3C");
  const [pencilWidth, setPencilWidth] = useState<number>(3.5);

  const [highlighterColor, setHighlighterColor] = useState<string>("#FFCC00");
  const [highlighterWidth, setHighlighterWidth] = useState<number>(18);

  const [eraserMode, setEraserMode] = useState<EraserMode>("whole");
  const [eraserWidth, setEraserWidth] = useState<number>(20);

  const [laserColor, setLaserColor] = useState<string>("#FF3B30");
  const [laserTrail, setLaserTrail] = useState<StrokePoint[]>([]);

  // ─── Text Formatting State (when Text tool is active) ───
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontBold, setFontBold] = useState<boolean>(false);
  const [fontItalic, setFontItalic] = useState<boolean>(false);
  const [fontUnderline, setFontUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // ─── Canvas Content State (Strokes, Sticky Notes, Uploaded Images, Ruler) ───
  const [strokesByNote, setStrokesByNote] = useState<Record<string, InkStroke[]>>({});
  const [redoByNote, setRedoByNote] = useState<Record<string, InkStroke[]>>({});
  const [stickyNotesByNote, setStickyNotesByNote] = useState<Record<string, StickyNoteItem[]>>({});
  const [imagesByNote, setImagesByNote] = useState<Record<string, UploadedImageItem[]>>({});

  const strokes = strokesByNote[activeNote.id] || [];
  const redoStack = redoByNote[activeNote.id] || [];
  const stickyNotes = stickyNotesByNote[activeNote.id] || [];
  const uploadedImages = imagesByNote[activeNote.id] || [];

  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // ─── Interactive Ruler State ───
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [rulerPos, setRulerPos] = useState<{ x: number; y: number; angle: number }>({
    x: 160,
    y: 260,
    angle: 0,
  });

  // ─── Dragging State for Sticky Notes / Images / Ruler ───
  const [draggingObject, setDraggingObject] = useState<{
    type: "sticky" | "image" | "ruler";
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // ─── Right-Hand Side Drawers: "learn" (Notability Learn AI) & "content" (Content Manager) ───
  const [rightDrawer, setRightDrawer] = useState<null | "learn" | "content">(null);
  const [learnTab, setLearnTab] = useState<"summary" | "flashcards" | "quiz" | "chat">("summary");
  const [contentTab, setContentTab] = useState<"pages" | "bookmarks" | "search" | "transcript">(
    "pages"
  );

  // ─── Interactive Learn State (Flashcards, Quiz, Chat / P2P) ───
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [stealthInputText, setStealthInputText] = useState<string>("");
  const [searchInNoteQuery, setSearchInNoteQuery] = useState<string>("");

  // ─── Audio Recording & Note Replay Bar State ───
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioSeconds, setAudioSeconds] = useState<number>(0);
  const [showAudioBar, setShowAudioBar] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // ─── Refs ───
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Audio recording timer
  useEffect(() => {
    if (!isRecordingAudio && !isPlayingAudio) return;
    const t = setInterval(() => {
      setAudioSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRecordingAudio, isPlayingAudio]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ─── Helper Mutators for Current Note ───
  const updateActiveNote = useCallback(
    (updater: (note: NoteDocument) => NoteDocument) => {
      setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? updater(n) : n)));
    },
    [activeNote.id]
  );

  const setStrokesForActiveNote = useCallback(
    (updater: (prev: InkStroke[]) => InkStroke[]) => {
      setStrokesByNote((prev) => ({
        ...prev,
        [activeNote.id]: updater(prev[activeNote.id] || []),
      }));
    },
    [activeNote.id]
  );

  const setRedoForActiveNote = useCallback(
    (updater: (prev: InkStroke[]) => InkStroke[]) => {
      setRedoByNote((prev) => ({
        ...prev,
        [activeNote.id]: updater(prev[activeNote.id] || []),
      }));
    },
    [activeNote.id]
  );

  const setStickyNotesForActiveNote = useCallback(
    (updater: (prev: StickyNoteItem[]) => StickyNoteItem[]) => {
      setStickyNotesByNote((prev) => ({
        ...prev,
        [activeNote.id]: updater(prev[activeNote.id] || []),
      }));
    },
    [activeNote.id]
  );

  const setImagesForActiveNote = useCallback(
    (updater: (prev: UploadedImageItem[]) => UploadedImageItem[]) => {
      setImagesByNote((prev) => ({
        ...prev,
        [activeNote.id]: updater(prev[activeNote.id] || []),
      }));
    },
    [activeNote.id]
  );

  // ─── Render Ink Strokes onto Each Page Canvas ───
  const renderPageCanvas = useCallback(
    (pageIdx: number) => {
      const canvas = canvasRefs.current[pageIdx];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pageStrokes = strokes.filter((s) => s.pageIndex === pageIdx);
      const allToDraw =
        currentStroke && currentStroke.pageIndex === pageIdx
          ? [...pageStrokes, currentStroke]
          : pageStrokes;

      for (const stroke of allToDraw) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (stroke.tool === "highlighter") {
          ctx.globalAlpha = 0.35;
          ctx.lineCap = "butt";
        } else if (stroke.tool === "pencil") {
          ctx.globalAlpha = 0.78;
        } else if (stroke.tool === "tape") {
          ctx.globalAlpha = stroke.revealed ? 0.22 : 0.96;
        } else {
          ctx.globalAlpha = 1;
        }

        if (stroke.style === "dashed") {
          ctx.setLineDash([stroke.width * 3, stroke.width * 2]);
        } else if (stroke.style === "dotted") {
          ctx.setLineDash([stroke.width, stroke.width * 2.2]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = stroke.tool === "tape" ? "#F59E0B" : stroke.color;
        ctx.lineWidth = stroke.width;

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        ctx.stroke();

        // Draw striped Notability Study Tape pattern
        if (stroke.tool === "tape" && !stroke.revealed) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Laser Pointer Trail on active page
      if (activeTool === "laser" && laserTrail.length > 1 && pageIdx === activePageIndex) {
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = laserColor;
        ctx.shadowColor = laserColor;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 5;
        ctx.moveTo(laserTrail[0].x, laserTrail[0].y);
        for (let i = 1; i < laserTrail.length; i++) {
          ctx.lineTo(laserTrail[i].x, laserTrail[i].y);
        }
        ctx.stroke();
        const last = laserTrail[laserTrail.length - 1];
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    [strokes, currentStroke, activeTool, laserTrail, laserColor, activePageIndex]
  );

  useEffect(() => {
    activeNote.pages.forEach((_, idx) => renderPageCanvas(idx));
  }, [activeNote.pages, renderPageCanvas]);

  // ─── Pointer Handlers for Drawing / Erasing / Tape / Laser ───
  const getCanvasPoint = (
    e: React.PointerEvent<HTMLCanvasElement>,
    pageIdx: number
  ): StrokePoint => {
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleCanvasPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>,
    pageIdx: number
  ) => {
    setActivePageIndex(pageIdx);
    if (activePopover) setActivePopover(null);
    if (activeTool === "text" || activeTool === "lasso" || activeTool === "hand") return;

    const pt = getCanvasPoint(e, pageIdx);

    // Tap on Study Tape to toggle reveal/cover
    const hitTape = strokes.find(
      (s) =>
        s.pageIndex === pageIdx &&
        s.tool === "tape" &&
        s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 24)
    );
    if (hitTape && activeTool !== "eraser") {
      setStrokesForActiveNote((prev) =>
        prev.map((s) => (s.id === hitTape.id ? { ...s, revealed: !s.revealed } : s))
      );
      return;
    }

    if (activeTool === "laser") {
      setIsDrawing(true);
      setLaserTrail([pt]);
      return;
    }

    if (activeTool === "eraser") {
      setIsDrawing(true);
      const radius = eraserMode === "whole" ? 24 : eraserWidth;
      setStrokesForActiveNote((prev) =>
        prev.filter(
          (s) =>
            s.pageIndex !== pageIdx ||
            !s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < radius)
        )
      );
      return;
    }

    setIsDrawing(true);
    const strokeTool =
      activeTool === "highlighter"
        ? "highlighter"
        : activeTool === "pencil"
          ? "pencil"
          : activeTool === "tape"
            ? "tape"
            : "pen";

    const color =
      strokeTool === "highlighter"
        ? highlighterColor
        : strokeTool === "pencil"
          ? pencilColor
          : penColor;

    const width =
      strokeTool === "highlighter"
        ? highlighterWidth
        : strokeTool === "pencil"
          ? pencilWidth
          : strokeTool === "tape"
            ? 24
            : penWidth;

    setCurrentStroke({
      id: `${Date.now()}-${Math.random()}`,
      pageIndex: pageIdx,
      tool: strokeTool,
      color,
      width,
      style: strokeTool === "pen" ? penStyle : "solid",
      points: [pt],
      revealed: false,
    });
  };

  const handleCanvasPointerMove = (
    e: React.PointerEvent<HTMLCanvasElement>,
    pageIdx: number
  ) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e, pageIdx);

    if (activeTool === "laser") {
      setLaserTrail((prev) => [...prev.slice(-26), pt]);
      return;
    }

    if (activeTool === "eraser") {
      const radius = eraserMode === "whole" ? 24 : eraserWidth;
      setStrokesForActiveNote((prev) =>
        prev.filter(
          (s) =>
            s.pageIndex !== pageIdx ||
            !s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < radius)
        )
      );
      return;
    }

    if (currentStroke && currentStroke.pageIndex === pageIdx) {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pt] } : null));
    }
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (activeTool === "laser") {
      setTimeout(() => setLaserTrail([]), 380);
      return;
    }
    if (currentStroke && currentStroke.points.length > 1) {
      const finished = currentStroke;
      setStrokesForActiveNote((prev) => [...prev, finished]);
      setRedoForActiveNote(() => []);
    }
    setCurrentStroke(null);
  };

  // ─── Undo / Redo ───
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokesForActiveNote((prev) => prev.slice(0, -1));
    setRedoForActiveNote((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoForActiveNote((prev) => prev.slice(0, -1));
    setStrokesForActiveNote((prev) => [...prev, next]);
  };

  // ─── Create New Note ───
  const createNewNote = (template: PaperTemplate = "grid", paperColor: PaperColor = "#FFFFFF") => {
    const subjId = NOTABILITY_SUBJECTS.some((s) => s.id === selectedLibraryFilter)
      ? selectedLibraryFilter
      : activeNote.subjectId;
    const newNote: NoteDocument = {
      id: `note-${Date.now()}`,
      title: `Notitie ${notes.length + 1}`,
      subjectId: subjId,
      updatedAt: "Zojuist",
      createdAt: "25 okt 2026",
      favorite: false,
      template,
      paperColor,
      spacing: "medium",
      pages: [1],
      bookmarkedPages: [],
      typedContentByPage: { 0: "" },
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActivePageIndex(0);
    setShowNewNoteMenu(false);
    setScreenMode("editor");
  };

  // ─── Add Sticky Note ───
  const addStickyNote = (
    color: StickyNoteItem["color"] = "#FFF9C4",
    pattern: StickyNoteItem["pattern"] = "lined"
  ) => {
    const newSticky: StickyNoteItem = {
      id: `sticky-${Date.now()}`,
      pageIndex: activePageIndex,
      x: 110 + (stickyNotes.length % 4) * 35,
      y: 120 + (stickyNotes.length % 4) * 35,
      width: 230,
      height: 185,
      color,
      pattern,
      text: "",
    };
    setStickyNotesForActiveNote((prev) => [...prev, newSticky]);
    setActivePopover(null);
  };

  // ─── Upload Document / Image onto Active Page ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onUploadFileToZytron(files);
    showToast(`${files.length} bestand(en) op Notability-blad geplaatst (Gekoppeld: ${connectedCount})`);

    Array.from(files).forEach((file, idx) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImagesForActiveNote((prev) => [
              ...prev,
              {
                id: `img-${Date.now()}-${idx}`,
                pageIndex: activePageIndex,
                x: 65 + idx * 24,
                y: 75 + idx * 24,
                width: 520,
                src: reader.result as string,
                name: file.name,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent =
            typeof reader.result === "string"
              ? reader.result.slice(0, 5000)
              : `[Document geïmporteerd: ${file.name}]`;
          updateActiveNote((n) => ({
            ...n,
            title: file.name.replace(/\.[^/.]+$/, ""),
            typedContentByPage: {
              ...n.typedContentByPage,
              [activePageIndex]:
                (n.typedContentByPage[activePageIndex]
                  ? n.typedContentByPage[activePageIndex] + "\n\n"
                  : "") + textContent,
            },
          }));
        };
        reader.readAsText(file);
      }
    });
    e.target.value = "";
    setActivePopover(null);
    setScreenMode("editor");
  };

  // ─── Paper Background CSS Generator ───
  const getPaperBackgroundStyle = (
    template: PaperTemplate,
    paperColor: PaperColor,
    spacing: GridSpacing
  ): React.CSSProperties => {
    const isDark = paperColor === "#1C1C1E";
    const lineColor = isDark ? "rgba(255,255,255,0.11)" : "#E2E8F0";
    const dotColor = isDark ? "rgba(255,255,255,0.22)" : "#CBD5E1";
    const step = spacing === "small" ? 20 : spacing === "large" ? 36 : 26;

    if (template === "grid") {
      return {
        backgroundColor: paperColor,
        backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${step}px ${step}px`,
      };
    }
    if (template === "lined") {
      return {
        backgroundColor: paperColor,
        backgroundImage: `linear-gradient(to bottom, transparent ${step - 1}px, ${lineColor} ${step - 1}px, ${lineColor} ${step}px)`,
        backgroundSize: `100% ${step}px`,
      };
    }
    if (template === "dotted") {
      return {
        backgroundColor: paperColor,
        backgroundImage: `radial-gradient(${dotColor} 1.35px, transparent 1.35px)`,
        backgroundSize: `${step}px ${step}px`,
      };
    }
    return {
      backgroundColor: paperColor,
    };
  };

  // ─── Filtered Notes for Library View ───
  const filteredLibraryNotes = notes.filter((n) => {
    const matchesSearch =
      !librarySearchQuery.trim() ||
      n.title.toLowerCase().includes(librarySearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedLibraryFilter === "all") return true;
    if (selectedLibraryFilter === "recent") return true;
    if (selectedLibraryFilter === "favorites") return n.favorite;
    return n.subjectId === selectedLibraryFilter;
  });

  // ─── Study Flashcards Data (100% Dutch) ───
  const flashcards = [
    {
      q: "Wat is de kettingregel bij differentiëren?",
      a: "Als f(x) = g(h(x)), dan is f'(x) = g'(h(x)) · h'(x).",
    },
    {
      q: "Wanneer heeft een functie f(x) een extreem (top)?",
      a: "Als f'(x) = 0 en f'(x) van teken wisselt.",
    },
    {
      q: "Wat geeft de tweede afgeleide f''(x) aan?",
      a: "De kromming van de grafiek (buigpunten bij f''(x) = 0).",
    },
  ];

  // ==========================================================================
  // VIEW A: FULL NOTABILITY iPad LIBRARY SCREEN (HOME SCREEN)
  // ==========================================================================
  if (screenMode === "library") {
    const currentSubjectObj = NOTABILITY_SUBJECTS.find((s) => s.id === selectedLibraryFilter);
    const headerTitle =
      selectedLibraryFilter === "all"
        ? "Alle notities"
        : selectedLibraryFilter === "recent"
          ? "Recent geopend"
          : selectedLibraryFilter === "favorites"
            ? "Favorieten"
            : currentSubjectObj?.name || "Alle notities";

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#F2F2F7] text-[#1C1C1E] select-none overflow-hidden font-sans">
        {/* Hidden file input for Import button */}
        <input
          ref={fileUploadInputRef}
          type="file"
          accept="image/*,.txt,.md,.csv,.json"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Main Split View: Left Subjects Sidebar + Right Notes Grid/List */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR: Authentic Notability Library Sidebar */}
          <aside className="flex w-72 shrink-0 flex-col border-r border-[#D1D1D6] bg-[#F2F2F7]">
            {/* Top Brand & Settings */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#007AFF] text-white shadow-xs">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[16px] font-extrabold tracking-tight text-[#1C1C1E]">
                    Notability
                  </span>
                  <span className="ml-1.5 rounded-md bg-[#007AFF]/12 px-1.5 py-0.5 text-[9.5px] font-bold text-[#007AFF]">
                    Plus
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreenMode("editor")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8E8E93] hover:bg-black/5 hover:text-[#1C1C1E]"
                title="Sluit bibliotheek"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Smart Filters (All Notes, Recents, Favorites, Shared, Gallery) */}
            <div className="px-3 py-1.5 space-y-0.5">
              {[
                { id: "all", label: "Alle notities", icon: FileText, count: notes.length, color: "#007AFF" },
                { id: "recent", label: "Recent", icon: Clock, count: Math.min(notes.length, 10), color: "#FF9500" },
                {
                  id: "favorites",
                  label: "Favorieten",
                  icon: Star,
                  count: notes.filter((n) => n.favorite).length,
                  color: "#FFCC00",
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = selectedLibraryFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLibraryFilter(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                      active
                        ? "bg-[#007AFF] text-white shadow-xs"
                        : "text-[#1C1C1E] hover:bg-black/[0.05]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: active ? "#FFFFFF" : item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        active ? "text-white/85" : "text-[#8E8E93]"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subjects & Dividers Header */}
            <div className="mt-3 flex items-center justify-between px-4 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Vakken &amp; Mappen
              </span>
              <button
                type="button"
                onClick={() => createNewNote("grid", "#FFFFFF")}
                className="flex h-5 w-5 items-center justify-center rounded-md text-[#007AFF] hover:bg-[#007AFF]/10"
                title="Nieuw vak of notitie"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Dividers & Subjects List */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-3">
              {["Exacte Vakken", "Talen & Maatschappij"].map((divider) => {
                const isCollapsed = !!collapsedDividers[divider];
                const divSubjects = NOTABILITY_SUBJECTS.filter((s) => s.divider === divider);
                return (
                  <div key={divider}>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedDividers((prev) => ({
                          ...prev,
                          [divider]: !prev[divider],
                        }))
                      }
                      className="flex w-full items-center justify-between px-2 py-1 text-[11.5px] font-bold text-[#6C6C70] hover:text-[#1C1C1E]"
                    >
                      <div className="flex items-center gap-1.5">
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                        <span>{divider}</span>
                      </div>
                      <span className="text-[10px] text-[#8E8E93]">{divSubjects.length}</span>
                    </button>

                    {!isCollapsed && (
                      <div className="mt-0.5 space-y-0.5 pl-1">
                        {divSubjects.map((sub) => {
                          const active = selectedLibraryFilter === sub.id;
                          const count = notes.filter((n) => n.subjectId === sub.id).length;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setSelectedLibraryFilter(sub.id)}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                                active
                                  ? "bg-white text-[#1C1C1E] shadow-xs ring-1 ring-black/[0.06]"
                                  : "text-[#3C3C43] hover:bg-black/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{ backgroundColor: sub.color }}
                                />
                                <span className="truncate">{sub.name}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-[#8E8E93]">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Stealth Controls inside Library Sidebar */}
            <div className="border-t border-[#D1D1D6] bg-[#E5E5EA]/70 p-3 space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[10.5px] font-semibold text-[#6C6C70]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#34C759]" />
                  iCloud &amp; P2P Actief ({incomingNotes.length})
                </span>
                <button
                  type="button"
                  onClick={() => setScreenMode("editor")}
                  className="font-bold text-[#007AFF] hover:underline"
                >
                  Open Editor →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href="https://zytron-phi.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#007AFF] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0062CC]"
                >
                  <Globe className="h-3 w-3" />
                  <span>Hoofd App</span>
                </a>
                <button
                  type="button"
                  onClick={onToggleNotability}
                  className="flex items-center justify-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#1C1C1E] shadow-2xs border border-black/10 hover:bg-black/5"
                >
                  <span>Zytron Share</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN AREA: Subject Header + Search + Grid/List of Note Cards */}
          <main className="flex flex-1 flex-col bg-white overflow-hidden">
            {/* Top Library Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5EA] px-6 py-4">
              <div className="flex items-center gap-3">
                {currentSubjectObj && (
                  <span
                    className="h-4 w-4 rounded-full shadow-2xs"
                    style={{ backgroundColor: currentSubjectObj.color }}
                  />
                )}
                <h1 className="text-xl font-extrabold tracking-tight text-[#1C1C1E]">
                  {headerTitle}
                </h1>
                <span className="rounded-full bg-[#F2F2F7] px-2.5 py-0.5 text-xs font-bold text-[#8E8E93]">
                  {filteredLibraryNotes.length}
                </span>
              </div>

              {/* Search + View Toggle + Import + Blue "+ Nieuw" Button */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#8E8E93]" />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    placeholder="Zoek in notities..."
                    className="w-48 rounded-xl bg-[#F2F2F7] pl-8 pr-3 py-1.5 text-xs font-medium text-[#1C1C1E] placeholder-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]/30 sm:w-60"
                  />
                </div>

                {/* Grid / List View Switcher */}
                <div className="flex items-center rounded-xl bg-[#F2F2F7] p-0.5">
                  <button
                    type="button"
                    onClick={() => setLibraryViewMode("grid")}
                    className={`rounded-lg p-1.5 transition ${
                      libraryViewMode === "grid"
                        ? "bg-white text-[#1C1C1E] shadow-2xs"
                        : "text-[#8E8E93]"
                    }`}
                    title="Rasterweergave"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryViewMode("list")}
                    className={`rounded-lg p-1.5 transition ${
                      libraryViewMode === "list"
                        ? "bg-white text-[#1C1C1E] shadow-2xs"
                        : "text-[#8E8E93]"
                    }`}
                    title="Lijstweergave"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Import Document / Photo Button */}
                <button
                  type="button"
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]"
                  title="Importeer PDF of Foto"
                >
                  <Download className="h-4 w-4" />
                </button>

                {/* Iconic Blue Notability "+ Nieuw" Split Pill Button */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => createNewNote("grid", "#FFFFFF")}
                    className="flex items-center gap-1.5 rounded-l-full bg-[#007AFF] pl-3.5 pr-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0062CC]"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Nieuw</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewNoteMenu((v) => !v)}
                    className="flex items-center justify-center rounded-r-full border-l border-white/25 bg-[#007AFF] px-2 py-1.5 text-white hover:bg-[#0062CC]"
                    title="Kies sjabloon voor nieuwe notitie"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {showNewNoteMenu && (
                    <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Nieuw met sjabloon
                      </p>
                      {[
                        { id: "grid" as PaperTemplate, label: "Ruitjespapier (Wiskunde)" },
                        { id: "lined" as PaperTemplate, label: "Gelijnd papier" },
                        { id: "dotted" as PaperTemplate, label: "Stippelraster (Bullet)" },
                        { id: "blank" as PaperTemplate, label: "Blanco vel" },
                      ].map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => createNewNote(tpl.id, "#FFFFFF")}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                        >
                          <span>{tpl.label}</span>
                          <Plus className="h-3.5 w-3.5 text-[#007AFF]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Grid or List */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F9F9FB]">
              {libraryViewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {/* Quick "+ Nieuwe Notitie" Card */}
                  <button
                    type="button"
                    onClick={() => createNewNote("grid", "#FFFFFF")}
                    className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C7C7CC] bg-white/60 p-6 text-center transition hover:border-[#007AFF] hover:bg-[#007AFF]/[0.03]"
                    style={{ minHeight: 220 }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF] transition group-hover:scale-110 group-hover:bg-[#007AFF] group-hover:text-white">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span className="mt-3 text-xs font-bold text-[#007AFF]">
                      + Nieuwe lege notitie
                    </span>
                    <span className="mt-0.5 text-[10.5px] text-[#8E8E93]">
                      Direct openen in editor
                    </span>
                  </button>

                  {filteredLibraryNotes.map((note) => {
                    const subj =
                      NOTABILITY_SUBJECTS.find((s) => s.id === note.subjectId) ||
                      NOTABILITY_SUBJECTS[0];
                    const isCurrent = note.id === activeNote.id;
                    const noteStrokeCount = (strokesByNote[note.id] || []).length;
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setActiveNoteId(note.id);
                          setActivePageIndex(0);
                          setScreenMode("editor");
                        }}
                        className={`group cursor-pointer flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md ${
                          isCurrent
                            ? "border-[#007AFF] ring-2 ring-[#007AFF]/20"
                            : "border-black/[0.08]"
                        }`}
                      >
                        {/* Miniature Paper Thumbnail Preview */}
                        <div
                          className="relative h-36 w-full border-b border-black/[0.06] p-3"
                          style={getPaperBackgroundStyle(
                            note.template,
                            note.paperColor,
                            "small"
                          )}
                        >
                          <span
                            className="inline-block rounded-md px-2 py-0.5 text-[9.5px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: subj.color }}
                          >
                            {subj.name}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotes((prev) =>
                                prev.map((n) =>
                                  n.id === note.id ? { ...n, favorite: !n.favorite } : n
                                )
                              );
                            }}
                            className="absolute right-2.5 top-2.5 rounded-full bg-white/85 p-1.5 shadow-2xs hover:bg-white"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                note.favorite
                                  ? "fill-[#FFCC00] text-[#FFCC00]"
                                  : "text-[#8E8E93]"
                              }`}
                            />
                          </button>

                          {note.typedContentByPage[0] ? (
                            <p className="mt-2 line-clamp-3 text-[10px] text-[#3C3C43]">
                              {note.typedContentByPage[0]}
                            </p>
                          ) : (
                            <p className="mt-6 text-center text-[10px] font-medium text-[#8E8E93]/70">
                              {noteStrokeCount > 0
                                ? `${noteStrokeCount} handgeschreven lijnen`
                                : "Leeg blad"}
                            </p>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="flex flex-1 flex-col justify-between p-3.5">
                          <p className="truncate text-[13px] font-bold text-[#1C1C1E]">
                            {note.title}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#8E8E93]">
                            <span>{note.updatedAt}</span>
                            <span>{note.pages.length} pag.</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5EA] rounded-2xl border border-[#E5E5EA] bg-white">
                  {filteredLibraryNotes.map((note) => {
                    const subj =
                      NOTABILITY_SUBJECTS.find((s) => s.id === note.subjectId) ||
                      NOTABILITY_SUBJECTS[0];
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setActiveNoteId(note.id);
                          setActivePageIndex(0);
                          setScreenMode("editor");
                        }}
                        className="flex cursor-pointer items-center justify-between px-4 py-3.5 hover:bg-[#F2F2F7]/60"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: subj.color }}
                          />
                          <div>
                            <p className="text-sm font-bold text-[#1C1C1E]">{note.title}</p>
                            <p className="text-xs text-[#8E8E93]">
                              {subj.name} • {note.pages.length} pagina&apos;s
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[#8E8E93]">
                          {note.updatedAt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW B: AUTHENTIC NOTABILITY 15/16 NOTE EDITOR VIEW
  // ==========================================================================
  const isDarkPaper = activeNote.paperColor === "#1C1C1E";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#E5E5EA] text-[#1C1C1E] select-none overflow-hidden font-sans">
      {/* Hidden File Input for Uploading Worksheets / Images */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="image/*,.txt,.md,.csv,.json"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* AUTHENTIC NOTABILITY TOP NAVIGATION HEADER BAR */}
      <header className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b border-[#D1D1D6] bg-[#F9F9FB]/95 px-3 backdrop-blur-xl sm:px-4">
        {/* LEFT CLUSTER: < Back to Library, Note Switcher, Undo, Redo */}
        <div className="flex items-center gap-1">
          {/* < Back to Full Notability Library */}
          <button
            type="button"
            onClick={() => setScreenMode("library")}
            className="flex items-center gap-0.5 rounded-xl px-2 py-1.5 text-[13px] font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 transition"
            title="Terug naar Notability Bibliotheek (Alle Vakken & Notities)"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.4]" />
            <span className="hidden sm:inline">Bibliotheek</span>
          </button>

          {/* Note Switcher Icon (Two overlapping rectangles) */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === "noteSwitcher" ? null : "noteSwitcher")
              }
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                activePopover === "noteSwitcher"
                  ? "bg-[#007AFF]/15 text-[#007AFF]"
                  : "text-[#3C3C43] hover:bg-black/[0.06]"
              }`}
              title="Notitie-wisselaar (Recente notities)"
            >
              <Layers className="h-4 w-4" />
            </button>

            {/* Note Switcher Popover */}
            {activePopover === "noteSwitcher" && (
              <div className="absolute left-0 top-10 z-50 w-72 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-2xl backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Recente Notities
                  </span>
                  <button
                    type="button"
                    onClick={() => createNewNote("grid", "#FFFFFF")}
                    className="text-xs font-bold text-[#007AFF] hover:underline"
                  >
                    + Nieuwe notitie
                  </button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {notes.map((n) => {
                    const subj =
                      NOTABILITY_SUBJECTS.find((s) => s.id === n.subjectId) ||
                      NOTABILITY_SUBJECTS[0];
                    const isCur = n.id === activeNote.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setActiveNoteId(n.id);
                          setActivePageIndex(0);
                          setActivePopover(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          isCur
                            ? "bg-[#007AFF]/12 text-[#007AFF]"
                            : "text-[#1C1C1E] hover:bg-[#F2F2F7]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="truncate">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-[#8E8E93]">{n.updatedAt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 h-4 w-px bg-black/10" />

          {/* Undo & Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#3C3C43] hover:bg-black/[0.06] disabled:opacity-30 transition"
            title="Ongedaan maken (Undo)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#3C3C43] hover:bg-black/[0.06] disabled:opacity-30 transition"
            title="Opnieuw uitvoeren (Redo)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* CENTER: Editable Note Title + Subject Badge */}
        <div className="flex min-w-0 items-center gap-2 px-2">
          <span
            className="hidden h-2.5 w-2.5 shrink-0 rounded-full sm:inline-block"
            style={{ backgroundColor: activeSubject.color }}
          />
          <input
            type="text"
            value={activeNote.title}
            onChange={(e) =>
              updateActiveNote((n) => ({ ...n, title: e.target.value }))
            }
            className="w-36 sm:w-56 md:w-72 truncate rounded-lg bg-transparent px-1.5 py-0.5 text-center text-[13.5px] font-bold text-[#1C1C1E] outline-none focus:bg-white focus:ring-1 focus:ring-[#007AFF]"
            aria-label="Notitietitel"
          />
        </div>

        {/* RIGHT CLUSTER: Audio Mic, Share/Export, Learn AI, Options (•••), Content Manager (Pages) */}
        <div className="flex items-center gap-1">
          {/* 1. Audio Recording / Note Replay Button */}
          <div className="flex items-center rounded-xl bg-black/[0.04] px-1 py-0.5">
            <button
              type="button"
              onClick={() => {
                setIsRecordingAudio((v) => !v);
                setShowAudioBar(true);
              }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition ${
                isRecordingAudio
                  ? "bg-[#FF3B30] text-white shadow-xs"
                  : "text-[#3C3C43] hover:bg-black/[0.06]"
              }`}
              title="Audio opnemen (Notability Note Replay)"
            >
              {isRecordingAudio ? (
                <Square className="h-3 w-3 fill-white" />
              ) : (
                <Mic className="h-4 w-4 text-[#007AFF]" />
              )}
              {(isRecordingAudio || audioSeconds > 0) && (
                <span className="font-mono text-[11px]">{formatTimer(audioSeconds)}</span>
              )}
            </button>
            {audioSeconds > 0 && (
              <button
                type="button"
                onClick={() => setShowAudioBar((v) => !v)}
                className="px-1 text-[#8E8E93] hover:text-[#1C1C1E]"
                title="Toon/verberg audiobalk"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. Share / Export Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === "share" ? null : "share")}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                activePopover === "share"
                  ? "bg-[#007AFF]/15 text-[#007AFF]"
                  : "text-[#3C3C43] hover:bg-black/[0.06]"
              }`}
              title="Deel of Exporteer Notitie"
            >
              <Share className="h-4 w-4" />
            </button>

            {activePopover === "share" && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-2xl backdrop-blur-xl">
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Deel &amp; Exporteer
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      setActivePopover(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                  >
                    <Printer className="h-4 w-4 text-[#007AFF]" />
                    <span>Exporteer als PDF / Afdrukken</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const txt = activeNote.typedContentByPage[activePageIndex] || activeNote.title;
                      onSendQuickNote(txt);
                      setActivePopover(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                  >
                    <Send className="h-4 w-4 text-[#34C759]" />
                    <span>Stuur direct via P2P naar klasgenoot</span>
                  </button>
                  <a
                    href="https://zytron-phi.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between rounded-xl bg-[#007AFF]/10 px-3 py-2 text-left text-xs font-bold text-[#007AFF] hover:bg-[#007AFF]/20"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Open Zytron Hoofd App</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={onToggleNotability}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
                  >
                    <span>Terug naar Zytron Share Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Notability Learn AI Button */}
          <button
            type="button"
            onClick={() => setRightDrawer(rightDrawer === "learn" ? null : "learn")}
            className={`relative flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
              rightDrawer === "learn"
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#007AFF] hover:bg-[#007AFF]/10"
            }`}
            title="Notability Learn (Samenvatting, Flashcards, Quiz & Chat)"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Learn</span>
            {incomingNotes.length > 0 && rightDrawer !== "learn" && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[9.5px] font-extrabold text-white">
                {incomingNotes.length}
              </span>
            )}
          </button>

          {/* 4. Options Menu (•••) — Templates, View Settings, Info */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === "options" ? null : "options")}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                activePopover === "options"
                  ? "bg-[#007AFF]/15 text-[#007AFF]"
                  : "text-[#3C3C43] hover:bg-black/[0.06]"
              }`}
              title="Notitie-opties (Sjablonen, Papierkleur & Weergave)"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>

            {/* Authentic Notability ••• Options Popover */}
            {activePopover === "options" && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-black/10 bg-white/98 p-4 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                  <span className="text-xs font-extrabold text-[#1C1C1E]">
                    Notitie-opties &amp; Sjabloon
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="rounded-full p-1 text-[#8E8E93] hover:bg-black/5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Paper Template Picker */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Papiersjabloon
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: "grid", label: "Ruitjes" },
                        { id: "lined", label: "Lijntjes" },
                        { id: "dotted", label: "Stippels" },
                        { id: "blank", label: "Blanco" },
                      ] as { id: PaperTemplate; label: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          updateActiveNote((n) => ({ ...n, template: t.id }))
                        }
                        className={`rounded-xl border py-2 text-[11px] font-bold transition ${
                          activeNote.template === t.id
                            ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                            : "border-black/10 text-[#3C3C43] hover:bg-black/5"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid / Line Spacing */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Lijnafstand
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: "small", label: "Klein" },
                        { id: "medium", label: "Normaal" },
                        { id: "large", label: "Groot" },
                      ] as { id: GridSpacing; label: string }[]
                    ).map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() =>
                          updateActiveNote((n) => ({ ...n, spacing: sp.id }))
                        }
                        className={`rounded-xl border py-1.5 text-[11px] font-bold transition ${
                          activeNote.spacing === sp.id
                            ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                            : "border-black/10 text-[#3C3C43] hover:bg-black/5"
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Color Swatches */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Papierkleur
                  </p>
                  <div className="flex items-center justify-between gap-1.5">
                    {PAPER_COLORS.map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() =>
                          updateActiveNote((n) => ({ ...n, paperColor: p.color }))
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                          activeNote.paperColor === p.color
                            ? "border-[#007AFF] scale-110 shadow-xs"
                            : "border-black/15"
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      >
                        {activeNote.paperColor === p.color && (
                          <Check
                            className={`h-4 w-4 ${
                              p.color === "#1C1C1E" ? "text-white" : "text-[#007AFF]"
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Settings: Seamless vs Single Page + Status Bar */}
                <div className="space-y-2 border-t border-black/[0.06] pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Weergave-instellingen
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("seamless")}
                      className={`rounded-xl border py-1.5 text-[11px] font-bold ${
                        viewMode === "seamless"
                          ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                          : "border-black/10 text-[#3C3C43]"
                      }`}
                    >
                      Naadloos (Verticaal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("single")}
                      className={`rounded-xl border py-1.5 text-[11px] font-bold ${
                        viewMode === "single"
                          ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                          : "border-black/10 text-[#3C3C43]"
                      }`}
                    >
                      Enkele pagina
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Content Manager (Pages / Bookmarks / Search / Transcript) Button */}
          <button
            type="button"
            onClick={() => setRightDrawer(rightDrawer === "content" ? null : "content")}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
              rightDrawer === "content"
                ? "bg-[#1C1C1E] text-white"
                : "bg-black/[0.05] text-[#1C1C1E] hover:bg-black/10"
            }`}
            title="Pagina- & Inhoudsbeheer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px]">
              {activePageIndex + 1}/{activeNote.pages.length}
            </span>
          </button>
        </div>
      </header>

      {/* 3. OPTIONAL AUDIO TIMELINE / NOTE REPLAY BAR */}
      {showAudioBar && (
        <div className="z-30 flex h-10 shrink-0 items-center justify-between border-b border-[#D1D1D6] bg-white px-4 text-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPlayingAudio((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF] text-white"
            >
              {isPlayingAudio ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <span className="font-mono text-[11px] font-bold text-[#1C1C1E]">
              {formatTimer(audioSeconds)}
            </span>
            <span className="text-[11px] text-[#8E8E93]">Notability Audio Replay</span>
          </div>

          {/* Simulated Waveform Bars */}
          <div className="hidden flex-1 items-center justify-center gap-1 px-6 sm:flex">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all ${
                  i < (audioSeconds % 36) ? "bg-[#007AFF]" : "bg-[#D1D1D6]"
                }`}
                style={{ height: `${8 + ((i * 7) % 16)}px` }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAudioBar(false)}
            className="rounded-lg p-1 text-[#8E8E93] hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4. OPTIONAL TEXT FORMATTING RIBBON (When Text Tool 'T' is active) */}
      {activeTool === "text" && (
        <div className="z-30 flex h-10 shrink-0 items-center justify-center gap-2 border-b border-[#D1D1D6] bg-white/95 px-4 text-xs backdrop-blur-md">
          <span className="text-[11px] font-bold text-[#8E8E93]">SF Pro Text</span>
          <div className="h-4 w-px bg-black/10" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              className="rounded-lg px-2 py-0.5 font-bold hover:bg-black/5"
            >
              A−
            </button>
            <span className="font-mono text-[11px] font-bold">{fontSize}pt</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
              className="rounded-lg px-2 py-0.5 font-bold hover:bg-black/5"
            >
              A+
            </button>
          </div>
          <div className="h-4 w-px bg-black/10" />
          <button
            type="button"
            onClick={() => setFontBold((v) => !v)}
            className={`rounded-lg p-1.5 ${fontBold ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFontItalic((v) => !v)}
            className={`rounded-lg p-1.5 ${fontItalic ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFontUnderline((v) => !v)}
            className={`rounded-lg p-1.5 ${fontUnderline ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-black/10" />
          <button
            type="button"
            onClick={() => setTextAlign("left")}
            className={`rounded-lg p-1.5 ${textAlign === "left" ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign("center")}
            className={`rounded-lg p-1.5 ${textAlign === "center" ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign("right")}
            className={`rounded-lg p-1.5 ${textAlign === "right" ? "bg-[#007AFF]/15 text-[#007AFF]" : "hover:bg-black/5"}`}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-black/10" />
          <button
            type="button"
            onClick={() =>
              updateActiveNote((n) => ({
                ...n,
                typedContentByPage: {
                  ...n.typedContentByPage,
                  [activePageIndex]:
                    (n.typedContentByPage[activePageIndex] || "") + "\n☐ ",
                },
              }))
            }
            className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[#007AFF] hover:bg-[#007AFF]/10"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Checklist</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          5. MAIN WORKSPACE: FLOATING TOOLBOX + PAPER CANVAS + RIGHT DRAWER
         ==================================================================== */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* AUTHENTIC NOTABILITY 15 FLOATING TOOLBOX (PENCIL CASE) */}
        <div
          className={`z-30 flex items-center gap-1 rounded-[22px] border border-black/[0.09] bg-white/95 p-1.5 shadow-[0_10px_32px_rgba(0,0,0,0.14)] backdrop-blur-2xl transition-all ${
            toolboxDock === "top"
              ? "absolute left-1/2 top-3 -translate-x-1/2 flex-row"
              : toolboxDock === "bottom"
                ? "absolute bottom-4 left-1/2 -translate-x-1/2 flex-row"
                : "absolute left-3 top-1/2 -translate-y-1/2 flex-col"
          }`}
        >
          {/* Drag / Dock Position Handle */}
          <button
            type="button"
            onClick={() =>
              setToolboxDock((d) =>
                d === "top" ? "left" : d === "left" ? "bottom" : "top"
              )
            }
            className="flex h-8 w-5 items-center justify-center rounded-lg text-[#C7C7CC] hover:bg-black/5 hover:text-[#8E8E93]"
            title="Verplaats Notability Toolbox (Boven / Links / Onder)"
          >
            <span className="text-[11px] font-bold leading-none">⋮⋮</span>
          </button>

          {/* 1. PEN TOOL (Realistic Apple Pencil Nib SVG) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activeTool === "pen") {
                  setActivePopover(activePopover === "pen" ? null : "pen");
                } else {
                  setActiveTool("pen");
                  setActivePopover(null);
                }
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                activeTool === "pen"
                  ? "bg-[#007AFF]/12 ring-1.5 ring-[#007AFF] -translate-y-0.5"
                  : "hover:bg-black/[0.05]"
              }`}
              title="Pen (Tik nogmaals voor dikte, lijnstijl & kleur)"
            >
              <svg viewBox="0 0 28 36" className="h-7 w-6">
                <path d="M9 34L10 14L14 4L18 14L19 34Z" fill="#F2F2F7" stroke="#8E8E93" strokeWidth="1.3" />
                <path d="M12.2 8.5L14 4L15.8 8.5Z" fill={penColor} />
                <rect x="9.5" y="15" width="9" height="4" rx="1" fill={penColor} />
              </svg>
            </button>

            {/* Pen Tray Popover */}
            {activePopover === "pen" && (
              <div className="absolute left-1/2 top-13 z-50 w-68 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/98 p-3.5 shadow-2xl backdrop-blur-xl">
                {/* Stroke Style: Solid / Dashed / Dotted */}
                <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl bg-[#F2F2F7] p-1">
                  {(
                    [
                      { id: "solid", label: "Massief" },
                      { id: "dashed", label: "Streepjes" },
                      { id: "dotted", label: "Stippels" },
                    ] as { id: PenStyle; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPenStyle(st.id)}
                      className={`rounded-lg py-1 text-[10.5px] font-bold ${
                        penStyle === st.id
                          ? "bg-white text-[#007AFF] shadow-2xs"
                          : "text-[#6C6C70]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* 5 Stroke Weights */}
                <div className="mb-3 flex items-center justify-between rounded-xl bg-[#F2F2F7] px-3 py-2">
                  {[1.5, 2.5, 4, 6, 9].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenWidth(w)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        penWidth === w ? "bg-white ring-2 ring-[#007AFF] shadow-2xs" : ""
                      }`}
                    >
                      <span
                        className="rounded-full bg-[#1C1C1E]"
                        style={{ width: w + 3, height: w + 3 }}
                      />
                    </button>
                  ))}
                </div>

                {/* 16 Color Swatches */}
                <div className="grid grid-cols-8 gap-1.5">
                  {NOTABILITY_INK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setPenColor(c);
                        setActivePopover(null);
                      }}
                      className={`h-6 w-6 rounded-full border transition-transform ${
                        penColor === c ? "scale-115 ring-2 ring-[#007AFF]" : "border-black/15"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. PENCIL TOOL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activeTool === "pencil") {
                  setActivePopover(activePopover === "pencil" ? null : "pencil");
                } else {
                  setActiveTool("pencil");
                  setActivePopover(null);
                }
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                activeTool === "pencil"
                  ? "bg-[#007AFF]/12 ring-1.5 ring-[#007AFF] -translate-y-0.5"
                  : "hover:bg-black/[0.05]"
              }`}
              title="Potlood"
            >
              <svg viewBox="0 0 28 36" className="h-7 w-6">
                <path d="M9.5 34L10.5 15L14 4.5L17.5 15L18.5 34Z" fill="#F9F9FB" stroke="#8E8E93" strokeWidth="1.3" />
                <path d="M12.2 9.5L14 4.5L15.8 9.5Z" fill={pencilColor} />
                <rect x="10" y="16" width="8" height="3" fill={pencilColor} opacity="0.65" />
              </svg>
            </button>

            {activePopover === "pencil" && (
              <div className="absolute left-1/2 top-13 z-50 w-60 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-2xl">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Potloodkleur
                </p>
                <div className="grid grid-cols-8 gap-1.5">
                  {NOTABILITY_INK_COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setPencilColor(c);
                        setActivePopover(null);
                      }}
                      className={`h-6 w-6 rounded-full border ${
                        pencilColor === c ? "ring-2 ring-[#007AFF]" : "border-black/15"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. HIGHLIGHTER TOOL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activeTool === "highlighter") {
                  setActivePopover(activePopover === "highlighter" ? null : "highlighter");
                } else {
                  setActiveTool("highlighter");
                  setActivePopover(null);
                }
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                activeTool === "highlighter"
                  ? "bg-[#007AFF]/12 ring-1.5 ring-[#007AFF] -translate-y-0.5"
                  : "hover:bg-black/[0.05]"
              }`}
              title="Markeerstift"
            >
              <svg viewBox="0 0 28 36" className="h-7 w-6">
                <path d="M7.5 34L8.5 14L19.5 14L20.5 34Z" fill="#F2F2F7" stroke="#8E8E93" strokeWidth="1.3" />
                <polygon points="9.5,14 11,5 18,7.5 18.5,14" fill={highlighterColor} opacity="0.88" />
                <rect x="8.2" y="16" width="11.6" height="4.5" rx="1" fill={highlighterColor} />
              </svg>
            </button>

            {activePopover === "highlighter" && (
              <div className="absolute left-1/2 top-13 z-50 w-60 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-2xl">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Markeerkleur
                </p>
                <div className="flex items-center justify-between gap-1.5">
                  {["#FFCC00", "#34C759", "#5AC8FA", "#FF2D55", "#AF52DE", "#FF9500"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setHighlighterColor(c);
                          setActivePopover(null);
                        }}
                        className={`h-7 w-7 rounded-full border ${
                          highlighterColor === c ? "ring-2 ring-[#007AFF] scale-110" : "border-black/10"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. ERASER TOOL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activeTool === "eraser") {
                  setActivePopover(activePopover === "eraser" ? null : "eraser");
                } else {
                  setActiveTool("eraser");
                  setActivePopover(null);
                }
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                activeTool === "eraser"
                  ? "bg-[#007AFF]/12 ring-1.5 ring-[#007AFF] -translate-y-0.5"
                  : "hover:bg-black/[0.05]"
              }`}
              title="Gum (Hele lijn of Gedeeltelijk)"
            >
              <svg viewBox="0 0 28 36" className="h-7 w-6">
                <rect x="8" y="13" width="12" height="21" rx="2" fill="#F2F2F7" stroke="#8E8E93" strokeWidth="1.3" />
                <path d="M8 15V9C8 6.8 9.8 5 12 5H16C18.2 5 20 6.8 20 9V15Z" fill="#FF959E" stroke="#8E8E93" strokeWidth="1.3" />
              </svg>
            </button>

            {activePopover === "eraser" && (
              <div className="absolute left-1/2 top-13 z-50 w-56 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/98 p-3 shadow-2xl space-y-2.5">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F2F2F7] p-1">
                  <button
                    type="button"
                    onClick={() => setEraserMode("whole")}
                    className={`rounded-lg py-1 text-[11px] font-bold ${
                      eraserMode === "whole" ? "bg-white text-[#007AFF] shadow-2xs" : "text-[#6C6C70]"
                    }`}
                  >
                    Hele lijn
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserMode("partial")}
                    className={`rounded-lg py-1 text-[11px] font-bold ${
                      eraserMode === "partial" ? "bg-white text-[#007AFF] shadow-2xs" : "text-[#6C6C70]"
                    }`}
                  >
                    Gedeeltelijk
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStrokesForActiveNote((prev) =>
                      prev.filter((s) => s.pageIndex !== activePageIndex)
                    );
                    setActivePopover(null);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FF3B30]/10 py-2 text-xs font-bold text-[#FF3B30] hover:bg-[#FF3B30]/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Pagina inkt wissen</span>
                </button>
              </div>
            )}
          </div>

          <div className="mx-0.5 h-5 w-px bg-black/10" />

          {/* 5. LASSO TOOL */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("lasso");
              setActivePopover(null);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              activeTool === "lasso"
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Lasso Selectie"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
              <ellipse cx="12" cy="11" rx="8" ry="6" />
              <path d="M8 16.5C8 19 6 20.5 4 20.5" strokeDasharray="none" />
            </svg>
          </button>

          {/* 6. TEXT BOX TOOL (T) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("text");
              setActivePopover(null);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-serif text-[15px] font-bold transition ${
              activeTool === "text"
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Tekstvak (T)"
          >
            T
          </button>

          {/* 7. LASER POINTER */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("laser");
              setActivePopover(null);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              activeTool === "laser"
                ? "bg-[#FF3B30] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Laser Pointer"
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-current">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          </button>

          {/* 8. STUDY TAPE (Studiestrook) */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("tape");
              setActivePopover(null);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              activeTool === "tape"
                ? "bg-[#FF9500] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Studiestrook (Tape om antwoorden af te dekken en met 1 tik te onthullen)"
          >
            <span className="rounded border border-current px-1 py-0.5 text-[9px] font-extrabold">
              TAPE
            </span>
          </button>

          {/* 9. RULER (Liniaal) */}
          <button
            type="button"
            onClick={() => setShowRuler((v) => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              showRuler
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Liniaal tonen/verbergen"
          >
            <Sliders className="h-4 w-4 rotate-45" />
          </button>

          {/* 10. ZOOM LOUPE (Magnifier) */}
          <button
            type="button"
            onClick={() => setShowZoomLoupe((v) => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              showZoomLoupe
                ? "bg-[#007AFF] text-white shadow-xs"
                : "text-[#3C3C43] hover:bg-black/[0.05]"
            }`}
            title="Zoom-loep venster"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="mx-0.5 h-5 w-px bg-black/10" />

          {/* 11. + INSERT MEDIA (Photos, PDF/Doc, Sticky Note, Formula) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === "insert" ? null : "insert")}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                activePopover === "insert"
                  ? "bg-[#007AFF] text-white shadow-xs"
                  : "bg-[#007AFF]/12 text-[#007AFF] hover:bg-[#007AFF]/20"
              }`}
              title="Invoegen (+ Media, Document, Sticky Note)"
            >
              <Plus className="h-5 w-5 stroke-[2.4]" />
            </button>

            {activePopover === "insert" && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-black/10 bg-white/98 p-2.5 shadow-2xl backdrop-blur-xl space-y-1">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Media &amp; Inhoud Invoegen
                </p>
                <button
                  type="button"
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                >
                  <ImageIcon className="h-4 w-4 text-[#007AFF]" />
                  <span>Foto of Werkblad uploaden</span>
                </button>
                <button
                  type="button"
                  onClick={() => addStickyNote("#FFF9C4", "lined")}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                >
                  <FileText className="h-4 w-4 text-[#FF9500]" />
                  <span>Sticky Note (Geel gelijnd)</span>
                </button>
                <button
                  type="button"
                  onClick={() => addStickyNote("#E0F2FE", "grid")}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                >
                  <Grid className="h-4 w-4 text-[#5AC8FA]" />
                  <span>Sticky Note (Ruitjes)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateActiveNote((n) => ({
                      ...n,
                      typedContentByPage: {
                        ...n.typedContentByPage,
                        [activePageIndex]:
                          (n.typedContentByPage[activePageIndex] || "") +
                          "\nf(x) = ∫ (3x² − 4x + 1) dx = x³ − 2x² + x + C\n",
                      },
                    }));
                    setActiveTool("text");
                    setActivePopover(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
                >
                  <span className="flex h-4 w-4 items-center justify-center font-serif font-bold text-[#5856D6]">
                    ∑
                  </span>
                  <span>Wiskunde Formule invoegen</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================
            6. SCROLLABLE PAPER CANVAS AREA (100% CLEAN BLANK SHEET BY DEFAULT)
           ================================================================== */}
        <div
          className="relative flex-1 overflow-y-auto px-3 pt-16 pb-20 sm:px-8"
          onPointerMove={(e) => {
            if (!draggingObject) return;
            if (draggingObject.type === "sticky") {
              setStickyNotesForActiveNote((prev) =>
                prev.map((st) =>
                  st.id === draggingObject.id
                    ? {
                        ...st,
                        x: Math.max(10, e.clientX - draggingObject.offsetX),
                        y: Math.max(10, e.clientY - draggingObject.offsetY),
                      }
                    : st
                )
              );
            } else if (draggingObject.type === "image") {
              setImagesForActiveNote((prev) =>
                prev.map((im) =>
                  im.id === draggingObject.id
                    ? {
                        ...im,
                        x: Math.max(10, e.clientX - draggingObject.offsetX),
                        y: Math.max(10, e.clientY - draggingObject.offsetY),
                      }
                    : im
                )
              );
            } else if (draggingObject.type === "ruler") {
              setRulerPos((prev) => ({
                ...prev,
                x: e.clientX - draggingObject.offsetX,
                y: e.clientY - draggingObject.offsetY,
              }));
            }
          }}
          onPointerUp={() => setDraggingObject(null)}
        >
          <div
            className="mx-auto flex flex-col items-center gap-6 transition-transform origin-top"
            style={{
              maxWidth: 820,
              transform: `scale(${zoomPercent / 100})`,
            }}
          >
            {(viewMode === "single"
              ? [activeNote.pages[activePageIndex] || 1]
              : activeNote.pages
            ).map((pageNum, idx) => {
              const pageIdx = viewMode === "single" ? activePageIndex : idx;
              const pageTypedText = activeNote.typedContentByPage[pageIdx] || "";
              const pageStickies = stickyNotes.filter((s) => s.pageIndex === pageIdx);
              const pageImages = uploadedImages.filter((im) => im.pageIndex === pageIdx);
              const isBookmarked = activeNote.bookmarkedPages.includes(pageIdx);

              return (
                <div
                  key={`page-${pageIdx}`}
                  onClick={() => setActivePageIndex(pageIdx)}
                  className={`relative w-full rounded-[6px] shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-shadow ${
                    activePageIndex === pageIdx
                      ? "ring-1 ring-[#007AFF]/45"
                      : "ring-1 ring-black/10"
                  }`}
                  style={{
                    minHeight: 1020,
                    ...getPaperBackgroundStyle(
                      activeNote.template,
                      activeNote.paperColor,
                      activeNote.spacing
                    ),
                  }}
                >
                  {/* Red Margin Line when Lined Paper is active */}
                  {activeNote.template === "lined" && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute bottom-0 top-0 left-16 w-px bg-[#FF3B30]/35"
                    />
                  )}

                  {/* Top-Right Page Bookmark Ribbon & Page Number */}
                  <div className="absolute right-4 top-3 z-20 flex items-center gap-2">
                    <span
                      className={`font-mono text-[10.5px] font-semibold ${
                        isDarkPaper ? "text-white/45" : "text-[#8E8E93]"
                      }`}
                    >
                      Pagina {pageIdx + 1} van {activeNote.pages.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActiveNote((n) => ({
                          ...n,
                          bookmarkedPages: n.bookmarkedPages.includes(pageIdx)
                            ? n.bookmarkedPages.filter((p) => p !== pageIdx)
                            : [...n.bookmarkedPages, pageIdx],
                        }));
                      }}
                      className="rounded-md p-1 hover:bg-black/5"
                      title="Bladwijzer op deze pagina"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          isBookmarked
                            ? "fill-[#FF3B30] text-[#FF3B30]"
                            : isDarkPaper
                              ? "text-white/35"
                              : "text-[#C7C7CC]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Page 1 Authentic Notability Date & Subject Header */}
                  {pageIdx === 0 && (
                    <div className="px-10 pt-7 pb-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8E8E93]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: activeSubject.color }}
                        />
                        <span>{activeSubject.name}</span>
                        <span>•</span>
                        <span>{activeNote.createdAt}</span>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Images / Worksheets Layer */}
                  {pageImages.map((img) => (
                    <div
                      key={img.id}
                      style={{ left: img.x, top: img.y, width: img.width }}
                      className="group absolute z-10 rounded-lg border border-black/15 bg-white p-1.5 shadow-lg"
                    >
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDraggingObject({
                            type: "image",
                            id: img.id,
                            offsetX: e.clientX - img.x,
                            offsetY: e.clientY - img.y,
                          });
                        }}
                        className="flex cursor-move items-center justify-between border-b border-black/10 px-2 py-1 text-[10px] font-bold text-[#8E8E93]"
                      >
                        <span className="truncate max-w-[180px]">{img.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setImagesForActiveNote((prev) =>
                                prev.map((im) =>
                                  im.id === img.id
                                    ? { ...im, width: Math.max(200, im.width - 70) }
                                    : im
                                )
                              )
                            }
                            className="rounded bg-[#F2F2F7] px-1.5 py-0.5 text-[#1C1C1E]"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImagesForActiveNote((prev) =>
                                prev.map((im) =>
                                  im.id === img.id
                                    ? { ...im, width: Math.min(740, im.width + 70) }
                                    : im
                                )
                              )
                            }
                            className="rounded bg-[#F2F2F7] px-1.5 py-0.5 text-[#1C1C1E]"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImagesForActiveNote((prev) =>
                                prev.filter((im) => im.id !== img.id)
                              )
                            }
                            className="rounded bg-[#FF3B30]/15 px-1.5 py-0.5 text-[#FF3B30]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <img
                        src={img.src}
                        alt={img.name}
                        className="w-full rounded select-none pointer-events-none"
                      />
                    </div>
                  ))}

                  {/* Sticky Notes Layer */}
                  {pageStickies.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        left: st.x,
                        top: st.y,
                        width: st.width,
                        height: st.height,
                        backgroundColor: st.color,
                      }}
                      className="absolute z-20 flex flex-col rounded-xl border border-black/15 shadow-lg overflow-hidden"
                    >
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDraggingObject({
                            type: "sticky",
                            id: st.id,
                            offsetX: e.clientX - st.x,
                            offsetY: e.clientY - st.y,
                          });
                        }}
                        className="flex cursor-move items-center justify-between border-b border-black/10 bg-black/[0.04] px-2.5 py-1"
                      >
                        <div className="flex items-center gap-1">
                          {(
                            ["#FFF9C4", "#FFE4E6", "#E0F2FE", "#DCFCE7"] as StickyNoteItem["color"][]
                          ).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() =>
                                setStickyNotesForActiveNote((prev) =>
                                  prev.map((item) =>
                                    item.id === st.id ? { ...item, color: col } : item
                                  )
                                )
                              }
                              className="h-3 w-3 rounded-full border border-black/20"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setStickyNotesForActiveNote((prev) =>
                              prev.filter((item) => item.id !== st.id)
                            )
                          }
                          className="text-xs font-bold text-black/45 hover:text-[#FF3B30]"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        value={st.text}
                        onChange={(e) =>
                          setStickyNotesForActiveNote((prev) =>
                            prev.map((item) =>
                              item.id === st.id ? { ...item, text: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Notitie..."
                        className="flex-1 resize-none bg-transparent p-2.5 text-xs font-medium text-[#1C1C1E] outline-none"
                      />
                    </div>
                  ))}

                  {/* Typed Text Layer */}
                  <textarea
                    value={pageTypedText}
                    onChange={(e) =>
                      updateActiveNote((n) => ({
                        ...n,
                        typedContentByPage: {
                          ...n.typedContentByPage,
                          [pageIdx]: e.target.value,
                        },
                      }))
                    }
                    placeholder={
                      activeTool === "text"
                        ? "Tik hier om te typen op het blad..."
                        : ""
                    }
                    style={{
                      fontSize: `${fontSize}px`,
                      fontWeight: fontBold ? 700 : 400,
                      fontStyle: fontItalic ? "italic" : "normal",
                      textDecoration: fontUnderline ? "underline" : "none",
                      textAlign,
                      color: isDarkPaper ? "#F2F2F7" : "#1C1C1E",
                      pointerEvents: activeTool === "text" ? "auto" : "none",
                    }}
                    className="relative z-10 min-h-[920px] w-full resize-none bg-transparent px-10 py-4 leading-[26px] outline-none"
                  />

                  {/* Interactive Ink & Highlighter & Study Tape Canvas */}
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[pageIdx] = el;
                    }}
                    width={820}
                    height={1020}
                    onPointerDown={(e) => handleCanvasPointerDown(e, pageIdx)}
                    onPointerMove={(e) => handleCanvasPointerMove(e, pageIdx)}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerCancel={handleCanvasPointerUp}
                    style={{
                      pointerEvents:
                        activeTool === "text" || activeTool === "hand" ? "none" : "auto",
                      touchAction:
                        activeTool === "text" || activeTool === "hand" ? "auto" : "none",
                    }}
                    className="absolute inset-0 z-15 h-full w-full cursor-crosshair"
                  />
                </div>
              );
            })}

            {/* "+ Pagina toevoegen" button at bottom of sheet */}
            <button
              type="button"
              onClick={() => {
                updateActiveNote((n) => ({
                  ...n,
                  pages: [...n.pages, n.pages.length + 1],
                }));
                setActivePageIndex(activeNote.pages.length);
              }}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-xs font-bold text-[#007AFF] shadow-sm hover:bg-[#F2F2F7]"
            >
              <Plus className="h-4 w-4" />
              <span>Pagina toevoegen</span>
            </button>
          </div>

          {/* Interactive Rotatable Notability Ruler */}
          {showRuler && (
            <div
              onPointerDown={(e) =>
                setDraggingObject({
                  type: "ruler",
                  id: "ruler",
                  offsetX: e.clientX - rulerPos.x,
                  offsetY: e.clientY - rulerPos.y,
                })
              }
              style={{
                left: rulerPos.x,
                top: rulerPos.y,
                transform: `rotate(${rulerPos.angle}deg)`,
              }}
              className="fixed z-40 flex h-14 w-[440px] cursor-move items-center justify-between rounded-xl border border-black/20 bg-white/80 px-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setRulerPos((r) => ({ ...r, angle: r.angle - 15 }))
                  }
                  className="rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold"
                >
                  −15°
                </button>
                <span className="font-mono text-xs font-bold text-[#007AFF]">
                  {rulerPos.angle}°
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRulerPos((r) => ({ ...r, angle: r.angle + 15 }))
                  }
                  className="rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold"
                >
                  +15°
                </button>
              </div>
              <div className="flex flex-1 justify-between px-4 font-mono text-[9px] text-[#8E8E93]">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cm) => (
                  <span key={cm}>|{cm}</span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowRuler(false)}
                className="text-xs font-bold text-[#8E8E93] hover:text-[#FF3B30]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Notability Zoom Loupe Window at bottom */}
          {showZoomLoupe && (
            <div className="fixed bottom-4 left-1/2 z-40 flex w-[92%] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border-2 border-[#007AFF] bg-white shadow-2xl">
              <div className="flex items-center justify-between bg-[#007AFF] px-3.5 py-1.5 text-xs font-bold text-white">
                <span>Notability Zoom-loep (200% Precisie)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomPercent((z) => Math.max(75, z - 15))}
                    className="rounded bg-white/20 px-2 py-0.5 text-[11px]"
                  >
                    −
                  </button>
                  <span className="font-mono text-[11px]">{zoomPercent}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomPercent((z) => Math.min(175, z + 15))}
                    className="rounded bg-white/20 px-2 py-0.5 text-[11px]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowZoomLoupe(false)}
                    className="ml-2 rounded bg-white/20 px-1.5 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div
                className="h-28 w-full p-3"
                style={getPaperBackgroundStyle(activeNote.template, activeNote.paperColor, "large")}
              >
                <input
                  type="text"
                  value={activeNote.typedContentByPage[activePageIndex] || ""}
                  onChange={(e) =>
                    updateActiveNote((n) => ({
                      ...n,
                      typedContentByPage: {
                        ...n.typedContentByPage,
                        [activePageIndex]: e.target.value,
                      },
                    }))
                  }
                  placeholder="Schrijf of typ met grote precisie..."
                  className="h-full w-full bg-transparent text-lg font-medium text-[#1C1C1E] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================
            7. RIGHT DRAWER A: NOTABILITY LEARN PANEL (Samenvatting, Flashcards, Quiz, Chat)
           ================================================================== */}
        {rightDrawer === "learn" && (
          <aside className="z-30 flex w-84 shrink-0 flex-col border-l border-[#D1D1D6] bg-[#F9F9FB]">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#007AFF]" />
                <span className="text-sm font-extrabold text-[#1C1C1E]">Notability Learn</span>
              </div>
              <button
                type="button"
                onClick={() => setRightDrawer(null)}
                className="rounded-lg p-1 text-[#8E8E93] hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 4 Real Notability Learn Tabs */}
            <div className="grid grid-cols-4 gap-1 border-b border-[#E5E5EA] bg-[#F2F2F7] p-1.5 text-[11px] font-bold">
              {[
                { id: "summary", label: "Samenvat." },
                { id: "flashcards", label: "Kaarten" },
                { id: "quiz", label: "Quiz" },
                { id: "chat", label: `Chat (${incomingNotes.length})` },
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setLearnTab(tb.id as typeof learnTab)}
                  className={`rounded-lg py-1.5 transition ${
                    learnTab === tb.id
                      ? "bg-white text-[#007AFF] shadow-2xs"
                      : "text-[#6C6C70]"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {learnTab === "summary" && (
                <>
                  <div className="rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                      Kernbegrippen • {activeSubject.name}
                    </span>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#3C3C43]">
                      Automatische AI-analyse van <strong>{activeNote.title}</strong>. Gebruik de
                      Studiestrook (Tape) om formules af te dekken tijdens het oefenen.
                    </p>
                  </div>

                  {/* Incoming P2P Answers disguised as AI Smart Notes */}
                  <div className="space-y-2">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Binnengekomen Studie-notities ({incomingNotes.length})
                    </p>
                    {incomingNotes.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#C7C7CC] bg-white/60 p-4 text-center text-xs text-[#8E8E93]">
                        Nog geen berichten ontvangen. Zodra iemand iets stuurt via Zytron Share,
                        verschijnt het direct hier.
                      </div>
                    ) : (
                      incomingNotes.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-2xl border border-[#007AFF]/25 bg-white p-3 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10.5px] font-bold text-[#007AFF]">
                            <span>Bron: {msg.sender}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateActiveNote((n) => ({
                                  ...n,
                                  typedContentByPage: {
                                    ...n.typedContentByPage,
                                    [activePageIndex]:
                                      (n.typedContentByPage[activePageIndex]
                                        ? n.typedContentByPage[activePageIndex] + "\n"
                                        : "") + msg.text,
                                  },
                                }))
                              }
                              className="rounded-md bg-[#007AFF]/10 px-2 py-0.5 text-[10px] hover:bg-[#007AFF]/20"
                            >
                              + Plak op blad
                            </button>
                          </div>
                          <p className="text-xs text-[#1C1C1E] whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {learnTab === "flashcards" && (
                <div className="space-y-3">
                  <div
                    onClick={() => setFlashcardFlipped((f) => !f)}
                    className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm transition hover:border-[#007AFF]"
                  >
                    <span className="mb-2 rounded-full bg-[#007AFF]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#007AFF]">
                      {flashcardFlipped ? "Antwoord" : `Kaart ${flashcardIndex + 1} van ${flashcards.length}`}
                    </span>
                    <p className="text-sm font-bold text-[#1C1C1E]">
                      {flashcardFlipped
                        ? flashcards[flashcardIndex].a
                        : flashcards[flashcardIndex].q}
                    </p>
                    <span className="mt-4 text-[10.5px] text-[#8E8E93]">
                      Tik om kaart om te draaien
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
                      }}
                      className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-2xs"
                    >
                      ← Vorige
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex((i) => (i + 1) % flashcards.length);
                      }}
                      className="rounded-xl bg-[#007AFF] px-3 py-1.5 text-xs font-bold text-white shadow-2xs"
                    >
                      Volgende →
                    </button>
                  </div>
                </div>
              )}

              {learnTab === "quiz" && (
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                    Oefenvraag • {activeSubject.name}
                  </span>
                  <p className="text-xs font-bold text-[#1C1C1E]">
                    Wat is de afgeleide van f(x) = 3x² − 5x + 2?
                  </p>
                  <div className="space-y-1.5">
                    {["f'(x) = 6x − 5", "f'(x) = 3x − 5", "f'(x) = 6x² − 5"].map((opt, idx) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedQuizAnswer(idx)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                          selectedQuizAnswer === idx
                            ? idx === 0
                              ? "border-[#34C759] bg-[#34C759]/10 text-[#1C1C1E]"
                              : "border-[#FF3B30] bg-[#FF3B30]/10 text-[#1C1C1E]"
                            : "border-black/10 hover:bg-[#F2F2F7]"
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedQuizAnswer === idx && (
                          <span className="font-bold">{idx === 0 ? "✓ Juist" : "✕"}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {learnTab === "chat" && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-[11px] font-medium text-[#6C6C70]">
                    Stel een vraag aan je notitie of stuur direct een bericht naar verbonden toestellen:
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={stealthInputText}
                      onChange={(e) => setStealthInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && stealthInputText.trim()) {
                          onSendQuickNote(stealthInputText.trim());
                          setStealthInputText("");
                        }
                      }}
                      placeholder="Vraag aan Notability Learn..."
                      className="flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-[#007AFF]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!stealthInputText.trim()) return;
                        onSendQuickNote(stealthInputText.trim());
                        setStealthInputText("");
                      }}
                      className="rounded-xl bg-[#007AFF] px-3 py-2 text-xs font-bold text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ==================================================================
            8. RIGHT DRAWER B: AUTHENTIC NOTABILITY CONTENT MANAGER (Pages, Bookmarks, Search, Transcript)
           ================================================================== */}
        {rightDrawer === "content" && (
          <aside className="z-30 flex w-72 shrink-0 flex-col border-l border-[#D1D1D6] bg-[#F2F2F7]">
            {/* 4 Icon Tabs at Top of Content Manager */}
            <div className="flex items-center justify-between border-b border-[#D1D1D6] bg-white px-3 py-2">
              <div className="flex items-center gap-1">
                {[
                  { id: "pages", icon: Grid, title: "Pagina's" },
                  { id: "bookmarks", icon: Bookmark, title: "Bladwijzers" },
                  { id: "search", icon: Search, title: "Zoeken" },
                  { id: "transcript", icon: MessageSquare, title: "Transcript & P2P" },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setContentTab(t.id as typeof contentTab)}
                      className={`rounded-lg p-1.5 transition ${
                        contentTab === t.id
                          ? "bg-[#007AFF]/15 text-[#007AFF]"
                          : "text-[#8E8E93] hover:bg-black/5"
                      }`}
                      title={t.title}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setRightDrawer(null)}
                className="rounded-lg p-1 text-[#8E8E93] hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {contentTab === "pages" && (
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Pagina&apos;s ({activeNote.pages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveNote((n) => ({
                          ...n,
                          pages: [...n.pages, n.pages.length + 1],
                        }))
                      }
                      className="text-xs font-bold text-[#007AFF]"
                    >
                      + Nieuwe pagina
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {activeNote.pages.map((_, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePageIndex(idx)}
                        className={`cursor-pointer rounded-xl border bg-white p-2 transition ${
                          activePageIndex === idx
                            ? "border-[#007AFF] ring-2 ring-[#007AFF]/25"
                            : "border-black/10"
                        }`}
                      >
                        <div
                          className="h-28 w-full rounded border border-black/[0.06]"
                          style={getPaperBackgroundStyle(
                            activeNote.template,
                            activeNote.paperColor,
                            "small"
                          )}
                        />
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold">
                          <span>Pag. {idx + 1}</span>
                          {activeNote.pages.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateActiveNote((n) => ({
                                  ...n,
                                  pages: n.pages.filter((__, pIdx) => pIdx !== idx),
                                }));
                                setActivePageIndex(0);
                              }}
                              className="text-[#8E8E93] hover:text-[#FF3B30]"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {contentTab === "bookmarks" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Bladwijzers ({activeNote.bookmarkedPages.length})
                  </p>
                  {activeNote.bookmarkedPages.length === 0 ? (
                    <p className="text-xs text-[#8E8E93]">
                      Tik rechtsboven op een pagina op het lintje om een bladwijzer toe te voegen.
                    </p>
                  ) : (
                    activeNote.bookmarkedPages.map((pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setActivePageIndex(pIdx)}
                        className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#1C1C1E] shadow-2xs"
                      >
                        <span>Pagina {pIdx + 1}</span>
                        <Bookmark className="h-3.5 w-3.5 fill-[#FF3B30] text-[#FF3B30]" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {contentTab === "search" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={searchInNoteQuery}
                    onChange={(e) => setSearchInNoteQuery(e.target.value)}
                    placeholder="Zoek woord in deze notitie..."
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#007AFF]"
                  />
                  {searchInNoteQuery.trim() &&
                    Object.entries(activeNote.typedContentByPage).map(([pIdx, txt]) =>
                      txt.toLowerCase().includes(searchInNoteQuery.toLowerCase()) ? (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setActivePageIndex(Number(pIdx))}
                          className="w-full rounded-xl bg-white p-2.5 text-left text-xs shadow-2xs"
                        >
                          <span className="font-bold text-[#007AFF]">
                            Pagina {Number(pIdx) + 1}
                          </span>
                          <p className="line-clamp-2 text-[11px] text-[#3C3C43]">{txt}</p>
                        </button>
                      ) : null
                    )}
                </div>
              )}

              {contentTab === "transcript" && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Live Transcript &amp; Ontvangen ({incomingNotes.length})
                  </p>
                  {incomingNotes.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-xl bg-white p-2.5 text-xs shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#007AFF]">{msg.sender}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveNote((n) => ({
                              ...n,
                              typedContentByPage: {
                                ...n.typedContentByPage,
                                [activePageIndex]:
                                  (n.typedContentByPage[activePageIndex] || "") +
                                  "\n" +
                                  msg.text,
                              },
                            }))
                          }
                          className="rounded bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#007AFF]"
                        >
                          + Op blad
                        </button>
                      </div>
                      <p className="text-[#1C1C1E] whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
