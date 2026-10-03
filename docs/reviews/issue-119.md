# Review zu Issue #119: Worms und Version 0.6.0

## Umfang und Reviewart

Unabhängiger Agentenreview am 03.10.2026 durch `compact_typing`. Der Reviewer hat die kompakte Tastaturhilfe in Issue #118 umgesetzt, aber keinen Worms-, Spielhallen-, Datenbank- oder Versionscode dieses Issues geschrieben. Implementierung und Review von #119 sind personell getrennt.

Geprüft wurde der Gesamtdiff einschließlich neuer Dateien: Worms-Modell und Canvas-Zeichnung, `WormsStage`, Spielkarte/Vorschau, Einbindung in `GameStage`, Typgrenze der bisherigen Spiele, Start-/Ende-Buchung, Migration 018, Datenbanktests, angepasste Migrationserwartungen sowie Versionsfelder, Architektur, README und Releasehinweise. Die Akzeptanzkriterien stammen aus Issue #119. Vorgaben aus `AGENTS.md` und beiden Projektskills wurden berücksichtigt. Nach dem tatsächlichen Merge von #118 wurde der vollständige, auf #119 begrenzte Diff mit 29 Dateien gegen `origin/main` (`4377297a35cea35a0a34dca170b69d0096fd7524`) erneut kontrolliert. Die dort bereits gemergten Änderungen #120 und #121 bleiben erhalten. Worms-Implementierung und Rust-Dateien stimmen mit der zuvor geprüften Fassung überein; Änderungen an der Tastaturhilfe bleiben im getrennten Review #118.

Der unabhängige Review einschließlich der endgültigen Main-Basis, Gesamtprüfungen und nativen Builds ist abgeschlossen. Die getestete Tastatur-CSS stimmt bytegleich mit der übernommenen Fassung überein. Keine offenen blockierenden Befunde; die Implementierung ist für den Pull Request und den Merge bei grünen erforderlichen CI-Prüfungen freigegeben. CI, Merge und veröffentlichte Plattformpakete von #119 sind zu diesem Zeitpunkt noch nicht bestätigt.

## Befunde und Korrekturen

Keine offenen blockierenden technischen Befunde in der geprüften Worms-Implementierung.

Vier kleinere Dokumentationsabweichungen wurden an den koordinierenden Agenten gemeldet, dort korrigiert und vom Reviewer erneut kontrolliert:

- README-Spielhallenübersicht zählte noch vier Spiele. Die neue Auswahl enthält fünf Karten; historische `runner`-Runden bleiben zusätzlich intern spielbar. Die Übersicht nennt jetzt fünf.
- Die Anleitung nannte **Zug überspringen**, während der sichtbare Knopf **Zug auslassen** heißt. Beide nennen jetzt **Zug auslassen**.
- Der Releaseeinstieg beschrieb Aufgabe und Hilfe als nebeneinander. Die finale Tastschreibansicht nutzt eine Vorlage über die ganze Breite und eine gemeinsam sichtbare Hilfe darunter. Der Releaseeinstieg wurde angeglichen.
- Im README-Einstieg stand dieselbe räumliche Beschreibung noch als „neben der Schreibaufgabe“. Dort steht jetzt korrekt „gemeinsam mit der Schreibaufgabe“.

Diese Punkte betreffen die neue, noch unveröffentlichte Dokumentation und sind keine Nebenfixes an einem bestehenden Produktbug. Es wurden vom Reviewer keine Implementierungsdateien verändert.

## Technische Bewertung

