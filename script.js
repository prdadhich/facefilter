// Import necessary libraries from CDN
import 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const faceMeshScript = document.createElement('script');
faceMeshScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
faceMeshScript.onload = () => initFaceMesh(); // Initialize FaceMesh after script loads
document.head.appendChild(faceMeshScript);

const cameraUtilsScript = document.createElement('script');
cameraUtilsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils';
document.head.appendChild(cameraUtilsScript);

let scene, camera, renderer;
let cubes = [];

// Initialize Three.js scene
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.lookAt(scene.position);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x333333); // Gray background for visibility
    document.body.appendChild(renderer.domElement);
}

// Function to drop a cube
function dropCube() {
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(Math.random() * 4 - 2, 3, 0);
    scene.add(cube);
    cubes.push(cube);
}

// Animate cubes falling
function animate() {
    requestAnimationFrame(animate);
    console.log("Animating..."); // Debugging log
    
    cubes.forEach(cube => {
        cube.position.y -= 0.02;
    });
    
    renderer.render(scene, camera);
}

// Initialize FaceMesh after script is loaded
function initFaceMesh() {
    const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(results => {
        if (results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            
            if (lowerLip.y - upperLip.y > 0.03) { // Check if lips are open
                dropCube();
            }
        }
    });

    // Initialize webcam
    const video = document.createElement('video');
    video.id = 'webcam';
    video.style.position = 'absolute';
    video.style.top = '10px';
    video.style.left = '10px';
    video.style.width = '200px';
    video.style.height = 'auto';
    video.style.border = '2px solid white';
    document.body.appendChild(video);
    
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.play();
        
        const camera = new Camera(video, {
            onFrame: async () => {
                await faceMesh.send({ image: video });
            },
            width: 640,
            height: 480
        });
        camera.start();
    });
}

// Start everything
initScene();
animate();
