import { CalendarDays, Clock } from "lucide-react";

export default function SchedulerPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CalendarDays className="w-6 h-6 text-blue-400" />
          Scheduler & Redaktionsplan
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Plane deine Karussells und Posts für LinkedIn und Social Media im Voraus.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 border-dashed text-center py-16 space-y-3">
        <Clock className="w-8 h-8 text-zinc-400 mx-auto" />
        <h3 className="text-sm font-semibold text-zinc-300">Wochenplaner wird vorbereitet</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Hier entsteht die Kalenderansicht zum Zuweisen von Veröffentlichungsterminen.
        </p>
      </div>
    </div>
  );
}