const API_URL = "https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec";
let currentData = [];
let isLoggedIn = false;

// Login Handler
document.getElementById('login-btn').addEventListener('click', async () => {
  const password = document.getElementById('admin-password').value;
  
  if (!password) {
    alert('Masukkan password terlebih dahulu');
    return;
  }

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Cek password
    if (data.some(item => item.Password === password)) {
      isLoggedIn = true;
      initAdminPanel(data);
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
    } else {
      throw new Error('Password salah');
    }
  } catch (error) {
    alert(error.message);
    document.getElementById('admin-password').value = '';
  }
});

// Initialize Admin Panel
function initAdminPanel(data) {
  currentData = data;
  renderDataList();
  setupForm();
}

// Render Data List
function renderDataList() {
  const container = document.getElementById('data-list');
  container.innerHTML = `
    <div class="list-group">
      ${currentData.map(item => `
        <a href="#" class="list-group-item list-group-item-action ${item.selected ? 'active' : ''}" 
           data-id="${item.ID}"
           onclick="loadDataToForm('${item.ID}')">
          <div class="d-flex justify-content-between">
            <div>
              <strong>${item.Mata_Pelajaran}</strong><br>
              <small>${item.Institusi} • ${item.Tanggal}</small>
            </div>
            <button class="btn btn-sm btn-danger" onclick="handleDelete('${item.ID}', event)">Hapus</button>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

// Load Data to Form
window.loadDataToForm = function(id) {
  const data = currentData.find(item => item.ID.toString() === id);
  if (!data) return;

  // Update form fields
  document.getElementById('data-id').value = data.ID;
  document.getElementById('institusi').value = data.Institusi;
  document.getElementById('mapel').value = data.Mata_Pelajaran;
  document.getElementById('tanggal').value = data.Tanggal;
  document.getElementById('peserta').value = Array.isArray(data.Peserta) ? data.Peserta.join(', ') : data.Peserta;
  
  // Highlight selected item
  currentData = currentData.map(item => ({
    ...item,
    selected: item.ID === data.ID
  }));
  renderDataList();
};

// Setup Form Submission
function setupForm() {
  const form = document.getElementById('data-form');
  
  form.onsubmit = async (e) => {
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

    // Validasi
    if (!formData.tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(formData.tanggal)) {
      alert('Format tanggal tidak valid (YYYY-MM-DD)');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams(formData)
      });
      
      const result = await response.text();
      alert(result);
      
      // Refresh data
      const newData = await fetch(API_URL).then(res => res.json());
      initAdminPanel(newData);
      resetForm();
      
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
}

// Delete Handler
window.handleDelete = async function(id, event) {
  event.stopPropagation();
  
  if (!confirm('Yakin ingin menghapus data ini?')) return;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'delete',
        id: id,
        password: document.getElementById('admin-password').value
      })
    });
    
    const result = await response.text();
    alert(result);
    
    // Refresh data
    const newData = await fetch(API_URL).then(res => res.json());
    initAdminPanel(newData);
    
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  }
};

// Reset Form
function resetForm() {
  document.getElementById('data-form').reset();
  document.getElementById('data-id').value = '';
  currentData = currentData.map(item => ({ ...item, selected: false }));
  renderDataList();
}

// Initial Load
if (window.location.pathname.includes('/admin')) {
  document.getElementById('admin-panel').style.display = 'none';
}