# Sprite Animation System - How It Works & Improvements

## 🎯 Overview

Your game uses **sprite sheet animation** with a frame-based system. Each NPC (Wolf, Bear, Snake, Beetle) has two sprite sheets:
- **Normal sprite**: Walking/idle animations
- **Attack sprite**: Combat animations

## 📊 Current Sprite Sheet Layout

### Format: 4x14 Grid
```
Columns (4): Animation frames (0-3)
Rows (14): Different directions and states
```

### Frame Structure
```
┌─────────────────────────────────────┐
│  Col 0  │  Col 1  │  Col 2  │  Col 3  │  ← Frame columns
├─────────────────────────────────────┤
│ Row 0: Up Direction Frames         │
│ Row 1: Left Direction Frames       │
│ Row 2: Right Direction Frames      │
│ Row 3: Down Direction Frames       │
│ Row 4-13: Other animations (unused) │
└─────────────────────────────────────┘
```

## 🔧 How The Current System Works

### 1. **Sprite Loading** (SimpleSpriteLoader.js)

```javascript
// Loads both normal and attack sprites
this.normalSprite = spriteLoader.getAnimal('wolf', false);
this.attackSprite = spriteLoader.getAnimal('wolf', true);
```

**What happens:**
- Each sprite is loaded as an Image object
- The system calculates frame dimensions when loaded
- Sprites are cached for performance

### 2. **Frame Dimension Calculation**

```javascript
calculateFrameDimensions() {
    // Divides sprite sheet into grid cells
    this.frameWidth = Math.floor(this.normalSprite.width / 4);   // 4 columns
    this.frameHeight = Math.floor(this.normalSprite.height / 14); // 14 rows
}
```

**Example:** If sprite is 64x224 pixels:
- frameWidth = 64/4 = **16 pixels**
- frameHeight = 224/14 = **16 pixels**
- Each frame is 16x16 pixels

### 3. **Animation Frame Selection**

Two key values determine which frame to show:

```javascript
// Which column (0-3): Determines animation step
this.animationFrame = 0;  // Range: 0, 1, 2, 3

// Which row (0-13): Determines direction
const frameY = this.getFrameRow();  // Returns row based on direction
```

### 4. **Direction to Row Mapping**

```javascript
getFrameRow() {
    switch (this.direction) {
        case 'up':    return 0;  // Row 0
        case 'left':  return 1;  // Row 1
        case 'right': return 2;  // Row 2
        case 'down':  return 3;  // Row 3
    }
}
```

**Note:** Wolf has different mapping than Bear:
- **Wolf**: down=3, left=1, right=2, up=0
- **Bear**: down=0, left=1, right=2, up=3

### 5. **Animation Update Loop**

```javascript
updateAnimation(deltaTime) {
    this.animationTimer += deltaTime;
    
    // Animate faster when moving (150ms), slower when idle (450ms)
    const animSpeed = this.isMoving ? this.animationSpeed : this.animationSpeed * 3;
    
    if (this.animationTimer >= animSpeed) {
        if (this.isMoving) {
            // Cycle through all 4 frames: 0 → 1 → 2 → 3 → 0
            this.animationFrame = (this.animationFrame + 1) % 4;
        } else {
            // Idle: subtle 2-frame breathing: 0 ↔ 1
            this.animationFrame = this.animationFrame === 0 ? 1 : 0;
        }
        this.animationTimer = 0;
    }
}
```

**Animation Speed:**
- Moving: Changes frame every **150ms** (6.7 fps)
- Idle: Changes frame every **450ms** (2.2 fps)

### 6. **Rendering the Frame**

```javascript
render(ctx, camera) {
    const frameX = this.animationFrame;     // Column (0-3)
    const frameY = this.getFrameRow();      // Row (0-13)
    
    // Calculate pixel coordinates in sprite sheet
    const sourceX = frameX * this.frameWidth;
    const sourceY = frameY * this.frameHeight;
    
    // Extract and draw the frame
    ctx.drawImage(
        sprite,                                    // Source image
        sourceX, sourceY,                          // Source position
        this.frameWidth, this.frameHeight,         // Source size
        screenX - renderWidth/2,                   // Destination X (centered)
        screenY - renderHeight/2,                  // Destination Y (centered)
        renderWidth, renderHeight                  // Destination size (scaled)
    );
}
```

