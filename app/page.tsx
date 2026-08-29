"use client";

import { useState } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
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
} from "lucide-react";

// Vordefinierte, hochwertige B2B-Farbpresets
const COLOR_PRESETS = [
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

const AD_FORMATS = [
  { id: "4_5", name: "LinkedIn Karussell (4:5)", desc: "1080 × 1350 px (PDF)", aspect: "aspect-[4/5]" },
  { id: "1_1", name: "Square Post (1:1)", desc: "1080 × 1080 px (Feed)", aspect: "aspect-square" },
  { id: "9_16", name: "Story / Slide (9:16)", desc: "1080 × 1920 px (Reels)", aspect: "aspect-[9/16]" },
];

interface Slide {
  slideNumber: number;
  tag: string;
  headline: string;
  content: string;
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [numSlides, setNumSlides] = useState(5);
  const [selectedFormat, setSelectedFormat] = useState("4_5");
  const [theme, setTheme] = useState(COLOR_PRESETS[0]);
  const [showCustomColors, setShowCustomColors] = useState(false);

  // Folien-Optionen
  const [showTags, setShowTags] = useState(true);
  const [authorName, setAuthorName] = useState("CropAd Creator");
  const [authorHandle, setAuthorHandle] = useState("@cropad");

  // Hexcode-Inputs
  const [hexInputs, setHexInputs] = useState({
    bg: COLOR_PRESETS[0].bg,
    accent: COLOR_PRESETS[0].accent,
    text: COLOR_PRESETS[0].text,
    subtext: COLOR_PRESETS[0].subtext,
  });

  // Ergebnis-States
  const [slides, setSlides] = useState<Slide[]>([]);
  const [postCopy, setPostCopy] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isValidHex = (hex: string) => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
  };

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

  const handleSelectPreset = (p: typeof COLOR_PRESETS[0]) => {
    setTheme(p);
    setHexInputs({
      bg: p.bg,
      accent: p.accent,
      text: p.text,
      subtext: p.subtext,
    });
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
    } catch (err) {
      alert("Verbindungsfehler beim Generieren.");
    } finally {
      setLoading(false);
    }
  };

  // Folien Inline-Bearbeitung
  const updateSlideField = (index: number, field: keyof Slide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Folien-Management: Verschieben via Buttons
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

  // Folien-Management: Drag & Drop
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

  // Folien-Management: Löschen
  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("Ein Karussell benötigt mindestens eine Folie.");
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Folien-Management: Neue Folie anfügen
  const addSlide = () => {
    if (slides.length >= 12) {
      alert("Maximal 12 Folien sind im Editor erlaubt.");
      return;
    }
    setSlides((prev) => [
      ...prev,
      {
        slideNumber: prev.length + 1,
        tag: "NEU",
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

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <RefreshCw className="animate-spin w-6 h-6 text-blue-500 mr-2" />
        Lädt CropAd Workspace...
      </main>
    );
  }

  const activeFormatObj = AD_FORMATS.find((f) => f.id === selectedFormat) || AD_FORMATS[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">CropAd</h1>
            <p className="text-[11px] text-zinc-400">Content Repurposing & Carousels</p>
          </div>
        </div>

        <div>
          {!isSignedIn ? (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition">
                  Anmelden
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/20">
                  Registrieren
                </button>
              </SignUpButton>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400 hidden sm:inline-block">Repurpose Studio</span>
              <UserButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 flex flex-col">
        {!isSignedIn ? (
          <div className="my-auto text-center max-w-xl mx-auto space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Aus langen Inhalten zu viralen Karussells in Sekunden.
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Verwandle Blogartikel, Skripte und Notizen per KI in gestochen scharfe LinkedIn-PDF-Karussells und fertige Begleittexte im eigenen Corporate Design[cite: 1, 2].
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
          <div className="space-y-10">
            {/* OBERER BEREICH: Input & Branding Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Linke Spalte: Text-Input */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h2 className="font-semibold text-sm">Quelltext, Notizen oder Transkript</h2>
                  </div>

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Füge hier deinen Text, Notizen, Blogbeitrag oder Kernaussagen ein..."
                    rows={6}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                  />

                  {/* Optionaler Prompt */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                      Optionale Anweisungen an die KI (z. B. Tonalität, Zielgruppe)[cite: 1, 2]
                    </label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Z. B. 'Storytelling-Stil, Fokus auf B2B-Entscheider'"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Slider: Folienanzahl */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-400">
                      Anzahl Folien: <strong className="text-white">{numSlides}</strong>
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

                  {/* Generieren Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !content.trim()}
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        KI analysiert und strukturiert Folien...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Karussell & Text generieren
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Rechte Spalte: Format, Farb-Einstellungen & Branding-Footer */}
              <div className="lg:col-span-5 space-y-6">
                {/* Format-Auswahl */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-3xl space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ziel-Format</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {AD_FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`p-3 rounded-xl text-left border flex items-center justify-between transition ${
                          selectedFormat === fmt.id
                            ? "border-blue-500 bg-blue-500/10 text-white"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium text-white">{fmt.name}</p>
                          <p className="text-[11px] text-zinc-500">{fmt.desc}</p>
                        </div>
                        {selectedFormat === fmt.id && <ChevronRight className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Farb-Design / Corporate Identity */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Design & Branding</h3>
                    </div>
                    <button
                      onClick={() => setShowCustomColors(!showCustomColors)}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      {showCustomColors ? "Presets wählen" : "Custom Hex-Codes"}
                    </button>
                  </div>

                  {!showCustomColors ? (
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            theme.name === p.name
                              ? "border-blue-500 bg-zinc-800/80"
                              : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden"
                            style={{ background: p.bg }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.accent }} />
                          </div>
                          <span className="text-xs font-medium text-zinc-200">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Hintergrund</label>
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 focus-within:border-blue-500">
                          <input
                            type="color"
                            value={isValidHex(hexInputs.bg) ? hexInputs.bg : "#000000"}
                            onChange={(e) => handleColorPickerChange("bg", e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={hexInputs.bg}
                            onChange={(e) => handleHexChange("bg", e.target.value)}
                            className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                            placeholder="#09090b"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Akzentfarbe</label>
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 focus-within:border-blue-500">
                          <input
                            type="color"
                            value={isValidHex(hexInputs.accent) ? hexInputs.accent : "#3b82f6"}
                            onChange={(e) => handleColorPickerChange("accent", e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={hexInputs.accent}
                            onChange={(e) => handleHexChange("accent", e.target.value)}
                            className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Überschrift / Text</label>
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 focus-within:border-blue-500">
                          <input
                            type="color"
                            value={isValidHex(hexInputs.text) ? hexInputs.text : "#ffffff"}
                            onChange={(e) => handleColorPickerChange("text", e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={hexInputs.text}
                            onChange={(e) => handleHexChange("text", e.target.value)}
                            className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                            placeholder="#fafafa"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Untertext</label>
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 focus-within:border-blue-500">
                          <input
                            type="color"
                            value={isValidHex(hexInputs.subtext) ? hexInputs.subtext : "#888888"}
                            onChange={(e) => handleColorPickerChange("subtext", e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={hexInputs.subtext}
                            onChange={(e) => handleHexChange("subtext", e.target.value)}
                            className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                            placeholder="#a1a1aa"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Folien-Optionen & Branding-Footer */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Branding & Footer
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={showTags}
                        onChange={(e) => setShowTags(e.target.checked)}
                        className="rounded accent-blue-600 cursor-pointer"
                      />
                      Tags anzeigen
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Name / Brand</label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="CropAd Creator"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Social Handle</label>
                      <input
                        type="text"
                        value={authorHandle}
                        onChange={(e) => setAuthorHandle(e.target.value)}
                        placeholder="@cropad"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* UNTERER BEREICH: Live-Editor & Begleittext */}
            {slides.length > 0 && (
              <div className="space-y-8 pt-4 border-t border-zinc-800 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Interaktiver Folien-Editor ({slides.length})</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-normal">
                        Live Editierbar
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Nutze den 6-Punkte-Grip zum Ziehen & Ablegen (Drag & Drop) oder passe Texte direkt an[cite: 1, 2].
                    </p>
                  </div>

                  {/* Button: Neue Folie hinzufügen */}
                  <button
                    onClick={addSlide}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                    Folie hinzufügen
                  </button>
                </div>

                {/* Folien-Vorschau Grid mit Drag & Drop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slides.map((slide, idx) => (
                    <div
                      key={idx}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`relative group rounded-2xl p-6 flex flex-col justify-between shadow-2xl transition border ${
                        draggedIndex === idx
                          ? "opacity-40 border-dashed border-blue-500 scale-95"
                          : "border-zinc-700/40 hover:border-zinc-500/60"
                      } ${activeFormatObj.aspect}`}
                      style={{ backgroundColor: theme.cardBg || theme.bg, color: theme.text }}
                    >
                      {/* Entkoppelte Hover-Aktionsleiste zentriert über dem oberen Folienrand */}
                      <div className="absolute -top-3.5 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-zinc-950 shadow-xl border border-zinc-700 p-1 rounded-xl z-20">
                        <button
                          onClick={() => moveSlide(idx, "left")}
                          disabled={idx === 0}
                          title="Nach links verschieben"
                          className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-20 text-zinc-300 transition"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSlide(idx, "right")}
                          disabled={idx === slides.length - 1}
                          title="Nach rechts verschieben"
                          className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-20 text-zinc-300 transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSlide(idx)}
                          title="Folie löschen"
                          className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Header der Folie: Grip-Icon, Tag & Folien-Nummer (Völlig frei von Buttons) */}
                      <div className="flex justify-between items-center text-[11px] font-semibold tracking-wider uppercase">
                        <div className="flex items-center gap-2">
                          {/* 6-Punkte Drag-Handle */}
                          <div
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            title="Ziehen, um Folie zu verschieben"
                            className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 transition"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {showTags && (
                            <input
                              type="text"
                              value={slide.tag || ""}
                              onChange={(e) => updateSlideField(idx, "tag", e.target.value)}
                              placeholder="TAG"
                              className="px-2 py-0.5 rounded font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 bg-transparent"
                              style={{
                                backgroundColor: `${theme.accent}20`,
                                color: theme.accent,
                              }}
                            />
                          )}
                        </div>

                        {/* Folien-Nummer (1 / 5) ist jetzt komplett frei und verdeckungsfrei */}
                        <span className="font-mono text-xs select-none" style={{ color: theme.subtext }}>
                          {idx + 1} / {slides.length}
                        </span>
                      </div>

                      {/* Inhalt: Inline-editierbare Überschrift und Textkörper */}
                      <div className="my-auto space-y-3">
                        <textarea
                          rows={2}
                          value={slide.headline}
                          onChange={(e) => updateSlideField(idx, "headline", e.target.value)}
                          placeholder="Überschrift eingeben..."
                          className="w-full bg-transparent font-bold text-base leading-snug focus:outline-none focus:bg-zinc-950/20 focus:ring-1 focus:ring-blue-500/40 rounded-lg p-1 transition resize-none"
                          style={{ color: theme.text }}
                        />
                        <textarea
                          rows={4}
                          value={slide.content}
                          onChange={(e) => updateSlideField(idx, "content", e.target.value)}
                          placeholder="Folientext eingeben..."
                          className="w-full bg-transparent text-xs leading-relaxed focus:outline-none focus:bg-zinc-950/20 focus:ring-1 focus:ring-blue-500/40 rounded-lg p-1 transition resize-none"
                          style={{ color: theme.subtext }}
                        />
                      </div>

                      {/* Footer Branding Bar */}
                      <div
                        className="pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[10px]"
                        style={{ color: theme.subtext }}
                      >
                        <span className="truncate max-w-[140px] font-medium">
                          {authorName} <span className="opacity-60">{authorHandle}</span>
                        </span>
                        <span className="font-mono">Swipe ➔</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* LinkedIn Begleittext Copy-Box */}
                {postCopy && (
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        LinkedIn Begleittext (Post Copy)[cite: 1, 2]
                      </h3>
                      <button
                        onClick={copyToClipboard}
                        className="bg-zinc-800 hover:bg-zinc-700 text-xs text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Kopiert!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Kopieren
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="bg-zinc-950 p-4 rounded-xl text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed border border-zinc-800/80">
                      {postCopy}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}