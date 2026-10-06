# Review zu Issue #163: Buildzyklus beschleunigen

## Umfang und Reviewart

- Branch `codex/issue-163-buildzyklus` vom aktuellen `origin/main` (`e40ce78a43cbad63c9fd7185413dd06d2398919c`). Ziel und Akzeptanzkriterien: [Issue #163](https://github.com/dr-dimitri/lernwelt/issues/163).
- Cargo-Caching, getrennte PR-Metadatenprüfung, einmaliger Frontendbuild mit Commit-/Laufbindung, parallel gestartete Main-Release-Builds und gemeinsame Veröffentlichung nach allen Qualitätsprüfungen. Testdatenaufbau im Typing-Legacytest gebündelt; fünf Versionsdateien auf `0.6.16` erhöht und Dokumentation ergänzt.
- Keine Änderung an App-Fachlogik, IPC, Lerninhalten, Nutzerdatenmigrationen, Produkt-Transaktionsgrenzen oder SQLite-Synchronisation. Keine zusätzlichen App-Abhängigkeiten.
- Separater unabhängiger Agent-Review durch `/root/independent_review_163` am 06.10.2026 abgeschlossen. Dieser Reviewer hat keine Implementierungsdateien geschrieben und den Gesamtdiff gegen `origin/main`, Akzeptanzkriterien, Workflow-Verschachtelung, Fehler-/Wiederholungspfade, Artefaktbindung, Persistenz, Versionen und Dokumentation geprüft. Die nachgereichten drei `.gitignore`-Regeln sind separat nachgeprüft. Unabhängige Quellfreigabe ohne offene blockierende Befunde.

## Befunde und Korrekturen

- Der zunächst vorgeschlagene getrennte PR-Debugjob hätte die gerade erzeugten Rust-Artefakte auf einem frischen Runner erneut kompilieren müssen. Rustprüfungen und PR-Debugbuild bleiben deshalb auf demselben Desktop-Runner; dieser wartet auf das gemeinsame Frontend. Main-Releasebuilds beginnen ebenfalls nach dem Frontend und parallel zu den Desktopprüfungen.
- Die vorhandene Matrixregression erwartete die Issue-Prüfung noch im bisherigen `ci.yml`. Sie prüft nun den separaten Metadatenworkflow. Unveränderte macOS-DMG-Tests waren innerhalb der Sandbox nicht ausführbar; der vollständige lokale Lauf mit nötigen Rechten bestand anschließend ohne Teständerung.
- Artefakte benötigen SHA, Lauf-ID und vollständige Dateihashes. Abweichungen scheitern vor Änderungen an `dist` oder Buildkonfiguration. Wiederholung fehlgeschlagener nativer Jobs verwendet dieselbe Lauf-ID; die wechselnde Versuchszahl wird bewusst nicht als Identität verlangt. RC-Versionsoverrides werden beim Deaktivieren ausschließlich des CI-Frontendhooks erhalten.
- Veröffentlichung benötigt erfolgreiche Frontend-, Desktop- und Release-Buildjobs. Fehler, Abbruch, Überspringen und noch laufende Voraussetzungen geben sie nicht frei; bereits veröffentlichte Releases bleiben bei Wiederholung unverändert. Die vorhandenen Plattform-, Datei- und Signaturprüfungen bleiben aktiv.

## Ausgangsmessung und Grenzen

- [Main-Lauf vor der Änderung](https://github.com/dr-dimitri/lernwelt/actions/runs/37458126182): 22:28 Minuten. Windows-Rustprüfungen enthalten 2:19 Minuten Clippy-Kompilierung, 2:20 Minuten Test-Kompilierung und 8:14 Minuten Ausführung der 174 Tests. macOS-Testausführung: 16 Sekunden. Release-Builds wurden erst nach allen Desktopprüfungen gestartet.
- [PR-Lauf vor der Änderung](https://github.com/dr-dimitri/lernwelt/actions/runs/37458318169): 7:17 Minuten.
- Der Typing-Test schrieb bislang 324 synthetische Ausgangsdatensätze einzeln; jetzt werden dieselben INSERTs gemeinsam vor dem unveränderten Schließen/Wiederöffnen committed. Gezielter lokaler macOS-Test bestand; einmalige Testzeit 0,24 gegenüber 0,10 Sekunden. Diese Einzelmessung ist keine statistische Benchmark und belegt keine Windows-Einsparung.
- Cargo-Caches verkürzen Kompilierung, nicht Testausführung. Erste Builds können kalt sein. Tatsächliche Main-/Release-Laufzeiten und Cache-Treffer werden nach dem Merge im PR/Issue dokumentiert; vorab wird keine Beschleunigung als gemessen ausgegeben.

## Prüfungen

- Vollständiges `npm run check:rust`: Formatierung, Clippy mit `-D warnings`, 174/174 Rust-Tests sowie Bin-/Doc-Testläufe erfolgreich. Lokales Node.js 26.8.1 und Cargo/Rust 1.99.0; CI prüft weiterhin mit Node.js 24 und Rust 1.98.1.
- Vollständiges `npm run check`: Formatierung, 413/413 Frontendtests, 128/128 Skripttests einschließlich echter nativer macOS-Bundle-/DMG-Tests, TypeScript und Vitebuild erfolgreich. Log: `/private/tmp/issue163-frontend-check.log`. Gemeinsam mit `check:rust` sind sämtliche Prüfungen aus `check:all` ausgeführt.
- Realer Pack-/Restore-Smoke des vollständigen Frontendbuilds mit 779 Dateien erfolgreich. Native `desktop:build -- --debug --no-bundle` mit der daraus erzeugten CI-Konfiguration erfolgreich (29,64 Sekunden Kompilierung); kein zweiter Frontendbuild im Log. Temporäre Prüfeingaben liegen unter `/private/tmp`; produktive lokale Buildhooks sind unverändert. Log: `/private/tmp/issue163-native-build.log`.
- Unabhängig durch den Reviewer: 117/117 gezielte Node-Tests für Workflow-Gates, Artefakte, Release-/Issue-Verhalten und Versionen bestanden; Versionsprüfung, Diffprüfung und Actionlint erfolgreich. Native DMG- und Cargo-Gesamtläufe sind Root-Nachweise, keine vom unabhängigen Reviewer wiederholten Prüfungen.
- Alle fünf Versionen und Releasehinweise mit `RELEASE_BASE_SHA=e40ce78a43cbad63c9fd7185413dd06d2398919c node scripts/check-release-version.mjs` erfolgreich geprüft.
- Actionlint 1.7.12 wurde aus dem offiziellen Release temporär geladen und gegen dessen SHA-256 geprüft. Das Werkzeug kennt die bereits verwendete, inzwischen offiziell unterstützte `concurrency.queue`-Eigenschaft nicht. Mit ausschließlich dieser eng gefilterten Parsergrenze sind die übrigen Workflowprüfungen grün. Warteschlangen bleiben erhalten; maßgeblich ist zusätzlich GitHubs tatsächliche Workflowausführung.
- Keine UI- oder Laufzeitfunktion geändert; keine neue Fenster-/Bedienprüfung behauptet. Tatsächliche verschachtelte GitHub-Ausführung, Windows-Builds, Cachetreffer und Veröffentlichung bleiben bis zum PR-/Main-CI-Lauf unbestätigt.

## Abschlussstatus

Noch kein Merge und kein neuer veröffentlichter Release. Abschluss setzt unabhängigen Review, erfolgreiche lokale und GitHub-Prüfungen, automatischen Release mit sechs Dateien/zwei Manifestzielen und nachgewiesene Branchbereinigung voraus.
