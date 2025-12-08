import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const SHEET_ID = '17kkvJCb9Bu_7WzPVAogoR4FKFHP5OSFuwVSmnNrICKU';
const TARGET_GID = '1241575332'; // Die spezifische Tabelle die wir brauchen
const RANGE = 'A:G'; // NAME, LINK, STARTDATUM, STATUS, KATEGORIE Spalten

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

    // Metadaten abrufen um den Namen der Tabelle mit der GID zu finden
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${apiKey}`;
    const metaResponse = await fetch(metaUrl, { cache: 'no-store' });
    
    if (!metaResponse.ok) {
      throw new Error(`Fehler beim Abrufen der Sheet-Metadaten: ${metaResponse.statusText}`);
    }

    const metaData = await metaResponse.json();
    
    // Finde die Tabelle mit der spezifischen GID
    const targetSheet = metaData.sheets?.find((sheet: { properties: { sheetId: number; title: string } }) => 
      sheet.properties.sheetId.toString() === TARGET_GID
    );
    
    if (!targetSheet) {
      throw new Error(`Tabelle mit GID ${TARGET_GID} nicht gefunden`);
    }

    const sheetName = targetSheet.properties.title;

    // Tabellennamen URL-kodieren
    const encodedRange = encodeURIComponent(`${sheetName}!${RANGE}`);
    
    // WICHTIG: valueRenderOption=FORMULA um Hyperlinks zu bekommen
    // und dann auch mit fields=sheets.data.rowData.values um die tatsächlichen Hyperlinks zu bekommen
    const sheetDataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${encodedRange}&fields=sheets.data.rowData.values(formattedValue,hyperlink)&key=${apiKey}`;
    
    const response = await fetch(sheetDataUrl, {
      cache: 'no-store' // Cache komplett deaktivieren
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Google Sheet nicht gefunden. Bitte stelle sicher, dass das Sheet öffentlich freigegeben ist (Jeder mit dem Link kann ansehen).');
      }
      
      throw new Error(`Google Sheets API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Neue Datenstruktur mit Hyperlinks
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
        return {
          name: values[0]?.formattedValue || '',
          // Versuche zuerst hyperlink, dann formattedValue
          link: values[1]?.hyperlink || values[1]?.formattedValue || '',
          startdatum: values[2]?.formattedValue || '',
          status: values[3]?.formattedValue || '',
          added: values[4]?.formattedValue || '',
          note: values[5]?.formattedValue || '',
          kategorie: values[6]?.formattedValue || ''
        };
      });

    return NextResponse.json(structuredData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Laden der Daten' },
      { status: 500 }
    );
  }
}
