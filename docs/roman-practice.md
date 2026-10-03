# Zufallsübung für römische Zahlen

Stand: 03.10.2026. Unter Mathematik → Zahlen verstehen → Römische Zahlen bietet „Zufallsübung 1–9999“ beide Umwandlungsrichtungen zusätzlich zur bisherigen kurzen Lernrunde. Die Eingabe erfolgt frei; Enter oder „Antwort prüfen“ prüft die Antwort. „Neue Zufallszahl“ überspringt die aktuelle Aufgabe ohne Punkteabzug. Der unmittelbar vorherige Wert wird auch beim Richtungswechsel ausgeschlossen. Alle drei frei wählbaren Stufen verwenden den gesamten Bereich 1–9999.

## Schreibweise und Hilfe

Die Zeichen I, V, X, L, C, D und M und die sechs Subtraktionspaare IV, IX, XL, XC, CD und CM sind direkt über „Römische Zeichen · kurz erklärt“ erreichbar. Tipps führen zum Zerlegen in Tausender, Hunderter, Zehner und Einer. Nach einer falschen Antwort ist der Lösungsweg freiwillig erreichbar; nach einer richtigen Antwort wird die Zerlegung gezeigt. Es gibt kein Zeitlimit und keinen Punkteabzug für Fehler.

Für 4000–9999 verwendet diese Übung eine ausdrücklich erklärte Erweiterung mit wiederholtem M statt Sonderzeichen oder Überstrichen: 4000 = MMMM, 9999 = MMMMMMMMMCMXCIX. Das ist die festgelegte Trainingskonvention; andere historische Schreibweisen werden hier nicht geübt. Die übrigen Teile verwenden die übliche Subtraktionsschreibweise. Römische Antworten dürfen klein oder groß geschrieben werden und außen Leerzeichen haben. Nichtkanonische Antworten wie IIII statt IV oder IL statt XLIX werden als falsch bewertet. Dezimalantworten verwenden die bestehende exakte Zahlenprüfung; etwa 9999 und 9 999 sind gleichwertig.

## Lehrplanbezug und Fortschritt

Das Angebot ergänzt das vorhandene Unterthema „Römische Zahlen“ (M5 1.1) und dessen Kompetenz `by.math.5.numbers.roman`. Die bestehende Quellenzuordnung zu [LehrplanPLUS Gymnasium Mathematik 5](https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik) bleibt erhalten. Die Erweiterung des Zahlenbereichs ist eine zusätzliche Übung und behauptet keine vollständige Lehrplanabdeckung oder amtliche Freigabe. Eine Verständlichkeitsprüfung mit Kindern wurde nicht durchgeführt.

Rust wählt die Zufallszahl und prüft die eingetippte Antwort. Eine stabile, versionierte Aufgaben-ID enthält Zahl, Richtung und Stufe. Die erstmalige richtige Lösung erhält 1/2/3 Punkte auf Vorschule/Könner/Streber. Spätere Wiederholungen derselben Aufgabe erhalten keine weiteren Punkte; neue Zahlen, andere Richtung oder andere Stufe sind eigene Aufgaben. Das bestehende Antwortjournal verhindert doppelte Buchungen bei erneuter Übertragung und weist widersprüchliche Wiederverwendung einer Request-ID ab. Fortschritt und Punkte werden gemeinsam lokal gespeichert, auch über Neustarts hinweg. Die aktuell angezeigte Zufallsaufgabe und Richtung bleiben nur während der geöffneten Übung erhalten; beim erneuten Öffnen beginnt eine neue Auswahl.

Alle bestehenden festen Aufgaben und Buchungen bleiben unverändert. Es gibt keine neue Datenbankmigration, neue Abhängigkeit oder externe Laufzeitressource. Die Browser-Vorschau ersetzt keine lokale Desktop-Speicherung.
