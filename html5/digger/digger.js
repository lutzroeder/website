
var Direction =
{
	none: 0,
	left: 1,
	right: 2,
	up: 3,
	down: 4
};

var Sprite =
{
	nothing: 0,
	stone: 1,
	ground: 2,
	ghost180: 3,
	uvexit: 4,
	diamond: 5,
	wall: 6,
	ghost90L: 7,
	marker: 8,
	uvstone: 9,
	player: 10,
	ghost90LR: 11,
	exit: 12,
	buffer: 13,
	changer: 14,
	ghost90R: 15
};

var Key =
{
	left: 0,
	right: 1,
	up: 2,
	down: 3,
	reset: 4
};

var Sound =
{
	diamond: 0,
	stone: 1,
	step: 2
};

var Player = function(position)
{
	this.position = position;
	this.alive = true;
	this.direction = Direction.none;
	this.stone = [false, false];
	this.step = 0;
};

Player.prototype.getImageIndex = function()
{
	if (this.alive)
	{
		if ((this.direction === Direction.left) && (this.step < 6))
		{
			return [16, 17, 18, 19, 18, 17][this.step];
		}
		else if ((this.direction === Direction.right) && (this.step < 6))
		{
			return [20, 21, 22, 23, 22, 21][this.step];
		}
		else if ((this.direction === Direction.up) && (this.step < 2))
		{
			return [24, 25][this.step];
		}
		else if ((this.direction === Direction.down) && (this.step < 2))
		{
			return [26, 27][this.step];
		}
		return [15, 15, 15, 15, 15, 15, 15, 15, 28, 28, 15, 15, 28, 28, 15, 15, 15, 15, 15, 15, 29, 29, 30, 30, 29, 29, 15, 15, 15, 15][this.step];
	}
	return 31;
};

var Ghost = function(position, type)
{
	this.position = position;
	this.type = type;
	this.alive = true;
	this.direction = Direction.none;
	this.lastTurn = Direction.none;
};

Ghost.prototype.getImageIndex = function()
{
	return [ 4, 4, 5, 6, 3 ][this.direction];
};

var Position = function()
{
	if (arguments.length === 1) // copy constructor
	{
		this.x = arguments[0].x;
		this.y = arguments[0].y;
	}
	if (arguments.length === 2) // (x, y)
	{
		this.x = arguments[0];
		this.y = arguments[1];
	}
};

Position.prototype.equals = function(position)
{
	return (this.x == position.x) && (this.y == position.y);
};

var Base64Reader = function(data)
{
	this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	this.data = data;
	this.position = 0;
	this.bits = 0;
	this.bitsLength = 0;
};

Base64Reader.prototype.readByte = function()
{
	if (this.bitsLength === 0)
	{
		var tailBits = 0;
		while (this.position < this.data.length && this.bitsLength < 24)
		{
			var ch = this.data.charAt(this.position++);
			var index = this.alphabet.indexOf(ch);
			if (index < 64)
			{
				this.bits = (this.bits << 6) | index;
			}
			else
			{
				this.bits <<= 6;
				tailBits += 6;
			}
			this.bitsLength += 6;
		}
		if ((this.position >= this.data.length) && (this.bitsLength === 0))
		{
			return -1;
		}
		tailBits = (tailBits === 6) ? 8 : (tailBits === 12) ? 16 : tailBits;
		this.bits = this.bits >> tailBits;
		this.bitsLength -= tailBits;
	}
	this.bitsLength -= 8;
	return (this.bits >> this.bitsLength) & 0xff;
};

var Level = function(data)
{
	var i, x, y;
	var reader = new Base64Reader(data);

	this.map = [];
	for (x = 0; x < 20; x++)
	{
		this.map[x] = [];
	}
	for (y = 0; y < 14; y++)
	{
		for (x = 0; x < 10; x++)
		{
			var b = reader.readByte();
			this.map[x * 2 + 1][y] = b & 0x0f;
			this.map[x * 2][y] = b >> 4;
		}
	}
	for (i = 0; i < 5; i++)
	{
		reader.readByte();
	}
	this.player = new Player(new Position(reader.readByte(), reader.readByte() - 2));
	this.map[this.player.position.x][this.player.position.y] = this.player;
	this.diamonds = reader.readByte();
	this.diamonds = (this.diamonds >> 4) * 10 + (this.diamonds & 0x0f);
	var ghostData = [];
	for (i = 0; i < 8; i++)
	{
		ghostData.push(reader.readByte());
	}
	this.ghosts = [];
	var index = 0;
	for (y = 0; y < 14; y++)
	{
		for (x = 0; x < 20; x++)
		{
			if ((this.map[x][y] === Sprite.ghost90L) || (this.map[x][y] === Sprite.ghost90R) || (this.map[x][y] === Sprite.ghost90LR) || (this.map[x][y] === Sprite.ghost180))
			{
				var ghost = new Ghost(new Position(x, y), this.map[x][y]);
				var info = ghostData[index >> 1];
				if ((index & 1) !== 0)
				{
					info = info & 0x0f;
					ghost.lastTurn = Direction.right;
				}
				else
				{
					info = info >> 4;
					ghost.lastTurn = Direction.left;
				}
				ghost.direction = (info < 4) ? [Direction.down, Direction.up, Direction.right, Direction.left][info] : Direction.none;
				this.ghosts.push(ghost);
				this.map[x][y] = ghost;
				index++;
			}
		}
	}
	this.collected = 0;
	this.time = 5000;
	this.score = 0;	
};

Level.prototype.update = function()
{
	// turn buffers into nothing
	for (var y = 13; y >= 0; y--)
	{
		for (var x = 19; x >= 0; x--)
		{
			if (this.map[x][y] === Sprite.buffer)
			{
				this.map[x][y] = Sprite.nothing;
			}
		}
	}
};

Level.prototype.move = function()
{	
	var x, y, dx, dy;

	// gravity for stones and diamonds
	for (y = 13; y >= 0; y--)
	{
		for (x = 19; x >= 0; x--)
		{
			if ((this.map[x][y] === Sprite.stone) || (this.map[x][y] === Sprite.diamond) || (this.map[x][y] === Sprite.uvstone))
			{
				dx = x;
				dy = y;
				if (this.map[x][y + 1] === Sprite.nothing)
				{
					dy = y + 1;
				}
				else
				{
					if ((this.map[x][y + 1] === Sprite.stone) || (this.map[x][y + 1] === Sprite.diamond))
					{
						if ((this.map[x - 1][y + 1] === Sprite.nothing) && (this.map[x - 1][y] === Sprite.nothing))
						{
							dx = x - 1;
							dy = y + 1;
						}
						else if ((this.map[x + 1][y + 1] === Sprite.nothing) && (this.map[x + 1][y] === Sprite.nothing))
						{
							dx = x + 1;
							dy = y + 1;
						}
					}
					if ((this.map[x][y + 1] === Sprite.changer) && ((this.map[x][y] === Sprite.stone) || (this.map[x][y] === Sprite.uvstone)) && (this.map[x][y + 2] === Sprite.nothing))
					{
						dy = y + 2;
					}
				}
				if ((dx != x) || (dy != y))
				{
					this.map[dx][dy] = Sprite.marker;
				}
			}
		}
	}

	for (y = 13; y >= 0; y--)
	{
		for (x = 19; x >= 0; x--)
		{
			if ((this.map[x][y] === Sprite.stone) || (this.map[x][y] === Sprite.diamond) || (this.map[x][y] === Sprite.uvstone))
			{
				dx = x;
				dy = y;
				if (this.map[x][y + 1] === Sprite.marker)
				{
					dy = y + 1;
				}
				else
				{
					if ((this.map[x][y + 1] === Sprite.stone) || (this.map[x][y + 1] === Sprite.diamond) || (this.map[x][y + 1] === Sprite.nothing))
					{
						if ((this.map[x - 1][y + 1] === Sprite.marker) && ((this.map[x - 1][y] === Sprite.nothing) || (this.map[x - 1][y] === Sprite.marker)))
						{
							dx = x - 1;
							dy = y + 1;
						}
						else if ((this.map[x + 1][y + 1] === Sprite.marker) && ((this.map[x + 1][y] === Sprite.nothing) || (this.map[x + 1][y] === Sprite.marker)))
						{
							dx = x + 1;
							dy = y + 1;
						}
					}
					if ((this.map[x][y + 1] === Sprite.changer) && ((this.map[x][y] === Sprite.stone) || (this.map[x][y] === Sprite.uvstone)) && (this.map[x][y + 2] === Sprite.marker))
					{
						dy = y + 2;
					}
				}
				if ((dx != x) || (dy != y))
				{
					if ((dy - y) === 2)
					{
						this.map[dx][dy] = Sprite.diamond;
					}
					else
					{
						this.map[dx][dy] = this.map[x][y];
						if (this.map[dx][dy] === Sprite.uvstone)
						{
							this.map[dx][dy] = Sprite.stone;
						}
					}
					this.map[x][y] = Sprite.nothing;

					if ((this.map[dx][dy+1] === Sprite.stone) || (this.map[dx][dy+1] === Sprite.diamond) || (this.map[dx][dy+1] === Sprite.wall) || (this.isGhost(dx,dy+1)))
					{
						this.soundTable[Sound.stone] = true;
					}

					if (this.isPlayer(dx, dy+1)) 
					{
						this.player.alive = false;
					}
					if (this.isGhost(dx, dy+1)) 
					{
						this.killGhost(this.map[dx][dy + 1]);
					}
				}					
			}
		}
	}

	for (var i = 0; i < this.ghosts.length; i++)
	{
		this.moveGhost(this.ghosts[i]);
	}

	if (this.time > 0) 
	{
		this.time--;
	}
	if (this.time === 0)
	{
		this.player.alive = false;
	}
};

