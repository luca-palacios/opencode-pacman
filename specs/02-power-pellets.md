# SPEC 02 — Power pellets y fantasmas comestibles

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-20
> **Objetivo:** Añadir cuatro power pellets que permitan a Pac-Man comer fantasmas durante un tiempo limitado.

## Alcance

**Incluye:**

- Cuatro pellets en las casillas `(1,3)`, `(26,3)`, `(1,23)` y `(26,23)`.
- Diez segundos de poder por pellet, medidos en tiempo de juego activo. Recoger otro reinicia el plazo.
- Fantasmas azules y comestibles que intentan alejarse de Pac-Man por rutas transitables, sin invertir el sentido salvo en callejones.
- Al ser comido, cada fantasma vuelve a su posición inicial y permanece inmune durante dos segundos: sigue su IA habitual, no daña ni puede ser comido y se dibuja semitransparente. Después adopta el estado que corresponda al poder vigente.
- Una barra rectangular que se llena al activar el poder y se vacía conforme transcurren los diez segundos.
- 50 puntos por pellet y 200, 400, 800 y 1600 puntos por fantasmas comidos en una misma activación. Un nuevo pellet reinicia la secuencia.
- Victoria al recoger todos los puntos normales **y** pellets.

**Fuera de alcance (para futuras especificaciones):**

- Sonidos, nuevos niveles, persistencia y animación de ojos regresando a la pen.

## Modelo de datos

- `src/js/maze.js`: nuevo valor de casilla `4` para un pellet, distinto del punto normal (`2`).
- `src/js/game.js`: `game.powerUntilMs` indica el fin del poder según `activeTimeMs`; `game.ghostCombo` cuenta los fantasmas comidos desde el último pellet. Cada fantasma incorpora `immuneUntilMs`.
- `game.dotsRemaining` cuenta tanto puntos normales como pellets pendientes. Los valores temporales se reinician al crear una partida; al perder una vida se cancelan el poder y las inmunidades, sin reponer consumibles.

No se guardan datos entre partidas ni sesiones.

## Plan de implementación

1. Representar los cuatro pellets en `src/js/maze.js` y contarlos entre los consumibles necesarios para ganar.
2. Añadir en `src/js/game.js` su recogida, puntuación y plazo de poder usando `activeTimeMs`.
3. Incorporar la huida de fantasmas durante el poder, respetando las reglas de movimiento existentes.
4. Resolver las colisiones, la secuencia de puntos, la reaparición y los dos segundos de inmunidad. Mantener el reinicio de posiciones y cancelar el efecto al perder una vida.
5. Dibujar pellets, estados de los fantasmas y barra de progreso en `src/js/render.js`. Actualizar la instrucción inicial de `src/index.html`.

## Criterios de aceptación

- [ ] Aparecen exactamente cuatro pellets en las casillas indicadas y cada uno se consume una sola vez.
- [ ] Cada pellet suma 50 puntos y activa diez segundos de poder; otro pellet reinicia el plazo y la secuencia de puntos por fantasmas.
- [ ] Mientras el poder está activo, los fantasmas comestibles son azules, intentan alejarse y una colisión no quita vidas.
- [ ] Comer fantasmas consecutivos otorga 200, 400, 800 y 1600 puntos; la secuencia no supera 1600 por fantasma.
- [ ] Un fantasma comido reaparece en su posición inicial, se ve semitransparente y durante dos segundos no daña ni puede ser comido.
- [ ] Al expirar el poder, los fantasmas recuperan su comportamiento y color habituales, salvo los que aún estén en su período de inmunidad.
- [ ] La barra comienza llena con cada pellet y se vacía hasta desaparecer cuando termina el efecto.
- [ ] Perder una vida cancela el poder; los puntos y pellets ya recogidos permanecen consumidos.
- [ ] Solo se gana cuando no queda ningún punto normal ni pellet.
- [ ] `src/index.html` abre sin errores de JavaScript y permite completar una partida.

## Decisiones

- **Sí:** reutilizar `activeTimeMs`; el temporizador no depende del número de fotogramas.
- **Sí:** distinguir pellets dentro de la cuadrícula existente; evita una segunda lista de consumibles.
- **Sí:** reaparición inmediata con inmunidad temporal; evita sumar puntos repetidamente en la pen.
- **No:** conservar el poder al perder una vida ni acumular segundos al recoger otro pellet.

## Riesgos

| Riesgo                                                                                     | Mitigación                                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Una colisión en el mismo fotograma que la recogida podría quitar una vida incorrectamente. | Procesar la recogida antes de resolver colisiones.                 |
| Los pellets podrían no contarse para la victoria.                                          | Contar ambos tipos de consumibles desde el inicio y al recogerlos. |

## Qué **no** incluye esta especificación

No añade sonidos, niveles, persistencia ni la animación de ojos de los fantasmas.
