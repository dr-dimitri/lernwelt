# Sonnensystem-Lernwelt: Geographie Klasse 5

Die eigene Sonnensystem-Lernwelt führt zu den acht Planeten und dem Zwergplaneten Pluto. Die Kinder können ein räumliches Modell erkunden, NASA-Aufnahmen ansehen und Planeten erkennen. Kurze Steckbriefe verbinden Merkmale der Planeten mit ihrer Reihenfolge von der Sonne aus. Die Inhalte und alle Bilder werden mit der App ausgeliefert und funktionieren offline.

## Bedienung und Lernpunkte

**Meine Fächer → Geographie** öffnet den Entdeckungsmodus. Unter dem Modell wählen acht Planetentasten und **Pluto · Zwergplanet** eine Welt und deren Steckbrief. Das Modell lässt sich durch Ziehen drehen. Die Regler **Blick drehen** und **Von oben schauen** funktionieren mit Maus, Touch und Tastatur (Tab, dann Pfeiltasten). **Blick zurücksetzen** stellt die Ausgangsperspektive wieder her.

**Umlauf starten** setzt alle acht Planeten und Pluto in Bewegung; **Umlauf anhalten** friert ihre Positionen ein. Erneutes Starten setzt dort fort. Der Regler **Sekunden pro Erdenjahr** reicht von 5 (schnell) bis 15 Sekunden (langsam) in Sekundenschritten, standardmäßig 5. Eine Runde der Erde dauert genau die eingestellte aktive Zeit. Die Geschwindigkeit kann auch während des Umlaufs geändert werden. Die Sonne bleibt fest; Drehen, Kippen und die Planetenwahl bleiben möglich. Die Steuerung steht auch in den Rätseln bereit. Anfangs ist die Animation ausgeschaltet. Beim Ausblenden des Fensters ruht sie ohne Zeitsprung bei der Rückkehr; beim Verlassen der Modellansicht endet die Animationsschleife. Die Einstellung wird nicht gespeichert.

Jeder Steckbrief zeigt drei unterschiedliche NASA-Bilder. **Zurück** und **Weiter** wechseln durch sie; nach dem letzten Bild geht es wieder zum ersten. Ein Bildzähler zeigt die Position. Beim Planetenwechsel beginnt die Galerie bei Bild 1. **Bild vergrößern** öffnet die gewählte Aufnahme in einem Dialog, in dem dieselben Bildtasten verfügbar sind. **Schließen** oder Escape schließen die Großansicht und führen den Tastaturfokus zum Vergrößern-Knopf zurück. Der zuletzt gewählte Bildindex bleibt dabei erhalten. Alle Bildtasten sind per Tab erreichbar und lassen sich mit Enter oder Leertaste bedienen. Wenn eine Datei nicht geladen werden kann, bieten die Galerien einen verständlichen Hinweis, erneutes Laden und den Wechsel zu einem anderen Bild.

Die Galerie funktioniert ohne Lernprofil und vergibt keine Punkte. Die Rätsel behalten ihre bisherigen Aufnahmen mit namenlosen Alternativtexten, damit Galerieüberschriften keine Lösung verraten. Aufnahmen, Ansichtsstand und Großansicht bleiben vom gespeicherten Lernfortschritt getrennt.

**Planeten erraten** startet eine Runde mit acht Aufgaben auf der gespeicherten globalen Stufe. Der Zielplanet und seine Bahn sind goldmarkiert; das Modell zeigt seinen Namen nicht. Ein größeres NASA-Bild ergänzt die Ansicht. Nach der Auswahl eines Namens speichert **Antwort prüfen** den Versuch im Backend. Tipps, freiwillige Lösungserklärungen nach Fehlern und **Nächster Planet** unterstützen die Runde ohne Zeitdruck. Jede Stufe besitzt acht stabile Aufgaben-IDs in `geography-solar-5-v1.json`.

Vorschule, Könner und Streber können frei gewählt werden. Neue richtige Lösungen bringen einmalig 1/2/3 Punkte. Fehler, reines Erkunden und Mitmachaufträge bringen keine Punkte. Bereits gelöste Aufgaben können wiederholt werden; identische Übertragungen und neue Wiederholungsversuche buchen keine zusätzlichen Punkte. Zum Speichern wird ein Lernprofil benötigt. Ohne Profil bleiben Modell und Steckbriefe zugänglich; die Browser-Vorschau simuliert keine Speicherung. Migration 016 erhält bisherige Daten und Buchungen.

