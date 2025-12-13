import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const SHEET_ID = '17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU';
const RANGE = 'A:E'; // MyDealz Name, Kalender, Gewinn, Wert, Bilder

export async function GET() {
  try {
    // Überprüfe ob die Anfrage von der eigenen Domain kommt
    const headersList = await headers();
    const referer = headersList.get('referer');
    const host = headersList.get('host');
    
    // Erlaube nur Anfragen von der eigenen Domain oder localhost
    if (referer && host) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return NextResponse.json(
          { error: 'Zugriff verweigert' },
          { status: 403 }
        );
      }
    } else if (!referer) {
      // Blockiere direkte API-Aufrufe ohne Referer (außer in dev mode)
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

    // Metadaten abrufen um die Tabelle "Gewinner" zu finden
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
        
        // Formatiere Wert in Euro falls es eine Zahl ist
        let formattedWert = rawWert;
        if (rawWert && !rawWert.toLowerCase().includes('€') && !rawWert.toLowerCase().includes('euro')) {
          // Versuche die Zahl zu extrahieren
          const numMatch = rawWert.match(/[\d.,]+/);
          if (numMatch) {
            const numStr = numMatch[0].replace(',', '.');
            const num = parseFloat(numStr);
            if (!isNaN(num)) {
              formattedWert = `${num.toFixed(2).replace('.', ',')} €`;
            }
          }
        }
        
        return {
          mydealzName,
          profileLink: mydealzName ? `https://www.mydealz.de/profile/${mydealzName}` : '',
          kalender: values[1]?.formattedValue || '',
          gewinn: values[2]?.formattedValue || '',
          wert: formattedWert,
          bilder: values[4]?.hyperlink || values[4]?.formattedValue || ''
        };
      })
      .filter((item: { mydealzName: string }) => item.mydealzName.trim() !== '');

    return NextResponse.json(structuredData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Laden der Daten' },
      { status: 500 }
    );
  }
}
