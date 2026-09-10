import { Settings, User, Monitor } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-400" />
          Einstellungen
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Verwalte deinen Account, Benutzerdaten und das Erscheinungsbild der Plattform.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Benutzerprofil</h3>
              <p className="text-xs text-zinc-400">Verwalte E-Mail, Name und Login-Methoden.</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">App-Design & Appearance</h3>
              <p className="text-xs text-zinc-400">Dunkelmodus aktiv (Konfiguration für Dashboard-Farben).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}