let currentPage = 1;
let totalPages = 0;
let showingBackOnMobile = false;
const bookContainer = document.querySelector('.book-container');
const book = document.getElementById('book');

function updateBookPosition() {
    const isMobile = window.innerWidth <= 768;
    const pages = document.querySelectorAll('.page');
    
    if (isMobile) {
        // Mobile Slider Logic
        pages.forEach((page, idx) => {
            page.classList.remove('active-mobile', 'show-front', 'show-back');
            if (idx + 1 === currentPage) {
                page.classList.add('active-mobile');
                if (showingBackOnMobile) {
                    page.classList.add('show-back');
                } else {
                    page.classList.add('show-front');
                }
            }
        });
        bookContainer.style.transform = 'none';
        book.style.transform = 'none';
    } else {
        // Desktop Book Logic
        showingBackOnMobile = false; // Reset mobile state if resized to desktop
        if (currentPage === 1) {
            book.style.transform = 'translateX(-25%)';
        } else if (currentPage === totalPages + 1) {
            book.style.transform = 'translateX(25%)';
        } else {
            book.style.transform = 'translateX(0)';
        }
        
        // Manual scaling only if screen is too small for 900px
        const ww = window.innerWidth;
        const scale = ww < 1000 ? (ww - 40) / 900 : 1;
        bookContainer.style.transform = `scale(${scale})`;
    }
}
window.addEventListener('resize', updateBookPosition);

function nextPage() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        if (!showingBackOnMobile) {
            showingBackOnMobile = true;
        } else if (currentPage <= totalPages) {
            showingBackOnMobile = false;
            currentPage++;
        }
    } else {
        if (currentPage <= totalPages) {
            const page = document.getElementById(`p${currentPage}`);
            if (page) {
                page.classList.add('flipped');
                page.style.zIndex = currentPage;
            }
            currentPage++;
        }
    }
    updateBookPosition();
    saveData();
}

function prevPage() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        if (showingBackOnMobile) {
            showingBackOnMobile = false;
        } else if (currentPage > 1) {
            currentPage--;
            showingBackOnMobile = true;
        }
    } else {
        if (currentPage > 1) {
            currentPage--;
            const page = document.getElementById(`p${currentPage}`);
            if (page) {
                page.classList.remove('flipped');
                page.style.zIndex = totalPages - currentPage + 1;
            }
        }
    }
    updateBookPosition();
    saveData();
}

// Sync Status Management
function showSyncStatus(state, message) {
    const status = document.getElementById('sync-status');
    const text = status ? status.querySelector('.sync-text') : null;
    const icon = status ? status.querySelector('.sync-icon') : null;
    
    if (!status || !text || !icon) return;

    status.classList.remove('success', 'syncing', 'offline');
    status.classList.add(state);
    text.innerText = message || '';
    icon.innerText = (state === 'syncing') ? '⏳' : (state === 'offline' ? '⚠️' : '✓');
    
    status.style.display = 'flex';
    status.style.opacity = '1';

    if (state === 'success') {
        setTimeout(() => { 
            if (status.classList.contains('success')) {
                status.style.opacity = '0';
                setTimeout(() => { if(status.style.opacity === '0') status.style.display = 'none'; }, 500);
            }
        }, 3000);
    }
}

// Data Persistence via Backend
let currentUser = localStorage.getItem('reign_user_id') || null;
let isUpdatingFromLoad = false;
let syncTimeout = null;

async function saveData() {
    if (!currentUser || isUpdatingFromLoad) return;

    const inputs = document.querySelectorAll('input:not(#login_id), textarea');
    const data = {};
    let hasContent = false;
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            data[input.id] = input.checked;
            if (input.checked) hasContent = true;
        } else {
            data[input.id] = input.value;
            if (input.value.trim().length > 0) hasContent = true;
        }
    });

    // 1. Instant Local Save (Critical for offline safety)
    localStorage.setItem(`workbook_local_${currentUser}`, JSON.stringify(data));
    localStorage.setItem(`workbook_needs_sync_${currentUser}`, 'true');

    if (!hasContent) return;

    // 2. Debounced Cloud Sync
    if (syncTimeout) clearTimeout(syncTimeout);
    
    if (!navigator.onLine) {
        showSyncStatus('offline', 'Offline (Saved Locally)');
        return;
    }

    showSyncStatus('syncing', 'Syncing...');
    syncTimeout = setTimeout(() => syncToCloud(data), 2000);
}

async function syncToCloud(data) {
    if (!navigator.onLine || !currentUser) return;
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser, data })
        });
        
        if (response.ok) {
            localStorage.removeItem(`workbook_needs_sync_${currentUser}`);
            showSyncStatus('success', 'Changes Synced');
        } else {
            throw new Error("Server rejected save");
        }
    } catch (e) {
        console.error('Cloud Sync Failed:', e);
        showSyncStatus('offline', 'Sync Delayed (Saved Locally)');
    }
}

