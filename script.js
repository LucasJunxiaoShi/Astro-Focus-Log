// DOM Elements
let progressBar;
let progressText;
let initiateBtn;
let intrusionBtn;
let distanceCounter;
let milestoneText;
let missionLog;
let intrusionModal;
let closeModals;
let intrusionForm;
let timestampInput;
let decryptionOutput;
let metricTotalSessions;
let metricStreak;
let sessionHistoryContainer;
let currentTimeDisplay;
let focusDurationInput;
let focusPresetButtons;
let successModal;
let successCodeDisplay;
let successModalCloseBtn;
let ratingModal;
let ratingForm;
let todoInput;
let todoAddBtn;
let todoList;
let missionModal;
let missionForm;
let missionNameInput;
let missionCancelBtn;
let missionNameValue;
let estimatedTimeContainer;
let estimatedTimeDisplay;
const STREAM_SNIPPETS = [
    "SCAN", "DECODE", "VECTOR", "DELTA", "QUANT", "OMEGA", "NOVA", "SIGMA",
    "PHASE", "FREQ", "ALIGN", "SHIFT", "BYPASS", "LOCK", "TRACE", "RANGE"
];
const STREAM_SUFFIXES = [
    "=0x", "::", "->", "<=", "//"
];

// App State
let progress = 0;
let timer = null;
let isRunning = false;
let totalDistance = 0;
let decryptionStreamTimer = null;
let totalSessions = 0;
let sessionHistory = [];
let focusDuration = 10; // seconds
const BASE_DURATION = 1500; // 25 minutes reference duration
const BASE_DISTANCE_REWARD = 1.5; // million kilometers earned for a 25-minute lock-in
let currentTimeInterval = null;
let sessionStartTimestamp = null;
let lastAmbientLogTimestamp = 0;
let todoItems = [];
const TODO_STORAGE_KEY = 'astroFocusTodos';
let pendingSession = null;
let missionName = '';
let currentStreak = 0;
let lastSessionDate = null;
const STREAK_STORAGE_KEY = 'astroFocusStreak';

// Milestone thresholds in million kilometers
const MILESTONES = [
    { distance: 0, message: "Launching from Earth's orbit..." },
    { distance: 0.4, message: "Passing the Moon's orbit..." },
    { distance: 1.0, message: "Entering interplanetary space..." },
    { distance: 1.5, message: "Crossing Mars' orbit..." },
    { distance: 5.2, message: "Entering the Asteroid Belt..." },
    { distance: 9.5, message: "Passing Saturn's orbit..." },
    { distance: 19.2, message: "Passing Uranus' orbit..." },
    { distance: 30.1, message: "Passing Neptune's orbit..." },
    { distance: 39.5, message: "Passing Pluto's orbit..." },
    { distance: 100, message: "Entering the Kuiper Belt..." },
    { distance: 200, message: "Approaching the Heliopause..." },
    { distance: 300, message: "Entering Interstellar Space..." },
    { distance: 500, message: "Voyager 1 territory..." },
    { distance: 1000, message: "Entering the Oort Cloud..." },
    { distance: 2000, message: "Leaving the Solar System..." },
    { distance: 4000, message: "Approaching Proxima Centauri..." },
    { distance: 8000, message: "Entering the Proxima Centauri system..." },
    { distance: 12000, message: "Charting Alpha Centauri A & B..." },
    { distance: 20000, message: "Piercing the Local Interstellar Cloud..." },
    { distance: 40000, message: "Crossing deeper into the Orion Arm..." },
    { distance: 100000, message: "Setting course toward the Galactic Center..." }
];

function handleTodoSubmit() {
    if (!todoInput) return;
    const text = todoInput.value.trim();
    if (!text) return;
    addTodoItem(text);
    todoInput.value = '';
}

function addTodoItem(text) {
    const newItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        text,
        completed: false,
        createdAt: Date.now()
    };
    todoItems.unshift(newItem);
    saveTodoItems();
    renderTodoList();
}

