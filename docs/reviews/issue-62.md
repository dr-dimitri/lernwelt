# Review zu Issue #62

## Umfang und Akzeptanzkriterien

- Neue Startansicht mit durchsuchbarer, datenbasierter Fächerbibliothek, automatisch umbrechenden Karten und Rückweg aus dem Fach.
- Stabile Seitennavigation für Fächer, beide Trainer und Spielhalle; kompaktes Menü unter 760 CSS-Pixeln. Profil bleibt oben erreichbar.
- Konsolidierte Gestaltung mit Systemschrift, lokalem SVG, kindgerechten Farben, großen Bedienelementen, sichtbarem Fokus, Kontrast- und Bewegungseinstellungen.
- Ausschließlich Klasse 5 in der Auswahl. Alte Klassen werden beim Laden nicht verändert; explizites Speichern stellt transparent auf Klasse 5 um.
- Unveränderte Commands, Datenbank, Punkte- und Übungslogik. Keine neuen Bibliotheken oder externen Laufzeitressourcen.
- Gestaltungsentscheidungen und Apple-HIG-Bezug in [interface.md](../interface.md); README beschreibt die neue Bedienung.

## Reviewart und Reviewer

Separater Review nach der Implementierung über den gesamten Diff gegen `origin/main`:

- Agent `profile_grade`: unabhängiger Review von App, Fächerbibliothek, CSS und Navigationstests; Profilteil zunächst ausdrücklich als Selbstreview.
- Agent `design_audit`: zusätzlicher unabhängiger Review des Profilteils einschließlich bestehender Backend-Speichersemantik, Profiltests und README-Aussagen. Er hatte diesen Teil nicht implementiert.
- Hauptagent: ergänzender Selbstreview und visuelle Kontrolle der Screenshots in Chromium und WebKit.

Damit wurden auch die von einem Reviewer selbst geschriebenen Profiländerungen separat von einem anderen Agenten geprüft. Keine menschliche Freigabe oder Prüfung mit Kindern behauptet.

## Befunde und Korrekturen

1. Der erste Entwurf stellte bei Laptopbreite die Trainereinstellungen oberhalb der Aufgabe dar. Breakpoint und Abstände korrigiert; bei 1100 Pixeln bleiben Einstellungen und Übung nebeneinander, die Antwort ist unmittelbar erreichbar.
2. Ein testinterner Cast für 40 zukünftige Fach-IDs schlug in TypeScript fehl. Als bewusste Testfixture isoliert; produktive Fachtypen unverändert. Typecheck danach erfolgreich.
3. Fehlender Höhen-Fallback hätte die Spielfläche bei sehr niedrigen breiten Fenstern stark verkleinert. Fallback ergänzt; Canvas bei 1200×350 mit 650×406 CSS-Pixeln, vertikal zugänglich.
4. Eine Fokusanforderung konnte bei Auswahl der bereits sichtbaren Ansicht stehen bleiben. Nur tatsächliche Ansichts-/Fachwechsel setzen die Anforderung; Fokus auf gleicher Ansicht direkt behandelt.
5. Escape schloss das kompakte Menü zunächst nur aus den Navigationspunkten. Handler auf das gemeinsame `aside` verschoben; Escape am Menüknopf und innerhalb der Navigation getestet.

Nach den Korrekturen: keine offenen blockierenden Befunde. Die Punkte 3–5 wurden im separaten Review nachgeprüft. Dies waren Befunde in der laufenden Umsetzung, keine stillen Nebenfixes vorhandener Produktbugs.

## Prüfergebnisse

- `npm run check`: erfolgreich; Prettier, 87 Frontend-Tests, 2 Issue-Workflow-Tests, TypeScript und Produktionsbuild.
- `npm run check:rust`: erfolgreich; rustfmt, Clippy mit `-D warnings`, 63 Rust-Tests. Unter anderem bleiben Fortschritt und Punkte bei Profiländerungen erhalten.
- `git diff --check`: erfolgreich.
- Lokale Browserprüfung in Chromium und WebKit: Bibliothek, Suche/Leerzustand/Löschen, Fachwechsel, Lernen, beide Trainer, Spielhalle, Profil, Dialog-Escape und Fokusrückgabe.
- Größen: 1100×750, 420×600 und 550×375 CSS-Pixel (verfügbare Fläche entsprechend 200% Zoom im Standardfenster). Kein horizontaler Seitenüberlauf in den geprüften Ansichten; langer Inhalt bleibt vertikal scrollbar.
- Skalierungstest mit 40 langen Testfachnamen, Filter auf den letzten Eintrag bei 420 Pixeln: erreichbar und kein horizontaler Überlauf. Unit-Test mit 40 Einträgen zusätzlich vorhanden.
- Übungsansicht zusätzlich mit den tatsächlichen gebündelten Lerntexten, Themenwahl und Streber-Aufgabe visuell geprüft. Spielcanvas in niedriger Ansicht geprüft.
- Browser ohne Desktop-Mock: verständlicher Hinweis auf die Desktop-App, Profilspeicherung gesperrt; keine vorgetäuschte Persistenz.
- Keine JavaScript-Laufzeitfehler in beiden Browserprüfungen.

## Grenzen und Freigabe

Die browserseitigen Lernstände waren ausdrücklich Testdaten; reale Nutzerprofile wurden nicht verändert. Die visuelle Prüfung ersetzt weder einen Nutzertest mit Kindern noch eine vollständige Screenreader-Prüfung. 550×375 prüft die verfügbare Layoutfläche, nicht alle betriebssystemspezifischen Schriftvergrößerungen. WebKit wurde geprüft, aber kein manueller nativer Windows-Test ausgeführt. Native Builds und die plattformübergreifenden Checks laufen zusätzlich in der PR-CI vor dem Merge.

Lokaler Review abgeschlossen; Merge erst nach grünen erforderlichen CI-Prüfungen. Keine Schema-/IPC-Änderungen und keine ungelösten Datenhaltungsbefunde.
