const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("current-score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeWebHighScore") || 0;
let gameInterval = null;
let isGameActive = false;
let changingDirection = false;

highScoreEl.textContent = highScore;

startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyPress);

document.getElementById("btn-up").addEventListener("click", () => setDirection(0, -gridSize));
document.getElementById("btn-down").addEventListener("click", () => setDirection(0, gridSize));
document.getElementById("btn-left").addEventListener("click", () => setDirection(-gridSize, 0));
document.getElementById("btn-right").addEventListener("click", () => setDirection(gridSize, 0));

function startGame() {
    snake = [
        { x: gridSize * 5, y: gridSize * 5 },
        { x: gridSize * 4, y: gridSize * 5 },
        { x: gridSize * 3, y: gridSize * 5 }
    ];
    dx = gridSize;
    dy = 0;
    score = 0;
    scoreEl.textContent = score;
    isGameActive = true;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    
    spawnFood();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(update, 100);
}

function update() {
    if (hasGameEnded()) {
        endGame();
        return;
    }

    changingDirection = false;
    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
}

function clearCanvas() {
    ctx.fillStyle = "#0d0f12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#00ff87" : "#00b35e";
        ctx.fillRect(part.x, part.y, gridSize - 2, gridSize - 2);
    });
}

function moveSnake() {
    // Fixed syntax error here (changed snake.0 to snake[0])
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        spawnFood();
    } else {
        snake.pop();
    }
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount) * gridSize;
    food.y = Math.floor(Math.random() * tileCount) * gridSize;

    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            spawnFood();
        }
    });
}

function drawFood() {
    ctx.fillStyle = "#ff3333";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff3333";
    ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0; 
}

function setDirection(newDx, newDy) {
    if (!isGameActive || changingDirection) return;

    if (newDx === -dx && newDx !== 0) return;
    if (newDy === -dy && newDy !== 0) return;

    dx = newDx;
    dy = newDy;
    changingDirection = true;
}

function handleKeyPress(event) {
    const key = event.key;
    if (key === "ArrowLeft" || key === "a") setDirection(-gridSize, 0);
    if (key === "ArrowUp" || key === "w") setDirection(0, -gridSize);
    if (key === "ArrowRight" || key === "d") setDirection(gridSize, 0);
    if (key === "ArrowDown" || key === "s") setDirection(0, gridSize);
}

function hasGameEnded() {
    // Fixed syntax error here (changed snake.0 to snake[0])
    const head = snake[0];
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return true;
    }
    for (let i = 4; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function endGame() {
    isGameActive = false;
    clearInterval(gameInterval);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeWebHighScore", highScore);
        highScoreEl.textContent = highScore;
    }

    overlayText.textContent = "GAME OVER";
    startBtn.textContent = "PLAY AGAIN"; 
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
}
