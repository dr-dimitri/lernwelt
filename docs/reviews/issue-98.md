# Review zu Issue #98: Release 0.2.2

## Umfang und Reviewart

Reviewer: Codex. Separater Selbstreview nach der Umsetzung; keine unabhängige Freigabe.

Geprüft wurden der vollständige Diff gegen `main`, die Akzeptanzkriterien von Issue #98, alle Versionsfelder, die Releasehinweise und der vorhandene Veröffentlichungsablauf. Version 0.2.2 enthält die bereits mit PR #97 gemergte Neugestaltung.

## Befunde und Korrekturen

- npm, npm-Lockdatei, Cargo, Cargo-Lockdatei und Tauri verwenden einheitlich 0.2.2. Abhängigkeiten bleiben unverändert.
- README und Releasehinweise beschreiben die neue Oberfläche und verwenden die vom Release-Skript erzeugten Installationsdateinamen.
- Produktkennung, Updater-Endpunkt, öffentlicher Signaturschlüssel und Datenhaltung bleiben unverändert. Bestehende Lernprofile und Fortschritte erhalten ihren bisherigen Speicherort.
- Der vorhandene Workflow veröffentlicht erst nach erfolgreichen Builds für Apple Silicon, Intel-Mac und Windows x64. Das Manifest enthält alle drei signierten Updatepakete.
- Keine blockierenden Befunde; keine zusätzlichen Korrekturen erforderlich. Keine privaten Signaturschlüssel oder lokalen Testkonfigurationen werden eingecheckt.

## Tatsächliche Prüfungen

- `GITHUB_REF_NAME=v0.2.2 node scripts/check-release-version.mjs`: erfolgreich.
- `npm run check:all`: erfolgreich, 202 Frontendtests, 8 Skripttests und 115 Rusttests; Formatierung, TypeScript, Vite-Build und Clippy erfolgreich.
- `npm run desktop:build -- --debug --no-bundle`: erfolgreich.
- Nativer macOS-App-Build und Start mit einer ausschließlich temporären Konfiguration und separater Test-Produktkennung: erfolgreich. Die Startseite zeigt die neue Oberfläche; der Update-Dialog bestätigt „Installierte Version: 0.2.2“. Die Testkennung schützt vorhandene Lernprofile vor Testschreibzugriffen.
- `git diff --check`: erfolgreich.

## Grenzen und Veröffentlichung

Die vorhandene Vite-Warnung zur Größe eines JavaScript-Chunks bleibt bestehen. Apple-Notarisierung und Windows-Herausgebersignatur sind nicht eingerichtet; die Updater-Signaturen werden weiterhin im Release-Workflow erzeugt.

Die plattformübergreifenden CI-Prüfungen laufen im PR. Nach ihrem erfolgreichen Abschluss und dem Merge wird `v0.2.2` auf dem gemergten `main` getaggt. Die tatsächliche Veröffentlichung, alle neun Assets und das heruntergeladene Update-Manifest werden anschließend anhand des GitHub-Releases geprüft.
