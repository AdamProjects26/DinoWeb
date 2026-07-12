const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("current-score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const jumpBtn = document.getElementById("btn-jump");

const gravity = 0.6;
let gameSpeed = 6.5;
let score = 0;
let highScore = localStorage.getItem("dinoWebHighScore") || 0;
let isGameActive = false;
let gameAnimationId = null;
let animationFrameCount = 0;

let cameraShakeTime = 0;
let highScoreBeaten = false;
let clouds = [];
let mountains = [];

highScoreEl.textContent = highScore;

// --- ADVANCED RETRO AUDIO GENERATOR ---
function playSound(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        
        if (type === "jump") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(180, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } 
        else if (type === "score") {
            [0, 0.08].forEach((delay, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(idx === 0 ? 600 : 900, audioCtx.currentTime + delay);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + delay + 0.1);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(audioCtx.currentTime + delay);
                osc.stop(audioCtx.currentTime + delay + 0.1);
            });
        } 
        else if (type === "gameover") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.45);
            gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.45);
        }
    } catch (e) {
        console.log("Audio contexts pending user gesture initialization safely.");
    }
}

function initEnvironment() {
    clouds = [
        { x: 100, y: 30, speed: 0.3, w: 50 },
        { x: 350, y: 50, speed: 0.5, w: 70 },
        { x: 550, y: 25, speed: 0.2, w: 40 }
    ];
    mountains = [
        { x: 0, y: canvas.height - 40, w: 160, h: 40, speed: 0.5 },
        { x: 220, y: canvas.height - 40, w: 240, h: 60, speed: 0.5 },
        { x: 500, y: canvas.height - 40, w: 180, h: 35, speed: 0.5 }
    ];
}

function drawEnvironment() {
    ctx.strokeStyle = "#1b1f2b";
    ctx.lineWidth = 2;
    mountains.forEach(m => {
        if (isGameActive) m.x -= m.speed;
        if (m.x + m.w < 0) m.x = canvas.width;
        
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x + m.w/2, m.y - m.h);
        ctx.lineTo(m.x + m.w, m.y);
        ctx.stroke();
    });

    ctx.fillStyle = "#222631";
    clouds.forEach(c => {
        if (isGameActive) c.x -= c.speed;
        if (c.x + c.w < 0) c.x = canvas.width + Math.random()*50;
        
        ctx.fillRect(c.x, c.y, c.w, 12);
        ctx.fillRect(c.x + c.w*0.2, c.y - 6, c.w*0.6, 6);
    });
}

