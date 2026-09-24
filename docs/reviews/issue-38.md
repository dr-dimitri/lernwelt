# Review zu Issue #38: Vokabeltrainer

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: `main` bei `064f5b5`; Branch `codex/issue-38-vokabeltrainer`.

## Umfang und Ergebnis

Vollständiger Diff gegen main geprüft: 120 eigene Karten mit Übersetzungen, Satzbeispielen und konsistenten Lücken; neue Rust-Fachlogik; Migration 006; zwei begrenzte Commands samt Manifest/Capability; TypeScript-Modelle, eigene Ansicht, Navigation, Styles, Tests und Dokumentation. Wortauswahl und Beispiele gelesen, keine Lehrbuchwortliste übernommen. Keine neu entdeckten Produktbugs im bisherigen Stand. Keine offenen blockierenden Befunde.

Im Selbstreview wurden die Bedienflächen an die vorhandenen großen Buttons angepasst und die Einzahl „1 Karte“ korrigiert. Der Fehlertest prüft die gesperrten Bewertungsbuttons während des Retry; der Fehlerhinweis verschwindet beim erneuten Speicherbeginn bewusst. Keine künstlichen Tests für diese Text-/Stilkorrekturen.

## Wiederholung und Datenhaltung

Fach 1 wiederholt unsichere Wörter nach 60 Sekunden. Gewusst führt nach Fach 2/3/4/5 mit 1/3/7/14 Tagen; Fach 5 bleibt nach weiterem Erfolg bei 14 Tagen. Jeder Fehler setzt in Fach 1 zurück. Fällige Karten vor neuen, ältester Termin zuerst, Themenfilter eingehalten. Neue Karten werden bei der ersten Bewertung eingeordnet. Lernstände je Schwierigkeit getrennt; globale Stufenauswahl bleibt dieselbe wie in den Lernfächern.

Nur Rust bestimmt Fach und Zeit. Bekannte Karte, passendes Thema, Profil, zulässige Stufe, erwarteter Bewertungszähler, Fälligkeit und Requestformat werden validiert. Transaktion umfasst Fortschritt und Replay-Beleg. Alte/neue doppelte Requests, veraltete Ansichten und vorzeitiges Bewerten können keine Fachsprünge bewirken. Selbsteinschätzungen erhalten keine Lernpunkte. Lösungen werden im Client zum Umdrehen mitgeliefert; das ist hier gewollt, kein Prüfungsmodus.

Migration 006 ergänzt zwei Tabellen, verändert keine bestehenden Zeilen. Alle SQL-Parameter sind gebunden. Kein neuer Netzwerk-, Datei- oder Shellzugriff, keine neuen Abhängigkeiten. Fehlgeschlagene Migration oder Bewertungsbuchung rollt vollständig zurück. UI erhält nur bestätigte Zustände, bewahrt offene Requests für Wiederholungen und verwirft veraltete Async-Ergebnisse bei Profilwechsel/Unmount.

## Prüfungen

- `npm run check:all` erfolgreich: **48 Frontend-/Spieltests, 2 Workflowtests, 43 Rusttests**, dazu Prettier, TypeScript/Vite, rustfmt und Clippy ohne Fehler.
- Backendtests: Wiederholung nach einer Minute vor neuen Karten; sichere Karte wartet; alle Aufstiege und Rückfall von Fach 5; Neustart; getrennte Stufen; Themenfilter/keine fällige Karte; Idempotenz, veraltete und vorzeitige Requests; fehlendes Profil, ungültige Eingaben; Rollback; defekte Inhaltsdaten.
- Schema-5-Fixture: Profil, globale Stufe, Lernfortschritt, historische Antwort samt Replay, Guthaben/Abzeichen und offene Spielrunde nach Migration und erneutem Öffnen erhalten. Fehlgeschlagenes Upgrade erhält Version 5 und alte Daten.
- UI-Tests: Lösung erst nach Flip, freiwillige Antwort, beide Selbsteinschätzungen, Retry mit gleicher ID, Sperre während Speicherung, drei Stufen, Themenwechsel, Abschlusszustand, fehlendes Profil, Ladefehler, veraltete Ladeantwort, Stufenfehler und Navigation zurück zur gemeinsamen Stufe.
- Nativer macOS-Release-Build erfolgreich; im isolierten Testprofil Karten aufgedeckt und mit „Noch üben“/„Gewusst“ gespeichert, Fach 1/2 und morgiger Termin sichtbar. Streber zeigt Satzlücke und eigenen leeren Fortschritt; Rückweg zu Könner erhält dessen Fächer. Vorhandene 40 Lernpunkte, 100 insgesamt verdiente Punkte und Abzeichen erhalten.
- Nach Ablauf der Minute erschien „hallo“ erneut als Wiederholung aus Fach 1 vor den verbleibenden 117 neuen Karten. Nach vollständigem Beenden und Neustart blieben zwei Karten in Fach 1, eine in Fach 2 sowie der fällige Wiederholungsaufruf erhalten.
- Bereits für Issue #37 im nativen Testprofil geprüft: zwölf Englischthemen sichtbar, neue Könner-Antwort „are“ korrekt mit +10 Punkten gebucht.
- `git diff --check` ohne Befund. GitHub-CI muss vor Merge für Frontend, macOS und Windows grün sein.

## Grenzen

Ehrliche Selbsteinschätzung, keine automatische Übersetzungsprüfung, keine Audioaufnahmen, kein Wortlistenimport. Eigene thematische Auswahl für Green Line Bayern ab 2017, keine Vollständigkeit des Buchwortschatzes. Fälligkeiten hängen an der Geräteuhr; kein Hintergrunddienst oder Push. Bei offenem Trainer erfolgt die Aktualisierung nach Bewertung/Themenwechsel oder über „Fällige Karten laden“. Keine manuelle Windows-UI-Prüfung; Windows-Tests und nativer Build in CI. Kein Test mit Kindern behauptet.
