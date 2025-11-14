/* ====== Terminal JS ====== */
const output = document.getElementById('output');
const cmd = document.getElementById('cmd');
const promptEl = document.getElementById('prompt');
const acBox = document.getElementById('autocomplete');

// ===== Persisted state =====
const STORAGE_KEY = 'portfolio_terminal_history_v1';
let history = JSON.parse(localStorage.getItem(STORAGE_KEY + '_cmds') || '[]');
let historyIndex = history.length;
let savedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY + '_fs') || 'null');

// ===== File system (in-memory structure) =====
const DEFAULT_FS = {
  "perfil": {
    "sobre_mi.txt": `Roman del Angel Juarez
Apasionado por la tecnología y la programación.
Me especializo en automatización, IA y desarrollo web.
Tamaulipas, México
Contacto: fjrdelangeljr@gmail.com
`,
    "cv.pdf": null  // placeholder to indicate exists; see note about placing real cv
  },
  "educacion": {
    "iest_anahuac.txt": `🎓 Ingeniería en Sistemas y Negocios Digitales — IEST Anáhuac (2022 - Actualidad)
Avance: 61% de créditos (7º semestre).
`,
  },
  "experiencia": {
    "escuela_manejo_tm.txt": `Desarrollador Freelance — Escuela de Manejo TM (2024 - 2025)
Proyecto: Sistema web de gestión administrativa.
`,
    "gremio_anestesiologia.txt": `Desarrollador Freelance — Gremio de Anestesiología (2025 - Actualidad)`
  },
  "proyectos": {
    "asistente_virtual.txt": `Asistente Virtual Universitario — Chatbot con OpenAI`
  },
  "habilidades": {
    "skills.txt": `Python, JavaScript, PHP, C++, Node.js, MySQL, MongoDB`
  },
  "contacto": {
    "info.txt": `Roman del Angel Juarez
Tamaulipas, México
fjrdelangeljr@gmail.com`
  }
};

// If there's a persisted fs (user created files), merge them
let fs = savedFiles ? mergeFS(DEFAULT_FS, savedFiles) : deepCopy(DEFAULT_FS);

// Current working directory (array stack) and node reference
let pathStack = []; // e.g [] = ~ ; ['perfil'] => ~/perfil
let cwd = fs;

// Command list for autocomplete
const COMMANDS = ['help','ls','cd','pwd','cat','clear','mkdir','touch','rm','echo','history','neofetch','open','autoclear','autocomplete'];

// Initial neofetch (more real)
const neofetch = [
  "roman@arch",
  "------------------------------",
  "OS: Arch Linux (Themed Terminal)",
  "Shell: web-terminal v1.0",
  "Host: Portfolio",
  "GPU: WebGL (simulated)",
  "Battery: AC",
  "Uptime: " + formatUptime(performance.now()),
  "------------------------------",
  "Escribe 'help' para comandos disponibles."
].join("\n");

// Print initial
printRawStyled(neofetch + "\n\n");

// Update prompt display
updatePrompt();

/* ----------------- Event handlers ----------------- */
cmd.addEventListener('keydown', (e) => {
  // Autocomplete with Tab
  if (e.key === 'Tab') {
    e.preventDefault();
    handleAutocomplete();
    return;
  }

  // Enter executes
  if (e.key === 'Enter') {
    const input = cmd.value;
    runCommand(input);
    history.push(input);
    localStorage.setItem(STORAGE_KEY + '_cmds', JSON.stringify(history));
    historyIndex = history.length;
    cmd.value = '';
    hideAutocomplete();
    return;
  }

  // Arrow Up/Down for history (persistent)
  if (e.key === 'ArrowUp') {
    if (history.length === 0) return;
    if (historyIndex > 0) historyIndex--;
    cmd.value = history[historyIndex] || '';
    // move caret to end
    setTimeout(()=> cmd.setSelectionRange(cmd.value.length, cmd.value.length),0);
    e.preventDefault();
    return;
  }
  if (e.key === 'ArrowDown') {
    if (history.length === 0) { cmd.value=''; return; }
    if (historyIndex < history.length - 1) {
      historyIndex++;
      cmd.value = history[historyIndex] || '';
    } else {
      historyIndex = history.length;
      cmd.value = '';
    }
    e.preventDefault();
    return;
  }

  // Show suggestions as typing
  setTimeout(()=> showAutocompleteForInput(cmd.value), 0);
});

// Click outside to hide autocomplete
document.addEventListener('click', (e)=> {
  if (!acBox.contains(e.target) && e.target !== cmd) hideAutocomplete();
});

