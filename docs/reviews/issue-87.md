# Review zu Issue #87: Tipp zu 2²

## Umfang

Ein einzelner Tipp in `src-tauri/content/curriculum-v1.json` zur Aufgabe `by.math.5.multiply.square-02.koenner.v1` wurde korrigiert. Statt „Das bedeutet 2 × 2, nicht 2 × 2.“ steht nun „2² bedeutet 2 × 2: Multipliziere 2 mit sich selbst.“

Frage, Antwort `4`, Lösungsweg, stabile ID und übrige Inhaltsfelder bleiben unverändert. Keine Änderung an Persistenz, Antwortprüfung oder Punktehistorie.

## Reviewart und Ergebnis

Unabhängiger Agentenreview durch `/root`, getrennt vom implementierenden Agenten `/root/missions`, am 26.09.2026. Der vollständige Inhaltsdiff wurde geprüft: genau eine Tippzeile, sachlich korrekt und verständlich. Keine Befunde oder offenen Blocker. Der Abschluss setzt Merge und grüne erforderliche CI-Prüfungen voraus.

## Prüfergebnisse und Grenzen

- Bestehender Test `cargo test --manifest-path src-tauri/Cargo.toml --locked content::coverage_tests::square_practice_is_complete_and_grades_forward_and_reverse_questions`: bestanden (ein Test).
- `git diff --check`: bestanden.
- Keine künstlichen Tests für die reine Textkorrektur ergänzt. Kein nativer Neuaufbau oder zusätzlicher UI-Test erforderlich, da Darstellung und Verhalten unverändert sind. Keine Verständlichkeitsprüfung mit Kindern durchgeführt.