## 🎬 Animation Flow Example

Let's trace a Wolf walking **right**:

1. **Direction set:** `direction = 'right'`
2. **Frame row:** `getFrameRow()` returns `2` (right row)
3. **Animation frames cycle:**
   ```
   Time 0ms:    Frame 0, Row 2  →  sourceX=0,  sourceY=32
   Time 150ms:  Frame 1, Row 2  →  sourceX=16, sourceY=32
   Time 300ms:  Frame 2, Row 2  →  sourceX=32, sourceY=32
   Time 450ms:  Frame 3, Row 2  →  sourceX=48, sourceY=32
   Time 600ms:  Frame 0, Row 2  →  (loops back)
   ```

4. **Result:** Smooth 4-frame walking animation to the right

## 🐛 Current Issues & Problems

### Issue 1: **Inconsistent Direction Mapping**
**Problem:** Different NPCs use different row numbers for same direction
```javascript
// Wolf
case 'down': return 3;  // Row 3

// Bear  
case 'down': return 0;  // Row 0
```

**Impact:** Confusing code maintenance, hard to copy-paste between NPCs

---

### Issue 2: **Idle Animation Complexity**
**Problem:** Wolf uses 2-frame breathing (0 ↔ 1), Bear uses static frame (0 only)

```javascript
// Wolf idle animation
this.animationFrame = this.animationFrame === 0 ? 1 : 0;

// Bear idle animation
this.animationFrame = 0;  // Just stays on frame 0
```

**Impact:** Inconsistent idle behavior across NPCs

---

### Issue 3: **Hard-coded Frame Counts**
**Problem:** System assumes 4 frames for all animations

```javascript
this.animationFrame = (this.animationFrame + 1) % 4;  // Always 4 frames
```

**Impact:** Can't easily use sprite sheets with different frame counts (2-frame, 6-frame, etc.)

---

### Issue 4: **No Frame Range Specification**
**Problem:** Can't specify which frames to use for different actions

**Example:** If your sprite sheet has:
- Frames 0-3: Walking
- Frames 4-7: Running  
- Frames 8-11: Combat stance

You can't easily access frames beyond 0-3!

---

### Issue 5: **State-Sprite Mismatch**
**Problem:** Attack sprite is loaded but only used in 'attacking' state

```javascript
let sprite = this.normalSprite;
if (this.state === 'attacking' && this.attackSprite) {
    sprite = this.attackSprite;  // Only switched here
}
```

**Impact:** If you want different sprites for idle/chase/hurt states, you need to add more sprite properties

---

### Issue 6: **Scaling Inconsistencies**
**Problem:** Different NPCs use different scaling factors

```javascript
// Wolf: 1.5x size
const renderWidth = this.frameWidth * 1.5;

// Bear: 0.8x size
const renderWidth = Math.floor(this.frameWidth * 0.8);
```

**Impact:** Hard to predict NPC sizes, requires manual tuning per NPC

---

### Issue 7: **Animation Speed Not Configurable**
**Problem:** Animation speed hard-coded to 150ms

```javascript
this.animationSpeed = 150;  // Fixed value
```

**Impact:** Can't make faster/slower enemies without code changes

---

### Issue 8: **No Animation Events**
**Problem:** No way to trigger events at specific frames

**Example Use Cases:**
- Play footstep sound on frame 1 and frame 3
- Deal damage on frame 2 of attack animation
- Spawn projectile on frame 3 of shooting animation

---

## ✨ Proposed Improvements

### Improvement 1: **Unified Animation Config**

Create a standardized animation configuration system:

