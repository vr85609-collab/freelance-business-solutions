/* Aqua Arcade bilingual UI: English / Español, including live gameplay text.
   Keeps English source text in a WeakMap to permit instant reversible switching. */
(()=>{
'use strict';
const map=new Map([["/ Play & Win","/ Juega y gana"],["Visit the store ↗","Visitar tienda ↗"],["✨ YOUR MINI GAME BREAK","✨ TU MOMENTO DE JUEGO"],["Short puzzles, clever strategy, and playful brain challenges. Explore at your pace and come back when you feel like it.","Rompecabezas breves, estrategia y retos mentales divertidos. Juega a tu ritmo y vuelve cuando quieras."],["Play today's challenge","Jugar el reto de hoy"],["🎁 Stars & discounts are demos until secure verification is enabled.","🎁 Las estrellas y los descuentos son demostraciones hasta que se active la verificación segura."],["Checking connection…","Comprobando conexión…"],["Install or visit the arcade while online once. After the game files are saved, you can reopen it without internet. Offline progress stays on this device, and offline wins cannot be exchanged for Shopify discounts.","Instala o visita el arcade una vez con internet. Una vez guardados los archivos, puedes abrirlo sin conexión. El progreso sin conexión se guarda en este dispositivo y las victorias sin internet no generan descuentos de Shopify."],["Install app","Instalar aplicación"],["⭐ Total stars","⭐ Estrellas totales"],["🏅 Games finished","🏅 Partidas completadas"],["📅 Days played","📅 Días jugados"],["☀️ Daily brain challenge","☀️ Reto mental diario"],["New today","Nuevo hoy"],["Every day brings a different featured challenge. No penalty if you miss a day.","Cada día hay un reto distinto. No hay penalización por faltar."],["Try daily challenge","Probar reto diario"],["Play it again","Volver a jugar"],["✓ Completed today","✓ Completado hoy"],["Available today","Disponible hoy"],["Choose your game","Elige tu juego"],["Twelve games across six categories. Two choices per category — each made for a quick break.","Doce juegos en seis categorías. Dos por categoría, perfectos para una pausa."],["Bubble Guess","Adivina la burbuja"],["Tic-Tac Tactics","Tres en raya"],["Memory Match","Parejas de memoria"],["Pattern Pulse","Pulso de patrones"],["Light Switch","Apaga las luces"],["Merge 2048","Combina 2048"],["Connect Four","Conecta cuatro"],["Word Recall","Recuerda las palabras"],["Number Sprint","Carrera de números"],["Codebreaker","Descifra el código"],["Slide Puzzle","Rompecabezas deslizante"],["Higher or Lower","Mayor o menor"],["Luck • 10 quick guesses • Demo reward","Suerte • 10 intentos • Premio de demostración"],["Strategy • Outthink the computer","Estrategia • Supera a la computadora"],["Recall • Find eight matching pairs","Memoria • Encuentra ocho parejas"],["Focus • Remember growing patterns","Concentración • Recuerda secuencias"],["Logic • Turn every light off","Lógica • Apaga todas las luces"],["Planning • Combine tiles for a high score","Planificación • Combina fichas"],["Strategy • Four in a row against the computer","Estrategia • Cuatro en línea"],["Memory • Remember five words","Memoria • Recuerda cinco palabras"],["Concentration • Find 1–16 in sequence","Concentración • Del 1 al 16"],["Logic • Deduce the secret combination","Lógica • Descubre la combinación"],["Planning • Put tiles in order","Planificación • Ordena las fichas"],["Luck • Guess the next number","Suerte • Adivina el siguiente número"],["← All games","← Todos los juegos"],["ⓘ How to play & rewards","ⓘ Cómo jugar y premios"],["🎮 How to play","🎮 Cómo jugar"],["🏁 Goal","🏁 Objetivo"],["⭐ Reward","⭐ Premio"],["ⓘ See visual example","ⓘ Ver ejemplo visual"],["ⓘ Info","ⓘ Información"],["GAME GUIDE","GUÍA DEL JUEGO"],["How to play","Cómo jugar"],["👀 See how it works","👀 Mira cómo funciona"],["How to win","Cómo ganar"],["🏆 Rewards","🏆 Premios"],["Close","Cerrar"],["← Previous","← Anterior"],["Next →","Siguiente →"],["🎁 Your rewards","🎁 Tus premios"],["Completing games earns virtual stars. Bubble Guess also shows a 5%, 10%, or 15%","Completar juegos te da estrellas virtuales. Adivina la burbuja también muestra un descuento de demostración del 5 %, 10 % o 15 %"],["discount. These are not actual Shopify codes, cannot be redeemed, and do not represent an active promotion.","de descuento. No son códigos reales de Shopify, no se pueden canjear y no representan una promoción activa."],["Progress is stored in this browser only. Clearing browser data or changing devices may reset it. There are no purchases, loot boxes, surprise paid rewards, or required daily check-ins.","El progreso solo se guarda en este navegador. Si borras los datos o cambias de dispositivo, puede reiniciarse. No hay compras, cajas de botín, premios de pago sorpresa ni obligación de jugar todos los días."],["Built for Aquaemoticons • Take a break whenever you like 💜","Creado para Aquaemoticons • Tómate un descanso cuando quieras 💜"],["Rewards are virtual stars only; discount offers are simulated and cannot be redeemed at Shopify.","Los premios son solo estrellas virtuales; los descuentos son simulados y no se pueden canjear en Shopify."],["Virtual stars have no cash value and are saved only in this browser. Completing today’s featured challenge for the first time also adds 5 bonus stars. All Shopify discounts are DEMOS and cannot be redeemed.","Las estrellas virtuales no tienen valor monetario y solo se guardan en este navegador. Completar por primera vez el reto del día suma 5 estrellas extra. Todos los descuentos son DEMOSTRACIONES y no se pueden canjear."],["🟢 Online · Rewards are demos","🟢 Con conexión · Premios de demostración"],["📴 Offline practice · No redeemable discounts","📴 Juego sin conexión · Sin descuentos canjeables"],["🌙 Dark mode","🌙 Modo oscuro"],["☀️ Light mode","☀️ Modo claro"],["Free Play","Juego libre"],["☀️ Daily Challenge","☀️ Reto diario"],["Need help? Use the visual example below or the ⓘ Info button.","¿Necesitas ayuda? Mira el ejemplo visual o pulsa ⓘ Información."],["Play again","Jugar de nuevo"],["Explore games","Explorar juegos"],["Try again","Intentar de nuevo"],["Retry","Reintentar"],["Check code","Comprobar código"],["Show the five words","Mostrar las cinco palabras"],["Start pattern challenge","Empezar reto de patrones"],["Read the rules above first.","Primero lee las reglas de arriba."],["Ready when you are.","Empieza cuando quieras."],["You will have six seconds to memorize five words.","Tendrás seis segundos para memorizar cinco palabras."],["Watch the pattern...","Observa el patrón..."],["Select the five words you just saw:","Selecciona las cinco palabras que acabas de ver:"],["↑ Move all tiles UP","↑ Mover todas ARRIBA"],["← Move all tiles LEFT","← Mover todas IZQUIERDA"],["↓ Move all tiles DOWN","↓ Mover todas ABAJO"],["→ Move all tiles RIGHT","→ Mover todas DERECHA"],["Every arrow moves ALL tiles. Matching numbers that collide merge together.","Cada flecha mueve TODAS las fichas. Los números iguales que chocan se combinan."],["Strategy","Estrategia"],["Memory","Memoria"],["Concentration","Concentración"],["Logic","Lógica"],["Planning","Planificación"],["Luck","Suerte"]]);
const guide={"bubbles":["Elige una de cuatro burbujas en cada una de las 10 rondas. La burbuja ganadora la selecciona el servidor y cambia en cada ronda.","Termina las 10 rondas. Cada elección acertada suma un punto.","Obtén 5 estrellas más 1 por cada acierto (entre 5 y 15). También verás un descuento de demostración no canjeable: 5 % por 0–3 aciertos, 10 % por 4–6 o 15 % por 7–10. El ejemplo requiere una compra mínima de $25."],"tictac":["Juegas con X y la computadora con O. Pulsa una casilla libre en tu turno.","Consigue tres X en línea horizontal, vertical o diagonal antes que la computadora.","Victoria: 15 estrellas virtuales. Empatar o perder no otorga estrellas."],"connect":["Elige una columna para dejar caer una ficha azul. La computadora coloca fichas moradas. Las fichas caen al espacio libre más bajo.","Conecta cuatro fichas azules en horizontal, vertical o diagonal antes que la computadora.","Victoria: 20 estrellas virtuales. No se obtienen estrellas por empate o derrota."],"memory":["Voltea dos cartas ocultas a la vez. Las parejas iguales permanecen visibles; las distintas vuelven a ocultarse.","Descubre las ocho parejas iguales.","Empiezas con 25 estrellas virtuales por resolverlo en ocho intentos; pierdes una estrella por cada intento adicional, hasta un mínimo de 5."],"recall":["Memoriza cinco palabras durante seis segundos. Cuando desaparezcan, selecciona las mismas cinco entre diez opciones.","Selecciona correctamente las cinco palabras originales.","Memoria perfecta: 18 estrellas virtuales. Una selección incorrecta no da estrellas."],"sequence":["Observa cómo se encienden botones de colores y pulsa los colores en el mismo orden. La secuencia crece cada ronda.","Repite correctamente los cinco niveles.","Completar el nivel cinco: 20 estrellas virtuales. Un error termina el intento sin estrellas."],"focus":["Encuentra los números del 1 al 16 mezclados en el tablero y púlsalos en orden ascendente.","Pulsa todos los números en orden, del 1 al 16.","Completar la secuencia: 20 estrellas virtuales."],"lights":["Pulsa una casilla para cambiar esa luz y las que estén justo arriba, abajo, a la izquierda y a la derecha. Cada pulsación invierte sus estados.","Apaga las 16 luces.","Obtén hasta 34 estrellas virtuales según el número de movimientos, con un mínimo de 5. Cuantos menos movimientos, más estrellas."],"code":["Adivina un código secreto de tres dígitos del 0 al 4; los dígitos pueden repetirse. Cada intento indica cuántos están en la posición correcta y cuántos son correctos pero están en otro lugar.","Descifra el código completo en seis intentos o menos.","Victoria: 23 estrellas al primer intento, y 2 menos por cada intento adicional (13 al sexto). Sin estrellas si no lo resuelves."],"twenty":["Usa una flecha para mover TODAS las fichas a la vez en esa dirección. Los números iguales que chocan se fusionan en una ficha mayor. Aparece una ficha nueva después de un movimiento válido. Los bordes morados indican cambios y el verde muestra la ficha nueva.","Crea una ficha de 2048. La partida termina cuando el tablero se llena y no quedan movimientos.","Llegar a 2048: 35 estrellas virtuales. Si se llena el tablero, una puntuación de 256 o más otorga 10 estrellas."],"slider":["Desliza una ficha numerada hacia el espacio vacío que tenga al lado. Reorganiza el tablero de 3 × 3.","Ordena los números del 1 al 8 y deja el espacio vacío abajo a la derecha.","Obtén entre 7 y 32 estrellas virtuales según tus movimientos. Cuantos menos, mejor."],"higher":["Aparece un número del 1 al 10. Adivina si el siguiente será mayor o menor. Repite durante cinco rondas. Los números iguales cuentan como incorrectos.","Completa cinco predicciones e intenta acertar tantas como puedas.","Obtén 5 estrellas virtuales por completar las rondas y 2 estrellas adicionales por cada acierto (entre 5 y 15)."]};
const scenes={"bubbles":["Paso 1: Elige una de cuatro burbujas.","Paso 2: Un acierto suma un punto. Juega 10 rondas."],"tictac":["Paso 1: Tú colocas X y la computadora O. Intenta formar una línea.","Paso 2: ¡Tres X en diagonal te dan la victoria!"],"connect":["Paso 1: Deja caer una ficha azul en una columna (ejemplo ampliado; el tablero real tiene 7 columnas y 6 filas).","Paso 2: Conecta cuatro fichas azules en cualquier dirección para ganar."],"memory":["Paso 1: Voltea dos cartas a la vez. Este es un ejemplo pequeño; el juego real tiene 16 cartas.","Paso 2: Las parejas iguales quedan visibles. Encuentra las ocho parejas."],"recall":["Paso 1: Lee y memoriza las palabras durante seis segundos (cinco palabras en el juego real).","Paso 2: Elige esas cinco palabras entre diez opciones. Un error termina el intento."],"sequence":["Paso 1: Observa qué botón de color se ilumina primero.","Paso 2: Pulsa los colores en ese orden. Cada nivel añade pasos."],"focus":["Paso 1: Encuentra el número 1 entre las fichas mezcladas.","Paso 2: Pulsa 1, luego 2, y continúa hasta 16."],"lights":["Paso 1: Toca una casilla para cambiar su luz y las cercanas.","Paso 2: Cada toque cambia las luces en forma de cruz. Apaga todas."],"code":["Paso 1: Introduce tres dígitos del 0 al 4.","Paso 2: Las pistas muestran dígitos exactos o mal ubicados. Resuelve en seis intentos."],"twenty":["Paso 1: Cada flecha mueve todas las fichas. No se elige una ficha individual.","Paso 2: Dos fichas iguales se combinan. Sigue hasta llegar a 2048."],"slider":["Paso 1: Toca una ficha junto al espacio vacío.","Paso 2: Ordena los números y deja el espacio vacío al final."],"higher":["Paso 1: Ves el número actual, 5. Adivina si el siguiente será mayor o menor.","Paso 2: El siguiente número es 8; MAYOR fue correcto. Juega cinco rondas."]};
const originals=new WeakMap();
const attrOriginals=new WeakMap();
const localeKey='aqua_arcade_language';
let language='en';
try{const saved=localStorage.getItem(localeKey);if(saved==='en'||saved==='es')language=saved;}catch{}
const patterns=[
[/^Step (\d+) of (\d+)$/,'Paso $1 de $2'],
[/^Today’s pick: (.+)\. /,'Juego de hoy: $1. '],
[/^No penalty for missing a day\.$/,'No hay penalización por faltar.'],
[/^Round (\d+) \/ (\d+)/,'Ronda $1 de $2'],
[/^Level (\d+) \/ (\d+)/,'Nivel $1 de $2'],
[/^Guess (\d+) \/ (\d+)/,'Intento $1 de $2'],
[/^Score: /,'Puntuación: '],
[/^Final score: /,'Puntuación final: '],
[/^Final result: /,'Resultado final: '],
[/^Current number: /,'Número actual: '],
[/^Next number: /,'Siguiente número: '],
[/^Next number was /,'El siguiente número fue '],
[/^Pairs found: /,'Parejas encontradas: '],
[/^Attempts: /,'Intentos: '],
[/^Moves: /,'Movimientos: '],
[/^Lights on: /,'Luces encendidas: '],
[/^Largest tile: /,'Ficha mayor: '],
[/^Best tile: /,'Mejor ficha: '],
[/^You guessed /,'Adivinaste '],
[/^You remembered /,'Recordaste '],
[/^All tiles moved /,'Todas las fichas se movieron '],
[/^No tiles can move /,'Ninguna ficha puede moverse '],
[/^Purple outlines show changes; the green outline marks the NEW tile\./,'Los bordes morados muestran cambios; el verde indica la ficha NUEVA.'],
[/^Round /,'Ronda '],
[/^Starting game\.\.\.$/,'Iniciando juego...'],
[/^Starting Bubble Guess…$/,'Iniciando Adivina la burbuja…'],
[/^Starting /,'Iniciando '],
[/^Need help\?/,'¿Necesitas ayuda?'],
[/^Daily challenge bonus: 5 stars!$/,'¡Bono del reto diario: 5 estrellas!'],
[/^Demo discount: /,'Descuento de demostración: '],
[/^Illustrative /,'Ejemplo: '],
[/^Offline practice/,'Práctica sin conexión'],
[/^Correct!$/,'¡Correcto!'],
[/^Not this time$/,'Esta vez no'],
[/^Wrong$/,'Incorrecto'],
[/^Great memory!$/,'¡Excelente memoria!'],
[/^A hard-fought draw!$/,'¡Empate muy reñido!'],
[/^The computer wins this round\. Try another tactic!$/,'La computadora ganó esta ronda. ¡Prueba otra táctica!'],
[/^The computer connected four first\.$/,'La computadora conectó cuatro primero.'],
[/^It is a draw!$/,'¡Empate!'],
[/^All found!$/,'¡Encontraste todos!'],
[/^Select the five words you just saw:$/,'Selecciona las cinco palabras que acabas de ver:'],
[/^Memorize these five words:$/,'Memoriza estas cinco palabras:'],
[/^Words will hide in 6 seconds\.$/,'Las palabras desaparecerán en 6 segundos.'],
[/^Your turn: repeat /,'Tu turno: repite '],
[/^Not quite! Restart and try a new pattern\.$/,'¡Casi! Reinicia e intenta un patrón nuevo.'],
[/^Select your lucky bubble!$/,'¡Elige tu burbuja de la suerte!'],
[/^The code was /,'El código era '],
[/^The new number is /,'El nuevo número es '],
[/^No moves left\./,'No quedan movimientos.'],
[/^Find (\d+) first\./,'Primero encuentra el $1.'],
[/^Great! Keep going\.$/,'¡Bien! Sigue así.'],
[/^All numbers found in order!$/,'¡Encontraste todos los números en orden!'],
[/^Play (.+)$/,'Jugar: $1'],
[/^Continue playing$/,'Continuar jugando'],
[/^You found /,'Encontraste '],
[/^Challenge complete!$/,'¡Reto completado!']
];
const words=[
[' • Offline practice',' • Práctica sin conexión'],[' • No redeemable discounts',' • Sin descuentos canjeables'],[' • Best tile: ',' • Ficha mayor: '],[' • Largest tile: ',' • Ficha mayor: '],[' • Score: ',' • Puntuación: '],[' • Moves: ',' • Movimientos: '],[' • Attempts: ',' • Intentos: '],[' • Lights on: ',' • Luces encendidas: '],[' correct',' correctos'],[' matched',' acertados'],[' guesses',' intentos'],[' stars',' estrellas'],[' stars!',' estrellas!'],[' attempts',' intentos'],[' levels',' niveles'],[' matching pairs',' parejas iguales'],[' correct!',' acertados!'],[' minimum purchase',' compra mínima'],['Not a redeemable code.','No es un código canjeable.'],['No Shopify coupon or redeemable prize.','Sin cupón de Shopify ni premio canjeable.'],['New today','Nuevo hoy'],['Try daily challenge','Probar reto diario'],['No penalty for missing a day.','No hay penalización por faltar.'],['You can replay whenever you want.','Puedes volver a jugar cuando quieras.'],['✓ Completed today','✓ Completado hoy'],['You can replay','Puedes repetirlo'],['Demo','Demostración'],['correctly','correctamente'],[' right digit/wrong place',' dígito correcto en otra posición'],[' exact',' exactos'],['HIGHER','MAYOR'],['LOWER','MENOR'],['UP','ARRIBA'],['DOWN','ABAJO'],['LEFT','IZQUIERDA'],['RIGHT','DERECHA']
];
function translated(en){
 if(map.has(en))return map.get(en);
 const trimmed=en.trim();
 if(map.has(trimmed))return en.replace(trimmed,map.get(trimmed));
 let s=en;
 for(const [a,b] of patterns)s=s.replace(a,b);
 for(const [a,b] of words)s=s.replaceAll(a,b);
 return s;
}
function textNode(node){
 let en=originals.get(node);
 const value=node.nodeValue;
 if(en===undefined || (value!==en && value!==translated(en))){en=value;originals.set(node,en)}
 const next=language==='es'?translated(en):en;
 if(value!==next)node.nodeValue=next;
}
function attributes(element){
 const names=['aria-label','title','placeholder'];
 let saved=attrOriginals.get(element);
 if(!saved){saved=new Map();attrOriginals.set(element,saved)}
 for(const name of names){
  if(!element.hasAttribute(name))continue;
  const val=element.getAttribute(name),prior=saved.get(name);
  if(prior===undefined||(val!==prior&&val!==translated(prior)))saved.set(name,val);
  const en=saved.get(name),next=language==='es'?translated(en):en;
  if(val!==next)element.setAttribute(name,next);
 }
}
function walk(start){
 if(!start)return;
 if(start.nodeType===3){textNode(start);return}
 if(start.nodeType!==1&&start.nodeType!==9&&start.nodeType!==11)return;
 if(start.nodeType===1)attributes(start);
 const walker=document.createTreeWalker(start,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let n;
 while((n=walker.nextNode())){if(n.nodeType===3)textNode(n);else attributes(n)}
}
const button=document.getElementById('languageToggle');
function updateLabel(){
 document.documentElement.lang=language;
 if(button){button.textContent=language==='es'?'🌐 English':'🌐 Español';button.setAttribute('aria-label',language==='es'?'Switch to English':'Cambiar a español');}
}
function apply(lang){
 language=lang;updateLabel();walk(document.body);
 window.dispatchEvent(new CustomEvent('aqua-language-changed',{detail:{language}}));
}
if(button)button.addEventListener('click',()=>{
 const next=language==='en'?'es':'en';
 try{localStorage.setItem(localeKey,next)}catch{}
 apply(next);
});
const observer=new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='characterData')textNode(record.target);
  else if(record.type==='childList')for(const node of record.addedNodes)walk(node);
 }
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true});
window.AquaLanguage={get language(){return language},translate:translated,guide,scenes};
apply(language);
})();