# Worms: Inselduell

Ab Version 0.6.0 bietet die Spielhalle ein eigenes kleines Worms-Duell gegen ein Computerteam. Zwei Würmer je Team spielen auf einer lokal gezeichneten Insel. Die Gestaltung, Texte, Regeln und Computersteuerung gehören zu Lernwelt; fremde Originalgrafiken oder Spielprogramme werden nicht eingebunden.

## Eine Runde spielen

Eine Runde kostet wie alle Spielhallenspiele **10 Lernpunkte**. Der Eintritt wird vor dem Start lokal gebucht. Eine unterbrochene bezahlte Runde lässt sich nach Verlassen oder Neustart kostenlos von vorn beginnen; die genaue Spielfeldposition wird nicht gespeichert.

1. Starte mit **Losspielen / Weiter**. Dein aktiver Wurm ist sichtbar markiert.
2. Bewege ihn mit den Bildschirmtasten oder **← / →**. Pro Zug stehen höchstens 50 Schritte der internen Spielfeldkoordinaten zur Verfügung.
3. Wähle Schussrichtung, Winkel und Stärke. **↑ / ↓** verändern den Winkel, **W / S** die Stärke. Die Regler funktionieren auch mit ihren eigenen Pfeiltasten.
4. **Leertaste** oder **Schießen** feuert genau ein Geschoss. Die Flugbahn hängt von Winkel, Stärke und angezeigtem Wind ab. Ein Treffer erzeugt einen Krater und kann Würmern Energie nehmen.
5. Nach dem Schuss übernimmt das Computerteam. Die Teams und ihre noch verfügbaren Würmer wechseln sich ab. **Zug auslassen** verzichtet auf deinen Schuss.

Steuertasten wirken nur im fokussierten Spielfeld. **P** oder **Pause** hält die Runde an; beim Verlassen des Spielbereichs, Fensterwechsel oder Ausblenden pausiert sie ebenfalls. **Runde beenden** beendet sie vorzeitig und speichert die bis dahin erzielten Spielpunkte. **Weniger Bewegung** reduziert die dekorativen Effekte; die notwendige Flugbewegung erklärt weiterhin das Ergebnis eines Schusses.

## Energie, Ende und Spielpunkte

Jeder Wurm startet mit 100 Energie. Ist sie aufgebraucht oder fällt ein Wurm ins Wasser, scheidet er aus. Hat nur noch ein Team Würmer, endet das Duell. Spätestens nach **24 Zügen** wird die verbleibende Teamenergie verglichen. Gleich viel Energie ergibt ein Unentschieden. Die Anzeige nennt Sieg, Niederlage, Unentschieden oder einen vorzeitigen Abschluss.

Gegnerischer Energieverlust bringt je Energieeinheit **5 Spielpunkte**, ein ausgeschiedener Computerwurm zusätzlich **100**, ein Sieg zusätzlich **500**. Eigene Treffer bringen keine Punkte. Bestwerte werden nach Abschluss lokal gespeichert. Diese Spielpunkte verändern das Lernpunkte-Guthaben nicht; automatische neue kostenpflichtige Runden gibt es nicht.

## Orientierung und Grenzen

Als Vorbild dient das rundenbasierte Teamspiel auf veränderbarem Gelände, das [Team17 bei Worms W.M.D Mobilize](https://www.team17.com/games/worms-w-m-d-mobilize) beschreibt (geprüft 03.10.2026). Die eigene Umsetzung beschränkt sich auf ein Inselduell mit einem Geschosstyp und einem lokalen Computergegner. Es gibt keine Netzwerksitzung, frei zusammengestellten Teams, importierten Karten, Original-Assets oder vollständige Nachbildung des kommerziellen Spiels. Die Schussvorschau dient der Orientierung; sie ist kein physikalischer Unterrichtsnachweis.

Engine, Canvas-Darstellung, Bedienung und SQLite-Buchung sind getrennt. Die Datenbankmigration erhält bestehende Lern- und Spielstände. [Architektur](architecture.md) · [Unabhängiger Review zu Issue #119](reviews/issue-119.md).