```javascript
class NPCAnimationConfig {
    constructor(spriteSheetLayout) {
        this.animations = {
            // Walking animations
            walkUp:    { startFrame: 0, frameCount: 4, row: 0, speed: 150 },
            walkLeft:  { startFrame: 0, frameCount: 4, row: 1, speed: 150 },
            walkRight: { startFrame: 0, frameCount: 4, row: 2, speed: 150 },
            walkDown:  { startFrame: 0, frameCount: 4, row: 3, speed: 150 },
            
            // Idle animations
            idleUp:    { startFrame: 0, frameCount: 2, row: 4, speed: 450 },
            idleLeft:  { startFrame: 0, frameCount: 2, row: 5, speed: 450 },
            idleRight: { startFrame: 0, frameCount: 2, row: 6, speed: 450 },
            idleDown:  { startFrame: 0, frameCount: 2, row: 7, speed: 450 },
            
            // Attack animations
            attackUp:    { startFrame: 0, frameCount: 4, row: 8, speed: 100 },
            attackLeft:  { startFrame: 0, frameCount: 4, row: 9, speed: 100 },
            attackRight: { startFrame: 0, frameCount: 4, row: 10, speed: 100 },
            attackDown:  { startFrame: 0, frameCount: 4, row: 11, speed: 100 },
        };
        
        this.currentAnimation = 'idleDown';
    }
    
    getAnimationFrame(animationName, frameIndex) {
        const anim = this.animations[animationName];
        return {
            frameX: anim.startFrame + (frameIndex % anim.frameCount),
            frameY: anim.row,
            speed: anim.speed
        };
    }
}
```

**Benefits:**
- ✅ Clear, readable animation definitions
- ✅ Easy to add new animations
- ✅ Configurable speed per animation
- ✅ Supports variable frame counts

---

### Improvement 2: **Direction-Based Animation Selector**

```javascript
getCurrentAnimation() {
    const action = this.state; // 'idle', 'moving', 'attacking'
    const direction = this.direction; // 'up', 'down', 'left', 'right'
    
    // Build animation name: "walkDown", "idleUp", "attackLeft"
    const animName = action === 'moving' ? 'walk' : action;
    return animName + direction.charAt(0).toUpperCase() + direction.slice(1);
}

// Usage
updateAnimation(deltaTime) {
    const animName = this.getCurrentAnimation();
    const frame = this.animConfig.getAnimationFrame(animName, this.animationFrame);
    
    this.animationTimer += deltaTime;
    if (this.animationTimer >= frame.speed) {
        this.animationFrame = (this.animationFrame + 1) % this.animConfig.animations[animName].frameCount;
        this.animationTimer = 0;
    }
}
```

**Benefits:**
- ✅ Automatic animation selection
- ✅ Handles all direction/state combinations
- ✅ Single source of truth

---

### Improvement 3: **Animation Event System**

```javascript
class AnimationEvent {
    constructor(animationName, frameIndex, callback) {
        this.animationName = animationName;
        this.frameIndex = frameIndex;
        this.callback = callback;
    }
}

// In NPC class
registerAnimationEvent(animName, frameIndex, callback) {
    if (!this.animationEvents) this.animationEvents = [];
    this.animationEvents.push(new AnimationEvent(animName, frameIndex, callback));
}

// Check events when frame changes
onFrameChanged(animName, newFrame) {
    this.animationEvents
        .filter(e => e.animationName === animName && e.frameIndex === newFrame)
        .forEach(e => e.callback());
}

// Usage example
wolf.registerAnimationEvent('attackDown', 2, () => {
    console.log('💥 Attack hit frame - deal damage!');
    wolf.performAttack();
});
```

**Benefits:**
- ✅ Sync game logic with animation frames
- ✅ Precise timing for attacks, sounds, effects
- ✅ Decoupled animation from game logic

---

### Improvement 4: **Smart Sprite Sheet Analyzer**

Automatically detect sprite sheet layout:

```javascript
class SpriteSheetAnalyzer {
    static analyze(spriteImage) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = spriteImage.width;
        canvas.height = spriteImage.height;
        ctx.drawImage(spriteImage, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Detect grid by finding transparent rows/columns
        const cols = this.detectColumns(imageData);
        const rows = this.detectRows(imageData);
        
        return {
            columns: cols,
            rows: rows,
            frameWidth: Math.floor(spriteImage.width / cols),
            frameHeight: Math.floor(spriteImage.height / rows)
        };
    }
    
    static detectColumns(imageData) {
        // Scan for vertical transparent lines that indicate frame boundaries
        // Returns number of columns detected
    }
    
    static detectRows(imageData) {
        // Scan for horizontal transparent lines that indicate frame boundaries
        // Returns number of rows detected
    }
}
```

