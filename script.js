/*************************************************************************
 * RequestAnimFrame: a browser API for getting smooth animations
 ************************************************************************/

window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
		return window.setTimeout(callback, 1000 / 60);
	};
})();

window.cancelRequestAnimFrame = (function() {
	return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout
})();

/*************************************************************************
 * Initialize canvas and required variables
 ************************************************************************/

// Canvas element
var canvas = document.getElementById('canvas');
// Initialise the collision sound
var collision = document.getElementById('collide');
// Canvas context
var context = canvas.getContext('2d');
// Window's width
var W = window.innerWidth;
// Window's height
var H = window.innerHeight;
// Set the canvas's width
canvas.width = W;
// Set the canvas's height
canvas.height = H;
// Array containing particles
var particles = [];
// Ball object
var ball = {x: 50, y: 50,  r: 5, c: 'white', vx: 4, vy: 8, draw: function() {
	context.beginPath();
	context.fillStyle = this.c;
	context.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
	context.fill();
}};
// Array containing two paddles
var paddles = [2];
// Mouse object to store it's current position
var mouse = {};
// Varialbe to store points
var points = 0;
// Max FPS (frames per second)
var fps = 60;
// Number of sparks when ball strikes the paddle
var particlesCount = 20;
// Flag variable which is changed on collision
var flag = 0;
// Object to contain the position of collision 
var particlePos = {};
// Varialbe to control the direction of sparks
var multipler = 1;
// Start button object
var startBtn = {w: 100, h: 50, x: W / 2 - 50, y: H / 2 - 25, draw: function() {
	context.strokeStyle = 'white';
	context.lineWidth = '2';
	context.strokeRect(this.x, this.y, this.w, this.h);
	context.font = '18px monospace';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillStlye = 'white';
	context.fillText('Start', W / 2, H / 2 );
}};
// Restart button object
var restartBtn = {w: 100, h: 50, x: W / 2 - 50, y: H / 2 - 50, draw: function() {
	context.strokeStyle = 'white';
	context.lineWidth = '2';
	context.strokeRect(this.x, this.y, this.w, this.h);
	context.font = '18px monospace';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillStlye = 'white';
	context.fillText('Restart', W / 2, H / 2 - 25 );
}};
// Flag varialbe, cahnged when the game is over
var over = 0;
// Variable to initialize animation
var init;
// Variable to detect if the ball hit the paddle
var paddleHit;

/*************************************************************************
 * Initialize the two events for the game
 ************************************************************************/

// Add mousemove event to the canvas
canvas.addEventListener('mousemove', function(e) {
	mouse.x = e.pageX;
	mouse.y = e.pageY;
}, true);
// Add mousedown event to the canvas
canvas.addEventListener('mousedown', btnClick, true);

/*************************************************************************
 * Initialize functions for the game
 ************************************************************************/

/**
 * Allow to create paddle
 */
function Paddle(pos) {
	// Height and width
	this.h = 5;
	this.w = 150;
	// Paddle's position
	this.x = W / 2 - this.w / 2;
	this.y = (pos == 'top') ? 0 : H - this.h;
}

// Push two new paddles into the paddles[] array
paddles.push(new Paddle('bottom'));
paddles.push(new Paddle('top'));

/**
 * Creating particles object
 */
function createParticles(x, y, m) {
	this.x = x || 0;
	this.y = y || 0;
	this.radius = 1.2;
	this.vx = -1.5 + Math.random()*3;
	this.vy = m * Math.random()*1.5;
}

/**
 * Draw everything on canvas
 */
function draw() {
	// Paint the canvas background
	context.fillStyle = 'black';
	context.fillRect(0, 0, W, H);
	// Paint the two paddles
	for(var i = 0; i < paddles.length; i++) {
		p = paddles[i];
		context.fillStyle = 'white';
		context.fillRect(p.x, p.y, p.w, p.h);
	}
	// Paint the ball
	ball.draw();
	// Update the canvas
	update();
}

/**
 * Increase speed after every 5 points
 */
function increaseSpd() {
	if(points % 4 == 0 && Math.abs(ball.vx) < 15) {
		ball.vx += (ball.vx < 0) ? -1 : 1;
		ball.vy += (ball.vy < 0) ? -2 : 2;
	}
}

/**
 * Update positions, score and everything
 */
