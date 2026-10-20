// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const GHOST_MODE_DURATION_MS = 5000;
const POWER_DURATION_MS = 10000;
const SHY_SCATTER_DISTANCE = 8;
const GHOST_SCATTER_TARGETS = {
  alternator: { x: 1, y: 1 },
  shy: { x: 26, y: 1 },
};

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 || v === 4 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    activeTimeMs: 0,
    powerUntilMs: 0,
    ghostCombo: 0,
    dotsRemaining: dots,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function normalizeTunnelPosition( grid, x, y ) {
  if ( y === TUNNEL_ROW && x < 0 ) x += grid[ 0 ].length;
  else if ( y === TUNNEL_ROW && x >= grid[ 0 ].length ) x -= grid[ 0 ].length;
  return { x, y };
}

function getNeighbors( grid, x, y, actor ) {
  const neighbors = [];
  for ( const [ dir, delta ] of Object.entries( DIRS ) ) {
    if ( !canMove( grid, x, y, dir, actor ) ) continue;
    const next = normalizeTunnelPosition( grid, x + delta.x, y + delta.y );
    neighbors.push( { ...next, dir } );
  }
  return neighbors;
}

function tileKey( x, y ) {
  return `${x},${y}`;
}

function findPath( grid, start, target, actor ) {
  const startX = Math.round( start.x );
  const startY = Math.round( start.y );
  const normalizedTarget = normalizeTunnelPosition( grid, Math.round( target.x ), Math.round( target.y ) );
  const targetX = normalizedTarget.x;
  const targetY = normalizedTarget.y;
  if ( isWall( grid, targetX, targetY, actor ) ) return null;

  const startKey = tileKey( startX, startY );
  const targetKey = tileKey( targetX, targetY );
  const queue = [ { x: startX, y: startY } ];
  const visited = new Set( [ startKey ] );
  const previous = new Map();

  for ( let index = 0; index < queue.length; index++ ) {
    const current = queue[ index ];
    const currentKey = tileKey( current.x, current.y );
    if ( currentKey === targetKey ) break;

    for ( const neighbor of getNeighbors( grid, current.x, current.y, actor ) ) {
      const nextKey = tileKey( neighbor.x, neighbor.y );
      if ( visited.has( nextKey ) ) continue;
      visited.add( nextKey );
      previous.set( nextKey, { key: currentKey, dir: neighbor.dir } );
      queue.push( { x: neighbor.x, y: neighbor.y } );
    }
  }

  if ( !visited.has( targetKey ) ) return null;

  const path = [];
  for ( let key = targetKey; key !== startKey; ) {
    const step = previous.get( key );
    path.push( step.dir );
    key = step.key;
  }
  return path.reverse();
}

function findClosestReachableTile( grid, start, target, actor ) {
  const startX = Math.round( start.x );
  const startY = Math.round( start.y );
  const normalizedTarget = normalizeTunnelPosition( grid, Math.round( target.x ), Math.round( target.y ) );
  const targetX = normalizedTarget.x;
  const targetY = normalizedTarget.y;
  const queue = [ { x: startX, y: startY } ];
  const visited = new Set( [ tileKey( startX, startY ) ] );
  let closest = queue[ 0 ];
  let closestDistance = Infinity;

  for ( let index = 0; index < queue.length; index++ ) {
    const current = queue[ index ];
    const horizontalDistance = Math.abs( current.x - targetX );
    const wrappedDistance = current.y === TUNNEL_ROW && targetY === TUNNEL_ROW
      ? Math.min( horizontalDistance, grid[ 0 ].length - horizontalDistance )
      : horizontalDistance;
    const distance = wrappedDistance + Math.abs( current.y - targetY );
    if ( distance < closestDistance ) {
      closest = current;
      closestDistance = distance;
    }

    for ( const neighbor of getNeighbors( grid, current.x, current.y, actor ) ) {
      const key = tileKey( neighbor.x, neighbor.y );
      if ( visited.has( key ) ) continue;
      visited.add( key );
      queue.push( { x: neighbor.x, y: neighbor.y } );
    }
  }

  return closest;
}

function chooseDirectionToward( grid, g, target, choices ) {
  let best = choices[ 0 ];
  let bestDistance = Infinity;
  for ( const dir of choices ) {
    const delta = DIRS[ dir ];
    const next = normalizeTunnelPosition( grid, g.x + delta.x, g.y + delta.y );
    const path = findPath( grid, next, target, 'ghost' );
    if ( path && path.length < bestDistance ) {
      bestDistance = path.length;
      best = dir;
    }
  }
  return best;
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Recoger consumibles antes de resolver colisiones.
    const tile = grid[ p.y ][ p.x ];
    if ( tile === 2 || tile === 4 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += tile === 4 ? 50 : 10;
      game.dotsRemaining--;
      if ( tile === 4 ) {
        game.powerUntilMs = game.activeTimeMs + POWER_DURATION_MS;
        game.ghostCombo = 0;
      }
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  if ( g.kind === 'hunter' ) {
    const target = { x: Math.round( p.x ), y: Math.round( p.y ) };
    g.dir = chooseDirectionToward( grid, g, target, choices );
  } else if ( g.kind === 'ambusher' ) {
    const direction = DIRS[ p.dir ];
    const target = normalizeTunnelPosition( grid,
      Math.round( p.x ) + direction.x * 4,
      Math.round( p.y ) + direction.y * 4
    );
    const reachableTarget = findPath( grid, g, target, 'ghost' )
      ? target
      : findClosestReachableTile( grid, g, target, 'ghost' );
    g.dir = chooseDirectionToward( grid, g, reachableTarget, choices );
  } else if ( g.kind === 'alternator' ) {
    const mode = Math.floor( ( game.activeTimeMs || 0 ) / GHOST_MODE_DURATION_MS ) % 2;
    const target = mode === 0
      ? { x: Math.round( p.x ), y: Math.round( p.y ) }
      : GHOST_SCATTER_TARGETS.alternator;
    g.dir = chooseDirectionToward( grid, g, target, choices );
  } else if ( g.kind === 'shy' ) {
    const pacmanPosition = { x: Math.round( p.x ), y: Math.round( p.y ) };
    const path = findPath( grid, g, pacmanPosition, 'ghost' );
    const target = path && path.length > SHY_SCATTER_DISTANCE
      ? pacmanPosition
      : GHOST_SCATTER_TARGETS.shy;
    g.dir = chooseDirectionToward( grid, g, target, choices );
  } else {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
  }
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
