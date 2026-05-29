'use strict';

const ROLES = { STUDENT: 'student', TEACHER: 'teacher' };

const PERMISSIONS = {
  [ROLES.STUDENT]: {
    canViewPractices: true, canSubmitWork: true, canUploadMaterial: false,
    canCreatePractice: false, canGrade: false, canViewAllStudents: false,
    canDeletePractice: false, canPublishPractice: false,
    canEnrollStudents: false, canDeleteStudent: false,
  },
  [ROLES.TEACHER]: {
    canViewPractices: true, canSubmitWork: false, canUploadMaterial: true,
    canCreatePractice: true, canGrade: true, canViewAllStudents: true,
    canDeletePractice: true, canPublishPractice: true,
    canEnrollStudents: true, canDeleteStudent: true,
  },
};

function getCurrentUserSafe() {
  if (AppState.currentUser) return AppState.currentUser;

  try {
    const saved = JSON.parse(localStorage.getItem('electro_user') || '{}');
    if (saved && saved.role) {
      AppState.currentUser = saved;
      return saved;
    }
  } catch (_) {}

  return null;
}

function can(action) {
  const user = getCurrentUserSafe();
  const role = user?.role;
  if (!role) return false;
  return PERMISSIONS[role]?.[action] ?? false;
}

function requirePermission(action) {
  if (!can(action)) {
    notify('No tienes permiso para realizar esta acción.', 'error');
    throw new Error(`Permiso denegado: ${action}`);
  }
  return true;
}

const AppState = {
  currentUser: null,

  _cache: { practicas: null, alumnos: null, entregas: null, materiales: null },

  invalidate(collection) {
    if (collection) this._cache[collection] = null;
    else Object.keys(this._cache).forEach(k => this._cache[k] = null);
  },

  setUser(user) {
    this.currentUser = user;

    const avEl = document.getElementById('av-initials');
    const rlEl = document.getElementById('role-label');

    if (avEl) avEl.textContent = user?.initials || user?.name?.[0] || '?';
    if (rlEl) rlEl.textContent = user?.name || '—';
  },

  async getPracticas() {
  if (!this._cache.practicas) {
    const user = getCurrentUserSafe();
    const role = user?.role || 'student';

    const data = await API.practicas.getAll(role);

    this._cache.practicas = data.map(p => ({
      ...p,
      deliveryType: p.deliveryType || p.delivery_type,
      circuitDiagram: p.circuitDiagram || p.circuit_diagram,
      codeSnippet: p.codeSnippet || p.code_snippet,
      createdBy: p.createdBy || p.created_by,
      createdAt: p.createdAt || p.created_at,
      updatedAt: p.updatedAt || p.updated_at,
    }));
  }

  return this._cache.practicas;
},

  async getPublishedPracticas() {
    const all = await this.getPracticas();
    return all.filter(p => p.status === 'published');
  },

  async getAlumnos() {
    if (!this._cache.alumnos) {
      this._cache.alumnos = await API.alumnos.getAll();
    }
    return this._cache.alumnos;
  },

  async getEntregas(filters = {}) {
    return API.entregas.getAll(filters);
  },

  async getStudentSubmissions(studentId) {
    return this.getEntregas({ studentId });
  },

  async getPendingGrading() {
    const all = await this.getEntregas();
    return all.filter(e => e.grade === null);
  },

  async getMateriales() {
    if (!this._cache.materiales) {
      this._cache.materiales = await API.materiales.getAll();
    }
    return this._cache.materiales;
  },
};

window.AppState = AppState;
window.can = can;
window.requirePermission = requirePermission;
