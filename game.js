'use strict';

class Vector {
	constructor(X = 0, Y = 0) {
		this.x = X;
		this.y = Y
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
		return new Vector(this.x * t, this.y * t)
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
			throw new Error('Переданный аргумент не является объектом типа Actor')
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
		// переменные тут можно не создавать
		const gridArr = grid.slice();
		const actorsArr = actors.slice();
		this.grid = gridArr;
		this.actors = actorsArr;
		this.height = this.grid.length;
		// передать массив аргументов в метод в ES6 можно без apply
		this.width = this.grid.length === 0 ? 0 : Math.max.apply(this, this.grid.map(el => el.length));
		this.player = this.actors.find(actor => actor.type === 'player');
		this.status = null;
		this.finishDelay = 1;
	}

	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(movingObject) {
		// первая половина проверки дублируется в isIntersect
		return this.actors.find(actor => (actor !== movingObject && actor.isIntersect(movingObject)));
	}
	
	obstacleAt(moveActorTo, size) {
		if (!(moveActorTo instanceof Vector && size instanceof Vector)) {
			throw new Error('Переданный аргумент не является типом Vector');
		}

		// значение присваивается один раз - лучше использовать const
		let from = moveActorTo;
		let to = moveActorTo.plus(size);

		if (to.y > this.height) {
			return 'lava';
		}
		// это условие можно упростить
		// (если from.y < 0, то to.y тоже будет < 0)
		if (to.x > this.width || to.x < 0 || from.x < 0 || from.y < 0 || to.y < 0) {
			return 'wall';
		// else не нужен
		} else {
			// округлённые значения лучше записать в переменные,
			// чтобы не округлять на каждой итерации
			for (let y = Math.floor(from.y); y < Math.ceil(to.y); y++) {
				for (let x = Math.floor(from.x); x < Math.ceil(to.x); x++) {
					// this.grid[y][x] можно записать в переменную, чтобы 2 раза не писать
					if (this.grid[y][x]) {
						return this.grid[y][x];
					}
				}
			}
		}
	}

	removeActor(toBeRemoved) {
		// const
		let i = this.actors.indexOf(toBeRemoved);
		if (i !== -1) {
			this.actors.splice(i, 1);
		}
	}

	noMoreActors(actorType) {
		return !(this.actors.find(actor => actor.type === actorType));
	}

	playerTouched(obstacleType, actor) {
		if (obstacleType === 'lava' || obstacleType === 'fireball') {
			this.status = 'lost';
		}
		else if (obstacleType === 'coin') {
			this.removeActor(actor);
			if (this.noMoreActors(obstacleType)) {
				this.status = 'won';
			}
		}
	}
}

class LevelParser {
	// в методе ошибка, посмотрите внимательно
	constructor(dict) {
		this.dict = Object.assign({}, actorDict);
	}

	actorFromSymbol(sym) {
		return sym ? this.dict[sym] : undefined;
	//если убрать проверку символа на undefined, ошибка - Cannot read property 'undefined' of undefined
		// ошибка возникает из за того, что неопредлёт this.dict, а проверяете вы sym
		// проверка лишняя, а для dict лучше добавить значение по-умолчанию в конструкторе
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
		// лучше const
		let result = [];
		// лучше проверить целостность объекта в конструкторе и убрать тут проверку
		if (plan.length !== 0 && this.dict !== undefined) {
			plan.forEach(function (line, indexY) {
				line.split('').forEach(function (symbol, index) {
					const obj = this.actorFromSymbol(symbol)
					// почему .constructor?
					if (obj instanceof Actor.constructor) {
						const newActor = new obj(new Vector(index, indexY))
						if (newActor instanceof Actor) {
							result.push(newActor);
						}
					}
				}, this)
			}, this) // лучше использовать стрелочные функции и не передавать this
		}
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
		// const
		let newPosition = this.getNextPosition(time);
		// зачем ещё раз создавать вектор?
		const size = new Vector(this.size.x, this.size.y);
		// если добавится ещё одно препятствие код придётся менять в двух местах,
		// так что лучше тут просто проверить что obstacleAt вернул что-нибудь
		if (level.obstacleAt(newPosition, size) === 'wall' || level.obstacleAt(newPosition, size) === 'lava' ) {   //this.pos = currentPosition;
			this.handleObstacle();
		}
		else {
			this.pos = newPosition;
		}
	}
}

class HorizontalFireball extends Fireball {
	// можно добавить значение по-умолчанию
	constructor(position) {
    // конструктор Fireball принимает 2 аргумента
		super(position, new Vector(2, 0), new Vector(1, 1),);
	}
}

class VerticalFireball extends Fireball {
  // можно добавить значение по-умолчанию
	constructor(position) {
    // конструктор Fireball принимает 2 аргумента
		super(position, new Vector(0, 2), new Vector(1, 1));
	}
}

class FireRain extends Fireball {
  // можно добавить значение по-умолчанию
	constructor(position) {
    // конструктор Fireball принимает 2 аргумента
		super(position, new Vector(0, 3), new Vector(1, 1));
		this.originalPos = position;
	}

	handleObstacle() {
		this.pos = this.originalPos;
		this.speed = this.speed.times(1); // ??? так отменить изменение скорости на противоположный вектор?
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
	// не опускайте аргементы конструктора Vector
	constructor(position = new Vector) {
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
	});
 