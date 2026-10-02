# Review zu Issue #108: einladendere Spiele

## Umfang und Reviewart

Separater **Selbstreview durch Codex** am 02.10.2026; keine unabhängige Freigabe. Den vollständigen Diff gegen `main` einschließlich Spielengine, Canvas-Zeichnung, Spielhallenkarten, Natur-Lernspielen, Styles und Tests nach der Umsetzung geprüft.

Vier wählbare Spielhallenspiele erhalten eigene Themenfarben, größere Vorschauen, kurze Ziele und Bedienhinweise. Die Runde bietet einen bewussten Einstieg, einen Fortschrittsbalken, angekündigte Erfolgsmeldungen und einen gestalteten Abschluss. Klötzchen-Kosmos ergänzt Landehilfe und nächsten Stein; Hühner-Rummel merkt, welche der fünf Hühner bereits begrüßt wurden. Natur-Lernspiele zeigen eine Entdeckungsleiste und einen Abschlussstern. Das sind optionale Rundenziele ohne zusätzliche Punkte oder gespeicherte Abzeichen.

## Befunde und Korrekturen

- Im üblichen 1100-Pixel-Fenster waren vier Karten nebeneinander zu schmal. Auf zwei gut lesbare Spalten angepasst; vier Spalten erst ab 1600 Pixeln, eine Spalte unter 760 Pixeln.
- Die ausführlichere Einführung konnte bei 1100 × 651 Pixeln geringfügig über die Spielfläche ragen. Mindesthöhe für die pausierte Szene ergänzt; in schmalen Fenstern ersetzt die Einführung die Grafik und wächst mit ihrem Inhalt. Die nachfolgende Größenprüfung bleibt ohne Überlauf oder abgeschnittenen Einführungsdialog.
- Fortschrittstexte nach dem Rundenende an den tatsächlichen Abschluss angepasst, statt nach bereits erreichtem Ziel weiter zum Sammeln oder zur Portalsuche aufzufordern.
- Dekorative Bewegung folgt der Systemeinstellung und ist pro Runde über „Weniger Bewegung“ umschaltbar. Konfetti, Sternendrift, Wippen, Flügelbewegung und blinkende Figuren werden reduziert; die für die Bedienung nötige Bewegung bleibt. Texte und Fortschritt bleiben sichtbar. Listener und Steuertasten werden beim Verlassen aufgeräumt.
- Landevorschau und Ablegen verwenden dieselbe Kollisionsprüfung. Die Vorschau verändert weder Board noch Zufallsfolge; der nächste Stein wird als Kopie gelesen. Dekorative Effekte sind auf zwölf kurze Partikelwolken begrenzt und verschwinden mit aktiver Spielzeit.

Keine offenen blockierenden Befunde und keine neu entdeckten reproduzierbaren Produktbugs im bisherigen Stand. Die genannten Nachbesserungen betreffen die Umsetzung dieses Issues.

## Punkte, Daten und Fehlerpfade

Keine Änderung an Rust, IPC, Migrationen, Inhalts-IDs, Lehrplaninhalten, Spielpreisen, Bestwert-Speicherung oder Lernpunktebuchungen. Bisherige Trefferwerte, Mehrreihenbonus, Herzen, Rundenenden und bezahlte Legacy-Läuferrunden bleiben erhalten. Freie Naturspiele bleiben ohne Zeitlimit und Lernpunkte. Optionale Ziele beenden keine Runde.

Die bestehenden Prüfungen decken fehlendes Profil/Guthaben, Transportfehler mit identischer Buchungs-ID, kostenlose Wiederaufnahme, Retry der Ergebnisspeicherung, Fokusverlust/Pause, einmaliges Beenden, Pfeiltasten/WASD sowie Pointer-, Tastatur- und barrierefreie Bildschirmaktivierung ab. Kein `eval`, keine neue Abhängigkeit oder externe Ressource.

## Prüfergebnisse

- `npm run check:all`: erfolgreich; 222 Frontend-/Spieltests, 8 Skripttests und 122 Rusttests, außerdem Prettier, TypeScript/Vite, rustfmt und Clippy.
- Nach den letzten UI-/Text- und Testkorrekturen `npm run check` erneut erfolgreich mit denselben 222 + 8 Tests und Build. Rust wurde danach nicht verändert.
- Neue Verhaltensprüfungen: alle sieben gedrehten Steinformen auf unebenem Stapel, unverändernde Landehilfe, Übereinstimmung mit tatsächlichem Ablegen/nächstem Stein, Fortschritt bei Reihen/Sternen/Wellen, verschiedene Hühner ohne Mehrfachfortschritt, unveränderte Spielpunkte/Cooldown, auslaufende Effekte, Startziel, Trefferankündigung und System-/Rundenwahl der reduzierten Bewegung. Bestehender Natur-Ablauf um Fortschrittsprüfung bei falschem Versuch, Abschluss und Reset ergänzt.
- Browserabläufe und Sichtprüfung in lokal installiertem Chromium und WebKit mit ausdrücklich synthetischem Punktekonto: Auswahl, Start, alle vier Spiele, Pause, Abschluss und Rückkehr zur Auswahl; Stoff-Labor samt Abschluss und Pflanzen-Werkstatt im schmalen Fenster. Keine JavaScript-Laufzeitfehler. 420-Pixel-Viewport und Dokumentbreite jeweils 420 Pixel.
- Zusätzliche Einführungsprüfung in beiden Browsern: je 24 Kombinationen aus vier Spielen und 1100 × 651, 1100 × 660, 1024 × 750, 600 × 700, 420 × 700 und 1200 × 350 Pixeln. Kein horizontaler Überlauf; Einführungsdialog jeweils vollständig innerhalb seiner Fläche. Systemeinstellung für reduzierte Bewegung ebenfalls übernommen.
- `git diff --check`: ohne Befund.

## Grenzen

Die Browserprüfung verwendet eine temporäre, synthetische Prüfumgebung und belegt keine native Speicherung. Keine zusätzliche lokale native Startprüfung, keine Prüfung mit Screenreader oder Kindern; native macOS-/Windows-Builds und Checks laufen im PR. Temporäre Prüfseiten werden vor dem Commit entfernt. Die bestehende Vite-Warnung für das größere JavaScript-Bundle bleibt; Build erfolgreich. Die optionale Bewegungsauswahl und die neuen Rundenziele werden nicht über Neustarts gespeichert.
