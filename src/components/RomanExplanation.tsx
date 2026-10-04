import InfoPanel from './InfoPanel';

/** General examples are independent of the current question and its answer. */
export default function RomanExplanation() {
  return (
    <InfoPanel paginate className="roman-explanation">
      <summary>Römische Zahlen verstehen</summary>
      <article>
        <h3>Sieben Zeichen statt Ziffern</h3>
        <p>Jedes römische Zeichen hat einen festen Wert.</p>
        <div className="learning-table">
          <table>
            <caption>Die römischen Zeichen</caption>
            <thead>
              <tr>
                <th scope="col">Zeichen</th>
                <th scope="col">Wert</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['I', '1'],
                ['V', '5'],
                ['X', '10'],
                ['L', '50'],
                ['C', '100'],
                ['D', '500'],
                ['M', '1000'],
              ].map(([sign, value]) => (
                <tr key={sign}>
                  <th scope="row">{sign}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Anders als bei unseren Ziffern hängt der Wert nicht von einer Einer-
          oder Zehnerstelle ab: X bedeutet immer 10.
        </p>
      </article>
      <article>
        <h3>Lesen: Werte zusammenzählen</h3>
        <p>
          Die größeren Zeichen stehen meist zuerst. Lies von links nach rechts
          und zähle die Werte zusammen.
        </p>
        <p>
          <strong>LVII = 50 + 5 + 1 + 1 = 57</strong>
        </p>
        <p>
          Steht ein kleineres Zeichen direkt vor einem größeren, kann es ein
          Abzieh-Paar sein. Welche Paare erlaubt sind, siehst du auf der
          nächsten Seite.
        </p>
      </article>
      <article>
        <h3>Sechs Paare zum Abziehen</h3>
        <p>
          Nur in diesen Paaren ziehst du den kleineren Wert vom größeren ab. Das
          heißt Subtraktion.
        </p>
        <p>
          <strong>
            IV = 4 · IX = 9<br />
            XL = 40 · XC = 90
            <br />
            CD = 400 · CM = 900
          </strong>
        </p>
        <p>
          Behandle jedes Paar wie einen Zahlenteil. Beispiel:{' '}
          <strong>CDLX = 400 + 50 + 10 = 460.</strong>
        </p>
        <p>
          Du darfst nicht beliebig Zeichen abziehen: 49 schreibst du XLIX (40 +
          9), nicht IL.
        </p>
      </article>
      <article>
        <h3>Schreiben: die Zahl zerlegen</h3>
        <ol>
          <li>Zerlege in Tausender, Hunderter, Zehner und Einer.</li>
          <li>Übersetze jeden Teil in römische Zeichen.</li>
          <li>Schreibe die Teile vom größten zum kleinsten hintereinander.</li>
        </ol>
        <p>
          <strong>1986 = 1000 + 900 + 80 + 6</strong>
        </p>
        <p>1000 = M · 900 = CM · 80 = LXXX · 6 = VI</p>
        <p>
          Also: <strong>M + CM + LXXX + VI → MCMLXXXVI</strong>
        </p>
      </article>
      <article>
        <h3>Wiederholen und Lücken lassen</h3>
        <p>
          <strong>I, X und C</strong> stehen höchstens dreimal hintereinander.
          Unter 4000 gilt das auch für <strong>M</strong>. Daher schreiben wir 4
          als IV und nicht als IIII.
        </p>
        <p>
          <strong>V, L und D</strong> wiederholst du nicht. 10 ist X und nicht
          VV.
        </p>
        <p>
          Es gibt <strong>kein römisches Zeichen für die Null</strong>. Ein
          leerer Zahlenteil bleibt einfach weg: 1006 = 1000 + 6 = MVI. Eine
          römische Schreibweise für das Ergebnis 0 gibt es in dieser Übung
          nicht.
        </p>
      </article>
      <article>
        <h3>Rechnen: erst übersetzen</h3>
        <p>
          Zum Rechnen kannst du unsere normalen Zahlen als Hilfe nehmen.
          Beispiel: <strong>XVI + XXVII</strong>
        </p>
        <ol>
          <li>Übersetzen: XVI = 16 und XXVII = 27.</li>
          <li>Rechnen: 16 + 27 = 43.</li>
          <li>
            Zurückübersetzen: 43 = 40 + 3 = XL + III = <strong>XLIII</strong>.
          </li>
        </ol>
        <p>
          Also: <strong>XVI + XXVII = XLIII</strong>. So kannst du auch andere
          Rechnungen lösen. Das klappt hier für ganze Zahlen ab 1. Ergebnisse
          wie 0, −2 oder 4,5 können wir in dieser Übung nicht römisch schreiben.
        </p>
      </article>
      <article>
        <h3>Unsere Übung für 4000–9999</h3>
        <p>
          Für große Zahlen gab es unterschiedliche historische Schreibweisen. In
          Lernwelt verwenden wir ausdrücklich eine{' '}
          <strong>Übungskonvention</strong>: Wir schreiben weitere M statt
          Sonderzeichen oder Überstrichen.
        </p>
        <p>
          <strong>4000 = MMMM · 9000 = MMMMMMMMM</strong>
        </p>
        <p>
          Nur M darf deshalb öfter als dreimal hintereinander stehen. Hunderter,
          Zehner und Einer folgen weiter den Regeln auf den vorigen Seiten.
        </p>
        <p>
          Beispiel:{' '}
          <strong>6008 = 6000 + 8 = MMMMMM + VIII = MMMMMMVIII.</strong>
        </p>
      </article>
    </InfoPanel>
  );
}
