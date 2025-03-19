





async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('webcam');
        videoElement.srcObject = stream;
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

startWebcam();