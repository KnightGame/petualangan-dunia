// ==================== GAME STATE ====================
let gameState = {
    mode: 'flag',
    difficulty: 'easy',
    score: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    lives: 5,
    maxLives: 5,
    xp: 0,
    level: 1,
    xpToNext: 100,
    currentCountry: null,
    answered: false,
    active: false,
    hints: 3,
    skips: 2,
    fifties: 2,
    timerOn: false,
    timerVal: 100,
    timerInt: null,
    particles: true,
    usedCountries: [],
    shuffledCountries: [],
    perfectRun: 0,
    regionStats: {}
};

let settings = { 
    musicVolume: 0.6, 
    sfxVolume: 0.8, 
    timer: false, 
    particles: true 
};

let playerData = { 
    highScore: 0, 
    gamesPlayed: 0, 
    totalCorrect: 0, 
    badges: [], 
    regionCorrect: {} 
};

let muted = false;
let audioCtx = null;
let currentContinent = 'all';
let currentViewingCountry = null;

// ==================== INIT ====================
function init() {
    loadData();
    createFloatingBg();
    renderLearnGrid();
    renderBadges();
    updateSettingsUI();
    document.body.addEventListener('click', initAudio, { once: true });
    console.log(`🌍 Total Countries: ${countries.length}`);
}

function loadData() {
    const savedPlayer = localStorage.getItem('worldAdventureData');
    if (savedPlayer) playerData = { ...playerData, ...JSON.parse(savedPlayer) };
    
    const savedSettings = localStorage.getItem('worldAdventureSettings');
    if (savedSettings) settings = { ...settings, ...JSON.parse(savedSettings) };
}

function saveData() {
    localStorage.setItem('worldAdventureData', JSON.stringify(playerData));
    localStorage.setItem('worldAdventureSettings', JSON.stringify(settings));
}

function updateSettingsUI() {
    document.getElementById('musicVolSlider').value = settings.musicVolume * 100;
    document.getElementById('musicVolVal').textContent = Math.round(settings.musicVolume * 100) + '%';
    
    document.getElementById('sfxVolSlider').value = settings.sfxVolume * 100;
    document.getElementById('sfxVolVal').textContent = Math.round(settings.sfxVolume * 100) + '%';
    
    document.getElementById('timerToggle').classList.toggle('active', settings.timer);
    document.getElementById('particleToggle').classList.toggle('active', settings.particles);
}

function createFloatingBg() {
    const container = document.getElementById('floatingBg');
    const items = ['🌍', '🌎', '🌏', '⭐', '✨', '🎈', '🎉', '🌈', '☁️', '🦋', '🎀', '💫', '🌸', '🍀'];
    
    for (let i = 0; i < 25; i++) {
        const el = document.createElement('div');
        el.className = 'floating-item';
        el.textContent = items[Math.floor(Math.random() * items.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.animationDelay = Math.random() * 20 + 's';
        el.style.animationDuration = (12 + Math.random() * 10) + 's';
        el.style.fontSize = (1.5 + Math.random() * 1.5) + 'rem';
        container.appendChild(el);
    }

    for (let i = 0; i < 10; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.width = bubble.style.height = (20 + Math.random() * 40) + 'px';
        bubble.style.animationDelay = Math.random() * 15 + 's';
        bubble.style.animationDuration = (10 + Math.random() * 10) + 's';
        container.appendChild(bubble);
    }
}

// ==================== AUDIO ====================
function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}

function playTone(freq, dur, type = 'sine', isSfx = true) {
    if (muted || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        
        // Use SFX or Music volume based on parameter
        const vol = isSfx ? settings.sfxVolume * 0.3 : settings.musicVolume * 0.3;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
}

// SFX sounds
function playSfxClick() { playTone(800, 0.08, 'sine', true); }
function playSfxCorrect() {
    playTone(523, 0.1, 'sine', true); 
    setTimeout(() => playTone(659, 0.1, 'sine', true), 80); 
    setTimeout(() => playTone(784, 0.15, 'sine', true), 160);
}
function playSfxWrong() { playTone(200, 0.25, 'sawtooth', true); }
function playSfxStreak() {
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => playTone(n, 0.12, 'sine', true), i * 80));
}
function playSfxLevelUp() {
    [392, 523, 659, 784, 1047, 1319].forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', true), i * 80));
}
function playSfxGameOver() {
    playTone(392, 0.25, 'sine', true); 
    setTimeout(() => playTone(349, 0.25, 'sine', true), 250);
    setTimeout(() => playTone(330, 0.25, 'sine', true), 500); 
    setTimeout(() => playTone(262, 0.4, 'sine', true), 750);
}

