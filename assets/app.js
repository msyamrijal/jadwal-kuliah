const API_URL = "https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec";
let allData = [];

async function init() {
    try {
        const response = await fetch(API_URL);
        allData = await response.json();
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error("Error:", error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function populateFilters() {
    const mapelFilter = document.getElementById('filterMapel');
    const mapelOptions = [...new Set(allData.map(item => item.Mata_Pelajaran))];
    
    mapelOptions.forEach(mapel => {
        const option = document.createElement('option');
        option.value = mapel;
        option.textContent = mapel;
        mapelFilter.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const institusi = document.getElementById('filterInstitusi').value;
    const mapel = document.getElementById('filterMapel').value;

    const filteredData = allData.filter(item => {
        const matchSearch = item.Mata_Pelajaran.toLowerCase().includes(searchTerm) ||
                          item.Peserta.some(p => p.toLowerCase().includes(searchTerm));
        const matchInstitusi = institusi ? item.Institusi === institusi : true;
        const matchMapel = mapel ? item.Mata_Pelajaran === mapel : true;
        
        return matchSearch && matchInstitusi && matchMapel;
    });

    renderJadwal(filteredData);
}

function renderJadwal(data) {
    const container = document.getElementById('jadwal-container');
    container.innerHTML = '';
    
    data.forEach(item => {
        const cardHTML = `
            <div class="col-md-6 col-lg-4