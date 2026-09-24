# Review Issue #51: Neue Arcade-Grafik

- Datum: 24.09.2026
- Reviewer: Codex, separater Selbstreview; keine unabhängige Freigabe.
- Basis: main `fedfb8a`, eigener Branch `codex/issue-51-spielgrafik`.

## Umfang und Akzeptanzkriterien

Gesamtdiff gegen main geprüft: Canvas-Renderer aller vier Spiele, gemeinsame Auflösungsvorbereitung, statische Vorschaubilder, Spielkarten/HUD/Pausenkarte, passende Tests und README. Die Engine, Trefferprüfung, Rust-Commands, Datenbank, Lerninhalte und Punktebuchungen sind unverändert. Keine neuen Abhängigkeiten oder externen Assets.

Klötzchen-Kosmos erhält facettierte Kristallblöcke und eine eingerahmte Spielfläche. Wolkenflitzer zeigt Berge, Wolken und Hügel mit verschiedenen Scrollgeschwindigkeiten, Baumstämme, leuchtende Sterne und einen laufenden Roboter. Sternenwache erhält detaillierte Roboter, Raumschiff, Triebwerk, Planeten und eine Raumstation. Hühner-Rummel zeigt einen Bauernhof, Richtung und Flügelschlag der Hühner sowie rotierendes Konfetti. Statische Auswahlbilder verwenden denselben Renderer.

## Befunde und Nachbesserungen

- Canvas arbeitet weiter mit logischen 640 × 400 Koordinaten. Die interne Auflösung berücksichtigt den Gerätefaktor bis 2. Der Pointerpfad rechnet weiterhin über die tatsächliche CSS-Größe; ein zusätzlicher UI-Test prüft eine 320 × 200 Anzeige bei 1280 × 800 interner Auflösung und einen korrekten Hühner-Treffer mit 50 Spielpunkten.
- Solide Figuren und Hindernisse orientieren sich an den bisherigen Trefferflächen; Flammen, Licht und Schal sind Dekoration. Zeichnen liest den Spielzustand nur. Canvas-Transformationen und Transparenz sind durch save/restore begrenzt; Farb- und Wellenindizes passen zu den Engine-Grenzen.
- Die erste transparente Pausenfläche ließ Hintergrundtext durchscheinen. Eine eigene dunkle Karte verbessert die Lesbarkeit, auch bei schmalem Fenster.
- Die aufwendigere Grafik wird in der Pause nur einmal gezeichnet; die Animationsschleife ruht. Resize zeichnet neu, Fortsetzen startet die Schleife wieder. Der bestehende Pausentest sichert das zusätzliche Verhalten ab. Animationen verwenden ausschließlich die aktive Spielzeit/Position, keine zusätzliche Uhr.
- Vorschauen starten keine Spielrunde, vergeben keine Punkte und rufen keine Desktop-Commands auf. Sie zeichnen nur beim Mount/Resize und entfernen den Listener beim Unmount.
- Bei der nativen Prüfung fiel der bestehende Singularfehler „1 Punkte / 1 Lernpunkte“ auf. Separat als #52 erfasst, nicht blockierend und nicht als Nebenfix vermischt.

Keine offenen blockierenden Befunde im Grafik-Diff.

## Tatsächliche Prüfungen

- `npm run check:all` erfolgreich: 70 Frontend-/Spieltests, 2 Workflowtests, 57 Rusttests (129 insgesamt), Prettier, TypeScript/Vite, rustfmt und Clippy. Nach den abschließenden Pausen-/UI-Anpassungen `npm run check` und nativen Release-Build erneut erfolgreich ausgeführt; Rust blieb unverändert.
- Neuer Retina-/Treffertest sowie bestehende Tastatur-, Pointer-, Pause-, Rundenabschluss-, Wiederaufnahme- und Punktefehlerpfade grün. In jsdom bleiben rein dekorative Vorschauen in den App-/Buchungstests ausgeblendet; echte Grafik wurde im Browser/native geprüft.
- Lokale Browser-Prüfseite mit echten GameStage-/ArcadePanel-Komponenten und rein lokalen Testzuständen: alle vier Spiele gestartet und visuell geprüft; Block abgelegt, Huhn getroffen (50 Spielpunkte), Pause und Rundenende angesehen. Spielauswahl und Pausenkarte zusätzlich bei 600 px Fensterbreite geprüft. Temporäre Prüfseite nicht Teil des Produkts.
- Renderstichprobe im lokalen Browser bei 1280 × 800: je 120 Zeichnungen inkl. Pixel-Readback, p95 zwischen 5,4 und 7,8 ms; serialisierter Spielzustand vor/nach Zeichnen unverändert. Dies ist eine lokale Stichprobe, keine Leistungsgarantie für andere Geräte.
- Nativer macOS-Release-Build erfolgreich gestartet. Alle vier Vorschaubilder in der Spielhalle sichtbar, vorhandenes Profil und Guthaben geladen; keine Nutzerpunkte für die Grafikprüfung ausgegeben.
- `git diff --check` ohne Befund. Frontend-, macOS- und Windows-CI müssen vor Merge grün sein.

## Grenzen

Keine manuelle Windows-Laufzeitprüfung und kein Test mit Kindern durchgeführt. Die Gestaltung nutzt eigene Canvas-Formen; keine Fototexturen, Original-Spielassets oder Online-Abhängigkeit. Die bestehenden Spielregeln einschließlich Rundendauer bleiben erhalten.
