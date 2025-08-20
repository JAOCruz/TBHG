# Bay Harbor Gooner Game

A simple HTML5 game built with Phaser.js for The Bay Harbor Gooner website.

## Game Overview

In this game, you play as the Bay Harbor Gooner trying to collect blood slides while avoiding the police. The game gets progressively harder as your score increases.

## How to Play

- Use the **arrow keys** to move the player character
- Collect the **yellow blood slides** to increase your score
- Avoid the **blue police** characters
- Navigate around the **gray obstacles**
- Try to reach the highest score possible!

## Game Features

- Progressive difficulty - the game gets harder as your score increases
- Increasing levels with faster enemies
- Score tracking
- Lives system
- Sound effects and music

## Integration

The game is integrated into the website through the `game-launcher.js` file. Any link with the attribute `data-game="bay-harbor-gooner"` will launch the game when clicked.

## Technical Details

The game is built with:

- **Phaser.js**: A popular HTML5 game framework
- **ES6 Modules**: For code organization
- **Dynamic asset generation**: Creates simple shapes for game objects

## Asset Generation

The game uses procedurally generated assets:
- Red square: Player character (Dexter)
- Blue square: Enemy (police)
- Yellow square: Collectible (blood slide)
- Gray square: Obstacle (plastic wrap)
- Dark blue square: Background tile

## Adding Custom Assets

To add custom sprites:
1. Place image files in the `/src/js/game/assets/` directory
2. Update the `loadAssets()` method in `BootScene.js` to load your assets
3. Replace the placeholder shapes with your sprites in the game code 