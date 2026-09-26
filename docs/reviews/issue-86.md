# Review zu Issue #86: Version 0.2.0

## Umfang und Reviewart

Versionswechsel auf 0.2.0 in npm, Tauri, Cargo und beiden Lockdateien; Installationshinweis, Release Notes und Aktualisierung des Architekturtexts zu lokalem Audio. Der Release fasst die separat umgesetzten und reviewten Issues #82, #83, #84, #85 sowie die Tippkorrektur #87 zusammen.

Unabhängiger Agentenreview durch `/root/missions` am 26.09.2026 für den Versions-/Dokumentationsdiff. Alle sechs Versionsangaben, erwarteter Tag, Artefaktnamen und öffentliche Updatekonfiguration geprüft. Nach Integration aller Features wurde der vollständige Diff gegen `main` bei `1c7ed66` einschließlich dieses Reviewdokuments erneut unabhängig geprüft; Versionsprüfung und Diffprüfung wurden wiederholt. Keine Befunde. Die Versionshinweise wurden zusätzlich gegen Aufgaben-/Audioumfang und den Paketgenerator geprüft.

Die Feature-Reviews stehen in `issue-82.md`, `issue-83.md`, `issue-84.md`, `issue-85.md` und `issue-87.md` in diesem Verzeichnis. Die abschließende Integrationsprüfung führt der Implementierer `/root` als ausdrücklich bezeichneten Selbstreview durch.

## Befunde und Korrekturen

Der bisherige allgemeine Architekturtext schloss Audio noch aus. Er beschreibt nun die gebündelten Audios und freiwilligen Hörrunden. Keine Änderung an Fachlogik, Commands, Signaturschlüssel oder Datenbankschema durch dieses Release-Issue.

## Prüfergebnisse

- Integrierter Stand basiert auf `main` bei `1c7ed66`; alle Feature-PRs sind gemergt. Der anschließende Rebase des Versionscommits änderte dessen fachlichen Umfang nicht.
- `npm run check:all` für Version 0.2.0 erfolgreich: 202 Frontendtests, fünf Node-Skripttests, 115 Rusttests, TypeScript, Vite-Build, Formatierung und Clippy mit `-D warnings`.
- `GITHUB_REF_NAME=v0.2.0 node scripts/check-release-version.mjs` erfolgreich: npm, beide npm-Lockfelder, Cargo, Cargo-Lock und Tauri konsistent; Release Notes und öffentlicher Update-Schlüssel vorhanden.
- Abschließender Selbstreview des vollständigen Versionsdiffs gegen `main`; keine zusätzlichen Commands, Abhängigkeiten oder Datenänderungen. `git diff --check` erfolgreich.
- Der Inhaltsreview zu #83 umfasst alle 615 Aufgaben mit Frage, ursprünglichem Tipp, weiteren Hilfen, Antwort und Lösungsweg. Sämtliche dort gefundenen Fehler wurden vor dem Merge korrigiert und unabhängig nachgeprüft.
- Signierter nativer macOS-Release-Build (`npm run desktop:build -- --bundles app`) erfolgreich: `.app`, `.app.tar.gz` und `.sig` erzeugt; `Info.plist` bestätigt Version 0.2.0. Echte Paketsignatur gegen den öffentlichen Schlüssel verifiziert; eine im Speicher veränderte Paketkopie wurde abgewiesen. Die native Start- und Updateprüfung des veröffentlichten Pakets folgt nach dem Tag.

## Veröffentlichung und Grenzen

Nach grünen PR-Checks und Merge wird `v0.2.0` auf `main` gesetzt. Der Release-Workflow prüft und baut macOS ARM/Intel und Windows x64, signiert Updatepakete und veröffentlicht das vollständige Manifest. Der tatsächliche Veröffentlichungslauf und die anschließende Updateprüfung werden im Issue nachgewiesen; sie können erst nach dem Tag erfolgen.

Der bestehende Vite-Hinweis zum großen JavaScript-Bundle bleibt bestehen (574,53 kB, gzip 173,47 kB); er ist keine fehlgeschlagene Prüfung.

Updater-Signaturen ersetzen keine Apple-Notarisierung oder Windows-Herausgebersignatur. Windows und Intel-Mac werden in CI gebaut, hier nicht interaktiv bedient. Bestehende Version 0.1.0 benötigt die erste Installation einer Updater-Version über das Release-Paket. Keine Prüfung mit Kindern behauptet.
