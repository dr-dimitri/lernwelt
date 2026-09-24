# Review Issue #47: Spieltasten per Tastatur

- Datum: 24.09.2026
- Reviewer: Codex, separater Selbstreview; keine unabhängige Freigabe.
- Basis: main `6eb7e95`, eigener Branch `codex/issue-47-spieltasten`.

## Reproduktion und Umfang

Vor dem Fix schlugen zwei Regressionstests fehl: Nach Enter/Leertaste auf der fokussierten Links-Taste blieb die gezeichnete Raumschiffposition bei 305. Die Engine wertet Bewegungen im Frame über gehaltene Aktionen aus; der bisherige Keyboard-Click rief nur die Einmalaktion auf. Gesamtdiff gegen main geprüft: ausschließlich GameStage und Tests, keine Punkte-, Inhalts- oder Datenbankänderung.

## Umsetzung und Reviewbefunde

Fokussierte Bildschirmtasten setzen bei Enter/Leertaste den gehaltenen Zustand. Wiederholte Keydown-Ereignisse lösen Einmalaktionen nicht erneut aus; Standard-Klicks der Taste werden unterdrückt. Kurze Taps und assistive Klickaktivierung geben einen auf 120 ms begrenzten Impuls, damit auch zwischen Frames eine Bewegung erfolgt. Längeres Halten endet beim Loslassen. Fokusverlust, Pause, Rundenende, Pointerabbruch und Unmount löschen gehaltene Aktionen und alle Impulstimer. P pausiert auch bei Fokus auf einem Steuerbutton. Direkte Pfeiltasten sowie Pointersteuerung bleiben erhalten.

Der separate Review ergänzte die Absicherung sehr kurzer Tastendrücke und der Pausentaste auf Steuerbuttons. Keine weiteren Bugs im geprüften Diff, keine offenen blockierenden Befunde. Der zusätzliche Profil-Ladefehler ist separat als #48 erfasst.

## Prüfungen und Grenzen

- `npm run check:all` erfolgreich während des Fixes; nach abschließenden UI-Ergänzungen `npm run check` erneut grün: 66 Frontend-/Spieltests + 2 Workflowtests. Die unveränderten 57 Rusttests, rustfmt und Clippy sind ebenfalls grün (125 Tests insgesamt).
- Beobachtbares Spielverhalten: Bewegung bei Enter/Leertaste, Beschleunigung, Loslassen/Weiter-Tabben, kurze Taps, assistive Klicks, Pause/Fokusverlust, keine Timer nach Unmount, Pointer-/Pfeiltasten, einmaliges Ablegen.
- Nativer macOS-Release-Build erfolgreich. Im isolierten Testprofil Sternenwache geöffnet, Tab-Fokus auf Links-Taste und Enter-Aktivierung durchlaufen; Runde wurde regulär abgeschlossen und gespeichert. Bewegung zusätzlich deterministisch über den tatsächlich an drawGame übergebenen Spielstand getestet. Keine zuverlässige pixelgenaue Bewegungsmessung oder manuelle Windows-Prüfung behauptet.
- `git diff --check` ohne Befund. Merge erst nach grüner Frontend-/macOS-/Windows-CI.

Keine neuen Abhängigkeiten oder Persistenzänderungen. Keine allgemeine Fehlerfreiheit aller Spiele behauptet; Review betrifft die Eingabesteuerung.
