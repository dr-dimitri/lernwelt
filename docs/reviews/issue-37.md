# Review zu Issue #37: Englisch Klasse 5

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: `main` bei `40d0788`; Branch `codex/issue-37-englisch-klasse-5`.

## Umfang und Befunde

Gesamtdiff gegen main geprüft: separater Inhaltskatalog mit 108 Aufgaben und 24 Aktivitäten, gemeinsamer validierter Loader, paketbezogene Quellen in Topics, Anzeige und Inhaltsdokumentation. Alle Fragen, Antworten, Erklärungen, Tipps und Aktivitäten auf eindeutige Arbeitsaufträge, Altersangemessenheit und fachlichen Sinn gelesen. Die zunächst nicht eindeutige Party-Uhrzeit „at three“ wurde vor Veröffentlichung auf „3 pm“ präzisiert. Der UI-Test wurde an die tatsächliche Formulierung der Bewertungsgrenze angepasst. Keine offenen blockierenden Befunde, keine neu entdeckten Defekte im bisherigen Produktstand.

## Daten und Grenzen

Keine Datenbankmigration und keine Änderung der Punktevergabe. Die sechs historischen Englischbeispiele bleiben mit identischen IDs, Antworten und Schwierigkeiten intern vorhanden; nur neue Aufgaben werden angezeigt. Quelle/Stand kommen beim Laden aus dem jeweiligen Paket, sodass Englisch nicht fälschlich mit der Mathematikquelle beschriftet wird. Beide Pakete und der zusammengeführte Katalog werden validiert.

Eigene Inhalte mit thematischer Orientierung am offiziellen Lehrplan und öffentlich zugänglichen Klett-Verteilungsplan, keine Buchreproduktion. Die Inhaltsmatrix bezeichnet Lernbereiche und Grenzen ausdrücklich. Keine Vollständigkeitsbehauptung, keine Tondateien, keine automatische Sprach-/Freitextbewertung. Keine Verständlichkeitsprüfung mit Kindern behauptet. Alle Inhalte offline; keine neuen Abhängigkeiten.

## Prüfungen

- `npm run check:all` erfolgreich: **39 Frontend-/Spieltests, 2 Workflowtests, 34 Rusttests**, Formatierung, TypeScript/Vite, rustfmt, Clippy.
- Neue Inhaltsprüfung: zwölf Themen, alle drei Stufen, eigene Englischquelle, Fremdsprachenfolge, Aktivitäten, historische Antworten und ein unregelmäßiges Verb samt falscher Alternative.
- Bestehende Punkte-/Migrationstests prüfen auch nach Katalogwechsel 5/10/15 in beiden Fächern sowie Legacy-Replays; Mathematik-Inhaltsmatrix unverändert grün.
- UI-Test prüft Englischwechsel, Klasse und sichtbare Grenzen; `git diff --check` ohne Befund.
- Vor Merge müssen GitHub-Checks auf Frontend, macOS und Windows grün sein. Native Prüfung der gemeinsamen Englisch-/Traineransicht folgt im Trainer-Issue #38; dieser Teil ändert keine Commands oder Berechtigungen.
