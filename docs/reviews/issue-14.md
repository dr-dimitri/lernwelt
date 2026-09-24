# Review · Issue #14

## Umfang und Reviewart

Separater Selbstreview durch Codex am 24.09.2026 nach der Implementierung, über den Gesamtdiff gegen `main` (Stand 0ec1a1b). Keine unabhängige Freigabe und keine Erprobung mit Kindern.

Geprüft: Arbeitsaufträge, Tipps, Lösungswege und Aktivitäten des gesamten Inhaltskatalogs, die neuen Mengenaufgaben aus #13, Regeln in AGENTS.md und Darstellung von Zeilenumbrüchen. 163 von 182 Übungsdatensätzen enthalten Textänderungen; unveränderte kurze Rechenaufträge bleiben erhalten. Die 182 Datensätze umfassen 174 sichtbare Mathematikaufgaben, sechs Englischbeispiele und zwei historische Mathematikaufgaben.

## Befunde und Korrekturen

- Abstrakte Aufträge konkretisiert: „Welche Zahl widerlegt ...“ wird beispielsweise zu „Bei welchem Zahlenpaar stimmt das nicht?“. „Löse ...“ wird zur Frage nach der passenden Zahl für x.
- Lange Sachaufgaben trennen Angaben und Frage. Mehrteilige Tätigkeiten sind als Schritte gegliedert. Fachwörter wie Betrag, Primfaktoren und Quotient bleiben erhalten und werden erklärt.
- Nach Übernahme von #13 auch Mengenaufgaben und deren Aktivitäten überarbeitet; ∈/∉ und die verwendete Konvention für ℕ/ℕ₀ direkt erläutert.
- `white-space: pre-line` zeigt diese Struktur in Aufgaben, Tipps, Erklärungen und Aktivitäten. React rendert weiterhin Text; keine HTML-Auswertung, neue Abhängigkeit oder neue Vertrauensgrenze.
- Gesamtkatalog programmatisch gegen main verglichen: alle 182 IDs, Antworten, Antworttypen, Auswahloptionen, Schwierigkeiten und Kompetenzzuordnungen identisch. Ausschließlich prompt/hint/explanation/unit geändert. Damit behalten bisherige Antworten und Punkte ihre Bedeutung. Keine Migration und keine Änderung an IPC, Antwortprüfung oder Punktevergabe.
- Mathematische Angaben und Lösungsergebnisse der umformulierten Fragen im Review gegengeprüft; keine offenen blockierenden Befunde. Fachliche Lücken des vorhandenen Lehrgangs sind im Lehrplanabgleich ausdrücklich benannt; Sprachvereinfachung schließt sie nicht.

## Prüfergebnisse

- `npm run check:all`: bestanden, 21 Frontendtests, 2 Workflowtests, 20 Rusttests (43 insgesamt), Format, TypeScript/Vite, rustfmt und Clippy ohne Fehler.
- Native Release-Testanwendung gebaut: `npm run desktop:build -- --bundles app --config /tmp/lernwelt-points-smoke.json`.
- Neu gestartete Testanwendung visuell und über Accessibility geprüft: Mengenfrage mit getrennter Ausgangslage/Frage, mehrzeilige Erklärung und nummerierte Sticker-/Sortieraufträge korrekt lesbar. Bestehendes isoliertes Profil, 30 verfügbare/50 insgesamt verdiente Punkte, Sternabzeichen und gelöste Aufgaben bleiben erhalten. Keine echten Profildaten für Testantworten verwendet.
- Diff auf unbeabsichtigte Dateien, Datenänderungen und Formatfehler geprüft. CI-Prüfungen für den PR müssen vor Merge grün sein.

## Grenzen

Die Formulierungen wurden redaktionell geprüft, nicht mit einer Kindergruppe evaluiert. Schwierige Fachinhalte benötigen weiterhin Übung und gelegentlich Hilfe. Die 39-zeilige Kompetenzmatrix in `docs/curriculum-math-5.md` benennt verbleibende Inhaltslücken; es besteht weiterhin keine vollständige Lehrplanabdeckung.
