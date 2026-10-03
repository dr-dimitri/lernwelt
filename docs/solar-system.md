# Sonnensystem-Lernwelt: Geographie Klasse 5

Die eigene Sonnensystem-Lernwelt führt zu den acht Planeten. Die Kinder können ein räumliches Modell erkunden, NASA-Aufnahmen ansehen und Planeten erkennen. Kurze Steckbriefe verbinden Merkmale der Planeten mit ihrer Reihenfolge von der Sonne aus. Die Inhalte und alle Bilder werden mit der App ausgeliefert und funktionieren offline.

## Bedienung und Lernpunkte

**Meine Fächer → Geographie** öffnet den Entdeckungsmodus. Unter dem Modell wählen acht Tasten einen Planeten und dessen Steckbrief. Das Modell lässt sich durch Ziehen drehen. Die Regler **Blick drehen** und **Von oben schauen** funktionieren mit Maus, Touch und Tastatur (Tab, dann Pfeiltasten). **Blick zurücksetzen** stellt die Ausgangsperspektive wieder her.

**Umlauf starten** setzt alle acht Planeten in Bewegung; **Umlauf anhalten** friert ihre Positionen ein. Erneutes Starten setzt dort fort. Der Regler **Sekunden pro Erdenjahr** reicht von 10 (schnell) bis 60 Sekunden (langsam) in Sekundenschritten, standardmäßig 10. Eine Runde der Erde dauert genau die eingestellte aktive Zeit. Die Geschwindigkeit kann auch während des Umlaufs geändert werden. Die Sonne bleibt fest; Drehen, Kippen und die Planetenwahl bleiben möglich. Die Steuerung steht auch in den Rätseln bereit. Anfangs ist die Animation ausgeschaltet. Beim Ausblenden des Fensters ruht sie ohne Zeitsprung bei der Rückkehr; beim Verlassen der Modellansicht endet die Animationsschleife. Die Einstellung wird nicht gespeichert.

**Planeten erraten** startet eine Runde mit acht Aufgaben auf der gespeicherten globalen Stufe. Der Zielplanet und seine Bahn sind goldmarkiert; das Modell zeigt seinen Namen nicht. Ein größeres NASA-Bild ergänzt die Ansicht. Nach der Auswahl eines Namens speichert **Antwort prüfen** den Versuch im Backend. Tipps, freiwillige Lösungserklärungen nach Fehlern und **Nächster Planet** unterstützen die Runde ohne Zeitdruck. Jede Stufe besitzt acht stabile Aufgaben-IDs in `geography-solar-5-v1.json`.

Vorschule, Könner und Streber können frei gewählt werden. Neue richtige Lösungen bringen einmalig 1/2/3 Punkte. Fehler, reines Erkunden und Mitmachaufträge bringen keine Punkte. Bereits gelöste Aufgaben können wiederholt werden; identische Übertragungen und neue Wiederholungsversuche buchen keine zusätzlichen Punkte. Zum Speichern wird ein Lernprofil benötigt. Ohne Profil bleiben Modell und Steckbriefe zugänglich; die Browser-Vorschau simuliert keine Speicherung. Migration 016 erhält bisherige Daten und Buchungen.

## Lehrplanbezug und Umfang

- Fach: Geographie; Jahrgangsstufe 5, Gymnasium Bayern.
- Grundlage: [LehrplanPLUS Geographie 5, Lernbereich 2 „Planet Erde“](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/geographie), abgerufen am 03.10.2026.
- Inhalt: Grundstruktur des Sonnensystems; Informationen aus Bildern und Modellen gewinnen; die Besonderheiten der Erde im Sonnensystem beschreiben.
- Stabile Planeten-IDs: `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune` in `src/domain/solar-system.ts`. Die Reihenfolge 1–8 bedeutet zunehmenden Abstand der Umlaufbahnen von der Sonne.
- Begrenztes Themenangebot, keine vollständige Abdeckung des Geographie-Lehrplans oder des Lernbereichs. Erdaufbau, Kartenarbeit und weitere geografische Themen gehören nicht zum Umfang dieser Lernwelt. Es gibt keine amtliche Freigabe oder behauptete Verständlichkeitsprüfung mit Kindern.

Die Karten unterscheiden Gesteinsplaneten, Gasriesen und Eisriesen. Neue Wörter werden direkt erklärt. „Eisriese“ bedeutet keine gefrorene feste Kugel: Im Inneren liegen Wasser und weitere Stoffe als heiße, dichte Flüssigkeiten unter großem Druck. Die Erdkarten nennen flüssiges Wasser, die schützende Lufthülle und bisher nur auf der Erde nachgewiesenes Leben. Wasser und Luft zu schützen wird als kindgerechter Bezug zum eigenen Handeln aufgegriffen.

