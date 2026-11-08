# AIrtistic Video Studio

Browserbasierter Videoeditor für eigene Aufnahmen. Die frühere gesperrte Präsentationsoberfläche wurde durch eine erste bearbeitbare Version ersetzt.

## Funktionen (MVP)

- Videos und Bilder lokal importieren
- Clips in der Timeline neu anordnen, entfernen und Anfang/Ende trimmen
- Individuelle Texteinblendungen pro Clip
- Eine zusätzliche Audio- oder englische Voiceover-Datei importieren
- Englische Browser-Sprachvorschau über SpeechSynthesis (nur Vorschau)
- Projekt mit Originalmedien in IndexedDB lokal speichern und wieder laden
- Video in Echtzeit als WebM mit 1280 × 720 bei 30 fps exportieren

**Wichtig:** Der Editor ist noch eine frühe Version. MP4-Export, präzise Mehrspur-Audiobearbeitung, echte KI-Sprachgenerierung, umfassende Übergänge, Timeline-Dragging und professionelle 4K-Ausgabe fehlen noch. Die Browservorschau-Stimme wird nicht in das Video exportiert. Für den Export eine separate MP3- oder WAV-Datei importieren.

## Projekt lokal starten

Voraussetzung: Node.js >= 22.13 und pnpm 11.

```bash
pnpm install
pnpm dev
```

Im Browser: http://localhost:3000

## Build und Tests

```bash
pnpm typecheck
pnpm test
pnpm build
```

Die Funktionen und das Verhalten mit echten hochauflösenden Videos erfordern zusätzlich Browsertests. Browserunterstützung für Canvas.captureStream, MediaRecorder und die vorhandenen Mediencodecs ist Voraussetzung für den WebM-Export. Grosse Quelldateien können an Grenzen von Browser-RAM oder IndexedDB-Speicher stossen.

## Veröffentlichung

Der statische Build verwendet Next.js mit `output: "export"` und kann über Cloudflare Pages ausgeliefert werden.

- Produktionsbranch: `main`
- Build: `pnpm build`
- Ausgabe: `out`
- Node.js: >= 22.13

## MANGMI-Pocket-Max-Review

Geplanter Anwendungsfall: Eigene MANGMI-Aufnahmen, Gameplay und Latenzmessungen importieren, Clips schneiden, englische Off-Stimme als Audiodatei hinzufügen, Video exportieren und auf YouTube veröffentlichen.