function toggleTodoComplete(id) {
    let updated = false;
    todoItems = todoItems.map(item => {
        if (item.id === id) {
            updated = true;
            return { ...item, completed: !item.completed };
        }
        return item;
    });
    if (updated) {
        saveTodoItems();
        renderTodoList();
    }
}

function deleteTodoItem(id) {
    const originalLength = todoItems.length;
    todoItems = todoItems.filter(item => item.id !== id);
    if (todoItems.length !== originalLength) {
        saveTodoItems();
        renderTodoList();
    }
}

function purgeExpiredTodos() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cutoff = startOfToday.getTime();
    const filtered = todoItems.filter(item => item.createdAt >= cutoff);
    if (filtered.length !== todoItems.length) {
        todoItems = filtered;
        saveTodoItems();
    }
}

function renderTodoList() {
    if (!todoList) return;
    todoList.innerHTML = '';
    if (!todoItems.length) {
        const emptyState = document.createElement('li');
        emptyState.className = 'todo-item empty';
        emptyState.textContent = 'No pending missions. Add one above!';
        todoList.appendChild(emptyState);
        return;
    }

    todoItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `todo-item${item.completed ? ' completed' : ''}`;

        const label = document.createElement('span');
        label.textContent = item.text;

        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-success';
        completeBtn.type = 'button';
        completeBtn.textContent = item.completed ? 'UNDO' : 'DONE';
        completeBtn.addEventListener('click', () => toggleTodoComplete(item.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'DEL';
        deleteBtn.addEventListener('click', () => deleteTodoItem(item.id));

        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(label);
        li.appendChild(actions);
        todoList.appendChild(li);
    });
}

function saveTodoItems() {
    try {
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoItems));
    } catch (err) {
        console.error('Failed to save todo items', err);
    }
}

function loadTodoItems() {
    try {
        const raw = localStorage.getItem(TODO_STORAGE_KEY);
        if (!raw) {
            todoItems = [];
            return;
        }
        const parsed = JSON.parse(raw);
        todoItems = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error('Failed to load todo items', err);
        todoItems = [];
    }
}

function generateDecryptionCode() {
    const segments = [];
    for (let i = 0; i < 3; i++) {
        segments.push(Math.random().toString(36).substring(2, 6).toUpperCase());
    }
    return segments.join('-');
}

function showSuccessModal(code) {
    if (!successModal || !successCodeDisplay) return;
    successCodeDisplay.textContent = code;
    successModal.style.display = 'flex';
    initiateBtn.disabled = false;
}

function handleFocusDurationChange() {
    if (!focusDurationInput) return;
    const raw = focusDurationInput.value.trim();
    if (raw === '') {
        return;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        return;
    }
    setFocusDuration(parsed);
}

function setFocusDuration(newDuration) {
    if (Number.isNaN(newDuration) || newDuration < 1) {
        if (focusDurationInput) {
            focusDurationInput.value = focusDuration;
        }
        return;
    }
    focusDuration = newDuration;
    if (focusDurationInput) {
        focusDurationInput.value = focusDuration;
    }
    progress = 0;
    sessionStartTimestamp = null;
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (isRunning) {
        isRunning = false;
        stopDecryptionStream();
    }
    updateUI();
}

function maybeAddDynamicLog() {
    if (!isRunning) return;
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (now - lastAmbientLogTimestamp < FIVE_MINUTES) return;
    const chance = Math.random();
    if (chance < 0.2) {
        addLogEntry("Signal noise detected. Auto-correcting...");
        lastAmbientLogTimestamp = now;
    } else if (chance < 0.3) {
        addLogEntry("Quantum checksum stable.", "info");
        lastAmbientLogTimestamp = now;
    }
}

