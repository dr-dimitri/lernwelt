# Review Issue #58: Kompakte Ansichten

## Reviewart und Umfang

Separater Selbstreview durch Codex am 24.09.2026; keine unabhängige Freigabe. Gesamtdiff gegen main nach Integration der Issues #56/#57 geprüft: App-Navigation, Profil, Lern-/Traineransichten, Arcade, InfoPanel, Tabellenseiten, Tastatur/Fokus, Fehleranzeigen, CSS-Breakpoints und Tauri-Fenstergröße. Keine offenen blockierenden Befunde.

## Verhalten und Nachbesserungen

Profil und Zusatzinformationen öffnen eigene Dialoge. Umfangreiche Erklärungen/Tabellen/Mitmachaufgaben sind seitenweise erreichbar; Inhalte werden nicht abgeschnitten. Fach- und Stufenwahl sowie Antwortprüfung und Punkte bleiben verfügbar. Richtig/falsch öffnet eine kompakte Rückmeldung mit Weitergehen. Bei Belohnungen stehen Speicherfehler und Bestätigung im aktiven Dialog. Fokus kehrt nach Escape zum Auslöser und nach Antwort-Weitergehen zur stabilen Übungsregion zurück. Öffnen von Spielhilfen pausiert über den bestehenden Fokusverlust-Mechanismus.

Im visuellen Review zunächst zu hohe Trainer-Seiten und zwei lange Matheaufgaben korrigiert: Karteifachübersicht separat, Rechentipp neben der Rechnung, Lernhilfen unter der Frage, niedrigere Kopfbereiche. Canvas an verfügbare Höhe angepasst, Pause/Ende daneben. Tabellen sind in Achtergruppen unterteilt. Hinweise auf ein Profil „unten“ durch den neuen Ort oben ersetzt. Testselektoren auf neue Navigation angepasst; keine fachlichen Antworten verändert.

## Prüfungen

- `npm run check:all`: erfolgreich, **80 Frontendtests + 2 Workflowtests + 63 Rusttests**, Formatierung, TypeScript, Vite, Clippy.
- Neue Tests für Hilfeseiten, Escape/Fokusrückgabe, alle 25 Tabellenzeilen per Navigation und automatische Antwort-Rückmeldung mit Fokus beim Weitergehen. Bestehende Lade-/Speicherfehler, Punkte, Trainer und Spielsteuerungen bleiben grün.
- Browserprüfung mit temporären, ausdrücklich isolierten Testadaptern und echten gebündelten Lehrplanfragen: 363 Mathematikaufgaben in drei Stufen und 108 Englischaufgaben ausgewählt/vermessen. Zwei lange Mathefragen überschritten zunächst die Zielhöhe; nach der Korrektur passt auch die längste geprüfte Geometriefrage. Hauptansichten bei 1100×750 ohne horizontalen oder vertikalen Seitenüberlauf; Quadratzahlen zusätzlich bei 1100×728 geprüft. Die temporären Adapter/HTML-Dateien wurden vor Build und Commit entfernt.
- Mathematik-Erklärungen und Tabellen seitenweise geprüft: kein Dialogüberlauf bei 1100×750. Themenwahl, Profil und Spielansicht ebenfalls vermessen; Screenshots auf Lesbarkeit geprüft.
- Nativer macOS-Release-Build mit separater Test-App-ID erfolgreich. Native Startprüfung im 1100×750-Fenster: vorhandenes Testprofil, korrekte Rückmeldung für bereits gelöste Aufgabe ohne neue Punkte, Weitergehen mit Fokus auf Übung; neues Labyrinth mit vollständiger Steuerung/Pause und Abschlussansicht ohne Scrollleiste. Eintritt 26 → 16 nur im Testprofil, Ergebnis gespeichert. Reguläre Nutzerdaten nicht verändert.
- `git diff --check`: erfolgreich. Windows-/macOS-CI vor Merge erforderlich.

## Grenzen

1100×750 ist die geprüfte Zielgröße bei Standardschrift. Kleine Fenster, vergrößerte Schrift und außergewöhnlich lange Fehlermeldungen behalten Scrollmöglichkeiten statt abgeschnittener Inhalte. Keine pauschale Scrollfreiheit für beliebige Auflösungen oder Zoomstufen. Browseradapter prüfen Layout; native Prüfung und Rusttests prüfen tatsächliche Speicherung. Native Windows-UI und Screenreader nicht manuell erprobt; keine Verständlichkeitsstudie mit Kindern.
