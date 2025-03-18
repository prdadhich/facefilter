const pointsMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.05 });

// This array will hold the Three.js points representing the face landmarks
let facePoints = [];

function onFaceMeshResults(results) {
    if (!results.multiFaceLandmarks) return;

    // Clear previous points
    facePoints.forEach(point => scene.remove(point));
    facePoints = [];

    // Loop through each face landmark and create a Three.js point for each
    results.multiFaceLandmarks[0].forEach((landmark, index) => {
        const x = (landmark.x - 0.5) * 4; // Normalize x-axis
        const y = (0.5 - landmark.y) * 3; // Normalize y-axis
        const z = landmark.z * 2; // Optional: Use z for depth (if you want a 3D look)

        const pointGeometry = new THREE.SphereGeometry(0.05);
        const point = new THREE.Mesh(pointGeometry, pointsMaterial);
        point.position.set(x, y, z);  // Set position of the landmark
        scene.add(point);
        facePoints.push(point);  // Add point to the array to keep track of it
    });

    chocolates.forEach((choco, index) => {
        choco.position.y -= 0.05; // Chocolates keep falling

        // Get the upper lip position
        const upperLip = results.multiFaceLandmarks[0][13]; // Upper lip
        const lipX = (upperLip.x - 0.5) * 4;
        const lipY = (0.5 - upperLip.y) * 3;

        // Check if chocolate touches the lips
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
