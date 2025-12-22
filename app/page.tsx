"use client";

import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";

// Interface für die Türchen-Daten aus Google Sheets
// Kategorie wurde später hinzugefügt für die Sortierung
interface SheetData {
  name: string;
  link: string;
  startdatum: string;
  status: string;
  added: string; // Hinzugefügt-Datum
  note: string; // Kommentar
  kategorie: string; // julian edit: für die Kategorisierung der Türchen
  laueftBis: string; // bis wann der Kalender gültig ist
}

// Toast-Benachrichtigungen
interface Toast {
  id: number;
  message: string;
}

// hej-julian: Gewinner-Daten vom Google Sheet "Gewinner"
interface GewinnerData {
  mydealzName: string;
  profileLink: string;
  kalender: string;
  gewinn: string;
  wert: string; // wird automatisch in Euro formatiert in der API
  bilder: string;
}

export default function Home() {
  // Hauptdaten-States
  const [data, setData] = useState<SheetData[]>([]); // gefilterte und sortierte Türchen
  const [rawData, setRawData] = useState<SheetData[]>([]); // rohe Daten vom API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal-States für verschiedene Popups
  const [showModal, setShowModal] = useState(false); // "Alle öffnen" Modal
  const [showFavoritesModal, setShowFavoritesModal] = useState(false); // "Alle Favs öffnen" Modal
  const [showGewinnerModal, setShowGewinnerModal] = useState(false); // hej-julian added: Gewinner-Modal
  
  // User-Interaktionen mit LocalStorage-Persistierung
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Favoriten-Liste
  const [visited, setVisited] = useState<Set<string>>(new Set()); // besuchte Türchen (täglicher Reset)
  
  // UI-States
  const [toasts, setToasts] = useState<Toast[]>([]); // Toast-Benachrichtigungen Stack
  const [menuOpen, setMenuOpen] = useState(false); // Mobile Hamburger-Menü
  const [showSnow, setShowSnow] = useState(true); // Schneefall-Animation Toggle
  
  // Gewinner-Daten und Loading-State
  const [gewinner, setGewinner] = useState<GewinnerData[]>([]);
  const [gewinnerLoading, setGewinnerLoading] = useState(false);
  
  // Stand-Datum aus dem Sheet
  const [standDatum, setStandDatum] = useState<string>("");
  
  // Verhindert doppelte Toast-Aufrufe in React Strict Mode
  const toastTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // hej-julian: Spezielle Ansicht für Heiligabend 2025
  // Am 24.12. werden nur noch Gewinner angezeigt mit Danksagung
  const isChristmasEve2025 = () => {
    const today = new Date();
    console.log(); // TODO julian: console.log entfernen vor Production
    return today.getDate() === 22 && today.getMonth() === 11 && today.getFullYear() === 2025;
  };

  // Initialisierung - lädt alle gespeicherten User-Präferenzen
  useEffect(() => {
    // Favoriten laden (persistiert über Tage hinweg)
    const savedFavorites = localStorage.getItem("advent-favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    
    // Schneefall-Toggle (User kann Schnee ausblenden)
    const savedSnowPreference = localStorage.getItem("advent-show-snow");
    if (savedSnowPreference !== null) {
      setShowSnow(savedSnowPreference === "true");
    }

    // Besuchte Türchen mit automatischem täglichen Reset
    // Wichtig: Wird jeden Tag zurückgesetzt damit User neue Türchen markieren können
    const savedVisited = localStorage.getItem("advent-visited");
    const savedDate = localStorage.getItem("advent-visited-date");
    const today = new Date().toDateString();
    
    if (savedVisited && savedDate === today) {
      // Heute schon besucht? Dann laden
      setVisited(new Set(JSON.parse(savedVisited)));
    } else {
      // Neuer Tag erkannt - Reset der besuchten Türchen
      localStorage.removeItem("advent-visited");
      localStorage.setItem("advent-visited-date", today);
      setVisited(new Set());
    }
  }, []);

  // hej-julian: Gewinner-Daten vom Google Sheet laden
  // Wird automatisch am 24.12.2025 aufgerufen ODER beim Modal-Öffnen
  const loadGewinner = async () => {
    setGewinnerLoading(true);
    try {
      const response = await fetch("/api/gewinner");
      if (response.ok) {
        const jsonData = await response.json();
        setGewinner(jsonData); // julian: Werte werden in der API automatisch in Euro formatiert
      }
    } catch (err) {
      console.error("Fehler beim Laden der Gewinner:", err); // TODO julian: besseres Error-Handling?
    } finally {
      setGewinnerLoading(false);
    }
  };

  // Gewinner beim Öffnen des Modals laden ODER am 24.12.2025 automatisch
  useEffect(() => {
    if (showGewinnerModal || isChristmasEve2025()) {
      loadGewinner();
    }
     
  }, [showGewinnerModal]);

  // Favoriten in LocalStorage speichern
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem("advent-favorites", JSON.stringify([...favorites]));
    } else {
      localStorage.removeItem("advent-favorites");
    }
  }, [favorites]);

  // Besuchte Türchen in LocalStorage speichern
  useEffect(() => {
    if (visited.size > 0) {
      localStorage.setItem("advent-visited", JSON.stringify([...visited]));
      localStorage.setItem("advent-visited-date", new Date().toDateString());
    }
  }, [visited]);

  // Favoriten hinzufügen/entfernen mit Toast-Benachrichtigung
  const toggleFavorite = (name: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      const isAdding = !newFavorites.has(name);
      
      // Toggle-Logik
      if (newFavorites.has(name)) {
        newFavorites.delete(name);
      } else {
        newFavorites.add(name);
      }
      
      // Eindeutiger Key verhindert Duplikate bei schnellem Klicken
      const toastKey = `${name}-${isAdding ? 'add' : 'remove'}`;
      
      // hej-julian: Verhindert doppelte Toasts in React Strict Mode (Development)
      if (!toastTimeoutRef.current.has(toastKey)) {
        const message = isAdding 
          ? `⭐ ${name} zu Favoriten hinzugefügt`
          : `❌ ${name} aus Favoriten entfernt`;
        
        showToast(message);
        
        // 100ms Debounce gegen Doppel-Klicks
        const timeout = setTimeout(() => {
          toastTimeoutRef.current.delete(toastKey);
        }, 100);
        
        toastTimeoutRef.current.set(toastKey, timeout);
      }
      
      return newFavorites;
    });
  };

  // Türchen als besucht markieren (beim Öffnen-Klick)
  // Zeigt dann ein blaues "Besucht"-Badge - wird täglich zurückgesetzt
  const markAsVisited = (name: string) => {
    setVisited((prev) => {
      const newVisited = new Set(prev);
      newVisited.add(name);
      return newVisited;
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

  const toggleSnow = () => {
    const newShowSnow = !showSnow;
    setShowSnow(newShowSnow);
    localStorage.setItem("advent-show-snow", newShowSnow.toString());
    showToast(newShowSnow ? "❄️ Schneefall aktiviert" : "❄️ Schneefall deaktiviert");
  };

  // Sortiere Daten basierend auf Favoriten
  useEffect(() => {
    if (rawData.length > 0) {
      const sortedData = [...rawData].sort((a: SheetData, b: SheetData) => {
        // Erst nach Kategorie sortieren
        const categoryA = a.kategorie || "ZZZ"; // Items ohne Kategorie ans Ende
        const categoryB = b.kategorie || "ZZZ";
        
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }
        
        // Innerhalb der gleichen Kategorie alphabetisch nach Name
        return a.name.localeCompare(b.name);
      });
      setData(sortedData);
    }
  }, [rawData]);

  // Berechne die Anzahl der gültigen Favoriten (nur mit Links)
  const validFavoritesCount = data.filter(
    (item) => favorites.has(item.name) && item.link && item.link.trim() !== ""
  ).length;

  // hej-julian: Listen-Trennung für Favoriten und normale Türchen
  // Favoriten werden separat oben angezeigt mit rosa Border
  const favoriteItems = data.filter((item) => favorites.has(item.name));
  const normalItems = data.filter((item) => !favorites.has(item.name));

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/sheet");
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Daten");
        }
        const jsonData = await response.json();

        // Stand-Datum extrahieren (Item mit name="Stand")
        const standItem = jsonData.find((item: SheetData) => item.name === "Stand");
        if (standItem && standItem.link) {
          setStandDatum(standItem.link);
        }

        // julian: Nur aktive Türchen mit gültigen Links filtern
        // hej-julian edit: Status muss "aktiv" sein (case-insensitive)
        // Nach dem 24.12: Kalender werden angezeigt wenn sie noch gültig sind (laueftBis)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Am 24.12. in der Heiligabend-Ansicht: nur Kalender die NACH dem 24.12. laufen
        const christmas2025 = new Date(2025, 11, 24); // 24.12.2025
        christmas2025.setHours(23, 59, 59, 999);
        const isChristmas = isChristmasEve2025();
        
        const filteredData = jsonData.filter(
          (item: SheetData) => {
            // Stand-Item herausfiltern (wird im Footer angezeigt)
            if (item.name === "Stand") {
              return false;
            }
            
            // Basis-Filter: Link und Status müssen vorhanden sein
            if (!item.link || item.link.trim() === "" || !item.status || item.status.toLowerCase() !== "aktiv") {
              return false;
            }
            
            // Prüfen ob "Läuft bis" Datum gesetzt ist und noch gültig
            if (item.laueftBis && item.laueftBis.trim() !== "") {
              try {
                // Deutsches Datumsformat parsen (z.B. "31.12.2025")
                const parts = item.laueftBis.trim().split(".");
                if (parts.length === 3) {
                  const laueftBisDate = new Date(
                    parseInt(parts[2]), // Jahr
                    parseInt(parts[1]) - 1, // Monat (0-basiert)
                    parseInt(parts[0]) // Tag
                  );
                  laueftBisDate.setHours(23, 59, 59, 999); // Ende des Tages
                  
                  // Am 24.12.: nur Kalender die über den 24.12. hinausgehen
                  if (isChristmas) {
                    return laueftBisDate > christmas2025;
                  }
                  
                  // Sonst: nur anzeigen wenn noch nicht abgelaufen
                  return laueftBisDate >= today;
                }
              } catch (e) {
                // Bei Parsing-Fehler trotzdem anzeigen
                console.warn("Fehler beim Parsen von laueftBis:", item.laueftBis, e);
              }
            }
            
            // Wenn kein "Läuft bis" gesetzt ist, trotzdem anzeigen
            return true;
          }
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

  // hej-julian: "Alle öffnen" - öffnet alle Türchen gleichzeitig in neuen Tabs
  // Wichtig: Browser-Popup-Blocker muss deaktiviert sein!
  const handleOpenAllLinks = () => {
    setShowModal(false);

    // julian: Alle Links sammeln und aufbereiten
    const links = data
      .filter((item) => item.link)
      .map((item) => {
        let link = item.link.trim();
        // hej-julian added: https:// prefix hinzufügen falls fehlt
        if (!link.startsWith("http://") && !link.startsWith("https://")) {
          link = "https://" + link;
        }
        return link;
      });

    // julian edit: Synchrones Öffnen - funktioniert weil direkte User-Interaktion
    // Browser kann Popups nicht blockieren da es vom Button-Click kommt
    links.forEach((link) => {
      window.open(link, "_blank", "noopener,noreferrer");
    });
  };

  // hej-julian: Öffnet alle favorisierten Türchen auf einmal
  const handleOpenFavorites = () => {
    setMenuOpen(false); // julian: Mobile-Menü schließen
    setShowFavoritesModal(true); // hej-julian: Warnung vor Popup-Blocker zeigen
  };

  const handleConfirmOpenFavorites = () => {
    setShowFavoritesModal(false);

    // julian: Nur die favorisierten Türchen filtern und öffnen
    const favoriteLinks = data
      .filter((item) => favorites.has(item.name) && item.link)
      .map((item) => {
        let link = item.link.trim();
        // hej-julian: https:// hinzufügen falls nicht vorhanden
        if (!link.startsWith("http://") && !link.startsWith("https://")) {
          link = "https://" + link;
        }
        return link;
      });

    // julian edit: Alle Favoriten-Links öffnen
    favoriteLinks.forEach((link) => {
      window.open(link, "_blank", "noopener,noreferrer");
    });

    // hej-julian added: Erfolgs-Toast mit Anzahl
    showToast(`🌟 ${favoriteLinks.length} Favoriten geöffnet`);
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
      {showSnow && (
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
      )}

      {/* julian: Sticky Header mit mydealz-Branding und Navigation */}
      {/* hej-julian edit: Desktop & Mobile Ansichten getrennt für bessere UX */}
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
            {validFavoritesCount > 0 && (
              <button
                onClick={handleOpenFavorites}
                className="hover:bg-[#2d2f31] text-white font-semibold py-2 px-4 rounded-full hover:shadow-lg transition duration-200 cursor-pointer text-sm flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-[#f97778]"
                >
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
                Alle Favs öffnen
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
            {validFavoritesCount > 0 && (
              <button
                onClick={handleOpenFavorites}
                className="hover:bg-[#2d2f31] text-[#f97778] font-semibold py-2 px-3 rounded-full border border-[#f97778] hover:shadow-lg transition duration-200 cursor-pointer text-xs whitespace-nowrap"
                aria-label="Alle Favoriten öffnen"
              >
                Alle Fav. öffnen
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSf3ens6gbLvoT9vTzruGW6wf7NVcr-JCf3aUEzEbFpTJtX2VQ/viewform",
                  "_blank"
                )
              }
              className="hover:bg-[#052f01] text-mydealz-green font-semibold py-2 px-3 rounded-full border border-mydealz-green hover:shadow-lg transition duration-200 cursor-pointer text-xs"
            >
              + Link
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
              {validFavoritesCount > 0 && (
                <button
                  onClick={handleOpenFavorites}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#3a3a3a] transition duration-200 text-sm font-semibold border-b border-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-[#f97778]"
                  >
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                  Alle Favs öffnen ({validFavoritesCount})
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

      {/* hej-julian: Banner mit Titel und Gewinner-Button (Gold-Gradient) */}
      {/* julian edit: Flex-Layout für responsive Anordnung */}
      <div className="bg-linear-to-r from-[#0f0045] to-[#311c79] py-4 border-b border-[#0f0045]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Adventskalender 2025
          </h2>
          <button
            onClick={() => setShowGewinnerModal(true)}
            className="bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold py-2 px-4 md:px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm md:text-base cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
            </svg>
            Gewinner
          </button>
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

      {/* Modal für Favoriten-Popup-Hinweis */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1f21] rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Alle Favoriten öffnen
              </h2>
              <p className="text-gray-300 mb-6">
                Es werden jetzt{" "}
                <span className="font-bold text-[#f97778]">
                  {validFavoritesCount} Favoriten
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
                  onClick={() => setShowFavoritesModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmOpenFavorites}
                  className="flex-1 bg-mydealz-green hover:bg-[#1e8a00] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Jetzt öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal für Gewinner */}
      {showGewinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e1f21] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
            <div className="sticky top-0 bg-[#1e1f21] border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-yellow-500"
                >
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                </svg>
                Gewinner 2025
              </h2>
              <button
                onClick={() => setShowGewinnerModal(false)}
                className="p-2 hover:bg-[#2d2f31] rounded-lg transition duration-200"
                aria-label="Schließen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {gewinnerLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mydealz-green border-t-transparent mb-4"></div>
                  <p className="text-lg text-gray-300 font-semibold">
                    Gewinner werden geladen...
                  </p>
                </div>
              ) : gewinner.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-8xl mb-4">🎁</div>
                  <p className="text-xl text-gray-300 font-semibold">
                    Noch keine Gewinner eingetragen
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gewinner.map((winner, index) => (
                    <div
                      key={index}
                      className="bg-[#2d2d2d] rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border border-gray-700/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={winner.profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold text-mydealz-green hover:text-[#1e8a00] transition-colors underline break-all"
                          >
                            {winner.mydealzName}
                          </a>
                        </div>
                        <div className="md:ml-auto">
                          <p className="text-gray-400 text-sm">
                            <span className="font-semibold text-white">Kalender:</span>{" "}
                            {winner.kalender}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-[#1e1f21] rounded-lg p-3 border border-gray-700">
                          <h3 className="text-mydealz-green font-semibold mb-1 flex items-center gap-2 text-sm">
                            <span className="text-lg">🎁</span> Gewinn
                          </h3>
                          <p className="text-white text-sm">{winner.gewinn}</p>
                        </div>

                        <div className="bg-[#1e1f21] rounded-lg p-3 border border-gray-700">
                          <h3 className="text-mydealz-green font-semibold mb-1 flex items-center gap-2 text-sm">
                            <span className="text-lg">💰</span> Wert
                          </h3>
                          <p className="text-white font-bold text-sm">{winner.wert}</p>
                        </div>
                      </div>

                      {winner.bilder && (
                        <div className="mt-3">
                          <a
                            href={winner.bilder}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-mydealz-green hover:bg-[#1e8a00] text-white font-semibold py-2 px-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                            </svg>
                            Nachweis ansehen
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-8">
        {/* hej-julian: Spezielle Heiligabend-Ansicht - nur Gewinner & Danksagung */}
        {/* julian edit: Am 24.12.2025 werden keine Türchen mehr angezeigt */}
        {isChristmasEve2025() ? (
          <div className="space-y-8">
            {/* julian: Danksagungs-Banner mit Weihnachtsgrüßen */}
            <div className="bg-linear-to-r from-[#0f0045] to-[#311c79] rounded-2xl p-8 md:p-12 shadow-2xl border border-[#5a3f8f] text-center">
              <div className="text-6xl md:text-8xl mb-6">🎄✨🎅</div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Frohe Weihnachten! 🎄
              </h1>
              <div className="max-w-3xl mx-auto space-y-4 text-lg md:text-xl text-gray-200">
                <p>
                  Der Adventskalender 2025 ist nun zu Ende! Wir möchten uns herzlich bei allen <strong className="text-mydealz-green">Teilnehmern</strong> bedanken, die fleißig die Türchen geöffnet haben.
                </p>
                <p>
                  Ein besonderer Dank geht an alle <strong className="text-mydealz-orange">Helfer und Unterstützer</strong>, die diesen Kalender möglich gemacht haben!
                </p>
                <p className="text-yellow-400 font-bold text-2xl mt-6">
                  🎁 Wir wünschen allen Gewinnern viel Freude mit ihren Preisen! 🎁
                </p>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <a
                  href="https://www.mydealz.de/deals/digitale-adventskalender-und-gewinnspiele-2025-sammeldeal-2687053"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-mydealz-green hover:bg-[#1e8a00] text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Zum mydealz Deal
                </a>
                <button
                  onClick={() => {
                    const kalenderSektion = document.getElementById('kalender-sektion');
                    kalenderSektion?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="bg-mydealz-orange hover:bg-[#e67700] text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                >
                  Noch laufende Kalender ansehen
                </button>
              </div>
            </div>

            {/* Gewinner Sektion */}
            <div className="bg-[#1e1f21] rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700">
              <div className="flex items-center justify-center gap-3 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-10 h-10 text-yellow-500"
                >
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                </svg>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Gewinner 2025
                </h2>
              </div>

              {gewinnerLoading || gewinner.length === 0 ? (
                <div className="text-center py-12">
                  {gewinnerLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mydealz-green border-t-transparent mb-4"></div>
                      <p className="text-lg text-gray-300 font-semibold">
                        Gewinner werden geladen...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl mb-4">🎁</div>
                      <p className="text-xl text-gray-300 font-semibold">
                        Noch keine Gewinner eingetragen
                      </p>
                    </>
                  )}
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
            </div>

            {/* Kalender die nach dem 24.12. noch laufen */}
            {data.length > 0 && (
              <div className="mt-8" id="kalender-sektion">
                <div className="bg-[#1e1f21] rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    📅 Kalender die noch laufen
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Diese Adventskalender sind auch nach Heiligabend noch aktiv!
                  </p>
                  
                  {favoriteItems.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6 text-[#f97778]"
                          >
                            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                          </svg>
                          Favoriten
                        </h3>
                        <span className="bg-[#f97778] text-white text-sm font-bold px-3 py-1 rounded-full">
                          {favoriteItems.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
                        {favoriteItems.map((item) => (
                          <div key={item.name} className="group">
                            <div className={`bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border-2 ${visited.has(item.name) ? 'border-blue-500/50' : 'border-[#f97778]'} relative h-full flex flex-col`}>
                              {visited.has(item.name) && (
                                <div className="absolute top-2 right-2 z-10">
                                  <span className="bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                                    Besucht
                                  </span>
                                </div>
                              )}
                              <div className="p-5 flex flex-col grow">
                                <div className="text-center mb-4">
                                  <div className="bg-[#f97778] text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shadow-md mx-auto">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="w-8 h-8"
                                    >
                                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                                    </svg>
                                  </div>
                                </div>
                                {item.kategorie && (
                                  <div className="text-center mb-3">
                                    <span className="inline-block bg-[#1e1f21] text-gray-300 text-xs font-semibold px-3 py-1 rounded-full border border-gray-600">
                                      {item.kategorie}
                                    </span>
                                  </div>
                                )}
                                <h3 className="text-center text-white font-semibold text-sm mb-4 min-h-10 line-clamp-2 grow">
                                  {item.name}
                                </h3>
                                <div className="space-y-2">
                                  <a
                                    href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => markAsVisited(item.name)}
                                    className="w-full bg-mydealz-green hover:bg-[#1e8a00] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg block text-center"
                                  >
                                    Öffnen
                                  </a>
                                  <button
                                    onClick={() => toggleFavorite(item.name)}
                                    className="w-full bg-[#1e1f21] hover:bg-[#2d2d2d] text-[#f97778] font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm border border-[#f97778]"
                                  >
                                    Aus Favoriten
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {normalItems.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        Alle Kalender
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
                        {normalItems.map((item, index) => (
                          <div key={index} className="group">
                            <div className={`bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border relative h-full flex flex-col ${
                              visited.has(item.name) ? 'border-2 border-blue-500/50' : 'border border-gray-700/50'
                            }`}>
                              {visited.has(item.name) && (
                                <div className="absolute top-2 right-2 z-10">
                                  <span className="inline-flex items-center gap-1 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                    </svg>
                                    Besucht
                                  </span>
                                </div>
                              )}
                              <div className="p-5 flex flex-col grow">
                                <div className="text-center mb-4">
                                  <div className="bg-mydealz-orange text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shadow-md mx-auto">
                                    {favoriteItems.length + index + 1}
                                  </div>
                                </div>
                                {item.kategorie && (
                                  <div className="text-center mb-3">
                                    <span className="inline-block bg-[#1e1f21] text-gray-300 text-xs font-semibold px-3 py-1 rounded-full border border-gray-600">
                                      {item.kategorie}
                                    </span>
                                  </div>
                                )}
                                <h3 className="text-center text-white font-semibold text-sm mb-4 min-h-10 line-clamp-2 grow">
                                  {item.name}
                                </h3>
                                <div className="space-y-2">
                                  <a
                                    href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => markAsVisited(item.name)}
                                    className="w-full bg-mydealz-green hover:bg-[#1e8a00] text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg block text-center"
                                  >
                                    Öffnen
                                  </a>
                                  <button
                                    onClick={() => toggleFavorite(item.name)}
                                    className="w-full bg-[#1e1f21] hover:bg-[#2d2d2d] text-gray-300 hover:text-[#f97778] font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm border border-gray-600 hover:border-[#f97778] cursor-pointer"
                                  >
                                    Zu Favoriten
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
        {/* Alte Header-Sektion entfernt - jetzt oben im Header */}

        {data.length === 0 ? (
          <div className="text-center py-16 bg-[#1e1f21] rounded-2xl shadow-md border border-gray-700">
            <div className="text-8xl mb-4">🎅</div>
            <p className="text-2xl text-gray-300 font-semibold">
              Noch keine Türchen verfügbar
            </p>
          </div>
        ) : (
          <>
            {/* Favoriten Sektion */}
            {favoriteItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-7 h-7 text-[#f97778]"
                    >
                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                    Meine Favoriten
                  </h2>
                  <span className="bg-[#f97778] text-white text-sm font-bold px-3 py-1 rounded-full">
                    {favoriteItems.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
                  {favoriteItems.map((item) => (
                    <div key={item.name} className="group">
                      {/* Favoriten Kachel */}
                      <div className={`bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border-2 ${visited.has(item.name) ? 'border-blue-500/50' : 'border-[#f97778]'} relative h-full flex flex-col`}>
                        {/* Besucht Badge - wenn Türchen heute geöffnet wurde */}
                        {visited.has(item.name) && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                              Besucht
                            </span>
                          </div>
                        )}
                        <div className="p-5 flex flex-col grow">
                          {/* Favoriten Badge */}
                          <div className="text-center mb-4">
                            <div className="bg-[#f97778] text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shadow-md mx-auto">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-8 h-8"
                              >
                                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                              </svg>
                            </div>
                          </div>

                          {/* Kategorie Label */}
                          {item.kategorie && (
                            <div className="text-center mb-3">
                              <span className="inline-block bg-[#1e1f21] text-gray-300 text-xs font-semibold px-3 py-1 rounded-full border border-gray-600">
                                {item.kategorie}
                              </span>
                            </div>
                          )}

                          {/* Name */}
                          <h3 className="text-center text-white font-semibold text-sm mb-4 min-h-10 line-clamp-2 grow">
                            {item.name}
                          </h3>

                          {/* Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                markAsVisited(item.name);
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
                              className="flex-1 text-white bg-[#f97778] hover:bg-[#e66667] font-semibold py-2.5 px-4 rounded-full transition duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                              aria-label="Aus Favoriten entfernen"
                              title="Aus Favoriten entfernen"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alle Türchen Sektion */}
            <div>
              {favoriteItems.length > 0 && (
                <h2 className="text-2xl font-bold text-white mb-4">
                  Alle Türchen
                </h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
                {normalItems.map((item, index) => (
              <div key={index} className="group">
                {/* hej-julian: Adventskalender-Kachel im mydealz Dark Theme */}
                {/* julian edit: Blaue Border & Badge für besuchte Türchen */}
                <div className={`bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border relative h-full flex flex-col ${
                  visited.has(item.name) ? 'border-2 border-blue-500/50' : 'border border-gray-700/50'
                }`}>
                  {/* hej-julian added: Besucht-Badge mit Häkchen */}
                  {visited.has(item.name) && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center gap-1 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        Besucht
                      </span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col grow">
                    {/* Türchen Nummer - Orange Badge */}
                    <div className="text-center mb-4">
                      <div className="bg-mydealz-orange text-white font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center shadow-md mx-auto">
                        {index + 1}
                      </div>
                    </div>

                    {/* Kategorie Label */}
                    {item.kategorie && (
                      <div className="text-center mb-3">
                        <span className="inline-block bg-[#1e1f21] text-gray-300 text-xs font-semibold px-3 py-1 rounded-full border border-gray-600">
                          {item.kategorie}
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <h3 className="text-center text-white font-semibold text-sm mb-4 min-h-10 line-clamp-2 grow">
                      {item.name}
                    </h3>

                    {/* Öffnen Button - Grün wie bei mydealz */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          markAsVisited(item.name);
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
            </div>
          </>
        )}
          </>
        )}
        
        {/* hej-julian: Footer mit mydealz-Link und Schnee-Toggle */}
        {/* julian edit: Fester Abstand zum Content */}
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
            {standDatum && (
              <p className="text-gray-500 text-xs mt-2">
                📅 Stand: {standDatum}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <button
                onClick={toggleSnow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3a3a3a] text-white rounded-lg transition duration-200 text-sm font-semibold border border-gray-600"
              >
                {showSnow ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                    Schneefall ausblenden
                  </>
                ) : (
                  <>
                    <span className="text-lg">❄️</span>
                    Schneefall einblenden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* hej-julian: Toast-Benachrichtigungen unten rechts */}
      {/* julian edit: Stacking-System - mehrere Toasts gleichzeitig möglich */}
      {/* Auto-Remove nach 5 Sekunden in showToast-Funktion */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-slide-up">
            <div className="bg-[#2d2d2d] border border-gray-700 rounded-lg shadow-2xl p-4 min-w-70">
              <p className="text-white text-sm font-semibold">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
// hej-julian: Ende der Hauptkomponente
// TODO julian: Performance-Optimierung für viele Türchen?
// TODO: Lazy Loading für Bilder wenn wir welche hinzufügen
