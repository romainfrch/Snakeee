// Entités spécialisées du jeu.
// Références directes au zip de cours :
// - Snake + suivi des anneaux : 3-Arrival_correction/snake.js
// - WanderPrey : 4-Wander/vehicle.js
// - RarePrey : 2-PursueEvade_correction + 4-Wander
// - HunterEnemy : 2-PursueEvade_correction + 6-ObstacleAvoidance
// - PatrolEnemy : 5-3-PathFollowingComplex + 2-PursueEvade_correction

// Chaque objet animé reste une sous-classe de Vehicle.
class SnakeSegment extends Vehicle {

  constructor(x, y, size, colorValue) {
    super(x, y);
    this.r = size;
    this.color = colorValue;
    this.baseMaxSpeed = 8.8;
    this.baseMaxForce = 0.7;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.rayonZoneDeFreinage = 35;
    this.vel = createVector();}

  followTarget(targetPos, spacing = 18) {
    const speedMult = tuning.snakeSpeedMult * getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce * constrain(speedMult * 1.15, 1, 2.4);
    const force = this.arrive(targetPos, spacing).mult(1.15);
    this.applyForce(force);
    this.update();}}

// Tête du joueur : arrive() vers la souris + avoid() + boundaries().
class PlayerHead extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 17;
    this.baseMaxSpeed = 5.2;
    this.baseMaxForce = 0.3;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.color = color('#4dff91');
    this.mouseTarget = createVector(x, y);
    this.lastFacing = createVector(1, 0);
    this.hitRadius = 11;}

  setMouseTarget(x, y) {
    this.mouseTarget.set(x, y);}

  getLifePalette(lives) {
    if (lives >= 3) {
      return {
        head: color(126, 173, 88),
        segmentA: color(108, 154, 72),
        segmentB: color(82, 122, 58)};}
    if (lives === 2) {
      return {
        head: color(186, 149, 74),
        segmentA: color(164, 124, 58),
        segmentB: color(134, 98, 44)};}
    return {
      head: color(160, 96, 72),
      segmentA: color(142, 78, 58),
      segmentB: color(112, 58, 42)
    };
  }

  step(obstacles) {
    const speedMult = tuning.snakeSpeedMult * getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce * min(1.5, speedMult);
    const target = this.mouseTarget.copy();
    const moveForce = this.arrive(target, 12).mult(1.15);
    const avoidForce = this.avoid(obstacles).mult(1.5);
    const boundsForce = this.boundaries(0, 0, width, height, 20).mult(0.95);
    this.applyForce(moveForce);
    this.applyForce(avoidForce);
    this.applyForce(boundsForce);
    this.update();

    if (this.vel.mag() > 0.12) {
      this.lastFacing = this.vel.copy().normalize();
    }
  }

  showHead(lives) {
    const palette = this.getLifePalette(lives);
    this.color = palette.head;

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.mag() > 0.15 ? this.vel.heading() : this.lastFacing.heading());
    noStroke();

    fill(58, 42, 28, 34);
    ellipse(-this.r * 0.34, 0, this.r * 2.15, this.r * 1.45);

    fill(this.color);
    ellipse(-this.r * 0.15, 0, this.r * 2.0, this.r * 1.34);

    fill(86, 68, 46, 55);
    ellipse(-this.r * 0.3, this.r * 0.18, this.r * 1.2, this.r * 0.36);

    fill(236, 225, 196, 90);
    ellipse(-this.r * 0.48, -this.r * 0.2, this.r * 0.78, this.r * 0.28);

    fill(34, 26, 18);
    circle(this.r * 0.56, -this.r * 0.2, this.r * 0.2);
    circle(this.r * 0.56, this.r * 0.2, this.r * 0.2);
    fill(250, 246, 232, 180);
    circle(this.r * 0.58, -this.r * 0.22, this.r * 0.07);
    circle(this.r * 0.58, this.r * 0.18, this.r * 0.07);

    fill(42, 31, 19, 120);
    ellipse(this.r * 0.66, 0, this.r * 0.18, this.r * 0.12);

    if (Vehicle.debug) {
      noFill();
      stroke(120, 220, 255, 120);
      circle(0, 0, 70);
    }
    pop();
  }
}

