# 🗺️ Tileset Integration System

## Overview
I've created a comprehensive tileset system that can extract individual tiles from your uploaded sprite sheet and use them in the game. Here's how it works:

## 🎯 What I've Built

### 1. TilesetExtractor.js
- Extracts 16x16 tiles from your sprite sheet
- Scales them to 48x48 for the game
- Caches tiles for performance
- Provides coordinate mapping system

### 2. Enhanced SpriteLoader.js
- Loads your tileset automatically
- Falls back to individual sprites if tileset fails
- Extracts common tiles on startup
- Provides debug utilities

### 3. Updated GameMap.js
- New tile types: HOUSE, BRIDGE, DIRT, SAND
- Tileset-first rendering (uses tileset tiles when available)
- New "tileset_demo" room to showcase features

### 4. Debug Tools
- `tileset_debug.html` - Visual coordinate finder
- F2 key in-game for coordinate testing
- Console logging for tileset analysis

## 🚀 Setup Instructions

### Step 1: Save Your Tileset
1. Save your uploaded sprite sheet as `overworld_tileset.png`
2. Place it in `assets/sprites/` folder
3. The system expects 16x16 pixel tiles

### Step 2: Find Tile Coordinates
1. Open `tileset_debug.html` in your browser
2. Click on tiles to see their coordinates
3. Note coordinates for grass, stone, water, trees, etc.

### Step 3: Update Tile Mapping
Edit the `extractCommonTiles()` method in `SpriteLoader.js`:

```javascript
const tileMap = {
    'tileset_grass': { x: 0, y: 0 },     // Your grass tile coordinates
    'tileset_dirt': { x: 1, y: 0 },      // Your dirt tile coordinates  
    'tileset_stone': { x: 2, y: 0 },     // Your stone tile coordinates
    'tileset_water': { x: 0, y: 1 },     // Your water tile coordinates
    'tileset_tree': { x: 3, y: 0 },      // Your tree tile coordinates
    // Add more tiles as needed...
};
```

### Step 4: Test the System
1. Start the game
2. Go to the main room
3. Head east to enter the "tileset_demo" room
4. You should see various tile types from your tileset
5. Press F2 to test coordinate extraction

## 🎮 Game Controls

- **F1**: Toggle debug mode
- **F2**: Test tileset coordinates (shows tile previews)
- **1,2,3**: Select weapons
- **WASD**: Move
- **Space**: Dash
- **Mouse**: Aim and shoot (with staff equipped)

## 🔧 Customization

### Adding New Tile Types
1. Add to `TILE_TYPES` in GameMap.js:
```javascript
HOUSE: 7,
BRIDGE: 8,
// Add your new types...
```

2. Add rendering in `renderTile()` method:
```javascript
case this.TILE_TYPES.HOUSE:
    color = '#8b4513';
    sprite = this.spriteLoader.get('tileset_house');
    break;
```

3. Add tile extraction in `extractCommonTiles()`:
```javascript
'tileset_house': { x: 4, y: 0 },  // Your house tile coordinates
```

### Creating Custom Rooms
Follow the pattern in `generateTilesetDemoRoom()` to create new rooms with your tileset tiles.

## 🐛 Troubleshooting

### Tileset Not Loading
- Check browser console for errors
- Ensure image is in correct path: `assets/sprites/overworld_tileset.png`
- Try using a local web server (not file:// URLs)

### Wrong Tile Coordinates
- Use `tileset_debug.html` to verify coordinates
- Remember: coordinates start at (0,0) in top-left
- Each tile is 16x16 pixels in the source image

### Tiles Not Appearing
- Check console for "Extracted tile" messages
- Verify tile coordinates are within sprite sheet bounds
- Use F2 key to test coordinate extraction

## 📝 Current Tile Mappings

The system currently extracts these tiles (you'll need to adjust coordinates):
- `tileset_grass` - Basic grass terrain
- `tileset_dirt` - Dirt/soil patches  
- `tileset_stone` - Stone pathways
- `tileset_water` - Water tiles
- `tileset_tree` - Tree sprites
- `tileset_house_*` - Building parts

## 🎨 Features

- **Automatic Scaling**: 16x16 → 48x48 pixel upscaling
- **Fallback System**: Uses original sprites if tileset fails
- **Performance**: Tiles are cached after first extraction
- **Debug Mode**: Visual feedback and coordinate testing
- **Flexible Mapping**: Easy to add new tile types and coordinates

Your sprite sheet looks perfect for this system! It has great variety and clear tile boundaries. Once you set the correct coordinates, you'll have a rich tileset for creating diverse game worlds.

Happy mapping! 🗺️