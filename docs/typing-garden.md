# Tastschreiben: der Tastengarten

Dieses Dokument beschreibt den ursprünglichen Trainer aus Version 0.5.0 und die damalige Recherche. Ab Version 0.5.1 ersetzt eine [Weltraumreise für Jugendliche](typing-space.md) die Gartengestaltung. Das ursprüngliche Inhaltspaket bleibt für historische Aufgaben, Fortschritte und Antwortbelege erhalten.

## Plan und Ziel

Der eigene Menüpunkt **Tastschreiben** ergänzt die Trainer von Lernwelt. Kinder, die gerade beginnen, lernen in kleinen Schritten die deutsche QWERTZ-Tastatur kennen. Ein selbst gestalteter Tastengarten macht den Fortschritt sichtbar: Drei erstmals richtig geschriebene Zeilen lassen die Pflanze einer Station auf der gewählten Stufe wachsen. Alle Stationen sind von Anfang an frei wählbar.

Die Umsetzung folgt fünf Schritten:

1. Bestehende Lernangebote recherchieren und eine eigene Folge kleiner Tastengruppen sowie kurze Übungstexte entwickeln.
2. Einen eigenen Bereich in die vorhandene Seiten- und Fensternavigation einfügen; die fachübergreifende Stufenauswahl und Gestaltung weiterverwenden.
3. Eine echte Texteingabe mit Korrekturen, Tasten- und Fingerhilfe anbieten. Die vollständige Zeile wird bewusst im Rust-Backend geprüft.
4. Erstlösungen und gemeinsame Lernpunkte lokal und atomar speichern; bestehende Daten mit einer versionierten Migration erhalten. Replays und Speicherfehler sicher behandeln.
5. Nutzerabläufe, Persistenz und Fehlerpfade prüfen, den gesamten Diff separat reviewen und danach Version 0.5.0 für macOS und Windows bauen.

## Anregungen aus bestehenden Angeboten

Recherche am **03.10.2026**, ausschließlich öffentlich zugängliche Anbieterunterlagen:

| Quelle | Beobachtung | Eigene Entscheidung für Lernwelt |
| --- | --- | --- |
| [Tipp10: Aufbau und Hilfen](https://www.tipp10.com/de/support/docs/20/) | Schrittweise Lektionen sowie virtuelle Tasten- und Fingerhilfe. | Kleine Tastengruppen, sichtbare nächste Taste und verständlicher Fingerhinweis. |
| [Tipp10: Tastaturunterlagen](https://www.tipp10.com/de/support/documents/keyboard/) | Deutsche QWERTZ-Anordnung, Grundstellung und Zuordnung der Finger. | A S D F – J K L Ö; F/J ertasten, Leertaste mit dem Daumen und Großbuchstaben mit gegenüberliegender Umschalttaste. |
| [TypingClub: Kursaufbau](https://primary.typingclub.com/docs/user-guide/class-student-setup/manage-courses.html) | Einstieg bei F/J und schrittweiser Ausbau. | Erst zwei Orientierungstasten, dann Grundreihe, Oberreihe und Unterreihe. |
| [TypingClub: Unterrichtshinweise](https://typingclub.typingclub.com/docs/user-guide/introduction/best-practices-for-teaching-keyboarding.html) | Rücktaste ist für Anfänger als Korrekturhilfe vorgesehen. | Fehler bleiben jederzeit korrigierbar. Kurze Hinweise ermutigen zum Weiterprobieren. |
| [Ratatype: Kurse](https://www.ratatype.de/courses/) | Ein eigener deutscher QWERTZ-Anfängerkurs. | Deutsches Layout mit Umlauten und ß bewusst unterstützen. |

Die Anbieterunterlagen sind keine unabhängige Wirksamkeitsstudie. Sie belegen weder die Wirksamkeit des Tastengartens noch eine Verständlichkeitsprüfung mit Kindern. Lernwelt übernimmt keine fremden Texte, Aufgabenfolgen, Figuren, Grafiken oder Markenaufmachung. Garten, Pflanzen und 108 Zeilen sind eigene Inhalte. Kein Laufband, Zeitlimit, Geschwindigkeitsziel, Verlust bei Fehlern oder Wettbewerb.

## Lernschritte und Umfang

Jede Station enthält **drei Zeilen je Stufe**, insgesamt **108 Aufgaben** mit stabilen IDs. Spätere Stationen verwenden auch bereits eingeführte Tasten. Die ersten Stationen üben bewusst kurze Tastenspuren; sobald passende Buchstaben verfügbar sind, kommen Wörter und zuletzt kurze eigene Gartensätze hinzu. In Vorschule teilt sich die Unterreihe auf drei kurze Zeilen auf. Die letzte Station beginnt mit Ä/ß, übt danach Großschreibung und ergänzt zuletzt Punkt und Komma.

| Station | Neue Tasten |
| --- | --- |
| 1 | F, J, Leertaste |
| 2 | D, K |
| 3 | S, L |
| 4 | A, Ö |
| 5 | G, H |
| 6 | E, I |
| 7 | R, U |
| 8 | T, Z |
| 9 | W, O |
| 10 | Q, P, Ü |
| 11 | Y, X, C, V, B, N, M |
| 12 | Ä, ß, Umschalttaste, Punkt, Komma |

**Vorschule** bietet besonders kurze Zeilen, **Könner** mehr Wechsel und Wörter, **Streber** längere Zeilen innerhalb derselben Tastengruppe. Diese spielerischen Namen bewerten kein Kind und ordnen kein Alter zu. Die Tastenhilfe bleibt auf allen Stufen verfügbar. Freie Wahl, Wiederholungen und Stufenwechsel sind jederzeit möglich; pro Station und Stufe wird der Fortschritt getrennt angezeigt.

## Bedienung und Rückmeldung

Wähle eine Pflanze, lies die kurze Einführung und schreibe die sichtbare Zeile in **Deine Zeile** ab. Die Hilfe zeigt die nächste Taste und den zugehörigen Finger als Text. Leerzeichen werden in der Vorlage sichtbar gemacht; im Eingabefeld wird dafür die Leertaste verwendet. Groß- und Kleinbuchstaben, Umlaute, Satzzeichen und Leerzeichen gehören zum genauen Zieltext.

Fehler lassen sich mit der Rücktaste verbessern. **Zeile prüfen** oder Enter prüft den vollständigen Text. Eine falsche Zeile kostet keine Punkte; du kannst sie korrigieren und erneut prüfen. Eine erstmals richtig geschriebene Zeile bringt **1/2/3 Lernpunkte** entsprechend ihrer Stufe. Bereits gelöste Zeilen lassen sich erneut üben, bringen dabei keine weiteren Punkte. Jede Pflanze gehört zum gespeicherten Erstlösungsfortschritt; sie ist kein kostenpflichtiges Spiel und kein einlösbares Abzeichen.

Die Bildschirmtastatur dient als Hinweis. Sie ersetzt nicht das Tippen auf einer echten Tastatur. Kurze Pausen und das Ertasten von F/J ergänzen das Bildschirmüben. Eine Computer-Tastatur mit deutschem Layout wird empfohlen; die App kann weder tatsächliche Fingerbewegung noch Haltung oder Blickrichtung feststellen. Die Prüfung bestätigt den passenden Text, keine nachgewiesene Zehnfingertechnik.

## Datenhaltung und Grenzen

Der Trainer arbeitet offline, ohne Cloud, Tracking oder KI. Rust lädt und validiert das lokale Paket `typing-v1.json`. Die Oberfläche erhält ausschließlich begrenzte Daten über `get_typing_state` und übermittelt Aufgabe, Zieltexteingabe und Request-ID über `submit_typing`. Ein vom Frontend behauptetes Ergebnis wird nicht akzeptiert.

Schema 17 ergänzt eigene Antwortbelege und Aufgabenfortschritte. Die Migration verändert keine vorhandenen Lernstände oder Punkte. Textvergleich, Fortschritt, Antwortbeleg und mögliche Punktebuchung liegen in derselben Transaktion; identische Request-Replays buchen nichts zusätzlich. Eine ID mit anderem Inhalt wird abgewiesen. Ein Speicherfehler wird sichtbar und dieselbe unveränderte Antwort kann mit derselben ID erneut versucht werden. Es werden keine laufenden Tastenanschläge, Zeitmessungen oder Tippgeschwindigkeiten gespeichert.

Zum Speichern und Punkteverdienen ist das vorhandene lokale Lernprofil erforderlich. Die Browser-Vorschau zeigt fehlende Desktop-Funktionen ehrlich an. Bestätigte Fortschritte bleiben nach Neustart und nach Änderung des Profilnamens erhalten; eine noch ungeprüfte Eingabe wird nicht dauerhaft gespeichert. Es gilt das einzelne lokale Lernprofil der Anwendung. Der Tastengarten ist eine fachübergreifende Zusatzfertigkeit für die Zielgruppe von Lernwelt, keine vollständige Lehrplanabdeckung, Lernstandsdiagnose oder amtlich freigegebene Ausbildung. Zahlenreihe, alle Sonderzeichen, alternative Tastaturlayouts und ein adaptiver Kurs sind nicht Teil dieses ersten Pakets.

Review und tatsächlich ausgeführte Prüfungen: [Issue #112](reviews/issue-112.md).