// Snake : conteneur léger ; le mouvement reste porté par PlayerHead et SnakeSegment.
class Snake {
  constructor(x, y, length = 6) {
    this.spawnX = x;
    this.spawnY = y;
    this.head = new PlayerHead(x, y);
    this.segments = [];
    this.segmentSize = 15;
    this.score = 0;
    this.lives = 3;
    this.invulnerableTimer = 0;
    this.segmentHitScale = 0.64;

    for (let i = 0; i < length; i++) {
      this.addSegment();
    }
  }

  addSegment() {
    const anchor = this.segments.length === 0
      ? this.head.pos.copy()
      : this.segments[this.segments.length - 1].pos.copy();

    const seg = new SnakeSegment(anchor.x, anchor.y, this.segmentSize, color(40, 220, 120));
    seg.baseMaxSpeed = 8.9;
    seg.baseMaxForce = 0.7;
    seg.maxSpeed = seg.baseMaxSpeed;
    seg.maxForce = seg.baseMaxForce;
    this.segments.push(seg);
  }

  update(obstacles) {
    this.head.setMouseTarget(mouseX, mouseY);
    this.head.step(obstacles);

    let targetPos = this.head.pos.copy();
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].followTarget(targetPos, this.segmentSize * 0.52);
      targetPos = this.segments[i].pos.copy();
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
  }

  show() {
    const palette = this.head.getLifePalette(this.lives);

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const t = i / max(1, this.segments.length - 1);
      const alpha = map(i, 0, max(1, this.segments.length - 1), 228, 118, true);
      const blend = lerpColor(palette.segmentA, palette.segmentB, t);
      blend.setAlpha(alpha);
      const scaledR = segment.r * map(i, 0, max(1, this.segments.length - 1), 1.08, 0.78, true);
      push();
      noStroke();
      fill(72, 54, 36, 26);
      ellipse(segment.pos.x - scaledR * 0.12, segment.pos.y + scaledR * 0.08, scaledR * 2.05, scaledR * 1.42);
      fill(blend);
      ellipse(segment.pos.x, segment.pos.y, scaledR * 2.0, scaledR * 1.28);
      fill(236, 225, 196, 18);
      ellipse(segment.pos.x - scaledR * 0.3, segment.pos.y - scaledR * 0.2, scaledR * 0.86, scaledR * 0.24);
      pop();
    }

    if (this.invulnerableTimer > 0 && frameCount % 6 < 3 && !invincibilityEnabled) return;
    this.head.showHead(this.lives);
  }

  eat(prey) {
    this.score += max(1, round(prey.points * tuning.scoreMult));
    this.addSegment();
  }

  collidesWithEnemy(enemy) {
    const enemyRadius = enemy.hitRadius ?? enemy.r * 0.62;
    const headRadius = this.head.hitRadius ?? this.head.r * 0.68;
    if (this.head.pos.dist(enemy.pos) < headRadius + enemyRadius) return true;
    for (const seg of this.segments) {
      const segRadius = seg.r * this.segmentHitScale;
      if (seg.pos.dist(enemy.pos) < segRadius + enemyRadius) return true;}
    return false;}

  hit() {
    if (invincibilityEnabled || this.invulnerableTimer > 0) return false;
    this.lives--;
    this.invulnerableTimer = 120;
    this.resetPosition();
    return true;}

  resetPosition() {
    this.head.pos.set(this.spawnX, this.spawnY);
    this.head.vel.mult(0);
    this.head.lastFacing = createVector(1, 0);
    this.head.setMouseTarget(this.spawnX, this.spawnY);

    let previous = this.head.pos.copy();
    for (const seg of this.segments) {
      seg.pos = previous.copy();
      seg.vel.mult(0);
      previous = seg.pos.copy().sub(this.segmentSize * 0.58, 0);}}}

