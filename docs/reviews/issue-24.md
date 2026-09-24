# Review · Issue #24

Separater Selbstreview durch Codex am 24.09.2026 gegen main 677fd28. Keine unabhängige Freigabe.

## Umfang und Befunde

15 neue Aufgaben in drei Stufen, vier Tätigkeiten und eine Flächeneinheitentafel behandeln Übergänge von km² über ha/a bis mm², Kommaschreibweise sowie Näherungen unregelmäßiger Flächen mit Rechtecken (M5 4.2/2–3).

Im Review alle Faktoren geprüft: zwischen benachbarten Flächengruppen jeweils 100. Herleitung aus 10×10 Einheitsquadraten einschließlich ha/a und km². Tafelzeilen ergeben 2,35 m², 12 500 m² und 350 mm². Die Kreis-/Blatt-/Wiesenform wird nicht als exaktes Rechteck ausgegeben: Modellfläche, Näherungswert und untere/obere Grenze sind unterschieden. Streifen überlappen nicht; Randkästchen werden nur einmal gezählt. Offene Modelle haben Prüfkriterien, keine fest vorgegebene echte Fläche. Keine blockierenden Befunde.

## Prüfungen und Abhängigkeit

`npm run check:all`: 43 Tests und Format/Typen/Build/rustfmt/Clippy erfolgreich. Alle 323 bestehenden Aufgaben und fremden Themen unverändert. Neue IDs/Antworten/Metadaten und Tabellenbreite geprüft. Tafelwerte separat umgerechnet. `git diff --check` bestanden.

Die HTML-Tabellendarstellung kommt aus #23/PR #30. Dieses Issue erst danach mergen; bis dahin erklärt bereits der Flächen-Lektionstext die Tafel und ihre Beispiele. Die native Prüfung der zusammengeführten Flächentafel sowie die neuen übergreifenden Tests erfolgen in #17. Keine Persistenz- oder Punkteänderung.

## Grenzen

Näherungswerte hängen von Modell und Raster ab. Offene Zeichnungen werden durch Selbstkontrolle überprüft, nicht automatisch benotet. Keine pädagogische Erprobung behauptet. GitHub-Checks vor Merge abwarten.