function update() {
	// Update scores
	context.fillStlye = 'white';
	context.font = '16px monospace';
	context.textAlign = 'left';
	context.textBaseline = 'top';
	context.fillText('Score: ' + points, 20, 20);
	// Move the paddles on mouse move
	if(mouse.x && mouse.y) {
		for(var i = 1; i < paddles.length; i++) {
			p = paddles[i];
			p.x = mouse.x - p.w/2;
		}		
	}
	// Move the ball
	ball.x += ball.vx;
	ball.y += ball.vy;
	// Collision with paddles
	p1 = paddles[1];
	p2 = paddles[2];
	// If the ball strikes with paddles,
	// invert the y-velocity vector of ball,
	// increment the points, play the collision sound,
	// save collision's position so that sparks can be
	// emitted from that position, set the flag variable,
	// and change the multiplier
	if(collides(ball, p1)) {
		collideAction(ball, p1);
	}
	else if(collides(ball, p2)) {
		collideAction(ball, p2);
	} 
	else {
		// Collide with walls, If the ball hits the top/bottom,
		// walls, run gameOver() function
		if(ball.y + ball.r > H) {
			ball.y = H - ball.r;
			gameOver();
		} 
		else if(ball.y < 0) {
			ball.y = ball.r;
			gameOver();
		}
		// If ball strikes the vertical walls, invert the 
		// x-velocity vector of ball
		if(ball.x + ball.r > W) {
			ball.vx = -ball.vx;
			ball.x = W - ball.r;
		}
		else if(ball.x -ball.r < 0) {
			ball.vx = -ball.vx;
			ball.x = ball.r;
		}
	}
	// If flag is set, push the particles
	if(flag == 1) { 
		for(var k = 0; k < particlesCount; k++) {
			particles.push(new createParticles(particlePos.x, particlePos.y, multiplier));
		}
	}
	// Emit particles/sparks
	emitParticles();
	// reset flag
	flag = 0;
}

/**
 * Check collision between ball and one of the paddles
 */
function collides(b, p) {
	if(b.x + ball.r >= p.x && b.x - ball.r <=p.x + p.w) {
		if(b.y >= (p.y - p.h) && p.y > 0) {
			paddleHit = 1;
			return true;
		}
		else if(b.y <= p.h && p.y == 0) {
			paddleHit = 2;
			return true;
		}
		else {
			return false;
		}
	}
}

/**
 * Set a collide action
 */
function collideAction(ball, p) {
	ball.vy = -ball.vy;
	if(paddleHit == 1) {
		ball.y = p.y - p.h;
		particlePos.y = ball.y + ball.r;
		multiplier = -1;	
	}
	else if(paddleHit == 2) {
		ball.y = p.h + ball.r;
		particlePos.y = ball.y - ball.r;
		multiplier = 1;	
	}
	points++;
	increaseSpd();
	if(collision) {
		if(points > 0) {
			collision.pause();
		}
		collision.currentTime = 0;
		collision.play();
	}
	particlePos.x = ball.x;
	flag = 1;
}

/**
 * Emitting particles
 */
function emitParticles() { 
	for(var j = 0; j < particles.length; j++) {
		par = particles[j];
		context.beginPath();
		context.fillStyle = 'white';
		if (par.radius > 0) {
			context.arc(par.x, par.y, par.radius, 0, Math.PI * 2, false);
		}
		context.fill();
		par.x += par.vx;
		par.y += par.vy;
		// Reduce radius so that the particles die after a few seconds
		par.radius = Math.max(par.radius - 0.05, 0.0);
	} 
}

/**
 * Run when the game overs
 */
function gameOver() {
	context.fillStlye = 'white';
	context.font = '20px monospace';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText('Game Over - You scored ' + points + ' points!', W / 2, H / 2 + 25);
	// Stop the Animation
	cancelRequestAnimFrame(init);
	// Set the over flag
	over = 1;
	// Show the restart button
	restartBtn.draw();
}

/**
 * Running the whole animation
 */
function animloop() {
	init = requestAnimFrame(animloop);
	draw();
}

/**
 * Execute at startup
 */
function startScreen() {
	draw();
	startBtn.draw();
}

/**
 * Restart and start
 */
function btnClick(e) {
	// Variables for storing mouse position on click
	var mx = e.pageX;
	var my = e.pageY;
	// Click start button
	if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w) {
		animloop();
		// Delete the start button after clicking it
		startBtn = {};
	}
	// If the game is over, and the restart button is clicked
	if(over == 1 && mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
		ball.x = 20;
		ball.y = 20;
		points = 0;
		ball.vx = 4;
		ball.vy = 8;
		animloop();
		over = 0;
	}
}

// Show the start screen
startScreen();