"""Authoring tool: finite, deterministic exercise bank. Not run by the app.
Published v1 IDs and meanings must not be changed; use a new version for changes.
"""
import json
from decimal import Decimal
from pathlib import Path
ROOT=Path.cwd()
def fmt(n):
 s=format(Decimal(str(n)),'f').rstrip('0').rstrip('.') if '.' in str(n) else str(n)
 return s.replace('.',',')
def numeric(p,a,h,e,h2):
 return dict(prompt=p,answer=fmt(a),hint=h,explanation=e,furtherHints=[h2],options=[],answerKind='number',unit='Schreibe nur die Zahl; die Einheit steht in der Frage.')
def choice(p,a,w1,w2,h,e,h2):
 return dict(prompt=p,answer=a,hint=h,explanation=e,furtherHints=[h2],options=[a,w1,w2],answerKind='choice',unit=None)
def roman(n):
 out=''
 for value,sign in [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]:
  while n>=value:out+=sign;n-=value
 return out

def math_task(key,k,l):
 n=k+1+12*l; a=n+3; b=k%7+2; D=Decimal
 if key=='sets':
  values=[n,n+2,n+4,n+6]; present=k%2==0; x=values[1] if present else n+1; notation='{'+ '; '.join(map(str,values))+'}'
  if k%3==0:return numeric(f'A = {notation}. Wie viele verschiedene Zahlen gehören zu A?',4,'Jede Zahl wird einmal gezählt.',f'Die Menge enthält die vier Zahlen {", ".join(map(str,values))}.','Markiere jede aufgeführte Zahl genau einmal.')
  return choice(f'A = {notation}. Welches Zeichen passt: {x} ___ A?\n∈ heißt „gehört dazu“, ∉ heißt „gehört nicht dazu“.','∈' if present else '∉','∉' if present else '∈','=', 'Suche die Zahl in der Menge.',f'{x} steht '+('in' if present else 'nicht in')+' der Liste. Deshalb passt '+('∈.' if present else '∉.'),'Vergleiche die gesuchte Zahl mit jedem Element.')
 if key=='place-value':
  value=(n+2)*10000+(k+1)*101; place=[1,10,100,1000][k%4];digit=value//place%10
  return numeric(f'Die Zahl lautet {value}. Wie viel ist die Ziffer an der {dict([(1,"Einer"),(10,"Zehner"),(100,"Hunderter"),(1000,"Tausender")])[place]}stelle wert?',digit*place,'Lies die Stellen von rechts: Einer, Zehner, Hunderter, Tausender.',f'An dieser Stelle steht {digit}. Ihr Wert ist {digit} × {place} = {digit*place}.','Schreibe die Zahl in eine Stellenwerttafel. Die Stelle entscheidet über den Wert.')
 if key=='roman':
  value=[4,9,14,19,24,29,34,39,44,49,54,59][k]+60*l
  return numeric(f'Welche Zahl bedeutet die römische Schreibweise {roman(value)}?',value,'I = 1, V = 5, X = 10, L = 50 und C = 100. Eine kleinere Zahl davor wird abgezogen.',f'{roman(value)} bedeutet {value}. Zum Beispiel ist IX = 10 − 1 und XL = 50 − 10.','Zerlege die Zeichen in Gruppen wie IX oder XL; addiere dann die Gruppenwerte.')
 if key=='rounding':
  place=10**(l+1); value=(n+10)*place+(k*73+53)%place;answer=((value+place//2)//place)*place
  return numeric(f'Runde {value} auf {place}er.',answer,'Schau auf die erste Ziffer rechts von der Rundungsstelle. Ab 5 rundest du auf.',f'{value} liegt '+('unter' if value%place<place//2 else 'ab')+f' der Mitte zur nächsten {place}er-Zahl. Gerundet ergibt sich {answer}.',f'Die Nachbarwerte sind {value//place*place} und {(value//place+1)*place}.')
 if key=='integers':
  x=-a;y=b+l
  if k%2:return numeric(f'Der Betrag ist der Abstand zur 0. Wie groß ist der Betrag von {x}?',a,'Ein Abstand ist niemals negativ.',f'{x} liegt {a} Schritte von 0 entfernt. Der Betrag ist {a}.','Zähle die Schritte von der Zahl bis zur 0, ohne ein Vorzeichen mitzunehmen.')
  return numeric(f'Welche ganze Zahl liegt genau {y} Schritte rechts von {x}?',x+y,'Nach rechts werden die Zahlen größer.',f'Du rechnest {x} + {y} = {x+y}.','Starte bei der negativen Zahl und gehe die Schritte nacheinander nach rechts.')
 if key=='written-add':
  x=(n+2)*107+(10**(l+2));y=(k+3)*89
  minus=k%2==1;ans=x-y if minus else x+y;sign='−' if minus else '+'
  return numeric(f'Rechne schriftlich: {x} {sign} {y}.',ans,'Schreibe Einer unter Einer, Zehner unter Zehner und Hunderter unter Hunderter.',f'{x} {sign} {y} = {ans}. Die Probe mit der Umkehraufgabe bestätigt das Ergebnis.','Beginne rechts bei den Einern. Überträge oder Tauschen gehören zur nächsten Stelle.')
 if key=='signed-add':
  x=-a;y=b*(l+1);minus=k%2==1;ans=x-y if minus else x+y
  return numeric(f'Ein Kontostand beträgt {x} €. '+(f'Es werden {y} € abgebucht.' if minus else f'Es kommen {y} € dazu.')+' Wie groß ist der neue Kontostand in Euro?',ans,'Geld dazu heißt plus, Geld weg heißt minus.',f'{x} '+('−' if minus else '+')+f' {y} = {ans}. Ein negativer Stand bedeutet Schulden.','Zeichne eine Zahlengerade. Eine Abbuchung führt nach links, eine Einzahlung nach rechts.')
 if key=='add-equations':
  x=a;c=b+2;result=x+c if k%2==0 else c-x;expr=f'x + {c} = {result}' if k%2==0 else f'{c} − x = {result}'
  return numeric(f'Welche Zahl passt für x?\n{expr}.',x,'Nutze eine Umkehraufgabe und setze dein Ergebnis zur Probe ein.',f'x = {x}. Eingesetzt stimmt die Gleichung: '+(f'{x} + {c} = {result}.' if k%2==0 else f'{c} − {x} = {result}.'),'Bei a − x = b gilt x = a − b. Bei x + a = b gilt x = b − a.')
 if key=='add-strategy':
  x=100*(l+1)-a;y=a;z=b*7
  return numeric(f'Rechne geschickt: {x} + {z} + {y}.',x+y+z,'Du darfst Summanden vertauschen und zusammenfassen.',f'Fasse {x} und {y} zusammen: {x+y}. Dann kommt {z} dazu: {x+y+z}.','Suche zuerst zwei Zahlen, die zusammen einen vollen Hunderter ergeben.')
 if key=='coordinates':
  x=a;y=b+1;delta=k+2
  return numeric(f'A({x}; {y}) und B({x+delta}; {y}) liegen auf gleicher Höhe. Wie lang ist AB in Kästchen?',delta,'Bei gleicher Höhe verläuft die Strecke waagerecht.',f'Die x-Werte unterscheiden sich um {x+delta} − {x} = {delta}. AB ist {delta} Kästchen lang.','Vergleiche nur die erste Koordinate. Die zweite ist bei beiden Punkten gleich.')
 if key=='lines':
  height=-b if l else b;p=height+a
  return numeric(f'Eine waagerechte Gerade liegt auf Höhe {height}. P liegt bei ({k+1}; {p}). Wie groß ist der Abstand in Kästchen?',a,'Der kürzeste Abstand steht senkrecht auf der Geraden.',f'Der senkrechte Weg hat die Länge {p} − ({height}) = {a}.','Vergleiche die Höhen des Punktes und der Geraden; die waagerechte Position ist hier unwichtig.')
 if key=='circles':
  r=a;dist=[r-1,r,r+1][k%3];ans=[2,1,0][k%3]
  return numeric(f'Ein Kreis hat Radius {r} cm. Eine Gerade ist {dist} cm vom Mittelpunkt entfernt. Wie viele gemeinsame Punkte haben Gerade und Kreislinie?',ans,'Vergleiche den Abstand der Geraden mit dem Radius.',f'Der Abstand ist '+('kleiner als' if dist<r else 'gleich' if dist==r else 'größer als')+f' der Radius. Deshalb gibt es {ans} gemeinsame Punkte.','Kleiner: zwei Schnittpunkte. Gleich: Berührung. Größer: kein gemeinsamer Punkt.')
 if key=='angles':
  total=90 if l==0 else 180 if l==1 else 360;known=(k+1)*(5 if l==0 else 11 if l==1 else 17);ans=total-known
  return numeric(f'Zwei Winkel ergeben zusammen {total}°. Einer misst {known}°. Wie viele Grad misst der andere?',ans,'Ziehe den bekannten Winkel von der Gesamtgröße ab.',f'{total}° − {known}° = {ans}°.','Ein rechter Winkel hat 90°, ein gestreckter 180° und ein voller 360°.')
 if key=='quadrilaterals':
  rows=[('vier gleich lange Seiten und vier rechte Winkel','Quadrat','Dreieck','Kreis'),('vier rechte Winkel; gegenüberliegende Seiten sind gleich lang','Rechteck','Dreieck','Kreis'),('zwei Paare paralleler gegenüberliegender Seiten','Parallelogramm','Kreis','Dreieck'),('vier gleich lange Seiten, aber keinen rechten Winkel','Raute','Rechteck','Kreis')];prop,ans,w1,w2=rows[k%4]
  return choice(f'Figur {n} hat {prop}. Welche Beschreibung passt?',ans,w1,w2,'Prüfe Seiten und Winkel getrennt.',f'Eine Figur mit {prop} passt zur Beschreibung {ans}.','Die Lage auf dem Blatt ändert die Eigenschaften der Figur nicht.')
 if key=='written-multiply':
  x=(n+2)*(7 if l==0 else 23);y=b if l==0 else b*11;ans=x*y
  return numeric(f'Rechne schriftlich: {x} × {y}.',ans,'Zerlege den zweiten Faktor nach seinen Stellenwerten.',f'{x} × {y} = {ans}. Die Teilprodukte werden passend zu ihren Stellen addiert.','Bei einer Zehnerziffer steht das Teilprodukt eine Stelle weiter links als bei einer Einerziffer.')
 if key=='written-divide':
  divisor=b if l==0 else b*3;quotient=n+12 if l==0 else 100+n;dividend=divisor*quotient
  return numeric(f'Rechne schriftlich: {dividend} : {divisor}.',quotient,'Teile von links. Wenn eine Stelle zu klein ist, gehört dort eine 0 ins Ergebnis.',f'{dividend} : {divisor} = {quotient}. Probe: {quotient} × {divisor} = {dividend}.','Nach jedem Teilschritt holst du die nächste Ziffer herunter. Keine Stelle auslassen.')
 if key=='primes':
  p=[2,3,5,7][k%4];q=[3,5,7][k//4];ans=p*q
  return numeric(f'Eine Zahl hat genau die Primfaktoren {p} und {q}. Welche Zahl ist das?',ans,'Primfaktoren werden miteinander multipliziert.',f'{p} × {q} = {ans}. Beide Faktoren sind Primzahlen, also nur durch 1 und sich selbst teilbar.','Ein Faktor ist ein Baustein einer Malrechnung; addiere die Bausteine hier nicht.')
 if key=='counting':
  if k%3==2:
   return numeric(f'Für {a} Eisportionen gibt es jeweils {b} erlaubte Soßen. Nur für eine zusätzliche Sorte gibt es genau eine Soße. Wie viele Kombinationen gibt es?',a*b+1,'Zähle die erlaubten Möglichkeiten für jede Sorte.',f'{a} × {b} + 1 = {a*b+1}. Die zusätzliche Sorte hat nur eine erlaubte Soße.','Das Produkt zählt die gleich verzweigten Sorten; die Ausnahme zählst du getrennt.')
  return numeric(f'Du wählst eine von {a} Brotsorten und einen von {b} Belägen. Jede Kombination ist erlaubt. Wie viele Möglichkeiten gibt es?',a*b,'Für jedes Brot gibt es alle Beläge.',f'{a} × {b} = {a*b} Möglichkeiten.','Zeichne pro Brotsorte einen Ast mit allen Belägen.')
 if key=='signed-multiply':
  x=-a;y=-b if k%2 else b;ans=x*y
  return numeric(f'Berechne ({x}) × ({y}).',ans,'Gleiche Vorzeichen ergeben plus, unterschiedliche minus.',f'{x} × {y} = {ans}. Rechne zuerst {a} × {b}, dann bestimme das Vorzeichen.','Zähle die negativen Faktoren: bei zwei ist das Ergebnis positiv, bei einem negativ.')
 if key=='powers':
  base=2+k//4 if l==0 else 3+k//4 if l==1 else -(2+k//4);exp=k%4+2;ans=base**exp
  return numeric(f'Berechne ({base}) hoch {exp}.',ans,'Eine Potenz bedeutet: den gleichen Faktor mehrfach malnehmen.',f'({base}) hoch {exp} = '+ ' × '.join(f'({base})' for _ in range(exp))+f' = {ans}.','Der Exponent sagt, wie oft der Faktor vorkommt; er wird nicht mit der Basis multipliziert.')
 if key=='multiply-equations':
  x=a;factor=-b if l==2 else b;result=x*factor
  return numeric(f'Welche Zahl passt für x?\nx × ({factor}) = {result}.',x,'Teile das Ergebnis durch den bekannten Faktor.',f'x = {result} : ({factor}) = {x}. Probe: {x} × ({factor}) = {result}.','Malnehmen und Teilen sind hier Umkehraufgaben. Der bekannte Faktor ist nicht 0.')
 if key=='order':
  ans=(a+b)*3-b;expr=f'({a} + {b}) × 3 − {b}'
  return numeric(f'Berechne den Term: {expr}.',ans,'Zuerst Klammern, dann Mal oder Geteilt, dann Plus oder Minus.',f'Klammer: {a+b}. Mal 3: {(a+b)*3}. Minus {b}: {ans}.','Schreibe in jedem Rechenschritt den übrigen Term mit auf.')
 if key=='laws':
  factor=a;num=99 if l==0 else 98 if l==1 else 102;ans=factor*num
  return numeric(f'Rechne mit dem Verteilungsgesetz: {factor} × {num}.',ans,'Beim Verteilungsgesetz verteilst du einen Faktor auf eine Summe oder Differenz.',f'{factor} × {num} = {factor} × 100 '+('−' if num<100 else '+')+f' {factor} × {abs(num-100)} = {ans}.','Zerlege den zweiten Faktor in 100 und den kleinen Abstand dazu.')
 if key=='term-structure':
  if k%2:return choice(f'Wie beschreibst du {a} − ({b} × {n})?','Differenz aus einer Zahl und einem Produkt','Produkt aus einer Zahl und einer Differenz','Summe aus drei Zahlen','Die zuletzt auszuführende Rechenart bestimmt den ganzen Term.',f'Zuerst wird {b} × {n} gerechnet. Dieses Produkt wird von {a} abgezogen: eine Differenz.','Der Teil in der Klammer ist ein Produkt; außen steht minus.')
  return choice(f'Wie beschreibst du ({a} + {b}) × {n}?','Produkt aus einer Summe und einer Zahl','Summe aus einer Zahl und einem Produkt','Quotient aus zwei Zahlen','Die Hauptrechenart steht außerhalb der Klammer.',f'Die Summe {a} + {b} wird mit {n} multipliziert. Der gesamte Term ist ein Produkt.','Die Klammer bildet eine Summe; diese Summe ist ein Faktor der Malrechnung.')
 if key=='reverse':
  result=a*b+n
  return numeric(f'Du denkst dir eine Zahl, nimmst sie mal {b} und addierst {n}. Das Ergebnis ist {result}. Welche Zahl war es?',a,'Gehe die Schritte in umgekehrter Reihenfolge rückwärts.',f'({result} − {n}) : {b} = {a}.','Zuerst machst du die letzte Addition rückgängig, danach die Multiplikation.')
 if key=='stories':
  cost=a*b+n
  return numeric(f'Eine Klasse kauft {a} Hefte für jeweils {b} €. Eine Mappe kostet zusätzlich {n} €. Wie viele Euro kostet alles zusammen?',cost,'Rechne erst die Kosten für alle Hefte, dann die Mappe dazu.',f'{a} × {b} € + {n} € = {cost} €.','Für jedes Heft fällt derselbe Preis an. Die Mappe kommt nur einmal dazu.')
 if key=='money':
  cents=(n+1)*105+(k%3)*7
  return numeric(f'Wie viele Euro sind {cents} ct?',D(cents)/100,'100 Cent sind 1 Euro.',f'{cents} ct : 100 = {fmt(D(cents)/100)} €.','Zwei Centstellen gehören hinter das Komma; fehlende Stellen werden mit 0 aufgefüllt.')
 if key=='length':
  src,target,factor=[('m','cm',100),('km','m',1000),('dm','cm',10),('cm','mm',10)][k%4]
  amount=D(n+2)/10 if l else D(n+2);ans=amount*factor
  if l==2 and k%3==1:
   return numeric(f'Ein Band ist {fmt(amount)} {src} lang. Du schneidest {b} {target} ab. Wie viele {target} bleiben?',ans-b,'Rechne zuerst beide Längen in dieselbe Einheit um.',f'{fmt(amount)} {src} = {fmt(ans)} {target}. Danach: {fmt(ans)} − {b} = {fmt(ans-b)} {target}.',f'Von {src} nach {target} rechnest du mal {factor}; erst dann wird abgezogen.')
  return numeric(f'Wie viele {target} sind {fmt(amount)} {src}?',ans,f'1 {src} = {factor} {target}.',f'{fmt(amount)} × {factor} = {fmt(ans)}. Also sind {fmt(amount)} {src} gleich {fmt(ans)} {target}.','Zur kleineren Einheit wird die Maßzahl größer; zur größeren Einheit kleiner.')
 if key=='mass':
  src,target,factor=[('kg','g',1000),('t','kg',1000),('g','mg',1000)][k%3];amount=D(n+2)/(10 if l else 1);ans=amount*factor
  return numeric(f'Wie viele {target} sind {fmt(amount)} {src}?',ans,f'1 {src} = 1000 {target}.',f'{fmt(amount)} × 1000 = {fmt(ans)}. Das sind {fmt(ans)} {target}.','Die Masse bleibt gleich. Nur Einheit und Maßzahl ändern sich.')
 if key=='time':
  minutes=n*5+17
  if k%2:return numeric(f'Eine Pause dauert {n} Minuten und {b} Sekunden. Wie viele Sekunden sind das?',n*60+b,'Eine Minute hat 60 Sekunden.',f'{n} × 60 + {b} = {n*60+b} Sekunden.','Zeit wird nicht überall in Zehnerschritten umgerechnet: Stunden und Minuten benutzen 60.')
  return numeric(f'Ein Film dauert {minutes} Minuten. Wie viele ganze Stunden sind darin enthalten?',minutes//60,'Eine Stunde hat 60 Minuten. Gefragt sind nur die ganzen Stunden.',f'{minutes} = {minutes//60} × 60 + {minutes%60}. Es sind {minutes//60} ganze Stunden enthalten.','Teile durch 60. Der Rest sind Minuten und keine weitere ganze Stunde.')
 if key=='estimate':
  rows=[('die Länge eines Bleistifts','18 cm','18 km','18 mm'),('die Masse eines Apfels','150 g','150 kg','150 t'),('die Dauer einer Schulstunde','45 min','45 s','45 h'),('die Höhe einer Zimmertür','2 m','2 mm','2 km'),('die Masse eines Fahrrads','15 kg','15 g','15 t'),('die Länge eines Fußballfelds','100 m','100 cm','100 km'),('die Länge eines Marienkäfers','7 mm','7 m','7 km'),('die Masse einer vollen 1-Liter-Wasserflasche','etwa 1 kg','etwa 1 g','etwa 1 t'),('die Dauer eines kurzen Lieds','3 min','3 h','3 Tage'),('die Höhe eines Schulgebäudes','12 m','12 cm','12 km'),('die Masse eines Schulranzens','4 kg','4 mg','4 t'),('die Länge eines normalen Autos','4 m','4 cm','4 km')];obj,ans,w1,w2=rows[k]
  return choice(f'Welche Schätzung passt zu {obj}?',ans,w1,w2,'Vergleiche mit einem Gegenstand oder einer Zeit, die du kennst.',f'Als grobe Schätzung passt {ans} zu {obj}. Die genaue Größe kann abweichen.','Prüfe zuerst die Einheit: winzig, alltagstauglich oder viel zu groß?')
 if key=='unitary':
  count=b;price=(k%5+2)*(l+1);wanted=a
  return numeric(f'{count} gleiche Hefte kosten zusammen {count*price} €. Wie viele Euro kosten {wanted} Hefte zum gleichen Stückpreis?',wanted*price,'Rechne zuerst auf ein Heft, dann auf die gesuchte Anzahl.',f'{count*price} € : {count} = {price} € je Heft. {wanted} × {price} € = {wanted*price} €.','Der Dreisatz passt hier, weil jedes Heft gleich viel kostet.')
 if key=='scale':
  scale=100*(l+1)*(k+1);cm=b;metres=D(cm*scale)/100
  return numeric(f'Ein Plan hat den Maßstab 1 : {scale}. Eine Strecke ist auf dem Plan {cm} cm lang. Wie lang ist sie in Wirklichkeit in Metern?',metres,'Der Maßstab nennt den Vergrößerungsfaktor vom Plan zur Wirklichkeit.',f'{cm} × {scale} = {cm*scale} cm. Durch 100 ergibt das {fmt(metres)} m.','Rechne erst in Zentimetern; wandle das Ergebnis danach in Meter um.')
 if key=='quantities':
  metres=D(a)/10;cm=b*3;ans=metres*100+cm
  return numeric(f'Ein Band ist {fmt(metres)} m lang. Ein zweites ist {cm} cm lang. Wie viele Zentimeter sind beide zusammen lang?',ans,'Bringe beide Längen zuerst in dieselbe Einheit.',f'{fmt(metres)} m = {fmt(metres*100)} cm. Dazu {cm} cm ergibt {fmt(ans)} cm.','Erst umrechnen, dann addieren. Meter und Zentimeter dürfen nicht direkt als Maßzahlen addiert werden.')
 if key=='rectangles':
  perimeter=k%2==1;ans=2*(a+b) if perimeter else a*b
  return numeric(f'Ein Rechteck ist {a} cm lang und {b} cm breit. '+('Wie groß ist sein Umfang in cm?' if perimeter else 'Wie groß ist seine Fläche in cm²?'),ans,'Umfang ist der Rand; Fläche ist der Platz innerhalb des Randes.',f'Umfang: 2 × ({a} + {b}) = {ans} cm.' if perimeter else f'Fläche: {a} × {b} = {ans} cm².','Beim Umfang zählst du vier Seiten. Bei der Fläche zählst du Einheitsquadrate in Reihen.')
 if key=='area-units':
  amount=D(n+1)/(10 if l else 1);src,target,factor=[('m²','cm²',10000),('dm²','cm²',100),('ha','m²',10000)][k%3];ans=amount*factor
  return numeric(f'Wie viele {target} sind {fmt(amount)} {src}?',ans,f'1 {src} = {factor} {target}.',f'{fmt(amount)} × {factor} = {fmt(ans)}. Das sind {fmt(ans)} {target}.','Eine Fläche hat zwei Richtungen. Ein Längenschritt mal 10 ergibt deshalb einen Flächenschritt mal 100.')
 if key=='compound':
  w=a;h=b+3;cw=b;ch=2;ans=w*h-cw*ch
  return numeric(f'Ein Rechteck ist {w} cm lang und {h} cm breit. An einer Ecke wird ein Rechteck von {cw} cm mal {ch} cm entfernt. Wie viel Fläche bleibt in cm²?',ans,'Berechne die große Fläche und ziehe die ausgeschnittene Fläche ab.',f'{w} × {h} − {cw} × {ch} = {w*h} − {cw*ch} = {ans} cm².','Zeichne die beiden Rechtecke. Die ausgeschnittene Fläche zählt nicht mehr zur Figur.')
 if key=='surface':
  w=a;h=b;depth=l+2;ans=2*(w*h+w*depth+h*depth)
  return numeric(f'Eine geschlossene Schachtel ist {w} cm lang, {h} cm breit und {depth} cm hoch. Wie groß ist die ganze äußere Quaderoberfläche in cm²?',ans,'Ein Quader hat drei Paare gleich großer Rechtecksflächen.',f'2 × ({w} × {h} + {w} × {depth} + {h} × {depth}) = {ans} cm².','Boden und Deckel, Vorder- und Rückseite sowie beide Seiten gehören dazu.')
 raise ValueError(key)

# Each science row has a direct question and a separate application/error question.
# All data examples are constructed exercises, never personal health measurements.
NATURE={
'research': '''Du untersuchst, wie Wasser das Pflanzenwachstum beeinflusst. Welche Bedingung veränderst du?|Zwei Pflanzen bekommen gleich viel Erde und Licht. Nur die Wassermenge unterscheidet sich. Was wird hier untersucht?|Die Wirkung der Wassermenge|Die Wirkung aller Bedingungen gleichzeitig|Die Wirkung der Topffarbe|Nur die Wassermenge wird verändert. So lässt sich ihre Wirkung gezielter untersuchen.
Was hilft beim Vergleich von Licht und Pflanzenwachstum?|Eine Pflanze steht hell, die andere dunkel. Welche Bedingung muss zusätzlich möglichst gleich bleiben?|Die Wassermenge|Die Helligkeit|Die Beschriftung der Messwerte|Für den Lichtvergleich bleibt die Wassermenge gleich. Die Helligkeit ist die untersuchte Bedingung.
Wo beginnt eine Längenmessung mit dem Lineal?|Ein Blatt wird ab der Kante des Lineals gemessen. Die Nullmarke liegt weiter innen. Was muss verbessert werden?|Am Anfang des Blatts die Nullmarke anlegen|Immer 1 cm dazuzählen|Nur die Farbe des Lineals wechseln|Zum Messen liegt ein Ende an der Nullmarke, nicht unbedingt an der äußeren Linealkante.
Was ist eine Beobachtung?|Im Protokoll steht: „Das Wasser wurde trüb, weil ein Stoff entstand.“ Welcher Teil beschreibt nur die Beobachtung?|Das Wasser wurde trüb.|Weil ein Stoff entstand.|Die Ursache steht schon fest.|Trübung ist sichtbar. Die Erklärung ihrer Ursache ist eine Deutung und muss zusätzlich geprüft werden.
Was ist eine Hypothese?|Vor dem Versuch sagt Ben: „Mit mehr Licht könnte die Pflanze schneller wachsen.“ Was ist diese überprüfbare Vermutung?|Eine Hypothese|Ein fertiger Beweis|Ein Messgerät|Eine Hypothese ist eine überprüfbare Vermutung. Der Versuch kann sie stützen oder gegen sie sprechen.
Warum wird ein Versuch wiederholt?|Eine Papierbrücke trägt einmal viel und einmal wenig. Was hilft, zufällige Unterschiede besser zu erkennen?|Mehrere gleich geplante Versuche durchführen|Nur das beste Ergebnis aufschreiben|Alle Bedingungen bei jedem Versuch wechseln|Wiederholungen zeigen, ob Ergebnisse ähnlich sind oder stark schwanken. Auch ungünstige Ergebnisse gehören dazu.
Welche Angabe gehört zu einem Messwert?|In einer Tabelle steht nur „Länge: 12“. Welche Angabe fehlt, damit der Wert verständlich ist?|Die Einheit, zum Beispiel cm|Die Lieblingsfarbe|Der Name des Tisches|Eine Maßzahl braucht eine Einheit. 12 cm und 12 m bedeuten verschiedene Längen.
Was ist ein Modell?|Eine Zeichnung zeigt eine Zelle als einfache Formen. Warum ist sie kein vollständiges Bild der echten Zelle?|Sie lässt Einzelheiten weg.|Sie enthält deshalb keine Information.|Sie ist genau so groß wie jede Zelle.|Ein Modell zeigt ausgewählte wichtige Merkmale und lässt andere weg. Das hilft beim Verstehen, hat aber Grenzen.
Was gehört ins Versuchsprotokoll?|Eine Gruppe schreibt nur „Es hat geklappt“. Welche Ergänzung macht den Versuch nachvollziehbarer?|Aufbau, Durchführung und Beobachtungen|Nur ein lustiger Titel|Nur der Name der schnellsten Person|Ein Protokoll beschreibt unter anderem Aufbau, Durchführung, Beobachtungen und Auswertung.
Welche Aussage wird von einer Tabelle gestützt?|Drei gleich geplante Messungen ergeben 8, 9 und 8 cm. Was lässt sich sicher sagen?|Die Messwerte sind ähnlich, aber nicht alle gleich.|Alle Messwerte sind genau gleich.|Der größte Wert beweist jede Vermutung.|Die Werte unterscheiden sich um höchstens 1 cm. Eine weitergehende Ursache ergibt sich daraus allein nicht.
Was macht einen Vergleich schwer auswertbar?|Pflanze A bekommt viel Wasser und steht hell. Pflanze B bekommt wenig Wasser und steht dunkel. Warum ist die Wasserwirkung schwer zu erkennen?|Wasser und Licht unterscheiden sich gleichzeitig.|Es wurden zwei Pflanzen verwendet.|Die Pflanzen haben Namen.|Mehrere geänderte Bedingungen können das Ergebnis beeinflussen. Die Wirkung einer einzelnen Bedingung bleibt unklar.
Was sollte eine Schlussfolgerung berücksichtigen?|Eine neue Papierform trägt mehr Gewicht. Was gehört zu einer vorsichtigen Schlussfolgerung?|Die beobachteten Ergebnisse und mögliche Fehlerquellen|Nur die Vermutung vor dem Versuch|Eine Behauptung ohne Messwerte|Eine Schlussfolgerung stützt sich auf Ergebnisse und berücksichtigt die Grenzen des Versuchs.''',
'water': '''Wie heißt festes Wasser?|Eine Pfütze wird bei Frost fest. Welcher Stoffzustand liegt danach vor?|Eis: fest|Wasserdampf: gasförmig|Flüssiges Wasser|Eis ist Wasser im festen Zustand.
Wie heißt der Übergang von Eis zu Wasser?|Ein Eiswürfel wird in einem warmen Zimmer flüssig. Welcher Vorgang ist das?|Schmelzen|Gefrieren|Kondensieren|Beim Schmelzen wird festes Wasser flüssig.
Wie heißt der Übergang von Wasser zu Eis?|Wasser wird im Gefrierfach fest. Wie heißt dieser Übergang?|Gefrieren|Verdunsten|Schmelzen|Beim Gefrieren wird flüssiges Wasser fest.
Was bedeutet Verdunsten?|Eine Pfütze wird kleiner, obwohl kein Wasser abfließt. Welcher Vorgang kann das erklären?|Flüssiges Wasser geht in die Luft über.|Wasser wird zu Sand.|Wasser hört auf zu existieren.|Beim Verdunsten geht Wasser in den gasförmigen Zustand über. Der Stoff bleibt Wasser.
Wie heißt der Übergang von Wasserdampf zu Tropfen?|An einer kalten Scheibe entstehen aus Wasserdampf kleine Wassertropfen. Wie heißt der Übergang?|Kondensieren|Schmelzen|Gefrieren|Beim Kondensieren wird gasförmiges Wasser flüssig.
Ist Wasserdampf selbst sichtbar?|Über warmem Wasser sieht man eine weiße Wolke. Was ist daran sichtbar?|Kleine flüssige Wassertropfen|Der gasförmige Wasserdampf selbst|Unsichtbare Eiswürfel|Wasserdampf selbst ist unsichtbar. Die sichtbare weiße Wolke besteht aus kleinen Wassertropfen.
Wie ordnet das Teilchenmodell Eis?|Ein Modell zeigt Wasserteilchen an festen Plätzen. Welcher Zustand soll dargestellt werden?|Der feste Zustand|Der gasförmige Zustand|Ein leeres Gefäß|Im einfachen Eismodell schwingen Teilchen an festen Plätzen. Das Modell vereinfacht die Wirklichkeit.
Wie ordnet das Teilchenmodell flüssiges Wasser?|Teilchen liegen nah beieinander und bewegen sich aneinander vorbei. Welcher Zustand passt?|Flüssig|Fest ohne Bewegung|Gasförmig mit sehr großen Abständen|In einer Flüssigkeit bewegen sich Teilchen aneinander vorbei und bleiben vergleichsweise nah beieinander.
Was ändert sich beim Verdampfen im Teilchenmodell?|Ein Modell zeigt nach dem Verdampfen viel größere Abstände. Was wird damit dargestellt?|Die Wasserteilchen sind weiter voneinander entfernt.|Die Teilchen wurden zu Luftteilchen.|Die Wasserteilchen sind verschwunden.|Im einfachen Gasmodell sind die Abstände viel größer. Die Teilchen bleiben Wasserteilchen.
Was hält ein Papierfilter aus einem Sand-Wasser-Gemisch zurück?|Sand und gelöstes Salz befinden sich in Wasser. Welcher Bestandteil bleibt im passenden Papierfilter zurück?|Sand|Das gelöste Salz vollständig|Das gesamte Wasser|Sandkörner bleiben im Filter. Gelöstes Salz gelangt mit dem Wasser hindurch.
Wie kommt Wasser aus einem See in die Luft?|Im Wasserkreislauf soll ein Pfeil vom See zur Luft beschriftet werden. Was passt?|Verdunstung|Wasser verschwindet für immer.|Wasser wird zu Gestein.|Verdunstung führt Wasser aus dem See in die Luft. Später kann es kondensieren und als Niederschlag zurückkehren.
Welche Aussage gehört zum Wasserkreislauf?|Regen füllt einen See. Welche mögliche Fortsetzung passt?|Wasser verdunstet wieder und gelangt in die Luft.|Alles Wasser bleibt für immer im See.|Regen kann nicht aus Wolken kommen.|Im Wasserkreislauf wechseln Wasser und sein Aufenthaltsort immer wieder.''',
'light-energy': '''Was ist eine Lichtquelle?|Ein Spiegel liegt neben einer eingeschalteten Lampe. Welcher Gegenstand erzeugt selbst Licht?|Die eingeschaltete Lampe|Der unbeleuchtete Spiegel|Eine schwarze Pappkarte|Eine eingeschaltete Lampe sendet selbst Licht aus. Ein Spiegel wirft einfallendes Licht zurück.
Warum entsteht hinter einer Pappfigur ein Schatten?|Eine Lampe beleuchtet eine Pappfigur. Warum erreicht weniger Licht den Bereich dahinter?|Die Figur hält einen Teil des Lichts auf.|Die Figur erzeugt Dunkelheit als Stoff.|Die Wand saugt das Licht aus der Lampe.|Undurchsichtige Gegenstände verhindern, dass Licht geradlinig in den Bereich dahinter gelangt.
Was macht ein Spiegel mit Licht?|Ein Lichtstrahl trifft auf einen Spiegel. Was passiert hauptsächlich?|Das Licht wird zurückgeworfen.|Das Licht wird in Sand verwandelt.|Jeder Spiegel ist eine eigene Lichtquelle.|Ein Spiegel reflektiert Licht: Er wirft es zurück.
Warum gibt es Tag und Nacht?|Ein Ort auf der Erde wird von der Sonne weggedreht. Was erklärt die folgende Nacht?|Die Drehung der Erde|Dass die Sonne jeden Abend ausgeht|Dass der Mond die Sonne jeden Tag verdeckt|Durch die Erdrotation kommt ein Ort auf die beleuchtete und danach auf die unbeleuchtete Seite.
Wie lässt sich Sonnenlicht sicher untersuchen?|Du möchtest den Verlauf der Sonne untersuchen. Welche Beobachtung passt?|Schatten am Boden beobachten|Direkt in die Sonne schauen|Durch eine Lupe in die Sonne schauen|Schatten zeigen Änderungen der Beleuchtung, ohne dass man direkt in die Sonne sehen muss.
Welche Energieumwandlung passt zu einer Solarzelle?|Eine Solarzelle versorgt ein kleines Gerät. Welche Umwandlung beschreibt ihre Aufgabe?|Lichtenergie wird zu elektrischer Energie.|Elektrische Energie wird zu Nahrung.|Lichtenergie wird vollständig vernichtet.|Eine Solarzelle wandelt einen Teil der aufgenommenen Lichtenergie in elektrische Energie um.
Welche Energieumwandlung passt zu einem Elektromotor?|Eine Solarzelle liefert Strom an einen Motor. Welche Umwandlung findet im Motor statt?|Elektrische Energie wird unter anderem zu Bewegung.|Bewegung wird immer zu Eis.|Der Motor erzeugt Energie aus nichts.|Ein Motor wandelt elektrische Energie unter anderem in Bewegung und Wärme um.
Welche Energiekette passt zu einem Solar-Windradmodell?|Licht trifft auf eine Solarzelle und ein Motor dreht das Modell. Welche Kette passt?|Licht → elektrische Energie → Bewegung|Bewegung → Licht → Nahrung|Wärme → Sand → Licht|Die Solarzelle liefert elektrische Energie, die der Motor für Bewegung nutzt.
Welche Energieformen gibt eine leuchtende warme Lampe ab?|Eine eingeschaltete Lampe wird warm. Welche Aussage berücksichtigt beide Beobachtungen?|Sie gibt Licht und Wärme ab.|Sie gibt nur Bewegung ab.|Alle elektrische Energie verschwindet.|Die Lampe wandelt elektrische Energie unter anderem in Licht und Wärme um.
Was passiert mit einem Schatten nahe der Lampe?|Lampe und Wand bleiben stehen. Die Pappfigur rückt zur Lampe. Was passiert mit dem Schatten an der Wand?|Er wird größer.|Er wird immer gleich groß bleiben.|Er wird zu einer eigenen Lichtquelle.|Die näher an der Lampe stehende Figur hält einen größeren Winkelbereich des Lichts auf.
Warum sieht man einen beleuchteten Gegenstand?|Ein Buch leuchtet nicht selbst. Warum kannst du es bei Licht trotzdem sehen?|Licht wird vom Buch zu deinen Augen zurückgeworfen.|Das Buch muss eine eigene Lampe enthalten.|Nur Lichtquellen können sichtbar sein.|Viele Gegenstände sind sichtbar, weil sie einfallendes Licht streuen oder zurückwerfen.
Was bedeutet Energieumwandlung?|Ein Motor wird warm und dreht sich. Was beschreibt das richtig?|Energie tritt in verschiedenen Formen auf.|Energie wird zu einem neuen chemischen Element.|Bewegung und Wärme haben nichts mit Energie zu tun.|Energie kann unter anderem als elektrische Energie, Bewegung und Wärme auftreten.''',
'air-materials': '''Was ist meist in einem scheinbar leeren Becher?|Ein Becher wird kopfüber ins Wasser gedrückt. Was nimmt darin schon Platz ein?|Luft|Gar nichts|Nur ein unsichtbarer Stein|Luft füllt den Becher und nimmt Raum ein.
Welche Gase sind Hauptbestandteile der Luft?|Ein Modell soll die zwei häufigsten Luftbestandteile benennen. Was passt?|Stickstoff und Sauerstoff|Nur Kohlenstoffdioxid|Nur Wasserdampf|Luft besteht überwiegend aus Stickstoff und Sauerstoff sowie kleineren Anteilen weiterer Gase.
Womit trennt man grobe Kiesel von feinem Sand?|Eine Mischung enthält große Kiesel und kleine Sandkörner. Welches Hilfsmittel passt?|Ein Sieb mit passenden Öffnungen|Eine Uhr|Ein Spiegel|Das Sieb nutzt die unterschiedliche Korngröße: Kleine Körner passen durch, große bleiben zurück.
Wie lassen sich Eisennägel von Holzstücken trennen?|Ein Gemisch enthält Eisennägel und Holz. Welche Eigenschaft hilft?|Eisen wird von einem Magneten angezogen.|Holz ist immer flüssig.|Beide Stoffe sind durchsichtig.|Ein Magnet zieht die Eisennägel an; gewöhnliche Holzstücke bleiben zurück.
Was erzeugt den Schall einer Gitarrensaite?|Eine angeschlagene Saite klingt. Was ist die Ursache des Schalls?|Die Saite schwingt.|Die Saite hört auf zu bestehen.|Schall braucht immer Sonnenlicht.|Eine schwingende Saite versetzt die Umgebung in Schwingung und erzeugt Schall.
Was ist Humus?|Im Boden werden Reste von Lebewesen umgewandelt. Wie heißt das dabei entstehende organische Bodenmaterial?|Humus|Reines Metall|Nur grober Kies|Humus entsteht aus umgewandelten Resten von Lebewesen und ist ein Bestandteil vieler Böden.
Wie trennt man Sand von Salzwasser?|Sand ist in Salzwasser gemischt. Welcher erste Schritt entfernt den Sand?|Filtern|Nur umrühren|Alle Stoffe mit einem Magneten anziehen|Ein geeigneter Filter hält Sand zurück; gelöstes Salz bleibt im Wasser.
Wie kann man gelöstes Salz zurückgewinnen?|Der Sand wurde aus Salzwasser gefiltert. Wie lässt sich anschließend Salz zurückgewinnen?|Wasser verdunsten lassen|Noch einmal denselben Papierfilter verwenden|Salz mit einem Lineal abmessen|Wenn Wasser verdunstet, kann das gelöste Salz zurückbleiben.
Was vergleicht die Dichte?|Zwei gleich große Würfel wiegen 8 g und 60 g. Welche Aussage passt?|Der schwerere Würfel hat die größere Dichte.|Beide haben sicher dieselbe Dichte.|Der leichtere Würfel muss größer sein.|Dichte vergleicht Masse und Volumen. Volumen heißt: wie viel Platz ein Körper einnimmt. Bei gleichem Volumen bedeutet mehr Masse eine größere Dichte.
Welches Gas weist eine Glimmspanprobe nach?|Eine Lehrkraft zeigt: Ein glimmender Holzspan flammt in einer Gasprobe auf. Welches Gas wird so nachgewiesen?|Sauerstoff|Stickstoff|Nur Wasserdampf|Das Wiederaufflammen ist der Nachweis für Sauerstoff. Dieser Unterrichtsversuch gehört in die Hand einer Lehrkraft.
Welche Eigenschaft hilft beim Sortieren von Materialien?|Ein Werkstück braucht ein durchsichtiges Fenster. Welche Eigenschaft ist entscheidend?|Lichtdurchlässigkeit|Der Name des Kindes|Die Uhrzeit|Die Auswahl richtet sich nach der benötigten Materialeigenschaft, hier der Lichtdurchlässigkeit.
Warum untersucht man mehrere Eigenschaften eines Stoffes?|Zwei Stoffe haben dieselbe Farbe. Warum reicht das für eine sichere Unterscheidung nicht aus?|Verschiedene Stoffe können gleich aussehen.|Gleiche Farbe bedeutet immer gleichen Stoff.|Materialien besitzen nur eine Eigenschaft.|Zum Unterscheiden helfen mehrere Eigenschaften wie Magnetismus, Löslichkeit oder Dichte.''',
'cells': '''Was untersucht die Biologie?|Ein Kind untersucht Pflanzen und Tiere. Welches Fachgebiet passt?|Biologie: die Wissenschaft von Lebewesen|Nur das Rechnen mit Geld|Nur das Zeichnen von Straßen|Biologie untersucht Lebewesen und ihre Beziehungen zur Umwelt.
Woraus bestehen Pflanzen und Tiere?|Ein Modell zeigt winzige Bausteine eines Blatts. Wie heißen die grundlegenden Bausteine?|Zellen|Nur Sandkörner|Nur Luftblasen|Pflanzen und Tiere sind aus Zellen aufgebaut.
Welches Gerät macht sehr kleine Zellstrukturen sichtbar?|Eine dünne Pflanzenprobe soll stark vergrößert betrachtet werden. Welches Gerät passt?|Ein Mikroskop|Eine Stoppuhr|Ein Maßband|Ein Mikroskop vergrößert kleine Strukturen. Es zeigt nicht automatisch jedes Detail einer Zelle.
Was gibt einer Pflanzenzelle eine feste äußere Form?|Ein Pflanzenzellmodell besitzt eine feste Hülle außerhalb der Zellmembran. Was ist das?|Die Zellwand|Der Zellkern|Ein Muskel|Die Zellwand liegt außerhalb der Zellmembran und stützt die Pflanzenzelle.
Welche Grenze haben Tier- und Pflanzenzellen gemeinsam?|Ein Tierzellmodell besitzt keine Zellwand. Welche äußere Begrenzung hat es trotzdem?|Eine Zellmembran|Eine Knochenwand|Keine Begrenzung|Die Zellmembran begrenzt die Zelle und ist auch bei Pflanzenzellen vorhanden.
Was enthält eine typische Tier- und Pflanzenzelle?|Ein Modell soll gemeinsame Zellbestandteile zeigen. Welche Gruppe passt?|Zellmembran, Zellplasma und Zellkern|Nur Zellwand und Chloroplasten|Knochen, Sehnen und Muskeln|Typische Tier- und Pflanzenzellen besitzen Zellmembran, Zellplasma und Zellkern.
Was ist Zellplasma?|Im Modell liegt Material innerhalb der Zellmembran um die Zellbestandteile. Wie heißt es?|Zellplasma|Humus|Ein Gelenk|Zellplasma gehört zum Inneren der Zelle; weitere Zellbestandteile liegen darin.
Welche Zellbestandteile enthalten Blattgrün?|Eine grüne Blattzelle enthält kleine Teile mit Blattgrün. Welche passen?|Chloroplasten|Gelenke|Arterien|Chloroplasten enthalten Blattgrün. Nicht jede Pflanzenzelle besitzt sie.
Hat jede Pflanzenzelle Chloroplasten?|Eine Wurzelzelle besitzt keine Chloroplasten. Was folgt daraus?|Sie kann trotzdem eine Pflanzenzelle sein.|Sie muss eine Tierzelle sein.|Ohne Chloroplasten gibt es keine Zellen.|Nicht jede Pflanzenzelle hat Chloroplasten. Wurzelzellen können ohne sie vorkommen.
Wofür steht die große Vakuole im Pflanzenzellmodell?|Ein Pflanzenzellmodell zeigt einen großen flüssigkeitsgefüllten Raum. Wie heißt er?|Vakuole|Kugelgelenk|Lungenbläschen|Die Vakuole ist ein flüssigkeitsgefüllter Raum vieler Pflanzenzellen.
Warum ist ein beweglicher Spielzeugroboter kein Lebewesen?|Ein Roboter reagiert auf Licht. Warum reicht das nicht, um ihn als Lebewesen einzuordnen?|Er besteht nicht aus Zellen und hat keinen eigenen Stoffwechsel.|Alles, was sich bewegt, lebt.|Alle Lebewesen brauchen Batterien.|Bewegung und Reaktion allein reichen nicht. Zellaufbau und Stoffwechsel gehören zu den Kennzeichen von Lebewesen.
Welche Grenze hat eine Zellzeichnung?|Eine Zeichnung enthält nur Kreise und Linien. Was muss beim Verwenden beachtet werden?|Sie vereinfacht und lässt Vorgänge weg.|Sie zeigt jede Einzelheit einer echten Zelle.|Sie ist ein lebendes Präparat.|Die Zeichnung ist ein Modell, kein vollständiges Abbild aller Zellstrukturen und Vorgänge.''',
'senses': '''Welches Sinnesorgan nimmt Schall auf?|Eine Glocke klingt. Welches Sinnesorgan nimmt den Schall auf?|Die Ohren|Die Augen|Die Zunge|Die Ohren nehmen Schall auf und geben Informationen über Nerven weiter.
Welches Sinnesorgan nimmt Duftstoffe auf?|Du riechst an einer Blüte. Welches Sinnesorgan ist beteiligt?|Die Nase|Ein Knie|Die Ohren|Die Nase nimmt Duftstoffe wahr.
Welches Sinnesorgan nimmt Licht auf?|Ein Ball kommt angeflogen. Welches Sinnesorgan nimmt das Licht für das Sehen auf?|Die Augen|Der Magen|Die Zunge|Die Augen nehmen Lichtreize auf. Das Gehirn verarbeitet die Informationen.
Welches Sinnesorgan nimmt Berührung auf?|Du ertastest einen rauen Gegenstand. Wo werden die Berührungsreize aufgenommen?|In der Haut|In den Knochen|In der Lunge|Die Haut enthält Sinneszellen für verschiedene Reize, darunter Berührung.
Was leitet Informationen vom Auge weiter?|Du siehst einen Ball. Was verbindet die aufgenommenen Informationen mit dem Gehirn?|Nerven|Sehnen|Blütenblätter|Nerven leiten Informationen weiter; Sehnen verbinden Muskeln mit Knochen.
Welche Rolle hat das Gehirn bei einer bewussten Reaktion?|Du erkennst eine rote Ampel und bleibst stehen. Was macht das Gehirn dabei?|Information verarbeiten und die Reaktion steuern|Licht direkt in Blut verwandeln|Alle Sinnesorgane ersetzen|Das Gehirn verarbeitet die Sinnesinformationen und beteiligt sich an der Steuerung der Reaktion.
Welche Reihenfolge passt zum Fangen eines gesehenen Balls?|Ein Modell verbindet Auge, Gehirn und Muskeln. Welche Reihenfolge passt?|Auge → Nerven → Gehirn → Nerven → Muskeln|Muskeln → Auge → Boden|Magen → Herz → Blüte|Sinnesinformationen werden aufgenommen, weitergeleitet, verarbeitet und in eine Reaktion umgesetzt.
Was schützt das Gehör bei großer Lautstärke?|Bei einer sehr lauten Veranstaltung möchtest du dein Gehör schützen. Was passt?|Abstand, leisere Pausen und passender Gehörschutz|Noch näher an die Lautsprecher gehen|Die Augen schließen|Weniger Lautstärke und geeigneter Gehörschutz können die Belastung des Gehörs verringern.
Was kann Alkohol mit Reaktionen machen?|Eine Aussage behauptet: „Alkohol macht Reaktionen immer schneller.“ Was passt als Korrektur?|Alkohol kann Reaktionen verlangsamen.|Alkohol schützt jedes Sinnesorgan.|Alkohol verändert Reaktionen nie.|Alkohol kann Wahrnehmung und Reaktionen beeinträchtigen.
Warum misst man Reaktionszeiten mehrfach?|Eine Person erreicht bei drei Versuchen verschiedene Zeiten. Welche Erklärung passt?|Messwerte können von Versuch zu Versuch schwanken.|Eine Person hat immer genau denselben Wert.|Jeder Unterschied beweist einen Defekt.|Wiederholungen zeigen Schwankungen; einzelne Werte reichen für viele Schlussfolgerungen nicht.
Was erschwert einen Vergleich von Müdigkeit?|Eine Gruppe ist müde und abgelenkt, die andere ausgeruht und ungestört. Was ist das Problem?|Zwei Bedingungen unterscheiden sich gleichzeitig.|Beide Gruppen haben Augen.|Es wurden Zahlen notiert.|Müdigkeit und Ablenkung können beide das Ergebnis beeinflussen. Ihre Wirkungen lassen sich so schlecht trennen.
Was unterscheidet Reiz und Reaktion?|Ein heller Lichtreiz wird wahrgenommen und eine Person schließt die Augen. Was ist die Reaktion?|Das Schließen der Augen|Das eintreffende Licht|Der Name der Lampe|Der Reiz ist das Licht; das Schließen der Augen ist die darauf folgende Handlung.''',
'movement': '''Was schützt das Gehirn?|Ein Skelettmodell zeigt die Knochen um das Gehirn. Wie heißt dieser Bereich?|Schädel|Fuß|Unterarm|Der Schädel umgibt und schützt das Gehirn.
Was verbindet Knochen beweglich?|Zwei Knochen können sich gegeneinander bewegen. Welcher Bestandteil ermöglicht das?|Ein Gelenk|Ein Blatt|Eine Arterie|Gelenke verbinden Knochen und ermöglichen Bewegungen.
Was kann ein arbeitender Skelettmuskel tun?|Ein Muskel zieht an einem Knochen. Wie verändert er sich dabei aktiv?|Er zieht sich zusammen.|Er drückt den Knochen aktiv zurück.|Er wird zu einem Gelenk.|Skelettmuskeln können sich aktiv zusammenziehen und dabei Zug ausüben.
Was verbindet Muskel und Knochen?|Ein Armmodell zeigt die Verbindung am Muskelende. Was passt?|Eine Sehne|Ein Lungenbläschen|Eine Narbe|Sehnen übertragen die Zugkraft eines Muskels auf Knochen.
Welches Gelenk lässt viele Bewegungsrichtungen zu?|Der Oberarm kann in verschiedene Richtungen bewegt werden. Welche Gelenkart passt zur Schulter?|Kugelgelenk|Nur ein starres Knochenstück|Blütenmodell|Das Kugelgelenk der Schulter ermöglicht Bewegungen in mehrere Richtungen.
Welche Bewegung passt zum Ellenbogenmodell?|Ein vereinfachtes Ellenbogenmodell arbeitet wie ein Türscharnier. Welche Bewegung zeigt es vor allem?|Beugen und Strecken|Beliebiges Drehen in jede Richtung|Nur Wachstum|Das vereinfachte Scharniermodell zeigt Beugen und Strecken.
Warum braucht der Arm Gegenspieler?|Ein Modell soll Beugen und Strecken darstellen. Warum werden zwei Muskeln gebraucht?|Muskeln ziehen aktiv, drücken aber nicht aktiv zurück.|Ein Muskel kann jede Bewegung allein drücken.|Knochen bewegen sich ohne Kräfte.|Ein Muskel beugt, der Gegenspieler ermöglicht durch seinen Zug das Strecken.
Was passiert beim Beugen im Gegenspielermodell?|Der Beugemuskel wird kürzer. Was passiert mit dem Streckmuskel im vereinfachten Modell?|Er lässt die Bewegung zu und wird gedehnt.|Er muss gleichzeitig maximal verkürzt sein.|Er wird zu einer Sehne.|Der Gegenspieler darf die Bewegung nicht blockieren; im vereinfachten Modell wird er gedehnt.
Welche Aufgabe hat das Skelett außer Schutz?|Ein Körpermodell fällt ohne Stützen zusammen. Welche Skelettaufgabe fehlt?|Den Körper stützen|Nahrung verdauen|Licht aufnehmen|Das Skelett stützt den Körper und bietet Ansatzstellen für Muskeln.
Was beeinflusst die Stabilität eines Papierbauteils?|Ein gerollter Papierstab trägt mehr als ein gleich schweres flaches Blatt. Was zeigt das?|Die Form beeinflusst die Stabilität.|Mehr Stabilität braucht immer mehr Material.|Papier besitzt keine Eigenschaften.|Die Form kann die Stabilität bei gleicher Materialmenge verändern.
Was unterstützt angenehme Bewegung im Alltag?|Eine Figur sitzt lange am Tisch. Welche Idee unterstützt den Bewegungsapparat?|Passende Bewegung und regelmäßige Pausen|Immer völlig still sitzen|Schmerzen als Trainingsziel verwenden|Passende Bewegung und Pausen können den Alltag angenehmer gestalten. Bewegung soll nicht schmerzen.
Wie lässt sich ein Arm-Modell richtig einordnen?|Schnüre und Pappe zeigen einen Arm. Was beschreibt das Modell richtig?|Es zeigt ausgewählte Bewegungsprinzipien.|Es besitzt alle Bestandteile eines echten Arms.|Es ist ein vollständiger lebender Arm.|Ein Modell vereinfacht und zeigt nur ausgewählte Eigenschaften des Originals.''',
'nutrition': '''Wo beginnt das mechanische Zerkleinern der Nahrung?|Ein Stück Brot wird gekaut. Wo beginnt dabei die mechanische Zerkleinerung?|Im Mund|Erst im Dickdarm|In der Lunge|Die Zähne zerkleinern Nahrung im Mund.
Welches Organ folgt nach der Speiseröhre?|Eine Karte soll den Weg der Nahrung ergänzen: Mund → Speiseröhre → ... Was passt?|Magen|Herz|Lunge|Nahrung gelangt über die Speiseröhre in den Magen.
Wo werden viele Nährstoffbausteine aufgenommen?|Ein Modell zeigt den Übergang vieler verdauter Nährstoffe in das Blut. Welches Organ passt?|Dünndarm|Schädel|Lunge|Im Dünndarm werden viele Nährstoffbausteine aufgenommen.
Warum besitzt der Dünndarm Falten und Zotten?|Ein Modell zeigt eine stark gefaltete Innenfläche. Welchen Vorteil soll das darstellen?|Eine größere Fläche für die Stoffaufnahme|Eine kleinere Fläche für jede Aufnahme|Eine völlig undurchlässige Wand|Falten und Zotten vergrößern die Oberfläche für die Aufnahme von Stoffen.
Wofür braucht der Körper Nahrung?|Ein Kind sagt: „Nahrung ist nur zum Füllen des Magens da.“ Welche Ergänzung passt?|Sie liefert Energie und Baustoffe.|Sie ersetzt dauerhaft Wasser.|Sie besteht immer aus nur einem Stoff.|Nahrung liefert Stoffe für den Aufbau des Körpers und die Energieversorgung.
Welche Nährstoffgruppe liefert unter anderem Baustoffe?|Eine Tabelle soll eine Nährstoffgruppe mit Baustofffunktion nennen. Was passt?|Eiweiße|Nur Luft|Nur Speisesalz|Eiweiße werden unter anderem als Baustoffe gebraucht.
Was zeigt ein Stärkenachweis mit Iodlösung?|Eine Lehrkraft beschreibt eine blau-schwarze Färbung nach Zugabe von Iodlösung. Worauf deutet sie hin?|Auf Stärke|Auf jeden beliebigen Stoff|Nur auf Sauerstoff|Die blau-schwarze Färbung ist ein Hinweis auf Stärke. Nachweise mit Reagenzien sind Unterrichtsversuche unter Anleitung.
Warum reicht ein einziges Lebensmittel nicht als Begründung für Ernährung?|Jemand sagt: „Brot gibt Energie, deshalb brauche ich nur Brot.“ Was fehlt?|Der Körper braucht verschiedene Nährstoffe und Wasser.|Energie ist grundsätzlich unwichtig.|Brot besteht nur aus Luft.|Ein Energiegehalt allein berücksichtigt nicht alle benötigten Stoffe.
Was ist die Aufgabe der Speiseröhre?|Ein Kind verwechselt Speiseröhre und Luftröhre. Welche Aufgabe passt zur Speiseröhre?|Nahrung zum Magen transportieren|Luft in die Lunge führen|Licht ans Gehirn leiten|Die Speiseröhre transportiert Nahrung zum Magen; die Atemwege führen Luft.
Was bedeutet Verdauung?|Ein Modell zerlegt Nahrung in kleinere Bausteine. Was soll es darstellen?|Nahrung wird für die Aufnahme aufgeschlossen.|Alle Nahrung bleibt unverändert.|Nahrung wird ausschließlich zu Knochen.|Bei der Verdauung wird Nahrung mechanisch und chemisch aufgeschlossen.
Warum sind Verpackungswerte keine persönliche Diagnose?|Eine Übung nutzt erfundene Angaben zum Energiegehalt. Wofür eignen sie sich?|Zum Vergleichen und Rechnen mit Daten|Für eine sichere persönliche Gesundheitsdiagnose|Zum Bestimmen aller Bedürfnisse eines Kindes|Übungswerte helfen beim Lernen und sind keine persönliche Ernährungs- oder Gesundheitsbewertung.
Welche Folge beschreibt einen Teil des Nahrungswegs?|Eine Zeichnung ordnet die Organe. Welche Reihenfolge passt?|Mund → Speiseröhre → Magen → Dünndarm|Mund → Lunge → Schädel|Herz → Mund → Ohr|Die genannte Reihenfolge beschreibt einen Teil des Wegs der Nahrung.''',
'breathing': '''Welches Organ pumpt das Blut?|Ein Kreislaufmodell braucht eine Pumpe. Welches Organ wird damit dargestellt?|Herz|Magen|Knie|Das Herz pumpt Blut durch den Kreislauf.
Welches Gas nimmt das Blut in der Lunge auf?|Ein Pfeil führt aus der Atemluft in das Blut. Welches Gas passt?|Sauerstoff|Nur Stickstoff|Nur Kohlenstoffdioxid|In der Lunge gelangt Sauerstoff aus der Atemluft in das Blut.
Welches Gas gibt das Blut in der Lunge ab?|Ein Pfeil führt vom Blut in die auszuatmende Luft. Welches Gas passt?|Kohlenstoffdioxid|Nur Sauerstoff|Nur Stickstoff|Kohlenstoffdioxid gelangt aus dem Blut in die Atemluft und wird ausgeatmet.
Was transportiert Sauerstoff zu Körperzellen?|Eine Zelle liegt weit von der Lunge entfernt. Was transportiert den Sauerstoff dorthin?|Blut|Die Speiseröhre|Eine Sehne|Blut transportiert Sauerstoff von der Lunge zu vielen Körperzellen.
In welche Richtung führen Arterien?|Ein Gefäß führt Blut vom Herzen weg. Wie wird es eingeordnet?|Arterie|Vene|Speiseröhre|Arterien führen vom Herzen weg. Die Definition hängt von der Richtung ab, nicht vom Sauerstoffgehalt.
In welche Richtung führen Venen?|Ein Gefäß führt Blut zum Herzen hin. Wie wird es eingeordnet?|Vene|Arterie|Luftröhre|Venen führen zum Herzen hin. Auch hier entscheidet die Richtung.
Was braucht die Zellatmung?|Ein einfaches Zellatmungsmodell soll die benötigten Stoffe zeigen. Welche passen?|Traubenzucker und Sauerstoff|Nur Sand und Licht|Nur Stickstoff und Metall|Bei der Zellatmung werden Traubenzucker und Sauerstoff für die Energieversorgung genutzt.
Wo findet Zellatmung statt?|Ein Kind sagt: „Zellatmung passiert nur in der Lunge.“ Welche Korrektur passt?|Sie findet in Körperzellen statt.|Sie findet nur in den Zähnen statt.|Sie ist dasselbe wie das Einatmen.|Die Lunge tauscht Gase aus; Zellatmung findet in Körperzellen statt.
Warum sind viele kleine Lungenbläschen hilfreich?|Ein Modell zeigt viele kleine Bläschen statt eines großen Hohlraums. Was ist der Vorteil?|Viel Oberfläche für den Gasaustausch|Keine Oberfläche für Gase|Blut braucht danach kein Herz mehr.|Viele Lungenbläschen bieten eine große Gesamtoberfläche für den Austausch von Gasen.
Warum kann Atmung bei Bewegung schneller werden?|Muskeln arbeiten stärker. Welche Erklärung passt zur häufig schnelleren Atmung?|Die Energieversorgung der Muskeln braucht mehr Sauerstoff.|Muskeln verwandeln sich in Luft.|Die Lunge ersetzt die Muskeln.|Aktive Muskeln benötigen mehr Energie; Atmung und Kreislauf unterstützen die Versorgung.
Warum kann Tabakrauch Menschen in der Nähe belasten?|Jemand raucht neben anderen Menschen. Welche Erklärung passt?|Andere können schädliche Stoffe aus dem Rauch einatmen.|Rauch bleibt immer nur bei der rauchenden Person.|Rauch ist nur saubere Luft.|Auch Menschen in der Nähe können Rauchbestandteile einatmen.
Wie arbeiten Lunge und Kreislauf zusammen?|Ein Transportmodell verbindet Lunge, Herz und Zellen. Welche Beschreibung passt?|Die Lunge tauscht Gase aus; der Kreislauf transportiert Stoffe.|Die Lunge pumpt alle Nahrung direkt in die Knochen.|Das Herz übernimmt das Sehen.|Gasaustausch und Stofftransport sind verschiedene Aufgaben, die zusammenwirken.''',
'development': '''Wie heißt die Phase vieler körperlicher Veränderungen?|Ein Text beschreibt neue Gefühle und Veränderungen des Körpers beim Heranwachsen. Welche Phase passt?|Pubertät|Verdunstung|Bestäubung|Die Pubertät ist eine Entwicklungsphase mit körperlichen und seelischen Veränderungen.
Entwickeln sich gleich alte Kinder immer gleich schnell?|Zwei gleich alte Kinder verändern sich verschieden schnell. Was ist richtig?|Das Entwicklungstempo kann verschieden sein.|Alle müssen am selben Tag gleich weit sein.|Unterschiede sind immer ein Fehler.|Menschen entwickeln sich in unterschiedlichem Tempo. Daraus folgt keine Bewertung eines Kindes.
Wo reifen Eizellen heran?|Ein Körpermodell soll den Ort nennen, an dem Eizellen heranreifen. Was passt?|Eierstöcke|Lunge|Magen|Eizellen reifen in den Eierstöcken heran.
Wie heißen männliche Keimzellen?|Ein Modell der Befruchtung benötigt eine männliche Keimzelle. Wie heißt sie?|Spermienzelle|Blutplättchen|Blütenblatt|Spermienzellen sind männliche Keimzellen.
Was bedeutet Befruchtung beim Menschen?|Eine Zeichnung verbindet eine Eizelle mit einer Spermienzelle. Welcher Vorgang wird gezeigt?|Vereinigung einer weiblichen und einer männlichen Keimzelle|Nur das Wachstum eines Knochens|Die Verdauung im Magen|Bei der Befruchtung vereinigen sich Eizelle und Spermienzelle.
Wo kann sich ein menschlicher Embryo entwickeln?|Eine Zeichnung zeigt die Entwicklung nach der Befruchtung. Welches Organ passt?|Gebärmutter|Speiseröhre|Lunge|Ein menschlicher Embryo kann sich in der Gebärmutter entwickeln.
Was geschieht bei der Monatsblutung?|Ein Text erklärt die Monatsblutung. Welche Beschreibung passt?|Ein Teil der Gebärmutterschleimhaut wird mit Blut abgegeben.|Alle Knochen werden neu gebildet.|Luft wird aus dem Magen gepumpt.|Bei der Monatsblutung wird ein Teil der Gebärmutterschleimhaut abgestoßen und mit Blut abgegeben.
Darf man eine unerwünschte Umarmung ablehnen?|Ein Kind möchte gerade nicht umarmt werden. Welche Reaktion passt?|Nein sagen und Abstand wünschen|Immer zustimmen müssen|Die eigene Grenze verschweigen müssen|Die persönliche Grenze darf benannt und respektiert werden.
Was hilft, wenn eine Grenze verletzt wurde?|Jemand verlangt, eine Grenzverletzung geheim zu halten. Was ist ein hilfreicher Schritt?|Mit einer vertrauten erwachsenen Person sprechen|Immer allein bleiben müssen|Die Schuld automatisch bei sich suchen|Hilfe bei einer vertrauten erwachsenen Person ist erlaubt und kann unterstützen.
Was gehört zum respektvollen Umgang mit Entwicklung?|Ein Kind macht sich über Veränderungen eines anderen lustig. Welche Alternative passt?|Unterschiede respektieren und nicht beschämen|Körperveränderungen bewerten und verspotten|Private Fragen erzwingen|Körperliche Entwicklung ist persönlich. Respekt und Privatsphäre sind wichtig.
Wer bestimmt die persönliche Grenze beim Berühren?|Ein Kind sagt deutlich, dass es nicht berührt werden möchte. Was sollte die andere Person tun?|Die Grenze respektieren|Das Nein ignorieren|Die Grenze als Wettbewerb behandeln|Ein Nein zur Berührung ist zu respektieren.
Welche Aussage verbindet Pflege und Privatsphäre?|Ein Lerntext behandelt Körperpflege. Welche Ergänzung passt?|Menschen brauchen passende Pflege und dürfen Privatsphäre schützen.|Jede private Information muss erzählt werden.|Pflege erlaubt jede Grenzverletzung.|Pflege und respektierter persönlicher Raum gehören zusammen.''',
'plants': '''Welcher Pflanzenteil nimmt Wasser aus dem Boden auf?|Ein Pflanzenmodell soll den Weg des Wassers aus dem Boden beginnen. Welcher Teil passt?|Wurzel|Kronblatt|Staubblatt|Wurzeln nehmen normalerweise Wasser und darin gelöste Stoffe aus dem Boden auf.
Wo entsteht der Pollen?|Eine Blüte besitzt Staubblätter. Welche Aufgabe haben sie?|Pollen bilden|Den gesamten Boden ersetzen|Die Blüte mit Knochen stützen|In den Staubblättern wird Pollen gebildet.
Welche Aufgabe können bunte Kronblätter haben?|Eine Blüte ist auffällig gefärbt. Welche mögliche Funktion passt?|Bestäubende Tiere anlocken|Jede Pflanze vor Wasser schützen|Nur Steine sammeln|Auffällige Kronblätter können bestäubende Tiere anlocken.
Was heißt Bestäubung?|Pollen erreicht eine passende Narbe. Wie heißt dieser Vorgang?|Bestäubung|Nur Wachstum eines Blatts|Verdauung|Bestäubung bedeutet, dass Pollen auf eine passende Narbe gelangt.
Ist Bestäubung schon dasselbe wie Befruchtung?|Ein Kind setzt beide Begriffe gleich. Welche Korrektur passt?|Bestäubung ist Pollenübertragung; Befruchtung ist Keimzellvereinigung.|Beide Begriffe bedeuten immer exakt dasselbe.|Befruchtung bezeichnet nur das Gießen.|Bestäubung und Befruchtung sind verschiedene Vorgänge.
Was passt zu Windbestäubung?|Eine Pflanze hat unscheinbare Blüten und sehr viel leichten Pollen. Was passt?|Windbestäubung|Nur Bestäubung durch Fische|Eine Pflanze ohne Fortpflanzung|Viel leichter Pollen kann durch den Wind übertragen werden.
Was passt zu Tierbestäubung?|Eine Blüte lockt Insekten an, die Pollen übertragen. Welche Bestäubung liegt vor?|Tierbestäubung|Nur Windbestäubung|Filtern von Sand|Tiere können Pollen zwischen passenden Blüten übertragen.
Wo liegen Samenanlagen?|Ein Blütenmodell zeigt den Fruchtknoten. Was befindet sich darin?|Samenanlagen|Lungenbläschen|Eisennägel|Im Fruchtknoten liegen die Samenanlagen.
Welche Aufgabe hat die Narbe?|Pollen bleibt auf einem passenden Blütenteil hängen. Welcher Teil ist das?|Narbe|Sehne|Magen|Die Narbe nimmt Pollen bei der Bestäubung auf.
Was haben Befruchtungen bei Mensch und Samenpflanze gemeinsam?|Zwei Modelle zeigen unterschiedliche Lebewesen. Welches Prinzip ist gemeinsam?|Weibliche und männliche Keimzellen vereinigen sich.|Beide bestehen nur aus Pollen.|Beide benötigen einen Papierfilter.|Die Keimzellvereinigung ist ein gemeinsames grundlegendes Prinzip.
Welche Familie passt zu vier kreuzförmigen Kronblättern?|Ein einfaches Blütenmodell zeigt vier Kronblätter in Kreuzform. Welche Familie passt zu diesem typischen Merkmal?|Kreuzblütler|Alle Gräser|Alle Nadelbäume|Vier kreuzförmig angeordnete Kronblätter sind ein typisches Merkmal der Kreuzblütler.
Was zeigt ein Blütendiagramm?|Eine Zeichnung stellt Blütenteile von oben als Symbole dar. Was lässt sich gut ablesen?|Anzahl und Anordnung der dargestellten Teile|Die genaue Höhe jeder Pflanze|Jeder Duftstoff der Blüte|Ein Blütendiagramm zeigt ausgewählte Teile und ihre Anordnung, nicht alle Eigenschaften der Pflanze.''',
'grassland': '''Was unterscheidet Wiese und Weide?|Zwei Grünflächen werden verschieden genutzt. Auf einer grasen Tiere, die andere wird gemäht. Welche Zuordnung passt?|Weide: Tiere grasen; Wiese: wird gemäht|Wiese: nur Straßenverkehr; Weide: nur Wasser|Beide Begriffe bedeuten einen Wald.|Die Nutzung unterscheidet Wiese und Weide.
Was ist eine unbelebte Umweltbedingung?|Eine Wiese wird beschrieben. Welche Angabe betrifft die unbelebte Umwelt?|Der Boden ist feucht.|Eine Hummel fliegt.|Ein Gras wächst.|Bodenfeuchtigkeit ist eine unbelebte Umweltbedingung; Tiere und Pflanzen sind Lebewesen.
Was bedeutet Lebensgemeinschaft?|Ein Text nennt alle Lebewesen einer Wiese zusammen. Welcher Begriff passt?|Lebensgemeinschaft|Nur Bodenfeuchtigkeit|Nur das Wetter|Die Lebensgemeinschaft umfasst die zusammenlebenden Lebewesen.
Was gehört zu einem Ökosystem?|Eine Zeichnung zeigt Lebewesen und ihre Umgebung. Welche Kombination passt?|Lebensraum und Lebensgemeinschaft|Nur ein einzelner Stein|Nur die Zahl der Kinder|Ein Ökosystem umfasst Lebensraum und Lebensgemeinschaft mit ihren Beziehungen.
Wie beobachtet man unbekannte Pflanzen vorsichtig?|Du findest eine unbekannte Pflanze am Wiesenrand. Was passt?|Zeichnen und stehen lassen|Ohne Bestimmung essen|Alle Pflanzen ausreißen|Beobachten und Zeichnen ermöglichen Entdecken ohne unnötiges Entfernen unbekannter Pflanzen.
Warum können Blühbereiche Insekten helfen?|Ein Teil einer Wiese bleibt länger ungemäht. Welche mögliche Wirkung passt?|Mehr Blüten können Nahrung bieten.|Alle Insekten verlieren sicher jede Nahrung.|Blüten haben nichts mit Insekten zu tun.|Blüten können Nahrung wie Nektar und Pollen für blütenbesuchende Tiere bieten.
Was lässt sich aus Artenzahlen ablesen?|Auf gleich großen Flächen wurden 4 und 11 Pflanzenarten gefunden. Was ist sicher?|Auf der zweiten wurden mehr Pflanzenarten gefunden.|Auf der ersten wurden mehr gefunden.|Die Zahlen beweisen allein alle Ursachen.|Die zweite Zahl ist größer. Die Ursachen des Unterschieds sind damit noch nicht geklärt.
Wie verbindet man Futtergewinnung und Blütenschutz?|Ein Hof braucht Futter und möchte Blütenbesucher unterstützen. Welche Idee berücksichtigt beides?|Teilflächen versetzt mähen und Blühbereiche lassen|Immer jede Fläche gleichzeitig kurz mähen|Nie über unterschiedliche Ziele sprechen|Versetzte Nutzung kann Blühangebote erhalten und zugleich Futtergewinnung ermöglichen.
Welche Aussage beschreibt eine Nahrungsbeziehung?|Ein vereinfachtes Modell zeigt: Eine Raupe frisst Blätter. Was beschreibt es?|Ein Tier nutzt Pflanzenmaterial als Nahrung.|Die Pflanze frisst immer die Raupe.|Es gibt keine Beziehung zwischen beiden.|Das Modell zeigt eine Nahrungsbeziehung und nur einen Ausschnitt des Lebensraums.
Warum sind wiederholte Beobachtungen hilfreich?|Beim ersten Besuch sieht eine Gruppe wenige Insekten. Was hilft bei einer vorsichtigen Auswertung?|Zu verschiedenen Zeiten erneut beobachten|Sofort behaupten, dass dort nie Insekten leben|Die Wetterbedingungen immer ignorieren|Zeit und Bedingungen beeinflussen Beobachtungen. Ein einzelner Besuch zeigt nur einen Ausschnitt.
Was ist bei einem Flächenvergleich wichtig?|Arten sollen auf zwei Wiesen verglichen werden. Welche Planung macht die Ergebnisse besser vergleichbar?|Gleich große Flächen mit ähnlicher Methode untersuchen|Eine winzige und eine riesige Fläche beliebig vergleichen|Nur die größere Zahl auswählen|Flächengröße und Untersuchungsmethode beeinflussen die gefundenen Artenzahlen.
Welche Grenze hat ein Wiesennetz-Modell?|Ein Modell zeigt vier Arten und einige Nahrungspfeile. Was muss man beachten?|Es zeigt nur einen vereinfachten Ausschnitt.|Es enthält jedes Lebewesen jeder Wiese.|Es ersetzt jede Beobachtung im Freien.|Nahrungsnetzmodelle helfen beim Verstehen, lassen aber viele Arten und Beziehungen weg.'''
}


SCIENCE_HINTS = {
 'research': ('Trenne die untersuchte Bedingung von den Bedingungen, die gleich bleiben sollen.', 'Schreibe auf, was verändert, beobachtet und gemessen wird. Eine Vermutung ist noch kein Beweis.'),
 'water': ('Überlege, wie sich die Teilchen beim Erwärmen oder Abkühlen verhalten.', 'Teilchen sind die winzigen Bausteine eines Stoffes. Trenne sichtbare Tröpfchen von unsichtbarem Wasserdampf.'),
 'light-energy': ('Verfolge den Weg des Lichts oder der Energie durch das beschriebene Modell.', 'Eine Lichtquelle sendet Licht aus. Ein Gegenstand kann dieses Licht zurückwerfen oder den Weg blockieren.'),
 'air-materials': ('Vergleiche die Eigenschaften der genannten Stoffe und des Versuchsaufbaus.', 'Ein Stoff kann unsichtbar sein und trotzdem Raum einnehmen. Prüfe, welche Eigenschaft sich beobachten oder messen lässt.'),
 'cells': ('Eine Zelle ist ein kleiner Baustein eines Lebewesens. Überlege, welcher Zellteil welche Aufgabe hat.', 'Unterscheide Zellmembran, Zellwand und weitere Zellteile. Ein vereinfachtes Bild zeigt nicht jede Einzelheit.'),
 'senses': ('Verfolge den Weg vom Reiz über das Sinnesorgan bis zur Reaktion.', 'Ein Reiz ist zum Beispiel Licht, Schall oder Berührung. Das Sinnesorgan nimmt ihn auf; das Nervensystem verarbeitet die Information.'),
 'movement': ('Überlege, welcher Teil stützt, welcher zieht und welcher die Bewegung ermöglicht.', 'Ein Muskel kann durch Verkürzen ziehen. Knochen, Gelenke und Sehnen haben andere Aufgaben.'),
 'nutrition': ('Verfolge den Weg der Nahrung und unterscheide Zerkleinern, Zerlegen und Aufnehmen.', 'Verdauung zerlegt Nahrung in kleinere Bestandteile. Aufnahme bedeutet, dass Stoffe aus dem Darm in den Körper gelangen.'),
 'breathing': ('Trenne den Gasaustausch in der Lunge vom Stofftransport durch das Blut.', 'Arterie und Vene unterscheiden sich durch die Richtung zum Herzen. Zellatmung meint die Energieversorgung in Zellen.'),
 'development': ('Achte auf den beschriebenen Körperteil oder die persönliche Grenze.', 'Menschen entwickeln sich unterschiedlich schnell. Körperwissen und respektierter persönlicher Raum gehören zusammen.'),
 'plants': ('Ordne die Aufgabe dem passenden Pflanzenteil oder Blütenteil zu.', 'Die Narbe ist der Teil einer Blüte, der Pollen aufnimmt. Bestäubung und Vereinigung von Keimzellen sind verschiedene Schritte.'),
 'grassland': ('Trenne Beobachtung, Nutzung der Fläche und Beziehungen zwischen Lebewesen.', 'Ein Ökosystem umfasst die Lebewesen und ihren Lebensraum. Ein einzelner Besuch oder ein Modell zeigt nur einen Ausschnitt.'),
}
RESEARCH_HINTS = [
 ('Welche Wirkung soll dein Versuch untersuchen?', 'Verändere diese Bedingung; halte die übrigen möglichst gleich.'),
 ('Welche Bedingung wird hier untersucht und welche könnte ebenfalls das Wachstum beeinflussen?', 'Damit ein Lichtvergleich fair bleibt, dürfen andere wichtige Wachstumsbedingungen nicht gleichzeitig wechseln.'),
 ('Suche die Nullmarke auf dem Lineal.', 'Die Außenkante und die Nullmarke sind nicht bei jedem Lineal an derselben Stelle.'),
 ('Trenne das, was du sehen kannst, von einer Erklärung der Ursache.', 'Wörter wie „weil“ leiten oft eine Deutung ein. Die sichtbare Veränderung lässt sich getrennt aufschreiben.'),
 ('Ist die Aussage eine überprüfbare Vermutung oder schon ein gesichertes Ergebnis?', 'Ein Versuch kann eine Vermutung stützen oder gegen sie sprechen.'),
 ('Ein einzelner Versuch kann zufällige Abweichungen enthalten.', 'Vergleiche mehrere ähnlich geplante Durchgänge und notiere alle Ergebnisse.'),
 ('Eine Zahl allein sagt noch nicht, welche Größe gemeint ist.', 'Vergleiche: 12 cm ist etwas anderes als 12 m.'),
 ('Eine vereinfachte Darstellung zeigt ausgewählte Merkmale.', 'Überlege, welche Merkmale im Modell fehlen. Ein Modell muss nicht so groß wie sein Vorbild sein.'),
 ('Andere sollen nachvollziehen können, was die Gruppe getan und gesehen hat.', 'Beschreibe die verwendeten Dinge, die Arbeitsschritte und die Beobachtungen getrennt.'),
 ('Vergleiche die drei Zahlen, ohne eine Ursache dazuzuerfinden.', 'Welche Aussagen lassen sich allein durch die genannten Messwerte prüfen?'),
 ('Liste alle Unterschiede zwischen den beiden Pflanzen auf.', 'Kann das Ergebnis nur einer veränderten Bedingung zugeordnet werden?'),
 ('Vergleiche die Grenzen des Versuchs mit der Reichweite der Behauptung.', 'Ein kleiner Versuch erlaubt keine sichere Aussage über jede denkbare Situation.'),
]

VERBS=[('play','plays','played','playing','football'),('walk','walks','walked','walking','to school'),('read','reads','read','reading','a book'),('watch','watches','watched','watching','a film'),('help','helps','helped','helping','a friend'),('study','studies','studied','studying','English'),('carry','carries','carried','carrying','a bag'),('go','goes','went','going','to the park'),('eat','eats','ate','eating','an apple'),('drink','drinks','drank','drinking','water'),('write','writes','wrote','writing','a story'),('make','makes','made','making','a cake')]
def english_task(key,k,l):
 base,third,past,ing,tail=VERBS[k]
 def fill(prompt,answer,hint,reason,second):
  return dict(prompt=prompt,answer=answer,hint=hint,explanation=reason,furtherHints=[second],options=[],answerKind='text',unit=None)
 if key=='be':
  subject=['I','You','He','She','It','We','They','Ben','Ava','My friends','The cat','Ben and Ava'][k];answer='am' if subject=='I' else 'are' if subject in ['You','We','They','My friends','Ben and Ava'] else 'is'
  phrase=['happy','at school','in the park','eleven','small','ready','here','my friend','at home','kind','hungry','outside'][k]
  return fill(f'Ergänze genau eine Form von be (am, is oder are): {subject} ___ {phrase}.',answer,'I gehört zu am; he, she und it zu is; you, we und they zu are.',f'{subject} {answer} {phrase}. Das Subjekt entscheidet über die Form von be.','Ersetze Namen oder Nomen zuerst durch das passende Personalpronomen.')
 if key=='nouns':
  singular,plural=[('book','books'),('dog','dogs'),('bus','buses'),('box','boxes'),('baby','babies'),('family','families'),('child','children'),('foot','feet'),('tooth','teeth'),('mouse','mice'),('woman','women'),('man','men')][k]
  return fill(f'Ergänze die Mehrzahl: one {singular}, two ___.',plural,'Viele Mehrzahlen erhalten -s. Manche ändern ihre Schreibweise oder sind unregelmäßig.',f'Die Mehrzahl von {singular} lautet {plural}.','Bei Konsonant + y wird y zu ies; unregelmäßige Formen lernst du als Wortpaar.')
 if key=='pronouns':
  owner,answer=[('I','my'),('you','your'),('he','his'),('she','her'),('we','our'),('they','their'),('Ben','his'),('Ava','her'),('Ben and Ava','their'),('my sister','her'),('my brother','his'),('my friends and I','our')][k]
  return fill(f'Das Buch gehört zu „{owner}“. Ergänze den passenden Possessivbegleiter: This is ___ book.',answer,'Possessivbegleiter sagen, zu wem etwas gehört.',f'Zu {owner} passt {answer}: This is {answer} book.','Ersetze die Besitzer zuerst durch I, you, he, she, we oder they.')
 if key=='prepositions':
  german,answer=[('auf dem Tisch','on'),('unter dem Bett','under'),('im Zimmer','in'),('neben der Tür','next to'),('hinter dem Stuhl','behind'),('vor dem Haus','in front of'),('zwischen zwei Bäumen','between'),('auf dem Stuhl','on'),('unter dem Tisch','under'),('im Haus','in'),('neben dem Fenster','next to'),('hinter der Tür','behind')][k]
  if answer not in ['in','on','under']:
   return choice(f'Welcher englische Ausdruck beschreibt die Lage „{german}“?',answer,'above','under' if answer!='under' else 'on','Achte auf den beschriebenen Ort.',f'{german} wird mit {answer} beschrieben.','Stell dir die beiden Gegenstände vor und vergleiche ihre Lage.')
  noun={'Tisch':'table','Bett':'bed','Zimmer':'room','Stuhl':'chair','Haus':'house'}[german.split()[-1]]
  return fill(f'Der Ball liegt {german}. Ergänze: The ball is ___ the {noun}.',answer,'Präpositionen wie in, on und under beschreiben einen Ort.',f'The ball is {answer} the {noun}. {answer} passt zur beschriebenen Lage.','in heißt in, on heißt auf und under heißt unter.')
 if key=='articles-have':
  if k<6:
   noun=['apple','book','orange','ruler','egg','chair'][k];ans='an' if k%2==0 else 'a'
   return fill(f'Ergänze den unbestimmten Artikel a oder an: ___ {noun}.',ans,'Vor einem Vokallaut steht an, sonst a.',f'{ans} {noun}. Entscheidend ist der erste Laut des folgenden Wortes.','Sprich den Wortanfang langsam; bei diesen Wörtern passt der Laut zur Anfangsschreibung.')
  subject=['I','She','We','He','They','Ben'][k-6];ans='has' if subject in ['She','He','Ben'] else 'have'
  return fill(f'Ergänze have oder has: {subject} ___ got a pencil.',ans,'He, she und it verwenden has; die anderen genannten Pronomen have.',f'{subject} {ans} got a pencil.','Ersetze Ben durch he und prüfe dann die passende Form.')
 if key=='present':
  if l==0:return fill(f'Ergänze {base} im Simple Present: She ___ {tail} every week.',third,'Bei he, she und it erhält das Verb im Aussagesatz meist -s.',f'She {third} {tail} every week. Das ist eine Gewohnheit.','Bei Verben auf Konsonant + y wird y zu ies; bei einigen Endungen kommt es dazu.')
  if l==1 and k%3==1:return fill(f'Ergänze do oder does: ___ he {base} {tail} every week?','Does','In Fragen mit he, she oder it steht does.',f'Does he {base} {tail} every week? Nach does steht die Grundform.','Das -s steckt schon in does und kommt nicht zusätzlich an das Verb.')
  if l==1 and k%3==2:return fill(f'Ergänze die Grundform von {base}: He does not ___ {tail}.',base,'Nach does not steht die Grundform.',f'He does not {base} {tail}.','Die Verneinung trägt does; das Hauptverb bekommt kein zusätzliches -s.')
  if l==2:
   return choice(f'Fehlerdetektiv: Ben schreibt “He {base} {tail} every week.” Welcher Satz ist richtig?',f'He {third} {tail} every week.',f'He {base} {tail} every week.',f'He does {third} {tail} every week.','Unterscheide Aussagesatz und Frage. Hier ist ein Aussagesatz gefragt.',f'Im Aussagesatz mit he lautet die Verbform {third}. Das Zeitwort every week beschreibt eine Gewohnheit.','Bei he trägt das Hauptverb im bejahten Aussagesatz die passende Endung.')
  return fill(f'Ergänze {base} im Simple Present: Ben ___ {tail} every week.',third,'Ersetze Ben durch he.',f'Ben {third} {tail} every week.','Für he, she und it brauchst du im Aussagesatz die dritte Person Einzahl.')
 if key=='questions':
  rows=[('nach einem Ort','Where','When','Who'),('nach einer Zeit','When','Where','Whose'),('nach einer Person','Who','Where','Why'),('nach einem Grund','Why','Who','When'),('nach einem Besitzer','Whose','Why','Where'),('nach einer Sache','What','When','Who'),('nach der Art und Weise','How','Whose','Where'),('nach einem Ort: ___ is the park?','Where','Who','Why'),('nach einer Zeit: ___ is your party?','When','Who','Where'),('nach dem Besitzer: ___ bag is this?','Whose','When','Why'),('nach einer Person: ___ plays football?','Who','Where','When'),('nach einem Grund: ___ are you happy?','Why','Whose','Where')];meaning,ans,w1,w2=rows[k]
  return choice(f'Du fragst {meaning}. Welches Fragewort passt?',ans,w1,w2,'Prüfe, welche Information die Antwort liefern soll.',f'{ans} fragt {meaning.split(":")[0]}.','Ort: where; Zeit: when; Person: who; Grund: why; Besitzer: whose; Sache: what; Art und Weise: how.')
 if key=='progressive':
  subject=['I','You','He','She','We','They'][k%6];aux='am' if subject=='I' else 'is' if subject in ['He','She'] else 'are'
  if l==0:return fill(f'Ergänze be im Present Progressive: {subject} ___ {ing} {tail} now.',aux,'Die Verlaufsform besteht aus einer Form von be und Verb + ing.',f'{subject} {aux} {ing} {tail} now.','Wähle zuerst am, is oder are passend zum Subjekt.')
  return fill(f'Es passiert gerade jetzt. Ergänze die ing-Form von {base}: {subject} {aux} ___ {tail} now.',ing,'Die Verlaufsform beschreibt eine gerade ablaufende Handlung.',f'{subject} {aux} {ing} {tail} now.','Ein stummes e am Wortende fällt vor ing oft weg, zum Beispiel make → making.')
 if key=='quantifiers':
  noun,countable=[('apples',True),('water',False),('books',True),('milk',False),('chairs',True),('homework',False),('pencils',True),('information',False),('dogs',True),('rice',False),('sandwiches',True),('juice',False)][k];ans='many' if countable else 'much'
  return fill(f'Wähle much oder many: How ___ {noun} '+('are there?' if countable else 'is there?'),ans,'Many steht bei zählbaren Nomen im Plural; much bei nicht zählbaren.',f'How {ans} {noun} '+('are there?' if countable else 'is there?')+f' {noun} wird hier '+('gezählt.' if countable else 'als nicht zählbar verwendet.'),'Homework und information erhalten für diese Bedeutung keine normale Pluralform.')
 if key=='modals':
  rules=[('Du kannst schwimmen.','can','must','mustn’t'),('Du musst anhalten.','must','needn’t','can'),('Du darfst hier nicht rennen.','mustn’t','needn’t','can'),('Du musst kein Geschenk mitbringen.','needn’t','mustn’t','must'),('Du darfst hier parken.','can','mustn’t','must'),('Du musst die Regel beachten.','must','needn’t','can'),('Du darfst die Tür nicht öffnen.','mustn’t','needn’t','can'),('Du musst keinen Hut tragen.','needn’t','must','mustn’t'),('Du kannst ein Fahrrad fahren.','can','mustn’t','needn’t'),('Du musst leise sein.','must','can','needn’t'),('Du darfst hier nicht essen.','mustn’t','can','needn’t'),('Du musst nicht warten.','needn’t','mustn’t','must')];meaning,ans,w1,w2=rules[k]
  return choice(f'Welches Modalverb passt zur Bedeutung: „{meaning}“?',ans,w1,w2,'Mustn’t bedeutet Verbot; needn’t bedeutet, dass etwas nicht nötig ist.',f'{ans} passt zu „{meaning}“.','Can beschreibt Können oder Erlaubnis; must eine Pflicht.')
 if key=='past':
  if l==1 and k%3==1:return fill(f'Ergänze die Grundform von {base}: Did she ___ {tail} yesterday?',base,'Nach did steht die Grundform.',f'Did she {base} {tail} yesterday? Die Vergangenheitsform steckt in did.','Das Hauptverb wird nach did nicht noch einmal in die Vergangenheit gesetzt.')
  if l==2 and k%3==2:return fill(f'Fehlerdetektiv: Nach did not ist die Grundform nötig. Ergänze {base}: He did not ___ {tail} yesterday.',base,'Did not trägt die Vergangenheit.',f'He did not {base} {tail} yesterday.','Regelmäßige und unregelmäßige Verben verwenden nach did dieselbe Grundformregel.')
  return fill(f'Ergänze {base} im Simple Past: Yesterday, Ava ___ {tail}.',past,'Viele Verben bekommen -ed; manche haben eine unregelmäßige Form.',f'Yesterday, Ava {past} {tail}. Die Simple-Past-Form von {base} ist {past}.','Lerne Grundform und Vergangenheitsform als Paar. Did steht in diesem Aussagesatz nicht.')
 if key=='sentences':
  if k%2:
   verb,third,_,_,tail=VERBS[k]
   return choice(f'Ordne den Aussagesatz: Ben / {third} / {tail} / after school.',f'Ben {third} {tail} after school.',f'After {third} school Ben {tail}.',f'{third} Ben after {tail} school.','Die Grundfolge ist Subjekt – Verb – Ergänzung.',f'Ben ist das Subjekt, {third} das Verb. Die Zeitangabe steht hier am Ende.','S-V-O heißt: wer handelt – was tut er – worauf bezieht sich die Handlung?')
  reason=['it is raining','she is tired','he is hungry','it is cold','the lesson starts','the bus is late'][k//2]
  return fill(f'Verbinde ausdrücklich den Grund mit because oder when: I wait here ___ {reason}.','because','Because nennt einen Grund; when beschreibt eine Zeit oder Bedingung.',f'I wait here because {reason}. Hier wird ausdrücklich ein Grund gesucht.','Frage: Warum? Dann passt because.')
 if key=='greetings':
  rows=[('Du begrüßt jemanden.','Hello!','Goodbye!','Good night!'),('Du verabschiedest dich am Nachmittag.','See you!','Good morning!','Hello!'),('Du bittest höflich um Wasser.','I’d like some water, please.','Give water now!','Water never!'),('Du bedankst dich.','Thank you.','Good night.','Go away.'),('Du entschuldigst dich für einen kleinen Fehler.','Sorry.','Hello.','Well done.'),('Du fragst nach dem Namen.','What is your name?','Where is your bag?','When is lunch?'),('Du verstehst ein Wort nicht.','What does this word mean?','My bike is red.','I am hungry.'),('Du möchtest etwas wiederholt hören.','Could you say that again, please?','Never speak again.','This is my room.'),('Du sagst am Morgen Guten Morgen.','Good morning!','Good night!','Goodbye!'),('Du wünschst vor dem Schlafen eine gute Nacht.','Good night!','Good morning!','Open your book!'),('Du bittest um Hilfe.','Can you help me, please?','I like apples.','This is London.'),('Du magst Pizza auch.','Me too!','Not now!','No one!')];situation,ans,w1,w2=rows[k]
  return choice(f'{situation} Welcher Ausdruck passt?',ans,w1,w2,'Achte darauf, was du in der Situation sagen möchtest.',f'„{ans}“ passt zu dieser Situation.','Eine höfliche Bitte enthält oft please. Begrüßung und Abschied haben unterschiedliche Ausdrücke.')
 if key=='reading':
  name=['Ava','Ben','Mia','Leo','Sam','Jo','Ella','Tom','Nora','Max','Lily','Alex'][k];day=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][k%6];hour=k%5+2
  if l==0:
   return choice(f'Lies: “{name} has a green bag. The bike is blue.” Welche Farbe hat die Tasche?','grün','blau','rot','Suche den Satz über die Tasche: bag.',f'Green heißt grün. Die Tasche ist grün; das Fahrrad ist blau.','Ordne die Farbe dem richtigen Gegenstand zu, nicht dem anderen Satz.')
  if l==1:
   return choice(f'Lies: “The club meets on {day} at {hour} pm. Bring a book, not a ball.” Was soll mitgebracht werden?','ein Buch','ein Ball','ein Fahrrad','Bring heißt mitbringen; not schließt etwas aus.','Die Aufforderung Bring a book verlangt ein Buch. Not a ball schließt den Ball aus.','Suche die Handlungsaufforderung im Text; Wochentag und Uhrzeit beantworten eine andere Frage.')
  return choice(f'Lies: “{name} missed the bus. The lesson started at 9. {name} walked and arrived at 8:55.” War {name} vor Unterrichtsbeginn da?','Ja','Nein','Das steht nicht im Text.','Vergleiche Ankunft und Unterrichtsbeginn.','8:55 liegt fünf Minuten vor 9 Uhr. Trotz des verpassten Busses war die Person vorher da.','Missed the bus sagt nicht allein, ob jemand zu spät ist; entscheidend sind die genannten Zeiten.')
 if key=='daily-words':
  english,german=[('sister','Schwester'),('kitchen','Küche'),('school','Schule'),('apple','Apfel'),('Monday','Montag'),('yesterday','gestern'),('eleven','elf'),('always','immer'),('never','nie'),('bedroom','Schlafzimmer'),('breakfast','Frühstück'),('ruler','Lineal')][k]
  return choice(f'Was bedeutet {english} in diesem Wortfeld?',german,'morgen' if german!='morgen' else 'gestern','Fenster' if german!='Fenster' else 'Tür','Ordne das Wort einem passenden Alltagsthema zu.',f'{english} bedeutet {german}.','Lerne das Wort zusammen mit einem kurzen Beispielsatz im Vokabeltrainer.')
 if key=='culture':
  rows=[('Welche Stadt ist die Hauptstadt des Vereinigten Königreichs?','London','New York','Paris','London ist die Hauptstadt des Vereinigten Königreichs.'),('Welches Land gehört zum Vereinigten Königreich?','England','Kanada','Frankreich','England gehört zum Vereinigten Königreich; Großbritannien umfasst England, Schottland und Wales.'),('Welches Land liegt in Nordamerika?','Kanada','Wales','Schottland','Kanada liegt in Nordamerika.'),('Welche Stadt liegt in den USA?','New York','London','Edinburgh','New York liegt in den USA.'),('Welche Stadt ist die Hauptstadt der USA?','Washington, D.C.','London','New York','Washington, D.C. ist die Hauptstadt der USA.'),('Ein Schild sagt “Open: 9 am – 5 pm.” Wann öffnet der Ort?','um 9 Uhr morgens','um 9 Uhr abends','um 5 Uhr morgens','Am bezeichnet hier die Zeit vor Mittag. Der Ort öffnet um 9 Uhr morgens.'),('Ein Schild sagt “Closed on Monday.” Was musst du weitergeben?','Montags geschlossen','Montags immer geöffnet','Nur am Sonntag geschlossen','Closed heißt geschlossen; on Monday nennt den Montag.'),('Ein Angebot sagt “Children: £3.” Was ist die wichtige Information?','Kinder zahlen 3 Pfund.','Alle zahlen 3 Euro.','Kinder zahlen nichts.','Children heißt Kinder und £ steht für Pfund.'),('Ein Schild sagt “No bikes.” Welche Information passt?','Fahrräder sind nicht erlaubt.','Fahrräder sind immer nötig.','Nur Fahrräder dürfen hinein.','No bikes bedeutet, dass Fahrräder hier nicht erlaubt sind.'),('Welche Länder bilden Großbritannien?','England, Schottland und Wales','England und Kanada','Wales und die USA','Großbritannien umfasst England, Schottland und Wales; UK umfasst zusätzlich Nordirland.'),('Welche Sprache wird in vielen Ländern als gemeinsame Sprache genutzt?','Englisch','Nur Deutsch','Nur Latein','Englisch wird in vielen Ländern und als gemeinsame Sprache zwischen Menschen verwendet.'),('Ein Hinweis sagt “Bring a jacket.” Was ist wichtig weiterzugeben?','Eine Jacke mitbringen','Eine Jacke verkaufen','Keine Jacke benutzen','Bring bedeutet mitbringen und jacket bedeutet Jacke.')];p,a,w1,w2,e=rows[k]
  return choice(p,a,w1,w2,'Gib die für die Situation wichtige Information sinngemäß weiter.',e,'Du brauchst bei Sprachmittlung nicht jedes Wort einzeln zu übersetzen.')
 if key=='learning':
  rows=[('Was hilft beim Lernen eines neuen Wortes?','Ein Beispielsatz mit dem Wort','Nur die Seitenzahl merken','Jedes Wort ohne Bedeutung abschreiben','Ein Beispielsatz verbindet Bedeutung und Verwendung.'),('Was ist ein Wortfeld?','Wörter zu einem gemeinsamen Thema','Eine Liste nur zufälliger Zahlen','Ein einzelnes Satzzeichen','Ein Wortfeld sammelt zum Beispiel Wörter rund um Schule.'),('Was ist ein chunk beim Sprachenlernen?','Eine häufig zusammen verwendete Wortgruppe','Immer ein Tippfehler','Eine besondere Zahl','Wortgruppen wie I’d like helfen beim flüssigen Sprechen.'),('Was bedeutet become?','werden','bekommen','bleiben','Become ist ein false friend: Es bedeutet werden, nicht bekommen.'),('Was bedeutet homework?','Hausaufgaben','Hausarbeit als Beruf','Ein Wohnhaus','Homework heißt Hausaufgaben und wird im Englischen normalerweise nicht mit -s pluralisiert.'),('Was bedeutet information?','Information oder Informationen','Immer eine Uhrzeit','Nur eine Telefonnummer','Information wird in dieser Bedeutung normalerweise nicht mit -s pluralisiert.'),('Was hilft beim Wiederholen?','Wörter später erneut aus dem Gedächtnis abrufen','Nur einmal kurz ansehen','Jede schwierige Karte wegwerfen','Abrufen und spätere Wiederholung unterstützen das Lernen.'),('Was zeigen Lautzeichen?','Die Aussprache eines Wortes','Den Preis eines Buchs','Das Alter jeder Person','Lautzeichen zeigen Laute und ergänzen die gewöhnliche Schreibweise.'),('Was hilft beim Hören eines unbekannten Wortes?','Ein Vorbild anhören und aufmerksam nachsprechen','Nur lauter schreiben','Alle Vokale weglassen','Ein Hörvorbild macht die Aussprache zugänglich. Die App bietet lokal gebündelte Wortaudios.'),('Wie nutzt man Bilder beim Lesen?','Als Hinweis und zusammen mit dem Text','Als Beweis für jede Vermutung','Statt jeden Text zu beachten','Bilder können helfen, aber Aussagen müssen zum Text passen.'),('Wie prüft man ein schwieriges Wort?','Bedeutung und Verwendung in einem Wörterbuch nachschlagen','Immer die ähnlich klingende deutsche Bedeutung nehmen','Jedes Wort ignorieren','Ähnlicher Klang ist keine sichere Übersetzung; Wörterbücher helfen.'),('Was hilft beim eigenen kurzen Text?','Mit einer Liste wichtige Angaben und Satzformen prüfen','Nur die Länge zählen','Alle Satzzeichen entfernen','Eine kurze Checkliste unterstützt das selbstständige Prüfen.')];p,a,w1,w2,e=rows[k]
  return choice(p,a,w1,w2,'Überlege, welche Strategie beim Verstehen oder Erinnern hilft.',e,'Nutze eine Strategie bewusst und prüfe danach, ob sie dir geholfen hat.')
 raise ValueError(key)

def improve_task(key,k,l,task):
 if key=='math-quadrilaterals':
  rows=[('Vier gleich lange Seiten und vier rechte Winkel: Welche Figur passt?','Quadrat','Dreieck','Kreis','Ein Quadrat hat vier gleich lange Seiten und vier rechte Winkel.'),('Vier rechte Winkel und unterschiedlich lange Nachbarseiten: Welche Figur passt?','Rechteck, das kein Quadrat ist','Kreis','Dreieck','Ein Rechteck hat vier rechte Winkel; ungleiche Nachbarseiten schließen ein Quadrat aus.'),('Vier gleich lange Seiten, aber keine rechten Winkel: Welche Figur passt?','Raute, die kein Quadrat ist','Rechteck','Kreis','Eine Raute hat vier gleich lange Seiten. Ohne rechte Winkel ist sie kein Quadrat.'),('Bei einem Viereck sind beide Paare gegenüberliegender Seiten parallel. Welche Beschreibung passt?','Parallelogramm','Dreieck','Kreis','Ein Parallelogramm hat zwei Paare paralleler gegenüberliegender Seiten.'),('Ein Viereck hat genau ein Paar paralleler Seiten. Welche Beschreibung passt?','Trapez','Rechteck','Kreis','Ein Viereck mit einem Paar paralleler Seiten ist ein Trapez; hier ist es kein Parallelogramm.'),('Ein Viereck hat zwei Paare gleich langer benachbarter Seiten. Welche Beschreibung passt?','Drachenviereck','Dreieck','Kreis','Ein Drachenviereck hat zwei Paare gleich langer benachbarter Seiten.'),('Ein Quadrat wird auf dem Blatt gedreht. Welche Aussage bleibt richtig?','Es bleibt ein Quadrat.','Es wird allein durch Drehen ein Kreis.','Es verliert zwei Seiten.','Drehen ändert weder Seitenlängen noch Winkel.'),('Ist jedes Quadrat auch ein Rechteck?','Ja, es hat vier rechte Winkel.','Nein, es hat keine rechten Winkel.','Nur bei waagerechter Lage.','Quadrate erfüllen die Eigenschaften eines Rechtecks; sie besitzen zusätzlich gleich lange Seiten.'),('Ist jedes Rechteck ein Quadrat?','Nein, seine Nachbarseiten können verschieden lang sein.','Ja, bei jedem Rechteck sind alle Seiten gleich lang.','Nur wenn es gedreht wird.','Rechtecke brauchen vier rechte Winkel, aber keine vier gleich langen Seiten.'),('Eine Raute hat einen rechten Winkel. Welche genauere Beschreibung passt?','Quadrat','Dreieck','Kreis','Eine Raute mit einem rechten Winkel ist ein Quadrat: die Seiten sind gleich lang und die Winkel recht.'),('Ein Parallelogramm besitzt einen rechten Winkel. Welche genauere Beschreibung passt?','Rechteck','Kreis','Dreieck','Ein Parallelogramm mit einem rechten Winkel ist ein Rechteck.'),('Welche Figur hat gegenüberliegende Seiten gleich lang und vier rechte Winkel?','Rechteck','Dreieck','Kreis','Rechtecke haben vier rechte Winkel und gleich lange gegenüberliegende Seiten.')]
  p,a,w1,w2,e=rows[k];return choice(p,a,w1,w2,'Vergleiche Seitenlängen, Nachbarschaft und rechte Winkel.',e,'Die Lage auf dem Papier ist unwichtig. Prüfe die genannten Eigenschaften.')
 if key=='math-primes' and k%3==1:
  n=(k+3)*(l+2)*3;return choice(f'Welche Begründung zeigt, dass {n} durch 3 teilbar ist?',f'Die Quersumme ist durch 3 teilbar.','Jede Zahl mit zwei Ziffern ist durch 3 teilbar.','Alle geraden Zahlen sind durch 3 teilbar.','Die Quersumme ist die Summe der Ziffern.',f'Die Quersumme von {n} ist {sum(map(int,str(n)))}. Sie ist durch 3 teilbar, deshalb auch {n}.','Gerade heißt durch 2 teilbar; das ist keine Teilbarkeitsregel für 3.')
 if key=='math-primes' and k%3==2:
  n=[12,18,20,28][k//3]*(2**l);factors=[];rest=n
  for prime in [2,3,5,7]:
   while rest%prime==0:factors.append(prime);rest//=prime
  ans=' × '.join(map(str,factors));return choice(f'Welche vollständige Primfaktorzerlegung gehört zu {n}?',ans,f'{n} × 1',f'{n} + 1','In einer Primfaktorzerlegung sind alle Faktoren Primzahlen.',f'{n} = {ans}. Jede genannte Zahl ist eine Primzahl.','Die Faktoren werden multipliziert. 1 ist keine Primzahl.')
 if key=='english-reading':
  name=['Ava','Ben','Mia','Leo','Sam','Jo','Ella','Tom','Nora','Max','Lily','Alex'][k]
  colors=[('red','rot'),('green','grün'),('blue','blau'),('yellow','gelb'),('black','schwarz'),('white','weiß')];color,german=colors[k%6];other,wrong=colors[(k+1)%6];third,wrong2=colors[(k+2)%6]
  if l==0:
   obj,deobj=('bag','Tasche') if k<6 else ('bike','Fahrrad')
   return choice(f'Lies: “{name} has a {color} {obj}. The chair is {other}.” Welche Farbe hat '+('die Tasche?' if k<6 else 'das Fahrrad?'),german,wrong,wrong2,'Suche den Satz über den gesuchten Gegenstand.',f'{color} heißt {german}. Die Farbe {other} gehört zum Stuhl.','Bag bedeutet Tasche und bike Fahrrad. Ordne die Farbe dem richtigen Nomen zu.')
  days=[('Monday','Montag'),('Tuesday','Dienstag'),('Wednesday','Mittwoch'),('Thursday','Donnerstag'),('Friday','Freitag'),('Saturday','Samstag')];day,de_day=days[k%6];items=[('book','Buch'),('ball','Ball'),('ruler','Lineal'),('pencil','Bleistift')];item,de_item=items[k%4];other_item,wrong_item=items[(k+1)%4];hour=k%5+2
  if l==1:
   if k%2:return choice(f'Lies: “The club meets on {day} at {hour} pm. Bring a {item}.” An welchem Tag trifft sich der Club?',de_day,days[(k+1)%6][1],days[(k+2)%6][1],'Suche die Zeitangabe mit on.',f'On {day} nennt {de_day} als Trefftag.','Die Uhrzeit beantwortet wann am Tag, nicht den Wochentag.')
   return choice(f'Lies: “The club meets on {day}. Bring a {item}, not a {other_item}.” Was soll mitgebracht werden?',de_item,wrong_item,'Fahrrad','Bring heißt mitbringen; not schließt etwas aus.',f'Bring a {item} verlangt {de_item}. {other_item} ist ausdrücklich ausgeschlossen.','Achte darauf, welche Angabe als Aufforderung und welche als Verneinung formuliert ist.')
  minute=50+k;ans='Ja' if minute<60 else 'Nein';clock=f'8:{minute:02}' if minute<60 else f'9:{minute-60:02}'
  return choice(f'Lies: “{name} missed the bus. The lesson started at 9. {name} walked and arrived at {clock}.” War {name} vor Unterrichtsbeginn da?',ans,'Nein' if ans=='Ja' else 'Ja','Das steht nicht im Text.','Vergleiche Ankunft und Beginn, unabhängig vom Bus.',f'{clock} liegt '+('vor' if minute<60 else 'nicht vor')+' 9 Uhr. Deshalb lautet die Antwort '+ans+'.','Ein verpasster Bus allein entscheidet nicht über Pünktlichkeit; entscheidend sind die genannten Zeiten.')
 return task


def vocabulary_task(deck,k,l):
 cards=json.loads((ROOT/'src-tauri/content/vocabulary-5-v1.json').read_text())['cards']
 pool=[c for c in cards if c['deckId']==deck]
 card=pool[k]
 # Exact cloze text and meaning come from the existing original vocabulary bank.
 if l==2:
  options=[card['english']]+[c['english'] for c in pool if c['english']!=card['english']][:2]
  return dict(prompt=f"Ergänze das Wort für „{card['german']}“ im Satz: {card['cloze']}",answer=card['english'],hint='Lies den Satz und die genannte deutsche Bedeutung zusammen.',furtherHints=['Prüfe, welches angebotene Wort inhaltlich und grammatisch in die Lücke passt.'],explanation=card['example']+' '+card['english']+' bedeutet '+card['german']+'.',answerKind='choice',options=options,unit=None)
 candidates=[];meaning={card['german'].lower(), *[a.lower() for a in card['germanAnswers']]}
 for c in pool:
  if c['german'].lower() not in meaning and c['german'] not in candidates:candidates.append(c['german'])
 return choice(f"Was bedeutet {card['english']}?",card['german'],candidates[0],candidates[1],'Ordne das Wort dem Alltagsthema zu.',card['english']+' bedeutet '+card['german']+'. Beispiel: '+card['example'],'Du kannst das Wort später mit seinem Beispielsatz im Vokabeltrainer wiederholen.')

def listening_task(k,l):
 words=['sister','kitchen','school','apple','Monday','eleven','dog','blue','book','chair','water','rain']
 cards=json.loads((ROOT/'src-tauri/content/vocabulary-5-v1.json').read_text())['cards']
 pool=[next(c for c in cards if c['english'].lower()==w.lower()) for w in words];card=pool[k]
 if l==2:
  return dict(prompt='Höre das Wort und seinen Beispielsatz. Schreibe das gehörte englische Wort.',answer=card['english'],hint='Du darfst beide Audios beliebig oft anhören.',furtherHints=['Der Beispielsatz hilft dir bei der Bedeutung und bei ähnlich klingenden Wörtern.'],explanation=card['english']+' bedeutet '+card['german']+'. Beispiel: '+card['example'],answerKind='text',options=[],unit=None,audioCardId=card['id'])
 task=choice('Höre das englische Wort. Welche deutsche Bedeutung passt?',card['german'],pool[(k+1)%12]['german'],pool[(k+2)%12]['german'],'Du darfst das Wort so oft anhören, wie du möchtest.',card['english']+' bedeutet '+card['german']+'.','Vergleiche die angebotenen Bedeutungen. Der Beispielsatz kann dir beim Einordnen helfen.')
 if l==0:task['options']=task['options'][:2]
 task['audioCardId']=card['id'];return task

def expand_word_units(study,by_id):
 if any(u['id']=='english-vocabulary-family' for u in study['units']):return
 daily=next(u for u in study['units'] if u['id']=='english-daily-words');study['units'].remove(daily)
 decks=json.loads((ROOT/'src-tauri/content/vocabulary-5-v1.json').read_text())['decks']
 for deck in decks:
  u=dict(daily,id='english-vocabulary-'+deck['id'],name=deck['name'],goal='Du verstehst und verwendest Wörter zu diesem Thema.',keywords=[deck['name']] + [word for card in json.loads((ROOT/'src-tauri/content/vocabulary-5-v1.json').read_text())['cards'] if card['deckId']==deck['id'] for word in [card['english'],card['german']]],exerciseIds=[],supplements=[dict(kind='vocabulary',label='Diese Wörter im Vokabeltrainer üben',target=deck['id'])]);study['units'].append(u)
 for eid in daily['exerciseIds']:
  e=by_id[eid];deck=e['topicId'].removeprefix('english-')
  if eid in ['by.english.5.hello.3.v1','by.english.5.party.2.v1']:deck='numbers'
  elif e['topicId']=='english-party':deck='calendar'
  next(u for u in study['units'] if u['id']=='english-vocabulary-'+deck)['exerciseIds'].append(eid)
 study['units'].append(dict(daily,id='english-listening',areaId='english-texts',name='Englische Wörter hören',goal='Du erkennst englische Wörter und hörst sie in Beispielsätzen.',curriculumRef='E5 1.1 Hörverstehen; E5 1.2 Aussprache',keywords=['Hören','Hörverstehen','Audio','Aussprache'],exerciseIds=[],supplements=[dict(kind='vocabulary',label='Weitere Wörter im Vokabeltrainer hören',target='all')]))

GOALS = {'math-sets': 'Du erkennst Elemente einer Menge und verwendest ∈ und ∉.', 'math-place-value': 'Du erkennst Stellenwerte und den Wert einzelner Ziffern.', 'math-roman': 'Du liest römische Zahlen und übersetzt sie in unsere Zahlenschreibweise.', 'math-rounding': 'Du rundest Zahlen auf die gefragte Stelle.', 'math-number-line': 'Du liest Zahlen an einer Achse ab und markierst sie.', 'math-integers': 'Du vergleichst ganze Zahlen und bestimmst ihren Abstand zur 0.', 'math-written-add': 'Du addierst und subtrahierst mit Stellenwerten und Überträgen.', 'math-signed-add': 'Du rechnest Plus und Minus auch mit negativen Zahlen.', 'math-add-equations': 'Du findest eine fehlende Zahl mit einer Umkehraufgabe.', 'math-add-strategy': 'Du fasst Zahlen geschickt zusammen und prüfst mit einem Überschlag.', 'math-coordinates': 'Du liest Koordinaten und bestimmst Abstände zwischen Punkten.', 'math-lines': 'Du erkennst Geraden und bestimmst den kürzesten Abstand.', 'math-circles': 'Du vergleichst Radius und Abstand, um die Lage zum Kreis zu bestimmen.', 'math-angles': 'Du erkennst Winkelgrößen und berechnest fehlende Winkel.', 'math-quadrilaterals': 'Du erkennst Vierecke an Seiten und Winkeln.', 'math-written-multiply': 'Du multiplizierst mit passenden Teilprodukten.', 'math-written-divide': 'Du dividierst schriftlich und prüfst mit einer Malrechnung.', 'math-primes': 'Du prüfst Teilbarkeit und zerlegst Zahlen in Primfaktoren.', 'math-counting': 'Du zählst Möglichkeiten mit einer geordneten Liste oder einem Baum.', 'math-signed-multiply': 'Du bestimmst Ergebnis und Vorzeichen einer Mal- oder Geteiltrechnung.', 'math-powers': 'Du verstehst Potenzen als wiederholte Malrechnung.', 'math-squares': 'Du erkennst und berechnest Quadratzahlen bis 400.', 'math-multiply-equations': 'Du findest einen fehlenden Faktor mit einer Umkehraufgabe.', 'math-order': 'Du beachtest Klammern und die Reihenfolge der Rechenarten.', 'math-laws': 'Du nutzt Rechengesetze zum geschickten Rechnen.', 'math-term-structure': 'Du erkennst, wie ein Term aus Rechenarten aufgebaut ist.', 'math-reverse': 'Du machst mehrere Rechenschritte in umgekehrter Reihenfolge rückgängig.', 'math-stories': 'Du findest die passenden Rechnungen zu einer kurzen Geschichte.', 'math-money': 'Du rechnest Geldbeträge zwischen Euro und Cent um.', 'math-length': 'Du wandelst Längen in andere Einheiten um.', 'math-mass': 'Du rechnest Massen zwischen den passenden Einheiten um.', 'math-time': 'Du rechnest mit Stunden, Minuten und Sekunden.', 'math-estimate': 'Du wählst eine passende Einheit und schätzt Alltagsgrößen.', 'math-unitary': 'Du rechnest zuerst auf ein Stück und dann auf die gesuchte Anzahl.', 'math-scale': 'Du rechnest zwischen einer Länge im Plan und der Wirklichkeit um.', 'math-quantities': 'Du bringst Größen in dieselbe Einheit und rechnest dann mit ihnen.', 'math-rectangles': 'Du unterscheidest Umfang und Fläche und berechnest beide.', 'math-area-units': 'Du rechnest Flächen zwischen Einheiten um.', 'math-compound': 'Du zerlegst Flächen oder ziehst ausgeschnittene Flächen ab.', 'math-surface': 'Du berechnest die sechs Außenflächen eines Quaders.', 'english-be': 'Du erzählst, verneinst und fragst mit am, is und are im English Club.', 'english-nouns': 'Du bildest Mehrzahlen und erkennst, wem etwas gehört.', 'english-pronouns': 'Du ersetzt Personen und Dinge durch Pronomen. Begleiter zeigen getrennt, wem etwas gehört.', 'english-prepositions': 'Du beschreibst die Lage mit Wörtern wie in, on und under.', 'english-articles-have': 'Du wählst a oder an und verwendest have got oder has got.', 'english-present': 'Du beschreibst Gewohnheiten im Simple Present und prüfst die Verbform.', 'english-questions': 'Du wählst passende Fragewörter und bildest Fragen.', 'english-progressive': 'Du beschreibst mit be und der -ing-Form, was gerade passiert.', 'english-quantifiers': 'Du unterscheidest zählbare und nicht zählbare Mengen.', 'english-modals': 'Du drückst Können, Müssen und Nicht-Müssen passend aus.', 'english-past': 'Du erzählst von Vergangenem und prüfst die Verbform.', 'english-sentences': 'Du ordnest Wörter und verbindest Aussagen zu Sätzen.', 'english-greetings': 'Du begrüßt andere und bittest höflich um etwas.', 'english-reading': 'Du findest wichtige Angaben in einem kurzen englischen Text.', 'english-culture': 'Du kennst erste Länderinformationen und gibst wichtige Hinweise weiter.', 'english-learning': 'Du probierst Strategien für Wörter, Aussprache und Texte aus.', 'nature-research': 'Du planst faire Vergleiche und trennst Beobachtung und Erklärung.', 'nature-water': 'Du erklärst Stoffzustände und ihre Wechsel mit dem Teilchenmodell.', 'nature-light-energy': 'Du verfolgst Lichtwege und beschreibst Energieumwandlungen.', 'nature-air-materials': 'Du vergleichst Stoffeigenschaften und einfache Untersuchungen.', 'nature-cells': 'Du erkennst wichtige Zellteile und ihre Aufgaben.', 'nature-senses': 'Du verfolgst den Weg von einem Reiz zu einer Reaktion.', 'nature-movement': 'Du erklärst das Zusammenspiel von Knochen, Gelenken und Muskeln.', 'nature-nutrition': 'Du verfolgst den Weg der Nahrung und die Aufgaben der Verdauung.', 'nature-breathing': 'Du unterscheidest Atmung, Bluttransport und Zellatmung.', 'nature-development': 'Du kennst Entwicklungsschritte und respektierst persönliche Grenzen.', 'nature-plants': 'Du erkennst Blütenteile und unterscheidest Bestäubung und Befruchtung.', 'nature-grassland': 'Du untersuchst Lebewesen, Umweltbedingungen und Nutzung einer Wiese.'}

def build():
 catalog_path=ROOT/'src-tauri/content/study-catalog-v1.json'
 study=json.loads(catalog_path.read_text())
 originals=[]
 for name in ['curriculum-v1.json','english-5-v1.json','nature-5-v1.json','nature-nucleus-5-v1.json','number-line-5-v1.json','geography-solar-5-v1.json','geography-earth-5-v1.json']:
  originals+=json.loads((ROOT/'src-tauri/content'/name).read_text())['exercises']
 originals+=json.loads((ROOT/'src-tauri/content/english-club-v1.json').read_text())
 # Rebuilding uses the original navigation assignments and adds the same finite v1 bank.
 for unit in study['units']:unit['exerciseIds']=[id for id in unit['exerciseIds'] if '.focus.' not in id]
 by_id={e['id']:e for e in originals};expand_word_units(study,by_id);new=[]
 cards=json.loads((ROOT/'src-tauri/content/vocabulary-5-v1.json').read_text())['cards']
 for unit in study['units']:
  if unit['id'] in GOALS:unit['goal']=GOALS[unit['id']]
  if unit['id'].startswith('english-vocabulary-'):
   deck=unit['id'].removeprefix('english-vocabulary-')
   terms=[unit['name']]
   for card in cards:
    if card['deckId']==deck:
     terms.extend([card['english'],card['german'],*card.get('englishAnswers',[]),*card.get('germanAnswers',[])])
   unit['keywords']=list(dict.fromkeys(terms))
 for unit in study['units']:
  # The dedicated solar world has exactly one authored riddle per planet/level.
  if unit['subject']=='geography':continue
  # Supplemental club and nucleus questions must not replace historical focus tasks.
  if all(sum(by_id[eid]['difficulty']==level for eid in unit['exerciseIds'] if '.club.' not in eid and '.nucleus.' not in eid)>=12 for level in ['vorschule','koenner','streber']):continue
  exemplar=by_id[unit['exerciseIds'][0]] if unit['exerciseIds'] else dict(topicId=('english-'+unit['id'].removeprefix('english-vocabulary-') if unit['id'].removeprefix('english-vocabulary-') in ['hello','family','home','school','day','friends','shopping','party','past','stories','travel','words'] else 'english-words'))
  key=unit['id'].split('-',1)[1]
  for l,level in enumerate(['vorschule','koenner','streber']):
   for k in range(12):
    if unit['subject']=='mathematics':task=math_task(key,k,l)
    elif unit['id'].startswith('english-vocabulary-'):task=vocabulary_task(unit['id'].removeprefix('english-vocabulary-'),k,l)
    elif unit['id']=='english-listening':task=listening_task(k,l)
    elif unit['subject']=='english':task=english_task(key,k,l)
    else:
     rows=[row.split('|') for row in NATURE[key].strip().split('\n')]
     assert len(rows)==12 and all(len(row)==6 for row in rows),key
     direct,scenario,answer,w1,w2,reason=rows[k]
     prompt=direct if l<2 else scenario
     hint,second = RESEARCH_HINTS[k] if key=='research' else SCIENCE_HINTS[key]
     task=choice(prompt,answer,w1,w2,hint,reason,second)
     if l==0:task['options']=task['options'][:2]
    task=improve_task(unit['id'],k,l,task)
    if unit['id']=='english-present' and task['answerKind']=='text' and task['answer']==VERBS[k][1]:
     task['commonMistakes']=[dict(answers=[VERBS[k][0]],hint='Im bejahten Aussagesatz mit he, she oder it braucht das Verb die Form der dritten Person Einzahl.')]
    if unit['id']=='math-length' and task['answerKind']=='number' and not (l==2 and k%3==1):
     amount=Decimal(k+1+12*l+2)/(10 if l else 1)
     if fmt(amount)!=task['answer']:task['commonMistakes']=[dict(answers=[fmt(amount)],hint='Die Länge bleibt gleich, aber die Maßzahl muss zur neuen Einheit passen. Nutze den Umrechnungsfaktor aus dem Tipp.')]
    # Selected numeric tasks become error detection or selection while preserving exact values.
    if unit['subject']=='mathematics' and task['answerKind']=='number' and k%4==3:
     wrong=Decimal(task['answer'].replace(',','.'))+1
     task['prompt']=f'Fehlerdetektiv: Alex nennt {fmt(wrong)} als Ergebnis. Prüfe selbst.\n'+task['prompt']
    if unit['subject']=='mathematics' and task['answerKind']=='number' and k%4==2:
     ans=Decimal(task['answer'].replace(',','.'));options=[task['answer'],fmt(ans+1),fmt(ans-1)]
     task.update(answerKind='choice',options=options,unit=None)
    if task['answerKind']=='choice' and task.get('commonMistakes'):
     task['commonMistakes']=[m for m in task['commonMistakes'] if all(a in task['options'] for a in m['answers'])]
    # Vary choice order deterministically; the first answer is not always correct.
    if task['options']:
     shift=(k+l)%len(task['options']);task['options']=task['options'][shift:]+task['options'][:shift]
    eid=f"by.{unit['subject']}.5.focus.{key}.{level}.{k+1:02}.v1"
    task.update(id=eid,subject=unit['subject'],topicId=exemplar['topicId'],difficulty=level,competencyId=f"by.{unit['subject']}.5.focus.{key}",legacy=False)
    assert task['answer'] and len(task['answer'])<=120,eid
    assert len(task['options'])==len(set(task['options'])),eid
    new.append(task);unit['exerciseIds'].append(eid)
 (ROOT/'src-tauri/content/topic-practice-v1.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
 catalog_path.write_text(json.dumps(study,ensure_ascii=False,indent=2)+'\n')
 print(len(new),'neue Aufgaben; insgesamt',sum(not e['legacy'] for e in originals)+len(new))
if __name__=='__main__':build()