- Das eigene Modell begrenzt Bewegung, Schusswerte, Projektilflug, Computerplanung und Aufsetzen. Pro Zug wird nur ein Projektil gestartet. Beide Teams wechseln ihre lebenden Würmer ab; Energieverlust, Wasser, Sieg/Niederlage, Gleichstand und das Ende spätestens nach 24 Zügen passen zu den Regeln. Spielpunkte bleiben ganzzahlig und auf höchstens 1700 begrenzt.
- Animation und React-Bedienung bleiben getrennt. Steuerzeichen wirken auf dem fokussierten Spielfeld; Regler behalten ihre eigene Tastaturbedienung. Pause, Außenfokus, Fensterwechsel und verborgenes Fenster stoppen die Fortschreibung und räumen gehaltene Tasten auf. Das Ende meldet den aktuellen Score genau einmal. Reduzierte Bewegung entfernt dekorative Effekte und erhält den nötigen Schussverlauf.
- Die Vorschau zeichnet einen lokalen Beispielstand, ohne die Engine zu takten oder Eintritt zu buchen. Vorhandene klassische Spiele werden weiter über ihre eigene Engine dargestellt. Zeichnungen, Schrift und Berechnungen benötigen keine Netzressource oder neue Abhängigkeit.
- Rust erlaubt nur die zusätzliche feste Spiel-ID `worms` über die bestehenden Start-/Ende-Commands. Runden-ID, erlaubtes Spiel, Lernprofil, Guthaben, eine offene Runde und Scoregrenzen bleiben unabhängig vom Frontend geprüft. Gleichartige Start- und Endrequests bleiben idempotent; abweichende Wiederholungen werden abgewiesen. Spielpunkte erzeugen keine Lernpunkte.
- Migration 018 läuft in der bereits vorhandenen unmittelbaren Transaktion. Sie kopiert alle Spalten einschließlich Zeitstempeln, behält historische Spiel-IDs und stellt den Index für genau eine offene Runde wieder her. Lerntabellen und Punktejournal werden nicht umgeschrieben. Fehler nach dem Tabellentausch rollen Kopie, Drop und Schemaversion gemeinsam zurück.

## Prüfergebnisse

Eigenständig vom Reviewer ausgeführt:

