# Lernwelt-Oberfläche

Die Oberfläche richtet sich an Kinder von 10–12 Jahren. Kurze Texte, ruhige Flächen und ein einzelner klarer Einstieg pro Fach sollen Orientierung geben. Ein warmer grüner Akzent verbindet die Navigation; Mathematik und Englisch haben eigene Farbakzente und beschriftete Symbole. Die Illustration besteht aus lokalem SVG, die Schrift ist die Systemschrift.

## Navigation und Wachstum

„Meine Fächer“ ist die Startansicht. Die Fächerbibliothek rendert den Fachkatalog als automatisch umbrechendes Raster. Eine Suche mit sichtbarer Trefferzahl und Leerzustand macht auch größere Kataloge durchsuchbar. Fachnamen dürfen umbrechen; zusätzliche Fächer verbreitern weder die Navigation noch das Fenster. Ein Fach öffnet die Übung, „Alle Fächer“ führt zurück. Die zuletzt gewählte Fachkarte bleibt während der Sitzung markiert. Neue Fachinhalte müssen weiterhin im fachlichen Modell und Backend ergänzt werden; das Raster allein erzeugt keine Inhalte.

Die Seitennavigation hat vier stabile Ziele: Fächer, Vokabeltrainer, Einmaleins-Trainer und Spielhalle. Unter 760 CSS-Pixeln wird sie zu einem beschrifteten aufklappbaren Menü. Escape schließt es und gibt den Fokus zurück. Nach einem Bereichswechsel erhält die Inhaltsüberschrift den Fokus. Im Einmaleins-Trainer führen ausdrücklich gewählte nächste Aufgaben und gespeicherte Bauplanänderungen zum Antwortfeld; bloßes Laden übernimmt nicht den Navigationsfokus. Der Profilknopf bleibt oben sichtbar. Lernhilfen und weitere Informationen nutzen die bestehenden nativen HTML-Dialoge.

Einstellungen und Aufgaben stehen ab ausreichend breiten Fenstern nebeneinander. Kleine Fenster, große Schrift und lange Inhalte dürfen vertikal scrollen. Es gibt keine globale Scrollsperre. Die Spielgrafik erhält bei niedrigen Fenstern einen Overflow-Fallback statt gegen null zu schrumpfen.

Der Einmaleins-Trainer verbindet eine großflächige Illustration mit einer einzelnen Aufgabenkarte. Beschriftete Segmente wechseln zwischen Roboterwerkstatt und Einmaleins-Insel. Bauplan und Bauregal öffnen Dialoge, sodass Rechenart, Reihen und Gestaltungsvarianten die Hauptaufgabe nicht verdrängen. Die acht Bauschritte sind grafisch und als Text bzw. zugänglicher Fortschrittswert erkennbar. Originale SVG-Grafiken zeigen Werkzeuge, Roboter, eine Küstenlandschaft und sechs Inselbauwerke. Mathematikbilder erscheinen gezielt im Rechentipp. Die ruhigen Szenen benötigen keine Animation; die Medienabfrage für reduzierte Bewegung unterbindet zusätzliche Übergänge. [Details](multiplication-adventures.md).

## Orientierung an Apple

Grundlage sind Apples [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) und [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), abgerufen am 24.09.2026:

- Stabile, beschriftete Navigation; aktuelle Position durch Farbe, Fläche und semantischen Zustand erkennbar.
- Klare Hierarchie zwischen Navigation, Übung und ergänzenden Informationen; Anpassung an verfügbaren Platz.
- Systemschrift, sichtbarer Tastaturfokus, beschriftete Controls, Dialoge mit Escape/Fokusrückgabe, reduzierte Bewegung und höherer Kontrast bei entsprechender Systemeinstellung.

44 CSS-Pixel hohe Buttons und Formularfelder sind eine bewusste Entscheidung für die junge Zielgruppe, keine Behauptung eines generellen Apple-Mac-Mindestmaßes. Radiofelder liegen in mindestens 48 Pixel hohen anklickbaren Antwortzeilen. Das Design orientiert sich an den HIG; es ist kein natives SwiftUI- oder Liquid-Glass-Interface und keine Apple-Zertifizierung.

## Klasse und Daten

Das Klassenfeld bietet nur Klasse 5 an. Bestehende Profile anderer Klassen werden unverändert gelesen. Ein Hinweis erklärt die Umstellung beim expliziten Speichern; Name, Fortschritt und Punkte laufen weiter über die bestehenden Commands. Es gibt keine Schemaänderung oder automatische Datenmigration durch diese Oberfläche.
