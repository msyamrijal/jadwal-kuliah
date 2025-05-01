const API_URL = 'https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec';
let allData = [];

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        // Filter dan urutkan data
        const today = new Date();
        today.setHours(0,0,0,0); // Reset waktu
        
        allData = rawData
            .filter(item => {
                const itemDate = new Date(item.Tanggal);
                itemDate.setHours(0,0,0,0);
                return itemDate >= today; // Hanya tanggal hari ini dan setelahnya
            })
            .sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal)); // Urutkan dari terdekat
        
        initFilters();
        renderData(allData);
    } catch (error) {
        console.error("Gagal memuat data:", error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
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
                            '<span class="badge bg-danger">HARI INI</span>' : 
                            '<i class="fas fa-calendar-day"></i>'
                        }
                        <small>${this.formatDate(item.Tanggal)}</small>
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
                <div class="text-end">
                    ${this.getDateStatus(item.Tanggal)}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Tambahkan method formatDate di dalam class
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    
    // Untuk tanggal di tahun yang sama, hilangkan tahun
    if (date.getFullYear() === new Date().getFullYear()) {
        delete options.year;
    }
    
    return date.toLocaleDateString('id-ID', options);
}
function shareSchedule(title, date) {
    const formattedDate = formatDate(date);
    const shareData = {
        title: `Bagikan Jadwal: ${title}`,
        text: `Jadwal ${title} akan dilaksanakan pada ${formattedDate}`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback untuk desktop
            const textArea = document.createElement('textarea');
            textArea.value = `${shareData.text}\n${shareData.url}`;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Tautan telah disalin ke clipboard!');
        }
    } catch (error) {
        console.error('Error sharing:', error);
    }
}
// Tambahkan method untuk status tanggal
function getDateStatus(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '<span class="badge bg-success">Sedang Berlangsung</span>';
    if (diffDays === 1) return '<span class="badge bg-primary">Besok</span>';
    if (diffDays <= 7) return `<span class="badge bg-warning">${diffDays} Hari Lagi</span>`;
    return '';
}