/* ----------------- Command execution ----------------- */
function runCommand(raw) {
  const input = raw.trim();
  if (!input) {
    printPromptLine('');
    return;
  }

  printPromptLine(input);

  // parse
  const parts = input.split(' ').filter(Boolean);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch(command) {
    case 'help':
      printRaw(`Comandos:
- ls               : listar (carpetas/archivos)
- cd [carpeta|..]  : cambiar directorio
- pwd              : mostrar ruta actual
- cat [archivo]    : mostrar archivo (typing animado)
- mkdir [dir]      : crear carpeta
- touch [file]     : crear archivo
- rm [name]        : eliminar archivo o carpeta vacía
- echo [texto]     : imprimir texto
- history          : historial de comandos
- clear            : limpiar pantalla
- neofetch         : mostrar sistema (estilo Arch)
- open [perfil|linkedin|github|proyectos] : abrir recursos
- autocomplete     : muestra tips de autocomplete (TAB)
- autoclear        : alterna limpiar automática en cada comando
`);
      break;

    case 'ls':
      do_ls();
      break;

    case 'cd':
      do_cd(args[0]);
      break;

    case 'pwd':
      printRaw(getPathString());
      break;

    case 'cat':
      do_cat(args.join(' '));
      break;

    case 'clear':
      clearOutput();
      break;

    case 'mkdir':
      do_mkdir(args[0]);
      break;

    case 'touch':
      do_touch(args[0]);
      break;

    case 'rm':
      do_rm(args[0]);
      break;

    case 'echo':
      printRaw(args.join(' '));
      break;

    case 'history':
      printRaw(history.map((h,i)=>`${i+1}  ${h}`).join('\n'));
      break;

    case 'neofetch':
      printRawStyled(neofetch);
      break;

    case 'open':
      do_open(args[0]);
      break;

    case 'autocomplete':
      printRaw('Autocompletado: usa TAB. Sugerencias disponibles listadas mientras escribes.');
      break;

    case 'autoclear':
      toggleAutoClear();
      break;

    default:
      printRaw(`Comando no reconocido: ${command}\nEscribe 'help' para ver comandos.`);
  }

  // store fs to localStorage for persistence
  localStorage.setItem(STORAGE_KEY + '_fs', JSON.stringify(stripFunctionsFromFS(fs)));
  // scroll smooth to bottom
  smoothScrollToBottom();
  updatePrompt();
}

/* ----------------- Implementación de comandos ----------------- */

function do_ls() {
  const keys = Object.keys(cwd);
  if (keys.length === 0) {
    printRaw('');
    return;
  }
  const lines = keys.map(k => {
    return (typeof cwd[k] === 'object') ? `\uD83D\uDCC1 ${k}` : `\uD83D\uDCC4 ${k}`;
  }).join('   ');
  printRaw(lines);
}

function do_cd(arg) {
  if (!arg) {
    printRaw("Uso: cd [carpeta|..|/ruta]");
    return;
  }
  if (arg === '..') {
    if (pathStack.length > 0) {
      pathStack.pop();
      cwd = traversePath(pathStack);
    }
    updatePrompt();
    return;
  }
  // absolute path like /perfil or /perfil/sub
  if (arg.startsWith('/')) {
    const parts = arg.split('/').filter(Boolean);
    const node = traversePath(parts, true);
    if (!node) {
      printRaw(`Ruta no válida: ${arg}`);
      return;
    }
    pathStack = parts;
    cwd = node;
    updatePrompt();
    return;
  }
  // relative folder
  if (cwd[arg] && typeof cwd[arg] === 'object') {
    pathStack.push(arg);
    cwd = cwd[arg];
    updatePrompt();
  } else {
    printRaw(`Carpeta no encontrada: ${arg}`);
  }
}

function do_cat(filename) {
  if (!filename) {
    printRaw("Uso: cat [archivo]");
    return;
  }
  if (!cwd[filename]) {
    printRaw(`Archivo no encontrado: ${filename}`);
    return;
  }
  const node = cwd[filename];
  if (typeof node === 'object') {
    printRaw(`${filename} es una carpeta.`);
    return;
  }
  // typing animation
  typeOut(node);
}

function do_mkdir(name) {
  if (!name) { printRaw('Uso: mkdir [nombre]'); return; }
  if (cwd[name]) { printRaw(`Ya existe: ${name}`); return; }
  cwd[name] = {};
  printRaw(`Carpeta creada: ${name}`);
}

