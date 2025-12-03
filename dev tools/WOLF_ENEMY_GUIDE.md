# Wolf Enemy System - Implementation Guide

## Overview
The Wolf class has been upgraded from a simple NPC to a full-featured enemy with combat mechanics, health system, player detection, and XP rewards.

## Features Implemented

### ✅ Combat Stats
- **Health**: 100 HP (takes damage from player attacks)
- **Attack Damage**: 25 damage per hit to player
- **Attack Range**: 48 pixels (~3 tiles)
- **Attack Cooldown**: 1.2 seconds between attacks
- **XP Reward**: 50 XP on death

### ✅ Behavior States
The wolf uses a state machine with 5 states:

1. **Idle**: Standing still, checking for player within 3 tiles
2. **Wandering**: Random movement when no player nearby
3. **Chasing**: Actively pursuing player (within 3 tile range)
4. **Attacking**: Melee attacks when in range
5. **Dead**: Wolf defeated, awaiting removal

### ✅ Player Detection
- Detects player within **3 tiles** (48 pixels)
- Switches from idle/wandering to chasing automatically
- Returns to wandering if player escapes beyond 3 tiles

### ✅ Damage System
The wolf can take damage from three attack types:

```javascript
// Sword attack (base 30 damage, scaled by player level)
wolf.takeSwordHit(player);

// Normal fireball (base 21 damage, scaled by player level)
wolf.takeFireballHit(player, false);

// Charged fireball (base 48 damage, scaled by player level)
wolf.takeFireballHit(player, true);

// Generic damage (for other sources)
wolf.takeDamage(amount, sourceX, sourceY);
```

**Damage Scaling Formula**:
```javascript
scaleFactor = 0.8 + (playerLevel * 0.2)
actualDamage = baseDamage * scaleFactor
```
- Level 1: 0.8x damage (slightly reduced)
- Level 2: 1.0x damage (full base damage)
- Level 3: 1.2x damage
- Level 5: 1.6x damage
- Level 10: 2.6x damage

### ✅ Visual Features
- **Health Bar**: Green bar appears above wolf when damaged
- **Attack Animation**: Uses attack sprite when in attacking state
- **Directional Sprites**: Wolf faces the direction it's moving/attacking
- **1.5x Size**: Wolf rendered 50% larger for better visibility

### ✅ Player Integration
Added to Player class:
- `player.level` - Current player level (starts at 1)
- `player.xp` - Current experience points
- `player.gainXP(amount)` - Gain XP and auto level-up
- `player.levelUp()` - Increase level, heal to full health

## Usage Examples

### Creating a Wolf Enemy
```javascript
const wolf = new Wolf(200, 150, spriteLoader);
```

### Updating Each Frame
```javascript
// In your game loop
wolf.update(deltaTime, player, gameMap);
```

### Rendering
```javascript
// In your render loop
wolf.render(ctx, camera);
```

### Handling Projectile Collisions
```javascript
// When projectile hits wolf
if (projectile.hitWolf(wolf)) {
    if (projectile.type === 'fireball') {
        wolf.takeFireballHit(player, projectile.isCharged);
    }
}
```

### Handling Sword Attacks
```javascript
// When player swings sword
if (player.isSwordAttacking && player.hitboxCollidesWith(wolf)) {
    wolf.takeSwordHit(player);
}
```

### Removing Dead Wolves
```javascript
// In your enemy cleanup
enemies = enemies.filter(enemy => !enemy.isDead);
```

## Integration Checklist

### ✅ Completed
- [x] Wolf combat behavior system
- [x] Player detection (3 tile range)
- [x] Melee attacks (25 damage)
- [x] Health system (100 HP)
- [x] Damage from sword/fireballs
- [x] Level-scaled damage
- [x] XP rewards on death
- [x] Player level/XP system
- [x] Health bar rendering
- [x] Attack animations
- [x] State machine AI

### 🔧 Recommended Next Steps
1. **Projectile Integration**: Update your Projectile class to call the appropriate wolf damage methods
2. **Sword Collision**: Ensure sword attacks detect and damage wolves
3. **Death Animation**: Add visual death effect before removing wolf
4. **Sound Effects**: Add attack/hit/death sounds
5. **Loot Drops**: Spawn items when wolf dies
6. **More Enemy Types**: Create Bear, Snake, Beetle with similar systems

## Game Balance Notes

### Wolf Combat Stats
- **Chase Speed**: 1.2 pixels/frame (faster than player's 1.0)
- **Wander Speed**: 0.8 pixels/frame (slower than player)
- **Detection Range**: 3 tiles (player can avoid if careful)
- **Attack Range**: 3 tiles (wolf needs to get close)

### Damage Balance
- **Wolf vs Player**: 25 damage per hit (player has 100 HP = 4 hits to die)
- **Player vs Wolf**: 
  - Sword: ~30 damage (3-4 hits to kill)
  - Normal Fireball: ~21 damage (5 hits to kill)
  - Charged Fireball: ~48 damage (2-3 hits to kill)

### Progression
- **Level 1 Player**: Struggles against wolf (reduced damage)
- **Level 2+ Player**: More effective (full or increased damage)
- **XP Gain**: 50 XP per wolf (tune this with your level progression)

## Technical Notes

### Performance
- Wolves don't update when `isDead = true`
- Wolves don't render when off-screen (200px margin)
- Health bars only render when damaged

### Collision Detection
- Uses existing `gameMap.canMoveTo()` for tile collisions
- Pixel-based distance checks for player detection
- Separate attack range and detection range

### Animation System
- Idle: Slow 2-frame breathing animation
- Walking: 4-frame walk cycle
- Attacking: Uses attack sprite sheet when in attacking state
- All animations respect current facing direction

## Troubleshooting

### Wolf not chasing player?
- Check player is within 3 tiles (48 pixels)
- Verify `player` object is being passed to `update()`
- Console should log "Wolf detected player! Starting chase..."

### Wolf not attacking?
- Check attack cooldown (1.2 seconds between attacks)
- Verify player is within attack range (48 pixels)
- Console should log "Wolf attacks player for 25 damage!"

### Damage not working?
- Ensure `player.takeDamage()` method exists
- Check if player has invulnerability active
- Verify attack cooldown has elapsed

### Wolf not dying?
- Check if damage methods are being called
- Verify health reaches 0 or below
- Console should log "Wolf defeated! Player gains 50 XP"

## Code Architecture

```
Wolf Class Structure:
├── Constructor (stats, sprites, AI state)
├── Update Loop
│   ├── updateAI (state machine)
│   │   ├── updateIdleState
│   │   ├── updateWanderingState
│   │   ├── updateChasingState
│   │   └── updateAttackingState
│   ├── updateAnimation
│   └── applyMovement
├── Combat Methods
│   ├── takeSwordHit(player)
│   ├── takeFireballHit(player, isCharged)
│   ├── takeDamage(amount, sourceX, sourceY)
│   ├── performAttack(player)
│   └── die(player)
├── AI Helper Methods
│   ├── getDistanceToPlayer
│   ├── moveTowardPlayer
│   ├── facePlayer
│   └── getScaledDamage
└── Render (sprite + health bar)
```

## Summary

The Wolf is now a complete enemy that:
1. ✅ Wanders when player is far away
2. ✅ Detects and chases player within 3 tiles
3. ✅ Attacks player when in melee range (25 damage)
4. ✅ Takes scaled damage from sword and fireballs
5. ✅ Drops XP when defeated
6. ✅ Has health bar visual feedback
7. ✅ Integrates with your existing game systems

Simply ensure your projectile and sword systems call the wolf's damage methods when they hit, and the wolf will handle the rest automatically!
