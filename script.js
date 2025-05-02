const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allData = [];

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// Load Data
async function loadData() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        allData = rawData
            .filter(item => new Date(item.Tanggal) >= today)
            .sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));
        
        initFilters();
        renderData(allData);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize Filters
function initFilters() {
    const institutions = [...new Set(allData.map(item => item.Institusi))];
    const filterButtons = document.getElementById('filterButtons');
    
    filterButtons.innerHTML = `
        <button class="active" data-filter="all">Semua</button>
        ${institutions.map(inst => `
            <button data-filter="${inst}">${inst}</button>
        `).join('')}
    `;

    document.querySelectorAll('#filterButtons button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#filterButtons button').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            filterData();
        });
    });
}

// Filter Data
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const activeFilter = document.querySelector('#filterButtons .active').dataset.filter;
    
    const filtered = allData.filter(item => {
        const matchesSearch = [
            item.Institusi,
            item.Mata_Pelajaran,
            item.Tanggal,
            item.Peserta.join(' ')
        ].some(text => text.toLowerCase().includes(searchTerm));
        
        const matchesFilter = activeFilter === 'all' || item.Institusi === activeFilter;
        
        return matchesSearch && matchesFilter;
    });

    renderData(filtered);
}

// Render Data
function renderData(data) {
    const container = document.getElementById('jadwal-container');
    const noResults = document.getElementById('no-results');
    const today = new Date();
    
    container.innerHTML = '';
    
    if (data.length === 0) {
        noResults.style.display = 'flex';
        return;
    }
    
    noResults.style.display = 'none';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'jadwal-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="institusi-badge">${item.Institusi}</span>
                <div class="tanggal-info">
                    ${getDateStatus(item.Tanggal)}
                    <span>${formatDate(item.Tanggal)}</span>
                </div>
            </div>
            <h3>${item.Mata_Pelajaran}</h3>
            <div class="peserta-list">
                ${item.Peserta.map(peserta => `
                    <span class="peserta-item">${peserta}</span>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}

// Helpers
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}

function getDateStatus(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '<span class="status-badge today">Hari Ini</span>';
    if (diffDays === 1) return '<span class="status-badge tomorrow">Besok</span>';
    if (diffDays <= 7) return `<span class="status-badge upcoming">${diffDays} Hari Lagi</span>`;
    return '';
}

// Initialize
setTheme(savedTheme);
document.getElementById('searchInput').addEventListener('input', filterData);
document.addEventListener('DOMContentLoaded', loadData);