function toggleSound() {
    muted = !muted;
    document.getElementById('soundBtn').textContent = muted ? '🔇' : '🔊';
    if (!muted) playSfxClick();
}

// ==================== NAVIGATION ====================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function backToMenu() { playSfxClick(); showScreen('welcomeScreen'); }
function showModeSelect() { playSfxClick(); showScreen('modeScreen'); }
function showLearn() { playSfxClick(); renderLearnGrid(); showScreen('learnScreen'); }
function showCollection() { playSfxClick(); renderBadges(); showScreen('collectionScreen'); }
function showSettings() { playSfxClick(); updateSettingsUI(); showScreen('settingsScreen'); }
function showAbout() { playSfxClick(); showScreen('aboutScreen'); }

// ==================== MASCOT ====================
function mascotSpeak() {
    playSfxClick();
    const bubble = document.getElementById('speechBubble');
    const msgs = mascotMessages.welcome;
    bubble.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), 2000);
}

// ==================== MODE & DIFFICULTY ====================
function selectMode(mode) {
    playSfxClick();
    gameState.mode = mode;
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('selected');
}

function selectDiff(diff) {
    playSfxClick();
    gameState.difficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.diff-btn.${diff}`).classList.add('selected');
}

// ==================== GAME START ====================
function startGame() {
    playSfxClick();
    if (!audioCtx) initAudio();

    switch (gameState.difficulty) {
        case 'easy': gameState.maxLives = 5; gameState.hints = 5; gameState.skips = 3; gameState.fifties = 3; break;
        case 'medium': gameState.maxLives = 3; gameState.hints = 3; gameState.skips = 2; gameState.fifties = 2; break;
        case 'hard': gameState.maxLives = 2; gameState.hints = 1; gameState.skips = 1; gameState.fifties = 1; break;
    }

    resetGame();
    showScreen('gameScreen');

    const timerBar = document.getElementById('timerBar');
    if (gameState.difficulty !== 'easy' || settings.timer) {
        timerBar.classList.remove('hidden');
    } else {
        timerBar.classList.add('hidden');
    }

    generateQuestion();
}

function resetGame() {
    gameState.score = 0;
    gameState.total = 0;
    gameState.streak = 0;
    gameState.lives = gameState.maxLives;
    gameState.answered = false;
    gameState.active = true;
    gameState.perfectRun = 0;
    gameState.usedCountries = [];
    gameState.shuffledCountries = [...countries].sort(() => Math.random() - 0.5);
    stopTimer();
    updateAllStats();
    updatePowerups();
}

// ==================== QUESTION GENERATION ====================
function generateQuestion() {
    gameState.answered = false;
    hideElements(['feedbackBox', 'funFact', 'starsBox', 'nextBtn']);
    document.getElementById('nextBtn').classList.add('hidden');

    if (gameState.shuffledCountries.length === 0) {
        gameState.shuffledCountries = [...countries].sort(() => Math.random() - 0.5);
    }
    gameState.currentCountry = gameState.shuffledCountries.pop();

    let wrongPool = countries.filter(c => c.name !== gameState.currentCountry.name);
    if (gameState.difficulty === 'hard') {
        const sameRegion = wrongPool.filter(c => c.region === gameState.currentCountry.region);
        if (sameRegion.length >= 3) wrongPool = sameRegion;
    }
    const wrongs = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [gameState.currentCountry, ...wrongs].sort(() => Math.random() - 0.5);

    updateQuestionDisplay(options);
    createFlagSparkles();

    if (gameState.difficulty !== 'easy' || settings.timer) startTimer();
}

function updateQuestionDisplay(options) {
    const flagDisplay = document.getElementById('flagDisplay');
    const clueDisplay = document.getElementById('clueDisplay');
    const questionText = document.getElementById('questionText');
    const regionTag = document.getElementById('regionTag');

    flagDisplay.classList.add('hidden');
    clueDisplay.classList.add('hidden');

    switch (gameState.mode) {
        case 'flag':
            questionText.textContent = 'Bendera negara apa ini? 🤔';
            flagDisplay.classList.remove('hidden');
            document.getElementById('flagImg').src = `https://flagcdn.com/w640/${gameState.currentCountry.code}.png`;
            regionTag.classList.remove('hidden');
            renderOptions(options, 'name');
            break;

        case 'desc':
            questionText.textContent = 'Negara apa yang dimaksud? 🔍';
            clueDisplay.classList.remove('hidden');
            document.getElementById('clueText').textContent = gameState.currentCountry.desc;
            document.getElementById('clueHint').innerHTML = `<span>🔤</span> Kode: <strong>${gameState.currentCountry.initial}</strong>`;
            regionTag.classList.remove('hidden');
            renderOptions(options, 'name');
            break;

        case 'capital':
            questionText.textContent = `Ibu kota ${gameState.currentCountry.name}? 🏛️`;
            flagDisplay.classList.remove('hidden');
            document.getElementById('flagImg').src = `https://flagcdn.com/w640/${gameState.currentCountry.code}.png`;
            regionTag.classList.add('hidden');
            renderOptions(options, 'capital');
            break;
    }

    document.getElementById('regionName').textContent = gameState.currentCountry.region;
    document.getElementById('questionBadge').textContent = `Soal ${gameState.total + 1}`;
}

