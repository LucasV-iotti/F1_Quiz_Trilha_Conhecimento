// F1 Quiz – telas turbinadas + pista larga/baixa + carro no traçado central do SVG
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ===== Estado do jogo ===== */
let state = {
  playerName: '',
  cpf: '',
  score: 0,
  current: 0,
  hits: 0,
  miss: 0,
};

/* ===== Perguntas (do seu arquivo) ===== */
const questions = [
  { q:'1. Qual é um dos principais riscos do uso do cartão de crédito?', options:['A) Não poder parcelar compras','B) Entrar no crédito rotativo com juros altos','C) Não ter limite para compras','D) Não poder usar em compras online'], answer:1 },
  { q:'2. O cheque especial é um tipo de crédito ________ oferecido pelo banco, ligado diretamente à conta corrente.', options:['A) parcelado','B) automático','C) garantido','D) consignado'], answer:1 },
  { q:'3. Qual é um benefício do empréstimo pessoal?', options:['A) Não pagar juros','B) Parcelas variáveis','C) Dinheiro rápido para emergências','D) Não comprometer a renda mensal'], answer:2 },
  { q:'4. Quando o cliente atrasa o pagamento, além dos juros, multa e encargos, o ________ é reduzido.', options:['A) limite do cartão','B) score de crédito','C) valor da fatura','D) prazo de pagamento'], answer:1 },
  { q:'5. Qual é a consequência de usar o cheque especial com frequência?', options:['A) Aumento do limite','B) Redução dos juros','C) Endividamento por juros altos','D) Isenção de tarifas'], answer:2 },
  { q:'6. Se a fatura do cartão é de R$ 1.000 e o cliente paga apenas R$ 100, os R$ 900 restantes entram no ________.', options:['A) parcelamento sem juros','B) crédito rotativo','C) cheque especial','D) limite adicional'], answer:1 },
  { q:'7. Qual é a principal vantagem de pagar a fatura do cartão de crédito em dia e integralmente?', options:['A) Aumentar os juros','B) Evitar o crédito rotativo','C) Reduzir o limite','D) Cancelar o cartão'], answer:1 },
  { q:'8. O empréstimo pessoal geralmente não exige ________ como garantia.', options:['A) imóvel','B) análise de crédito','C) contrato','D) parcelas fixas'], answer:0 },
  { q:'9. Qual é a conta mais frequente em atraso que leva à inadimplência no Brasil?', options:['A) Empréstimos','B) Cartão de crédito','C) Cheque especial','D) Telefone'], answer:1 },
  { q:'10. Mesmo após pagar a dívida, o cliente pode ter dificuldade para conseguir crédito devido ao ________.', options:['A) aumento do limite','B) histórico negativo','C) cancelamento do contrato','D) falta de cadastro'], answer:1 },
];

/* ===== Utilidades ===== */
function maskCPF(value){
  return value.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}
function isValidCPF(cpf){
  cpf = cpf.replace(/\D/g,'');
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let soma=0, resto;
  for (let i=1;i<=9;i++) soma += parseInt(cpf.substring(i-1,i))*(11-i);
  resto = (soma*10)%11; if (resto===10||resto===11) resto=0;
  if (resto!==parseInt(cpf.substring(9,10))) return false;
  soma=0;
  for (let i=1;i<=10;i++) soma += parseInt(cpf.substring(i-1,i))*(12-i);
  resto = (soma*10)%11; if (resto===10||resto===11) resto=0;
  if (resto!==parseInt(cpf.substring(10,11))) return false;
  return true;
}
function showScreen(id){
  $$('.screen').forEach(s=>s.classList.remove('show'));
  $(id).classList.add('show');
}
function updateHUD(){
  $('#lapNow').textContent = Math.min(state.current + 1, questions.length);
  $('#lapTotal').textContent = String(questions.length);
  $('#score').textContent = state.score;
}

