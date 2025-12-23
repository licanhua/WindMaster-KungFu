# 🌬️ Wind Master - Kung Fu Wind Control Game

An immersive hand-gesture controlled web game where you channel ancient kung fu techniques to command the forces of wind. Using MediaPipe hand tracking and Three.js, players become masters of wind, manipulating a serene 3D landscape with graceful hand movements.

## 🎮 Play Now & Watch Demo

**🌐 Live Demo:** https://licanhua.github.io/WindMaster-KungFu/

**📹 Video Demo:**

[![Wind Master Demo](https://img.youtube.com/vi/oAExqDb5hA4/maxresdefault.jpg)](https://youtube.com/shorts/oAExqDb5hA4?feature=share)

*Click to watch the demo on YouTube*

## 🚀 From Idea to GitHub in Under 30 Minute
All code is generated using GitHub Copilot.
- Draft the Idea: Write your initial concept in Claude Desktop and let it generate the requirements. Consolidate everything into [Prompt.txt](./Prompt.txt).
- Trigger Copilot: Open Prompt.txt in GitHub Copilot and simply type: Implement it.
- Refine: Make minor adjustments as needed to polish the output.

Let me know if you'd like a version tailored for a README, blog post, or internal documentation!


## ✨ Features

- **Real-time Hand Tracking**: Uses MediaPipe to detect and track your hand movements
- **3D Environment**: Beautiful Three.js-powered landscape with trees, grass, and wind particles
- **Gesture Recognition**:
  - **Open Palm**: Control wind direction by moving your hand
  - **Closed Fist + Circular Motion**: Create mesmerizing vortex effects
- **Visual Feedback**: 
  - Dynamic wind particles showing air currents
  - Trees and grass responding to wind
  - Real-time stickman display showing your hand pose
- **Chinese-Inspired Aesthetics**: Minimalist design with traditional motifs

## 🎮 How to Play

### Setup
1. Open `index.html` in a modern web browser (Chrome, Edge, or Firefox recommended)
2. Allow camera access when prompted
3. Position your hand in front of the camera

### Controls

**Open Palm Gestures:**
- **Tilt hand LEFT** (rotate palm counterclockwise) → Wind blows left
- **Tilt hand RIGHT** (rotate palm clockwise) → Wind blows right  
- Push hand **FORWARD** (move up) → Wind blows up
- Pull hand **BACK** (move down) → Wind blows down

**Closed Fist Gesture:**
- Close your fist and move it in a **circular motion** → Creates a vortex/tornado effect
- The rotation speed controls the vortex intensity

### Tips
- Keep your hand clearly visible to the camera
- **Tilt your palm** like turning a steering wheel for left/right control
- Make smooth, deliberate movements for best results
- Experiment with different gesture speeds and patterns
- Watch the stickman display (top-right) to see your hand pose

## 🛠️ Technical Stack

- **MediaPipe Hands**: Hand tracking and landmark detection
- **Three.js**: 3D rendering and scene management
- **WebGL**: Hardware-accelerated graphics
- **Vanilla JavaScript**: No build tools required

## 📁 Project Structure

```
WindMaster-KungFu/
├── index.html       # Main HTML structure
├── game.js          # Game logic and physics
├── style.css        # Styling and UI
├── Feature.txt      # Detailed feature requirements
└── README.md        # This file
```

## 🚀 Quick Start

### Option 1: Local File
Simply open `index.html` in your browser. 

**Note**: Some browsers may block camera access for local files. If you encounter issues, use Option 2.

### Option 2: Local Server (Recommended)

Using Python:
```bash
python -m http.server 8000
```

Then visit: `http://localhost:8000`

Using Node.js:
```bash
npx http-server
```

Using VS Code Live Server:
- Install the "Live Server" extension
- Right-click `index.html` and select "Open with Live Server"

## 🎨 Game Modes

- **Zen Mode**: Free exploration and experimentation (default)
- **Challenge Mode**: Coming soon - complete wind control objectives
- **Meditation Mode**: Coming soon - guided breathing exercises

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ⚠️ Safari (MediaPipe support may vary)
- ❌ Internet Explorer (not supported)

### Requirements
- Modern browser with WebGL support
- Working webcam
- Decent GPU for smooth 3D rendering

## 🔧 Customization

### Adjusting Wind Sensitivity
In `game.js`, modify the wind strength calculation:
```javascript
gameState.windStrength = Math.min(movement * 20, 1); // Change the multiplier
```

### Changing Scene Colors
In `game.js`, update the scene background:
```javascript
scene.background = new THREE.Color(0x87CEEB); // Sky blue
```

### Adding More Trees
In `game.js`, add positions to the `treePositions` array:
```javascript
const treePositions = [
    { x: -20, z: -10 },
    { x: -15, z: 5 },
    // Add more positions here
];
```

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions (allow camera access)
- Ensure no other application is using the camera
- Try refreshing the page

### Hand Not Detected
- Improve lighting in your environment
- Position hand 1-2 feet from camera
- Ensure hand is clearly visible against background
- Try adjusting camera angle

### Low Frame Rate
- Close unnecessary browser tabs
- Update graphics drivers
- Lower particle count in `game.js`:
```javascript
const particleCount = 1000; // Default is 2000
```

### Black Screen
- Check browser console for errors (F12)
- Ensure WebGL is supported: visit https://get.webgl.org/
- Try a different browser

## 🎯 Future Enhancements

- [ ] Challenge mode with objectives
- [ ] Multiple hand tracking (two-hand gestures)
- [ ] Weather effects (rain, snow)
- [ ] Sound effects and ambient music
- [ ] Seasonal themes
- [ ] Multiplayer support
- [ ] VR compatibility
- [ ] Mobile touch controls

## 📝 License

This project is open source and available for educational purposes. Feel free to modify and share!

## 🙏 Credits

- **MediaPipe**: Google's hand tracking solution
- **Three.js**: 3D graphics library
- **Inspiration**: Traditional Chinese landscape art and kung fu philosophy

## 💡 Development Philosophy

Wind Master embodies the principle of **"力从心发"** (power flows from the heart). Every gesture should feel meaningful, every wind current should feel alive. The game isn't about winning—it's about experiencing the flow state of martial arts mastery through digital interaction.

---

**Enjoy mastering the wind! 🌬️**

For questions or suggestions, feel free to open an issue or contribute to the project.
