// Wind Master - Main Game Logic
// Three.js 3D Scene with MediaPipe Hand Tracking

// Game State
const gameState = {
    windDirection: { x: 0, y: 0 },
    windStrength: 0,
    isVortex: false,
    vortexIntensity: 0,
    handDetected: false,
    currentGesture: 'none'
};

// Three.js Scene Setup
let scene, camera, renderer;
let terrain, trees = [], grass = [];
let windParticles, particleSystem;
let clock = new THREE.Clock();

// MediaPipe Setup
let hands, videoElement, canvasElement, canvasCtx;
let stickmanCanvas, stickmanCtx;

// Audio System
let audioContext;
let windOscillator, windGain, windFilter;
let vortexOscillator, vortexGain, vortexFilter, vortexLFO;
let isAudioInitialized = false;

// Initialize the game
async function init() {
    setupThreeJS();
    createEnvironment();
    createWindParticles();
    setupAudioSystem();
    await setupMediaPipe();
    setupEventListeners();
    hideLoading();
    animate();
}

// Three.js Setup
function setupThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 15, 40);
    camera.lookAt(0, 5, 0);

    // Renderer
    const canvas = document.getElementById('scene-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: false 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff4e6, 0.8);
    directionalLight.position.set(50, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Hemisphere light for natural ambient
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.4);
    scene.add(hemiLight);
}

// Create Terrain
function createEnvironment() {
    // Ground plane with rolling hills
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B8E23,
        roughness: 0.8,
        metalness: 0.2
    });

    // Add height variation for hills
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const height = Math.sin(x * 0.05) * 3 + Math.cos(y * 0.05) * 3;
        positions.setZ(i, height);
    }
    positions.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    terrain = new THREE.Mesh(groundGeometry, groundMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Create trees
    createTrees();
    
    // Create grass field
    createGrassField();
}

// Create Trees
function createTrees() {
    const treePositions = [
        { x: -20, z: -10 },
        { x: -15, z: 5 },
        { x: 15, z: -5 },
        { x: 20, z: 10 },
        { x: -25, z: 15 },
        { x: 25, z: -15 },
        { x: 0, z: -20 },
        { x: -10, z: 20 }
    ];

    treePositions.forEach(pos => {
        const tree = createTree(pos.x, pos.z);
        trees.push(tree);
        scene.add(tree.group);
    });
}

function createTree(x, z) {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2511 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 10;
    foliage.castShadow = true;
    group.add(foliage);

    group.position.set(x, 0, z);
    
    // Store original position and rotation for physics
    return {
        group: group,
        originalRotation: { x: 0, y: 0, z: 0 },
        currentRotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        foliage: foliage,
        trunk: trunk
    };
}

// Create Grass Field
function createGrassField() {
    const grassCount = 5000;
    const grassGeometry = new THREE.BufferGeometry();
    const grassPositions = [];
    const grassColors = [];

    for (let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        const y = 0;

        // Create a simple grass blade (2 triangles)
        for (let j = 0; j < 3; j++) {
            grassPositions.push(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2);
            const greenShade = 0.3 + Math.random() * 0.3;
            grassColors.push(0, greenShade, 0);
        }
    }

    grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassPositions, 3));
    grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(grassColors, 3));

    const grassMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    const grassField = new THREE.Points(grassGeometry, grassMaterial);
    scene.add(grassField);
    grass.push({
        mesh: grassField,
        originalPositions: [...grassPositions]
    });
}

// Create Wind Particles
function createWindParticles() {
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 100,
            Math.random() * 30,
            (Math.random() - 0.5) * 100
        );
        velocities.push(0, 0, 0);
    }

    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particles.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    windParticles = particles;
}

