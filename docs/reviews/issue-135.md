# Review Issue #135: Aufgaben ohne Scrollen im WQHD-Standardfenster

## Umfang und Reviewart

Unabhängiger Agent-Review durch `layout_review`, der keine Implementierung beigesteuert hat. Gesamtdiff gegen `origin/main` (6b164fa, inklusive der zuvor separat gemergten römischen Anleitung #134) geprüft: Layout-Commit a88b530, ergänzende Versionsmetadaten 0.6.4, README und dieser Nachweis. Der Nutzer wählte ausdrücklich nur das Standardfenster als feste Scrollfrei-Prüfgröße und verlangte anschließend eine WQHD-Ausrichtung. Das Standardfenster ist deshalb 2400 × 1300 für einen Bildschirm mit 2560 × 1440 Pixeln; kleinere Fenster und große Schrift behalten einen zugänglichen Scroll-Fallback.

## Änderungen

Die Oberfläche nutzt die breite Fläche statt der früheren Begrenzung auf 1800/1400 Pixel. Stufenwahl bleibt neben der Aufgabe. Lernrunden zeigen Aufgabe und Themenalbum nebeneinander. Sonnensystemmodell und Rätsel/Steckbrief sowie Naturspiel-Auswahl und aktive Runde stehen nebeneinander. Diagramme erhalten passende Größen ohne Verzerrung. Ergänzende Sonnensystemtexte sind kurze Dialogseiten. Themenlisten zeigen zwölf Unterthemen pro Seite, das Bauregal sechs Robotermodelle; alle Inhalte bleiben erreichbar. Der Einmaleins-Bauplan verwendet zwei Spalten. AGENTS.md und Oberflächen-/Architekturdokumentation verankern die Vorgabe. Keine globale Scrollsperre, keine abgeschnittenen Aufgaben, keine verkleinerte Schrift als Ersatz.

## Befunde und Korrekturen

- **P2, korrigiert:** Seiten-/Bereichswechsel der Themenliste setzte in kleinen Fenstern den Fokus auf eine außerhalb des Bildschirms liegende Überschrift mit `preventScroll`. Normales `focus()` zeigt die Überschrift wieder. Reviewer bestätigte den sichtbaren Fokus bei 420 × 600, 1100 × 750 und 2400 × 1300; im Standardfenster bleibt scrollY = 0.
- **P3, korrigiert:** Die Architektur nannte noch das alte Standardfenster. Angabe aktualisiert.
- Im Implementierungscheck gefundene Überläufe beim Ladefehler des Sonnensystems und bei abgeschlossenen Naturspielen wurden durch passende Diagrammgrößen und nebeneinanderliegende Karten/Abschlussfelder behoben. Der Galerie-Selektor begrenzt ausschließlich Vorschaubilder; die Großansicht bleibt tatsächlich groß.
- Finaler Reviewerbefund: keine offenen konkreten Defektbefunde. Keine Änderung an IPC, Aufgabenbedeutung, Lernprofilen, Datenbank, Antwortprüfung oder Punktebuchungen.

## Tatsächliche Prüfungen

- Chromium mit 2400 × 1300 CSS-Pixeln, 100 % Zoom: alle 3675 Fachaufgaben aus Mathematik (1767), Englisch (1368) und Natur und Technik (540) einschließlich aller Stufen auf äußeren Überlauf geprüft: keiner.
- Zusätzlich 151 Haupt-/Dialogzustände: Trainer, Lade-/Fehler-/Ohne-Profil-Zustände, Hilfen, Tabellen, alle 24 Planetenrätsel mit Rückmeldung und Rundenende, Pluto-Bilder/Großansicht. Nach Korrekturen kein äußerer oder innerer Überlauf. Die ursprüngliche Solar-Rückmeldung verwendete einen kurzen isolierten Mocktext; Fragen, Optionen und Planetenmodelle stammen aus dem gebündelten Paket.
- 34 weitere Browsermessungen: alle neun Naturspiel-Runden inklusive Abschluss und Tipp, Einmaleins-Bauplan, beide Bauregal-Seiten und die Suche mit allen Unterthemenseiten: kein Überlauf.
- Reviewer unabhängig: 405 tatsächliche Lernrundenansichten aus allen drei JSON-Paketen, allen neun Varianten und fünf Schritten sowie Tipps, falschen/richtigen Rückmeldungen und Mitmach-Selbstkontrolle; vor jeder Messung sichtbaren Zustand bestätigt. Kein Überlauf.
- Reviewer unabhängig: 42 römische Dialogseiten (sieben Seiten, beide Übungsarten, alle drei Stufen), sechs Escape-Fokusrückgaben und sieben echte Einmaleins-Abschluss-/Pausen-/Wiederholungszustände: kein Überlauf. Neun Standardscreenshots zusätzlich visuell angesehen.
- Reviewer: 64 relevante Verhaltenstests erfolgreich, danach StudyBrowser nach Fokuskorrektur erneut 3/3. Implementierer: vollständiges `npm run check:all` auf dem finalen Stand erfolgreich: 338 Frontendtests in 41 Dateien, 25 Skripttests, TypeScript, Produktionsbuild, Formatierung, rustfmt, Clippy und 157 Rusttests. Die Versionsprüfung gegen aktuelles main und `git diff --check` sind erfolgreich.
- Native macOS-Prüfung: isolierte Debug-App mit eigener Kennung `de.lernwelt.review135` gebaut und erfolgreich gestartet. Die native Oberfläche lädt die echten offline gebündelten Inhalte. Keine vorhandenen Nutzerdaten verwendet. Standardgröße wird im Fensterkonfigurationsmodell geprüft; der tatsächliche Bildschirm kann das native Fenster begrenzen.

## Grenzen und Abschluss

Geometriemessungen verwenden eine echte Chromium-Engine mit isolierten Desktop-Mocks; sie sind kein Ersatz für sämtliche Betriebssystem-/Schrift-/Zoomkombinationen. JSDOM-Verhaltenstests allein belegen keine Scrollfreiheit. Kleine Fenster dürfen bewusst scrollen. Keine Verständlichkeitsprüfung mit Kindern oder vollständige Barrierefreiheitszertifizierung behauptet. Temporäre Prüfseiten und Mock-Dateien wurden vor dem Abschluss entfernt und gehören nicht zum Produktionsbuild. Die nativen macOS-/Windows-CI-Prüfungen, der tatsächliche automatische Release 0.6.4 und die Branchbereinigung sind anhand des verknüpften PR und GitHub Actions zu bestätigen.