function do_touch(name) {
  if (!name) { printRaw('Uso: touch [archivo]'); return; }
  if (cwd[name]) { printRaw(`Ya existe: ${name}`); return; }
  cwd[name] = "";
  printRaw(`Archivo creado: ${name}`);
}

function do_rm(name) {
  if (!name) { printRaw('Uso: rm [archivo|carpeta]'); return; }
  if (!cwd[name]) { printRaw(`No existe: ${name}`); return; }
  if (typeof cwd[name] === 'object') {
    // check empty
    if (Object.keys(cwd[name]).length > 0) {
      printRaw('La carpeta no está vacía. Usa rm en archivos o vacía la carpeta primero.');
      return;
    }
  }
  delete cwd[name];
  printRaw(`Eliminado: ${name}`);
}

function do_open(target) {
  if (!target) { printRaw('Uso: open [perfil|linkedin|github|proyectos]'); return; }

  switch(target.toLowerCase()) {
    case 'perfil':
      // descarga automática de cv.pdf si existe en perfil
      // nota: para que la descarga funcione, coloca un archivo llamado 'cv.pdf' en la misma carpeta del HTML
      if (fs['perfil'] && fs['perfil']['cv.pdf'] !== undefined) {
        printRaw('Iniciando descarga de CV (cv.pdf). Si no se descarga, coloca cv.pdf en la misma carpeta que este HTML.');
        const a = document.createElement('a');
        a.href = 'cv.pdf';
        a.download = 'Roman_del_Angel_CV.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        printRaw('No se encontró cv.pdf en /perfil. Coloca cv.pdf en la misma carpeta del HTML.');
      }
      break;

    case 'linkedin':
      printRaw('Abriendo LinkedIn en una nueva pestaña...');
      window.open('https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/', '_blank');
      break;

    case 'github':
      printRaw('Abriendo GitHub en una nueva pestaña...');
      window.open('https://github.com/PWD-Roman', '_blank');
      break;

    case 'proyectos':
      printRaw('Proyectos (resumen):\n- Asistente Virtual Universitario — Chatbot con OpenAI\n- Sistema gestión Escuela de Manejo TM\n- Sistema digital gremial');
      break;

    default:
      printRaw(`Open: objetivo desconocido: ${target}`);
  }
}

/* ----------------- Utilities ----------------- */

function printRaw(text){
  // append text to output
  output.innerHTML += escapeHtml(text) + '\n';
}

function printRawStyled(text){
  // more compact
  output.innerHTML += escapeHtml(text) + '\n';
}

function printPromptLine(cmdText){
  const line = `<span class="prompt">${escapeHtml(getPromptString())}</span> ${escapeHtml(cmdText)}\n`;
  output.innerHTML += line;
}

function clearOutput(){
  output.innerHTML = '';
}

function updatePrompt(){
  promptEl.textContent = getPromptString();
}

function getPromptString(){
  return `roman@arch:${getPathString()}$`;
}

function getPathString(){
  return '~' + (pathStack.length ? '/' + pathStack.join('/') : '');
}

function traversePath(parts, absolute=false){
  // parts: array of names
  let node = fs;
  for (let p of parts) {
    if (node[p] && typeof node[p] === 'object') {
      node = node[p];
    } else {
      return null;
    }
  }
  return node;
}

/* ----------------- Typing animation ----------------- */
let typingEnabled = true;
function typeOut(text, speed = 18) {
  if (!typingEnabled) {
    printRaw(text);
    return;
  }
  // create a temp element and type into output char by char
  const container = document.createElement('div');
  output.appendChild(container);
  let i = 0;
  const id = setInterval(() => {
    container.innerHTML = escapeHtml(text.slice(0, i));
    i++;
    output.scrollTop = output.scrollHeight;
    if (i > text.length) {
      clearInterval(id);
      output.innerHTML += '\n';
      smoothScrollToBottom();
    }
  }, speed);
}

/* ----------------- Autocomplete (TAB) ----------------- */

function showAutocompleteForInput(value) {
  const trimmed = value.trim();
  if (!trimmed) { hideAutocomplete(); return; }
  const parts = trimmed.split(' ');
  const cmdPart = parts[0].toLowerCase();
  const rest = parts.slice(1).join(' ');

  const suggestions = [];

  // If command matches known command prefix, suggest commands
  suggestions.push(...COMMANDS.filter(c=>c.startsWith(cmdPart)).slice(0,20));

  // If user typed a command that expects filenames, also suggest filenames
  const fileCommands = ['cat','rm','touch','mkdir','open','cd'];
  if (fileCommands.includes(cmdPart)) {
    const files = Object.keys(cwd).filter(k => k.startsWith(rest));
    suggestions.push(...files);
  }

  // dedupe
  const unique = [...new Set(suggestions)].slice(0,50);

  if (unique.length === 0) { hideAutocomplete(); return; }
  showAutocomplete(unique);
}

