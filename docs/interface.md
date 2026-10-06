# Lernwelt-Oberfläche

Issue #149 setzt das ausgewählte Konzept **Direkt zum Thema** zunächst als Vorabversion um. Die Oberfläche richtet sich an Kinder der Klasse 5. Die helle Fachleiste benennt Mathematik, Englisch, Natur und Technik sowie Geographie mit Text und Zeichen. Issue #151 ergänzt **Seitenleiste einklappen / ausklappen**: Auf Wunsch bleibt eine 96 Pixel breite Symbolleiste. Zugängliche Namen, Titel und sichtbare Namenshinweise bei Mauszeiger und Tastaturfokus erhalten die Orientierung. Aktuelles Fach: markierte Fläche, Häkchen und `aria-current`. Die lokale Systemschrift und gebündelte Ressourcen ermöglichen Offlinebetrieb.

Der Einstieg ist Mathematik. Alle Unterthemen erscheinen direkt, mit höchstens sechs Zielen je Seite. Suche verwendet die vorhandene Normalisierung, Fachbegriffe und Keywords; ein optionaler Lernbereichsfilter ergänzt den Kontext. Ein Klick auf ein sichtbares Thema öffnet die erste Frage. Passende konkrete Vokabeldecks und drei Lernreisen sind ebenfalls direkte Ziele. Gleiche Linktexte erhalten das vorhandene Wortthema als sichtbaren Kontext. Geographie öffnet gezielt Entdecken oder Rätsel. Trainer & Spiele bietet Vokabeln, Einmaleins, Tastschreiben, Naturspiele und Spielhalle.

Ein Aufgabenbildschirm enthält Frage, Material, Eingabe und eine hervorgehobene Hauptaktion: Prüfen, Wird gespeichert … oder Weiter. Bestehende automatische Trainerprüfung bleibt erhalten. Fachfeedback erscheint inline; Tipps neben der Frage öffnen auf Wunsch, ergänzende Hilfe nutzt kurze beschriftete Dialogseiten. Quellen, Mitmachaufgaben und Lösungswege bleiben erreichbar. Im gewählten Lernziel erscheint bei fehlendem Profil ein kurzer Spitznamenschritt mit Speichern. Das Ziel bleibt nach erfolgreichem Speichern erhalten.

Die beschriftete aktuelle Stufe ist oben sichtbar. Alle drei Stufen bleiben frei wählbar; erst die Backendbestätigung ändert die aktive Stufe. Themen-, Fach- und Stufenwechsel mit ungesendeter Antwort fragen Bleiben / Wechseln. Escape und Bleiben erhalten Eingabe und Fokus. Laufende Mutationen sperren Wechsel, auch beim Speichern eines Profils und Einlösen eines Abzeichens. Wiederholte Antwortübertragungen verwenden weiterhin den vorhandenen Request. Sammlung und Update-Einstellungen sind oben beschriftet erreichbar.

Der Rückweg Zu den Themen erhält Fach, Query, Filter, Seite und Kartenfokus während der Sitzung. Der Zustand wird bewusst nicht dauerhaft gespeichert. Gewöhnliche Fachrunden starten nach einem Neustart neu; Lernreisen behalten ihre vorhandenen gespeicherten Sitzungen. Die bevorzugte Breite der Fachleiste wird getrennt unter `lernwelt.sidebarCollapsed` im lokalen Browserspeicher gespeichert. Fehlende, ungültige oder nicht lesbare Werte starten mit der breiten Leiste; ein Schreibfehler lässt den aktuellen Layoutwechsel zu. Einklappen verändert weder Antwort, Aufgabe, Stufe noch laufende Übertragung und löst keine Wechselbestätigung aus. Im kleinen Fenster bleibt die Navigation vollständig beschriftet: Menü öffnen steuert sie unabhängig von der Desktopbreite; Escape gibt den Fokus an diesen Knopf zurück.

Das Standardfenster hat 2400 × 1300 Pixel. Die Aufgabe nutzt den verfügbaren Platz, die Hilfe steht daneben. Kleine Fenster und 200 % Zoom bleiben durch lesbare Umbrüche und einen Scroll-Fallback erreichbar. Es gibt keine globale Scrollsperre. Controls in der neuen App-Oberfläche sind mindestens 56 CSS-Pixel hoch; die größere anklickbare Zeile um Radiofelder gehört dazu. Keine automatische Rückmeldungsseite, keine alleinige Symbolnavigation und kein Hoverwissen sind erforderlich.

## Orientierung an Apple