- Vier gezielte Testdateien (`worms`, `WormsStage`, `ArcadePanel`, bisherige `GameStage`): **63 Tests bestanden**.
- Zusätzliche temporäre Simulation von **128 Duellen** über 64 Start-Seeds mit ausgelassenen oder einfachen Schüssen: alle endeten ohne festhängenden Computer-/Flugzustand. In jedem Schritt waren Koordinaten, Gelände, Energie, Züge und Punkte innerhalb der zulässigen Grenzen; die Flugvorhersage änderte keinen Spielstand. Die längste Simulation benötigte rund 35,54 Sekunden interner Spielzeit.
- Weitere **24 Duelle** über verschiedene Seeds mit gezieltem Zielen gewannen regulär innerhalb von höchstens sieben Zügen. Ein Sieg ist im normalen Regelablauf erreichbar, ohne den Zustand künstlich auf eine Siegkonstellation zu setzen. Das ist eine technische Erreichbarkeitsprüfung, keine Aussage über Schwierigkeit oder Spielbalance für Jugendliche.
- Releaseversionen und Releasehinweise für `v0.6.0` konsistent; nach Ergänzung der bereits getrennt geprüften Umlaufsteuerung und Planetengalerien (#120/#121) erneut kontrolliert. Die Ergänzung verweist auf beide eigenen Reviews. Diff ohne Whitespacefehler.
- Primärquelle [Team17: Worms W.M.D Mobilize](https://www.team17.com/games/worms-w-m-d-mobilize) kontrolliert: rundenbasiertes Wurmteamspiel und zerstörbares Gelände sind korrekt als Orientierung beschrieben. Es werden keine Originalgrafiken, Spielprogramme oder vollständige Nachbildung behauptet.

Vom koordinierenden Agenten ausgeführt, vom Reviewer anhand des Ergebnisses kontrolliert:

- Kombinierte vollständige Frontendprüfung gegen den tatsächlichen Main-Stand einschließlich #118/#120/#121: Formatierung, **315 Frontendtests in 37 Dateien**, **8 Skripttests**, TypeScript und Produktionsbuild grün. Prüflog: `/private/tmp/lernwelt-119-final-check.log`. Die bestehende Größenwarnung für den JS-Hauptblock ist kein Buildfehler; Codeaufteilung gehört nicht zu diesem Issue.
- Rust-Gesamtprüfung: **148 Tests bestanden**, einschließlich Migration von Schema 17, vollständigem Zeilenerhalt, erneutem Öffnen, kostenloser Wiederaufnahme, unveränderten historischen `runner`-Runden, Einmalbuchung, Rollback und ungültigen Eingaben. Prüflog: `/private/tmp/lernwelt-119-rust.log`.
- Browserablauf und Screenshot bei **1100 × 750 Pixeln**: nach Spieler- und Computerzug zeigt Zug 3 den aktiven Wurm Pico, Energieverlust und verformtes Gelände. Teamtexte, Regler, Bewegung, Schussrichtung, Schuss, Pause, Ende und reduzierte Bewegung sind gleichzeitig sichtbar. Der Reviewer hat den gespeicherten Screenshot selbst angesehen. Das ist eine UI-Prüfung mit einer lokalen Vorschau, kein Nachweis nativer Speicherung.
- Browserablauf und Screenshot bei **420 × 800 Pixeln**: Spielfeld und Regler passen in die Seitenbreite; Winkel und Stärke stehen auf getrennten Zeilen. Bewegungs-, Richtungs-, Schuss- und Auslassenknöpfe bleiben lesbar und erreichbar. Der Screenshot wurde vom Reviewer selbst in Originalgröße angesehen; der koordinierende Agent bestätigte Seitenbreite 420 ohne waagerechten Seitenüberlauf, Reglerbreite 231 und mindestens 40 Pixel hohe Knöpfe. Die längere Seite bleibt scrollbar. **P** öffnete die Pause und sperrte die Spielsteuerung; vorzeitiges Beenden führte in der lokalen Vorschau zum Ergebnis 0. Die Vorschau ersetzt keinen Datenbanknachweis.
- Native macOS-App **0.6.0** auf Main-Basis `4377297` mit finaler Tastatur-CSS und #120/#121 erfolgreich gebaut und frisch gestartet; der Reviewer kontrollierte das finale Buildlog mit **17,57 Sekunden** Rust-Builddauer. Der koordinierende Agent bestätigte Bundleversion 0.6.0 sowie korrekt geladenes Profil und bisherigen Lernfortschritt. Ein parallel gestarteter früherer Build konkurrierte mit dem Frontendbuild um `dist`; die abschließenden nativen Builds wurden allein ausgeführt und waren erfolgreich. Beim tatsächlichen SQLite-Übergang **17 → 18** hatte der koordinierende Agent sämtliche Tabellenzeilen vor/nach dem Start verglichen: unverändert, nur Schemaversion 18. Die seither unveränderte Worms-/Rust-Fassung wurde erneut abgeglichen. Die stabile native Spielhallenaufnahme wurde vom Reviewer in Originalgröße kontrolliert: Worms-Karte mit Ziel und Steuerung, Bestwert 0, gesperrtem Eintritt für 10 sowie ein vorhandener Bestwert eines bisherigen Spiels sind sichtbar. Der obere Vorschaurand liegt wegen der Scrollposition oberhalb des Fensters; Kartentitel und Bedienung sind vollständig lesbar. Der koordinierende Agent bestätigte das tatsächliche Guthaben 9. Es wurde keine native Runde bezahlt und kein Guthaben für den Test geändert; der spielbare Regelablauf wurde über Modelltests und Browserprüfung abgesichert.
- Die nachgebesserte Tastaturhilfe wurde in der nativen **1100 × 750**-Fensteraufnahme vom Reviewer in Originalgröße kontrolliert: vollständige Tastatur, Hände, Haltungshinweise und unterer Kartenrand sind sichtbar. Der zusätzliche Platzbedarf der Fenstertitelleiste ist berücksichtigt; ergänzend meldete die Browsermessung bei **1100 × 718** die Hilfekante bei 675,1 Pixeln und Scrollposition 0. Der erneute native Build mit dieser CSS-Fassung war erfolgreich. Die Korrektur und ihre unabhängige Freigabe gehören zu #118 und ändern keinen Worms-Code.

## Freigabe und Grenzen

Die endgültige Diffbasis nach dem tatsächlichen Merge von #118 ist kontrolliert. Der Reviewer bestätigte erneut identische SHA-256-Werte der getesteten Tastatur-CSS im Hauptworkspace und im kombinierten Checkout. Die stabile native Spielhallenaufnahme bestätigt den berichteten Startcheck visuell. Gesamtprüfungen, Releaseversionen und abschließender nativer Build nach Einbezug von #121 sind grün. **Unabhängige Freigabe erteilt; keine offenen Reviewbefunde.** Erforderliche CI-Prüfungen müssen vor dem Merge erfolgreich sein.

Bezahlte unterbrochene Runden starten wie bei den vorhandenen Spielen kostenlos von vorn; Wurmpositionen und laufende Züge werden nicht gespeichert. Der lokale Bestwert ist keine manipulationssichere Währung. Das Spiel besitzt einen Geschosstyp und eine begrenzte Computerlogik, keine Netzwerksitzung, Original-Assets oder frei zusammengestellten Teams. Eine Spielbalance- oder Verständlichkeitsprüfung mit Jugendlichen wurde nicht durchgeführt. Paketprüfung, CI und Veröffentlichung werden erst nach ihrem tatsächlichen Erfolg bestätigt.