function generateDecryptionLine() {
    const parts = [];
    const segmentCount = 2 + Math.floor(Math.random() * 3); // 2-4 segments
    for (let i = 0; i < segmentCount; i++) {
        parts.push(STREAM_SNIPPETS[Math.floor(Math.random() * STREAM_SNIPPETS.length)]);
    }
    const suffix = STREAM_SUFFIXES[Math.floor(Math.random() * STREAM_SUFFIXES.length)];
    const valueA = Math.random().toString(16).substring(2, 8).toUpperCase();
    const valueB = Math.random().toString(16).substring(2, 8).toUpperCase();
    const valueC = Math.random().toString(16).substring(2, 8).toUpperCase();

    const styleRoll = Math.random();
    if (styleRoll < 0.33) {
        // Shorter line
        return `${parts.slice(0, 2).join('_')}${suffix}${valueA}`;
    } else if (styleRoll < 0.66) {
        // Medium length
        return `${parts.join('_')}${suffix}${valueA}:${valueB}`;
    }

    // Long line spans most of the console width
    const extendedHex = `${valueA}${valueB}${valueC}${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
    return `${parts.join('_')}${suffix}${extendedHex}|CHK=${valueA}:${valueB}:${valueC}`;
}

function startDecryptionStream() {
    if (!decryptionOutput || decryptionStreamTimer) return;
    decryptionOutput.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const seed = document.createElement('div');
        seed.className = 'code-line';
        seed.textContent = generateDecryptionLine();
        decryptionOutput.appendChild(seed);
    }
    decryptionOutput.scrollTop = decryptionOutput.scrollHeight;

    decryptionStreamTimer = setInterval(() => {
        if (!isRunning) {
            stopDecryptionStream();
            return;
        }
        const lineEl = document.createElement('div');
        lineEl.className = 'code-line';
        lineEl.textContent = generateDecryptionLine();
        decryptionOutput.appendChild(lineEl);

        const maxLines = 80;
        while (decryptionOutput.children.length > maxLines) {
            decryptionOutput.removeChild(decryptionOutput.firstChild);
        }
        decryptionOutput.scrollTop = decryptionOutput.scrollHeight;
    }, 150);
}

function stopDecryptionStream() {
    if (decryptionStreamTimer) {
        clearInterval(decryptionStreamTimer);
        decryptionStreamTimer = null;
    }
}

function cacheDomElements() {
    progressBar = document.getElementById('progress-bar');
    progressText = document.getElementById('progress-text');
    initiateBtn = document.getElementById('initiate-btn');
    intrusionBtn = document.getElementById('intrusion-btn');
    distanceCounter = document.getElementById('distance-counter');
    milestoneText = document.getElementById('milestone-text');
    missionLog = document.getElementById('mission-log');
    intrusionModal = document.getElementById('intrusion-modal');
    closeModals = document.querySelectorAll('.close-modal');
    intrusionForm = document.getElementById('intrusion-form');
    timestampInput = document.getElementById('timestamp');
    decryptionOutput = document.getElementById('decryption-output');
    metricTotalSessions = document.getElementById('metric-total-sessions');
    metricStreak = document.getElementById('metric-streak');
    sessionHistoryContainer = document.getElementById('session-history');
    currentTimeDisplay = document.getElementById('current-time');
    focusDurationInput = document.getElementById('focus-duration-input');
    focusPresetButtons = document.querySelectorAll('.focus-preset');
    successModal = document.getElementById('success-modal');
    successCodeDisplay = document.getElementById('success-code');
    successModalCloseBtn = document.getElementById('success-modal-close');
    ratingModal = document.getElementById('rating-modal');
    ratingForm = document.getElementById('rating-form');
    todoInput = document.getElementById('todo-input');
    todoAddBtn = document.getElementById('todo-add-btn');
    todoList = document.getElementById('todo-list');
    missionModal = document.getElementById('mission-modal');
    missionForm = document.getElementById('mission-form');
    missionNameInput = document.getElementById('mission-name-input');
    missionCancelBtn = document.getElementById('mission-cancel-btn');
    missionNameValue = document.getElementById('mission-name-value');
    estimatedTimeContainer = document.getElementById('estimated-time-container');
    estimatedTimeDisplay = document.getElementById('estimated-time');
}

function updateTelemetry() {
    if (metricTotalSessions) {
        metricTotalSessions.textContent = `Total Sessions: ${totalSessions}`;
    }
    if (metricStreak) {
        metricStreak.textContent = `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`;
    }
}

function init() {
    cacheDomElements();
    // Set current timestamp for intrusion report
    updateTimestamp();

    // Set up event listeners
    if (initiateBtn) {
        initiateBtn.addEventListener('click', handleInitiateClick);
    }
    if (intrusionBtn) {
        intrusionBtn.addEventListener('click', showIntrusionModal);
    }

    if (todoAddBtn) {
        todoAddBtn.addEventListener('click', handleTodoSubmit);
    }
    if (todoInput) {
        todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleTodoSubmit();
            }
        });
    }

    // Close modals when clicking the X
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const modalEl = targetId ? document.getElementById(targetId) : null;
            if (targetId === 'rating-modal' && pendingSession) {
                addLogEntry('Mission rating required before completion.', 'warning');
                return;
            }
            if (modalEl) {
                if (modalEl === missionModal) {
                    handleMissionCancel();
                    return;
                }
                modalEl.style.display = 'none';
            }
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === intrusionModal) intrusionModal.style.display = 'none';
        if (e.target === successModal) successModal.style.display = 'none';
        if (e.target === missionModal) handleMissionCancel();
    });

    if (successModalCloseBtn) {
        successModalCloseBtn.addEventListener('click', () => {
            if (successModal) successModal.style.display = 'none';
        });
    }

    if (ratingForm) {
        ratingForm.addEventListener('submit', handleRatingSubmit);
    }
    if (missionForm) {
        missionForm.addEventListener('submit', handleMissionSubmit);
    }

    // Intrusion form submission
    if (intrusionForm) {
        intrusionForm.addEventListener('submit', logIntrusion);
    }

    if (focusDurationInput) {
        focusDurationInput.value = focusDuration;
        focusDurationInput.addEventListener('input', handleFocusDurationChange);
    }

    if (focusPresetButtons && focusPresetButtons.length) {
        focusPresetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.focusDuration, 10);
                if (!Number.isNaN(value)) {
                    setFocusDuration(value);
                }
            });
        });
    }

    if (missionCancelBtn) {
        missionCancelBtn.addEventListener('click', handleMissionCancel);
    }

    // Load saved state if available
    loadState();
    loadSessions();
    loadStreak();
    loadTodoItems();
    purgeExpiredTodos();
    renderTodoList();
    startCurrentTimeClock();
    updateMissionNameDisplay();
    updateUI();
}

function handleInitiateClick() {
    if (pendingSession) {
        addLogEntry('Finalize the pending mission rating before initiating a new session.', 'warning');
        return;
    }
    if (isRunning) return;
    openMissionModal();
}

function openMissionModal() {
    if (!missionModal || !missionForm) return;
    missionModal.style.display = 'flex';
    const presetValue = missionName || '';
    missionNameInput.value = presetValue;
    missionNameInput.focus();
}

function handleMissionSubmit(e) {
    e.preventDefault();
    if (!missionNameInput) return;
    const value = missionNameInput.value.trim();
    if (!value) {
        missionNameInput.focus();
        return;
    }
    missionName = value;
    updateMissionNameDisplay();
    handleMissionCancel(false);
    startDecryption();
}

function handleMissionCancel(resetValue = true) {
    if (missionModal) {
        missionModal.style.display = 'none';
    }
    if (resetValue && missionNameInput) {
        missionNameInput.value = missionName || '';
    }
}

function updateMissionNameDisplay() {
    if (missionNameValue) {
        missionNameValue.textContent = missionName || 'Awaiting assignment';
    }
}

function startCurrentTimeClock() {
    if (!currentTimeDisplay) return;
    if (currentTimeInterval) {
        clearTimeout(currentTimeInterval);
        currentTimeInterval = null;
    }
    const tick = () => {
        const now = new Date();
        currentTimeDisplay.textContent = now.toLocaleTimeString();
        const delay = Math.max(0, 1000 - now.getMilliseconds());
        currentTimeInterval = setTimeout(tick, delay || 1000);
    };
    tick();
}

// Update the UI based on current state
function updateUI() {
    // Update progress bar
    const duration = Math.max(1, focusDuration);
    const percentage = Math.min(100, (progress / duration) * 100);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(percentage)}%`;
    }

    // Update estimated time display
    if (isRunning && estimatedTimeContainer && estimatedTimeDisplay) {
        const remainingSeconds = Math.max(0, duration - progress);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        estimatedTimeDisplay.textContent = remainingMinutes;
        estimatedTimeContainer.style.display = 'block';
    } else if (!isRunning && estimatedTimeContainer) {
        estimatedTimeContainer.style.display = 'none';
    }

    // Update distance counter
    if (distanceCounter) {
        distanceCounter.textContent = `${totalDistance.toLocaleString()} Million Kilometers`;
    }

    // Update milestone text
    updateMilestoneText();

    // Save state
    saveState();
    updateTelemetry();
}

