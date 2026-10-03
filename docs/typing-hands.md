# Tastaturhilfe: Hände und Grundstellung

Ab Version 0.5.2 ergänzt eine eigene Handdarstellung die Tastaturhilfe der Weltraumreise. Sie richtet sich an Jugendliche, die mit Tastschreiben beginnen, und wird gemeinsam mit der bestehenden QWERTZ-Hilfe ein- und ausgeblendet.

## Was die Ansicht erklärt

Die Draufsicht zeigt beide Hände aus deiner Perspektive: Fingerspitzen nach oben zur Tastatur, Unterarme nach unten und beide Daumen zur Mitte. Links liegen kleiner Finger, Ringfinger, Mittelfinger und Zeigefinger auf **A, S, D, F**. Rechts liegen Zeigefinger, Mittelfinger, Ringfinger und kleiner Finger auf **J, K, L, Ö**. Die Erhebungen auf F/J helfen, die Grundstellung ohne Hinschauen zu finden.

Die Daumen sind über der Leertaste bereit. Für ein Leerzeichen drückst du mit **einem** Daumen; die Hand ist frei wählbar. Für andere Tasten bewegt sich der passende Finger und kehrt danach zur Grundstellung zurück. Die Grafik ist eine schematische Orientierung und verlangt keine unbewegliche Fingerhaltung.

Eine kleine Seitenansicht ergänzt die Haltung: Finger leicht gekrümmt, Handgelenk möglichst gerade in einer Linie mit dem Unterarm, Schultern locker. Die Hände bleiben beim Tippen frei beweglich. Unterschiedliche Hände und Tastaturformen können anders aussehen als die Zeichnung.

Der passende Finger für das nächste Zeichen wird mit Umriss und Text erkennbar. Für Großbuchstaben zeigt die Hilfe zusätzlich den kleinen Finger der anderen Hand an der Umschalttaste. Bei Leerzeichen werden die Daumen als Wahl erklärt. Nach einer vollständigen Zeile oder einer bestätigten Lösung fordert die Ansicht nicht zum Schreiben eines weiteren Zeichens auf; die normale Prüf- oder Wiederholungshilfe gilt weiter.

## Umsetzung

`TypingHands` zeichnet die eigenen Grafiken als lokales SVG. Eine gemeinsame typisierte Fingerzuordnung in `src/domain/typing.ts` liefert Grundtasten, Hand, Finger und Shift-Hinweise. Tastatur und Handgrafik verwenden dieselbe Zuordnung. Beschriftungen und begleitende Texte vermitteln die Hinweise auch ohne Farbwahrnehmung. Die Darstellung bleibt in schmalen Fenstern innerhalb des Hilfebereichs bedienbar.

Es gibt keine neue Abhängigkeit, Netzressource, Migration oder IPC-Funktion. Aufgaben, Zieltexte, Punktesystem, Nutzerdaten und Antwortprüfung bleiben unverändert. Die App beobachtet keine Hände und kann tatsächliche Haltung oder Zehnfingertechnik nicht bestätigen. Eine medizinische Wirkung oder Verständlichkeitsprüfung mit Jugendlichen wird nicht behauptet.

## Quellen der Hinweise

Öffentliche Primärquellen, geprüft am 03.10.2026. Die Grafiken sind eigene Zeichnungen; fremde Abbildungen werden nicht übernommen.

- [TIPP10: Computertastaturen](https://www.tipp10.com/de/support/documents/keyboard/), Seiten 7–8 und 10: deutsche Fingerzuordnung, Grundstellung, F/J-Erhebungen, Daumen und gegenüberliegendes Shift.
- [OSHA: Keyboards](https://www.osha.gov/etools/computer-workstations/components/keyboards): Handgelenke in einer Linie mit den Unterarmen und entspannte Schultern.
- [OSHA: Wrist/Palm Supports](https://www.osha.gov/etools/computer-workstations/components/wrist-palm-support): frei bewegliche Hände beim Tippen und keine starre Handgelenkauflage.
- [Typing.com: Typing Posture](https://www.typing.com/blog/typing-posture/): leicht gekrümmte entspannte Finger und Daumen an der Leertaste. Die dortige QWERTY-Anordnung wird nicht übernommen.
- [Perkins School: Keyboard Yoga](https://www.perkins.org/resource/keyboard-yoga/): bequeme Fingerkrümmung und entspannte Haltung. Die deutsche Tastenanordnung richtet sich nach TIPP10.

[Weltraumreise](typing-space.md) · [Unabhängiger Review zu Issue #116](reviews/issue-116.md).