## Lehrplanbezug und Umfang

- Fach: Geographie; Jahrgangsstufe 5, Gymnasium Bayern.
- Grundlage: [LehrplanPLUS Geographie 5, Lernbereich 2 „Planet Erde“](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/geographie), abgerufen am 03.10.2026.
- Inhalt: Grundstruktur des Sonnensystems; Informationen aus Bildern und Modellen gewinnen; die Besonderheiten der Erde im Sonnensystem beschreiben.
- Stabile Planeten-IDs: `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune` in `src/domain/solar-system.ts`. Die Reihenfolge 1–8 bedeutet zunehmenden Abstand der Umlaufbahnen von der Sonne.
- Die zusätzliche Entdeckungs-ID `pluto` gehört zu `SolarDwarfPlanet`. `solarBodies` umfasst acht Planeten und Pluto; `SolarPlanet` und `planets` bleiben die acht zulässigen Rätselplaneten. Keine zusätzlichen Quizaufgaben oder Änderungen am gespeicherten Fortschritt.
- Begrenztes Themenangebot, keine vollständige Abdeckung des Geographie-Lehrplans oder des Lernbereichs. Erdaufbau, Kartenarbeit und weitere geografische Themen gehören nicht zum Umfang dieser Lernwelt. Es gibt keine amtliche Freigabe oder behauptete Verständlichkeitsprüfung mit Kindern.

Die Karten unterscheiden Gesteinsplaneten, Gasriesen und Eisriesen. Neue Wörter werden direkt erklärt. „Eisriese“ bedeutet keine gefrorene feste Kugel: Im Inneren liegen Wasser und weitere Stoffe als heiße, dichte Flüssigkeiten unter großem Druck. Die Erdkarten nennen flüssiges Wasser, die schützende Lufthülle und bisher nur auf der Erde nachgewiesenes Leben. Wasser und Luft zu schützen wird als kindgerechter Bezug zum eigenen Handeln aufgegriffen.

