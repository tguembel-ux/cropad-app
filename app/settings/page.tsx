"use client";

import { useState, useEffect } from "react";
import { useUser, UserProfile } from "@clerk/nextjs";
import {
  Settings,
  User,
  Sliders,
  HardDrive,
  Save,
  Check,
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Layers,
  Palette,
  Type,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";

interface WorkspaceDefaults {
  authorName: string;
  authorHandle: string;
  defaultFormat: string;
  showTagsDefault: boolean;
}

interface StorageStats {
  projectsCount: number;
  projectsSizeKb: number;
  themesCount: number;
  themesSizeKb: number;
  fontsCount: number;
  fontsSizeKb: number;
  assetsCount: number;
  assetsSizeKb: number;
  totalSizeKb: number;
}

const DEFAULT_SETTINGS: WorkspaceDefaults = {
  authorName: "CropAd Creator",
  authorHandle: "@cropad",
  defaultFormat: "4_5",
  showTagsDefault: true,
};

export default function SettingsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"defaults" | "account" | "storage">("defaults");

  // Formular State
  const [settings, setSettings] = useState<WorkspaceDefaults>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);

  // Storage Stats State
  const [storageStats, setStorageStats] = useState<StorageStats>({
    projectsCount: 0,
    projectsSizeKb: 0,
    themesCount: 0,
    themesSizeKb: 0,
    fontsCount: 0,
    fontsSizeKb: 0,
    assetsCount: 0,
    assetsSizeKb: 0,
    totalSizeKb: 0,
  });

  const calculateStorage = () => {
    try {
      const getKb = (key: string) => {
        const item = localStorage.getItem(key);
        return item ? Math.round((new Blob([item]).size / 1024) * 10) / 10 : 0;
      };

      const projects = JSON.parse(localStorage.getItem("cropad_projects_archive") || "[]");
      const themes = JSON.parse(localStorage.getItem("cropad_custom_themes") || "[]");
      const fonts = JSON.parse(localStorage.getItem("cropad_custom_fonts") || "[]");
      const assets = JSON.parse(localStorage.getItem("cropad_custom_assets") || "[]");

      const pKb = getKb("cropad_projects_archive");
      const tKb = getKb("cropad_custom_themes");
      const fKb = getKb("cropad_custom_fonts");
      const aKb = getKb("cropad_custom_assets");
      const sKb = getKb("cropad_workspace_settings");

      setStorageStats({
        projectsCount: projects.length,
        projectsSizeKb: pKb,
        themesCount: themes.length,
        themesSizeKb: tKb,
        fontsCount: fonts.length,
        fontsSizeKb: fKb,
        assetsCount: assets.length,
        assetsSizeKb: aKb,
        totalSizeKb: Math.round((pKb + tKb + fKb + aKb + sKb) * 10) / 10,
      });
    } catch (err) {
      console.error("Fehler bei Speicher-Kalkulation:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("cropad_workspace_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {}
    calculateStorage();
  }, []);

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("cropad_workspace_settings", JSON.stringify(settings));
      setSavedNotice(true);
      calculateStorage();
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {
      alert("Fehler beim Speichern der Einstellungen.");
    }
  };

  // JSON-Backup aller CropAd-Daten
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        workspaceSettings: JSON.parse(localStorage.getItem("cropad_workspace_settings") || "{}"),
        projects: JSON.parse(localStorage.getItem("cropad_projects_archive") || "[]"),
        themes: JSON.parse(localStorage.getItem("cropad_custom_themes") || "[]"),
        fonts: JSON.parse(localStorage.getItem("cropad_custom_fonts") || "[]"),
        assets: JSON.parse(localStorage.getItem("cropad_custom_assets") || "[]"),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CropAd-Backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Fehler beim Erstellen der Backup-Datei.");
    }
  };

  // Selektive Cache-Bereinigung
  const handleClearCategory = (key: string, name: string) => {
    if (!confirm(`Möchtest du wirklich alle ${name} aus dem Browser-Speicher löschen?`)) return;
    try {
      localStorage.removeItem(key);
      calculateStorage();
      alert(`${name} wurden bereinigt.`);
    } catch {}
  };

  if (!mounted || !isLoaded) return null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-400" />
            Einstellungen & Workspace
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Konfiguriere Standardwerte für neue Karussells, verwalte dein Benutzerkonto und überwache den Browser-Speicher.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-medium animate-in zoom-in-95 duration-100">
            <Check className="w-4 h-4" />
            <span>Einstellungen gesichert</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("defaults")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "defaults"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Workspace-Defaults
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "account"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <User className="w-4 h-4" />
          Konto & Sicherheit
        </button>

        <button
          onClick={() => {
            setActiveTab("storage");
            calculateStorage();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "storage"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Speicher & Backup ({storageStats.totalSizeKb} KB)
        </button>
      </div>

      {/* TAB 1: WORKSPACE DEFAULTS */}
      {activeTab === "defaults" && (
        <form onSubmit={handleSaveDefaults} className="max-w-2xl space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Standard-Branding für neue Folien
            </h2>
            <p className="text-xs text-zinc-400">
              Diese Angaben werden automatisch in neue Karussell-Projekte geladen, sodass du sie nicht jedes Mal manuell eintragen musst.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Standard-Name / Absender
                </label>
                <input
                  type="text"
                  value={settings.authorName}
                  onChange={(e) => setSettings({ ...settings, authorName: e.target.value })}
                  placeholder="z. B. Max Mustermann | B2B Growth"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Standard Social-Handle
                </label>
                <input
                  type="text"
                  value={settings.authorHandle}
                  onChange={(e) => setSettings({ ...settings, authorHandle: e.target.value })}
                  placeholder="z. B. @maxmustermann"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Bevorzugtes Standardformat
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "4_5", label: "4:5 Portrait", sub: "LinkedIn Karussell" },
                    { id: "1_1", label: "1:1 Square", sub: "Feed Post" },
                    { id: "9_16", label: "9:16 Story", sub: "Stories / Reels" },
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt.id}
                      onClick={() => setSettings({ ...settings, defaultFormat: fmt.id })}
                      className={`p-3 rounded-xl border text-left transition ${
                        settings.defaultFormat === fmt.id
                          ? "border-blue-500 bg-blue-600/10 text-white"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{fmt.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{fmt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={settings.showTagsDefault}
                    onChange={(e) => setSettings({ ...settings, showTagsDefault: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Folien-Tags standardmäßig aktivieren
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      Zeigt Kennzeichnungen wie „HOOK“, „CONTENT“ oder „CTA“ oben links auf den Folien an.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Defaults speichern
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: ACCOUNT & CLERK PROFIL */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20 shrink-0">
                {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {user?.fullName || "CropAd Mitglied"}
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-zinc-400">
                  {user?.primaryEmailAddress?.emailAddress || "E-Mail verknüpft"}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
              Auth-Provider: Clerk
            </div>
          </div>

          {/* Eingebettetes Clerk UserProfile Widget */}
          <div className="rounded-3xl border border-zinc-800 overflow-hidden bg-zinc-950 p-2">
            <UserProfile routing="hash" />
          </div>
        </div>
      )}

      {/* TAB 3: SPEICHER & BACKUP */}
      {activeTab === "storage" && (
        <div className="space-y-6">
          {/* Übersichtskarte */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  Lokaler Speicher-Monitor
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Deine Daten liegen aktuell sicher und offline-fähig im Browser-Cache (LocalStorage).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={calculateStorage}
                  className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition"
                  title="Speicher neu analysieren"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleExportBackup}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON-Backup exportieren
                </button>
              </div>
            </div>

            {/* Speicherkacheln */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold">Projekte</span>
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-lg font-bold font-mono text-white">{storageStats.projectsCount}</p>
                <p className="text-[10px] font-mono text-zinc-500">{storageStats.projectsSizeKb} KB belegt</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold">Brand-Kits</span>
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-lg font-bold font-mono text-white">{storageStats.themesCount}</p>
                <p className="text-[10px] font-mono text-zinc-500">{storageStats.themesSizeKb} KB belegt</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold">Schriften</span>
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-lg font-bold font-mono text-white">{storageStats.fontsCount}</p>
                <p className="text-[10px] font-mono text-zinc-500">{storageStats.fontsSizeKb} KB belegt</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold">Assets & Logos</span>
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-lg font-bold font-mono text-white">{storageStats.assetsCount}</p>
                <p className="text-[10px] font-mono text-zinc-500">{storageStats.assetsSizeKb} KB belegt</p>
              </div>
            </div>
          </div>

          {/* Gefahrenzone: Selektive Bereinigung */}
          <div className="bg-zinc-900/40 border border-red-500/20 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Cache bereinigen & Daten zurücksetzen
            </h3>
            <p className="text-xs text-zinc-400">
              Lösche gezielt Kategorien aus deinem Browser-Cache, falls der Speicherplatz knapp wird. Lade vorher zur Sicherheit ein Backup herunter.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => handleClearCategory("cropad_projects_archive", "gespeicherten Projekte")}
                className="p-3 rounded-xl border border-zinc-800 hover:border-red-500/50 bg-zinc-950/60 text-xs text-zinc-300 hover:text-red-400 flex items-center justify-between transition"
              >
                <span>Projekte leeren</span>
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleClearCategory("cropad_custom_assets", "Logos und Grafiken")}
                className="p-3 rounded-xl border border-zinc-800 hover:border-red-500/50 bg-zinc-950/60 text-xs text-zinc-300 hover:text-red-400 flex items-center justify-between transition"
              >
                <span>Assets leeren</span>
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleClearCategory("cropad_custom_fonts", "Schriftarten")}
                className="p-3 rounded-xl border border-zinc-800 hover:border-red-500/50 bg-zinc-950/60 text-xs text-zinc-300 hover:text-red-400 flex items-center justify-between transition"
              >
                <span>Schriften leeren</span>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}