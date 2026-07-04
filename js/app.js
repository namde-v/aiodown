/* ==========================================================================
   AioDown Downloader Application Logic - Vanilla ES6 Javascript
   ========================================================================== */

// --- Default Configurations ---
const DEFAULT_SETTINGS = {
    instanceUrl: 'https://grapefruit.clxxped.lol',
    apiKey: '',
    videoQuality: '1080',
    audioFormat: 'mp3',
    filenameStyle: 'basic',
    tiktokAudio: false,
    allowH265: false,
    convertGif: false,
    disableMetadata: true,
    alwaysProxy: false
};

// --- Fallback Public Instances List ---
const FALLBACK_INSTANCES = [
    'https://api.cobalt.tools',
    'https://grapefruit.clxxped.lol',
    'https://nuko-c.meowing.de',
    'https://api.qwkuns.me',
    'https://cobaltapi.squair.xyz',
    'https://dog.kittycat.boo',
    'https://lime.clxxped.lol',
    'https://api.cobalt.liubquanti.click',
    'https://api.cobalt.blackcat.sweeux.org',
    'https://melon.clxxped.lol'
];

// --- App State ---
let appState = {
    settings: { ...DEFAULT_SETTINGS },
    activeInstance: '',
    instancesList: [...FALLBACK_INSTANCES],
    currentDownloadData: null,
    isCheckingInstance: false
};

