"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Type,
  ImageIcon,
  Upload,
  Trash2,
  Plus,
  BookmarkPlus,
  Check,
  Eye,
  FileCode,
} from "lucide-react";

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

const DEFAULT_COLOR_PRESETS: CustomTheme[] = [
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

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<"themes" | "fonts" | "logos">("themes");
  const [mounted, setMounted] = useState(false);

  // Brand-Kits State
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>([]);
  const [themeName, setThemeName] = useState("");
  const [colors, setColors] = useState({
    bg: "#09090b",
    accent: "#3b82f6",
    text: "#fafafa",
    subtext: "#a1a1aa",
  });

  // Fonts State
  const [fonts, setFonts] = useState<StoredFont[]>([]);
  const [fontTestText, setFontTestText] = useState("CropAd: Virale B2B-Karussells in Sekunden");

  // Assets/Logos State
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [assetCategory, setAssetCategory] = useState<"logo" | "graphic" | "product">("logo");

  // Feedback State
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const storedThemes = localStorage.getItem("cropad_custom_themes");
      if (storedThemes) setSavedThemes(JSON.parse(storedThemes));

      const storedFonts = localStorage.getItem("cropad_custom_fonts");
      if (storedFonts) {
        const parsedFonts: StoredFont[] = JSON.parse(storedFonts);
        setFonts(parsedFonts);
        // Vorhandene Fonts im DOM registrieren
        parsedFonts.forEach((f) => registerFontFace(f.name, f.dataUrl));
      }

      const storedAssets = localStorage.getItem("cropad_custom_assets");
      if (storedAssets) setAssets(JSON.parse(storedAssets));
    } catch (err) {
      console.error("Fehler beim Laden aus LocalStorage:", err);
    }
  }, []);

  const showNotification = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2500);
  };

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

  // 1. BRAND-KITS HANDLER
  const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

  const handleColorChange = (key: "bg" | "accent" | "text" | "subtext", val: string) => {
    let formatted = val.trim();
    if (formatted.length > 0 && !formatted.startsWith("#")) formatted = `#${formatted}`;
    setColors((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleSaveTheme = () => {
    const trimmed = themeName.trim();
    if (!trimmed) {
      alert("Bitte gib einen Namen für dein Brand-Kit ein.");
      return;
    }

    const newTheme: CustomTheme = {
      name: trimmed,
      bg: colors.bg,
      cardBg: colors.bg,
      text: colors.text,
      accent: colors.accent,
      subtext: colors.subtext,
    };

    const updated = [...savedThemes.filter((t) => t.name !== trimmed), newTheme];
    setSavedThemes(updated);
    setThemeName("");
    try {
      localStorage.setItem("cropad_custom_themes", JSON.stringify(updated));
      showNotification(`Brand-Kit „${trimmed}“ erfolgreich gesichert!`);
    } catch {
      alert("Speicherfehler im Browser-Cache.");
    }
  };

  const handleDeleteTheme = (name: string) => {
    const updated = savedThemes.filter((t) => t.name !== name);
    setSavedThemes(updated);
    try {
      localStorage.setItem("cropad_custom_themes", JSON.stringify(updated));
      showNotification("Brand-Kit gelöscht.");
    } catch {
      // LocalStorage fallback
    }
  };

  // 2. FONT HANDLER
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fontName = `Font_${baseName}_${Date.now()}`;
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      registerFontFace(fontName, dataUrl);

      const newFont: StoredFont = {
        id: String(Date.now()),
        name: fontName,
        fileName: file.name,
        dataUrl: dataUrl,
      };

      const updated = [...fonts, newFont];
      setFonts(updated);
      try {
        localStorage.setItem("cropad_custom_fonts", JSON.stringify(updated));
        showNotification(`Schriftart „${file.name}“ hinzugefügt.`);
      } catch {
        alert("Speicherlimit für Schriften im Browser erreicht.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFont = (id: string) => {
    const updated = fonts.filter((f) => f.id !== id);
    setFonts(updated);
    try {
      localStorage.setItem("cropad_custom_fonts", JSON.stringify(updated));
      showNotification("Schriftart entfernt.");
    } catch {
      // LocalStorage fallback
    }
  };

  // 3. ASSETS & LOGOS HANDLER
  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl) return;

      const newAsset: StoredAsset = {
        id: String(Date.now()),
        name: file.name,
        category: assetCategory,
        dataUrl,
        sizeKb: Math.round(file.size / 1024),
      };

      const updated = [newAsset, ...assets];
      setAssets(updated);
      try {
        localStorage.setItem("cropad_custom_assets", JSON.stringify(updated));
        showNotification(`Asset „${file.name}“ in Galerie abgelegt.`);
      } catch {
        alert("Speicherlimit für Assets im Browser erreicht. Lösche ältere Grafiken.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    try {
      localStorage.setItem("cropad_custom_assets", JSON.stringify(updated));
      showNotification("Asset entfernt.");
    } catch {
      // LocalStorage fallback
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Kopfbereich */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-blue-400" />
            Assets & Vorlagen-Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Verwalte deine Corporate Identity: Brand-Kits, Schriften-Bibliothek und wiederverwendbare Logos.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs">
            <Check className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* Tabs zur Sektionstrennung */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("themes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "themes"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Palette className="w-4 h-4" />
          Brand-Kits & Farbschemen ({savedThemes.length + DEFAULT_COLOR_PRESETS.length})
        </button>

        <button
          onClick={() => setActiveTab("fonts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "fonts"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Type className="w-4 h-4" />
          Schriftarten-Bibliothek ({fonts.length})
        </button>

        <button
          onClick={() => setActiveTab("logos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "logos"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Logos & Bild-Galerie ({assets.length})
        </button>
      </div>

      {/* TAB 1: BRAND-KITS & FARBEN */}
      {activeTab === "themes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor: Neues Brand-Kit anlegen */}
          <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-blue-400" />
              Neues Brand-Kit erstellen
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Name des Brand-Kits</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="z. B. Acme Corp Dark, Tech SaaS..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Hintergrund</label>
                  <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                    <input
                      type="color"
                      value={isValidHex(colors.bg) ? colors.bg : "#000000"}
                      onChange={(e) => handleColorChange("bg", e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={colors.bg}
                      onChange={(e) => handleColorChange("bg", e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Akzentfarbe</label>
                  <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                    <input
                      type="color"
                      value={isValidHex(colors.accent) ? colors.accent : "#3b82f6"}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Überschriften</label>
                  <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                    <input
                      type="color"
                      value={isValidHex(colors.text) ? colors.text : "#ffffff"}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={colors.text}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Untertext</label>
                  <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                    <input
                      type="color"
                      value={isValidHex(colors.subtext) ? colors.subtext : "#888888"}
                      onChange={(e) => handleColorChange("subtext", e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={colors.subtext}
                      onChange={(e) => handleColorChange("subtext", e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mini-Vorschaukarte */}
              <div
                className="p-4 rounded-2xl border border-zinc-700/60 shadow-lg space-y-2 transition"
                style={{ backgroundColor: colors.bg }}
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span style={{ color: colors.accent }}>BRAND PREVIEW</span>
                  <span style={{ color: colors.subtext }}>01/05</span>
                </div>
                <h4 className="text-sm font-bold leading-tight" style={{ color: colors.text }}>
                  So sieht deine Überschrift aus
                </h4>
                <p className="text-[11px] leading-relaxed" style={{ color: colors.subtext }}>
                  Dies ist der Begleittext deiner Folienkarte mit deinen gewählten CI-Farben.
                </p>
              </div>

              <button
                onClick={handleSaveTheme}
                disabled={!themeName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Brand-Kit dauerhaft speichern
              </button>
            </div>
          </div>

          {/* Übersicht: Gespeicherte & Vorkonfigurierte Brand-Kits */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Eigene Brand-Kits ({savedThemes.length})
              </h3>

              {savedThemes.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 rounded-3xl text-center text-xs text-zinc-500">
                  Noch keine eigenen Brand-Kits angelegt. Erstelle links deine erste Farbpalette.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedThemes.map((t) => (
                    <div
                      key={t.name}
                      className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <button
                          onClick={() => handleDeleteTheme(t.name)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                          title="Brand-Kit löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg border border-zinc-700" style={{ background: t.bg }} title="Hintergrund" />
                        <div className="w-6 h-6 rounded-lg border border-zinc-700" style={{ background: t.accent }} title="Akzent" />
                        <div className="w-6 h-6 rounded-lg border border-zinc-700" style={{ background: t.text }} title="Text" />
                        <div className="w-6 h-6 rounded-lg border border-zinc-700" style={{ background: t.subtext }} title="Untertext" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800/80">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                CropAd Standard-Presets ({DEFAULT_COLOR_PRESETS.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_COLOR_PRESETS.map((t) => (
                  <div
                    key={t.name}
                    className="p-3.5 rounded-2xl border border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-zinc-300">{t.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md border border-zinc-700" style={{ background: t.bg }} />
                      <div className="w-5 h-5 rounded-md border border-zinc-700" style={{ background: t.accent }} />
                      <div className="w-5 h-5 rounded-md border border-zinc-700" style={{ background: t.text }} />
                      <div className="w-5 h-5 rounded-md border border-zinc-700" style={{ background: t.subtext }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHRIFTARTEN-BIBLIOTHEK */}
      {activeTab === "fonts" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-400" />
                  Eigene Schriftart hochladen
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Unterstützte Dateitypen: <code className="font-mono text-zinc-300">.ttf</code>, <code className="font-mono text-zinc-300">.otf</code>, <code className="font-mono text-zinc-300">.woff2</code>.
                </p>
              </div>

              <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-600/20 flex items-center gap-2 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Schriftart auswählen</span>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFontUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              <label className="text-[11px] text-zinc-400 block mb-1">Vorschautext anpassen</label>
              <input
                type="text"
                value={fontTestText}
                onChange={(e) => setFontTestText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Liste der hochgeladenen Schriften */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Verfügbare Schriften ({fonts.length})
            </h3>

            {fonts.length === 0 ? (
              <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-center text-xs text-zinc-500">
                Noch keine benutzerdefinierten Schriftarten hochgeladen. Lade eine TTF- oder WOFF2-Datei deiner Hausschrift hoch.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {fonts.map((f) => (
                  <div
                    key={f.id}
                    className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-700 transition"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{f.fileName}</span>
                      </div>
                      <p
                        className="text-lg md:text-xl text-zinc-100 tracking-wide pt-1 truncate"
                        style={{ fontFamily: `'${f.name}', sans-serif` }}
                      >
                        {fontTestText}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteFont(f.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-800 transition shrink-0"
                      title="Schriftart entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGOS & ASSET-GALERIE */}
      {activeTab === "logos" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Logo oder Grafik zur Bibliothek hinzufügen
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Für transparente PNGs, Firmenlogos, Produktbilder oder wiederkehrende Siegel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={assetCategory}
                  onChange={(e: any) => setAssetCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="logo">Kategorie: Logo</option>
                  <option value="product">Kategorie: Produkt</option>
                  <option value="graphic">Kategorie: Grafik/Badge</option>
                </select>

                <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-600/20 flex items-center gap-2 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bild hochladen</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleAssetUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Asset-Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Gespeicherte Marken-Assets ({assets.length})
            </h3>

            {assets.length === 0 ? (
              <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-center text-xs text-zinc-500">
                Noch keine Assets vorhanden. Lade Firmenlogos oder Grafiken hoch, um sie zentral zu sichern.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition"
                  >
                    <div className="h-28 w-full bg-zinc-950/60 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-zinc-800/60">
                      <img
                        src={asset.dataUrl}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="truncate pr-2">
                        <p className="font-medium text-zinc-200 truncate">{asset.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">{asset.category} • {asset.sizeKb} KB</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition shrink-0"
                        title="Asset löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}