# Expedition Zellkern

## Umfang und Bedienung

**Meine Fächer → Natur und Technik → Expedition Zellkern** öffnet das Modul. Auch das bestehende Thema **Zellen und Lebewesen** führt direkt hinein. Die fünf Entdeckungsstationen sind frei erreichbar: Winzige Welt, Zum Zellkern, Forscherblick, Was lebt? und Forscherzeichnung. Entdecken funktioniert ohne Profil und bei nicht verfügbaren lokalen Lerndaten. Die besuchten Stationen gelten nur für den aktuellen Modulbesuch und sind ausdrücklich kein gespeicherter Lernerfolg.

Tier- und Pflanzenmodell lassen sich wechseln. Zellteile können im Bild mit Tab und Enter/Leertaste oder über beschriftete Schaltflächen ausgewählt werden. Die drei eigenen SVG-Illustrationen zeigen eine typische Tierzelle, eine typische grüne Pflanzenzelle und ein Zellkern-Detail. Das Detail ist ein gezeichnetes Modell, keine Mikroskopvergrößerung. Die Folge **Zelle → Zellkern → Erbinformation** erklärt die Zusammenhänge mit kurzen auswählbaren Karten. Keine Animation, Pflicht zum Ziehen oder Suche nach winzigen Klickflächen.

Im Forscherblick stehen Modell und echte Aufnahme nebeneinander. Eine separat darübergelegte Markierung kann ein- und ausgeblendet werden. Die Großansicht schließt mit Schließen oder Escape und gibt den Fokus an den Auslöser zurück. Vergrößern der Datei bringt keine zusätzliche Mikroskopauflösung. Bei Bildfehlern stehen eine gleichwertige Textbeobachtung, eine klar bezeichnete Ersatzgrafik und **Bild erneut laden** bereit. Das Rätsel kann mit der Textbeobachtung beantwortet werden.

**Zellrätsel** bietet Runden mit höchstens sechs Aufgaben, in fünf frei wählbaren Auswahlen: alle Fragen, Zellteile, Zellkern, Forscherblick und Was lebt? Neue und vorhandene Fragen wechseln sich im Gesamteinstieg ab. Nach der Runde kann man die nächsten Aufgaben öffnen oder weiter entdecken; keine Pflichtrunde vor dem Zellkern. Alle 21 Fragen je Stufe sind in aufeinanderfolgenden kurzen Runden erreichbar. Die Stufen Vorschule/Könner/Streber gelten weiterhin fachübergreifend und werden in SQLite gespeichert.

Frage, Auswahl, Hauptaktionen und Rückmeldung stehen zusammen. Bilder in Prüffragen nennen den gesuchten Teil weder im Alttext noch im zugänglichen Namen. A beschreibt nur eine Form bzw. Lage. Die Bedienung erfolgt mit Auswahlknöpfen; eine pixelgenaue Antwort ist nicht erforderlich. Originalfragen mit Zahleneingabe bleiben Zahleneingaben.

Die Originalaktivitäten **Eine Zelle als Modell** und **Leben oder Bewegung?** werden aus dem bestehenden Inhaltspaket geladen. Nummerierte Schritte und eine separat erreichbare Selbstkontrolle ergänzen Zeichnen und Erklären. Ohne automatische Freitextbewertung und ohne Punkte fürs Abhaken.

## Bestehende Identitäten und Zuordnung

Bestand bei Umsetzungsstart: `main`, App 0.6.16, 45 bewertete Fragen (15 je Stufe) und zwei Aktivitäten. Die Dateien mit den Originalaufgaben wurden bytegleich erhalten:

| Datei | SHA-256 vor/nach Umsetzung |
| --- | --- |
| `src-tauri/content/nature-5-v1.json` | `2d99602988f405a9626a3c051a087d3cd848bcfa5b127e50efd55b88c7adde52` |
| `src-tauri/content/topic-practice-v1.json` | `5499b102855fdd922892c2cc6269ad60866a7eb4ae8d9936dd84c40bd166edec` |

Jede nachfolgende ID behält dieselbe Frage, Antwort, Stufe, Kompetenz und Punkteidentität. Die Zuordnung ist zusätzlich in `cellQuestionStation` und in Verhaltens-/Inhaltstests geprüft. Alle Bestandsfragen bleiben auch in **Alle Zellrätsel** erreichbar.

