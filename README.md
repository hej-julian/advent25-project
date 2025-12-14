# 🎄 Adventskalender 2025

Interaktiver Adventskalender mit Google Sheets Integration im mydealz Dark Theme Design.

## ✨ Features

### Hauptfunktionen
- 🎁 **Adventskalender-Türchen** mit Kategorisierung und Sortierung
- ⭐ **Favoriten-System** mit LocalStorage-Persistierung
- 👁️ **Besuchte-Tracking** mit täglichem Reset (blauer Badge)
- 🏆 **Gewinner-Anzeige** mit separatem Google Sheet Tab
- 🎅 **Spezielle Heiligabend-Ansicht** (24.12.2025)
- ❄️ **Animierte Schneeflocken** mit Toggle-Funktion
- 📱 **Voll responsive** (Desktop & Mobile)

### UI/UX
- 🎨 **mydealz Dark Theme** (#000000, #1e1f21, #24a200)
- 🍞 **Toast-Benachrichtigungen** mit Auto-Stack
- 🔗 **"Alle öffnen"** & **"Alle Favs öffnen"** Funktionen
- 🎯 **Sticky Header** mit Navigation
- 🌟 **Hover-Effekte** und smooth Transitions

### Technologie
- ⚡ **Next.js 16** mit App Router
- 🎨 **TailwindCSS** Custom Colors
- 📝 **TypeScript** strict mode
- 🔌 **Google Sheets API v4** Integration
- 💾 **LocalStorage** für User-Präferenzen

## 🚀 Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Google API Key konfigurieren

Erstellen Sie einen API-Key in der [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Aktivieren Sie die **Google Sheets API v4**
- Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis
- Fügen Sie Ihren API-Key ein:

```env
GOOGLE_API_KEY=Ihr_API_Key_hier
```

### 3. Google Sheet einrichten

Das Projekt verwendet zwei Tabs im Google Sheet:

**Haupttab (Türchen):**
- Spalte A: Name
- Spalte B: Link
- Spalte C: Startdatum
- Spalte D: Status (muss "aktiv" sein)
- Spalte E: Kategorie

**Gewinner-Tab:**
- Spalte A: MyDealz Name
- Spalte B: Kalender
- Spalte C: Gewinn
- Spalte D: Wert (wird automatisch in Euro formatiert)
- Spalte E: Bilder/Nachweis (Link)

Sheet-ID im Code: `17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU`

### 4. Development starten

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000)

### 5. Production Build

```bash
npm run build
npm start
```

## 📂 Projektstruktur

```
advent25-project/
├── app/
│   ├── api/
│   │   ├── sheet/route.ts        # Hauptkalender API
│   │   └── gewinner/route.ts     # Gewinner API
│   ├── gewinner/
│   │   └── page.tsx              # Gewinner-Standalone-Seite
│   ├── globals.css               # Animationen & Styles
│   ├── layout.tsx                # Root Layout
│   └── page.tsx                  # Hauptkalender (1238 Zeilen)
├── public/
│   └── mydealz.svg               # mydealz Logo
├── .env.local                    # Google API Key (nicht in Git!)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Verwendung

### Favoriten hinzufügen
Klicke auf das Herz-Icon bei einem Türchen → wird in separater Favoriten-Sektion angezeigt

### Türchen als besucht markieren
Klicke auf "Öffnen" → Türchen bekommt blauen Border + "Besucht"-Badge (Reset täglich)

### Alle Links öffnen
"Alle öffnen" Button im Header → Öffnet alle Türchen in neuen Tabs (Popup-Blocker erlauben!)

### Gewinner anzeigen
Goldener "Gewinner" Button im Banner → Modal mit allen Gewinnern aus dem Google Sheet

### Schneefall ausschalten
Im Footer auf "❄️ Schneefall deaktivieren" klicken

## 🔒 Security Features

- ✅ Referer/Host-Validierung für API-Zugriffe
- ✅ CSRF-Schutz durch Domain-Check
- ✅ Development/Production-Modi unterscheiden
- ✅ Keine sensiblen Daten im Frontend

## 🎨 Farben (mydealz Theme)

```css
--black: #000000          /* Background */
--dark-gray: #1e1f21      /* Cards */
--medium-gray: #2d2d2d    /* Hover States */
--green: #24a200          /* CTA Buttons */
--orange: #ff6c00         /* Badges */
--pink: #f97778           /* Favorites */
--purple: #5a3f8f         /* Header Gradient */
--blue: #3b82f6           /* Visited Indicator */
```

## 📝 LocalStorage Keys

- `advent-favorites` - Favoriten-Liste (persistent)
- `advent-visited` - Besuchte Türchen (täglicher Reset)
- `advent-visited-date` - Datum für Reset-Check
- `advent-show-snow` - Schneefall-Präferenz

## 🎄 Spezielle Features

### Heiligabend-Modus (24.12.2025)
- Automatische Gewinner-Anzeige
- Danksagungs-Banner
- Keine Türchen-Anzeige mehr
- Direktlinks zu mydealz Deal

### Daily Reset
Besuchte Türchen werden automatisch um Mitternacht zurückgesetzt via `toDateString()` Vergleich

### Toast-System
- Max. 5 Sekunden Anzeige
- Stacking-Support (mehrere gleichzeitig)
- Debounce gegen Duplikate (React Strict Mode)

## 🚀 Deployment

Das Projekt ist deployment-ready für:
- **Vercel** (empfohlen für Next.js)
- **Netlify**
- **Custom Node.js Server** (siehe `server.js`)

Umgebungsvariablen auf der Plattform setzen:
```
GOOGLE_API_KEY=your_key_here
```

## 📊 Performance

- Lazy Loading für Türchen-Grids
- CSS-only Animationen (GPU-beschleunigt)
- Optimierte Bilder mit Next.js Image
- Client-side State Management
- No-cache für Google Sheets API (immer aktuelle Daten)

## 🐛 Bekannte Limitierungen

- Browser-Popup-Blocker kann "Alle öffnen" blockieren
- Google Sheets API Rate Limits beachten
- LocalStorage limitiert auf 5-10 MB

## 👥 Credits

Erstellt für die mydealz Community 2025
- Design: mydealz.de Farbschema
- Daten: Community-gepflegte Google Sheets
- Shoutout: Nik04 und alle Helfer

## 📄 Lizenz

Privates Projekt für mydealz Adventskalender 2025

## Build

```bash
npm run build
npm start
```
