"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Archive,
  Search,
  Plus,
  Clock,
  Sparkles,
  Layers,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  FileText,
} from "lucide-react";

export interface CarouselProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  status: "draft" | "scheduled" | "published";
  slides: any[];
  postCopy: string;
  selectedFormat: string;
  theme: any;
  selectedFont: string;
  showTags: boolean;
  authorName: string;
  authorHandle: string;
}

export default function SchedulerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "archive">("calendar");

  // Projekte State
  const [projects, setProjects] = useState<CarouselProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");

  // Wochenansicht State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Montag der aktuellen Woche
    return new Date(now.setDate(diff));
  });

  // Modal State: Projekt planen / verschieben
  const [schedulingProject, setSchedulingProject] = useState<CarouselProject | null>(null);
  const [scheduleDateInput, setScheduleDateInput] = useState("");
  const [scheduleTimeInput, setScheduleTimeInput] = useState("09:00");

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("cropad_projects_archive");
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Fehler beim Laden des Projekt-Archivs:", err);
    }
  }, []);

  const saveProjectsToStorage = (updated: CarouselProject[]) => {
    setProjects(updated);
    try {
      localStorage.setItem("cropad_projects_archive", JSON.stringify(updated));
    } catch (err) {
      console.error("Fehler beim Sichern im Browser-Cache:", err);
    }
  };

  // Projekt im Studio öffnen
  const handleOpenInStudio = (projectId: string) => {
    try {
      localStorage.setItem("cropad_active_project_id", projectId);
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  // Projekt löschen
  const handleDeleteProject = (id: string) => {
    if (!confirm("Möchtest du dieses Karussell-Projekt wirklich unwiderruflich löschen?")) return;
    const updated = projects.filter((p) => p.id !== id);
    saveProjectsToStorage(updated);
  };

  // Projekt duplizieren
  const handleDuplicateProject = (project: CarouselProject) => {
    const duplicated: CarouselProject = {
      ...project,
      id: `proj_${Date.now()}`,
      name: `${project.name} (Kopie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      scheduledDate: undefined,
      scheduledTime: undefined,
    };
    const updated = [duplicated, ...projects];
    saveProjectsToStorage(updated);
  };

  // Status direkt toggeln (z.B. als Veröffentlicht markieren)
  const handleToggleStatus = (id: string, newStatus: "draft" | "scheduled" | "published") => {
    const updated = projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProjectsToStorage(updated);
  };

  // Modal: Termin speichern
  const handleSaveSchedule = () => {
    if (!schedulingProject) return;
    if (!scheduleDateInput) {
      alert("Bitte wähle ein Datum aus.");
      return;
    }

    const updated = projects.map((p) => {
      if (p.id === schedulingProject.id) {
        return {
          ...p,
          scheduledDate: scheduleDateInput,
          scheduledTime: scheduleTimeInput || "09:00",
          status: "scheduled" as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    saveProjectsToStorage(updated);
    setSchedulingProject(null);
  };

  // Wochennavigation
  const changeWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Datumsformatierer Hilfen
  const formatDateKey = (d: Date) => {
    return d.toISOString().split("T")[0];
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  // Filterung fürs Archiv
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.postCopy?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!mounted) return null;

  const weekDays = getWeekDays();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-blue-400" />
            Scheduler & Projekt-Archiv
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Plane deine LinkedIn-Karussells im Voraus, verwalte Versionen und greife auf gespeicherte Projekte zu.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("cropad_active_project_id");
            router.push("/");
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Neues Karussell erstellen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "calendar"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Wochenplaner
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "archive"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
          }`}
        >
          <Archive className="w-4 h-4" />
          Projektarchiv ({projects.length})
        </button>
      </div>

      {/* TAB 1: WOCHENPLANER */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Kalender Header / Pagination */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">
                Woche vom {weekDays[0].toLocaleDateString("de-DE", { day: "2-digit", month: "long" })} bis{" "}
                {weekDays[6].toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changeWeek("prev")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
                title="Vorherige Woche"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const day = now.getDay();
                  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                  setCurrentWeekStart(new Date(now.setDate(diff)));
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition"
              >
                Heute
              </button>
              <button
                onClick={() => changeWeek("next")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
                title="Nächste Woche"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Tage-Spaltenraster */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day);
              const dayProjects = projects.filter((p) => p.scheduledDate === dateKey);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={`min-h-[260px] rounded-2xl border flex flex-col p-3 transition ${
                    isCurrentDay
                      ? "bg-blue-950/20 border-blue-500/40"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/60"
                  }`}
                >
                  {/* Spaltenkopf */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60">
                    <span className={`text-xs font-semibold ${isCurrentDay ? "text-blue-400 font-bold" : "text-zinc-400"}`}>
                      {day.toLocaleDateString("de-DE", { weekday: "short" })}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                        isCurrentDay ? "bg-blue-600 text-white font-bold" : "text-zinc-500"
                      }`}
                    >
                      {day.toLocaleDateString("de-DE", { day: "2-digit" })}
                    </span>
                  </div>

                  {/* Geplante Posts für diesen Tag */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px]">
                    {dayProjects.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 italic text-center p-2">
                        Kein Post geplant
                      </div>
                    ) : (
                      dayProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="group relative p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:border-zinc-600 space-y-1.5 shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                              <Clock className="w-3 h-3 text-blue-400" />
                              {proj.scheduledTime || "09:00"}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                proj.status === "published"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {proj.status === "published" ? "Live" : "Geplant"}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-zinc-100 truncate" title={proj.name}>
                            {proj.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">
                            {proj.slides?.[0]?.headline || "Keine Überschrift"}
                          </p>

                          <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {proj.slides?.length || 0} Folien
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenInStudio(proj.id)}
                                title="Im Studio bearbeiten"
                                className="p-1 text-zinc-400 hover:text-blue-400 rounded transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    proj.id,
                                    proj.status === "published" ? "scheduled" : "published"
                                  )
                                }
                                title={proj.status === "published" ? "Als geplant markieren" : "Als veröffentlicht markieren"}
                                className={`p-1 rounded transition ${
                                  proj.status === "published"
                                    ? "text-emerald-400 hover:text-zinc-400"
                                    : "text-zinc-500 hover:text-emerald-400"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROJEKTARCHIV */}
      {activeTab === "archive" && (
        <div className="space-y-6">
          {/* Suchleiste & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Karussell-Titel oder Post-Text durchsuchen..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {(["all", "draft", "scheduled", "published"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    statusFilter === st
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {st === "all" ? "Alle" : st === "draft" ? "Entwürfe" : st === "scheduled" ? "Geplant" : "Live"}
                </button>
              ))}
            </div>
          </div>

          {/* Projekt-Grid */}
          {filteredProjects.length === 0 ? (
            <div className="p-16 border border-dashed border-zinc-800 rounded-3xl text-center space-y-3">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-400">Keine Projekte gefunden</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Speichere dein erstes Karussell direkt im Studio über den neuen Speicher-Button, um es hier zu archivieren.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          p.status === "published"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : p.status === "scheduled"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {p.status === "published" ? "Live" : p.status === "scheduled" ? "Eingeplant" : "Entwurf"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(p.updatedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate" title={p.name}>
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.slides?.[0]?.headline || "Keine Hook-Überschrift"}
                    </p>
                  </div>

                  {/* Geplantes Datum, falls vorhanden */}
                  {p.scheduledDate && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        {p.scheduledDate} um {p.scheduledTime || "09:00"} Uhr
                      </span>
                    </div>
                  )}

                  {/* Aktionsleiste */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {p.slides?.length || 0} Folien • {p.selectedFormat?.replace("_", ":")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSchedulingProject(p);
                          setScheduleDateInput(p.scheduledDate || "");
                          setScheduleTimeInput(p.scheduledTime || "09:00");
                        }}
                        className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-blue-400 hover:bg-zinc-900 transition"
                        title="Veröffentlichung terminieren"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateProject(p)}
                        className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
                        title="Karussell duplizieren"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id)}
                        className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenInStudio(p.id)}
                        className="ml-1 bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition shadow-sm"
                      >
                        <span>Öffnen</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: POST TERMINIEREN */}
      {schedulingProject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  Karussell einplanen
                </h3>
                <p className="text-[11px] text-zinc-400 truncate max-w-xs">{schedulingProject.name}</p>
              </div>
              <button
                onClick={() => setSchedulingProject(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Veröffentlichungsdatum</label>
                <input
                  type="date"
                  value={scheduleDateInput}
                  onChange={(e) => setScheduleDateInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Uhrzeit</label>
                <input
                  type="time"
                  value={scheduleTimeInput}
                  onChange={(e) => setScheduleTimeInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSchedulingProject(null)}
                className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveSchedule}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-blue-600/20"
              >
                Planen & Sichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}