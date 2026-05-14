
const HW_COMPONENTS = [
  { ico:'🔴', name:'LED Rojo 5mm',         desc:'Diodo emisor de luz. Vf≈1.8V, If=20mA. Usa R=220Ω con 5V.',                specs:'Vf=1.8V · If=20mA' },
  { ico:'🟢', name:'LED Verde 5mm',        desc:'LED verde estándar. Más eficiente que el rojo. Vf≈2.1V.',                   specs:'Vf=2.1V · If=20mA' },
  { ico:'🔵', name:'LED Azul 5mm',         desc:'LED azul de alto brillo. Requiere mayor voltaje umbral.',                   specs:'Vf=3.0V · If=20mA' },
  { ico:'⚡', name:'Resistencia 220Ω',     desc:'Para proteger LEDs con 5V. Banda marrón-rojo-negro.',                       specs:'220Ω ±5% · ¼W' },
  { ico:'🔧', name:'Resistencia 1kΩ',      desc:'Uso general: divisores de voltaje, pull-up/down.',                          specs:'1kΩ ±5% · ¼W' },
  { ico:'🎚️', name:'Potenciómetro 10kΩ',   desc:'Control analógico. 3 terminales: Vcc, GND, Wiper (salida variable).',      specs:'10kΩ · Lineal B' },
  { ico:'🔘', name:'Botón Pulsador',        desc:'Normalmente abierto (NO). Usar con resistencia pull-down 10kΩ.',            specs:'NO · 6×6mm' },
  { ico:'🔊', name:'Buzzer Activo',         desc:'Genera tono fijo al aplicar 5V. No requiere señal PWM.',                   specs:'5V · 2.3kHz' },
  { ico:'🌡️', name:'Sensor TMP36',          desc:'Salida analógica lineal. T(°C) = (Vout − 0.5) / 0.01',                    specs:'−40 a +125°C' },
  { ico:'📟', name:'Display 7 Segmentos',   desc:'Cátodo común. 8 pines (a–g + dp). Resistencia en cada segmento.',          specs:'CC · 5V · Rojo' },
];

const HW_CIRCUITS = [
  {
    title:'Circuito 1 — LED con resistencia limitadora',
    level:'⭐ Básica',
    comps:['LED','Resistencia 220Ω','Fuente 5V'],
    diagram:`[5V (Pin 5V)] ──[R 220Ω]──[LED+]──[LED−]──[GND]\n\nCálculo:\nR = (Vcc − Vled) / Iled\nR = (5 − 2.0) / 0.020 = 150Ω → usar 220Ω`,
    desc:'El circuito más fundamental. Limita la corriente para no quemar el LED.',
  },
  {
    title:'Circuito 2 — Divisor de voltaje',
    level:'⭐ Básica',
    comps:['R1=1kΩ','R2=2.2kΩ','Multímetro','Fuente 5V'],
    diagram:`[5V]──[R1=1kΩ]──[Nodo A]──[R2=2.2kΩ]──[GND]\n              │\n         [Voltímetro]\n\nVout = Vcc × R2/(R1+R2) = 5 × 2200/3200 = 3.44V`,
    desc:'Principio fundamental para sensores y referencias de voltaje.',
  },
  {
    title:'Circuito 3 — LED controlado por Arduino',
    level:'⭐⭐ Intermedia',
    comps:['Arduino UNO','LED','Resistencia 220Ω','Jumpers'],
    diagram:`[Pin13]──[R220]──[LED+]──[LED−]──[GND]\n\nvoid loop() {\n  digitalWrite(13, HIGH); delay(500);\n  digitalWrite(13, LOW);  delay(500);\n}`,
    desc:'Control digital de actuadores desde microcontrolador.',
  },
  {
    title:'Circuito 4 — Fading con PWM',
    level:'⭐⭐ Intermedia',
    comps:['Arduino UNO','LED azul','Resistencia 220Ω','Potenciómetro 10kΩ'],
    diagram:`[A0] ← [POT wiper]\n[Pin9]──[R220]──[LED]──[GND]\n\nint v = analogRead(A0);   // 0–1023\nanalogWrite(9, v / 4);    // 0–255`,
    desc:'Modulación PWM para control de brillo sin pérdida de energía.',
  },
  {
    title:'Circuito 5 — Semáforo con 3 LEDs',
    level:'⭐⭐ Intermedia',
    comps:['Arduino UNO','LED rojo','LED amarillo','LED verde','3 × R220Ω'],
    diagram:`[Pin2]──[R220]──[LED Rojo]──[GND]\n[Pin3]──[R220]──[LED Amarillo]──[GND]\n[Pin4]──[R220]──[LED Verde]──[GND]\n\nSecuencia: Verde → Amarillo → Rojo → Verde`,
    desc:'Aplicación de secuencia temporal. Base de sistemas de control.',
  },
  {
    title:'Circuito 6 — Sensor temperatura + alarma',
    level:'⭐⭐⭐ Avanzada',
    comps:['Arduino UNO','TMP36','Buzzer','LED rojo','R220Ω'],
    diagram:`[TMP36 Vout] ── [A1]\n[Pin8] ── [BUZZER] ── [GND]\n[Pin7] ── [R220] ── [LED] ── [GND]\n\nT = (V − 0.5) × 100\nif(T > 35°C) → ALARMA`,
    desc:'Sistema embebido de monitoreo con sensado analógico y salidas digitales.',
  },
];

