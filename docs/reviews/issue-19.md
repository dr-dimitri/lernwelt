# Review · Issue #19

Separater Selbstreview durch Codex am 24.09.2026 gegen main 8606507; keine unabhängige Freigabe.

## Umfang und Befunde

15 Aufgaben in allen drei Stufen und drei Tätigkeiten ergänzen Vor-/Rechenzeichen, Übertragen, Tauschen bei schriftlichen Verfahren, Termaufbau und Guthaben/Schulden. Bezug: M5 1.2/1, /2, /5, offizielle Quelle am 24.09.2026 gelesen.

Im Review Rechenwege separat nachvollzogen: 2 768 459 + 1 587 684 = 4 356 143; 9 876 543 + 2 345 678 = 12 222 221; 1 204 052 − 386 728 = 817 324; 3 004 002 − 1 786 459 = 1 217 543. Überträge und Tauschen über Nullstellen stimmen mit den erklärten Zwischenständen überein. Vorzeichen bleiben an Zahlen gebunden; Rechenzeichen verbinden Zahlen/Teilterme. Klammern und Gegenzahl werden ausdrücklich erklärt. Keine blockierenden Befunde.

## Prüfungen

`npm run check:all`: alle 43 Tests sowie Format/Typen/Build/rustfmt/Clippy erfolgreich. Vollständiger Datenvergleich: alle 182 bestehenden Aufgaben und alle anderen Themen unverändert. Neue Auswahloptionen eindeutig, Antworten innerhalb des Eingabelimits, Stufen und Metadaten vollständig. `git diff --check` erfolgreich. Datenbank und IPC unverändert, bestehende Persistenz-/Punktetests grün.

## Grenzen

Papierrechnungen und Erklärungen werden mit Kontrollschritten statt automatischer Zeichnungs-/Spracherkennung geprüft. Keine Erprobung mit Kindern. Gesamtprüfung und übrige Teilkompetenzen in #17; Plattformchecks vor Merge abwarten.
