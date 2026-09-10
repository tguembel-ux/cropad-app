"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  Layers,
  Palette,
  CalendarDays,
  Settings,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Studio",
    href: "/",
    icon: Sparkles,
    desc: "Karussell-Generator & Editor",
  },
  {
    label: "Assets & Vorlagen",
    href: "/assets",
    icon: Palette,
    desc: "Brand-Kits, Schriften & Logos",
  },
  {
    label: "Scheduler",
    href: "/scheduler",
    icon: CalendarDays,
    desc: "Posts & Wochenplanung",
  },
  {
    label: "Einstellungen",
    href: "/settings",
    icon: Settings,
    desc: "Profil & App-Design",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Oberer Bereich: Logo & Navigation */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">CropAd</h1>
            <p className="text-[11px] text-zinc-400 truncate">Social Suite & Studio</p>
          </div>
        </div>

        {/* Navigations-Links */}
        <nav className="p-3 space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1 block">
            Workspace
          </span>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  />
                  <div>
                    <span className="block leading-tight">{item.label}</span>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Unterer Bereich: User-Profil & Auth */}
      <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/20">
        {!isLoaded ? (
          <div className="h-10 flex items-center justify-center text-xs text-zinc-400">
            Lädt Profil...
          </div>
        ) : !isSignedIn ? (
          <div className="space-y-2">
            <SignInButton mode="modal">
              <button className="w-full text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 py-2 rounded-xl transition border border-zinc-800">
                Anmelden
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl transition shadow-md shadow-blue-600/20">
                Registrieren
              </button>
            </SignUpButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <UserButton />
              <div className="truncate">
                <span className="text-xs font-medium text-zinc-200 block truncate">Mein Workspace</span>
                <span className="text-[10px] text-zinc-400 block font-mono">Pro-Modus</span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Verbunden" />
          </div>
        )}
      </div>
    </aside>
  );
}