/* ===== Carro no traçado central do SVG ===== */
let routePath, totalLen, raceCar;
function initTrackRefs(){
  routePath = document.querySelector('#route');
  raceCar   = document.querySelector('#raceCar');
  if (routePath) totalLen = routePath.getTotalLength();
}
function placeCarByProgress(progress){ // progress: 0..1
  if (!routePath || !raceCar) return;
  const len = totalLen * progress;
  const p   = routePath.getPointAtLength(len);
  const p2  = routePath.getPointAtLength(Math.min(totalLen, len + 1));
  const angle = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;

  raceCar.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${angle})`);
}
function updateCarProgress(){
  const t = state.current / questions.length;
  placeCarByProgress(t);
}

/* ===== Renderização ===== */
function renderQuestion(){
  const q = questions[state.current];
  $('#questionText').textContent = q.q;
  const cont = $('#options');
  cont.innerHTML = '';
  q.options.forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.addEventListener('click', ()=> handleAnswer(idx, btn));
    cont.appendChild(btn);
  });
  $('#feedback').textContent = '';
  updateHUD();
  updateCarProgress();
}

function handleAnswer(idx, el){
  const q = questions[state.current];
  const isCorrect = idx === q.answer;

  if (isCorrect){
    state.score += 10; state.hits += 1;
    $('#feedback').textContent = '✔ Resposta correta! +10 pontos';
    $('#feedback').className = 'feedback ok';
    el.classList.add('correct');
  } else {
    state.score -= 5; state.miss += 1;
    $('#feedback').textContent = '✖ Resposta incorreta! −5 pontos';
    $('#feedback').className = 'feedback no';
    el.classList.add('wrong');
    // destaca também a correta
    const buttons = $$('.option');
    if (buttons[q.answer]) buttons[q.answer].classList.add('correct');
  }

  // bloqueia múltiplos cliques
  $$('.option').forEach(b=> b.disabled = true);

  // avança
  setTimeout(()=>{
    state.current += 1;
    if (state.current >= questions.length){
      finish();
    } else {
      renderQuestion();
    }
  }, 900);
}

/* ===== Tela Final ===== */
function finish(){
  updateCarProgress(); // garante posição final

  $('#outName').textContent = state.playerName;
  $('#outCPF').textContent  = state.cpf;
  $('#outScore').textContent= state.score;
  $('#outHits').textContent = state.hits;
  $('#outMiss').textContent = state.miss;

  const badge = $('#outBadge');
  const medal = $('#medal');
  medal.className = 'medal';

  if (state.score >= 90){
    badge.textContent = '🏆 Campeão da pista! Performance de elite.';
    medal.classList.add('gold');  medal.textContent = '🥇';
  } else if (state.score >= 60){
    badge.textContent = '🥈 Ótima corrida! Você mandou muito bem.';
    medal.classList.add('silver'); medal.textContent = '🥈';
  } else if (state.score >= 30){
    badge.textContent = '🥉 Boa prova! Ainda dá para ganhar ritmo.';
    medal.classList.add('bronze'); medal.textContent = '🥉';
  } else {
    badge.textContent = '🧰 Hora de um pit stop nos estudos. Você chega lá!';
    medal.textContent = '🏁';
  }

  showScreen('#screen-result');
  launchConfetti(); // celebração
}

/* ===== Largada (start lights) ===== */
async function startSequenceThenBegin(){
  showScreen('#screen-quiz');
  initTrackRefs();          // garante refs do SVG no momento da tela
  placeCarByProgress(0);    // posiciona na linha de largada

  const overlay = $('#startLights');
  overlay.classList.add('active');
  const lights = overlay.querySelectorAll('.light');
  const go = overlay.querySelector('.go');

  // acende 5 luzes
  for (let i=0; i<lights.length; i++){
    await wait(600);
    lights[i].classList.add('on');
  }
  // apaga tudo + mostra GO
  await wait(500);
  lights.forEach(l=> l.classList.remove('on'));
  go.style.opacity = '1';
  go.style.transform = 'scale(1)';
  await wait(450);
  overlay.classList.remove('active');
  go.style.opacity = '0';

  // inicia a corrida
  renderQuestion();
}
function wait(ms){ return new Promise(res=> setTimeout(res, ms)); }

/* ===== Confete ===== */
function launchConfetti(){
  const container = $('#confetti');
  container.innerHTML = '';
  const colors = ['#ff3b30','#ffdd00','#2ecc71','#00c6ff','#ffffff'];

  const pieces = 120;
  for (let i=0; i<pieces; i++){
    const el = document.createElement('div');
    el.className = 'piece';
    const size = 6 + Math.random()*10;
    el.style.width  = size + 'px';
    el.style.height = (size*1.6) + 'px';
    el.style.left   = (Math.random()*100) + 'vw';
    el.style.top    = (-10 + Math.random()*10) + 'vh';
    el.style.background = colors[i % colors.length];
    el.style.animationDuration = (4 + Math.random()*3) + 's';
    el.style.animationDelay    = (Math.random()*0.5) + 's';
    el.style.transform = `translateY(-10vh) rotate(${Math.random()*360}deg)`;
    container.appendChild(el);
  }
  // remove depois de um tempo
  setTimeout(()=> container.innerHTML = '', 8000);
}

/* ===== Reset ===== */
function resetGame(){
  state = { playerName:'', cpf:'', score:0, current:0, hits:0, miss:0 };
  $('#playerName').value = '';
  $('#playerCPF').value  = '';
  $('#btnStart').disabled= true;
  $('#nameStatus').className = 'status';
  $('#cpfStatus').className  = 'status';
  showScreen('#screen-start');
}

/* ===== Inicialização & Eventos ===== */
window.addEventListener('DOMContentLoaded', ()=>{
  const nameInput = $('#playerName');
  const cpfInput  = $('#playerCPF');
  const btnStart  = $('#btnStart');

  function checkReady(){
    const okName = nameInput.value.trim().length >= 2;
    const masked = maskCPF(cpfInput.value);
    if (cpfInput.value !== masked) cpfInput.value = masked;
    const okCPF  = isValidCPF(masked);

    btnStart.disabled = !(okName && okCPF);

    // status visuais
    $('#nameStatus').className = 'status ' + (okName ? 'ok':'no');
    $('#cpfStatus').className  = 'status ' + (okCPF  ? 'ok':'no');
  }

  nameInput.addEventListener('input', checkReady);
  cpfInput .addEventListener('input', checkReady);

  btnStart.addEventListener('click', ()=>{
    state.playerName = nameInput.value.trim();
    state.cpf        = cpfInput.value;
    showScreen('#screen-rules');
  });

  $('#btnGoQuiz').addEventListener('click', ()=>{
    // zera estado e começa sequência de largada
    state.score = 0; state.current = 0; state.hits = 0; state.miss = 0;
    startSequenceThenBegin();
  });

  $('#btnRestart').addEventListener('click', resetGame);

  // Reposiciona o carro ao redimensionar
  window.addEventListener('resize', ()=>{
    if (document.querySelector('#screen-quiz').classList.contains('show')){
      initTrackRefs();
      updateCarProgress();
    }
  }, {passive:true});
});
