// Obstacle : structure issue de 6-ObstacleAvoidance/obstacle.js, adaptée en rocher stable
class Obstacle {
  constructor(x, y, r, c = "#7a7a78") {
    this.pos = createVector(x, y);
    this.r = r;
    this.base = color(c);
    this.angle = random(TWO_PI);
    this.profile = [];
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      this.profile.push(random(0.82, 1.08));
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(35,30,26,0.18)';
    noStroke();

    fill(56, 50, 46, 40);
    ellipse(0, this.r * 0.3, this.r * 2.2, this.r * 1.18);

    fill(this.base);
    beginShape();
    for (let i = 0; i < this.profile.length; i++) {
      const a = (TWO_PI * i) / this.profile.length;
      const rr = this.r * this.profile[i];
      vertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);

    fill(165, 165, 162, 28);
    ellipse(-this.r * 0.18, -this.r * 0.22, this.r * 0.8, this.r * 0.28);
    fill(70, 70, 68, 26);
    ellipse(this.r * 0.22, this.r * 0.18, this.r * 0.76, this.r * 0.22);

    if (Vehicle.debug) {
      noFill();
      stroke(190, 180, 150, 110);
      circle(0, 0, this.r * 2 + 18);
    }
    pop();
  }
}

class GrassPatch {
  constructor(x, y, w, h) {
    this.pos = createVector(x, y);
    this.w = w;
    this.h = h;
    this.blades = [];
    const bladeCount = floor(map(w * h, 5500, 22000, 20, 54, true));
    for (let i = 0; i < bladeCount; i++) {
      this.blades.push({
        x: random(-w * 0.5, w * 0.5),
        y: random(-h * 0.5, h * 0.5),
        s: random(10, 18),
        lean: random(-0.35, 0.35),
        tone: random(0.75, 1.15)
      });
    }
  }

  contains(pos) {
    return pos.x > this.pos.x - this.w * 0.5 && pos.x < this.pos.x + this.w * 0.5 && pos.y > this.pos.y - this.h * 0.5 && pos.y < this.pos.y + this.h * 0.5;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(62, 104, 51, 38);
    ellipse(0, 0, this.w, this.h);
    fill(76, 125, 58, 22);
    ellipse(0, 0, this.w * 0.76, this.h * 0.68);

    for (const b of this.blades) {
      strokeWeight(1.8);
      stroke(54 * b.tone, 111 * b.tone, 45 * b.tone, 165);
      line(b.x, b.y + 4, b.x + b.lean * 8, b.y - b.s);
      stroke(97 * b.tone, 146 * b.tone, 70 * b.tone, 100);
      line(b.x + 1.4, b.y + 3, b.x + b.lean * 5 + 1.4, b.y - b.s * 0.74);
    }

    if (Vehicle.debug) {
      noFill();
      stroke(80, 180, 90, 80);
      rectMode(CENTER);
      rect(0, 0, this.w, this.h, 10);
    }
    pop();
  }
}
