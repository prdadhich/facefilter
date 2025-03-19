import { FilesetResolver, FaceLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

let faceLandmarker;
let videoElement = document.getElementById("webcam");
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");

async function initializeFaceMesh() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker.task"
        },
        runningMode: "VIDEO",
        numFaces: 1
    });

    // Add canvas to the DOM
    document.body.appendChild(canvas);
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    requestAnimationFrame(renderFrame);
}

async function renderFrame() {
    if (videoElement.readyState >= 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const results = faceLandmarker.detectForVideo(videoElement, performance.now());

        if (results.faceLandmarks.length > 0) {
            results.faceLandmarks.forEach((landmarks) => {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;

                for (let point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = "cyan";
                    ctx.fill();
                    ctx.stroke();
                }
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
