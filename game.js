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
		// тут лушче создать копии массивов, чтобы поля объекта нельзя было изменить извне
		const gridArr = grid.map(el => el);
		const actorsArr = actors.map(el => el);
		this.grid = gridArr;
		this.actors = actorsArr;
		this.height = this.grid.length;
		this.width = this.grid.length === 0 ? 0 : Math.max.apply(this, this.grid.map(el => el.length));
		this.player = this.actors.find(actor => actor.type === 'player');
		this.status = null;
		this.finishDelay = 1;
	}

	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(movingObject) {
		return this.actors.find(actor => (actor !== movingObject && actor.isIntersect(movingObject)));
	}
	
	obstacleAt(moveActorTo, size) {
		if (!(moveActorTo instanceof Vector && size instanceof Vector)) {
			throw new Error('Переданный аргумент не является типом Vector');
		}

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
	}

	removeActor(toBeRemoved) {
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
	constructor(dict) {
		// здесь лучше создать копию объекта, чтобы поле нельзя было изменить извне

		this.dict = dict;
	}

	actorFromSymbol(sym) {
		return sym ? this.dict[sym] : undefined;
	//если убрать проверку символа на undefined, ошибка - Cannot read property 'undefined' of undefined
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
		let result = [];
		if (plan.length !== 0 && this.dict !== undefined) {
			plan.forEach(function (line, indexY) {
				line.split('').forEach(function (symbol, index) {
					const obj = this.actorFromSymbol(symbol)
					if (obj instanceof Actor.constructor) {
						const newActor = new obj(new Vector(index, indexY))
						if (newActor instanceof Actor) {
							result.push(newActor);
						}
					}
				}, this)
			}, this)
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
		let newPosition = this.getNextPosition(time);
		const size = new Vector(this.size.x, this.size.y);
		if (level.obstacleAt(newPosition, size) === 'wall' || level.obstacleAt(newPosition, size) === 'lava' ) {   //this.pos = currentPosition;
			this.handleObstacle();
		}
		else {
			this.pos = newPosition;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(position) {
		super(position, new Vector(2, 0), new Vector(1, 1),);
	}
}

class VerticalFireball extends Fireball {
	constructor(position) {
		super(position, new Vector(0, 2), new Vector(1, 1));
	}
}

class FireRain extends Fireball {
	constructor(position) {
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
 