# Lernwelt: Projektvorgaben

## Produkt und Architektur
- Eigenständige, offline nutzbare Desktop-Anwendung für Mathematik, Englisch sowie Natur und Technik am bayerischen Gymnasium (LehrplanPLUS).
- Tauri 2, React, TypeScript und Vite; SQLite im betriebssystemspezifischen Anwendungsdatenverzeichnis.
- Deutsche Oberfläche, Tastaturbedienbarkeit, verständliche Fehlerzustände. Keine extern geladenen Schriften, Tracking- oder Cloud-Dienste im Kernprodukt.
- Fachlogik, Lerninhalte, UI und Persistenz getrennt halten. Rust besitzt die Datenbank; das Frontend nutzt typisierte, begrenzte Commands.
- Inhalte erhalten stabile IDs, Fach, Jahrgangsstufe, Kompetenzbezug, Quelle und Lehrplanstand. Englisch berücksichtigt die Fremdsprachenfolge. Beispielinhalte nie als vollständige Lehrplanabdeckung ausweisen.
- Keine KI-Abhängigkeit für grundlegende Übungen oder Antwortprüfung.

## Zielgruppe und Lernerlebnis
- Zielgruppe sind Kinder der jeweiligen Jahrgangs- und Altersgruppe (Klasse 5 typischerweise 10–11 Jahre). Sie sollen mit Lernwelt gerne lernen: kurze verständliche Texte, überschaubare Schritte, gut bedienbare Elemente und einladende Themen statt einer Erwachsenen-Verwaltungsoberfläche.
- Neugier, Ausprobieren und Erfolgserlebnisse fördern. Tipps, nachvollziehbare Lösungswege und ermutigende Rückmeldungen anbieten; kein Beschämen, Zeitdruck oder Punkteabzug für Fehler. Bewegung, Zeichnen und eigenes Erklären ergänzen Bildschirmaufgaben.
- Die frei wählbaren Schwierigkeitsgrade **Vorschule**, **Könner**, **Streber** gelten fachübergreifend und werden lokal gespeichert. Die Namen sind spielerisch: leichter Einstieg, reguläres Üben, anspruchsvolles Knobeln innerhalb des Themas; keine Alterszuordnung oder Bewertung des Kindes.
- Stufenwechsel jederzeit ermöglichen. Keine Sperren für leichtere Stufen. Eine erstmals richtige Lösung bringt fachübergreifend 1 Punkt in Vorschule, 2 in Könner und 3 in Streber; bestehende Buchungen bleiben unverändert. Im Einmaleins-Trainer bringt jede automatisch geprüfte richtige neue Antwort 1 Punkt, unabhängig von der Rechenart oder globalen Stufe; Wiederholungsrunden sind erlaubt, doppelte Übertragungen nicht doppelt zu vergüten. Im Vokabeltrainer erhält jede automatisch als richtig geprüfte Antwort stattdessen 1 Punkt, auch bei später fälligen Wiederholungen; falsche Antworten und reines Aufdecken geben 0 Punkte. Retries dürfen keine doppelten Punkte erzeugen. Lerninhalte, Sprache und Gestaltung auf altersgerechte Verständlichkeit und Freude am Lernen prüfen.

### Verständliche Aufgaben
- Schwierigkeit entsteht durch die Mathematik, nicht durch komplizierte Sprache. Auch Streber-Aufgaben verwenden kurze, direkte Sätze.
- Pro Bildschirmaufgabe eine klare Frage stellen. Ausgangslage, gesuchte Größe und Einheit nennen. Lange Sachaufgaben in kurze Absätze gliedern; mehrteilige Mitmachaufträge als nummerierte Schritte darstellen.
- Fachbegriffe und neue Zeichen erhalten, aber beim ersten Auftreten oder in unmittelbar erreichbaren Tipps in Alltagssprache erklären (z. B. „Betrag = Abstand zur 0“, „∈ = gehört dazu“). Unnötige Fremdwörter wie „plausibel“ durch verständliche Formulierungen ersetzen.
- Zahlen, Bedingungen und mathematische Bedeutung beim Vereinfachen erhalten. Mehrdeutige Bezüge vermeiden. Bei reinen Sprachänderungen richtige Antworten, stabile IDs und Punktehistorie erhalten.
- Im Inhaltsreview jede Frage samt Tipp und Lösungsweg prüfen: Ist klar, was das Kind tun soll? Sind alle nötigen Angaben vorhanden? Werden unbekannte Begriffe erklärt? Wurde eine schwierige Denkaufgabe versehentlich verraten oder inhaltlich verändert?
- Keine Zertifizierung als „Leichte Sprache“ und keine Verständlichkeitsprüfung mit Kindern behaupten, solange sie nicht tatsächlich erfolgt ist.

