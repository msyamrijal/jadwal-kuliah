const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allData = [];

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        allData = rawData
            .filter(item => {
                const itemDate = new Date(item.Tanggal);
                itemDate.setHours(0,0,0,0);
                return itemDate >= today;
            })
            .sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));
        
        initFilters();
        renderData(allData);
    } catch (error) {
        console.error("Gagal memuat data:", error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function initFilters() {
    const institutions = [...new Set(allData.map(item => item.Institusi))];
    const filterButtons = document.getElementById('filterButtons');
    
    filterButtons.innerHTML = `
        <div class="col-auto">
            <button class="btn btn-outline-light active" 
                    data-filter="all">Semua</button>
        </div>
        ${institutions.map(inst => `
            <div class="col-auto">
                <button class="btn btn-outline-light" 
                        data-filter="institusi:${inst}">${inst}</button>
            </div>
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

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const activeFilter = document.querySelector('#filterButtons .active').dataset.filter;
    
    let filtered = allData.filter(item => {
        const matchesSearch = [
            item.Institusi,
            item.Mata_Pelajaran,
            item.Tanggal,
            item.Peserta.join(' ')
        ].some(text => text.toLowerCase().includes(searchTerm));
        
        const matchesFilter = activeFilter === 'all' ? true : 
            activeFilter.split(':')[1] === item.Institusi;
        
        return matchesSearch && matchesFilter;
    });

    renderData(filtered);
}

function renderData(data) {
    const container = document.getElementById('jadwal-container');
    const noResults = document.getElementById('no-results');
    const today = new Date();
    today.setHours(0,0,0,0);

    container.innerHTML = '';
    
    if (data.length === 0) {
        noResults.classList.remove('d-none');
        return;
    }
    
    noResults.classList.add('d-none');

    data.forEach(item => {
        const itemDate = new Date(item.Tanggal);
        const isToday = itemDate.getTime() === today.getTime();
        
        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="glass-card h-100 p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="schedule-badge">${item.Institusi}</span>
                    <div class="d-flex align-items-center gap-2">
                        ${isToday ? 
                            '<span class="date-indicator bg-danger">HARI INI</span>' : 
                            '<i class="fas fa-calendar-day"></i>'
                        }
                        <small>${formatDate(item.Tanggal)}</small>
                    </div>
                </div>
                <h4 class="mb-3">${item.Mata_Pelajaran}</h4>
                <div class="participants mb-3">
                    ${item.Peserta.map(peserta => `
                        <span class="participant-chip">
                            <i class="fas fa-user me-2"></i>${peserta}
                        </span>
                    `).join('')}
                </div>
                ${getDateStatus(item.Tanggal)}
            </div>
        `;
        container.appendChild(card);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    
    if (date.getFullYear() === new Date().getFullYear()) {
        delete options.year;
    }
    
    return date.toLocaleDateString('id-ID', options);
}

function getDateStatus(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = '';
    if (diffDays === 0) {
        status = '<div class="text-end mt-2"><span class="date-indicator bg-success">Sedang Berlangsung</span></div>';
    } else if (diffDays === 1) {
        status = '<div class="text-end mt-2"><span class="date-indicator bg-primary">Besok</span></div>';
    } else if (diffDays <= 7) {
        status = `<div class="text-end mt-2"><span class="date-indicator bg-warning">${diffDays} Hari Lagi</span></div>`;
    }
    return status;
}

// Event Listeners
document.getElementById('searchInput').addEventListener('input', filterData);
document.addEventListener('DOMContentLoaded', loadData);