Level.prototype.isPlayer = function(x, y)
{
	return ((this.map[x][y] instanceof Player) || (this.map[x][y] === Sprite.player));
};

Level.prototype.movePlayer = function(keys)
{
	if (this.player.alive)
	{
		this.player.direction = Direction.none;
		var p = new Position(this.player.position);
		var d = new Position(p);
		var z = new Position(d);
		if (keys[Key.left])
		{
			z.x--;
			this.player.direction = Direction.left;
		}
		else
		{
			this.player.stone[0] = false;
			if (keys[Key.right])
			{
				z.x++;
				this.player.direction = Direction.right;
			}
			else
			{
				this.player.stone[1] = false;
				if (keys[Key.up])
				{
					z.y--;
					this.player.direction = Direction.up;
				}
				else if (keys[Key.down])
				{
					z.y++;
					this.player.direction = Direction.down;
				}
			}
		}
		if (!d.equals(z))
		{
			if (this.map[z.x][z.y] === Sprite.nothing)
			{
				this.placePlayer(d.x, d.y);
			}
			if (this.map[z.x][z.y] === Sprite.diamond)
			{
				this.collected += 1;
				this.score += 3;
				this.soundTable[Sound.diamond] = true;
			}
			if (this.map[z.x][z.y] === Sprite.stone)
			{
				if ((z.x > d.x) && (this.map[z.x+1][z.y] === Sprite.nothing))
				{
					if (this.player.stone[1])
					{
						this.map[d.x+2][d.y] = this.map[d.x+1][d.y];
						this.map[d.x+1][d.y] = Sprite.nothing;
					}
					this.player.stone[1] = !this.player.stone[1];
				}

				if ((z.x < d.x) && (this.map[z.x-1][z.y] === Sprite.nothing))
				{
					if (this.player.stone[0])
					{
						this.map[d.x-2][d.y] = this.map[d.x-1][d.y];
						this.map[d.x-1][d.y] = Sprite.nothing;
					}
					this.player.stone[0] = !this.player.stone[0];
				}
			}

			if ((this.map[z.x][z.y] === Sprite.nothing) || (this.map[z.x][z.y] === Sprite.ground) || (this.map[z.x][z.y] === Sprite.diamond))
			{
				this.placePlayer(z.x, z.y);
				this.map[d.x][d.y] = Sprite.buffer;
				this.soundTable[Sound.step] = true;
			}

			if ((this.map[z.x][z.y] === Sprite.exit) || (this.map[z.x][z.y] === Sprite.uvexit))
			{
				if (this.collected >= this.diamonds)
				{
					return true; // next level
				}
			}

			if (this.isGhost(z.x, z.y))
			{
				this.player.alive = false;
			}
		}

		// animate player
		this.player.step++;
		switch (this.player.direction)
		{
			case Direction.left:
			case Direction.right:
				if (this.player.step >= 6)
				{
					this.player.step = 0;
				}
				break;
			case Direction.up:
			case Direction.down:
				if (this.player.step >= 2)
				{
					this.player.step = 0;
				}
				break;
			default:
				if (this.player.step >= 30)
				{
					this.player.step = 0;
				}
				break;
		}
	}
	return false;
};

Level.prototype.placePlayer = function(x, y)
{
	this.map[x][y] = this.map[this.player.position.x][this.player.position.y];
	this.player.position.x = x;
	this.player.position.y = y;
};

Level.prototype.isGhost = function(x, y)
{
	return (this.map[x][y] instanceof Ghost);
};

Level.prototype.moveGhost = function(ghost)
{
	var i, d;
	if (ghost.alive)
	{
		var p = new Position(ghost.position.x, ghost.position.y);
		var w = [ new Position(p), new Position(p), new Position(p), new Position(p) ];
		if ((ghost.type === Sprite.ghost180) || (ghost.type === Sprite.ghost90L) || (ghost.type === Sprite.ghost90R))
		{
			if (ghost.type === Sprite.ghost180)
			{
				if (ghost.direction === Direction.left)  { w[0].x--; w[1].x++; }
				if (ghost.direction === Direction.right) { w[0].x++; w[1].x--; }
				if (ghost.direction === Direction.up)    { w[0].y--; w[1].y++; }
				if (ghost.direction === Direction.down)  { w[0].y++; w[1].y--; }
			}
			else if (ghost.type === Sprite.ghost90L)
			{
				if (ghost.direction === Direction.left)  { w[0].x--; w[1].y++; w[2].y--; w[3].x++; }
				if (ghost.direction === Direction.right) { w[0].x++; w[1].y--; w[2].y++; w[3].x--; }
				if (ghost.direction === Direction.up)    { w[0].y--; w[1].x--; w[2].x++; w[3].y++; }
				if (ghost.direction === Direction.down)  { w[0].y++; w[1].x++; w[2].x--; w[3].y--; }
			}
			else if (ghost.type === Sprite.ghost90R)
			{
				if (ghost.direction === Direction.left)  { w[0].x--; w[1].y--; w[2].y++; w[3].x++; }
				if (ghost.direction === Direction.right) { w[0].x++; w[1].y++; w[2].y--; w[3].x--; }
				if (ghost.direction === Direction.up)    { w[0].y--; w[1].x++; w[2].x--; w[3].y++; }
				if (ghost.direction === Direction.down)  { w[0].y++; w[1].x--; w[2].x++; w[3].y--; }
			}
			for (i = 0; i < 4; i++)
			{
				if (!p.equals(w[i]))
				{
					d = new Position(w[i]);
					if (this.isPlayer(d.x, d.y))
					{
						this.player.alive = false;
					}
					if (this.map[d.x][d.y] === Sprite.nothing)
					{
						if (d.x < p.x) { ghost.direction = Direction.left; }
						if (d.x > p.x) { ghost.direction = Direction.right; }
						if (d.y < p.y) { ghost.direction = Direction.up; }
						if (d.y > p.y) { ghost.direction = Direction.down; }
						this.placeGhost(d.x, d.y, ghost);
						this.map[p.x][p.y] = Sprite.nothing;
						return;
					}
				}
			}
		}
		else if (ghost.type === Sprite.ghost90LR)
		{
			if (ghost.direction === Direction.left)
			{
				w[0].x--; w[3].x++;
				if (ghost.lastTurn === Direction.left) { w[1].y--; w[2].y++; } else { w[1].y++; w[2].y--; }
			}
			else if (ghost.direction === Direction.right)
			{
				w[0].x++; w[3].x--;
				if (ghost.lastTurn === Direction.left) { w[1].y++; w[2].y--; } else { w[1].y--; w[2].y++; }
			}
			else if (ghost.direction === Direction.up)
			{
				w[0].y--; w[3].y++;
				if (ghost.lastTurn === Direction.left) { w[1].x++; w[2].x--; } else { w[1].x--; w[2].x++; }
			}
			else if (ghost.direction === Direction.down)
			{
				w[0].y++; w[3].y--;
				if (ghost.lastTurn === Direction.left) { w[1].x--; w[2].x++; } else { w[1].x++; w[2].x--; }
			}
			for (i = 0; i < 4; i++)
			{
				if (!p.equals(w[i]))
				{
					d = new Position(w[i]);
					if (this.isPlayer(d.x, d.y)) 
					{
						this.player.alive = false;
					}
					if (this.map[d.x][d.y] === Sprite.nothing)
					{
						var lastDirection = ghost.direction;
						if (d.x < p.x) { ghost.direction = Direction.left;  }
						if (d.x > p.x) { ghost.direction = Direction.right; }
						if (d.y < p.y) { ghost.direction = Direction.up;    }
						if (d.y > p.y) { ghost.direction = Direction.down;  }
						if (lastDirection === Direction.left)
						{
							if (ghost.direction === Direction.down)  { ghost.lastTurn = Direction.left;  }
							if (ghost.direction === Direction.up)    { ghost.lastTurn = Direction.right; }
						}
						else if (lastDirection === Direction.right)
						{
							if (ghost.direction === Direction.down)  { ghost.lastTurn = Direction.right; }
							if (ghost.direction === Direction.up)    { ghost.lastTurn = Direction.left;  }
						}
						else if (lastDirection === Direction.up)
						{
							if (ghost.direction === Direction.left)  { ghost.lastTurn = Direction.left;  }
							if (ghost.direction === Direction.right) { ghost.lastTurn = Direction.right; }
						}
						else if (lastDirection === Direction.down)
						{
							if (ghost.direction === Direction.left)  { ghost.lastTurn = Direction.right; }
							if (ghost.direction === Direction.right) { ghost.lastTurn = Direction.left;  }
						}
						this.placeGhost(d.x, d.y, ghost);
						this.map[p.x][p.y] = Sprite.nothing;
						return;
					}
				}
			}
		}
	}
};