Grundlage sind Apples [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) und [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), abgerufen am 24.09.2026:

- Stabile, beschriftete Navigation; aktuelle Position durch Farbe, Fläche und semantischen Zustand erkennbar.
- Klare Hierarchie zwischen Navigation, Übung und ergänzenden Informationen; Anpassung an verfügbaren Platz.
- Systemschrift, sichtbarer Tastaturfokus, beschriftete Controls, Dialoge mit Escape/Fokusrückgabe, reduzierte Bewegung und höherer Kontrast bei entsprechender Systemeinstellung.

Hauptaktionen sind gefüllt, ergänzende Aktionen wie „So geht’s“ sind umrandet. Die Stufenauswahl ist zusätzlich zur Farbe durch Rand und den semantischen Zustand markiert. Fehler bleiben rot mit erklärendem Text, richtige Antworten erhalten eine grüne Rückmeldung. Die blaue Fokusmarkierung im Lernraum und die helle Fokusmarkierung in der Navigation sind von der Auswahlfarbe unterscheidbar. Keine neuen bewegten Szenen oder automatischen Animationen wurden eingeführt.

56 CSS-Pixel hohe Buttons und Formularfelder sind eine bewusste Entscheidung für die junge Zielgruppe, keine Behauptung eines generellen Apple-Mac-Mindestmaßes. Radiofelder liegen in mindestens 56 Pixel hohen anklickbaren Antwortzeilen. Das Design orientiert sich an den HIG; es ist kein natives SwiftUI- oder Liquid-Glass-Interface und keine Apple-Zertifizierung.

## Klasse und Daten

Das Klassenfeld bietet nur Klasse 5 an. Bestehende Profile anderer Klassen werden unverändert gelesen. Ein Hinweis erklärt die Umstellung beim expliziten Speichern; Name, Fortschritt und Punkte laufen weiter über die bestehenden Commands. Es gibt keine Schemaänderung oder automatische Datenmigration durch diese Oberfläche.

## Prüfung und Grenzen

Für die Neugestaltung wurden Startseite, Such-Leerzustand, Fachaufgaben, Rückmeldungen, Trainer, Spielhalle, Lernrunde und Profildialog im Browser geprüft. Isolierte Testdaten erlauben die visuelle Prüfung von Desktop-Zuständen ohne Veränderungen an Lerndaten. Die reguläre Browser-Vorschau weist weiterhin ehrlich auf die fehlende Desktop-Persistenz hin. Fensterbreiten von 360, 760, 1024 und 1440 CSS-Pixeln werden beim Review berücksichtigt. Automatisierte Regressionstests prüfen unter anderem Suche, Tastaturbedienung, Dialoge und Speicherfehler. Dies ist keine Verständlichkeitsprüfung mit Kindern oder vollständige Barrierefreiheitszertifizierung. Der Reviewnachweis steht in [Issue 96](reviews/issue-96.md).

## Umfang hinter kurzen Runden (Issue #101)

87 Unterthemen zeigen Lernziel und Aufgabenanzahl der gewählten Stufe. Eine Runde enthält weiterhin höchstens sechs Aufgaben; die umfangreiche Bank erscheint nicht als lange Aufgabenliste. Die Suche findet auch Wörter aus den Wortschatz-Themen. Hörübungen bieten „Wort anhören“ und „Beispielsatz anhören“ direkt bei der Frage, ohne automatische Wiedergabe. Stoppen, Wechseln und erneutes Abspielen nach einem Fehler bleiben erreichbar. Die Quellenansicht benennt den tatsächlichen Aufgabenbestand; sie beansprucht keine vollständige Lehrplanbeherrschung.

## Aufgaben auf einer Bildschirmseite (Issue #135)

Die verbindliche Vorgabe steht in `AGENTS.md`. Zur Prüfung gehören Fachaufgaben aller Stufen, römische Zufallsübungen, Lernrunden, Vokabel- und Einmaleinstrainer, Tastschreiben, Natur-Lernspiele und Planetenrätsel. Geöffnete Tipps, Rückmeldungen und Hilfsdialoge sowie Lade-, Fehler- und Abschlusszustände werden einbezogen. Tabellen und lange Listen bleiben vollständig durch Seitenwahl erreichbar. Eine reine `overflow: hidden`-Sperre gilt nicht als bestandene Prüfung. Automatische Geometriemessungen in einer echten Browser-Engine und visuelle Sichtprüfung ergänzen die Verhaltenstests; JSDOM allein kann Scrollfreiheit nicht nachweisen. [Prüfergebnisse und Grenzen](reviews/issue-135.md).
