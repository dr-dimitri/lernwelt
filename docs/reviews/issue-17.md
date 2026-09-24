# Review · Issue #17

## Reviewart und Umfang

Separater Selbstreview durch Codex am 24.09.2026 nach Abschluss der Implementierung; kein unabhängiger Reviewer und keine fachpädagogische Zertifizierung. Gesamtdiff des Abschlussbranches gegen main 613db7d geprüft; zusätzlich die sieben bereits gemergten Inhaltsänderungen gegen den Ausgangsstand 8606507 erneut zusammen betrachtet.

Die Teilpakete wurden einzeln implementiert, selbstreviewt und nach grünen macOS-/Windows-/Frontendchecks gemergt:

| Issue | Inhalt | PR | Review |
| --- | --- | --- | --- |
| #18 | Zahlwörter, Skalierung, Gegenbeispiele | #25 | [issue-18.md](issue-18.md) |
| #19 | Vor-/Rechenzeichen und schriftliche Schritte | #26 | [issue-19.md](issue-19.md) |
| #20 | Geometrie, Abstände, Vierecke | #27 | [issue-20.md](issue-20.md) |
| #21 | Mal/Geteilt, Begründungen, Quadratzahlen | #28 | [issue-21.md](issue-21.md) |
| #22 | Termgliederung und Lösungspräsentation | #29 | [issue-22.md](issue-22.md) |
| #23 | Größen, Tafeln, Recherche, Dreisatz | #30 | [issue-23.md](issue-23.md) |
| #24 | Flächentafel und Näherung | #31 | [issue-24.md](issue-24.md) |

## Fachlicher Abgleich und Befunde

Offiziellen Fachlehrplan Gymnasium Mathematik 5 erneut gelesen und seine 39 Kompetenzabsätze einzeln mit Erklärungen, Aufgaben und Tätigkeiten abgeglichen. Die aktualisierte [Inhaltsmatrix](../curriculum-math-5.md) nennt konkrete Belege und die Art der Prüfung. Die bisherigen offenen Inhalte aus #17 sind durch die Teilpakete ergänzt; Lernangebote sind von automatischer Leistungsbewertung getrennt.

- Große Zahlwörter einschließlich Nullgruppen, eigene Skalierung und eigene Gegenbeispiele angeleitet.
- Schriftliche Rechenschritte, Überträge, Tauschen und Nullstellen nachgerechnet; Vorzeichen von Rechenzeichen unterschieden.
- Geometrische Kurzschrift erklärt; Grundfälle der Lagebeziehungen einschließlich innerer Berührung und deckungsgleicher Objekte; Abstände zu Punkt/Gerade und beide Straßenseiten berücksichtigt.
- Vollständige Quadratzahlreihe 0²–20² in allen drei Stufen geprüft. Muster/Verteilungsgesetz/Umkehraufgaben erklären die Vorzeichen, Beispiele unterscheiden zulässiges Zählprinzip von ungleich verzweigten Fällen.
- Freie Termgliederung, gleichwertige Rechenzeilen, Präsentation und kritische Sach-/Überschlagsprüfung angeleitet.
- Einheitenfaktoren und Gruppenbreiten kontrolliert; Zeit bleibt gesondert. Messen, Bezugsgrößen, Quellen, Präsentation und Dreisatz sind ohne Online-Abhängigkeit bearbeitbar.
- Flächenübergänge von km² bis mm² einschließlich ha/a begründet. Rechteckmodell, Näherungswert und sichere Grenzen werden unterschieden; Überlappungen vermieden.

Keine offenen blockierenden Befunde im Abschlussreview. Keine neu entdeckten reproduzierbaren Produktbugs, die ein weiteres Bug-Issue erfordern. Die Inhaltsmenge allein wurde nicht als Vollständigkeitsbeweis verwendet: Jede Kompetenz hat konkrete benannte Angebote.

## Technische Integrität

Alle 182 ursprünglichen Übungsdatensätze gegen 8606507 vollständig verglichen: unverändert, nicht nur IDs/Antworten. 189 neue Mathematikaufgaben ergeben insgesamt 363 (121 je Stufe), plus sechs Englischbeispiele und zwei intern auflösbare historische Mathematikaufgaben. 51 Mitmachaufträge, fünf Tabellen. Quelle/Stand und fachliche Zuordnung bleiben im Paket; keine Migration oder Veränderung bestehender Nutzerdaten.

Der Abschlussbranch ergänzt nur Tests, maschinenlesbare Kompetenzbelege, Dokumentation und die sachlich aktualisierte Inhaltsbeschreibung in der UI. Das Tabellenmodell aus #23 ist optional und abwärtskompatibel. Tabellen bleiben reine Textdaten ohne HTML-Auswertung. Keine neuen Abhängigkeiten, entfernten Ressourcen oder Commands.

## Tatsächliche Prüfergebnisse

- `npm run check:all`: 49 erfolgreiche Tests (22 Frontend, 2 Workflow, 25 Rust), Format, TypeScript/Vite, rustfmt und Clippy ohne Fehler.
- Kompetenztest prüft genau die 39 erwarteten Bezüge, Aufgabenbelege in jeder Stufe und vorhandene Tätigkeiten. Er prüft Verweiskonsistenz, nicht didaktische Qualität.
- Quadratzahltest prüft alle 21 Quadratzahlen in drei Formen gegen eine separat aufgeführte Ergebnisreihe und verwirft falsche Antworten.
- Inhaltliche Grenzfälle prüfen Nullgruppen, schriftliche Subtraktion, innere Kreisberührung, Quotient-Nullstelle, eingeschränktes Zählprinzip, Vorzeichen und dezimale Einheiten.
- Integrationstest spielt alle 363 Mathematikaufgaben durch: falsche Antwort ohne Punkte, korrekte Antwort mit 10 Punkten, idempotenter Request-Replay, erneute Lösung ohne zusätzliche Punkte. Nach neuer Datenbankverbindung bleiben 363 gelöste Aufgaben und 3 630 Punkte erhalten; Lösungsschlüssel fehlen im UI-Zustand.
- Bestehende Migrationen, ungültige Eingaben, Rollback, Belohnungen, Nebenläufigkeit und UI-Fehlerpfade weiterhin grün.
- Native macOS-Release-Test-App gebaut und gestartet. In isoliertem Profil: falsche neue Flächenantwort „35“ unverändert 30 Punkte; richtige Antwort „3,5“ erhöht auf 40, Wiederholung unverändert. Nach Neustart bleiben 40 verfügbare/60 insgesamt verdiente Punkte, gelöste Flächenaufgabe, Stufe Streber und Sternabzeichen erhalten. Echtes Nutzerprofil nicht für Testantworten verwendet.
- Flächentafel mit sieben beschrifteten Spalten per Screenshot/Accessibility geprüft; Geld-/Längen-/Massen-/Zeittafeln bereits im Review #23 nativ geprüft. Themen zeigen die erwarteten neuen Aufgabenanzahlen.
- `git diff --check` erfolgreich. Erforderliche GitHub-Prüfungen dieses Abschluss-PR vor Merge abwarten.

## Verbleibende Grenzen

Feste Aufgabenbank, keine adaptive Wiederholungsplanung. Offene Zeichnungen, Erklärungen und Präsentationen haben Selbstkontrollkriterien statt automatischer Bewertung. Keine empirische Erprobung mit Kindern oder amtliche Freigabe. Alle Kompetenzerwartungen haben nun Lernangebote; das ist keine Beherrschungsgarantie oder vollständige Lernstandserhebung. Englisch bleibt Beispielumfang.
