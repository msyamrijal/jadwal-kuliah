const API_URL = "https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec";
let currentData = [];

document.getElementById('login-btn').addEventListener('click', async () => {
  const password = document.getElementById('admin-password').value;
  
  try {
    // Coba ambil data untuk verifikasi password
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Verifikasi password
    if (data.some(item => item.Password === password)) {
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      initAdminPanel(data);
    } else {
      throw new Error("Password salah");
    }
  } catch (error) {
    alert(error.message);
  }
});

function initAdminPanel(data) {
  currentData = data;
  
  const adminPanel = document.getElementById('admin-panel');
  adminPanel.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h5>Tambah/Edit Data</h5>
        <form id="data-form" class="mb-4">
          <input type="hidden" id="data-id">
          
          <div class="mb-3">
            <label class="form-label">Institusi</label>
            <select id="institusi" class="form-select" required>
              <option value="PTIQ">PTIQ</option>
              <option value="PKU B">PKU B</option>
              <option value="PKUP">PKUP</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Mata Pelajaran</label>
            <input type="text" id="mapel" class="form-control" required>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Tanggal</label>
            <input type="date" id="tanggal" class="form-control" required>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Peserta (pisahkan dengan koma)</label>
            <textarea id="peserta" class="form-control" required></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" id="reset-btn" class="btn btn-secondary">Baru</button>
        </form>
      </div>
      
      <div class="col-md-6">
        <h5>Daftar Jadwal</h5>
        <div id="data-list" class="list-group">
          ${renderDataList(data)}
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  document.getElementById('data-form').addEventListener('submit', handleSubmit);
  document.getElementById('reset-btn').addEventListener('click', resetForm);
}

function renderDataList(data) {
  return data.map(item => `
    <a href="#" class="list-group-item list-group-item-action" 
       data-id="${item.ID}" 
       onclick="loadDataToForm('${item.ID}')">
      <strong>${item.Mata_Pelajaran}</strong><br>
      <small>${item.Institusi} - ${item.Tanggal}</small>
    </a>
  `).join('');
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const formData = {
    id: document.getElementById('data-id').value,
    institusi: document.getElementById('institusi').value,
    mapel: document.getElementById('mapel').value,
    tanggal: document.getElementById('tanggal').value,
    peserta: document.getElementById('peserta').value,
    password: document.getElementById('admin-password').value,
    action: document.getElementById('data-id').value ? 'update' : 'add'
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams(formData)
    });
    
    const result = await response.text();
    alert(result);
    window.location.reload(); // Refresh data
    
  } catch (error) {
    alert("Error: " + error.message);
  }
}

function resetForm() {
  document.getElementById('data-form').reset();
  document.getElementById('data-id').value = '';
}

window.loadDataToForm = function(id) {
  const data = currentData.find(item => item.ID.toString() === id);
  if (!data) return;
  
  document.getElementById('data-id').value = data.ID;
  document.getElementById('institusi').value = data.Institusi;
  document.getElementById('mapel').value = data.Mata_Pelajaran;
  document.getElementById('tanggal').value = data.Tanggal;
  document.getElementById('peserta').value = data.Peserta.join(', ');
};