# Review zu Issue #116: Handhaltung in der Tastaturhilfe

## Umfang und Reviewart

Separater unabhängiger Agentenreview durch Codex-Agent `hands_review` am 03.10.2026. Der Reviewer hat keinen Produktionscode dieses Issues implementiert und ausschließlich diese Reviewdatei geschrieben. Grundlage sind AGENTS.md, beide Projektskills, README, Architektur und die Akzeptanzkriterien von [Issue #116](https://github.com/dr-dimitri/lernwelt/issues/116).

Geprüft wurde der vollständige Diff von `codex/issue-116-handhilfe` gegen `origin/main` (`d539b05c8606ae2912eb0560630a780d5876a591`), einschließlich der neuen Dateien `TypingHands.tsx`, `TypingHands.test.tsx`, `docs/typing-hands.md` und `docs/releases/0.5.2.md`: gemeinsame Fingerzuordnung, beide Handgrafiken und Seitenansicht, Integration in die vorhandene Tastaturhilfe, Texte, CSS, bestehende und ergänzte Oberflächentests sowie sämtliche Versionseinträge für 0.5.2.

## Befunde

Im unabhängigen Quell-, Inhalts-, Regressionstest- und visuellen Review wurden keine blockierenden Befunde gefunden. Die Akzeptanzkriterien sind erfüllt; Nachbesserungen waren nicht erforderlich.

## Fingerzuordnung, Haltung und Zugänglichkeit

Die eigene Kontur besitzt pro Hand fünf unterscheidbare Finger. Die linke Hand liegt links, die rechte rechts; Daumen zeigen nach innen. Die Grundtasten sind aus der Perspektive der tippenden Person angeordnet: links kleiner Finger A, Ringfinger S, Mittelfinger D, Zeigefinger F; rechts Zeigefinger J, Mittelfinger K, Ringfinger L, kleiner Finger Ö. Die gespiegelte rechte Kontur spiegelt ihre Textbeschriftungen wieder zurück, sodass diese normal lesbar bleiben. Die Daumen weisen auf die gemeinsame Leertaste.

Die identischen fachlichen Fingerkennungen aus `src/domain/typing.ts` versorgen Tastaturhinweis, aktive Handmarkierung, Grundtasten und gegenüberliegenden kleinen Finger für Shift. Großbuchstaben und die vorhandenen unterstützten Shift-Satzzeichen zeigen beide beteiligten Finger. Bei Leerzeichen sind beide Daumen ausdrücklich Wahlmöglichkeiten, keine Aufforderung, gleichzeitig beide zu drücken. Eine abgeschlossene oder bestätigt richtige Zeile und unbekannte Zeichen markieren keinen vermeintlich aktiven Finger. Bei überschüssigen Zeichen bleiben die Hände in Grundstellung; der bestehende Rücktastenhinweis ist weiter sichtbar.

Grundstellung und aktuelle Aktion erscheinen als sichtbarer deutscher Text, außerdem als SVG-Titel/-Beschreibung. Aktive Finger besitzen neben Farbe einen stärkeren Umriss und eine zusätzliche Markierung; Shift erhält eine Beschriftung, die Daumenwahl gestrichelte Umrisse. Die Zeichnungen sind keine interaktiven Bildschirmtasten. Die bestehende Tastaturregion bleibt per Tab erreichbar. Ein- und Ausblenden verändert weder Antwort noch Fortschritt.

Die Quellen wurden vom Reviewer selbst geöffnet und mit den Texten abgeglichen: TIPP10 nennt die deutsche ASDF/JKLÖ-Grundstellung, F/J-Erhebungen, Daumen und gegenüberliegendes Shift; OSHA beschreibt gerade Handgelenke in Unterarmlinie, entspannte Schultern und frei bewegliche Hände beim Tippen. Typing.com und Perkins ergänzen bequem gekrümmte Finger. Die deutsche Zuordnung stammt aus TIPP10, nicht aus den englischen QWERTY-Beispielen. Die kurze Seitenansicht und Hinweise bleiben schematische Orientierung. Weder Haltungsmessung noch medizinische Wirkung oder eine Prüfung mit Jugendlichen wird behauptet. Quellen und Prüfdatum sind in `docs/typing-hands.md` nachvollziehbar dokumentiert.

## Datenhaltung, Offlinebetrieb und Fehlerpfade

Der Gesamtdiff verändert keine Inhaltsbank, Aufgabenkennung, Zielzeile, Migration, Rustfunktion, IPC-Typen, Commandregistrierung, Berechtigungen, CSP oder Datenbank. Die Cargo-Dateien und Tauri-Konfiguration ändern ausschließlich die Version. Beide Lockdateien behalten ihre Abhängigkeiten. SVG und CSS sind lokal; es werden weder neue Bibliotheken noch entfernte Bilder, Schriften oder Dienste eingeführt.

Die bestehenden Abläufe für bewusstes Prüfen, Fehlerkorrektur, zulässige Eingaben, Kompositionsschutz, Punkte und freie Stations-/Stufenwahl bleiben erhalten. Bei einem unklaren Speicherfehler bleibt derselbe Request mit derselben Nutzlast für den Retry gebunden; das Einblenden der Hilfe startet keine Übertragung. Veraltete Antworten nach Neuabruf, Profiländerung oder Verlassen der Ansicht werden weiterhin verworfen. Die neue Komponente erhält ausschließlich den bereits errechneten Hilfezustand und schreibt keine Daten.

## Tatsächlich ausgeführte Prüfungen

Vom unabhängigen Reviewer selbst ausgeführt:

- `npx vitest run src/components/TypingHands.test.tsx src/components/TypingPanel.test.tsx src/domain/typing.test.ts src/App.test.tsx src/lib/desktop.test.ts`: **42 Tests in fünf Dateien erfolgreich**. Geprüft werden linke/rechte Finger und beide Shift-Richtungen, Daumenwahl, unbekannte Zeichen, neutrale vollständige/bestätigte Zeilen, zusätzliche Zeichen und Rücktaste, Ein-/Ausblenden bei erhaltener Eingabe sowie die bestehenden Übungs-, Fokus-, Fehler-, Retry-, Stufen-, Profil-, Unmount- und Kompositionspfade.
- Unabhängiger temporärer Prüfcode mit festen deutschen QWERTZ-Erwartungen: Grundtasten, zehn eindeutige Fingerkennungen, Zeichenzuordnung und gegenüberliegendes Shift geprüft. Alle **108 tatsächlichen Aufgaben** und ihre **46 verwendeten Zeichen** besitzen eine passende Fingerhilfe. Die Erwartungen wurden nicht aus dem zu prüfenden Modell erzeugt. Der temporäre Code ist kein Produktbestandteil.
- `GITHUB_REF_NAME=v0.5.2 node scripts/check-release-version.mjs`: erfolgreich; alle Versionseinträge und die Releasehinweise sind konsistent.
- `git diff --check`: erfolgreich.
- Beide tatsächlichen Browser-Screenshots der finalen App-Komponenten in Originalauflösung selbst angesehen: **1100 × 750** und **420 × 750**. Die aktive D-Taste und der linke Mittelfinger sowie gegenüberliegendes rechtes Shift mit dem rechten kleinen Finger sind übereinstimmend markiert. Beide Hände besitzen erkennbare fünf Finger, innenliegende Daumen, lesbare Grundtasten und passende Seitenbezeichnungen. Grundstellung, aktuelle Aktion und Haltungsbeschreibung sind sichtbar; im schmalen Fenster bricht der Text vollständig um. Die Hilfe ist frei nach unten scrollbar. Der seitliche Scrollbereich der Tastatur ist getrennt; die Handdarstellung passt ins Fenster.
- Gesamtprüfprotokolle des ausführenden Agenten gelesen: `npm run check` mit **262 Frontendtests in 32 Dateien**, **acht Skripttests**, Formatprüfung, TypeScript und Produktionsbuild erfolgreich; `npm run check:rust` mit Rustformatierung, Clippy ohne Warnungen und **145 Rusttests erfolgreich**. Diese Gesamtprüfungen wurden nicht vom Reviewer gestartet. Die bestehende Vite-Warnung zu einem JavaScript-Bundle über 500 kB ist weiterhin vorhanden, kein blockierender Buildfehler.
- Nativen macOS-Buildlog gelesen: optimierte Releasekompilierung und Bündelung von `Lernwelt.app` erfolgreich. Die tatsächlich erzeugte `Info.plist` selbst geprüft: **CFBundleVersion und CFBundleShortVersionString 0.5.2**, Produktionskennung **de.lernwelt.desktop**. Der native Build wurde vom ausführenden Agenten gestartet; der lokale temporäre Override deaktiviert ausschließlich Updaterartefakte, nicht die produktive Repository-Konfiguration.

Vom ausführenden Agenten zusätzlich gemeldet, nicht vom Reviewer selbst im Browser bedient:

- Die Browseransicht verwendet die echten App-Komponenten und echte Inhalte, jedoch eine temporäre simulierte Desktop-Schnittstelle. Bei 420 Pixeln Breite sind Seiten- und Fensterbreite beide 420, ohne Seitenüberlauf. Der Reviewer prüfte die Screenshots selbst, nicht die DOM-Abmessungen.
- Leertastenhilfe visuell geprüft: beide Daumen besitzen gestrichelte Wahlmarkierungen; der Text verlangt ausdrücklich nur einen Daumen. Die Wahlzustände wurden zusätzlich vom unabhängigen Reviewer per Komponentenprüfung bestätigt, ein gesondertes Daumenwahl-Bild wurde vom Reviewer nicht angesehen.
- Neu gebautes `Lernwelt.app` über den absoluten Bundlepfad nativ geöffnet: Die echte `tauri://localhost`-Ansicht startete und las vorhandene lokale Daten. Tastschreiben und eingeblendete Tastaturhilfe zeigten beide Hände, die aktive F-Markierung, Grundstellung, Seitenansicht und Hinweise ohne Ladefehler. Dabei wurden keine Antworten abgeschickt oder Punkte verändert. Dieser native Bedienungsnachweis wurde vom ausführenden Agenten gemeldet, nicht vom Reviewer selbst durchgeführt.

## Grenzen und Abschlussstatus

Komponententests verwenden jsdom und simulierte Desktop-Ergebnisse. Die visuell geprüfte Browseransicht verwendet echte App-Komponenten, jedoch simulierte Desktop-Ergebnisse und ersetzt keine native Speicherprüfung. Der Reviewer führte keinen eigenen nativen Start-, Installer-, Windows-, Screenreader- oder Gerätetest durch. Der ausführende Agent ergänzte einen lokalen nativen Produktionsbuild und den beschriebenen nativen Start-/Hilfenachweis, jedoch keine neue Antwort-/Speicherprüfung für dieses reine Frontend-Issue. Die Fingerzuordnung ist eine Lernhilfe; die App kann tatsächliche Fingerbewegung und Haltung nicht erkennen. Andere Tastaturlayouts oder besondere körperliche Anforderungen werden nicht automatisch erkannt. Tests mit Jugendlichen und ein pädagogischer Wirksamkeitsnachweis liegen nicht vor.

**Review abgeschlossen:** Quell-, Inhalts-, Regressionstest- und visuelle Prüfung sowie die lokalen Gesamt-/Buildnachweise sind erfolgreich. Keine offenen blockierenden Befunde. Freigabe für den anschließenden PR- und Mergeablauf bei grünen erforderlichen CI-Checks; das Issue gilt erst nach Merge als abgeschlossen. Plattformübergreifende CI, signierte Updatepakete, Installer und Veröffentlichung gehören zum anschließenden Ablauf und werden durch diesen Review noch nicht als erledigt behauptet.
