# Review zu Issue #100: Gezielte Lehrplanthemen

- Datum: 02.10.2026
- Issue: https://github.com/dr-dimitri/lernwelt/issues/100
- Branch: `codex/issue-100-themenkatalog`
- Reviewer: Codex
- Reviewart: **Separater Selbstreview** nach Umsetzung des Gesamtdiffs gegen `main`; keine unabhängige Freigabe.

## Umfang

Antwortfreier, offline gebündelter und in Rust validierter Themenkatalog mit 17 Lernbereichen, 69 Unterthemen und genau einer Zuordnung für jede der 615 bestehenden sichtbaren Fachaufgaben. Fach, Klasse 5, Lehrplanbezug, erste Fremdsprache bei Englisch, Quellenstand, Lernziel, Suchbegriffe und zusätzliche Angebote sind ausdrücklich modelliert. Alle bisherigen Aufgaben, Antworten, Kompetenzen, Datenbankmigrationen und Buchungen bleiben unverändert.

Geprüft wurden Fach → Bereich → Unterthema, direkte Suche und Leerzustand, sechs Aufgaben je freiwilliger Runde, Rundenende und erneutes Üben, Themen-/Stufenwechsel, Speicherfehler, Tastaturfokus, Lernrundenlinks und der Quadratzahlmodus im vorhandenen Trainer. Keine neuen Dependencies, Commands, Cloud-Dienste oder Datenmigrationen.

## Befunde und Korrekturen

- Bei der Rückkehr aus einer Runde ging der Fokus zunächst verloren. Die neue Übersicht erhält jetzt ausdrücklich den Überschriftenfokus; der Nutzerablauftest prüft dies.
- Die erste Rundenfortsetzung kombinierte einen Offset mit einer neu sortierten Liste offener Aufgaben. Dadurch konnten offene Aufgaben ausgelassen werden. Neue Runden beginnen bei noch offenen Aufgaben; nur vollständig gelöste Banken verwenden den Offset für freiwillige Wiederholung.
- Nach dem Wiederladen eines bestätigten, vorher durch Transportfehler verdeckten Stufenwechsels werden unpassende Runden-IDs ersetzt und alte Eingaben geleert. Ein nicht bestätigter Wechsel erhält bisherige Eingaben.
- Die bestehende Vollständigkeitsmeldung bezog sich ursprünglich auf alle Aufgaben eines Themas. Kurze Runden verwenden jetzt eine begrenzte Rückmeldung und behaupten keine vollständige Stufenbeherrschung.
- Eine Runde mit nur einer vorhandenen Aufgabe erlaubt ebenfalls freiwilliges Überspringen und Beenden.
- Die Desktop-Katalogansicht zeigte die Stufen anfangs unnötig untereinander. Sie stehen bei ausreichender Breite nebeneinander; kleine Fenster behalten den vertikalen Fallback.
- Beim Trainer wird das optionale Startziel nur übergeben, wenn tatsächlich vorhanden. Der bisherige unparametrisierte Abruf bleibt bestehen.

Dies waren Korrekturen innerhalb der laufenden Implementierung; keine reproduzierbaren separaten Bugs im bestehenden Produktstand wurden festgestellt.

## Prüfungen

- `npm run check:all`: Formatierung, vollständige Frontend-/Skripttests, TypeScript, Produktionsbuild, Rustfmt, Clippy und Rust-Tests. Erfolgreich: 207 Frontendtests, 8 Skripttests und 117 Rust-Tests (332 insgesamt).
- Neue Ablauftests: Bereich/Unterthema, Synonymsuche/Leerzustand, Rundenende mit übersprungenen Aufgaben, Request-Retry ohne neue Request-ID, bestätigter Stufenwechsel, konkreter Angebotslink und Fokusrückgabe.
- Rust-Prüfungen: fehlende/doppelte Zuordnungen, fachfremde Aufgaben, unzulässige Quellen/Links und antwortfreie Projektion.
- Isolierte Browser-Prüfseite mit vollständigen gebündelten Fachinhalten und Mock-Persistenz: mathematische Bereiche, Längenrunde, konkrete Englischsuche sowie Fensterbreiten 360 und 1100 CSS-Pixel. Bei 360 Pixeln entsprach die Dokumentbreite der Fensterbreite; kein horizontaler Seitenüberlauf. Überschriften- und Übungsfokus sichtbar geprüft. Temporäre Prüfdateien wurden entfernt; echte Lerndaten wurden nicht verändert.
- `npm run desktop:build -- --debug --no-bundle`: erfolgreich; macOS-/Windows-Builds zusätzlich über PR-CI.
- `git diff --check`: erfolgreich.

## Grenzen

Die Runde selbst wird nicht gespeichert; bestätigte Antworten und Punkte bleiben persistent. Der erste Katalog ordnet die bestehende begrenzte Übungsbank. Dünn besetzte Unterthemen und Stufen ohne Aufgaben sind sichtbar; der Ausbau folgt separat in Issue #101. Die Quellenzuordnung ist keine Beherrschungsdiagnose oder fachpädagogische Zertifizierung. Keine empirische Prüfung mit Kindern, keine unabhängige Reviewfreigabe und keine manuelle Windows-Startprüfung. Der bestehende JavaScript-Chunk-Hinweis bleibt bestehen.

## Abschluss

Keine offenen blockierenden Reviewbefunde. Merge erst nach erfolgreichen Projektprüfungen und grüner PR-CI.
