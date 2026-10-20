# SPEC 01 — Cuatro fantasmas con comportamientos distintos

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-20
> **Objetivo:** Incorporar cuatro fantasmas que recorran el laberinto con estrategias diferentes, incluido uno que persiga agresivamente a Pac-Man.

## Alcance

**Incluye:**

- Cuatro fantasmas desde el inicio de cada partida y después de perder una vida.
- Un comportamiento propio para cada fantasma:
  - El rojo persigue la posición actual de Pac-Man mediante rutas cortas transitables.
  - El rosa apunta a cuatro casillas por delante de Pac-Man.
  - El cian alterna cada cinco segundos de juego activo entre perseguir y dispersarse hacia una esquina asignada.
  - El naranja persigue si está a más de ocho pasos por el laberinto y se dispersa hacia otra esquina asignada si está a ocho pasos o menos.
- Elección de rutas que respete paredes, la puerta de la zona inicial y el túnel.

**Fuera de alcance (para futuras especificaciones):**

- Poderes, nuevas fases o mecánicas adicionales.
- Cambios de puntuación, vidas o condiciones de victoria y derrota.
- Ajustes de velocidad para hacer más agresivo al perseguidor.

## Modelo de datos

Cada elemento de `GHOST_STARTS` en `src/js/maze.js` tendrá una posición distinta y uno de estos valores `kind`: `hunter`, `ambusher`, `alternator` o `shy`. Los elementos de `game.ghosts` en `src/js/game.js` conservarán `x`, `y`, `dir`, `speed` y `kind`. La partida añadirá `activeTimeMs`, el tiempo acumulado en milisegundos mientras está activa. El cian determinará su modo a partir de ese tiempo, sin guardar un modo duplicado. Los cuatro colores de `src/js/render.js` seguirán el orden de `GHOST_STARTS`.

## Plan de implementación

1. Definir cuatro posiciones iniciales distintas en `src/js/maze.js` y actualizar `src/js/game.js` para crear y reiniciar cuatro fantasmas. Verificación manual: iniciar una partida y comprobar que los cuatro aparecen.
2. Añadir en `src/js/game.js` búsqueda de rutas por casillas transitables, que trate los extremos del túnel como conectados y pueda hallar rutas a través de la puerta para los fantasmas. Verificación manual: comprobar que el movimiento no atraviesa paredes y que el túnel sigue conectando ambos lados.
3. Asignar el comportamiento `hunter` al fantasma rojo y hacer que elija la ruta transitable más corta hasta Pac-Man en los cruces. Mantener la regla actual de evitar giros de 180° salvo en callejones.
4. Asignar `ambusher` al fantasma rosa para que apunte cuatro casillas por delante de Pac-Man. Si el objetivo no es transitable o alcanzable, usar la casilla transitable alcanzable más cercana.
5. Asignar `alternator` al cian y `shy` al naranja. El cian alternará entre persecución y dispersión cada cinco segundos activos. El naranja perseguirá a más de ocho pasos y se dispersará a ocho pasos o menos. Asignarles esquinas distintas.
6. Actualizar `src/js/main.js` para acumular el tiempo activo en milisegundos y `src/js/render.js` para mostrar cuatro colores distintos. Verificación manual: jugar, perder una vida y confirmar que los cuatro reaparecen y mantienen sus comportamientos.

## Criterios de aceptación

- [ ] Al iniciar una partida y después de perder una vida hay exactamente cuatro fantasmas en posiciones iniciales distintas.
- [ ] El fantasma rojo elige una ruta transitable más corta hacia la posición actual de Pac-Man, sin invertir el sentido fuera de un callejón.
- [ ] El fantasma rosa apunta a una posición cuatro casillas delante de Pac-Man y usa un objetivo transitable alcanzable cuando su objetivo inicial no es válido.
- [ ] El fantasma cian cambia entre persecución y dispersión cada cinco segundos de juego activo.
- [ ] El fantasma naranja se dispersa cuando está a ocho pasos o menos de Pac-Man y lo persigue cuando está a más de ocho pasos.
- [ ] Ningún fantasma atraviesa paredes y todos pueden atravesar la puerta y usar el túnel.
- [ ] Los cuatro fantasmas se distinguen por color y conservan las reglas actuales de colisión y pérdida de vidas.
- [ ] `src/index.html` carga sin errores de JavaScript y permite jugar.

## Decisiones

- **Sí:** usar cuatro estrategias distintas para que los comportamientos sean reconocibles y verificables.
- **Sí:** usar rutas por el laberinto para el perseguidor agresivo; la distancia en línea recta puede elegir mal en los cruces.
- **No:** aumentar la velocidad del perseguidor; la agresividad vendrá de sus decisiones de ruta.
- **No:** escalonar las salidas ni añadir mecánicas; los cuatro fantasmas aparecerán juntos y las reglas existentes se mantienen.

## Riesgos

| Riesgo                                                                                   | Mitigación                                                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| La zona inicial y el túnel pueden provocar rutas incorrectas o bloqueadas.               | Incluir la puerta y la conexión del túnel en la búsqueda de rutas y verificar manualmente ambos casos. |
| Los objetivos de anticipación o dispersión podrían quedar en paredes o ser inaccesibles. | Ajustar esos objetivos a una casilla transitable alcanzable antes de elegir el siguiente movimiento.   |

## Qué **no** incluye esta especificación

- Poderes, fases nuevas ni mecánicas adicionales.
- Cambios en puntuación, vidas o condiciones de victoria y derrota.
- Cambios de velocidad para los fantasmas.
