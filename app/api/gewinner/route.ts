import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// hej-julian: API-Route für Gewinner-Daten aus Google Sheets
// Liest aus dem "Gewinner"-Tab des Spreadsheets
const SHEET_ID = '17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU';
const RANGE = 'A:E'; // MyDealz Name, Kalender, Gewinn, Wert, Bilder

export async function GET() {
  try {
    // Security - nur Anfragen von eigener Domain erlauben
    const headersList = await headers();
    const referer = headersList.get('referer');
    const host = headersList.get('host');
    
    // Domain-Check gegen CSRF
    if (referer && host) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return NextResponse.json(
          { error: 'Zugriff verweigert' },
          { status: 403 }
        );
      }
    } else if (!referer) {
      // Blockiere direkte API-Calls außer in Development
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) {
        return NextResponse.json(
          { error: 'Zugriff verweigert' },
          { status: 403 }
        );
      }
    }
    
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Erst Metadaten holen um "Gewinner"-Tab zu finden
    // Case-insensitive Suche nach Tab-Namen
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${apiKey}`;
    const metaResponse = await fetch(metaUrl, { cache: 'no-store' });
    
    if (!metaResponse.ok) {
      throw new Error(`Fehler beim Abrufen der Sheet-Metadaten: ${metaResponse.statusText}`);
    }

    const metaData = await metaResponse.json();
    
    // Finde die Tabelle mit dem Namen "Gewinner"
    const targetSheet = metaData.sheets?.find((sheet: { properties: { title: string } }) => 
      sheet.properties.title.toLowerCase() === 'gewinner'
    );
    
    if (!targetSheet) {
      return NextResponse.json([]); // Keine Gewinner-Tabelle gefunden, leeres Array zurückgeben
    }

    const sheetName = targetSheet.properties.title;

    // Tabellennamen URL-kodieren
    const encodedRange = encodeURIComponent(`${sheetName}!${RANGE}`);
    
    const sheetDataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${encodedRange}&fields=sheets.data.rowData.values(formattedValue,hyperlink)&key=${apiKey}`;
    
    const response = await fetch(sheetDataUrl, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    
    const sheet = data.sheets?.[0];
    const rowData = sheet?.data?.[0]?.rowData || [];

    if (rowData.length === 0) {
      return NextResponse.json([]);
    }

    // Erste Zeile als Header überspringen
    const [, ...dataRows] = rowData;
    
    const structuredData = dataRows
      .filter((row: { values?: unknown[] }) => row.values && row.values.length > 0)
      .map((row: { values?: Array<{ formattedValue?: string; hyperlink?: string }> }) => {
        const values = row.values || [];
        const mydealzName = values[0]?.formattedValue || '';
        const rawWert = values[3]?.formattedValue || '';
        
        // hej-julian: Automatische Euro-Formatierung für Zahlen
        // Wenn Wert nur eine Zahl ist, wird sie in "XX,XX €" umgewandelt
        let formattedWert = rawWert;
        if (rawWert && !rawWert.toLowerCase().includes('€') && !rawWert.toLowerCase().includes('euro')) {
          // Extrahiere Zahl aus String (mit Komma oder Punkt)
          const numMatch = rawWert.match(/[\d.,]+/);
          if (numMatch) {
            const numStr = numMatch[0].replace(',', '.'); // Komma zu Punkt für parseFloat
            const num = parseFloat(numStr);
            if (!isNaN(num)) {
              // Formatierung mit 2 Nachkommastellen und Euro-Symbol
              formattedWert = `${num.toFixed(2).replace('.', ',')} €`;
            }
          }
        }
        
        return {
          mydealzName,
          profileLink: mydealzName ? `https://www.mydealz.de/profile/${mydealzName}` : '', // Auto-generierter Profil-Link
          kalender: values[1]?.formattedValue || '',
          gewinn: values[2]?.formattedValue || '', // Was wurde gewonnen
          wert: formattedWert, // Automatisch in Euro formatiert
          bilder: values[4]?.hyperlink || values[4]?.formattedValue || '' // Nachweis-Bilder (Hyperlink bevorzugt)
        };
      })
      .filter((item: { mydealzName: string; gewinn: string }) => 
        item.mydealzName.trim() !== '' && item.gewinn.trim() !== ''
      ); // hej-julian: Nur Gewinner mit Name UND Gewinn anzeigen

    return NextResponse.json(structuredData);
  } catch (error) {
    // hej-julian: Error-Handling für Google Sheets API Fehler
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Laden der Daten' },
      { status: 500 }
    );
  }
}
// julian: Ende der Gewinner-API Route
// TODO: Caching implementieren? Gewinner ändern sich selten
