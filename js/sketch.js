// Logique conservée dans le paradigme steering du zip source:
// forces composées, applyForce, seek/flee/pursue/evade/arrive/wander/follow/avoid.
let snake;
let obstacles = [];
let grassPatches = [];
let pathLoop;
let wanderPreys = [];
let rarePreys = [];
let hunters = [];
let patrols = [];
let state = 'intro';
const targetScore = 18;
let roundPauseFrames = 0;
const ROUND_PAUSE_DURATION = 120;
let invincibilityEnabled = false;
let optionsMenuStateBeforeOpen = 'play';
let tuning = {
  snakeSpeedMult: 1,
  enemySpeedMult: 1,
  foodTarget: 10,
  rareFoodTarget: 4,
  scoreMult: 1,
  gameSpeed: 1
};
let simulationAccumulator = 0;

function allPreys() {
  return [...wanderPreys, ...rarePreys];
}

function allEnemies() {
  return [...hunters, ...patrols];
}

function resetActors() {
  wanderPreys = [];
  rarePreys = [];
  hunters = [];
  patrols = [];
}

function updateAmbientActors() {
  for (const prey of wanderPreys) prey.behave(obstacles);
  for (const prey of rarePreys) prey.behave(snake, obstacles);
  for (const enemy of hunters) enemy.behave(snake, obstacles);
  for (const enemy of patrols) enemy.behave(snake, obstacles);
}

function showActors() {
  for (const prey of wanderPreys) prey.show();
  for (const prey of rarePreys) prey.show();
  for (const enemy of hunters) enemy.show();
  for (const enemy of patrols) enemy.show();
  snake.show();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();
}

function initGame() {
  snake = new Snake(width * 0.18, height * 0.5, 5);
  initRound();
  state = 'intro';
  roundPauseFrames = 0;
  simulationAccumulator = 0;
  invincibilityEnabled = false;
}

function initRound() {
  snake.resetPosition();
  obstacles = createObstacles();
  grassPatches = createGrassPatches();
  pathLoop = createPatrolPath();
  resetActors();

  for (let i = 0; i < tuning.foodTarget; i++) wanderPreys.push(spawnWanderPrey());
  for (let i = 0; i < tuning.rareFoodTarget; i++) rarePreys.push(spawnRarePrey());
  hunters.push(new HunterEnemy(width * 0.9, height * 0.18));
  patrols.push(new PatrolEnemy(width * 0.22, height * 0.14, pathLoop));
  patrols.push(new PatrolEnemy(width * 0.78, height * 0.84, pathLoop));
}

function startRoundPause() {
  initRound();
  state = 'roundIntro';
  roundPauseFrames = ROUND_PAUSE_DURATION;
}

function draw() {
  drawBackground();
  drawArenaFrame();
  if (pathLoop && Vehicle.debug) pathLoop.display();
  grassPatches.forEach(g => g.show());
  obstacles.forEach(o => o.show());

  const simRate = constrain(tuning.gameSpeed, 0.5, 2.4);
  simulationAccumulator += simRate;
  while (simulationAccumulator >= 1) {
    simulateStep();
    simulationAccumulator -= 1;
  }

  showActors();

  drawMouseCursor();
  drawHud();
  drawOverlay();
}

function simulateStep() {
  if (state === 'play') {
    snake.update(obstacles);
    updateAmbientActors();
    handleCollisions();
    replenishEntities();
    checkState();
    return;
  }

  if (state === 'roundIntro') {
    updateAmbientActors();
    roundPauseFrames -= 1;
    if (roundPauseFrames <= 0) state = 'play';
  }
}

function handleCollisions() {
  for (let i = wanderPreys.length - 1; i >= 0; i--) {
    if (snake.head.pos.dist(wanderPreys[i].pos) < snake.head.r + wanderPreys[i].r) {
      snake.eat(wanderPreys[i]);
      wanderPreys.splice(i, 1);
    }
  }

  for (let i = rarePreys.length - 1; i >= 0; i--) {
    if (snake.head.pos.dist(rarePreys[i].pos) < snake.head.r + rarePreys[i].r) {
      snake.eat(rarePreys[i]);
      rarePreys.splice(i, 1);
    }
  }

  if (invincibilityEnabled) return;
  for (const enemy of allEnemies()) {
    if (snake.collidesWithEnemy(enemy)) {
      if (snake.hit()) onPlayerHit();
      break;
    }
  }
}