function showAutocomplete(items) {
  acBox.innerHTML = '';
  items.forEach((it, idx) => {
    const div = document.createElement('div');
    div.textContent = it;
    div.addEventListener('click', ()=> {
      acceptAutocomplete(it);
    });
    acBox.appendChild(div);
  });
  // position near input
  const rect = cmd.getBoundingClientRect();
  const termRect = document.getElementById('terminal').getBoundingClientRect();
  acBox.style.left = (rect.left - termRect.left) + 'px';
  acBox.style.top = (rect.top - termRect.top + rect.height + 6) + 'px';
  acBox.style.display = 'block';
}

function hideAutocomplete(){ acBox.style.display = 'none'; acBox.innerHTML=''; }

function acceptAutocomplete(value) {
  // If user typed command + arg structure, replace properly
  const current = cmd.value;
  const parts = current.split(' ');
  if (parts.length > 1) {
    parts[parts.length - 1] = value;
    cmd.value = parts.join(' ');
  } else {
    cmd.value = value + (isCommand(value) ? ' ' : '');
  }
  cmd.focus();
  hideAutocomplete();
}

function handleAutocomplete(){
  // If acBox visible, pick first; else try compute suggestions and accept first
  if (acBox.style.display === 'block' && acBox.firstChild) {
    const first = acBox.firstChild.textContent;
    acceptAutocomplete(first);
    return;
  }
  // else compute suggestions and insert first
  const val = cmd.value.trim();
  if (!val) return;
  const parts = val.split(' ');
  const cmdPart = parts[0].toLowerCase();
  if (parts.length === 1) {
    // suggest command
    const cand = COMMANDS.find(c=>c.startsWith(cmdPart));
    if (cand) { cmd.value = cand + ' '; return; }
  } else {
    // suggest file
    const last = parts[parts.length-1];
    const cand = Object.keys(cwd).find(k=>k.startsWith(last));
    if (cand) {
      parts[parts.length-1] = cand;
      cmd.value = parts.join(' ');
      return;
    }
  }
}

function isCommand(s){ return COMMANDS.includes(s); }

/* ----------------- Helpers ----------------- */

function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function smoothScrollToBottom() {
  // smooth behavior
  output.scrollTo({ top: output.scrollHeight, behavior: 'smooth' });
}

function formatUptime(ms) {
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  return `${h}h ${m}m ${sec}s`;
}

/* ----------------- Persistence helpers ----------------- */

function deepCopy(obj){ return JSON.parse(JSON.stringify(obj)); }

function mergeFS(defaultFS, userFS) {
  // simple merge: userFS overwrites/extends defaultFS
  const cp = deepCopy(defaultFS);
  try {
    for (const k in userFS) {
      if (typeof userFS[k] === 'object' && cp[k]) {
        cp[k] = { ...cp[k], ...userFS[k] };
      } else {
        cp[k] = userFS[k];
      }
    }
  } catch(e){ return defaultFS; }
  return cp;
}

function stripFunctionsFromFS(node) {
  // ensure only plain data saved
  if (typeof node !== 'object' || node === null) return node;
  const out = Array.isArray(node) ? [] : {};
  for (const k in node) {
    out[k] = stripFunctionsFromFS(node[k]);
  }
  return out;
}

/* ----------------- Extras: toggle auto clear (optional) ----------------- */
let autoClear = false;
function toggleAutoClear(){
  autoClear = !autoClear;
  printRaw(`autoclear ${autoClear ? 'ON' : 'OFF'}.`);
}

/* ----------------- Keyboard focus niceties ----------------- */
// Keep input focused if click anywhere on terminal
document.getElementById('terminal').addEventListener('click', ()=> cmd.focus());

// On load, restore history index and set caret
(function initFromStorage(){
  // restore fs user additions
  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY + '_fs') || 'null');
  if (persisted) fs = mergeFS(DEFAULT_FS, persisted);

  // allow pressing 'Enter' quickly to start
  cmd.focus();
})();

// Expose some helpers on window for debugging if needed
window._term = { fs, getPathString, pathStack };