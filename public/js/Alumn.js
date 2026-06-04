'use strict';

// =========================================================================
// RENDERIZADOR INTEGRADO DEL ALUMNO (CON SUB-NOMBRES DEL DOCENTE)
// =========================================================================

async function renderStudentDashboard() {
  try {
    // 1. Establecer credenciales del Estudiante en sesión (Igual a AppState.currentUser)
    const sub = document.getElementById('dash-subtitle');
    if (sub && AppState.currentUser) {
      sub.innerHTML = `// Alumno: <strong>${AppState.currentUser.name}</strong> | Matrícula: <span style="font-family:var(--mono);">${AppState.currentUser.matricula || 'N/A'}</span>`;
    }

    // 2. Extraer Colecciones usando los mismos métodos que mapea el Docente
    const todasLasPracticas = await AppState.getPracticas() || [];
    // El docente valida por status === 'published'
    const practicasPublicadas = todasLasPracticas.filter(p => p.status === 'published');
    
    const todasLasEntregas = await AppState.getEntregas() || [];
    // Filtro con sub-nombres unificados: soporta camelCase o snake_case del servidor
    const misEntregas = todasLasEntregas.filter(e => {
      const sId = e.studentId || e.student_id;
      return sId === AppState.currentUser?.id;
    });

    // 3. Cálculos Métricos de Rendimiento (Contadores superiores .sval)
    const totalDisponibles = practicasPublicadas.length;
    
    // El docente evalúa numéricamente con grade/calificar. Filtramos las aprobadas (>= 6)
    const totalCompletadas = misEntregas.filter(e => e.grade !== null && Number(e.grade) >= 6).length;
    
    // Mapeo cruzado de IDs para calcular pendientes
    const idsPracticasEntregadas = misEntregas.map(e => e.practiceId || e.practice_id);
    const tareasPendientes = practicasPublicadas.filter(p => !idsPracticasEntregadas.includes(p.id));
    const totalPendientes = tareasPendientes.length;

    // Sincronización exacta con los contenedores del Dashboard HTML
    if (document.getElementById('dash-completed')) document.getElementById('dash-completed').textContent = totalCompletadas;
    if (document.getElementById('dash-pending'))   document.getElementById('dash-pending').textContent = totalPendientes;
    if (document.getElementById('dash-total'))     document.getElementById('dash-total').textContent = totalDisponibles;

    // 4. Invocación de renderizados basados en <template>
    renderDashPracListTemplate(practicasPublicadas);
    renderDashSubmissionsTemplate(misEntregas, practicasPublicadas);
    renderFullPracticasTemplate(practicasPublicadas);
    renderFullTasksTemplate(tareasPendientes);
    
    // Tabla de calificaciones alineada al foro del docente
    renderStudentGradesTable(misEntregas, practicasPublicadas);

  } catch (err) {
    console.error("Error en el árbol de renderizado del Alumno:", err);
    notify("Error al sincronizar el panel con el servidor.", "error");
  }
}

// =========================================================================
// RENDERIZADORES DE PLANTILLAS CON NOMBRES HOMOLOGADOS
// =========================================================================

// 1. Mini-lista de Prácticas Disponibles (Dashboard)
function renderDashPracListTemplate(practicas) {
  const container = document.getElementById('dash-prac-list');
  const template = document.getElementById('tmpl-dash-prac-item');
  if (!container || !template) return;

  if (practicas.length === 0) {
    container.innerHTML = `<div class="empty"><div class="eico">📭</div><div class="etxt">Aún no hay prácticas publicadas.</div></div>`;
    return;
  }

  container.innerHTML = '';
  practicas.slice(-3).forEach(p => {
    const clone = template.content.cloneNode(true);
    // Usa 'p.num' y 'p.title' tal como los guarda el editor del docente (ed-num, ed-title)
    clone.querySelector('.num-tag').textContent = `${p.num || 'P-00'}`;
    clone.querySelector('.title-text').textContent = p.title;
    clone.querySelector('.diff-tag').textContent = `Nivel ${p.difficulty || 1}`;
    container.appendChild(clone);
  });
}

