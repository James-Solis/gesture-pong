// Gesture Pong
// Move the paddle with arm motions read from your webcam by a custom
// Teachable Machine image classifier (classes: "Up", "Down", "Neutral").
// Arrow keys also work, so the game is playable if the model or camera fails.

// ---------- Settings ----------
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/aaGyluNP/';
const CONFIDENCE_THRESHOLD = 0.8; // ignore predictions the model is unsure about
const CANVAS_SIZE = 800;
const PADDLE_SPEED = 10;          // pixels per frame while a pose is held
const START_LIVES = 3;

// ---------- Game state ----------
const ball = { x: 0, y: 0, d: 40, vx: 0, vy: 0 };
// Tall paddle on purpose: arm motions are slower and less precise than a keyboard,
// and each prediction lags a little behind the camera, so the paddle needs a wide margin.
const paddle = { x: 20, y: 0, w: 20, h: 300 };
let score = 0;
let lives = START_LIVES;
let gameOver = false;

// ---------- Vision state ----------
let video;
let classifier;
let modelReady = false;
let label = 'Neutral';
let confidence = 0;
let status = 'Loading model...';

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE).parent(document.querySelector('main'));

  video = createCapture(VIDEO);
  video.size(224, 224); // classifier input size; smaller is faster
  video.hide();

  classifier = ml5.imageClassifier(MODEL_URL + 'model.json', () => {
    modelReady = true;
    status = 'Model ready';
    classifyVideo();
  });

  resetBall();
  paddle.y = height / 2 - paddle.h / 2;
}

// Classify one frame, then schedule the next when the result comes back.
function classifyVideo() {
  classifier.classify(video, gotResults);
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    status = 'Classifier error (arrow keys still work)';
    return;
  }
  confidence = results[0].confidence;
  // Only act on confident predictions; otherwise treat the hand as neutral.
  label = confidence >= CONFIDENCE_THRESHOLD ? results[0].label : 'Neutral';
  classifyVideo();
}

function draw() {
  background(0);

  if (gameOver) {
    drawGameOver();
    return;
  }

  movePaddle();
  moveBall();

  // Ball
  noStroke();
  fill(255);
  circle(ball.x, ball.y, ball.d);

  // Paddle
  fill(0);
  stroke(255);
  rect(paddle.x, paddle.y, paddle.w, paddle.h);

  drawHud();
}

// The detected pose controls the paddle continuously while held; arrow keys override.
function movePaddle() {
  let dir = 0;
  if (label === 'Up') dir = -1;
  if (label === 'Down') dir = 1;
  if (keyIsDown(UP_ARROW)) dir = -1;
  if (keyIsDown(DOWN_ARROW)) dir = 1;

  paddle.y = constrain(paddle.y + dir * PADDLE_SPEED, 0, height - paddle.h);
}

function moveBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;
  const r = ball.d / 2;

  // Top, bottom, and right walls
  if (ball.y < r || ball.y > height - r) {
    ball.vy *= -1;
    ball.y = constrain(ball.y, r, height - r);
  }
  if (ball.x > width - r) {
    ball.vx *= -1;
    ball.x = width - r;
  }

  // Paddle: ball must overlap the paddle's full box, and be moving toward it
  const hitsPaddle =
    ball.vx < 0 &&
    ball.x - r <= paddle.x + paddle.w &&
    ball.x - r >= paddle.x &&
    ball.y >= paddle.y &&
    ball.y <= paddle.y + paddle.h;

  if (hitsPaddle) {
    ball.vx *= -1;
    ball.x = paddle.x + paddle.w + r;
    score++;
  }

  // Missed: ball passed the left edge
  if (ball.x < -r) {
    lives--;
    if (lives <= 0) {
      gameOver = true;
    } else {
      resetBall();
    }
  }
}

function resetBall() {
  ball.x = width / 2;
  ball.y = random(100, height - 100);
  ball.vx = -6; // serve toward the player
  ball.vy = random([-1, 1]) * random(3, 6);
}

function drawHud() {
  // Small webcam preview so the player can see what the model sees
  image(video, width - 170, 10, 160, 160);
  noFill();
  stroke(80);
  rect(width - 170, 10, 160, 160);

  noStroke();
  fill(0, 255, 255);
  textSize(24);
  textAlign(LEFT, TOP);
  text('Score: ' + score, 60, 15);
  text('Lives: ' + lives, 60, 45);

  fill(255);
  textSize(16);
  const shown = modelReady ? `${label} (${nf(confidence * 100, 1, 0)}%)` : status;
  text('Pose: ' + shown, 60, 80);
}

function drawGameOver() {
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text('Game over', width / 2, height / 2 - 40);
  textSize(24);
  text('Score: ' + score, width / 2, height / 2 + 10);
  text('Press SPACE to play again', width / 2, height / 2 + 50);
}

function keyPressed() {
  if (gameOver && key === ' ') {
    score = 0;
    lives = START_LIVES;
    gameOver = false;
    resetBall();
  }
}