// --- DOM Elements ---
const DOM = {
    // Header
    headerStatusBadge: document.getElementById('headerStatusBadge'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    
    // Main UI
    mediaUrlInput: document.getElementById('mediaUrlInput'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    brandIndicator: document.getElementById('brandIndicator'),
    quickMode: document.getElementById('quickMode'),
    quickQuality: document.getElementById('quickQuality'),
    downloadBtn: document.getElementById('downloadBtn'),
    
    // Loading State
    loadingSection: document.getElementById('loadingSection'),
    loadingStatusTitle: document.getElementById('loadingStatusTitle'),
    loadingStatusText: document.getElementById('loadingStatusText'),
    stepConnect: document.getElementById('step-connect'),
    stepProcess: document.getElementById('step-process'),
    stepReady: document.getElementById('step-ready'),
    
    // Results Section
    resultsSection: document.getElementById('resultsSection'),
    resultsPlatformBadge: document.getElementById('resultsPlatformBadge'),
    resultsMediaTitle: document.getElementById('resultsMediaTitle'),
    previewBox: document.getElementById('previewBox'),
    mediaDetailsGrid: document.getElementById('mediaDetailsGrid'),
    detailType: document.getElementById('detailType'),
    detailQuality: document.getElementById('detailQuality'),
    detailDuration: document.getElementById('detailDuration'),
    saveFileBtn: document.getElementById('saveFileBtn'),
    copyDirectLinkBtn: document.getElementById('copyDirectLinkBtn'),
    openExternalLinkBtn: document.getElementById('openExternalLinkBtn'),
    resetBtn: document.getElementById('resetBtn'),
    downloaderSection: document.querySelector('.downloader-section'),
    
    // Settings Drawer
    settingsDrawer: document.getElementById('settingsDrawer'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsInstanceUrl: document.getElementById('settingsInstanceUrl'),
    instanceQuickSelect: document.getElementById('instanceQuickSelect'),
    autoDetectInstanceBtn: document.getElementById('autoDetectInstanceBtn'),
    connectionStatusVal: document.getElementById('connectionStatusVal'),
    serverDetailsText: document.getElementById('serverDetailsText'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    settingsApiKey: document.getElementById('settingsApiKey'),
    settingsVideoQuality: document.getElementById('settingsVideoQuality'),
    settingsAudioFormat: document.getElementById('settingsAudioFormat'),
    settingsFilenameStyle: document.getElementById('settingsFilenameStyle'),
    settingsTikTokAudio: document.getElementById('settingsTikTokAudio'),
    settingsAllowH265: document.getElementById('settingsAllowH265'),
    settingsConvertGif: document.getElementById('settingsConvertGif'),
    settingsDisableMetadata: document.getElementById('settingsDisableMetadata'),
    settingsAlwaysProxy: document.getElementById('settingsAlwaysProxy'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initEventListeners();
    checkInstanceStatus(appState.settings.instanceUrl);
    fetchLiveInstancesList();
});

// --- Settings Management ---
function loadSettings() {
    const saved = localStorage.getItem('aiodown_settings');
    if (saved) {
        try {
            appState.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
            appState.settings = { ...DEFAULT_SETTINGS };
        }
    } else {
        appState.settings = { ...DEFAULT_SETTINGS };
    }
    
    appState.activeInstance = appState.settings.instanceUrl;
    applySettingsToUI();
}

function saveSettings(settingsToSave) {
    appState.settings = { ...appState.settings, ...settingsToSave };
    appState.activeInstance = appState.settings.instanceUrl;
    localStorage.setItem('aiodown_settings', JSON.stringify(appState.settings));
    showToast('Settings saved successfully!', 'success');
    checkInstanceStatus(appState.activeInstance);
}

function resetSettings() {
    appState.settings = { ...DEFAULT_SETTINGS };
    applySettingsToUI();
    localStorage.removeItem('aiodown_settings');
    showToast('Settings reset to defaults', 'info');
    checkInstanceStatus(appState.settings.instanceUrl);
}

function applySettingsToUI() {
    DOM.settingsInstanceUrl.value = appState.settings.instanceUrl;
    DOM.settingsApiKey.value = appState.settings.apiKey;
    DOM.settingsVideoQuality.value = appState.settings.videoQuality;
    DOM.settingsAudioFormat.value = appState.settings.audioFormat;
    DOM.settingsFilenameStyle.value = appState.settings.filenameStyle;
    
    DOM.settingsTikTokAudio.checked = appState.settings.tiktokAudio;
    DOM.settingsAllowH265.checked = appState.settings.allowH265;
    DOM.settingsConvertGif.checked = appState.settings.convertGif;
    DOM.settingsDisableMetadata.checked = appState.settings.disableMetadata;
    DOM.settingsAlwaysProxy.checked = appState.settings.alwaysProxy;
    
    // Set matching option in quick select if present
    DOM.instanceQuickSelect.value = appState.settings.instanceUrl;
    DOM.quickQuality.value = appState.settings.videoQuality;
}

// --- Live Instances Fetching ---
async function fetchLiveInstancesList() {
    try {
        // Fetch working list from community tracker (handles CORS issues via try/catch)
        const response = await fetch('https://cobalt.directory/api/working?type=api', {
            signal: AbortSignal.timeout(6000)
        });
        if (!response.ok) throw new Error('Network response not ok');
        const result = await response.json();
        
        if (result && result.data) {
            // Flatten list of all APIs across services to get unique list of instances
            const allApis = [];
            Object.keys(result.data).forEach(key => {
                if (Array.isArray(result.data[key])) {
                    allApis.push(...result.data[key]);
                }
            });
            
            const uniqueApis = [...new Set(allApis)].filter(url => url.startsWith('http'));
            
            if (uniqueApis.length > 0) {
                appState.instancesList = uniqueApis;
                rebuildInstanceSelectorDropdown();
            }
        }
    } catch (e) {
        console.warn('Could not fetch community Cobalt directory, using fallback instances:', e.message);
        // We still have fallback instances
        rebuildInstanceSelectorDropdown();
    }
}

function rebuildInstanceSelectorDropdown() {
    const currentVal = DOM.instanceQuickSelect.value;
    
    // Clear list
    DOM.instanceQuickSelect.innerHTML = '';
    
    // Add official
    const officialOption = document.createElement('option');
    officialOption.value = 'https://api.cobalt.tools';
    officialOption.textContent = 'Official (api.cobalt.tools)';
    DOM.instanceQuickSelect.appendChild(officialOption);
    
    // Add other instances from list
    appState.instancesList.forEach(url => {
        if (url !== 'https://api.cobalt.tools') {
            const opt = document.createElement('option');
            opt.value = url;
            // Get hostname for display
            try {
                const hostname = new URL(url).hostname;
                opt.textContent = hostname;
            } catch (e) {
                opt.textContent = url;
            }
            DOM.instanceQuickSelect.appendChild(opt);
        }
    });
    
    // Restore value if available in new list, otherwise default
    if (appState.instancesList.includes(currentVal) || currentVal === 'https://api.cobalt.tools') {
        DOM.instanceQuickSelect.value = currentVal;
    } else {
        DOM.instanceQuickSelect.value = appState.settings.instanceUrl;
    }
}

// --- Status & Speed Testing ---
async function checkInstanceStatus(url, showFeedback = false) {
    if (appState.isCheckingInstance) return;
    appState.isCheckingInstance = true;
    
    // Update badge to checking state
    updateStatusBadge('checking', 'Testing...');
    DOM.connectionStatusVal.textContent = 'Testing...';
    DOM.connectionStatusVal.className = 'status-value text-amber';
    DOM.serverDetailsText.style.display = 'none';
    
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
    const startTime = performance.now();
    
    try {
        // Try serverInfo endpoint
        const response = await fetch(`${cleanUrl}/api/serverInfo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(appState.settings.apiKey ? { 'Authorization': `Api-Key ${appState.settings.apiKey}` } : {})
            },
            signal: AbortSignal.timeout(5000)
        });
        
        const latency = Math.round(performance.now() - startTime);
        
        if (response.ok) {
            const data = await response.json();
            const version = data.version || 'Unknown';
            const commit = data.commit ? ` (${data.commit.substring(0, 7)})` : '';
            
            updateStatusBadge('online', `Online (${latency}ms)`);
            DOM.connectionStatusVal.textContent = `Online (${latency}ms)`;
            DOM.connectionStatusVal.className = 'status-value text-emerald';
            DOM.serverDetailsText.textContent = `Version: ${version}${commit}\nURL: ${cleanUrl}\nEngine: V8 Node.js`;
            DOM.serverDetailsText.style.display = 'block';
            
            if (showFeedback) showToast(`Connected! Latency: ${latency}ms (Version ${version})`, 'success');
        } else {
            // Maybe ServerInfo doesn't exist but server is alive (older version, custom setup, etc.)
            // Try standard base URL GET or HEAD
            throw new Error(`Server returned code ${response.status}`);
        }
    } catch (e) {
        // Double check with a fallback test to base domain
        try {
            const fallbackStartTime = performance.now();
            const fallbackResponse = await fetch(`${cleanUrl}/`, { 
                method: 'GET', 
                signal: AbortSignal.timeout(4000) 
            });
            const latency = Math.round(performance.now() - fallbackStartTime);
            
            // If we get here, the server is reachable and returned a response
            updateStatusBadge('online', `Online (${latency}ms)`);
            DOM.connectionStatusVal.textContent = `Online (${latency}ms)`;
            DOM.connectionStatusVal.className = 'status-value text-emerald';
            DOM.serverDetailsText.textContent = `Server reachable at root / endpoint.\nURL: ${cleanUrl}\nCORS policy: Active`;
            DOM.serverDetailsText.style.display = 'block';
            
            if (showFeedback) showToast(`Reachable! Latency: ${latency}ms`, 'success');
        } catch (err) {
            // Completely offline
            updateStatusBadge('offline', 'Offline');
            DOM.connectionStatusVal.textContent = 'Offline / Unreachable';
            DOM.connectionStatusVal.className = 'status-value text-rose';
            DOM.serverDetailsText.textContent = `Error: ${e.message || 'Connection timeout'}\nEnsure URL is correct and server supports CORS requests.`;
            DOM.serverDetailsText.style.display = 'block';
            
            if (showFeedback) showToast('Failed to connect to instance!', 'error');
        }
    } finally {
        appState.isCheckingInstance = false;
    }
}

function updateStatusBadge(state, text) {
    DOM.headerStatusBadge.className = `status-badge ${state}`;
    DOM.headerStatusBadge.querySelector('.status-text').textContent = text;
}

// --- Auto Detect Fastest Instance ---
async function pingInstance(url) {
    const cleanUrl = url.replace(/\/$/, '');
    const start = performance.now();
    try {
        // Try the official serverInfo endpoint which is CORS-friendly and extremely lightweight
        const res = await fetch(`${cleanUrl}/api/serverInfo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(appState.settings.apiKey ? { 'Authorization': `Api-Key ${appState.settings.apiKey}` } : {})
            },
            signal: AbortSignal.timeout(2500)
        });
        
        if (res.ok) {
            const latency = performance.now() - start;
            return { url, latency, ok: true };
        }
    } catch (e) {
        // Fall through to fallback
    }
    
    try {
        // Fallback: ping root with no-cors to measure connection latency without CORS blocking
        const startFallback = performance.now();
        await fetch(`${cleanUrl}/`, {
            method: 'GET',
            mode: 'no-cors',
            signal: AbortSignal.timeout(2000)
        });
        const latency = performance.now() - startFallback;
        return { url, latency, ok: true };
    } catch (e) {
        return { url, latency: Infinity, ok: false };
    }
}

async function autoDetectFastestInstance() {
    showToast('Scanning active Cobalt nodes in parallel...', 'info');
    DOM.autoDetectInstanceBtn.disabled = true;
    DOM.autoDetectInstanceBtn.textContent = '⌛ Testing...';
    
    // Test all instances concurrently
    const testList = [...new Set([
        appState.settings.instanceUrl,
        'https://api.cobalt.tools',
        ...appState.instancesList
    ])].filter(Boolean);
    
    try {
        const pingPromises = testList.map(url => pingInstance(url));
        const results = await Promise.all(pingPromises);
        
        const successful = results.filter(r => r.ok && r.latency < Infinity);
        successful.sort((a, b) => a.latency - b.latency);
        
        if (successful.length > 0) {
            const best = successful[0];
            const fastestUrl = best.url;
            const latency = Math.round(best.latency);
            
            DOM.settingsInstanceUrl.value = fastestUrl;
            DOM.instanceQuickSelect.value = fastestUrl;
            
            // Instantly apply and persist settings
            appState.settings.instanceUrl = fastestUrl;
            appState.activeInstance = fastestUrl;
            localStorage.setItem('aiodown_settings', JSON.stringify(appState.settings));
            applySettingsToUI();
            
            showToast(`Auto-selected fastest: ${new URL(fastestUrl).hostname} (${latency}ms)`, 'success');
            checkInstanceStatus(fastestUrl);
        } else {
            showToast('No responsive instances found! Using default.', 'error');
        }
    } catch (err) {
        console.error('Error auto-detecting fastest instance:', err);
        showToast('Error during auto-detection scan.', 'error');
    } finally {
        DOM.autoDetectInstanceBtn.disabled = false;
        DOM.autoDetectInstanceBtn.textContent = '⚡ Find Best';
    }
}

// --- UI Interaction Handlers ---
function initEventListeners() {
    // Input interaction
    DOM.mediaUrlInput.addEventListener('input', handleUrlInput);
    DOM.clearInputBtn.addEventListener('click', () => {
        DOM.mediaUrlInput.value = '';
        DOM.clearInputBtn.style.display = 'none';
        setBrandActive('default');
        DOM.mediaUrlInput.focus();
    });
    
    // Quick options synchronizing with settings
    DOM.quickQuality.addEventListener('change', () => {
        DOM.settingsVideoQuality.value = DOM.quickQuality.value;
        appState.settings.videoQuality = DOM.quickQuality.value;
        localStorage.setItem('aiodown_settings', JSON.stringify(appState.settings));
    });
    
    // Form submission
    DOM.downloadBtn.addEventListener('click', startDownloadProcess);
    DOM.mediaUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startDownloadProcess();
        }
    });
    
    // Results handlers
    DOM.resetBtn.addEventListener('click', resetUIState);
    DOM.copyDirectLinkBtn.addEventListener('click', copyDirectLink);
    DOM.saveFileBtn.addEventListener('click', saveMediaLocal);
    
    // Settings Drawer Toggles
    DOM.openSettingsBtn.addEventListener('click', toggleSettingsDrawer);
    DOM.closeSettingsBtn.addEventListener('click', toggleSettingsDrawer);
    DOM.settingsOverlay.addEventListener('click', toggleSettingsDrawer);
    DOM.headerStatusBadge.addEventListener('click', () => {
        if (!DOM.settingsDrawer.classList.contains('open')) {
            toggleSettingsDrawer();
        }
    });
    
    // Settings actions
    DOM.testConnectionBtn.addEventListener('click', () => {
        checkInstanceStatus(DOM.settingsInstanceUrl.value, true);
    });
    
    DOM.instanceQuickSelect.addEventListener('change', () => {
        const val = DOM.instanceQuickSelect.value;
        DOM.settingsInstanceUrl.value = val;
        appState.settings.instanceUrl = val;
        appState.activeInstance = val;
        localStorage.setItem('aiodown_settings', JSON.stringify(appState.settings));
        checkInstanceStatus(val);
    });
    
    DOM.autoDetectInstanceBtn.addEventListener('click', autoDetectFastestInstance);
    
    DOM.resetSettingsBtn.addEventListener('click', resetSettings);
    DOM.saveSettingsBtn.addEventListener('click', () => {
        saveSettings({
            instanceUrl: DOM.settingsInstanceUrl.value.trim(),
            apiKey: DOM.settingsApiKey.value.trim(),
            videoQuality: DOM.settingsVideoQuality.value,
            audioFormat: DOM.settingsAudioFormat.value,
            filenameStyle: DOM.settingsFilenameStyle.value,
            tiktokAudio: DOM.settingsTikTokAudio.checked,
            allowH265: DOM.settingsAllowH265.checked,
            convertGif: DOM.settingsConvertGif.checked,
            disableMetadata: DOM.settingsDisableMetadata.checked,
            alwaysProxy: DOM.settingsAlwaysProxy.checked
        });
        toggleSettingsDrawer();
    });
}

