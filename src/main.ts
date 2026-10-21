
import './style.css';

type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
  moving?: boolean;
  startX?: number;
  range?: number;
  speed?: number;
  phase?: number;
  previousX?: number;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
  phase: number;
};

type Drone = {
  x: number;
  y: number;
  startY: number;
  minX: number;
  maxX: number;
  speed: number;
  phase: number;
};

type Hazard = {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'cone' | 'beam' | 'gap-marker';
};

type Level = {
  name: string;
  subtitle: string;
  accent: string;
  length: number;
  theme: 'day' | 'night';
  description: string;
};

const W = 960;
const H = 540;
const GRAVITY = 0.58;
const GROUND_Y = 445;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('No se encontró el elemento #app en index.html');
}

app.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Las Rapia Aventuras">
        <span class="brand-icon">🍕</span>
        <span>LAS <b>RAPIA</b> AVENTURAS<small>UN REPARTO CONTRA EL RELOJ</small></span>
      </a>
      <div class="top-actions">
        <div class="status-pill"><i></i> ERNESTO EN MISIÓN</div>
        <button class="icon-button" id="sound-button" title="Activar o desactivar sonido" aria-label="Sonido">♫</button>
      </div>
    </header>

    <main class="game-layout">
      <section class="game-column">
        <div class="game-heading">
          <div>
            <span class="eyebrow">UNA ENTREGA ÉPICA • CERO PACIENCIA</span>
            <h1>El último repartidor:<br><span>Las Rapia</span> <em>Aventuras</em></h1>
          </div>
          <div class="level-badge"><span>NIVEL</span><strong id="level-number">1/7</strong></div>
        </div>

        <div class="game-frame">
          <canvas id="game" width="${W}" height="${H}" aria-label="Juego de plataformas de Ernesto"></canvas>

          <div class="hud">
            <div class="hud-card">
              <span>ENERGÍA DE ERNESTO</span>
              <div class="health-track"><div id="health-bar"></div></div>
            </div>
            <div class="hud-card coin-hud"><span>MONEDAS</span><strong>🪙 <b id="coin-count">0</b></strong></div>
            <div class="hud-card mission-hud"><span>OBJETIVO</span><strong id="mission-name">¡Arranca la moto!</strong></div>
          </div>

          <div class="overlay" id="start-overlay">
            <div class="intro-card">
              <span class="intro-sticker">⚡ EL REPARTO MÁS PELIGROSO</span>
              <div class="hero-emoji">🛵🍕</div>
              <span class="eyebrow">EL DESTINO NO ESPERA</span>
              <h2>Ernesto tiene<br>una entrega.</h2>
              <p class="intro-copy">La moto no durará para siempre. Salta, esquiva drones, recoge monedas y llega al noveno piso antes de que el cliente pierda la paciencia.</p>
              <button class="primary-button" id="start-button">COMENZAR AVENTURA <span>→</span></button>
              <small>7 NIVELES · MEJORAS · UNA PIZZA EN PELIGRO</small>
            </div>
          </div>

          <div class="overlay hidden" id="pause-overlay">
            <div class="intro-card">
              <span class="intro-sticker">⏸ PAUSA DE REPARTIDOR</span>
              <h2>Respira, Ernesto.</h2>
              <p class="intro-copy">La pizza puede esperar… bueno, no mucho.</p>
              <button class="primary-button" id="resume-button">CONTINUAR <span>→</span></button>
            </div>
          </div>

          <div class="overlay hidden" id="end-overlay">
            <div class="intro-card">
              <span class="intro-sticker" id="end-sticker">🍕 MISIÓN COMPLETADA</span>
              <div class="hero-emoji" id="end-emoji">🏆</div>
              <h2 id="end-title">¡Entrega completada!</h2>
              <p class="intro-copy" id="end-copy"></p>
              <div class="final-score" id="final-score"></div>
              <button class="primary-button" id="again-button">JUGAR OTRA VEZ <span>↻</span></button>
            </div>
          </div>

          <div class="level-banner hidden" id="level-banner">
            <span id="banner-kicker">NIVEL 1</span>
            <strong id="banner-title">El accidente</strong>
          </div>
        </div>

        <div class="game-controls">
          <div><kbd>A</kbd><kbd>D</kbd><span>MOVERSE</span></div>
          <div><kbd>←</kbd><kbd>→</kbd><span>CORRER</span></div>
          <div><kbd>W</kbd><kbd>↑</kbd><kbd>SPACE</kbd><span>SALTAR / DOBLE SALTO</span></div>
          <div><kbd>ESC</kbd><span>PAUSA</span></div>
          <button class="restart-button" id="restart-button">↻ Reiniciar</button>
        </div>
      </section>

      <aside class="sidebar">
        <section class="side-card story-card">
          <div class="side-title"><span>LA HISTORIA</span><span>✦</span></div>
          <div class="story-illustration">
            <div class="story-city">▥ ▥ ▥ ▥ ▥</div>
            <div class="story-person">🛵</div>
            <div class="story-pizza">🍕</div>
          </div>
          <h3>Un pedido. Siete niveles. Cero excusas.</h3>
          <p>Ernesto salió en moto a entregar una pizza. La moto decidió jubilarse antes que él. Ahora toca correr por toda la ciudad.</p>
          <div class="story-tags"><span>PLATAFORMAS</span><span>MONEDAS</span><span>CAOS</span></div>
        </section>

        <section class="side-card mission-card">
          <div class="side-title"><span>RUTA DE ENTREGA</span><span>⌁</span></div>
          <div class="mission-row"><div class="mission-icon">🛵</div><div><b>El accidente</b><small>La moto no coopera</small></div></div>
          <div class="mission-row"><div class="mission-icon">🏙️</div><div><b>La ciudad</b><small>Tejados, saltos y monedas</small></div></div>
          <div class="mission-row"><div class="mission-icon">🚁</div><div><b>Zona de drones</b><small>Ojos en el cielo</small></div></div>
          <div class="mission-row"><div class="mission-icon">🏗️</div><div><b>Las obras</b><small>¡Cuidado con la grúa!</small></div></div>
          <div class="mission-row"><div class="mission-icon">🌧️</div><div><b>La noche</b><small>La parte difícil empieza aquí</small></div></div>
          <div class="mission-row"><div class="mission-icon">🏢</div><div><b>Piso nueve</b><small>El cliente está esperando</small></div></div>
        </section>

        <section class="side-card shop-card">
          <div class="side-title"><span>RAPIA SHOP</span><span>🛍️</span></div>
          <p class="shop-subtitle">Invierte tus monedas. Ernesto no corre gratis.</p>

          <div class="upgrade-item">
            <div class="upgrade-icon purple">👟</div>
            <div class="upgrade-info"><b>Zapatillas turbo</b><small>Mejor salto y doble salto</small><span id="jump-level">Nivel 0</span></div>
            <button class="buy-button" data-upgrade="jump" id="buy-jump">🪙 10</button>
          </div>

          <div class="upgrade-item">
            <div class="upgrade-icon orange">⚡</div>
            <div class="upgrade-info"><b>Suela supersónica</b><small>Más velocidad al correr</small><span id="speed-level">Nivel 0</span></div>
            <button class="buy-button" data-upgrade="speed" id="buy-speed">🪙 12</button>
          </div>

          <div class="upgrade-item">
            <div class="upgrade-icon green">💚</div>
            <div class="upgrade-info"><b>Casco reforzado</b><small>Más resistencia al daño</small><span id="health-level">Nivel 0</span></div>
            <button class="buy-button" data-upgrade="health" id="buy-health">🪙 15</button>
          </div>
          <p class="shop-message" id="shop-message">¡Recoge monedas para mejorar tu equipo!</p>
        </section>
      </aside>
    </main>

    <footer class="footer"><span>LAS RAPIA AVENTURAS © ERNESTO DELIVERY CORP.</span><span>HECHO CON ☕, TYPESCRIPT Y MUCHA HAMBRE</span></footer>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