// Upgraded High-Fidelity Dino Entity
const dino = {
    x: 60,
    y: 0,
    width: 48,
    height: 52,
    velocityY: 0,
    jumpForce: 13.5,
    isGrounded: false,
    groundY: canvas.height - 57,
    
    // High-definition canvas programmatic drawing engine for a realistic retro T-Rex
    draw() {
        const w = this.width / 14;
        const h = this.height / 15;
        
        // 1. BACK SPINE & TAIL (Drawn with depth accents)
        ctx.fillStyle = "#00cc74"; // Darker green shading layer
        ctx.fillRect(this.x, this.y + h*7, w*3, h*2); // Tail base
        ctx.fillRect(this.x + w, this.y + h*6, w*2, h);
        ctx.fillRect(this.x + w*2, this.y + h*5, w*2, h); // Spine up
        ctx.fillRect(this.x + w*3, this.y + h*4, w, h);
        
        // 2. MAIN T-REX CORE BODY
        ctx.fillStyle = "#00ff87"; // Neon green primary skin
        ctx.fillRect(this.x + w*3, this.y + h*5, w*6, h*6); // Thick torso
        ctx.fillRect(this.x + w*4, this.y + h*4, w*4, h);   // Upper chest
        
        // 3. RE-ENGINEERED DETAILED HEAD & JAW
        ctx.fillRect(this.x + w*5, this.y + h, w*8, h*3);   // Top skull dome
        ctx.fillRect(this.x + w*6, this.y + h*4, w*7, h);   // Lower snout jaw line
        
        // Teeth Accent (Small white pixel cutouts)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x + w*10, this.y + h*3.8, w, h*0.3);
        ctx.fillRect(this.x + w*12, this.y + h*3.8, w, h*0.3);

        // 4. ANIMATED HIGH-VISIBILITY RETRO EYE
        ctx.fillStyle = "#ffffff"; // Eye White
        ctx.fillRect(this.x + w*8, this.y + h*1.5, w*1.5, h*1.5);
        ctx.fillStyle = "#0d0f12"; // Pupil
        ctx.fillRect(this.x + w*8.8, this.y + h*1.5, w*0.7, h*1.5);
        
        // 5. T-REX FORWARD ATTACK ARMS
        ctx.fillStyle = "#00ff87";
        ctx.fillRect(this.x + w*9, this.y + h*6, w*2.5, h); // Shoulder forward
        ctx.fillRect(this.x + w*10.5, this.y + h*6.8, w, h*0.8); // Little claw hook
        
        // 6. ATHLETIC RUNNING LEGS ARTICULATION
        const legFrame = Math.floor(animationFrameCount / 4) % 2;
        ctx.fillStyle = "#00ff87";
        
        if (!this.isGrounded) {
            // Mid-air flying leap leg tuck positions
            ctx.fillRect(this.x + w*4, this.y + h*11, w*2, h*2);
            ctx.fillRect(this.x + w*5, this.y + h*12, w*2, h);
            ctx.fillRect(this.x + w*7, this.y + h*11, w*2, h*1.5);
        } else if (legFrame === 0) {
            // Stride Pose A: Left leg extended down, right leg lifted forward
            ctx.fillRect(this.x + w*4, this.y + h*11, w*2, h*4); // Extended Left
            ctx.fillRect(this.x + w*5, this.y + h*14, w*1.5, h); // Foot pad Left
            
            ctx.fillRect(this.x + w*7.5, this.y + h*11, w*2, h*2); // Lifted Right thigh
            ctx.fillRect(this.x + w*8.5, this.y + h*12.5, w, h*1.5); // Lower Right foot
        } else {
            // Stride Pose B: Right leg extended down, left leg lifted backward
            ctx.fillRect(this.x + w*3.5, this.y + h*11, w*2, h*2); // Lifted Left thigh
            ctx.fillRect(this.x + w*3.5, this.y + h*12.5, w, h*1.5); // Lower Left foot
            
            ctx.fillRect(this.x + w*7, this.y + h*11, w*2, h*4); // Extended Right
            ctx.fillRect(this.x + w*8, this.y + h*14, w*1.5, h); // Foot pad Right
        }
    },
    
    update() {
        this.velocityY += gravity;
        this.y += this.velocityY;
        
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isGrounded = true;
        }
    },
    
    jump() {
        if (this.isGrounded && isGameActive) {
            this.velocityY = -this.jumpForce;
            this.isGrounded = false;
            playSound("jump");
        }
    }
};

let obstacles = [];
let spawnTimer = 0;

function spawnObstacle() {
    const isCluster = Math.random() > 0.65;
    const baseWidth = isCluster ? 32 : 18;
    const baseHeight = Math.random() > 0.5 ? 46 : 34;
    
    obstacles.push({
        x: canvas.width,
        y: canvas.height - baseHeight - 5,
        width: baseWidth,
        height: baseHeight,
        isCluster: isCluster
    });
}

window.addEventListener("keydown", (e) => {
    if ([" ", "ArrowUp", "w"].includes(e.key)) {
        e.preventDefault(); 
        dino.jump();
    }
});

jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    dino.jump();
});
jumpBtn.addEventListener("mousedown", () => dino.jump());

startBtn.addEventListener("click", startGame);

initEnvironment();
drawEnvironment();