function handleUrlInput() {
    const url = DOM.mediaUrlInput.value.trim();
    DOM.clearInputBtn.style.display = url ? 'block' : 'none';
    
    if (!url) {
        setBrandActive('default');
        return;
    }
    
    // Brand regex matches
    if (/youtube\.com|youtu\.be/i.test(url)) {
        setBrandActive('youtube');
    } else if (/tiktok\.com/i.test(url)) {
        setBrandActive('tiktok');
    } else if (/instagram\.com/i.test(url)) {
        setBrandActive('instagram');
    } else if (/twitter\.com|x\.com/i.test(url)) {
        setBrandActive('twitter');
    } else if (/facebook\.com|fb\.watch/i.test(url)) {
        setBrandActive('facebook');
    } else if (/reddit\.com/i.test(url)) {
        setBrandActive('reddit');
    } else if (/soundcloud\.com/i.test(url)) {
        setBrandActive('soundcloud');
    } else {
        setBrandActive('default');
    }
}

function setBrandActive(brand) {
    // Remove active state from all icons
    const icons = DOM.brandIndicator.querySelectorAll('.brand-icon');
    icons.forEach(icon => icon.classList.remove('active'));
    
    // Reset input wrapper brand classes
    DOM.downloaderSection.querySelector('.input-wrapper').className = 'input-wrapper';
    
    // Activate target
    const targetIcon = document.getElementById(`icon-${brand}`);
    if (targetIcon) {
        targetIcon.classList.add('active');
    }
    
    if (brand !== 'default') {
        DOM.downloaderSection.querySelector('.input-wrapper').classList.add(`brand-${brand}`);
    }
}

