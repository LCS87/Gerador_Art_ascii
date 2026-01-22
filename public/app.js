const $ = (id) => document.getElementById(id);

const elText = $('text');
const elFont = $('font');
const elOutput = $('output');
const elStatus = $('status');
const elBtnGenerate = $('btnGenerate');
const elBtnCopy = $('btnCopy');
const elPillPort = $('pillPort');

function setStatus(message, type) {
  elStatus.classList.toggle('error', type === 'error');
  elStatus.textContent = message || '';
}

function setLoading(isLoading) {
  elBtnGenerate.disabled = isLoading;
  elBtnGenerate.textContent = isLoading ? 'Gerando...' : 'Gerar';
}

function updateCopyEnabled() {
  elBtnCopy.disabled = !elOutput.textContent;
}

async function loadFonts() {
  try {
    const res = await fetch('/api/fonts');
    if (!res.ok) throw new Error('Falha ao carregar fontes');
    const data = await res.json();

    const fonts = Array.isArray(data.fonts) ? data.fonts : [];
    const current = elFont.value || 'Standard';

    elFont.innerHTML = '';

    const preferred = ['Standard', 'Slant', 'Small', 'Big'];
    const ordered = Array.from(new Set([...preferred, ...fonts]));

    for (const f of ordered) {
      if (!f) continue;
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      elFont.appendChild(opt);
    }

    elFont.value = ordered.includes(current) ? current : 'Standard';
  } catch {
    setStatus('Não foi possível carregar as fontes. Você ainda pode tentar usar "Standard".', 'error');
  }
}

async function generate() {
  const text = elText.value;
  const font = elFont.value || 'Standard';

  if (!text || text.trim().length === 0) {
    setStatus('Digite um texto para gerar a arte.', 'error');
    return;
  }

  setStatus('', 'info');
  setLoading(true);
  elOutput.textContent = '';
  updateCopyEnabled();

  try {
    const res = await fetch('/api/ascii', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, font }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = payload?.message || payload?.error || 'Erro ao gerar a arte.';
      setStatus(message, 'error');
      return;
    }

    elOutput.textContent = payload.ascii || '';
    updateCopyEnabled();
    setStatus('Gerado com sucesso.', 'info');
  } catch {
    setStatus('Falha de rede ao chamar a API.', 'error');
  } finally {
    setLoading(false);
  }
}

async function copyOutput() {
  const txt = elOutput.textContent || '';
  if (!txt) return;

  try {
    await navigator.clipboard.writeText(txt);
    setStatus('Copiado para a área de transferência.', 'info');
  } catch {
    setStatus('Não foi possível copiar (permita acesso à área de transferência).', 'error');
  }
}

function init() {
  elPillPort.textContent = `API: ${location.origin}`;
  loadFonts();

  elBtnGenerate.addEventListener('click', generate);
  elBtnCopy.addEventListener('click', copyOutput);

  elText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generate();
    }
  });

  updateCopyEnabled();
}

init();