| Stabile ID vor und nach Umsetzung | Stufe | Station der Übung |
| --- | --- | --- |
| `by.nature.5.cells.1.v1` | Vorschule | Was lebt? |
| `by.nature.5.cells.2.v1` | Vorschule | Zellteile |
| `by.nature.5.cells.3.v1` | Vorschule | Forscherblick |
| `by.nature.5.cells.4.v1` | Könner | Zellteile |
| `by.nature.5.cells.5.v1` | Könner | Zellteile |
| `by.nature.5.cells.6.v1` | Könner | Forscherblick (Zahleneingabe zur Vergrößerung) |
| `by.nature.5.cells.7.v1` | Streber | Was lebt? |
| `by.nature.5.cells.8.v1` | Streber | Zellteile |
| `by.nature.5.cells.9.v1` | Streber | Forscherblick |
| `by.nature.5.focus.cells.<stufe>.01.v1` | je vorhandene Stufe | Was lebt? |
| `by.nature.5.focus.cells.<stufe>.02.v1` | je vorhandene Stufe | Zellteile |
| `by.nature.5.focus.cells.<stufe>.03.v1` | je vorhandene Stufe | Forscherblick |
| `by.nature.5.focus.cells.<stufe>.04.v1` bis `.10.v1` | je vorhandene Stufe | Zellteile |
| `by.nature.5.focus.cells.<stufe>.11.v1` | je vorhandene Stufe | Was lebt? |
| `by.nature.5.focus.cells.<stufe>.12.v1` | je vorhandene Stufe | Forscherblick |

`<stufe>` umfasst exakt `vorschule`, `koenner`, `streber`: zwölf Fragen je Stufe, also 36 IDs. Es wurden keine Bestandsfragen kopiert. Beide Aktivitäten bleiben in der Forscherzeichnung mit ihren Originaltiteln, Aufträgen und Selbstkontrollen erreichbar. Der Zusatz zur Zellkernaufgabe ist unbewertet.

## Neue Fragen und fachlicher Rahmen

`src-tauri/content/nature-nucleus-5-v1.json` ergänzt 18 eigene Fragen, IDs `by.nature.5.nucleus.<stufe>.<01–06>.v1`. Thema `nature-nucleus`, Fach nature, Klasse 5, Kompetenz `by.nature.5.cells`. Paket und Thema tragen Quelle und Lehrplanstand; im bestehenden Studienkatalog kommen alle 18 IDs zum vorhandenen Thema `nature-cells` hinzu. Die alte Themenidentität bleibt erhalten.

| Nr. | Vorschule | Könner | Streber | Form |
| --- | --- | --- | --- | --- |
| 01 | Zellkern A in Tierzelle | Zellmembran A in Tierzelle | Aussage über typische Zelle | Bildstruktur / Aussage |
| 02 | Zellkern A in Pflanzenzelle | Lage neben Vakuole | Seitliche Kernlage begründen | Bildstruktur / Aussage |
| 03 | Kernhülle A | Kernhülle/Zellmembran zuordnen | Linien als Modellzeichen | Struktur und Funktion / Modellgrenze |
| 04 | Kern A im Mikrobild | Kern und Erbinformation verbinden | Nicht erkannt heißt nicht fehlend | Beobachtung / Zuordnung / Aussage |
| 05 | Methylenblau-Färbung | Modell und Aufnahme vergleichen | Dateivergrößerung beurteilen | Modell und Beobachtung |
| 06 | Grundaufgabe | Anleitungsbibliothek erklären | Denkenden Chef zurückweisen | Struktur und Funktion / Aussage |

