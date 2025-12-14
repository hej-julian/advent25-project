# GitHub Labels Setup

Dieses Projekt verwendet folgende Labels für Issues:

## Issue Template Labels

- **kalender** (#24a200) - Neuer Adventskalender Vorschlag
- **neu** (#0E8A16) - Neue Einreichung
- **bug** (#d73a4a) - Etwas funktioniert nicht
- **enhancement** (#a2eeef) - Neue Funktion oder Verbesserung

## Allgemeine Labels

- **documentation** (#0075ca) - Verbesserungen zur Dokumentation
- **duplicate** (#cfd3d7) - Issue existiert bereits
- **wontfix** (#ffffff) - Wird nicht bearbeitet
- **invalid** (#e4e669) - Scheint nicht richtig zu sein
- **help wanted** (#008672) - Zusätzliche Aufmerksamkeit benötigt
- **good first issue** (#7057ff) - Gut für Newcomer

## Labels erstellen

### Manuell über GitHub:

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf "Issues" → "Labels"
3. Klicke auf "New label" für jedes Label
4. Name, Farbe (Hex-Code) und Beschreibung eintragen

### Automatisch mit Script:

Die Labels können auch automatisch aus der `labels.yml` Datei erstellt werden mit Tools wie:
- [github-label-sync](https://github.com/Financial-Times/github-label-sync)
- GitHub Actions

### Alte/ungenutzte Labels löschen:

Gehe auf GitHub zu Issues → Labels und lösche:
- `question`
- Default labels die nicht in der labels.yml stehen
- Alle anderen ungenutzten Labels