function toggleSettingsDrawer() {
    DOM.settingsDrawer.classList.toggle('open');
    if (DOM.settingsDrawer.classList.contains('open')) {
        applySettingsToUI();
    }
}

// --- Toast Notifications ---
function showToast(text, type = 'info') {
    // Remove existing toast if any
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();
    
    // Build toast
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    
    // Inline icons
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon text-emerald"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon text-rose"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon text-cyan"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
    
    toast.innerHTML = `
        ${iconSvg}
        <span class="toast-text">${text}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- Download Logic ---
async function startDownloadProcess() {
    const url = DOM.mediaUrlInput.value.trim();
    if (!url) {
        showToast('Please paste a link first!', 'error');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showToast('Invalid URL format! Must start with http:// or https://', 'error');
        return;
    }
    
    // Reset loader states
    DOM.stepConnect.className = 'step active';
    DOM.stepProcess.className = 'step';
    DOM.stepReady.className = 'step';
    
    DOM.downloaderSection.style.display = 'none';
    DOM.resultsSection.style.display = 'none';
    DOM.loadingSection.style.display = 'flex';
    
    // Get list of instances to try: start with active one, then follow with others
    const active = appState.activeInstance;
    const remaining = appState.instancesList.filter(url => url !== active);
    const instancesToTry = [active, ...remaining];
    
    try {
        const result = await attemptDownloadWithFallback(url, instancesToTry);
        appState.currentDownloadData = result;
        
        // Step 3: Ready
        DOM.stepConnect.className = 'step completed';
        DOM.stepProcess.className = 'step completed';
        DOM.stepReady.className = 'step activeCompleted';
        
        updateLoadingProgress('Ready!', 'Building player preview...', true);
        
        // Save successfully working instance as the active one!
        appState.settings.instanceUrl = appState.activeInstance;
        localStorage.setItem('aiodown_settings', JSON.stringify(appState.settings));
        applySettingsToUI();
        
        setTimeout(() => {
            renderDownloadResults(result, url);
        }, 800);
        
    } catch (e) {
        console.error('All download attempts failed:', e);
        showToast(e.message || 'Failed to process media after trying multiple nodes!', 'error');
        resetUIState();
    }
}

async function attemptDownloadWithFallback(mediaUrl, instancesList, index = 0) {
    if (index >= instancesList.length) {
        throw new Error('All community nodes failed to process the request. Try hosting your own instance or entering a custom key.');
    }
    
    const currentInstance = instancesList[index];
    appState.activeInstance = currentInstance;
    
    // Update badge/input to show current attempt
    let hostname = 'Cobalt Node';
    try {
        hostname = new URL(currentInstance).hostname;
    } catch(err) {}
    
    updateLoadingProgress(
        `Fetching Media (${index + 1}/${instancesList.length})`, 
        `Connecting to community node: ${hostname}...`
    );
    checkInstanceStatus(currentInstance); // Update badge in header in background
    
    const cleanInstanceUrl = currentInstance.replace(/\/$/, '');
    
    try {
        const bodyPayload = {
            url: mediaUrl,
            videoQuality: appState.settings.videoQuality,
            audioFormat: appState.settings.audioFormat,
            audioBitrate: '128',
            downloadMode: DOM.quickMode.value,
            filenameStyle: appState.settings.filenameStyle,
            disableMetadata: appState.settings.disableMetadata,
            alwaysProxy: appState.settings.alwaysProxy,
            allowH265: appState.settings.allowH265,
            convertGif: appState.settings.convertGif,
            tiktokFullAudio: appState.settings.tiktokAudio
        };
        
        const response = await fetch(`${cleanInstanceUrl}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(appState.settings.apiKey ? { 'Authorization': `Api-Key ${appState.settings.apiKey}` } : {})
            },
            body: JSON.stringify(bodyPayload),
            signal: AbortSignal.timeout(20000) // 20s timeout per instance to keep it snappy
        });
        
        let errData = null;
        let responseJson = null;
        
        if (!response.ok) {
            try {
                errData = await response.json();
            } catch (err) {}
            
            // Check if it's a node-specific issue (auth required, rate limits, server error)
            if (isNodeSpecificError(errData, response.status)) {
                console.warn(`Node ${hostname} failed with auth/rate/server error. Rotating...`);
                showToast(`Node ${hostname} required auth/rate-limited. Trying next...`, 'info');
                return await attemptDownloadWithFallback(mediaUrl, instancesList, index + 1);
            }
            
            // Otherwise, it's a general issue (e.g. invalid URL, unsupported site) - stop immediately
            const errMsg = errData?.text || errData?.error?.code || `Server returned status code ${response.status}`;
            throw new Error(errMsg);
        }
        
        responseJson = await response.json();
        
        if (responseJson.status === 'error') {
            // Check if returned error indicates auth/rate limits
            if (isNodeSpecificError(responseJson, 200)) {
                console.warn(`Node ${hostname} returned processing auth error. Rotating...`);
                showToast(`Node ${hostname} required auth. Trying next...`, 'info');
                return await attemptDownloadWithFallback(mediaUrl, instancesList, index + 1);
            }
            throw new Error(responseJson.text || 'Cobalt API encountered an processing error.');
        }
        
        return responseJson;
        
    } catch (e) {
        // If it's a fetch TypeError (CORS/offline) or AbortError (timeout)
        const isNetworkOrTimeout = e.name === 'TypeError' || e.name === 'TimeoutError' || e.message.includes('timeout') || e.message.includes('fetch');
        
        if (isNetworkOrTimeout) {
            console.warn(`Node ${hostname} is unreachable or timed out. Rotating...`);
            showToast(`Node ${hostname} timed out/offline. Trying next...`, 'info');
            return await attemptDownloadWithFallback(mediaUrl, instancesList, index + 1);
        }
        
        // Otherwise, rethrow the actual error to stop process
        throw e;
    }
}