// Audio System Setup
function setupAudioSystem() {
    // Create audio context (will be activated on user interaction)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Wind sound setup (white noise for gentle wind)
    const windBufferSize = 2 * audioContext.sampleRate;
    const windBuffer = audioContext.createBuffer(1, windBufferSize, audioContext.sampleRate);
    const windData = windBuffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < windBufferSize; i++) {
        windData[i] = Math.random() * 2 - 1;
    }
    
    // Wind noise source
    windOscillator = audioContext.createBufferSource();
    windOscillator.buffer = windBuffer;
    windOscillator.loop = true;
    
    // Wind filter (for wind whoosh effect)
    windFilter = audioContext.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 800;
    windFilter.Q.value = 1;
    
    // Wind gain
    windGain = audioContext.createGain();
    windGain.gain.value = 0;
    
    // Connect wind audio chain
    windOscillator.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioContext.destination);
    
    // Vortex sound setup (lower frequency oscillation)
    vortexOscillator = audioContext.createOscillator();
    vortexOscillator.type = 'sawtooth';
    vortexOscillator.frequency.value = 60;
    
    // Vortex LFO for modulation
    vortexLFO = audioContext.createOscillator();
    vortexLFO.type = 'sine';
    vortexLFO.frequency.value = 4;
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 30;
    
    vortexLFO.connect(lfoGain);
    lfoGain.connect(vortexOscillator.frequency);
    
    // Vortex filter
    vortexFilter = audioContext.createBiquadFilter();
    vortexFilter.type = 'lowpass';
    vortexFilter.frequency.value = 400;
    vortexFilter.Q.value = 5;
    
    // Vortex gain
    vortexGain = audioContext.createGain();
    vortexGain.gain.value = 0;
    
    // Connect vortex audio chain
    vortexOscillator.connect(vortexFilter);
    vortexFilter.connect(vortexGain);
    vortexGain.connect(audioContext.destination);
}

function startAudio() {
    if (!isAudioInitialized && audioContext) {
        // Resume audio context (required after user interaction)
        audioContext.resume();
        
        // Start oscillators
        windOscillator.start();
        vortexOscillator.start();
        vortexLFO.start();
        
        isAudioInitialized = true;
    }
}

function updateAudio() {
    if (!isAudioInitialized) return;
    
    const currentTime = audioContext.currentTime;
    
    if (gameState.isVortex) {
        // Vortex sound - louder and more intense
        const targetVortexVolume = Math.min(gameState.vortexIntensity * 0.3, 0.4);
        vortexGain.gain.linearRampToValueAtTime(targetVortexVolume, currentTime + 0.1);
        
        // Increase vortex frequency with intensity
        const vortexFreq = 60 + gameState.vortexIntensity * 40;
        vortexOscillator.frequency.linearRampToValueAtTime(vortexFreq, currentTime + 0.1);
        
        // Modulate LFO speed
        const lfoSpeed = 3 + gameState.vortexIntensity * 5;
        vortexLFO.frequency.linearRampToValueAtTime(lfoSpeed, currentTime + 0.1);
        
        // Reduce regular wind sound during vortex
        windGain.gain.linearRampToValueAtTime(0.05, currentTime + 0.1);
        
    } else {
        // Normal wind sound
        const targetWindVolume = Math.min(gameState.windStrength * 0.25, 0.3);
        windGain.gain.linearRampToValueAtTime(targetWindVolume, currentTime + 0.1);
        
        // Adjust wind filter frequency based on wind direction/strength
        const filterFreq = 500 + Math.abs(gameState.windDirection.x) * 800 + gameState.windStrength * 400;
        windFilter.frequency.linearRampToValueAtTime(filterFreq, currentTime + 0.1);
        
        // Fade out vortex sound
        vortexGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
    }
}

// MediaPipe Setup
async function setupMediaPipe() {
    videoElement = document.getElementById('webcam');
    canvasElement = document.getElementById('hand-canvas');
    canvasCtx = canvasElement.getContext('2d');
    
    stickmanCanvas = document.getElementById('stickman-canvas');
    stickmanCtx = stickmanCanvas.getContext('2d');
    stickmanCanvas.width = 200;
    stickmanCanvas.height = 200;

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);

    // Start camera
    const camera_mp = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    camera_mp.start();
}

