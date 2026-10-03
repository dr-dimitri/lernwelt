# Review zu Issue #121: Planetengalerien mit Großansicht

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `animation_review` am 03.10.2026. Der Reviewer hat die Galerie weder implementiert noch deren Bildauswahl vorgenommen. Geprüft wurden der vollständige Diff von `codex/issue-121-planetenbilder` gegen `main`, alle neuen Dateien und die Kriterien von [Issue #121](https://github.com/dr-dimitri/lernwelt/issues/121). Grundlage sind AGENTS.md und beide Projektskills. Der finale Nachreview nach Rebase prüfte HEAD `56f065d` gegen `origin/main` (`86c2d224d2db3816eaa126bb69f2bd173fbbbca3`), das die bereits gemergte Umlaufanimation aus Issue #120 enthält.

Umfang: 16 zusätzliche NASA-Bilder, Quellenmanifest mit 24 Einträgen, lokale Bildprojektion, Galerie im Entdeckungs-Steckbrief, native modale Großansicht, Bildnavigation, Fokusführung, Ladefehler, UI-/Bilddateiprüfungen und Dokumentation. Ergänzend erfolgte ein ausdrücklich als Selbstreview bezeichneter Durchgang des implementierenden Agenten über Gesamtdiff, Akzeptanzkriterien und Fehlerpfade.

## Befunde und Korrekturen

Der unabhängige Produktions-, Bild-, Test- und Dokumentationsreview von Commit `9a72bca` hat keine Befunde ergeben. Der Reviewer hat sämtliche 16 neuen NASA-Quellseiten, Credits und Erklärungen abgeglichen. Der Kontaktbogen zeigt drei unterschiedliche Ansichten je Planet. Alle 24 gebündelten Dateien wurden unabhängig geöffnet und auf Eindeutigkeit, Bytezahl, SHA-256 und dekodierte Pixelmaße geprüft: korrekt, insgesamt 1.845.324 Bytes. Auch die praktische Browserprüfung ergab keine Befunde.

Der finale unabhängige Nachreview nach Rebase ergab ebenfalls keine Befunde. Nur README.md und docs/solar-system.md enthielten erwartete Textkonflikte; ihre Auflösung erhält die Galeriebedienung, 24 Bilder, Umlaufbedienung und die vollständige NASA-Umlauftabelle. Galeriecode, Tests, Manifest und Bildassets sind gegenüber dem vorab geprüften Stand unverändert. Die Produktionsdateien der Umlaufanimation sowie deren 5–15-Sekunden-Regler und Standardwert 5 bleiben bytegleich mit `origin/main`. CSS und Architektur wurden konsistent zusammengeführt.

Der Implementierungscheck korrigierte allein den Testzugriff auf lokale Dateien: Vite transformiert dynamische `new URL`-Assetpfade; der Dateitest verwendet deshalb einen ausdrücklich lokalen Pfad. Dies war ein Fehler des neuen Tests, kein Defekt des bestehenden Produkts. Der betroffene Test und danach die vollständigen Frontendprüfungen waren erfolgreich.

## Datenhaltung, Offlinebetrieb und Fehlerpfade

Die Bilder laden ausschließlich aus `/images/solar-system/`. Das Quellenmanifest und seine Bildbeschreibungen werden mitgebaut. Externe NASA-Links dienen der freiwilligen Quellenansicht; sie werden nicht zum Laden der Aufnahmen aufgerufen. Keine neuen Bibliotheken, Cloud-Aufrufe, CSP-Änderungen, Commands oder Migrationen.

Die acht bisherigen Hauptbilder bleiben bytegleich. Stabile Planeten- und Aufgaben-IDs, Namenlosigkeit der Rätselbilder, Antwortprüfung, Lernfortschritt und Punkte bleiben erhalten. Die Galerie hängt nur im Entdeckungs-Steckbrief. Bildwechsel, Vergrößern und Erkunden buchen keine Punkte.

Der gewählte Bildindex ist lokaler Ansichtsstand. Vorheriges/nächstes Bild läuft an den Enden zur anderen Seite weiter. Die Großansicht übernimmt das gewählte Bild und teilt den Index mit dem Steckbrief; ein Planetenwechsel erzeugt die Galerie neu mit Bild 1. Ein Bildladefehler zeigt einen verständlichen Hinweis mit Retry und weiter bedienbarer Navigation. Der native Dialog setzt den Anfangsfokus auf Schließen, verarbeitet Escape und führt zum auslösenden Knopf zurück. Seine echte Fokusfalle wurde zusätzlich in der Browserprüfung bestätigt.

Künstliche Farben, Radar-, Infrarot- und Geländeansichten sowie Montagen werden am jeweiligen Bild verständlich erklärt. Die Verarbeitung durch Lernwelt beschränkt sich auf Verkleinerung und WebP-Kompression. Die NASA-Nutzungshinweise, sämtliche Quellseiten, Credits, Verarbeitung und Quellenstand sind dokumentiert.

## Tatsächlich ausgeführte Prüfungen

Vom implementierenden Agenten ausgeführt:

- `npm run check`: Formatprüfung, **268 Frontendtests in 34 Dateien**, **acht Skripttests**, TypeScript und Vite-Produktionsbuild erfolgreich.
- Erneutes `npm run check` nach Rebase auf den gemergten Animationsstand: Formatprüfung, **283 Frontendtests in 35 Dateien**, **acht Skripttests**, TypeScript und Vite-Produktionsbuild erfolgreich.
- `npx vitest run src/components/PlanetGallery.test.tsx src/domain/solar-planet-images.test.ts src/components/SolarSystemWorld.test.tsx`: **17 Tests erfolgreich**. Geprüft werden beide Navigationsrichtungen per Tastatur, Bild-/Erklärungs-/Quellenwechsel, Großansicht der gewählten Aufnahme, Rückübernahme des Bildindex, Schließen, Escape-Signal und Fokusrückkehr, Bildladefehler/Retry, Neustart je Planet, fortbestehende namenlose Rätsel sowie lokale Dateien und Manifestnachweise.
- Kontaktbogen aller 24 Bilder visuell geprüft.
- `git diff --check`: erfolgreich.

Vom unabhängigen Reviewer selbst ausgeführt:

- Bilddateien unabhängig dekodiert und Bytezahl, SHA-256, Eindeutigkeit und Pixelmaße gegen Manifest geprüft: alle 24 Dateien korrekt, drei je Planet.
- Die 16 neuen NASA-Quellseiten und angegebenen Bildnachweise gegen Manifest und Bildbeschreibungen geprüft: konsistent.
- Produktionscode, Dialoglebenszyklus, Tastaturbedienung, Bild-/Planetenwechsel, Tests und finale Dokumentation separat geprüft: keine Befunde.
- `npx vitest run src/components/SolarSystemWorld.test.tsx`: **zwölf Tests erfolgreich**.
- Finalen Voll-Diff nach Rebase gegen `origin/main` einschließlich Konfliktauflösungen, beider Funktionen, Tests und Dokumentation geprüft; `git diff --check` erfolgreich. Keine Befunde, aus Reviewsicht freigegeben.

Vom koordinierenden Agenten praktisch im Browser ausgeführt und dem Reviewer/implementierenden Agenten gemeldet:

- **1280 × 720** sowie **420 × 600** (native Mindestgröße): Vorheriges Bild springt von Bild 1 zu Bild 3; die Großansicht zeigt die gewählte Aufnahme, Weiter darin springt von Bild 3 zu Bild 1. Anfangsfokus auf Schließen, Escape schließt und führt zum Vergrößern-Knopf zurück. Tab und Shift+Tab halten den Fokus im nativen Dialog. Der Wechsel zu Saturn beginnt bei Bild 1 von 3. Alle Bildtasten bleiben im kleinen Fenster bedienbar; die Großansicht ist bei langen Bildnachweisen scrollbar. Kein Befund.
- Integration nach Rebase und erneutem Laden im Browser: Geographie startet mit ausgeschaltetem Umlauf und Standardwert 5 Sekunden. Umlauf gestartet, Galerie zu Bild 2 gewechselt, diese Aufnahme vergrößert und mit Escape zum Auslöser zurückgekehrt. Danach bleiben Animation aktiv und Bild 2 ausgewählt. Kein Befund.

## Grenzen und Abschlussstatus

Komponententests verwenden jsdom; sie prüfen das native Cancel-Signal statt eine echte Browser-Escape-Taste. Die praktische Browserprüfung ergänzt echte Großansicht, Escape, Fokusfalle und schmales Layout. Rebase-Konflikte mit der unabhängig bearbeiteten Umlaufanimation aus Issue #120 wurden aufgelöst; erneute vollständige Frontendchecks, praktische Integrationsprüfung und separater Voll-Diff-Nachreview bestätigen den kombinierten Stand.

Keine neuen nativen Speicher-, Installer-, Windows-, Screenreader- oder pädagogischen Nutzertests: Galerie, Assets und Ansichtsstand verändern ausschließlich das lokale Frontend. Die bestehende Vite-Hinweismeldung zum großen JavaScript-Bundle bleibt erhalten; der Build ist erfolgreich.

**Review abgeschlossen:** Keine offenen Befunde; lokale Prüfungen, Browserabläufe und unabhängiger Nachreview nach Zusammenführung mit Issue #120 erfolgreich. Aus Reviewsicht freigegeben für den PR-/Mergeablauf bei grünen erforderlichen CI-Checks. Das Issue gilt erst nach Merge als abgeschlossen.
