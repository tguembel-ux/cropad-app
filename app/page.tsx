"use client";

import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  // Zeigt einen kurzen Ladezustand an, während Clerk den Login prüft
  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white font-sans">
        <p className="text-zinc-500">Lädt...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-950 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">CropAd App</h1>
        <p className="text-zinc-400">
          Dein KI-Tool für automatisierte Ad-Formate.
        </p>

        {/* Wenn der Nutzer NICHT eingeloggt ist */}
        {!isSignedIn ? (
          <div className="flex justify-center gap-4 pt-4">
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition cursor-pointer">
                Anmelden
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-5 py-2.5 rounded-lg font-medium transition cursor-pointer">
                Registrieren
              </button>
            </SignUpButton>
          </div>
        ) : (
          /* Wenn der Nutzer EINGELOGGT ist */
          <div className="flex flex-col items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-emerald-400 font-medium">
              ✓ Du bist erfolgreich eingeloggt!
            </p>
            <UserButton showName />
          </div>
        )}
      </div>
    </main>
  );
}