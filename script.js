const videoElement = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesIcons = document.getElementById("lives-icons");
const gameOverScreen = document.getElementById("game-over");
const finalScoreElement = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");
const muteToggle = document.getElementById("mute-toggle");

// Game Settings
const CONFIG = {
    spawnRate: 1500, // ms
    minSpawnRate: 600,
    speedIncrease: 0.2,
    baseSpeed: 3,
    mouthThreshold: 0.035, // Distance between landmarks 13 and 14
    catchRadius: 60,
};

// Assets
const CANDY_IMG = new Image();
CANDY_IMG.src = 'assets/candy.png';
const BISCUIT_IMG = new Image();
BISCUIT_IMG.src = 'assets/biscuit.png';

// Sound Controller
class SoundController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;
    }

    playCatch() {
        if (this.muted) return;
        this.beep(600, 0.1, 'sine');
        setTimeout(() => this.beep(900, 0.1, 'sine'), 50);
    }

    playFail() {
        if (this.muted) return;
        this.beep(200, 0.3, 'sawtooth');
    }

    playGameOver() {
        if (this.muted) return;
        this.beep(150, 0.5, 'square');
    }

    beep(freq, duration, type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    toggle() {
        this.muted = !this.muted;
        muteToggle.innerText = this.muted ? '🔇' : '🔊';
    }
}

const sound = new SoundController();

// Game State
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    items: [],
    gameOver: false,
    mouthPos: { x: 0, y: 0 },
    isMouthOpen: false,
    lastSpawn: 0
};

class Item {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.size = 50 + Math.random() * 20;
        this.speed = CONFIG.baseSpeed + (gameState.level * CONFIG.speedIncrease) + Math.random() * 2;
        this.type = Math.random() > 0.5 ? 'candy' : 'biscuit';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotSpeed;
        return this.y > canvas.height + 100;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const img = this.type === 'candy' ? CANDY_IMG : BISCUIT_IMG;
        ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// MediaPipe Setup
const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

faceMesh.onResults(onResults);

function onResults(results) {
    if (gameState.gameOver) return;

    // Adjust canvas size
    if (canvas.width !== videoElement.videoWidth || canvas.height !== videoElement.videoHeight) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Landmark 13: Inner Top Lip, 14: Inner Bottom Lip
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        
        // Mouth center (screen coords)
        const mouthX = (topLip.x + bottomLip.x) / 2 * canvas.width;
        const mouthY = (topLip.y + bottomLip.y) / 2 * canvas.height;
        gameState.mouthPos = { x: mouthX, y: mouthY };

        // Distance to check if mouth is open
        const dist = Math.sqrt(Math.pow(topLip.x - bottomLip.x, 2) + Math.pow(topLip.y - bottomLip.y, 2));
        gameState.isMouthOpen = dist > CONFIG.mouthThreshold;

        // Draw mouth indicator
        ctx.beginPath();
        ctx.arc(mouthX, mouthY, gameState.isMouthOpen ? 30 : 10, 0, Math.PI * 2);
        ctx.fillStyle = gameState.isMouthOpen ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = gameState.isMouthOpen ? '#2ed573' : 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    updateGame();
}

function updateGame() {
    const now = Date.now();
    
    // Spawn items
    const currentSpawnRate = Math.max(CONFIG.minSpawnRate, CONFIG.spawnRate - (gameState.score * 10));
    if (now - gameState.lastSpawn > currentSpawnRate) {
        gameState.items.push(new Item());
        gameState.lastSpawn = now;
    }

    // Update and draw items
    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        const isOffScreen = item.update();
        item.draw();

        // Check collision
        if (gameState.isMouthOpen) {
            const d = Math.sqrt(Math.pow(item.x - gameState.mouthPos.x, 2) + Math.pow(item.y - gameState.mouthPos.y, 2));
            if (d < CONFIG.catchRadius) {
                catchItem(i);
                continue;
            }
        }

        if (isOffScreen) {
            missItem(i);
        }
    }
}

function catchItem(index) {
    gameState.items.splice(index, 1);
    gameState.score += 1;
    scoreElement.innerText = gameState.score;
    scoreElement.parentElement.classList.add('score-animate');
    setTimeout(() => scoreElement.parentElement.classList.remove('score-animate'), 300);
    
    sound.playCatch();

    if (gameState.score % 10 === 0) {
        gameState.level++;
        levelElement.innerText = gameState.level;
    }
}

function missItem(index) {
    gameState.items.splice(index, 1);
    gameState.lives--;
    updateLivesUI();
    sound.playFail();

    if (gameState.lives <= 0) {
        endGame();
    }
}

function updateLivesUI() {
    const hearts = ['🖤', '🖤', '🖤'];
    for (let i = 0; i < gameState.lives; i++) hearts[i] = '❤️';
    livesIcons.innerHTML = hearts.map(h => `<span class="heart">${h}</span>`).join('');
}

function endGame() {
    gameState.gameOver = true;
    gameState.items = [];
    finalScoreElement.innerText = gameState.score;
    gameOverScreen.classList.remove('hidden');
    sound.playGameOver();
}

function resetGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.items = [];
    gameState.gameOver = false;
    scoreElement.innerText = '0';
    levelElement.innerText = '1';
    updateLivesUI();
    gameOverScreen.classList.add('hidden');
}

// MediaPipe Camera Helper
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

camera.start();

// Controls
restartBtn.addEventListener('click', resetGame);
muteToggle.addEventListener('click', () => sound.toggle());

// Resume audio context on first interaction (browser requirement)
document.addEventListener('click', () => {
    if (sound.ctx.state === 'suspended') {
        sound.ctx.resume();
    }
}, { once: true });