// Graine : wander() + avoid() + boundaries().
class WanderPrey extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 14;
    this.baseMaxSpeed = 2.8;
    this.baseMaxForce = 0.13;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.color = color('#9a6e3a');
    this.points = 1;}

  behave(obstacles) {
    const speedMult = getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce;
    this.applyForce(this.wander().mult(1.1));
    this.applyForce(this.boundaries(0, 0, width, height, 18).mult(0.8));
    this.applyForce(this.avoid(obstacles).mult(1.5));
    this.update();}

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.mag() > 0.05 ? this.vel.heading() : 0.25);
    noStroke();
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(40, 20, 0, 0.22)';
    fill(96, 70, 36, 44);
    ellipse(0, this.r * 0.34, this.r * 2.25, this.r * 1.15);
    fill(166, 118, 54);
    ellipse(0, 0, this.r * 1.95, this.r * 1.08);
    fill(208, 160, 86);
    ellipse(-this.r * 0.16, -this.r * 0.11, this.r * 1.25, this.r * 0.58);
    fill(118, 154, 66);
    beginShape();
    vertex(this.r * 0.18, -this.r * 0.18);
    vertex(this.r * 1.18, -this.r * 0.62);
    vertex(this.r * 0.72, 0);
    vertex(this.r * 1.18, this.r * 0.44);
    endShape(CLOSE);
    fill(255, 230, 165, 54);
    ellipse(-this.r * 0.44, -this.r * 0.12, this.r * 0.46, this.r * 0.28);
    if (Vehicle.debug) {
      noFill();
      stroke(80, 200, 255, 120);
      circle(0, 0, 42);
    }
    pop();}}

// Étoile : wander() puis evade() si le serpent s'approche.
class RarePrey extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 11;
    this.baseMaxSpeed = 2.4;
    this.baseMaxForce = 0.12;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.color = color('#ffd84d');
    this.points = 3;}

  behave(player, obstacles) {
    const speedMult = getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce;
    let steer = this.wander().mult(0.55);
    if (this.pos.dist(player.head.pos) < 118) {
      steer = this.evade(player.head).mult(0.82);}
    this.applyForce(steer);
    this.applyForce(this.avoid(obstacles).mult(1.55));
    this.applyForce(this.boundaries(0, 0, width, height, 20).mult(0.9));
    this.update();}

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = 'rgba(255,216,77,0.8)';
    noStroke();
    fill(this.color);
    beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = i * TWO_PI / 10;
      const radius = i % 2 === 0 ? this.r : this.r * 0.52;
      vertex(cos(angle) * radius, sin(angle) * radius);}
    endShape(CLOSE);
    fill(255, 255, 255, 60);
    circle(-2, -2, this.r * 0.8);
    if (Vehicle.debug) {
      noFill();
      stroke(255, 216, 77, 120);
      circle(0, 0, 118 * 2);
    }
    pop();}}

// Épée chasseuse : pursue() + avoid() + boundaries().
class HunterEnemy extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 18;
    this.baseMaxSpeed = 2.45;
    this.baseMaxForce = 0.14;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.color = color('#ff5a6f');
    this.renderHeading = 0;
    this.hitRadius = 10;}

  behave(player, obstacles) {
    const speedMult = tuning.enemySpeedMult * getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce * min(1.55, max(1, speedMult) + 0.15);
    this.applyForce(this.pursue(player.head).mult(0.78));
    this.applyForce(this.avoid(obstacles).mult(1.9));
    this.applyForce(this.boundaries(0, 0, width, height, 18).mult(0.7));
    this.update();
    if (this.vel.mag() > 0.06) this.renderHeading = lerpAngle(this.renderHeading, this.vel.heading(), 0.18);}

  show() {
    drawSwordEnemy(this.pos, this.renderHeading, this.r, color(255, 102, 134), color(245, 245, 255));}}