const HW_CODES = [
  { title:'Blink básico',      code:`void setup(){pinMode(13,OUTPUT);}\nvoid loop(){digitalWrite(13,HIGH);delay(1000);digitalWrite(13,LOW);delay(1000);}` },
  { title:'Lectura analógica', code:`void setup(){Serial.begin(9600);}\nvoid loop(){int v=analogRead(A0);Serial.println(v);delay(200);}` },
  { title:'PWM con pot',       code:`void setup(){Serial.begin(9600);}\nvoid loop(){int p=analogRead(A0);int w=map(p,0,1023,0,255);analogWrite(9,w);Serial.println(w);delay(100);}` },
  { title:'Sensor TMP36',      code:`void setup(){Serial.begin(9600);}\nvoid loop(){int r=analogRead(A1);float v=r*(5.0/1023.0);float t=(v-0.5)/0.01;Serial.println(t);delay(500);}` },
  { title:'Buzzer alarma',     code:`void setup(){pinMode(8,OUTPUT);}\nvoid loop(){tone(8,2300,200);delay(500);}` },
  { title:'Serie bidireccional',code:`void setup(){Serial.begin(9600);pinMode(13,OUTPUT);}\nvoid loop(){if(Serial.available()){char c=Serial.read();if(c=='1')digitalWrite(13,HIGH);if(c=='0')digitalWrite(13,LOW);}}` },
];

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  if (!email || !password) {
    errEl.textContent = 'Ingresa correo y contraseña.';
    errEl.classList.add('on'); return;
  }

  btn.textContent = 'Entrando…';
  btn.disabled    = true;
  errEl.classList.remove('on');

  try {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión.');

    localStorage.setItem('electro_token', data.token);
    localStorage.setItem('electro_user',  JSON.stringify(data.user));

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('btn-logout').style.display   = 'inline-flex';

    activatePanel(data.user);

  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.add('on');
  } finally {
    btn.textContent = 'Iniciar Sesión';
    btn.disabled    = false;
  }
}

function doLogout() {
  localStorage.removeItem('electro_token');
  localStorage.removeItem('electro_user');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('btn-logout').style.display   = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('login-error').classList.remove('on');
}

function activatePanel(user) {
  document.getElementById('role-label').textContent  = user.name;
  document.getElementById('av-initials').textContent =
    user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const badge = document.getElementById('nav-role-badge');
  if (badge) {
    badge.innerHTML = user.role === 'teacher'
      ? '<span class="tag tb">👨‍🏫 Docente</span>'
      : '<span class="tag tg">🎒 Alumno</span>';
  }

  const panel = user.role === 'teacher' ? 'teacher' : 'student';
  setPanel(panel);
}