function renderOptions(options, field) {
    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = '';
    options.forEach(country => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = country[field];
        btn.dataset.name = country.name;
        btn.onclick = () => handleAnswer(country);
        grid.appendChild(btn);
    });
}

// ==================== ANSWER HANDLING ====================
function handleAnswer(selected) {
    if (gameState.answered || !gameState.active) return;
    playSfxClick();
    gameState.answered = true;
    gameState.total++;
    stopTimer();

    const correct = selected.name === gameState.currentCountry.name;
    const buttons = document.querySelectorAll('.option-btn');

    if (correct) {
        handleCorrect(buttons);
    } else {
        handleWrong(buttons, selected);
    }

    updateAllStats();
    checkBadges();
    saveData();

    if (gameState.lives <= 0) {
        gameState.active = false;
        setTimeout(showGameOver, 1800);
    } else {
        document.getElementById('nextBtn').classList.remove('hidden');
    }
}

function handleCorrect(buttons) {
    gameState.score++;
    gameState.streak++;
    gameState.perfectRun++;
    playerData.totalCorrect++;

    const region = gameState.currentCountry.region.toLowerCase();
    if (!playerData.regionCorrect[region]) playerData.regionCorrect[region] = 0;
    playerData.regionCorrect[region]++;

    if (gameState.streak > gameState.bestStreak) gameState.bestStreak = gameState.streak;

    let xp = 10;
    if (gameState.streak >= 3) xp += gameState.streak * 2;
    if (gameState.difficulty === 'medium') xp *= 1.5;
    if (gameState.difficulty === 'hard') xp *= 2;
    addXP(Math.floor(xp));

    buttons.forEach(btn => {
        if (btn.dataset.name === gameState.currentCountry.name) btn.classList.add('correct');
        else btn.classList.add('disabled');
        btn.disabled = true;
    });

    if (gameState.streak >= 3) {
        playSfxStreak();
        showCombo(gameState.streak);
        if (settings.particles) createConfetti();
    } else {
        playSfxCorrect();
    }

    showFeedback(true, gameState.streak >= 3 ? `🔥 Streak ${gameState.streak}x!` : '🎉 Benar! Hebat!');
    showStars(gameState.streak >= 5 ? 3 : gameState.streak >= 3 ? 2 : 1);
    showFunFact();
}

function handleWrong(buttons, selected) {
    gameState.streak = 0;
    gameState.perfectRun = 0;
    gameState.lives--;

    buttons.forEach(btn => {
        if (btn.dataset.name === gameState.currentCountry.name) btn.classList.add('correct');
        else if (btn.dataset.name === selected.name) btn.classList.add('wrong');
        else btn.classList.add('disabled');
        btn.disabled = true;
    });

    playSfxWrong();
    animateHeartLoss();
    showFeedback(false, `Jawaban: ${gameState.currentCountry.name}`);
    showFunFact();
}