// Start the decryption timer
function startDecryption() {
    if (pendingSession) {
        addLogEntry('Finalize the pending mission rating before initiating a new session.', 'warning');
        return;
    }
    if (isRunning) return;

    isRunning = true;
    initiateBtn.disabled = true;

    if (!sessionStartTimestamp) {
        sessionStartTimestamp = Date.now();
    } else {
        // Resume from current progress if we ever support pauses.
        sessionStartTimestamp = Date.now() - (progress * 1000);
    }

    // Start the timer
    timer = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
        if (elapsedSeconds !== progress) {
            progress = elapsedSeconds;
            updateUI();
        }
        maybeAddDynamicLog();

        // Check if session is complete
        if (progress >= Math.max(1, focusDuration)) {
            completeDecryption();
        }
    }, 500);

    addLogEntry("INITIATING DECRYPTION SEQUENCE...", "success");
    addLogEntry("Focus mode activated. All non-essential systems offline.", "info");
    startDecryptionStream();
}

// Complete the decryption
function getDistanceReward() {
    const duration = Math.max(1, focusDuration);
    return (duration / BASE_DURATION) * BASE_DISTANCE_REWARD;
}

function getRatingMultiplier(ratingValue) {
    const clamped = Math.min(5, Math.max(1, ratingValue));
    return clamped / 3; // rating 3 keeps baseline distance, 5 amplifies reward
}

