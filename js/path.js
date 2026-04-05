// Path : repris dans l'esprit de 5-2-PathFollowing/path.js et 5-3-PathFollowingComplex/path.js
class Path {
  constructor(radius = 26) {
    this.radius = radius;
    this.points = [];
  }

  addPoint(x, y) {
    this.points.push(createVector(x, y));
  }

  display() {
    if (!Vehicle.debug) return;
    push();
    strokeJoin(ROUND);
    stroke(80, 90, 140, 70);
    strokeWeight(this.radius * 2);
    noFill();
    beginShape();
    for (const v of this.points) vertex(v.x, v.y);
    endShape(CLOSE);

    stroke(120, 220, 255, 150);
    strokeWeight(2);
    beginShape();
    for (const v of this.points) vertex(v.x, v.y);
    endShape(CLOSE);
    pop();
  }
}
