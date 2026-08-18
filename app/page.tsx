"use client";

import { useState, useRef } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { UploadCloud, Image as ImageIcon, Sparkles, Layers, RefreshCw, CheckCircle2 } from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"blur" | "cover">("blur");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File, mode: "blur" | "cover") => {
    setLoading(true);
    setSelectedFileName(file.name);
    setResults([]);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("mode", mode);

    try {
      const res = await fetch("/api/resize", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.images);
      } else {
        alert("Fehler: " + data.error);
      }
    } catch (err) {
      alert("Netzwerkfehler beim Hochladen.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, selectedMode);
  };

  // Drag-and-Drop Event Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file, selectedMode);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <RefreshCw className="animate-spin w-6 h-6 text-blue-500 mr-2" />
        Lädt Dashboard...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">CropAd</h1>
            <p className="text-[11px] text-zinc-400">Automated Ad Resizer</p>
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
              <span className="text-xs text-zinc-400 hidden sm:inline-block">MVP Workspace</span>
              <UserButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col items-center">
        {!isSignedIn ? (
          /* Nicht eingeloggt Screen */
          <div className="my-auto text-center max-w-lg space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Ein Bild. Alle Ad-Formate in Sekunden.
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Erstelle blitzschnell passende Formate für Instagram Feed, Story & Google Ads. Melde dich kostenlos an, um loszulegen.
            </p>
            <div className="pt-2">
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5">
                  Jetzt kostenlos starten
                </button>
              </SignUpButton>
            </div>
          </div>
        ) : (
          /* Eingeloggter Dashboard-Bereich */
          <div className="w-full space-y-8">
            {/* Control Bar: Modus-Auswahl */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Zuschnitt-Modus wählen</h3>
                <p className="text-xs text-zinc-400">Bestimme, wie dein Motiv ins Format eingepasst werden soll.</p>
              </div>

              {/* Modus Tabs */}
              <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 flex gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedMode("blur")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition ${
                    selectedMode === "blur"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Original erhalten (Blur-Rand)
                </button>
                <button
                  onClick={() => setSelectedMode("cover")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition ${
                    selectedMode === "cover"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Format voll ausfüllen (Crop)
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-blue-400 border border-zinc-700/50 shadow-inner">
                  {loading ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    {loading
                      ? "Bilder werden generiert..."
                      : isDragging
                      ? "Bild jetzt hier loslassen"
                      : "Bild hier reinziehen oder klicken"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Unterstützt PNG, JPG, WEBP (Aktiver Modus: {selectedMode === "blur" ? "Original + Blur" : "Vollbild Crop"})
                  </p>
                </div>
              </div>
            </div>

            {/* Ergebnis-Galerie */}
            {results.length > 0 && (
              <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Generierte Ad-Formate
                  </h2>
                  <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                    {selectedFileName}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.map((img) => (
                    <div
                      key={img.key}
                      className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition group shadow-lg"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-sm text-white">{img.name}</h3>
                            <p className="text-[11px] text-zinc-400">{img.desc}</p>
                          </div>
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                            {img.width}×{img.height}
                          </span>
                        </div>

                        {/* Bild-Vorschau Box */}
                        <div className="w-full h-56 bg-zinc-950 rounded-xl border border-zinc-800/50 flex items-center justify-center overflow-hidden my-3">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}