// 2. Mini-lista de Historial de Entregas Recientes (Dashboard)
function renderDashSubmissionsTemplate(entregas, practicas) {
  const container = document.getElementById('dash-submissions');
  const template = document.getElementById('tmpl-dash-sub-item');
  if (!container || !template) return;

  if (entregas.length === 0) {
    container.innerHTML = `<div class="empty"><div class="eico">📮</div><div class="etxt">No has entregado nada todavía.</div></div>`;
    return;
  }

  container.innerHTML = '';
  entregas.slice(-3).forEach(e => {
    const clone = template.content.cloneNode(true);
    const pId = e.practiceId || e.practice_id;
    const prac = practicas.find(p => p.id === pId);
    
    // Mapea 'e.type' (photo / quiz) tal como lo define el docente en el selector 'ed-delivery'
    clone.querySelector('.type-text').textContent = e.type === 'quiz' ? '📝 Cuestionario' : '📸 Evidencia';
    clone.querySelector('.title-text').textContent = prac ? prac.title : 'Práctica del Curso';
    
    const badge = document.createElement('span');
    if (e.grade !== null) {
      badge.className = 'tag tg';
      badge.style.cssText = 'background:var(--a3, #2e7d32); color:#fff; font-weight:bold;';
      badge.textContent = `${e.grade}/10`;
    } else {
      badge.className = 'tag ty';
      badge.style.cssText = 'background:var(--td, #f57c00); color:#fff; font-size:11px;';
      badge.textContent = '⏳ Revisión';
    }
    
    clone.querySelector('.badge-container').appendChild(badge);
    container.appendChild(clone);
  });
}

// 3. Pestaña: Prácticas del Curso Completo (.spec-card)
function renderFullPracticasTemplate(practicas) {
  const container = document.getElementById('prac-list');
  const template = document.getElementById('tmpl-full-prac-card');
  if (!container || !template) return;

  if (practicas.length === 0) {
    container.innerHTML = `<div class="empty"><div class="eico">📭</div><div class="etxt">Aún no hay prácticas publicadas.</div></div>`;
    return;
  }

  container.innerHTML = '';
  practicas.forEach(p => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.num-tag').textContent = `PRÁCTICA ESPECÍFICA: ${p.num || 'P-00'}`;
    clone.querySelector('.diff-tag').textContent = `Complejidad: ${'⚡'.repeat(p.difficulty || 1)}`;
    clone.querySelector('.title-text').textContent = p.title;
    // Mapea 'p.objective' tal como lo redacta el docente en 'ed-objective'
    clone.querySelector('.obj-text').textContent = p.objective || 'Sin directriz u objetivo cargado por el docente.';

    // Inyección de componentes de hardware basados en los checkboxes seleccionados (p.components)
    const compContainer = clone.querySelector('.comp-container');
    if (compContainer && Array.isArray(p.components)) {
      p.components.forEach(c => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.style.cssText = 'font-size:11px; background:var(--b); border:1px solid rgba(0,0,0,0.05);';
        span.textContent = c;
        compContainer.appendChild(span);
      });
    }

    const viewBtn = clone.querySelector('.view-btn');
    if (viewBtn) viewBtn.setAttribute('onclick', `openPracticeDetails('${p.id}')`);

    container.appendChild(clone);
  });
}

