// app.js
const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allSchedules = [];

// ======================
// THEME MANAGEMENT
// ======================
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
};

const toggleTheme = (e) => {
    const themeToggle = e.currentTarget;
    const overlay = document.getElementById('themeOverlay');
    
    // Dapatkan posisi tombol relatif terhadap viewport
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width/2;
    const y = rect.top + rect.height/2;
    
    // Set posisi overlay ke tengah tombol
    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;
    
    // Trigger animasi
    overlay.style.transform = 'translate(-50%, -50%) scale(0)';
    overlay.style.opacity = '0';
    void overlay.offsetWidth; // Trigger reflow
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Animasi overlay
    overlay.style.transform = 'translate(-50%, -50%) scale(1)';
    overlay.style.opacity = '0.2';
    overlay.style.transition = 'all 1s cubic-bezier(0.4, 0.0, 0.2, 1)';
    
    // Update tema setelah 300ms
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Reset overlay setelah animasi
        setTimeout(() => {
            overlay.style.transition = 'none';
            overlay.style.transform = 'translate(-50%, -50%) scale(0)';
            overlay.style.opacity = '0';
        }, 1000);
    }, 300);
};

// ======================
// DATA MANAGEMENT
// ======================
const fetchData = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        processData(data);
        initFilters();
        renderSchedules(allSchedules);
        attachParticipantListeners();
    } catch (error) {
        showError();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
};

const processData = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    allSchedules = data
        .filter(item => new Date(item.Tanggal) >= today)
        .sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));
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
            item.Tanggal,
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
const renderSchedules = (data) => {
    const grid = document.getElementById('scheduleGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '';
    emptyState.style.display = data.length ? 'none' : 'flex';

    data.forEach(item => {
        const card = document.createElement('article');
        card.className = 'schedule-card';
        card.innerHTML = `
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
        `;
        grid.appendChild(card);
    });
};

// ======================
// PARTICIPANT MODAL
// ======================
const attachParticipantListeners = () => {
    document.querySelectorAll('.participant-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            showParticipantSchedule(tag.textContent);
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
    
    modalTitle.textContent = `Jadwal ${participantName}`;
    modalSchedules.innerHTML = upcomingSchedules.length > 0 
        ? upcomingSchedules.map(schedule => createModalItem(schedule, participantName)).join('')
        : `<p class="no-schedule">Tidak ada jadwal berikutnya untuk ${participantName}</p>`;
    
    modal.style.display = 'block';
    attachParticipantListeners();
};

const createModalItem = (schedule, participantName) => `
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
`;

// ======================
// UTILITIES
// ======================
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
};

const showError = () => {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Gagal Memuat Data</h3>
        <p>Coba refresh halaman atau coba lagi nanti</p>
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

window.onclick = (e) => {
    const modal = document.getElementById('participantModal');
    if (e.target === modal) modal.style.display = 'none';
};

// ======================
// INITIALIZATION
// ======================
initTheme();
fetchData();