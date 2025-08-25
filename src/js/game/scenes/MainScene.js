// Main Scene - Core gameplay
import Phaser from 'phaser';

// Global music instance tracker to prevent duplicates
let globalMusicInstance = null;

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
    this.lives = 3; // Start with 3 lives instead of 1
    this.level = 1;
    this.distance = 0;
    this.lastLevelUp = 0;
    this.gameSpeed = 300;
    this.spawnRate = 1000; // Reduced from 2000 for more cars
    this.lastScoreUpdate = 0;
    
    // New systems
    this.stars = 0; // Wanted level (0-5)
    this.multiplier = 1; // Score multiplier (1-8)
    this.starMultiplier = 1; // Star-based multiplier (1x to 5x)
    
    // Police system
    this.policeCars = [];
    this.policeSpawnRate = 1000; // Much faster initial spawn rate (was 3000)
    this.policeBurstCooldown = 0; // Cooldown between police bursts
    this.isPoliceBurstActive = false; // Track if a burst is currently spawning
    
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

  create(data) {
    console.log('🎮 MainScene.create() called with data:', data);
    
    // Reset game state to ensure clean start
    this.resetGameState();
    
    // Auto-enter fullscreen on mobile for better gaming experience
    if (this.isMobile && !this.isFullscreen()) {
      this.time.delayedCall(1000, () => {
        this.autoEnterFullscreen();
      });
    }
    
    // Auto-rotate to landscape orientation on mobile
    if (this.isMobile) {
      this.time.delayedCall(500, () => {
        this.autoRotateToLandscape();
      });
    }
    
    // Check if this is a restart and we have music state to restore
    if (data && data.musicState) {
      console.log('🎵 Restoring music state from previous game');
      this.receivedMusicState = data.musicState;
    }
    
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
      
      // Initialize particle system for effects - use the correct Phaser API
      this.particles = this.add.particles;
      console.log('🎮 Physics groups created successfully:', {
        enemies: !!this.enemies,
        collectibles: !!this.collectibles,
        obstacles: !!this.obstacles,
        policeCars: !!this.policeCars,
        particles: !!this.particles
      });
    } catch (error) {
      console.error('🎮 Error creating physics groups:', error);
      // Fallback: create basic groups
      this.enemies = this.add.group();
      this.collectibles = this.add.group();
      this.obstacles = this.add.group();
      this.policeCars = this.add.group();
      this.particles = null;
    }
    
    // Initialize game state variables
    this.score = 0;
    this.lives = 3; // Start with 3 lives instead of 1
    this.stars = 0;
    this.multiplier = 1;
    this.level = 1;
    this.distance = 0;
    this.lastLevelUp = 0;
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
          // Check if game music is already playing to prevent duplicates
          if (this.music && this.music.isPlaying) {
            console.log('🎵 Game music already playing, not starting duplicate');
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
      
      // Check if spawning system needs to be restarted (for game restarts)
      if (!this.collectibleTimer || !this.vehicleTimer || !this.policeTimer) {
        console.log('🎮 Spawning system not initialized, restarting...');
        this.restartSpawning();
      }
    });
    
    // Debug: Show all objects after 5 seconds
    this.time.delayedCall(5000, () => {
      this.debugShowAllObjects();
    });
    
    // Create UI
    this.createUI();
    
    // Debug: Show current game state
    console.log('🎮 Scene created with state:', {
      stars: this.stars,
      lives: this.lives,
      score: this.score,
      collectibleTimer: !!this.collectibleTimer,
      vehicleTimer: !!this.vehicleTimer,
      policeTimer: !!this.policeTimer
    });
    
    // Create mobile touch controls if on mobile
    if (this.isMobile) {
      this.createMobileControls();
      
      // Add orientation change listener for mobile
      this.orientationChangeHandler = () => {
        this.handleOrientationChange();
      };
      window.addEventListener('orientationchange', this.orientationChangeHandler);
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
    
    // Debug button for testing collisions
    const debugButton = this.add.text(10, 100, '🧪 DEBUG INFO', {
      fontSize: '16px',
      fill: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    debugButton.setInteractive();
    debugButton.on('pointerdown', () => {
      console.log('🧪 Debug button pressed!');
      if (this.enemies && this.enemies.getChildren().length > 0) {
        const enemy = this.enemies.getChildren()[0];
        console.log('🧪 First enemy info:', {
          sprite: enemy.texture?.key,
          vehicleType: enemy.vehicleType,
          position: `${enemy.x}, ${enemy.y}`,
          visible: enemy.visible,
          depth: enemy.depth
        });
      } else {
        console.log('🧪 No enemies available');
      }
    });
  }

  update(time, delta) {
    // Handle player movement
    this.handlePlayerMovement(delta);
    
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
    
    // Manual collision test - check if player and enemies are overlapping
    if (this.player && this.enemies && this.debug) {
      const enemies = this.enemies.getChildren();
      enemies.forEach((enemy, index) => {
        if (enemy.active && this.player.active) {
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            enemy.x, enemy.y
          );
          
          // If very close, log it
          if (distance < 100) {
            console.log(`🔍 Close to enemy ${index} (${enemy.texture?.key}): distance=${distance.toFixed(1)}`);
            console.log(`🔍 Enemy vehicleType:`, enemy.vehicleType);
          }
        }
      });
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
    // Stop any existing music first
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }
    
    // Stop global music instance if it exists
    if (globalMusicInstance && globalMusicInstance !== this.music) {
      globalMusicInstance.stop();
      globalMusicInstance.destroy();
      globalMusicInstance = null;
    }
    
    // Also stop any other music that might be playing in the scene
    this.sound.getAllPlaying().forEach(sound => {
      if (sound.key !== 'car_ambience') { // Don't stop car ambience
        sound.stop();
        sound.destroy();
      }
    });
    
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
      
      // Set as global instance
      globalMusicInstance = this.music;
      
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
    
    // Star multiplier display
    this.starMultiplierText = this.add.text(300, footerY, 'STAR: x1', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#ff8800',
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
  
  // Create mobile touch controls if on mobile
  createMobileControls() {
    if (!this.isMobile) return;
    
    const { width, height } = this.cameras.main;
    
    // Create circular joystick control
    this.createCircularJoystick(width, height);
    
    // Add fullscreen button for mobile
    const fullscreenBtn = this.add.text(width - 60, 40, '⛶', {
      font: 'bold 24px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#059669',
      padding: { x: 8, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    // Store references
    this.mobileControls = {
      joystick: this.joystick,
      fullscreen: fullscreenBtn
    };
    
    fullscreenBtn.on('pointerdown', () => {
      this.toggleFullscreen();
    });
    
    // Add fullscreen change event listener
    this.fullscreenChangeHandler = () => {
      this.updateFullscreenButton();
    };
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('msfullscreenchange', this.fullscreenChangeHandler);
    
    // Update fullscreen button appearance
    this.updateFullscreenButton();
    
    console.log('📱 Mobile circular joystick controls created');
  }
  
  // Create circular joystick control system
  createCircularJoystick(width, height) {
    const joystickRadius = 60;
    
    // Position joystick for landscape orientation - left side, centered vertically
    const joystickX = joystickRadius + 40; // Left side, 40px from edge
    const joystickY = height / 2; // Center vertically for landscape
    
    // Create joystick background (outer circle)
    const joystickBg = this.add.circle(joystickRadius + 40, height / 2, joystickRadius, 0x000000, 0.7)
      .setStrokeStyle(3, 0xffffff, 0.8)
      .setDepth(14);
    
    // Create joystick handle (inner circle)
    const joystickHandle = this.add.circle(joystickRadius + 40, height / 2, joystickRadius * 0.4, 0xdc2626, 0.9)
      .setStrokeStyle(2, 0xffffff, 1)
      .setDepth(15);
    
    // Create directional indicators
    const indicatorSize = 8;
    const indicatorColor = 0x3b82f6;
    
    // Up indicator
    this.add.circle(joystickX, joystickY - joystickRadius * 0.7, indicatorSize, indicatorColor, 0.6)
      .setDepth(14);
    
    // Down indicator
    this.add.circle(joystickX, joystickY + joystickRadius * 0.7, indicatorSize, indicatorColor, 0.6)
      .setDepth(14);
    
    // Left indicator
    this.add.circle(joystickX - joystickRadius * 0.7, joystickY, indicatorSize, indicatorColor, 0.6)
      .setDepth(14);
    
    // Right indicator
    this.add.circle(joystickX + joystickRadius * 0.7, joystickY, indicatorSize, indicatorColor, 0.6)
      .setDepth(14);
    
    // Create invisible larger interactive area to prevent accidental releases
    const interactiveRadius = joystickRadius + 20; // 20px larger than visual
    const interactiveArea = this.add.circle(joystickX, joystickY, interactiveRadius, 0x000000, 0)
      .setDepth(13); // Below other elements but interactive
    
    // Store joystick reference
    this.joystick = {
      background: joystickBg,
      handle: joystickHandle,
      interactiveArea: interactiveArea,
      x: joystickX,
      y: joystickY,
      radius: joystickRadius,
      interactiveRadius: interactiveRadius,
      isActive: false,
      touchId: null, // Track specific touch
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };
    
    // Initialize mobile input state
    this.mobileInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      joystickX: 0,
      joystickY: 0
    };
    
    // Add touch event handlers
    this.setupJoystickEvents();
  }
  
  // Setup joystick touch events
  setupJoystickEvents() {
    const joystick = this.joystick;
    
    // Use the larger interactive area for all touch events
    joystick.interactiveArea.setInteractive({ useHandCursor: true });
    
    // Touch start
    joystick.interactiveArea.on('pointerdown', (pointer) => {
      joystick.isActive = true;
      joystick.touchId = pointer.id;
      joystick.startX = pointer.x;
      joystick.startY = pointer.y;
      joystick.currentX = joystick.x;
      joystick.currentY = joystick.y;
      
      // Visual feedback
      joystick.background.setFillStyle(0x1f2937, 0.9);
      joystick.handle.setFillStyle(0x991b1b, 0.9);
      
      console.log('🎮 Joystick activated with touch ID:', pointer.id);
    });
    
    // Touch move
    joystick.interactiveArea.on('pointermove', (pointer) => {
      if (!joystick.isActive || joystick.touchId !== pointer.id) return;
      
      const deltaX = pointer.x - joystick.x;
      const deltaY = pointer.y - joystick.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Limit handle movement to joystick radius
      if (distance <= joystick.radius) {
        joystick.currentX = pointer.x;
        joystick.currentY = pointer.y;
      } else {
        // Normalize to radius
        const angle = Math.atan2(deltaY, deltaX);
        joystick.currentX = joystick.x + Math.cos(angle) * joystick.radius;
        joystick.currentY = joystick.y + Math.sin(angle) * joystick.radius;
      }
      
      // Update handle position
      joystick.handle.setPosition(joystick.currentX, joystick.currentY);
      
      // Calculate input values (-1 to 1)
      const inputX = (joystick.currentX - joystick.x) / joystick.radius;
      const inputY = (joystick.currentY - joystick.y) / joystick.radius;
      
      // Update mobile input state
      this.mobileInput.joystickX = inputX;
      this.mobileInput.joystickY = inputY;
      
      // Convert to directional input
      this.mobileInput.left = inputX < -0.3;
      this.mobileInput.right = inputX > 0.3;
      this.mobileInput.up = inputY < -0.3;
      this.mobileInput.down = inputY > 0.3;
    });
    
    // Touch end - only release when actually lifted
    joystick.interactiveArea.on('pointerup', (pointer) => {
      if (joystick.isActive && joystick.touchId === pointer.id) {
        console.log('🎮 Joystick released (pointerup) for touch ID:', pointer.id);
        this.resetJoystick();
      }
    });
    
    // Touch end - handle when finger leaves the joystick area
    joystick.interactiveArea.on('pointerout', (pointer) => {
      // Don't reset immediately on pointerout - only if we're not tracking
      if (joystick.isActive && joystick.touchId === pointer.id && !pointer.isDown) {
        console.log('🎮 Joystick released (pointerout + not down) for touch ID:', pointer.id);
        this.resetJoystick();
      }
    });
    
    // Add global touch end listener to catch any missed releases
    this.input.on('pointerup', (pointer) => {
      if (joystick.isActive && joystick.touchId === pointer.id && !pointer.isDown) {
        console.log('🎮 Joystick released (global pointerup) for touch ID:', pointer.id);
        this.resetJoystick();
      }
    });
    
    // Add global touch move listener to maintain tracking even outside bounds
    this.input.on('pointermove', (pointer) => {
      if (joystick.isActive && joystick.touchId === pointer.id && pointer.isDown) {
        // Continue tracking even if finger moves outside joystick area
        const deltaX = pointer.x - joystick.x;
        const deltaY = pointer.y - joystick.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit handle movement to joystick radius
        if (distance <= joystick.radius) {
          joystick.currentX = pointer.x;
          joystick.currentY = pointer.y;
        } else {
          // Normalize to radius
          const angle = Math.atan2(deltaY, deltaX);
          joystick.currentX = joystick.x + Math.cos(angle) * joystick.radius;
          joystick.currentY = joystick.y + Math.sin(angle) * joystick.radius;
        }
        
        // Update handle position
        joystick.handle.setPosition(joystick.currentX, joystick.currentY);
        
        // Calculate input values (-1 to 1)
        const inputX = (joystick.currentX - joystick.x) / joystick.radius;
        const inputY = (joystick.currentY - joystick.y) / joystick.radius;
        
        // Update mobile input state
        this.mobileInput.joystickX = inputX;
        this.mobileInput.joystickY = inputY;
        
        // Convert to directional input
        this.mobileInput.left = inputX < -0.3;
        this.mobileInput.right = inputX > 0.3;
        this.mobileInput.up = inputY < -0.3;
        this.mobileInput.down = inputY > 0.3;
      }
    });
  }
  
  // Reset joystick to center position
  resetJoystick() {
    const joystick = this.joystick;
    if (!joystick) return;
    
    // Add a small delay to prevent accidental releases during quick movements
    this.time.delayedCall(50, () => {
      if (joystick && joystick.isActive) {
        joystick.isActive = false;
        joystick.touchId = null; // Clear touch ID
        joystick.handle.setPosition(joystick.x, joystick.y);
        
        // Reset visual appearance
        joystick.background.setFillStyle(0x000000, 0.7);
        joystick.handle.setFillStyle(0xdc2626, 0.9);
        
        // Reset input state
        this.mobileInput.joystickX = 0;
        this.mobileInput.joystickY = 0;
        this.mobileInput.left = false;
        this.mobileInput.right = false;
        this.mobileInput.up = false;
        this.mobileInput.down = false;
        
        console.log('🎮 Joystick reset completed');
      }
    });
  }
  
  // Update fullscreen button appearance
  updateFullscreenButton() {
    if (this.mobileControls?.fullscreen) {
      const isFullscreen = this.isFullscreen();
      this.mobileControls.fullscreen.setText(isFullscreen ? '⛶' : '⛶');
      this.mobileControls.fullscreen.setStyle({ 
        backgroundColor: isFullscreen ? '#dc2626' : '#059669' 
      });
    }
  }
  
  // Toggle fullscreen for mobile devices
  toggleFullscreen() {
    if (!this.isMobile) return;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }
        console.log('📱 Entering fullscreen mode');
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        console.log('📱 Exiting fullscreen mode');
      }
    } catch (error) {
      console.warn('📱 Fullscreen not supported or blocked:', error);
    }
  }
  
  // Check if device is in fullscreen mode
  isFullscreen() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.msFullscreenElement);
  }
  
  // Handle screen orientation changes for mobile
  handleOrientationChange() {
    if (!this.isMobile) return;
    
    // Wait a bit for the orientation change to complete
    this.time.delayedCall(100, () => {
      if (this.mobileControls) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Reposition controls for new orientation
        const controlY = height * 0.85;
        const centerX = width / 2;
        
        // Update control positions
        this.mobileControls.up.setPosition(centerX, controlY - 25);
        this.mobileControls.down.setPosition(centerX, controlY + 25);
        this.mobileControls.left.setPosition(centerX - 35, controlY);
        this.mobileControls.right.setPosition(centerX + 35, controlY);
        
        // Update fullscreen button position
        this.mobileControls.fullscreen.setPosition(width - 60, 40);
        
        console.log('📱 Controls repositioned for orientation change');
      }
    });
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
    
    // Spawn collectibles (new floating items) every 1.5-2.5 seconds (more frequent)
    this.collectibleTimer = this.time.addEvent({
      delay: Phaser.Math.Between(1500, 2500),
      callback: this.spawnCollectible,
      callbackScope: this,
      loop: true
    });
    console.log('🎮 Collectible timer created:', this.collectibleTimer);
    
    // Spawn vehicles every 1-2 seconds (more frequent for better gameplay)
    this.vehicleTimer = this.time.addEvent({
      delay: Phaser.Math.Between(1000, 2000),
      callback: this.spawnVehicle,
      callbackScope: this,
      loop: true
    });
    console.log('🎮 Vehicle timer created:', this.vehicleTimer);
    
    // Spawn police cars based on wanted level
    this.policeTimer = this.time.addEvent({
      delay: Phaser.Math.Between(2000, 3500), // Reduced from 3000-5000 to 2000-3500 for more frequent spawning
      callback: this.spawnPolice,
      callbackScope: this,
      loop: true
    });
    console.log('🎮 Police timer created:', this.policeTimer);
    
    // Dynamic police spawn rate based on stars
    this.updatePoliceSpawnRate();
    
    console.log('🎮 All spawning timers created successfully');
  }
  
  // Restart spawning system (for game restarts)
  restartSpawning() {
    console.log('🎮 Restarting spawning system...');
    
    // Destroy existing timers if they exist
    if (this.collectibleTimer) this.collectibleTimer.destroy();
    if (this.vehicleTimer) this.vehicleTimer.destroy();
    if (this.policeTimer) this.policeTimer.destroy();
    
    // Reset police state
    this.policeBurstCooldown = 0;
    this.isPoliceBurstActive = false;
    
    // Start spawning again
    this.startSpawning();
    
    console.log('🎮 Spawning system restarted successfully');
  }
  
  // Spawn a collectible (new floating items system)
  spawnCollectible() {
    if (!this.collectibles) {
      console.warn('🎮 Collectibles group not initialized');
      return;
    }
    
    // Check current potion count on screen
    const currentPotions = this.collectibles.getChildren().length;
    
    console.log(`🎲 Current potions on screen: ${currentPotions}`);
    
    // Limit potions based on current count
    if (currentPotions >= 3) {
      console.log('🎲 Maximum potions reached (3), skipping spawn');
      return; // Don't spawn if 3+ potions already exist
    }
    
    // Reduce spawn chance if multiple potions exist
    let spawnChance = 1.0; // 100% chance normally
    if (currentPotions === 2) {
      spawnChance = 0.05; // Only 5% chance if 2 potions exist
      console.log('🎲 2 potions on screen - reduced spawn chance to 5%');
    } else if (currentPotions === 1) {
      spawnChance = 0.3; // 30% chance if 1 potion exists
      console.log('🎲 1 potion on screen - reduced spawn chance to 30%');
    }
    
    // Random check for spawn
    if (Math.random() > spawnChance) {
      console.log('🎲 Spawn chance failed, skipping collectible');
      return;
    }
    
    console.log(`🎲 Spawn chance passed (${(spawnChance * 100).toFixed(0)}%), proceeding with spawn`);
    
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    // New collectible types with rarity and effects
    const collectibleTypes = [
      // 🩸 Gooner Blood - Rare (15% chance, was 40%)
      { 
        sprite: 'blood', 
        name: 'Gooner Blood',
        effect: 'life',
        value: 1,
        rarity: 15,
        color: '#ff0000',
        description: '+1 LIFE'
      },
      
      // 💧 Water - Rare (8% chance, was 25%) 
      { 
        sprite: 'water', 
        name: 'Water',
        effect: 'star',
        value: -1,
        rarity: 8,
        color: '#00ffff',
        description: '-1 STAR'
      },
      
      // 🟡 Golden Shower - Common (25% chance, was 20%)
      { 
        sprite: 'yellow', 
        name: 'Golden Shower',
        effect: 'points',
        value: 5,
        rarity: 25,
        color: '#ffff00',
        description: '+5 POINTS'
      },
      
      // 🟣 Goon Liquid - Very Common (35% chance, was 10%)
      { 
        sprite: 'goon', 
        name: 'Goon Liquid',
        effect: 'points',
        value: 3,
        rarity: 35,
        color: '#800080',
        description: '+3 POINTS'
      },
      
      // 💩 Poop - Uncommon (12% chance, was 3%)
      { 
        sprite: 'poop', 
        name: 'Poop',
        effect: 'points',
        value: -5,
        rarity: 12,
        color: '#8B4513',
        description: '-5 POINTS'
      },
      
      // 🤮 Puke - Rare (5% chance, was 2%)
      { 
        sprite: 'puke', 
        name: 'Puke',
        effect: 'points',
        value: -10,
        rarity: 5,
        color: '#90EE90',
        description: '-10 POINTS'
      }
    ];
    
    // Select collectible based on rarity
    const random = Math.random() * 100;
    let selectedCollectible = null;
    let cumulativeRarity = 0;
    
    for (const collectible of collectibleTypes) {
      cumulativeRarity += collectible.rarity;
      if (random <= cumulativeRarity) {
        selectedCollectible = collectible;
        break;
      }
    }
    
    // Fallback to blood if nothing selected
    if (!selectedCollectible) {
      selectedCollectible = collectibleTypes[0]; // Gooner Blood
    }
    
    console.log(`🎲 Spawning collectible: ${selectedCollectible.name} (${selectedCollectible.description}) - Rarity: ${selectedCollectible.rarity}%`);
    
    // Create the collectible sprite
    const collectible = this.collectibles.create(this.cameras.main.width + 50, y, selectedCollectible.sprite);
    
    // Check if sprite was created successfully
    if (!collectible) {
      console.error(`🎲 Failed to create collectible: ${selectedCollectible.name}`);
      return;
    }
    
    // Store collectible data
    collectible.collectibleData = selectedCollectible;
    
    // Set properties
    collectible.setScale(1.35); // 10% smaller than 1.5 (was 1.5)
    collectible.speed = Phaser.Math.Between(150, 250);
    collectible.body.setSize(30, 30);
    
    // Add dynamic glow effects based on potion type using Phaser's built-in glow
    try {
      // Use Phaser's built-in glow effect
      this.addFallbackPotionGlow(collectible, selectedCollectible.sprite);
      
      console.log(`✨ Added glow effect to ${selectedCollectible.name}`);
    } catch (error) {
      console.log(`⚠️ Error applying potion glow effect:`, error);
    }
    
    // Make sure collectible is visible and at correct depth
    collectible.setVisible(true);
    collectible.setDepth(5);
    collectible.setAlpha(1);
    
    console.log(`🎲 ${selectedCollectible.name} spawned at (${collectible.x}, ${collectible.y}), effect: ${selectedCollectible.description}`);
  }
  
  // Spawn a vehicle (enemy)
  spawnVehicle() {
    console.log('🚗 SpawnVehicle called - checking groups...');
    
    if (!this.enemies) {
      console.warn('🎮 Enemies group not initialized');
      return;
    }
    
    console.log('🚗 Enemies group exists, size:', this.enemies.children.size);
    
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    console.log('🚗 Road boundaries - Top:', roadTop, 'Bottom:', roadBottom, 'Selected Y:', y);
    
    // Array of vehicle types with their properties
    const vehicleTypes = [
      // Normal cars (-1 life, +1 star for wanted level)
      { sprite: 'bus', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'taxi', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'sports_race', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'trucktank', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'vendor', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'sports_yellow', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'suv_closed', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'towtruck', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'vintage', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'station', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'rounded_green', lives: -1, stars: 1, type: 'normal' },
      { sprite: 'riot', lives: -1, stars: 1, type: 'normal' },
      
      // Trucks (-2 lives, +1 star for wanted level)
      { sprite: 'truck', lives: -2, stars: 1, type: 'truck' },
      { sprite: 'firetruck', lives: -2, stars: 1, type: 'truck' },
      
      // Ambulance (+1 life, no multiplier reset, no stars)
      { sprite: 'ambulance', lives: 1, stars: 0, type: 'ambulance' },
      
      // Small vehicles (+1 star, no life loss)
      { sprite: 'scooter', lives: 0, stars: 1, type: 'small' },
      { sprite: 'cycle_low', lives: 0, stars: 1, type: 'small' },
      { sprite: 'cycle', lives: 0, stars: 1, type: 'small' }
    ];
    
    // Debug: Show the full array and count
    console.log(`🎲 Vehicle types array:`, vehicleTypes);
    console.log(`🎲 Total vehicle types: ${vehicleTypes.length}`);
    console.log(`🎲 Ambulance types: ${vehicleTypes.filter(v => v.type === 'ambulance').length}`);
    console.log(`🎲 Small types: ${vehicleTypes.filter(v => v.type === 'small').length}`);
    console.log(`🎲 Normal types: ${vehicleTypes.filter(v => v.type === 'normal').length} (now give +1 star each!)`);
    console.log(`🎲 Truck types: ${vehicleTypes.filter(v => v.type === 'truck').length} (now give +1 star each!)`);
    
    // Better random selection to ensure all types have a fair chance
    let vehicleType;
    const random = Math.random();
    
    if (random < 0.03) {
      // 3% chance for ambulance (was 15% - much rarer now!)
      const ambulances = vehicleTypes.filter(v => v.type === 'ambulance');
      vehicleType = ambulances[0];
      console.log(`🎲 🚑 Selected ambulance (3% chance)`);
    } else if (random < 0.18) {
      // 15% chance for small vehicles (cycles) - increased from 15% to 15% (no change)
      const smallVehicles = vehicleTypes.filter(v => v.type === 'small');
      vehicleType = Phaser.Utils.Array.GetRandom(smallVehicles);
      console.log(`🎲 🛵 Selected small vehicle (15% chance)`);
    } else if (random < 0.28) {
      // 10% chance for trucks - increased from 10% to 10% (no change)
      const trucks = vehicleTypes.filter(v => v.type === 'truck');
      vehicleType = Phaser.Utils.Array.GetRandom(trucks);
      console.log(`🎲 🚛 Selected truck (10% chance)`);
    } else {
      // 72% chance for normal cars - increased from 60% to 72%
      const normalCars = vehicleTypes.filter(v => v.type === 'normal');
      vehicleType = Phaser.Utils.Array.GetRandom(normalCars);
      console.log(`🎲 🚗 Selected normal car (72% chance)`);
    }
    
    console.log('🚗 About to create vehicle with type:', vehicleType);
    
    const vehicle = this.enemies.create(this.cameras.main.width + 50, y, vehicleType.sprite);
    
    console.log('🚗 Vehicle created:', vehicle);
    
    // Check if sprite was created successfully
    if (!vehicle) {
      console.error(`🚗 Failed to create vehicle with sprite: ${vehicleType.sprite}`);
      return;
    }
    
    console.log('🚗 Vehicle created successfully, setting properties...');
    
    vehicle.setScale(3.9); // 30% bigger than 3x (was 3)
    vehicle.speed = Phaser.Math.Between(200, 350);
    
    // Create a NEW object for each vehicle to avoid reference issues
    vehicle.vehicleType = {
      sprite: vehicleType.sprite,
      lives: vehicleType.lives,
      stars: vehicleType.stars,
      type: vehicleType.type
    };
    
    // CRITICAL: Add property watcher to see if vehicleType.type changes
    Object.defineProperty(vehicle.vehicleType, 'type', {
      get: function() {
        return this._type;
      },
      set: function(value) {
        console.log(`🚨 VEHICLE TYPE CHANGED from "${this._type}" to "${value}" for sprite: ${this.sprite}`);
        this._type = value;
      }
    });
    vehicle.vehicleType.type = vehicleType.type; // Set initial value
    
    // Debug: Verify the vehicleType was assigned correctly
    console.log(`🚗 Vehicle spawned: ${vehicleType.sprite} at (${vehicle.x}, ${vehicle.y})`);
    console.log(`🚗 Assigned vehicleType:`, vehicle.vehicleType);
    console.log(`🚗 Type check: ${vehicle.vehicleType.type === vehicleType.type ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    // Test switch statement logic
    console.log(`🧪 Testing switch statement logic:`);
    switch (vehicle.vehicleType.type) {
      case 'ambulance':
        console.log(`🧪 ✅ Switch case 'ambulance' would be hit`);
        break;
      case 'small':
        console.log(`🧪 ✅ Switch case 'small' would be hit`);
        break;
      case 'truck':
        console.log(`🧪 ✅ Switch case 'truck' would be hit`);
        break;
      default:
        console.log(`🧪 ❌ Switch case 'default' would be hit for type: "${vehicle.vehicleType.type}"`);
        break;
    }
    
    // Debug: Check physics body
    console.log(`🚗 Vehicle physics body:`, vehicle.body);
    console.log(`🚗 Vehicle body size: ${vehicle.body.width} x ${vehicle.body.height}`);
    
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
    
    // Extra logging for ambulance to debug the issue
    if (vehicleType.type === 'ambulance') {
      console.log(`🚑 AMBULANCE SPAWNED: ${vehicleType.sprite} at (${vehicle.x}, ${vehicle.y})`);
      console.log(`🚑 AMBULANCE TYPE: ${vehicleType.type}, lives: ${vehicleType.lives}, stars: ${vehicleType.stars}`);
      console.log(`🚑 AMBULANCE VEHICLE TYPE ASSIGNED:`, vehicle.vehicleType);
      console.log(`🚑 TYPE CHECK: ${vehicle.vehicleType.type === 'ambulance' ? '✅ CORRECT' : '❌ WRONG'}`);
    }
    
    console.log(`🚗 Vehicle spawned: ${vehicleType.sprite} at (${vehicle.x}, ${vehicle.y}), type: ${vehicleType.type}, lives: ${vehicleType.lives}, stars: ${vehicleType.stars}`);
    console.log(`🚗 Vehicle final properties - visible: ${vehicle.visible}, depth: ${vehicle.depth}, alpha: ${vehicle.alpha}`);
    console.log(`🚗 Enemies group size after spawn: ${this.enemies.children.size}`);
  }
  
  // Spawn police car
  spawnPolice() {
    if (!this.enemies) {
      console.warn('🎮 Enemies group not initialized');
      return;
    }
    
    // Check if we're in a burst cooldown or if a burst is already active
    if (this.isPoliceBurstActive || this.time.now < this.policeBurstCooldown) {
      return; // Don't spawn if burst is active or cooldown hasn't expired
    }
    
    // Police spawn rate increases with wanted level (MUCH HIGHER now!)
    const spawnChance = Math.min(0.8 + (this.stars * 0.15), 0.95); // Increased from 0.6 to 0.8 base, 0.25 to 0.15 per star
    if (Math.random() > spawnChance) {
      return; // Don't spawn this time
    }
    
    // Dynamic police spawning based on stars
    this.spawnPoliceBurst();
  }
  
  // Spawn multiple police cars in a burst based on wanted level
  spawnPoliceBurst() {
    // Allow some police to spawn even with 0 stars for better gameplay
    if (this.stars === 0) {
      // 20% chance to spawn 1 cop even with 0 stars
      if (Math.random() < 0.2) {
        this.spawnSinglePolice();
        console.log('🚔 Spawned rare police with 0 stars');
      }
      return;
    }
    
    // Mark that a burst is starting
    this.isPoliceBurstActive = true;
    
    let copCount = 1;
    let burstTiming = [];
    let burstDuration = 0;
    
    // Determine how many cops to spawn based on stars (BALANCED approach)
    switch (this.stars) {
      case 1:
        // 1 star: Mostly single cops, rare doubles
        if (Math.random() < 0.85) { // 85% chance for 1 cop
          copCount = 1;
          burstTiming = [0];
          burstDuration = 1000;
        } else { // 15% chance for 2 cops
          copCount = 2;
          burstTiming = [0, 1000];
          burstDuration = 2000;
        }
        break;
        
      case 2:
        // 2 stars: Mix of 1-2 cops
        if (Math.random() < 0.7) { // 70% chance for 1 cop
          copCount = 1;
          burstTiming = [0];
          burstDuration = 1200;
        } else { // 30% chance for 2 cops
          copCount = 2;
          burstTiming = [0, 800];
          burstDuration = 1800;
        }
        break;
        
      case 3:
        // 3 stars: Mix of 1-3 cops
        const rand3 = Math.random();
        if (rand3 < 0.6) { // 60% chance for 1 cop
          copCount = 1;
          burstTiming = [0];
          burstDuration = 1500;
        } else if (rand3 < 0.85) { // 25% chance for 2 cops
          copCount = 2;
          burstTiming = [0, 700];
          burstDuration = 2000;
        } else { // 15% chance for 3 cops
          copCount = 3;
          burstTiming = [0, 500, 1000];
          burstDuration = 2500;
        }
        break;
        
      case 4:
        // 4 stars: More variety, but controlled
        const rand4 = Math.random();
        if (rand4 < 0.5) { // 50% chance for 2 cops
          copCount = 2;
          burstTiming = [0, 600];
          burstDuration = 2000;
        } else if (rand4 < 0.75) { // 25% chance for 1 cop
          copCount = 1;
          burstTiming = [0];
          burstDuration = 1500;
        } else if (rand4 < 0.9) { // 15% chance for 3 cops
          copCount = 3;
          burstTiming = [0, 400, 800];
          burstDuration = 2500;
        } else { // 10% chance for 4 cops
          copCount = 4;
          burstTiming = [0, 300, 600, 900];
          burstDuration = 3000;
        }
        break;
        
      case 5:
        // 5 stars: Maximum variety, but still controlled
        const rand5 = Math.random();
        if (rand5 < 0.4) { // 40% chance for 2 cops
          copCount = 2;
          burstTiming = [0, 500];
          burstDuration = 2000;
        } else if (rand5 < 0.65) { // 25% chance for 3 cops
          copCount = 3;
          burstTiming = [0, 400, 800];
          burstDuration = 2500;
        } else if (rand5 < 0.8) { // 15% chance for 1 cop
          copCount = 1;
          burstTiming = [0];
          burstDuration = 1500;
        } else if (rand5 < 0.9) { // 10% chance for 4 cops
          copCount = 4;
          burstTiming = [0, 300, 600, 900];
          burstDuration = 3000;
        } else { // 10% chance for 5 cops (rare but exciting!)
          copCount = 5;
          burstTiming = [0, 250, 500, 750, 1000];
          burstDuration = 3500;
        }
        break;
    }
    
    console.log(`🚔 Spawning police burst: ${copCount} cops with ${this.stars} stars, duration: ${burstDuration}ms`);
    
    // Spawn cops with staggered timing
    for (let i = 0; i < copCount; i++) {
      this.time.delayedCall(burstTiming[i], () => {
        this.spawnSinglePolice();
      });
    }
    
    // Set cooldown after burst completes
    this.time.delayedCall(burstDuration, () => {
      this.isPoliceBurstActive = false;
      // Set cooldown before next burst can start
      this.policeBurstCooldown = this.time.now + this.getBurstCooldown();
      console.log(`🚔 Police burst completed, cooldown set for ${this.getBurstCooldown()}ms`);
    });
  }
  
  // Spawn a single police car
  spawnSinglePolice() {
    const roadTop = this.cameras.main.height * 0.2;
    const roadBottom = this.cameras.main.height * 0.9;
    const y = Phaser.Math.Between(roadTop + 50, roadBottom - 50);
    
    const police = this.enemies.create(this.cameras.main.width + 50, y, 'police');
    
    // Check if sprite was created successfully
    if (!police) {
      console.error('🚔 Failed to create police vehicle');
      return;
    }
    
    police.setScale(3.9); // 30% bigger than 3x (was 3)
    police.speed = Phaser.Math.Between(250, 400);
    police.vehicleType = { sprite: 'police', lives: 'arrest', stars: 0, type: 'police' };
    police.body.setSize(police.width * 0.8, police.height * 0.8);
    
    // Keep police car normal - no glow effects
    console.log(`🚔 Police car created successfully`);
    
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
  
  // Handle player movement with momentum and weight
  handlePlayerMovement() {
    if (!this.player || !this.player.body) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Get current velocity
    const currentVelX = this.player.body.velocity.x;
    const currentVelY = this.player.body.velocity.y;
    
    // Movement speed based on car stats
    const maxSpeed = this.carStats.maxSpeed;
    const acceleration = this.carStats.acceleration;
    const deceleration = this.carStats.deceleration;
    
    // Get car-specific momentum based on selected vehicle
    const momentumFactor = this.getCarMomentumFactor();
    
    // Check both keyboard and mobile input
    const isLeftPressed = cursors.left.isDown || (this.mobileInput && this.mobileInput.left);
    const isRightPressed = cursors.right.isDown || (this.mobileInput && this.mobileInput.right);
    const isUpPressed = cursors.up.isDown || (this.mobileInput && this.mobileInput.up);
    const isDownPressed = cursors.down.isDown || (this.mobileInput && this.mobileInput.down);
    
    // Use joystick input for smoother movement on mobile
    let targetVelX = 0;
    let targetVelY = 0;
    
    if (this.mobileInput && (this.mobileInput.joystickX !== 0 || this.mobileInput.joystickY !== 0)) {
      // Use joystick input for smooth movement
      targetVelX = this.mobileInput.joystickX * maxSpeed;
      targetVelY = this.mobileInput.joystickY * maxSpeed;
    } else {
      // Use digital input (keyboard or touch buttons)
      if (isLeftPressed) targetVelX = -maxSpeed;
      else if (isRightPressed) targetVelX = maxSpeed;
      
      if (isUpPressed) targetVelY = -maxSpeed;
      else if (isDownPressed) targetVelY = maxSpeed;
    }
    
    // Apply movement with momentum
    if (targetVelX !== 0) {
      this.player.body.setVelocityX(targetVelX);
    } else {
      // Apply momentum/deceleration when no key is pressed
      if (Math.abs(currentVelX) > 0) {
        // Gradually slow down (momentum effect) - CAR-SPECIFIC!
        const newVelX = currentVelX * momentumFactor;
        this.player.body.setVelocityX(newVelX);
        
        // Stop completely if velocity is very small
        if (Math.abs(newVelX) < 10) {
          this.player.body.setVelocityX(0);
        }
      }
    }
    
    if (targetVelY !== 0) {
      this.player.body.setVelocityY(targetVelY);
    } else {
      // Apply momentum/deceleration when no key is pressed
      if (Math.abs(currentVelY) > 0) {
        // Gradually slow down (momentum effect) - CAR-SPECIFIC!
        const newVelY = currentVelY * momentumFactor;
        this.player.body.setVelocityY(newVelY);
        
        // Stop completely if velocity is very small
        if (Math.abs(newVelY) < 10) {
          this.player.body.setVelocityY(0);
        }
      }
    }
    
    // Braking with space key (stronger deceleration)
    if (spaceKey.isDown) {
      this.player.body.setVelocityX(currentVelX * 0.6); // 40% reduction per frame
      this.player.body.setVelocityY(currentVelY * 0.6);
      
      // Create tire smoke effect when braking
      if (this.particles && (Math.abs(currentVelX) > 50 || Math.abs(currentVelY) > 50)) {
        this.createTireSmokeEffect(this.player.x, this.player.y);
      }
    }
    
    // Keep player within bounds
    this.keepPlayerInBounds();
  }
  
  // Get car-specific momentum factor based on selected vehicle
  getCarMomentumFactor() {
    // Get the current player sprite name to determine car type
    const playerSprite = this.player.texture.key;
    
    let momentumFactor;
    let carDescription;
    
    switch (playerSprite) {
      case 'van':
        momentumFactor = 0.92; // Maximum drift - heaviest vehicle (8% reduction)
        carDescription = 'Van (Heavy)';
        break;
      case 'sports_convertible':
        momentumFactor = 0.75; // Light drift - sports car (25% reduction)
        carDescription = 'Sports Convertible (Light)';
        break;
      case 'vintage':
        momentumFactor = 0.82; // Medium drift - classic car (18% reduction)
        carDescription = 'Vintage (Medium)';
        break;
      case 'sedan_vintage':
        momentumFactor = 0.80; // Medium drift - old sedan (20% reduction)
        carDescription = 'Sedan Vintage (Medium)';
        break;
      case 'formula':
        momentumFactor = 0.65; // Minimal drift - racing precision (35% reduction)
        carDescription = 'Formula (Precision)';
        break;
      default:
        momentumFactor = 0.85; // Default momentum (15% reduction)
        carDescription = 'Unknown (Default)';
    }
    
    // Log the momentum factor being applied
    console.log(`🚗 ${carDescription} - Momentum Factor: ${momentumFactor} (${((1 - momentumFactor) * 100).toFixed(0)}% reduction per frame)`);
    
    return momentumFactor;
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
  
  // Handle collecting items (new floating items system)
  collectItem(player, collectible) {
    if (!collectible.collectibleData) {
      console.warn('🎲 Collectible missing data, using fallback behavior');
      // Fallback: treat as old blood slide
      this.score += 1;
      if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score.toString().padStart(6, '0')}`);
      collectible.destroy();
      return;
    }
    
    const data = collectible.collectibleData;
    console.log(`🎲 COLLECTED: ${data.name} - Effect: ${data.description}`);
    
    // Play collection sound
    if (this.sound.get('collect')) {
      this.sound.play('collect', { volume: 0.3 });
    }
    
    // Handle different collectible effects
    switch (data.effect) {
      case 'life':
        // 🩸 Gooner Blood: +1 life
        this.lives = Math.min(this.lives + data.value, 10); // Cap at 10 lives
        this.showFloatingText(`${data.name}: ${data.description}`, collectible.x, collectible.y, data.color);
        this.createCollectibleSparkle(collectible.x, collectible.y, data.color); // Add sparkle effect
        if (this.livesText) this.livesText.setText(`LIVES: ${this.lives}`);
        console.log(`🩸 ${data.name} collected! Lives: ${this.lives}`);
        break;
        
      case 'star':
        // 💧 Water: -1 star (hydrating from gooning)
        this.stars = Math.max(this.stars + data.value, 0); // Can't go below 0 stars
        this.showFloatingText(`${data.name}: ${data.description}`, collectible.x, collectible.y, data.color);
        this.createCollectibleSparkle(collectible.x, collectible.y, data.color); // Add sparkle effect
        if (this.starsText) this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        console.log(`💧 ${data.name} collected! Stars: ${this.stars}`);
        // Update police spawn rate and star multiplier when stars decrease
        this.updatePoliceSpawnRate();
        this.calculateStarMultiplier();
        break;
        
      case 'points':
        if (data.value > 0) {
          // �� Golden Shower / 🟣 Goon Liquid: +points
          const points = data.value * this.multiplier * this.starMultiplier;
          this.score += points;
          this.showFloatingText(`${data.name}: +${points} POINTS`, collectible.x, collectible.y, data.color);
          this.createCollectibleSparkle(collectible.x, collectible.y, data.color); // Add sparkle effect
          if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score.toString().padStart(6, '0')}`);
          console.log(`🎯 ${data.name} collected! Points: +${points}, Score: ${this.score}`);
        } else {
          // 💩 Poop / 🤮 Puke: -points
          this.score = Math.max(this.score + data.value, 0); // Can't go below 0
          this.showFloatingText(`${data.name}: ${data.value} POINTS`, collectible.x, collectible.y, data.color);
          this.createCollectibleSparkle(collectible.x, collectible.y, data.color); // Add sparkle effect
          if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score.toString().padStart(6, '0')}`);
          console.log(`💩 ${data.name} collected! Points: ${data.value}, Score: ${this.score}`);
        }
        break;
        
      default:
        console.warn(`🎲 Unknown collectible effect: ${data.effect}`);
        break;
    }
    
    // Remove the collectible
    collectible.destroy();
  }
  
  // Handle hitting vehicles
  hitVehicle(player, vehicle) {
    if (!vehicle.vehicleType) return;
    
    const vehicleType = vehicle.vehicleType;
    
    // Handle different vehicle types
    switch (vehicleType.type) {
      case 'police':
        // Instant arrest - game over
        this.gameOver('ARRESTED');
        break;
        
      case 'ambulance':
        // +1 life, no multiplier reset
        this.lives += 1;
        this.showFloatingText('+1 LIFE', vehicle.x, vehicle.y, '#00ff00');
        if (this.livesText) this.livesText.setText(`LIVES: ${this.lives}`);
        console.log(`🚑 Ambulance hit! Lives: ${this.lives}`);
        break;
        
      case 'small':
        // +1 star, no life loss
        this.stars = Math.min(this.stars + 1, 5);
        this.showFloatingText('+1 STAR', vehicle.x, vehicle.y, '#ffff00');
        if (this.starsText) this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        console.log(`🛵 Small vehicle hit! Stars: ${this.stars}`);
        // Update police spawn rate and star multiplier when stars increase
        this.updatePoliceSpawnRate();
        this.calculateStarMultiplier();
        break;
        
      case 'truck':
        // -2 lives, +1 star, reset multiplier
        this.lives -= 2;
        this.stars = Math.min(this.stars + 1, 5); // Add wanted star
        this.multiplier = 1;
        this.showFloatingText('-2 LIVES +1 STAR', vehicle.x, vehicle.y, '#ff0000');
        if (this.livesText) this.livesText.setText(`LIVES: ${this.lives}`);
        if (this.starsText) this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        if (this.multiplierText) this.multiplierText.setText(`COMBO: x${this.multiplier}`);
        console.log(`🚛 Truck hit! Lives: ${this.lives}, Stars: ${this.stars}`);
        // Update police spawn rate and star multiplier when stars increase
        this.updatePoliceSpawnRate();
        this.calculateStarMultiplier();
        break;
        
      default:
        // Normal cars: -1 life, +1 star, reset multiplier
        this.lives -= 1;
        this.stars = Math.min(this.stars + 1, 5); // Add wanted star
        this.multiplier = 1;
        this.showFloatingText('-1 LIFE +1 STAR', vehicle.x, vehicle.y, '#ff0000');
        if (this.livesText) this.livesText.setText(`LIVES: ${this.lives}`);
        if (this.starsText) this.starsText.setText(`WANTED: ${'★'.repeat(this.stars) + '☆'.repeat(5 - this.stars)}`);
        if (this.multiplierText) this.multiplierText.setText(`COMBO: x${this.multiplier}`);
        console.log(`🚗 Car hit! Lives: ${this.lives}, Stars: ${this.stars}`);
        // Update police spawn rate and star multiplier when stars increase
        this.updatePoliceSpawnRate();
        this.calculateStarMultiplier();
        break;
    }
    
    // Play crash sound
    if (this.sound.get('crash')) {
      this.sound.play('crash', { volume: 0.4 });
    }
    
    // Create explosion particle effect
    this.createExplosionEffect(vehicle.x, vehicle.y);
    
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
    
    // Clean up fullscreen event listeners
    if (this.fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('msfullscreenchange', this.fullscreenChangeHandler);
    }
    
    // Clean up orientation change event listener
    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
    }
    
    // Play game over sound
    if (this.sound.get('gameover')) {
      this.sound.play('gameover', { volume: 0.5 });
    }
    
    // Save high score and go to game over scene
    this.scene.start('GameOverScene', {
      score: this.score,
      musicState: this.getMusicState(),
      carInfo: {
        sprite: this.player.texture.key,
        name: this.getCarDisplayName(this.player.texture.key)
      }
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
        // Calculate chase speed based on stars - faster with more stars but never as fast as player
        const baseSpeed = 40; // Base police speed
        const starMultiplier = 1 + (this.stars * 0.3); // 30% faster per star
        const maxSpeed = Math.min(this.carStats.maxSpeed * 0.7, 200); // Never faster than 70% of player speed
        
        const chaseSpeed = Math.min(baseSpeed * starMultiplier, maxSpeed);
        
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
        
        // Log police speed for debugging
        if (index === 0) { // Only log first police car to avoid spam
          console.log(`🚔 Police AI: ${this.stars} stars, speed: ${chaseSpeed.toFixed(1)}, max: ${maxSpeed}`);
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
  

  
  // Update song display
  updateSongDisplay() {
    if (this.currentSongText && this.playlist[this.currentTrack]) {
      this.currentSongText.setText(`♪ ${this.playlist[this.currentTrack].name}`);
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
      musicState: musicState,
      carInfo: {
        sprite: this.player.texture.key,
        name: this.getCarDisplayName(this.player.texture.key)
      }
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
    this.lives = 3; // Start with 3 lives instead of 1
    this.level = 1;
    this.distance = 0;
    this.lastLevelUp = 0;
    this.gameSpeed = 300;
    this.spawnRate = 1000;
    this.lastScoreUpdate = 0;
    
    this.stars = 0;
    this.multiplier = 1;
    this.starMultiplier = 1;
    
    this.policeCars = [];
    this.policeSpawnRate = 1000; // Much faster initial spawn rate (was 3000)
    this.policeBurstCooldown = 0; // Cooldown between police bursts
    this.isPoliceBurstActive = false; // Track if a burst is currently spawning
    
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
      this.player.setScale(3.9); // 30% bigger than 3x (was 3)
      this.player.setCollideWorldBounds(true);
      this.player.setDrag(this.carStats.handling * 100); // Apply handling as drag
      this.player.setMaxVelocity(this.carStats.maxSpeed);
      
      // Make sure player is visible and at correct depth
      this.player.setVisible(true);
      this.player.setDepth(10); // Above other vehicles
      this.player.setAlpha(1); // Fully opaque
      
      // Set collision body size
      this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.8);
      
      // Keep player car normal - no glow effects
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
      
      // CRITICAL FIX: Restore simple working collision system
      console.log('🧪 Restoring simple working collision system...');
      
      // Verify overlaps were created
      console.log('🧪 Physics overlaps created successfully');
      
      // CRITICAL TEST: Verify physics overlap is working
      console.log('🧪 Testing physics overlap system...');
      
      // Test if collectible collisions work
      this.time.delayedCall(1000, () => {
        if (this.player && this.collectibles) {
          const collectibles = this.collectibles.getChildren();
          if (collectibles.length > 0) {
            console.log(`🧪 Found ${collectibles.length} collectibles, testing collision system...`);
            // Move player close to a collectible to test collision
            const collectible = collectibles[0];
            const distance = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
              collectible.x, collectible.y
            );
            console.log(`🧪 Distance to collectible: ${distance.toFixed(1)}`);
            
            if (distance > 100) {
              console.log(`🧪 Moving player close to collectible to test collision...`);
              this.player.x = collectible.x + 30;
              this.player.y = collectible.y;
            }
          }
        }
      });
      
      // Test if enemy collisions work
      this.time.delayedCall(2000, () => {
        if (this.player && this.enemies) {
          const enemies = this.enemies.getChildren();
          if (enemies.length > 0) {
            console.log(`🧪 Found ${enemies.length} enemies, testing collision system...`);
            
            // Simple test - just log enemy info
            const enemy = enemies[0];
            console.log(`🧪 First enemy: ${enemy.texture?.key}, vehicleType:`, enemy.vehicleType);
            console.log(`🧪 Enemy position: ${enemy.x}, ${enemy.y}`);
            console.log(`🧪 Player position: ${this.player.x}, ${this.player.y}`);
          }
        }
      });
      
      // Debug: Verify overlaps were created
      console.log('🎮 Physics overlaps created successfully');
      console.log('🎮 Player physics body:', this.player.body);
      console.log('🎮 Enemies group size:', this.enemies.children.size);
      console.log('🎮 Player position:', this.player.x, this.player.y);
      console.log('🎮 Player body size:', this.player.body.width, this.player.body.height);
      
      // CRITICAL: Test if collision detection is working at all
      console.log('🧪 Testing collision detection system...');
      
      // Test collision by logging when any enemy is added to the group
      this.enemies.on('add', (enemy) => {
        console.log(`🎮 Enemy added to group: ${enemy.texture?.key}, vehicleType:`, enemy.vehicleType);
        console.log(`🎮 Enemy position: ${enemy.x}, ${enemy.y}, body size: ${enemy.body?.width} x ${enemy.body?.height}`);
        
        // Test collision detection immediately
        this.time.delayedCall(100, () => {
          if (this.player && enemy.active) {
            const distance = Phaser.Math.Distance.Between(
              this.player.x, this.player.y,
              enemy.x, enemy.y
            );
            console.log(`🧪 Distance to enemy: ${distance.toFixed(1)}`);
            
            if (distance < 100) {
              console.log(`🧪 Moving player close to enemy to test collision...`);
              this.player.x = enemy.x + 30;
              this.player.y = enemy.y;
            }
          }
        });
      });
      
      // NOW start spawning after collisions are set up
      console.log('🎮 Starting spawning system...');
      this.startSpawning();
      
    } else {
      console.error('🎮 Cannot set up collisions - missing objects:', {
        player: !!this.player,
        enemies: !!this.enemies,
        collectibles: !!this.collectibles,
        obstacles: !!this.obstacles
      });
    }
  }
  
  // Get car display name from sprite key
  getCarDisplayName(spriteKey) {
    const carNames = {
      'van': 'Van',
      'sports_convertible': 'Sports Convertible',
      'vintage': 'Vintage',
      'sedan_vintage': 'Sedan Vintage',
      'formula': 'Formula'
    };
    return carNames[spriteKey] || spriteKey;
  }
  
  // Get car glow color based on car type
  getCarGlowColor(carSprite) {
    switch (carSprite) {
      case 'van':
        return 0x666666; // Subtle gray glow
      case 'sports_convertible':
        return 0xff6600; // Orange sports glow
      case 'vintage':
        return 0x8B4513; // Brown vintage glow
      case 'sedan_vintage':
        return 0x4169E1; // Blue sedan glow
      case 'formula':
        return 0xff0000; // Bright red racing glow
      default:
        return 0xffffff; // Subtle white glow
    }
  }
  
  // Calculate burst cooldown based on stars
  getBurstCooldown() {
    switch (this.stars) {
      case 0:
        return 0; // No cooldown needed
      case 1:
        return Phaser.Math.Between(800, 1500); // 0.8-1.5 seconds (was 2.5-4)
      case 2:
        return Phaser.Math.Between(600, 1200); // 0.6-1.2 seconds (was 2-3)
      case 3:
        return Phaser.Math.Between(400, 1000); // 0.4-1.0 seconds (was 1.5-2.5)
      case 4:
        return Phaser.Math.Between(300, 800); // 0.3-0.8 seconds (was 1-2)
      case 5:
        return Phaser.Math.Between(200, 600); // 0.2-0.6 seconds (was 0.8-1.5)
      default:
        return 800; // Default much shorter cooldown
    }
  }
  
  // Update police spawn rate based on wanted level
  updatePoliceSpawnRate() {
    if (!this.policeTimer) return;
    
    let newDelay;
    switch (this.stars) {
      case 0:
        newDelay = Phaser.Math.Between(3000, 5000); // 3-5 seconds (was 8-12)
        break;
      case 1:
        newDelay = Phaser.Math.Between(1500, 2500); // 1.5-2.5 seconds (was 4-6)
        break;
      case 2:
        newDelay = Phaser.Math.Between(1000, 2000); // 1-2 seconds (was 3-4)
        break;
      case 3:
        newDelay = Phaser.Math.Between(800, 1500); // 0.8-1.5 seconds (was 2-3)
        break;
      case 4:
        newDelay = Phaser.Math.Between(600, 1200); // 0.6-1.2 seconds (was 1.5-2.5)
        break;
      case 5:
        newDelay = Phaser.Math.Between(400, 800); // 0.4-0.8 seconds (was 1-2)
        break;
      default:
        newDelay = 2000;
    }
    
    this.policeTimer.delay = newDelay;
    this.policeTimer.reset({ delay: newDelay, callback: this.spawnPolice, callbackScope: this, loop: true });
    console.log(`🚔 Police spawn rate updated: ${this.stars} stars = ${newDelay}ms delay`);
  }
  
  // Calculate star-based multiplier
  calculateStarMultiplier() {
    switch (this.stars) {
      case 0:
        this.starMultiplier = 1;
        break;
      case 1:
        this.starMultiplier = 1;
        break;
      case 2:
        this.starMultiplier = 1.5;
        break;
      case 3:
        this.starMultiplier = 2;
        break;
      case 4:
        this.starMultiplier = 3;
        break;
      case 5:
        this.starMultiplier = 5;
        break;
      default:
        this.starMultiplier = 1;
    }
    
    // Update UI display
    if (this.starMultiplierText) {
      this.starMultiplierText.setText(`STAR: x${this.starMultiplier}`);
    }
    
    console.log(`⭐ Star multiplier updated: ${this.stars} stars = ${this.starMultiplier}x`);
    return this.starMultiplier;
  }
  
  // Keep player within game boundaries
  keepPlayerInBounds() {
    if (!this.player || !this.player.body) return;
    
    const playerX = this.player.x;
    const playerY = this.player.y;
    const playerWidth = this.player.width * this.player.scaleX;
    const playerHeight = this.player.height * this.player.scaleY;
    
    // Calculate boundaries (accounting for player size)
    const minX = playerWidth / 2;
    const maxX = this.cameras.main.width - playerWidth / 2;
    const minY = playerHeight / 2;
    const maxY = this.cameras.main.height - playerHeight / 2;
    
    // Clamp position to boundaries
    const clampedX = Phaser.Math.Clamp(playerX, minX, maxX);
    const clampedY = Phaser.Math.Clamp(playerY, minY, maxY);
    
    // Update position if needed
    if (clampedX !== playerX || clampedY !== playerY) {
      this.player.setPosition(clampedX, clampedY);
      
      // Stop velocity in the direction that was clamped
      if (clampedX !== playerX) {
        this.player.body.setVelocityX(0);
      }
      if (clampedY !== playerY) {
        this.player.body.setVelocityY(0);
      }
    }
  }
  
  // Create explosion particle effect
  createExplosionEffect(x, y) {
    if (!this.particles) {
      console.log('⚠️ Particles system not available');
      return;
    }
    
    try {
      console.log(`💥 Creating explosion at (${x}, ${y})`);
      
      // Create explosion particles
      const explosion = this.particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 20,
        blendMode: 'ADD',
        tint: [0xff0000, 0xff6600, 0xffff00, 0xffffff] // Red, orange, yellow, white
      });
      
      // Create smoke particles
      const smoke = this.particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 30, max: 100 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1500,
        quantity: 12,
        blendMode: 'MULTIPLY',
        tint: [0x666666, 0x888888, 0xaaaaaa] // Gray smoke
      });
      
      // Create spark particles
      const sparks = this.particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 100, max: 300 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        quantity: 15,
        blendMode: 'ADD',
        tint: [0xffff00, 0xffff88, 0xffffff] // Yellow sparks
      });
      
      console.log(`💥 Explosion emitters created:`, { explosion: !!explosion, smoke: !!smoke, sparks: !!sparks });
      
      // Auto-destroy emitters after they finish
      this.time.delayedCall(1500, () => {
        if (explosion) explosion.destroy();
        if (smoke) smoke.destroy();
        if (sparks) sparks.destroy();
        console.log('💥 Explosion emitters destroyed');
      });
      
      console.log(`💥 Explosion effect created successfully at (${x}, ${y})`);
    } catch (error) {
      console.log(`⚠️ Error creating explosion effect:`, error);
      console.error('Full error:', error);
    }
  }
  
  // Create tire smoke effect when braking
  createTireSmokeEffect(x, y) {
    if (!this.particles) {
      console.log('⚠️ Particles system not available for tire smoke');
      return;
    }
    
    try {
      console.log(`💨 Creating tire smoke at (${x}, ${y})`);
      
      const smoke = this.particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 20, max: 80 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 1200,
        quantity: 8,
        blendMode: 'MULTIPLY',
        tint: [0x444444, 0x666666, 0x888888], // Dark smoke
        frequency: 100 // Emit every 100ms
      });
      
      console.log(`💨 Tire smoke emitter created:`, !!smoke);
      
      // Auto-destroy after 2 seconds
      this.time.delayedCall(2000, () => {
        if (smoke) smoke.destroy();
        console.log('💨 Tire smoke emitter destroyed');
      });
    } catch (error) {
      console.log(`⚠️ Error creating tire smoke effect:`, error);
    }
  }
  
  // Create collectible sparkle effect
  createCollectibleSparkle(x, y, color) {
    if (!this.particles) {
      console.log('⚠️ Particles system not available for sparkles');
      return;
    }
    
    try {
      console.log(`✨ Creating sparkle effect at (${x}, ${y}) with color: ${color.toString(16)}`);
      
      const sparkles = this.particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 30, max: 100 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 12,
        blendMode: 'ADD',
        tint: [color, 0xffffff], // Item color + white
        frequency: 50 // Emit every 50ms
      });
      
      console.log(`✨ Sparkle emitter created:`, !!sparkles);
      
      // Auto-destroy after 1 second
      this.time.delayedCall(1000, () => {
        if (sparkles) sparkles.destroy();
        console.log('✨ Sparkle emitter destroyed');
      });
    } catch (error) {
      console.log(`⚠️ Error creating sparkle effect:`, error);
    }
  }
  
  // Get potion glow color based on potion type
  getPotionGlowColor(potionSprite) {
    switch (potionSprite) {
      case 'blood':
        return 0xff0000; // 🩸 Gooner Blood - Red glow
      case 'water':
        return 0x00ffff; // 💧 Water - Cyan glow
      case 'yellow':
        return 0xffff00; // 🟡 Golden Shower - Yellow glow
      case 'goon':
        return 0x800080; // 🟣 Goon Liquid - Purple glow
      case 'poop':
        return 0x8B4513; // 💩 Poop - Brown glow
      case 'puke':
        return 0x90EE90; // 🤮 Puke - Light green glow
      default:
        return 0xffffff; // Default white glow
    }
  }
  
  // Fallback glow effect using Phaser's built-in glow
  addFallbackGlow(gameObject, carSprite) {
    try {
      console.log('🔄 Using fallback glow effect for:', carSprite);
      
      // Create a glow effect using a tint and alpha
      const glowColor = this.getCarGlowColor(carSprite);
      
      // Set a subtle tint to simulate glow
      gameObject.setTint(glowColor);
      gameObject.setAlpha(0.9); // Slightly transparent for glow effect
      
      // Add a subtle scale effect
      gameObject.setScale(gameObject.scale * 1.05);
      
      console.log(`✨ Added fallback glow effect to ${carSprite}`);
    } catch (error) {
      console.log(`⚠️ Error applying fallback glow:`, error);
    }
  }
  
  // Fallback glow effect for potions
  addFallbackPotionGlow(gameObject, potionSprite) {
    try {
      console.log('🔄 Using bright potion glow for:', potionSprite);
      
      const glowColor = this.getPotionGlowColor(potionSprite);
      
      // Set bright tint for glow effect (no dimming)
      gameObject.setTint(glowColor);
      gameObject.setAlpha(1.0); // Fully opaque - no dimming
      
      // Add a more noticeable scale effect for glow
      gameObject.setScale(gameObject.scale * 1.2);
      
      // Add a subtle brightness effect by setting blend mode
      gameObject.setBlendMode('ADD');
      
      console.log(`✨ Added bright potion glow to ${potionSprite}`);
    } catch (error) {
      console.log(`⚠️ Error applying bright potion glow:`, error);
    }
  }
  
  // Fallback glow effect for police cars
  addFallbackPoliceGlow(gameObject) {
    try {
      console.log('🔄 Using fallback police glow');
      
      // Set bright blue tint to simulate glow
      gameObject.setTint(0x0000ff);
      gameObject.setAlpha(0.85); // Slightly transparent for glow effect
      
      // Add a subtle scale effect
      gameObject.setScale(gameObject.scale * 1.08);
      
      console.log(`✨ Added fallback police glow effect`);
    } catch (error) {
      console.log(`⚠️ Error applying fallback police glow:`, error);
    }
  }
  
  // Clean up method to stop all music
  cleanup() {
    console.log('🧹 Cleaning up MainScene music...');
    
    // Stop and destroy main music
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }
    
    // Clear global music instance if it's this scene's music
    if (globalMusicInstance === this.music) {
      globalMusicInstance = null;
    }
    
    // Stop and destroy car ambience
    if (this.carAmbience) {
      this.carAmbience.stop();
      this.carAmbience.destroy();
      this.carAmbience = null;
    }
    
    // Stop all other sounds in the scene
    this.sound.getAllPlaying().forEach(sound => {
      sound.stop();
      sound.destroy();
    });
    
    console.log('✅ MainScene music cleanup completed');
  }
  
  // Override scene shutdown to ensure cleanup
  shutdown() {
    console.log('🔄 MainScene shutting down...');
    this.cleanup();
    super.shutdown();
  }

  // Auto-enter fullscreen for mobile devices
  autoEnterFullscreen() {
    if (!this.isMobile) return;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }
        console.log('📱 Entering fullscreen mode');
      }
    } catch (error) {
      console.warn('📱 Auto-fullscreen not supported or blocked:', error);
    }
  }

  // Auto-rotate to landscape orientation for mobile devices
  autoRotateToLandscape() {
    if (!this.isMobile) return;
    
    try {
      // Check if Screen Orientation API is available
      if (screen.orientation && screen.orientation.lock) {
        // Try to lock to landscape
        screen.orientation.lock('landscape').then(() => {
          console.log('📱 Screen locked to landscape orientation');
        }).catch((error) => {
          console.log('📱 Could not lock orientation, but will request landscape:', error);
          // Fallback: request landscape without locking
          if (screen.orientation && screen.orientation.orientation) {
            if (screen.orientation.orientation.includes('portrait')) {
              console.log('📱 Requesting landscape orientation (fallback)');
            }
          }
        });
      } else if (screen.orientation && screen.orientation.orientation) {
        // Fallback for older devices
        if (screen.orientation.orientation.includes('portrait')) {
          console.log('📱 Requesting landscape orientation (legacy fallback)');
        }
      }
      
      // Also try to request fullscreen for better landscape experience
      if (!this.isFullscreen()) {
        this.autoEnterFullscreen();
      }
    } catch (error) {
      console.warn('📱 Auto-rotation not supported or blocked:', error);
    }
  }
}