function setPanel(panel) {
  const sidebars   = { student:'sidebar-student', teacher:'sidebar-teacher', hardware:'sidebar-hardware' };
  const firstPages = { student:'s-dashboard',     teacher:'t-dashboard',     hardware:'h-modulo' };

  Object.values(sidebars).forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(sidebars[panel]).style.display = 'flex';

  document.querySelectorAll('.page').forEach(p => { p.classList.remove('on'); p.style.display = 'none'; });
  const fp = document.getElementById(firstPages[panel]);
  if (fp) { fp.classList.add('on'); fp.style.display = 'block'; }

  document.querySelectorAll('#' + sidebars[panel] + ' .si').forEach(i => i.classList.remove('on'));
  document.querySelector('#' + sidebars[panel] + ' .si')?.classList.add('on');

  if (panel === 'student')  refreshStudentDashboard();
  if (panel === 'teacher')  refreshTeacherDashboard();
  if (panel === 'hardware') renderHardwarePages();
}

function goHardware() {
  setPanel('hardware');
}

function showPage(id, el, sidebarId) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('on'); p.style.display = 'none'; });
  const p = document.getElementById(id);
  p.classList.add('on'); p.style.display = 'block';
  if (sidebarId) {
    document.querySelectorAll('#' + sidebarId + ' .si').forEach(i => i.classList.remove('on'));
    if (el) el.classList.add('on');
  }
}

function refreshStudentDashboard() {
  const state      = ElectroLab.AppState;
  const published  = state.getPublishedPractices();
  const submissions = state.getStudentSubmissions(state.currentUser?.id || 'stu-001');
  const submittedIds = new Set(submissions.map(s => s.practiceId));
  const pending    = published.filter(p => !submittedIds.has(p.id));
  const savedUser = JSON.parse(localStorage.getItem('electro_user') || '{}');
  document.getElementById('dash-subtitle').textContent =
    `// Bienvenido, ${savedUser?.name || 'Alumno'} — Electrotecnia IPN`;

  document.getElementById('dash-completed').textContent = submissions.length;
  document.getElementById('dash-pending').textContent   = pending.length;
  document.getElementById('dash-total').textContent     = published.length;

  const dpl = document.getElementById('dash-prac-list');
  if (published.length === 0) {
    dpl.innerHTML = '<div class="empty"><div class="eico">📭</div><div class="etxt">El docente aún no ha publicado prácticas.</div></div>';
  } else {
    dpl.innerHTML = published.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:8px 0;border-bottom:1px solid var(--b)">
        <div>
          <div style="font-weight:600">${p.num} — ${p.title}</div>
          <div style="color:var(--td);font-size:11px;font-family:var(--mono)">${'⭐'.repeat(p.difficulty)} · ${p.deliveryType === 'photo' ? '📷 Foto' : p.deliveryType === 'quiz' ? '📝 Quiz' : '📋 Ambos'}</div>
        </div>
        <span class="tag ${submittedIds.has(p.id) ? 'tg' : 'tw'}">${submittedIds.has(p.id) ? '✓ Entregada' : 'Pendiente'}</span>
      </div>`).join('');
  }

  const ds = document.getElementById('dash-submissions');
  if (submissions.length === 0) {
    ds.innerHTML = '<div class="empty"><div class="eico">📮</div><div class="etxt">No has entregado nada todavía.</div></div>';
  } else {
    ds.innerHTML = submissions.map(s => {
      const prac = state.practices.find(p => p.id === s.practiceId);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:8px 0;border-bottom:1px solid var(--b)">
          <div>
            <div style="font-weight:600">${prac?.title || 'Práctica'}</div>
            <div style="color:var(--td);font-size:11px;font-family:var(--mono)">${ElectroLab.formatDate(s.submittedAt)}</div>
          </div>
          ${s.grade != null
            ? `<span class="tag tg">${s.grade}/10</span>`
            : '<span class="tag tw">Sin calificar</span>'}
        </div>`;
    }).join('');
  }
}

