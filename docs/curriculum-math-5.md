# Mathematik 5 · Inhaltsstand 24.09.2026

Grundlage: [LehrplanPLUS Bayern, Gymnasium, Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik), am 24.09.2026 erneut gelesen. Eigene Aufgaben und didaktische Zuordnung, keine amtliche Freigabe. Alle Inhalte werden offline mit der Anwendung ausgeliefert.

**Stand nach Issue #17: Zu allen 39 Kompetenzerwartungen liegen konkrete Lernangebote vor.** Die zuvor dokumentierten Inhaltslücken wurden in #18–#24 durch Erklärungen, Bildschirmaufgaben und angeleitete Tätigkeiten geschlossen. Die Tabelle unten belegt die Zuordnung einzeln. Sie belegt die angebotenen Lerninhalte, nicht die Beherrschung durch ein Kind oder eine unabhängige fachpädagogische Zertifizierung.

Zusätzliche offizielle Erläuterung: [Mengenbegriff zu M5 1.1](https://www.lehrplanplus.bayern.de/serviceinformation/l76991), geprüft am 24.09.2026. Mengen, Elemente, ∈ und ∉ werden ausdrücklich geübt. Die ergänzende Erläuterung ordnet abstrakte Schnitt-, Vereinigungs- und Teilmengen späteren Klassen zu. Unsere Konvention ist ausdrücklich erklärt: ℕ ab 1, ℕ₀ einschließlich 0.

## Umfang und Bedienung

| Thema | Lehrplanbezug | Bildschirmaufgaben | Mitmachaufgaben |
| --- | --- | ---: | ---: |
| Mengen & Zahlenmengen (`sets`) | M5 1.1 | 21 | 2 |
| Zahlen entdecken (`numbers`) | M5 1.1 | 36 | 5 |
| Plus & Minus (`add`) | M5 1.2 | 36 | 5 |
| Geometrie-Werkstatt (`geometry`) | M5 2 | 48 | 9 |
| Mal, Geteilt & Potenzen (`multiply`) | M5 3.1 | 108 | 10 |
| Rechentricks & Terme (`terms`) | M5 3.2 | 30 | 5 |
| Größen im Alltag (`units`) | M5 4.1 | 48 | 7 |
| Flächen-Abenteuer (`area`) | M5 4.2 | 36 | 8 |
| **Gesamt** | | **363** | **51** |

**121 Bildschirmaufgaben je Stufe:** Vorschule aktiviert Voraussetzungen und bietet direkte Hilfen, Könner übt die regulären Inhalte, Streber fordert Transfer oder mehrere Schritte. Die Sprache bleibt in allen Stufen verständlich. Die Namen sind spielerisch und bewerten weder Alter noch Begabung. Die Wahl gilt auch für Englisch und bleibt über Neustarts erhalten. Pro erstmals korrekt gelöster Aufgabe gibt es unabhängig von der Stufe 10 Punkte; Fehler kosten nichts.

„So geht’s · kurz erklärt“ enthält Erklärungen und bei Größen/Flächen beschriftete Einheitentafeln mit Beispielen. „Stift raus!“ enthält Zeichen-, Mess-, Begründungs- und Präsentationsaufträge mit aufklappbarer Selbstkontrolle; einzelne Aufträge nennen passende Einstiege für die drei Stufen. Diese Tätigkeiten sind ein notwendiger Teil des Lernangebots und vergeben keine automatisch bewerteten Punkte. Für Recherche reichen Messung, Verpackungsangaben oder ein Sachbuch; die App benötigt keine Online-Dienste.

Die vollständige Quadratzahlreihe 0² bis 20² ist in jeder Stufe vorhanden: als Malrechnung, Potenz und Rückwärtsfrage. Das ermöglicht Wiederholung ohne Zeitdruck. Gelöste Aufgaben allein beweisen keine dauerhafte Automatisierung.

## Abgleich aller Kompetenzerwartungen

Die Nummer nach dem Schrägstrich ist die Reihenfolge des Kompetenzabsatzes auf der offiziellen Fachlehrplanseite: 7 + 5 + 5 + 7 + 5 + 5 + 5 = 39. Kurzlabels und Aufgaben sind eigene Formulierungen. IDs bestehen aus `by.math.5.<Thema>.<Strang>.<Stufe>.v1`.

Die maschinenlesbare Zuordnung in [math-5-coverage.json](math-5-coverage.json) wird durch Tests geprüft: alle 39 eindeutigen Bezüge, vorhandene Aufgaben in jeder Stufe und vorhandene Tätigkeiten. Das schützt vor verlorenen Verweisen; die fachliche Zuordnung bleibt eine redaktionelle Reviewaufgabe. Jede Zeile nennt vorhandene Angebote und deren konkrete Umsetzung bzw. Prüfgrenze.

| Bezug | Inhalt | Bildschirm-Stränge | Tätigkeiten | Umsetzung / Prüfgrenze |
| --- | --- | --- | --- | --- |
| 1.1/1 | Große Zahlen und Zahlbereich | `numbers.word-to-number`, `numbers.read-number`, `numbers.word-zero-groups`, `numbers.successor` | Zahlwort-Werkstatt; Unendlich weiter | Zahlwörter mit Nullgruppen und Unbegrenztheit; zusätzlich Mengen/Zahlenmengen im Thema sets. |
| 1.1/2 | Stellenwertsystem | `numbers.place-value`, `numbers.roman` | Zahlwort-Werkstatt | Dreiergruppen und Vergleich zur römischen Schreibweise; eigene Erklärung auf Papier. |
| 1.1/3 | Eigene Skalierung | `numbers.number-line`, `numbers.choose-scale` | Dein Maß für den Zahlenstrahl | Start, Ende und Einteilung selbst wählen, zeichnen und begründen; keine automatische Zeichenprüfung. |
| 1.1/4 | Runden im Alltag | `numbers.rounding` | Tipp und erklärter Lösungsweg am Bildschirm | Runden und Grenzen der Rundung in einer Alltagssituation. |
| 1.1/5 | Negative Zahlen im Kontext | `add.signed`, `add.context`, `add.debt-reasoning` | Zeichen und Rechenbaum | Guthaben/Schulden und Zahlengerade; zusätzlich Thermometer und ℤ im Thema sets. |
| 1.1/6 | Ordnung und Betrag | `numbers.ordering`, `numbers.absolute` | Deine Zahlengerade | Zahlen ordnen, Abstände zur Null vergleichen und zeichnen. |
| 1.1/7 | Eigene Gegenbeispiele | `numbers.build-counterexample` | Eine Behauptung knacken | Eigene Zahlen wählen und Voraussetzung/Widerspruch begründen; offene Argumente mit Kriterien prüfen. |
| 1.2/1 | Schriftlich addieren und subtrahieren | `add.written`, `add.estimate`, `add.written-carry`, `add.written-exchange` | Rechnen mit Übertrag; Tauschen beim Minusrechnen | Überträge, Nullstellen, Tauschen, Überschlag und Probe auch über einer Million; Rechenschritte auf Papier. |
| 1.2/2 | Vorzeichen und Rechenzeichen | `add.sign-or-operation`, `add.debt-reasoning`, `add.signed` | Zeichen und Rechenbaum | Zeichenrollen unterscheiden und Strategie mit Konto/Zahlengerade erklären. |
| 1.2/3 | Additive Gleichungen | `add.equations` | Tipp und erklärter Lösungsweg am Bildschirm | Alle drei geforderten Formen durch Umkehrung bzw. Probieren; feste Beispielauswahl. |
| 1.2/4 | Rechenvorteile | `add.strategy`, `add.sign-or-operation` | Rechenwege vergleichen | Vertauschen, Zusammenfassen und Differenz als Addition der Gegenzahl. |
| 1.2/5 | Additive Terme gliedern | `add.terms`, `add.sum-difference-structure` | Zeichen und Rechenbaum | Minuend/Subtrahend und innere Summe; vollständige gleichwertige Zeilen auf Papier. |
| 2/1 | Geometrische Darstellung und Kurzschrift | `geometry.coordinates`, `geometry.short-notation` | Punkte verbinden; Kurzschrift zeichnen | Punkte, Strecken, Geraden und Kreise im Koordinatensystem; Konventionen ausdrücklich erklärt. |
| 2/2 | Grundlegende Lagebeziehungen | `geometry.point-line`, `geometry.line-cases`, `geometry.circle-line-cases`, `geometry.circle-circle-cases`, `geometry.nested-circles` | Alle Lagen erforschen; Abstand messen | Auch deckungsgleiche Objekte, konzentrische Kreise und innere/äußere Berührung; Lot/Abstand/Tangente. |
| 2/3 | Abstandsbedingungen im Alltag | `geometry.distance`, `geometry.distance-conditions` | Ein Platz für die Bank | Abstand zu Punkt und Gerade, beide Straßenseiten, gemeinsame Bedingungen und begründete Platzwahl. |
| 2/4 | Winkel messen und zeichnen | `geometry.angle-types`, `geometry.angles` | Winkel bauen | Winkel bis 360° einschließlich größerer Außenwinkel; Messgenauigkeit per Selbstkontrolle. |
| 2/5 | Vierecke im Umfeld und im Kopf | `geometry.quadrilaterals`, `geometry.quadrilaterals-around-us`, `geometry.mental-quadrilaterals` | Viereck-Forscher; Vierecke im Zimmer und im Kopf | Sechs Vierecksarten zeichnen, Eigenschaften erklären, idealisierte Umrisse und gedrehte Figuren betrachten. |
| 3.1/1 | Schriftlich multiplizieren und dividieren | `multiply.written`, `multiply.written-product-steps`, `multiply.division-steps` | Malrechnung mit Stellenwerten; Teilen Schritt für Schritt | Mehrstellige Faktoren/Divisoren, Teilprodukte, Quotient mit Nullstelle, Überschlag und Umkehrprobe. |
| 3.1/2 | Teilbarkeit und eindeutige Primfaktoren | `multiply.divisibility`, `multiply.prime`, `multiply.factor-uniqueness` | Zwei Wege, dieselben Primfaktoren | Teilbarkeitsregeln und verschiedene Zerlegungswege; Eindeutigkeit bis auf Reihenfolge erklären. |
| 3.1/3 | Zählprinzip und Grenzen | `multiply.counting`, `multiply.counting-limits` | Darf ich einfach malnehmen? | Baumdiagramme, verschiedene Verzweigungen und Wahl ohne Wiederholung; erlaubte Wege zählen. |
| 3.1/4 | Vorzeichen begründen | `multiply.signs`, `multiply.sign-pattern`, `multiply.division-sign-reason` | Vorzeichen begründen | Muster und Verteilungsgesetz erklären Malregeln; Umkehraufgaben begründen Geteiltregeln; Division durch 0 ausschließen. |
| 3.1/5 | Rechenvorteile bei Produkten | `terms.associate` | Erkläre deinen Trick | Vertauschen/Zusammenfassen und Vorteil am eigenen Rechenweg erklären. |
| 3.1/6 | Potenzen und Quadratzahlen | `multiply.powers`, `multiply.growth`, `multiply.ten-powers-context`, `multiply.square-00`, `multiply.square-20` | Quadratzahlen sammeln; Nullen kurz schreiben | Alle 0² bis 20² in jeder Stufe; Zehnerpotenzen im Kontext und Verdopplung. Bearbeitung beweist keine dauerhafte Automatisierung. |
| 3.1/7 | Multiplikative Gleichungen | `multiply.equations` | Tipp und erklärter Lösungsweg am Bildschirm | Alle drei geforderten Gleichungsformen; Umkehrung mit erklärter Probe. |
| 3.2/1 | Terme frei gliedern | `terms.structure`, `terms.describe-structure` | Dein eigener Rechenbaum | Hauptrechenart, Teilterme und Fachbegriffe; eigener Term mit gleicher Struktur. |
| 3.2/2 | Rechenreihenfolge und gültige Zeilen | `terms.precedence`, `terms.brackets`, `terms.equal-calculation-lines` | Dein eigener Rechenbaum | Klammern/Potenzen/Punkt/Strich und vollständige gleichwertige Rechnungen; fehlerhafte Gleichheitsketten erkennen. |
| 3.2/3 | Rechengesetze erklären | `terms.distribute`, `terms.associate` | Erkläre deinen Trick | Vertauschen, Zusammenfassen und Verteilen; Grenzen bei Division. |
| 3.2/4 | Vorwärts und rückwärts | `terms.reverse` | Vorwärts und rückwärts | Rechenkette mit Umkehraufgaben und Erklärung der umgekehrten Reihenfolge. |
| 3.2/5 | Sachaufgaben präsentieren und prüfen | `terms.model`, `terms.explain-model` | Deine Erklärbühne; Eine eigene Rechengeschichte | Gegeben/gesucht, Term, Rechnung, Antwortsatz, Überschlag, Sachprüfung und alternativen Weg erklären. |
| 4.1/1 | Messen und Einheitentafeln | `units.money`, `units.length`, `units.mass`, `units.time`, `units.small-lengths`, `units.money-table`, `units.length-table`, `units.mass-table`, `units.time-is-different` | Messen heißt Einheiten anlegen; Einheiten passend eintragen | Geld/Länge/Masse mit echten Tafeln und Dezimalangaben; Zeit gesondert mit 60er-Bündelung. |
| 4.1/2 | Alle vier Größenrechenarten | `units.add-quantities`, `units.subtract-quantities`, `units.multiply-quantities`, `units.divide-quantities` | Größenrechnen erklären | Gleiche Einheiten herstellen; Dezimalgrößen plus/minus; Größe durch Anzahl vs. Größe durch Größe. |
| 4.1/3 | Schätzen, recherchieren und präsentieren | `units.estimate` | Schätzmeister; Recherche ohne Internet | Bezugsgröße, Nachmessen/Quelle, Dokumentation und Plakat; Internet optional und nicht benötigt. |
| 4.1/4 | Dreisatz strukturiert darstellen | `units.unitary` | Dreisatz in drei Zeilen | Von mehreren auf ein Stück und weiter; Voraussetzungen gleicher Stückpreise/-massen benennen. |
| 4.1/5 | Maßstab im Alltag | `units.scale` | Dein Zimmer als Plan | Passende Einheiten und maßstäbliche Planzeichnung. |
| 4.2/1 | Flächenformel herleiten | `area.squares` | Kästchen zählen | Gleiche Einheitsquadrate in Reihen; Fläche und Umfang unterscheiden. |
| 4.2/2 | Flächentafel und Umrechnungsbegründung | `area.conversion`, `area.land`, `area.square-unit-reason`, `area.area-table`, `area.decimal-area-conversion` | Warum immer mal 100?; Flächentafel selbst füllen | Alle Einheiten km²/ha/a/m²/dm²/cm²/mm², Zweiergruppen und Dezimalangaben; Übergänge als 10×10 erklären. |
| 4.2/3 | Umfang, Fläche und Näherung | `area.perimeter`, `area.compare`, `area.approximate-area`, `area.area-bounds` | Ein Blatt mit Rechtecken schätzen; Rechteckmodelle vergleichen | Alltagsrechtecke und unregelmäßige Flächen; Modellfläche, Schätzung sowie innere/äußere Grenzen unterscheiden. |
| 4.2/4 | Zerlegen und Ergänzen | `area.compound` | Eine L-Form, zwei Wege | Zwei unterschiedliche Zerlegungs-/Ergänzungswege vergleichen und erklären. |
| 4.2/5 | Quader und zusammengesetzte Körper | `area.surface` | Schachtel-Werkstatt; Würfel zusammenbauen | Netz, Schrägbild, äußere Flächen und räumliche Überlegungen mit Bauklötzen; Zeichenprüfung per Kriterien. |

## Inhaltspflege und unveränderliche IDs

`src-tauri/content/curriculum-v1.json` enthält Quellenstand, Themen, Erklärungen, optionale Lerntafeln, Tätigkeiten und Übungen. Thema und Paket vererben Fach, Klasse, Quelle und Lehrplanbezug an die Aufgaben; jede Aufgabe hat zusätzlich eine Kompetenz-ID, Stufe, stabile Versions-ID, Frage, Antworttyp, Antwort, Tipp und Lösungsweg. Englisch berücksichtigt die Fremdsprachenfolge und bleibt ausdrücklich eine Auswahl von sechs Beispielen.

Alle 182 vor #17 vorhandenen Übungsdatensätze behalten ihre vollständigen Inhalte und Antwortbedeutungen. Die 189 neuen Mathematikaufgaben haben neue IDs. Die beiden historischen Mathematikbeispiele bleiben intern für alte Buchungen/Request-Replays auflösbar. Antworten werden im Backend geprüft und nicht als Lösungsschlüssel mit dem Lernzustand ausgegeben. Reine Formulierungsänderungen dürfen eine ID behalten; geänderte Antwortbedeutungen benötigen eine neue ID.

Tabellen sind Textdaten mit Caption, Spalten, Zeilen und Erklärung; kein HTML aus Inhaltsdateien. Spaltenzahl und Metadaten werden vor Nutzung validiert. Keine Migration der Nutzerdaten, kein Cloud-Import und kein Aufgaben-`eval`.

## Review und verbleibende Grenzen

Die Teilpakete #18–#24 wurden jeweils auf eigenem Branch implementiert, separat selbstreviewt und mit eigenen Pull Requests geprüft. [Review #17](reviews/issue-17.md) dokumentiert den erneuten Gesamtabgleich, automatisierte Prüfungen und die native Abschlussprüfung.

Die bisher ausdrücklich fehlenden Inhalte sind ergänzt. Verbleibende Produktgrenzen werden nicht als erledigte Lernleistungen ausgegeben:

- Feste, begrenzte Aufgabenbank statt beliebig vieler Varianten oder adaptiver Wiederholungsplanung.
- Zeichnungen, freie Gliederungen, mündliche Begründungen, Messgenauigkeit und Präsentationen werden mit Beispielen und Kriterien selbst bzw. gemeinsam geprüft. Es gibt keine automatische Bewertung dieser offenen Leistungen.
- Keine empirische Verständlichkeitsstudie mit Kindern, keine amtliche Freigabe und keine unabhängige fachpädagogische Zertifizierung.
- Die Inhalte unterstützen Lernen; sie ersetzen Unterricht und eine vollständige Lernstandserhebung nicht. Eine vollständige Themenzuordnung ist keine Garantie, dass jedes Kind jede Kompetenz bereits beherrscht.
