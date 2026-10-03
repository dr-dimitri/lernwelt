# Review zu Issue #118: Tastaturhilfe ohne Scrollen

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `worms_frontend` am 03.10.2026. Der Reviewer hat keinen Produktionscode von Issue #118 implementiert und schreibt in dessen Arbeitsbaum ausschließlich diese Reviewdatei. Grundlage sind AGENTS.md, beide Projektskills, README, Architektur und die Akzeptanzkriterien von [Issue #118](https://github.com/dr-dimitri/lernwelt/issues/118).

Geprüft wird der gesamte Diff von `codex/issue-118-kompakte-tastaturhilfe` gegen `origin/main` (`261330d4b8b718e1b853fe34fccf0b538576e6ad`). Der Umfang umfasst die Anordnung der Tastschreibseite, die kompakte Kursauswahl, die vorhandenen Handgrafiken, CSS, Oberflächentests sowie die aktualisierten Bedienungsdokumente. Die Versionserhöhung und Worms gehören zum getrennten Issue #119.

## Befunde

Im unabhängigen Quell-, Inhalts-, Regressionstest- und visuellen Review des finalen Stands wurden keine blockierenden Befunde gefunden. Die Akzeptanzkriterien sind erfüllt. Der Reviewer musste keine zusätzlichen Produktkorrekturen verlangen.

## Verhalten, Zugänglichkeit und Datenhaltung

Die kompakte Kursauswahl enthält alle zwölf frei wählbaren Sektoren mit Namen und bestätigten Zeilen. Sie verwendet ein beschriftetes natives Auswahlfeld und ruft den vorhandenen Auswahlpfad auf. Die drei frei wählbaren Zeilen und die drei fachübergreifenden Stufen bleiben erreichbar. Während einer laufenden oder unklaren Speicherung ist die Kursauswahl ebenso wie die bisherige Navigation gesperrt.

Die Vorlage nutzt im Laptopfenster die ganze Breite. Eingabe, Prüfknopf und Hilfeknopf stehen darunter nebeneinander. Die Bildschirmtastatur, beide Hände und die Haltungshinweise folgen direkt darauf. Ein gemeinsamer Hinweis nennt Taste, Finger und gegebenenfalls die andere Umschalttaste oder den frei gewählten Daumen. Längere Start- und Sektortexte sowie der Sektortipp bleiben in der vorhandenen Anleitung erreichbar. Eingabe und Prüftaste behalten ihre Beschriftungen und Textverweise. Es wird keine globale Tastenerfassung eingeführt.

Die Fingerzuordnung wird nicht geändert. Beide Handgrafiken behalten zehn Finger, innenliegende Daumen, ASDF/JKLÖ-Grundtasten und normal lesbare Beschriftungen der gespiegelten rechten Hand. Die kürzere Zeichnung entfernt den unteren Unterarmteil, ohne Finger abzuschneiden. Größere SVG-Beschriftungen halten Grundtasten und Seitennamen in der kompakten Ansicht lesbar. Aktiver Finger, gegenüberliegender kleiner Finger für Shift und die ausdrücklich als Wahl erklärten Daumen bleiben mit Text und Umrissen vermittelt. Vollständige, bestätigt richtige und unbekannte Zeichen bleiben neutral. Im kurzen Laptopfenster werden doppelte Handtexte ausgeblendet; dieselbe Information bleibt im gemeinsamen sichtbaren Hinweis und in der SVG-Beschreibung für Screenreader erhalten. Auf schmalen Fenstern erscheinen die Handtexte wieder. Die gekürzten Haltungshinweise erklären gekrümmte Finger, frei bewegliche Hände, möglichst gerade Handgelenke, lockere Schultern, F/J und die Rückkehr zur Grundstellung; die Seitenansicht bleibt schematisch.

Der zusätzliche große Seitentitel ist im kurzen Laptopfenster visuell verborgen und bleibt im Dokument für Screenreader erreichbar. Navigation, Kopfzeile und der sichtbare Übungstitel benennen den Bereich weiter. Schmale Fenster ordnen Formular, Tastatur, Hände und Hinweise untereinander an. Das Layout setzt weder eine feste Gesamtseitenhöhe noch ein Abschneiden längerer Vorlagen oder Fehlerzustände ein. Lediglich die bekannte Tastaturregion erlaubt bei zu geringer Breite eigenes waagerechtes Verschieben.

Eingabeprüfung, IME-/Kompositionsschutz, bewusstes Prüfen, Fokusanforderungen, Fehlerkorrektur, Übertragungssperren und Retry-Nutzlasten sind unverändert. Der Diff enthält keine Änderungen an Aufgaben, stabilen IDs, Zielzeilen, gemeinsamer Fingerlogik, Punktevergabe, IPC, Rust, Datenbank, Migrationen, Berechtigungen oder Abhängigkeiten. Alle Grafiken und Schriften bleiben lokal. Das Layout selbst schreibt keine Daten.

