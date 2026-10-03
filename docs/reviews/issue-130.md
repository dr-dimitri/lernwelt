# Review zu Issue #130: Pluto als Zwergplanet entdecken

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `animation_review` am 04.10.2026. Der Reviewer hat weder Produktionscode, Tests noch Bildauswahl implementiert. Geprüft wurden der vollständige Diff von `codex/issue-130-pluto` gegen `origin/main` (`8734105ce4f041d0457b619c3336815f28c7387f`), alle drei neuen Bilddateien und die Akzeptanzkriterien von [Issue #130](https://github.com/dr-dimitri/lernwelt/issues/130). Grundlage sind AGENTS.md und beide Projektskills.

Umfang: zusätzliche fachliche Anzeigedaten für Pluto, Auswahl und Projektion im räumlichen Modell, relative Umlaufzeit, drei lokale NASA-Aufnahmen, bestehende Galerie mit Großansicht, Tests und Dokumentation. Der acht Planeten umfassende Quizvertrag, Lernfortschritt und Persistenz wurden auf unverändertes Verhalten geprüft.

## Befunde und Akzeptanzkriterien

Der unabhängige Produktions-, Bild-, Quellen-, Test- und Dokumentationsreview ergab keine offenen Befunde. Korrekturen aufgrund dieses Reviews waren nicht erforderlich.

- Das Modell enthält Sonne, acht Planeten und Pluto. Pluto ist per Maus und Tastatur auswählbar. Auswahltaste und Steckbrief bezeichnen ihn ausdrücklich als Zwergplanet; die interne Darstellungsposition 9 wird nicht als neunter Planet ausgegeben.
- `SolarPlanet` und die bisherigen acht Planetendaten bleiben unverändert. `SolarBody` erweitert allein die Darstellung und Galerie. Quizziele und Antwortmöglichkeiten stammen weiterhin aus `planets`; Auswahl von Pluto vor einem Rätsel erzeugt keine zusätzliche Antwort und verrät keinen gesuchten Namen.
- NASA nennt eine siderische Umlaufzeit von 90.560 Erdentagen. Die Implementierung verwendet das Verhältnis zu 365,256 Tagen pro Erdenjahr. Die bisherigen acht Umlaufzeiten und die Zeitsteuerung bleiben erhalten: Standardwert 5 Sekunden, Regler 5–15 Sekunden, Start/Stop und Phasenerhalt.
- Die Projektionsanpassung berücksichtigt die äußere Pluto-Bahn in beiden Richtungen. Bilder, Zielmarkierung und Beschriftung bleiben in den geprüften Kamera- und Animationsständen innerhalb des Rahmens. Pluto erhält einen zu seinem lokalen Hauptbild passenden Ausschnitt.
- Der Steckbrief erklärt den Zwergplanetenstatus, Kuipergürtel, Umlaufzeit, Eisoberfläche und Monde in kurzen deutschen Sätzen. Die Angaben wurden mit NASA-Primärquellen abgeglichen. README, Architektur- und Sonnensystemdokumentation erklären die Trennung zwischen neun dargestellten Körpern und acht Quizplaneten.
- Drei unterschiedliche Pluto-Aufnahmen sind lokal gebündelt. Vor/zurück, Umschalten an den Enden, Großansicht des gewählten Bildes und Neustart bei Körperwechsel nutzen die vorhandene Galerie. Bildwechsel und Erkunden vergeben keine Punkte.

## Bilder, Offlinebetrieb und Datenhaltung

Der Reviewer hat den Kontaktbogen der drei neuen Bilder visuell geprüft und die NASA-Seiten zu PIA19708, PIA19710 und PIA20038 mit Titeln, Alternativtexten, Erklärungen und Credits abgeglichen. Die Aufnahmen zeigen Plutos helle Herzregion, Eisberge und den beleuchteten Rand mit Dunstschichten. Die ergänzten Farbdaten der Hauptaufnahme werden erklärt. Credit jeweils: NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute. Fachliche Quellen sind die [NASA-Pluto-Fakten](https://science.nasa.gov/dwarf-planets/pluto/facts/) und das [NASA-Pluto-Factsheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html).

Alle 27 Bilddateien wurden unabhängig dekodiert und auf Pixelmaße, Bytezahl, SHA-256 und Eindeutigkeit gegen das Manifest geprüft: korrekt, drei je dargestelltem Körper, insgesamt 1.984.648 Bytes. Die drei neuen Dateien umfassen 139.324 Bytes. Alle 24 bisherigen Bilder sind bytegleich mit `origin/main`; ihre Manifest-Einträge bleiben strukturell unverändert.

Die Anwendung lädt die Aufnahmen ausschließlich aus dem lokalen Bildverzeichnis. Externe NASA-Links dienen der freiwilligen Quellenansicht. Es gibt keine neuen Abhängigkeiten, externen Bildabrufe, Commands, Migrationen oder Änderungen an der Datenbank. Stabile Aufgaben-IDs, Bewertung und Punktebuchungen bleiben erhalten. Galeriefehler und Retry verwenden den bestehenden getesteten Fehlerpfad. Dialog und CSS wurden nicht verändert; die Typenerweiterung beschränkt sich auf den zusätzlichen Körper.

## Tatsächlich ausgeführte Prüfungen

Vom unabhängigen Reviewer selbst ausgeführt:

- Vollständigen Diff einschließlich neuer Dateien, Akzeptanzkriterien, Quizvertrag, Projektion, Zeitrechnung, Galerieintegration, Fehlerpfade, Tests und Dokumentation separat geprüft.
- Alle 27 Dateien gegen das Manifest geprüft; die 24 bisherigen Bilddateien und Manifest-Einträge mit `origin/main` verglichen.
- Kontaktbogen und NASA-Primärquellen einschließlich der drei neuen Bildnachweise unabhängig geprüft.
- `git diff --check`: erfolgreich.
- Das Protokoll des vollständigen lokalen Prüflaufs eingesehen; Zahlen und Ergebnisse unten stimmen mit dem Protokoll überein.

Vom Testagenten `orbit_research` ausgeführt und dem Reviewer gemeldet:

- Sechs betroffene Testdateien: **42 Tests erfolgreich**. Abgedeckt sind Pluto-Auswahl per Tastatur, neun dargestellte Körper, relative Umlaufzeit einschließlich voller Runde, Pause, unveränderte Reglerwerte, rätselsichere Namen, unveränderte acht Quizantworten, Galerieindex, Großansicht, Rückkehrfokus sowie Manifest und lokale Dateien.
- Die Projektionsprüfung umfasst stationär alle Körper bei Yaw-Schritten von 15° und Tilt-Schritten von 5°. Zusätzlich werden je Körper acht Umlaufphasen bei fünf Yaw- und drei Tilt-Werten geprüft.

Vom koordinierenden Agenten ausgeführt:

- `npm run check:all`: erfolgreich. Formatprüfung, **331 Frontendtests in 39 Dateien**, **acht Skripttests**, TypeScript, Vite-Produktionsbuild, Rust-Formatprüfung, Clippy und **157 Rusttests** bestanden.
- Praktische Browserprüfung bei **1280 × 720** und **420 × 600**: Pluto auswählen; alle drei Bilder laden und wechseln; Bild 2 vergrößern, im Dialog zu Bild 3 wechseln, mit Escape schließen und Fokus zum Vergrößern-Knopf zurückführen. Kein Befund.
- Kleines Fenster mit steilem Blickwinkel von 80°: gesamtes Modell sichtbar, alle Regler erreichbar und kein horizontaler Überlauf. Großansicht 384 Pixel breit; längere Bildnachweise bleiben scrollbar.
- Laufende Animation bei 15 Sekunden und Blickwinkel Yaw 180°/Tilt 15°: Erde und Pluto ändern ihre Position. Kein Befund.

## Grenzen und Abschlussstatus

Das Lernmodell komprimiert Entfernungen, vergrößert Körper und verwendet Kreisbahnen mit konstanter Winkelgeschwindigkeit. Plutos echte geneigte, ovale Bahn und die zeitweise geringere Entfernung als Neptun werden in der Dokumentation erklärt. Die Rastertests und Browserstichproben sind keine lückenlose Prüfung aller kontinuierlichen Kamera- und Zeitwerte.

Komponententests verwenden jsdom; die praktische Browserprüfung ergänzt echte Escape- und Fokusabläufe. Diese Browserprüfung wurde vom koordinierenden Agenten ausgeführt, nicht vom unabhängigen Reviewer. Keine neuen Screenreader-, Windows-Installer- oder pädagogischen Nutzertests. Der vorhandene Vite-Hinweis zur Größe des JavaScript-Bundles bleibt; der Build ist erfolgreich.

**Review abgeschlossen:** Keine offenen Befunde; aus Reviewsicht für den PR-/Mergeablauf freigegeben. Erforderliche Plattform-CI-Checks stehen zum Zeitpunkt dieses lokalen Reviews noch aus und müssen vor dem Merge grün sein. Das Issue gilt erst nach Merge als abgeschlossen.
