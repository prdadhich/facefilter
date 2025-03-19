let faceMesh;
const videoElement = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

async function initializeFaceMesh() {
    faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
}

function onResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        console.log("No face detected");
        return;
    }

    console.log("Face landmarks detected:", results.multiFaceLandmarks);

    // Ensure canvas size matches video dimensions
    canvas.width = videoElement.videoWidth || videoElement.offsetWidth;
    canvas.height = videoElement.videoHeight || videoElement.offsetHeight;

    // Clear canvas and redraw video
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;

    // Draw face landmarks
    results.multiFaceLandmarks.forEach((landmarks) => {
        landmarks.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
            ctx.fillStyle = "cyan";
            ctx.fill();
            ctx.stroke();
        });
    });
}

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;

        // Initialize face mesh after the video is fully loaded
        videoElement.onloadedmetadata = () => {
            initializeFaceMesh();
        };
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

startWebcam();
