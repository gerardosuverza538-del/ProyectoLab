'use strict';

// Función de validación de archivos (Mantiene tus CONFIG y alertas de interfaz)
function validateFile(file, context = 'material') {
  // Extrae la extensión de forma segura
  const ext = '.' + file.name.toLowerCase().split('.').pop();

  if (!CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    notify(`Extensión "${ext}" no permitida.`, 'error');
    return false;
  }

  const allowedMimes = context === 'photo' ? CONFIG.ALLOWED_PHOTO_TYPES : CONFIG.ALLOWED_MATERIAL_TYPES;
  if (ext !== '.ino' && file.type && !allowedMimes[file.type]) {
    notify('Tipo de archivo no permitido en este campo.', 'error');
    return false;
  }

  const limitBytes = (context === 'photo' ? CONFIG.MAX_PHOTO_SIZE_MB : CONFIG.MAX_FILE_SIZE_MB) * 1024 * 1024;
  if (file.size > limitBytes) {
    notify(`El archivo pesa ${(file.size/1024/1024).toFixed(1)} MB. Máximo: ${limitBytes/1024/1024} MB.`, 'error');
    return false;
  }
  if (file.size === 0) { 
    notify('El archivo está vacío.', 'error'); 
    return false; 
  }

  return true;
}

// Manejo de la subida de la evidencia práctica (Lado del Alumno)
async function handlePhotoUpload(event, practiceId) {
  const inputEl = event.target;
  const file = inputEl.files?.[0];
  if (!file) return;

  const dz = inputEl.closest('.drop');

  if (!validateFile(file, 'photo')) {
    if (dz) setDropZoneError(dz);
    inputEl.value = ''; // Corrección 3: Limpia el valor para permitir re-intentos
    return;
  }

  if (dz) setDropZoneLoading(dz, file.name);

  try {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Envío multipart al backend de Electro-Lab
    const saved = await API.materiales.create(file, {
      name: file.name,
      category: isPdf ? 'pdf' : 'image',
      practiceId: practiceId, // Corregido: Asociamos directamente a la práctica evaluada
      uploadedBy: AppState.currentUser?.id,
    });

    const fileUrl = saved.fileUrl || saved.file_url;

    if (!fileUrl) {
      throw new Error('No se recibió URL del archivo subido.');
    }

    if (dz) setDropZoneSuccess(dz, file.name, file.size);

    // Registra la entrega oficial en la base de datos de calificaciones
    await submitWork({
      practiceId,
      type: 'photo',
      fileUrl,
    });

    // Deshabilitar tarjeta de manera visual (Entrega completada con éxito)
    setTimeout(() => {
      const card = document.getElementById(`task-card-${practiceId}`);
      if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
        card.insertAdjacentHTML(
          'afterbegin',
          '<div class="tag tg" style="display:inline-flex;margin-bottom:10px">✓ Entregado — esperando calificación</div>'
        );
      }
    }, 600);

  } catch (err) {
    if (dz) setDropZoneError(dz);
    notify(err.message || 'Error al subir la entrega.', 'error');
  } finally {
    inputEl.value = ''; // Asegura limpiar el input pase lo que pase
  }
}

async function handleMaterialUpload(event) {
  const inputEl = event.target;
  const file = inputEl.files?.[0];
  if (!file) return;
  
  if (!validateFile(file, 'material')) {
    inputEl.value = '';
    return;
  }
  
  _pendingMaterialFile = file;
  const dz = inputEl.closest('.drop');
  if (dz) setDropZoneSuccess(dz, file.name, file.size);
}

async function handleEditorFiles(event) {
  const inputEl = event.target;
  for (const file of [...(inputEl.files || [])]) {
    if (!validateFile(file, 'material')) continue;
    _editorFiles.push(file);
    renderEditorFileList();
  }
  inputEl.value = ''; // Resetea el cargador múltiple del editor
}

// ==========================================
// RENDERIZADO VISUAL DE ESTADOS DE DROPZONE
// ==========================================

function setDropZoneLoading(el, name) {
  el.innerHTML = `<div style="font-size:24px;margin-bottom:8px">⏳</div><div style="font-family:var(--mono);font-size:12px;color:var(--td)">Subiendo ${name}…</div>`;
}

function setDropZoneSuccess(el, name, sizeBytes) {
  const mb = (sizeBytes / 1024 / 1024).toFixed(2);
  el.innerHTML = `<div style="font-size:24px;margin-bottom:8px">✅</div><div style="font-family:var(--mono);font-size:12px;color:var(--a3)">${name}</div><div style="font-size:11px;color:var(--tf);margin-top:4px">${mb} MB</div>`;
}

function setDropZoneError(el) {
  el.innerHTML = `<div style="font-size:24px;margin-bottom:8px">❌</div><div style="font-family:var(--mono);font-size:12px;color:var(--ar)">Archivo no válido o error al subir</div>`;
  setTimeout(() => resetDropZoneEl(el), 3000);
}

// Corrección 1: Mantiene intacto el árbol de eventos si usas delegación en JS
function resetDropZoneEl(el) {
  const ctx  = el.dataset.context || 'material';
  const lim  = ctx === 'photo' ? CONFIG.MAX_PHOTO_SIZE_MB : CONFIG.MAX_FILE_SIZE_MB;
  const exts = ctx === 'photo' ? 'JPG · PNG · WEBP · HEIC · PDF' : 'PDF · .ino · Imágenes · Video';
  
  el.innerHTML = `
    <input type="file" style="display:none" class="file-input-control">
    <div style="font-size:28px;margin-bottom:8px">📁</div>
    <div style="font-family:var(--mono);font-size:12px;color:var(--td)">Arrastra o haz clic</div>
    <div style="font-size:11px;color:var(--tf);margin-top:4px">${exts} · máx. ${lim} MB</div>
  `;
}

function resetDropZoneById(id) {
  const el = document.getElementById(id);
  if (el) resetDropZoneEl(el);
}
