const videoElement = document.getElementById("webcam");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let faceLandmarker;

// Append canvas to the DOM
document.body.appendChild(canvas);

async function initializeFaceMesh() {
    const vision = await Vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker = await Vision.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker_task/float16/latest/face_landmarker.task"
        },
        runningMode: "VIDEO",
        numFaces: 1
    });

    requestAnimationFrame(renderFrame);
}

async function renderFrame() {
    if (!faceLandmarker) return;

    if (videoElement.readyState >= 2) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(videoElement, performance.now());

        if (results.faceLandmarks.length > 0) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;

            results.faceLandmarks.forEach((landmarks) => {
                landmarks.forEach((point) => {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = "cyan";
                    ctx.fill();
                    ctx.stroke();
                });
            });
        }
    }

    requestAnimationFrame(renderFrame);
}

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;

        videoElement.onloadeddata = () => {
            initializeFaceMesh();
        };
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

startWebcam();