Level.prototype.placeGhost = function(x, y, ghost)
{
	this.map[x][y] = ghost;
	ghost.position.x = x;
	ghost.position.y = y;
};

Level.prototype.killGhost = function(ghost)
{
	if (ghost.alive)
	{
		var p = new Position(ghost.position.x, ghost.position.y);
		for (var y = p.y - 1; y <= p.y + 1; y++)
		{
			for (var x = p.x - 1; x <= p.x + 1; x++)
			{
				if ((x > 0) && (x < 19) && (y > 0) && (y < 13))
				{
					if (this.isPlayer(x, y))
					{
						this.player.alive = false;
					}
					else
					{
						if (this.isGhost(x, y))
						{
							this.map[x][y].alive = false;
							this.score += 99;
						}
						this.map[x][y] = Sprite.nothing;
					}
				}
			}
		}
		ghost.alive = false;
	}
};

var Display = function(canvas, imageData)
{
	this.context = canvas.getContext("2d");
	this.imageData = imageData;
	
	this.context.fillStyle = "#00ffff"; 
	this.context.fillRect(0,  2, 320, 4);
	this.context.fillRect(0, 26, 320, 4);
	this.context.fillStyle = "#920205"; 
	this.context.fillRect(0, 8, 320, 16);
	this.drawText(this.context, 0,  8, "  ROOM:     TIME:        DIAMONDS:      ");
	this.drawText(this.context, 0, 16, "  LIVES:    SCORE:       COLLECTED:     ");

	this.screenTable = [];
	for (var x = 0; x < 20; x++)
	{
		this.screenTable[x] = [];
		for (var y = 0; y < 14; y++)
		{
			this.screenTable[x][y] = 0;
		}
	}
};

Display.prototype.paint = function(game, level, blink)
{
	// update statusbar
	this.context.fillStyle = "#920205"; 
	this.drawText(this.context,  9 * 8,  8, this.formatNumber(game.room + 1, 2));
	this.drawText(this.context,  9 * 8, 16, this.formatNumber(game.lives, 2));
	this.drawText(this.context, 19 * 8, 16, this.formatNumber(game.score, 5));
	this.drawText(this.context, 19 * 8,  8, this.formatNumber(level.time, 5));
	this.drawText(this.context, 36 * 8,  8, this.formatNumber(level.diamonds, 2));
	this.drawText(this.context, 36 * 8, 16, this.formatNumber(level.collected, 2));

	// paint sprites
	for (var x = 0; x < 20; x++)
	{
		for (var y = 0; y < 14; y++)
		{
			var spriteIndex = this.getSpriteIndex(level.map[x][y], blink);
			if (this.screenTable[x][y] != spriteIndex)
			{
				this.screenTable[x][y] = spriteIndex;
				this.context.drawImage(this.imageData[0], spriteIndex * 16, 0, 16, 16, x * 16, y * 16 + 32, 16, 16);
			}
		}
	}
};

Display.prototype.drawText = function(context, x, y, text)
{
	for (var i = 0; i < text.length; i++)
	{
		var index = text.charCodeAt(i) - 32;
		this.context.fillRect(x, y, 8, 8);
		this.context.drawImage(this.imageData[1], 0, index * 8, 8, 8, x, y, 8, 8);
		x += 8;
	}	
};

Display.prototype.formatNumber = function(value, digits)
{
	var text = value.toString();
	while (text.length < digits)
	{
		text = "0" + text;
	}
	return text; 
};

Display.prototype.getSpriteIndex = function(value, blink)
{
	switch (value)
	{
		case Sprite.nothing:   return 0;
		case Sprite.stone:     return 1;
		case Sprite.ground:    return 2;
		case Sprite.uvexit:    return 0;
		case Sprite.diamond:   return 13 - ((blink + 4) % 6);
		case Sprite.wall:      return 14;
		case Sprite.exit:      return 32;
		case Sprite.changer:   return 33;
		case Sprite.buffer:    return 0;
		case Sprite.marker:    return 0;
		case Sprite.uvstone:   return 0;
		case Sprite.player:    return 15;
		default:               return value.getImageIndex();
	}
};

var Loader = function()
{
	this.count = 0;
	this.imageData = null;
	this.audioData = null;
};

Loader.prototype.loadImageData = function(data)
{
	this.count += data.length;
	this.imageData = data;
};

Loader.prototype.loadAudioData = function(data)
{
	this.audioData = data;
};

Loader.prototype.start = function(callback)
{
	var i;

	for (i = 0; i < this.audioData.length; i++)
	{
		var audio = document.createElement('audio');
		if ((audio !== null) && (audio.canPlayType('audio/wav')))
		{
			audio.src = 'data:audio/wav;base64,' + this.audioData[i];
			audio.preload = 'auto';
			audio.load();
		}
		this.audioData[i] = audio;
	}

	var index = 0;
	var count = this.count;
	var onload = function()
	{
		index++;
		if (index == count)
		{
			callback();
		}
	};

	for (i = 0; i < this.imageData.length; i++)
	{
		var image = new Image();
		image.onload = onload;
		image.src = 'data:image/png;base64,' + this.imageData[i];
		this.imageData[i] = image;
	}	
};

var Input = function(canvas, game)
{
	this.canvas = canvas;
	this.game = game;
	this.touchPosition = null;
	this.mouseDownHandler = this.mouseDown.bind(this);
	this.touchStartHandler = this.touchStart.bind(this);
	this.touchEndHandler = this.touchEnd.bind(this);
	this.touchMoveHandler = this.touchMove.bind(this);
	this.keyDownHandler = this.keyDown.bind(this);
	this.keyPressHandler = this.keyPress.bind(this);
	this.keyUpHandler = this.keyUp.bind(this);
	this.canvas.addEventListener("touchstart", this.touchStartHandler, false);
	this.canvas.addEventListener("touchmove", this.touchMoveHandler, false);
	this.canvas.addEventListener("touchend", this.touchEndHandler, false);
	this.canvas.addEventListener("mousedown", this.mouseDownHandler, false);
	document.addEventListener("keydown", this.keyDownHandler, false);
	document.addEventListener("keypress", this.keyPressHandler, false);
	document.addEventListener("keyup", this.keyUpHandler, false);
	this.isWebKit = typeof navigator.userAgent.split("WebKit/")[1] !== "undefined";
	this.isMozilla = navigator.appVersion.indexOf('Gecko/') >= 0 || ((navigator.userAgent.indexOf("Gecko") >= 0) && !this.isWebKit && (typeof navigator.appVersion !== "undefined"));
};

