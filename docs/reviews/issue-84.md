# Review zu Issue #84 – Offline-Aussprache und Hörübungen

Datum: 26.09.2026

## Umfang und Reviewart

Unabhängiger Agentenreview durch **/root**, getrennt vom implementierenden Agenten **/root/audio**. Der Reviewer prüfte den gesamten UI-/Domain-Diff, die Akzeptanzkriterien, Audiofehler und Stop-/Unmount-Verhalten, Antwortschutz, Tests und Assethashes. Die öffentliche Seite des Modellerstellers und die Modellkarte im festgehaltenen Stand wurden vom Reviewer selbst geöffnet.

Der Diff ergänzt 740 gebündelte MP3s zu allen 370 Vokabelkarten, lokale Abspielknöpfe, eine freiwillige Hörrunde mit drei Wörtern, Quellen-/Lizenzinformationen und einen optionalen Assetgenerator. Schriftliche Antworten, Kartenfortschritt und Punkte bleiben unverändert. Keine neue Laufzeitabhängigkeit, kein IPC-/Datenbank- oder Tauri-Konfigurationswechsel.

## Befunde und Korrekturen

1. **Mehrdeutige Hörantworten:** Bei „Alle Themen“ konnten gleich klingende englische Wörter unterschiedliche deutsche Auswahlantworten bilden, etwa son/sun und wear/where. Die vollständige Wortliste wurde gegen die Lautfolgen der Synthese geprüft; zusätzlich wurde ate/eight gefunden. Diese Gruppen, gleiche englische Wörter sowie überschneidende deutsche Antwortvarianten werden nun als Ablenkantworten ausgeschlossen. Ein gezielter Test prüft alle drei Homophonpaare und eine englische Dublette mit anderer Bedeutung.
2. **Geklärte Herkunft:** Bei der Umsetzung wurde die zunächst erwogene Stimme Alba wegen ihres Lessac-Basismodells verworfen. Alle ausgelieferten Dateien wurden vollständig mit Cori high neu erzeugt. Dessen ursprünglicher Ersteller nennt Public Domain und ein Training von Grund auf mit LibriVox-Aufnahmen; Modellkarte und gepinnte Modelldateien sind dokumentiert. Quellvermerk und vollständige CC0-Erklärung für die neu erzeugten MP3s werden mitgebündelt. Keine Alba-Dateien werden ausgeliefert.
3. **Keine offenen blockierenden Befunde** nach diesen Korrekturen laut abschließendem unabhängigen Review.

## Tatsächlich ausgeführte Prüfungen

- `npm run check:all`: erfolgreich; Formatierung, **181 Frontend-/Assettests**, **2 Workflowtests**, TypeScript, Vite-Produktionsbuild, Rustfmt, Clippy mit `-D warnings` und **106 Rusttests**.
- Assetprüfung: alle 370 Karten und Texte stimmen mit dem bestehenden Vokabelkatalog überein; 740 MP3s mit dokumentierten Dauern und SHA-256-Prüfsummen vorhanden. Keine zusätzlichen verwaisten MP3s.
- FFmpeg-Dekodierprüfung der **740 endgültigen Cori-Dateien**: keine Fehler; zusammen 7.410.118 Bytes.
- Browserprüfung mit isolierten Testdaten im In-App-Browser: Wort und Satz starten nach Betätigung ohne Wiedergabefehler; Moduswechsel, bewusstes Aufdecken und Rückmeldung funktionieren. Vor der Hörantwort bleibt der englische Text verborgen; Fokus geht anschließend auf die Rückmeldung. Die temporäre Prüfvorschau wurde entfernt.
- Mehrdeutige Wörter read, present und wind wurden anhand der erzeugten englischen Lautfolgen im jeweiligen Beispielsatz geprüft.
- `git diff --check`: erfolgreich.

## Verbleibende Grenzen

- Synthetische Stimme; keine vollständige menschliche Hörprüfung aller 740 Dateien und keine Prüfung mit Kindern. Keine Bewertung der Aussprache der lernenden Person.
- Der Vite-Build meldet einen nicht blockierenden Größenhinweis für das Haupt-JavaScript-Bündel (563,91 kB, gzip 170,17 kB). Die MP3s werden einzeln erst bei Wiedergabe geladen.
- Native Audiowiedergabe unter Windows wurde lokal nicht geprüft. Der vorhandene Desktop-CI-Lauf baut die App für macOS und Windows; eine menschliche Hörprüfung dieser Plattformen bleibt ergänzend sinnvoll.
- Die Hörrunde bucht bewusst keine Punkte und verändert keine Wiederholungstermine. Die vorhandenen Backendtests bestätigen weiter die schriftliche Punkte- und Retrylogik.
