# Review Issue #138: Planetenauswahl und größere Bahnenansicht

## Umfang und Reviewart

Unabhängiger Agent-Review durch `solar_layout_review`, der keine Implementierung beigesteuert hat. Vollständiger Issue-Diff, Akzeptanzkriterien, Fehlerpfade, Tastaturbedienung, Offline-Funktion, Versionsdateien und Dokumentation geprüft. Der Nutzer verlangte mehr Platz für die Planetenbahnen, das Entfernen des Zeitreglers und zweier Textblöcke sowie eine feste Umlaufzeit von 5 aktiven Sekunden. Die gesondert entdeckte Sonnenhalo-Überdeckung wurde als #139 auf eigenem Branch behoben und vor diesem Issue gemergt. Finale Vergleichsbasis: 2a70eeeeddd4780d57d2013469336f6938748376; finaler Implementierungsstand: 82d83756781174ddc3d427635931127489e85764.

## Problem und Änderung

Echter Chromium-Test im bestehenden 0.6.4-Modell: Blick −90°, Neigung 15°, 12,205 aktive Sekunden bei 5 Sekunden pro Erdenjahr. Venusmitte im SVG ungefähr 435,413 / 296,144. Nach Auswahl Jupiters trifft derselbe echte Klick dessen goldenen Auswahlring und lässt Jupiter ausgewählt. Auswahlring und Beschriftung sind nun gemeinsam für Pointer-Hit-Tests transparent; sichtbare Planetenoberflächen empfangen ihre eigenen Klicks. Die native Planetentastenauswahl bleibt erhalten; Rätsel-Bildklicks wählen keine Antwort.

Die Bahnenansicht ist im Standardfenster 500 statt 320 Pixel hoch; bei Datenfehlern 400 statt 240. Der Zeitregler sowie die gesamte bisherige Modellunterschrift und der Absatz zur Umlaufdauer entfallen. Der Hook verwendet eine feste Konstante von 5 Sekunden; relative Perioden, Start/Pause/Fortsetzung, ausgeblendete Zeit und Cleanup bleiben erhalten. Unbenutzte CSS-Regeln entfallen. Alle fünf Versionsdateien stehen auf 0.6.6; README, Bedienungsdokumentation und Releasehinweise sind aktualisiert.

## Befunde und Korrekturen

P3: Die Bedienungsdokumentation nannte noch 5–15 Sekunden und Geschwindigkeitswechsel. Auf feste 5 aktive Sekunden und die passende Formel korrigiert. Keine offenen Befunde im unabhängigen Review. Keine Änderungen an IPC, Datenbank, Aufgabeninhalten, Antwortprüfung oder Punkten; keine neuen Abhängigkeiten.

## Tatsächliche Prüfungen

- Implementierer: vollständiges `npm run check:all` erfolgreich, 346 Frontendtests in 41 Dateien, 25 Scripttests, TypeScript, Vite-Produktionsbuild, Formatierung, Rust-Format, Clippy mit Warnungen als Fehler und 157 Rusttests. Versionsprüfung und `git diff --check` erfolgreich.
- Reviewer eigenständig: 36 relevante Solar-Verhaltenstests in vier Dateien. Tests prüfen unter anderem exakt 5 Sekunden Erdumlauf einschließlich 4999→5000 ms, alle neun relativen Perioden mit Pluto, Pause/Fortsetzung, unsichtbare Zeit, Cleanup, Tastatur und Rätselanonymität.
- Reviewer eigenständig: 248 echte Chromium-Ansichten und Bedienabläufe bei 2400 × 1300 CSS-Pixeln und 100 % Zoom, ohne Überlauf oder Laufzeitfehler. Vollständige echte App-Shell und SolarSystemWorld mit isolierter Desktop-Schnittstelle, echte gebündelte Aufgaben/Bilder, keine Profil-Datenbank.
- Alle neun Welten mit je drei Bildern, 27 Großansichten, alle 24 Rätsel mit allen Tipps, falschen Antworten, Lösungserklärungen und tatsächlichen richtigen Rückmeldungen, drei Rundenabschlüsse, Lade-/Datenfehler-/Ohne-Profil-/leere-Runden-/Speicherfehler-/laufende-Buchungs-/Stufenfehlerzustände geprüft.
- Direkter Jupiter→Venus-Klick im Produktionsmodell ohne DOM-Nachkorrektur erfolgreich. Tatsächliches Mausziehen setzt 40° / 46°, Zurücksetzen stellt 0° / 38° her. Tab-Reihenfolge, Enter/Leertaste, alle neun Planetentasten und Umlaufstart/Pause erfolgreich. Bildklick im Rätsel wählt keine Antwort.
- Bildladefehler für alle neun Welten in Steckbrief und Großansicht geprüft, erfolgreiches erneutes Laden mit echten lokalen Dateien und Escape-Fokusrückgabe bestätigt. Standardscreenshots visuell geprüft.
- Nach Rebase auf den gemergten Sonnenhalo-Fix: Root-Vollcheck erneut erfolgreich mit 346 Frontend-, 25 Script- und 157 Rusttests. Reviewer erneut 36 relevante Tests, Versionsprüfung und Diffprüfung erfolgreich. Neu gebautes Produktionsbündel bestätigt beide kombinierten Regressionen (Jupiter→Venus und Sonnenhalo→Erde) ohne DOM-Nachkorrektur; 15 zusätzliche finale Standardzustände einschließlich aller neun Steckbriefe, Rätsel, langer Streber-Erfolgsrückmeldung, Rundenende und Datenfehler ohne Überlauf oder Laufzeitfehler. Bericht: `/private/tmp/lernwelt-138-final-independent-review.json`.

Lokale Belege: `/private/tmp/lernwelt-138-check.log`, `/private/tmp/lernwelt-138-independent-review.json`, `/private/tmp/lernwelt-138-independent-supplement.json`. Temporäre Browserprüfungen liegen ausschließlich außerhalb des Repositorys; keine Produkt-Mocks oder Testseiten im Build.

## Grenzen und Abschluss

Echte Chromium-Geometrie ersetzt keine vollständige Native-Webview-Prüfung auf sämtlichen Betriebssystemen, Zoomstufen oder Hardware-Touchgeräten. Kleine Fenster dürfen gemäß Projektvorgabe scrollen. Keine Verständlichkeitsprüfung mit Kindern oder Barrierefreiheitszertifizierung behauptet. Native macOS-/Windows-CI, Merge, tatsächlicher automatischer Release 0.6.6 und Branchbereinigung sind anhand des PR und GitHub Actions zu bestätigen.