Input.prototype.keyDown = function(e)
{
	if (!this.isMozilla && !e.ctrlKey && !e.altKey && !e.altKey && !e.metaKey)
	{
		this.processKey(e, e.keyCode);
	}
};

Input.prototype.keyPress = function(e)
{
	if (this.isMozilla && !e.ctrlKey && !e.altKey && !e.altKey && !e.metaKey)
	{
		this.processKey(e, (e.keyCode != 0) ? e.keyCode : (e.charCode === 32) ? 32 : 0);
	}
};

Input.prototype.keyUp = function(e)
{
	     if (e.keyCode == 37) { this.game.removeKey(Key.left);  }
	else if (e.keyCode == 39) { this.game.removeKey(Key.right); }
	else if (e.keyCode == 38) { this.game.removeKey(Key.up);    }
	else if (e.keyCode == 40) { this.game.removeKey(Key.down);  }
};

Input.prototype.processKey = function(e, keyCode)
{
	     if (keyCode == 37) { this.stopEvent(e); this.game.addKey(Key.left);  } // left
	else if (keyCode == 39) { this.stopEvent(e); this.game.addKey(Key.right); } // right
	else if (keyCode == 38) { this.stopEvent(e); this.game.addKey(Key.up);    } // up
	else if (keyCode == 40) { this.stopEvent(e); this.game.addKey(Key.down);  } // down
	else if (keyCode == 27) { this.stopEvent(e); this.game.addKey(Key.reset); } // escape
	else if ((keyCode == 8) || (keyCode == 36)) { this.stopEvent(e); this.game.nextLevel(); } // backspace or delete
	else if (!this.game.isAlive()) { this.stopEvent(e); this.game.addKey(Key.reset); }
};

Input.prototype.mouseDown = function(e) 
{
	e.preventDefault(); 
	this.canvas.focus();
};

Input.prototype.touchStart = function(e)
{
	e.preventDefault();
	if (e.touches.length > 3) // 4 finger touch = jump to next level
	{
		this.game.nextLevel();
	}
	else if ((e.touches.length > 2) || (!this.game.isAlive())) // 3 finger touch = restart current level
	{
		this.game.addKey(Key.reset);
	}
	else
	{
		for (var i = 0; i < e.touches.length; i++)
		{
			this.touchPosition = new Position(e.touches[i].pageX, e.touches[i].pageY);
		}
	}
};

Input.prototype.touchMove = function(e)
{
	e.preventDefault();
	for (var i = 0; i < e.touches.length; i++)
	{
		if (this.touchPosition !== null)
		{
			var x = e.touches[i].pageX;
			var y = e.touches[i].pageY;
			var direction = null;
			if ((this.touchPosition.x - x) > 20)
			{
				direction = Key.left;
			}
			else if ((this.touchPosition.x - x) < -20)
			{
				direction = Key.right;
			}
			else if ((this.touchPosition.y - y) > 20)
			{
				direction = Key.up;
			}
			else if ((this.touchPosition.y - y) < -20)
			{
				direction = Key.down;
			}
			if (direction !== null)
			{
				this.touchPosition = new Position(x, y);			
				for (var i = Key.left; i <= Key.down; i++)
				{
					if (direction == i)
					{
						this.game.addKey(i);
					}
					else
					{ 
						this.game.removeKey(i);
					}
				}
			}
		}
	}
};

Input.prototype.touchEnd = function(e)
{
	e.preventDefault();
	this.touchPosition = null;
	this.game.removeKey(Key.left);
	this.game.removeKey(Key.right);
	this.game.removeKey(Key.up);
	this.game.removeKey(Key.down);
};

Input.prototype.stopEvent = function(e)
{
	e.preventDefault();
	e.stopPropagation();
};
Function.prototype.bind = function(obj)
{
	var fn = this;
	return function()
	{
		return fn.apply(obj, arguments);
	};
};

var Digger = function(element)
{
	this.canvas = element;
	this.canvas.focus();
	this.loader = new Loader();
	this.loader.loadAudioData(this.soundData);
	this.loader.loadImageData(this.imageData);
	this.loader.start(this.loaderCallback.bind(this));
};

Digger.prototype.loaderCallback = function()
{
	this.display = new Display(this.canvas, this.imageData);
	this.input = new Input(this.canvas, this);
	this.blink = 0;
	this.restart();
	this.intervalHandler = this.interval.bind(this);
	window.setInterval(this.intervalHandler, 50);
};

Digger.prototype.addKey = function(key)
{
	if (key < 4)
	{
		this.keys[key] = true;
	}
	else if (key == Key.reset)
	{
		this.lives--;
		if (this.lives >= 0)
		{
			this.loadLevel();
		}
		else
		{
			this.restart();
		}
	}
};

Digger.prototype.removeKey = function(key)
{
	if (key < 4)
	{
		this.keysRelease[key] = true;
	}
};

Digger.prototype.restart = function()
{
	this.lives = 20;
	this.score = 0;
	this.room = 0;
	this.loadLevel();
};

Digger.prototype.loadLevel = function()
{
	this.level = new Level(this.levelData[this.room]);
	this.keys = [ false, false, false, false ];
	this.keysRelease = [ false, false, false, false ];
	this.tick = 0;
	this.paint();
};

Digger.prototype.nextLevel = function()
{
	if (this.room < (this.levelData.length - 1))
	{
		this.room++;
		this.loadLevel();
	}
};

Digger.prototype.isAlive = function()
{
	return (this.level === null) || (this.level.player.alive);
};

Digger.prototype.interval = function()
{
	var i;
	this.tick++;
	this.blink++;
	if (this.blink == 6)
	{
		this.blink = 0;
	}
	if ((this.tick % 2) === 0)
	{
		this.level.soundTable = [];
		for (i = 0; i < this.soundData.length; i++)
		{
			this.level.soundTable[i] = false;
		}

		// keyboard
		for (i = 0; i < 4; i++)
		{
			if (this.keysRelease[i])
			{
				this.keys[i] = false;
				this.keysRelease[i] = false;
			}
		}

		this.level.update();
		if (this.level.movePlayer(this.keys))
		{
			this.nextLevel();
		}
		else
		{
			this.level.move();

			// play sound
			for (i = 0; i < this.level.soundTable.length; i++)
			{
				if (this.level.soundTable[i] && this.soundData[i])
				{
					if (!!this.soundData[i].currentTime)
					{
						this.soundData[i].pause();
						this.soundData[i].currentTime = 0;
					}
					this.soundData[i].play();
					break;
				}
			}
		}
	}

	this.score += this.level.score;
	this.level.score = 0;

	this.paint();
};

Digger.prototype.paint = function()
{
	var blink = ((this.blink + 4) % 6);
	this.display.paint(this, this.level, blink);
};

