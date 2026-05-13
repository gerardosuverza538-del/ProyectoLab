'use strict';

window.ElectroLab = {
  AppState, CONFIG, API,

  setUser: u => AppState.setUser(u),
  currentUser: () => AppState.currentUser,
  can, saveToken, clearToken,

  addPractice, publishPractice, unpublishPractice, deletePractice, saveFromEditor,
  enrollStudent, removeStudent, updateStudent,
  submitWork, gradeSubmissionAction, submitGradeFromForum, selectSubmission,
  addMaterial, deleteMaterial, saveMaterial, handleMaterialUpload,
  validateFile, handlePhotoUpload, handleEditorFiles, renderEditorFileList,
  buildQuizHTML, selectQuizOpt, submitQuizFromModal, resetQuizInModal,
  renderStudentPractices, buildPracticeCardHTML,
  renderTeacherPractices, renderStudentTasks,
  renderPendingSubmissions, renderStudentList, renderStudentCount,
  renderLabMaterials, renderMaterialList,
  populateForumSelects, populateMaterialSelects,
  addStep, addCustomComponent, clearEditor,
  notify, formatBytes, formatDate, generateId,
};

document.addEventListener('DOMContentLoaded', async () => {
  const savedUser  = localStorage.getItem('electro_user');
  const savedToken = localStorage.getItem('electro_token');

  if (savedUser && savedToken) {
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${savedToken}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => {
        localStorage.setItem('electro_user', JSON.stringify(user));
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('btn-logout').style.display   = 'inline-flex';
        activatePanel(user);
      })
      .catch(() => {
        localStorage.removeItem('electro_token');
        localStorage.removeItem('electro_user');
      });
  }
});
