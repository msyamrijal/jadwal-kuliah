const API_URL = "https://script.google.com/macros/s/AKfycby9sPywic_2ifeYBzE3dQMHfrwkR4-fQv-bNx74HMduvcq5Rr4r9MY6GGEYNqI44WRI/exec";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 menit
let currentData = [];

/*********************
 *  INITIAL SETUP    *
 *********************/
document.addEventListener('DOMContentLoaded', async () => {
  const session = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    loginTime: localStorage.getItem('loginTime')
  };

  if (session.isLoggedIn && Date.now() - session.loginTime < SESSION_TIMEOUT) {
    showLoading();
    try {
      const data = await loadDataFromServer();
      initAdminPanel(data);
      showAdminPanel();
    } catch (error) {
      handleLogout();
      alert('Sesi telah berakhir: ' + error.message);
    } finally {
      hideLoading();
    }
  } else {
    handleLogout();
  }
});

/*********************
 *  EVENT HANDLERS   *
 *********************/
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

async function handleLogin() {
  showLoading();
  try {
    const password = document.getElementById('admin-password').value;
    const data = await loadDataFromServer();
    
    if (!data.some(item => item.Password === password)) {
      throw new Error('Password salah');
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loginTime', Date.now());
    initAdminPanel(data);
    showAdminPanel();
  } catch (error) {
    alert(error.message);
    handleLogout();
  } finally {
    hideLoading();
  }
}

function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loginTime');
  window.location.reload();
}

/*********************
 *  CORE FUNCTIONS   *
 *********************/
async function loadDataFromServer() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Gagal memuat data');
  return response.json();
}

function initAdminPanel(data) {
  currentData = data;
  renderDataList();
  setupFormValidation();
  setupEventListeners();
}

function renderDataList() {
  const container = document.getElementById('data-list');
  container.innerHTML = currentData
    .map(item => `
      <div class="list-group-item ${item.selected ? 'active' : ''}" 
           data-id="${item.ID}"
           onclick="handleSelect('${item.ID}')">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${item.Mata_Pelajaran}</h6>
            <small>${item.Institusi} • ${item.Tanggal}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-warning" onclick="handleEdit('${item.ID}', event)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="handleDelete('${item.ID}', event)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
}

/*********************
 *  FORM MANAGEMENT  *
 *********************/
function setupFormValidation() {
  const form = document.getElementById('data-form');
  const validationRules = {
    '#institusi': value => !!value,
    '#mapel': value => value.length >= 3,
    '#tanggal': value => /^\d{4}-\d{2}-\d{2}$/.test(value),
    '#peserta': value => value.split(',').length >= 1
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm(validationRules)) return;
    
    showLoading();
    try {
      const formData = getFormData();
      await submitData(formData);
      const newData = await loadDataFromServer();
      initAdminPanel(newData);
      resetForm();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

function validateForm(rules) {
  return Object.entries(rules).every(([selector, validate]) => {
    const element = document.querySelector(selector);
    const isValid = validate(element.value);
    element.classList.toggle('is-invalid', !isValid);
    return isValid;
  });
}

function getFormData() {
  return {
    id: document.getElementById('data-id').value,
    institusi: document.getElementById('institusi').value,
    mapel: document.getElementById('mapel').value,
    tanggal: document.getElementById('tanggal').value,
    peserta: document.getElementById('peserta').value,
    action: document.getElementById('data-id').value ? 'update' : 'add',
    password: localStorage.getItem('password')
  };
}

async function submitData(formData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: new URLSearchParams(formData)
  });
  
  if (!response.ok) throw new Error(await response.text());
  return response.text();
}

/*********************
 *  EVENT HANDLERS   *
 *********************/
window.handleSelect = function(id) {
  currentData = currentData.map(item => ({
    ...item,
    selected: item.ID.toString() === id
  }));
  renderDataList();
};

window.handleEdit = function(id, event) {
  event.stopPropagation();
  const data = currentData.find(item => item.ID.toString() === id);
  if (!data) return;

  populateForm(data);
  handleSelect(id);
};

window.handleDelete = async function(id, event) {
  event.stopPropagation();
  if (!confirm('Yakin ingin menghapus data ini?')) return;

  showLoading();
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'delete',
        id: id,
        password: localStorage.getItem('password')
      })
    });
    
    const newData = await loadDataFromServer();
    initAdminPanel(newData);
  } catch (error) {
    alert('Gagal menghapus: ' + error.message);
  } finally {
    hideLoading();
  }
};

/*********************
 *  HELPER FUNCTIONS *
 *********************/
function populateForm(data) {
  document.getElementById('data-id').value = data.ID;
  document.getElementById('institusi').value = data.Institusi;
  document.getElementById('mapel').value = data.Mata_Pelajaran;
  document.getElementById('tanggal').value = data.Tanggal;
  document.getElementById('peserta').value = Array.isArray(data.Peserta) 
    ? data.Peserta.join(', ') 
    : data.Peserta;
}

function resetForm() {
  document.getElementById('data-form').reset();
  document.getElementById('data-id').value = '';
  currentData = currentData.map(item => ({ ...item, selected: false }));
  renderDataList();
}

function showAdminPanel() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

/*********************
 *  INITIAL SETUP    *
 *********************/
function setupEventListeners() {
  // Auto-format peserta input
  document.getElementById('peserta').addEventListener('blur', function() {
    this.value = this.value.split(',')
      .map(s => s.trim())
      .filter(s => s)
      .join(', ');
  });
}