function startGame() {
    isGameActive = true;
    score = 0;
    gameSpeed = 6.5;
    obstacles = [];
    spawnTimer = 0;
    animationFrameCount = 0;
    cameraShakeTime = 0;
    highScoreBeaten = false;
    dino.y = dino.groundY;
    dino.velocityY = 0;
    
    scoreEl.style.color = "#00ff87"; 
    scoreEl.textContent = score;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    
    if (gameAnimationId) cancelAnimationFrame(gameAnimationId);
    gameAnimationId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!isGameActive) return;

    animationFrameCount++;
    
    ctx.save();
    if (cameraShakeTime > 0) {
        const shakeX = (Math.random() - 0.5) * 7;
        const shakeY = (Math.random() - 0.5) * 7;
        ctx.translate(shakeX, shakeY);
        cameraShakeTime--;
    }

    clearCanvas();
    drawEnvironment();
    drawGroundLine();

    dino.update();
    dino.draw();

    spawnTimer++;
    if (spawnTimer > Math.max(40, 105 - gameSpeed * 2.2)) {
        if (Math.random() > 0.25) {
            spawnObstacle();
            spawnTimer = 0;
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;

        ctx.fillStyle = "#ff3333"; 
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff3333";
        
        const w = obs.width;
        const h = obs.height;
        
        if (!obs.isCluster) {
            ctx.fillRect(obs.x + w * 0.35, obs.y, w * 0.3, h);
            ctx.fillRect(obs.x, obs.y + h * 0.25, w * 0.4, h * 0.15);
            ctx.fillRect(obs.x, obs.y + h * 0.1, w * 0.15, h * 0.2);
            ctx.fillRect(obs.x + w * 0.5, obs.y + h * 0.4, w * 0.5, h * 0.15);
            ctx.fillRect(obs.x + w * 0.85, obs.y + h * 0.2, w * 0.15, h * 0.25);
        } else {
            ctx.fillRect(obs.x + w * 0.2, obs.y + h * 0.2, w * 0.2, h * 0.8);
            ctx.fillRect(obs.x + w * 0.6, obs.y, w * 0.2, h);
            ctx.fillRect(obs.x, obs.y + h * 0.4, w * 0.3, h * 0.1);
            ctx.fillRect(obs.x + w * 0.5, obs.y + h * 0.3, w * 0.4, h * 0.1);
        }
        
        ctx.shadowBlur = 0; 

        // Precise hitbox calibration matches the larger, cleaner T-Rex silhouette
        if (
            dino.x + 6 < obs.x + obs.width &&
            dino.x + dino.width - 6 > obs.x &&
            dino.y + 4 < obs.y + obs.height &&
            dino.y + dino.height > obs.y
        ) {
            ctx.restore(); 
            triggerCrash();
            return;
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    score++;
    const currentDisplayScore = Math.floor(score / 5);
    scoreEl.textContent = currentDisplayScore;
    
    if (currentDisplayScore > highScore && highScore > 0 && !highScoreBeaten) {
        highScoreBeaten = true;
        scoreEl.style.color = "#ff3333"; 
    }
    
    if (currentDisplayScore > 0 && currentDisplayScore % 100 === 0 && score % 5 === 0) {
        playSound("score");
    }
    
    if (score % 450 === 0) {
        gameSpeed += 0.45;
    }

    ctx.restore();
    gameAnimationId = requestAnimationFrame(gameLoop);
}

function clearCanvas() {
    ctx.fillStyle = "#0d0f12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGroundLine() {
    ctx.strokeStyle = "#222631";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 5);
    ctx.lineTo(canvas.width, canvas.height - 5);
    ctx.stroke();
}

function triggerCrash() {
    isGameActive = false;
    cancelAnimationFrame(gameAnimationId);
    playSound("gameover");
    
    cameraShakeTime = 15;
    
    clearCanvas();
    drawEnvironment();
    drawGroundLine();
    
    ctx.save();
    ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    dino.draw();
    obstacles.forEach(obs => {
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
    ctx.restore();

    setTimeout(endGame, 200); 
}

function endGame() {
    const finalScore = Math.floor(score / 5);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem("dinoWebHighScore", highScore);
        highScoreEl.textContent = highScore;
    }

    overlayText.textContent = "GAME OVER";
    startBtn.textContent = "PLAY AGAIN";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
}