// 4. Pestaña: Tareas y Actividades Pendientes (Zonas de Carga o Botones de Test)
function renderFullTasksTemplate(pendientes) {
  const container = document.getElementById('task-list');
  const template = document.getElementById('tmpl-full-task-card');
  if (!container || !template) return;

  if (pendientes.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="eico">🎉</div>
        <div class="etxt">No hay tareas pendientes.</div>
        <div class="esub">¡Estás al corriente con todas tus evidencias del módulo!</div>
      </div>`;
    return;
  }

  container.innerHTML = '';
  pendientes.forEach(p => {
    const clone = template.content.cloneNode(true);
    const taskCard = clone.querySelector('.card');
    if (taskCard) taskCard.id = `task-card-${p.id}`;

    clone.querySelector('.title-text').textContent = `${p.num || 'P-00'}: ${p.title}`;

    const actionContainer = clone.querySelector('.action-container');
    if (actionContainer) {
      // Usa 'p.deliveryType' o 'p.delivery' según lo que manda el formulario 'ed-delivery' del docente
      const tipoEntrega = p.deliveryType || p.delivery;

      if (tipoEntrega === 'quiz') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn tg';
        btn.style.cssText = 'width:100%; justify-content:center; padding:10px;';
        btn.setAttribute('onclick', `openQuizModal('${p.id}')`);
        btn.textContent = '📝 Iniciar Cuestionario Técnico';
        actionContainer.appendChild(btn);
      } else {
        const dropzone = document.createElement('div');
        dropzone.className = 'drop';
        dropzone.setAttribute('data-context', 'photo');
        dropzone.style.cssText = 'border: 2px dashed var(--ac, #0056b3); padding: 20px; text-align: center; border-radius: 6px; cursor: pointer; position: relative;';
        
        dropzone.innerHTML = `
          <input type="file" accept="image/*,application/pdf" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;">
          <div style="font-size:24px; margin-bottom:6px;">📸</div>
          <div style="font-size:13px; font-weight:bold; color:var(--th);">Subir Reporte de Evidencia</div>
          <div style="font-size:11px; color:var(--tf); margin-top:4px;">Arrastra o selecciona Captura de Osciloscopio o circuito físico</div>
        `;

        dropzone.querySelector('input').addEventListener('change', (e) => handlePhotoUpload(e, p.id));
        actionContainer.appendChild(dropzone);
      }
    }

    container.appendChild(clone);
  });
}

// =========================================================================
// NUEVA BOLETA DE EVALUACIONES (ALINEADA AL PANEL 'T-FORO' DEL DOCENTE)
// =========================================================================

function renderStudentGradesTable(misEntregas, practicasPublicadas) {
  const tableBody = document.getElementById('student-grades-table');
  const template = document.getElementById('tmpl-grade-row');
  if (!tableBody || !template) return;

  if (misEntregas.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--tf);">❌ No se registran reportes ni evidencias en el servidor.</td></tr>`;
    return;
  }

  tableBody.innerHTML = '';

  misEntregas.forEach(e => {
    const clone = template.content.cloneNode(true);
    const pId = e.practiceId || e.practice_id;
    const prac = practicasPublicadas.find(p => p.id === pId);
    
    clone.querySelector('.g-prac-title').textContent = prac ? `${prac.num || 'P-00'}: ${prac.title}` : 'Práctica del Curso';
    clone.querySelector('.g-prac-type').textContent = e.type === 'quiz' ? '📝 Cuestionario' : '📸 Evidencia / Foto';
    
    const statusCell = clone.querySelector('.g-prac-status');
    const scoreCell = clone.querySelector('.g-prac-score');
    
    // Almacena y lee 'e.grade' (Establecido por ElectroLab.submitGradeFromForum() del docente)
    if (e.grade !== null && e.grade !== undefined) {
      statusCell.innerHTML = `<span class="tag tg" style="background:rgba(46,125,50,0.1); color:#2e7d32; border:1px solid #2e7d32;">Evaluada</span>`;
      scoreCell.textContent = Number(e.grade).toFixed(1);
      scoreCell.style.color = Number(e.grade) >= 6 ? '#2e7d32' : '#c62828';
    } else {
      statusCell.innerHTML = `<span class="tag ty" style="background:rgba(245,124,0,0.1); color:#f57c00; border:1px solid #f57c00;">En Revisión</span>`;
      scoreCell.textContent = '—';
      scoreCell.style.color = 'var(--tf)';
    }

    // Lee 'e.feedback' que escribe el maestro en el textarea 'foro-feedback'
    clone.querySelector('.g-prac-feedback').textContent = e.feedback?.trim() || 'Sin observaciones guardadas por el profesor.';

    tableBody.appendChild(clone);
  });
}
