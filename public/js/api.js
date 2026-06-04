'use strict';

// =========================================================================
// MÓDULO DE GESTIÓN DE TOKENS JWT (Almacenamiento Local Seguro)
// =========================================================================
function getToken() {
  return localStorage.getItem('electro_token') || '';
}

function saveToken(token) {
  localStorage.setItem('electro_token', token);
}

function clearToken() {
  localStorage.removeItem('electro_token');
}

// =========================================================================
// CLIENTE FETCH CONFIGURABLE (Intercepta peticiones y maneja errores)
// =========================================================================
async function apiFetch(path, opts = {}) {
  const url = CONFIG.API_BASE + path;
  
  // Clonamos e inyectamos la cabecera de autenticación obligatoria
  const headers = { 'Authorization': `Bearer ${getToken()}`, ...opts.headers };
  
  // Si lleva un cuerpo de datos y NO es un FormData (subida de archivos), forzamos JSON
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(url, { ...opts, headers });
  
  // Manejo de errores centralizado para evitar cuelgues en el Frontend
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errData.error || `Error del servidor: ${res.status}`);
  }
  
  return res.json();
}

// =========================================================================
// OBJETO EXPORTABLE: CONTROLADOR DE CONSUMO DE MICROSERVICIOS (SDK)
// =========================================================================
const API = {
  auth: {
    login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => apiFetch('/auth/me'),
  },

  practicas: {
    getAll:    (role = 'student') => apiFetch(`/practicas?role=${role}`),
    getById:   (id)               => apiFetch(`/practicas/${id}`),
    create:    (data)             => apiFetch('/practicas', { method: 'POST', body: JSON.stringify(data) }),
    update:    (id, changes)      => apiFetch(`/practicas/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
    delete:    (id)               => apiFetch(`/practicas/${id}`, { method: 'DELETE' }),
    publish:   (id)               => apiFetch(`/practicas/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) }),
    unpublish: (id)               => apiFetch(`/practicas/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'draft' }) }),
  },

  alumnos: {
    getAll:  ()               => apiFetch('/alumnos'),
    getById: (id)             => apiFetch(`/alumnos/${id}`),
    create:  (data)           => apiFetch('/alumnos', { method: 'POST', body: JSON.stringify(data) }),
    update:  (id, changes)    => apiFetch(`/alumnos/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
    delete:  (id)             => apiFetch(`/alumnos/${id}`, { method: 'DELETE' }),
  },

  entregas: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return apiFetch(`/entregas?${params}`);
    },
    create:    (data)          => apiFetch('/entregas', { method: 'POST', body: JSON.stringify(data) }),
    calificar: (id, grade, fb) => apiFetch(`/entregas/${id}/calificar`, { method: 'PATCH', body: JSON.stringify({ grade, feedback: fb }) }),
  },

  materiales: {
    getAll: () => apiFetch('/materiales'),
    create: (file, { name, category, practiceId, uploadedBy }) => {
      const form = new FormData();
      form.append('file',       file);
      form.append('name',       name       || file.name);
      form.append('category',   category   || 'pdf');
      form.append('practiceId', practiceId || '');
      form.append('uploadedBy', uploadedBy || '');
      return apiFetch('/materiales', { method: 'POST', body: form });
    },
    delete: (id) => apiFetch(`/materiales/${id}`, { method: 'DELETE' }),
  },
};

// Congelar el SDK previene manipulaciones accidentales de las rutas en el cliente
Object.freeze(API);
Object.freeze(API.practicas);
Object.freeze(API.alumnos);
Object.freeze(API.entregas);
Object.freeze(API.materiales);
