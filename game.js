'use strict';

class Vector {
    constructor(X = 0, Y = 0) {
        this.x = X;
        this.y = Y
    }

    plus(vector) {
        if (vector instanceof Vector === false) {
            throw new Error('����� ���������� � ������ ������ ������ ���� Vector')
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

class Actor {
    constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

        if (position instanceof Vector && size instanceof Vector && speed instanceof Vector) {
            this.pos = position;
            this.size = size;
            this.speed = speed;
        } else {
            throw new Error('���������� ������ �� �������� ����� Vector');
        }
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

    act() {}
}

Object.defineProperty(Actor.prototype, 'type', {
    value: 'actor',
    enumerable: true,
    configurable: true,
});

Actor.prototype.isIntersect = function (actor) {
    if (actor instanceof Actor === false) {
        throw new Error('������������ ��� Actor')
    } else if (this === actor) {
        return false;
    } 
    //else if ((this.top === actor.bottom && this.left === actor.right) || (this.top === actor.bottom && this.right === actor.left) || (this.bottom === actor.top && this.right === actor.left) || (this.bottom === actor.top && this.left === actor.right)) {return true;}
    //else if ((this.left > actor.right && this.right >= actor.right) || (this.right < actor.left && this.left <= actor.left) || (this.bottom > actor.top && this.top >= actor.top) || (this.top < actor.bottom && this.bottom <= actor.bottom)) {return false;}
    //else if (actor.right > this.left && actor.left < this.right && actor.bottom > this.top && actor.top < this.bottom) {return true;}
    //else { return true;}
    return !(this.left >= actor.right || this.top >= actor.bottom || this.right <= actor.left || this.bottom <= actor.top);
}

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
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(movingObject) {
    
        if (this.actors === undefined || this.actors === []) {
            return undefined;
        } else { 
            for (let actor of this.actors) {
                if (actor !== movingObject && actor.isIntersect(movingObject)) {
                    return actor;
                }
            }
        }
    }

    obstacleAt(moveActorTo, size) {
        if (moveActorTo instanceof Vector && size instanceof Vector) {
            let from = moveActorTo;
            let to = moveActorTo.plus(size);
            if (to.y > this.height) {
                return 'lava';
            }
            if (to.x > this.width || to.x < 0 || from.x < 0 || from.y < 0 || to.y < 0) {
                return 'wall';
            } else {
                for (let y = Math.floor(from.y); y < Math.ceil(to.y); y++) {
                    for (let x = Math.floor(from.x); x < Math.ceil(to.x); x++) {
                        if (this.grid[y][x]) {
                            return this.grid[y][x];
                        }
                    }
                }
            }
        } else {
            throw new Error('������������ ��� ���������');
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

class LevelParser {
    constructor(dict) {
        this.dict = dict;
    }

    actorFromSymbol(sym = 0) {
        if (sym == 0 ) { return undefined;}
        else if (sym in this.dict) {return this.dict[sym];}
        else {return undefined;}
    }

    obstacleFromSymbol(sym) {
       if (sym === 'x') { return 'wall';}
       else if (sym === '!') { return 'lava';}
       else { return undefined; }
    }

    createGrid(plan) {
        if (plan.length === 0) {return [];}
        let result = [];
        for (let line of plan) {
            result.push(line.split('').map(symbol => this.obstacleFromSymbol(symbol)));
        }
        return result;
    }

    createActors(plan) {
		let result = [];
		if (plan.length === 0) {
			return [];
		} 
        if (this.dict === undefined) {return result;}
        else { 
		plan.forEach(function (line, indexY) {
			let lineArr = line.split('');
            lineArr.forEach(function(symbol, index){
                let obj = this.actorFromSymbol(symbol)
                if ( obj instanceof Actor.constructor) {
                    let newActor = new obj(new Vector(index, indexY))
                    if (newActor instanceof Actor) {
                        result.push(newActor);
                    }
                } 
            }, this)
		}, this)
		return result;}
    }

    parse(plan) {
        let grid = Array.from(this.createGrid(plan));
        let actors = Array.from(this.createActors(plan));
        let level = new Level(grid, actors);
        return level;
    }     
}


class Fireball extends Actor {
    constructor (position = new Vector(0,0), speed = new Vector(0,0)) {
        super(position);
        this.speed = speed;
    }

    getNextPosition(time = 1) {
        return new Vector(this.pos.x + this.speed.times(time).x, this.pos.y + this.speed.times(time).y);
    }

    handleObstacle() {
        let s = new Vector(this.speed.x * (-1), this.speed.y * (-1));
        this.speed = this.speed.times(-1);
    }

    act(time, level = new Level) {
        let currentPosition = new Vector(this.pos.x, this.pos.y);
        let newPosition = this.getNextPosition(time);
        const size = new Vector(this.size.x, this.size.y);
    //  let obstacle = level.obstacleAt(newPosition, this.size);
        if (level.obstacleAt(newPosition, size) === 'wall' || level.obstacleAt(newPosition, size) === 'lava') 
            {   //this.pos = currentPosition;
                this.handleObstacle();
                }
        else if (!level.obstacleAt(newPosition, size))
            { this.pos = newPosition; }
    }
}

Object.defineProperty(Fireball.prototype, 'type', {
    value: 'fireball',
    enumerable: true,
    configurable: true,
}) 

class HorizontalFireball extends Fireball {
    constructor (position) {
        super(position);
        this.speed = new Vector(2, 0);
    }
}

class VerticalFireball extends Fireball {
    constructor (position) {
        super(position);
        this.speed = new Vector(0, 2);
    }
}

class FireRain extends VerticalFireball {
    constructor (position) {
        super(position);
        this.speed = new Vector(0, 3);
        this.originalPos = position;
    }

    handleObstacle() {
        let s = new Vector(0, 3);
        this.speed = s;
        this.pos = new Vector(this.originalPos.x, this.originalPos.y);
    }
}

class Player extends Actor {
    constructor (position) {
        super(position);
        this.pos = this.pos.plus(new Vector(0, -0.5));        
        this.size = new Vector(0.8, 1.5);
        this.speed = new Vector(0, 0);
    }
}

Object.defineProperty(Player.prototype, 'type', {
    value: 'player',
    enumerable: true,
    configurable: true,
}) 

class Coin extends Actor {
    constructor (position) {
        super(position, new Vector(0.6, 0.6));
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.originalPos = new Vector(this.pos.x, this.pos.y); 
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
    }

    updateSpring(time) { //так длинно, но считает без ошибок и проходит тест
        let speed = this.springSpeed;
        if (time !== undefined) { 
        this.spring += time * speed;
        } else {
            this.spring += speed;
        }
        //this.spring = this.spring + this.springSpeed * time; // так считает с ошибкой и не проходит тест - Метод updateSpring "Увеличит свойство spring на springSpeed" поэтому оставляю длинный вариант    
    }

    getSpringVector() {
        let springVector = new Vector(0, this.springDist * Math.sin(this.spring));
        return springVector;
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        //длинный вариант
        /*let springVector = this.getSpringVector();
        const originalPosition = new Vector(this.originalPos.x, this.originalPos.y); 
        let newPosition = new Vector(this.originalPos.x, this.originalPos.y + springVector.y);
        return newPosition;*/
        //короткий вариант
        return this.originalPos.plus(this.getSpringVector());
    }

    act(time) {
    this.pos = this.getNextPosition(time); 
    }

}



Object.defineProperty(Coin.prototype, 'type', {
    value: 'coin',
    enumerable: true,
    configurable: true,
});

const schemas = [
    [
      '         ',
      '         ',
      '    =    ',
      '       oo',
      '     !xxx',
      ' @       ',
      'xxx!     ',
      '         '
    ],
    [
      '      v  ',
      '    v    ',
      '  v      ',
      '        o',
      '        x',
      '@   x    ',
      'x        ',
      '         '
    ]
  ];
  const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
  }
  const parser = new LevelParser(actorDict);
  runGame(schemas, parser, DOMDisplay)
    .then(() => console.log('Вы выиграли приз!')); 