**Benefits:**
- ✅ No manual frame calculation
- ✅ Works with any sprite sheet size
- ✅ Detects irregular layouts

---

### Improvement 5: **Animation State Machine**

```javascript
class AnimationStateMachine {
    constructor() {
        this.states = new Map();
        this.currentState = null;
        this.transitions = [];
    }
    
    addState(name, animation, onEnter = null, onExit = null) {
        this.states.set(name, {
            animation: animation,
            onEnter: onEnter,
            onExit: onExit
        });
    }
    
    addTransition(fromState, toState, condition) {
        this.transitions.push({ fromState, toState, condition });
    }
    
    update(context) {
        // Check all transitions
        for (const transition of this.transitions) {
            if (transition.fromState === this.currentState && 
                transition.condition(context)) {
                this.changeState(transition.toState);
                break;
            }
        }
    }
    
    changeState(newState) {
        if (this.currentState) {
            const oldState = this.states.get(this.currentState);
            if (oldState.onExit) oldState.onExit();
        }
        
        this.currentState = newState;
        const state = this.states.get(newState);
        if (state.onEnter) state.onEnter();
    }
}

// Usage
const animSM = new AnimationStateMachine();

animSM.addState('idle', 'idleDown');
animSM.addState('walking', 'walkDown');
animSM.addState('attacking', 'attackDown', 
    () => console.log('Attack animation started'),
    () => console.log('Attack animation ended')
);

animSM.addTransition('idle', 'walking', ctx => ctx.isMoving);
animSM.addTransition('walking', 'idle', ctx => !ctx.isMoving);
animSM.addTransition('*', 'attacking', ctx => ctx.isAttacking);
```

**Benefits:**
- ✅ Clean state transitions
- ✅ Hooks for state changes
- ✅ Easy to visualize and debug

---

### Improvement 6: **Performance Optimizations**

```javascript
class SpriteFrameCache {
    constructor() {
        this.cache = new Map();
    }
    
    // Pre-render all frames to off-screen canvases
    preRenderFrames(spriteSheet, frameWidth, frameHeight, rows, cols, scale = 1) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const key = `${row}_${col}`;
                
                const canvas = document.createElement('canvas');
                canvas.width = frameWidth * scale;
                canvas.height = frameHeight * scale;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                
                ctx.drawImage(
                    spriteSheet,
                    col * frameWidth, row * frameHeight,
                    frameWidth, frameHeight,
                    0, 0,
                    frameWidth * scale, frameHeight * scale
                );
                
                this.cache.set(key, canvas);
            }
        }
    }
    
    getFrame(row, col) {
        return this.cache.get(`${row}_${col}`);
    }
}

// Usage
const frameCache = new SpriteFrameCache();
frameCache.preRenderFrames(wolfSprite, 16, 16, 14, 4, 1.5);

// In render method - just blit the cached canvas
const frame = frameCache.getFrame(frameY, frameX);
ctx.drawImage(frame, screenX - frame.width/2, screenY - frame.height/2);
```

**Benefits:**
- ✅ Faster rendering (no sprite sheet lookup)
- ✅ Scaling done once, not every frame
- ✅ Reduced CPU usage

---

## 🚀 Implementation Roadmap

### Phase 1: Configuration Refactor
1. Create `NPCAnimationConfig` class
2. Define animation configs for each NPC type
3. Migrate Wolf to use config system
4. Verify animations work correctly

### Phase 2: Event System
1. Implement `AnimationEvent` class
2. Add event checking to animation update loop
3. Add attack hit events to Wolf
4. Add sound effect events

### Phase 3: State Machine
1. Create `AnimationStateMachine` class
2. Migrate Wolf to state machine
3. Add transition logging/debugging
4. Test all state transitions

### Phase 4: Performance
1. Implement `SpriteFrameCache`
2. Pre-render all NPC frames on load
3. Update render methods to use cache
4. Benchmark performance improvements

### Phase 5: Tools
1. Create sprite sheet analyzer
2. Build animation preview tool
3. Add animation debugging overlay
4. Create animation editor UI

---

