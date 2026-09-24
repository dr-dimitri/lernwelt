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

## Lokale Daten

Das Lernprofil (Spitzname und Jahrgangsstufe 5–13) wird in `lernwelt.sqlite3` im Tauri-Anwendungsdatenverzeichnis `de.lernwelt.desktop` gespeichert. Auf macOS ist dies `~/Library/Application Support/de.lernwelt.desktop/`, auf Windows unter `%APPDATA%\\de.lernwelt.desktop\\`. Die Browser-Vorschau zeigt einen Hinweis statt Speicherung zu simulieren.

Die Datenbank enthält außerdem eine Grundlage für fach- und kompetenzbezogenen Lernfortschritt. Noch sind keine Übungen angeschlossen. Änderungen am Profil erhalten vorhandenen Fortschritt. Für eine manuelle Sicherung die App vollständig beenden und die Datenbankdatei kopieren; es gibt noch keinen integrierten Export und keine Synchronisierung.

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

## Qualität prüfen

```sh
npm run check:all       # Formatierung, Frontend-Tests, TypeScript, Build, Rust-Checks und -Tests
npm run test:watch      # Frontend-Tests während der Entwicklung
npm run format         # Frontend- und Konfigurationsformatierung anwenden
```

Rust-Prüfungen benötigen `rustfmt` und `clippy`. In CI wird Rust 1.98.1 mit Node.js 24 verwendet. GitHub Actions prüft Pull Requests auf macOS und Windows und erstellt native Debug-Programme als kurzlebige Prüfartefakte. Diese sind keine signierten Installer. `npm run desktop:build` baut lokal ein Release-Artefakt.

Der CI-Workflow kontrolliert bei Pull Requests den Issue-Branch, die passende `Closes #…`-Verknüpfung und die Reviewdatei. Das ersetzt nicht den inhaltlichen Review. Branch Protection ist nicht automatisch eingerichtet.

Details: [Architektur](docs/architecture.md), [Reviewnachweise](docs/reviews/).