function completeDecryption() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isRunning = false;
    sessionStartTimestamp = null;
    stopDecryptionStream();
    const code = generateDecryptionCode();
    const baseDistance = getDistanceReward();
    pendingSession = { code, baseDistance };
    addLogEntry('Session complete. Awaiting performance rating...', 'info');
    // Reset progress
    progress = 0;
    if (estimatedTimeContainer) {
        estimatedTimeContainer.style.display = 'none';
    }
    if (ratingModal && ratingForm) {
        openRatingModal();
    } else {
        finalizeRatedSession(3);
    }

    updateUI();
}

function openRatingModal() {
    if (!ratingModal) return;
    if (ratingForm) {
        ratingForm.reset();
    }
    ratingModal.style.display = 'flex';
}

function handleRatingSubmit(e) {
    e.preventDefault();
    const formData = new FormData(ratingForm);
    const selectedRating = Number(formData.get('session-rating')) || 3;
    ratingModal.style.display = 'none';
    finalizeRatedSession(selectedRating);
}

function finalizeRatedSession(ratingValue = 3) {
    if (!pendingSession) return;
    const multiplier = getRatingMultiplier(ratingValue);
    const adjustedDistance = pendingSession.baseDistance * multiplier;
    const { code } = pendingSession;
    totalDistance += adjustedDistance;
    totalSessions += 1;
    updateStreak();
    addLogEntry(`Decryption success! Rating ${ratingValue}/5 yielded +${adjustedDistance.toFixed(2)} M km. Code: ${code}`, 'success');
    checkMilestone(adjustedDistance);
    recordSession(adjustedDistance);
    pendingSession = null;
    updateUI();
    showSuccessModal(code);
}

