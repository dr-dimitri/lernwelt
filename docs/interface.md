# Lernwelt-Oberfläche

Die Oberfläche richtet sich an Kinder ab zehn Jahren. Die dunkle, violettblaue Seitennavigation gibt dem hellen Lernraum einen festen Rahmen. Violett kennzeichnet Hauptaktionen und Auswahlen; Apricot und Mint ergänzen die Fächer. Weiße Karten, gut lesbare Aufgaben und kurze Texte halten den Arbeitsbereich ruhig. Die Gestaltung verwendet die lokale Systemschrift und eigene, gebündelte SVG-Grafiken; sie benötigt keine externen Ressourcen.

Der Einstieg „Dein nächstes Aha wartet.“ lädt zum Entdecken ein. Direkt darunter stehen die Fächer mit eigenen Motiven: Rechner und Geometrie für Mathematik, Sprechblasen für Englisch, Blatt und Lupe für Natur und Technik. Grafiken sind dekorativ und werden vor Screenreadern verborgen. Namen und Beschreibungen benennen jedes Fach. Eine ausgewählte Karte zeigt zusätzlich „Ausgewählt“ und ein Häkchen. Lernrunden folgen unter der Fächerauswahl. Die großen Farbflächen bleiben auf den Einstieg und die Motive begrenzt; Übungen stellen die Frage und Antwort in den Vordergrund.

## Navigation und Wachstum

„Meine Fächer“ ist die Startansicht. „Womit legen wir los?“ kennzeichnet die Fächerauswahl, die beschriftete Suche steht daneben und im schmalen Fenster darunter. Die Fächerbibliothek rendert den Fachkatalog als automatisch umbrechendes Raster. Eine Suche mit sichtbarer Trefferzahl und Leerzustand macht auch größere Kataloge durchsuchbar. Fachnamen dürfen umbrechen; zusätzliche Fächer verbreitern weder die Navigation noch das Fenster. Ein Fach öffnet die Themenübersicht mit Lernbereichen und gezielt auswählbaren Unterthemen; eine Fachbegriffsuche führt auch direkt zu einem Unterthema. Die Auswahl startet eine kurze Runde. „Alle Fächer“ führt zurück. Die zuletzt gewählte Fachkarte bleibt während der Sitzung markiert. Neue Fachinhalte müssen weiterhin im fachlichen Modell und Backend ergänzt werden; das Raster allein erzeugt keine Inhalte.

Die Seitennavigation hat vier stabile Ziele: Fächer, Vokabeltrainer, Einmaleins-Trainer und Spielhalle. Bis einschließlich 760 CSS-Pixeln wird sie zu einem beschrifteten aufklappbaren Menü. Escape schließt es und gibt den Fokus zurück. Nach einem Bereichswechsel erhält die Inhaltsüberschrift den Fokus. Im Einmaleins-Trainer führen ausdrücklich gewählte nächste Aufgaben und gespeicherte Bauplanänderungen zum Antwortfeld; bloßes Laden übernimmt nicht den Navigationsfokus. Profil und App-Updates bleiben oben erreichbar. Die Kopfleiste darf bei wenig Platz umbrechen, damit kein Knopf verdrängt wird. Lernhilfen und weitere Informationen nutzen die bestehenden nativen HTML-Dialoge.

Einstellungen und Aufgaben stehen ab ausreichend breiten Fenstern nebeneinander. Kleine Fenster, große Schrift und lange Inhalte dürfen vertikal scrollen. Es gibt keine globale Scrollsperre. Im schmalen Fenster stehen die fünf Lernrundenschritte in einem zweispaltigen Raster mit lesbaren Beschriftungen. Die Spielgrafik erhält bei niedrigen Fenstern einen Overflow-Fallback statt gegen null zu schrumpfen.

Der Einmaleins-Trainer verbindet eine großflächige Illustration mit einer einzelnen Aufgabenkarte. Beschriftete Segmente wechseln zwischen Roboterwerkstatt und Einmaleins-Insel. Bauplan und Bauregal öffnen Dialoge, sodass Rechenart, Reihen und Gestaltungsvarianten die Hauptaufgabe nicht verdrängen. Die acht Bauschritte sind grafisch und als Text bzw. zugänglicher Fortschrittswert erkennbar. Originale SVG-Grafiken zeigen Werkzeuge, Roboter, eine Küstenlandschaft und sechs Inselbauwerke. Mathematikbilder erscheinen gezielt im Rechentipp. Werkstatt und Arbeitskarte greifen die violetten und warmen Flächen der übrigen Oberfläche auf. Die ruhigen Szenen benötigen keine Animation; die Medienabfrage für reduzierte Bewegung unterbindet zusätzliche Übergänge. [Details](multiplication-adventures.md).

## Orientierung an Apple

Grundlage sind Apples [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) und [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), abgerufen am 24.09.2026:

- Stabile, beschriftete Navigation; aktuelle Position durch Farbe, Fläche und semantischen Zustand erkennbar.
- Klare Hierarchie zwischen Navigation, Übung und ergänzenden Informationen; Anpassung an verfügbaren Platz.
- Systemschrift, sichtbarer Tastaturfokus, beschriftete Controls, Dialoge mit Escape/Fokusrückgabe, reduzierte Bewegung und höherer Kontrast bei entsprechender Systemeinstellung.

Hauptaktionen sind gefüllt, ergänzende Aktionen wie „So geht’s“ sind umrandet. Die Stufenauswahl ist zusätzlich zur Farbe durch Rand und den semantischen Zustand markiert. Fehler bleiben rot mit erklärendem Text, richtige Antworten erhalten eine grüne Rückmeldung. Die blaue Fokusmarkierung im Lernraum und die helle Fokusmarkierung in der Navigation sind von der Auswahlfarbe unterscheidbar. Keine neuen bewegten Szenen oder automatischen Animationen wurden eingeführt.

44 CSS-Pixel hohe Buttons und Formularfelder sind eine bewusste Entscheidung für die junge Zielgruppe, keine Behauptung eines generellen Apple-Mac-Mindestmaßes. Radiofelder liegen in mindestens 48 Pixel hohen anklickbaren Antwortzeilen. Das Design orientiert sich an den HIG; es ist kein natives SwiftUI- oder Liquid-Glass-Interface und keine Apple-Zertifizierung.

## Klasse und Daten

Das Klassenfeld bietet nur Klasse 5 an. Bestehende Profile anderer Klassen werden unverändert gelesen. Ein Hinweis erklärt die Umstellung beim expliziten Speichern; Name, Fortschritt und Punkte laufen weiter über die bestehenden Commands. Es gibt keine Schemaänderung oder automatische Datenmigration durch diese Oberfläche.

## Prüfung und Grenzen

Für die Neugestaltung wurden Startseite, Such-Leerzustand, Fachaufgaben, Rückmeldungen, Trainer, Spielhalle, Lernrunde und Profildialog im Browser geprüft. Isolierte Testdaten erlauben die visuelle Prüfung von Desktop-Zuständen ohne Veränderungen an Lerndaten. Die reguläre Browser-Vorschau weist weiterhin ehrlich auf die fehlende Desktop-Persistenz hin. Fensterbreiten von 360, 760, 1024 und 1440 CSS-Pixeln werden beim Review berücksichtigt. Automatisierte Regressionstests prüfen unter anderem Suche, Tastaturbedienung, Dialoge und Speicherfehler. Dies ist keine Verständlichkeitsprüfung mit Kindern oder vollständige Barrierefreiheitszertifizierung. Der Reviewnachweis steht in [Issue 96](reviews/issue-96.md).
