const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allData = [];

// Load initial data
async function loadData() {
    try {
        const response = await fetch(API_URL);
        allData = await response.json();
        initFilters();
        renderData(allData);
    } catch (error) {
        console.error("Gagal memuat data:", error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize filters
function initFilters() {
    const institutions = [...new Set(allData.map(item => item.Institusi))];
    const subjects = [...new Set(allData.map(item => item.Mata_Pelajaran))];
    
    const institusiSelect = document.getElementById('filterInstitusi');
    const mapelSelect = document.getElementById('filterMapel');
    
    institutions.forEach(inst => {
        const option = document.createElement('option');
        option.value = inst;
        option.textContent = inst;
        institusiSelect.appendChild(option);
    });
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        mapelSelect.appendChild(option);
    });
    
    // Add event listeners
    document.getElementById('filterInstitusi').addEventListener('change', filterData);
    document.getElementById('filterMapel').addEventListener('change', filterData);
    document.getElementById('searchInput').addEventListener('input', filterData);
}

// Filter and search logic
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedInstitusi = document.getElementById('filterInstitusi').value;
    const selectedMapel = document.getElementById('filterMapel').value;
    
    const filtered = allData.filter(item => {
        const matchesSearch = [
            item.Institusi,
            item.Mata_Pelajaran,
            item.Tanggal,
            item.Peserta.join(' ')
        ].some(text => text.toLowerCase().includes(searchTerm));
        
        const matchesInstitusi = selectedInstitusi ? 
            item.Institusi === selectedInstitusi : true;
            
        const matchesMapel = selectedMapel ?
            item.Mata_Pelajaran === selectedMapel : true;
            
        return matchesSearch && matchesInstitusi && matchesMapel;
    });
    
    renderData(filtered);
}

// Render data
function renderData(data) {
    const container = document.getElementById('jadwal-container');
    const noResults = document.getElementById('no-results');
    
    container.innerHTML = '';
    
    if (data.length === 0) {
        noResults.classList.remove('d-none');
        return;
    }
    
    noResults.classList.add('d-none');
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card schedule-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge badge-custom">${item.Institusi}</span>
                        <small class="text-muted">${formatDate(item.Tanggal)}</small>
                    </div>
                    <h5 class="card-title mb-3">${item.Mata_Pelajaran}</h5>
                    <div class="participants">
                        ${item.Peserta.map(peserta => `
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-user-circle me-2 text-muted"></i>
                                <span>${peserta}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Date formatter
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Auto-refresh every 5 minutes
    setInterval(loadData, 300000);
});