// ==================== TIMER ====================
function startTimer() {
    gameState.timerVal = 100;
    updateTimerBar();
    const duration = gameState.difficulty === 'hard' ? 8000 : 15000;
    const interval = duration / 100;

    gameState.timerInt = setInterval(() => {
        gameState.timerVal--;
        updateTimerBar();
        if (gameState.timerVal <= 0) {
            stopTimer();
            handleTimeout();
        }
    }, interval);
}

function stopTimer() {
    if (gameState.timerInt) {
        clearInterval(gameState.timerInt);
        gameState.timerInt = null;
    }
}

function updateTimerBar() {
    const fill = document.getElementById('timerFill');
    fill.style.width = gameState.timerVal + '%';
    fill.classList.remove('warning', 'danger');
    if (gameState.timerVal <= 20) fill.classList.add('danger');
    else if (gameState.timerVal <= 40) fill.classList.add('warning');
}

function handleTimeout() {
    if (gameState.answered) return;
    gameState.answered = true;
    gameState.total++;
    gameState.streak = 0;
    gameState.perfectRun = 0;
    gameState.lives--;

    playSfxWrong();
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        if (btn.dataset.name === gameState.currentCountry.name) btn.classList.add('correct');
        else btn.classList.add('disabled');
        btn.disabled = true;
    });

    animateHeartLoss();
    showFeedback(false, '⏰ Waktu habis!');
    updateAllStats();

    if (gameState.lives <= 0) {
        gameState.active = false;
        setTimeout(showGameOver, 1800);
    } else {
        document.getElementById('nextBtn').classList.remove('hidden');
    }
}

// ==================== POWERUPS ====================
function useHint() {
    if (gameState.hints <= 0 || gameState.answered) return;
    playSfxClick();
    gameState.hints--;
    updatePowerups();
    const correct = document.querySelector(`.option-btn[data-name="${gameState.currentCountry.name}"]`);
    correct.classList.add('hint-glow');
    setTimeout(() => correct.classList.remove('hint-glow'), 2000);
}

function useSkip() {
    if (gameState.skips <= 0 || gameState.answered) return;
    playSfxClick();
    gameState.skips--;
    updatePowerups();
    stopTimer();
    generateQuestion();
}

function useFifty() {
    if (gameState.fifties <= 0 || gameState.answered) return;
    playSfxClick();
    gameState.fifties--;
    updatePowerups();
    const wrongs = Array.from(document.querySelectorAll('.option-btn'))
        .filter(btn => btn.dataset.name !== gameState.currentCountry.name);
    wrongs.slice(0, 2).forEach(btn => { btn.classList.add('disabled'); btn.disabled = true; });
}

function updatePowerups() {
    document.getElementById('hintCount').textContent = gameState.hints;
    document.getElementById('skipCount').textContent = gameState.skips;
    document.getElementById('fiftyCount').textContent = gameState.fifties;
    document.getElementById('hintPower').disabled = gameState.hints <= 0;
    document.getElementById('skipPower').disabled = gameState.skips <= 0;
    document.getElementById('fiftyPower').disabled = gameState.fifties <= 0;
}

// ==================== XP & LEVEL ====================
function addXP(amount) {
    gameState.xp += amount;
    while (gameState.xp >= gameState.xpToNext) {
        gameState.xp -= gameState.xpToNext;
        gameState.level++;
        gameState.xpToNext = Math.floor(gameState.xpToNext * 1.5);
        showLevelUp();
    }
    updateXPDisplay();
}

function updateXPDisplay() {
    document.getElementById('levelNum').textContent = gameState.level;
    document.getElementById('xpCurrent').textContent = gameState.xp;
    document.getElementById('xpMax').textContent = gameState.xpToNext;
    document.getElementById('xpFill').style.width = (gameState.xp / gameState.xpToNext * 100) + '%';
}

function showLevelUp() {
    playSfxLevelUp();
    document.getElementById('newLevelNum').textContent = gameState.level;
    document.getElementById('levelUpOverlay').classList.remove('hidden');
    createConfetti();
    setTimeout(() => document.getElementById('levelUpOverlay').classList.add('hidden'), 2000);
}

// ==================== UI UPDATES ====================
function updateAllStats() {
    document.getElementById('scoreVal').textContent = gameState.score;
    document.getElementById('streakVal').textContent = gameState.streak;
    document.getElementById('bestVal').textContent = gameState.bestStreak;
    const acc = gameState.total > 0 ? Math.round((gameState.score / gameState.total) * 100) : 0;
    document.getElementById('accuracyVal').textContent = acc + '%';
    updateLivesDisplay();
    updateXPDisplay();
}

