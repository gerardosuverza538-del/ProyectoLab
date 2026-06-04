'use strict';

let _stepCount     = 1;
const _editorFiles = [];

async function saveFromEditor(publish = false) {
  requirePermission('canCreatePractice');
  const get = id => document.getElementById(id)?.value?.trim() || '';

  const data = {
    num:            get('ed-num'),
    title:          get('ed-title'),
    objective:      get('ed-objective'),
    difficulty:     parseInt(document.getElementById('ed-difficulty')?.value) || 1,
    deliveryType:   document.getElementById('ed-delivery')?.value || 'photo',
    components:     Array.from(document.querySelectorAll('#ed-comp-list .chi input:checked + span')).map(e => e.textContent.trim()),
    steps:          Array.from(document.querySelectorAll('#ed-steps textarea')).map(t => t.value.trim()).filter(Boolean),
    circuitDiagram: get('ed-circuit'),
    codeSnippet:    get('ed-code'),
    quiz:           null,
  };

  const practice = await addPractice(data);

  for (const file of _editorFiles) {
    await API.materiales.create(file, {
      name: file.name, category: 'other',
      practiceId: practice.id, uploadedBy: AppState.currentUser?.id,
    });
  }

  if (publish) await publishPractice(practice.id);
  await renderTeacherPractices();
  clearEditor();
  return practice;
}

function clearEditor() {
  ['ed-num','ed-title','ed-objective','ed-circuit','ed-code'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.querySelectorAll('#ed-comp-list .chi input').forEach(cb => cb.checked = false);
  document.querySelectorAll('#ed-steps textarea').forEach(ta => ta.value = '');
  _editorFiles.length = 0;
  const efl = document.getElementById('editor-file-list'); if (efl) efl.innerHTML = '';
  _stepCount = 1;
}

function addStep() {
  _stepCount++;
  const row = document.createElement('div');
  row.className = 'step-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
  row.innerHTML = `
    <span class="tag tc" style="flex-shrink:0;margin-top:8px">${String(_stepCount).padStart(2,'0')}</span>
    <textarea placeholder="Paso ${_stepCount}…" style="flex:1;min-height:56px"></textarea>
    <button class="btn bg btn-sm" style="margin-top:8px" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('ed-steps').appendChild(row);
}

function addCustomComponent() {
  const name = prompt('Nombre del componente:');
  if (!name?.trim()) return;
  const row = document.createElement('div');
  row.className = 'chi';
  row.innerHTML = <input type="checkbox" checked><span>${name.trim()}</span>;
  document.getElementById('ed-comp-list').appendChild(row);
}

function renderEditorFileList() {
  const el = document.getElementById('editor-file-list');
  if (!el) return;
  el.innerHTML = _editorFiles.map((f, i) => `
    <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid var(--b)">
      <span>📎</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
      <span style="font-family:var(--mono);color:var(--tf)">${formatBytes(f.size)}</span>
      <button class="btn bg btn-sm" onclick="_editorFiles.splice(${i},1);renderEditorFileList()">✕</button>
    </div>`).join('');
}