## Verbindlicher Issue-Ablauf
1. Vor jeder Umsetzung ein GitHub-Issue mit Ziel und überprüfbaren Akzeptanzkriterien anlegen bzw. ein vorhandenes verwenden.
2. Jedes Issue auf einem eigenen Branch von aktuellem `main` bearbeiten: `codex/issue-<nummer>-<kurzname>`. Keine Umsetzung direkt auf `main`; keine Vermischung unabhängiger Issues.
3. Angemessene Tests und Prüfungen ausführen. Fehler beheben und betroffene Prüfungen erneut ausführen. Nutzeränderungen erhalten.
4. Nach der Umsetzung jedes Issues einen separaten Review-Durchgang durchführen, bevor gemergt wird. Gesamtdiff gegen `main`, Akzeptanzkriterien, Fehlerpfade, Datenhaltung und Tests prüfen. Reviewer kann ein Mensch oder Agent sein; ein Selbstreview muss ausdrücklich als solches bezeichnet werden und darf nicht als unabhängige Freigabe ausgegeben werden.
5. Review in `docs/reviews/issue-<nummer>.md` dokumentieren: Umfang, Reviewer/Reviewart, Befunde, Korrekturen, Prüfergebnisse und verbleibende Grenzen. Nach relevanten Änderungen Review aktualisieren.
6. Jeden neu gefundenen Bug als eigenes GitHub-Issue erfassen (Reproduktion, Erwartung, tatsächliches Verhalten, Auswirkung). Keine stillen Nebenfixes. Bugfix auf eigenem Branch; bei blockierendem Bug erst diesen beheben, reviewen und mergen, dann ursprüngliches Issue fortsetzen. Unfertige Implementierung beim normalen Testen zu vervollständigen ist kein separater Produktbug; reproduzierbare Defekte im bestehenden Stand sind es.
7. Pull Request mit `Closes #<nummer>`, verständlicher Beschreibung, Tests und Reviewnachweis erstellen. Nach erfolgreichem Review, ohne offene blockierende Befunde und mit grünen erforderlichen Checks den Issue-Branch nach `main` mergen. Repository-Schutzregeln nicht umgehen. Anschließend lokales `main` aktualisieren.
8. Issue erst als abgeschlossen behandeln, wenn der Merge erfolgt ist. Bei externen Blockaden den konkreten Status dokumentieren, nicht Erfolg behaupten.

## Qualität und Datenschutz
- Lockdateien für npm und Cargo versionieren. Keine Geheimnisse, Nutzerdaten oder Build-Artefakte committen.
- Schreiboperationen an der Vertrauensgrenze validieren. SQL parametrisieren; Migrationen versionieren und transaktional anwenden. Bestehende Nutzerdaten nicht stillschweigend löschen.
- Tests prüfen beobachtbares Verhalten: Persistenz über neue Verbindungen, Migrationen, ungültige Eingaben und UI-Fehlerpfade. Für reine Textänderungen keine künstlichen Tests.
- Vor Abschluss die im README beschriebenen, zur Änderung passenden Prüfungen ausführen. Nicht ausführbare Checks transparent ausweisen.
- Neue Abhängigkeiten nur bei konkretem Nutzen; offizielle Dokumentation verwenden.

## Projektskills
Projektbezogene Skills liegen unter `.agents/skills/` und werden mit dem Repository gepflegt:
- `lernwelt-issue-workflow`: Bei Issue-Umsetzungen und Reviews lesen.
- `lernwelt-desktop`: Bei Änderungen am Desktop-Unterbau, Persistenz oder Lerninhaltsmodell lesen.

Die Skills konkretisieren diese Regeln; sie ersetzen keine Nutzeranweisung und erteilen keine zusätzlichen Berechtigungen.
