# Adventskalender 2025

Ein interaktiver Adventskalender für die mydealz Community. Die Türchen werden aus einem Google Sheet geladen und können als Favoriten markiert werden. Das Design orientiert sich am mydealz Dark Theme.

## Features

**Kalender-Funktionen:**
- Türchen mit Kategorisierung und automatischer Sortierung
- Favoriten-System (wird im Browser gespeichert)
- Besuchte Türchen werden markiert und täglich zurückgesetzt
- Gewinner-Anzeige aus separatem Google Sheet Tab
- Spezielle Ansicht am 24.12.2025 mit Danksagung

**Design & Bedienung:**
- mydealz Dark Theme mit original Farben
- Animierte Schneeflocken (kann ausgeschaltet werden)
- Toast-Benachrichtigungen für Nutzer-Aktionen
- "Alle öffnen" und "Alle Favoriten öffnen" Buttons
- Voll responsive für Desktop und Mobile

**Technischer Stack:**
- Next.js 16 mit App Router
- TailwindCSS für das Styling
- TypeScript
- Google Sheets API v4
- LocalStorage für Favoriten und Einstellungen

## Setup

## Setup

### Google API Key einrichten

1. Gehe zur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Erstelle einen neuen API-Key
3. Aktiviere die Google Sheets API v4 für dein Projekt
4. Erstelle eine `.env.local` Datei im Projekt-Root
5. Füge deine Umgebungsvariablen ein:

```env
GOOGLE_API_KEY=dein_api_key_hier
PUBLIC_SITE_URL=https://deine-domain.de
```

**Umgebungsvariablen:**
- `GOOGLE_API_KEY` - API-Key für Google Sheets Zugriff (erforderlich)
- `PUBLIC_SITE_URL` - Deine Domain für Social Share Images (optional, Fallback: vercel domain)

### Google Sheet Struktur

Das Projekt arbeitet mit zwei Tabs in einem Google Sheet:

**Haupttab für die Türchen:**
- Spalte A: Name des Türchens
- Spalte B: Link
- Spalte C: Startdatum
- Spalte D: Status (muss "aktiv" sein, damit das Türchen angezeigt wird)
- Spalte E: Kategorie

**Gewinner-Tab:**
- Spalte A: MyDealz Benutzername
- Spalte B: Kalender-Name
- Spalte C: Gewinn-Beschreibung
- Spalte D: Wert (wird automatisch als Euro formatiert)
- Spalte E: Link zu Nachweis-Bildern

Die verwendete Sheet-ID steht in den API-Dateien und kann dort angepasst werden.

### Installation und Start

```bash
# Abhängigkeiten installieren
npm install

# Development-Server starten
npm run dev
```

Die Seite läuft dann auf [http://localhost:3000](http://localhost:3000)

Für Production:
```bash
npm run build
npm start
```

## Projektstruktur

```
advent25-project/
├── app/
│   ├── api/
│   │   ├── sheet/route.ts        # API für Kalender-Daten
│   │   └── gewinner/route.ts     # API für Gewinner-Daten
│   ├── gewinner/
│   │   └── page.tsx              # Separate Gewinner-Seite
│   ├── globals.css               # Animationen und globale Styles
│   ├── layout.tsx                # Root Layout
│   └── page.tsx                  # Hauptkalender-Seite
├── public/
│   └── mydealz.svg               # mydealz Logo
├── .env.local                    # API Keys (nicht in Git!)
└── ...Config-Dateien
```

## Verwendung

**Favoriten:**
Klick auf das Herz-Icon speichert ein Türchen als Favorit. Favoriten werden in einer eigenen Sektion oben angezeigt und bleiben auch nach dem Neuladen der Seite erhalten.

**Besuchte Türchen:**
Wenn du auf "Öffnen" klickst, wird das Türchen als besucht markiert (blauer Rahmen und Badge). Diese Markierung wird jeden Tag automatisch zurückgesetzt.

**Alle Links öffnen:**
Mit dem "Alle öffnen" Button im Header kannst du alle Türchen auf einmal öffnen. Dein Browser wird dich wahrscheinlich fragen, ob du Popups erlauben möchtest.

**Gewinner anzeigen:**
Der goldene "Gewinner" Button im Banner zeigt alle Gewinner aus dem Google Sheet an.

**Schneefall:**
Im Footer kann der Schneefall an- und ausgeschaltet werden. Die Einstellung wird gespeichert.

## Technische Details

**Farben (mydealz Theme):**
```
Schwarz:        #000000  (Hintergrund)
Dunkelgrau:     #1e1f21  (Karten)
Mittelgrau:     #2d2d2d  (Hover)
Grün:           #24a200  (Call-to-Action)
Orange:         #ff6c00  (Badges)
Pink:           #f97778  (Favoriten)
Lila:           #5a3f8f  (Header)
Blau:           #3b82f6  (Besucht)
```

**LocalStorage:**
- `advent-favorites` - Gespeicherte Favoriten
- `advent-visited` - Heute besuchte Türchen
- `advent-visited-date` - Datum für den täglichen Reset
- `advent-show-snow` - Schneefall an/aus

**Sicherheit:**
Die API-Routen prüfen den Referer/Host, um unerwünschte Zugriffe zu verhindern. Im Development-Modus sind diese Checks lockerer.

## Deployment

Das Projekt kann auf allen Node.js-Hosting-Plattformen deployed werden:
- Vercel (empfohlen)
- Netlify
- Eigener Server mit Node.js

Denk daran, die Umgebungsvariable `GOOGLE_API_KEY` auf der Hosting-Plattform zu setzen.

## Bekannte Einschränkungen

- Popup-Blocker können das gleichzeitige Öffnen aller Links verhindern
- Google Sheets API hat Rate Limits (normalerweise kein Problem bei kleinen Projekten)
- LocalStorage ist auf ca. 5-10 MB pro Domain limitiert

## Credits

Erstellt für die mydealz Community im Advent 2025.
- Design basiert auf mydealz.de
- Daten werden von der Community gepflegt
- Besonderer Dank an Nik04 und alle Helfer

## Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

**Was du darfst:**
- Das Projekt für kommerzielle Zwecke nutzen
- Den Code ändern und anpassen
- Das Projekt verteilen
- Privat nutzen

**Was du beachten musst:**
- Copyright-Hinweis und Lizenztext müssen in Kopien enthalten bleiben
- Keine Gewährleistung oder Haftung durch die Autoren

Wenn du das Projekt verwendest, wäre ein Link zu diesem Repository nett:
```
https://github.com/hej-julian/advent25-project
```

## Build

```bash
npm run build
npm start
```
