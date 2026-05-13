'use strict';

function gradeQuiz(questions, answers) {
  return questions.reduce((sc, q, i) => sc + (answers[i] === q.ans ? 1 : 0), 0);
}

function buildQuizHTML(questions, practiceId) {
  if (!questions?.length) return '<p style="color:var(--td);font-size:13px">Sin cuestionario asignado.</p>';
  return `
    <div class="qwrap" id="quiz-${practiceId}">
      ${questions.map((q, i) => `
        <div class="qitem" id="qi-${practiceId}-${i}">
          <div class="qtext">${i + 1}. ${q.q}</div>
          <div class="qopts">
            ${q.opts.map((o, j) => `
              <label class="qopt" id="qopt-${practiceId}-${i}-${j}"
                     onclick="selectQuizOpt('${practiceId}',${i},${j})">
                <input type="radio" name="quiz-${practiceId}-q${i}" value="${j}"> ${o}
              </label>`).join('')}
          </div>
          <div id="qfb-${practiceId}-${i}"></div>
        </div>`).join('')}
    </div>
    <div style="margin-top:14px;display:flex;gap:10px">
      <button class="btn bp" onclick="submitQuizFromModal('${practiceId}')">Enviar cuestionario</button>
      <button class="btn bg" onclick="resetQuizInModal('${practiceId}')">Reiniciar</button>
    </div>`;
}

function selectQuizOpt(practiceId, qi, oi) {
  document.querySelectorAll(`#qi-${practiceId}-${qi} .qopt`).forEach(o => o.classList.remove('sel'));
  document.getElementById(`qopt-${practiceId}-${qi}-${oi}`)?.classList.add('sel');
}

async function submitQuizFromModal(practiceId) {
  const pracs    = await AppState.getPracticas();
  const practice = pracs.find(p => p.id === practiceId);
  if (!practice?.quiz) return;

  const answers = practice.quiz.map((_, i) => {
    const sel = document.querySelector(`[name="quiz-${practiceId}-q${i}"]:checked`);
    return sel ? parseInt(sel.value) : null;
  });

  const missing = answers.filter(a => a === null).length;
  if (missing) { notify(`Faltan ${missing} pregunta(s) por responder.`, 'error'); return; }

  let score = 0;
  practice.quiz.forEach((q, i) => {
    const ok = answers[i] === q.ans;
    if (ok) score++;
    const fb = document.getElementById(`qfb-${practiceId}-${i}`);
    if (fb) { fb.className = 'qfb ' + (ok ? 'ok' : 'bad'); fb.textContent = ok ? `✓ ${q.fb}` : `✗ Correcta: ${q.opts[q.ans]}`; }
    document.getElementById(`qopt-${practiceId}-${i}-${answers[i]}`)?.classList.add(ok ? 'cor' : 'err');
    if (!ok) document.getElementById(`qopt-${practiceId}-${i}-${q.ans}`)?.classList.add('cor');
  });

  await submitWork({ practiceId, type: 'quiz', quizAnswers: answers });
}

function resetQuizInModal(practiceId) {
  document.querySelectorAll(`#quiz-${practiceId} .qopt`).forEach(o => o.classList.remove('sel','cor','err'));
  document.querySelectorAll(`#quiz-${practiceId} .qfb`).forEach(f => { f.className = ''; f.textContent = ''; });
  document.querySelectorAll(`#quiz-${practiceId} input[type=radio]`).forEach(r => r.checked = false);
}