window.addEventListener('online', () => {
    const data = localStorage.getItem(`workbook_local_${currentUser}`);
    const needsSync = localStorage.getItem(`workbook_needs_sync_${currentUser}`);
    if (needsSync && data) {
        syncToCloud(JSON.parse(data));
    } else {
        showSyncStatus('success', 'Back Online');
    }
});

window.addEventListener('offline', () => {
    showSyncStatus('offline', 'Offline Mode Active');
});

async function loadData() {
    if (!currentUser) return;
    isUpdatingFromLoad = true;
    
    // Prioritize local unsynced data
    const localData = localStorage.getItem(`workbook_local_${currentUser}`);
    const needsSync = localStorage.getItem(`workbook_needs_sync_${currentUser}`);
    
    try {
        const response = await fetch(`/api/load/${currentUser}`);
        const result = await response.json();
        const serverData = result.data || {};
        
        // Merge strategy: Use local if unsynced, otherwise server
        const finalData = (needsSync && localData) ? JSON.parse(localData) : serverData;
        
        Object.keys(finalData).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                if (input.type === 'checkbox') input.checked = finalData[key];
                else input.value = finalData[key];
            }
        });
        
        if (needsSync && navigator.onLine) syncToCloud(finalData);
        
    } catch (e) {
        console.warn('Load failed, using local reserve', e);
        if (localData) {
            const parsed = JSON.parse(localData);
            Object.keys(parsed).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    if (input.type === 'checkbox') input.checked = parsed[key];
                    else input.value = parsed[key];
                }
            });
        }
    }
    setTimeout(() => { isUpdatingFromLoad = false; }, 500);
}

// Login logic
function checkLogin() {
    if (!currentUser) {
        document.getElementById('login-overlay').style.display = 'flex';
    } else {
        document.getElementById('login-overlay').style.display = 'none';
        loadData();
    }
}

function performLogin() {
    const id = document.getElementById('login_id').value.trim();
    if (id) {
        currentUser = id;
        localStorage.setItem('reign_user_id', currentUser);
        // Removed saveData() here because it overwrites pre-fill with empty data.
        // /api/load already tracks activity on the server.
        checkLogin();
        updateActivityStatus('active');
    }
}

// Event listeners for real-time saving
document.addEventListener('input', (e) => {
    if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id !== 'login_id') {
        saveData();
    }
});
document.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
        saveData();
    }
});

// Z-Index initialization
function initPages() {
    const pages = document.querySelectorAll('.page');
    totalPages = pages.length;
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`p${i}`);
        if(page) page.style.zIndex = totalPages - i + 1;
    }
}

// Swipe Gesture Support
let touchstartX = 0;
let touchendX = 0;

function handleGesture() {
    const swipedLeft = touchendX < touchstartX - 50; 
    const swipedRight = touchendX > touchstartX + 50;
    
    if (swipedLeft) {
        nextPage();
        hideSwipeHint();
    }
    if (swipedRight) {
        prevPage();
        hideSwipeHint();
    }
}

document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    // Don't trigger swipe if dragging inside an input or textarea
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        handleGesture();
    }
});

function hideSwipeHint() {
    const hint = document.getElementById('swipe-hint');
    if (hint) hint.style.opacity = '0';
}

// Status synchronization with server
async function updateActivityStatus(status) {
    if (!currentUser) return;
    
    const payload = JSON.stringify({ userId: currentUser, status });
    
    // Use sendBeacon for more reliable delivery during exit
    if (status === 'inactive' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/activity/force', new Blob([payload], {type: 'application/json'}));
    } else {
        try {
            await fetch('/api/activity/force', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
        } catch (e) {
            console.warn("Status update failed", e);
        }
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        updateActivityStatus('inactive');
    } else {
        updateActivityStatus('active');
    }
});

window.addEventListener('beforeunload', () => {
    updateActivityStatus('inactive');
});

// Heartbeat system for real-time activity monitoring
setInterval(async () => {
    if (currentUser && document.visibilityState === 'visible') {
        try {
            await fetch(`/api/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser })
            });
        } catch (e) {
            console.warn("Heartbeat failed", e);
        }
    }
}, 30000); // Pulse every 30 seconds

window.onload = () => {
    initPages();
    checkLogin();
    if (currentUser) updateActivityStatus('active');
    updateBookPosition();
    
    // Show swipe hint briefly on mobile
    if (window.innerWidth <= 768) {
        const hint = document.getElementById('swipe-hint');
        if (hint) {
            hint.style.display = 'flex';
            setTimeout(() => { if(hint) hint.style.opacity = '0'; }, 4000);
        }
    }
};
