# Review zu Issue #120: Startbarer Planetenumlauf

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `animation_review` am 03.10.2026 nach der Umsetzung. Der Reviewer hat keinen Produktionscode und keine Tests dieses Issues geschrieben. Geprüft wurden der Gesamtdiff einschließlich neuer Dateien gegen `origin/main`, die Akzeptanzkriterien von Issue #120, AGENTS.md und beide Projektskills, Fachwerte, Frontend-Lebenszyklus, Projektion, SVG, CSS, Dokumentation und finale Tests. Zusätzlich wurden die acht siderischen Umlaufzeiten anhand der offiziellen NASA-Einzelfaktenblätter unabhängig bestätigt.

## Ergebnis und Befunde

Keine offenen blockierenden oder sonstigen konkret behebbaren Befunde. Die Animation beginnt ausgeschaltet. Eine native Taste startet und hält den Umlauf an; ein nativer Regler bestimmt 10–60 Sekunden pro Erdenjahr in Sekundenschritten. Alle Planeten verwenden eine gemeinsame Modellzeit und ihre jeweiligen tatsächlichen Zeitverhältnisse. Sonne und Bahnen bleiben fest, Fotos, Auswahlmarkierung, Rätsel-Fragezeichen und Tiefenreihenfolge bewegen sich mit den projizierten Körpern. Zielnamen bleiben im Rätsel verborgen.

Anhalten erhält die Positionen, erneutes Starten setzt fort. Live-Geschwindigkeitswechsel übernehmen die bisherige Modellzeit. Hidden-Zeit wird nicht nachgeholt; Frames und Visibility-Listener werden bei Hidden bzw. Unmount entfernt. Kreisbahnen, gleichmäßige Winkelgeschwindigkeit, schematische Größen und Beispiel-Anfangspositionen sind verständlich dokumentiert. Die festen Bahnen werden nur bei Perspektivwechsel neu berechnet.

Keine Änderungen an Rust, IPC, Datenbank, Lerninhalten, stabilen Aufgaben-IDs oder Punktebuchungen. Keine neuen Abhängigkeiten, externen Laufzeitressourcen oder CSP-Freigaben. Der lokale `node_modules`-Symlink und Build-Ausgaben sind vom Commit ausgeschlossen. Der bestehende Tastaturtest wurde für die zwei zusätzlichen Steuerungen angepasst; kein reproduzierbarer bestehender Produktbug wurde gefunden.

## Prüfungen

- `npx vitest run src/components/SolarSystemModel.test.tsx src/domain/solar-projection.test.ts src/domain/solar-orbits.test.ts`: 22 Tests erfolgreich.
- `npm run test`: 33 Vitest-Dateien mit 277 erfolgreichen Tests sowie 8 erfolgreiche Skripttests. Die bisherigen Sonnensystemwelt-/Rätseltests bleiben grün.
- `npm run format:check`: erfolgreich.
- `npm run build`: TypeScript und Vite-Produktionsbuild erfolgreich. Die bekannte allgemeine Bundlegrößenwarnung bleibt bestehen.
- Die Bestandteile der passenden README-Prüfung `npm run check` wurden nach Abschluss der Tests vollständig erfolgreich ausgeführt. Ein früher Formatierungsdurchlauf während der noch laufenden Testbearbeitung wurde anschließend erfolgreich wiederholt.
- `git diff --check`: erfolgreich.
- Browser-Praxisprüfung bei 635 Pixeln sowie 1280 × 800 Pixeln: Start/Stopp, sichtbare Bewegung aller Körper, 10/60-Sekunden-Grenzen, Live-Reglerwechsel, Tastatur-Pfeiltaste/Pos1 und bedienbare schmale/breite Darstellung geprüft.

Die neuen beobachtbaren Tests prüfen den vollständigen Erdumlauf bei 10 und 60 Sekunden, Pause/Fortsetzen, Live-Geschwindigkeitswechsel ohne Positionssprung, verborgene Zeit, Aufräumen beim Entfernen, Perspektivwechsel und Planetenwahl während des Umlaufs sowie die laufende Rätselmarkierung ohne verratenen Namen. Fachtests verwenden unabhängige NASA-Referenzwerte; Projektionstests prüfen auch bewegte Planeten innerhalb der Bildfläche.

## Verbleibende Grenzen

Kein separates Screenreader-Praxisreview und keine separate native WKWebView-Prüfung für Minimieren/Ausblenden. Das Document-Visibility-Verhalten ist automatisiert geprüft. Rust-/IPC- und native Buildprüfungen werden zusätzlich durch die PR-CI auf macOS und Windows ausgeführt; lokal war für diese reine Frontendänderung kein weiterer nativer Build nötig. Die Darstellung ist ein vereinfachtes Lernmodell ohne aktuelle astronomische Konstellationen oder elliptische Bahnphysik. Animationseinstellungen werden nicht gespeichert.
