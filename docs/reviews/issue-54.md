# Review zu Issue #54: Quadratzahlen in 20er-Runden

## Umfang und Reviewart

Separater **Selbstreview durch Codex** am 24.09.2026 nach der Umsetzung; keine unabhängige Freigabe. Vollständigen Diff gegen `main`, Issue-Akzeptanzkriterien, Migration 010, Rust-Antwortpfade, typisierte UI-Rundenanzeige und Tests geprüft.

## Ergebnis und geprüfte Risiken

Keine offenen blockierenden Befunde. Jede neue Runde wählt fünf unterschiedliche Faktoren aus 1–25, verwendet jeden viermal und mischt alle 20 Aufgaben. SQLite speichert den vollständigen Plan; Moduswechsel, erneutes Öffnen und paralleles Laden ändern ihn nicht. Die nächste Runde wird neu ausgewählt; Überschneidungen sind erlaubt.

Antwort, Punkt und eventuell nächste Runde liegen in derselben Immediate-Transaktion. Tests erzwingen einen Fehler nach mehreren Inserts der nächsten Runde und prüfen vollständiges Rollback einschließlich Punkt, Antwort und Aufgabenplan. Ungültige bzw. vorauseilende Versuche ändern keinen Fortschritt. Identische Wiederholungen vergeben keinen zusätzlichen Punkt.

Migration 010 erhält Antworten, Punkte und Profil. Alte v1-Antworten bleiben reproduzierbar; neue Runden starten unabhängig von der historischen Versuchsequenz bei Runde 1. Backend-Metadaten verhindern eine falsche Rundenanzeige nach dem Update. Die Rückmeldung zu Aufgabe 20 zeigt weiterhin die abgeschlossene Runde bis zum Weitergehen. Das 100er-Einmaleins und +1 pro korrektem Versuch bleiben erhalten.

## Nachbesserungen im Implementierungs- und Reviewdurchgang

- Bestehende Migrationserwartung auf Schema 10 aktualisiert.
- Parallelitätstest synchronisiert beide Clients auch nach dem Laden, damit er tatsächlich dieselbe angezeigte Aufgabe zweimal überträgt.
- Rollback-Test um die Anzahl gespeicherter Aufgaben ergänzt; obsolete Quadratzahlenzweige aus dem Einmaleins-Abdeckungstest entfernt.
- Erklärung der fünf Aufgaben oberhalb der Aufgabenkarte platziert; neue Rundenanzeige mit einer von der Rundennummer abweichenden historischen Sequenz getestet.

Dies waren Vervollständigungen der laufenden Umsetzung/Testfälle, keine neu entdeckten Defekte des bestehenden Produktstands.

## Prüfungen

- `npm run check:all`: erfolgreich; 71 Frontendtests, 2 Workflowtests, 61 Rusttests, Formatprüfung, TypeScript, Vite-Build und Clippy.
- Nach den Review-Nachbesserungen: `npm run check:rust` erneut erfolgreich (61 Tests).
- Drei vollständige Quadratzahlenrunden mit je 20 Aufgaben und erneutem Öffnen der Datenbank vor jeder Aufgabe; je fünf Faktoren mit vier Vorkommen sowie korrekte Punkte und Replay-Verhalten geprüft.
- Migration mit 27 historischen Quadratzahlenantworten und altem Guthaben, fehlgeschlagene Migration sowie parallele Verbindungen geprüft.
- Nativer macOS-Release-Build und Starttest mit isolierter App-ID `de.lernwelt.points-smoketest`: alter Teststand bleibt erhalten, Runde 1 / Aufgabe 1 von 20, 25 × 25 korrekt mit 625 beantwortet, Guthaben 35 → 36, nächste Aufgabe 10 × 10 / Aufgabe 2 von 20 bleibt nach vollständigem App-Neustart erhalten. Erklärung und Rundenanzeige visuell geprüft.
- `git diff --check`: erfolgreich.

## Grenzen

Zufällige Auswahl garantiert keine vollständige Abdeckung aller 25 Quadratzahlen innerhalb einer festen Anzahl von Runden. Gleiche Aufgaben dürfen direkt nacheinander erscheinen und in späteren Runden wiederkommen. Noch nicht gesendete Eingaben aus der alten Version werden nicht übernommen. Windows-Oberfläche lokal nicht manuell geprüft; Windows- und macOS-CI müssen vor Merge erfolgreich sein. Der UI-Starttest nutzt ein separates Testprofil, keine regulären Lernfortschritte.
