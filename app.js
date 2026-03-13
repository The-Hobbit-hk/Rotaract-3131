let currentPage = 1;
let totalPages = 0;
const bookContainer = document.querySelector('.book-container');
const book = document.getElementById('book');

function updateBookPosition() {
    let showingSinglePage = false;
    const isMobilePortrait = window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;

    if (!bookContainer.style.transition) {
        bookContainer.style.transition = 'transform 0.5s ease-in-out';
        book.style.transition = 'transform 0.5s ease-in-out';
    }

    if (currentPage === 1) { 
        book.style.transform = 'translateX(-25%)';
        showingSinglePage = true;
    } else if (currentPage === totalPages + 1) { 
        book.style.transform = 'translateX(25%)';
        showingSinglePage = true;
    } else { 
        book.style.transform = 'translateX(0)';
    }

    const effectiveWidth = showingSinglePage ? 450 : 900;
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scaleX = (ww - 20) / effectiveWidth;
    const scaleY = (wh - (isMobilePortrait ? 180 : 150)) / 600; 
    const scale = Math.min(1, scaleX, scaleY);
    
    if (scale > 0.1 && bookContainer) {
        bookContainer.style.transform = `scale(${scale})`;
    }

    const hint = document.getElementById('orientation-hint');
    if (hint) {
        hint.style.display = (isMobilePortrait && !showingSinglePage) ? 'block' : 'none';
    }
}
window.addEventListener('resize', updateBookPosition);

function nextPage() {
    if (currentPage <= totalPages) {
        const page = document.getElementById(`p${currentPage}`);
        if(page) {
            page.classList.add('flipped');
            page.style.zIndex = currentPage;
        }
        currentPage++;
        saveData();
        updateBookPosition();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        const page = document.getElementById(`p${currentPage}`);
        if(page) {
            page.classList.remove('flipped');
            page.style.zIndex = totalPages - currentPage + 1;
        }
        saveData();
        updateBookPosition();
    }
}

// Data Persistence via Backend
let currentUser = localStorage.getItem('reign_user_id') || null;

let isUpdatingFromLoad = false;
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

    // Don't save if it's just an empty workbook, let registry handle pre-fill
    if (!hasContent) return;

    try {
        await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser, data })
        });
        
        const status = document.getElementById('sync-status');
        if (status) {
            status.style.display = 'flex';
            status.style.opacity = '1';
            setTimeout(() => { status.style.opacity = '0'; }, 1500);
            setTimeout(() => { if(status.style.opacity === '0') status.style.display = 'none'; }, 1800);
        }
        
    } catch (e) {
        console.error('Failed to save to server:', e);
        localStorage.setItem('council_workbook_data', JSON.stringify(data));
    }
}

async function loadData() {
    if (!currentUser) return;
    isUpdatingFromLoad = true;

    try {
        const response = await fetch(`/api/load/${currentUser}`);
        const result = await response.json();
        
        let data = result.data;
        if (!data || Object.keys(data).length === 0) {
            const localData = localStorage.getItem('council_workbook_data');
            if (localData) Object.assign(data, JSON.parse(localData));
        }

        if (data) {
            Object.keys(data).forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = data[id];
                    } else {
                        el.value = data[id];
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to load from server:', e);
    } finally {
        setTimeout(() => { isUpdatingFromLoad = false; }, 500);
    }
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

// Heartbeat system for real-time activity monitoring
setInterval(async () => {
    if (currentUser) {
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
    updateBookPosition();
    
    // Show swipe hint briefly on mobile
    if (window.innerWidth <= 768) {
        const hint = document.getElementById('swipe-hint');
        if (hint) {
            hint.style.display = 'flex';
            setTimeout(() => { hint.style.opacity = '0'; }, 4000);
        }
    }
};
