# Google Sheets Next.js Projekt

Dieses Next.js-Projekt lädt Daten aus einer Google Sheets Tabelle und zeigt sie in einer responsiven Tabelle an.

## Features

- ✅ Next.js 16 mit App Router
- ✅ TailwindCSS v4
- ✅ TypeScript
- ✅ Google Sheets API v4 Integration
- ✅ Alphabetische Sortierung (A → Z)
- ✅ "Alle Links öffnen" Button
- ✅ Responsive Design

## Setup

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Google API Key konfigurieren:**
   - Erstellen Sie einen API-Key in der [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Aktivieren Sie die Google Sheets API v4
   - Kopieren Sie `.env.example` zu `.env.local`
   - Fügen Sie Ihren API-Key ein:
     ```
     GOOGLE_API_KEY=Ihr_API_Key_hier
     ```

3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

4. **Öffnen Sie [http://localhost:3000](http://localhost:3000)**

## Struktur

- `/app/api/sheet/route.ts` - API Route zum Laden der Google Sheets Daten
- `/app/page.tsx` - Hauptseite mit Tabelle und "Alle Links öffnen" Button
- `.env.local` - Umgebungsvariablen (nicht in Git)

## Verwendete Google Sheet

Die Anwendung lädt Daten aus:
https://docs.google.com/spreadsheets/d/17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU/

Spalten: NAME, LINK, STATUS

## Build

```bash
npm run build
npm start
```
