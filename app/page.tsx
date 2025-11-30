'use client';

import { useEffect, useState } from 'react';

interface SheetData {
  name: string;
  link: string;
  startdatum: string;
  status: string;
}

export default function Home() {
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/sheet');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Daten');
        }
        const jsonData = await response.json();
        
        // Nur aktive Einträge mit Link anzeigen und alphabetisch sortieren
        const filteredData = jsonData.filter((item: SheetData) => 
          item.link && 
          item.link.trim() !== '' && 
          item.status && 
          item.status.toLowerCase() === 'aktiv'
        );
        const sortedData = filteredData.sort((a: SheetData, b: SheetData) => 
          a.name.localeCompare(b.name)
        );
        
        setData(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleOpenAllLinks = () => {
    setShowModal(false);
    
    // Methode 1: Alle Links sofort öffnen
    const links = data.filter(item => item.link).map(item => {
      let link = item.link.trim();
      // Füge https:// hinzu wenn Protokoll fehlt
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      return link;
    });
    
    // Öffne alle Links synchron - Browser kann sie nicht blockieren da direkte User-Interaktion
    links.forEach((link) => {
      window.open(link, '_blank', 'noopener,noreferrer');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-900 via-green-900 to-red-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
          <p className="text-lg text-white font-semibold">Adventskalender wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-900 via-green-900 to-red-900">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">🎄</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Fehler aufgetreten</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-linear-to-br from-red-950 via-green-950 to-red-950 relative overflow-hidden">
      {/* Modal für Popup-Hinweis */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border-4 border-yellow-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Alle Türchen öffnen</h2>
              <p className="text-gray-700 mb-6">
                Es werden jetzt <span className="font-bold text-red-600">{data.length} Tabs</span> gleichzeitig geöffnet.
              </p>
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-800">
                  ⚠️ <strong>Wichtig:</strong> Bitte erlaube Popups für diese Seite in deinem Browser, damit alle Links geöffnet werden können.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleOpenAllLinks}
                  className="flex-1 bg-linear-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 cursor-pointer"
                >
                  Jetzt öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schneeflocken-Dekoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-white text-2xl opacity-30">❄️</div>
        <div className="absolute top-20 right-20 text-white text-xl opacity-20">❄️</div>
        <div className="absolute top-40 left-1/4 text-white text-3xl opacity-25">❄️</div>
        <div className="absolute top-60 right-1/3 text-white text-2xl opacity-20">❄️</div>
        <div className="absolute bottom-20 left-1/3 text-white text-xl opacity-30">❄️</div>
        <div className="absolute bottom-40 right-1/4 text-white text-3xl opacity-25">❄️</div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">🎄</div>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-400 via-yellow-300 to-green-400 mb-2 drop-shadow-lg">
            Adventskalender 2025
          </h1>
          <p className="text-red-100 text-lg mb-6 font-light">
            ✨ {data.length} festliche Überraschungen warten auf dich ✨
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {data.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-linear-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-bold py-4 px-10 rounded-full shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 border-2 border-yellow-400 cursor-pointer"
              >
                🎁 Alle {data.length} Türchen öffnen 🎁
              </button>
            )}
            <button
              onClick={() => window.open('https://www.mydealz.de/deals/digitale-adventskalender-und-gewinnspiele-2025-sammeldeal-2687053', '_blank')}
              className="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-10 rounded-full shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 border-2 border-orange-300 cursor-pointer"
            >
              🔥 Zum MyDealz Deal
            </button>
            <button
              onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSf3ens6gbLvoT9vTzruGW6wf7NVcr-JCf3aUEzEbFpTJtX2VQ/viewform', '_blank')}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-10 rounded-full shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 border-2 border-blue-300 cursor-pointer"
            >
              ➕ Neuen Link melden
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16 bg-white/10 backdrop-blur-sm rounded-2xl">
            <div className="text-8xl mb-4">🎅</div>
            <p className="text-2xl text-white font-semibold">Noch keine Türchen verfügbar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {data.map((item, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Adventskalender Türchen */}
                <div className="bg-linear-to-br from-red-700 to-red-900 rounded-2xl shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 overflow-hidden border-4 border-yellow-600 relative">
                  {/* Glitzer-Effekt */}
                  <div className="absolute inset-0 bg-linear-to-br from-yellow-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="p-6 relative z-10">
                    {/* Türchen Nummer */}
                    <div className="text-center mb-4">
                      <div className="bg-yellow-500 text-red-900 font-black text-3xl w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300 mx-auto">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-center text-white font-bold text-sm mb-6 min-h-10 line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Öffnen Button */}
                    <button
                      onClick={() => {
                        let link = item.link.trim();
                        if (!link.startsWith('http://') && !link.startsWith('https://')) {
                          link = 'https://' + link;
                        }
                        window.open(link, '_blank');
                      }}
                      className="w-full bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-red-900 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                    >
                      🎁 Öffnen
                    </button>
                  </div>

                  {/* Sterne Dekoration */}
                  <div className="absolute top-2 right-2 text-yellow-300 text-xl opacity-70">⭐</div>
                  <div className="absolute bottom-2 left-2 text-yellow-300 text-sm opacity-50">✨</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-red-200 text-sm space-y-2">
          <p>🎅 Frohe Weihnachten & einen schönen Advent! 🎄</p>
          <p className="text-yellow-300 font-semibold">
            💝 Shoutout an <span className="text-yellow-400 font-bold">Nik04</span> von MyDealz für die tolle Sammlung! 💝
          </p>
        </div>
      </div>
    </main>
  );
}
