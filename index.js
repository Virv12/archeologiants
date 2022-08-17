const textarea = document.getElementById("code");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
window.ctx = ctx;

function load_img(name) {
	const img = new Image();
	img.src = "/imgs/" + name;
	return img;
}

const img_ant = load_img("ant_1024.png");
const img_tunnel = load_img("tunnel_1024.png");
const img_dirt = load_img("dirt_1024.png");
const img_fossil0 = load_img("fossil0_1024.png");
const img_fossil1 = load_img("fossil1_1024.png");
const img_fossil2 = load_img("fossil2_1024.png");

const img_fossil = [
	img_fossil0,
	img_fossil1,
	img_fossil2,
];

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(oth) {
		return new Vec2(this.x + oth.x, this.y + oth.y);
	}

	map(f) {
		return new Vec2(f(this.x), f(this.y));
	}

	div(a) {
		return this.map(x => x / a);
	}

	floor() {
		return this.map(Math.floor);
	}

	clone() {
		return new Vec2(this.x, this.y);
	}

	equal(oth) {
		return this.x == oth.x && this.y == oth.y;
	}
}

class Cell {
	constructor(free) {
		this.free = free;
		this.fossil = -1;
	}

	canWalk() {
		return this.free;
	}

	dig() {
		this.free = true;
	}

	draw(x, y) {
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(1 / 1024, 1 / 1024);
		ctx.drawImage(this.free ? img_tunnel : img_dirt, 0, 0);
		if (this.fossil != -1) {
			ctx.drawImage(img_fossil[this.fossil], 0, 0);
		}
		ctx.restore();
	}
}

const MAX_ENERGY = 100;

class Ant {
	constructor(pos, queen) {
		this.energy = MAX_ENERGY;
		this.pos = pos;
		this.path = [];
		this.queen = queen;
	}

	tire(x) {
		this.energy -= x;
		if (this.energy <= 0) {
			this.energy = 0;
			this.path = [];
		}
	}

	alive() {
		return this.energy > 0;
	}

	draw() {
		ctx.save();
		ctx.translate(this.pos.x, this.pos.y);
		ctx.scale(1 / 1024, 1 / 1024);
		ctx.drawImage(img_ant, 0, 0);
		ctx.restore();

		ctx.lineWidth = 0.05;
		ctx.strokeStyle = "yellow";
		ctx.beginPath();
		ctx.moveTo(this.pos.x + 0.2, this.pos.y + 0.85);
		ctx.lineTo(this.pos.x + 0.2 + 0.6 * this.energy / MAX_ENERGY, this.pos.y + 0.85);
		ctx.stroke();
	}
}

class Game {
	constructor() {
		this.next_update = Date.now();

		this.w = 20;
		this.h = 20;
		this.grid = Array(this.w);
		for (let i = 0; i < this.w; ++i) {
			this.grid[i] = Array(this.h);
			for (let j = 0; j < this.h; ++j) {
				this.grid[i][j] = new Cell(8 <= i && i < 12 && 8 <= j && j < 12);
			}
		}

		this.ants = [
			new Ant(new Vec2(9, 9), false),
			new Ant(new Vec2(9, 10), false),
		];

		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = width;
		canvas.height = height;

		const s = Math.min(width / this.w, height / this.h);
		ctx.scale(s, s);

		this.selected = undefined;
		const game = this;
		onclick = function(e) {
			const c = new Vec2(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
				.div(s)
				.floor();

			if (game.selected) {
				const p = game.selected.pos.clone();
				game.selected.path = [];
				while (p.x != c.x) {
					p.x += Math.sign(c.x - p.x);
					game.selected.path.push(p.clone());
				}
				while (p.y != c.y) {
					p.y += Math.sign(c.y - p.y);
					game.selected.path.push(p.clone());
				}
				game.selected = undefined;
			} else {
				for (const ant of game.ants) {
					if (ant.pos.equal(c)) {
						game.selected = ant;
						break;
					}
				}
			}
		};
	}

	update() {
		for (const ant of this.ants) {
			if (ant.path.length == 0) continue;
			if (!ant.alive()) continue;
			const t = ant.path[0];
			if (t.x < 0 || this.w <= t.x || t.y < 0 || this.h <= t.y) continue;
			const c = this.grid[t.x][t.y];
			if (c.canWalk()) {
				ant.pos = t;
				ant.path.splice(0, 1);
				ant.tire(1);
			} else {
				c.dig();
				ant.tire(1);
			}
		}

		this.ants = this.ants.filter(x => x.alive());
	}

	draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height); // TODO: might not always clear

		for (let i = 0; i < this.w; ++i) {
			for (let j = 0; j < this.h; ++j) {
				this.grid[i][j].draw(i, j);
			}
		}

		this.grid[3][2].fossil = 0;

		for (const ant of this.ants) {
			ant.draw();
		}
	}

	frame() {
		if (Date.now() > this.next_update) {
			this.update();
			this.next_update += 500;
		}
		this.draw();
		requestAnimationFrame(() => this.frame());
	}
}

window.main = function() {
	const game = new Game();
	requestAnimationFrame(() => game.frame());
}
