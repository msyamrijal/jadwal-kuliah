const API_URL = https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec;

async function loadJadwal() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    const container = document.getElementById('jadwal-container');
    container.innerHTML = '';
    
    // Kelompokkan data berdasarkan institusi
    const groupedData = data.reduce((acc, item) => {
      if (!acc[item.Institusi]) acc[item.Institusi] = [];
      acc[item.Institusi].push(item);
      return acc;
    }, {});
    
    // Render data
    for (const [institusi, items] of Object.entries(groupedData)) {
      const institusiHTML = `
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h3>${institusi}</h3>
            </div>
            <div class="card-body">
              ${items.map(item => renderItem(item)).join('')}
            </div>
          </div>
        </div>
      `;
      container.innerHTML += institusiHTML;
    }
    
  } catch (error) {
    console.error("Gagal memuat data:", error);
    alert("Terjadi kesalahan saat memuat data");
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

function renderItem(item) {
  return `
    <div class="mb-3 p-3 border rounded">
      <h5>${item.Mata_Pelajaran}</h5>
      <p><strong>Tanggal:</strong> ${item.Tanggal}</p>
      <p><strong>Peserta:</strong> ${item.Peserta.join(', ')}</p>
    </div>
  `;
}

// Auto refresh setiap 1 menit
setInterval(loadJadwal, 60000);
loadJadwal();