function updateLivesDisplay() {
    const container = document.getElementById('livesDisplay');
    container.innerHTML = '';
    for (let i = 0; i < gameState.maxLives; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = '❤️';
        if (i >= gameState.lives) heart.classList.add('lost');
        container.appendChild(heart);
    }
}

function animateHeartLoss() {
    const hearts = document.querySelectorAll('.heart:not(.lost)');
    const last = hearts[hearts.length - 1];
    if (last) {
        last.classList.add('breaking');
        setTimeout(() => { last.classList.remove('breaking'); last.classList.add('lost'); }, 500);
    }
}

function showFeedback(correct, text) {
    const box = document.getElementById('feedbackBox');
    const emoji = document.getElementById('feedbackEmoji');
    const txt = document.getElementById('feedbackText');
    
    box.className = 'feedback-box ' + (correct ? 'correct' : 'wrong');
    emoji.textContent = correct ? ['🎉', '⭐', '🌟', '✨', '🎊'][Math.floor(Math.random() * 5)] : '😢';
    txt.textContent = text;
    box.classList.remove('hidden');
}

function showFunFact() {
    document.getElementById('funFactText').textContent = gameState.currentCountry.funFact;
    document.getElementById('funFact').classList.remove('hidden');
}

function showStars(count) {
    const box = document.getElementById('starsBox');
    box.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = i < count ? '⭐' : '☆';
        star.style.opacity = i < count ? '1' : '0.3';
        box.appendChild(star);
    }
    box.classList.remove('hidden');
}

function hideElements(ids) {
    ids.forEach(id => document.getElementById(id).classList.add('hidden'));
}

// ==================== EFFECTS ====================
function createFlagSparkles() {
    if (!settings.particles) return;
    const container = document.getElementById('flagSparkles');
    container.innerHTML = '';
    const sparkles = ['✨', '⭐', '🌟', '💫'];
    const positions = [
        { top: '-15px', left: '-15px' },
        { top: '-15px', right: '-15px' },
        { bottom: '-15px', left: '-15px' },
        { bottom: '-15px', right: '-15px' }
    ];
    positions.forEach((pos, i) => {
        const el = document.createElement('span');
        el.className = 'flag-sparkle';
        el.textContent = sparkles[i];
        Object.assign(el.style, pos);
        el.style.animationDelay = (i * 0.3) + 's';
        container.appendChild(el);
    });
}

function createConfetti() {
    if (!settings.particles) return;
    const container = document.getElementById('confettiContainer');
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A66CFF', '#FF9BD2', '#6BC5F8', '#7AE582'];
    for (let i = 0; i < 60; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = Math.random() * 0.5 + 's';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        container.appendChild(conf);
        setTimeout(() => conf.remove(), 3000);
    }
}

