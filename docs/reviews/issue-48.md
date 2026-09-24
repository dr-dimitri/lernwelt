# Review Issue #48: Profil nach Ladefehler erneut laden

- Datum: 24.09.2026
- Reviewer: Codex, separater Selbstreview; keine unabhängige Freigabe.
- Basis: main `6eb7e95`, eigener Branch `codex/issue-48-profil-neuladen`.

## Reproduktion und Umfang

Drei neue UI-Regressionstests scheiterten zunächst, weil nach einer fehlgeschlagenen get_profile-Abfrage keine Wiederholen-Aktion vorhanden war. Das Formular blieb im Zustand unavailable bis zum App-Neustart gesperrt. Gesamtdiff gegen main separat geprüft: ProfilePanel, gezielte Tests und dieser Reviewnachweis. Keine Persistenz-/IPC-/Punkteänderungen, keine neuen Abhängigkeiten.

## Ergebnis des Reviews

„Profil erneut laden“ erscheint nur beim fehlgeschlagenen Lesen. Die Aktion setzt sofort loading und wird ausgeblendet, sodass keine wiederholten parallelen Klicks möglich sind. Ein neuer Ladezyklus leert den alten Fehler; Eingaben und Speichern bleiben bis zum erfolgreichen Lesen gesperrt. Erfolg übernimmt den gespeicherten Namen/Jahrgang, ein bestätigtes leeres Profil setzt die bekannten Standardwerte. Bei erneutem Fehler steht Wiederholen wieder zur Verfügung. Effect-Cleanup verwirft verspätete Antworten nach Unmount. Schreibfehler bieten weiterhin Speichern an und erhalten Eingaben; sie lösen keinen destruktiven Reload aus.

Keine offenen blockierenden Befunde oder Nebenfixes. Der separat erfasste Spielsteuerungsfehler #47 wird auf eigenem Branch behoben.

## Tatsächliche Prüfungen

- Neue Tests zunächst rot, anschließend `npm run check:all` grün: 61 Frontend-/Spieltests, 2 Workflowtests und 57 Rusttests (120 insgesamt auf diesem Branch), Prettier, TypeScript/Vite, rustfmt und Clippy.
- Erfolgreicher Retry lädt vorhandenes Profil; währenddessen keine Schreibmöglichkeit; wiederholter Fehler bleibt wiederholbar; bestätigtes Nichtvorhandensein erlaubt Profilanlage; verspätete Antworten nach Unmount bleiben wirkungslos; Speicherfehler bewahrt geänderten Text.
- Bestehende Profil-/App-Tests für Save-Fehler, fehlende Desktop-Umgebung, Änderungen und Doppel-Speicherschutz weiterhin grün. `git diff --check` ohne Befund.
- CI mit Frontend-, macOS- und Windows-Checks muss vor Merge grün sein.

## Grenzen und Einordnung der Bugprüfung

Die Ladefehler wurden kontrolliert an der Desktop-Schnittstelle simuliert; keine absichtliche Beschädigung echter Nutzerdaten. Ein dauerhaft beim App-Start fehlgeschlagenes Datenbanköffnen wird damit nicht repariert: Die Ursache muss weiter behoben und die App ggf. neu gestartet werden. Der Fix ermöglicht den Retry, wenn spätere get_profile-Abfragen wieder funktionieren.

Die Praxisprüfung umfasste Antwort-/Punktepfade, Trainerzustände und Neustartschutz, UI-Lade-/Speicherfehler, Profil und Spieleingabe. Die bestehenden 117 Tests waren zu Beginn grün. Zwei konkrete Bedienungsfehler wurden getrennt erfasst und mit neuen Tests abgesichert. Dies ist kein Nachweis allgemeiner Fehlerfreiheit und keine vollständige mathematische oder sprachliche Inhaltsprüfung.
