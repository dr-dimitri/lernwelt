# Review zu Issue #96: Neue Lernwelt-Oberfläche

- Datum: 02.10.2026
- Issue: https://github.com/dr-dimitri/lernwelt/issues/96
- Branch: `codex/issue-96-frische-oberflaeche`
- Reviewer: Codex
- Reviewart: **Separater Selbstreview** nach der Umsetzung über den Gesamtdiff gegen `main`; keine unabhängige Freigabe.

## Umfang und Akzeptanzkriterien

Geprüft wurden die App-Hülle, Fächerbibliothek, neue dekorative SVG-Motive, gemeinsame Bedienelemente, Aufgabenflächen, Trainer, Spielhalle, Lernrunden und Dialoge sowie die aktualisierte Oberflächendokumentation. Dunkle Navigation, violette Hauptaktionen, weiße Arbeitskarten und gezielte Fachfarben bilden eine durchgängige Gestaltung für Kinder ab zehn Jahren. Die Fächer stehen vor den Lernrunden und bleiben über Suche und Tastatur auffindbar.

Die Prüfung umfasst Navigation und Rückweg, sichtbare Auswahlzustände, Fokus, schmale Fenster, Fehler und richtige/falsche Antworten. Die bestehenden Stufen bleiben frei wählbar. Grafiken sind lokal und dekorativ (`aria-hidden`); Fachnamen und Antwortfelder bleiben beschriftet. Änderungen betreffen weder fachliche Inhalte und stabile IDs noch Rust-Commands, Antwortprüfung, Punkte, Datenbankschema oder gespeicherte Lerndaten. Es wurden keine Abhängigkeiten und keine externen Ressourcen ergänzt.

## Befunde und Korrekturen

1. Die erste Farbfassung färbte durch allgemeine Fachklassen auch die gesamten Karten. Die Farben wurden auf Motive und Fachsymbol begrenzt; Text und Aktionen liegen auf ruhigen weißen Flächen.
2. Die Kennzeichnung der ersten Karte wurde von „Zuletzt gewählt“ auf „Ausgewählt“ geändert, damit die Standardauswahl keine vorherige Nutzeraktion behauptet.
3. Haupt- und Nebenaktionen in der Spielhalle wurden getrennt gestaltet. Beim Selbstreview wurde zusätzlich die Selektorspezifität reduziert, damit die hellen Spielsteuerungstasten und der gelbe Startknopf ihre gut erkennbaren Zustände behalten. Karten und pausierte Spielansicht wurden danach erneut visuell geprüft.
4. Die Lernrundenschritte stehen bei sehr wenig Platz in zwei Spalten mit 12-Pixel-Beschriftungen. Menü, Kopfleiste und Profildialog dürfen umbrechen; es entsteht kein horizontaler Seitenüberlauf in den geprüften Ansichten.
5. Die kleineren Beschreibungen der Stufen wurden auf 12 Pixel vergrößert. Die Darstellung fachlicher Natur-Diagramme behält ihre bisherigen Größen und Abstände.

Keine offenen blockierenden Befunde und keine neu festgestellten separaten Produktbugs.

## Prüfergebnisse

- `npm run check:all`: erfolgreich. Formatierung, 202 Vitest-Tests, 8 Skripttests, TypeScript und Produktionsbuild; anschließend Rustfmt, Clippy mit `-D warnings` und 115 Rust-Tests. Insgesamt 325 Tests erfolgreich.
- Nach den abschließenden CSS-Korrekturen: Formatierungsprüfung, TypeScript und Produktionsbuild erneut erfolgreich; betroffene Oberflächen erneut visuell geprüft.
- `git diff --check`: erfolgreich.
- Browserprüfung bei 1440 × 960, 1024 × 768, 760 × 650 und 360 × 800 CSS-Pixeln. Geprüft: Startseite, Suche mit und ohne Treffer, Löschen und Fokusrückgabe, Fachnavigation und Überschriftenfokus, Mathematikaufgabe, falsche und richtige Rückmeldung, Escape im Dialog, beide Trainer, Spielkarten und pausiertes Spielfeld, Lernrunde, kompaktes Menü und Profildialog.
- Bei 360, 760 und 1024 Pixeln entsprach die Dokumentbreite in den geprüften Ansichten der Fensterbreite. Navigation per Escape gab den Fokus an „Menü öffnen“ zurück; Suche löschen gab ihn ans Suchfeld zurück.
- Die Desktop-Zustände wurden über eine temporäre, isolierte Browser-Prüfseite mit vorhandenen Testfixtures dargestellt. Diese Prüfseite und ihre Mock-Schnittstellen wurden entfernt und sind nicht Teil des Commits oder Produktionsbuilds. Keine echten Lerndaten wurden für die Prüfung verändert. Die normale Browser-Vorschau zeigt weiterhin den Hinweis zur fehlenden Desktop-Persistenz.
- Farbkontraste rechnerisch geprüft: weißer Hauptbuttontext 6,37:1; Haupttext auf Weiß 14,31:1; Nebeninformation auf Weiß 5,94:1; Navigation 9,77:1; aktive Navigation 8,10:1. Der große, fette Apricot-Herotext erreicht 4,29:1. Dies ersetzt keine vollständige Barrierefreiheitsprüfung.
- Reduzierte Bewegung und höherer Kontrast im CSS geprüft. Die vorhandene globale Medienabfrage deaktiviert Übergänge und Hover-Verschiebungen; keine neuen automatischen Animationen.

## Verbleibende Grenzen

Keine Verständlichkeitsprüfung mit Kindern, keine unabhängige Reviewfreigabe und keine vollständige Screenreader- oder Betriebssystem-Kontrastprüfung. Die Browserprüfung ersetzt keinen manuellen Start auf Windows; native Builds und plattformbezogene Prüfungen werden zusätzlich über die PR-CI auf macOS und Windows ausgeführt. Der Produktionsbuild meldet weiterhin einen JavaScript-Chunk über 500 kB; der Build ist erfolgreich, die bestehende Bündelstruktur wurde in diesem Design-Issue nicht geändert.

## Abschluss

Lokaler Selbstreview erfolgreich. Merge erst nach grünen PR-Prüfungen; deren Ergebnis und Merge sind im zugehörigen Pull Request nachvollziehbar.
