'use strict';

// =========================================================================
// RENDERIZADOR INTEGRADO DEL CONTROLADOR DEL ESTUDIANTE
// =========================================================================

async function renderStudentDashboard() {
  try {
    // 1. Establecer credenciales del Estudiante en sesión
    const sub = document.getElementById('dash-subtitle');
    if (sub && AppState.currentUser) {
      sub.innerHTML = `// Alumno: <strong>${AppState.currentUser.name}</strong> | Grupo Activo: <span class="tag" style="background:var(--b)">G2</span>`;
    }

    // 2. Extraer Colecciones desde el AppState (Datos unificados del Servidor)
    const todasLasPracticas = await AppState.getPracticas() || [];
    const practicasPublicadas = todasLasPracticas.filter(p => p.status === 'published');
    
    const todasLasEntregas = await AppState.getEntregas() || [];
    const misEntregas = todasLasEntregas.filter(e => e.studentId === AppState.currentUser?.id);

    // 3. Cálculos Métricos de Rendimiento (Contadores en tiempo real)
    const totalDisponibles = practicasPublicadas.length;
    
    // Filtro estricto: Prácticas entregadas que ya cuentan con calificación del Docente
    const totalCompletadas = misEntregas.filter(e => e.grade !== null && Number(e.grade) >= 6).length;
    
    // Algoritmo de Tareas Pendientes (Prácticas Publicadas minus Entregas Hechas)
    const idsPracticasEntregadas = misEntregas.map(e => e.practiceId);
    const tareasPendientes = practicasPublicadas.filter(p => !idsPracticasEntregadas.includes(p.id));
    const totalPendientes = tareasPendientes.length;

    // Inyección atómica en el DOM del Dashboard
    if (document.getElementById('dash-completed')) document.getElementById('dash-completed').textContent = totalCompletadas;
    if (document.getElementById('dash-pending'))   document.getElementById('dash-pending').textContent = totalPendientes;
    if (document.getElementById('dash-total'))     document.getElementById('dash-total').textContent = totalDisponibles;

    // 4. Renderizado Dinámico de Vistas y Tablas
    renderDashPracListTemplate(practicasPublicadas);
    renderDashSubmissionsTemplate(misEntregas, practicasPublicadas);
    renderFullPracticasTemplate(practicasPublicadas);
    renderFullTasksTemplate(tareasPendientes);
    
    // Nueva función para alimentar la Boleta del Alumno
    renderStudentGradesTable(misEntregas, practicasPublicadas);

  } catch (err) {
    console.error("Error crítico en sincronización híbrida del alumno:", err);
    notify("Error de red al actualizar los contenedores.", "error");
  }
}

// =========================================================================
// NUEVA IMPLEMENTACIÓN: BOLETA DE CALIFICACIONES DE REPORTE
// =========================================================================

function renderStudentGradesTable(misEntregas, practicasPublicadas) {
  const tableBody = document.getElementById('student-grades-table');
  const template = document.getElementById('tmpl-grade-row');
  if (!tableBody || !template) return;

  if (misEntregas.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px; color:var(--tf);">
          ❌ No se registran reportes ni evidencias en el servidor para este periodo.
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = ''; // Vaciar tabla

  misEntregas.forEach(e => {
    const clone = template.content.cloneNode(true);
    const prac = practicasPublicadas.find(p => p.id === e.practiceId);
    
    // Asignar Nombre e identificador de práctica
    clone.querySelector('.g-prac-title').textContent = prac ? `Práctica ${prac.num || '00'}: ${prac.title}` : 'Práctica del Curso';
    clone.querySelector('.g-prac-type').textContent = e.type === 'quiz' ? '📝 Cuestionario' : '📸 Reporte / Foto';
    
    // Configurar estatus visual e inyección de la nota
    const statusCell = clone.querySelector('.g-prac-status');
    const scoreCell = clone.querySelector('.g-prac-score');
    
    if (e.grade !== null) {
      statusCell.innerHTML = `<span class="tag tg" style="background:rgba(46,125,50,0.1); color:#2e7d32; border:1px solid #2e7d32;">Evaluada</span>`;
      scoreCell.textContent = Number(e.grade).toFixed(1);
      scoreCell.style.color = Number(e.grade) >= 6 ? '#2e7d32' : '#c62828'; // Alerta verde/rojo según acreditación
    } else {
      statusCell.innerHTML = `<span class="tag ty" style="background:rgba(245,124,0,0.1); color:#f57c00; border:1px solid #f57c00;">En Revisión</span>`;
      scoreCell.textContent = '—';
      scoreCell.style.color = 'var(--tf)';
    }

    // Comentarios o rúbrica enviada por el Foro del Docente
    clone.querySelector('.g-prac-feedback').textContent = e.feedback?.trim() || 'Sin observaciones por el profesor.';

    tableBody.appendChild(clone);
  });
}
