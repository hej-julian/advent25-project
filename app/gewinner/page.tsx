"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";

interface GewinnerData {
  mydealzName: string;
  profileLink: string;
  kalender: string;
  gewinn: string;
  wert: string;
  bilder: string;
}

export default function GewinnerPage() {
  const [gewinner, setGewinner] = useState<GewinnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGewinner() {
      try {
        const response = await fetch("/api/gewinner");
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Gewinner");
        }
        const jsonData = await response.json();
        setGewinner(jsonData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchGewinner();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mydealz-green border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-300 font-semibold">
            Gewinner werden geladen...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-[#1e1f21] p-8 rounded-2xl shadow-lg max-w-md border border-gray-700">
          <div className="text-center">
            <div className="text-orange-500 text-5xl mb-4">🎁</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Fehler aufgetreten
            </h2>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative">
      {/* Header Navigation */}
      <header className="bg-[#1e1f21] border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-0 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <NextImage src="/mydealz.svg" alt="mydealz" width={141} height={55} className="h-12 md:h-14 w-auto" />
          </Link>
          <Link
            href="/"
            className="hover:bg-[#2d2f31] text-white font-semibold py-2 px-4 rounded-full hover:shadow-lg transition duration-200 cursor-pointer text-sm"
          >
            ← Zurück zum Kalender
          </Link>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-linear-to-r from-[#0f0045] to-[#311c79] py-4 border-b border-[#0f0045]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white text-left">
            🏆 Gewinner 2025
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-8">
        {gewinner.length === 0 ? (
          <div className="text-center py-16 bg-[#1e1f21] rounded-2xl shadow-md border border-gray-700">
            <div className="text-8xl mb-4">🎁</div>
            <p className="text-2xl text-gray-300 font-semibold">
              Noch keine Gewinner eingetragen
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {gewinner.map((winner, index) => (
              <div
                key={index}
                className="bg-[#2d2d2d] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700/50"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <a
                          href={winner.profileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xl font-bold text-mydealz-green hover:text-[#1e8a00] transition-colors underline"
                        >
                          {winner.mydealzName}
                        </a>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">
                          <span className="font-semibold text-white">Kalender:</span> {winner.kalender}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#1e1f21] rounded-lg p-4 border border-gray-700">
                      <h3 className="text-mydealz-green font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">🎁</span> Gewinn
                      </h3>
                      <p className="text-white">{winner.gewinn}</p>
                    </div>

                    <div className="bg-[#1e1f21] rounded-lg p-4 border border-gray-700">
                      <h3 className="text-mydealz-green font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">💰</span> Wert
                      </h3>
                      <p className="text-white font-bold">{winner.wert}</p>
                    </div>
                  </div>

                  {winner.bilder && (
                    <div className="mt-4">
                      <a
                        href={winner.bilder}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-mydealz-green hover:bg-[#1e8a00] text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                        </svg>
                        Nachweis ansehen
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center bg-[#1e1f21] rounded-2xl shadow-md p-6 border border-gray-700">
          <div className="text-gray-300 text-sm space-y-2">
            <p>🎅 Herzlichen Glückwunsch an alle Gewinner! 🎄</p>
            <p className="text-gray-500 text-xs mt-4">
              <Link href="/" className="font-semibold hover:text-mydealz-green underline transition-colors cursor-pointer">
                Zurück zum Adventskalender
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
