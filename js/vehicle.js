// Base Vehicle COPIÉE / ADAPTÉE à partir des fichiers du zip de cours :
// - 1-Seek/vehicle.js                -> seek, flee, applyForce, update
// - 2-PursueEvade_correction         -> pursue, evade
// - 3-Arrival_correction/vehicle.js  -> arrive, boundaries
// - 4-Wander/vehicle.js              -> wander
// - 5-3-PathFollowingComplex         -> follow(path) + projection
// - 6-ObstacleAvoidance/vehicle.js   -> avoid(obstacles) + debug ahead/ahead2
//
// Ici on fusionne les méthodes du cours dans UNE seule classe Vehicle
// pour le jeu final, en gardant les noms, la logique et le style du TP
// autant que possible.

function lerpAngle(current, target, amount = 0.2) {
  let delta = target - current;
  while (delta > PI) delta -= TWO_PI;
  while (delta < -PI) delta += TWO_PI;
  return current + delta * amount;
}

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    // aligné sur les exemples du zip: départ sans vitesse imposée
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);

    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 12;
    this.color = color(255);

    this.rayonZoneDeFreinage = 100;
    this.distanceCercle = 90;
    this.wanderRadius = 40;
    this.wanderTheta = random(TWO_PI);
    this.displaceRange = 0.3;
    this.largeurZoneEvitementDevantVaisseau = this.r * 1.4;
  }

  drawVector(pos, vecteur, colorValue = 'yellow') {
    push();
    stroke(colorValue);
    strokeWeight(2);
    fill(colorValue);
    translate(pos.x, pos.y);
    line(0, 0, vecteur.x, vecteur.y);
    rotate(vecteur.heading());
    const arrowSize = 6;
    translate(vecteur.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  // COPIÉ / ADAPTÉ de 1-Seek/vehicle.js
  seek(target) {
    const desired = p5.Vector.sub(target, this.pos);
    if (desired.magSq() === 0) return createVector(0, 0);
    desired.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // COPIÉ / ADAPTÉ de 3-Arrival_correction/vehicle.js
  arrive(target, distanceVisee = 0) {
    let desired = p5.Vector.sub(target, this.pos);
    const distance = desired.mag();
    if (distance === 0) return createVector(0, 0);

    let speed = this.maxSpeed;
    const freinage = max(distanceVisee + 40, this.rayonZoneDeFreinage);
    if (distance < freinage) {
      speed = map(distance, distanceVisee, freinage, 0, this.maxSpeed, true);
    }
    desired.setMag(speed);
    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // COPIÉ / ADAPTÉ de 1-Seek/vehicle.js puis 2-PursueEvade_correction/vehicle.js
  flee(target, distanceDeDetection = Infinity) {
    const targetPos = target.pos ? target.pos : target;
    const distance = p5.Vector.dist(this.pos, targetPos);
    if (distance > distanceDeDetection) return createVector(0, 0);
    return this.seek(targetPos).mult(-1);
  }

  // COPIÉ / ADAPTÉ de 2-PursueEvade_correction/vehicle.js
  pursue(target) {
    const targetAhead = target.vel.copy().mult(20).add(target.pos);
    return this.seek(targetAhead);
  }

  // COPIÉ / ADAPTÉ de 2-PursueEvade_correction/vehicle.js
  evade(target) {
    return this.pursue(target).mult(-1);
  }

  // COPIÉ / ADAPTÉ de 4-Wander/vehicle.js
  wander() {
    let pointDevant = this.vel.copy();
    if (pointDevant.mag() < 0.01) pointDevant = createVector(1, 0);
    pointDevant.setMag(this.distanceCercle);
    pointDevant.add(this.pos);

    const theta = this.wanderTheta + this.vel.heading();
    const x = this.wanderRadius * cos(theta);
    const y = this.wanderRadius * sin(theta);

    const wanderPoint = pointDevant.copy().add(x, y);
    const steer = p5.Vector.sub(wanderPoint, this.pos);
    steer.setMag(this.maxForce);
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);
    return steer;
  }

  // COPIÉ / ADAPTÉ de 3-Arrival_correction/vehicle.js
  boundaries(bx, by, bw, bh, d = 25) {
    let desired = null;
    const left = bx + d;
    const right = bx + bw - d;
    const top = by + d;
    const bottom = by + bh - d;

    if (this.pos.x < left) desired = createVector(this.maxSpeed, this.vel.y);
    else if (this.pos.x > right) desired = createVector(-this.maxSpeed, this.vel.y);

    if (this.pos.y < top) desired = createVector(this.vel.x, this.maxSpeed);
    else if (this.pos.y > bottom) desired = createVector(this.vel.x, -this.maxSpeed);

    if (!desired) return createVector(0, 0);
    desired.setMag(this.maxSpeed);
    const force = p5.Vector.sub(desired, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = Infinity;
    let obstacleLePlusProche;
    for (const o of obstacles) {
      const d = this.pos.dist(o.pos);
      if (d < plusPetiteDistance) {
        plusPetiteDistance = d;
        obstacleLePlusProche = o;
      }
    }
    return obstacleLePlusProche;
  }

  // COPIÉ / ADAPTÉ de 6-ObstacleAvoidance/vehicle.js
  avoid(obstacles) {
    if (!obstacles || obstacles.length === 0) return createVector(0, 0);

    let ahead = this.vel.copy();
    if (ahead.mag() < 0.01) ahead = createVector(1, 0);
    ahead.normalize();
    const dynamicLookAhead = map(this.vel.mag(), 0, this.maxSpeed || 1, 22, 46, true);
    ahead.mult(dynamicLookAhead);

    const ahead2 = ahead.copy().mult(0.5);
    const point1 = this.pos.copy().add(ahead);
    const point2 = this.pos.copy().add(ahead2);

    if (Vehicle.debug) {
      this.drawVector(this.pos, ahead, 'yellow');
      this.drawVector(this.pos, ahead2, 'purple');
      push();
      fill('red');
      noStroke();
      circle(point1.x, point1.y, 10);
      fill('lightblue');
      circle(point2.x, point2.y, 10);
      stroke(255, 50);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau * 2);
      line(this.pos.x, this.pos.y, point1.x, point1.y);
      pop();
    }

    let obstacle = null;
    let pointLePlusProche = null;
    let bestDistance = Infinity;

    for (const o of obstacles) {
      const d1 = o.pos.dist(point1);
      const d2 = o.pos.dist(point2);
      const d3 = o.pos.dist(this.pos);
      let d = d1;
      let point = point1;
      if (d2 < d) {
        d = d2;
        point = point2;
      }
      if (d3 < d) {
        d = d3;
        point = this.pos;
      }
      const collisionRadius = o.r + this.largeurZoneEvitementDevantVaisseau + this.r * 0.2;
      if (d < collisionRadius && d < bestDistance) {
        bestDistance = d;
        obstacle = o;
        pointLePlusProche = point;
      }
    }

    if (!obstacle) return createVector(0, 0);

    let desired = p5.Vector.sub(pointLePlusProche, obstacle.pos);
    if (desired.magSq() === 0) {
      desired = this.vel.copy().rotate(HALF_PI);
      if (desired.magSq() === 0) desired = createVector(1, 0);
    }

    desired.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);

    if (Vehicle.debug) {
      this.drawVector(obstacle.pos, desired.copy().setMag(30), 'orange');
    }

    return steer;
  }

  // COPIÉ / ADAPTÉ de 5-3-PathFollowingComplex/vehicle.js
  follow(path) {
    let predict = this.vel.copy();
    if (predict.mag() < 0.01) predict = createVector(1, 0);
    predict.normalize();
    predict.mult(25);
    const predictpos = p5.Vector.add(this.pos, predict);

    let normal = null;
    let target = null;
    let worldRecord = Infinity;

    for (let i = 0; i < path.points.length; i++) {
      let a = path.points[i];
      let b = path.points[(i + 1) % path.points.length];
      let normalPoint = findProjection(predictpos, a, b);
      let dir = p5.Vector.sub(b, a);

      if (
        normalPoint.x < min(a.x, b.x) ||
        normalPoint.x > max(a.x, b.x) ||
        normalPoint.y < min(a.y, b.y) ||
        normalPoint.y > max(a.y, b.y)
      ) {
        normalPoint = b.copy();
        a = path.points[(i + 1) % path.points.length];
        b = path.points[(i + 2) % path.points.length];
        dir = p5.Vector.sub(b, a);
      }

      const d = p5.Vector.dist(predictpos, normalPoint);
      if (d < worldRecord) {
        worldRecord = d;
        normal = normalPoint;
        dir.normalize();
        dir.mult(25);
        target = normal.copy().add(dir);
      }
    }

    if (Vehicle.debug && normal && target) {
      push();
      fill(255, 0, 0);
      noStroke();
      circle(predictpos.x, predictpos.y, 16);
      fill('green');
      circle(normal.x, normal.y, 16);
      fill('#ff4f7a');
      circle(target.x, target.y, 10);
      pop();
    }

    if (worldRecord > path.radius && target) {
      return this.seek(target);
    }
    return createVector(0, 0);
  }

  showBody(fillColor = this.color, strokeColor = color(0, 0, 0, 0)) {
    push();
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(1.5);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}

// COPIÉ / ADAPTÉ de 5-2 / 5-3 PathFollowing
function findProjection(p, a, b) {
  const ap = p5.Vector.sub(p, a);
  const ab = p5.Vector.sub(b, a);
  ab.normalize();
  ab.mult(ap.dot(ab));
  return p5.Vector.add(a, ab);
}