## 📝 Code Examples

### Simple Improvement: Make Animation Speed Configurable

**Current Code (Wolf.js):**
```javascript
this.animationSpeed = 150;  // Hard-coded
```

**Improved:**
```javascript
constructor(x, y, spriteLoader, config = {}) {
    // Allow custom animation speeds
    this.animationSpeed = config.animationSpeed || 150;
    this.idleAnimationSpeed = config.idleAnimationSpeed || 450;
}

// Usage
const fastWolf = new Wolf(100, 100, spriteLoader, { 
    animationSpeed: 100,      // 33% faster
    idleAnimationSpeed: 300 
});

const slowWolf = new Wolf(200, 200, spriteLoader, { 
    animationSpeed: 250       // 66% slower
});
```

---

### Medium Improvement: Direction-Based Animation System

**Replace getFrameRow() with:**
```javascript
getAnimation() {
    const statePrefix = this.state === 'idle' ? 'idle' : 
                       this.state === 'attacking' ? 'attack' : 'walk';
    const directionSuffix = this.direction.charAt(0).toUpperCase() + 
                           this.direction.slice(1);
    return statePrefix + directionSuffix;  // e.g., "walkDown", "attackUp"
}

// Animation definitions
this.animations = {
    walkDown:  { row: 3, frames: 4 },
    walkLeft:  { row: 1, frames: 4 },
    walkRight: { row: 2, frames: 4 },
    walkUp:    { row: 0, frames: 4 },
    idleDown:  { row: 3, frames: 2 },
    // ... etc
};

// In render method
const anim = this.animations[this.getAnimation()];
const frameY = anim.row;
const maxFrames = anim.frames;
```

---

### Advanced Improvement: Full Animation System

See the complete implementation examples in the sections above for:
- Animation Configuration System
- Event System with Callbacks
- State Machine Architecture
- Frame Caching for Performance

---

## 🎓 Best Practices

### 1. **Separate Animation from Logic**
- Animation code should not contain game logic
- Use events/callbacks to trigger logic at specific frames

### 2. **Use Descriptive Animation Names**
- ❌ Bad: `anim1`, `anim2`, `state3`
- ✅ Good: `walkDown`, `attackUp`, `idleLeft`

### 3. **Make Everything Configurable**
- Animation speeds
- Frame counts
- Scaling factors
- Row/column mappings

### 4. **Cache What You Can**
- Pre-render scaled frames
- Cache sprite sheet lookups
- Store calculated values

### 5. **Add Debug Visualization**
```javascript
renderDebugAnimation(ctx, screenX, screenY) {
    if (!window.game.debugMode) return;
    
    // Show hitbox
    ctx.strokeStyle = 'red';
    ctx.strokeRect(screenX - 16, screenY - 16, 32, 32);
    
    // Show current animation state
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(
        `${this.getAnimation()} F:${this.animationFrame}`, 
        screenX - 30, screenY - 30
    );
    
    // Show animation progress bar
    const progress = this.animationTimer / this.animationSpeed;
    ctx.fillStyle = 'yellow';
    ctx.fillRect(screenX - 20, screenY + 25, 40 * progress, 3);
}
```

---

## 📚 Summary

### Current System Strengths
- ✅ Simple and straightforward
- ✅ Works for basic 4-frame animations
- ✅ Easy to understand for beginners

### Current System Weaknesses
- ❌ Hard-coded values everywhere
- ❌ Inconsistent between NPCs
- ❌ Limited to 4-frame animations
- ❌ No animation events
- ❌ Poor extensibility

### After Improvements
- ✅ Configurable and flexible
- ✅ Consistent across all NPCs
- ✅ Supports any frame count
- ✅ Event-driven animation system
- ✅ Better performance
- ✅ Easier to debug and maintain

---

## 🔄 Next Steps

1. **Review this document** to understand the current system
2. **Identify pain points** in your current workflow
3. **Pick one improvement** to start with (recommend starting with Animation Config)
4. **Implement incrementally** - don't try to do everything at once
5. **Test thoroughly** after each change
6. **Iterate and refine** based on your needs

Would you like me to implement any of these improvements in your actual code? I can start with whichever improvement sounds most valuable to you!
