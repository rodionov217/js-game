
'use strict';
class Vector {
    constructor(X = 0, Y = 0) {
        this.x = X;
        this.y = Y
    }
    plus(vector) {
        if (vector instanceof Vector === false) {
            throw new Error('Можно прибавлять к ветору только вектор типа Vector')
        } else {
            let newX = vector.x + this.x;
            let newY = vector.y + this.y;
            return new Vector(newX, newY);
        }
    }
    times(t) {
        return new Vector(this.x * t, this.y * t)
    }
}
//Проверка работоспособности класса Вектор
/*const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));
console.log(finish); */


class Actor {
    constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

        if (position instanceof Vector && size instanceof Vector && speed instanceof Vector) {
            this.pos = position;
            this.size = size;
            this.speed = speed;
        } else {
            throw new Error('Переданный вектор не является типом Vector')
        }
    }
    get left() { return this.pos.x }
    get top() { return this.pos.y }
    get right() { return this.pos.x + this.size.x; }
    get bottom() { return this.pos.y + this.size.y }
}
Object.defineProperty(Actor.prototype, 'type', {

    value: 'actor',
    enumerable: true,
    configurable: true

});

Actor.prototype.isIntersect = function (actor) {
    if (actor instanceof Actor === false) {
        throw new Error('Некорректный тип Actor')
    } else if (this === actor) {
        return false;
    } else if (this.right > actor.left && this.right < actor.right) {

        return true;
    } else if (this.top < actor.top && this.bottom > actor.bottom) {
        return true;
    } 
    
    else {
        return false;
    }
}

/*
const items = new Map();

const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');  
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status); */


class Level {
    constructor(grid, actors) {
        this.grid = grid;
        this.actors = actors;
    }
    get height() {
        if (this.grid === undefined  || this.grid === []) {
            return 0;
        } else {
            return this.grid.length;
        }
    }
    get width() {
        if (this.grid === undefined || this.grid === [] ) {
            return 0;
        } 
            let max = 0;
            for (let line of this.grid) {
                if (line.length > max) {
                    max = line.length;
                }
            }
            return max;
        
    }
    get player() {
        for (let one of this.actors) {
            if (one.type === 'player') {
                return one;
            }
        }
    }
    isFinished() {
        return this.status !== null && this.finishDelay < 0 ? true : false;
    }
    actorAt(movingObject) {
        if (this.actors === undefined || this.actors === []) {
            return undefined;
        }
        let result = [];
        for (let actor of this.actors) {
            if (actor.isIntersect(movingObject)) {
                result.push(actor);
            }
        }
        return result[0];
    }
    obstacleAt(moveActorTo, size) {
        if (moveActorTo instanceof Vector && size instanceof Vector) {
            //size.x = Math.floor(size.x);
            //size.y = Math.floor(size.y);
            let movedto = moveActorTo.plus(size);
            if (movedto.y > this.height || moveActorTo.y > this.height) { return 'lava'; }
            else if (movedto.x > this.width || movedto.x < 0 || moveActorTo.x < 0 || moveActorTo.y < 0 || movedto.y < 0 || moveActorTo.x > this.width) {
                return 'wall';
            } else {
                for (let i = moveActorTo.x; i < Math.floor(moveActorTo.x + size.x); i++) {
                    for (let j = moveActorTo.y; j < Math.floor(moveActorTo.y + size.y); j++) {
                        if (this.grid[j] !== undefined) {
                            return grid[j][i];
                        }
                    }

                }
                // return this.grid[movedto.y][movedto.x];
            }
        } else {
            throw new Error('Некорректный тип аргумента');
        }
    }
    removeActor(toBeRemoved) {
        let i = this.actors.indexOf(toBeRemoved);
        this.actors.splice(i, 1);

    }
    noMoreActors(actorType) {
        if (this.actors === [] || this.actors === undefined) { return true;}
        let types = this.actors.map(function (one) {
            return one.type;
        })
        return types.indexOf(actorType) === -1 ? true : false;
    }

    playerTouched(obstacleType, actor) {
        if (obstacleType === 'lava' || obstacleType === 'fireball') {
            this.status = 'lost';
        } else if (obstacleType === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors(obstacleType)) { this.status = 'won' }
        }
    }

}

Level.prototype.status = null;
Level.prototype.finishDelay = 1;
/*const grid = [ [1, 4, 50], [2, 4, 4, 34], [5], [1,1,1,1,1] ];
let lev = new Level(grid);
console.log(lev.width);
console.log(lev.height);*/

/*
const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();


const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
} else { console.log('coins not collected')}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
} */

const grid = [
    new Array(3),
    ['wall', 'wall', 'lava']
];
const level = new Level(grid);
runLevel(level, DOMDisplay);

class LevelParser {
    constructor(dict) {
        this.dict = dict;
    }
    actorsFromSymbol(sym) { }
}