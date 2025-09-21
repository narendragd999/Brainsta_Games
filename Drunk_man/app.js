class DrunkWalker3D {
    constructor() {
        this.gameState = 'start'; // start, playing, gameOver
        this.score = 0;
        this.bestScore = this.getBestScore();
        this.balance = 0; // -1 to 1, negative = left, positive = right
        this.wobbleIntensity = 0.4;
        this.wobbleDirection = 1;
        this.walkSpeed = 3;
        this.obstacleFrequency = 2500;
        this.lastObstacleTime = 0;
        this.obstacles = [];
        this.gameStartTime = 0;
        this.animationId = null;
        this.lastUpdateTime = 0;
        
        // 3D specific properties
        this.cameraPosition = 0;
        this.roadOffset = 0;
        this.environmentSpeed = 1;
        
        // Game messages in Hindi
        this.gameOverMessages = [
            "फिर से कोशिश करो! 😅",
            "बहुत पी गए लगते हो! 🍺", 
            "अभ्यास की जरूरत है! 💪",
            "अरे यार, गिर गए! 😵",
            "होशियारी से चलो! 🧠",
            "संतुलन बिगड़ गया! ⚖️",
            "दोबारा प्रैक्टिस करो! 🎯"
        ];
        
        this.soundEffects = [
            "ओह नो! 😱", "अरे बाप रे! 😵", "बचाओ! 🆘", "ओ हो हो! 😵‍💫",
            "उफ्फ! 💫", "अरे यार! 😅", "धीरे चलो! 🚶", "सावधान! ⚠️"
        ];
        
        // Wait for DOM to be fully loaded before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeGame());
        } else {
            this.initializeGame();
        }
    }
    
    getBestScore() {
        try {
            return parseInt(sessionStorage.getItem('drunkWalker3DBestScore') || '0');
        } catch (e) {
            return 0;
        }
    }
    
    setBestScore(score) {
        try {
            sessionStorage.setItem('drunkWalker3DBestScore', score.toString());
        } catch (e) {
            console.log('Cannot save score');
        }
    }
    
    initializeGame() {
        console.log('Initializing 3D Drunk Walker Game...');
        
        // Get DOM elements with error checking
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.drunkMan = document.getElementById('drunkMan3D');
        this.obstaclesContainer = document.getElementById('obstaclesContainer3D');
        this.leftTouchZone = document.getElementById('leftTouchZone');
        this.rightTouchZone = document.getElementById('rightTouchZone');
        this.currentScoreEl = document.getElementById('currentScore');
        this.bestScoreEl = document.getElementById('bestScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalBestScoreEl = document.getElementById('finalBestScore');
        this.gameOverMessageEl = document.getElementById('gameOverMessage');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.instructionsIcon = document.getElementById('instructionsIcon');
        this.instructionsPopup = document.getElementById('instructionsPopup');
        this.closeInstructionsBtn = document.getElementById('closeInstructions');
        this.particleContainer = document.getElementById('particleContainer');
        this.soundIndicator = document.getElementById('soundIndicator');
        
        // Debug: Check if elements exist
        console.log('Start button found:', !!this.startButton);
        console.log('Instructions icon found:', !!this.instructionsIcon);
        console.log('Game screen found:', !!this.gameScreen);
        
        // Update best score display
        if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
        if (this.finalBestScoreEl) this.finalBestScoreEl.textContent = this.bestScore;
        
        this.setupEventListeners();
        this.startEnvironmentAnimation();
        this.startPreviewAnimation();
        
        console.log('3D Drunk Walker Game initialized successfully');
    }
    
    startPreviewAnimation() {
        // Make sure preview character wobbles on start screen
        const previewCharacter = document.querySelector('.character-preview .drunk-man-3d');
        if (previewCharacter) {
            previewCharacter.style.animation = 'previewWobble3D 3s ease-in-out infinite';
            console.log('Preview animation started');
        }
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Start button with multiple event types
        if (this.startButton) {
            const startGameHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start button clicked!');
                this.startGame();
            };
            
            this.startButton.addEventListener('click', startGameHandler);
            this.startButton.addEventListener('touchstart', startGameHandler);
            this.startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Make button visually clickable
            this.startButton.style.cursor = 'pointer';
            this.startButton.style.userSelect = 'none';
            
            console.log('Start button listeners added');
        } else {
            console.error('Start button not found!');
        }
        
        // Restart button
        if (this.restartButton) {
            const restartHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restartGame();
            };
            
            this.restartButton.addEventListener('click', restartHandler);
            this.restartButton.addEventListener('touchstart', restartHandler);
        }
        
        // Instructions with multiple event types
        if (this.instructionsIcon) {
            const instructionsHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Instructions icon clicked!');
                this.showInstructions();
            };
            
            this.instructionsIcon.addEventListener('click', instructionsHandler);
            this.instructionsIcon.addEventListener('touchstart', instructionsHandler);
            this.instructionsIcon.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Make icon visually clickable
            this.instructionsIcon.style.cursor = 'pointer';
            this.instructionsIcon.style.userSelect = 'none';
            
            console.log('Instructions icon listeners added');
        } else {
            console.error('Instructions icon not found!');
        }
        
        if (this.closeInstructionsBtn) {
            const closeHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideInstructions();
            };
            
            this.closeInstructionsBtn.addEventListener('click', closeHandler);
            this.closeInstructionsBtn.addEventListener('touchstart', closeHandler);
        }
        
        if (this.instructionsPopup) {
            this.instructionsPopup.addEventListener('click', (e) => {
                if (e.target === this.instructionsPopup) {
                    this.hideInstructions();
                }
            });
        }
        
        this.setupTouchControls();
        
        // Add global click handler for debugging
        document.addEventListener('click', (e) => {
            console.log('Global click detected on:', e.target);
        });
    }
    
    setupTouchControls() {
        // Touch controls for game screen
        if (this.leftTouchZone) {
            const leftHandlers = {
                start: (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        this.handleLeftTouch(e);
                    }
                },
                end: (e) => {
                    e.preventDefault();
                    this.handleTouchEnd('left');
                }
            };
            
            this.leftTouchZone.addEventListener('touchstart', leftHandlers.start);
            this.leftTouchZone.addEventListener('mousedown', leftHandlers.start);
            this.leftTouchZone.addEventListener('touchend', leftHandlers.end);
            this.leftTouchZone.addEventListener('mouseup', leftHandlers.end);
        }
        
        if (this.rightTouchZone) {
            const rightHandlers = {
                start: (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        this.handleRightTouch(e);
                    }
                },
                end: (e) => {
                    e.preventDefault();
                    this.handleTouchEnd('right');
                }
            };
            
            this.rightTouchZone.addEventListener('touchstart', rightHandlers.start);
            this.rightTouchZone.addEventListener('mousedown', rightHandlers.start);
            this.rightTouchZone.addEventListener('touchend', rightHandlers.end);
            this.rightTouchZone.addEventListener('mouseup', rightHandlers.end);
        }
    }
    
    showInstructions() {
        console.log('Showing instructions...');
        if (this.instructionsPopup) {
            this.instructionsPopup.classList.remove('hidden');
            this.playSound('instructions', 'निर्देश खुले! 📖');
        }
    }
    
    hideInstructions() {
        console.log('Hiding instructions...');
        if (this.instructionsPopup) {
            this.instructionsPopup.classList.add('hidden');
        }
    }
    
    startEnvironmentAnimation() {
        // Start background animations even before game starts
        this.animateEnvironment();
    }
    
    animateEnvironment() {
        if (this.gameState === 'playing') {
            this.roadOffset += this.environmentSpeed;
        }
        
        // Continue environment animation
        requestAnimationFrame(() => this.animateEnvironment());
    }
    
    startGame() {
        console.log('Starting 3D game...');
        this.gameState = 'playing';
        this.score = 0;
        this.balance = 0;
        this.wobbleIntensity = 0.4;
        this.walkSpeed = 3;
        this.obstacleFrequency = 2500;
        this.obstacles = [];
        this.gameStartTime = Date.now();
        this.lastObstacleTime = this.gameStartTime;
        this.lastUpdateTime = this.gameStartTime;
        this.cameraPosition = 0;
        this.roadOffset = 0;
        this.environmentSpeed = 1;
        
        // Show game screen
        if (this.startScreen) this.startScreen.classList.add('hidden');
        if (this.gameScreen) this.gameScreen.classList.remove('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.instructionsPopup) this.instructionsPopup.classList.add('hidden');
        
        // Clear obstacles
        if (this.obstaclesContainer) this.obstaclesContainer.innerHTML = '';
        
        // Reset character position
        if (this.drunkMan) {
            this.drunkMan.className = 'drunk-man-3d';
            this.drunkMan.style.transform = 'translateX(-50%)';
        }
        
        // Start game loop
        this.gameLoop();
        
        // Play start sound
        this.playSound('start', 'चलो शुरू करते हैं! 🚀');
        this.createWalkingParticles();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.gameStartTime;
        const frameDeltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Update wobbling
        this.updateWobble(deltaTime, frameDeltaTime);
        
        // Update score based on time survived
        this.score = Math.floor(deltaTime / 50); // Faster scoring
        if (this.currentScoreEl) this.currentScoreEl.textContent = this.score;
        
        // Spawn obstacles
        if (currentTime - this.lastObstacleTime > this.obstacleFrequency) {
            this.spawnObstacle3D();
            this.lastObstacleTime = currentTime;
        }
        
        // Update obstacles
        this.updateObstacles3D();
        
        // Check collisions
        this.checkCollisions();
        
        // Check if character fell
        if (Math.abs(this.balance) > 1.5) {
            this.gameOver();
            return;
        }
        
        // Increase difficulty over time
        this.updateDifficulty(deltaTime);
        
        // Update 3D environment
        this.update3DEnvironment();
        
        // Create periodic walking effects
        if (Math.random() < 0.02) {
            this.createWalkingParticles();
        }
        
        // Continue game loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    updateWobble(deltaTime, frameDeltaTime) {
        // Natural wobbling increases over time
        const wobbleSpeed = 0.003 + (deltaTime * 0.000002);
        const wobbleIncrement = this.wobbleDirection * wobbleSpeed * this.wobbleIntensity * (frameDeltaTime / 16);
        this.balance += wobbleIncrement;
        
        // Change wobble direction randomly
        if (Math.random() < 0.025) {
            this.wobbleDirection *= -1;
            this.playSound('wobble', this.soundEffects[Math.floor(Math.random() * this.soundEffects.length)]);
        }
        
        // Update character visual
        this.updateCharacterVisual3D();
        
        // Play wobble sounds randomly
        if (Math.random() < 0.008) {
            const sounds = ['ओह!', 'अरे!', 'बचाओ!', 'ओ हो हो!', 'उफ्फ!'];
            const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
            this.playSound('wobble', randomSound);
        }
    }
    
    updateCharacterVisual3D() {
        if (!this.drunkMan) return;
        
        this.drunkMan.className = 'drunk-man-3d';
        
        if (this.balance < -0.4) {
            this.drunkMan.classList.add('wobble-left');
        } else if (this.balance > 0.4) {
            this.drunkMan.classList.add('wobble-right');
        }
        
        // Update character position and rotation based on balance
        const rotation = Math.max(-25, Math.min(25, this.balance * 15));
        const sidewaysMovement = Math.max(-30, Math.min(30, this.balance * 20));
        this.drunkMan.style.transform = `translateX(calc(-50% + ${sidewaysMovement}px)) rotateZ(${rotation}deg)`;
        
        // Change facial expression based on balance
        const eyes = this.drunkMan.querySelectorAll('.eye-3d');
        const mouth = this.drunkMan.querySelector('.mouth-3d');
        
        if (Math.abs(this.balance) > 0.8) {
            eyes.forEach(eye => {
                eye.style.transform = 'scale(1.5)';
                eye.style.background = '#ff0000';
            });
            if (mouth) {
                mouth.style.transform = 'translateX(-50%) scaleY(2) scaleX(1.5)';
                mouth.style.background = '#ff4444';
            }
        } else if (Math.abs(this.balance) > 0.5) {
            eyes.forEach(eye => {
                eye.style.transform = 'scale(1.2)';
                eye.style.background = '#ff8800';
            });
            if (mouth) {
                mouth.style.transform = 'translateX(-50%) scaleY(1.5)';
                mouth.style.background = '#666';
            }
        } else {
            eyes.forEach(eye => {
                eye.style.transform = 'scale(1)';
                eye.style.background = '#333';
            });
            if (mouth) {
                mouth.style.transform = 'translateX(-50%) scaleY(1)';
                mouth.style.background = '#333';
            }
        }
    }
    
    update3DEnvironment() {
        // Update camera/environment position for forward movement effect
        this.cameraPosition += this.environmentSpeed;
    }
    
    handleLeftTouch(e) {
        if (this.gameState !== 'playing') return;
        
        this.balance -= 0.4;
        if (this.leftTouchZone) this.leftTouchZone.classList.add('active');
        this.playSound('balance', 'बाएं! 👈');
        
        // Add visual feedback
        this.addTouchFeedback('left');
        this.createBalanceParticles('left');
    }
    
    handleRightTouch(e) {
        if (this.gameState !== 'playing') return;
        
        this.balance += 0.4;
        if (this.rightTouchZone) this.rightTouchZone.classList.add('active');
        this.playSound('balance', 'दाएं! 👉');
        
        // Add visual feedback
        this.addTouchFeedback('right');
        this.createBalanceParticles('right');
    }
    
    handleTouchEnd(side) {
        if (side === 'left' && this.leftTouchZone) {
            this.leftTouchZone.classList.remove('active');
        }
        if (side === 'right' && this.rightTouchZone) {
            this.rightTouchZone.classList.remove('active');
        }
    }
    
    addTouchFeedback(direction) {
        // Create sparkle effect
        const sparkle = document.createElement('div');
        sparkle.innerHTML = direction === 'left' ? '✨👈' : '✨👉';
        sparkle.style.cssText = `
            position: absolute;
            font-size: 2.5rem;
            pointer-events: none;
            z-index: 1000;
            top: 60%;
            ${direction === 'left' ? 'left: 20%;' : 'right: 20%;'}
            animation: sparkleEffect3D 1.2s ease-out forwards;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        
        document.body.appendChild(sparkle);
        
        // Add sparkle animation if not exists
        if (!document.querySelector('#sparkleStyle3D')) {
            const style = document.createElement('style');
            style.id = 'sparkleStyle3D';
            style.textContent = `
                @keyframes sparkleEffect3D {
                    0% { 
                        transform: scale(0) translateY(0) rotateZ(0deg); 
                        opacity: 1; 
                    }
                    50% { 
                        transform: scale(1.5) translateY(-30px) rotateZ(180deg); 
                        opacity: 0.9; 
                    }
                    100% { 
                        transform: scale(0) translateY(-60px) rotateZ(360deg); 
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => sparkle.remove(), 1200);
    }
    
    createBalanceParticles(direction) {
        if (!this.particleContainer) return;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.innerHTML = direction === 'left' ? '💫' : '⭐';
                particle.style.cssText = `
                    ${direction === 'left' ? 'left: 20%;' : 'right: 20%;'}
                    bottom: ${50 + Math.random() * 20}%;
                    animation-delay: ${Math.random() * 0.5}s;
                `;
                
                this.particleContainer.appendChild(particle);
                setTimeout(() => particle.remove(), 2000);
            }, i * 100);
        }
    }
    
    createWalkingParticles() {
        if (!this.particleContainer) return;
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.innerHTML = '💨';
        particle.style.cssText = `
            left: 50%;
            bottom: 30%;
            transform: translateX(-50%);
            font-size: 1rem;
        `;
        
        this.particleContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }
    
    spawnObstacle3D() {
        if (!this.obstaclesContainer) return;
        
        const obstacleTypes = [
            { type: 'banana', emoji: '🍌', name: 'केले का छिलका', effect: 0.6 },
            { type: 'hole', emoji: '🕳️', name: 'गड्ढा', effect: 0.5 },
            { type: 'pole', emoji: '🚧', name: 'खंभा', effect: 0.8 },
            { type: 'dog', emoji: '🐕', name: 'कुत्ता', effect: 0.3 },
            { type: 'trash', emoji: '🗑️', name: 'कूड़ादान', effect: 0.4 },
            { type: 'cone', emoji: '🦺', name: 'ट्रैफिक कोन', effect: 0.4 },
            { type: 'puddle', emoji: '💧', name: 'पानी का गड्ढा', effect: 0.3 }
        ];
        
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle-3d ${randomType.type}`;
        obstacle.innerHTML = randomType.emoji;
        
        // Random position (left, center, right)
        const positions = ['30%', '50%', '70%'];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        
        obstacle.style.cssText = `
            left: ${randomPosition};
            transform: translateX(-50%);
            font-size: 2rem;
        `;
        
        this.obstaclesContainer.appendChild(obstacle);
        this.obstacles.push({
            element: obstacle,
            type: randomType.type,
            name: randomType.name,
            effect: randomType.effect,
            position: randomPosition,
            startTime: Date.now()
        });
        
        this.playSound('obstacle_appear', `सावधान! ${randomType.name} आ रहा है! ⚠️`);
    }
    
    updateObstacles3D() {
        this.obstacles = this.obstacles.filter(obstacle => {
            const currentTime = Date.now();
            const elapsed = (currentTime - obstacle.startTime) / 1000; // seconds
            
            // Check if obstacle animation is complete (4 seconds)
            if (elapsed > 4) {
                obstacle.element.remove();
                this.score += 100; // Bonus for avoiding obstacle
                this.playSound('obstacle_avoided', 'बच गए! वाह! 🎉');
                return false;
            }
            return true;
        });
    }
    
    checkCollisions() {
        const currentTime = Date.now();
        
        this.obstacles.forEach((obstacle, index) => {
            const elapsed = (currentTime - obstacle.startTime) / 1000;
            
            // Check collision during middle part of obstacle approach (1.5-2.5 seconds)
            if (elapsed > 1.5 && elapsed < 2.5) {
                // Get character position
                const characterPosition = 50 + (this.balance * 20); // 30-70% range
                const obstaclePosition = parseInt(obstacle.position);
                
                // Check if positions overlap (within 15% range)
                if (Math.abs(characterPosition - obstaclePosition) < 15) {
                    this.handleObstacleCollision(obstacle, index);
                }
            }
        });
    }
    
    handleObstacleCollision(obstacle, index) {
        // Apply effect based on obstacle type
        const balanceEffect = Math.random() > 0.5 ? obstacle.effect : -obstacle.effect;
        this.balance += balanceEffect;
        
        this.playSound('collision', `धड़ाम! ${obstacle.name} से टकराए! 💥`);
        
        // Add visual effect
        obstacle.element.style.animation = 'none';
        obstacle.element.style.transform += ' scale(1.8) rotate(720deg)';
        obstacle.element.style.filter = 'brightness(1.5)';
        obstacle.element.style.textShadow = '0 0 20px #ff0000';
        
        // Create collision particles
        this.createCollisionParticles(obstacle.position);
        
        // Remove obstacle after collision
        setTimeout(() => {
            if (obstacle.element.parentNode) {
                obstacle.element.remove();
            }
        }, 800);
        
        // Remove from obstacles array
        this.obstacles.splice(index, 1);
        
        // Add screen shake effect
        this.addScreenShake();
    }
    
    createCollisionParticles(position) {
        if (!this.particleContainer) return;
        
        const particles = ['💥', '⚡', '💢', '✨', '💫'];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
                particle.style.cssText = `
                    left: ${position};
                    bottom: ${40 + Math.random() * 20}%;
                    transform: translateX(-50%);
                    font-size: 2rem;
                    animation-duration: 1.5s;
                `;
                
                this.particleContainer.appendChild(particle);
                setTimeout(() => particle.remove(), 1500);
            }, i * 50);
        }
    }
    
    addScreenShake() {
        document.body.style.animation = 'screenShake 0.5s ease-in-out';
        
        if (!document.querySelector('#shakeStyle')) {
            const style = document.createElement('style');
            style.id = 'shakeStyle';
            style.textContent = `
                @keyframes screenShake {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    10% { transform: translateX(-2px) translateY(-1px); }
                    20% { transform: translateX(2px) translateY(1px); }
                    30% { transform: translateX(-1px) translateY(-2px); }
                    40% { transform: translateX(1px) translateY(2px); }
                    50% { transform: translateX(-2px) translateY(1px); }
                    60% { transform: translateX(2px) translateY(-1px); }
                    70% { transform: translateX(-1px) translateY(2px); }
                    80% { transform: translateX(1px) translateY(-2px); }
                    90% { transform: translateX(-1px) translateY(1px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }
    
    updateDifficulty(deltaTime) {
        const seconds = deltaTime / 1000;
        
        // Increase wobble intensity
        this.wobbleIntensity = Math.min(0.4 + (seconds * 0.015), 1.2);
        
        // Increase walk speed (environment speed)
        this.walkSpeed = Math.min(3 + (seconds * 0.08), 8);
        this.environmentSpeed = Math.min(1 + (seconds * 0.02), 3);
        
        // Decrease obstacle frequency (spawn more often)
        this.obstacleFrequency = Math.max(2500 - (seconds * 40), 800);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Add falling animation
        if (this.drunkMan) this.drunkMan.classList.add('falling');
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.setBestScore(this.bestScore);
            this.playSound('new_record', 'नया रिकॉर्ड! शाबाश! 🏆');
            this.createCelebrationParticles();
        }
        
        // Show game over screen after fall animation
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500);
        
        this.playSound('game_over', 'धड़ाम! गिर गए! खेल खत्म! 😵');
    }
    
    createCelebrationParticles() {
        if (!this.particleContainer) return;
        
        const celebrationEmojis = ['🎉', '🎊', '🏆', '⭐', '💫', '✨', '🌟'];
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.innerHTML = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
                particle.style.cssText = `
                    left: ${20 + Math.random() * 60}%;
                    bottom: ${30 + Math.random() * 40}%;
                    font-size: ${1.5 + Math.random()}rem;
                    animation-duration: ${2 + Math.random()}s;
                `;
                
                this.particleContainer.appendChild(particle);
                setTimeout(() => particle.remove(), 3000);
            }, i * 100);
        }
    }
    
    showGameOverScreen() {
        if (this.gameScreen) this.gameScreen.classList.add('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
        
        // Update scores
        if (this.finalScoreEl) this.finalScoreEl.textContent = this.score;
        if (this.finalBestScoreEl) this.finalBestScoreEl.textContent = this.bestScore;
        if (this.bestScoreEl) this.bestScoreEl.textContent = this.bestScore;
        
        // Show random game over message
        const randomMessage = this.gameOverMessages[
            Math.floor(Math.random() * this.gameOverMessages.length)
        ];
        if (this.gameOverMessageEl) this.gameOverMessageEl.textContent = randomMessage;
    }
    
    restartGame() {
        this.startGame();
    }
    
    playSound(type, description) {
        // Since we can't implement actual audio, we'll show visual indicators
        this.showSoundIndicator(description);
        console.log(`🔊 3D Sound: ${type} - ${description}`);
    }
    
    showSoundIndicator(text) {
        if (!this.soundIndicator) return;
        
        this.soundIndicator.textContent = text;
        this.soundIndicator.classList.remove('hidden');
        
        // Auto-hide after animation
        setTimeout(() => {
            if (this.soundIndicator) {
                this.soundIndicator.classList.add('hidden');
            }
        }, 2500);
    }
}

// Initialize game when everything is ready
window.drunkWalker3D = new DrunkWalker3D();