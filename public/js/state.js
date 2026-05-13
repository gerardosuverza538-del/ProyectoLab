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

function can(action) {
  const role = AppState.currentUser?.role;
  if (!role) return false;
  return PERMISSIONS[role]?.[action] ?? false;
}

function requirePermission(action) {
  if (!can(action)) {
    notify('No tienes permiso para realizar esta acción.', 'error');
    throw new Error(`Permiso denegado: ${action}`);
  }
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
      const role = this.currentUser?.role || 'student';
      this._cache.practicas = await API.practicas.getAll(role);
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
