// Grab the "Start WebAR" button and video element
const startWebARButton = document.getElementById('startWebAR');
const video = document.querySelector('video');
const chocolates = []; // Array to store falling chocolates

// Event listener for the button click to request camera access
startWebARButton.addEventListener('click', () => {
    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            // If access is granted, show the video stream in the video element
            video.srcObject = stream;
            video.play();

            // Call the function to start FaceMesh once camera access is granted
            startFaceMesh(stream);
        })
        .catch((err) => {
            // If camera access is denied or there's an error, log it and show an alert
            console.error('Camera access denied:', err);
            alert('Camera access denied. Please allow camera access.');
        });
});

// Start the FaceMesh detection after camera is granted
function startFaceMesh(stream) {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const context = canvas.getContext('2d');
    
    const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceMeshResults);

    videoElement.onloadeddata = () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
    };

    function onFaceMeshResults(results) {
        if (!results.multiFaceLandmarks) return;

        // Clear previous face mesh points
        chocolates.forEach(choco => scene.remove(choco));
        chocolates.length = 0;

        // Render chocolates falling
        renderFallingChocolates();

        // Loop through face landmarks and draw points
        results.multiFaceLandmarks[0].forEach((landmark, index) => {
            const x = (landmark.x - 0.5) * 4; // Scale x-axis
            const y = (0.5 - landmark.y) * 3; // Scale y-axis
            const z = landmark.z * 2; // Optional: use z for depth

            context.beginPath();
            context.arc(x + canvas.width / 2, y + canvas.height / 2, 3, 0, 2 * Math.PI);
            context.fillStyle = 'green';
            context.fill();
        });

        // Check collision with chocolates (falling items)
        chocolates.forEach((choco, index) => {
            choco.position.y -= 0.05; // Chocolates keep falling

            const upperLip = results.multiFaceLandmarks[0][13]; // Upper lip position
            const lipX = (upperLip.x - 0.5) * 4;
            const lipY = (0.5 - upperLip.y) * 3;

            const dx = choco.position.x - lipX;
            const dy = choco.position.y - lipY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.5) {
                scene.remove(choco);
                chocolates.splice(index, 1);
                console.log("Chocolate collected with lips!");
            }
        });
    }

    function renderFallingChocolates() {
        // Simulate falling chocolates
        const chocolateGeometry = new THREE.SphereGeometry(0.1);
        const chocolateMaterial = new THREE.MeshBasicMaterial({ color: 0x6f4e37 }); // Chocolate color
        const chocolate = new THREE.Mesh(chocolateGeometry, chocolateMaterial);

        // Random position for chocolates
        chocolate.position.set(Math.random() * 4 - 2, 2, Math.random() * 2 - 1);
        chocolates.push(chocolate);
        scene.add(chocolate);

        // Continue updating chocolates' positions
        requestAnimationFrame(renderFallingChocolates);
    }

    // Start the video processing
    setInterval(() => {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        faceMesh.send({ image: canvas });
    }, 100);
}
