// Bay Harbor Gooner Game - Main Game Controller
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MainScene } from './scenes/MainScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Phaser game configuration
const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const config = {
  type: Phaser.AUTO,
  width: isMobile ? window.innerWidth : 1200,
  height: isMobile ? window.innerHeight : 700,
  parent: 'game-canvas',
  backgroundColor: '#000000',
  pixelArt: false,
  scale: {
    mode: isMobile ? Phaser.Scale.RESIZE : Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, MainScene, GameOverScene]
};

export class BayHarborGame {
  constructor() {
    this.game = null;
    this.container = null;
    this.onCloseCallback = null;
  }

  init(parentElement, onCloseCallback) {
    this.onCloseCallback = onCloseCallback;
    
    if (!this.container) {
      // Create main game container
      this.container = document.createElement('div');
      this.container.id = 'game-container';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: ${isMobile ? 'stretch' : 'center'};
        justify-content: ${isMobile ? 'stretch' : 'center'};
        background-color: rgba(17, 24, 39, 0.95);
        z-index: 9999;
      `;
      
      // Create game wrapper for proper centering
      const gameWrapper = document.createElement('div');
      gameWrapper.style.cssText = `
        position: relative;
        width: ${isMobile ? '100vw' : '1200px'};
        height: ${isMobile ? '100vh' : '700px'};
        background-color: #000000;
        border-radius: ${isMobile ? '0' : '8px'};
        box-shadow: ${isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'};
        overflow: hidden;
      `;
      
      // Create game canvas container
      const gameCanvas = document.createElement('div');
      gameCanvas.id = 'game-canvas';
      gameCanvas.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
      `;
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background-color: #dc2626;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        z-index: 10000;
        font-size: 24px;
        font-weight: bold;
      `;
      closeBtn.addEventListener('click', () => this.close());
      closeBtn.addEventListener('mouseenter', () => closeBtn.style.backgroundColor = '#b91c1c');
      closeBtn.addEventListener('mouseleave', () => closeBtn.style.backgroundColor = '#dc2626');
      
      // Game title
      const gameTitle = document.createElement('div');
      gameTitle.textContent = '';
      gameTitle.style.cssText = `
        position: absolute;
        top: 16px;
        left: 16px;
        color: white;
        font-size: 20px;
        font-weight: bold;
        z-index: 10000;
      `;
      
      
      // Assemble the structure
      gameWrapper.appendChild(gameCanvas);
      gameWrapper.appendChild(closeBtn);
      gameWrapper.appendChild(gameTitle);
      this.container.appendChild(gameWrapper);
      parentElement.appendChild(this.container);
      
      // Initialize Phaser game - it will automatically attach to the game-canvas
      this.game = new Phaser.Game(config);
      this.game.bayHarborGame = this;
    }
  }

  close() {
    if (this.game) {
      // Stop any music playing in the current scene
      const currentScene = this.game.scene.scenes.find(scene => scene.scene.isActive());
      if (currentScene && currentScene.music) {
        currentScene.music.stop();
      }
      
      this.game.destroy(true);
      this.game = null;
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
    
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
}

// Create singleton instance
const bayHarborGame = new BayHarborGame();
export default bayHarborGame; 