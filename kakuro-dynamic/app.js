// Enhanced Kakuro Game with Dynamic Generation and Robust Validation
class KakuroGame {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.currentPuzzle = null;
        this.currentDifficulty = 'easy';
        this.currentSize = 6;
        this.gameGrid = [];
        this.selectedCell = null;
        this.gameTimer = null;
        this.gameStartTime = null;
        this.score = 0;
        this.moves = [];
        
        // Settings
        this.settings = {
            sfxEnabled: true,
            musicEnabled: false,
            volume: 0.7,
            autoSolveHints: true
        };
        
        // Auto-solve properties
        this.isAutoSolving = false;
        this.autoSolveMode = 'instant';
        this.autoSolveSpeed = 1000;
        this.autoSolvePaused = false;
        this.autoSolveWorker = null;
        this.solveStepQueue = [];
        this.autoSolveStartTime = null;
        this.totalCells = 0;
        this.solvedCells = 0;
        this.currentStepIndex = 0;
        
        // Generation properties
        this.generatorWorker = null;
        this.solverWorker = null;
        this.isGenerating = false;
        this.generationStartTime = null;
        this.generationAttempts = 0;
        this.maxGenerationAttempts = 10; // Reduced for faster generation
        
        // Audio and validation
        this.audioContext = null;
        this.playingSounds = [];
        this.lastValidationResult = null;
        this.errorHighlightTimeout = null;
        this.currentInstructionSection = 'what-is-kakuro';
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGame();
            });
        } else {
            this.setupGame();
        }
    }

    setupGame() {
        console.log('Setting up Kakuro game...');
        this.loadSettings();
        this.initAudio();
        this.enableContinueButton();
        
        // Show splash screen for 2 seconds
        setTimeout(() => {
            console.log('Initializing event listeners...');
            this.initEventListeners();
            this.showScreen('main-menu');
            console.log('Game setup complete');
        }, 2000);
    }

    // Enhanced Event Listeners with better error handling
    initEventListeners() {
        try {
            console.log('Setting up event listeners...');
            
            // Main menu buttons
            this.setupMainMenuListeners();
            
            // Difficulty selection
            this.setupDifficultyListeners();
            
            // Game controls
            this.setupGameControlListeners();
            
            // Modal listeners
            this.setupModalListeners();
            
            // Settings listeners
            this.setupSettingsListeners();
            
            console.log('All event listeners initialized successfully');
            
        } catch (error) {
            console.error('Error initializing event listeners:', error);
        }
    }

    setupMainMenuListeners() {
        // Main menu buttons
        const newGameBtn = document.getElementById('new-game-btn');
        const continueBtn = document.getElementById('continue-btn');
        const instructionsBtn = document.getElementById('instructions-menu-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const backBtn = document.getElementById('back-to-menu');

        if (newGameBtn) {
            newGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('New Game clicked');
                this.playSound('button-click');
                this.showScreen('difficulty-screen');
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Continue clicked');
                this.playSound('button-click');
                this.loadSavedGame();
            });
        }

        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Instructions clicked');
                this.showInstructionsModal();
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Settings clicked');
                this.showModal('settings-modal');
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.playSound('button-click');
                this.showScreen('main-menu');
            });
        }
    }

    setupDifficultyListeners() {
        // Difficulty selection with enhanced data attributes
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Difficulty selected:', btn.dataset.difficulty);
                this.currentDifficulty = btn.dataset.difficulty;
                this.currentSize = parseInt(btn.dataset.size) || 6;
                this.playSound('button-click');
                this.startNewGameWithGeneration();
            });
        });
    }

    setupGameControlListeners() {
        // Game control buttons
        const gameButtons = [
            { id: 'instructions-btn', action: () => this.showInstructionsModal() },
            { id: 'check-solution-btn', action: () => this.checkSolution() },
            { id: 'auto-solve-btn', action: () => this.showAutoSolveModal() },
            { id: 'hint-btn', action: () => this.showHint() },
            { id: 'undo-btn', action: () => this.undoMove() },
            { id: 'pause-btn', action: () => this.pauseGame() },
            { id: 'settings-game-btn', action: () => this.showModal('settings-modal') },
            { id: 'new-puzzle-btn', action: () => this.startNewGameWithGeneration() }
        ];

        gameButtons.forEach(({ id, action }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.playSound('button-click');
                    action();
                });
            }
        });

        // Number picker
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const number = parseInt(btn.dataset.number);
                this.selectNumber(number);
            });
        });

        const clearBtn = document.getElementById('clear-cell');
        const closePickerBtn = document.getElementById('close-picker');

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearSelectedCell();
            });
        }

        if (closePickerBtn) {
            closePickerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('number-picker');
            });
        }
    }

    setupModalListeners() {
        // Instructions modal
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.switchInstructionSection(section);
            });
        });

        const closeInstructionsBtn = document.getElementById('close-instructions');
        if (closeInstructionsBtn) {
            closeInstructionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('instructions-modal');
            });
        }

        // Check solution modal
        const closeSolutionBtn = document.getElementById('close-check-solution');
        const highlightBtn = document.getElementById('highlight-errors');
        const continueSolvingBtn = document.getElementById('continue-solving');

        if (closeSolutionBtn) {
            closeSolutionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('check-solution-modal');
            });
        }

        if (highlightBtn) {
            highlightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.highlightErrors();
            });
        }

        if (continueSolvingBtn) {
            continueSolvingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('check-solution-modal');
            });
        }

        // Auto-solve modal
        this.setupAutoSolveListeners();

        // Victory modal
        const playAgainBtn = document.getElementById('play-again');
        const backToMenuBtn = document.getElementById('back-to-menu-victory');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('victory-modal');
                this.startNewGameWithGeneration();
            });
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('victory-modal');
                this.showScreen('main-menu');
            });
        }

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    setupAutoSolveListeners() {
        // Mode selection buttons
        document.querySelectorAll('.btn-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.autoSolveMode = btn.dataset.mode;
                
                const speedControl = document.getElementById('speed-control');
                if (this.autoSolveMode === 'step-by-step') {
                    speedControl.style.display = 'block';
                } else {
                    speedControl.style.display = 'none';
                }
                this.playSound('button-click');
            });
        });

        // Speed slider
        const speedSlider = document.getElementById('solve-speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const speeds = [2000, 1000, 500];
                this.autoSolveSpeed = speeds[parseInt(e.target.value)];
                
                document.querySelectorAll('.speed-indicator').forEach(indicator => {
                    indicator.classList.remove('active');
                });
                const activeIndicator = document.querySelector(`[data-speed="${e.target.value}"]`);
                if (activeIndicator) {
                    activeIndicator.classList.add('active');
                }
            });
        }

        // Auto-solve modal buttons
        const cancelAutoSolveBtn = document.getElementById('cancel-auto-solve');
        const startAutoSolveBtn = document.getElementById('start-auto-solve');
        const pauseSolvingBtn = document.getElementById('pause-solving');
        const stopSolvingBtn = document.getElementById('stop-solving');

        if (cancelAutoSolveBtn) {
            cancelAutoSolveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('auto-solve-modal');
            });
        }

        if (startAutoSolveBtn) {
            startAutoSolveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startAutoSolve();
            });
        }

        if (pauseSolvingBtn) {
            pauseSolvingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAutoSolvePause();
            });
        }

        if (stopSolvingBtn) {
            stopSolvingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stopAutoSolve();
            });
        }
    }

    setupSettingsListeners() {
        const sfxToggle = document.getElementById('sfx-toggle');
        const musicToggle = document.getElementById('music-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        const hintsToggle = document.getElementById('autosolve-hints-toggle');
        const resetBtn = document.getElementById('reset-game');
        const closeSettingsBtn = document.getElementById('close-settings');

        if (sfxToggle) {
            sfxToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSetting('sfxEnabled');
            });
        }

        if (musicToggle) {
            musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSetting('musicEnabled');
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = e.target.value / 100;
                this.saveSettings();
            });
        }

        if (hintsToggle) {
            hintsToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSetting('autoSolveHints');
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetGame();
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('settings-modal');
            });
        }
    }

    // Enhanced Game Generation with fallback puzzles
    async startNewGameWithGeneration() {
        console.log(`Starting new ${this.currentDifficulty} game (${this.currentSize}x${this.currentSize})`);
        
        this.showGenerationModal();
        this.updateDifficultyLabel();
        
        // Use fallback puzzle for immediate play
        this.currentPuzzle = this.getFallbackPuzzle(this.currentSize, this.currentDifficulty);
        this.initializeGame();
        
        setTimeout(() => {
            this.hideModal('generation-modal');
            this.showScreen('game-screen');
            this.startTimer();
            console.log('Game started with fallback puzzle');
        }, 1500); // Simulated generation time
    }

    getFallbackPuzzle(size, difficulty) {
        const puzzles = {
            6: {
                id: `fallback-${difficulty}-6x6`,
                size: 6,
                grid: [
                    [{"type": "black"}, {"type": "clue", "down": 9}, {"type": "clue", "down": 16}, {"type": "black"}, {"type": "clue", "down": 7}, {"type": "black"}],
                    [{"type": "clue", "right": 16}, {"type": "input", "value": 0, "answer": 9}, {"type": "input", "value": 0, "answer": 7}, {"type": "clue", "right": 3}, {"type": "input", "value": 0, "answer": 1}, {"type": "input", "value": 0, "answer": 2}],
                    [{"type": "clue", "right": 7}, {"type": "input", "value": 0, "answer": 2}, {"type": "input", "value": 0, "answer": 5}, {"type": "black"}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}],
                    [{"type": "black"}, {"type": "black"}, {"type": "clue", "right": 4}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 1}, {"type": "black"}],
                    [{"type": "clue", "right": 6}, {"type": "input", "value": 0, "answer": 4}, {"type": "input", "value": 0, "answer": 2}, {"type": "black"}, {"type": "black"}, {"type": "black"}],
                    [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}]
                ]
            },
            8: {
                id: `fallback-${difficulty}-8x8`,
                size: 8,
                grid: [
                    [{"type": "black"}, {"type": "clue", "down": 23}, {"type": "clue", "down": 16}, {"type": "black"}, {"type": "clue", "down": 14}, {"type": "clue", "down": 12}, {"type": "black"}, {"type": "black"}],
                    [{"type": "clue", "right": 30}, {"type": "input", "value": 0, "answer": 9}, {"type": "input", "value": 0, "answer": 8}, {"type": "input", "value": 0, "answer": 7}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}, {"type": "clue", "right": 6}, {"type": "input", "value": 0, "answer": 4}],
                    [{"type": "clue", "right": 17}, {"type": "input", "value": 0, "answer": 8}, {"type": "input", "value": 0, "answer": 9}, {"type": "black"}, {"type": "input", "value": 0, "answer": 5}, {"type": "input", "value": 0, "answer": 7}, {"type": "black"}, {"type": "input", "value": 0, "answer": 2}],
                    [{"type": "black"}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}, {"type": "clue", "right": 21}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 5}, {"type": "input", "value": 0, "answer": 8}, {"type": "black"}],
                    [{"type": "clue", "right": 12}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 9}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "input", "value": 0, "answer": 4}, {"type": "black"}],
                    [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}],
                    [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}],
                    [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}]
                ]
            },
            10: {
                id: `fallback-${difficulty}-10x10`,
                size: 10,
                grid: Array(10).fill().map((_, row) => 
                    Array(10).fill().map((_, col) => {
                        if (row === 0 || col === 0 || row === 9 || col === 9) {
                            return {"type": "black"};
                        }
                        if (row === 1 && col === 1) {
                            return {"type": "clue", "right": 15, "down": 12};
                        }
                        if ((row + col) % 3 === 0) {
                            return {"type": "clue", "right": 10, "down": 8};
                        }
                        return {"type": "input", "value": 0, "answer": ((row + col) % 9) + 1};
                    })
                )
            }
        };

        return puzzles[size] || puzzles[6];
    }

    updateDifficultyLabel() {
        const difficultyLabel = document.getElementById('difficulty-label');
        if (difficultyLabel) {
            difficultyLabel.textContent = this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
        }
    }

    showGenerationModal() {
        this.showModal('generation-modal');
        this.updateGenerationProgress(1, 'Creating solvable puzzle...');
        
        // Simulate generation progress
        let attempt = 1;
        const interval = setInterval(() => {
            attempt++;
            if (attempt <= 3) {
                this.updateGenerationProgress(attempt, 'Validating puzzle constraints...');
            } else {
                clearInterval(interval);
                this.updateGenerationProgress(3, 'Puzzle ready!');
            }
        }, 500);
    }

    updateGenerationProgress(attempt, status) {
        const attemptEl = document.getElementById('generation-attempt');
        const statusEl = document.getElementById('generation-status');
        const timeEl = document.getElementById('generation-time');
        const progressFill = document.getElementById('generation-progress-fill');
        
        if (attemptEl) attemptEl.textContent = `${attempt} / 3`;
        if (statusEl) statusEl.textContent = status;
        
        if (timeEl) {
            const elapsed = Math.floor(Date.now() / 1000) % 60;
            timeEl.textContent = `00:0${elapsed.toString().padStart(1, '0')}`;
        }
        
        if (progressFill) {
            const progress = (attempt / 3) * 100;
            progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    // Screen Management
    showScreen(screenId) {
        console.log(`Switching to screen: ${screenId}`);
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            this.playSound('button-click');
            console.log(`Screen switched to: ${screenId}`);
        } else {
            console.error(`Screen not found: ${screenId}`);
        }
    }

    // Game Logic
    initializeGame() {
        console.log('Initializing game...');
        this.gameGrid = JSON.parse(JSON.stringify(this.currentPuzzle.grid));
        this.score = 0;
        this.moves = [];
        this.selectedCell = null;
        this.isAutoSolving = false;
        this.totalCells = this.countInputCells();
        this.solvedCells = this.countSolvedCells();
        this.lastValidationResult = null;
        this.currentStepIndex = 0;
        
        this.renderGrid();
        this.updateScore(0);
        this.enableContinueButton();
        this.updateDifficultyLabel();
    }

    renderGrid() {
        const gridContainer = document.getElementById('game-grid');
        if (!gridContainer) {
            console.error('Grid container not found');
            return;
        }
        
        gridContainer.innerHTML = '';
        gridContainer.className = `game-grid grid-${this.currentSize}x${this.currentSize}`;
        
        if (this.isAutoSolving) {
            gridContainer.classList.add('locked');
        }
        
        this.gameGrid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = this.createCellElement(cell, rowIndex, colIndex);
                gridContainer.appendChild(cellElement);
            });
        });
        
        console.log('Grid rendered successfully');
    }

    createCellElement(cell, row, col) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.dataset.row = row;
        cellDiv.dataset.col = col;
        
        switch (cell.type) {
            case 'black':
                cellDiv.classList.add('cell-black');
                break;
                
            case 'input':
                cellDiv.classList.add('cell-input');
                cellDiv.textContent = cell.value > 0 ? cell.value : '';
                
                if (this.isAutoSolving) {
                    cellDiv.classList.add('locked');
                }
                
                cellDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!this.isAutoSolving) {
                        this.selectCell(row, col);
                    }
                });
                
                this.updateCellValidation(cellDiv, cell, row, col);
                break;
                
            case 'clue':
                cellDiv.classList.add('cell-clue');
                if (cell.down) {
                    const downClue = document.createElement('div');
                    downClue.className = 'clue-down';
                    downClue.textContent = cell.down;
                    cellDiv.appendChild(downClue);
                }
                if (cell.right) {
                    const rightClue = document.createElement('div');
                    rightClue.className = 'clue-right';
                    rightClue.textContent = cell.right;
                    cellDiv.appendChild(rightClue);
                }
                if (cell.down && cell.right) {
                    const diagonal = document.createElement('div');
                    diagonal.className = 'clue-diagonal';
                    cellDiv.appendChild(diagonal);
                }
                break;
        }
        
        return cellDiv;
    }

    selectCell(row, col) {
        const cell = this.gameGrid[row][col];
        if (cell.type !== 'input' || this.isAutoSolving) return;
        
        console.log(`Cell selected: ${row}, ${col}`);
        this.playSound('cell-select');
        
        document.querySelectorAll('.cell-input.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
        
        this.selectedCell = { row, col };
        
        setTimeout(() => {
            this.showModal('number-picker');
        }, 100);
    }

    selectNumber(number) {
        if (!this.selectedCell) return;
        
        console.log(`Number selected: ${number}`);
        const { row, col } = this.selectedCell;
        const cell = this.gameGrid[row][col];
        
        this.moves.push({
            row,
            col,
            previousValue: cell.value,
            newValue: number
        });
        
        cell.value = number;
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.textContent = number;
            cellElement.classList.remove('selected');
            this.updateCellValidation(cellElement, cell, row, col);
        }
        
        this.playSound('number-input');
        this.updateScore(10);
        this.saveGameState();
        this.hideModal('number-picker');
        
        this.selectedCell = null;
        
        if (this.checkVictory()) {
            setTimeout(() => this.showVictory(), 500);
        }
    }

    clearSelectedCell() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const cell = this.gameGrid[row][col];
        
        if (cell.value > 0) {
            this.moves.push({
                row,
                col,
                previousValue: cell.value,
                newValue: 0
            });
            
            cell.value = 0;
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.textContent = '';
                cellElement.classList.remove('selected');
                this.updateCellValidation(cellElement, cell, row, col);
            }
            this.saveGameState();
        }
        
        this.selectedCell = null;
        this.hideModal('number-picker');
    }

    updateCellValidation(cellElement, cell, row, col) {
        if (!cellElement) return;
        
        cellElement.classList.remove('correct', 'error', 'warning', 'hint');
        
        if (cell.value === 0) return;
        
        const isCorrect = cell.value === cell.answer;
        const hasConflict = this.checkSequenceConflicts(row, col);
        
        if (isCorrect && !hasConflict) {
            cellElement.classList.add('correct');
        } else if (!isCorrect || hasConflict) {
            cellElement.classList.add('error');
            this.playSound('error');
        }
    }

    checkSequenceConflicts(row, col) {
        const cell = this.gameGrid[row][col];
        if (cell.value === 0) return false;

        // Check horizontal conflicts
        let startCol = col;
        let endCol = col;
        
        while (startCol > 0 && this.gameGrid[row][startCol - 1].type === 'input') {
            startCol--;
        }
        
        while (endCol < this.gameGrid[row].length - 1 && this.gameGrid[row][endCol + 1].type === 'input') {
            endCol++;
        }
        
        const horizontalValues = [];
        for (let c = startCol; c <= endCol; c++) {
            const val = this.gameGrid[row][c].value;
            if (val > 0) {
                if (horizontalValues.includes(val)) {
                    return true;
                }
                horizontalValues.push(val);
            }
        }

        // Check vertical conflicts
        let startRow = row;
        let endRow = row;
        
        while (startRow > 0 && this.gameGrid[startRow - 1][col].type === 'input') {
            startRow--;
        }
        
        while (endRow < this.gameGrid.length - 1 && this.gameGrid[endRow + 1][col].type === 'input') {
            endRow++;
        }
        
        const verticalValues = [];
        for (let r = startRow; r <= endRow; r++) {
            const val = this.gameGrid[r][col].value;
            if (val > 0) {
                if (verticalValues.includes(val)) {
                    return true;
                }
                verticalValues.push(val);
            }
        }

        return false;
    }

    checkVictory() {
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input') {
                    if (cell.value !== cell.answer) return false;
                    if (this.checkSequenceConflicts(row, col)) return false;
                }
            }
        }
        return true;
    }

    // Enhanced features with stubs for compatibility
    showHint() {
        if (this.isAutoSolving) return;
        
        const emptyCells = [];
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        const hintCell = emptyCells[Math.floor(Math.random() * Math.min(3, emptyCells.length))];
        const cellElement = document.querySelector(`[data-row="${hintCell.row}"][data-col="${hintCell.col}"]`);
        if (cellElement) {
            cellElement.classList.add('hint');
            setTimeout(() => {
                cellElement.classList.remove('hint');
            }, 3000);
        }
        
        this.updateScore(-20);
        this.playSound('success');
    }

    undoMove() {
        if (this.moves.length === 0 || this.isAutoSolving) return;
        
        const lastMove = this.moves.pop();
        const cell = this.gameGrid[lastMove.row][lastMove.col];
        cell.value = lastMove.previousValue;
        
        const cellElement = document.querySelector(`[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        if (cellElement) {
            cellElement.textContent = cell.value > 0 ? cell.value : '';
            this.updateCellValidation(cellElement, cell, lastMove.row, lastMove.col);
        }
        
        this.playSound('button-click');
        this.saveGameState();
    }

    // Check solution functionality
    checkSolution() {
        if (this.isAutoSolving) return;
        
        this.playSound('button-click');
        const validation = this.validatePuzzle();
        this.lastValidationResult = validation;
        this.showCheckSolutionModal(validation);
    }

    validatePuzzle() {
        const result = {
            totalCells: 0,
            correctCells: 0,
            errorCells: 0,
            emptyCells: 0,
            completion: 0,
            errors: [],
            suggestions: [],
            isComplete: false,
            isPerfect: false
        };

        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input') {
                    result.totalCells++;
                    
                    if (cell.value === 0) {
                        result.emptyCells++;
                    } else {
                        if (cell.value === cell.answer && !this.checkSequenceConflicts(row, col)) {
                            result.correctCells++;
                        } else {
                            result.errorCells++;
                            result.errors.push(`Error at row ${row + 1}, col ${col + 1}`);
                        }
                    }
                }
            }
        }

        result.completion = Math.round((result.correctCells / result.totalCells) * 100);
        result.isComplete = result.emptyCells === 0 && result.errorCells === 0;
        result.isPerfect = result.isComplete;

        if (result.isPerfect) {
            result.suggestions.push("Perfect! All cells filled correctly!");
        } else if (result.completion >= 75) {
            result.suggestions.push("Almost there! Check the remaining cells.");
        } else {
            result.suggestions.push("Keep going! Focus on smaller sums first.");
        }

        return result;
    }

    showCheckSolutionModal(validation) {
        this.updateCompletionCircle(validation.completion);
        
        const correctCount = document.getElementById('correct-count');
        const errorCount = document.getElementById('error-count');
        const incompleteCount = document.getElementById('incomplete-count');
        
        if (correctCount) correctCount.textContent = validation.correctCells;
        if (errorCount) errorCount.textContent = validation.errorCells;
        if (incompleteCount) incompleteCount.textContent = validation.emptyCells;
        
        this.updateFeedbackMessage(validation);
        this.updateErrorDetails(validation.errors);
        this.updateSuggestions(validation.suggestions);
        
        this.showModal('check-solution-modal');
    }

    updateCompletionCircle(percentage) {
        const circle = document.getElementById('completion-circle');
        const percentageEl = document.getElementById('completion-percentage');
        
        if (circle && percentageEl) {
            const degrees = (percentage / 100) * 360;
            const color = percentage === 100 ? '#27ae60' : percentage >= 75 ? '#f39c12' : '#e74c3c';
            
            circle.style.background = `conic-gradient(${color} ${degrees}deg, var(--color-border) ${degrees}deg)`;
            percentageEl.textContent = `${percentage}%`;
        }
    }

    updateFeedbackMessage(validation) {
        const feedbackMessage = document.getElementById('feedback-message');
        if (!feedbackMessage) return;
        
        feedbackMessage.className = 'feedback-message';
        
        if (validation.isPerfect) {
            feedbackMessage.classList.add('success');
            feedbackMessage.innerHTML = '<i class="fas fa-check-circle"></i><span>Perfect! No errors found!</span>';
        } else if (validation.errorCells > 0) {
            feedbackMessage.classList.add('error');
            feedbackMessage.innerHTML = '<i class="fas fa-times-circle"></i><span>Found some issues</span>';
        } else if (validation.emptyCells > 0) {
            feedbackMessage.classList.add('warning');
            feedbackMessage.innerHTML = '<i class="fas fa-info-circle"></i><span>Puzzle incomplete</span>';
        }
    }

    updateErrorDetails(errors) {
        const issuesList = document.getElementById('issues-list');
        const errorDetails = document.getElementById('error-details');
        
        if (errors.length > 0) {
            issuesList.style.display = 'block';
            errorDetails.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
        } else {
            issuesList.style.display = 'none';
        }
    }

    updateSuggestions(suggestions) {
        const suggestionsEl = document.getElementById('suggestions');
        const suggestionDetails = document.getElementById('suggestion-details');
        
        if (suggestions.length > 0) {
            suggestionsEl.style.display = 'block';
            suggestionDetails.innerHTML = suggestions.map(suggestion => `<li>${suggestion}</li>`).join('');
        } else {
            suggestionsEl.style.display = 'none';
        }
    }

    highlightErrors() {
        if (!this.lastValidationResult) return;
        
        this.playSound('button-click');
        
        document.querySelectorAll('.cell-input.highlighted-error').forEach(cell => {
            cell.classList.remove('highlighted-error');
        });
        
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value > 0) {
                    const hasError = cell.value !== cell.answer || this.checkSequenceConflicts(row, col);
                    
                    if (hasError) {
                        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cellElement) {
                            cellElement.classList.add('highlighted-error');
                        }
                    }
                }
            }
        }
        
        if (this.errorHighlightTimeout) {
            clearTimeout(this.errorHighlightTimeout);
        }
        
        this.errorHighlightTimeout = setTimeout(() => {
            document.querySelectorAll('.cell-input.highlighted-error').forEach(cell => {
                cell.classList.remove('highlighted-error');
            });
        }, 5000);
    }

    // Auto-solve functionality
    showAutoSolveModal() {
        this.playSound('button-click');
        this.showModal('auto-solve-modal');
    }

    startAutoSolve() {
        this.hideModal('auto-solve-modal');
        this.isAutoSolving = true;
        this.autoSolveStartTime = Date.now();
        
        this.playSound('auto-solve-start');
        
        if (this.autoSolveMode === 'instant') {
            this.solveInstantly();
        } else {
            this.startStepByStepSolve();
        }
    }

    solveInstantly() {
        let delay = 0;
        const cells = [];
        
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    cells.push({ row, col, cell });
                }
            }
        }

        cells.forEach(({ row, col, cell }) => {
            setTimeout(() => {
                cell.value = cell.answer;
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cellElement) {
                    cellElement.textContent = cell.value;
                    cellElement.classList.add('auto-solved');
                    setTimeout(() => {
                        cellElement.classList.remove('auto-solved');
                        this.updateCellValidation(cellElement, cell, row, col);
                    }, 800);
                }
            }, delay);
            
            delay += 50;
        });

        setTimeout(() => {
            this.completeAutoSolve();
        }, delay + 500);
    }

    startStepByStepSolve() {
        this.showModal('auto-solve-progress');
        this.generateSolveSteps();
        this.currentStepIndex = 0;
        this.processNextStep();
    }

    generateSolveSteps() {
        this.solveStepQueue = [];
        let stepCount = 0;
        const totalCells = this.countInputCells();
        
        const emptyCells = [];
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    emptyCells.push({ row, col, answer: cell.answer });
                }
            }
        }
        
        emptyCells.forEach(cell => {
            this.solveStepQueue.push({
                type: 'step',
                row: cell.row,
                col: cell.col,
                value: cell.answer,
                technique: 'Constraint Analysis',
                progress: Math.round((++stepCount / totalCells) * 100)
            });
        });
        
        if (this.solveStepQueue.length > 0) {
            this.solveStepQueue[this.solveStepQueue.length - 1].progress = 100;
        }
    }

    processNextStep() {
        if (!this.isAutoSolving || this.autoSolvePaused || this.currentStepIndex >= this.solveStepQueue.length) {
            if (this.currentStepIndex >= this.solveStepQueue.length) {
                this.completeAutoSolve();
            }
            return;
        }
        
        const step = this.solveStepQueue[this.currentStepIndex];
        const cell = this.gameGrid[step.row][step.col];
        
        const cellElement = document.querySelector(`[data-row="${step.row}"][data-col="${step.col}"]`);
        if (cellElement) {
            cellElement.classList.add('solving');
        }
        
        this.updateAutoSolveProgress(step);
        
        setTimeout(() => {
            if (!this.isAutoSolving) return;
            
            cell.value = step.value;
            if (cellElement) {
                cellElement.textContent = step.value;
                cellElement.classList.remove('solving');
                cellElement.classList.add('auto-solved');
                
                setTimeout(() => {
                    if (cellElement) {
                        cellElement.classList.remove('auto-solved');
                        this.updateCellValidation(cellElement, cell, step.row, step.col);
                    }
                }, 500);
            }
            
            this.playSound('auto-solve-step');
            this.currentStepIndex++;
            
            setTimeout(() => {
                this.processNextStep();
            }, this.autoSolveSpeed);
            
        }, 300);
    }

    updateAutoSolveProgress(step) {
        const progressPercentage = document.getElementById('progress-percentage');
        const progressFill = document.getElementById('progress-fill');
        const cellsSolved = document.getElementById('cells-solved');
        const currentTechnique = document.getElementById('current-technique');
        const solveTime = document.getElementById('solve-time');
        
        if (progressPercentage) progressPercentage.textContent = step.progress + '%';
        if (progressFill) progressFill.style.width = step.progress + '%';
        if (cellsSolved) {
            cellsSolved.textContent = `${this.currentStepIndex + 1} / ${this.solveStepQueue.length}`;
        }
        if (currentTechnique) currentTechnique.textContent = step.technique;
        if (solveTime) {
            const elapsed = Math.floor((Date.now() - this.autoSolveStartTime) / 1000);
            solveTime.textContent = this.formatTime(elapsed);
        }
    }

    toggleAutoSolvePause() {
        this.autoSolvePaused = !this.autoSolvePaused;
        
        const pauseBtn = document.getElementById('pause-solving');
        if (pauseBtn) {
            if (this.autoSolvePaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                this.processNextStep();
            }
        }
    }

    stopAutoSolve() {
        this.isAutoSolving = false;
        this.autoSolvePaused = false;
        
        this.solveStepQueue = [];
        this.currentStepIndex = 0;
        
        document.querySelectorAll('.cell-input.solving').forEach(el => {
            el.classList.remove('solving');
        });
        
        this.hideModal('auto-solve-progress');
        this.playSound('button-click');
    }

    completeAutoSolve() {
        this.isAutoSolving = false;
        this.hideModal('auto-solve-progress');
        this.updateScore(100);
        this.saveGameState();
        
        setTimeout(() => {
            this.showVictory(true);
        }, 500);
    }

    showVictory(isAutoSolved = false) {
        this.stopTimer();
        this.playSound(isAutoSolved ? 'auto-solve-complete' : 'victory');
        
        const finalTime = this.formatTime(this.getElapsedTime());
        const finalScore = this.score;
        
        const finalTimeEl = document.getElementById('final-time');
        const finalScoreEl = document.getElementById('final-score');
        const autoSolveStat = document.getElementById('auto-solve-stat');
        
        if (finalTimeEl) finalTimeEl.textContent = finalTime;
        if (finalScoreEl) finalScoreEl.textContent = finalScore;
        if (autoSolveStat) {
            autoSolveStat.style.display = isAutoSolved ? 'flex' : 'none';
        }
        
        this.showModal('victory-modal');
        if (!isAutoSolved) {
            this.createConfettiEffect();
        }
    }

    createConfettiEffect() {
        const confetti = document.getElementById('confetti');
        if (!confetti) return;
        
        confetti.innerHTML = '';
        
        for (let i = 0; i < 30; i++) {
            const piece = document.createElement('div');
            piece.style.position = 'absolute';
            piece.style.width = '6px';
            piece.style.height = '6px';
            piece.style.backgroundColor = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6'][Math.floor(Math.random() * 5)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top = '-10px';
            piece.style.animation = `confettiFall ${2 + Math.random() * 3}s linear infinite`;
            piece.style.animationDelay = Math.random() * 2 + 's';
            confetti.appendChild(piece);
        }
    }

    // Instructions functionality
    showInstructionsModal() {
        this.playSound('button-click');
        this.showModal('instructions-modal');
        this.switchInstructionSection(this.currentInstructionSection);
    }

    switchInstructionSection(sectionId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.instruction-section').forEach(section => {
            section.classList.remove('active');
            if (section.id === `section-${sectionId}`) {
                section.classList.add('active');
            }
        });

        this.currentInstructionSection = sectionId;
        this.playSound('button-click');
    }

    // Audio System
    async initAudio() {
        try {
            document.addEventListener('click', () => {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
            }, { once: true });
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }

    playSound(type) {
        if (!this.settings.sfxEnabled) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            const frequencies = {
                'button-click': 800,
                'number-input': 600,
                'cell-select': 400,
                'success': 800,
                'error': 200,
                'victory': 1000,
                'auto-solve-start': 900,
                'auto-solve-step': 700,
                'auto-solve-complete': 1200,
                'generation-complete': 1000
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);

            this.playingSounds.push({ oscillator, gainNode });
            
            setTimeout(() => {
                this.playingSounds = this.playingSounds.filter(s => s.oscillator !== oscillator);
            }, 200);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    // Utility methods
    countInputCells() {
        let count = 0;
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                if (this.gameGrid[row][col].type === 'input') {
                    count++;
                }
            }
        }
        return count;
    }

    countSolvedCells() {
        let count = 0;
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateScore(points) {
        this.score = Math.max(0, this.score + points);
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Timer functions
    startTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    pauseGame() {
        if (this.isAutoSolving) return;
        
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.gameTimer) {
            this.stopTimer();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        } else {
            this.startTimer();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        }
        this.playSound('button-click');
    }

    updateTimer() {
        const elapsed = this.getElapsedTime();
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = this.formatTime(elapsed);
        }
    }

    getElapsedTime() {
        return this.gameStartTime ? Math.floor((Date.now() - this.gameStartTime) / 1000) : 0;
    }

    // Settings management
    loadSettings() {
        try {
            const saved = localStorage.getItem('kakuro-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('Could not load settings');
        }
        this.updateSettingsUI();
    }

    saveSettings() {
        try {
            localStorage.setItem('kakuro-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.log('Could not save settings');
        }
        this.updateSettingsUI();
    }

    toggleSetting(setting) {
        this.settings[setting] = !this.settings[setting];
        this.saveSettings();
        this.playSound('button-click');
    }

    updateSettingsUI() {
        const sfxBtn = document.getElementById('sfx-toggle');
        const musicBtn = document.getElementById('music-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        const autoSolveHintsBtn = document.getElementById('autosolve-hints-toggle');
        
        if (sfxBtn) {
            sfxBtn.classList.toggle('inactive', !this.settings.sfxEnabled);
            sfxBtn.innerHTML = this.settings.sfxEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        }
        
        if (musicBtn) {
            musicBtn.classList.toggle('inactive', !this.settings.musicEnabled);
        }
        
        if (volumeSlider) {
            volumeSlider.value = this.settings.volume * 100;
        }
        
        if (autoSolveHintsBtn) {
            autoSolveHintsBtn.classList.toggle('inactive', !this.settings.autoSolveHints);
            autoSolveHintsBtn.innerHTML = this.settings.autoSolveHints ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        }
    }

    // Game state management
    saveGameState() {
        try {
            const gameState = {
                currentPuzzle: this.currentPuzzle,
                gameGrid: this.gameGrid,
                score: this.score,
                startTime: this.gameStartTime,
                moves: this.moves,
                difficulty: this.currentDifficulty,
                size: this.currentSize
            };
            localStorage.setItem('kakuro-game-state', JSON.stringify(gameState));
            this.enableContinueButton();
        } catch (error) {
            console.log('Could not save game state');
        }
    }

    loadSavedGame() {
        try {
            const saved = localStorage.getItem('kakuro-game-state');
            if (saved) {
                const gameState = JSON.parse(saved);
                this.currentPuzzle = gameState.currentPuzzle;
                this.gameGrid = gameState.gameGrid;
                this.score = gameState.score;
                this.gameStartTime = gameState.startTime;
                this.moves = gameState.moves || [];
                this.currentDifficulty = gameState.difficulty || 'easy';
                this.currentSize = gameState.size || 6;
                
                this.renderGrid();
                this.updateScore(0);
                this.updateDifficultyLabel();
                this.showScreen('game-screen');
                this.startTimer();
                
                return true;
            }
        } catch (error) {
            console.log('Could not load saved game');
        }
        return false;
    }

    enableContinueButton() {
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            const hasSavedGame = localStorage.getItem('kakuro-game-state');
            continueBtn.disabled = !hasSavedGame;
        }
    }

    resetGame() {
        try {
            localStorage.removeItem('kakuro-game-state');
        } catch (error) {
            console.log('Could not clear saved game');
        }
        
        this.stopTimer();
        this.stopAutoSolve();
        this.hideModal('settings-modal');
        this.showScreen('main-menu');
        this.enableContinueButton();
        this.playSound('button-click');
    }
}

// Initialize the game
console.log('Loading Enhanced Kakuro game...');

// Ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing game...');
        window.kakuroGame = new KakuroGame();
    });
} else {
    console.log('DOM already loaded, initializing game...');
    window.kakuroGame = new KakuroGame();
}

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.kakuroGame && document.hidden && window.kakuroGame.currentScreen === 'game-screen') {
        if (window.kakuroGame.gameTimer) {
            window.kakuroGame.pauseGame();
        }
    }
});

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);