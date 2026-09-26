# Review zu Issue #82: Lernrunden für drei Fächer

## Umfang

- Gartenmission unverändert erhalten; Englisch (Klasse 5, erste Fremdsprache) und Natur und Technik ergänzen zusammen 54 automatisch bewertete Aufgaben in 18 Fünfschrittvarianten, verteilt auf drei Stufen.
- Startseite zeigt Themenwahl, offene Schritte und fällige Wiederholungen auf der globalen Stufe. Jede Kombination aus Thema und Stufe behält ihre eigene Runde.
- Bestehendes SQLite-Schema, Garten-IDs, Antworten, Fortschritt und Punkte bleiben erhalten. Optionale Themen-ID und fachlich korrekte Punktebuchung ergänzen die bestehenden Commands.
- README, Ablauf-/Inhaltsübersicht und Architekturdokumentation aktualisiert.

## Reviewart und Ergebnis

Unabhängiger Agentenreview durch `/root`, getrennt vom implementierenden Agenten `/root/missions`, am 26.09.2026. Geprüft wurden der Gesamtdiff gegen `main`, Akzeptanzkriterien, alle 54 neuen Fragen einschließlich Tipps/Lösungen und Mitmachaufträge, SQL-Themenfilter, Transaktionen, historische Anfragen, Punktelogik, UI-Zustände und Tests.

Nach den folgenden Korrekturen gibt es keine offenen blockierenden Befunde. Der Issueabschluss erfolgt erst nach Merge und grünen erforderlichen CI-Prüfungen.

## Befunde und Korrekturen

1. Begrüßung und Abschluss enthielten noch Gartenbezüge. Beide sind nun fachneutral; ein Natur-Abschlusstest sowie ein Englisch-Einstiegstest prüfen den neuen Ablauf.
2. Natur-Streber verwendete unnötig abstrakte Sprache („Aussage … gedeckt“, „Erde-Menge“). Die Fragen heißen nun „Was zeigen diese Messwerte?“ und „bekommen unterschiedlich viel Erde“. Auch „durch Subtrahieren“ wurde im Tipp zu „Ziehe die kleinere Höhe von der größeren ab“ vereinfacht. Messwerte, Antwortbedeutungen und Denkaufgaben bleiben erhalten.
3. Die Dokumentation nennt jetzt ausdrücklich den begrenzten Umfang der beiden Ergänzungen: 54 automatisch bewertete Aufgaben in 18 Fünfschrittvarianten. Keine vollständige Lehrplanabdeckung oder Prüfung mit Kindern behauptet.

## Prüfergebnisse

- `npm run check:all`: bestanden; 176 Frontendtests, zwei Node-Skripttests, TypeScript, Vite-Build, Prettier, Rustfmt, Clippy mit `-D warnings` und 110 Rusttests.
- Neue Persistenztests prüfen alle Themen/Stufen über vier Runden: drei Varianten und deren erneute Verwendung, nur erste richtige Lösung mit Punkten, getrennte Fälligkeiten, Themen-/Stufenwechsel, erneute Datenbankverbindung sowie alte Garten-Request-Nutzlasten und Replays.
- Ungültige Themen, geänderte Request-Nutzlasten und Aktionen aus einer anderen Stufe hinterlassen keine Buchungen. Bestehende Migrationstests von Schema 12/13, Konkurrenztests mit zwei Verbindungen und Rollbacktests bleiben aktiv.
- UI-Tests prüfen Themenwahl/Fortsetzen über die Startseite, passende Fremdsprachenmetadaten, Themenbeibehaltung beim Stufenwechsel, Fehlermeldungen, Retry, ausdrücklich neu geladenen Stand und verspätete Antworten nach Themenwechsel.
- Inhaltlich wurden alle neuen Aufgaben samt Tipp und Lösungsweg auf Verständlichkeit, eindeutige Antworten, Messgrößen/Einheiten und die Grenzen naturwissenschaftlicher Schlussfolgerungen geprüft. Quellen: LehrplanPLUS Englisch 5 (1. Fremdsprache) und Natur und Technik 5, abgerufen 26.09.2026.
- Nativer macOS-Build `npm run desktop:build -- --debug --bundles app`: bestanden. Gebündelte App als Prozess gestartet, ohne Startfehler im Terminal; anschließend gezielt beendet. Keine Lernaktionen oder Profiländerungen ausgeführt.

## Grenzen

Windows wurde lokal nicht ausgeführt; die Plattformprüfung erfolgt in CI. Der lokale native Smoke-Test prüft Build und Prozessstart, keine vollständige manuelle Bedienung aller Missionen. Die Themenabläufe sind durch Frontend-/Backendtests geprüft; eine Prüfung mit Kindern oder eine Messung des Lernerfolgs wurde nicht durchgeführt. Die Geräteuhr bestimmt lokale Wiederholungsfälligkeiten. Das Paket ist endlich; bereits gelöste stabile Aufgaben-IDs geben auch in späteren Runden keine weiteren Punkte.

## Nachprüfung nach Integration von Issue #85

Am 26.09.2026 wurde `origin/main` (Commit `0c269ac`, signierte App-Updates) in den Issue-82-Branch gemergt. Der einzige Konflikt betraf zwei am Ende von `docs/architecture.md` ergänzte Abschnitte. Beide Abschnitte wurden vollständig erhalten. `App.tsx` und `lib.rs` wurden automatisch konfliktfrei zusammengeführt; Updater-Komponente/Plugins und Missionsthemenwahl/IPC sind gemeinsam vorhanden.

Unabhängige Nachprüfung durch `/root`: Konfliktlösung, Architekturabschnitte und integriertes Routing/IPC ohne Befund. Der anschließende integrierte Lauf `npm run check:all` ist vollständig bestanden: 187 Frontendtests, fünf Node-Skripttests, 110 Rusttests sowie Formatierung, TypeScript, Vite-Build und Clippy. Der separate Bugfix-Branch für Issue #87 wurde nicht verändert.
