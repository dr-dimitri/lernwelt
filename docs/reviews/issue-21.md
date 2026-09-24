# Review · Issue #21

Separater Selbstreview durch Codex am 24.09.2026 gegen main 8606507. Keine unabhängige oder pädagogische Freigabe.

## Umfang und Befunde

84 neue Aufgaben: sieben ergänzende Stränge in drei Stufen und die gesamte Reihe 0² bis 20² in drei Aufgabenformen. Sieben angeleitete Tätigkeiten ergänzen schriftliche Verfahren, Eindeutigkeit der Primfaktoren, Zählprinzip, Vorzeichen, Quadratzahlen und Zehnerpotenzen. Bezug: M5 3.1/1–4, /6; Quelle am 24.09.2026 gelesen.

Nach der Implementierung Ergebnisse und Begründungen separat geprüft: Division mit Nullstelle 3 672 : 12 = 306; 28 782 : 123 = 234 mit Resten 41 und 49; 406 × 205 = 83 230. Faktorisierungen stimmen einschließlich Vielfachheiten und Ausschluss der 1 als Primzahl. Beim Zählprinzip ungleich verzweigte Auswahl von gleicher Verzweigung pro Stufe unterschieden; Sitzordnungen sind 3×2×1, nicht 3³. Vorzeichen über fortgesetztes Muster, Distributivgesetz und Umkehraufgaben altersgemäß erklärt; Division durch 0 ausgeschlossen. Alle 21 Quadratzahlen je Stufe vollständig; Rückwärtsfragen ausdrücklich nur nach Zahlen ab 0, daher keine Mehrdeutigkeit mit negativen Wurzeln. Keine blockierenden Befunde.

## Prüfungen

`npm run check:all` bestanden: 43 Tests plus Format/Typen/Build/rustfmt/Clippy. Alle 182 bisherigen Aufgaben und fremden Themen unverändert. Neue IDs, Antwortlängen, Auswahloptionen und Metadaten geprüft; vollständige Quadratzahl-Antwortreihe nachgerechnet. `git diff --check` bestanden. Persistenz-/Punktetests grün, keine Änderungen an Datenbank oder IPC.

## Grenzen

Feste Reihe statt adaptivem Wiederholungssystem; bearbeitete Aufgaben beweisen keine dauerhafte Automatisierung. Eigene Zeichnungen/Erklärungen werden per Selbstkontrolle geprüft. Gesamtmatrix und übergreifende Integrationstests folgen in #17. Plattformchecks vor Merge abwarten.
