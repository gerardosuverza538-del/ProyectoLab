'use strict';

async function renderStudentPractices() {
  const el = document.getElementById('prac-list');
  if (!el) return;
  el.innerHTML = '<div class="empty"><div class="eico">⏳</div><div class="etxt">Cargando prácticas…</div></div>';
  try {
    const pub = await AppState.getPublishedPracticas();
    el.innerHTML = pub.length === 0
      ? '<div class="empty"><div class="eico">📭</div><div class="etxt">Aún no hay prácticas publicadas.</div><div class="esub">Tu maestro las irá subiendo.</div></div>'
      : (await Promise.all(pub.map(p => buildPracticeCardHTML(p)))).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function buildPracticeCardHTML(p) {
  const myId = AppState.currentUser?.id || '';
  const subs = myId ? await AppState.getStudentSubmissions(myId) : [];
  const done = subs.some(s => s.practiceId === p.id);
  const stars = '⭐'.repeat(p.difficulty || 1) + '☆'.repeat(3 - (p.difficulty || 1));
  return `
    <div class="pcard" onclick="openPrac('${p.id}')">
      <div class="pch"><span class="pnum">${p.num}</span><div class="pt">${p.title}</div></div>
      <div class="pb2">${(p.objective||'').substring(0,100)}${(p.objective||'').length>100?'…':''}</div>
      <div class="pf">
        <span style="color:var(--aw);font-size:12px">${stars}</span>
        ${done ? '<span class="tag tg">✓ Entregada</span>' : '<span class="tag tw">Pendiente</span>'}
      </div>
    </div>`;
}

async function renderTeacherPractices() {
  const el = document.getElementById('t-prac-list');
  if (!el) return;
  el.innerHTML = '<div class="empty"><div class="eico">⏳</div><div class="etxt">Cargando…</div></div>';
  try {
    const pracs = await AppState.getPracticas();
    if (!pracs.length) { el.innerHTML = '<div class="empty"><div class="eico">📝</div><div class="etxt">Aún no has creado prácticas.</div></div>'; return; }
    el.innerHTML = pracs.map(p => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <span class="tag tc">${p.num}</span>
          <span class="tag ${p.status==='published'?'tg':'tw'}">${p.status==='published'?'🟢 Publicada':'📄 Borrador'}</span>
        </div>
        <div class="card-t">${p.title||'Sin título'}</div>
        <div style="color:var(--td);font-size:12px;margin:6px 0 10px">${(p.objective||'').substring(0,80)}${(p.objective||'').length>80?'…':''}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn bo btn-sm" onclick="openPrac('${p.id}')">Vista previa</button>
          ${p.status==='draft'
            ? `<button class="btn bs btn-sm" onclick="publishPractice('${p.id}').then(renderTeacherPractices)">Publicar</button>`
            : `<button class="btn bg btn-sm" onclick="unpublishPractice('${p.id}').then(renderTeacherPractices)">Regresar a borrador</button>`}
          <button class="btn bg btn-sm" onclick="deletePractice('${p.id}').then(renderTeacherPractices)">🗑 Eliminar</button>
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function renderStudentTasks() {
  const el = document.getElementById('task-list');
  if (!el) return;
  el.innerHTML = '<div class="empty"><div class="eico">⏳</div><div class="etxt">Cargando tareas…</div></div>';
  try {
    const pub        = await AppState.getPublishedPracticas();
    const myId       = AppState.currentUser?.id || '';
    const mySubs     = myId ? await AppState.getStudentSubmissions(myId) : [];
    const submittedP = new Set(mySubs.map(s => `${s.practiceId}:${s.type}`));
    const pending    = pub.filter(p => {
      if (p.deliveryType === 'both') return !submittedP.has(`${p.id}:photo`) || !submittedP.has(`${p.id}:quiz`);
      return !submittedP.has(`${p.id}:${p.deliveryType}`);
    });

    if (!pending.length) { el.innerHTML = '<div class="empty"><div class="eico">🎉</div><div class="etxt">¡No hay tareas pendientes!</div></div>'; return; }

    el.innerHTML = pending.map(p => `
      <div class="card" id="task-card-${p.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span class="tag tc">${p.num}</span>
              <span class="tag ${p.deliveryType==='photo'?'tc':p.deliveryType==='quiz'?'tb':'tg'}">
                ${p.deliveryType==='photo'?'📷 Foto':p.deliveryType==='quiz'?'📝 Quiz':'📋 Ambos'}
              </span>
            </div>
            <div style="font-family:var(--head);font-weight:600;font-size:.95rem">${p.title}</div>
          </div>
          <button class="btn bg btn-sm" onclick="openPrac('${p.id}')">Ver práctica</button>
        </div>
        ${p.deliveryType==='quiz'||p.deliveryType==='both' ? `
          <div style="margin-top:10px;border-top:1px solid var(--b);padding-top:14px">
            <div style="font-family:var(--mono);font-size:10px;color:var(--tf);margin-bottom:10px;letter-spacing:.08em">CUESTIONARIO</div>
            ${buildQuizHTML(p.quiz, p.id)}
          </div>` : ''}
        ${p.deliveryType==='photo'||p.deliveryType==='both' ? `
          <div style="margin-top:10px;border-top:1px solid var(--b);padding-top:14px">
            <div style="font-family:var(--mono);font-size:10px;color:var(--tf);margin-bottom:10px;letter-spacing:.08em">ENTREGA DE FOTO</div>
            <div class="drop" data-context="photo" data-practice="${p.id}" onclick="this.querySelector('input').click()">
              <input type="file" accept="image/jpeg,image/png,image/webp,.heic" onchange="handlePhotoUpload(event,'${p.id}')">
              <div style="font-size:24px;margin-bottom:6px">📷</div>
              <div style="font-family:var(--mono);font-size:12px;color:var(--td)">Sube foto del circuito armado</div>
              <div style="font-size:11px;color:var(--tf);margin-top:4px">JPG · PNG · WEBP · máx. 10 MB</div>
            </div>
          </div>` : ''}
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function renderPendingSubmissions() {
  const el = document.getElementById('foro-entregas');
  if (!el) return;
  try {
    const pending = await AppState.getPendingGrading();
    const pracs   = await AppState.getPracticas();
    if (!pending.length) { el.innerHTML = '<div class="empty"><div class="eico">✅</div><div class="etxt">Todas las entregas están calificadas.</div></div>'; return; }
    el.innerHTML = pending.map(s => {
      const p    = pracs.find(x => x.id === s.practiceId);
      const date = new Date(s.submittedAt).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
      return `
        <div class="fpost" onclick="selectSubmission('${s.id}')">
          <div class="fau">
            <div class="fav stu">${(s.studentName||'?')[0]}</div>
            <div><div class="fname">${s.studentName}</div><div class="ftime">${p?.num||''} ${p?.title||''} · ${date}</div></div>
            <span class="tag tw" style="margin-left:auto">Pendiente</span>
          </div>
          <div style="font-size:12px;color:var(--td)">
            ${s.type==='photo' ? `📷 <a href="${s.fileUrl}" target="_blank" style="color:var(--a2)">Ver foto</a>` : `📝 Quiz: ${s.quizScore}/${p?.quiz?.length??'?'}`}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function renderStudentList() {
  const el = document.getElementById('student-table');
  if (!el) return;
  try {
    const alumnos = await AppState.getAlumnos();
    const pracs   = await AppState.getPublishedPracticas();
    if (!alumnos.length) { el.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--td);font-family:var(--mono);font-size:12px">Sin alumnos inscritos todavía.</td></tr>`; return; }
    const rows = await Promise.all(alumnos.map(async s => {
      const subs   = await AppState.getStudentSubmissions(s.id);
      const graded = subs.filter(x => x.grade != null);
      const avg    = graded.length ? (graded.reduce((a,b) => a+b.grade,0)/graded.length).toFixed(1) : '—';
      const status = !pracs.length ? 'Sin prácticas' : subs.length >= pracs.length ? 'Al corriente' : subs.length > 0 ? 'Pendiente' : 'Sin entregas';
      return `
        <tr style="border-bottom:1px solid var(--b)">
          <td style="padding:10px 8px">
            <div style="display:flex;align-items:center;gap:8px">
              <div class="av" style="width:26px;height:26px;font-size:10px">${(s.name||'?').split(' ').map(x=>x[0]).join('')}</div>
              <div><div style="font-size:13px">${s.name}</div><div style="font-size:11px;color:var(--tf);font-family:var(--mono)">${s.matricula||''}</div></div>
            </div>
          </td>
          <td style="padding:10px 8px;font-size:12px;color:var(--td)">${s.group||'—'}</td>
          <td style="padding:10px 8px;font-size:12px;color:var(--td)">${s.email||'—'}</td>
          <td style="padding:10px 8px;font-family:var(--mono);font-size:12px">${subs.length}/${pracs.length}</td>
          <td style="padding:10px 8px;font-family:var(--mono);font-size:12px;color:var(--a3)">${avg}</td>
          <td style="padding:10px 8px">
            <span class="tag ${status==='Al corriente'?'tg':status==='Pendiente'?'tw':'tr'}" style="margin-bottom:4px">${status}</span><br>
            <button class="btn bg btn-sm" style="margin-top:4px" onclick="removeStudent('${s.id}').then(()=>{renderStudentList();renderStudentCount()})">Dar de baja</button>
          </td>
        </tr>`;
    }));
    el.innerHTML = rows.join('');
  } catch (err) {
    el.innerHTML = `<tr><td colspan="6" style="padding:20px;color:var(--ar)">Error: ${err.message}</td></tr>`;
  }
}

async function renderStudentCount() {
  const el = document.getElementById('t-student-count');
  if (!el) return;
  try { el.textContent = (await AppState.getAlumnos()).length; } catch (_) { el.textContent = '?'; }
}

async function renderLabMaterials() {
  const el = document.getElementById('lab-materials');
  if (!el) return;
  try {
    const mats  = await AppState.getMateriales();
    const icons = { pdf:'📄', video:'🎥', code:'💾', image:'🖼️', other:'📁' };
    el.innerHTML = mats.length === 0
      ? '<div class="empty"><div class="eico">📂</div><div class="etxt">El docente aún no ha subido materiales.</div></div>'
      : mats.map(m => `
          <div class="card" style="display:flex;align-items:center;gap:14px;cursor:pointer" onclick="window.open('${m.fileUrl}','_blank')">
            <div style="font-size:32px;flex-shrink:0">${icons[m.category]||'📁'}</div>
            <div style="flex:1"><div class="card-t">${m.name}</div><div style="color:var(--td);font-size:12px;margin-top:3px">${formatDate(m.uploadedAt)}</div></div>
            <span class="tag tb">${m.ext?.toUpperCase()}</span>
          </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function renderMaterialList() {
  const el = document.getElementById('mat-list');
  if (!el) return;
  try {
    const mats  = await AppState.getMateriales();
    const icons = { pdf:'📄', video:'🎥', code:'💾', image:'🖼️', other:'📁' };
    el.innerHTML = mats.length === 0
      ? '<div class="empty"><div class="eico">📂</div><div class="etxt">Sin materiales todavía.</div></div>'
      : mats.map(m => `
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--b)">
            <span style="font-size:18px">${icons[m.category]||'📁'}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.name}</span>
            <span class="tag tb">${m.ext?.toUpperCase()}</span>
            <button class="btn bg btn-sm" onclick="deleteMaterial('${m.id}').then(()=>{renderMaterialList();renderLabMaterials()})">✕</button>
          </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty"><div class="eico">⚠️</div><div class="etxt">Error: ${err.message}</div></div>`;
  }
}

async function populateForumSelects() {
  try {
    const alumnos = await AppState.getAlumnos();
    const pracs   = await AppState.getPublishedPracticas();
    const stuSel  = document.getElementById('foro-student');
    const pracSel = document.getElementById('foro-practice');
    if (stuSel)  stuSel.innerHTML  = alumnos.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if (pracSel) pracSel.innerHTML = '<option value="">— Selecciona —</option>' + pracs.map(p => `<option value="${p.id}">${p.num} — ${p.title}</option>`).join('');
  } catch (_) {}
}

async function populateMaterialSelects() {
  try {
    const pracs = await AppState.getPublishedPracticas();
    const sel   = document.getElementById('mat-practice');
    if (!sel) return;
    sel.innerHTML = '<option value="">— General —</option>' + pracs.map(p => `<option value="${p.id}">${p.num} — ${p.title}</option>`).join('');
  } catch (_) {}
}