// Épée patrouille : follow(path) puis pursue() si le serpent est proche.
class PatrolEnemy extends Vehicle {
  constructor(x, y, path) {
    super(x, y);
    this.r = 17;
    this.baseMaxSpeed = 2.1;
    this.baseMaxForce = 0.12;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = this.baseMaxForce;
    this.color = color('#bb72ff');
    this.path = path;
    this.renderHeading = 0;
    this.hitRadius = 9;}

  behave(player, obstacles) {
    const speedMult = tuning.enemySpeedMult * getTerrainSlowFactor(this.pos);
    this.maxSpeed = this.baseMaxSpeed * speedMult;
    this.maxForce = this.baseMaxForce * min(1.55, max(1, speedMult) + 0.15);
    const steer = this.follow(this.path).mult(0.35).add(this.pursue(player.head).mult(0.62));
    this.applyForce(steer);
    this.applyForce(this.avoid(obstacles).mult(1.75));
    this.applyForce(this.boundaries(0, 0, width, height, 18).mult(0.68));
    this.update();
    if (this.vel.mag() > 0.06) this.renderHeading = lerpAngle(this.renderHeading, this.vel.heading(), 0.16);}

  show() {
    drawSwordEnemy(this.pos, this.renderHeading, this.r, color(191, 118, 255), color(247, 244, 255));}}

function drawSwordEnemy(pos, heading, r, glowColor, metalColor) {
  push();
  translate(pos.x, pos.y);
  rotate(heading + PI / 2);
  rectMode(CENTER);

  noStroke();
  fill(48, 30, 18, 78);
  ellipse(0, r * 0.28, r * 1.9, r * 4.2);

  // Silhouette plus agressive : lame plus longue, garde plus large et pommeau plus lourd.
  stroke(74, 74, 74);
  strokeWeight(1.8);
  fill(158, 160, 156);
  beginShape();
  vertex(0, -r * 2.55);
  vertex(r * 0.22, -r * 2.18);
  vertex(r * 0.62, -r * 0.65);
  vertex(r * 0.44, r * 0.88);
  vertex(0, r * 1.14);
  vertex(-r * 0.44, r * 0.88);
  vertex(-r * 0.62, -r * 0.65);
  vertex(-r * 0.22, -r * 2.18);
  endShape(CLOSE);

  noStroke();
  fill(92, 30, 28, 168);
  beginShape();
  vertex(0, -r * 2.02);
  vertex(r * 0.16, -r * 1.45);
  vertex(0, -r * 0.9);
  vertex(-r * 0.16, -r * 1.45);
  endShape(CLOSE);

  fill(126, 86, 48);
  beginShape();
  vertex(-r * 0.92, r * 0.72);
  vertex(-r * 0.2, r * 0.56);
  vertex(0, r * 0.9);
  vertex(r * 0.2, r * 0.56);
  vertex(r * 0.92, r * 0.72);
  vertex(r * 0.22, r * 1.02);
  vertex(0, r * 0.9);
  vertex(-r * 0.22, r * 1.02);
  endShape(CLOSE);

  fill(98, 64, 37);
  rect(0, r * 1.42, r * 0.34, r * 1.18, 3);
  fill(78, 52, 28);
  rect(0, r * 2.08, r * 0.86, r * 0.48, 4);
  fill(132, 106, 74);
  ellipse(0, r * 2.34, r * 0.42, r * 0.42);

  stroke(226, 226, 214, 125);
  strokeWeight(1.1);
  line(0, -r * 2.02, 0, r * 0.86);
  stroke(255, 255, 255, 40);
  line(-r * 0.18, -r * 1.45, -r * 0.08, r * 0.24);

  fill(76, 20, 18, 120);
  noStroke();
  triangle(-r * 0.9, r * 0.82, -r * 1.22, r * 0.54, -r * 0.58, r * 0.66);
  triangle(r * 0.9, r * 0.82, r * 1.22, r * 0.54, r * 0.58, r * 0.66);

  if (Vehicle.debug) {
    noFill();
    stroke(red(glowColor), green(glowColor), blue(glowColor), 110);
    circle(0, 0, 150);
    circle(0, 0, r * 1.15);
    line(0, 0, 0, -38);}
  pop();}
