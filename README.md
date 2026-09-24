# Lernwelt

Eine lokal laufende Desktop-Lernanwendung für Mathematik und Englisch am bayerischen Gymnasium.

## Technische Richtung

Tauri 2 · React · TypeScript · Vite · SQLite. Der Kernbetrieb funktioniert offline; Lernprofile und Lernfortschritt bleiben lokal. Die Lehrplanstruktur orientiert sich an [LehrplanPLUS Bayern](https://www.lehrplanplus.bayern.de/).

## Mitarbeit

Die verbindlichen Projektregeln stehen in [AGENTS.md](AGENTS.md). Jede Umsetzung benötigt ein GitHub-Issue, einen eigenen Branch, einen dokumentierten Review und einen anschließenden Merge nach `main`. Neu entdeckte Bugs werden als eigene Issues erfasst.

Projektskills: [Issue-Workflow](.agents/skills/lernwelt-issue-workflow/SKILL.md) und [Desktop-Entwicklung](.agents/skills/lernwelt-desktop/SKILL.md).

## Lokal entwickeln

Voraussetzungen: Node.js ab 22.12, npm, stabiles Rust und die [Tauri-Systemvoraussetzungen](https://v2.tauri.app/start/prerequisites/) für die jeweilige Plattform (macOS: Xcode Command Line Tools; Windows: C++ Build Tools und WebView2).

```sh
npm ci
npm run desktop:dev
```

`npm run dev` öffnet nur die Browser-Vorschau; die eigenständige Anwendung startet über `desktop:dev`.

```sh
npm run build
npm run desktop:build -- --bundles app  # macOS .app
npm run desktop:build -- --bundles nsis # Windows Installer, auf Windows ausführen
```

Native Artefakte liegen unter `src-tauri/target/release/bundle/`. Die lokale macOS-App ist noch nicht signiert oder notarisiert. Inhalte und vollständige Lehrplanabdeckung sind nicht Teil dieses technischen Grundgerüsts.