function recordSession(distanceThisSession = getDistanceReward()) {
    const newEntry = {
        timestamp: new Date().toISOString(),
        distance: distanceThisSession
    };
    sessionHistory.unshift(newEntry);
    if (sessionHistory.length > 50) {
        sessionHistory.pop();
    }
    renderSessionHistory();
    saveSessions();
}

function renderSessionHistory() {
    if (!sessionHistoryContainer) {
        cacheDomElements();
    }
    if (!sessionHistoryContainer) return;
    sessionHistoryContainer.innerHTML = '';
    sessionHistory.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'history-entry';
        const when = new Date(entry.timestamp).toLocaleString();
        div.textContent = `${when} :: Δ${entry.distance.toFixed(2)} M km`;
        sessionHistoryContainer.appendChild(div);
    });
}

function saveSessions() {
    const payload = {
        totalSessions,
        sessionHistory
    };
    localStorage.setItem('astroFocusSessions', JSON.stringify(payload));
}

function loadSessions() {
    const raw = localStorage.getItem('astroFocusSessions');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        totalSessions = data.totalSessions || 0;
        sessionHistory = Array.isArray(data.sessionHistory) ? data.sessionHistory : [];
        renderSessionHistory();
    } catch (err) {
        console.error('Failed to load session data', err);
    }
}

// Streak Management Functions
function getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function checkStreak() {
    const today = getDateString();
    
    if (!lastSessionDate) {
        // No previous session, streak is 0
        currentStreak = 0;
        return;
    }
    
    const lastDate = new Date(lastSessionDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
        // Same day, keep current streak
        return;
    } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        currentStreak += 1;
        lastSessionDate = today;
    } else {
        // Streak broken, reset to 1 (today's session)
        currentStreak = 1;
        lastSessionDate = today;
    }
}

function updateStreak() {
    const today = getDateString();
    const previousStreak = currentStreak;
    
    if (!lastSessionDate) {
        // First session ever
        currentStreak = 1;
        lastSessionDate = today;
        addLogEntry(`Streak initiated! Day 1 of your focus journey.`, 'success');
    } else {
        const lastDate = new Date(lastSessionDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            // Same day, don't increment but ensure streak is at least 1
            if (currentStreak === 0) {
                currentStreak = 1;
            }
        } else if (daysDiff === 1) {
            // Consecutive day, increment streak
            currentStreak += 1;
            lastSessionDate = today;
            if (currentStreak > previousStreak) {
                addLogEntry(`Streak extended! Day ${currentStreak} of consecutive focus.`, 'success');
            }
        } else {
            // Streak broken, reset to 1
            currentStreak = 1;
            lastSessionDate = today;
            addLogEntry(`Streak reset. Starting fresh with day 1.`, 'warning');
        }
    }
    
    saveStreak();
}

function saveStreak() {
    try {
        const streakData = {
            currentStreak,
            lastSessionDate
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakData));
    } catch (err) {
        console.error('Failed to save streak data', err);
    }
}

function loadStreak() {
    try {
        const raw = localStorage.getItem(STREAK_STORAGE_KEY);
        if (!raw) {
            currentStreak = 0;
            lastSessionDate = null;
            return;
        }
        const data = JSON.parse(raw);
        currentStreak = data.currentStreak || 0;
        lastSessionDate = data.lastSessionDate || null;
        
        // Check if streak should be reset (if last session was more than 1 day ago)
        if (lastSessionDate) {
            const today = getDateString();
            const lastDate = new Date(lastSessionDate);
            const todayDate = new Date(today);
            const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 1) {
                // Streak broken, reset
                currentStreak = 0;
                lastSessionDate = null;
                saveStreak();
            }
        }
    } catch (err) {
        console.error('Failed to load streak data', err);
        currentStreak = 0;
        lastSessionDate = null;
    }
}

// Show intrusion modal
function showIntrusionModal() {
    updateTimestamp();
    if (intrusionForm) {
        intrusionForm.reset();
    }
    if (intrusionModal) {
        intrusionModal.style.display = 'flex';
    }
}

