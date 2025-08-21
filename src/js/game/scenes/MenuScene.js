// Menu Scene - Cinematic Bay Harbor Gooner Menu
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.menuMusic = null;
    this.menuMusicMuted = false;
    this.currentView = 'main'; // 'main', 'controls', 'rules'
    this.receivedMusicState = null; // Store music state from game
    this.currentCharacterVoice = null; // Track current playing character voice
    this.lastPlayedVoiceIndex = -1; // Track last played voice to avoid repeats
  }

  init(data) {
    // Store music state if coming from game
    this.receivedMusicState = data ? data.musicState : null;
    console.log('🎵 MenuScene received music state:', this.receivedMusicState);
  }

  create() {
    // Create city background
    this.createCityBackground();
    
    // Start menu music (We Are The Gooners)
    this.startMenuMusic();
    
    // Create mute button
    this.createMuteButton();
    
    // Show main menu
    this.showMainMenu();
    
    // Start scrolling background
    this.scrollSpeed = 100;
  }
  
  update() {
    this.scrollCityBackground();
  }
  
  showMainMenu() {
    // Clear any existing content
    this.clearMenuContent();
    this.currentView = 'main';
    
    // Recreate persistent buttons
    this.createMuteButton();
    this.createCloseButton();
    
    // Dark cinematic overlay with subtle scan lines effect
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.85);
    
    // Add retro scan lines overlay
    const scanLines = this.add.graphics();
    scanLines.lineStyle(1, 0x00ff00, 0.1);
    for (let y = 0; y < this.cameras.main.height; y += 4) {
      scanLines.moveTo(0, y);
      scanLines.lineTo(this.cameras.main.width, y);
    }
    scanLines.strokePath();
    scanLines.setDepth(-1);
    
    // Main title with 90s arcade styling
    const titleText = this.add.text(this.cameras.main.width / 2, 100, 'BAY HARBOR GOONER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#004400',
        blur: 0,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5).setDepth(5);
    
    // Add blinking effect to title
    this.tweens.add({
      targets: titleText,
      alpha: { from: 1, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Subtitle with retro styling
    this.add.text(this.cameras.main.width / 2, 140, 'SUPER NINTENDO ENTERTAINMENT SYSTEM', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fill: '#888888',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    
    // Tagline with classic game feel
    this.add.text(this.cameras.main.width / 2, 170, '"The Dark Passenger Takes Over, With just one hand"', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      fontStyle: 'italic',
      fill: '#ff6600',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(5);
    
    // Retro button styling function
    const createRetroButton = (x, y, text, color = '#4444aa') => {
      const button = this.add.container(x, y);
      
      // Button shadow (bottom-right)
      const shadow = this.add.rectangle(2, 2, 200, 40, 0x000000).setAlpha(0.5);
      
      // Button border (dark)
      const border = this.add.rectangle(0, 0, 200, 40, 0x222222);
      
      // Button face (main color)
      const face = this.add.rectangle(0, 0, 196, 36, color);
      
      // Button highlight (top-left)
      const highlight = this.add.rectangle(-2, -2, 196, 4, 0xffffff).setAlpha(0.3);
      const highlightLeft = this.add.rectangle(-98, 0, 4, 36, 0xffffff).setAlpha(0.3);
      
      // Button text
      const buttonText = this.add.text(0, 0, text, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      button.add([shadow, border, face, highlight, highlightLeft, buttonText]);
      button.setSize(200, 40);
      button.setInteractive({ useHandCursor: true });
      
      // Button press effect
      button.on('pointerdown', () => {
        button.setScale(0.95);
        // Play retro beep sound if available
        if (this.sound.get('beep')) {
          this.sound.play('beep', { volume: 0.3 });
        }
      });
      
      button.on('pointerup', () => {
        button.setScale(1);
      });
      
      button.on('pointerover', () => {
        face.setFillStyle(0x6666cc);
        buttonText.setScale(1.05);
      });
      
      button.on('pointerout', () => {
        face.setFillStyle(color);
        buttonText.setScale(1);
      });
      
      return button;
    };
    
    // Create retro-styled menu buttons
    const startButton = createRetroButton(this.cameras.main.width / 2, 240, 'START GAME', 0x00aa00);
    const controlsButton = createRetroButton(this.cameras.main.width / 2, 300, 'CONTROLS', 0x4444aa);
    const rulesButton = createRetroButton(this.cameras.main.width / 2, 360, 'RULES', 0xaa4400);
    const scoresButton = createRetroButton(this.cameras.main.width / 2, 420, 'HIGH SCORES', 0xaa0044);
    
    // Button functionality
    startButton.on('pointerdown', () => {
      this.showCarSelection();
    });
    
    controlsButton.on('pointerdown', () => {
      this.showControlsMenu();
    });
    
    rulesButton.on('pointerdown', () => {
      this.showRulesMenu();
    });
    
    scoresButton.on('pointerdown', () => {
      this.showHighScores();
    });
    
    // Classic arcade footer
    this.add.text(this.cameras.main.width / 2, 500, '© 1993 BAY HARBOR PRODUCTIONS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      fill: '#666666'
    }).setOrigin(0.5).setDepth(5);
    
    this.add.text(this.cameras.main.width / 2, 520, 'INSERT COIN TO CONTINUE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    
    // Make "INSERT COIN" blink
    const insertCoin = this.children.list[this.children.list.length - 1];
    this.tweens.add({
      targets: insertCoin,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }
  
  showControlsMenu() {
    this.clearMenuContent();
    this.currentView = 'controls';
    this.controlsPage = this.controlsPage || 1; // Track current page
    
    // Dark overlay (lighter than before)
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.7);
    
    // Title with page indicator
    const pageNames = ['MOVEMENT', 'DRIVING TIPS', 'IN-GAME MUSIC'];
    this.add.text(this.cameras.main.width / 2, 80, `CONTROLS - ${pageNames[this.controlsPage - 1]}`, {
      font: 'bold 42px Arial',
      fill: '#1e40af',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Page indicator dots
    this.createPageIndicator();
    
    // Show content based on current page
    switch(this.controlsPage) {
      case 1:
        this.showMovementControls();
        break;
      case 2:
        this.showDrivingTips();
        break;
      case 3:
        this.showMusicControls();
        break;
    }
    
    // Navigation buttons
    this.createControlsNavigation();
    
    // Back button
    this.createBackButton();
  }
  
  showRulesMenu() {
    this.clearMenuContent();
    this.currentView = 'rules';
    this.rulesPage = this.rulesPage || 1; // Track current page
    
    // Dark overlay (lighter than before)
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.7);
    
    // Title with page indicator
    const pageNames = ['VEHICLE ENCOUNTERS', 'SCORING SYSTEM', 'WANTED LEVEL'];
    this.add.text(this.cameras.main.width / 2, 80, `RULES - ${pageNames[this.rulesPage - 1]}`, {
      font: 'bold 42px Arial',
      fill: '#059669',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Page indicator dots
    this.createRulesPageIndicator();
    
    // Show content based on current page
    switch(this.rulesPage) {
      case 1:
        this.showVehicleRules();
        break;
      case 2:
        this.showScoringRules();
        break;
      case 3:
        this.showWantedLevelRules();
        break;
    }
    
    // Navigation buttons
    this.createRulesNavigation();
    
    // Back button
    this.createBackButton();
  }
  
  showHighScores() {
    this.clearMenuContent();
    this.currentView = 'scores';
    
    // Dark overlay
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.7);
    
    // Title
    this.add.text(this.cameras.main.width / 2, 80, 'HIGH SCORES', {
      font: 'bold 42px Arial',
      fill: '#7c2d12',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Import and use HighScoresManager
    import('../high-scores.js').then(({ HighScoresManager }) => {
      const highScoresManager = new HighScoresManager();
      const scores = highScoresManager.getHighScores();
      
      if (scores.length === 0) {
        this.add.text(this.cameras.main.width / 2, 250, '🏆 No scores yet!', {
          font: 'bold 24px Arial',
          fill: '#888888'
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.width / 2, 290, 'Be the first to make the leaderboard!', {
          font: '18px Arial',
          fill: '#666666'
        }).setOrigin(0.5);
      } else {
        // Display top 8 scores
        const startY = 160;
        const lineHeight = 35;
        let currentY = startY;
        
        this.add.text(this.cameras.main.width / 2, currentY, 'TOP PLAYERS', {
          font: 'bold 20px Arial',
          fill: '#cccccc'
        }).setOrigin(0.5);
        currentY += 40;
        
        scores.slice(0, 8).forEach((score, index) => {
          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const isTopThree = index < 3;
          
          // Rank
          this.add.text(this.cameras.main.width / 2 - 180, currentY, rankEmoji, {
            font: 'bold 20px Arial',
            fill: isTopThree ? '#ffff00' : '#ffffff'
          }).setOrigin(0.5);
          
          // Name
          this.add.text(this.cameras.main.width / 2 - 120, currentY, score.name, {
            font: isTopThree ? 'bold 16px Arial' : '16px Arial',
            fill: isTopThree ? '#ffffff' : '#cccccc'
          }).setOrigin(0, 0.5);
          
          // Score
          this.add.text(this.cameras.main.width / 2 + 120, currentY, highScoresManager.formatScore(score.score), {
            font: isTopThree ? 'bold 16px Arial' : '16px Arial',
            fill: isTopThree ? '#7c2d12' : '#888888'
          }).setOrigin(1, 0.5);
          
          // Date
          this.add.text(this.cameras.main.width / 2 + 180, currentY, score.date, {
            font: '12px Arial',
            fill: '#666666'
          }).setOrigin(1, 0.5);
          
          currentY += lineHeight;
        });
        
        if (scores.length > 8) {
          this.add.text(this.cameras.main.width / 2, currentY + 20, `...and ${scores.length - 8} more scores`, {
            font: 'italic 14px Arial',
            fill: '#666666'
          }).setOrigin(0.5);
        }
      }
    });
    
    // Back button
    this.createBackButton();
  }
  
  showCarSelection() {
    this.clearMenuContent();
    this.currentView = 'cars';
    this.createMuteButton();
    this.createCloseButton();
    
    // Initialize car index if not set
    this.currentCarIndex = this.currentCarIndex || 0;
    
    // Dark overlay with scan lines
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0).setAlpha(0.85);
    
    // Title with retro styling
    this.add.text(this.cameras.main.width / 2, 60, 'SELECT YOUR VEHICLE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#004400',
        blur: 0,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5).setDepth(5);
    
    this.add.text(this.cameras.main.width / 2, 90, 'Choose your ride for the Bay Harbor streets', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fill: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    
    // Car data with stats
    const cars = [
      {
        key: 'van',
        name: 'Dexter Morgan',
        description: '"Tonight\'s the night, and it\'s going to happen again"',
        voiceKey: 'dexter_voice',
        speed: 2,
        braking: 4,
        weight: 5,
        handling: 2
      },
      {
        key: 'sports_convertible',
        name: 'James Doakes',
        description: '"Surprise, motherf***er!"',
        voiceKey: 'doakes_voice',
        speed: 5,
        braking: 3,
        weight: 2,
        handling: 4
      },
      {
        key: 'vintage',
        name: 'Debra Morgan',
        description: '"Holy f***ing s***, Dexter!"',
        voiceKey: 'deb_voice',
        speed: 3,
        braking: 2,
        weight: 4,
        handling: 3
      },
      {
        key: 'sedan_vintage',
        name: 'Maria LaGuerta',
        description: '"I know what you did last summer... I mean winter"',
        voiceKey: 'laguerta_voice',
        speed: 4,
        braking: 4,
        weight: 3,
        handling: 5
      },
      {
        key: 'formula',
        name: 'Vince Masuka',
        description: '"That\'s what she said! No seriously, forensics!"',
        voiceKey: 'masuka_voice',
        speed: 5,
        braking: 5,
        weight: 1,
        handling: 5
      }
    ];
    
    const currentCar = cars[this.currentCarIndex];
    const selectedCar = localStorage.getItem('selectedCar') || 'van';
    
    // Car counter with retro styling
    this.add.text(this.cameras.main.width / 2, 120, `VEHICLE ${this.currentCarIndex + 1} / ${cars.length}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    
    // Car showcase area
    const showcaseY = 200;
    
    // Car image (large, centered)
    const carImage = this.add.image(this.cameras.main.width / 2, showcaseY, currentCar.key);
    carImage.setScale(4); // Large scale to showcase the car
    carImage.setDepth(5);
    
    // Car name with retro styling
    this.add.text(this.cameras.main.width / 2, showcaseY + 120, currentCar.name.toUpperCase(), {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(5);
    
    // Car description
    this.add.text(this.cameras.main.width / 2, showcaseY + 145, currentCar.description, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fill: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(5);
    
    // Stats display with retro styling
    const statsY = showcaseY + 180;
    const statSpacing = 100;
    const totalStatsWidth = 3 * statSpacing; // 4 stats with 3 gaps between them
    const statsStartX = (this.cameras.main.width - totalStatsWidth) / 2;
    
    const stats = [
      { label: 'SPEED', value: currentCar.speed },
      { label: 'BRAKE', value: currentCar.braking },
      { label: 'WEIGHT', value: currentCar.weight },
      { label: 'HANDLE', value: currentCar.handling }
    ];
    
    stats.forEach((stat, index) => {
      const statX = statsStartX + (index * statSpacing);
      
      // Stat label with retro styling
      this.add.text(statX, statsY, stat.label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5).setDepth(5);
      
      // Star rating with retro colors
      for (let i = 0; i < 5; i++) {
        const starX = statX - 30 + (i * 15);
        const starY = statsY + 25;
        const isFilled = i < stat.value;
        
        this.add.text(starX, starY, '★', {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          fill: isFilled ? '#ffff00' : '#444444',
          stroke: '#000000',
          strokeThickness: 1
        }).setOrigin(0.5).setDepth(5);
      }
    });
    
    // Navigation arrows with retro Nintendo styling
    if (this.currentCarIndex > 0) {
      const leftArrow = this.add.container(this.cameras.main.width / 2 - 200, showcaseY);
      
      // Arrow background
      const leftBg = this.add.rectangle(0, 0, 40, 40, 0x4444aa);
      const leftBorder = this.add.rectangle(0, 0, 40, 40, 0x222222);
      leftBorder.setStrokeStyle(2, 0x666666);
      
      // Arrow text
      const leftText = this.add.text(0, 0, '◀', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      leftArrow.add([leftBorder, leftBg, leftText]);
      leftArrow.setSize(40, 40);
      leftArrow.setInteractive({ useHandCursor: true });
      leftArrow.setDepth(5);
      
      leftArrow.on('pointerdown', () => {
        leftArrow.setScale(0.9);
        this.currentCarIndex--;
        this.showCarSelection();
      });
      
      leftArrow.on('pointerup', () => leftArrow.setScale(1));
      leftArrow.on('pointerover', () => leftBg.setFillStyle(0x6666cc));
      leftArrow.on('pointerout', () => leftBg.setFillStyle(0x4444aa));
    }
    
    if (this.currentCarIndex < cars.length - 1) {
      const rightArrow = this.add.container(this.cameras.main.width / 2 + 200, showcaseY);
      
      // Arrow background
      const rightBg = this.add.rectangle(0, 0, 40, 40, 0x4444aa);
      const rightBorder = this.add.rectangle(0, 0, 40, 40, 0x222222);
      rightBorder.setStrokeStyle(2, 0x666666);
      
      // Arrow text
      const rightText = this.add.text(0, 0, '▶', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      rightArrow.add([rightBorder, rightBg, rightText]);
      rightArrow.setSize(40, 40);
      rightArrow.setInteractive({ useHandCursor: true });
      rightArrow.setDepth(5);
      
      rightArrow.on('pointerdown', () => {
        rightArrow.setScale(0.9);
        this.currentCarIndex++;
        this.showCarSelection();
      });
      
      rightArrow.on('pointerup', () => rightArrow.setScale(1));
      rightArrow.on('pointerover', () => rightBg.setFillStyle(0x6666cc));
      rightArrow.on('pointerout', () => rightBg.setFillStyle(0x4444aa));
    }
    
    // Selection status
    const isSelected = currentCar.key === selectedCar;
    if (isSelected) {
      this.add.text(this.cameras.main.width / 2, statsY + 60, '✓ CURRENTLY SELECTED', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#004400',
          blur: 0,
          stroke: false,
          fill: true
        }
      }).setOrigin(0.5).setDepth(5);
    }
    
    // Action buttons with retro Nintendo styling
    const buttonY = statsY + 120;
    
    // Create retro-styled select button
    const selectContainer = this.add.container(this.cameras.main.width / 2, buttonY);
    
    // Button shadow
    const selectShadow = this.add.rectangle(3, 3, 220, 45, 0x000000).setAlpha(0.5);
    
    // Button border
    const selectBorder = this.add.rectangle(0, 0, 220, 45, 0x222222);
    
    // Button face (different colors based on selection status)
    const selectFace = this.add.rectangle(0, 0, 216, 41, isSelected ? 0x00aa00 : 0xaa0000);
    
    // Button highlights
    const selectHighlight = this.add.rectangle(-2, -2, 216, 4, 0xffffff).setAlpha(0.3);
    const selectHighlightLeft = this.add.rectangle(-108, 0, 4, 41, 0xffffff).setAlpha(0.3);
    
    // Button text
    const selectText = this.add.text(0, 0, isSelected ? 'START WITH THIS CAR' : 'SELECT & START', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    selectContainer.add([selectShadow, selectBorder, selectFace, selectHighlight, selectHighlightLeft, selectText]);
    selectContainer.setSize(220, 45);
    selectContainer.setInteractive({ useHandCursor: true });
    selectContainer.setDepth(5);
    
    selectContainer.on('pointerdown', () => {
      selectContainer.setScale(0.95);
      // Save the selected car and start the game
      localStorage.setItem('selectedCar', currentCar.key);
      if (this.menuMusic) {
        this.menuMusic.stop();
      }
      
      // Pass music state if we received it from game
      if (this.receivedMusicState) {
        console.log('🎵 Passing music state back to MainScene:', this.receivedMusicState);
        this.scene.start('MainScene', { musicState: this.receivedMusicState });
      } else {
        this.scene.start('MainScene');
      }
    });
    
    selectContainer.on('pointerup', () => selectContainer.setScale(1));
    selectContainer.on('pointerover', () => {
      selectFace.setFillStyle(isSelected ? 0x00cc00 : 0xcc0000);
      selectText.setScale(1.05);
    });
    selectContainer.on('pointerout', () => {
      selectFace.setFillStyle(isSelected ? 0x00aa00 : 0xaa0000);
      selectText.setScale(1);
    });
    
    // Back button
    this.createBackButton();
    
    // Play character voice when car is displayed (only if index changed)
    if (this.lastPlayedVoiceIndex !== this.currentCarIndex) {
      this.playCharacterVoice(currentCar.voiceKey);
      this.lastPlayedVoiceIndex = this.currentCarIndex;
    }
  }
  
  createBackButton() {
    const backContainer = this.add.container(this.cameras.main.width / 2, 540);
    
    // Button shadow
    const backShadow = this.add.rectangle(2, 2, 180, 35, 0x000000).setAlpha(0.5);
    
    // Button border
    const backBorder = this.add.rectangle(0, 0, 180, 35, 0x222222);
    
    // Button face
    const backFace = this.add.rectangle(0, 0, 176, 31, 0x666666);
    
    // Button highlights
    const backHighlight = this.add.rectangle(-1, -1, 176, 3, 0xffffff).setAlpha(0.3);
    const backHighlightLeft = this.add.rectangle(-88, 0, 3, 31, 0xffffff).setAlpha(0.3);
    
    // Button text
    const backText = this.add.text(0, 0, '← BACK TO MENU', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    backContainer.add([backShadow, backBorder, backFace, backHighlight, backHighlightLeft, backText]);
    backContainer.setSize(180, 35);
    backContainer.setInteractive({ useHandCursor: true });
    backContainer.setDepth(5);
    
    backContainer.on('pointerdown', () => {
      backContainer.setScale(0.95);
      this.showMainMenu();
    });
    
    backContainer.on('pointerup', () => backContainer.setScale(1));
    backContainer.on('pointerover', () => {
      backFace.setFillStyle(0x888888);
      backText.setScale(1.05);
    });
    backContainer.on('pointerout', () => {
      backFace.setFillStyle(0x666666);
      backText.setScale(1);
    });
  }
  
  createCloseButton() {
    // Remove existing close button if it exists
    this.children.list.forEach(child => {
      if (child.text === '×') {
        child.destroy();
      }
    });
    
    const closeBtn = this.add.text(this.cameras.main.width - 40, 40, '×', {
      font: 'bold 48px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    
    closeBtn.on('pointerdown', () => {
      if (this.menuMusic) {
        this.menuMusic.stop();
      }
      if (this.scene.scene.game.bayHarborGame) {
        this.scene.scene.game.bayHarborGame.close();
      }
    });
  }
  
  clearMenuContent() {
    // Create a copy of the children list to avoid modification during iteration
    const childrenCopy = [...this.children.list];
    
    childrenCopy.forEach(child => {
      // Keep background elements (depth -2)
      if (child.depth === -2 || child === this.cityBg || child === this.cityBg2) {
        return;
      }
      
      // Keep persistent UI elements (mute button, close button)
      if (child.text === '🔊' || child.text === '🔇' || child.text === '×') {
        return;
      }
      
      // Remove everything else (menu content)
      if (child && child.destroy) {
        child.destroy();
      }
    });
  }
  
  // Play character voice line
  playCharacterVoice(voiceKey) {
    // Stop any currently playing character voice
    if (this.currentCharacterVoice && this.currentCharacterVoice.isPlaying) {
      this.currentCharacterVoice.stop();
    }
    
    // Play the new character voice if audio exists and isn't muted
    if (this.cache.audio.exists(voiceKey) && !this.menuMusicMuted) {
      this.currentCharacterVoice = this.sound.add(voiceKey, { 
        volume: 0.6, // Slightly louder than menu music but not overpowering
        loop: false 
      });
      this.currentCharacterVoice.play();
      console.log(`🎤 Playing character voice: ${voiceKey}`);
    } else if (!this.cache.audio.exists(voiceKey)) {
      console.warn(`⚠️ Character voice "${voiceKey}" not found`);
    }
  }
  
  // Start menu music
  startMenuMusic() {
    // If we received music state from game, don't start menu music
    if (this.receivedMusicState && this.receivedMusicState.isPlaying) {
      console.log('🎵 Game music is playing, not starting menu music');
      return;
    }
    
    if (this.cache.audio.exists('we_are_gooners') && !this.menuMusicMuted) {
      this.menuMusic = this.sound.add('we_are_gooners', { volume: 0.3, loop: true });
      this.menuMusic.play();
      console.log('🎵 Menu music started: We Are The Gooners');
    } else if (!this.cache.audio.exists('we_are_gooners')) {
      console.warn('⚠️ Menu music track "we_are_gooners" not found');
    }
  }
  
  // Create mute button
  createMuteButton() {
    // Remove existing mute button if it exists
    this.children.list.forEach(child => {
      if (child.text === '🔊' || child.text === '🔇') {
        child.destroy();
      }
    });
    
    const muteButton = this.add.text(120, 40, this.menuMusicMuted ? '🔇' : '🔊', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    
    muteButton.on('pointerdown', () => {
      this.menuMusicMuted = !this.menuMusicMuted;
      muteButton.setText(this.menuMusicMuted ? '🔇' : '🔊');
      
      if (this.menuMusicMuted) {
        // Stop menu music
        if (this.menuMusic) {
          this.menuMusic.stop();
          this.menuMusic = null;
        }
        // Stop character voice
        if (this.currentCharacterVoice && this.currentCharacterVoice.isPlaying) {
          this.currentCharacterVoice.stop();
        }
      } else if (!this.menuMusicMuted && !this.menuMusic) {
        this.startMenuMusic();
      }
    });
  }

  // Create city background (similar to other scenes)
  createCityBackground() {
    console.log('Creating city background for menu...');
    
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
          
          // Create scrolling background
          this.cityBg = this.add.image(0, 0, 'city_background')
            .setOrigin(0, 0)
            .setScale(scale)
            .setDepth(-2);
          
          // Create second image for seamless scrolling
          this.cityBg2 = this.add.image(bgWidth * scale, 0, 'city_background')
            .setOrigin(0, 0)
            .setScale(scale)
            .setDepth(-2);
          
          console.log('✅ Menu city background created successfully');
          return;
        }
      }
      
      console.log('⚠️ City background texture not available in menu, using fallback');
      this.createFallbackBackground();
      
    } catch (error) {
      console.error('Error creating city background in menu:', error);
      this.createFallbackBackground();
    }
  }
  
  // Scroll city background
  scrollCityBackground() {
    if (this.cityBg && this.cityBg2) {
      // Move both background images to the left
      this.cityBg.x -= this.scrollSpeed * 0.016; // 60fps adjustment
      this.cityBg2.x -= this.scrollSpeed * 0.016;
      
      // Get the scaled width of the background
      const bgWidth = this.cityBg.displayWidth;
      
      // Reset positions for seamless loop
      if (this.cityBg.x <= -bgWidth) {
        this.cityBg.x = this.cityBg2.x + bgWidth;
      }
      if (this.cityBg2.x <= -bgWidth) {
        this.cityBg2.x = this.cityBg.x + bgWidth;
      }
    }
  }

  createFallbackBackground() {
    // Create gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // Add some stars
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Math.random() * this.cameras.main.width,
        Math.random() * this.cameras.main.height,
        1,
        0xffffff,
        0.3
      );
    }
    
    this.backgroundSprites = [];
  }

  createPageIndicator() {
    const dotY = 130;
    const dotSpacing = 30;
    const startX = this.cameras.main.width / 2 - dotSpacing;
    
    for (let i = 1; i <= 3; i++) {
      const dot = this.add.circle(startX + (i - 1) * dotSpacing, dotY, 6, 
        i === this.controlsPage ? 0x1e40af : 0x666666);
      dot.setStrokeStyle(2, 0xffffff);
    }
  }
  
  showMovementControls() {
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const startY = 180;
    const lineHeight = 32;
    let currentY = startY;
    
    if (isMobile) {
      // Mobile controls
      this.add.text(this.cameras.main.width / 2, currentY, '📱 MOBILE CONTROLS', {
        font: 'bold 24px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      currentY += 50;
      
      this.add.text(this.cameras.main.width / 2, currentY, '👆 Touch the on-screen buttons:', {
        font: 'bold 18px Arial',
        fill: '#cccccc'
      }).setOrigin(0.5);
      currentY += 40;
      
      const controls = [
        { icon: '⬆️', action: 'Move Forward', key: 'Up Button' },
        { icon: '⬇️', action: 'Brake/Reverse', key: 'Down Button' },
        { icon: '⬅️', action: 'Turn Left', key: 'Left Button' },
        { icon: '➡️', action: 'Turn Right', key: 'Right Button' }
      ];
      
      controls.forEach(control => {
        this.add.text(this.cameras.main.width / 2 - 150, currentY, control.icon, {
          font: 'bold 20px Arial',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.width / 2 - 50, currentY, control.action, {
          font: 'bold 16px Arial',
          fill: '#ffffff'
        }).setOrigin(0, 0.5);
        
        this.add.text(this.cameras.main.width / 2 + 100, currentY, `(${control.key})`, {
          font: '14px Arial',
          fill: '#888888'
        }).setOrigin(0, 0.5);
        
        currentY += lineHeight;
      });
      
    } else {
      // Keyboard controls
      this.add.text(this.cameras.main.width / 2, currentY, '⌨️ KEYBOARD CONTROLS', {
        font: 'bold 24px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      currentY += 50;
      
      this.add.text(this.cameras.main.width / 2, currentY, '🚗 MOVEMENT KEYS:', {
        font: 'bold 18px Arial',
        fill: '#cccccc'
      }).setOrigin(0.5);
      currentY += 40;
      
      const controls = [
        { icon: '↑', action: 'Move Forward', key: 'Up Arrow Key' },
        { icon: '↓', action: 'Brake/Reverse', key: 'Down Arrow Key' },
        { icon: '←', action: 'Turn Left', key: 'Left Arrow Key' },
        { icon: '→', action: 'Turn Right', key: 'Right Arrow Key' }
      ];
      
      controls.forEach(control => {
        this.add.text(this.cameras.main.width / 2 - 150, currentY, control.icon, {
          font: 'bold 28px Arial',
          fill: '#1e40af',
          backgroundColor: '#333333',
          padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.width / 2 - 50, currentY, control.action, {
          font: 'bold 16px Arial',
          fill: '#ffffff'
        }).setOrigin(0, 0.5);
        
        this.add.text(this.cameras.main.width / 2 + 100, currentY, `(${control.key})`, {
          font: '14px Arial',
          fill: '#888888'
        }).setOrigin(0, 0.5);
        
        currentY += lineHeight;
      });
    }
  }
  
  showDrivingTips() {
    const startY = 180;
    const lineHeight = 26;
    let currentY = startY;
    
    this.add.text(this.cameras.main.width / 2, currentY, '🎯 DRIVING TIPS', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    currentY += 50;
    
    const tips = [
      '• Hold keys for smooth acceleration',
      '• Release keys to brake automatically',
      '• The van has 35% better braking power!',
      '• Use momentum for sharper turns',
      '• Brake early when approaching traffic',
      '• Quick direction changes help avoid crashes',
      '• Watch your speed around corners',
      '• Practice makes perfect - learn the physics!'
    ];
    
    tips.forEach(tip => {
      this.add.text(this.cameras.main.width / 2, currentY, tip, {
        font: '16px Arial',
        fill: tip.includes('35%') ? '#00ff00' : '#ffffff',
        stroke: tip.includes('35%') ? '#000000' : null,
        strokeThickness: tip.includes('35%') ? 1 : 0
      }).setOrigin(0.5);
      currentY += lineHeight;
    });
    
    // Special highlight for the braking improvement
    this.add.text(this.cameras.main.width / 2, currentY + 15, '⚡ NEW: Enhanced braking system for better control!', {
      font: 'bold 14px Arial',
      fill: '#ffff00',
      backgroundColor: '#333333',
      padding: { x: 15, y: 6 }
    }).setOrigin(0.5);
  }
  
  showMusicControls() {
    const startY = 180;
    const lineHeight = 28;
    let currentY = startY;
    
    this.add.text(this.cameras.main.width / 2, currentY, '🎵 IN-GAME MUSIC', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    currentY += 50;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'MUSIC CONTROLS:', {
      font: 'bold 18px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 40;
    
    const musicControls = [
      '🔊 Volume Slider - Adjust music volume',
      '⏮️ Previous Button - Go to previous track',
      '⏭️ Next Button - Skip to next track',
      '⏯️ Play/Pause - Control playback',
      '🎼 Track Display - Shows current song name'
    ];
    
    musicControls.forEach(control => {
      this.add.text(this.cameras.main.width / 2, currentY, control, {
        font: '16px Arial',
        fill: '#ffffff'
      }).setOrigin(0.5);
      currentY += lineHeight;
    });
  }
  
  createControlsNavigation() {
    const navY = 500; // Moved down to avoid overlap
    const buttonStyle = {
      font: 'bold 18px Arial',
      fill: '#ffffff',
      padding: { x: 25, y: 10 }
    };
    
    // Previous button
    if (this.controlsPage > 1) {
      const prevButton = this.add.text(this.cameras.main.width / 2 - 120, navY, '← PREVIOUS', {
        ...buttonStyle,
        backgroundColor: '#666666'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      prevButton.on('pointerdown', () => {
        this.controlsPage--;
        this.showControlsMenu();
      });
      
      prevButton.on('pointerover', () => prevButton.setScale(1.05));
      prevButton.on('pointerout', () => prevButton.setScale(1));
    }
    
    // Next button
    if (this.controlsPage < 3) {
      const nextButton = this.add.text(this.cameras.main.width / 2 + 120, navY, 'NEXT →', {
        ...buttonStyle,
        backgroundColor: '#1e40af'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      nextButton.on('pointerdown', () => {
        this.controlsPage++;
        this.showControlsMenu();
      });
      
      nextButton.on('pointerover', () => nextButton.setScale(1.05));
      nextButton.on('pointerout', () => nextButton.setScale(1));
    }
  }

  createRulesPageIndicator() {
    const dotY = 130;
    const dotSpacing = 30;
    const startX = this.cameras.main.width / 2 - dotSpacing;
    
    for (let i = 1; i <= 3; i++) {
      const dot = this.add.circle(startX + (i - 1) * dotSpacing, dotY, 6, 
        i === this.rulesPage ? 0x059669 : 0x666666);
      dot.setStrokeStyle(2, 0xffffff);
    }
  }
  
  showVehicleRules() {
    const startY = 180;
    const lineHeight = 28;
    let currentY = startY;
    
    this.add.text(this.cameras.main.width / 2, currentY, '🚗 VEHICLE ENCOUNTERS', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    currentY += 50;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'Different vehicles have unique effects when hit:', {
      font: 'bold 16px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 35;
    
    const vehicles = [
      { icon: '🚑', name: 'r', effect: '+1 Life (keeps multiplier)', color: '#00ff00' },
      { icon: '🚔', name: 'Police', effect: 'Instant Arrest (GAME OVER)', color: '#ff0000' },
      { icon: '🚛', name: 'Truck', effect: '-2 Lives', color: '#ff8800' },
      { icon: '🛵', name: 'Scooter/Cycle', effect: '+1 Star (no life loss)', color: '#ffff00' },
      { icon: '🚗', name: 'Normal Cars', effect: '-1 Life, +1 Star', color: '#ffffff' },
      { icon: '🚚', name: 'Dark Truck/Buggy', effect: '-1 Star only', color: '#00ffff' }
    ];
    
    vehicles.forEach(vehicle => {
      this.add.text(this.cameras.main.width / 2 - 180, currentY, vehicle.icon, {
        font: 'bold 20px Arial',
        fill: '#ffffff'
      }).setOrigin(0.5);
      
      this.add.text(this.cameras.main.width / 2 - 120, currentY, vehicle.name, {
        font: 'bold 14px Arial',
        fill: '#ffffff'
      }).setOrigin(0, 0.5);
      
      this.add.text(this.cameras.main.width / 2 + 20, currentY, '→', {
        font: 'bold 14px Arial',
        fill: '#666666'
      }).setOrigin(0.5);
      
      this.add.text(this.cameras.main.width / 2 + 50, currentY, vehicle.effect, {
        font: '13px Arial',
        fill: vehicle.color,
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0, 0.5);
      
      currentY += lineHeight;
    });
  }
  
  showScoringRules() {
    const startY = 180;
    const lineHeight = 22;
    let currentY = startY;
    
    this.add.text(this.cameras.main.width / 2, currentY, '💰 SCORING SYSTEM', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    currentY += 45;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'OBJECTIVE:', {
      font: 'bold 16px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 25;
    
    this.add.text(this.cameras.main.width / 2, currentY, '🎯 Collect red bloodslides while avoiding capture', {
      font: '13px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    currentY += 35;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'SCORING MECHANICS:', {
      font: 'bold 16px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 25;
    
    const scoringRules = [
      '• Each bloodslide = 1 Point × Multiplier',
      '• Multiplier starts at x1, increases with collection',
      '• Maximum multiplier: x8',
      '• Most vehicle crashes reset multiplier to x1',
      '• Ambulance crashes DON\'T reset multiplier',
      '• Small vehicle crashes DON\'T reset multiplier'
    ];
    
    scoringRules.forEach(rule => {
      this.add.text(this.cameras.main.width / 2, currentY, rule, {
        font: '12px Arial',
        fill: rule.includes('DON\'T') ? '#00ff00' : '#ffffff',
        stroke: rule.includes('DON\'T') ? '#000000' : null,
        strokeThickness: rule.includes('DON\'T') ? 1 : 0
      }).setOrigin(0.5);
      currentY += lineHeight;
    });
    
    // Highlight box
    this.add.text(this.cameras.main.width / 2, currentY + 10, '⚡ TIP: Avoid crashes to maintain high multipliers!', {
      font: 'bold 11px Arial',
      fill: '#ffff00',
      backgroundColor: '#333333',
      padding: { x: 12, y: 5 }
    }).setOrigin(0.5);
  }
  
  showWantedLevelRules() {
    const startY = 180;
    const lineHeight = 20;
    let currentY = startY;
    
    this.add.text(this.cameras.main.width / 2, currentY, '⭐ WANTED LEVEL SYSTEM', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    currentY += 45;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'Stars indicate police attention level (0-5 stars)', {
      font: 'bold 13px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 30;
    
    const starLevels = [
      { stars: '⭐', level: '1 Star', effect: 'Light police presence' },
      { stars: '⭐⭐', level: '2 Stars', effect: 'Police start chasing you!' },
      { stars: '⭐⭐⭐', level: '3 Stars', effect: 'More aggressive pursuit' },
      { stars: '⭐⭐⭐⭐', level: '4 Stars', effect: 'Heavy police response' },
      { stars: '⭐⭐⭐⭐⭐', level: '5 Stars', effect: 'Maximum heat - fastest pursuit!' }
    ];
    
    starLevels.forEach(level => {
      this.add.text(this.cameras.main.width / 2 - 120, currentY, level.stars, {
        font: 'bold 12px Arial',
        fill: '#ffff00'
      }).setOrigin(0.5);
      
      this.add.text(this.cameras.main.width / 2 - 40, currentY, level.level, {
        font: 'bold 11px Arial',
        fill: '#ffffff'
      }).setOrigin(0, 0.5);
      
      this.add.text(this.cameras.main.width / 2 + 40, currentY, level.effect, {
        font: '10px Arial',
        fill: '#cccccc'
      }).setOrigin(0, 0.5);
      
      currentY += lineHeight;
    });
    
    currentY += 10;
    
    this.add.text(this.cameras.main.width / 2, currentY, 'HOW TO GAIN/LOSE STARS:', {
      font: 'bold 14px Arial',
      fill: '#cccccc'
    }).setOrigin(0.5);
    currentY += 25;
    
    const starTips = [
      '• Hit normal cars or scooters: +1 Star',
      '• Hit dark trucks or buggies: -1 Star',
      '• Higher stars = more police spawn',
      '• Police chase speed increases with stars'
    ];
    
    starTips.forEach(tip => {
      this.add.text(this.cameras.main.width / 2, currentY, tip, {
        font: '11px Arial',
        fill: tip.includes('+1') ? '#ffff00' : tip.includes('-1') ? '#00ff00' : '#ffffff'
      }).setOrigin(0.5);
      currentY += 18;
    });
  }
  
  createRulesNavigation() {
    const navY = 500; // Moved down to avoid overlap
    const buttonStyle = {
      font: 'bold 18px Arial',
      fill: '#ffffff',
      padding: { x: 25, y: 10 }
    };
    
    // Previous button
    if (this.rulesPage > 1) {
      const prevButton = this.add.text(this.cameras.main.width / 2 - 120, navY, '← PREVIOUS', {
        ...buttonStyle,
        backgroundColor: '#666666'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      prevButton.on('pointerdown', () => {
        this.rulesPage--;
        this.showRulesMenu();
      });
      
      prevButton.on('pointerover', () => prevButton.setScale(1.05));
      prevButton.on('pointerout', () => prevButton.setScale(1));
    }
    
    // Next button
    if (this.rulesPage < 3) {
      const nextButton = this.add.text(this.cameras.main.width / 2 + 120, navY, 'NEXT →', {
        ...buttonStyle,
        backgroundColor: '#059669'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      nextButton.on('pointerdown', () => {
        this.rulesPage++;
        this.showRulesMenu();
      });
      
      nextButton.on('pointerover', () => nextButton.setScale(1.05));
      nextButton.on('pointerout', () => nextButton.setScale(1));
    }
  }
} 