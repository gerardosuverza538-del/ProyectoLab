'use strict';

async function addPractice(data) {
  requirePermission('canCreatePractice');
  if (!data.title?.trim()) { notify('El título es obligatorio.', 'error'); throw new Error('Título vacío'); }
  const saved = await API.practicas.create({ ...data, createdBy: AppState.currentUser?.id });
  AppState.invalidate('practicas');
  notify("${saved.title}" guardada como borrador., 'success');
  return saved;
}

async function publishPractice(id) {
  requirePermission('canPublishPractice');
  const updated = await API.practicas.publish(id);
  AppState.invalidate('practicas');
  notify("${updated.title}" publicada., 'success');
  return updated;
}

async function unpublishPractice(id) {
  requirePermission('canPublishPractice');
  const updated = await API.practicas.unpublish(id);
  AppState.invalidate('practicas');
  notify("${updated.title}" regresada a borrador., 'info');
  return updated;
}

async function deletePractice(id) {
  requirePermission('canDeletePractice');
  const pracs = await AppState.getPracticas();
  const p = pracs.find(x => x.id === id);
  if (p?.status === 'published') {
    const ok = confirm(¿Eliminar "${p.title}"?\nEsta acción no se puede deshacer.);
    if (!ok) return;
  }
  await API.practicas.delete(id);
  AppState.invalidate('practicas');
  notify('Práctica eliminada.', 'info');
}

async function enrollStudent(data) {
  requirePermission('canEnrollStudents');
  if (!data.name?.trim())      { notify('El nombre es obligatorio.', 'error');     throw new Error('Nombre vacío'); }
  if (!data.matricula?.trim()) { notify('La matrícula es obligatoria.', 'error');  throw new Error('Matrícula vacía'); }
  const saved = await API.alumnos.create(data);
  AppState.invalidate('alumnos');
  notify(Alumno "${saved.name}" inscrito., 'success');
  return saved;
}

async function removeStudent(id) {
  requirePermission('canDeleteStudent');
  const alumnos = await AppState.getAlumnos();
  const s = alumnos.find(x => x.id === id);
  if (!s) return notify('Alumno no encontrado.', 'error');
  const ok = confirm(¿Dar de baja a "${s.name}" (${s.matricula})?\nSus entregas se conservarán.);
  if (!ok) return;
  await API.alumnos.delete(id);
  AppState.invalidate('alumnos');
  notify("${s.name}" dado de baja., 'info');
}

async function updateStudent(id, changes) {
  requirePermission('canEnrollStudents');
  const updated = await API.alumnos.update(id, changes);
  AppState.invalidate('alumnos');
  notify('Datos actualizados.', 'success');
  return updated;
}

async function submitWork(data) {
  requirePermission('canSubmitWork');
  const pracs = await AppState.getPracticas();
  const practice = pracs.find(p => p.id === data.practiceId);
  if (!practice) { notify('Práctica no encontrada.', 'error'); return; }

  let quizScore = null;
  if (data.type === 'quiz' && data.quizAnswers && practice.quiz) {
    quizScore = gradeQuiz(practice.quiz, data.quizAnswers);
  }

  const entrega = await API.entregas.create({
    practiceId:  data.practiceId,
    studentId:   AppState.currentUser.id,
    studentName: AppState.currentUser.name,
    type:        data.type,
    fileUrl:     data.fileUrl     ?? null,
    quizAnswers: data.quizAnswers ?? null,
    quizScore,
  });

  notify(
    data.type === 'quiz'
      ? Cuestionario enviado — puntaje: ${quizScore}/${practice.quiz?.length ?? '?'}
      : 'Foto entregada. El docente la revisará pronto.',
    'success'
  );
  return entrega;
}

async function gradeSubmissionAction(submissionId, grade, feedback) {
  requirePermission('canGrade');
  if (isNaN(grade) || grade < 0 || grade > 10) { notify('La calificación debe ser entre 0 y 10.', 'error'); return; }
  const saved = await API.entregas.calificar(submissionId, Number(grade), feedback || '');
  notify(Calificación ${grade}/10 guardada., 'success');
  return saved;
}

async function submitGradeFromForum() {
  requirePermission('canGrade');
  const submissionId = document.getElementById('foro-submission-id')?.value?.trim();
  const grade        = parseFloat(document.getElementById('foro-grade')?.value);
  const feedback     = document.getElementById('foro-feedback')?.value?.trim();

  if (!submissionId) { notify('Selecciona una entrega de la lista.', 'warn'); return; }
  if (isNaN(grade))  { notify('Escribe una calificación numérica.', 'warn');  return; }

  await gradeSubmissionAction(submissionId, grade, feedback);
  await renderPendingSubmissions();
  ['foro-submission-id','foro-grade','foro-feedback'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

async function selectSubmission(submissionId) {
  const idField = document.getElementById('foro-submission-id');
  if (idField) idField.value = submissionId;

  try {
    const raw = await AppState.getEntregas();
    const entregas = Array.isArray(raw) ? raw : [];

    const entrega = entregas.find(e => e.id === submissionId);

    if (!entrega) {
      notify('Entrega seleccionada.', 'info');
      return;
    }

    const studentId = entrega.studentId || entrega.student_id;
    const practiceId = entrega.practiceId || entrega.practice_id;

    const stuSel = document.getElementById('foro-student');
    const pracSel = document.getElementById('foro-practice');

    if (stuSel && studentId) stuSel.value = studentId;
    if (pracSel && practiceId) pracSel.value = practiceId;

    notify('Entrega seleccionada. Escribe la calificación y envía.', 'info');

  } catch (_) {
    notify('Entrega seleccionada. Escribe la calificación y envía.', 'info');
  }
}

let _pendingMaterialFile = null;

async function addMaterial(file, meta) {
  requirePermission('canUploadMaterial');
  const saved = await API.materiales.create(file, { ...meta, uploadedBy: AppState.currentUser?.id });
  AppState.invalidate('materiales');
  notify("${saved.name}" subido., 'success');
  return saved;
}

async function deleteMaterial(id) {
  requirePermission('canUploadMaterial');
  await API.materiales.delete(id);
  AppState.invalidate('materiales');
  notify('Material eliminado.', 'info');
}

async function saveMaterial() {
  if (!_pendingMaterialFile) { notify('Primero selecciona un archivo.', 'error'); return; }
  const name       = document.getElementById('mat-title')?.value?.trim() || _pendingMaterialFile.name;
  const category   = document.getElementById('mat-category')?.value || 'pdf';
  const practiceId = document.getElementById('mat-practice')?.value || null;
  try {
    await addMaterial(_pendingMaterialFile, { name, category, practiceId });
    _pendingMaterialFile = null;
    const t = document.getElementById('mat-title'); if (t) t.value = '';
    resetDropZoneById('mat-drop');
    await renderMaterialList();
    await renderLabMaterials();
  } catch (err) {
    notify(err.message || 'Error al subir el material.', 'error');
  }
}
