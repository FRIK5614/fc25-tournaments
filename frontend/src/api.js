// src/api.js
const API_BASE = 'http://localhost:3000'; // Замените на URL вашего сервера, если нужно

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function register(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return res.json();
}

export async function getProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function updateProfile(data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function uploadAvatar(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return res.json();
}

export async function getTournaments() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/tournaments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
