import { Palette, Upload, BookmarkPlus, Type } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Palette className="w-6 h-6 text-blue-400" />
          Assets & Vorlagen
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Verwalte deine Markenidentität: Brand-Kits, Schriften-Bibliothek, Logos und Template-Muster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
          <BookmarkPlus className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Brand-Kit Paletten</h3>
          <p className="text-xs text-zinc-400">Gespeicherte Farbkombinationen für deine Folien.</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
          <Type className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Schriftarten-Bibliothek</h3>
          <p className="text-xs text-zinc-400">Dauerhaft hinterlegte TTF- und WOFF2-Dateien.</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
          <Upload className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Logo- & Asset-Galerie</h3>
          <p className="text-xs text-zinc-400">Freigestellte Firmenlogos und Produktfotos für Folien.</p>
        </div>
      </div>
    </div>
  );
}