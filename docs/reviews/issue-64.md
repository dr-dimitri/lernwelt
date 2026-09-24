# Review zu Issue #64

## Umfang

Nach Escape oder „Schließen“ blieb der Rückmeldungsdialog bei einer erneuten Prüfung derselben Antwort geschlossen. `LearningPanel` entfernt jetzt vor jedem neuen Prüfversuch die vorherige Rückmeldung. Nach Bestätigung öffnet sich die neue Rückmeldung wieder. Fachlogik, Eingabe, Request-ID und Punktebuchung bleiben unverändert.

## Reproduktion und Prüfung

- Chromium-Repro mit isoliertem Desktop-Testadapter auf ursprünglichem `main`: zwei bestätigte Prüfaufrufe, null sichtbare Rückmeldungsdialoge nach dem zweiten Versuch.
- Vier Regressionvarianten (richtig/falsch × Escape/Schließen) scheiterten vor dem Fix jeweils an der fehlenden zweiten Rückmeldung.
- Nach dem Fix bestehen dieselben Tests. Ein unverwandtes Rerender öffnet eine geschlossene Rückmeldung weiterhin nicht von selbst.
- Chromium-Repro nach Fix: zwei bestätigte Prüfaufrufe und ein sichtbarer Rückmeldungsdialog.
- `npm run check`: Formatierung, 91 Frontend-Tests, 2 Workflow-Tests, TypeScript und Build erfolgreich.
- `npm run check:all` vor der Änderung als Bestandsprüfung erfolgreich, einschließlich 63 Rust-Tests. Keine Backendänderung.
- `git diff --check`: erfolgreich.

## Reviewart, Befunde und Korrekturen

Separater unabhängiger Agentenreview durch `audit_arcade` nach der Implementierung über den Gesamtdiff gegen `origin/main`. Akzeptanzkriterien, richtige/falsche Antworten, Schließwege, unverwandte Neurenderings, Eingaben, Fehler-/Retry-Pfad und unveränderte Punkte-/Persistenzlogik geprüft. Der Reviewer führte 21 LearningPanel-/InfoPanel-Tests sowie den Chromium-Repro selbst erfolgreich aus.

Keine offenen Befunde, keine weiteren Korrekturen aus dem Review erforderlich. Keine pauschale Fehlerfreiheit der Anwendung behauptet.

## Grenzen

Der Browserablauf verwendete isolierte Testdaten und änderte keine Nutzerprofile. Keine zusätzliche manuelle native Windows-Prüfung; macOS-/Windows-Builds laufen vor dem Merge in der PR-CI. Die bestehenden Regressionstests sichern Speicherfehler und dieselbe Request-ID beim Retry weiterhin ab.