const $ = <T extends HTMLElement>(id: string) =>
  document.querySelector<T>(`#${id}`)!;

const levels: Level[] = [
  {
    name: 'El accidente',
    subtitle: '¡Arranca la moto!',
    accent: '#ffbd59',
    length: 2200,
    theme: 'day',
    description: 'Esquiva el tráfico y llega al punto donde la moto se rinde.'
  },
  {
    name: 'Carrera por los tejados',
    subtitle: 'Salta entre edificios',
    accent: '#5ce0c0',
    length: 2400,
    theme: 'day',
    description: 'Tejados, antenas y monedas entre los edificios.'
  },
  {
    name: 'Zona de drones',
    subtitle: '¡Ojos en el cielo!',
    accent: '#9f9aff',
    length: 2600,
    theme: 'day',
    description: 'Esquiva los drones de vigilancia.'
  },
  {
    name: 'Obras peligrosas',
    subtitle: '¡Cuidado con la grúa!',
    accent: '#ffb84f',
    length: 2700,
    theme: 'day',
    description: 'Vigas, grúas y plataformas móviles.'
  },
  {
    name: 'La ciudad bajo la lluvia',
    subtitle: 'El suelo está resbaladizo',
    accent: '#79d9ff',
    length: 2800,
    theme: 'night',
    description: 'La lluvia y la oscuridad complican cada salto.'
  },
  {
    name: 'El salto imposible',
    subtitle: 'No mires hacia abajo',
    accent: '#ff83b5',
    length: 3000,
    theme: 'night',
    description: 'Saltos largos y monedas difíciles de alcanzar.'
  },
  {
    name: '¡La pizza llegó!',
    subtitle: 'Destino: piso nueve',
    accent: '#ffbd59',
    length: 1900,
    theme: 'night',
    description: 'Sube al noveno piso y entrega la pizza.'
  }
];

let levelIndex = 0;
let platforms: Platform[] = [];
let coins: Coin[] = [];
let drones: Drone[] = [];
let hazards: Hazard[] = [];
let cameraX = 0;
let frame = 0;
let lastTime = 0;
let running = false;
let paused = false;
let gameEnded = false;
let gameStarted = false;
let soundEnabled = false;
let bikeIntro = true;
let bikeCrashX = 380;
let bikeCrashTimer = 0;
let bannerTimer = 0;
let messageTimer = 0;
let totalCoins = 0;
let collectedTotal = 0;
let jumpUpgrade = 0;
let speedUpgrade = 0;
let healthUpgrade = 0;
let health = 100;
let invulnerable = 0;
let score = 0;
let rainOffset = 0;
let keys = new Set<string>();