Grundlage: [LehrplanPLUS Natur und Technik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym), insbesondere NT5 2.2, ergänzend 2.1 und 1.1; am **06.10.2026** geprüft. Fachquellen: [NHGRI: Nucleus](https://www.genome.gov/genetics-glossary/Nucleus), [NHGRI: DNA](https://www.genome.gov/genetics-glossary/Deoxyribonucleic-Acid-DNA), [NIH/NLM: What is a cell?](https://medlineplus.gov/genetics/understanding/basics/cell/), ebenfalls am 06.10.2026 geprüft.

Der Zellkern enthält einen großen Teil der Erbinformation. Die Kernhülle grenzt ihn ab und ist nicht die Zellmembran. Die Bibliothek erklärt wichtige Anleitungen; sie behauptet weder echte Bücher noch einen denkenden Chef. Viele Zellbestandteile arbeiten zusammen. Typische Zellmodelle sind keine Regel für jede Zelle. Zellkerne müssen nicht mittig liegen; nicht jede Pflanzenzelle hat Chloroplasten. Die eigenen Farben und Formen sind frei gestaltet und nicht maßstabsgetreu. Das Foto zeigt weder Kernhülle noch DNA-Struktur sicher. DNA wird nur als erklärter Ausblick genannt. Keine Basenpaarung, Proteinbiosynthese, Replikation oder Zellzyklus als Voraussetzung. Diese liegen in späteren Lernbereichen, siehe [Biologie 9](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/9/biologie).

Die 18 Fragen, ihre Tipps und Erklärungen sowie alle Modellbeschriftungen wurden bei der Umsetzung fachlich und sprachlich durchgegangen. Den separaten Abschlussreview dokumentiert `docs/reviews/issue-167.md`. Keine Erprobung mit Kindern, amtliche Freigabe oder vollständige Lehrplanabdeckung wird behauptet.

## Lichtmikroskopbild und Weitergabe

Lokale Datei: `public/images/cells/cheek-cells.jpg`, **640 × 480 Pixel**, JPEG, unveränderte Originaldatei. SHA-256: `56fcd2d0d72f2f86df0769bd89fc9b0e119b5486a0e3d342b8f4ce8eb46e011b`.

- Titel: **Nucleus in human cheek cells.jpg**.
- Urheber: **Krishna satya 333**, eigene Aufnahme vom 17.07.2019, hochgeladen am 23.07.2019.
- [Konkrete Original-Dateiseite und Lizenzangabe](https://commons.wikimedia.org/wiki/File:Nucleus_in_human_cheek_cells.jpg), geprüft 06.10.2026 (Dateiseitenstand `oldid=1063323253`).
- Lizenz: **Creative Commons Attribution-ShareAlike 4.0 International**, [Lizenztext und Bedingungen](https://creativecommons.org/licenses/by-sa/4.0/), geprüft 06.10.2026. Kopieren und Weitergeben auch offline sind zulässig mit Namensnennung, Lizenzlink und Änderungshinweis; Bearbeitungen unter derselben Lizenz weitergeben.
- Menschliche Wangenzellen, Methylenblau-Färbung. Das Foto zeigt einen klaren dunklen Zellkern und einen weiteren, teilweise abgeschnittenen Zellbereich. Keine natürliche Blaufärbung behauptet.
- Dateibearbeitung: **keine**. Lernwelt zeichnet optional eine gestrichelte Umrandung und Beschriftung darüber. Die markierte Bildansicht ist ebenfalls unter **CC BY-SA 4.0** weitergebbar; Credits und Lizenz werden in der App und in der lokalen Begleitdatei genannt.
- Die Quelle nennt keinen belastbaren Maßstab oder eine Mikroskopvergrößerung. Deshalb keine biologischen Maße und kein erfundener Maßstabsbalken. Pixelmaße sind Dateimaße.

Die beiden Erkennungsaufgaben verwenden denselben sichtbaren Kern der großen Wangenzelle. Die prüfende Ansicht nennt ihn vor der Antwort nur **A / dunkler ovaler Bereich**. Aufdecken zeigt erst auf ausdrückliche Aktion eine Erklärung.

## Daten und Fehlerpfade

`get_learning_state` liefert weiterhin Fragen ohne Antwort-/Erklärungsschlüssel und mit bestätigtem `solved`. `submit_answer` prüft die Antwort in Rust; Antwortbeleg, Kompetenzfortschritt und erstmalige Punktebuchung sind dieselbe atomare/idempotente Operation wie im alten Einstieg. Keine Migration, neue Fortschrittstabelle oder Browser-Punkteverwaltung.

Neue Erstlösungen bringen je Aufgabenstufe 1/2/3 Punkte, unabhängig von einer später gewählten globalen Stufe. Original-Erstlösungen bleiben erkennbar; erneutes Lösen vergibt nichts zusätzlich. Identische Speicher-Retries verwenden dieselbe Request-ID. Abweichende Payloads unter derselben ID werden im Backend abgewiesen. Bei IPC-/Speicherfehlern bleibt die Eingabe erhalten; Guthaben und Erfolg werden erst nach Bestätigung aktualisiert. Profil- und Stufenwechsel laufen durch die bestehende Navigationssicherung.

`get_learning_explanation(questionId)` ist ein begrenzter read-only Command: bekannte nicht-historische Paket-ID, maximal 160 Bytes, ausschließlich ASCII-Buchstaben, Ziffern, Punkt und Bindestrich. Er liefert nur den erklärten Lösungsweg der angefragten Aufgabe. Unbekannte, historische und ungültige IDs werden abgewiesen. Das Aufdecken schreibt keine Versuche, Punkte oder Belege; die UI sperrt danach die Antwortprüfung für die aktuelle Präsentation. In einer späteren Runde darf das Kind wieder selbst lösen. Tipps sind freiwillig und ohne Punktewirkung.

## Prüfungen und Grenzen

Automatische UI-/Domainprüfungen verwenden den tatsächlichen 63-Fragen-Bestand und decken Zelltypwechsel, Tastaturauswahl, Detailrückkehr, Großansicht/Fokus, Markierung, Bildfehler/Retry, beide Aktivitäten, Hilfe, falsch/richtig, erneut versuchen, Speicher-Retry, Stufenwechsel, Profil-/IPC-Fehler und Rundenabschluss ab. Die Backendtests prüfen alle neuen Aufgaben, 1/2/3 Punkte, erhaltene Original-Erstlösung, abgewiesene veränderte Replays, persistente Stufe/Erfolge über neue Verbindungen, Profilumbenennung und transaktionale Speicherfehler. Die bestehenden allgemeinen Lern- und Naturtests bleiben zusätzlich wirksam.

`npm run check:all` wurde am 06.10.2026 nach den Layoutkorrekturen vollständig ausgeführt: 431 Frontendtests, 128 Skripttests, TypeScript/Vite-Build, Cargo fmt, Clippy ohne Warnungen und 177 Rusttests erfolgreich. Die macOS-DMG-Testfixtures benötigen die unsandboxed Ausführung; der erste Sandboxversuch scheiterte an `hdiutil create` mit „Gerät wurde nicht konfiguriert“, die Wiederholung außerhalb der Sandbox bestand.

Der unabhängige Review fand anschließend einen fehlenden Paketimport im Inhaltsgenerator. `scripts/build-topic-practice.py` lädt nun auch die neuen Zellkernfragen und das vorhandene Erdkernpaket; diese ergänzenden Fragen ersetzen beim Neuaufbau keine der 36 bisherigen Focus-Aufgaben. Zwei Regressionstests führen den vollständigen Generator auf einer isolierten Inhaltskopie aus: Der reale Katalog behält alle 45 ursprünglichen Aufgaben mit unveränderten Antworten, Stufen und Inhalten sowie alle 18 neuen IDs. Das vorhandene Erdkernpaket und seine Katalogzuordnung bleiben dabei ebenfalls erhalten. Auch mit zwölf ergänzenden Zellkernfragen je Stufe bleiben die bisherigen Aufgaben erhalten. Produktinhalte und Nutzerdaten werden durch diese Tests nicht beschrieben. Nach dieser Korrektur bestand `npm run check` erneut vollständig: Formatprüfung, 431 Frontendtests, nun 130 Skripttests und TypeScript/Vite-Build.

### Gemessener Viewport-Nachweis

Chromium/headless gegen den lokalen Vite-Server, **2400 × 1300**, 1× Pixeldichte, gültiger Wallet-/Profil-Datensatz. Ein isolierter `__TAURI_INTERNALS__.invoke`-Mock gibt ausschließlich die echten lokalen Fragen/Metadaten und gezielte Fehlerzustände aus; diese Geometrieprüfung ersetzt keine echten SQLite- oder IPC-Persistenztests. Die Persistenzfälle sind separat in Rust geprüft. Script: `/private/tmp/lernwelt-layout-167.mjs`; Messwerte `/private/tmp/cell-layout-results.json`, Zusammenfassung `/private/tmp/cell-layout-summary.json`; ausgewählte Screenshots `/private/tmp/cell-*.png` für den anschließenden Review.

| Geprüfte Zustände | Anzahl | maximale Dokumentbreite/-höhe | größtes Modulende ab Viewport-Oberkante |
| --- | ---: | --- | ---: |
| Entdecken, beide Zelltypen/Teile, Zellkerndetail, Informationsfolge, echter Bildvergleich, Markierungen, Großansicht, beide Aktivitäten, Selbstkontrolle, Quellen | 18 | 2400 / 1300 px | 1250,3 px |
| Alle 63 Fragen (21 je Stufe): Ausgangsansicht, erster/weiterer Tipp, richtige Antwort, falsche Antwort, Aufdecken; alle kurzen Rundenabschlüsse | 390 | 2400 / 1300 px | 1258,4 px |
| Weitere gezielte Fehler-, Speicher-, Lade-, Bildretry- und Profilzustände | 11 | 2400 / 1300 px | 1275,5 px |
| **Gesamt** | **419** | **2400 / 1300 px** | **unter der Viewportgrenze** |

Kein vertikaler oder horizontaler Dokument-Scroll; 131 gemessene Dialogzustände ohne eigenen Scroll. Schließen über Escape und Fokus-Rückkehr der Großansicht sowie Tastaturauswahl im SVG wurden im echten Browser geprüft. Drei beim Prüfen beobachtete Höhenprobleme sind korrigiert: die Bildfehler-Ersatzgrafik ist kompakter, die Quizüberschrift/Antwortabstände nutzen weniger Höhe und die Profilseite steht vor dem bewerteten Rätsel. Ein doppelter „schon gelöst“-Hinweis nach Erstlösung entfällt, bestätigte ältere Lösungen bleiben sichtbar.

Bei **900 × 700**: Dokumentbreite 900 px, Höhe 1871 px; lesbarer vertikaler Scroll-Fallback. Bei **150 % Schrift** im Standardfenster: Dokumentbreite 2400 px, Höhe 1687 px; ebenfalls vertikaler Scroll-Fallback ohne horizontalen Überlauf. Fragen/Hauptaktionen werden dabei nicht abgeschnitten oder verkleinert.

Das native Debug-App-Bundle wurde erfolgreich mit `npm run desktop:build -- --debug --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'` erstellt, inklusive lokal gebündelter Bilder und ad-hoc Signatur. Ausgabe: `src-tauri/target/debug/bundle/macos/Lernwelt.app`. Ein anschließender nativer Start und die Kontrolle am endgültigen Integrationsstand sind mit diesem Build-/Browsernachweis noch nicht behauptet. Das praktische Mikroskopieren und eine Erprobung mit Kindern wurden nicht ausgeführt.


### Integration mit der Erdkern-Expedition

Nach Rebase auf main `d05a449` (0.6.17) am 06.10.2026 bestanden `npm run check` mit 446 Frontend- und 130 Skripttests sowie `npm run check:rust` mit 186 Rusttests, Formatierung, TypeScript/Vite, Rustfmt und Clippy. Beide Expeditionen behalten ihre Katalogeinträge und verwenden denselben begrenzten Lesebefehl zum freiwilligen Aufdecken. Die Inhaltsgeneratorprüfung bewahrt zusätzlich die Erdkern-Datei und ihre Katalog-IDs. Das spätere Rebase auf 0.6.18 und der finale native Integrationsstand sind separat zu prüfen.


### Integration mit English Club und Schema 19

Das zweite Rebase auf main `8c46b06` (0.6.18) erhält Erdkern, English Club, den gemeinsamen Lesebefehl und den Schema-19-Vokabelpfad unverändert. Alle Zellkernfragen ergänzen den Bestand; insgesamt sind jetzt 3.771 sichtbare Fachaufgaben verfügbar. Generatorregressionen prüfen die gesamte unveränderte Focus-Bank und sämtliche Erdkern-/Club-Zuordnungen, auch wenn zusätzliche Club- und Zellkernfragen zusammen vorhanden sind. Am 06.10.2026 bestanden TypeScript, 138 betroffene Frontendtests, beide Generatorprüfungen, Formatierung, Cargo fmt/Clippy sowie alle 194 Rusttests. Finale Version, vollständiger Abschlusscheck und nativer Start werden am anschließenden 0.6.19-Stand geprüft.

### Finaler Integrationsstand 0.6.19

Erdkern und English Club sind am aktuellen main integriert; deren Inhalte, Vokabelmigration 019 und gemeinsamer read-only Command bleiben erhalten. Der vollständige finale Lauf mit 476 Frontend-, 130 Skript- und 194 Rusttests sowie der native Debug-App-Build bestanden. Die unabhängige Integrationsnachprüfung und der inzwischen nachgeholte native Start-/Bediennachweis stehen in [Review #167](reviews/issue-167.md). Nach Entsperren des Macs wurde die echte 0.6.19-App mit vorhandenem Profil geöffnet: Zelltyp-/Teil-/Detailwechsel, Originalfoto/Markierung/Großansicht, Escape/Fokusrückkehr und echte Rust-Lernrunde samt schreibfreiem Aufdecken funktionieren. Keine Antworten, Profil- oder Stufenänderungen und keine Punktebuchungen. Die 419 Standardfensterzustände wurden separat im Browser-DOM geprüft; native Ansichten im kleineren physischen Fenster nutzen den Scroll-Fallback.