function refreshTeacherDashboard() {
  const state    = ElectroLab.AppState;
  const pending  = state.getPendingGrading();
  const published = state.getPublishedPractices();

  document.getElementById('teacher-subtitle').textContent =
    `// ${state.currentUser?.name || 'Docente'} — Electrotecnia IPN`;

  document.getElementById('t-total-pracs').textContent   = state.practices.length;
  document.getElementById('t-published').textContent     = published.length;
  document.getElementById('t-pending-grade').textContent = pending.length;

  const tr = document.getElementById('t-recent-submissions');
  const recent = [...state.submissions].sort((a,b) => b.submittedAt - a.submittedAt).slice(0, 5);
  if (recent.length === 0) {
    tr.innerHTML = '<div class="empty"><div class="eico">📮</div><div class="etxt">Sin entregas todavía.</div></div>';
  } else {
    tr.innerHTML = recent.map(s => {
      const prac = state.practices.find(p => p.id === s.practiceId);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:8px 0;border-bottom:1px solid var(--b)">
          <div>
            <div style="font-weight:600">${s.studentName}</div>
            <div style="color:var(--td);font-size:11px">${prac?.num} ${prac?.title || ''}</div>
          </div>
          ${s.grade != null
            ? `<span class="tag tg">${s.grade}/10</span>`
            : '<span class="tag tw">Sin calificar</span>'}
        </div>`;
    }).join('');
  }

  const tg = document.getElementById('t-group-status');
  if (published.length === 0) {
    tg.innerHTML = '<div class="empty"><div class="eico">👥</div><div class="etxt">Publica prácticas para ver el progreso.</div></div>';
  } else {
    tg.innerHTML = published.map(p => {
      const count = state.submissions.filter(s => s.practiceId === p.id).length;
      const total = state.students.length;
      const pct   = total ? Math.round(count / total * 100) : 0;
      return `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span>${p.num} ${p.title.substring(0,30)}…</span>
            <span style="font-family:var(--mono);color:var(--td)">${count}/${total}</span>
          </div>
          <div class="pw"><div class="pb" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  ElectroLab.renderStudentList();
  ElectroLab.renderStudentCount();

  const tse = document.getElementById('t-total-submissions');
  if (tse) tse.textContent = state._submissions.length;

  populateForumSelects();
  populateMaterialSelects();
  renderMaterialList();
}

function populateForumSelects() {
  const state    = ElectroLab.AppState;
  const stuSel   = document.getElementById('foro-student');
  const pracSel  = document.getElementById('foro-practice');
  if (stuSel)  stuSel.innerHTML  = state.students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  if (pracSel) pracSel.innerHTML = '<option value="">— Selecciona —</option>' +
    state.getPublishedPractices().map(p => `<option value="${p.id}">${p.num} — ${p.title}</option>`).join('');
}

function populateMaterialSelects() {
  const sel = document.getElementById('mat-practice');
  if (!sel) return;
  sel.innerHTML = '<option value="">— General —</option>' +
    ElectroLab.AppState.getPublishedPractices()
      .map(p => `<option value="${p.id}">${p.num} — ${p.title}</option>`).join('');
}

//let _pendingMaterialFile = null; 

async function handleMaterialUpload(event) {
  await ElectroLab.handleFileInput(event, (record) => {
    _pendingMaterialFile = record;
  }, 'material');
}

function saveMaterial() {
  if (!_pendingMaterialFile) {
    ElectroLab.notify('Primero selecciona un archivo.', 'error');
    return;
  }
  const title    = document.getElementById('mat-title')?.value?.trim() || _pendingMaterialFile.name;
  const category = document.getElementById('mat-category')?.value || 'pdf';
  const practiceId = document.getElementById('mat-practice')?.value || null;

  ElectroLab.AppState.addMaterial(_pendingMaterialFile, { category, practiceId });
  _pendingMaterialFile = null;

  if (document.getElementById('mat-title')) document.getElementById('mat-title').value = '';
  resetDropZoneById('mat-drop');
  renderMaterialList();
  renderLabMaterials();
}

function resetDropZoneById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <input type="file" id="mat-file-input"
           accept=".pdf,.ino,image/jpeg,image/png,video/mp4,video/quicktime"
           onchange="handleMaterialUpload(event)">
    <div style="font-size:32px;margin-bottom:8px">📤</div>
    <div style="font-family:var(--mono);font-size:12px;color:var(--td)">Arrastra el archivo aquí</div>
    <div style="font-size:11px;color:var(--tf);margin-top:4px">PDF · .ino · PNG · JPG · MP4 · máx. 50 MB</div>`;
}

function renderMaterialList() {
  const el = document.getElementById('mat-list');
  if (!el) return;
  const mats = ElectroLab.AppState.materials;
  if (mats.length === 0) {
    el.innerHTML = '<div class="empty"><div class="eico">📂</div><div class="etxt">Sin materiales subidos todavía.</div></div>';
    return;
  }
  el.innerHTML = mats.map(m => {
    const icons = { pdf:'📄', video:'🎥', code:'💾', image:'🖼️', other:'📁' };
    return `
      <div style="display:flex;align-items:center;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px solid var(--b)">
        <span style="font-size:18px">${icons[m.category] || '📁'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.name}</span>
        <span class="tag tb">${m.ext.toUpperCase()}</span>
        <button class="btn bg btn-sm"
          onclick="ElectroLab.AppState.materials.splice(ElectroLab.AppState.materials.findIndex(x=>x.id==='${m.id}'),1);renderMaterialList()">✕</button>
      </div>`;
  }).join('');
}

function renderLabMaterials() {
  const el = document.getElementById('lab-materials');
  if (!el) return;
  const mats = ElectroLab.AppState.materials;
  if (mats.length === 0) {
    el.innerHTML = '<div class="empty"><div class="eico">📂</div><div class="etxt">El docente aún no ha subido materiales.</div></div>';
    return;
  }
  const icons = { pdf:'📄', video:'🎥', code:'💾', image:'🖼️', other:'📁' };
  el.innerHTML = mats.map(m => `
    <div class="card" style="display:flex;align-items:center;gap:14px;cursor:pointer"
         onclick="downloadMaterial('${m.id}')">
      <div style="font-size:32px;flex-shrink:0">${icons[m.category] || '📁'}</div>
      <div style="flex:1">
        <div class="card-t">${m.name}</div>
        <div style="color:var(--td);font-size:12px;margin-top:3px">${ElectroLab.formatDate(m.uploadedAt)}</div>
      </div>
      <span class="tag tb">${m.ext.toUpperCase()}</span>
    </div>`).join('');
}

function downloadMaterial(matId) {
  const m = ElectroLab.AppState.materials.find(x => x.id === matId);
  if (!m) return;
  const a = document.createElement('a');
  a.href     = m.dataUrl;
  a.download = m.name;
  a.click();
}

const _editorFiles = []; 

async function handleEditorFiles(event) {
  const files = [...(event.target.files || [])];
  for (const file of files) {
    try {
      const record = await ElectroLab.validateAndReadFile(file, 'material');
      _editorFiles.push(record);
      renderEditorFileList();
    } catch (_) { /* validación ya notificada */ }
  }
}

function renderEditorFileList() {
  const el = document.getElementById('editor-file-list');
  if (!el) return;
  el.innerHTML = _editorFiles.map((f, i) => `
    <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid var(--b)">
      <span>📎</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
      <span style="font-family:var(--mono);color:var(--tf)">${ElectroLab.formatBytes(f.sizeBytes)}</span>
      <button class="btn bg btn-sm" onclick="_editorFiles.splice(${i},1);renderEditorFileList()">✕</button>
    </div>`).join('');
}

let _stepCount = 1;

function addStep() {
  _stepCount++;
  const container = document.getElementById('ed-steps');
  const row = document.createElement('div');
  row.className = 'step-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
  row.innerHTML = `
    <span class="tag tc" style="flex-shrink:0;margin-top:8px">${String(_stepCount).padStart(2,'0')}</span>
    <textarea placeholder="Paso ${_stepCount}…" style="flex:1;min-height:56px"></textarea>
    <button class="btn bg btn-sm" style="margin-top:8px" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(row);
}

function addCustomComponent() {
  const name = prompt('Nombre del componente:');
  if (!name?.trim()) return;
  const list = document.getElementById('ed-comp-list');
  const row  = document.createElement('div');
  row.className = 'chi';
  row.innerHTML = `<input type="checkbox" checked><span>${name.trim()}</span>`;
  list.appendChild(row);
}

async function openPrac(id) {
  let p;
  try {
    const token = localStorage.getItem('electro_token') || '';
    const res   = await fetch(`/api/practicas/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No encontrada');
    p = await res.json();
  } catch(e) {
    p = ElectroLab.AppState._practices?.find(x => x.id === id);
  }
  if (!p) return;

  document.getElementById('m-num').textContent   = p.num;
  document.getElementById('m-title').textContent = p.title;
  document.getElementById('m-obj').textContent   = p.objective;
  document.getElementById('m-diff').textContent  = '⭐'.repeat(p.difficulty) + '☆'.repeat(3 - p.difficulty);

  document.getElementById('m-checklist').innerHTML = (p.components || []).map(c =>
    `<div class="chi"><input type="checkbox"><span>${c}</span></div>`).join('') ||
    '<div style="color:var(--tf);font-size:13px">Sin componentes definidos.</div>';

  document.getElementById('m-circuit').textContent = p.circuitDiagram || '— Sin diagrama —';

  document.getElementById('m-steps').innerHTML = (p.steps || []).map((s, i) => `
    <div style="display:flex;gap:10px;align-items:flex-start">
      <span class="tag tc" style="flex-shrink:0">${String(i+1).padStart(2,'0')}</span>
      <div style="font-size:13px;line-height:1.5;padding-top:2px">${s}</div>
    </div>`).join('') || '<div style="color:var(--tf);font-size:13px">Sin pasos definidos.</div>';

  const codeEl = document.getElementById('m-code');
  const codeWrap = document.getElementById('m-code-wrap');
  if (p.codeSnippet) {
    codeEl.textContent  = p.codeSnippet;
    codeWrap.style.display = 'block';
  } else {
    codeWrap.style.display = 'none';
  }

  document.getElementById('prac-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('prac-modal').classList.remove('on');
  document.body.style.overflow = '';
}

document.getElementById('prac-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('prac-modal')) closeModal();
});

function renderHardwarePages() {
  const hcl = document.getElementById('hw-comp-list');
  if (hcl) hcl.innerHTML = HW_COMPONENTS.map(c => `
    <div class="comp">
      <div class="comp-img">${c.ico}</div>
      <div class="comp-info">
        <div class="comp-name">${c.name}</div>
        <div style="font-size:12px;color:var(--td);line-height:1.5;margin-bottom:8px">${c.desc}</div>
        <span class="tag tc">${c.specs}</span>
      </div>
    </div>`).join('');

  const cl = document.getElementById('circuitos-list');
  if (cl) cl.innerHTML = HW_CIRCUITS.map(c => `
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <div class="card-t">${c.title}</div>
        <span class="tag tw">${c.level}</span>
      </div>
      <div style="color:var(--td);font-size:13px;margin-bottom:12px">${c.desc}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${c.comps.map(x => `<span class="tag tb">${x}</span>`).join('')}</div>
      <div class="circuit">${c.diagram}</div>
    </div>`).join('');

  const cdl = document.getElementById('code-list');
  if (cdl) cdl.innerHTML = HW_CODES.map(c => `
    <div class="card">
      <div class="card-t" style="margin-bottom:10px">${c.title}</div>
      <div style="background:#020912;border-radius:6px;padding:12px;font-family:var(--mono);font-size:11px;line-height:1.8;color:var(--a2);white-space:pre-wrap">${c.code}</div>
    </div>`).join('');

  const cc = document.getElementById('comp-cards');
  if (cc) cc.innerHTML = HW_COMPONENTS.map(c => `
    <div class="comp">
      <div class="comp-img">${c.ico}</div>
      <div class="comp-info">
        <div class="comp-name">${c.name}</div>
        <div style="font-size:12px;color:var(--td);line-height:1.5;margin-bottom:8px">${c.desc}</div>
        <span class="tag tc">${c.specs}</span>
      </div>
    </div>`).join('');
}

function buildPracticeCardHTML(p) {
  const state = ElectroLab.AppState;
  const subs  = state.getStudentSubmissions(state.currentUser?.id || 'stu-001');
  const submitted = subs.some(s => s.practiceId === p.id);
  const stars = '⭐'.repeat(p.difficulty) + '☆'.repeat(3 - p.difficulty);
  const statusTag = submitted
    ? '<span class="tag tg">✓ Entregada</span>'
    : '<span class="tag tw">Pendiente</span>';

  return `
    <div class="pcard" onclick="openPrac('${p.id}')">
      <div class="pch">
        <span class="pnum">${p.num}</span>
        <div class="pt">${p.title}</div>
      </div>
      <div class="pb2">${p.objective?.substring(0, 100) || ''}${p.objective?.length > 100 ? '…' : ''}</div>
      <div class="pf">
        <span style="color:var(--aw);font-size:12px">${stars}</span>
        ${statusTag}
      </div>
    </div>`;
}

const _origRenderStudentPractices = ElectroLab.renderStudentPractices;
ElectroLab.renderStudentPractices = function() {
  const container = document.getElementById('prac-list');
  if (!container) return;
  const published = ElectroLab.AppState.getPublishedPractices();
  if (published.length === 0) {
    container.innerHTML = '<div class="empty"><div class="eico">📭</div><div class="etxt">Aún no hay prácticas publicadas.</div><div class="esub">Tu maestro las irá subiendo.</div></div>';
  } else {
    container.innerHTML = published.map(p => buildPracticeCardHTML(p)).join('');
  }
};

function initElectroLabUI() {
  renderHardwarePages();

  const savedUser  = localStorage.getItem('electro_user');
  const savedToken = localStorage.getItem('electro_token');

  if (savedUser && savedToken) {
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${savedToken}` }
    })
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
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initElectroLabUI);
} else {
  initElectroLabUI();
}

