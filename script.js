const video = document.getElementById('video');
const startButton = document.createElement('button');

// Create a "Start" button to request permissions
startButton.innerText = "Start WebAR";
startButton.style.position = "absolute";
startButton.style.top = "50%";
startButton.style.left = "50%";
startButton.style.transform = "translate(-50%, -50%)";
startButton.style.padding = "15px 30px";
startButton.style.fontSize = "20px";
startButton.style.zIndex = "999";
document.body.appendChild(startButton);

// FaceMesh setup
const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onFaceMeshResults);

// Start camera when the button is clicked
startButton.addEventListener("click", async () => {
    await startCamera();
    startButton.remove(); // Remove button after permission is granted
});

// Start video function
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        alert("Camera access denied! Please enable it in settings.");
    }
}

// THREE.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create chocolate model
const chocolateGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const chocolateMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const chocolates = [];

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Drop chocolates from top
function dropChocolate() {
    const choco = new THREE.Mesh(chocolateGeometry, chocolateMaterial);
    choco.position.set((Math.random() - 0.5) * 4, 3, 0); // Random X, start from top
    chocolates.push(choco);
    scene.add(choco);
}

// Face tracking and chocolate collision
function onFaceMeshResults(results) {
    if (!results.multiFaceLandmarks) return;

    const noseTip = results.multiFaceLandmarks[0][1]; // Nose tip landmark
    const noseX = (noseTip.x - 0.5) * 4;
    const noseY = (0.5 - noseTip.y) * 3;

    chocolates.forEach(choco => {
        choco.position.y -= 0.05; // Make chocolates fall

        // Check if nose touches chocolate
        const dx = choco.position.x - noseX;
        const dy = choco.position.y - noseY;
        if (Math.sqrt(dx * dx + dy * dy) < 0.3) {
            scene.remove(choco);
            chocolates.splice(chocolates.indexOf(choco), 1);
        }
    });
}

// Animation loop (Fixing falling issue)
function animate() {
    chocolates.forEach(choco => choco.position.y -= 0.02); // Move chocolates down
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Drop chocolates every 2 seconds
setInterval(dropChocolate, 2000);

// Run face tracking continuously
async function detectFace() {
    await faceMesh.send({ image: video });
    requestAnimationFrame(detectFace);
}
video.onloadeddata = detectFace;
