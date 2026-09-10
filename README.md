# AIrtistic Video Studio

Desktop-Vorschau für `airtisticvideo.ch`. Die öffentliche Oberfläche zeigt die geplanten Werkzeuge, Filter und Effekte des Video-Studios. Die Bearbeitung ist für Besucherinnen und Besucher gesperrt.

## Lokal starten

Voraussetzungen: Node.js 22 oder neuer und pnpm.

```bash
pnpm install
pnpm dev
```

Danach im Browser `http://localhost:3000` öffnen.

## Prüfen und bauen

```bash
pnpm test
pnpm typecheck
pnpm build
```

Der statische Produktions-Build liegt anschliessend im Ordner `out`.

## Cloudflare Pages

- Produktionsbranch: `main`
- Build-Befehl: `pnpm build`
- Ausgabeordner: `out`
- Node.js: Version 22 oder neuer
