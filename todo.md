Anweisung für VSCode Chat Agent (Deutsch)

Erstelle ein neues Next.js-Projekt (App Router) mit TailwindCSS v4.
In das Projekt soll eine Seite integriert werden, die folgende Daten aus einer Google-Sheet-Tabelle lädt: NAME, LINK, STATUS.
Die Daten liegen in dieser Tabelle:
https://docs.google.com/spreadsheets/d/17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU/edit?gid=1241575332#gid=1241575332

Anforderungen:

Nutze Next.js + TailwindCSS v4 (neueste Version).
Erstelle einen API-Endpoint, der die Tabelle über die Google Sheets API lädt.
Verwende die Google Sheets API v4.
Werte die Spalten NAME, LINK, STATUS aus.
Gib die Daten als JSON zurück.
Implementiere eine Client-Komponente, die:
die Daten vom API-Endpoint abruft
alphabetisch von A → Z nach NAME sortiert
sie in einer Tailwind-Tabelle darstellt.
Füge einen Button hinzu: "Alle Links öffnen", der beim Klick alle URLs aus der LINK-Spalte in neuen Tabs öffnet.

Optische Anforderungen:
Responsive Tabelle
Tailwind v4 nutzen
Buttons schön gestalten (Tailwind: bg-blue-600 text-white rounded etc.)

Komponentenstruktur:
/app
  /api/sheet/route.ts   → lädt Google-Sheet-Daten
  /page.tsx             → zeigt Tabelle + Button

Hinweise für den Agent:

Erstelle alle nötigen Konfigurationsdateien (z.B. .env.local mit GOOGLE_API_KEY).

Nutze den Google Sheets API-Endpunkt:
https://sheets.googleapis.com/v4/spreadsheets/{sheetId}/values/{range}?key=API_KEY

Tabellen-Range: z. B. "Tabelle1!A:C" oder automatisch erkennen.
Sortierung clientseitig durchführen.
Button soll alle Links mit window.open(link, "_blank") öffnen.