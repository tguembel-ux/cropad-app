"use client";

import { useState } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResults([]);

    const formData = new FormData();
    formData.append("image", file);

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
      alert("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white font-sans">
        <p className="text-zinc-500">Lädt...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-950 text-white font-sans">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">CropAd App</h1>
        <p className="text-zinc-400">
          Dein KI-Tool für automatisierte Ad-Formate.
        </p>

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
          <div className="flex flex-col items-center gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex justify-between items-center w-full">
              <span className="text-emerald-400 text-sm font-medium">● Bereit</span>
              <UserButton />
            </div>

            {/* Test-Upload-Feld für Session 3 */}
            <div className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 hover:border-zinc-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleTestUpload}
                disabled={loading}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              />
              {loading && <p className="mt-3 text-sm text-yellow-400 animate-pulse">Formate werden berechnet...</p>}
            </div>

            {/* Ausgabe der generierten Formate */}
            {results.length > 0 && (
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {results.map((img) => (
                  <div key={img.key} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-left">
                    <p className="text-xs text-zinc-400 font-medium mb-2">{img.name}</p>
                    <img src={img.url} alt={img.name} className="w-full h-36 object-contain bg-black rounded" />
                    <p className="text-[10px] text-zinc-500 mt-1">{img.width} x {img.height} px</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}