Die Sonne ist ein Stern und kein Planet. Sie leuchtet selbst; die Planeten kreisen um sie und spiegeln Sonnenlicht. Pluto ist ein Zwergplanet und gehört deshalb nicht zu den acht Planeten. Fachliche Quellen: [NASA: Planeten](https://science.nasa.gov/solar-system/planets/), [NASA: Sonne](https://science.nasa.gov/sun/facts/) und [NASA: Pluto](https://science.nasa.gov/dwarf-planets/pluto/facts/).

## Grenzen des Modells

Das räumliche Modell ist eine eigene schematische Lernzeichnung. Planetengrößen, Abstände und die dargestellten Bahnen sind für die Bedienung vereinfacht und nicht maßstabsgetreu. Die Planeten beginnen an beispielhaften Positionen; das Modell zeigt keine aktuellen astronomischen Positionen. Sie umlaufen die Sonne auf Kreisbahnen mit gleichmäßiger Winkelgeschwindigkeit. Elliptische Bahnen und die wechselnde Geschwindigkeit entlang einer echten Bahn werden nicht simuliert. Die Reihenfolge der acht Planeten bleibt korrekt.

Die **Zeitverhältnisse** folgen den siderischen Umlaufzeiten (eine vollständige Runde relativ zu den Sternen) aus den einzelnen [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), geprüft am 03.10.2026. Die Dauer im Modell ist `Sekunden pro Erdenjahr × Umlauftage des Planeten / 365,256`. Bei 10 Sekunden pro Erdenjahr benötigt Neptun deshalb etwa 27 Minuten 28 Sekunden; seine langsame Bewegung ist beabsichtigt.

| Planet | Siderische Umlaufzeit in Erdentagen | Modellumlauf bei 10 Sekunden pro Erdenjahr |
| --- | ---: | ---: |
| [Merkur](https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html) | 87,969 | 2,408 Sekunden |
| [Venus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html) | 224,701 | 6,152 Sekunden |
| [Erde](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | 365,256 | 10 Sekunden |
| [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) | 686,980 | 18,808 Sekunden |
| [Jupiter](https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html) | 4.332,589 | 118,618 Sekunden |
| [Saturn](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html) | 10.755,699 | 294,470 Sekunden |
| [Uranus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html) | 30.685,400 | 840,107 Sekunden |
| [Neptun](https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html) | 60.189,018 | 1.647,858 Sekunden |

Raumsondenbilder sind häufig aus mehreren Aufnahmen zusammengesetzt und in Farben oder Kontrast bearbeitet. Venus zeigt eine von NASA aus unterschiedlichen Filtern zusammengesetzte Farbansicht; Neptuns kräftiges Blau ist in dieser historischen Aufnahme verstärkt. Die Bilder zeigen weder einen gemeinsamen Maßstab noch gleichzeitige Aufnahmen. Ein Foto ist deshalb keine sichere Farbreferenz für den Blick mit eigenen Augen.

## NASA-Bilder und Nutzung

Alle acht Bilder liegen in `public/images/solar-system/` als WebP mit 1.024 Pixeln Breite. Die Summe der acht Bilddateien beträgt rund 178 KB. Die Verarbeitung beschränkt sich auf Verkleinerung und WebP-Kompression (Pillow, Qualität 88); keine KI-Erzeugung, Inhaltsretusche oder nachträgliche Farbänderung durch Lernwelt. Das [Quellenmanifest](../public/images/solar-system/manifest.json) dokumentiert NASA-Quellseite, Original-Download-URL, Credits, Abrufdatum, Bearbeitung, Maße und SHA-256 der gebündelten Datei.

| Planet  | Aufnahme / NASA-Seite                                                                                                  | Angegebener Bildnachweis                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Merkur  | [MESSENGER: Mercury Globe, PIA15162](https://science.nasa.gov/photojournal/mercury-globe-0n-180e/)                     | NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington |
| Venus   | [Mariner 10: Venus from Mariner 10, PIA23791](https://science.nasa.gov/photojournal/venus-from-mariner-10/)            | NASA/JPL-Caltech                                                                            |
| Erde    | [Apollo 17: Blue Marble](https://www.nasa.gov/image-article/apollo-17-blue-marble/)                                    | NASA                                                                                        |
| Mars    | [Viking: Mosaic of Mars](https://science.nasa.gov/resource/mosaic-of-mars/)                                            | NASA/JPL-Caltech/USGS                                                                       |
| Jupiter | [Cassini: High Resolution Globe, PIA02873](https://science.nasa.gov/photojournal/pj-high-resolution-globe-of-jupiter/) | NASA/JPL/University of Arizona                                                              |
| Saturn  | [Cassini: So Far from Home, PIA21345](https://science.nasa.gov/photojournal/so-far-from-home/)                         | NASA/JPL-Caltech/Space Science Institute                                                    |
| Uranus  | [Voyager 2: PIA18182](https://science.nasa.gov/photojournal/uranus-as-seen-by-nasas-voyager-2/)                        | NASA/JPL-Caltech                                                                            |
| Neptun  | [Voyager 2: Neptune Full Disk, PIA01492](https://science.nasa.gov/photojournal/neptune-full-disk-view/)                | NASA/JPL                                                                                    |

Die Auswahl folgt den [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), geprüft am 03.10.2026: sachliche Bildungsnutzung mit Quellenangabe; gesonderte Rechte an gekennzeichneten Drittinhalten beachten. Die ausgewählten Quellseiten nennen die oben übernommenen Credits und keine zusätzliche Copyright-Beschränkung. NASA-Logos und Abbildungen identifizierbarer Personen werden nicht verwendet. Die Bilder begründen keine NASA-Empfehlung, Zusammenarbeit oder Freigabe von Lernwelt.

## Fachquellen der Steckbriefe

Die Texte sind eigene kurze deutsche Formulierungen auf Grundlage der jeweiligen offiziellen NASA-Faktenseiten, Quellenstand 03.10.2026:

- [Merkur](https://science.nasa.gov/mercury/facts/), [Venus](https://science.nasa.gov/venus/venus-facts/), [Erde](https://science.nasa.gov/earth/facts/) und [Mars](https://science.nasa.gov/mars/facts/).
- [Jupiter](https://science.nasa.gov/jupiter/jupiter-facts/), [Saturn](https://science.nasa.gov/saturn/facts/), [Uranus](https://science.nasa.gov/uranus/facts/) und [Neptun](https://science.nasa.gov/neptune/neptune-facts/).
