# Review zu Issue #121: Planetengalerien mit Großansicht

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `animation_review` am 03.10.2026. Der Reviewer hat die Galerie weder implementiert noch deren Bildauswahl vorgenommen. Geprüft werden der vollständige Diff von `codex/issue-121-planetenbilder` gegen `main`, alle neuen Dateien und die Kriterien von [Issue #121](https://github.com/dr-dimitri/lernwelt/issues/121). Grundlage sind AGENTS.md und beide Projektskills.

Umfang: 16 zusätzliche NASA-Bilder, Quellenmanifest mit 24 Einträgen, lokale Bildprojektion, Galerie im Entdeckungs-Steckbrief, native modale Großansicht, Bildnavigation, Fokusführung, Ladefehler, UI-/Bilddateiprüfungen und Dokumentation. Ergänzend erfolgte ein ausdrücklich als Selbstreview bezeichneter Durchgang des implementierenden Agenten über Gesamtdiff, Akzeptanzkriterien und Fehlerpfade.

## Befunde und Korrekturen

Der unabhängige Produktions-, Bild-, Test- und Dokumentationsreview von Commit `9a72bca` hat keine Befunde ergeben. Der Reviewer hat sämtliche 16 neuen NASA-Quellseiten, Credits und Erklärungen abgeglichen. Der Kontaktbogen zeigt drei unterschiedliche Ansichten je Planet. Alle 24 gebündelten Dateien wurden unabhängig geöffnet und auf Eindeutigkeit, Bytezahl, SHA-256 und dekodierte Pixelmaße geprüft: korrekt, insgesamt 1.845.324 Bytes. Auch die praktische Browserprüfung ergab keine Befunde.

Der Implementierungscheck korrigierte allein den Testzugriff auf lokale Dateien: Vite transformiert dynamische `new URL`-Assetpfade; der Dateitest verwendet deshalb einen ausdrücklich lokalen Pfad. Dies war ein Fehler des neuen Tests, kein Defekt des bestehenden Produkts. Der betroffene Test und danach die vollständigen Frontendprüfungen waren erfolgreich.

## Datenhaltung, Offlinebetrieb und Fehlerpfade

Die Bilder laden ausschließlich aus `/images/solar-system/`. Das Quellenmanifest und seine Bildbeschreibungen werden mitgebaut. Externe NASA-Links dienen der freiwilligen Quellenansicht; sie werden nicht zum Laden der Aufnahmen aufgerufen. Keine neuen Bibliotheken, Cloud-Aufrufe, CSP-Änderungen, Commands oder Migrationen.

Die acht bisherigen Hauptbilder bleiben bytegleich. Stabile Planeten- und Aufgaben-IDs, Namenlosigkeit der Rätselbilder, Antwortprüfung, Lernfortschritt und Punkte bleiben erhalten. Die Galerie hängt nur im Entdeckungs-Steckbrief. Bildwechsel, Vergrößern und Erkunden buchen keine Punkte.

Der gewählte Bildindex ist lokaler Ansichtsstand. Vorheriges/nächstes Bild läuft an den Enden zur anderen Seite weiter. Die Großansicht übernimmt das gewählte Bild und teilt den Index mit dem Steckbrief; ein Planetenwechsel erzeugt die Galerie neu mit Bild 1. Ein Bildladefehler zeigt einen verständlichen Hinweis mit Retry und weiter bedienbarer Navigation. Der native Dialog setzt den Anfangsfokus auf Schließen, verarbeitet Escape und führt zum auslösenden Knopf zurück. Seine echte Fokusfalle wurde zusätzlich in der Browserprüfung bestätigt.

Künstliche Farben, Radar-, Infrarot- und Geländeansichten sowie Montagen werden am jeweiligen Bild verständlich erklärt. Die Verarbeitung durch Lernwelt beschränkt sich auf Verkleinerung und WebP-Kompression. Die NASA-Nutzungshinweise, sämtliche Quellseiten, Credits, Verarbeitung und Quellenstand sind dokumentiert.

## Tatsächlich ausgeführte Prüfungen

Vom implementierenden Agenten ausgeführt:

- `npm run check`: Formatprüfung, **268 Frontendtests in 34 Dateien**, **acht Skripttests**, TypeScript und Vite-Produktionsbuild erfolgreich.
- `npx vitest run src/components/PlanetGallery.test.tsx src/domain/solar-planet-images.test.ts src/components/SolarSystemWorld.test.tsx`: **17 Tests erfolgreich**. Geprüft werden beide Navigationsrichtungen per Tastatur, Bild-/Erklärungs-/Quellenwechsel, Großansicht der gewählten Aufnahme, Rückübernahme des Bildindex, Schließen, Escape-Signal und Fokusrückkehr, Bildladefehler/Retry, Neustart je Planet, fortbestehende namenlose Rätsel sowie lokale Dateien und Manifestnachweise.
- Kontaktbogen aller 24 Bilder visuell geprüft.
- `git diff --check`: erfolgreich.

Vom unabhängigen Reviewer selbst ausgeführt:

- Bilddateien unabhängig dekodiert und Bytezahl, SHA-256, Eindeutigkeit und Pixelmaße gegen Manifest geprüft: alle 24 Dateien korrekt, drei je Planet.
- Die 16 neuen NASA-Quellseiten und angegebenen Bildnachweise gegen Manifest und Bildbeschreibungen geprüft: konsistent.
- Produktionscode, Dialoglebenszyklus, Tastaturbedienung, Bild-/Planetenwechsel, Tests und finale Dokumentation separat geprüft: keine Befunde.
- `npx vitest run src/components/SolarSystemWorld.test.tsx`: **zwölf Tests erfolgreich**.

Vom koordinierenden Agenten praktisch im Browser ausgeführt und dem Reviewer/implementierenden Agenten gemeldet:

- **1280 × 720** sowie **420 × 600** (native Mindestgröße): Vorheriges Bild springt von Bild 1 zu Bild 3; die Großansicht zeigt die gewählte Aufnahme, Weiter darin springt von Bild 3 zu Bild 1. Anfangsfokus auf Schließen, Escape schließt und führt zum Vergrößern-Knopf zurück. Tab und Shift+Tab halten den Fokus im nativen Dialog. Der Wechsel zu Saturn beginnt bei Bild 1 von 3. Alle Bildtasten bleiben im kleinen Fenster bedienbar; die Großansicht ist bei langen Bildnachweisen scrollbar. Kein Befund.

## Grenzen und Abschlussstatus

Komponententests verwenden jsdom; sie prüfen das native Cancel-Signal statt eine echte Browser-Escape-Taste. Die praktische Browserprüfung ergänzt echte Großansicht, Escape, Fokusfalle und schmales Layout. Nach Integration der unabhängig bearbeiteten Umlaufanimation aus Issue #120 werden Rebase-Konflikte geprüft, betroffene Checks ausgeführt und der kombinierte Stand separat nachgeprüft.

Keine neuen nativen Speicher-, Installer-, Windows-, Screenreader- oder pädagogischen Nutzertests: Galerie, Assets und Ansichtsstand verändern ausschließlich das lokale Frontend. Die bestehende Vite-Hinweismeldung zum großen JavaScript-Bundle bleibt erhalten; der Build ist erfolgreich.

**Review des implementierten Galeriestands abgeschlossen:** Keine offenen Befunde; lokale Prüfungen und Browserabläufe erfolgreich. Vor PR/Merge folgt noch der Nachreview nach Zusammenführung mit Issue #120. Das Issue gilt erst nach grünem erforderlichem CI und Merge als abgeschlossen.
