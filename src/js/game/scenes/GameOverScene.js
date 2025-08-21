// Game Over Scene - Fixed Button Layout
import Phaser from 'phaser';
import { HighScoresManager } from '../high-scores.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
    this.highScoresManager = null;
    this.musicState = null; // Store music state from MainScene
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.musicState = data.musicState || null;
    this.carInfo = data.carInfo || { sprite: 'van', name: 'Van' }; // Store car information
    console.log('🎵 GameOver received music state:', this.musicState);
    console.log('🚗 GameOver received car info:', this.carInfo);
  }

  create() {
    // Initialize high scores manager
    this.highScoresManager = new HighScoresManager();
    this.isHighScore = this.highScoresManager.isHighScore(this.finalScore);
    
    // Create city background
    try {
      this.createCityBackground();
    } catch (error) {
      console.error('Error creating city background in GameOverScene:', error);
      this.createFallbackBackground();
    }

    // Dark overlay
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.8);

    // Add Doakes jail image as dramatic background
    try {
      const doakesImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'doakes_lost_jail');
      doakesImage.setScale(0.8); // Scale to fit nicely
      doakesImage.setAlpha(0.3); // Make it subtle but visible
      doakesImage.setDepth(1); // Behind the text but above background
      console.log('🚔 Doakes jail image added to game over screen');
    } catch (error) {
      console.warn('Could not load Doakes jail image:', error);
    }

    // Game Over text
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 150, 'GAME OVER', {
      font: 'bold 48px Arial',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Score text
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, `Your Score: ${this.finalScore.toLocaleString()}`, {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // High score notification
    if (this.isHighScore) {
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 10, '🏆 NEW HIGH SCORE! 🏆', {
        font: 'bold 20px Arial',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Player name input
      this.createNameInput();
    } else {
      // Regular game over message
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 10, 'The Dark Passenger Wins...', {
        font: 'bold 18px Arial',
        fill: '#ff6666'
      }).setOrigin(0.5);
      
      // Show main buttons immediately if not high score
      this.createMainButtons();
    }

    // Crashed cars scene
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const roadCenter = (roadTop + roadBottom) / 2;

    const crashedCar = this.add.image(this.cameras.main.width / 2 - 120, roadCenter, 'player');
    crashedCar.setAngle(45);
    crashedCar.setTint(0x888888);
    crashedCar.setScale(1.5);

    const policeCar = this.add.image(this.cameras.main.width / 2 + 120, roadCenter, 'police');
    policeCar.setScale(1.5);

    // Start scrolling background
    this.time.addEvent({
      delay: 20,
      callback: this.scrollCityBackground,
      callbackScope: this,
      loop: true
    });
  }

  createNameInput() {
    const existingInput = document.getElementById('name-input-field');
    if (existingInput && existingInput.parentNode) {
      existingInput.parentNode.removeChild(existingInput);
    }
    
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.maxLength = 20;
    inputElement.placeholder = 'Your name...';
    inputElement.id = 'name-input-field';
    
    const gameContainer = document.getElementById('game-container');
    const gameCanvas = document.getElementById('game-canvas');
    
    if (gameContainer && gameCanvas) {
      const canvasRect = gameCanvas.getBoundingClientRect();
      const inputX = canvasRect.left + (canvasRect.width / 2) - 150;
      const inputY = canvasRect.top + (canvasRect.height / 2) + 40;
      
      inputElement.style.cssText = `
        position: fixed;
        left: ${inputX}px;
        top: ${inputY}px;
        width: 300px;
        height: 40px;
        font-size: 16px;
        text-align: center;
        background: #333;
        color: white;
        border: 2px solid #666;
        border-radius: 4px;
        z-index: 10001;
        outline: none;
      `;
      gameContainer.appendChild(inputElement);
      inputElement.focus();
      
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 10, 'Enter your name for the leaderboard:', {
        font: '16px Arial',
        fill: '#ffffff'
      }).setOrigin(0.5).setDepth(25);
      
      // Create high score buttons with consistent styling
      this.createHighScoreButtons(inputElement);
      
      this.inputElement = inputElement;
    } else {
      console.error('Game container not found, cannot create name input');
      this.submitScore(null);
    }
  }

  createHighScoreButtons(inputElement) {
    // Define consistent button styling
    const buttonStyle = {
      font: 'bold 18px Arial',
      fill: '#ffffff',
      padding: { x: 25, y: 10 }
    };

    // Calculate button positions - evenly spaced vertically with more padding
    const centerX = this.cameras.main.width / 2;
    const baseY = this.cameras.main.height / 2 + 110; // More space from input
    const buttonSpacing = 55; // Increased spacing

    // Random name button
    const randomButton = this.add.text(centerX, baseY, 'Use Random Name', {
      ...buttonStyle,
      backgroundColor: '#0066cc'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(25);
    
    // Submit button
    const submitButton = this.add.text(centerX, baseY + buttonSpacing, 'Submit Score', {
      ...buttonStyle,
      backgroundColor: '#00aa00'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(25);
    
    // Play Again button (always available)
    const playAgainButton = this.add.text(centerX, baseY + buttonSpacing * 2, 'Play Again', {
      ...buttonStyle,
      backgroundColor: '#cc6600'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(25);

    // Back to Menu button - centered below (no quit button)
    const backToMenuButton = this.add.text(centerX, baseY + buttonSpacing * 3, 'Back to Menu', {
      ...buttonStyle,
      backgroundColor: '#666666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(25);

    // Button event listeners
    submitButton.on('pointerdown', () => {
      const name = inputElement.value.trim();
      this.submitScore(name || null);
    });
    
    randomButton.on('pointerdown', () => {
      const randomName = this.highScoresManager.getRandomName();
      this.submitScore(randomName);
    });
    
    playAgainButton.on('pointerdown', () => {
      this.cleanupNameInput();
      this.scene.start('MainScene', { musicState: this.musicState });
    });

    backToMenuButton.on('pointerdown', () => {
      this.cleanupNameInput();
      if (this.sound.sounds) {
        this.sound.sounds.forEach(sound => {
          if (sound.isPlaying) sound.stop();
        });
      }
      this.scene.start('MenuScene');
    });
    
    // Enter key listener for input
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const name = inputElement.value.trim();
        this.submitScore(name || null);
      }
    });
  }

  createMainButtons() {
    // Define consistent button styling
    const buttonStyle = {
      font: 'bold 18px Arial',
      fill: '#ffffff',
      padding: { x: 25, y: 10 }
    };

    // Calculate button positions
    const centerX = this.cameras.main.width / 2;
    const baseY = this.cameras.main.height / 2 + 60;
    const buttonSpacing = 55;

    // Play Again button (primary action)
    const playAgainButton = this.add.text(centerX, baseY, 'Play Again', {
      ...buttonStyle,
      backgroundColor: '#cc6600'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Back to Menu button - centered below (no quit button)
    const backToMenuButton = this.add.text(centerX, baseY + buttonSpacing, 'Back to Menu', {
      ...buttonStyle,
      backgroundColor: '#666666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Button event listeners
    playAgainButton.on('pointerdown', () => {
      this.scene.start('MainScene', { musicState: this.musicState });
    });

    backToMenuButton.on('pointerdown', () => {
      if (this.sound.sounds) {
        this.sound.sounds.forEach(sound => {
          if (sound.isPlaying) sound.stop();
        });
      }
      this.scene.start('MenuScene');
    });
  }

  submitScore(playerName) {
    if (this.highScoresManager) {
      const result = this.highScoresManager.addScore(this.finalScore, playerName, this.carInfo);
      
      // Show confirmation
      const confirmText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 
        `Score saved as "${result.scores.find(s => s.score === this.finalScore)?.name || 'Unknown'}"!`, {
        font: 'bold 16px Arial',
        fill: '#00ff00'
      }).setOrigin(0.5);
      
      // Clean up name input and show main buttons after delay
      this.time.delayedCall(1500, () => {
        this.cleanupNameInput();
        // Hide the high score buttons and show main buttons
        this.children.list.forEach(child => {
          if (child.type === 'Text' && child.depth === 25) {
            child.setVisible(false);
          }
        });
        this.createMainButtons();
      });
    } else {
      console.error('HighScoresManager not initialized in GameOverScene.');
      this.cleanupNameInput();
      this.createMainButtons();
    }
  }
  
  // Clean up name input element
  cleanupNameInput() {
    const existingInput = document.getElementById('name-input-field');
    if (existingInput && existingInput.parentNode) {
      existingInput.parentNode.removeChild(existingInput);
    }
  }
  
  // Override scene shutdown to clean up
  shutdown() {
    this.cleanupNameInput();
    super.shutdown();
  }
  
  // Create road surface for the crashed cars
  createRoadSurface() {
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const roadHeight = roadBottom - roadTop;
    
    // Create road surface (dark gray, slightly transparent)
    const road = this.add.rectangle(0, roadTop, this.cameras.main.width, roadHeight, 0x404040);
    road.setOrigin(0, 0);
    road.setDepth(1);
    road.setAlpha(0.8);
  }
  
  // Create a fallback background if the image fails to load
  createFallbackBackground() {
    console.log('Creating fallback background for GameOverScene...');
    
    // Create a gradient background
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0b3e, 0x1a0b3e, 1);
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    gradient.setDepth(0);
    
    // Add some dim stars
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Math.random() * this.cameras.main.width,
        Math.random() * this.cameras.main.height * 0.5,
        Math.random() * 1.5,
        0xFFFFFF,
        0.4
      );
      star.setDepth(0);
    }
    
    this.backgroundSprites = [];
    console.log('Fallback background created for GameOverScene');
  }
  
  // Create city background using loaded image
  createCityBackground() {
    console.log('Creating city background with image...');
    
    try {
      // Check if the texture exists and is loaded
      if (this.textures.exists('city_background')) {
        const bgTexture = this.textures.get('city_background');
        const bgFrame = bgTexture.get();
        
        if (bgFrame && bgFrame.width > 0 && bgFrame.height > 0) {
          const bgWidth = bgFrame.width;
          const bgHeight = bgFrame.height;
          
          // Calculate scale to fill entire game area
          const scaleX = this.cameras.main.width / bgWidth;
          const scaleY = this.cameras.main.height / bgHeight;
          const scale = Math.max(scaleX, scaleY);
          
          // Create background
          this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'city_background')
            .setScale(scale)
            .setDepth(-2);
          
          console.log('✅ GameOver city background created successfully');
          return;
        }
      }
      
      console.log('⚠️ City background texture not available in GameOverScene, using fallback');
      this.createFallbackBackground();
      
    } catch (error) {
      console.error('Error creating city background in GameOverScene:', error);
      this.createFallbackBackground();
    }
  }
}