function onPlayerHit() {
  if (snake.lives <= 0) {
    state = 'lose';
    return;
  }
  startRoundPause();
}

function replenishEntities() {
  while (wanderPreys.length < tuning.foodTarget) wanderPreys.push(spawnWanderPrey());
  while (rarePreys.length < tuning.rareFoodTarget) rarePreys.push(spawnRarePrey());
}

function checkState() {
  if (!invincibilityEnabled && snake.lives <= 0) state = 'lose';
  if (snake.score >= targetScore) state = 'win';
}

function getTerrainSlowFactor(pos) {
  for (const patch of grassPatches) {
    if (patch.contains(pos)) return 0.58;
  }
  return 1;
}

function createGrassPatches() {
  const list = [];
  const count = floor(random(4, 7));
  let attempts = 0;
  while (list.length < count && attempts < 500) {
    attempts++;
    const w = random(90, 170);
    const h = random(56, 110);
    const x = random(120, width - 120);
    const y = random(110, height - 110);
    const c = createVector(x, y);
    if (c.dist(createVector(width * 0.18, height * 0.5)) < 160) continue;

    let valid = true;
    for (const o of obstacles) {
      if (c.dist(o.pos) < max(w, h) * 0.45 + o.r + 26) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;
    for (const g of list) {
      if (abs(g.pos.x - x) < (g.w + w) * 0.32 && abs(g.pos.y - y) < (g.h + h) * 0.32) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;
    list.push(new GrassPatch(x, y, w, h));
  }
  return list;
}

function randomFreePosition() {
  let pos;
  let safe = false;
  let attempts = 0;
  while (!safe && attempts < 1000) {
    attempts++;
    pos = createVector(random(90, width - 90), random(90, height - 90));
    safe = pos.dist(snake.head.pos) > 240;
    for (const o of obstacles) {
      if (pos.dist(o.pos) < o.r + 52) {
        safe = false;
        break;
      }
    }
  }
  return pos || createVector(width * 0.5, height * 0.5);
}

function spawnWanderPrey() {
  const p = randomFreePosition();
  return new WanderPrey(p.x, p.y);
}

function spawnRarePrey() {
  const p = randomFreePosition();
  return new RarePrey(p.x, p.y);
}

function createObstacles() {
  const list = [];
  const palette = ['#7a7a78', '#686866', '#8c8c89', '#5f5f5d', '#94918b'];
  const count = floor(random(4, 7));
  let attempts = 0;

  while (list.length < count && attempts < 400) {
    attempts++;
    const r = random(56, 92);
    const x = random(140, width - 140);
    const y = random(140, height - 140);
    const candidate = createVector(x, y);

    if (candidate.dist(createVector(width * 0.18, height * 0.5)) < 250) continue;

    let valid = true;
    for (const o of list) {
      if (candidate.dist(o.pos) < o.r + r + 165) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    list.push(new Obstacle(x, y, r, random(palette)));
  }
  return list;
}

function createPatrolPath() {
  const p = new Path(20);
  p.addPoint(width * 0.04, height * 0.06);
  p.addPoint(width * 0.95, height * 0.06);
  p.addPoint(width * 0.97, height * 0.5);
  p.addPoint(width * 0.92, height * 0.95);
  p.addPoint(width * 0.08, height * 0.95);
  p.addPoint(width * 0.03, height * 0.54);
  return p;
}

function drawBackground() {
  background(104, 86, 62);

  noStroke();
  for (let y = 0; y < height; y += 6) {
    const t = y / max(1, height);
    fill(108 - t * 22, 89 - t * 16, 64 - t * 10, 28);
    rect(0, y, width, 6);
  }

  for (let i = 0; i < 16; i++) {
    fill(92 + (i % 4) * 8, 76 + (i % 3) * 6, 54 + (i % 5) * 4, 18);
    ellipse(width * ((i * 0.17) % 1), height * ((i * 0.23) % 1), 260 + (i % 4) * 70, 160 + (i % 5) * 40);
  }

  stroke(88, 71, 50, 22);
  strokeWeight(1);
  for (let x = 0; x < width; x += 64) line(x, 0, x, height);
  for (let y = 0; y < height; y += 64) line(0, y, width, y);

  noStroke();
  for (let i = 0; i < 180; i++) {
    fill(126 + (i % 3) * 10, 104 + (i % 4) * 8, 76 + (i % 2) * 6, 26);
    circle((i * 127 + 33) % width, (i * 79 + 91) % height, 2 + (i % 3));
  }
}

function drawArenaFrame() {
  push();
  noFill();
  stroke(83, 63, 42, 110);
  strokeWeight(30);
  rect(24, 38, width - 48, height - 62, 20);
  stroke(154, 129, 92, 150);
  strokeWeight(3);
  rect(40, 54, width - 80, height - 94, 16);
  pop();
}

function drawHud() {
  if (state === 'intro' || state === 'godMenu') return;
  push();
  drawPanel(18, 14, 312, 58);
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(28);
  text('SNAKEEE', 32, 43);

  drawPanel(20, height - 104, 210, 82);
  fill(255);
  textSize(18);
  text(`Score  ${snake.score} / ${targetScore}`, 34, height - 82);
  text(`Vies   ${max(0, snake.lives)}`, 34, height - 54);

  if (invincibilityEnabled) {
    drawPanel(width - 184, 18, 164, 56, color(48, 37, 10, 176), color(255, 208, 92, 70));
    fill(255, 224, 120);
    textSize(16);
    textAlign(CENTER, CENTER);
    text('INVINCIBILITÉ', width - 102, 46);
  }

  if (Vehicle.debug) {
    drawPanel(width - 170, height - 72, 150, 52, color(8, 22, 46, 186), color(120, 220, 255, 60));
    fill(120, 220, 255);
    textSize(18);
    textAlign(CENTER, CENTER);
    text('DEBUG ON', width - 95, height - 46);
  }
  pop();
}

function drawMouseCursor() {
  if (state === 'intro' || state === 'godMenu') return;
  push();
  noFill();
  stroke(200, 230, 255, 180);
  strokeWeight(1.5);
  circle(mouseX, mouseY, 18);
  line(mouseX - 12, mouseY, mouseX + 12, mouseY);
  line(mouseX, mouseY - 12, mouseX, mouseY + 12);
  pop();
}

function drawOverlay() {
  if (state === 'intro') return drawIntroScreen();
  if (state === 'godMenu') return drawGodMenu();
  if (state === 'roundIntro') return drawRoundIntro();
  if (state === 'win' || state === 'lose') return drawEndScreen();
}

function drawIntroScreen() {
  push();
  fill(0, 0, 0, 155);
  rect(0, 0, width, height);

  const panelW = min(700, width * 0.62);
  const panelH = min(320, height * 0.42);
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;

  drawPanel(panelX, panelY, panelW, panelH, color(15, 23, 16, 238), color(162, 182, 120, 62));
  fill(248, 244, 228);
  textAlign(CENTER, CENTER);
  textSize(48);
  text('SNAKEEE', width / 2, panelY + 68);
  fill(212, 222, 198);
  textSize(22);
  text('Attrape les proies et évite les épées.', width / 2, panelY + 116);

  fill(230, 236, 219);
  textSize(24);
  text(`Atteins ${targetScore} points avant de perdre tes 3 vies.`, width / 2, panelY + 176);

  drawButton(width / 2 - 150, panelY + panelH - 82, 300, 62, 'Commencer la partie');
  pop();
}

function getGodMenuLayout() {
  const panelW = min(980, width * 0.9);
  const panelH = min(660, height * 0.86);
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;
  const rowX = panelX + 40;
  const rowW = panelW - 80;
  const rowH = 58;
  const rowStartY = panelY + 126;
  const rowGap = 72;
  const minusW = 48;
  const plusW = 48;
  const valueW = 96;
  const gap = 10;
  const groupW = minusW + gap + valueW + gap + plusW;
  const controlX = rowX + rowW - groupW - 18;
  const buttonW = 300;
  const buttonH = 54;
  const buttonX = width / 2 - buttonW / 2;
  const buttonY = panelY + panelH - 76;

  return {
    panelX,
    panelY,
    panelW,
    panelH,
    rowX,
    rowW,
    rowH,
    rowStartY,
    rowGap,
    minusW,
    plusW,
    valueW,
    gap,
    controlX,
    buttonX,
    buttonY,
    buttonW,
    buttonH
  };
}

function drawGodMenu() {
  push();
  fill(22, 16, 10, 170);
  rect(0, 0, width, height);

  const layout = getGodMenuLayout();
  drawPanel(layout.panelX, layout.panelY, layout.panelW, layout.panelH, color(31, 24, 17, 244), color(170, 142, 98, 78));

  fill(244, 220, 164);
  textAlign(CENTER, CENTER);
  textSize(40);
  text('Options', width / 2, layout.panelY + 52);
  fill(221, 205, 180);
  textSize(18);
  text('Ajuste la partie puis reprends.', width / 2, layout.panelY + 88);

  const rows = [
    ['Invincibilité', invincibilityEnabled ? 'Oui' : 'Non', 'toggleInvincibility'],
    ['Vitesse du jeu', tuning.gameSpeed.toFixed(1) + 'x', 'gameSpeed'],
    ['Apport de points', tuning.scoreMult.toFixed(1) + 'x', 'scoreMult'],
    ['Vitesse du serpent', tuning.snakeSpeedMult.toFixed(1) + 'x', 'snakeSpeed'],
    ['Vitesse des ennemis', tuning.enemySpeedMult.toFixed(1) + 'x', 'enemySpeed'],
    ['Proies', `${tuning.foodTarget}`, 'foodTarget'],
    ['Étoiles', `${tuning.rareFoodTarget}`, 'rareFoodTarget']
  ];

  let y = layout.rowStartY;
  for (const [label, value, key] of rows) {
    drawSettingRow(layout.rowX, y, layout.rowW, layout.rowH, label, value, key);
    y += layout.rowGap;
  }

  drawButton(layout.buttonX, layout.buttonY, layout.buttonW, layout.buttonH, 'Reprendre');
  pop();
}

function drawSettingRow(x, y, w, h, label, value, key) {
  drawPanel(x, y, w, h, color(37, 29, 21, 214), color(171, 139, 98, 42));
  fill(248, 242, 228);
  textAlign(LEFT, CENTER);
  textSize(16);
  text(label, x + 22, y + h / 2 + 1);

  const plusW = 48;
  const minusW = 48;
  const valueW = 96;
  const gap = 10;
  const groupW = minusW + gap + valueW + gap + plusW;
  const groupX = x + w - groupW - 18;
  const minusX = groupX;
  const valueX = minusX + minusW + gap;
  const plusX = valueX + valueW + gap;

  drawMiniButton(minusX, y + 8, minusW, h - 16, '−');
  drawValuePill(valueX, y + 8, valueW, h - 16, value);
  drawMiniButton(plusX, y + 8, plusW, h - 16, '+');
}

function drawValuePill(x, y, w, h, value) {
  push();
  noStroke();
  fill(73, 57, 40, 235);
  rect(x, y, w, h, 12);
  fill(245, 236, 220);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(value, x + w / 2, y + h / 2 + 1);
  pop();
}

function drawMiniButton(x, y, w, h, label) {
  const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  push();
  noStroke();
  fill(hover ? color(164, 129, 87) : color(121, 93, 63));
  rect(x, y, w, h, 12);
  fill(250);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(label, x + w / 2, y + h / 2 - 1);
  pop();
}

function drawRoundIntro() {
  push();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  drawPanel(width / 2 - 250, height * 0.31, 500, 230, color(30, 24, 18, 236), color(173, 140, 96, 58));

  const phase = ceil((roundPauseFrames / ROUND_PAUSE_DURATION) * 4);
  let countdownText = 'GO';
  if (phase >= 4) countdownText = '3';
  else if (phase === 3) countdownText = '2';
  else if (phase === 2) countdownText = '1';

  textAlign(CENTER, CENTER);
  fill(236, 228, 214);
  textSize(24);
  text('Prépare-toi', width / 2, height * 0.39);

  fill(255);
  textSize(84);
  text(countdownText, width / 2, height * 0.49);

  fill(230, 216, 188);
  textSize(28);
  text(`${snake.lives} vie${snake.lives > 1 ? 's' : ''} restante${snake.lives > 1 ? 's' : ''}`, width / 2, height * 0.58);
  pop();
}

function drawEndScreen() {
  push();
  fill(0, 0, 0, 175);
  rect(0, 0, width, height);
  drawPanel(width / 2 - 260, height / 2 - 130, 520, 270, color(28, 22, 18, 236), color(173, 140, 96, 60));
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(44);
  text(state === 'win' ? 'Victoire' : 'Game Over', width / 2, height / 2 - 42);
  textSize(19);
  fill(216, 232, 255);
  text(state === 'win' ? 'Tu as atteint le score cible.' : 'Tu n’as plus de vies.', width / 2, height / 2 + 12);
  drawButton(width / 2 - 130, height / 2 + 82, 260, 58, 'Rejouer');
  pop();
}

function drawButton(x, y, w, h, label) {
  push();
  const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  noStroke();
  const c1 = hover ? color(159, 128, 86) : color(121, 94, 61);
  fill(c1);
  rect(x, y, w, h, 16);
  fill(255, 255, 255, 20);
  rect(x + 6, y + 6, w - 12, h * 0.34, 12);
  fill(250);
  textSize(22);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 + 1);
  pop();
}

function drawPanel(x, y, w, h, fillColor = color(28, 22, 17, 195), strokeColor = color(173, 140, 96, 40)) {
  push();
  noStroke();
  fill(fillColor);
  rect(x, y, w, h, 16);
  stroke(strokeColor);
  strokeWeight(1.4);
  noFill();
  rect(x + 1, y + 1, w - 2, h - 2, 15);
  pop();
}

function isInsideButton(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function mousePressed() {
  if (state === 'godMenu') {
    handleGodMenuClick();
    return;
  }

  if (state === 'intro') {
    const panelH = min(320, height * 0.42);
    const panelY = height / 2 - panelH / 2;
    if (isInsideButton(width / 2 - 150, panelY + panelH - 82, 300, 62)) {
      startRoundPause();
      return;
    }
  }

  if ((state === 'win' || state === 'lose') && isInsideButton(width / 2 - 130, height / 2 + 82, 260, 58)) {
    initGame();
  }
}


function handleGodMenuClick() {
  const layout = getGodMenuLayout();
  if (isInsideButton(layout.buttonX, layout.buttonY, layout.buttonW, layout.buttonH)) {
    state = optionsMenuStateBeforeOpen;
    return;
  }

  const rows = [
    ['toggleInvincibility'],
    ['gameSpeed'],
    ['scoreMult'],
    ['snakeSpeed'],
    ['enemySpeed'],
    ['foodTarget'],
    ['rareFoodTarget']
  ];

  let y = layout.rowStartY;
  for (const [key] of rows) {
    const minusX = layout.controlX;
    const valueX = minusX + layout.minusW + layout.gap;
    const plusX = valueX + layout.valueW + layout.gap;
    if (isInsideButton(minusX, y + 8, layout.minusW, layout.rowH - 16)) adjustSetting(key, -1);
    if (isInsideButton(plusX, y + 8, layout.plusW, layout.rowH - 16)) adjustSetting(key, 1);
    y += layout.rowGap;
  }
}

function adjustSetting(key, direction) {
  if (key === 'toggleInvincibility') {
    invincibilityEnabled = direction > 0 ? true : false;
    snake.invulnerableTimer = invincibilityEnabled ? 999999 : 0;
    return;
  }
  if (key === 'gameSpeed') tuning.gameSpeed = constrain(tuning.gameSpeed + direction * 0.1, 0.6, 1.8);
  if (key === 'scoreMult') tuning.scoreMult = constrain(tuning.scoreMult + direction * 0.1, 0.5, 3.0);
  if (key === 'snakeSpeed') tuning.snakeSpeedMult = constrain(tuning.snakeSpeedMult + direction * 0.1, 0.7, 1.8);
  if (key === 'enemySpeed') tuning.enemySpeedMult = constrain(tuning.enemySpeedMult + direction * 0.1, 0.5, 1.8);
  if (key === 'foodTarget') tuning.foodTarget = constrain(tuning.foodTarget + direction, 4, 24);
  if (key === 'rareFoodTarget') tuning.rareFoodTarget = constrain(tuning.rareFoodTarget + direction, 1, 10);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    initGame();
  }
  if (key === 'd' || key === 'D') Vehicle.debug = !Vehicle.debug;
  if (key === 'g' || key === 'G') {
    if (state === 'godMenu') {
      state = optionsMenuStateBeforeOpen;
    } else {
      optionsMenuStateBeforeOpen = state;
      state = 'godMenu';
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGame();
}
