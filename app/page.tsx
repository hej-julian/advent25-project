"use client";

import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";

interface SheetData {
  name: string;
  link: string;
  startdatum: string;
  status: string;
}

interface Toast {
  id: number;
  message: string;
}

export default function Home() {
  const [data, setData] = useState<SheetData[]>([]);
  const [rawData, setRawData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Favoriten aus LocalStorage laden
  useEffect(() => {
    const savedFavorites = localStorage.getItem("advent-favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Favoriten in LocalStorage speichern
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem("advent-favorites", JSON.stringify([...favorites]));
    } else {
      localStorage.removeItem("advent-favorites");
    }
  }, [favorites]);

  const toggleFavorite = (name: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      const isAdding = !newFavorites.has(name);
      
      if (newFavorites.has(name)) {
        newFavorites.delete(name);
      } else {
        newFavorites.add(name);
      }
      
      // Verwende einen eindeutigen Key basierend auf Name und Aktion
      const toastKey = `${name}-${isAdding ? 'add' : 'remove'}`;
      
      // Verhindere doppelte Toasts
      if (!toastTimeoutRef.current.has(toastKey)) {
        const message = isAdding 
          ? `⭐ ${name} zu Favoriten hinzugefügt`
          : `❌ ${name} aus Favoriten entfernt`;
        
        showToast(message);
        
        // Setze einen kurzen Timeout um doppelte Aufrufe zu blockieren
        const timeout = setTimeout(() => {
          toastTimeoutRef.current.delete(toastKey);
        }, 100);
        
        toastTimeoutRef.current.set(toastKey, timeout);
      }
      
      return newFavorites;
    });
  };

  const showToast = (message: string) => {
    const id = Date.now() + Math.random();
    const newToast: Toast = { id, message };
    
    setToasts((prev) => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Sortiere Daten basierend auf Favoriten
  useEffect(() => {
    if (rawData.length > 0) {
      const sortedData = [...rawData].sort((a: SheetData, b: SheetData) => {
        const aIsFav = favorites.has(a.name);
        const bIsFav = favorites.has(b.name);

        // Favoriten kommen zuerst
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;

        // Ansonsten alphabetisch
        return a.name.localeCompare(b.name);
      });
      setData(sortedData);
    }
  }, [favorites, rawData]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/sheet");
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Daten");
        }
        const jsonData = await response.json();

        // Nur aktive Einträge mit Link anzeigen und alphabetisch sortieren
        const filteredData = jsonData.filter(
          (item: SheetData) =>
            item.link &&
            item.link.trim() !== "" &&
            item.status &&
            item.status.toLowerCase() === "aktiv"
        );

        setRawData(filteredData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []); // Nur einmal beim Laden

  const handleOpenAllLinks = () => {
    setShowModal(false);

    // Methode 1: Alle Links sofort öffnen
    const links = data
      .filter((item) => item.link)
      .map((item) => {
        let link = item.link.trim();
        // Füge https:// hinzu wenn Protokoll fehlt
        if (!link.startsWith("http://") && !link.startsWith("https://")) {
          link = "https://" + link;
        }
        return link;
      });

    // Öffne alle Links synchron - Browser kann sie nicht blockieren da direkte User-Interaktion
    links.forEach((link) => {
      window.open(link, "_blank", "noopener,noreferrer");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mydealz-green border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-300 font-semibold">
            Adventskalender wird geladen...
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
            <div className="text-orange-500 text-5xl mb-4">🎄</div>
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
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Schneeflocken Animation */}
      <div className="snowflakes" aria-hidden="true">
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
        <div className="snowflake">❆</div>
        <div className="snowflake">❄</div>
        <div className="snowflake">❅</div>
      </div>

      {/* Header Navigation - mydealz Style */}
      <header className="bg-[#1e1f21] border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-0 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <NextImage src="/mydealz.svg" alt="mydealz" width={141} height={55} className="h-12 md:h-14 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3">
            {data.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="hover:bg-[#2d2f31] text-white font-semibold py-2 px-4 rounded-full hover:shadow-lg transition duration-200 cursor-pointer text-sm flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                </svg>
                Alle öffnen
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  "https://www.mydealz.de/deals/digitale-adventskalender-und-gewinnspiele-2025-sammeldeal-2687053",
                  "_blank"
                )
              }
              className="hover:bg-[#2d2f31] text-white font-semibold py-2 px-4 rounded-full hover:shadow-lg transition duration-200 cursor-pointer text-sm flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
                  clipRule="evenodd"
                />
              </svg>
              Zum Deal
            </button>
            <button
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSf3ens6gbLvoT9vTzruGW6wf7NVcr-JCf3aUEzEbFpTJtX2VQ/viewform",
                  "_blank"
                )
              }
              className="hover:bg-[#052f01] text-mydealz-green font-semibold py-2 px-4 rounded-full border border-mydealz-green hover:shadow-lg transition duration-200 cursor-pointer text-sm"
            >
              + Link melden
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSf3ens6gbLvoT9vTzruGW6wf7NVcr-JCf3aUEzEbFpTJtX2VQ/viewform",
                  "_blank"
                )
              }
              className="hover:bg-[#052f01] text-mydealz-green font-semibold py-2 px-3 rounded-full border border-mydealz-green hover:shadow-lg transition duration-200 cursor-pointer text-xs"
            >
              + Link melden
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-[#2d2f31] rounded-lg transition duration-200"
              aria-label="Menü öffnen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#2d2d2d] border-t border-gray-700 shadow-lg">
            <div className="flex flex-col">
              {data.length > 0 && (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#3a3a3a] transition duration-200 text-sm font-semibold border-b border-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                  </svg>
                  Alle öffnen
                </button>
              )}
              <button
                onClick={() => {
                  window.open(
                    "https://www.mydealz.de/deals/digitale-adventskalender-und-gewinnspiele-2025-sammeldeal-2687053",
                    "_blank"
                  );
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#3a3a3a] transition duration-200 text-sm font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
                    clipRule="evenodd"
                  />
                </svg>
                Zum Deal
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Banner - Black Friday Style */}
      <div className="bg-linear-to-r from-[#0f0045] to-[#311c79] py-4 border-b border-[#0f0045]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-left">
            Adventskalender 2025
          </h2>
        </div>
      </div>

      {/* Modal für Popup-Hinweis */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1f21] rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Alle Türchen öffnen
              </h2>
              <p className="text-gray-300 mb-6">
                Es werden jetzt{" "}
                <span className="font-bold text-orange-500">
                  {data.length} Tabs
                </span>{" "}
                gleichzeitig geöffnet.
              </p>
              <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  ⚠️ <strong>Wichtig:</strong> Bitte erlaube Popups für diese
                  Seite in deinem Browser, damit alle Links geöffnet werden
                  können.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleOpenAllLinks}
                  className="flex-1 bg-mydealz-green hover:bg-[#1e8a00] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Jetzt öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-8">
        {/* Alte Header-Sektion entfernt - jetzt oben im Header */}

        {data.length === 0 ? (
          <div className="text-center py-16 bg-[#1e1f21] rounded-2xl shadow-md border border-gray-700">
            <div className="text-8xl mb-4">🎅</div>
            <p className="text-2xl text-gray-300 font-semibold">
              Noch keine Türchen verfügbar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
            {data.map((item, index) => (
              <div key={index} className="group">
                {/* Adventskalender Türchen - mydealz Dark Card Style */}
                <div className="bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-700/50 relative h-full flex flex-col">
                  <div className="p-5 flex flex-col grow">
                    {/* Türchen Nummer - Orange Badge */}
                    <div className="text-center mb-4">
                      <div className="bg-mydealz-orange text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shadow-md mx-auto">
                        {index + 1}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-center text-white font-semibold text-sm mb-4 min-h-10 line-clamp-2 grow">
                      {item.name}
                    </h3>

                    {/* Öffnen Button - Grün wie bei mydealz */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          let link = item.link.trim();
                          if (
                            !link.startsWith("http://") &&
                            !link.startsWith("https://")
                          ) {
                            link = "https://" + link;
                          }
                          window.open(link, "_blank");
                        }}
                        className="flex-1 bg-mydealz-green hover:bg-[#1e8a00] text-white font-semibold py-2.5 px-4 rounded-full transition duration-200 shadow-md hover:shadow-lg cursor-pointer"
                      >
                        Öffnen
                      </button>
                      <button
                        onClick={() => toggleFavorite(item.name)}
                        className={`flex-1 font-semibold py-2.5 px-4 rounded-full transition duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                          favorites.has(item.name)
                            ? "text-white bg-[#f97778] hover:bg-[#e66667]"
                            : "text-[#f97778] bg-[#ffffff1c] hover:bg-[#ffffff2c]"
                        }`}
                        aria-label={
                          favorites.has(item.name)
                            ? "Aus Favoriten entfernen"
                            : "Zu Favoriten hinzufügen"
                        }
                        title={
                          favorites.has(item.name)
                            ? "Aus Favoriten entfernen"
                            : "Zu Favoriten hinzufügen"
                        }
                      >
                        {favorites.has(item.name) ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center bg-[#1e1f21] rounded-2xl shadow-md p-6 border border-gray-700">
          <div className="text-gray-300 text-sm space-y-2">
            <p>🎅 Frohe Weihnachten & einen schönen Advent! 🎄</p>
            <p className="text-gray-400">
              💝 Shoutout an{" "}
              <a
                href="https://www.mydealz.de/profile/Nik04"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mydealz-green font-semibold hover:text-[#1e8a00] underline transition-colors cursor-pointer"
              >
                Nik04
              </a>{" "}
              von MyDealz und allen, die bei der Liste mitgeholfen haben! 💝
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Erstellt von{" "}
              <a
                href="https://www.mydealz.de/profile/Dealsharer"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-mydealz-green underline transition-colors cursor-pointer"
              >
                Dealsharer
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notifications Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-slide-up">
            <div className="bg-[#2d2d2d] border border-gray-700 rounded-lg shadow-2xl p-4 min-w-[280px]">
              <p className="text-white text-sm font-semibold">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