// Hand tracking results handler
function onHandResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw hand landmarks
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

        // Process gestures
        processHandGesture(landmarks);
        
        // Draw stickman
        drawStickman(landmarks);
        
        gameState.handDetected = true;
    } else {
        gameState.handDetected = false;
        gameState.windStrength = 0;
    }

    canvasCtx.restore();
}

// Process hand gestures
function processHandGesture(landmarks) {
    // Get key landmarks
    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];
    const indexBase = landmarks[5];
    const pinkyBase = landmarks[17];

    // Calculate palm center for vertical control
    const palmY = wrist.y;

    // Calculate palm tilt angle for left/right control
    // Using the line from pinky base to index base to determine rotation
    const palmTiltAngle = Math.atan2(
        indexBase.y - pinkyBase.y,
        indexBase.x - pinkyBase.x
    );
    
    // Normalize angle to -1 (left tilt) to 1 (right tilt)
    // Angle around 0 radians = hand flat/horizontal
    // Positive angle = tilted right, Negative angle = tilted left
    const palmTilt = Math.sin(palmTiltAngle) * 1.5;

    // Detect if hand is open or closed
    const fingerDistance = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) + 
        Math.pow(indexTip.y - thumbTip.y, 2)
    );

    const isHandOpen = fingerDistance > 0.1;

    if (isHandOpen) {
        // Open palm - directional wind control
        gameState.isVortex = false;
        gameState.currentGesture = 'Open Palm';

        // Use palm tilt for left/right control
        // X: left (-1) to right (1) based on palm rotation
        // Y: up (-1) to down (1) based on vertical position
        gameState.windDirection.x = Math.max(-1, Math.min(1, palmTilt)); // Clamp between -1 and 1
        gameState.windDirection.y = (palmY - 0.5) * 2;
        
        // Calculate movement for strength based on angle and position changes
        if (!window.lastPalmState) {
            window.lastPalmState = { tilt: palmTilt, y: palmY };
        }
        
        const tiltMovement = Math.abs(palmTilt - window.lastPalmState.tilt);
        const verticalMovement = Math.abs(palmY - window.lastPalmState.y);
        const movement = tiltMovement * 2 + verticalMovement;
        
        gameState.windStrength = Math.min(movement * 10, 0.6); // Reduced multiplier and max strength
        window.lastPalmState = { tilt: palmTilt, y: palmY };
    } else {
        // Closed fist - check for rotation (vortex)
        gameState.currentGesture = 'Closed Fist';
        
        // Use palm center for tracking
        const palmX = wrist.x;
        
        // Detect circular motion
        if (!window.handHistory) {
            window.handHistory = [];
        }
        
        window.handHistory.push({ x: palmX, y: palmY, time: Date.now() });
        
        // Keep only last 30 frames
        if (window.handHistory.length > 30) {
            window.handHistory.shift();
        }
        
        // Check for circular pattern
        if (window.handHistory.length > 20) {
            const rotation = detectCircularMotion(window.handHistory);
            if (rotation > 0.3) {
                gameState.isVortex = true;
                gameState.vortexIntensity = rotation;
                gameState.currentGesture = 'Vortex';
            }
        }
    }

    // Update UI
    document.getElementById('gesture-display').textContent = gameState.currentGesture;
}

// Detect circular motion
function detectCircularMotion(history) {
    if (history.length < 20) return 0;
    
    let angleSum = 0;
    for (let i = 1; i < history.length - 1; i++) {
        const p1 = history[i - 1];
        const p2 = history[i];
        const p3 = history[i + 1];
        
        const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        
        let angleDiff = angle2 - angle1;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        angleSum += angleDiff;
    }
    
    return Math.abs(angleSum);
}