Digger.prototype.levelData = [
"ZmZmZmZmZmZmZmUiIiIcEmIiJlZgEmZiERJiIiZWYCJlYhESYmZmVmAlZWYiIlJiIlZgJVVWZlIiYiFWZmZmVVZWZmIiVmERElVWVmVSIVZmFSBWVlZiUiFWYRWgZlZWYlIhVmYVIGVWVmJSIVZhFSBlUhJVUiFWZhUhZVISVVIiVmZmZmZmZmZmZmYBAECcQAQLUwAAAAAAAAAA", // 01
"ZmZmZmZmZmZmZmoBAiIiIiIAARZmZgImZmFiVVVWYiICJlVhYiIiJmJRUSZVYWIAARZiJlZmVWFiVVVWYiZVVlVRYiIiJmImVlZVYWIiIiZiJlVmZmFiIiImYiZlVWwhIiIiJmIiZlYiJmZmIhZiIiZmIiIiIiEWYiACIiERVVVVVmZmZmZmZmZmZmYCnEA4QQEDQgAAAAAAAAAA",
"ZmZmZmZmZmZmZmERERERERFhERZgAiIiIiIiYREWYAIiIiIiIm7u5mACZiIiIiEiIqZgAiImIiIlJSLGYAIiIiISIiElVm4iIiIiIiIiIiZgBlZWFVZmZmZmYAYGVhVWAAAAVmAGBlZlZgAAAFZgAAYGZWAAAABWYAAABmVVVVVVVmZmZmZmZmZmZmYDOEHUQRIGNgAAAAAAAAAA",
"ZmZmZmZmZmZmZmVVVVVlFRUVFRZgAHAAYAcAAAAGYREREWIiIiIixmEREREiIiIiIiZu7u7iIiIRESImYiIiIiIiFRUiJmIiIiISImZmIiZhEREhEiIiJiIWYiIqIhESIhYSVmZmZiISIiVWUiZiISEiEiJSJiIWZRIiIRIhERYiVmZmZmZmZmZmZmYE1EGsUQULIAAAAAAAAAAA",
"ZmZmZmZmZmZmZmFhVSIiJlVQASZqIiIlZlYiIGYmYGBgZmImAABiJmBgYGUBJgMAYmZgYGBmBmZhImUmY2BgYQZmFmBmBmBgYGY2IiVgxiZlYGBlBmAGYCYGYmBgZSFgBlBWJmViY2ZmYBZRVgZiZWABJmAmZmYmZWVlUlZgUgICBmZmZmZmZmZmZmYFrFHYTwEEICIAAAAAAAAA", // 05
"ZmZmZmbGZmZmZmIAAAAHAAAAAFZlZmZmZmZmZmYmYmUiIiIiIiJWVmViZmZmYmZmJiZiYmAAAPAABiZWZWJgZmZmZgYmJmJiYGAFUAYGJlZlYmAAYAYABiYmYmJmZmZmZmYmVmVlIiIiIiIiViZiZmZmamZmZmZWZQAAAAAAAAAAJmZmZmZmZmZmZmYG2E9wQgkNGDIAAAAAAAAA",
"ZmZmZmZmZmZmZmEREREVVVa7u8ZiIiIi5VVWu7u2YwAAABVVVgu7tmIiIiLlVVYAAAZiIiIiFVVWEAAGYiIiImZmZhZmZmMQAiIiIiISIiZhEiIgIiIiEiImYRJSICIiIhIiJmEVVSAiIiISIiZhEREgIiIiEiImYqIiIyIiIiIiJmZmZmZmZmZmZmYHcEKoQwIOJiIiIiIiIiIh", // 07 (05)
"ZmZmZmZmZmZmZmIiIiIiIiIRIiZiEhISEhIiIiImYSEhISEhIiIiJmZmZmZmZgLiIiZiERERERHmIiImYiIiIiIiBiIiJmIiIiIiIAYiIiZiIiIiIgAGIiImYiIiIiAABiIiJmIiIiIiIiYiIiZiIiIiIiEWZmYmaiIiIiIiIiIiLGZmZmZmZmZmZmYIqEMMQwEOEQAAAAAAAAAA", // 08 (07)
"ZmZmZmZmZmZmZmIiIiJrAAAAAAZjADAFZmBmZgMGYiImJmAAAAYABmAANrZmJmYGMAZiIiYGMAAGBgMGYAMGBlVVVgYABmIiJgZVVTYGMAZgMAYGVVVWBgMGYiImBmZmZgYABmMABgAAAAAGMAZiIiZmZmZmZgAGaiImwAAAAAAABmZmZmZmZmZmZmYJDENERAEOFSIgMAICMCAg", // 09 (06)
"ZmZmZmZmZmZmZmIiIiIiIiIiIiZiIiIiIiIiIiImYiIiIiIiIiIiJmIiIiIiIiIiIiZiIiIiIiIiIiImYiIiIiIiIiIiJmIiIiIiIiIiIiZiIiIiIiIiIiIma7u7u7AAACEiJmu7u7uwAAABEiZlVVVVVVVVUiImbFVVVVVVVVIipmZmZmZmZmZmZmYQRER0UBIOJyIiIiIiIiIi", // 10 (08)
"ZmZmZmZmZmZmZmJiYmJiYmJiYmZiYmJiAmJiYmLGYmJiAgICYmJiBmJiAgICAgJiAgZiAgICsgICAgIGYgICsgKyAgICtmICsgICArICsgZisgICAgICsgIGYgICAmICAgICBmICAmJiYgICAmZiAmJiYmJiAmJmamJiYmJiYmJiZmZmZmZmZmZmZmYRdFDgRAEOAAAAAAAAAAAA", // 11 
"ZmZmZmZmZmZmZmIREREREiIiJhZiIiIiIiIiIiYWYiIiIiIiIiImFmoiIiIiIiIiJiZiISEhBiIiIiImYiIiIgYiYiIiJmIiIiImImIAICZiIiEhJiJu7u7mYiIiIiIiYAAABmADAwAAAGAAAAZmYAADAABgAAAGbGUFIiIlYAAABmZmZmZmZmZmZmYS4ER8RQEGEjIgAAAAAAAA", // 12 (09)
"ZmZmZmZmZmZmZmISEhISEhISEhZhISEhISEhISEWYhISEhISEhISZmEhISEhISEhImZiEhISEhISEiJmYSEhISEhISZmZmIiIiIiIiIiIiZiIiImIiIiIiImYiIiJmAiIiIAtmIiIiZgZiIiIiZqIiImYG4iIiImbCIiJmBiIiIiJmZmZmZmZmZmZmYTfEUYRgENIDAAAAAAAAAA", // 13 (10)
"ZmZmZmZmZmZmZmsLAAICAgICAlZlVVUGAgICAgJWZmZmBgICAgICVmAAAAYyMjIyMlZgZmZmZmZmZmFWYAAABmxVIiJiJmZmZgBmZiIiYiZgAAAGZVUgAGImYGZmZmZmILBiJmAAAKZVVSAAYiZmZmYGZmYgsGImYAAABlVVIABiJmZmZmZmZmZmZmYUGEa0RgYMIyIRERIwAAAA", // 14 (11)
"ZmZmZmZmZmZmZmAAAlUSIhISEhZhIgJVUgISEiEmZRIAVVIiEhIhJmESAFZmIhISEhZhEgVmIiISEhIWZmAGZSIiIiIiJmFgFRVgAAAAAAZhYGZmVWMAMAA2YKBlVlVmAzAwBmZjZlZVVgMDMwZmAwZWZlYwAwA2ZszGVVVWMAAABmZmZmZmZmZmZmYVtEbsRwILMCIzMyIjIjMy", // 15
"ZmZmZmZmZmZmZmIVESJhFiIhIlZiFSIioiAAAmZmYhVmEgBgAAIhVmIRFhABYCIiISZiIVZgImIiMAIWZmYSBRVlYgMBJmIiElERZWIAMhZiZmZmZmZiAwEmYSERASVVESIiJm4RIiIiUiIiISZlJTAAABAAEhUWZQESUiEgDCFRVmZmZmZmZmZmZmYW7EckSQgEICMjMAAAAAAA", 
"ZmZmZmZmZmZmZmERYRFiIiwRERZiomERYAMGEREWYgJhEWAANmZVVmICYRFgAwZVVVZiAmERYDAGIiImYiJmFmMABiUiJmIiIiIiIiIiUiZiJVUiIiIiIiJWYiIiIhISIlJSJmIiIiISEiIiJSZmZmZmYmZmZmZmYwAAAABVVVVVVmZmZmZmZmZmZmYXJEkQUQIEICIzMwAAAAAA",
"ZmZmZmZmZmZmZmBWAiYiAAVhEhZvZgYmJgUCYioWYAAGJiayAmImZmZmJiImAABiIiZiFiZmZmUAYRJmYVYlZSViAGISJmEWYmJmZgBgIiZlUAAAZQYAZRJmZiZmZmIGxmYiFmAAAAAABmYgEhZgZmZmAAYhIGZmYAVWVwAAAQADBmZmZmZmZmZmZmYYEFHASREEEgAiAAAAAAAA",
"ZmZmZmZmZmZmZmEREREREiUVEiZiIiIiIiZmFiEmYiIiIiImthayJmpSUlJSJmYWVSZibu5iYiZWFmYmY2AAYmICIiIiJmJgAGJiAlISUiZiZmZiYgJSEiImYmVVYmICIhIiJmJlVWJiMlISIiZiZVViZmZiEiFWYiIiIyUiMhIlVmZmZmZmZmbGZmYZwEn4SgEGMQAAIAAAAAAA",
"ZmZmZmZmZmZmZmEREWsBESIhIcZhERFgAREiISImYRERYAIiImZmZmEREWIiIiERERZu7u5iIlsAAAAGYiIiIiZmIiIiJmMAAAVRFgAwAAZiIiIiIiYwAAAGYwAAAAEWAAAwBmIiIiUiFmZmZmZiIiIiIiYhISEmaiIiIiImIlJSVmZmZmZmZmZmZmYg+EqUSwEOJyAiIiAAAAAA", // 20
"ZmZmZmZmZmZmZmURFVEhERIiIgZlEWURYiJhEsYGZmESYVFiEmIRBmARZRFhEWIiZgZrYRViEmISYhEGYFFhUWIiYhJmBmZiUWEiYiJiEQZgsmERYiJiImYGYGIiYiJhImIRBmACYiJiImISIgZmYiJiImIiYiIGaisAsAsAAAAABmZmZmZmZmZmZmYhlEswTAEOCSAiIAAAAAAA",
"ZmZmZmZmZmZmZmEiERYlUWAAB2ZhIiJmIVFgVVUGYiIiKiW8YGZmBmJSAGbmZmAAAAZmJmZmAiIiIiImYwAAZgAAAAA2ZmYiImYAAAMAAAZjAABmZmZmZmZmYiIiJjJgADAABmZmZmYCYmImJiZgERIiAmJmZmYmYVFQAAAwbCIiJmZmZmZmZmZmZmYiMEzMTAcFCTAjMgMgAAAA",
"ZmxmZmZmZmZmZmESIhFVVha1tbZmMWERVWImW1tWYSFhEVVWNrW1tmEhZVVVVgZbW1ZhIWZmZmYGZmZmYSFgAAAGABERFmVVUAAAAAAiVVZiYmIiIiIGZmZmYiIisAESAAAABmZmYRERIgZmZgZgESIiIhIAAAAGYVGiUiUiAAcABmZmZmZmZmZmZmYjzExQRwQOFwACAAAAACIA",
"ZmZmZmZmZmZmZmEREREWIREREiZiIiIiJiERERImawACJVYiIiIiJmsiIiZmIiIiIiZmZmYlViJmZiImYiIiJmZia7YmJmIiIBZVImu2JgZiIgAWVVJgBiYGYiAAFmZia7YmBmIAABYwAGVWJgZgAAAWVVVlViYGYAoAFlVVxVwmtmZmZmZmZmZmZmYkUEc8TwMOICAREREhAAAA",
"ZmZmZmZmZmZmZmAAYAVgAAAAAAZgAAAGYGYGAwAGYDBmBWAAAAAwVmAAMGZmYDAwAGZgAAAAAAAAAABWYDBgMGZmYAZmZmAAAAAAAABlAFZgZmZgMAAwBgBmYAAAAAAAADAwVmAwZmZgMGAAAGZgAAAAAABgAABWbFAwAGpgMABlVmZmZmZmZmZmZmYlPE+ISAkOESACACACACAi", // 25
"ZmZmZmZmZmZmZmIhEQACISIhABZhIRESIiYSFgImYSVVUREmISZSFmImZmZmJiIhIhZgAABhESYiFmZmYGBgYiIiIhYABmBnYGJmYRImdmZgZmBiZREiJgBmYGdgYmZhIiZmZmBgYGJSYVZwAFZgYGBiZmEWAiAmagUAYiIVVgAHVmZmZmZsZmZmZmYmiEhcSgEOBxEQEAAAAAAA",
"ZmZmZmZmZmZmZmEmViIgIyIiIhZiJmYiICAiZmYmYRYiIiMgImMAJmImIiIgICJiIiZiIQIiIiIiIiImYiYCISEhISIRJmImAubm5ubmZiZiFlEAAAAAAGImYiZVFRa2FQtiJmJmZmZmZmZmbmZgAAAAAwAAAAAGbKAAAAAAAwAABmZmZmZmZmZmZmYnXEpoTQIOAQAgAjAAAAAA",
"ZmZmZmZmZmZmZmxhEREhEiIltrZgYiIiImIiJVYmYGEiIiJiIiIjJmBmEREiYiIiIAZgpiIiImIiIiAGYGYiIiJiIiIgBmBgAAsgIiJmZgZgYFVQICUiZVYGYGAiICAjVWIm9mBrAAArIltlVgZgZmZmZmZmZmYGYAAAAAAAAAAABmZmZmZmZmZmZmYoaE0ETgIHEAADACEAAAAA",
"ZmZmZmZmZmZmZmsAAAYACwBlVQZgZmUAtmZQZmYGYAAGBgAAYAAABmAFAAVmYAIiIlZmZmZiIhIiUlVWYiIiZmIiIhEhJmADABAAAAChISZiUiVgJgZmZiZmaiJSYiYGMAAABmZmZmAGxiIiImZgsAAlVWuwAABWYACwVVVgAABVVmZmZmZmZmZmZmYpBE6gTgELJgMiMiAAAAAA",
"ZmZmZmZmZmZmZmAAsAAACwAAALZgZmYmZmZmZmYGYGFRIpJgBQA2BmDGZiKSZgZmZgZrZaJSJSUiUhYGYGZmIgIiIiVWBmBgBhICAgIVVgZgYABSAiAlURa2YGAAIjIiURVWBmBguyVSJRVVVgZgZmZmZmZiZmYGawAAALAAAAsABmZmZmZmZmZmZmYwoE4AAAQHIzMzASESIgAA", // 30
"ZmZmZmZmZmZmZmxlImUVERJWAVZlIiBiIlFiFiZmZSZiImYi/yIiJmIiJRFRVlZmAKZmZiYmIiIiJiImYAYmAAZmEVEiVmIiJRYCIgIiBmZiZiVWIiImViIWYiIiIiImIlYiJmAQAGBmZgBmASZlFmAQYVUiIiYmZWFVFWIiZiImVmZmZmZmZmZmZmYziFMkVBIGJQAAAAAAAAAA", // extra
"ZmZmZmZmZmZmZmIiIiIiIiIiIiZiIiIiIiIiIiImYiIAciBwInACJmIiAAIgACIAAiZiIlACJQAiUAImYiIiIiIiIiIiJmIiIiIiIiIiIiZiIgACIAAiAAImYiJwAiBwIgByJmIiUAIlACJQACZiIiIiIiIiIiImbKIiIiIiIiIiJmZmZmZmZmZmZmY1wFRcVQIOBiIiIiIiIiIh",
"ZmZmZmZmZmZmZmAAdiISJSxgAHZgAAYiEVIiYAAGZQACIRUSIiUABmZmZiVSIlJmZmZgAHYiIlUAYAB2YAAGIRIiImAABmUAAiEgAiIlAAZmZmYiIAISZmZmYiUmIiICIiAAdmJVJiIiIiJgAAZiIiIiIiISYAAGagImASJQImUABmZmZmZmZmZmZmY2XFX4VQEOFyIgMAICMCAg",
"ZmZmZmZmZmZmZmFRVRUVVRFRURZlFVFRURVVFVVWYVVVUVVVFVUVFmVRVVUVFVVVUVZhVVUVUVFRUVUWZmYmZmZmZiZmZmAAAABgAAAAAMZgAAAAYAAAAAAGYAAAAGAAAAAABmAAAAAgAAAAAAZgAAAAYBARAAAGahVVFWFVFVAVVmZmZmZmZmZmZmY3+FWUVgEOZgAAAAAAAAAA",
"ZmZmZmZmZmZmZmERERIhERERERZhERESACIiIiImYREREiIiIiIiJmERERIiIiIiIiZiIiIiIiIiIu7mYiIiIiIiIiIiJmAAACJQAAAAAAZgAAAiVQAAAAAGYAAAIlVQAAAABmImZmYiJmbiIiZnd3d3dwAAAiImZ3fHd3AAAAIgpmZmZmZmZmZmZmY4lFYwVxIOFiIiIiIAIiIi", // 35
"ZmZmZmZmZmZmZmwiIiIiIiIhIiZmYiIgAHACIhEmYGIiICIiAgEiJmpiIiAiIgIiIiZgZmVgZmYGAAAGYABlYAEAdlAABmAQZWBmZgZVAAZgZmVgZ3YGVVAGYGVVYGd2BlVVBmBlVWBgAAZVVVZgZmZgZmYGZmZmYAAAAP8AAAB3dmZmZmZmZmZmZmY5MFfMVwEGJDIgAAAAAAAA",
"ZmZmZmZmZmZmZmBwYRERUREWAHxgAGURFRFRFgAGYABhFREVUVYABmAAYVFREREWAAZlAGERFRVRFlAGYiIiIiIiIiIiJmIiIiIiIiIiIiZiIiAAAAAAAiImYqIgAAAAAAIiJmZmYAAAAAAGZmZgcABwAHAAcAB2YAcABwAHAAcABmZmZmZmZmZmZmZCBFmgWQILESIzMyIjIjMy", 
"ZmZmZmZmZmZmZmcA/2cAAAYAAHZlAABgISIGAAAGZVAAAFVVAAAABmZgAAAiIgAABmZnAAAAAAAAAAAGYCVVIMzMAlJSBmAiIiDMzAIiIgZgAAAAAAAAAAB2ZmAAACVSAAAGZmAAAAARFQAAAAZgIiBgIiIGAAAGZyoAYAAAdgAAdmZmZmZmZmZmZmZDoFk8WgMOFSAREREhAAAA",
"ZmZmZmZmZmZmZmV1YiZmZmZgVsZnV2AAoAAAYGYGZVVgZmZmYGAGBmVVYGAAAGBmBgZlVWBgZmBgYAYGZVVgYGdgYGBmBmVVYGAAYGBgBgZlVWBmZmBgZgYGYiJgAAAAYGcGBmIiZmZmZmBmJgZnAAAAAAAAAAAGYiISEiESEiEhJmZmZmZmZmZmZmZEPFrYWggEISMjMAAAAAAA", 
"ZmZmZmZmZmZmZmERERERESBpmZZiIiIiIiIgaZmWaSIiIiIiJ27u5mkiImZmZmBiIiZuYiJlVVVgZmZmYGESZVVVYGmZlmBhEmZmZmBlVVZgYRJnBwZgYiImYGZgbHB2AGIhFmAgB2ZiZmIAACZgZmZgZmJmZmYmaiIACwAABXAABmZmZmZmZmZmZmZF2Fp0WwEONBEQEAAAAAAA", // 40
"ZmZmZmZmZmZmZmUjIlUlVVWiZmZlVSJmZhEVImUWYRAiZmZVIiJlVmEQIgAAIiFiIRZhECIAACIhZiUWYAAREREREWYmZmAAIiIiIiIiIRZgAiIiIiIiIiUWbuYiIiIlFSJVVmAGZmJiUSUiVVZgAAAAZlXGIiJmYAAAAGZmZmZmZmZmZmZmZmZmZmZIsFxMXQ4DQgAAAAAAAAAA",
"ZmZmZmZmZmZmZmYREWZVVgAAACZiIRFmJVYCZmBWYiEiZiImAiUgJmIiIiJgALFhIFZiImZiICIhZSAmYmIiImBSVSVgVmJgBvAHIREiICZibuYCYCERIiAmYmAGBmAlVSIgZmJgAgFQbu4iYlZiZmYFUGAAAmUWYqZmBmxgAAZVVmZmZmZmZmZmZmZJTF3oXQIOQAAAAAAAAAAA", 
"ZmZmZmZmZmZmZmIiIBERERERERZiIiAiJiIiJiImZVVgIiYiIiKiVmUiYGYGZmZSZlZlVWMAAAAAAmZWZlViZmbu7mBmJmZmYiJgAABgJiZmVgAlYAAAYCYmYiIAImZmZmAmJmAAYGUAAAAgIiZgwGBiZVYAIGZmawBjZWJmACNVVmZmZmZmZmZmZmZQ6F2EXhAFMBIRAAAAAAAA",
"ZmZmZmZmZmZmZmIiZiVmJiYmJVZlIAACAAAAAAYmZQBiCwZiJiYABmYGJWZhEWVWZgZmBhERERFmZmAGZQIlVVpVJgJgZmYGzu7u5mICIAZmAGAAAAJiAiK2ZSBgAAACIgEABmUgZVVRUVE2AGZmIAZmYmJiZgYGZmawAAAAAAAGZmZmZmZmZmZmZmZRhF4gXwkINDESAAAAAAAA", 
"ZmZmZmZmZmZmZmAAZlAAoAAABlZgwAAgZmZgZgZWYGZgUFAGAAAGVmAAAGBmBmYGBlZmZmBQBgAAAAZWYABgYFZmBgYGJmBgYFBgYAb2AlZgYABgIGBmZgZmYGZmYGAgAGAGBmBQAABQYGAAAgZgZmZmYGZgBmYGawAAAAAgC2ZVVmZmZmZmZmZmZmZSIF+8XwoDFxEQAAAAAAAA", // 45
"ZmZmZmZmZmZmZmFQIiJWUCIRERZlIGZmVmBhESImYVNlUlZgbu7lVmYgZmZQADAFIVZjAAAGVmACZmImYmFRZlBgAgVRJmVSUSJSYwYGYiZmZmZiEmIGACImYRFlAhVVAgZlVmISIgZmZgAGISZlVWIGUiZmBlVWZVVlNlpSIjxVVmZmZmZmZmZmZmZUWGD0YAkORRAREAAAAAAA", 
"ZmZmZmZmZmZmZmYiBSYmZVJVVVZiJQZVNmZiZmYmZSIGUgZVYAAANmFWBlIGUjJmZlZiVjZWBiYFVlVWZiJmJgZWBmUWZmMAAAUGUgJRUjZmYmZmJmZmIVYGYAAyZiUCIiYmBmZiIiJmBgAANgZgAAAANgVmZiImbGVVYiIyYwACpmZmZmZmZmZmZmZXLGLIYhIOOAMBIDMxIAAA",
"ZmZmZmZmZmZmZmVVVVUQICMAAAZmJmZmYGBgVSEGYBUiVQBgYGZiJmZmZmYmYCBiViZiUgIAAABgYlUmYmYGZmYmZmBmZmUGAQUlNQYAADZiBgIGZgYiImJWZQYCBSICYAALJmIyNlJmACBVUAZmYmJmZQJgIiAGajAAAAYCawAAxmZmZmZmZmZmZmZYyGJkYwEOJwAzESIAAAAA", 
"ZmZmZmZmZmZmZmJSUlVTAAAAAGZgZmJmYGYGJmBmYGMAAGAACgBgZmBgYmVgZmYmYAZgYGViUGVSUmBmYABgZmBgZmADBmBmYAAAAGBmZgZgZQAABgAAIAAGYCJmZmZmYGBgZmBlAAYGMABgYGZjYmYGAAAAAGBmYiIiIlZgY2AAxmZmZmZmZmZmZmZZZGMAZA0FFAQkIgAAAAAA",
"ZmZmZmZmZmZmZmoAAGEAAAYiVVZiIiIlEAACIiIWYiIiEREAAAAiVmZmZmZmBmZmZmZhECJgAAAmFVFWZSIiUQAAJlFVFmZmZmVQACIiIiZiIiJlVQAiIiImYABwZmYGZmZmZmIiImAAAAYQIVZgECIgVQBSIiFWZSAibFIBFiIiJmZmZmZmZmZmZmZj4GV4ZgEDJAAAAABmZmZm", // 50 
"ZmZmZmZmZmZmZmAAEAsAEAAAAAZgYmVmYGZmZmAGY2BmYlBsZVVgBmAQAAVgZhEWYAZgYAACZWIiImIGZVUABWpgAwBgBmZmUAJlZRUVYAZlZmUFZmIiImMGZWZmUmBiUVJgBmVmZmVgJVZVYAZlZmZmY2ZmZm4mZQAwBgAAAAAABmZmZmZmZmZmZmZkeGYQZwkINCAwEgBmZmZm", 
"ZmZmZmZmZmZmZmUhEABgAhIAAAZlIiAAYCEgAABmZSABAGFiAAAABmIAAiBlYCZmZgZgADACBWAAVVYGZmRGZmVgACFWBmAQEBBlYAEhVgZiISAgZWNRJma2YiLuImVgZmBmBmUAAAVlYGxgZgZlUABVZWBmYGYGZVUFVWoAAGAABmZmZmZmZmZmZmZlEGeoZwkONCAAAABmZmZm",
"ZmZmZmZmZmZmZmAAAAAgAABWDBZgZmZgZmZiImYWYGVVYGVVYQZWJmBlZWBlZWIGVgZgZmVgZWZhBlYGb1VVamVVUgVmBmBmZmVmZiZmYAZgIiJmUAAwBWAGYAAAJWAAMAJeBmYSIiZSaWlpYAZlFRYWIi5eXlYGYVJVUVFSIiIlVmZmZmZmZmZmZmZnQGjYaAcIQQIwAABmZmZm", 
"ZmZmZmZmZmZmZmISIiIsIiIiISZiIiIiIiIiIiImYiIiIiIiIiIiJmIiIiIiIiIiIiZiIiIiuzsiIiImYiIiIvVfIiIiJmIiIiK1WyIiIiZiIiIie7ciIiImYiIiIiIiIiIiJmIiIiIiIiIiIiZiIiIiIiIiIiImYiIiIioiIiIiJmZmZmZmZmZmZmZpcGkQagkOAjMzMwAAAAAA", 
"ZmZmZmZmZmZmZmAABABURAAAQAZgBAAAQAQEQAAGZAQEREBEBAREVmAEAABAAAAEQEZgRAREQEBAAAAGYAAAAAAEBERERmREREBARAAAAAZgAEBAAAQEAEBWYEBARAREBERARmBAAEAABAAAAAZtREQARARAREBGagAAAAQAAABABmZmZmZmZmZmZmZwEGqoagEOAwAAAABmZmZm", // 55
"ZmZmZmZmZmZmZmERUSYiIiIiIiZiIiImMAAAACAGYLAABlVVVVVVVmIiIhYDAAAAAAZlVVVVVVVVVVVWYhISEhIAEhISFmEhISEhISEhISZiIiIiIiIiIiImYCIiIiIiIiIiJmMloAAAAAAAAAZgJQAAAAAAAAAGbBIiIiIiIiIiJmZmZmZmZmZmZmZyQGvgawQMKAAAAAAAAAAA",
"ZmZmZmZmZmZmZmIiIiYRERYCIqZiEhImEREWAhImYSEhJhERFgIhJmISEiARERACIiZiIiImEWEWMwAGYDAAJmYWZiISJmIiIiIiIiIiIiZiIiIiIhISEhImZmbu7mIubmLmJmAAAABgADAAAAZlAAAAYAAAADAGZVAAAGAAMFAAxmZmZmZmZmZmZmZ1IG3AbRIDIBIiIgAAAAAA", 
"ZmZmZmZmZmZmZmEREWISEhEgCQZhERFiISEhIAkGYRERYRISESAJBmEREWIiIiIgCQZmERZiIiIiKgCWZmJmAzAAAiIiJmIiImIiIiIiIiZiIiJmZubmIiImZm7uYAawBlVVVmAAAAsGBrZRURZgAAALtjYGFVVWYAAAAAYABlFVxmZmZmZmZmZmZmZ2wG1gbg8HQCIAAAAAAAAA", 
"ZmZmZmZmZmZmZmIRwiIioiIiJlZiEWISEiISERZWYhFiEhIhIhEWVmIhJmZmIiIiJlZiIiYiIiADAAZWZiImJmViIiImVmIiJiZWYAMABlZgMAYiImZmZiFmYmZmYm7u7iICJmERESJgYAIiAiZu7u7iYGBiYgYmYiIiImBgsLACVmZmZmZmZmZmZmZ3YG4AbwoDJyIgAAAAAAAA", 
"ZmZmZmZmZmZmZmIiIhIiIqEiIhZhERIhESEiERImZVVQJVIlIlVbBmUiKyVRJSJSVSZlISAlJSUiURUWZVUgJSUlIlEVJmUiKyUiVSJRFRZlILAlIFUiURUmZREgJSslIlJVBmVVUCUABSJVUrZu7u7u7u7u7u7mbAAAAAAAAAAAxmZmZmZmZmZmZmaAQHAAAAwDdQAAAAAAAAAA" ];
Digger.prototype.imageData = [ "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" ];
Digger.prototype.soundData = [ "UklGRvwDAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAAABkYXRhOAIAAITBhMGEwYTBhMGEwYTBhMGI/4j/iP+I/4j/iP+I/4j/iP+EwYTBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4j/hMGEwYTBhMGEwYTBhMGEwYj/iP+I/4j/iP+I/4j/iP+EwYTBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4TBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4TBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4TBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+EwYTBhMGEwYTBhMGI/4j/iP+I/4j/iP+I/4TBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/hMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+EwYTBhMGEwYTBhMGI/4j/iP+I/4j/iP+EwYTBhMGEwYTBiP+I/4j/iP+I/4j/hMGEwYTBhMGEwYj/iP+I/4j/iP+I/4TBhMGEwYTBhMGI/4j/iP+I/4j/hMGEwYTBhMGEwYj/iP+I/4j/iP+EwYTBhMGEwYj/iP+I/4j/iP+EwYTBhMGEwYj/iP+I/4j/hMGEwYTBhMGEwYj/iP+I/4j/hMGEwYTBiP+I/4j/iP+EwYTBhMGEwYj/iP+I/4TBhMGEwYj/iP+I/4TBhMGEwYj/iP+I/4TBhMGEwYj/iP+I/4TBhMGI/4j/hMGEwYTBiP+I/4TBhMGI/4TBhMGI/4j/hMGI/4TBiP+EwYj/iP9BRkFulQEAAAQLc3RyZWFtdHlwZWSB6AOEAUCEhIQTTlNNdXRhYmxlRGljdGlvbmFyeQCEhAxOU0RpY3Rpb25hcnkAhIQITlNPYmplY3QAhYQBaQOShISECE5TU3RyaW5nAZWEASsERGF0ZYaShISEBk5TRGF0ZQCVhAFkgyJTft3Wm7JBhpKEl5gSVGFibGVzQXJlQmlnRW5kaWFuhpKEhIQITlNOdW1iZXIAhIQHTlNWYWx1ZQCVhAEqhIQBY54AhpKEl5gIQ2hhbm5lbHOGkoSEhA5OU011dGFibGVBcnJheQCEhAdOU0FycmF5AJWWAZKEk5YFkoSXmANNYXiGkoScnYSEAWahgwDw+T6GkoSXmA1BRlJNU1dhdmVmb3JthpKEhIQGTlNEYXRhAJWWCIQEWzhjXX+nrj4AAAAAhpKEl5gOQUZNZWFuV2F2ZWZvcm2GkoSplgijoP91PgAAAACGkoSXmANSTVOGkoScnaahg8u8sD6GkoSXmA1BRk1heFdhdmVmb3JthpKEqZYIowDw+T4AAAAAhoaGhgA=","UklGRqIBAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAAABkYXRhfAEAAITBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4TBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBhMGEwYTBiP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4j/iP+I/4TBhMGEwYj/hMGI/4TBhMGI/4TBhMGI/4j/hMGEwYj/iP+EwYTBiP+I/4TBhMGEwYj/iP+EwYTBhMGI/4j/iP+EwYTBhMGI/4j/iP+EwYTBhMGI/4j/iP+I/4TBhMGEwYj/iP+I/4j/","UklGRkgAAABXQVZFZm10IBIAAAABAAEAQB8AAIA+AAACABAAAABkYXRhIgAAAITBhMGEwYTBhMGEwYTBhMGI/4j/iP+I/4j/iP+I/4j/iP8=" ];