function showCombo(num) {
    const el = document.createElement('div');
    el.className = 'combo-popup';
    el.textContent = `${num}x COMBO!`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

// ==================== BADGES ====================
function checkBadges() {
    badges.forEach(badge => {
        if (playerData.badges.includes(badge.id)) return;
        let unlocked = false;
        switch (badge.type) {
            case 'correct': unlocked = playerData.totalCorrect >= badge.req; break;
            case 'streak': unlocked = gameState.bestStreak >= badge.req; break;
            case 'score': unlocked = gameState.score >= badge.req; break;
            case 'perfect': unlocked = gameState.perfectRun >= badge.req; break;
            case 'level': unlocked = gameState.level >= badge.req; break;
            case 'region_asia': unlocked = (playerData.regionCorrect['asia'] || 0) >= badge.req; break;
            case 'region_eropa': unlocked = (playerData.regionCorrect['eropa'] || 0) >= badge.req; break;
            case 'region_amerika': unlocked = (playerData.regionCorrect['amerika'] || 0) >= badge.req; break;
            case 'region_afrika': unlocked = (playerData.regionCorrect['afrika'] || 0) >= badge.req; break;
            case 'region_oseania': unlocked = (playerData.regionCorrect['oseania'] || 0) >= badge.req; break;
        }
        if (unlocked) {
            playerData.badges.push(badge.id);
            showCombo(`${badge.icon} ${badge.name}!`);
            playSfxLevelUp();
        }
    });
}

function renderBadges() {
    const grid = document.getElementById('badgesGrid');
    grid.innerHTML = '';
    badges.forEach(badge => {
        const el = document.createElement('div');
        el.className = 'badge-item ' + (playerData.badges.includes(badge.id) ? 'unlocked' : 'locked');
        el.innerHTML = `<div class="badge-icon">${badge.icon}</div><div class="badge-name">${badge.name}</div>`;
        el.title = badge.desc;
        grid.appendChild(el);
    });
}

// ==================== LEARN SCREEN ====================
function renderLearnGrid() {
    const grid = document.getElementById('countriesGrid');
    const search = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = '';

    let filtered = countries;
    if (currentContinent !== 'all') filtered = filtered.filter(c => c.region === currentContinent);
    if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search));

    // Update country count
    document.getElementById('countryCount').textContent = `Total: ${filtered.length} Negara`;

    filtered.forEach(country => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <img src="https://flagcdn.com/w160/${country.code}.png" alt="${country.name}">
            <div class="name">${country.name}</div>
        `;
        card.onclick = () => showCountryDetail(country);
        grid.appendChild(card);
    });
}

function filterByContinent(cont) {
    playSfxClick();
    currentContinent = cont;
    document.querySelectorAll('.continent-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.continent-tab[data-cont="${cont}"]`).classList.add('active');
    renderLearnGrid();
}

function filterCountries() {
    renderLearnGrid();
}

function showCountryDetail(country) {
    playSfxClick();
    currentViewingCountry = country;
    
    document.getElementById('modalFlag').src = `https://flagcdn.com/w320/${country.code}.png`;
    document.getElementById('modalName').textContent = country.name;
    document.getElementById('modalRegion').textContent = country.region;
    document.getElementById('modalCapital').textContent = country.capital;
    document.getElementById('modalContinent').textContent = country.region;
    document.getElementById('modalInitial').textContent = country.initial;
    document.getElementById('modalDescription').textContent = country.desc;
    document.getElementById('modalFunfact').textContent = country.funFact;
    
    // Show/hide additional info rows based on data availability
    const populationRow = document.getElementById('populationRow');
    const languageRow = document.getElementById('languageRow');
    const currencyRow = document.getElementById('currencyRow');
    
    if (country.population) {
        populationRow.classList.remove('hidden');
        document.getElementById('modalPopulation').textContent = country.population;
    } else {
        populationRow.classList.add('hidden');
    }
    
    if (country.language) {
        languageRow.classList.remove('hidden');
        document.getElementById('modalLanguage').textContent = country.language;
    } else {
        languageRow.classList.add('hidden');
    }
    
    if (country.currency) {
        currencyRow.classList.remove('hidden');
        document.getElementById('modalCurrency').textContent = country.currency;
    } else {
        currencyRow.classList.add('hidden');
    }
    
    // Show/hide "Informasi Lengkap" button based on data availability
    const moreInfoBtn = document.getElementById('moreInfoBtn');
    if (country.history || country.geography || country.culture) {
        moreInfoBtn.classList.remove('hidden');
    } else {
        moreInfoBtn.classList.add('hidden');
    }
    
    document.getElementById('countryModal').classList.remove('hidden');
}

function closeCountryModal() {
    playSfxClick();
    document.getElementById('countryModal').classList.add('hidden');
}

// ==================== FULL INFO MODAL ====================
function showFullInfo() {
    playSfxClick();
    
    if (!currentViewingCountry) return;
    const country = currentViewingCountry;
    
    // Set header info
    document.getElementById('fullInfoFlag').src = `https://flagcdn.com/w320/${country.code}.png`;
    document.getElementById('fullInfoName').textContent = country.name;
    document.getElementById('fullInfoRegion').textContent = country.region;
    
    // Set tab contents
    const historyText = country.history || 'Informasi sejarah untuk negara ini belum tersedia. Silakan kembali lagi nanti untuk pembaruan!';
    const geographyText = country.geography || 'Informasi geografi untuk negara ini belum tersedia. Silakan kembali lagi nanti untuk pembaruan!';
    const cultureText = country.culture || 'Informasi budaya untuk negara ini belum tersedia. Silakan kembali lagi nanti untuk pembaruan!';
    
    document.getElementById('fullInfoHistory').textContent = historyText;
    document.getElementById('fullInfoGeography').textContent = geographyText;
    document.getElementById('fullInfoCulture').textContent = cultureText;
    
    // Set stats
    document.getElementById('fullInfoPopulation').textContent = country.population || 'N/A';
    document.getElementById('fullInfoLanguage').textContent = country.language || 'N/A';
    document.getElementById('fullInfoCurrency').textContent = country.currency || 'N/A';
    
    // Reset to history tab
    switchInfoTab('history');
    
    // Show modal
    document.getElementById('fullInfoModal').classList.remove('hidden');
}