// Log an intrusion
function logIntrusion(e) {
    e.preventDefault();
    
    const source = document.getElementById('source').value;
    const cause = document.getElementById('cause').value;
    
    // Add log entry
    addLogEntry(`INTRUSION DETECTED! Source: ${source} - ${cause}`, "error");
    
    // Reset progress
    progress = 0;
    isRunning = false;
    clearInterval(timer);
    if (estimatedTimeContainer) {
        estimatedTimeContainer.style.display = 'none';
    }
    if (pendingSession) {
        pendingSession = null;
        if (ratingModal) {
            ratingModal.style.display = 'none';
        }
    }
    if (totalDistance > 0) {
        const penalty = totalDistance * 0.1;
        totalDistance = Math.max(0, totalDistance - penalty);
        addLogEntry(`Security breach penalty applied: -${penalty.toFixed(2)} M km.`, 'warning');
    }
    
    // Close modal and reset UI
    intrusionModal.style.display = 'none';
    initiateBtn.disabled = false;
    updateUI();
}

// Update the timestamp field
function updateTimestamp() {
    if (!timestampInput) return;
    const now = new Date();
    timestampInput.value = now.toISOString().replace('T', ' ').substring(0, 19);
}

// Add an entry to the mission log
function addLogEntry(message, type = '') {
    if (!missionLog) {
        cacheDomElements();
    }
    if (!missionLog) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${new Date().toLocaleTimeString()} - ${message}`;
    
    missionLog.prepend(entry);
    
    // Limit log entries to prevent performance issues
    if (missionLog.children.length > 50) {
        missionLog.removeChild(missionLog.lastChild);
    }
}

// Update milestone text based on current distance
function updateMilestoneText() {
    // Find the highest milestone we've reached
    let currentMilestone = MILESTONES[0];
    
    for (let i = 0; i < MILESTONES.length; i++) {
        if (totalDistance >= MILESTONES[i].distance) {
            currentMilestone = MILESTONES[i];
        } else {
            break;
        }
    }
    
    milestoneText.textContent = currentMilestone.message;
}

// Check if we've reached a new milestone
function checkMilestone(distanceAdded = 0) {
    const currentMilestoneIndex = MILESTONES.findIndex(m => m.distance > totalDistance) - 1;
    
    if (currentMilestoneIndex >= 0) {
        const milestone = MILESTONES[currentMilestoneIndex];
        
        // Check if we've just reached this milestone
        if (totalDistance - distanceAdded < milestone.distance && totalDistance >= milestone.distance) {
            addLogEntry(`MILESTONE REACHED: ${milestone.message}`, "warning");
            milestoneText.textContent = milestone.message;
            milestoneText.classList.add('glow');
            
            // Remove glow after animation
            setTimeout(() => {
                milestoneText.classList.remove('glow');
            }, 3000);
        }
    }
}

// Save application state to localStorage
function saveState() {
    const state = {
        totalDistance,
        logEntries: Array.from(missionLog.children).slice(0, 50).map(entry => ({
            text: entry.textContent,
            className: entry.className
        })).reverse() // Reverse to maintain order when loading
    };
    
    localStorage.setItem('astroFocusState', JSON.stringify(state));
}

// Load application state from localStorage
function loadState() {
    const savedState = localStorage.getItem('astroFocusState');
    
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            
            totalDistance = state.totalDistance || 0;
            
            // Clear existing log entries
            missionLog.innerHTML = '';
            
            // Add saved log entries
            if (Array.isArray(state.logEntries)) {
                state.logEntries.reverse().forEach(entry => {
                    const logEntry = document.createElement('div');
                    logEntry.className = entry.className || 'log-entry';
                    logEntry.textContent = entry.text;
                    missionLog.appendChild(logEntry);
                });
            }
            
            // Add a log entry indicating the session has been loaded
            addLogEntry("Mission Control reconnected. Systems nominal.", "info");
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
