# 🧠 AGENTS.md — SNAKEEE (p5.js, Craig Reynolds)

## 🎯 Purpose

Core idea:

* local rules
* vector-based forces
* behavior composition
* visible reuse of course material

NOT scripted movement.

---

## 🧱 Core Principles (NON-NEGOTIABLE)

### 1. Vehicle Model

All moving entities are vehicles with:

* position (`pos`)
* velocity (`vel`)
* acceleration (`acc`)
* `maxSpeed`
* `maxForce`

Movement must stay based on forces and vectors.

---

### 2. Steering Law (FUNDAMENTAL)

All copied/adapted behaviors must still follow:

```js
steering = desired_velocity - current_velocity
```

Then:

```js
steering.limit(maxForce)
```

This must remain visible in `js/vehicle.js` so the teacher can recognize the TP logic.

---

### 3. Layered Logic

Keep the same educational structure as the course:

1. choose a target / intention
2. compute a steering force
3. apply force
4. update motion

This project focuses on the steering layer.

---

### 4. Reuse Before Reinvention

When modifying the project:

* first read the course zip
* first copy/adapt the TP method
* only then add small game-specific adjustments

The project should read like: **course methods merged into a snake game**.

---

## 🚨 HARD CONSTRAINTS

### 🔒 Vehicle.js must stay recognizable

`js/vehicle.js` may be adapted for fusion, but it must stay clearly traceable to the course files.

Do not hide the TP origin of the methods.

---

### 🧬 EVERYTHING IMPORTANT IS A VEHICLE

Every important moving entity must extend `Vehicle`.

✅ Valid:

```js
class PlayerHead extends Vehicle {}
class SnakeSegment extends Vehicle {}
class WanderPrey extends Vehicle {}
class RarePrey extends Vehicle {}
class HunterEnemy extends Vehicle {}
class PatrolEnemy extends Vehicle {}
```

---

### ⚙️ Behavior Rules

* do not bypass `applyForce()`
* do not directly script motion when a TP behavior already exists
* keep behaviors independent and composable

---

## ⚙️ Steering Behaviors Reference Used Here

### Seek / Flee

Source:

* `1-Seek/vehicle.js`

Used for basic steering and opposite steering.

---

### Pursue / Evade

Source:

* `2-PursueEvade_correction/vehicle.js`

Used for sword enemies and rare stars.

---

### Arrive / Snake following

Sources:

* `3-Arrival_correction/vehicle.js`
* `3-Arrival_correction/snake.js`

Used for:

* snake head following the mouse
* snake body segments following the previous segment

---

### Wander

Source:

* `4-Wander/vehicle.js`

Used for food seeds and star movement.

---

### Path Following

Source:

* `5-3-PathFollowingComplex/vehicle.js`
* `5-3-PathFollowingComplex/path.js`

Used for patrolling sword enemies.

---

### Obstacle Avoidance

Source:

* `6-ObstacleAvoidance/vehicle.js`
* `6-ObstacleAvoidance/obstacle.js`

Used for sword avoidance and general obstacle steering.

---

## 🧩 Code Architecture

### Files to preserve

```text
js/vehicle.js      // merged TP methods, still recognizable
js/entities.js     // game entities extending Vehicle
js/path.js         // path object for patrol
js/obstacle.js     // rock obstacles
js/sketch.js       // game loop and screens
```

---

## 🎮 p5.js Rules

* use `p5.Vector`
* no external physics engine
* keep the course style readable

---

## 🧠 Agent Responsibilities

When modifying this project, an AI agent must:

1. reread the course zip first
2. prefer copied/adapted TP methods over fresh rewrites
3. keep method names recognizable
4. declare modified files
5. preserve a teacher-readable link to the original TPs

---
