// Main Scene - Core gameplay
import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    
    // Game state
    this.player = null;
    this.enemies = null;
    this.collectibles = null;
    this.obstacles = null;
    this.cursors = null;
    this.background = null;
    this.music = null;
    
    // Game variables
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameSpeed = 300;
    this.spawnRate = 1000; // Reduced from 2000 for more cars
    this.lastScoreUpdate = 0;
    
    // New systems
    this.stars = 0; // Wanted level (0-5)
    this.multiplier = 1; // Score multiplier (1-8)
    
    // Police system
    this.policeCars = [];
    this.policeSpawnRate = 3000; // Separate spawn rate for police
    
    // Car selection and physics
    this.selectedCar = localStorage.getItem('selectedCar') || 'van';
    this.carStats = this.getCarStats(this.selectedCar);
    
    // Player movement physics (now based on selected car)
    this.playerVelocity = { x: 0, y: 0 };
    this.maxSpeed = this.carStats.maxSpeed;
    this.acceleration = this.carStats.acceleration;
    this.deceleration = this.carStats.deceleration;
    
    // Music system
    this.playlist = [
      { key: 'theme', name: 'Double Life Gooner' },
      { key: 'black_gooner', name: 'Black Gooner' },
      { key: 'future_gooning', name: 'Future Gooning' },
      { key: 'we_are_gooners', name: 'We Are The Gooners' },
      { key: 'full_gooner', name: 'Full Gooner Mode' },
      { key: 'soy_gooner', name: 'Soy un Gooner' }
    ];
    this.currentTrack = 0;
    this.musicVolume = 0.5;
    
    // Car ambience sound
    this.carAmbience = null;
    
    // UI elements
    this.scoreText = null;
    this.livesText = null;
    this.levelText = null;
    this.starsText = null;
    this.multiplierText = null;
    this.musicControls = null;
    this.currentSongText = null;
    
    // Background elements
    this.backgroundSprites = [];
    this.roadMarkings = [];
    
    // Vehicle categories
    this.vehicleTypes = {
      police: ['police'],
      ambulance: ['ambulance'],
      trucks: ['truck', 'firetruck'],
      special: ['truckdark', 'buggy'], // New category for star-reducing vehicles
      normal: ['bus', 'taxi', 'sports_race', 'trucktank', 'vendor', 'sports_yellow', 'suv_closed', 'towtruck', 'vintage', 'station', 'rounded_green', 'riot'],
      small: ['scooter', 'cycle_low', 'cycle']
    };
    
    // Debug flag
    this.debug = false;
  }

  init(data) {
    this.receivedMusicState = data ? data.musicState : null;
    console.log('🎵 MainScene received music state:', this.receivedMusicState);
  }

  create() {
    console.log('🎮 MainScene: Starting game...');
    
    // Refresh selected car from localStorage (in case it was changed in menu)
    this.selectedCar = localStorage.getItem('selectedCar') || 'van';
    this.carStats = this.getCarStats(this.selectedCar);
    
    // Update physics based on selected car
    this.maxSpeed = this.carStats.maxSpeed;
    this.acceleration = this.carStats.acceleration;
    this.deceleration = this.carStats.deceleration;
    
    console.log(`🚗 Selected car: ${this.selectedCar}`, this.carStats);
    
    // Initialize player velocity tracking
    this.playerVelocity = { x: 0, y: 0 };
    
    // Initialize mobile detection
    this.isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Define road boundaries
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const roadCenter = (roadTop + roadBottom) / 2;
    
    // Create game objects groups FIRST
    console.log('🎮 Creating physics groups...');
    try {
      this.enemies = this.physics.add.group();
      this.collectibles = this.physics.add.group();
      this.obstacles = this.physics.add.group();
      this.policeCars = this.physics.add.group(); // For police AI behavior
      console.log('🎮 Physics groups created successfully:', {
        enemies: !!this.enemies,
        collectibles: !!this.collectibles,
        obstacles: !!this.obstacles,
        policeCars: !!this.policeCars
      });
    } catch (error) {
      console.error('🎮 Error creating physics groups:', error);
      // Fallback: create basic groups
      this.enemies = this.add.group();
      this.collectibles = this.add.group();
      this.obstacles = this.add.group();
      this.policeCars = this.add.group();
    }
    
    // Initialize game state variables
    this.score = 0;
    this.lives = 3;
    this.stars = 0;
    this.multiplier = 1;
    this.gameSpeed = 200;
    
    // Load all music and start playing
    this.loadAllMusic();
    if (this.playlist.length > 0) {
      // Check if we're restarting with previous music state
      if (this.receivedMusicState && this.receivedMusicState.isPlaying) {
        // Restore previous music state
        this.currentTrack = this.receivedMusicState.currentTrack || 0;
        this.musicVolume = this.receivedMusicState.volume || 0.5;
        this.playCurrentTrack();
        console.log('🎵 Restored previous music state');
      } else {
        // Check if main website music player is playing
        const mainAudio = document.getElementById('main-audio');
        if (mainAudio && !mainAudio.paused) {
          console.log('🎵 Main player is playing, not starting game music');
        } else {
          // Main player not playing, start with Double Life Gooner
          const doubleLifeIndex = this.playlist.findIndex(track => track.key === 'theme');
          if (doubleLifeIndex !== -1) {
            this.currentTrack = doubleLifeIndex;
          }
          this.playCurrentTrack();
          console.log('🎵 Main player not playing, starting game music');
        }
      }
    }
    
    // Start car ambience sound
    this.startCarAmbience();
    
    // Create scrolling city background
    try {
      this.createCityBackground();
    } catch (error) {
      console.error('Error creating city background:', error);
      this.createFallbackBackground();
    }
    
    // Create the road and lane markings
    this.createRoadAndMarkings();
    
    // Create world bounds that match the road area
    this.physics.world.setBounds(0, roadTop, this.cameras.main.width, roadBottom - roadTop);
    
    // NOW create player using selected car (after world bounds are set)
    this.createPlayer();
    
    // Wait a frame to ensure everything is properly initialized
    this.time.delayedCall(100, () => {
      this.setupCollisionsAndSpawning();
    });
    
    // Debug: Show all objects after 5 seconds
    this.time.delayedCall(5000, () => {
      this.debugShowAllObjects();
    });
    
    // Create UI
    this.createUI();
    
    // Create mobile touch controls if on mobile
    if (this.isMobile) {
      this.createMobileControls();
    }
    
    // Set up input handling
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Debug key (single press only)
    this.debugKeyPressed = false;
    this.input.keyboard.on('keydown-D', () => {
      if (!this.debugKeyPressed) {
        this.debugKeyPressed = true;
        this.debug = !this.debug;
        this.debugText.setVisible(this.debug);
        console.log(`Debug mode: ${this.debug ? 'ON' : 'OFF'}`);
      }
    });
    
    this.input.keyboard.on('keyup-D', () => {
      this.debugKeyPressed = false;
    });
  }

  update(time) {
    // Player movement
    this.handlePlayerMovement();
    
    // Scroll city background
    this.scrollCityBackground();
    
    // Scroll road markings
    this.scrollRoadMarkings();
    
    // Move game objects
    this.moveGameObjects();
    
    // Update police AI
    this.updatePoliceAI();
    
    // Check if level should increase
    if (time - this.lastScoreUpdate > 1000 && this.score > 0 && this.score % 10 === 0) {
      this.levelUp();
      this.lastScoreUpdate = time;
    }
    
    // Update debug info if enabled
    if (this.debug) {
      this.updateDebugInfo();
    }
  }
  
  // Load all music tracks
  loadAllMusic() {
    console.log('🎵 Loading all music tracks...');
    
    // Check which tracks are actually available
    let availableTracks = [];
    
    for (let track of this.playlist) {
      if (this.cache.audio.exists(track.key)) {
        availableTracks.push(track);
        console.log(`✅ Track loaded: ${track.name} (${track.key})`);
      } else {
        console.warn(`⚠️ Track not found: ${track.name} (${track.key})`);
      }
    }
    
    if (availableTracks.length > 0) {
      this.playlist = availableTracks;
      console.log(`🎵 ${availableTracks.length} tracks available for playback`);
    } else {
      console.error('❌ No music tracks available');
      this.playlist = [];
    }
  }
  
  // Play current track
  playCurrentTrack() {
    if (this.music) {
      this.music.stop();
    }
    
    if (this.playlist.length === 0) {
      console.log('🔇 No music tracks available');
      return;
    }
    
    const track = this.playlist[this.currentTrack];
    if (track && this.cache.audio.exists(track.key)) {
      this.music = this.sound.add(track.key, { 
        volume: this.musicVolume, 
        loop: true,
        // Make music more persistent
        preservesPitch: true,
        rate: 1.0
      });
      
      // Handle tab visibility changes to prevent music stopping
      this.music.on('pause', () => {
        console.log('🎵 Music paused, attempting to resume...');
        if (document.visibilityState === 'visible') {
          this.time.delayedCall(100, () => {
            if (this.music && !this.music.isPlaying) {
              this.music.resume();
            }
          });
        }
      });
      
      this.music.play();
      console.log(`🎵 Playing: ${track.name}`);
      this.updateSongDisplay();
    } else {
      console.error(`❌ Track not found: ${track ? track.key : 'undefined'}`);
    }
  }
  
  // Music control methods
  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.playlist.length;
    this.playCurrentTrack();
    this.updateSongDisplay();
    if (this.musicControls && this.musicControls.playBtn) {
      this.musicControls.playBtn.setText('⏸');
    }
  }
  
  previousTrack() {
    this.currentTrack = this.currentTrack === 0 ? this.playlist.length - 1 : this.currentTrack - 1;
    this.playCurrentTrack();
    this.updateSongDisplay();
    if (this.musicControls && this.musicControls.playBtn) {
      this.musicControls.playBtn.setText('⏸');
    }
  }
  
  togglePlay() {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
      if (this.musicControls && this.musicControls.playBtn) {
        this.musicControls.playBtn.setText('▶');
      }
    } else if (this.music) {
      this.music.resume();
      if (this.musicControls && this.musicControls.playBtn) {
        this.musicControls.playBtn.setText('⏸');
      }
    }
  }
  
  adjustVolume(delta) {
    this.musicVolume = Math.max(0, Math.min(1, this.musicVolume + delta));
    if (this.music) {
      this.music.setVolume(this.musicVolume);
    }
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
          
          // Create scrolling background
          this.cityBg = this.add.image(0, 0, 'city_background')
            .setOrigin(0, 0)
            .setScale(scale)
            .setDepth(0);
          
          // Create second image for seamless scrolling
          this.cityBg2 = this.add.image(bgWidth * scale, 0, 'city_background')
            .setOrigin(0, 0)
            .setScale(scale)
            .setDepth(0);
          
          console.log('✅ City background created successfully');
          return;
        }
      }
      
      console.log('⚠️ City background texture not available, using fallback');
      this.createFallbackBackground();
      
    } catch (error) {
      console.error('Error creating city background:', error);
      this.createFallbackBackground();
    }
  }
  
  // Create the road surface and lane markings
  createRoadAndMarkings() {
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const roadHeight = roadBottom - roadTop;
    
    // Create road surface (dark gray)
    const road = this.add.rectangle(0, roadTop, this.cameras.main.width, roadHeight, 0x404040);
    road.setOrigin(0, 0);
    road.setDepth(1);
    
    // Create continuous lane markings (4 lanes = 3 divider lines)
    this.roadMarkings = [];
    const laneWidth = roadHeight / 4;
    
    // Create 3 lane divider lines
    for (let lane = 1; lane <= 3; lane++) {
      const y = roadTop + (lane * laneWidth);
      
      // Create multiple dashed line segments for continuous effect
      const dashLength = 40;
      const gapLength = 20;
      const totalPattern = dashLength + gapLength;
      const numDashes = Math.ceil((this.cameras.main.width + totalPattern) / totalPattern) + 1;
      
      for (let i = 0; i < numDashes; i++) {
        const x = i * totalPattern;
        const dash = this.add.rectangle(x, y, dashLength, 4, 0xFFFFFF);
        dash.setOrigin(0, 0.5);
        dash.setDepth(2);
        this.roadMarkings.push(dash);
      }
    }
    
    // Create road edges (solid white lines)
    const topEdge = this.add.rectangle(0, roadTop, this.cameras.main.width, 4, 0xFFFFFF);
    topEdge.setOrigin(0, 0);
    topEdge.setDepth(2);
    
    const bottomEdge = this.add.rectangle(0, roadBottom - 2, this.cameras.main.width, 4, 0xFFFFFF);
    bottomEdge.setOrigin(0, 0);
    bottomEdge.setDepth(2);
  }
  
  // Scroll the road markings
  scrollRoadMarkings() {
    const scrollSpeed = this.gameSpeed / 60;
    
    this.roadMarkings.forEach(marking => {
      marking.x -= scrollSpeed;
      
      // Reset position when marking goes off screen
      if (marking.x + marking.width < 0) {
        marking.x += (this.roadMarkings.length / 3) * 60; // Reset to right side
      }
    });
  }
  
  // Create a fallback background if the image fails to load
  createFallbackBackground() {
    console.log('Creating fallback background...');
    
    // Create a gradient background instead of solid black
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a0b3e, 0x1a0b3e, 0x3a1c5a, 0x3a1c5a, 1);
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    gradient.setDepth(0);
    
    // Add some stars
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Math.random() * this.cameras.main.width,
        Math.random() * this.cameras.main.height * 0.5,
        Math.random() * 2,
        0xFFFFFF,
        0.8
      );
      star.setDepth(0);
    }
    
    this.backgroundSprites = [];
    console.log('Fallback background created');
  }
  
  // Scroll city background
  scrollCityBackground() {
    if (this.cityBg && this.cityBg2) {
      // Move both background images to the left
      this.cityBg.x -= this.gameSpeed * 0.3;
      this.cityBg2.x -= this.gameSpeed * 0.3;
      
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
  
  // Create UI elements
  createUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Define footer area (below the street)
    const footerY = height * 0.92; // Start footer at 92% down
    const footerHeight = height * 0.08; // 8% of screen for footer
    
    // Game title with retro arcade styling
    this.add.text(width / 2, 25, 'BAY HARBOR GOONER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
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
    }).setOrigin(0.5).setDepth(10);
    
    // Go Back button with retro Nintendo styling
    const goBackContainer = this.add.container(width - 60, 20);
    
    // Button shadow
    const buttonShadow = this.add.rectangle(2, 2, 80, 30, 0x000000).setAlpha(0.5);
    
    // Button border
    const buttonBorder = this.add.rectangle(0, 0, 80, 30, 0x222222);
    
    // Button face
    const buttonFace = this.add.rectangle(0, 0, 76, 26, 0xaa0000);
    
    // Button highlight
    const buttonHighlight = this.add.rectangle(-1, -1, 76, 3, 0xffffff).setAlpha(0.3);
    const buttonHighlightLeft = this.add.rectangle(-38, 0, 3, 26, 0xffffff).setAlpha(0.3);
    
    // Button text
    const buttonText = this.add.text(0, 0, '← MENU', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    goBackContainer.add([buttonShadow, buttonBorder, buttonFace, buttonHighlight, buttonHighlightLeft, buttonText]);
    goBackContainer.setSize(80, 30);
    goBackContainer.setInteractive({ useHandCursor: true });
    goBackContainer.setDepth(10);
    
    // Go Back button interactions
    goBackContainer.on('pointerdown', () => {
      goBackContainer.setScale(0.95);
      // Save current music state
      const musicState = {
        isPlaying: this.music && !this.music.isPaused,
        currentTrack: this.currentTrack,
        volume: this.musicVolume,
        position: this.music ? this.music.seek : 0
      };
      
      console.log('🎵 Saving music state for menu return:', musicState);
      
      // Go to menu scene with music state
      this.scene.start('MenuScene', { musicState: musicState });
    });
    
    goBackContainer.on('pointerup', () => {
      goBackContainer.setScale(1);
    });
    
    goBackContainer.on('pointerover', () => {
      buttonFace.setFillStyle(0xcc0000);
    });
    
    goBackContainer.on('pointerout', () => {
      buttonFace.setFillStyle(0xaa0000);
    });
    
    // Create retro-styled UI panel for stats
    const uiPanel = this.add.graphics();
    uiPanel.fillStyle(0x222222, 0.9);
    uiPanel.fillRect(0, footerY - 5, width, footerHeight + 5);
    uiPanel.lineStyle(2, 0x666666);
    uiPanel.strokeRect(0, footerY - 5, width, footerHeight + 5);
    uiPanel.lineStyle(1, 0xaaaaaa);
    uiPanel.strokeRect(2, footerY - 3, width - 4, footerHeight + 1);
    uiPanel.setDepth(8);
    
    // Stats with retro monospace font styling
    this.scoreText = this.add.text(15, footerY, 'SCORE: 000000', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 1
    }).setDepth(10);
    
    this.livesText = this.add.text(15, footerY + 18, 'LIVES: 3', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    }).setDepth(10);
    
    this.starsText = this.add.text(150, footerY, 'WANTED: ☆☆☆☆☆', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#ff6600',
      stroke: '#000000',
      strokeThickness: 1
    }).setDepth(10);
    
    this.multiplierText = this.add.text(150, footerY + 18, 'COMBO: x1', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setDepth(10);
    
    // Control instructions in retro style
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.add.text(width / 2, footerY, 'CONTROLS: ' + (isMobile ? 'TOUCH ARROWS' : 'ARROW KEYS'), {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(10);
    
    this.add.text(width / 2, footerY + 18, 'COLLECT RED SIGNS - AVOID CRASHES!', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(10);
    
    // Current song text with retro styling
    this.currentSongText = this.add.text(width - 15, footerY, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      fill: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0).setDepth(10);
    
    // Music controls will be created by createMusicControls()
    this.createMusicControls();
  }
  
  // Create music controls
  createMusicControls() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const footerY = height * 0.92; // Footer area
    
    // Music controls positioned in footer - right side
    const controlsX = width - 300; // Right side of footer
    const controlsY = footerY + 25; // Bottom row of footer
    
    // Previous button
    const prevBtn = this.add.text(controlsX, controlsY, '⏮', {
      font: 'bold 20px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    
    // Play/Pause button
    const playBtn = this.add.text(controlsX + 40, controlsY, '⏸', {
      font: 'bold 20px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    
    // Next button
    const nextBtn = this.add.text(controlsX + 80, controlsY, '⏭', {
      font: 'bold 20px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    
    // Volume control
    const volDownBtn = this.add.text(controlsX + 120, controlsY, '🔉', {
      font: 'bold 16px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    
    const volUpBtn = this.add.text(controlsX + 160, controlsY, '🔊', {
      font: 'bold 16px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    
    // Store references
    this.musicControls = {
      prevBtn, playBtn, nextBtn, volDownBtn, volUpBtn
    };
    
    // Button event handlers
    prevBtn.on('pointerdown', () => this.previousTrack());
    playBtn.on('pointerdown', () => this.togglePlay());
    nextBtn.on('pointerdown', () => this.nextTrack());
    volDownBtn.on('pointerdown', () => this.adjustVolume(-0.1));
    volUpBtn.on('pointerdown', () => this.adjustVolume(0.1));
    
    // Update current song display
    this.updateSongDisplay();
  }
  
  // Create mobile touch controls in footer area
  createMobileControls() {
    if (!this.isMobile) return;
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const footerY = height * 0.92; // Footer area
    
    // Position mobile controls in footer - center
    const controlSize = 45;
    const controlSpacing = 60;
    const centerX = width / 2;
    const controlY = footerY + 25; // Center of footer
    
    // Create control background
    this.add.rectangle(centerX, controlY, 200, 80, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setDepth(14);
    
    // Create arrow buttons in cross formation
    const upArrow = this.add.text(centerX, controlY - 25, '↑', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#dc2626',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    const downArrow = this.add.text(centerX, controlY + 25, '↓', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#dc2626',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    const leftArrow = this.add.text(centerX - 35, controlY, '←', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#dc2626',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    const rightArrow = this.add.text(centerX + 35, controlY, '→', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#dc2626',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    // Store references
    this.mobileControls = {
      up: upArrow,
      down: downArrow,
      left: leftArrow,
      right: rightArrow
    };
    
    // Touch event handlers with visual feedback
    upArrow.on('pointerdown', () => { 
      this.mobileInput.up = true; 
      upArrow.setStyle({ backgroundColor: '#991b1b' });
    });
    upArrow.on('pointerup', () => { 
      this.mobileInput.up = false; 
      upArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    upArrow.on('pointerout', () => { 
      this.mobileInput.up = false; 
      upArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    
    downArrow.on('pointerdown', () => { 
      this.mobileInput.down = true; 
      downArrow.setStyle({ backgroundColor: '#991b1b' });
    });
    downArrow.on('pointerup', () => { 
      this.mobileInput.down = false; 
      downArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    downArrow.on('pointerout', () => { 
      this.mobileInput.down = false; 
      downArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    
    leftArrow.on('pointerdown', () => { 
      this.mobileInput.left = true; 
      leftArrow.setStyle({ backgroundColor: '#991b1b' });
    });
    leftArrow.on('pointerup', () => { 
      this.mobileInput.left = false; 
      leftArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    leftArrow.on('pointerout', () => { 
      this.mobileInput.left = false; 
      leftArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    
    rightArrow.on('pointerdown', () => { 
      this.mobileInput.right = true; 
      rightArrow.setStyle({ backgroundColor: '#991b1b' });
    });
    rightArrow.on('pointerup', () => { 
      this.mobileInput.right = false; 
      rightArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    rightArrow.on('pointerout', () => { 
      this.mobileInput.right = false; 
      rightArrow.setStyle({ backgroundColor: '#dc2626' });
    });
    
    // Initialize mobile input state
    this.mobileInput = {
      up: false,
      down: false,
      left: false,
      right: false
    };
  }
  
  // Update debug information
  updateDebugInfo() {
    // Update the debug text with current info
    if (this.debugText && this.debugText.visible) {
      // Calculate entities count safely
      let entitiesCount = 0;
      if (this.enemies && this.collectibles && this.obstacles) {
        entitiesCount = this.enemies.getChildren().length + 
                       this.collectibles.getChildren().length + 
                       this.obstacles.getChildren().length;
      }
      
      this.debugText.setText([
        `Debug: ON`,
        `FPS: ${Math.round(this.game.loop.actualFps)}`,
        `Player: ${this.player ? Math.round(this.player.x) + ', ' + Math.round(this.player.y) : 'null'}`,
        `Speed: ${this.gameSpeed}`,
        `Police: ${this.policeCars ? this.policeCars.length : 0}`,
        `Track: ${this.currentTrack + 1}/${this.playlist.length}`,
        `Entities: ${entitiesCount}`
      ].join('\n'));
    }
  }
  
  // Start spawning game objects
  startSpawning() {
    console.log('🎮 Starting object spawning...');
    
    // Spawn collectibles (blood slides) every 2-3 seconds
    this.collectibleTimer = this.time.addEvent({
      delay: Phaser.Math.Between(2000, 3000),
      callback: this.spawnCollectible,
      callbackScope: this,
      loop: true
    });
    
    // Spawn vehicles every 1-2 seconds (more frequent for better gameplay)
    this.vehicleTimer = this.time.addEvent({
      delay: Phaser.Math.Between(1000, 2000),
      callback: this.spawnVehicle,
      callbackScope: this,
      loop: true
    });
    
    // Spawn police cars based on wanted level
    this.policeTimer = this.time.addEvent({
      delay: Phaser.Math.Between(3000, 5000),
      callback: this.spawnPolice,
      callbackScope: this,
      loop: true
    });
  }
  
  // Spawn a collectible (blood slide)
  spawnCollectible() {
    if (!this.collectibles) {
      console.warn('🎮 Collectibles group not initialized');
      return;
    }
    
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    const collectible = this.collectibles.create(this.cameras.main.width + 50, y, 'collectible');
    
    // Check if sprite was created successfully
    if (!collectible) {
      console.error('🩸 Failed to create collectible');
      return;
    }
    
    collectible.setScale(1.5); // Bigger collectibles - 1.5x scale instead of 0.5x
    collectible.speed = Phaser.Math.Between(150, 250);
    collectible.body.setSize(30, 30);
    
    // Make sure collectible is visible and at correct depth
    collectible.setVisible(true);
    collectible.setDepth(5); // Above background but below UI
    collectible.setAlpha(1); // Fully opaque
    
    console.log(`🩸 Collectible spawned at (${collectible.x}, ${collectible.y}), visible: ${collectible.visible}, depth: ${collectible.depth}`);
  }
  
  // Spawn a vehicle (enemy)
  spawnVehicle() {
    if (!this.enemies) {
      console.warn('🎮 Enemies group not initialized');
      return;
    }
    
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    // Array of vehicle types with their properties
    const vehicleTypes = [
      // Normal cars (-1 life)
      { sprite: 'bus', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'taxi', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'sports_race', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'trucktank', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'vendor', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'sports_yellow', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'suv_closed', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'towtruck', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'vintage', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'station', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'rounded_green', lives: -1, stars: 0, type: 'normal' },
      { sprite: 'riot', lives: -1, stars: 0, type: 'normal' },
      
      // Trucks (-2 lives)
      { sprite: 'truck', lives: -2, stars: 0, type: 'truck' },
      { sprite: 'firetruck', lives: -2, stars: 0, type: 'truck' },
      
      // Ambulance (+1 life, no multiplier reset)
      { sprite: 'ambulance', lives: 1, stars: 0, type: 'ambulance' },
      
      // Small vehicles (+1 star, no life loss)
      { sprite: 'scooter', lives: 0, stars: 1, type: 'small' },
      { sprite: 'cycle_low', lives: 0, stars: 1, type: 'small' },
      { sprite: 'cycle', lives: 0, stars: 1, type: 'small' }
    ];
    
    const vehicleType = Phaser.Utils.Array.GetRandom(vehicleTypes);
    const vehicle = this.enemies.create(this.cameras.main.width + 50, y, vehicleType.sprite);
    
    // Check if sprite was created successfully
    if (!vehicle) {
      console.error(`🚗 Failed to create vehicle with sprite: ${vehicleType.sprite}`);
      return;
    }
    
    vehicle.setScale(3); // Bigger cars - 3x scale instead of 4x
    vehicle.speed = Phaser.Math.Between(200, 350);
    vehicle.vehicleType = vehicleType;
    vehicle.body.setSize(vehicle.width * 0.8, vehicle.height * 0.8);
    
    // Make sure vehicle is visible and at correct depth
    vehicle.setVisible(true);
    vehicle.setDepth(5); // Above background but below UI
    vehicle.setAlpha(1); // Fully opaque
    
    // Extra logging for cycles to debug the issue
    if (vehicleType.type === 'small') {
      console.log(`🛵 CYCLE SPAWNED: ${vehicleType.sprite} at (${vehicle.x}, ${vehicle.y})`);
      console.log(`🛵 CYCLE TYPE: ${vehicleType.type}, lives: ${vehicleType.lives}, stars: ${vehicleType.stars}`);
      console.log(`🛵 CYCLE VEHICLE TYPE ASSIGNED:`, vehicle.vehicleType);
    }
    
    console.log(`🚗 Vehicle spawned: ${vehicleType.sprite} at (${vehicle.x}, ${vehicle.y}), type: ${vehicleType.type}, lives: ${vehicleType.lives}, stars: ${vehicleType.stars}`);
  }
  
  // Spawn police car
  spawnPolice() {
    if (!this.enemies) {
      console.warn('🎮 Enemies group not initialized');
      return;
    }
    
    // Police spawn rate increases with wanted level
    const spawnChance = Math.min(0.3 + (this.stars * 0.2), 0.9);
    if (Math.random() > spawnChance) {
      return; // Don't spawn this time
    }
    
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    const police = this.enemies.create(this.cameras.main.width + 50, y, 'police');
    
    // Check if sprite was created successfully
    if (!police) {
      console.error('🚔 Failed to create police vehicle');
      return;
    }
    
    police.setScale(3); // Bigger police cars - 3x scale
    police.speed = Phaser.Math.Between(250, 400);
    police.vehicleType = { sprite: 'police', lives: 'arrest', stars: 0, type: 'police' };
    police.body.setSize(police.width * 0.8, police.height * 0.8);
    
    // Make sure police is visible and at correct depth
    police.setVisible(true);
    police.setDepth(5); // Above background but below UI
    police.setAlpha(1); // Fully opaque
    
    // Add to police group for AI behavior
    if (!this.policeCars) {
      this.policeCars = this.physics.add.group();
    }
    this.policeCars.add(police);
    
    console.log(`🚔 Police spawned at (${police.x}, ${police.y}), visible: ${police.visible}, depth: ${police.depth}`);
  }
  
  // Handle player movement
  handlePlayerMovement(delta) {
    // Check if player exists
    if (!this.player) {
      return;
    }
    
    // Get delta time for frame-rate independent movement
    const deltaTime = delta || this.game.loop.delta / 1000; // Convert to seconds
    
    // Handle keyboard input
    let moveLeft = this.cursors.left.isDown;
    let moveRight = this.cursors.right.isDown;
    let moveUp = this.cursors.up.isDown;
    let moveDown = this.cursors.down.isDown;
    
    // Handle mobile touch controls if on mobile
    if (this.isMobile && this.mobileInput) {
      moveLeft = moveLeft || this.mobileInput.left;
      moveRight = moveRight || this.mobileInput.right;
      moveUp = moveUp || this.mobileInput.up;
      moveDown = moveDown || this.mobileInput.down;
    }
    
    // Apply handling multiplier to acceleration and deceleration
    const effectiveAcceleration = this.acceleration * this.carStats.handling;
    const effectiveDeceleration = this.deceleration * this.carStats.handling;
    
    // Apply acceleration/deceleration for X axis
    if (moveLeft) {
      this.playerVelocity.x = Math.max(-this.maxSpeed, this.playerVelocity.x - effectiveAcceleration * deltaTime);
    } else if (moveRight) {
      this.playerVelocity.x = Math.min(this.maxSpeed, this.playerVelocity.x + effectiveAcceleration * deltaTime);
    } else {
      // Decelerate towards zero
      if (this.playerVelocity.x > 0) {
        this.playerVelocity.x = Math.max(0, this.playerVelocity.x - effectiveDeceleration * deltaTime);
      } else if (this.playerVelocity.x < 0) {
        this.playerVelocity.x = Math.min(0, this.playerVelocity.x + effectiveDeceleration * deltaTime);
      }
    }
    
    // Apply acceleration/deceleration for Y axis
    if (moveUp) {
      this.playerVelocity.y = Math.max(-this.maxSpeed, this.playerVelocity.y - effectiveAcceleration * deltaTime);
    } else if (moveDown) {
      this.playerVelocity.y = Math.min(this.maxSpeed, this.playerVelocity.y + effectiveAcceleration * deltaTime);
    } else {
      // Decelerate towards zero
      if (this.playerVelocity.y > 0) {
        this.playerVelocity.y = Math.max(0, this.playerVelocity.y - effectiveDeceleration * deltaTime);
      } else if (this.playerVelocity.y < 0) {
        this.playerVelocity.y = Math.min(0, this.playerVelocity.y + effectiveDeceleration * deltaTime);
      }
    }
    
    // Apply velocity to player
    this.player.setVelocity(this.playerVelocity.x, this.playerVelocity.y);
  }
  
  // Move game objects (enemies, collectibles, obstacles)
  moveGameObjects() {
    // Check if groups exist before accessing them
    if (!this.enemies || !this.collectibles || !this.obstacles) {
      console.warn('🎮 Game object groups not initialized yet');
      return;
    }
    
    // Move enemies (vehicles)
    this.enemies.getChildren().forEach(enemy => {
      enemy.x -= enemy.speed * (this.game.loop.delta / 1000);
      
      // Remove enemies that go off screen
      if (enemy.x < -100) {
        // Remove from police cars group if it's a police car
        if (enemy.vehicleType && enemy.vehicleType.type === 'police' && this.policeCars) {
          this.policeCars.remove(enemy);
        }
        enemy.destroy();
      }
    });
    
    // Move collectibles
    this.collectibles.getChildren().forEach(collectible => {
      collectible.x -= collectible.speed * (this.game.loop.delta / 1000);
      
      // Remove collectibles that go off screen
      if (collectible.x < -100) {
        collectible.destroy();
      }
    });
    
    // Move obstacles
    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.x -= (obstacle.speed || 200) * (this.game.loop.delta / 1000);
      
      // Remove obstacles that go off screen
      if (obstacle.x < -100) {
        obstacle.destroy();
      }
    });
  }
  
  // Handle collecting blood slides
  collectItem(player, collectible) {
    console.log(`🩸 COLLISION DETECTED with collectible at (${collectible.x}, ${collectible.y})`);
    
    // Play collection sound
    if (this.sound.get('collect')) {
      this.sound.play('collect', { volume: 0.3 });
    }
    
    // Add to score with multiplier
    this.score += 1 * this.multiplier;
    
    // Remove the collectible
    collectible.destroy();
    
    console.log(`🩸 Blood slide collected! Score: ${this.score}, Multiplier: x${this.multiplier}`);
  }
  
  // Handle hitting vehicles
  hitVehicle(player, vehicle) {
    if (!vehicle.vehicleType) {
      console.warn('🚗 Vehicle hit but no vehicleType defined:', vehicle);
      return;
    }
    
    const vehicleType = vehicle.vehicleType;
    console.log(`🚗 Vehicle collision detected:`, {
      sprite: vehicleType.sprite,
      type: vehicleType.type,
      lives: vehicleType.lives,
      stars: vehicleType.stars,
      fullVehicleType: vehicleType
    });
    
    // Handle different vehicle types
    switch (vehicleType.type) {
      case 'police':
        // Instant arrest - game over
        console.log('🚔 Police hit - GAME OVER!');
        this.gameOver('ARRESTED');
        break;
        
      case 'ambulance':
        // +1 life, no multiplier reset
        this.lives += 1;
        this.showFloatingText('+1 LIFE', vehicle.x, vehicle.y, '#00ff00');
        console.log(`🚑 Ambulance hit! Lives: ${this.lives}`);
        break;
        
      case 'small':
        // +1 star, no life loss
        const oldStars = this.stars;
        const oldLives = this.lives;
        this.stars = Math.min(this.stars + 1, 5);
        this.showFloatingText('+1 STAR', vehicle.x, vehicle.y, '#ffff00');
        console.log(`🛵 Small vehicle hit! Stars: ${oldStars} → ${this.stars}, Lives: ${oldLives} (unchanged)`);
        console.log(`🛵 Vehicle details: sprite="${vehicleType.sprite}", type="${vehicleType.type}"`);
        break;
        
      case 'truck':
        // -2 lives, reset multiplier
        this.lives -= 2;
        this.multiplier = 1;
        this.showFloatingText('-2 LIVES', vehicle.x, vehicle.y, '#ff0000');
        console.log(`🚛 Truck hit! Lives: ${this.lives}`);
        break;
        
      default:
        // Normal cars: -1 life, reset multiplier
        console.log(`🚗 Default case hit for vehicle type: "${vehicleType.type}"`);
        this.lives -= 1;
        this.multiplier = 1;
        this.showFloatingText('-1 LIFE', vehicle.x, vehicle.y, '#ff0000');
        console.log(`🚗 Car hit! Lives: ${this.lives}`);
        break;
    }
    
    // Play crash sound
    if (this.sound.get('crash')) {
      this.sound.play('crash', { volume: 0.4 });
    }
    
    // Remove the vehicle
    vehicle.destroy();
    
    // Check for game over
    if (this.lives <= 0) {
      this.gameOver('WASTED');
    }
  }
  
  // Show floating text for feedback
  showFloatingText(text, x, y, color = '#ffffff') {
    const floatingText = this.add.text(x, y, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);
    
    // Animate the floating text
    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => floatingText.destroy()
    });
  }
  
  // Handle game over
  gameOver(reason = 'GAME OVER') {
    console.log(`🎮 Game Over: ${reason}`);
    
    // Stop all spawning timers
    if (this.collectibleTimer) this.collectibleTimer.destroy();
    if (this.vehicleTimer) this.vehicleTimer.destroy();
    if (this.policeTimer) this.policeTimer.destroy();
    
    // Play game over sound
    if (this.sound.get('gameover')) {
      this.sound.play('gameover', { volume: 0.5 });
    }
    
    // Save high score and go to game over scene
    this.scene.start('GameOverScene', {
      score: this.score,
      reason: reason
    });
  }
  
  // Debug method to show all game objects
  debugShowAllObjects() {
    console.log('🔍 Debug: All game objects:');
    console.log('Player:', {
      exists: !!this.player,
      x: this.player?.x,
      y: this.player?.y,
      visible: this.player?.visible,
      depth: this.player?.depth,
      alpha: this.player?.alpha
    });
    
    console.log('Enemies count:', this.enemies?.children?.size || 0);
    this.enemies?.children?.entries?.forEach((enemy, index) => {
      console.log(`Enemy ${index}:`, {
        x: enemy.x,
        y: enemy.y,
        visible: enemy.visible,
        depth: enemy.depth,
        alpha: enemy.alpha,
        texture: enemy.texture?.key
      });
    });
    
    console.log('Collectibles count:', this.collectibles?.children?.size || 0);
    this.collectibles?.children?.entries?.forEach((collectible, index) => {
      console.log(`Collectible ${index}:`, {
        x: collectible.x,
        y: collectible.y,
        visible: collectible.visible,
        depth: collectible.depth,
        alpha: collectible.alpha,
        texture: collectible.texture?.key
      });
    });
  }
  
  // Update police AI (if this method is called elsewhere)
  updatePoliceAI() {
    // Check if player exists and police cars group is initialized
    if (!this.player || !this.policeCars) {
      return;
    }
    
    // Use Phaser group's getChildren() method to iterate over police cars
    this.policeCars.getChildren().forEach((police, index) => {
      // Police chase player if player has 1+ stars (changed from 2+)
      if (this.stars >= 1) {
        // Calculate chase speed based on stars (slower at 1 star, faster with more stars)
        const baseSpeed = this.stars === 1 ? 30 : 50; // Slower at 1 star
        const chaseSpeed = Math.min(baseSpeed + (this.stars * 30), 250);
        
        // Move towards player vertically
        const playerY = this.player.y;
        const policeY = police.y;
        
        if (Math.abs(playerY - policeY) > 10) {
          if (playerY > policeY) {
            police.setVelocityY(chaseSpeed);
          } else {
            police.setVelocityY(-chaseSpeed);
          }
        } else {
          police.setVelocityY(0);
        }
      } else {
        // No stars - police just move straight
        police.setVelocityY(0);
      }
    });
  }
  
  // Spawn an obstacle (plastic wrap)
  spawnObstacle() {
    // Calculate a random y position within the road area
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 30, roadBottom - 30);
    
    const obstacle = this.obstacles.create(this.cameras.main.width + 50, y, 'obstacle');
    obstacle.setScale(3.0); // Doubled from 1.5 to 3.0
    obstacle.setDepth(5);
    obstacle.body.setSize(obstacle.width * 0.8, obstacle.height * 0.5);
    obstacle.body.offset.y = obstacle.height * 0.25;
  }
  
  // Collect item handler
  collectItem(player, collectible) {
    collectible.destroy();
    
    // Apply multiplier to score
    const points = 1 * this.multiplier;
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score.toString().padStart(6, '0')}`);
    
    // Increase multiplier (max 8)
    if (this.multiplier < 8) {
      this.multiplier++;
      this.multiplierText.setText(`COMBO: x${this.multiplier}`);
    }
    
    // Play chicken sound at lower volume
    this.sound.play('collect', { volume: 0.3 }); // Increased from 0.2
    
    // Visual feedback
    this.cameras.main.flash(100, 255, 255, 0);
    
    // Show points gained
    this.showFloatingText(`+${points}`, player.x, player.y - 30, '#00ff00');
  }
  
  // Update song display
  updateSongDisplay() {
    if (this.currentSongText && this.playlist[this.currentTrack]) {
      this.currentSongText.setText(`♪ ${this.playlist[this.currentTrack].name}`);
    }
  }
  
  // Handle police collision (instant arrest)
  hitPolice(player, police) {
    console.log('🚔 POLICE COLLISION DETECTED! Game Over.');
    
    // Remove police from array
    const index = this.policeCars.indexOf(police);
    if (index > -1) {
      this.policeCars.splice(index, 1);
    }
    
    police.destroy();
    
    // Show arrest message
    this.showFloatingText('ARRESTED!', player.x, player.y - 30, '#ff0000');
    
    // Visual feedback
    this.cameras.main.shake(300, 0.02);
    
    // Play arrest sound (police.mp3) - lowered volume
    if (this.cache.audio.exists('gameover')) {
      this.sound.play('gameover', { volume: 0.2 }); // Increased from 0.15 to 0.2
    }
    
    // Immediate game over
    this.gameOver();
  }
  
  // Handle vehicle collision
  hitVehicle(player, vehicle) {
    let resetMultiplier = true;
    let specificSound = null; // Specific sound for this vehicle type
    let specificVolume = 0.15; // Default volume
    
    // Remove vehicle from appropriate group based on type
    if (vehicle.vehicleType === 'police') {
      const index = this.policeCars.indexOf(vehicle);
      if (index > -1) {
        this.policeCars.splice(index, 1);
      }
    } else {
      // Remove from Phaser groups
      if (this.enemies && this.enemies.contains(vehicle)) {
        this.enemies.remove(vehicle);
      }
      
      if (this.obstacles && this.obstacles.contains(vehicle)) {
        this.obstacles.remove(vehicle);
      }
    }
    
    // Handle different vehicle types
    switch (vehicle.vehicleType) {
      case 'ambulance':
        this.lives++;
        this.livesText.setText(`LIVES: ${this.lives}`);
        this.showFloatingText('+1 Life', player.x, player.y - 30, '#00ff00');
        resetMultiplier = false; // Don't reset multiplier for ambulance
        // No specific sound, just bump
        break;
        
      case 'police':
        // This should be handled by hitPolice method, but just in case
        this.showFloatingText('ARRESTED!', player.x, player.y - 30, '#ff0000');
        this.gameOver();
        return;
        
      case 'trucks':
        this.lives -= 2;
        this.livesText.setText(`LIVES: ${this.lives}`);
        this.showFloatingText('-2 Lives', player.x, player.y - 30, '#ff0000');
        this.stars = Math.min(this.stars + 1, 5);
        this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        specificSound = 'crash';
        specificVolume = 0.18; // Slightly louder for bigger crash
        break;
        
      case 'small':
        // Scooters/cycles - add star but no life loss
        this.stars = Math.min(this.stars + 1, 5);
        this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        this.showFloatingText('+1 Star', player.x, player.y - 20, '#ffff00');
        resetMultiplier = false; // Don't reset multiplier for small vehicles
        specificSound = 'scream'; // Special scream sound
        specificVolume = 0.08; // Quieter than everything else but still audible
        break;
        
      case 'special':
        // Dark truck/buggy - reduce stars, no life loss
        if (this.stars > 0) {
          this.stars--;
          this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
          this.showFloatingText('-1 Star', player.x, player.y - 30, '#00ffff');
        }
        resetMultiplier = false; // Don't reset multiplier
        // No specific sound, just bump
        break;
        
      default:
        // Normal cars - lose 1 life, gain 1 star
        this.lives--;
        this.livesText.setText(`LIVES: ${this.lives}`);
        this.stars = Math.min(this.stars + 1, 5);
        this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        this.showFloatingText('-1 Life, +1 Star', player.x, player.y - 30, '#ff8800');
        // No specific sound, just bump
        break;
    }
    
    // Play bump sound for ALL vehicle collisions
    if (this.cache.audio.exists('bump')) {
      this.sound.play('bump', { volume: 0.2 }); // Increased from 0.12
    }
    
    // Play specific sound if there is one
    if (specificSound && this.cache.audio.exists(specificSound)) {
      // Small delay to layer the sounds
      this.time.delayedCall(50, () => {
        this.sound.play(specificSound, { volume: specificVolume * 1.3 }); // Increased volume
      });
    }
    
    // Reset multiplier if needed
    if (resetMultiplier) {
      this.multiplier = 1;
      this.multiplierText.setText(`COMBO: x${this.multiplier}`);
    }
    
    // Visual feedback
    this.cameras.main.shake(200, 0.01);
    
    // Destroy the vehicle
    vehicle.destroy();
    
    // Check for game over (only if lives <= 0, not for arrests)
    if (this.lives <= 0) {
      // Play crash sound for losing by running out of lives
      if (this.cache.audio.exists('crash')) {
        this.sound.play('crash', { volume: 0.25 }); // Added crash sound back
      }
      this.gameOver();
    }
  }
  
  // Show floating text
  showFloatingText(text, x, y, color) {
    const floatingText = this.add.text(x, y, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);
    
    // Animate the text
    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => floatingText.destroy()
    });
  }
  
  // Level up
  levelUp() {
    this.level += 1;
    // Note: levelText was removed from UI, no need to update it
    
    // Increase difficulty
    this.gameSpeed += 50;
    this.spawnRate = Math.max(500, this.spawnRate - 100);
    
    // Visual feedback
    this.showFloatingText(`Level ${this.level}!`, this.player.x, this.player.y - 50, '#ffff00');
    
    console.log(`📈 Level up! Now level ${this.level}, speed: ${this.gameSpeed}, spawn rate: ${this.spawnRate}`);
  }
  
  // Game over
  gameOver() {
    console.log('💀 Game Over!');
    
    // Stop car ambience
    this.stopCarAmbience();
    
    // Store music state for continuation
    const musicState = {
      isPlaying: this.music && this.music.isPlaying,
      currentTrack: this.currentTrack,
      volume: this.musicVolume,
      position: this.music ? this.music.seek : 0
    };
    
    // DON'T stop the music - let it continue playing
    // Pass the final score and music state to GameOverScene
    this.scene.start('GameOverScene', { 
      score: this.score, 
      musicState: musicState 
    });
  }
  
  // Stop music when shutting down the scene
  shutdown() {
    if (this.music) {
      this.music.stop();
    }
  }

  // Reset all game state variables
  resetGameState() {
    this.player = null;
    this.enemies = null;
    this.collectibles = null;
    this.obstacles = null;
    this.cursors = null;
    this.background = null;
    this.music = null;
    
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameSpeed = 300;
    this.spawnRate = 1000;
    this.lastScoreUpdate = 0;
    
    this.stars = 0;
    this.multiplier = 1;
    
    this.policeCars = [];
    this.policeSpawnRate = 3000;
    
    this.playlist = [
      { key: 'theme', name: 'Double Life Gooner' },
      { key: 'black_gooner', name: 'Black Gooner' },
      { key: 'future_gooning', name: 'Future Gooning' },
      { key: 'we_are_gooners', name: 'We Are The Gooners' },
      { key: 'full_gooner', name: 'Full Gooner Mode' },
      { key: 'soy_gooner', name: 'Soy un Gooner' }
    ];
    this.currentTrack = 0;
    this.musicVolume = 0.5;
    
    this.carAmbience = null;
    
    this.scoreText = null;
    this.livesText = null;
    this.levelText = null;
    this.starsText = null;
    this.multiplierText = null;
    this.musicControls = null;
    this.currentSongText = null;
    
    this.backgroundSprites = [];
    this.roadMarkings = [];
    
    this.vehicleTypes = {
      police: ['police'],
      ambulance: ['ambulance'],
      trucks: ['truck', 'firetruck'],
      special: ['truckdark', 'buggy'],
      normal: ['bus', 'taxi', 'sports_race', 'trucktank', 'vendor', 'sports_yellow', 'suv_closed', 'towtruck', 'vintage', 'station', 'rounded_green', 'riot'],
      small: ['scooter', 'cycle_low', 'cycle']
    };
    
    this.debug = false;
  }

  // Start car ambience sound
  startCarAmbience() {
    if (this.cache.audio.exists('inside')) {
      this.carAmbience = this.sound.add('inside', { volume: 0.5, loop: true });
      this.carAmbience.play();
      console.log('🚗 Car ambience started');
    } else {
      console.warn('⚠️ Car ambience sound not found');
    }
  }
  
  // Stop car ambience sound
  stopCarAmbience() {
    if (this.carAmbience) {
      this.carAmbience.stop();
      this.carAmbience = null;
      console.log('🚗 Car ambience stopped');
    }
  }

  // Helper to get car stats based on selected car
  getCarStats(carName) {
    const baseStats = {
      van: {
        maxSpeed: 300,
        acceleration: 800,
        deceleration: 1080, // Heavy, good braking
        handling: 0.8 // Lower handling multiplier
      },
      sports_convertible: {
        maxSpeed: 420,
        acceleration: 1200,
        deceleration: 1000, // Fast but lighter braking
        handling: 1.3 // Better handling
      },
      vintage: {
        maxSpeed: 350,
        acceleration: 900,
        deceleration: 700, // Muscle car, poor braking
        handling: 1.0 // Average handling
      },
      sedan_vintage: {
        maxSpeed: 380,
        acceleration: 1100,
        deceleration: 1200, // Sporty sedan, good braking
        handling: 1.4 // Excellent handling
      },
      formula: {
        maxSpeed: 500,
        acceleration: 1500,
        deceleration: 1400, // Racing car, excellent braking
        handling: 1.6 // Superior handling
      }
    };
    
    return baseStats[carName] || baseStats.van;
  }
  
  // Create the player sprite
  createPlayer() {
    console.log(`🚗 Creating player with selected car: ${this.selectedCar}`);
    
    // Calculate center position for player
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const centerY = (roadTop + roadBottom) / 2;
    const centerX = this.cameras.main.width * 0.2; // Start on left side of screen
    
    // Try to create player with selected car sprite
    let carSprite = this.selectedCar;
    
    // Check if the selected car sprite exists
    if (!this.textures.exists(carSprite)) {
      console.warn(`🚗 Sprite "${carSprite}" not found, falling back to 'van'`);
      carSprite = 'van';
      
      if (!this.textures.exists(carSprite)) {
        console.warn(`🚗 Sprite "van" not found, falling back to 'player'`);
        carSprite = 'player';
      }
    }
    
    try {
      // Create the player sprite
      this.player = this.physics.add.sprite(centerX, centerY, carSprite);
      
      if (!this.player) {
        throw new Error('Failed to create player sprite');
      }
      
      // Set player properties
      this.player.setScale(3); // Bigger player car - 3x scale to match enemies
      this.player.setCollideWorldBounds(true);
      this.player.setDrag(this.carStats.handling * 100); // Apply handling as drag
      this.player.setMaxVelocity(this.carStats.maxSpeed);
      
      // Make sure player is visible and at correct depth
      this.player.setVisible(true);
      this.player.setDepth(10); // Above other vehicles
      this.player.setAlpha(1); // Fully opaque
      
      // Set collision body size
      this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.8);
      
      console.log(`🚗 Player created successfully with sprite: ${carSprite} at (${this.player.x}, ${this.player.y})`);
      
    } catch (error) {
      console.error('🚗 Error creating player:', error);
      // Fallback: create a simple rectangle if all sprites fail
      this.player = this.physics.add.sprite(centerX, centerY, null);
      this.player.setSize(40, 80);
      this.player.setFillStyle(0x00ff00); // Green rectangle
      console.log('🚗 Created fallback player rectangle');
    }
  }
  
  // Setup collisions and spawning after player is created
  setupCollisionsAndSpawning() {
    console.log('🎮 Setting up collisions and spawning...');
    
    // Debug: Check all objects exist
    console.log('🎮 Objects check:', {
      player: !!this.player,
      enemies: !!this.enemies,
      collectibles: !!this.collectibles,
      obstacles: !!this.obstacles,
      playerBody: !!this.player?.body,
      enemiesSize: this.enemies?.children?.size || 0
    });
    
    if (this.player && this.enemies && this.collectibles && this.obstacles) {
      // Set up physics overlaps
      this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.hitVehicle, null, this);
      this.physics.add.collider(this.player, this.obstacles);
      
      // Debug: Verify overlaps were created
      console.log('🎮 Physics overlaps created successfully');
      console.log('🎮 Player physics body:', this.player.body);
      console.log('🎮 Enemies group size:', this.enemies.children.size);
      
      // Test collision by logging when any enemy is added to the group
      this.enemies.on('add', (enemy) => {
        console.log(`🎮 Enemy added to group: ${enemy.texture?.key}, vehicleType:`, enemy.vehicleType);
      });
      
      // Manual collision test - check if player and enemies are overlapping
      this.time.delayedCall(2000, () => {
        console.log('🧪 Manual collision test...');
        if (this.player && this.enemies) {
          const enemies = this.enemies.getChildren();
          enemies.forEach((enemy, index) => {
            const distance = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
              enemy.x, enemy.y
            );
            console.log(`🧪 Enemy ${index} (${enemy.texture?.key}): distance=${distance.toFixed(1)}, vehicleType:`, enemy.vehicleType);
          });
        }
      });
      
      console.log('🎮 Collisions set up successfully');
    } else {
      console.error('🎮 Cannot set up collisions - missing objects:', {
        player: !!this.player,
        enemies: !!this.enemies,
        collectibles: !!this.collectibles,
        obstacles: !!this.obstacles
      });
    }
    
    if (this.enemies && this.collectibles && this.obstacles) {
      this.startSpawning();
      console.log('🎮 Started spawning game objects');
    } else {
      console.error('🎮 Cannot start spawning - groups not initialized:', {
        enemies: !!this.enemies,
        collectibles: !!this.collectibles,
        obstacles: !!this.obstacles
      });
    }
  }
} 