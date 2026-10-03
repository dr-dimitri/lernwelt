# Tastschreiben: Weltraumreise

## Ziel und Gestaltung

Der Menüpunkt **Tastschreiben** wird ab Version 0.5.1 zur Weltraumreise für Jugendliche, die mit Tastschreiben beginnen. Eine selbst gestaltete Missionskonsole verbindet Sternenkarte, zwölf frei wählbare Sektoren und klare Fortschrittsanzeigen. Kurze direkte Texte, technische Raumfahrtmotive und ruhige Farben ersetzen Beete und Blumen. Die Aufgabe bleibt im Mittelpunkt: einen Text genau schreiben und Fehler selbst korrigieren.

Die Reise ist fiktional. Sie ist weder eine astronomische Simulation noch ein Geschwindigkeitswettbewerb. Es gibt keine Zeitlimits, Ranglisten, kostenpflichtigen Elemente oder gesperrten Missionen. Die Gestaltung wurde nicht mit Jugendlichen auf Verständlichkeit oder Lernwirksamkeit geprüft.

## Umsetzungsplan

1. Die vorhandene Navigation, Texteingabe, QWERTZ-Fingerhilfe und globale Stufenauswahl weiterverwenden. Die aktive Ansicht als Missionskonsole gestalten; Fortschritt ausschließlich aus bestätigten Lösungen ableiten.
2. Zwölf eigene Missionen mit jeweils drei Zeilen pro Stufe entwickeln. Anfangs stehen Tastenkombinationen im Vordergrund, später Wörter, Funkmeldungen und Logbucheinträge. Die Tastenfolge bleibt klein und schrittweise.
3. Das neue Paket als `typing-v2.json` mit eigenen v2-Kennungen einbinden. Das veröffentlichte `typing-v1.json` unverändert erhalten; historische Kennungen behalten ihre ursprünglichen Zieltexte.
4. Jede neue Zeile mit genau einer Vorgängerzeile derselben Station, Stufe und Zeilennummer verbinden. Bestätigte alte Lösungen als Fortschritt übernehmen, ohne weitere Erstlösungspunkte zu vergeben. Alte Antwortbelege und Punkte bleiben unverändert; identische alte Requests bleiben wiederholbar.
5. Tastaturbedienung, Fehlerpfade, beide Pakete, Übergang und Datenfortbestand prüfen. Desktop- und schmale Ansicht visuell kontrollieren, einen separaten Review dokumentieren und Version 0.5.1 bauen und veröffentlichen.

## Übungen und Bedienung

Die aktive Reise enthält **108 Zeilen**: zwölf Stationen, drei Zeilen pro Station und drei globale Schwierigkeitsstufen. Die Tastenfolge beginnt mit F/J und Leertaste, erweitert die Grundreihe, Ober- und Unterreihe und führt schließlich zu Umlauten, Großschreibung, Punkt und Komma. Texte verwenden nur bereits eingeführte Zeichen. Frühe Tastenspuren sind bewusst kurz; auch längere Aufgaben bleiben sprachlich direkt.

**Vorschule**, **Könner** und **Streber** sind die vorhandenen fachübergreifenden Stufennamen. Sie bedeuten hier kurzen Einstieg, reguläres Üben und längere Zeilen derselben Tastengruppe. Sie ordnen kein Alter zu. Alle Missionen, Zeilen und Stufen sind frei wählbar. Der Fortschritt gilt getrennt für jede Stufe.

Wähle einen Sektor und eine Zeile. Schreibe die Vorlage in **Deine Zeile**. Sichtbare Leerzeichen in der Vorlage werden mit der Leertaste geschrieben; Groß-/Kleinschreibung, Umlaute und Satzzeichen zählen zum genauen Zieltext. Die Hilfe zeigt die nächste Taste und den passenden Finger. Ein normales Eingabefeld nimmt ausschließlich den dort geschriebenen Text entgegen, ohne globale Tastenerfassung. Rücktaste korrigiert Fehler. Einfügen und Ziehen sind mit verständlicher Erklärung ausgeschaltet.

Ab Version 0.5.2 zeigt die eingeblendete Tastaturhilfe zusätzlich beide Hände mit Grundtasten und dem passenden Finger. Eine schematische Seitenansicht erklärt möglichst gerade Handgelenke und leicht gekrümmte Finger. [Handdarstellung, Bedienung und Quellen](typing-hands.md).

Erst **Zeile prüfen** oder Enter prüft den vollständigen Text in Rust. Eine neue richtige Zeile erhält einmalig **1/2/3 gemeinsame Lernpunkte**. Falsche Antworten und Wiederholungen ändern das Guthaben nicht. Jede bestätigte Zeile ergänzt einen von drei Missionsabschnitten. Ein vom früheren Tastengarten übernommener Abschnitt zählt bereits als bestätigt; die neue Vorlage lässt sich ohne weitere Punkte üben. Fortschrittsanzeigen und Rückmeldungen stellen Wiederholungen nicht als neue Erfolge dar.

## Vorbilder und Eigenständigkeit

Die [Recherche zum ursprünglichen Trainer](typing-garden.md#anregungen-aus-bestehenden-angeboten) vom 03.10.2026 bleibt Grundlage für Tastenfolge und Fingerhilfe: öffentlich zugängliche Unterlagen von TIPP10, TypingClub und Ratatype. Die Anbieterunterlagen sind kein unabhängiger Wirksamkeitsnachweis. Missionsgestaltung, Grafiken und Zieltexte sind eigene Inhalte; es werden keine fremden Figuren, Aufgaben oder Markenaufmachungen übernommen.

Die Fingerhilfe verwendet eine deutsche QWERTZ-Tastatur mit Grundstellung A S D F – J K L Ö und gegenüberliegender Umschalttaste für Großbuchstaben. Die App prüft passenden Text. Tatsächliche Fingerhaltung, Blickrichtung und Zehnfingertechnik kann sie nicht erkennen. Zahlenreihe, sämtliche Sonderzeichen, alternative Layouts und adaptive Kurse bleiben außerhalb dieses Angebots.

## Daten und Übergang

Schema 17, begrenzte Commands und vorhandenes Punktejournal bleiben erhalten. Rust lädt und validiert beide lokalen Inhaltspakete. Die Oberfläche zeigt ausschließlich das aktive v2-Paket; alte Aufgaben bleiben intern mit ihren unveränderten Zieltexten erreichbar. Die Zuordnung der Vorgänger ist auf zwölf Stationen, drei Stufen und drei Zeilennummern begrenzt und wird beim Laden geprüft.

Die Anzeige übernimmt eine bestätigte Lösung von v1 oder v2. Bei der Punkteprüfung gehören beide Kennungen derselben Zeilenfamilie zusammen. Der Themenwechsel schreibt keine alten Datenbankzeilen um und berechnet keine historischen Punkte neu. Antwortprüfung, Fortschritt, Beleg und mögliche Gutschrift bleiben atomar; geänderte Payloads mit derselben Request-ID werden abgewiesen. Ein fehlgeschlagener Speicherrequest lässt sich unverändert mit derselben ID wiederholen.

Der Übungsbetrieb bleibt offline. Profil und Fortschritt liegen lokal; laufende Tastenanschläge, Zeitmessungen und Geschwindigkeiten werden nicht gespeichert. Der Trainer ist eine begrenzte fachübergreifende Zusatzfertigkeit, kein Lehrplanpaket oder Nachweis einer Ausbildung. [Architektur](architecture.md) und [Review zu Issue #114](reviews/issue-114.md).
