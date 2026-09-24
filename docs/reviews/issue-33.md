# Review zu Issue #33: Spielhalle

- Datum: 24.09.2026
- Reviewer: Codex, **separater Selbstreview**, keine unabhängige Freigabe.
- Basis: `main` bei `ea2f077`; Issue-Branch `codex/issue-33-spielhalle`.

## Umfang und Ergebnis

Gesamte Änderung gegen `main` einschließlich neuer Dateien geprüft: vier Spielregeln und Canvas-Grafiken, Eingaben/Pause/Rundenende, React-Navigation und Fehlerpfade, typisierte IPC-Grenze, Berechtigungen, Rust-Buchungen, Schema-4-Migration, Tests und Dokumentation. Die Akzeptanzkriterien von #33 sind umgesetzt. Keine offenen blockierenden Befunde.

## Befunde und Korrekturen

- Im nativen Entwicklungsstand führte ein Pointer-Fokuswechsel beim Klick auf „Pause“ zunächst zum sofortigen Fortsetzen. Fokusverlust und Klick konkurrierten. Der Pointerdruck erhält nun den Spielfeldfokus; Pause, Weiter und automatischer Fokusverlust sind zusätzlich getestet und nativ erneut geprüft.
- Ein verspäteter Lade-Response nach einer Profiländerung konnte einen neueren Buchungsstand in der Anzeige überschreiben. Ladeversionen verwerfen durch Buchungen überholte Ergebnisse; ein Test reproduziert diese Reihenfolge und prüft das neuere Guthaben.
- Beim Wechsel zwischen Spielen konnte eine alte Scrollposition das Spielfeld abschneiden. Start/Weiter zentriert jetzt das Spielfeld einschließlich Bildschirmsteuerung; im abschließenden nativen Build visuell geprüft.
- Es handelte sich um Korrekturen der noch nicht veröffentlichten Implementierung dieses Issues. Keine neuen reproduzierbaren Bugs im bestehenden `main` festgestellt.

## Daten und Fehlerpfade

- Der Preis kommt ausschließlich aus Rust. `BEGIN IMMEDIATE` verbindet Guthabenprüfung, Eintrag im Journal und Session. Wiederholte identische Starts belasten nur einmal; unbekannte Spiele, ungültige IDs/Scores, fehlendes Profil, zu wenig Guthaben, konkurrierende neue Runden und widersprüchliche Wiederholungen werden abgewiesen.
- Ein partieller Unique-Index begrenzt offene Runden. Gleiche Abschlüsse sind idempotent. Bestwerte sind Spiel-Scores ohne Punktegutschrift.
- Transaktionale Migration kopiert das Journal mit IDs, Beträgen und Zeitstempeln und erhält Profil, Abzeichen, Einstellungen, Antworten und Fortschritt. Erfolgreiches Upgrade, erneutes Öffnen und erzwungener Abbruch der Migration sind geprüft.
- Frontend behält unklare Start-IDs, bietet erneutes Laden bzw. Ergebnisspeichern an und startet niemals selbständig eine weitere kostenpflichtige Runde. Lernkonto lädt beim Rückwechsel das gemeinsame aktuelle Guthaben.
- Keine neuen Abhängigkeiten, externen Assets, Netzwerkrechte oder beliebigen SQL-/Dateischnittstellen.

## Prüfergebnisse

- `npm run check:all`: erfolgreich; **38 Frontend-/Spieltests, 2 Workflowtests und 30 Rusttests**. TypeScript, Vite, Prettier, rustfmt und Clippy ohne Fehler.
- Tests umfassen Reihenlöschung und Kollisionen, Sprung/Landung/Sterne, Roboter-/Spielertreffer und Wellenende, Hühner-Treffer und Zeitlimit, Pause ohne Zeitverbrauch, einmaligen Abschluss, UI-Speicherfehler, Idempotenz, parallele Verbindungen und Migration/Rollback.
- Nativer macOS-Release-Build mit separater Test-App erfolgreich. Alle vier Spiele gestartet und Eingaben geprüft; Klötzchen abgelegt/gedreht, Wolkenflitzer gesprungen und Rundenende nach Herzverlust beobachtet, Lichtblitze/Tastatursteuerung, Hühner-Treffer per Nummerntaste und Bildschirmtaste.
- Vier Eintritte senkten das isolierte Testkonto nachvollziehbar von 40 auf 30, 20, 10 und 0 Lernpunkte. Vorhandenes Abzeichen, Lernstand und globale Stufe blieben erhalten. Neustart einer offenen bezahlten Runde kostete nichts, auch bei 0 Guthaben. Hühner-Ergebnis mit 100 Spielpunkten gespeichert, Bestwert angezeigt und neue Eintritte bei leerem Konto gesperrt.
- Pause per Taste und Bildschirmbutton erneut nativ bestätigt. Finale Spielfeldansicht mit Anleitungen, Score, Konfetti-Grafik und Steuertasten visuell geprüft.
- GitHub-CI für Frontend sowie macOS-/Windows-Desktop muss auf dem PR vor Merge grün sein; der Merge erfolgt erst danach.

## Verbleibende Grenzen

Eigene kleine Arcade-Spiele, keine originalgetreuen Kopien oder Originalgrafiken. Eine unterbrochene bezahlte Runde startet von vorn; genaue Spielpositionen werden nicht gespeichert. Lokale Bestwerte sind nicht manipulationssicher. Canvas-Spiele setzen visuelle Wahrnehmung voraus; Tastaturbedienung und beschriftete Steuerung ersetzen keine vollständig nichtvisuelle Spielvariante. Keine Tests mit Kindern oder manuelle Windows-UI-Prüfung; Windows wird in CI gebaut und automatisiert geprüft. App weiterhin unsigniert/nicht notarisiert.
