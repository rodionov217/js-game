'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector === false) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector')
    }
    const newX = vector.x + this.x;
    const newY = vector.y + this.y;
    return new Vector(newX, newY);
  }
  
  times(t) {
    return new Vector(this.x * t, this.y * t);
  }
}

class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(position instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
      throw new Error('Переданный аргумент не является объектом типа Vector');
    }
    this.pos = position;
    this.size = size;
    this.speed = speed;
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actor) { 
    if (actor instanceof Actor === false) {
      throw new Error('Переданный аргумент не является объектом типа Actor');
    }

    if (this === actor) {
      return false;
    }

    return this.left < actor.right && this.top < actor.bottom && this.right > actor.left && this.bottom > actor.top;
  }

  act() { }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.height = this.grid.length;
    this.width = Math.max(0, ...this.grid.map(el => el.length));
    this.player = this.actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(movingObject) {
    return this.actors.find(actor => actor.isIntersect(movingObject));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector && size instanceof Vector)) {
      throw new Error('Переданный аргумент не является типом Vector');
    }
    const fromX = Math.floor(position.x);
    const toX = Math.ceil(position.x + size.x);
    const fromY = Math.floor(position.y);
    const yEnd = Math.ceil(position.y + size.y);

    if (fromX < 0 || toX > this.width || fromY < 0) {
      return "wall";
    }

    if (yEnd > this.height) {
      return "lava";
    }

    for (let y = fromY; y < yEnd; y++) {
      for (let x = fromX; x < toX; x++) {
        let cell = this.grid[y][x];
        if (cell) {
          return cell;
        }
      }
    }
  }

  removeActor(toBeRemoved) {
    const i = this.actors.indexOf(toBeRemoved);
    if (i !== -1) {
      this.actors.splice(i, 1);
    }
  }

  noMoreActors(actorType) {
    return !this.actors.some(actor => actor.type === actorType);
  }

  playerTouched(obstacleType, actor) {
    if (obstacleType === 'lava' || obstacleType === 'fireball') {
      this.status = 'lost';
    } else if (obstacleType === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors(obstacleType)) {
          this.status = 'won';
        }
    }
  }
}

class LevelParser {
  constructor(dict = {}) {
    this.dict = Object.assign({}, dict);
  }

  actorFromSymbol(sym) {
    return this.dict[sym];
  }

  obstacleFromSymbol(sym) {
    if (sym === 'x') {
      return 'wall';
  }

    if (sym === '!') {
      return 'lava';
    }
  }

  createGrid(plan) {
    return plan.map(line => line.split('').map(symbol => this.obstacleFromSymbol(symbol)));
  }

  createActors(plan) {
    const result = [];
    plan.forEach((line, y) => {
      line.split('').forEach( (symbol, x) => {
        const actorConstructor = this.actorFromSymbol(symbol);
        if (typeof actorConstructor === 'function') {
          const newActor = new actorConstructor(new Vector(x, y));
          if (newActor instanceof Actor) {
            result.push(newActor);
          }
        }
      });
    });
    return result;
  }

  parse(plan) {
    const grid = this.createGrid(plan);
    const actors = this.createActors(plan);
    return new Level(grid, actors);
  }
}

class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level = new Level) {
    const newPosition = this.getNextPosition(time);
    const size = this.size;
    if (level.obstacleAt(newPosition, size)) {
      this.handleObstacle();
    } else {
      this.pos = newPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0, 3));
    this.originalPos = position;
  }

  handleObstacle() {
    this.pos = this.originalPos;
  }
}

class Player extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }

  get type() {
    return 'player';
  }
}

class Coin extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.originalPos = new Vector(this.pos.x, this.pos.y);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time; 
  }

  getSpringVector() {
    return new Vector(0, this.springDist * Math.sin(this.spring));
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.originalPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
}

const parser = new LevelParser(actorDict);
loadLevels()
  .then((result) => {
    runGame(JSON.parse(result), parser, DOMDisplay)
      .then(() => console.log('Вы выиграли приз!'));
  })