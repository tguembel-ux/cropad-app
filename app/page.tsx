"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  Sparkles,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Palette,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  User,
  GripVertical,
  Download,
  Archive,
  Quote,
  Megaphone,
  Type,
  Upload,
  BookmarkPlus,
  Info,
  ImageIcon,
  X,
  ExternalLink,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";

// Vordefinierte B2B-Farbpresets
const DEFAULT_COLOR_PRESETS = [
  {
    name: "Dark Slate",
    bg: "#09090b",
    cardBg: "#18181b",
    text: "#fafafa",
    accent: "#3b82f6",
    subtext: "#a1a1aa",
  },
  {
    name: "Ocean Blue",
    bg: "#030712",
    cardBg: "#0f172a",
    text: "#f8fafc",
    accent: "#0ea5e9",
    subtext: "#94a3b8",
  },
  {
    name: "Emerald Growth",
    bg: "#022c22",
    cardBg: "#064e3b",
    text: "#f0fdf4",
    accent: "#10b981",
    subtext: "#a7f3d0",
  },
  {
    name: "Clean Light",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    text: "#0f172a",
    accent: "#2563eb",
    subtext: "#64748b",
  },
];

// Typografie-Presets
const FONT_PRESETS = [
  { id: "sans", name: "Modern Sans", fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: "serif", name: "Editorial Serif", fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" },
  { id: "mono", name: "Technical Mono", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  { id: "impact", name: "Bold Impact", fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
];

const AD_FORMATS = [
  { id: "4_5", name: "LinkedIn Karussell (4:5)", desc: "1080 × 1350 px (PDF / PNG)", aspect: "aspect-[4/5]", width: 1080, height: 1350 },
  { id: "1_1", name: "Square Post (1:1)", desc: "1080 × 1080 px (Feed)", aspect: "aspect-square", width: 1080, height: 1080 },
  { id: "9_16", name: "Story / Slide (9:16)", desc: "1080 × 1920 px (Reels / Stories)", aspect: "aspect-[9/16]", width: 1080, height: 1920 },
];

export type LayoutType = "cover" | "statement" | "bullets" | "quote" | "cta";

interface Slide {
  slideNumber: number;
  tag: string;
  layoutType?: LayoutType;
  headline: string;
  content: string;
  imageUrl?: string;
}

interface CustomTheme {
  name: string;
  bg: string;
  cardBg: string;
  text: string;
  accent: string;
  subtext: string;
}

interface StoredFont {
  id: string;
  name: string;
  fileName: string;
  dataUrl: string;
}

interface StoredAsset {
  id: string;
  name: string;
  category: "logo" | "graphic" | "product";
  dataUrl: string;
  sizeKb: number;
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [content, setContent] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [numSlides, setNumSlides] = useState(5);
  const [selectedFormat, setSelectedFormat] = useState("4_5");
  const [theme, setTheme] = useState<CustomTheme>(DEFAULT_COLOR_PRESETS[0]);
  const [showCustomColors, setShowCustomColors] = useState(false);

  // Tab-Wechsel für linke Spalte
  const [activeConfigTab, setActiveConfigTab] = useState<"text" | "design" | "brand">("text");

  // Synchronisierte Assets aus LocalStorage
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>([]);
  const [savedFonts, setSavedFonts] = useState<StoredFont[]>([]);
  const [savedAssets, setSavedAssets] = useState<StoredAsset[]>([]);
  const [newThemeName, setNewThemeName] = useState("");

  // Asset-Picker Modal State (für welche Folie wird gewählt)
  const [assetPickerSlideIdx, setAssetPickerSlideIdx] = useState<number | null>(null);

  // Typografie-State
  const [selectedFont, setSelectedFont] = useState(FONT_PRESETS[0].id);

  // Dateiname & Projekt
  const [projectName, setProjectName] = useState("CropAd-Projekt");

  // Folien-Optionen
  const [showTags, setShowTags] = useState(true);
  const [authorName, setAuthorName] = useState("CropAd Creator");
  const [authorHandle, setAuthorHandle] = useState("@cropad");

  // Hexcode-Inputs
  const [hexInputs, setHexInputs] = useState({
    bg: DEFAULT_COLOR_PRESETS[0].bg,
    accent: DEFAULT_COLOR_PRESETS[0].accent,
    text: DEFAULT_COLOR_PRESETS[0].text,
    subtext: DEFAULT_COLOR_PRESETS[0].subtext,
  });

  // Ergebnis-States
  const [slides, setSlides] = useState<Slide[]>([]);
  const [postCopy, setPostCopy] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Font-Registrierungs-Helfer
  const registerFontFace = (name: string, dataUrl: string) => {
    const styleId = `font-style-${name}`;
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.appendChild(
      document.createTextNode(`
        @font-face {
          font-family: '${name}';
          src: url('${dataUrl}');
        }
      `)
    );
    document.head.appendChild(styleEl);
  };

  // Synchrone Initialisierung aller Assets aus dem Workspace
  useEffect(() => {
    try {
      // 1. Themes laden
      const storedThemes = localStorage.getItem("cropad_custom_themes");
      if (storedThemes) {
        setSavedThemes(JSON.parse(storedThemes));
      }

      // 2. Schriften laden & im DOM registrieren
      const storedFonts = localStorage.getItem("cropad_custom_fonts");
      if (storedFonts) {
        const parsedFonts: StoredFont[] = JSON.parse(storedFonts);
        setSavedFonts(parsedFonts);
        parsedFonts.forEach((f) => registerFontFace(f.name, f.dataUrl));
      }

      // 3. Logos & Grafiken laden
      const storedAssets = localStorage.getItem("cropad_custom_assets");
      if (storedAssets) {
        setSavedAssets(JSON.parse(storedAssets));
      }
    } catch (err) {
      console.error("Fehler beim Laden der Brand-Assets:", err);
    }
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const getRecommendedSlides = () => {
    if (wordCount === 0) return null;
    if (wordCount < 150) return { count: 4, text: "Empfehlung: 3-4 Folien." };
    if (wordCount <= 400) return { count: 6, text: "Empfehlung: 5-7 Folien." };
    return { count: 8, text: "Empfehlung: 7-10 Folien." };
  };
  const recommendation = getRecommendedSlides();

  const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

  const handleHexChange = (key: "bg" | "accent" | "text" | "subtext", val: string) => {
    let formatted = val.trim();
    if (formatted.length > 0 && !formatted.startsWith("#")) {
      formatted = `#${formatted}`;
    }

    setHexInputs((prev) => ({ ...prev, [key]: formatted }));

    if (isValidHex(formatted)) {
      if (key === "bg") {
        setTheme((prev) => ({ ...prev, bg: formatted, cardBg: formatted }));
      } else {
        setTheme((prev) => ({ ...prev, [key]: formatted }));
      }
    }
  };

  const handleColorPickerChange = (key: "bg" | "accent" | "text" | "subtext", val: string) => {
    setHexInputs((prev) => ({ ...prev, [key]: val }));
    if (key === "bg") {
      setTheme((prev) => ({ ...prev, bg: val, cardBg: val }));
    } else {
      setTheme((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleSelectPreset = (p: CustomTheme) => {
    setTheme(p);
    setHexInputs({
      bg: p.bg,
      accent: p.accent,
      text: p.text,
      subtext: p.subtext,
    });
  };

  const handleSaveCurrentTheme = () => {
    const trimmed = newThemeName.trim();
    if (!trimmed) {
      alert("Bitte gib einen Namen für dein Theme ein.");
      return;
    }

    const createdTheme: CustomTheme = {
      name: trimmed,
      bg: hexInputs.bg,
      cardBg: hexInputs.bg,
      text: hexInputs.text,
      accent: hexInputs.accent,
      subtext: hexInputs.subtext,
    };

    const updated = [...savedThemes.filter((t) => t.name !== trimmed), createdTheme];
    setSavedThemes(updated);
    setNewThemeName("");
    try {
      localStorage.setItem("cropad_custom_themes", JSON.stringify(updated));
    } catch {
      // LocalStorage fallback
    }
  };

  const handleDeleteTheme = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const updated = savedThemes.filter((t) => t.name !== name);
    setSavedThemes(updated);
    try {
      localStorage.setItem("cropad_custom_themes", JSON.stringify(updated));
    } catch {
      // LocalStorage fallback
    }
  };

  // Bild aus Galerie zu Folie zuweisen
  const assignAssetToSlide = (slideIdx: number, dataUrl: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[slideIdx] = { ...updated[slideIdx], imageUrl: dataUrl };
      return updated;
    });
    setAssetPickerSlideIdx(null);
  };

  // Neues Bild von Festplatte hochladen
  const handleDirectImageUpload = (slideIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        assignAssetToSlide(slideIdx, reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSlideImage = (index: number) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageUrl: undefined };
      return updated;
    });
  };

  const getActiveFontFamily = () => {
    if (selectedFont.startsWith("custom_")) {
      const foundCustom = savedFonts.find((f) => f.id === selectedFont.replace("custom_", ""));
      if (foundCustom) return `'${foundCustom.name}', sans-serif`;
    }
    const foundPreset = FONT_PRESETS.find((f) => f.id === selectedFont);
    return foundPreset ? foundPreset.fontFamily : FONT_PRESETS[0].fontFamily;
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert("Bitte gib einen Text oder Notizen ein.");
      return;
    }

    setLoading(true);
    setSlides([]);
    setPostCopy("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          customPrompt,
          numSlides,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSlides(data.slides);
        setPostCopy(data.postCopy);
      } else {
        alert("Fehler: " + data.error);
      }
    } catch {
      alert("Verbindungsfehler beim Generieren.");
    } finally {
      setLoading(false);
    }
  };

  const updateSlideField = (index: number, field: keyof Slide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const moveSlide = (index: number, direction: "left" | "right") => {
    if (
      (direction === "left" && index === 0) ||
      (direction === "right" && index === slides.length - 1)
    ) {
      return;
    }

    setSlides((prev) => {
      const updated = [...prev];
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setSlides((prev) => {
      const updated = [...prev];
      const draggedItem = updated[draggedIndex];
      updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });
    setDraggedIndex(null);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("Ein Karussell benötigt mindestens eine Folie.");
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addSlide = () => {
    if (slides.length >= 12) {
      alert("Maximal 12 Folien sind im Editor erlaubt.");
      return;
    }
    setSlides((prev) => [
      ...prev,
      {
        slideNumber: prev.length + 1,
        tag: "CONTENT",
        layoutType: "statement",
        headline: "Neue Überschrift",
        content: "Klicke hier, um deinen eigenen Folientext einzugeben...",
      },
    ]);
  };

  const copyToClipboard = () => {
    if (!postCopy) return;
    navigator.clipboard.writeText(postCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // PDF-Export
  const handleExportPDF = async () => {
    if (slides.length === 0) return;
    setExportingPdf(true);

    try {
      const activeFmt = AD_FORMATS.find((f) => f.id === selectedFormat) || AD_FORMATS[0];
      const orientation = activeFmt.width > activeFmt.height ? "landscape" : "portrait";

      const pdf = new jsPDF({
        orientation: orientation,
        unit: "px",
        format: [activeFmt.width, activeFmt.height],
        hotfixes: ["px_scaling"],
      });

      for (let i = 0; i < slides.length; i++) {
        const slideEl = slideRefs.current[i];
        if (!slideEl) continue;

        const imgData = await toPng(slideEl, {
          canvasWidth: activeFmt.width,
          canvasHeight: activeFmt.height,
          pixelRatio: 1.5,
          style: {
            borderRadius: "0px",
            transform: "scale(1)",
          },
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("no-export")) {
              return false;
            }
            return true;
          },
        });

        if (i > 0) {
          pdf.addPage([activeFmt.width, activeFmt.height], orientation);
        }

        pdf.addImage(imgData, "JPEG", 0, 0, activeFmt.width, activeFmt.height, undefined, "FAST");
      }

      const fileName = projectName.trim() ? `${projectName.trim()}.pdf` : `CropAd-Karussell-${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Export Fehler:", err);
      alert("Fehler beim Erstellen des PDFs.");
    } finally {
      setExportingPdf(false);
    }
  };

  // ZIP-Export
  const handleExportZIP = async () => {
    if (slides.length === 0) return;
    setExportingZip(true);

    try {
      const activeFmt = AD_FORMATS.find((f) => f.id === selectedFormat) || AD_FORMATS[0];
      const zip = new JSZip();

      for (let i = 0; i < slides.length; i++) {
        const slideEl = slideRefs.current[i];
        if (!slideEl) continue;

        const imgData = await toPng(slideEl, {
          canvasWidth: activeFmt.width,
          canvasHeight: activeFmt.height,
          pixelRatio: 1.5,
          style: {
            borderRadius: "0px",
            transform: "scale(1)",
          },
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("no-export")) {
              return false;
            }
            return true;
          },
        });

        const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
        const slideNumberFormatted = String(i + 1).padStart(2, "0");
        zip.file(`Folie-${slideNumberFormatted}.png`, base64Data, { base64: true });
      }

      if (postCopy) {
        zip.file("Post-Text-Copy.txt", postCopy);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const fileName = projectName.trim() ? `${projectName.trim()}.zip` : `CropAd-Bilder-Set-${Date.now()}.zip`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("ZIP Export Fehler:", err);
      alert("Fehler beim Erstellen des ZIP-Pakets.");
    } finally {
      setExportingZip(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="h-full bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <RefreshCw className="animate-spin w-6 h-6 text-blue-500 mr-2" />
        Lädt CropAd Studio...
      </main>
    );
  }

  const activeFormatObj = AD_FORMATS.find((f) => f.id === selectedFormat) || AD_FORMATS[0];
  const activeFontFamily = getActiveFontFamily();
  const isStory = selectedFormat === "9_16";

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {!isSignedIn ? (
        <div className="m-auto text-center max-w-xl p-8 space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Aus langen Inhalten zu viralen Karussells in Sekunden.
          </h2>
          <p className="text-zinc-400 leading-relaxed text-sm">
            Verwandle Notizen und Blogartikel per KI in fertige LinkedIn-PDF-Karussells und Begleittexte im eigenen Corporate Design.
          </p>
          <div className="pt-2">
            <SignUpButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all">
                Jetzt kostenlos starten
              </button>
            </SignUpButton>
          </div>
        </div>
      ) : (
        /* SIDE-BY-SIDE HAUPTCONTAINER */
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* LINKE SPALTE: Input, Prompt, Format & Branding */}
          <div className="w-full lg:w-[460px] h-full overflow-y-auto border-r border-zinc-800/80 bg-zinc-950/70 p-6 flex flex-col space-y-5 shrink-0">
            
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveConfigTab("text")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeConfigTab === "text"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Inhalt & KI
                </button>
                <button
                  onClick={() => setActiveConfigTab("design")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeConfigTab === "design"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Design & CI
                </button>
                <button
                  onClick={() => setActiveConfigTab("brand")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeConfigTab === "brand"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Branding
                </button>
              </div>

              <span className="text-[11px] font-mono text-zinc-400">
                {wordCount} Wörter
              </span>
            </div>

            {/* TAB 1: INHALT & PROMPT */}
            {activeConfigTab === "text" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Quelltext oder Notizen
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Füge hier deinen Text, Notizen, Blogbeitrag oder Kernaussagen ein..."
                    rows={6}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {recommendation && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl text-[11px] text-blue-300">
                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span>{recommendation.text}</span>
                  </div>
                )}

                {/* KI-Anweisungen */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                    Zusätzliche KI-Anweisungen
                  </label>
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Z. B. 'Storytelling-Stil, Fokus auf B2B-Entscheider, Hook auf Folie 1...'"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Folienanzahl Slider */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  <span className="text-xs text-zinc-300">
                    Folien: <strong className="text-white font-mono">{numSlides}</strong>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={numSlides}
                    onChange={(e) => setNumSlides(Number(e.target.value))}
                    className="w-32 accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Format-Auswahl */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ziel-Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AD_FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`p-2 rounded-xl text-center border transition ${
                          selectedFormat === fmt.id
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <p className="text-[11px] font-medium truncate">{fmt.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-zinc-400">{fmt.id.replace("_", ":")}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DESIGN & SCHRIFTEN (VOLL INTEGRIERT MIT ASSETS) */}
            {activeConfigTab === "design" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Typografie */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-blue-400" />
                      Typografie & Schriften
                    </label>
                    <Link
                      href="/assets"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Assets verwalten <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  {/* Standard-Schriften */}
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_PRESETS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFont(f.id)}
                        className={`p-2 rounded-xl border text-left text-xs transition ${
                          selectedFont === f.id
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-400"
                        }`}
                        style={{ fontFamily: f.fontFamily }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>

                  {/* Eigene Schriften aus der Asset-Bibliothek */}
                  {savedFonts.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                        Deine Hausschriften ({savedFonts.length})
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {savedFonts.map((f) => {
                          const customFontKey = `custom_${f.id}`;
                          const isActive = selectedFont === customFontKey;
                          return (
                            <button
                              key={f.id}
                              onClick={() => setSelectedFont(customFontKey)}
                              className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                                isActive
                                  ? "border-blue-500 bg-blue-500/15 text-white"
                                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-300"
                              }`}
                            >
                              <span
                                className="text-xs truncate"
                                style={{ fontFamily: `'${f.name}', sans-serif` }}
                              >
                                {f.fileName}
                              </span>
                              {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Farben & Brand-Kits */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-blue-400" />
                      Farb-Design
                    </label>
                    <button
                      onClick={() => setShowCustomColors(!showCustomColors)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      {showCustomColors ? "Presets wählen" : "Custom Hex"}
                    </button>
                  </div>

                  {!showCustomColors ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {DEFAULT_COLOR_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => handleSelectPreset(p)}
                            className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                              theme.name === p.name
                                ? "border-blue-500 bg-zinc-800/80"
                                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-lg border border-zinc-700 flex items-center justify-center shrink-0"
                              style={{ background: p.bg }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ background: p.accent }} />
                            </div>
                            <span className="text-xs font-medium text-zinc-200 truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>

                      {savedThemes.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                            Brand-Kits aus Workspace ({savedThemes.length})
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {savedThemes.map((p) => (
                              <div
                                key={p.name}
                                onClick={() => handleSelectPreset(p)}
                                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                  theme.name === p.name
                                    ? "border-blue-500 bg-zinc-800/80"
                                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                                }`}
                              >
                                <span className="text-xs text-zinc-200 truncate">{p.name}</span>
                                <button
                                  onClick={(e) => handleDeleteTheme(e, p.name)}
                                  className="p-1 text-zinc-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Hintergrund</label>
                          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                            <input
                              type="color"
                              value={isValidHex(hexInputs.bg) ? hexInputs.bg : "#000000"}
                              onChange={(e) => handleColorPickerChange("bg", e.target.value)}
                              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={hexInputs.bg}
                              onChange={(e) => handleHexChange("bg", e.target.value)}
                              className="w-full bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Akzent</label>
                          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                            <input
                              type="color"
                              value={isValidHex(hexInputs.accent) ? hexInputs.accent : "#3b82f6"}
                              onChange={(e) => handleColorPickerChange("accent", e.target.value)}
                              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={hexInputs.accent}
                              onChange={(e) => handleHexChange("accent", e.target.value)}
                              className="w-full bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Überschrift</label>
                          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                            <input
                              type="color"
                              value={isValidHex(hexInputs.text) ? hexInputs.text : "#ffffff"}
                              onChange={(e) => handleColorPickerChange("text", e.target.value)}
                              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={hexInputs.text}
                              onChange={(e) => handleHexChange("text", e.target.value)}
                              className="w-full bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Untertext</label>
                          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                            <input
                              type="color"
                              value={isValidHex(hexInputs.subtext) ? hexInputs.subtext : "#888888"}
                              onChange={(e) => handleColorPickerChange("subtext", e.target.value)}
                              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={hexInputs.subtext}
                              onChange={(e) => handleHexChange("subtext", e.target.value)}
                              className="w-full bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                        <input
                          type="text"
                          value={newThemeName}
                          onChange={(e) => setNewThemeName(e.target.value)}
                          placeholder="Theme Name..."
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none flex-1"
                        />
                        <button
                          onClick={handleSaveCurrentTheme}
                          className="bg-zinc-800 hover:bg-zinc-700 text-xs text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition shrink-0"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-blue-400" />
                          Sichern
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BRANDING */}
            {activeConfigTab === "brand" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Footer-Branding
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={showTags}
                      onChange={(e) => setShowTags(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    Tags aktiv
                  </label>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Name / Brand</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="CropAd Creator"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Social Handle</label>
                    <input
                      type="text"
                      value={authorHandle}
                      onChange={(e) => setAuthorHandle(e.target.value)}
                      placeholder="@cropad"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generieren Button */}
            <div className="mt-auto pt-4 border-t border-zinc-800/80">
              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 text-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    KI analysiert & generiert...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Folien & Post generieren
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RECHTE SPALTE: Live-Folien-Editor & Export */}
          <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-zinc-950">
            {slides.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl space-y-3 text-zinc-500">
                <Layers className="w-10 h-10 stroke-1 text-zinc-600" />
                <h3 className="text-sm font-semibold text-zinc-400">Kein Karussell aktiv</h3>
                <p className="text-xs max-w-sm">
                  Füge links deinen Text ein und klicke auf „Generieren“, um deine Folien hier interaktiv zu bearbeiten und zu exportieren.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Export & Werkzeug-Leiste */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white pl-1">
                      Editor ({slides.length})
                    </span>
                    <div className="flex items-center bg-zinc-950 border border-zinc-700/60 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 transition">
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Projektname..."
                        className="bg-transparent text-xs text-zinc-200 focus:outline-none w-28 sm:w-36"
                      />
                      <span className="text-[10px] text-zinc-400 font-mono ml-1">.pdf/.zip</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={addSlide}
                      className="bg-zinc-800 hover:bg-zinc-700 text-xs text-white px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      Folie
                    </button>
                    <button
                      onClick={handleExportZIP}
                      disabled={exportingZip || exportingPdf}
                      className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition border border-zinc-700"
                    >
                      {exportingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5 text-zinc-300" />}
                      PNG-ZIP
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPdf || exportingZip}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-blue-600/20"
                    >
                      {exportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      PDF Karussell
                    </button>
                  </div>
                </div>

                {/* Folien-Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {slides.map((slide, idx) => {
                    const currentLayout: LayoutType = slide.layoutType || (idx === 0 ? "cover" : idx === slides.length - 1 ? "cta" : "statement");

                    return (
                      <div
                        key={idx}
                        ref={(el) => {
                          slideRefs.current[idx] = el;
                        }}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        className={`relative group rounded-2xl flex flex-col justify-between shadow-2xl transition border ${
                          isStory ? "p-8 space-y-6" : "p-5 space-y-3"
                        } ${
                          draggedIndex === idx
                            ? "opacity-40 border-dashed border-blue-500 scale-95"
                            : "border-zinc-700/40 hover:border-zinc-500/60"
                        } ${activeFormatObj.aspect}`}
                        style={{
                          backgroundColor: theme.cardBg || theme.bg,
                          color: theme.text,
                          fontFamily: activeFontFamily,
                        }}
                      >
                        {/* Hover-Aktionsleiste */}
                        <div className="no-export absolute -top-3.5 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-zinc-950 shadow-xl border border-zinc-700 p-1 rounded-xl z-30">
                          <button
                            onClick={() => moveSlide(idx, "left")}
                            disabled={idx === 0}
                            title="Nach links verschieben"
                            className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-20 text-zinc-300"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveSlide(idx, "right")}
                            disabled={idx === slides.length - 1}
                            title="Nach rechts verschieben"
                            className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-20 text-zinc-300"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSlide(idx)}
                            title="Folie löschen"
                            className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Slide-Header */}
                        <div className="flex justify-between items-center text-[11px] font-semibold tracking-wider uppercase font-sans shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              className="no-export cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-100"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            {showTags && (
                              <input
                                type="text"
                                value={slide.tag || ""}
                                onChange={(e) => updateSlideField(idx, "tag", e.target.value)}
                                className="px-1.5 py-0.5 rounded font-mono text-[9px] focus:outline-none w-16 bg-transparent"
                                style={{
                                  backgroundColor: `${theme.accent}20`,
                                  color: theme.accent,
                                }}
                              />
                            )}

                            {/* Layout-Switcher */}
                            <select
                              value={currentLayout}
                              onChange={(e) => updateSlideField(idx, "layoutType", e.target.value)}
                              className="no-export bg-zinc-900 border border-zinc-700/80 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none cursor-pointer"
                            >
                              <option value="cover">Cover</option>
                              <option value="statement">Statement</option>
                              <option value="bullets">Liste</option>
                              <option value="quote">Zitat</option>
                              <option value="cta">CTA</option>
                            </select>

                            {/* Bild/Logo-Button: Öffnet den Asset-Picker Dialog */}
                            <button
                              onClick={() => setAssetPickerSlideIdx(idx)}
                              title="Logo oder Grafik aus Bibliothek wählen"
                              className="no-export p-1 rounded hover:bg-zinc-800/80 text-zinc-400 hover:text-blue-400 transition"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-mono text-xs select-none" style={{ color: theme.subtext }}>
                            {idx + 1} / {slides.length}
                          </span>
                        </div>

                        {/* Folieninhalt mit Bild-Slot */}
                        <div className="my-auto w-full overflow-hidden flex flex-col justify-center space-y-2.5">
                          
                          {/* BILD-CONTAINER */}
                          {slide.imageUrl && (
                            <div className="relative w-full max-h-32 rounded-xl overflow-hidden border border-zinc-700/40 bg-zinc-950/40 flex items-center justify-center shrink-0">
                              <img
                                src={slide.imageUrl}
                                alt="Slide Asset"
                                className="w-full h-full object-contain max-h-32 p-1"
                              />
                              <button
                                onClick={() => removeSlideImage(idx)}
                                title="Bild entfernen"
                                className="no-export absolute top-1 right-1 p-1 rounded-full bg-zinc-900/80 hover:bg-red-600 text-zinc-300 hover:text-white transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* 1. COVER LAYOUT */}
                          {currentLayout === "cover" && (
                            <div className={`text-center px-1 ${isStory ? "space-y-4" : "space-y-2"}`}>
                              <div
                                className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-widest uppercase border font-sans"
                                style={{ borderColor: `${theme.accent}40`, color: theme.accent, backgroundColor: `${theme.accent}15` }}
                              >
                                {authorName}
                              </div>
                              <textarea
                                rows={2}
                                value={slide.headline}
                                onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                                className={`w-full bg-transparent font-extrabold leading-tight text-center focus:outline-none rounded p-1 transition resize-none overflow-hidden ${
                                  isStory ? "text-2xl" : "text-base sm:text-lg"
                                }`}
                                style={{ color: theme.text }}
                              />
                              <textarea
                                rows={2}
                                value={slide.content}
                                onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                                className={`w-full bg-transparent leading-relaxed text-center focus:outline-none rounded p-1 transition resize-none overflow-hidden ${
                                  isStory ? "text-sm" : "text-[11px]"
                                }`}
                                style={{ color: theme.subtext }}
                              />
                            </div>
                          )}

                          {/* 2. BULLETS LAYOUT */}
                          {currentLayout === "bullets" && (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={slide.headline}
                                onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                                className="w-full bg-transparent font-bold text-sm leading-snug focus:outline-none rounded p-0.5 resize-none overflow-hidden"
                                style={{ color: theme.text }}
                              />
                              <div
                                className="p-2.5 rounded-xl border border-dashed"
                                style={{ borderColor: `${theme.accent}40`, backgroundColor: `${theme.accent}08` }}
                              >
                                <textarea
                                  rows={3}
                                  value={slide.content}
                                  onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                                  className="w-full bg-transparent text-[11px] leading-relaxed focus:outline-none resize-none overflow-hidden"
                                  style={{ color: theme.text }}
                                />
                              </div>
                            </div>
                          )}

                          {/* 3. QUOTE LAYOUT */}
                          {currentLayout === "quote" && (
                            <div className="relative space-y-1.5">
                              <Quote className="w-6 h-6 opacity-20 absolute -top-3 -left-1 select-none" style={{ color: theme.accent }} />
                              <textarea
                                rows={2}
                                value={slide.headline}
                                onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                                className="w-full bg-transparent italic font-bold text-sm leading-snug focus:outline-none rounded p-0.5 resize-none overflow-hidden"
                                style={{ color: theme.text }}
                              />
                              <textarea
                                rows={2}
                                value={slide.content}
                                onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                                className="w-full bg-transparent text-[11px] leading-relaxed focus:outline-none resize-none overflow-hidden"
                                style={{ color: theme.accent }}
                              />
                            </div>
                          )}

                          {/* 4. CTA LAYOUT */}
                          {currentLayout === "cta" && (
                            <div className="text-center px-1 space-y-2">
                              <Megaphone className="mx-auto w-5 h-5 opacity-80" style={{ color: theme.accent }} />
                              <textarea
                                rows={2}
                                value={slide.headline}
                                onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                                className="w-full bg-transparent font-bold text-sm text-center leading-snug focus:outline-none resize-none overflow-hidden"
                                style={{ color: theme.text }}
                              />
                              <textarea
                                rows={2}
                                value={slide.content}
                                onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                                className="w-full bg-transparent text-[11px] text-center leading-relaxed focus:outline-none resize-none overflow-hidden"
                                style={{ color: theme.subtext }}
                              />
                            </div>
                          )}

                          {/* 5. STATEMENT LAYOUT */}
                          {currentLayout === "statement" && (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={slide.headline}
                                onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                                className="w-full bg-transparent font-bold text-sm leading-snug focus:outline-none rounded p-0.5 resize-none overflow-hidden"
                                style={{ color: theme.text }}
                              />
                              <textarea
                                rows={3}
                                value={slide.content}
                                onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                                className="w-full bg-transparent text-[11px] leading-relaxed focus:outline-none resize-none overflow-hidden"
                                style={{ color: theme.subtext }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Slide-Footer */}
                        <div
                          className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[9px] font-sans shrink-0"
                          style={{ color: theme.subtext }}
                        >
                          <span className="truncate max-w-[130px] font-medium">
                            {authorName} <span className="opacity-60">{authorHandle}</span>
                          </span>
                          <span className="font-mono">Swipe ➔</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Post Copy Begleittext */}
                {postCopy && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        Social Media Begleittext (Post Copy)
                      </h3>
                      <button
                        onClick={copyToClipboard}
                        className="bg-zinc-800 hover:bg-zinc-700 text-[11px] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Kopiert!" : "Kopieren"}
                      </button>
                    </div>

                    <pre className="bg-zinc-950 p-3 rounded-xl text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed border border-zinc-800/80 max-h-48 overflow-y-auto">
                      {postCopy}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSET-PICKER MODAL (Wird geöffnet beim Klick auf Bild-Symbol auf einer Folie) */}
      {assetPickerSlideIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Grafik oder Logo wählen (Folie {assetPickerSlideIdx + 1})
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Wähle ein Asset aus deiner Bibliothek oder lade ein Bild von deiner Festplatte hoch.
                </p>
              </div>
              <button
                onClick={() => setAssetPickerSlideIdx(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gespeicherte Assets aus Workspace */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Aus Asset-Bibliothek ({savedAssets.length})
                </span>
                <Link
                  href="/assets"
                  target="_blank"
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  Neue Assets hochladen <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {savedAssets.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  Noch keine Assets in der Bibliothek gespeichert. Gehe in den Bereich „Assets & Vorlagen“ oder lade unten eine Datei hoch.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                  {savedAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => assignAssetToSlide(assetPickerSlideIdx, asset.dataUrl)}
                      className="group p-2 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-blue-500 flex flex-col items-center gap-1.5 transition text-left"
                    >
                      <div className="h-16 w-full flex items-center justify-center p-1">
                        <img
                          src={asset.dataUrl}
                          alt={asset.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-300 truncate w-full text-center">
                        {asset.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direkter File Upload von Festplatte */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Oder von Festplatte wählen:</span>
              <label className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium px-4 py-2 rounded-xl cursor-pointer transition flex items-center gap-1.5 border border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Datei auswählen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDirectImageUpload(assetPickerSlideIdx, e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}