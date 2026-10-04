# Review Issue #139: Sonnenhalo blockiert die Planetenauswahl

## Umfang und Reviewart

Unabhängiger Agent-Review durch `solar_sun_review`, der keine Implementierung beigesteuert hat. Vollständiger Diff des Implementation-Heads `29622d294fa9b63495ffeda00b5f1101c10f3d55` gegen `origin/main` bei `e1d21ec8b29879f793d73a05410d2e7a5a507a05`, Issuekriterien, Fehlerpfade, Versionsdateien und Dokumentation am 04.10.2026 geprüft. Der frühere unveröffentlichte Commit 3727de9 enthielt zusätzlich einen Selbstreview-Bericht; dessen Entfernung verändert keinen Produktcode. Der Reviewer hat den aktuellen Head und Gesamtdiff erneut bestätigt.

## Fehler und Korrektur

Im Anfangsblick 0° / 38° mit ausgeschaltetem Umlauf bleibt nach Auswahl Jupiters ein echter Klick auf die sichtbare Erdmitte bei Jupiter. Die Erdmitte (ungefähr SVG 507,125 / 365,138) liegt außerhalb der Sonnenscheibe mit Radius 43, aber innerhalb eines dekorativen Sonnenhalos mit Radius 52/64. Der Halo fängt den Klick ab.

Nur die beiden Halokreise und die Sonnenbeschriftung erhalten `pointerEvents="none"`. Die Sonnenscheibe, Planetenoberflächen und Tiefenreihenfolge bleiben unverändert. Version 0.6.5, README und Releasehinweise beschreiben diesen Bugfix. Der separate Jupiter-Markierungsring und die vom Nutzer angeforderten Layout-/Zeitänderungen gehören zu #138.

## Tatsächliche Prüfungen

- Implementierer: vollständige Frontendprüfung erfolgreich, 338 Tests in 41 Dateien, 25 Scripttests, Formatierung, TypeScript und Vite-Produktionsbuild. Rust-Format, Clippy mit Warnungen als Fehler und 157 Rusttests erfolgreich. Vorhandener Buildcache verwendet.
- Reviewer eigenständig: Modell aus diesem Worktree neu gebündelt und echter Chromium-Browserklick bei 2400 × 1300 ohne DOM-/CSS-Nachkorrektur. Hit der Erdmitte gehört Erde; Klick wählt Erde. Sonnenmitte trifft weiterhin die Sonnenscheibe mit Radius 43 und verändert die Jupiterauswahl nicht. Die Erdentaste funktioniert mit Leertaste. Der bestehende 5–15-Sekunden-Regler bleibt unverändert. Kein Überlauf im isolierten Modellaufbau.
- Reviewer eigenständig: Versionsprüfung 0.6.5 gegen die aktuelle main-Basis und `git diff --check` erfolgreich; alle fünf Metadateien konsistent. Prüflogs der vollständigen Frontend- und Rustchecks kontrolliert.
- Kein künstlicher JSDOM-Test für bloße SVG-Attribute: JSDOM berechnet keine realen SVG-Hit-Tests. Die Regression wird durch tatsächliche Browsergeometrie und Mausklicks belegt.

Lokale Belege: `/private/tmp/lernwelt-139-check.log`, `/private/tmp/lernwelt-139-rust.log` und `/private/tmp/lernwelt-139-independent-browser-regression.json`. Keine Lernprofile oder Datenbankdateien verwendet, keine neuen Abhängigkeiten.

## Befunde und Grenzen

Keine offenen Befunde im finalen unabhängigen Review. Keine Änderungen an IPC, Datenbank, Lerninhalten, Antwortprüfung oder Punkten. Browserprüfung im echten isolierten Modell; keine unabhängige vollständige Native-Webview-Prüfung auf Windows oder Intel-macOS. Die Geometrie selbst wird in diesem Issue nicht geändert. GitHub-Checks, Merge, tatsächlicher automatischer Release und Branchbereinigung sind anschließend anhand des PR und GitHub Actions zu bestätigen.
