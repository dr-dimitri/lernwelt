# Review · Issue #20

Separater Selbstreview durch Codex am 24.09.2026 gegen main 8606507, keine unabhängige Freigabe.

## Umfang und Befunde

27 Aufgaben in drei Stufen, Erklärung und vier Tätigkeiten ergänzen Kurzschreibweisen, Punkt-/Geraden-/Kreislagen, kombinierte Abstandsbedingungen, Vierecke im Umfeld und Kopfgeometrie (M5 2/1–3, /5; offizielle Quelle erneut gelesen).

Im Review alle Lagen einschließlich gleicher Geraden/Kreise, konzentrischer Kreise, innerer und äußerer Berührung geprüft. Die Kreislinie wird von der Kreisscheibe unterschieden. Bei 5/2 cm Radien ergeben Mittelpunktabstände 3 cm eine innere Berührung und 2 cm keinen gemeinsamen Punkt. Die Bankbedingung schließt beide Straßenseiten ein und verwendet „mindestens“/„bis“ einschließlich Rand. Die Beispiele benötigen weder Satz des Pythagoras noch spätere Kreisformeln. Kurzschreibweisen ausdrücklich als verwendete Konvention erläutert. Viereck-Eigenschaften bleiben beim Drehen erhalten; das inklusive Trapezverständnis bleibt konsistent. Keine blockierenden Befunde.

## Prüfungen

`npm run check:all`: 43 Tests und sämtliche Format-/Typ-/Build-/Rustprüfungen erfolgreich. Alle 182 bisherigen Aufgaben und fremden Themen unverändert; neue Auswahloptionen, IDs, Antwortlimits und Metadaten geprüft. `git diff --check` ohne Befund. Keine Datenbank-/IPC-/Abhängigkeitsänderung.

## Grenzen

Konstruktionen, Argumente und offene Ortsbereiche werden auf Papier mit Kriterien geprüft. Keine automatische Zeichenbewertung oder pädagogische Erprobung behauptet. Gesamtmatrix in #17; Plattformchecks müssen vor Merge grün sein.
