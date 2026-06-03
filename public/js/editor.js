'use strict';

// Arreglo global para almacenar en memoria los archivos cargados antes de enviar
const _editorFiles = [];

// Guarda o publica la práctica estructurada por el docente
async function saveFromEditor(publish = false) {
  // Simulación de control de accesos / Permisos del CMS
  requirePermission('canCreatePractice');
  
  const get = id => document.getElementById(id)?.value?.trim() || '';

  // 1. Recolección de datos sanitizados desde el formulario
  const data = {
    num:            get('ed-num'),
    title:          get('ed-title'),
    objective:      get('ed-objective'),
    difficulty:     parseInt(document.getElementById('ed-difficulty')?.value, 10) || 1,
    deliveryType:   document.getElementById('ed-delivery')?.value || 'photo',
    // Mapea sólo los componentes cuyos checkboxes estén activos
    components:     Array.from(document.querySelectorAll('#ed-comp-list .chi input:checked'))
                         .map(cb => cb.parentElement.querySelector('span').textContent.trim()),
    // Filtra inputs de texto vacíos para evitar pasos fantasmas
    steps:          Array.from(document.querySelectorAll('#ed-steps textarea'))
                         .map(t => t.value.trim())
                         .filter(Boolean),
    circuitDiagram: get('ed-circuit'),
    codeSnippet:    get('ed-code'),
    quiz:           null, // Se vincula mediante el gestor de cuestionarios independiente
  };

  // Validación básica del lado del cliente antes de procesar peticiones HTTP
  if (!data.title) {
    notify('El título de la práctica es obligatorio.', 'error');
    return;
  }

  try {
    // 2. Persistencia de la práctica en la base de datos central de la plataforma
    const practice = await addPractice(data);

    // 3. Subida secuencial de archivos adjuntos vinculados a la práctica (Códigos .ino, PDFs)
    for (const file of _editorFiles) {
      await API.materiales.create(file, {
        name: file.name, 
        category: 'other',
        practiceId: practice.id, 
        uploadedBy: AppState.currentUser?.id,
      });
    }

    // 4. Publicación inmediata opcional
    if (publish) {
      await publishPractice(practice.id);
    }

    notify('Práctica guardada correctamente en el ecosistema híbrido.', 'success');
    
    // 5. Actualización de interfaz y limpieza
    await renderTeacherPractices();
    clearEditor();
    return practice;

  } catch (err) {
    notify(`Error al guardar la práctica: ${err.message}`, 'error');
  }
}

// Restablece todos los campos del panel de edición a sus valores por defecto
function clearEditor() {
  ['ed-num','ed-title','ed-objective','ed-circuit','ed-code'].forEach(id => {
    const el = document.getElementById(id); 
    if (el) el.value = '';
  });
  
  document.querySelectorAll('#ed-comp-list .chi input').forEach(cb => cb.checked = false);
  
  // Restablece el contenedor de pasos dejando únicamente el contenedor vacío
  const stepsContainer = document.getElementById('ed-steps');
  if (stepsContainer) stepsContainer.innerHTML = '';
  
  _editorFiles.length = 0;
  const efl = document.getElementById('editor-file-list'); 
  if (efl) efl.innerHTML = '';
  
  // Inicializa agregando el primer paso en blanco de forma limpia
  addStep();
}

// Agrega dinámicamente un nuevo campo de texto para los pasos de la práctica
function addStep() {
  const stepsContainer = document.getElementById('ed-steps');
  if (!stepsContainer) return;

  // Corrección 1: Calcula el número de paso basándose en el DOM real existente
  const totalPasos Actuales = stepsContainer.querySelectorAll('.step-row').length;
  const nuevoNumeroPaso = totalPasosActuales + 1;

  const row = document.createElement('div');
  row.className = 'step-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;';
  row.innerHTML = `
    <span class="tag tc step-number" style="flex-shrink:0;margin-top:8px">
      ${String(nuevoNumeroPaso).padStart(2, '0')}
    </span>
    <textarea placeholder="Paso ${nuevoNumeroPaso}…" style="flex:1;min-height:56px"></textarea>
    <button type="button" class="btn bg btn-sm remove-step-btn" style="margin-top:8px">✕</button>
  `;

  // Asigna el evento de eliminación dinámica manteniendo la coherencia de la numeración
  row.querySelector('.remove-step-btn').addEventListener('click', function() {
    row.remove();
    reindexarPasos(); // Reajusta los números tras eliminar
  });

  stepsContainer.appendChild(row);
}

// Función auxiliar para re-ordenar los números visibles en caso de eliminación intermedia
function reindexarPasos() {
  const rows = document.querySelectorAll('#ed-steps .step-row');
  rows.forEach((row, index) => {
    const label = row.querySelector('.step-number');
    const textarea = row.querySelector('textarea');
    const numeroReal = index + 1;
    
    if (label) label.textContent = String(numeroReal).padStart(2, '0');
    if (textarea) textarea.placeholder = `Paso ${numeroReal}…`;
  });
}

// Despliega un prompt para ingresar componentes personalizados (Ej. Resistencia 220 Ohms)
function addCustomComponent() {
  const name = prompt('Nombre del componente:');
  if (!name?.trim()) return;
  
  const row = document.createElement('div');
  row.className = 'chi';
  row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';
  row.innerHTML = `<input type="checkbox" checked><span>${name.trim()}</span>`;
  
  document.getElementById('ed-comp-list').appendChild(row);
}

// Renderiza visualmente la lista de archivos que esperan subirse al servidor
function renderEditorFileList() {
  const el = document.getElementById('editor-file-list');
  if (!el) return;
  
  el.innerHTML = ''; // Limpieza previa

  if (_editorFiles.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--tf);padding:5px(0)">Ningún archivo seleccionado</div>';
    return;
  }

  _editorFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid var(--b)';
    item.innerHTML = `
      <span>📎</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${file.name}</span>
      <span style="font-family:var(--mono);color:var(--tf)">${formatBytes(file.size)}</span>
      <button type="button" class="btn bg btn-sm remove-file-btn">✕</button>
    `;

    // Corrección 2: Event Listener seguro en lugar de atributos de texto string inline onclick
    item.querySelector('.remove-file-btn').addEventListener('click', () => {
      _editorFiles.splice(index, 1);
      renderEditorFileList(); // Re-renderizado limpio controlado
    });

    el.appendChild(item);
  });
}