Die Sonne ist ein Stern und kein Planet. Sie leuchtet selbst; die Planeten kreisen um sie und spiegeln Sonnenlicht. Pluto ist ein Zwergplanet und gehört deshalb nicht zu den acht Planeten. Fachliche Quellen: [NASA: Planeten](https://science.nasa.gov/solar-system/planets/), [NASA: Sonne](https://science.nasa.gov/sun/facts/) und [NASA: Pluto](https://science.nasa.gov/dwarf-planets/pluto/facts/).

## Grenzen des Modells

Das räumliche Modell ist eine eigene schematische Lernzeichnung. Planetengrößen, Abstände und die dargestellten Bahnen sind für die Bedienung vereinfacht und nicht maßstabsgetreu. Die Planeten beginnen an beispielhaften Positionen; das Modell zeigt keine aktuellen astronomischen Positionen. Sie umlaufen die Sonne auf Kreisbahnen mit gleichmäßiger Winkelgeschwindigkeit. Elliptische Bahnen und die wechselnde Geschwindigkeit entlang einer echten Bahn werden nicht simuliert. Die Reihenfolge der acht Planeten bleibt korrekt. Pluto erscheint im Modell auf einer zusätzlichen äußeren Kreisbahn. Seine echte Bahn ist schräg zur Planetenebene und stark oval; auf einem Teil seiner Bahn ist er der Sonne näher als Neptun. Diese Besonderheiten werden nicht nachgezeichnet. Die interne Modellposition 9 ist keine Einstufung als neunter Planet.

Die **Zeitverhältnisse** folgen den siderischen Umlaufzeiten (eine vollständige Runde relativ zu den Sternen) aus den einzelnen [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), geprüft am 03.10.2026, Pluto ergänzt und geprüft am 04.10.2026. Die Dauer im Modell ist `Sekunden pro Erdenjahr × Umlauftage der Welt / 365,256`. Bei 5 Sekunden pro Erdenjahr benötigt Neptun deshalb etwa 13 Minuten 44 Sekunden; seine langsame Bewegung ist beabsichtigt. Pluto benötigt etwa 20 Minuten 40 Sekunden; auch seine Bewegung ist entsprechend langsam.

| Welt | Siderische Umlaufzeit in Erdentagen | Modellumlauf bei 5 Sekunden pro Erdenjahr |
| --- | ---: | ---: |
| [Merkur](https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html) | 87,969 | 1,204 Sekunden |
| [Venus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html) | 224,701 | 3,076 Sekunden |
| [Erde](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) | 365,256 | 5 Sekunden |
| [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) | 686,980 | 9,404 Sekunden |
| [Jupiter](https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html) | 4.332,589 | 59,309 Sekunden |
| [Saturn](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html) | 10.755,699 | 147,235 Sekunden |
| [Uranus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/uranusfact.html) | 30.685,400 | 420,053 Sekunden |
| [Neptun](https://nssdc.gsfc.nasa.gov/planetary/factsheet/neptunefact.html) | 60.189,018 | 823,929 Sekunden |
| [Pluto (Zwergplanet)](https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html) | 90.560 | 1.239,678 Sekunden |

Raumsondenbilder sind häufig aus mehreren Aufnahmen zusammengesetzt und in Farben oder Kontrast bearbeitet. Venus zeigt eine von NASA aus unterschiedlichen Filtern zusammengesetzte Farbansicht; Neptuns kräftiges Blau ist in dieser historischen Aufnahme verstärkt. Die Bilder zeigen weder einen gemeinsamen Maßstab noch gleichzeitige Aufnahmen. Ein Foto ist deshalb keine sichere Farbreferenz für den Blick mit eigenen Augen.

## NASA-Bilder und Nutzung

Alle 27 Bilder liegen in `public/images/solar-system/` als WebP. Die bisherigen 24 Bilder bleiben bytegleich erhalten. Plutos Hauptbild besitzt 1.024 × 1.024 Pixel, seine Berg-Nahaufnahme 1.041 × 742 Pixel und die Gegenlichtansicht 1.400 × 788 Pixel. Die Summe aller Bilddateien beträgt 1.984.648 Bytes (rund 1,98 MB). Die Verarbeitung beschränkt sich auf Verkleinerung und WebP-Kompression (Pillow, Qualität 88); keine KI-Erzeugung, Inhaltsretusche oder nachträgliche Farbänderung durch Lernwelt. Das [Quellenmanifest](../public/images/solar-system/manifest.json) dokumentiert je Bild die stabile Bild- und Himmelskörper-ID (`planetId`, auch für den Zwergplaneten Pluto), Titel, Alternativtext, verständliche Erklärung, NASA-Quellseite, Original-Download-URL, Credits, Abrufdatum, Bearbeitung, Maße und SHA-256 der gebündelten Datei. Die Galerie zeigt die jeweils passende Erklärung und den Nachweis. Sie lädt ausschließlich lokale Dateien; nur die freiwilligen Quellenlinks benötigen Internet.

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
| Pluto (Zwergplanet) | [New Horizons: Pluto’s Big Heart in Color, PIA19708](https://science.nasa.gov/photojournal/plutos-big-heart-in-color/) | NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute |

Die Auswahl folgt den [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), geprüft am 03.10.2026 und für die Pluto-Ergänzung erneut am 04.10.2026: sachliche Bildungsnutzung mit Quellenangabe; gesonderte Rechte an gekennzeichneten Drittinhalten beachten. Die ausgewählten Quellseiten nennen die oben übernommenen Credits und keine zusätzliche Copyright-Beschränkung. NASA-Logos und Abbildungen identifizierbarer Personen werden nicht verwendet. Die Bilder begründen keine NASA-Empfehlung, Zusammenarbeit oder Freigabe von Lernwelt. Die drei Pluto-Quellseiten wurden am 04.10.2026 geprüft und ihre verlinkten Original-JPEGs heruntergeladen: PIA19708 mit 1.024 × 1.024 Pixeln, PIA19710 mit 1.041 × 742 Pixeln und PIA20038 mit 2.000 × 1.125 Pixeln. Nur PIA20038 wurde für die gebündelte Datei verkleinert. Plutos Hauptbild kombiniert ein scharfes Schwarz-Weiß-Foto mit Farbdaten des Ralph-Instruments; die Galerie erklärt diese Zusammensetzung.

Zusätzlich zu den Hauptbildern enthält jede Galerie diese zwei Ansichten; die vollständigen Credits stehen im Manifest und direkt am Bild:

| Planet  | Zusätzliche NASA-Bilder                                                                                                                                                                                                | Erklärung der Darstellung                                                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Merkur  | [Vorbeiflug, PIA11245](https://science.nasa.gov/photojournal/mercury-as-never-seen-before/) · [Geländeansicht, PIA19422](https://science.nasa.gov/photojournal/a-striking-perspective/)                                | MESSENGER-Foto und eine aus Fotos und Höhenmessungen berechnete Geländeansicht. Rot und Blau stellen Höhen und Tiefen dar. |
| Venus   | [Wolken, PIA00111](https://science.nasa.gov/photojournal/venus-colorized-clouds/) · [Nordhälfte, PIA00271](https://science.nasa.gov/photojournal/venus-computer-simulated-global-view-of-the-northern-hemisphere/)     | Galileo-Violettaufnahme blau eingefärbt; Magellan-Radardaten als künstlich gefärbter Globus ohne Wolken.                   |
| Erde    | [Pazifik, PIA00123](https://science.nasa.gov/photojournal/earth-pacific-ocean/) · [Erde und Mond, PIA00342](https://science.nasa.gov/photojournal/the-earth-and-moon/)                                                 | Galileo-Aufnahmen; Erde und Mond als Montage mit künstlichen Farben und vereinfachter Entfernung.                          |
| Mars    | [Globale Farbansicht, PIA00407](https://science.nasa.gov/photojournal/global-color-views-of-mars/) · [Cerberus-Seite, PIA00091](https://science.nasa.gov/photojournal/cerberus-hemisphere/)                            | Unterschiedliche Viking-Mosaike; bei der globalen Ansicht verstärkte Helligkeits- und Farbunterschiede.                    |
| Jupiter | [Großer Roter Fleck, PIA01509](https://science.nasa.gov/photojournal/jupiter-full-disk-with-great-red-spot/) · [Vierbild-Mosaik, PIA09243](https://science.nasa.gov/photojournal/full-jupiter-mosaic/)                 | Voyager-1-Aufnahme und Schwarz-Weiß-Mosaik von New Horizons.                                                               |
| Saturn  | [Ansicht von oben, PIA17474](https://science.nasa.gov/photojournal/jewel-of-the-solar-system/) · [Infrarotansichten, PIA08735](https://science.nasa.gov/photojournal/saturns-kaleidoscope-of-color/)                   | Cassini-Mosaik in annähernd natürlichen Farben; vier Ansichten aus unsichtbarem Infrarotlicht mit erklärter Farbzuordnung. |
| Uranus  | [Polansichten, PIA01360](https://science.nasa.gov/photojournal/uranus-toward-the-planets-pole-of-rotation/) · [Sichel, PIA00346](https://science.nasa.gov/photojournal/color-voyager-2-image-showing-crescent-uranus/) | Voyager 2: natürlich wirkende und künstlich gefärbte Ansicht nebeneinander; schmale Sichel beim Vorbeiflug.                |
| Neptun  | [Dunkler Sturm, PIA00052](https://science.nasa.gov/photojournal/neptune-great-dark-spot-in-high-resolution/) · [Neptun und Triton, PIA02215](https://science.nasa.gov/photojournal/crescents-of-neptune-and-triton/)   | Voyager 2: Nahaufnahme des historischen Sturms aus zwei Filtern und Sicheln von Planet und Mond.                           |
| Pluto (Zwergplanet) | [Eisberge, PIA19710](https://science.nasa.gov/photojournal/the-icy-mountains-of-pluto/) · [Gegenlichtansicht, PIA20038](https://science.nasa.gov/photojournal/a-full-view-of-plutos-stunning-crescent/) | New Horizons: Schwarz-Weiß-Nahaufnahme einer Bergkette, vermutlich aus Wassereis; nach dem Vorbeiflug sichtbare Sichel und Dunstschichten in Plutos dünner Lufthülle. |

## Fachquellen der Steckbriefe

Die Texte sind eigene kurze deutsche Formulierungen auf Grundlage der jeweiligen offiziellen NASA-Faktenseiten, Quellenstand 03.10.2026:

- [Merkur](https://science.nasa.gov/mercury/facts/), [Venus](https://science.nasa.gov/venus/venus-facts/), [Erde](https://science.nasa.gov/earth/facts/) und [Mars](https://science.nasa.gov/mars/facts/).
- [Jupiter](https://science.nasa.gov/jupiter/jupiter-facts/), [Saturn](https://science.nasa.gov/saturn/facts/), [Uranus](https://science.nasa.gov/uranus/facts/) und [Neptun](https://science.nasa.gov/neptune/neptune-facts/).

- [Pluto](https://science.nasa.gov/dwarf-planets/pluto/facts/) und [Charon](https://science.nasa.gov/dwarf-planets/pluto/moons/charon/), Quellenstand 04.10.2026: Zwergplanet im Kuipergürtel, kleiner als der Erdmond, fünf Monde, Wassereisberge und Stickstoffeisflächen.