function closeFullInfo() {
    playSfxClick();
    document.getElementById('fullInfoModal').classList.add('hidden');
}

function switchInfoTab(tabName) {
    playSfxClick();
    
    // Update tab buttons
    document.querySelectorAll('.info-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });
    
    const activePane = document.getElementById(tabName + 'Tab');
    if (activePane) {
        activePane.classList.remove('hidden');
    }
}

// ==================== GAME OVER ====================
function showGameOver() {
    stopTimer();
    const isRecord = gameState.score > playerData.highScore;
    if (isRecord) playerData.highScore = gameState.score;
    playerData.gamesPlayed++;
    saveData();

    const mascot = document.getElementById('modalMascotEnd');
    const title = document.getElementById('modalTitleEnd');
    const sub = document.getElementById('modalSubEnd');

    if (gameState.score >= 20) {
        mascot.textContent = '🎉'; title.textContent = 'Luar Biasa!';
        title.className = 'modal-title victory'; sub.textContent = 'Kamu hebat sekali!';
    } else if (gameState.score >= 10) {
        mascot.textContent = '😊'; title.textContent = 'Bagus!';
        title.className = 'modal-title victory'; sub.textContent = 'Terus belajar ya!';
    } else {
        mascot.textContent = '🦁'; title.textContent = 'Game Over!';
        title.className = 'modal-title gameover'; sub.textContent = 'Jangan menyerah!';
    }

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalTotal').textContent = gameState.total;
    document.getElementById('finalBestStreak').textContent = gameState.bestStreak;
    document.getElementById('highScoreVal').textContent = playerData.highScore;
    const acc = gameState.total > 0 ? Math.round((gameState.score / gameState.total) * 100) : 0;
    document.getElementById('finalAccuracy').textContent = acc + '%';
    document.getElementById('newRecordBadge').classList.toggle('hidden', !isRecord);

    document.getElementById('gameOverModal').classList.remove('hidden');
    if (gameState.score >= 10 && settings.particles) createConfetti();
    else playSfxGameOver();
}

function restartGame() {
    playSfxClick();
    document.getElementById('gameOverModal').classList.add('hidden');
    startGame();
}

function backToMenuFromModal() {
    playSfxClick();
    document.getElementById('gameOverModal').classList.add('hidden');
    showScreen('welcomeScreen');
}

function nextQuestion() {
    playSfxClick();
    generateQuestion();
}

// ==================== QUIT ====================
function confirmQuit() {
    playSfxClick();
    document.getElementById('quitModal').classList.remove('hidden');
}

function closeQuitModal() {
    playSfxClick();
    document.getElementById('quitModal').classList.add('hidden');
}

function confirmQuitYes() {
    playSfxClick();
    closeQuitModal();
    stopTimer();
    showScreen('welcomeScreen');
}

// ==================== SETTINGS ====================
function setMusicVolume(val) {
    settings.musicVolume = val / 100;
    document.getElementById('musicVolVal').textContent = val + '%';
    saveData();
}

function setSfxVolume(val) {
    settings.sfxVolume = val / 100;
    document.getElementById('sfxVolVal').textContent = val + '%';
    playSfxClick();
    saveData();
}

function toggleTimer() {
    playSfxClick();
    settings.timer = !settings.timer;
    document.getElementById('timerToggle').classList.toggle('active', settings.timer);
    saveData();
}

function toggleParticles() {
    playSfxClick();
    settings.particles = !settings.particles;
    document.getElementById('particleToggle').classList.toggle('active', settings.particles);
    saveData();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', init);
document.getElementById('soundBtn').addEventListener('click', toggleSound);