const player = {
  x: 90,
  y: GROUND_Y - 65,
  w: 34,
  h: 61,
  vx: 0,
  vy: 0,
  speed: 4.1,
  jumpPower: 12,
  jumps: 0,
  maxJumps: 2,
  grounded: false,
  facing: 1,
  riding: false,
  ridingTimer: 0
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function showMessage(message: string) {
  $('shop-message').textContent = message;
  messageTimer = 240;
}

function makeLevel(index: number) {
  levelIndex = index;
  const level = levels[index];

  platforms = [];
  coins = [];
  drones = [];
  hazards = [];
  cameraX = 0;
  player.x = 70;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.jumps = 0;
  player.grounded = false;
  player.facing = 1;
  health = Math.min(100, health + 20);
  invulnerable = 90;
  bikeIntro = index === 0;
  bikeCrashTimer = 0;

  // Suelo inicial.
  platforms.push({ x: 0, y: GROUND_Y, w: 390, h: H - GROUND_Y });
  let cursor = 390;

  while (cursor < level.length - 100) {
    const gap = index === 5
      ? randomBetween(95, 145)
      : index === 3
        ? randomBetween(70, 115)
        : randomBetween(55, 105);

    const width = randomBetween(145, 245);
    const raised = index === 5
      ? randomBetween(65, 150)
      : index === 3
        ? randomBetween(25, 100)
        : randomBetween(0, 85);

    cursor += gap;
    const y = clamp(GROUND_Y - raised, 285, GROUND_Y);

    const moving = index === 3 || index === 5
      ? Math.random() < (index === 3 ? 0.5 : 0.32)
      : index === 6 && Math.random() < 0.28;

    const platform: Platform = {
      x: cursor,
      y,
      w: width,
      h: H - y,
      moving,
      startX: cursor,
      previousX: cursor,
      range: moving ? randomBetween(35, 85) : 0,
      speed: moving ? randomBetween(0.012, 0.027) : 0,
      phase: randomBetween(0, Math.PI * 2)
    };

    platforms.push(platform);

    // Monedas sobre las plataformas.
    const coinCount = index === 5 ? 4 : 3;
    for (let i = 0; i < coinCount; i++) {
      coins.push({
        x: cursor + 28 + i * Math.min(42, (width - 45) / coinCount),
        y: y - randomBetween(38, 78),
        collected: false,
        phase: randomBetween(0, Math.PI * 2)
      });
    }

    if (index >= 2 && Math.random() < 0.75) {
      drones.push({
        x: cursor + width * 0.55,
        y: y - randomBetween(80, 140),
        startY: y - randomBetween(80, 140),
        minX: Math.max(0, cursor - 40),
        maxX: cursor + width + 45,
        speed: randomBetween(0.8, 1.45) * (Math.random() < 0.5 ? 1 : -1),
        phase: randomBetween(0, Math.PI * 2)
      });
    }

    if (index === 3) {
      hazards.push({
        x: cursor + width * 0.45,
        y: y - 14,
        w: 24,
        h: 14,
        type: 'cone'
      });
    }

    cursor += width;
  }

  // Plataforma de llegada.
  platforms.push({
    x: level.length - 100,
    y: index === 6 ? 250 : GROUND_Y,
    w: 250,
    h: H - (index === 6 ? 250 : GROUND_Y)
  });

  // Monedas adicionales en puntos elevados.
  for (let i = 0; i < 8; i++) {
    const x = 250 + i * ((level.length - 450) / 8);
    coins.push({
      x,
      y: GROUND_Y - randomBetween(85, 145),
      collected: false,
      phase: randomBetween(0, Math.PI * 2)
    });
  }

  // Nivel final: escaleras que conducen al noveno piso.
  if (index === 6) {
    platforms = platforms.filter(p => p.x < 1150);
    platforms.push({ x: 1150, y: 410, w: 120, h: 130 });
    platforms.push({ x: 1270, y: 375, w: 120, h: 165 });
    platforms.push({ x: 1390, y: 340, w: 120, h: 200 });
    platforms.push({ x: 1510, y: 305, w: 120, h: 235 });
    platforms.push({ x: 1630, y: 270, w: 240, h: 270 });

    for (let i = 0; i < 9; i++) {
      hazards.push({
        x: 1170 + i * 43,
        y: 400 - i * 13,
        w: 12,
        h: 8,
        type: 'gap-marker'
      });
    }
  }

  updateHud();
  $('level-number').textContent = `${index + 1}/7`;
  $('mission-name').textContent = level.subtitle;
  $('banner-kicker').textContent = `NIVEL ${index + 1} / 7`;
  $('banner-title').textContent = level.name;
  $('level-banner').classList.remove('hidden');
  bannerTimer = 150;
}

function updateHud() {
  $('coin-count').textContent = String(totalCoins);
  $('health-bar').style.width = `${health}%`;
  $('level-number').textContent = `${levelIndex + 1}/7`;
  $('mission-name').textContent = levels[levelIndex].subtitle;
  $('jump-level').textContent = `Nivel ${jumpUpgrade}`;
  $('speed-level').textContent = `Nivel ${speedUpgrade}`;
  $('health-level').textContent = `Nivel ${healthUpgrade}`;

  const jumpPrice = 10 + jumpUpgrade * 10;
  const speedPrice = 12 + speedUpgrade * 12;
  const healthPrice = 15 + healthUpgrade * 15;

  $('buy-jump').textContent = `🪙 ${jumpPrice}`;
  $('buy-speed').textContent = `🪙 ${speedPrice}`;
  $('buy-health').textContent = `🪙 ${healthPrice}`;

  $('buy-jump').toggleAttribute('disabled', jumpUpgrade >= 5);
  $('buy-speed').toggleAttribute('disabled', speedUpgrade >= 5);
  $('buy-health').toggleAttribute('disabled', healthUpgrade >= 5);
}

function startGame() {
  gameStarted = true;
  running = true;
  paused = false;
  gameEnded = false;
  $('start-overlay').classList.add('hidden');
  $('pause-overlay').classList.add('hidden');
  $('end-overlay').classList.add('hidden');
  makeLevel(0);
}

function nextLevel() {
  if (levelIndex >= levels.length - 1) {
    finishGame();
    return;
  }

  makeLevel(levelIndex + 1);
}

function finishGame() {
  running = false;
  gameEnded = true;
  $('end-overlay').classList.remove('hidden');
  $('end-sticker').textContent = '🍕 ENTREGA COMPLETADA';
  $('end-emoji').textContent = '🏆';
  $('end-title').textContent = '¡Llegaste al piso nueve!';
  $('end-copy').textContent =
    'Cliente: «El pedido está frío». Ernesto: «Calienta, OP». Ernesto se marcha como una leyenda del delivery.';
  $('final-score').textContent =
    `Puntuación: ${score} · Monedas recogidas: ${collectedTotal}`;
}

function damagePlayer(amount: number) {
  if (invulnerable > 0 || bikeIntro) return;

  health = Math.max(0, health - amount);
  invulnerable = 90;
  player.vy = -5;
  player.vx = -player.facing * 2.5;
  updateHud();

  if (health <= 0) {
    running = false;
    gameEnded = true;
    $('end-overlay').classList.remove('hidden');
    $('end-sticker').textContent = '📦 PEDIDO EN PELIGRO';
    $('end-emoji').textContent = '😵';
    $('end-title').textContent = '¡Ernesto necesita un descanso!';
    $('end-copy').textContent = 'La ciudad ganó esta vez. Recoge monedas, mejora tus zapatillas y vuelve a intentarlo.';
    $('final-score').textContent = `Puntuación: ${score} · Monedas: ${collectedTotal}`;
  }
}

function buyUpgrade(type: string) {
  if (!gameStarted || gameEnded) {
    showMessage('¡Empieza la aventura para usar la tienda!');
    return;
  }

  const config = {
    jump: { price: 10 + jumpUpgrade * 10, level: jumpUpgrade, max: 5 },
    speed: { price: 12 + speedUpgrade * 12, level: speedUpgrade, max: 5 },
    health: { price: 15 + healthUpgrade * 15, level: healthUpgrade, max: 5 }
  } as const;

  if (!(type in config)) return;
  const key = type as keyof typeof config;
  const item = config[key];

  if (item.level >= item.max) {
    showMessage('¡Esta mejora ya está al máximo!');
    return;
  }

  if (totalCoins < item.price) {
    showMessage(`Te faltan ${item.price - totalCoins} monedas. ¡A correr!`);
    return;
  }

  totalCoins -= item.price;

  if (key === 'jump') {
    jumpUpgrade++;
    player.jumpPower = 12 + jumpUpgrade * 1.1;
    showMessage('¡Zapatillas mejoradas! Ahora saltas más alto.');
  } else if (key === 'speed') {
    speedUpgrade++;
    player.speed = 4.1 + speedUpgrade * 0.55;
    showMessage('¡Más velocidad! Ernesto va como una bala.');
  } else {
    healthUpgrade++;
    health = Math.min(100, health + 35);
    showMessage('¡Casco reforzado! Recuperaste energía.');
  }

  updateHud();
}

function drawRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function drawBackground() {
  const isNight = levels[levelIndex].theme === 'night';
  const sky = ctx.createLinearGradient(0, 0, 0, H);

  sky.addColorStop(0, isNight ? '#10152f' : '#65c9f5');
  sky.addColorStop(0.62, isNight ? '#34305d' : '#c0edff');
  sky.addColorStop(1, isNight ? '#181d38' : '#e8f6cf');

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sol o luna.
  ctx.fillStyle = isNight ? '#e5e7ff' : '#ffe39a';
  ctx.beginPath();
  ctx.arc(790, 92, isNight ? 24 : 34, 0, Math.PI * 2);
  ctx.fill();

  if (isNight) {
    ctx.fillStyle = '#171a39';
    ctx.beginPath();
    ctx.arc(800, 82, 21, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 65; i++) {
      const x = (i * 137) % W;
      const y = (i * 53) % 240;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.35 + Math.sin(frame * 0.04 + i) * 0.2;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Nubes.
  if (!isNight) {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 190 - cameraX * 0.12) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = 58 + (i % 3) * 42;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(x, y, 35, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 20, y - 8, 23, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 42, y, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Edificios lejanos con ventanas.
  for (let i = 0; i < 23; i++) {
    const bw = 35 + (i * 19) % 48;
    const bh = 95 + (i * 37) % 140;
    const x = ((i * 54 - cameraX * 0.25) % (W + 90) + W + 90) % (W + 90) - 40;
    const top = GROUND_Y - bh;

    ctx.fillStyle = isNight
      ? (i % 2 ? '#252846' : '#20243e')
      : (i % 2 ? '#86b8d1' : '#6fa4c4');
    ctx.fillRect(x, top, bw, bh);

    for (let wy = top + 12; wy < GROUND_Y - 10; wy += 19) {
      for (let wx = x + 7; wx < x + bw - 5; wx += 13) {
        ctx.fillStyle = isNight
          ? (Math.floor(wx + wy) % 3 ? '#ffd887' : '#393c60')
          : '#e7f6ff';
        ctx.globalAlpha = isNight ? 0.75 : 0.65;
        ctx.fillRect(wx, wy, 5, 7);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Nivel de obras: grúa y andamios.
  if (levelIndex === 3) {
    ctx.save();
    ctx.translate(600 - cameraX * 0.18, 0);
    ctx.strokeStyle = '#ffb84f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 330);
    ctx.lineTo(0, 70);
    ctx.lineTo(170, 70);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(135, 70);
    ctx.lineTo(135, 155);
    ctx.stroke();

    ctx.fillStyle = '#ffcf6b';
    ctx.fillRect(-12, 58, 28, 17);
    ctx.restore();

    ctx.strokeStyle = '#c5c8d4';
    ctx.lineWidth = 3;

    for (let i = 0; i < 4; i++) {
      const x = 100 + i * 220 - cameraX * 0.15;
      ctx.strokeRect(x, 290, 65, 120);
      ctx.beginPath();
      ctx.moveTo(x, 290);
      ctx.lineTo(x + 65, 350);
      ctx.moveTo(x + 65, 290);
      ctx.lineTo(x, 350);
      ctx.stroke();
    }
  }

  // Lluvia nocturna.
  if (isNight) {
    ctx.strokeStyle = '#a4dfff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.34;

    for (let i = 0; i < 100; i++) {
      const x = (i * 79 + rainOffset * 3) % W;
      const y = (i * 47 + rainOffset * 7) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 15);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  // Carteles y farolas.
  for (let i = 0; i < 5; i++) {
    const x = ((i * 255 - cameraX * 0.45) % (W + 120) + W + 120) % (W + 120) - 60;
    ctx.fillStyle = isNight ? '#ff7fb3' : '#f65b55';
    ctx.fillRect(x, 265 + (i % 2) * 25, 55, 22);
    ctx.fillStyle = '#fff5d8';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(i % 2 ? 'PIZZA' : 'RAPIA', x + 6, 280 + (i % 2) * 25);
  }
}

function drawPlatforms() {
  const isNight = levels[levelIndex].theme === 'night';

  for (const p of platforms) {
    const x = p.x - cameraX;
    if (x + p.w < -20 || x > W + 20) continue;

    ctx.fillStyle = isNight ? '#252944' : '#d8e4ee';
    ctx.fillRect(x, p.y, p.w, p.h);

    // Borde de azotea.
    ctx.fillStyle = levels[levelIndex].accent;
    ctx.fillRect(x, p.y, p.w, 6);
    ctx.fillStyle = isNight ? '#48456d' : '#8ca4b9';
    ctx.fillRect(x, p.y + 6, p.w, 5);

    // Ventanas.
    for (let wx = x + 12; wx < x + p.w - 8; wx += 29) {
      for (let wy = p.y + 25; wy < Math.min(H, p.y + 180); wy += 31) {
        const colorIndex = Math.abs(Math.floor(wx + wy)) % 3;
        const colors = isNight
          ? ['#ffd987', '#8a9dca', '#353b60']
          : ['#77c7ef', '#a3e1ff', '#f5fcff'];

        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(wx, wy, 15, 18);
        ctx.fillStyle = isNight ? '#343752' : '#b8d0dc';
        ctx.fillRect(wx + 6, wy, 2, 18);
        ctx.fillRect(wx, wy + 8, 15, 2);
      }
    }

    // Textura de ladrillos.
    ctx.strokeStyle = isNight
      ? 'rgba(164, 172, 220, 0.12)'
      : 'rgba(75, 101, 130, 0.18)';
    ctx.lineWidth = 1;

    for (let by = p.y + 18; by < Math.min(H, p.y + 180); by += 38) {
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x + p.w, by);
      ctx.stroke();
    }

    // Luces de la azotea.
    for (let bx = x + 12; bx < x + p.w - 8; bx += 45) {
      ctx.fillStyle = isNight ? '#7ef4e4' : '#fff4b1';
      ctx.fillRect(bx, p.y + 12, 4, 4);
    }

    // Obras: franjas de seguridad.
    if (levelIndex === 3) {
      ctx.fillStyle = '#ffb84f';
      ctx.fillRect(x + 10, p.y + 16, 23, 5);
      ctx.fillRect(x + 10, p.y + 25, 23, 5);
      ctx.fillStyle = '#3a3544';
      ctx.fillRect(x + 10, p.y + 21, 23, 3);
    }

    // Las plataformas móviles tienen indicadores.
    if (p.moving) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(x + p.w / 2 - 10, p.y - 5, 20, 3);
    }
  }
}

function drawCoin(coin: Coin) {
  if (coin.collected) return;

  const x = coin.x - cameraX;
  const y = coin.y + Math.sin(frame * 0.08 + coin.phase) * 5;
  if (x < -30 || x > W + 30) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(frame * 0.06 + coin.phase) * 0.15);

  ctx.fillStyle = '#ffb938';
  ctx.shadowColor = '#ffbd59';
  ctx.shadowBlur = 13;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff0a7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#8e5c1a';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);

  ctx.restore();
}

function drawDrone(d: Drone) {
  const x = d.x - cameraX;
  if (x < -70 || x > W + 70) return;

  const y = d.y + Math.sin(frame * 0.06 + d.phase) * 14;
  const rotor = Math.sin(frame * 0.6) * 5;

  ctx.save();
  ctx.translate(x, y);

  // Halo del dron.
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#73e8ff';
  ctx.beginPath();
  ctx.ellipse(0, 23, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Brazos.
  ctx.strokeStyle = '#697896';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(-25, -11);
  ctx.moveTo(10, -4);
  ctx.lineTo(25, -11);
  ctx.stroke();

  // Hélices.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 26, -13);
    ctx.rotate(rotor * 0.2);
    ctx.fillStyle = '#d4e5f3';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c8da9';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cuerpo.
  ctx.fillStyle = '#dce7f4';
  ctx.strokeStyle = '#7185a6';
  ctx.lineWidth = 2;
  drawRoundedRect(-18, -10, 36, 23, 8);
  ctx.fill();
  ctx.stroke();

  // Visor.
  ctx.fillStyle = '#263651';
  drawRoundedRect(-11, -5, 22, 10, 4);
  ctx.fill();

  // Sensor rojo.
  ctx.fillStyle = '#ff526f';
  ctx.shadowColor = '#ff526f';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#75f0df';
  ctx.fillRect(-16, 5, 4, 3);
  ctx.fillStyle = '#ffbd59';
  ctx.fillRect(12, 5, 4, 3);

  // Cámara inferior.
  ctx.fillStyle = '#93a7c3';
  ctx.beginPath();
  ctx.arc(0, 15, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawErnesto() {
  const x = player.x - cameraX;
  const y = player.y;

  if (invulnerable > 0 && Math.floor(frame / 5) % 2 === 0) return;

  ctx.save();
  ctx.translate(x + player.w / 2, y);
  ctx.scale(player.facing, 1);

  const runningFast = Math.abs(player.vx) > 0.5 && player.grounded;
  const legSwing = runningFast ? Math.sin(frame * 0.32) * 6 : 0;
  const armSwing = runningFast ? Math.sin(frame * 0.32 + Math.PI) * 5 : 0;

  // Sombra.
  ctx.fillStyle = 'rgba(12, 16, 32, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, player.h + 1, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mochila roja de reparto, siempre visible.
  ctx.save();
  ctx.translate(-13, 18);
  ctx.rotate(runningFast ? Math.sin(frame * 0.32) * 0.05 : 0);

  ctx.fillStyle = '#b82d32';
  drawRoundedRect(-7, 0, 20, 26, 4);
  ctx.fill();

  ctx.fillStyle = '#ef3f45';
  drawRoundedRect(-9, -2, 20, 25, 4);
  ctx.fill();

  // Tapa de la mochila.
  ctx.fillStyle = '#ff6464';
  ctx.beginPath();
  ctx.moveTo(-8, 3);
  ctx.lineTo(0, -3);
  ctx.lineTo(11, 3);
  ctx.lineTo(11, 7);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();

  // R blanca inspirada en la caja de reparto.
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 2, 14);

  // Correas.
  ctx.strokeStyle = '#8f262d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.lineTo(-3, 21);
  ctx.stroke();

  ctx.restore();

  // Piernas con pantalón oscuro.
  ctx.strokeStyle = '#202b43';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 44);
  ctx.lineTo(-5 + legSwing, 55);
  ctx.lineTo(-7 + legSwing, 58);
  ctx.moveTo(5, 44);
  ctx.lineTo(6 - legSwing, 55);
  ctx.lineTo(9 - legSwing, 58);
  ctx.stroke();

  // Zapatillas.
  ctx.fillStyle = jumpUpgrade > 0 ? '#ffcc67' : '#f0f2f8';
  drawRoundedRect(-14 + legSwing, 54, 13, 6, 3);
  ctx.fill();
  drawRoundedRect(3 - legSwing, 54, 13, 6, 3);
  ctx.fill();

  // Brazo trasero.
  ctx.strokeStyle = '#d98f6c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-7, 24);
  ctx.lineTo(-12 - armSwing, 36);
  ctx.stroke();

  // Torso: uniforme rojo.
  ctx.fillStyle = '#f04445';
  drawRoundedRect(-10, 15, 21, 30, 6);
  ctx.fill();

  // Costura reflectante.
  ctx.fillStyle = '#ffb9a4';
  ctx.fillRect(-8, 35, 17, 3);

  // Cuello.
  ctx.fillStyle = '#d98f6c';
  ctx.fillRect(-3, 11, 8, 8);

  // Brazo delantero.
  ctx.strokeStyle = '#d98f6c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(8, 23);
  ctx.lineTo(12 + armSwing, 33);
  ctx.stroke();

  // Mano.
  ctx.fillStyle = '#e9ad88';
  ctx.beginPath();
  ctx.arc(12 + armSwing, 34, 4, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza.
  ctx.fillStyle = '#e8ad87';
  ctx.beginPath();
  ctx.arc(1, 9, 10, 0, Math.PI * 2);
  ctx.fill();

  // Oreja.
  ctx.beginPath();
  ctx.arc(10, 10, 3, 0, Math.PI * 2);
  ctx.fill();

  // Casco rojo de repartidor.
  ctx.fillStyle = '#e72e3e';
  ctx.beginPath();
  ctx.arc(1, 5, 11, Math.PI, Math.PI * 2);
  ctx.lineTo(12, 7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff6c71';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 5, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Visera.
  ctx.fillStyle = '#b92535';
  drawRoundedRect(3, 5, 12, 3, 2);
  ctx.fill();

  // Ojo y sonrisa.
  ctx.fillStyle = '#30283a';
  ctx.beginPath();
  ctx.arc(6, 10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8e463b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(5, 13, 3, 0.15, 1.3);
  ctx.stroke();

  ctx.restore();
}

function drawBike() {
  const x = player.x - cameraX;
  const y = GROUND_Y - 20 + Math.sin(frame * 0.35) * 1.5;

  ctx.save();
  ctx.translate(x, y);

  // Ruedas gruesas de moto lineal.
  for (const wx of [10, 55]) {
    ctx.fillStyle = '#101522';
    ctx.beginPath();
    ctx.arc(wx, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#9da9bf';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wx, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffbd59';
    ctx.beginPath();
    ctx.arc(wx, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chasis.
  ctx.strokeStyle = '#e5edf6';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(25, -16);
  ctx.lineTo(39, 0);
  ctx.lineTo(10, 0);
  ctx.moveTo(25, -16);
  ctx.lineTo(55, 0);
  ctx.moveTo(39, 0);
  ctx.lineTo(48, -20);
  ctx.stroke();

  // Motor.
  ctx.fillStyle = '#f05b4e';
  drawRoundedRect(25, -13, 21, 14, 4);
  ctx.fill();

  ctx.fillStyle = '#b9c5d4';
  ctx.fillRect(29, -9, 12, 3);

  // Escape.
  ctx.fillStyle = '#a9b6c7';
  ctx.fillRect(31, 2, 17, 4);

  // Asiento.
  ctx.fillStyle = '#272b3c';
  drawRoundedRect(18, -24, 23, 6, 3);
  ctx.fill();

  // Depósito.
  ctx.fillStyle = '#ff5d50';
  drawRoundedRect(23, -30, 19, 12, 5);
  ctx.fill();

  // Manillar.
  ctx.strokeStyle = '#d8e3f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, -20);
  ctx.lineTo(53, -28);
  ctx.lineTo(61, -28);
  ctx.stroke();

  // Faro.
  ctx.fillStyle = '#fff3b5';
  ctx.shadowColor = '#fff3b5';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(58, -19, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ernesto inclinado hacia delante.
  ctx.fillStyle = '#f04445';
  drawRoundedRect(24, -43, 14, 18, 5);
  ctx.fill();

  ctx.fillStyle = '#e8ad87';
  ctx.beginPath();
  ctx.arc(32, -47, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e72e3e';
  ctx.beginPath();
  ctx.arc(32, -50, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(42, -48);
  ctx.lineTo(23, -48);
  ctx.closePath();
  ctx.fill();

  // Caja de reparto roja.
  ctx.fillStyle = '#e72e3e';
  drawRoundedRect(14, -44, 14, 17, 3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('R', 21, -32);

  ctx.restore();
}

function drawHazards() {
  for (const h of hazards) {
    const x = h.x - cameraX;
    if (x + h.w < -20 || x > W + 20) continue;

    if (h.type === 'cone') {
      ctx.fillStyle = '#ff984e';
      ctx.beginPath();
      ctx.moveTo(x + h.w / 2, h.y - h.h);
      ctx.lineTo(x + h.w, h.y + h.h);
      ctx.lineTo(x, h.y + h.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff0d0';
      ctx.fillRect(x + 5, h.y + 1, h.w - 10, 4);
    } else {
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(x, h.y, h.w, h.h);
    }
  }
}

function update(delta: number) {
  if (!running || paused || gameEnded) return;

  frame += delta;
  rainOffset += delta;
  if (invulnerable > 0) invulnerable -= delta;
  if (bannerTimer > 0) {
    bannerTimer -= delta;
    if (bannerTimer <= 0) $('level-banner').classList.add('hidden');
  }
  if (messageTimer > 0) {
    messageTimer -= delta;
    if (messageTimer <= 0) {
      $('shop-message').textContent = '¡Recoge monedas para mejorar tu equipo!';
    }
  }

  // La moto avanza durante la introducción del primer nivel.
  if (bikeIntro && levelIndex === 0) {
    player.x += 2.7 * delta;
    player.y = GROUND_Y - player.h;
    player.vx = 0;

    if (player.x >= bikeCrashX) {
      bikeIntro = false;
      bikeCrashTimer = 75;
      player.x = bikeCrashX;
      player.vy = -5;
      player.vx = 1.5;
      showMessage('¡La moto perdió una rueda! Toca correr.');
    }

    cameraX = Math.max(0, player.x - 220);
    if (bikeCrashTimer > 0) bikeCrashTimer -= delta;
    return;
  }

  const left = keys.has('arrowleft') || keys.has('a');
  const right = keys.has('arrowright') || keys.has('d');

  if (left) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (right) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.78;
  }

  player.x += player.vx * delta;
  player.x = Math.max(0, player.x);

  // Actualiza plataformas móviles.
  for (const p of platforms) {
    if (!p.moving) continue;

    p.previousX = p.x;
    p.x = (p.startX ?? p.x) +
      Math.sin(frame * (p.speed ?? 0.02) + (p.phase ?? 0)) * (p.range ?? 0);
  }

  // Gravedad y colisiones.
  const oldBottom = player.y + player.h;
  player.vy += GRAVITY * delta;
  player.y += player.vy * delta;
  player.grounded = false;

  for (const p of platforms) {
    const horizontal = player.x + player.w > p.x &&
      player.x < p.x + p.w;
    const newBottom = player.y + player.h;

    if (
      horizontal &&
      player.vy >= 0 &&
      oldBottom <= p.y + 10 &&
      newBottom >= p.y &&
      newBottom <= p.y + 24
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
      player.jumps = 0;

      // Acompaña a Ernesto cuando aterriza en una plataforma móvil.
      if (p.moving) {
        player.x += p.x - (p.previousX ?? p.x);
      }
    }
  }

  // Monedas.
  for (const coin of coins) {
    if (coin.collected) continue;

    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;

    if (Math.abs(dx) < 22 && Math.abs(dy) < 30) {
      coin.collected = true;
      totalCoins += 1;
      collectedTotal += 1;
      score += 100;
      updateHud();
    }
  }

  // Drones con patrulla horizontal.
  for (const d of drones) {
    d.x += d.speed * delta;

    if (d.x < d.minX || d.x > d.maxX) {
      d.speed *= -1;
    }

    const droneY = d.y + Math.sin(frame * 0.06 + d.phase) * 14;
    const hit = player.x + player.w > d.x - 20 &&
      player.x < d.x + 20 &&
      player.y + player.h > droneY - 14 &&
      player.y < droneY + 15;

    if (hit) damagePlayer(18);
  }

  // Los conos y vigas del nivel de obras.
  for (const h of hazards) {
    if (h.type !== 'cone') continue;

    const hit = player.x + player.w > h.x &&
      player.x < h.x + h.w &&
      player.y + player.h > h.y - h.h &&
      player.y < h.y + h.h;

    if (hit) damagePlayer(10);
  }

  // Caer por un hueco.
  if (player.y > H + 80) {
    damagePlayer(35);
    player.x = Math.max(0, player.x - 100);
    player.y = GROUND_Y - player.h - 25;
    player.vy = -2;
  }

  // Cámara que sigue al jugador.
  cameraX = clamp(player.x - 245, 0, levels[levelIndex].length - W + 150);

  // Final del nivel.
  if (player.x > levels[levelIndex].length - 80) {
    if (levelIndex === 6) {
      finishGame();
    } else {
      nextLevel();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawPlatforms();
  drawHazards();

  for (const coin of coins) drawCoin(coin);
  for (const drone of drones) drawDrone(drone);

  if (bikeIntro && levelIndex === 0) {
    drawBike();
  } else {
    drawErnesto();
  }

  // Cartel de destino del último nivel.
  if (levelIndex === 6) {
    const doorX = 1680 - cameraX;

    if (doorX > -80 && doorX < W + 80) {
      ctx.fillStyle = '#3b3154';
      ctx.fillRect(doorX, 185, 75, 85);

      ctx.fillStyle = '#ffcc78';
      ctx.fillRect(doorX + 10, 195, 55, 65);

      ctx.fillStyle = '#423550';
      ctx.fillRect(doorX + 15, 200, 45, 55);

      ctx.fillStyle = '#fff2c8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PISO 9', doorX + 37, 177);

      ctx.font = '20px sans-serif';
      ctx.fillText('🍕', doorX + 37, 230);
    }
  }
}

function loop(timestamp: number) {
  const delta = lastTime === 0 ? 1 : Math.min((timestamp - lastTime) / 16.67, 2);
  lastTime = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(loop);
}

function jump() {
  if (!running || paused || gameEnded || bikeIntro) return;

  if (player.jumps < player.maxJumps) {
    player.vy = -(player.jumpPower - (player.jumps > 0 ? 0.6 : 0));
    player.jumps++;
    player.grounded = false;
  }
}

function togglePause() {
  if (!gameStarted || gameEnded) return;

  paused = !paused;
  $('pause-overlay').classList.toggle('hidden', !paused);
}

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();

  if (['arrowleft', 'arrowright', 'arrowup', ' '].includes(key)) {
    event.preventDefault();
  }

  if (key === 'escape') {
    togglePause();
    return;
  }

  if (
    ['arrowup', 'w', ' '].includes(key) &&
    !keys.has(key)
  ) {
    jump();
  }

  keys.add(key);
});

window.addEventListener('keyup', event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
});

$('start-button').addEventListener('click', startGame);
$('resume-button').addEventListener('click', togglePause);
$('again-button').addEventListener('click', () => {
  totalCoins = 0;
  collectedTotal = 0;
  jumpUpgrade = 0;
  speedUpgrade = 0;
  healthUpgrade = 0;
  health = 100;
  score = 0;
  player.speed = 4.1;
  player.jumpPower = 12;
  updateHud();
  startGame();
});

$('restart-button').addEventListener('click', () => {
  if (gameStarted) {
    makeLevel(levelIndex);
    running = true;
    paused = false;
    gameEnded = false;
    $('pause-overlay').classList.add('hidden');
    $('end-overlay').classList.add('hidden');
  }
});

document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button => {
  button.addEventListener('click', () => {
    buyUpgrade(button.dataset.upgrade ?? '');
  });
});

$('sound-button').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  $('sound-button').classList.toggle('sound-active', soundEnabled);
  $('sound-button').textContent = soundEnabled ? '♫' : '♪';
  showMessage(
    soundEnabled
      ? 'Sonido visual activado. Próximamente: efectos de audio.'
      : 'Sonido desactivado.'
  );
});

updateHud();
draw();
requestAnimationFrame(loop);