function isNodeSpecificError(errorData, statusCode) {
    if (statusCode === 401 || statusCode === 403 || statusCode === 429 || statusCode >= 500) {
        return true;
    }
    
    if (errorData) {
        // Handle nested error object or plain string
        const errorCode = errorData.error?.code || errorData.error || '';
        const errorText = errorData.text || '';
        
        const isAuth = /auth|jwt|token|key|turnstile|captcha/i.test(errorCode) || /auth|jwt|token|key|turnstile|captcha/i.test(errorText);
        const isRateLimit = /rate/i.test(errorCode) || /rate/i.test(errorText);
        const isConnection = /connect|fetch|tunnel|proxy|network/i.test(errorText);
        
        if (isAuth || isRateLimit || isConnection) {
            return true;
        }
    }
    
    return false;
}

function updateLoadingProgress(title, text, completed = false) {
    DOM.loadingStatusTitle.textContent = title;
    DOM.loadingStatusText.textContent = text;
    DOM.loadingStatusText.className = completed ? '' : 'anim-dots';
}

function resetUIState() {
    DOM.loadingSection.style.display = 'none';
    DOM.resultsSection.style.display = 'none';
    DOM.downloaderSection.style.display = 'flex';
    appState.currentDownloadData = null;
}

// --- Render Results ---
function renderDownloadResults(data, originalUrl) {
    DOM.loadingSection.style.display = 'none';
    DOM.resultsSection.style.display = 'block';
    
    // Detect platform name from original URL
    let platform = 'Social Media';
    try {
        const domain = new URL(originalUrl).hostname.replace('www.', '');
        const parts = domain.split('.');
        platform = parts[parts.length - 2].toUpperCase();
    } catch (e) {}
    
    DOM.resultsPlatformBadge.textContent = platform;
    DOM.resultsMediaTitle.textContent = data.filename || 'Processed Media File';
    
    // Clear preview box
    DOM.previewBox.innerHTML = '';
    
    // Details Grid Initial Values
    DOM.mediaDetailsGrid.style.display = 'none';
    DOM.detailType.textContent = '-';
    DOM.detailQuality.textContent = '-';
    DOM.detailDuration.textContent = '-';
    
    // Show correct visual players depending on response status
    if (data.status === 'redirect' || data.status === 'tunnel') {
        const mediaUrl = data.url;
        DOM.openExternalLinkBtn.href = mediaUrl;
        
        // Determine player type
        const downloadMode = DOM.quickMode.value;
        
        if (downloadMode === 'audio') {
            // Audio Player
            const audio = document.createElement('audio');
            audio.src = mediaUrl;
            audio.controls = true;
            audio.controlsList = 'nodownload';
            DOM.previewBox.appendChild(audio);
            
            DOM.mediaDetailsGrid.style.display = 'grid';
            DOM.detailType.textContent = 'Audio (Sound)';
            DOM.detailQuality.textContent = `${appState.settings.audioFormat.toUpperCase()}`;
        } else {
            // Video Player
            const video = document.createElement('video');
            video.src = mediaUrl;
            video.controls = true;
            video.controlsList = 'nodownload';
            video.preload = 'metadata';
            
            video.onerror = () => {
                // Fallback to static preview if video fails to load directly (due to MIME/CORS)
                DOM.previewBox.innerHTML = `
                    <div class="picker-info-text" style="padding:3rem; text-align:center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; color:var(--color-text-secondary)">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                        <p>Video stream loaded. Ready to download local copy!</p>
                    </div>
                `;
            };
            DOM.previewBox.appendChild(video);
            
            DOM.mediaDetailsGrid.style.display = 'grid';
            DOM.detailType.textContent = 'Video';
            DOM.detailQuality.textContent = `${appState.settings.videoQuality}p`;
        }
        
        DOM.saveFileBtn.style.display = 'flex';
        DOM.copyDirectLinkBtn.style.display = 'flex';
        
    } else if (data.status === 'picker') {
        // Multi-image/video post (e.g. Instagram Carousel, Tiktok slides)
        DOM.saveFileBtn.style.display = 'none'; // Individual downloads are inside the picker cards
        DOM.copyDirectLinkBtn.style.display = 'none';
        DOM.openExternalLinkBtn.href = originalUrl;
        
        const pickerGrid = document.createElement('div');
        pickerGrid.className = 'picker-grid';
        
        // Add "Download All" option at top
        const downloadAllBar = document.createElement('div');
        downloadAllBar.className = 'picker-download-all-bar';
        downloadAllBar.innerHTML = `
            <span class="picker-info-text">Gallery contains <strong>${data.picker.length}</strong> items</span>
            <button class="primary-btn btn-sm" id="pickerDownloadAllBtn">
                📥 Download All Items
            </button>
        `;
        DOM.previewBox.appendChild(downloadAllBar);
        DOM.previewBox.appendChild(pickerGrid);
        
        // Draw picker cards
        data.picker.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'picker-card';
            
            const isVideo = item.type === 'video' || (item.url && item.url.includes('.mp4'));
            const typeLabel = isVideo ? 'Video' : 'Photo';
            
            card.innerHTML = `
                <div class="picker-media-wrapper">
                    ${isVideo 
                        ? `<video src="${item.url}" muted></video>` 
                        : `<img src="${item.url}" alt="Slide ${index + 1}" loading="lazy">`}
                    <span class="picker-badge">${typeLabel} #${index + 1}</span>
                </div>
                <div class="picker-actions">
                    <button class="secondary-btn btn-sm trigger-picker-dl" data-url="${item.url}" data-name="${platform.toLowerCase()}_slide_${index + 1}">
                        Save
                    </button>
                    <a href="${item.url}" target="_blank" class="secondary-btn btn-sm">
                        Open
                    </a>
                </div>
            `;
            
            pickerGrid.appendChild(card);
        });
        
        // Event Listeners for Dynamic Picker Buttons
        pickerGrid.querySelectorAll('.trigger-picker-dl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetUrl = e.currentTarget.getAttribute('data-url');
                const targetName = e.currentTarget.getAttribute('data-name');
                downloadFileDirect(targetUrl, targetName);
            });
        });
        
        document.getElementById('pickerDownloadAllBtn').addEventListener('click', () => {
            downloadAllPickerItems(data.picker, platform);
        });
    }
}

