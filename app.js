// app.js
const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allSchedules = [];
let currentTheme = localStorage.getItem('theme') || 'light';

// ======================
// THEME MANAGEMENT
// ======================
const initTheme = () => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
};

const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Trigger circle animation
    themeToggle.classList.add('active');
    setTimeout(() => themeToggle.classList.remove('active'), 600);
    
    currentTheme = newTheme;
    updateThemeIcon();
};

const updateThemeIcon = () => {
    const sun = document.querySelector('.sun');
    const moon = document.querySelector('.moon');
    
    if(currentTheme === 'dark') {
        sun.style.transform = 'rotate(90deg) scale(0)';
        moon.style.transform = 'rotate(0deg) scale(1)';
    } else {
        sun.style.transform = 'rotate(0deg) scale(1)';
        moon.style.transform = 'rotate(-90deg) scale(0)';
    }
};

// ======================
// DATA MANAGEMENT
// ======================
const fetchData = async () => {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        allSchedules = rawData
            .filter(item => new Date(item.Tanggal) >= today)
            .sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));
        
        initFilters();
        renderSchedules(allSchedules);
        attachParticipantListeners();
    } catch (error) {
        showError('Gagal memuat data. Coba refresh halaman atau coba lagi nanti.');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
};

// ======================
// FILTER SYSTEM
// ======================
const initFilters = () => {
    const institutions = [...new Set(allSchedules.map(item => item.Institusi))];
    const filterNav = document.getElementById('filterNav');
    
    filterNav.innerHTML = `
        <button class="filter-btn active" data-filter="all">Semua</button>
        ${institutions.map(inst => `
            <button class="filter-btn" data-filter="${inst}">${inst}</button>
        `).join('')}
    `;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
};

const handleFilterClick = (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    filterSchedules();
};

const filterSchedules = () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    
    const filtered = allSchedules.filter(item => {
        const matchesSearch = [
            item.Institusi,
            item.Mata_Pelajaran,
            formatDate(item.Tanggal),
            item.Peserta.join(' ')
        ].some(text => text.toLowerCase().includes(searchTerm));
        
        const matchesFilter = activeFilter === 'all' || item.Institusi === activeFilter;
        
        return matchesSearch && matchesFilter;
    });

    renderSchedules(filtered);
    attachParticipantListeners();
};

// ======================
// RENDERING
// ======================
const renderSchedules = (schedules) => {
    const grid = document.getElementById('scheduleGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '';
    
    if(schedules.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';

    grid.innerHTML = schedules.map(item => `
        <article class="schedule-card">
            <div class="card-header">
                <h3>${item.Mata_Pelajaran}</h3>
                <span>${formatDate(item.Tanggal)}</span>
            </div>
            <div class="institute">${item.Institusi}</div>
            <div class="participants">
                ${item.Peserta.map(peserta => `
                    <span class="participant-tag">${peserta}</span>
                `).join('')}
            </div>
        </article>
    `).join('');
};

// ======================
// PARTICIPANT MODAL
// ======================
const attachParticipantListeners = () => {
    document.querySelectorAll('.participant-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            showParticipantSchedule(e.target.textContent);
        });
    });
};

const showParticipantSchedule = (participantName) => {
    const today = new Date();
    const upcomingSchedules = allSchedules.filter(schedule => 
        schedule.Peserta.includes(participantName) && 
        new Date(schedule.Tanggal) >= today
    );

    const modal = document.getElementById('participantModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSchedules = document.getElementById('modalSchedules');
    
    modalTitle.textContent = `Jadwal Mendatang: ${participantName}`;
    modalSchedules.innerHTML = upcomingSchedules.length > 0 
        ? upcomingSchedules.map(schedule => `
            <div class="modal-schedule-item">
                <div class="modal-item-header">
                    <h4>${schedule.Mata_Pelajaran}</h4>
                    <span>${formatDate(schedule.Tanggal)}</span>
                </div>
                <div class="institute">${schedule.Institusi}</div>
                <div class="participants">
                    ${schedule.Peserta.map(p => `
                        <span class="participant-tag ${p === participantName ? 'highlight' : ''}">${p}</span>
                    `).join('')}
                </div>
            </div>
        `).join('')
        : `<p class="no-schedule">Tidak ada jadwal berikutnya untuk ${participantName}</p>`;
    
    modal.style.display = 'block';
    attachParticipantListeners();
};

// ======================
// UTILITIES
// ======================
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString('id-ID', options);
};

const showError = (message) => {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="currentColor" d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8"/>
        </svg>
        <h3>Terjadi Kesalahan</h3>
        <p>${message}</p>
    `;
    emptyState.style.display = 'flex';
};

// ======================
// EVENT LISTENERS
// ======================
document.getElementById('searchInput').addEventListener('input', filterSchedules);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('participantModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if(e.target === document.getElementById('participantModal')) {
        document.getElementById('participantModal').style.display = 'none';
    }
});

// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchData();
});