// Draw stickman representation
function drawStickman(landmarks) {
    stickmanCtx.clearRect(0, 0, stickmanCanvas.width, stickmanCanvas.height);
    
    const scale = 200;
    const offsetX = 100;
    const offsetY = 100;

    // Draw connections as a simplified stickman
    stickmanCtx.strokeStyle = '#00FF00';
    stickmanCtx.lineWidth = 3;
    stickmanCtx.lineCap = 'round';

    // Wrist to fingers
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];

    connections.forEach(([start, end]) => {
        const startPt = landmarks[start];
        const endPt = landmarks[end];
        
        stickmanCtx.beginPath();
        stickmanCtx.moveTo(startPt.x * scale, startPt.y * scale);
        stickmanCtx.lineTo(endPt.x * scale, endPt.y * scale);
        stickmanCtx.stroke();
    });

    // Draw landmarks
    stickmanCtx.fillStyle = '#FF0000';
    landmarks.forEach(lm => {
        stickmanCtx.beginPath();
        stickmanCtx.arc(lm.x * scale, lm.y * scale, 3, 0, 2 * Math.PI);
        stickmanCtx.fill();
    });
}

// Update wind physics
function updateWindPhysics(deltaTime) {
    if (!gameState.handDetected) {
        // Gradually reduce wind
        gameState.windStrength *= 0.95;
        gameState.vortexIntensity *= 0.95;
    }

    // Update trees
    trees.forEach(tree => {
        if (gameState.isVortex) {
            // Vortex effect
            const angle = Date.now() * 0.001 * gameState.vortexIntensity;
            tree.group.rotation.z = Math.sin(angle) * 0.3 * gameState.vortexIntensity;
            tree.group.rotation.x = Math.cos(angle) * 0.2 * gameState.vortexIntensity;
        } else {
            // Directional wind
            const targetRotZ = -gameState.windDirection.x * gameState.windStrength * 0.5;
            const targetRotX = gameState.windDirection.y * gameState.windStrength * 0.3;
            
            tree.group.rotation.z += (targetRotZ - tree.group.rotation.z) * 0.1;
            tree.group.rotation.x += (targetRotX - tree.group.rotation.x) * 0.1;
        }
    });

    // Update wind particles
    const positions = windParticles.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        if (gameState.isVortex) {
            // Vortex particle movement
            const x = positions[i];
            const z = positions[i + 2];
            const angle = Math.atan2(z, x);
            const distance = Math.sqrt(x * x + z * z);
            
            positions[i] += Math.cos(angle + 0.1 * gameState.vortexIntensity) * 0.5;
            positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.3 * gameState.vortexIntensity;
            positions[i + 2] += Math.sin(angle + 0.1 * gameState.vortexIntensity) * 0.5;
        } else {
            // Directional wind
            positions[i] += gameState.windDirection.x * gameState.windStrength * 2;
            positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.1;
            positions[i + 2] += -gameState.windDirection.y * gameState.windStrength * 2;
        }

        // Reset particles that go out of bounds
        if (Math.abs(positions[i]) > 50) {
            positions[i] = (Math.random() - 0.5) * 100;
        }
        if (positions[i + 1] < 0 || positions[i + 1] > 30) {
            positions[i + 1] = Math.random() * 30;
        }
        if (Math.abs(positions[i + 2]) > 50) {
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
    }
    
    windParticles.attributes.position.needsUpdate = true;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    updateWindPhysics(deltaTime);
    updateAudio();
    
    // Camera gentle sway
    camera.position.x = Math.sin(Date.now() * 0.0001) * 5;
    camera.lookAt(0, 5, 0);
    
    renderer.render(scene, camera);
}

// Event Listeners
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    
    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('tutorial-overlay').classList.remove('tutorial-active');
        startAudio(); // Start audio on user interaction
    });
    
    document.getElementById('settings-button').addEventListener('click', () => {
        alert('Settings coming soon! Adjust sensitivity, change modes, and more.');
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

// Start the game
window.addEventListener('load', init);