## Tatsächlich ausgeführte Prüfungen

Vom unabhängigen Reviewer selbst ausgeführt:

- `npx vitest run src/components/TypingHands.test.tsx src/components/TypingPanel.test.tsx src/domain/typing.test.ts src/App.test.tsx src/lib/desktop.test.ts`: **43 Tests in fünf Dateien erfolgreich**. Die Prüfungen umfassen alle zwölf Kurswechsel bei eingeblendeter Hilfe, bestätigten Fortschritt, Ein-/Ausblenden, linke/rechte Finger und Shift, Daumenwahl, neutrale Zustände, Rücktaste, Fehler-/Retry-/Profil-/Unmount- sowie IME-Pfade. App-Navigation und die typisierte Desktop-Schnittstelle sind ebenfalls abgedeckt.
- `npm run typecheck`: erfolgreich.
- `git diff --check`: erfolgreich.
- Gesamtdiff einschließlich beider aktualisierter Bedienungsdokumente gelesen. Der längste tatsächliche Zieltext wurde für die visuelle Kontrolle identifiziert: Logbuch, Streber, Zeile 2 mit 62 Zeichen.
- Die beiden tatsächlichen Browser-Screenshots des finalen Stands selbst in Originalauflösung angesehen: **1100 × 750** mit Logbuch/Streber/Zeile 2 und **420 × 800** mit Funkkontakt/Könner. Im Laptopbild liegen die vollständige längste Vorlage, Eingabe, Prüf- und Hilfeknopf, die komplette QWERTZ-Tastatur, beide beschrifteten Hände und alle drei Haltungshinweise gemeinsam im sichtbaren Fenster. D und der linke Mittelfinger sowie rechtes Shift und der rechte kleine Finger stimmen überein. Im schmalen Bild sind Hände, Grundtasten und Haltungshinweise vollständig lesbar untereinander angeordnet; das F und der linke Zeigefinger passen zusammen. Die Tastatur ist dort erwartungsgemäß in ihrem eigenen Bereich seitlich verschiebbar.
- Das Gesamtprüfprotokoll `/private/tmp/lernwelt-118-check.log` des ausführenden Agenten gelesen: `npm run check` mit **263 Frontendtests in 32 Dateien**, **acht Skripttests**, Formatprüfung, TypeScript und Produktionsbuild erfolgreich. Diese Gesamtprüfung wurde nicht vom Reviewer gestartet. Die vorhandene Vite-Warnung zu einem JavaScript-Bundle über 500 kB bleibt bestehen und ist kein Buildfehler.

Vom ausführenden Agenten zusätzlich berichtet, nicht vom Reviewer selbst im Browser gemessen: Bei 1100 × 750 und Scrollposition 0 endet die Hilfe für die längste Logbuch/Streber-Zeile bei 727,6 Pixeln, für die Funkkontakt/Könner-Startzeile bei 696,8 Pixeln. Im schmalen Fenster beträgt die Seitenbreite 420 Pixel wie die Fensterbreite; es gibt keinen horizontalen Seitenüberlauf. Der Reviewer prüfte die tatsächlichen Bilder, nicht diese DOM-Abmessungen. Die Browserprüfung verwendet echte App-Komponenten und echte Inhalte mit einer temporären simulierten Desktop-Schnittstelle. jsdom besitzt kein reales Layout; die Komponententests allein belegen keine Scrollfreiheit.

## Grenzen und Abschlussstatus

Bei schmalen Fenstern oder vergrößerter Darstellung darf die Seite länger werden; Inhalte und die seitlich verschiebbare Tastatur bleiben erreichbar. Fehler- und Ergebniszustände bleiben verständlich erreichbar, ohne dass jeder zusätzliche Hinweis zwingend in das kurze Laptopfenster passt. Browserbilder ersetzen keine native Speicherprüfung. Der Reviewer führte keinen eigenen nativen Start-, Installer-, Windows-, Screenreader-, Geräte- oder Test mit Jugendlichen durch; ein gesonderter Zoom-Screenshot wurde nicht geprüft. Das Issue verändert ausschließlich die Oberfläche und erfordert keine neue Persistenzmigration. Native Gesamtprüfung, Versionsbau und Veröffentlichung werden im getrennten Issue #119 vorgenommen. Eine tatsächliche Haltungsmessung oder pädagogische Wirksamkeit wird nicht behauptet.

**Review abgeschlossen:** Quell-, Inhalts-, Regressionstest- und visuelle Prüfung sowie die lokalen Gesamtprüfungen sind erfolgreich. Keine offenen blockierenden Befunde. Freigabe für den anschließenden PR- und Mergeablauf bei grünen erforderlichen CI-Checks. Das Issue gilt erst nach Merge als abgeschlossen; Merge, neue Plattformpakete und Veröffentlichung werden durch diesen Review noch nicht als erledigt behauptet.