async function submitEnrollForm() {
  const data = {
    name:      document.getElementById('enroll-name')?.value?.trim(),
    matricula: document.getElementById('enroll-matricula')?.value?.trim(),
    email:     document.getElementById('enroll-email')?.value?.trim(),
    password:  document.getElementById('enroll-password')?.value?.trim(),
    group:     document.getElementById('enroll-group')?.value || 'G1',
  };

  if (!data.name)      { ElectroLab.notify('El nombre es obligatorio.', 'error'); return; }
  if (!data.matricula) { ElectroLab.notify('La matrícula es obligatoria.', 'error'); return; }
  if (!data.email)     { ElectroLab.notify('El correo es obligatorio.', 'error'); return; }
  if (!data.password)  { ElectroLab.notify('La contraseña inicial es obligatoria.', 'error'); return; }

  const token = localStorage.getItem('electro_token') || '';
  try {
    const res = await fetch('/api/alumnos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al inscribir alumno.');

    ElectroLab.notify(`Alumno "${result.name}" inscrito. Ya puede iniciar sesión.`, 'success');

    ['enroll-name','enroll-matricula','enroll-email','enroll-password'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });

    if (typeof ElectroLab.renderStudentList === 'function') {
      ElectroLab.renderStudentList();
      ElectroLab.renderStudentCount();
    }
  } catch (err) {
    ElectroLab.notify(err.message, 'error');
  }
}