// --- Save Local File & CORS Handlers ---
async function saveMediaLocal() {
    if (!appState.currentDownloadData || !appState.currentDownloadData.url) return;
    
    const url = appState.currentDownloadData.url;
    const filename = appState.currentDownloadData.filename || 'media_download';
    
    DOM.saveFileBtn.disabled = true;
    DOM.saveFileBtn.querySelector('.btn-text').textContent = 'Downloading...';
    
    const success = await downloadFileDirect(url, filename);
    
    DOM.saveFileBtn.disabled = false;
    DOM.saveFileBtn.querySelector('.btn-text').textContent = 'Save Media';
}

async function downloadFileDirect(fileUrl, filename) {
    showToast('Starting file download...', 'info');
    
    try {
        const response = await fetch(fileUrl, {
            method: 'GET',
            mode: 'cors',
            signal: AbortSignal.timeout(180000) // 3 minutes timeout for huge videos
        });
        
        if (!response.ok) throw new Error('CORS fetch blocked or file server error');
        
        const fileBlob = await response.blob();
        
        const localUrl = URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.href = localUrl;
        
        // Clean filename, make sure it has extension or let browser guess
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(localUrl);
        }, 1000);
        
        showToast('Download completed!', 'success');
        return true;
        
    } catch (e) {
        console.warn('Browser CORS blocked direct fetch, opening download in new tab instead:', e.message);
        
        // Fallback: Open URL in new window/tab for native download
        const a = document.createElement('a');
        a.href = fileUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // HTML5 download attribute instructs browser to download it directly
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        showToast('Link opened in new tab. Click Save or right-click to download!', 'info');
        return false;
    }
}

// Sequence downloader for Multi-Items with timing offsets (prevents browser blocking multiple downloads)
async function downloadAllPickerItems(items, platform) {
    showToast(`Downloading all ${items.length} files...`, 'info');
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const filename = `${platform.toLowerCase()}_gallery_${i + 1}`;
        downloadFileDirect(item.url, filename);
        
        // Wait 800ms before triggering next to bypass pop-up blockers
        await new Promise(resolve => setTimeout(resolve, 800));
    }
}

function copyDirectLink() {
    if (!appState.currentDownloadData || !appState.currentDownloadData.url) return;
    
    const url = appState.currentDownloadData.url;
    navigator.clipboard.writeText(url)
        .then(() => showToast('Direct media link copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy link', 'error'));
}
