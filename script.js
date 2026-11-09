/* ====== Terminal JS ====== */
const output = document.getElementById('output');
const cmd = document.getElementById('cmd');
const promptEl = document.getElementById('prompt');
const acBox = document.getElementById('autocomplete');

// ===== Persisted state =====
const STORAGE_KEY = 'portfolio_terminal_history_v2';
let history = JSON.parse(localStorage.getItem(STORAGE_KEY + '_cmds') || '[]');
let historyIndex = history.length;
let savedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY + '_fs') || 'null');

// ===== Idioma (en por defecto) =====
let LANG = localStorage.getItem(STORAGE_KEY + '_lang') || 'en';

function T(key, ...args) {
  const pack = I18N[LANG] || I18N.en;
  const entry = pack[key] !== undefined ? pack[key] : I18N.en[key];
  if (entry === undefined) return key;
  return typeof entry === 'function' ? entry(...args) : entry;
}

function TF(key) {
  const pack = FORMAL[LANG] || FORMAL.en;
  return pack[key] !== undefined ? pack[key] : (FORMAL.es[key] || key);
}

const I18N = {
  en: {
    boot_hint: 'Type "help" to see the available commands.',
    boot_lang_hint: 'Type "lang" to switch language.',
    help: `Available commands:
  File navigation:
    ls [path]        list current folder or path
    cd [dir|..|~|/path]  change directory
    pwd              show current path
    tree             show the file system tree
    find [text]      search files by name
    grep [text]      search inside files
    cat [file]       show a file (typing animation; supports paths)
    mkdir [dir]      create folder
    touch [file]     create file
    rm [name]        delete a file or empty folder

  System (simulated):
    neofetch         Arch-style system info
    whoami           current user
    hostname         host name
    date             current date and time
    uname [-a]       kernel information
    uptime           session uptime
    which [cmd]      location of a command
    sudo [cmd]       try running as root ;)
    theme [name]     change accent color (${'{THEMES}'})
    skills           skills summary

  Portfolio:
    cv               download CV (cv.pdf)
    open [perfil|linkedin|github|proyectos]  open resources
    man [command]    short help for a command
    lang [es|en]     switch language

  Terminal:
    echo [text]      print text
    history          command history
    clear            clear the screen
    autocomplete     TAB autocomplete tips
    autoclear        toggle auto-clear per command`,
    usage_ls_path: p => `${p} is not a folder`,
    invalid_path: p => `Invalid path: ${p}`,
    usage_cd: 'Usage: cd [folder|..|~|/path]',
    folder_not_found: n => `Folder not found: ${n}`,
    usage_cat: 'Usage: cat [file|path]',
    file_not_found: n => `File not found: ${n}`,
    is_folder: n => `${n} is a folder. Use 'ls' to see its contents.`,
    usage_mkdir: 'Usage: mkdir [name]',
    usage_touch: 'Usage: touch [file]',
    usage_rm: 'Usage: rm [file|folder]',
    exists: n => `Already exists: ${n}`,
    created_dir: n => `Folder created: ${n}`,
    created_file: n => `File created: ${n}`,
    not_exists: n => `Does not exist: ${n}`,
    dir_not_empty: 'Folder is not empty. Remove files first or empty it.',
    deleted: n => `Deleted: ${n}`,
    find_usage: 'Usage: find [text] — search files by name',
    find_no_results: t => `No results for: ${t}`,
    grep_usage: 'Usage: grep [text] — search inside all files',
    grep_no_matches: t => `No matches for: ${t}`,
    usage_which: 'Usage: which [command]',
    which_not_found: n => `${n} not found`,
    usage_man: 'Usage: man [command]',
    man_list: cmds => `Commands with a manual: ${cmds}`,
    man_missing: n => `No manual entry for: ${n}`,
    usage_sudo: 'Usage: sudo [command]',
    sudo_denied: 'roman is not in the sudoers file. This incident will be reported.',
    theme_title: 'Available themes:',
    theme_usage_suffix: 'Usage: theme [name]',
    theme_unknown: (n, list) => `Unknown theme: ${n}\nThemes: ${list}`,
    theme_applied: (k, label) => `Theme applied: ${k} — ${label}`,
    skills_text: `Main skills (by category):

[Hands-on]        Python · JavaScript · Node.js · SQL · MySQL · MongoDB
                  · Pandas · Git · Linux
[AI & data]       NLP · MiniLM · PyTorch · Sentence Transformers · RAG
                  · LLM · vLLM · ONNX
[Backend & int.]  FastAPI · REST APIs · Canvas LMS · LTI
[Complementary]   C++ · PHP · PostgreSQL · Docker · HTML · CSS

Run 'cat habilidades/lenguajes.txt' (and similar) for details.`,
    cv_start: 'Downloading CV (cv.pdf). If it does not download, place cv.pdf next to this HTML file.',
    cv_missing: 'cv.pdf not found in /perfil. Place cv.pdf next to this HTML file.',
    usage_open: 'Usage: open [perfil|linkedin|github|proyectos]',
    opening_linkedin: 'Opening LinkedIn in a new tab...',
    opening_github: 'Opening GitHub in a new tab...',
    open_unknown: t => `Open: unknown target: ${t}`,
    projects_summary: `Projects (summary):
- Canvitas — NLP + LTI integration for Canvas LMS
- Legal assistant with RAG (Node.js, Vector Stores)
- Local model infrastructure (vLLM, FastAPI, ONNX)
- ERM system — Colegio de Anestesiología de Tampico
- Carroel — driving school administrative system

Details: 'cat proyectos/canvitas.txt' (and similar).`,
    autocomplete_tip: 'Autocomplete: press TAB. Suggestions appear while you type.',
    autoclear: on => `autoclear ${on ? 'ON' : 'OFF'}.`,
    cmd_not_found: c => `Command not found: ${c}\nType 'help' to see available commands.`,
    uptime_line: u => ` ${u} up, 1 user, load average: 0.42, 0.31, 0.27`,
    lang_switched: 'Language switched to English.',
    lang_already: 'Language is already English.',
    usage_lang: 'Usage: lang [es|en] — switch language (no args toggles)',
    btn_formal: 'Formal view',
    btn_terminal: 'Terminal view'
  },

  es: {
    boot_hint: 'Escribe "help" para ver los comandos disponibles.',
    boot_lang_hint: 'Escribe "lang" para cambiar el idioma.',
    help: `Comandos disponibles:
  Navegación y archivos:
    ls [ruta]        listar carpeta actual o ruta
    cd [carpeta|..|~|/ruta]  cambiar directorio
    pwd              mostrar ruta actual
    tree             mostrar árbol del sistema de archivos
    find [texto]     buscar archivos por nombre
    grep [texto]     buscar texto dentro de los archivos
    cat [archivo]    mostrar archivo (typing animado; admite rutas)
    mkdir [dir]      crear carpeta
    touch [file]     crear archivo
    rm [name]        eliminar archivo o carpeta vacía

  Sistema (simulados):
    neofetch         info del sistema estilo Arch
    whoami           usuario actual
    hostname         nombre del host
    date             fecha y hora actuales
    uname [-a]       información del kernel
    uptime           tiempo de sesión
    which [cmd]      ubicación de un comando
    sudo [cmd]       intenta ejecutar como root ;)
    theme [nombre]   cambiar tema de color (${'{THEMES}'})
    skills           resumen de habilidades

  Portafolio:
    cv               descargar CV (cv.pdf)
    open [perfil|linkedin|github|proyectos]  abrir recursos
    man [comando]    ayuda breve de un comando
    lang [es|en]     cambiar idioma

  Terminal:
    echo [texto]     imprimir texto
    history          historial de comandos
    clear            limpiar pantalla
    autocomplete     tips del autocompletado (TAB)
    autoclear        alterna limpiar automática en cada comando`,
    usage_ls_path: p => `${p} no es una carpeta`,
    invalid_path: p => `Ruta no válida: ${p}`,
    usage_cd: 'Uso: cd [carpeta|..|~|/ruta]',
    folder_not_found: n => `Carpeta no encontrada: ${n}`,
    usage_cat: 'Uso: cat [archivo|ruta]',
    file_not_found: n => `Archivo no encontrado: ${n}`,
    is_folder: n => `${n} es una carpeta. Usa 'ls' para ver su contenido.`,
    usage_mkdir: 'Uso: mkdir [nombre]',
    usage_touch: 'Uso: touch [archivo]',
    usage_rm: 'Uso: rm [archivo|carpeta]',
    exists: n => `Ya existe: ${n}`,
    created_dir: n => `Carpeta creada: ${n}`,
    created_file: n => `Archivo creado: ${n}`,
    not_exists: n => `No existe: ${n}`,
    dir_not_empty: 'La carpeta no está vacía. Usa rm en archivos o vacía la carpeta primero.',
    deleted: n => `Eliminado: ${n}`,
    find_usage: 'Uso: find [texto] — busca archivos por nombre',
    find_no_results: t => `Sin resultados para: ${t}`,
    grep_usage: 'Uso: grep [texto] — busca dentro de los archivos',
    grep_no_matches: t => `Sin coincidencias para: ${t}`,
    usage_which: 'Uso: which [comando]',
    which_not_found: n => `${n} no encontrado`,
    usage_man: 'Uso: man [comando]',
    man_list: cmds => `Comandos con manual: ${cmds}`,
    man_missing: n => `No hay entrada de manual para: ${n}`,
    usage_sudo: 'Uso: sudo [comando]',
    sudo_denied: 'roman no está en el archivo sudoers. Este incidente será reportado.',
    theme_title: 'Temas disponibles:',
    theme_usage_suffix: 'Uso: theme [nombre]',
    theme_unknown: (n, list) => `Tema desconocido: ${n}\nTemas: ${list}`,
    theme_applied: (k, label) => `Tema aplicado: ${k} — ${label}`,
    skills_text: `Habilidades principales (por categoría):

[Prácticas]       Python · JavaScript · Node.js · SQL · MySQL · MongoDB
                  · Pandas · Git · Linux
[IA y datos]      NLP · MiniLM · PyTorch · Sentence Transformers · RAG
                  · LLM · vLLM · ONNX
[Backend e int.]  FastAPI · APIs REST · Canvas LMS · LTI
[Complementarias] C++ · PHP · PostgreSQL · Docker · HTML · CSS

Escribe 'cat habilidades/lenguajes.txt' (y similares) para el detalle.`,
    cv_start: 'Iniciando descarga de CV (cv.pdf). Si no se descarga, coloca cv.pdf en la misma carpeta que este HTML.',
    cv_missing: 'No se encontró cv.pdf en /perfil. Coloca cv.pdf en la misma carpeta del HTML.',
    usage_open: 'Uso: open [perfil|linkedin|github|proyectos]',
    opening_linkedin: 'Abriendo LinkedIn en una nueva pestaña...',
    opening_github: 'Abriendo GitHub en una nueva pestaña...',
    open_unknown: t => `Open: objetivo desconocido: ${t}`,
    projects_summary: `Proyectos (resumen):
- Canvitas — NLP + integración LTI para Canvas LMS
- Asistente jurídico con RAG (Node.js, Vector Stores)
- Infraestructura de modelos locales (vLLM, FastAPI, ONNX)
- Sistema ERM — Colegio de Anestesiología de Tampico
- Carroel — sistema administrativo escuela de manejo

Detalle: 'cat proyectos/canvitas.txt' (y similares).`,
    autocomplete_tip: 'Autocompletado: usa TAB. Sugerencias disponibles listadas mientras escribes.',
    autoclear: on => `autoclear ${on ? 'ON' : 'OFF'}.`,
    cmd_not_found: c => `Comando no reconocido: ${c}\nEscribe 'help' para ver comandos.`,
    uptime_line: u => ` ${u} up, 1 user, load average: 0.42, 0.31, 0.27`,
    lang_switched: 'Idioma cambiado a español.',
    lang_already: 'El idioma ya está en español.',
    usage_lang: 'Uso: lang [es|en] — cambia el idioma (sin argumentos alterna)',
    btn_formal: 'Vista formal',
    btn_terminal: 'Vista terminal'
  }
};

// ===== File system (contenido bilingüe: {__i18n, es, en}) =====
function L(es, en) { return { __i18n: true, es, en }; }

const DEFAULT_FS = {
  "perfil": {
    "sobre_mi.txt": L(`Román del Angel Juárez — Desarrollador de Software
Backend e Inteligencia Artificial Aplicada
Tampico, Tamaulipas, México

Desarrollo soluciones de software que conectan datos, APIs y modelos de
inteligencia artificial. Me enfoco en backend, procesamiento de lenguaje
natural e integración de sistemas, con experiencia en proyectos educativos,
administrativos y herramientas basadas en conocimiento.

Posicionamiento profesional:
Desarrollador de software enfocado en backend e IA aplicada. Construyo e
integro soluciones que conectan datos, APIs, modelos de lenguaje y
plataformas existentes. Experiencia en NLP, preparación y evaluación de
datasets, desarrollo de servicios e integración de Canvas LMS.

Idiomas: español (nativo), inglés (intermedio).
Graduación prevista: diciembre de 2026.
`, `Román del Angel Juárez — Software Developer
Backend and Applied Artificial Intelligence
Tampico, Tamaulipas, Mexico

I build software solutions that connect data, APIs and AI models. I focus
on backend, natural language processing and systems integration, with
experience in educational projects, administrative systems and
knowledge-based tools.

Professional positioning:
Software developer focused on backend and applied AI. I build and
integrate solutions that connect data, APIs, language models and existing
platforms. Experience in NLP, dataset preparation and evaluation, service
development and Canvas LMS integration.

Languages: Spanish (native), English (intermediate).
Expected graduation: December 2026.
`),
    "bio_corta.txt": L(`Soy Román del Angel Juárez, desarrollador de software enfocado en
backend e inteligencia artificial aplicada. Trabajo con Python,
JavaScript, procesamiento de lenguaje natural, bases de datos y APIs
para construir e integrar soluciones que resuelven necesidades reales.
Tengo experiencia en proyectos de IA para plataformas educativas,
desarrollo backend y sistemas basados en conocimiento.
`, `I am Román del Angel Juárez, a software developer focused on backend and
applied artificial intelligence. I work with Python, JavaScript, natural
language processing, databases and APIs to build and integrate solutions
that solve real needs. I have experience in AI projects for educational
platforms, backend development and knowledge-based systems.
`),
    "frase.txt": L(`"Desarrollo e integro soluciones de software e inteligencia artificial,
conectando datos, modelos y servicios para resolver problemas concretos."

— Versión técnica:
"Backend e inteligencia artificial aplicada: del procesamiento de datos
y NLP a la integración de modelos y APIs en aplicaciones reales."
`, `"I develop and integrate software and artificial intelligence solutions,
connecting data, models and services to solve concrete problems."

— Technical version:
"Backend and applied artificial intelligence: from data processing and
NLP to integrating models and APIs into real applications."
`),
    "cv.pdf": null
  },
  "experiencia": {
    "clusteria.txt": L(`Desarrollador Junior de IA — ClusterIA / IEST Anáhuac
octubre 2025 – actualidad

Soluciones de inteligencia artificial para el entorno educativo e
institucional.

Responsabilidades:
- Preparación y estructuración de datasets para clasificación de
  intenciones y procesamiento de lenguaje natural.
- Organización de ejemplos, etiquetas y entidades para entrenar y
  evaluar modelos.
- Revisión de datos y detección de inconsistencias en ejemplos,
  etiquetas y configuraciones.
- Evaluación de resultados de modelos y análisis de errores.
- Trabajo con modelos de lenguaje y modelos compactos para tareas
  específicas.
- Integración de APIs y servicios de inteligencia artificial.
- Desarrollo de una integración LTI en JavaScript para Canvas LMS.
- Pruebas de funcionamiento, validación de respuestas y documentación.

Proyecto destacado: Canvitas, asistente de ayuda para Canvas LMS
basado en procesamiento de lenguaje natural.
`, `Junior AI Developer — ClusterIA / IEST Anáhuac
October 2025 – present

Artificial intelligence solutions for the educational and institutional
environment.

Responsibilities:
- Prepared and structured datasets for intent classification and NLP.
- Organized examples, labels and entities to train and evaluate models.
- Data review and detection of inconsistencies in examples, labels and
  configurations.
- Model evaluation and error analysis.
- Worked with language models and compact models for specific tasks.
- Integration of AI APIs and services.
- Developed a JavaScript LTI integration for Canvas LMS.
- Testing, answer validation and documentation.

Featured project: Canvitas, an NLP-based help assistant for Canvas LMS.
`),
    "anestesiologia.txt": L(`Desarrollador Backend Freelance — Colegio de Anestesiología de Tampico
junio 2025 – octubre 2025
Proyecto: sistema ERM / plataforma administrativa para el gremio
(comunidad de ~560 médicos anestesiólogos).

Actividades:
- Levantamiento y análisis de requerimientos.
- Identificación de entidades, relaciones y necesidades de información.
- Diseño de modelos y estructuras de bases de datos.
- Desarrollo de lógica de negocio para los procesos del sistema.
- Implementación de componentes backend.
- Atención a la integridad y consistencia de los datos.
- Seguimiento independiente de tareas y entrega del desarrollo.
`, `Backend Developer (Freelance) — Colegio de Anestesiología de Tampico
June 2025 – October 2025
Project: ERM system / administrative platform for the guild
(a community of ~560 anesthesiologist physicians).

Activities:
- Requirements gathering and analysis.
- Identification of entities, relationships and information needs.
- Design of data models and database structures.
- Business logic development for the system's processes.
- Backend component implementation.
- Attention to data integrity and consistency.
- Independent task tracking and delivery of the developed system.
`),
    "independientes.txt": L(`Proyectos independientes — sistemas administrativos

- Carroel: sistema administrativo para una escuela de manejo.
- Herramientas para registrar información, administrar entidades,
  automatizar tareas y ofrecer interfaces de operación.

Estos proyectos parten de necesidades operativas reales: organizar
procesos que normalmente requieren seguimiento manual.
`, `Independent projects — administrative systems

- Carroel: administrative system for a driving school.
- Tools to record information, manage entities, automate tasks and
  provide operation interfaces.

These projects start from real operational needs: organizing processes
that usually require manual tracking.
`)
  },
  "proyectos": {
    "canvitas.txt": L(`Canvitas — Asistente de lenguaje natural para Canvas LMS

Sistema de comprensión de lenguaje natural que traduce solicitudes en
lenguaje cotidiano a intenciones de la API de Canvas LMS, con control
sobre la interpretación y los datos necesarios para ejecutar cada acción.

Filosofía: "MiniLM reconoce, ToD decide".

Arquitectura y tecnologías:
- paraphrase-multilingual-MiniLM-L12-v2 (Sentence Transformers, PyTorch).
- Clasificación de intenciones y reconocimiento de entidades con
  etiquetado IOB y slot filling.
- Componente de diálogo (ToD): gestión de contexto, parámetros
  faltantes y solicitud de aclaraciones.
- Ontología que relaciona acciones, recursos, vistas y filtros.
- Integración con Canvas LMS mediante APIs y componente LTI (JavaScript).
- Conversión a ONNX para inferencia optimizada.

Resultados registrados (evaluación interna del proyecto):
- Dataset V2: 12,600 ejemplos — 36 intenciones (350 c/u).
- 33 etiquetas IOB y 16 tipos de entidades.
- División entrenamiento/validación/prueba: 70/15/15.
- Mejor resultado: 98.39% en intención y 99.55% en entidades.
- ONNX con coincidencia del 100% en argmax frente al modelo de
  referencia en la validación realizada.

Estado: evolucionó de una demostración NLP a una integración LTI con
Canvas LMS y una versión beta orientada a producción.
`, `Canvitas — Natural language assistant for Canvas LMS

A natural language understanding system that translates everyday-language
requests into Canvas LMS API intents, with control over interpretation
and the data needed to execute each action.

Philosophy: "MiniLM recognizes, ToD decides".

Architecture and technologies:
- paraphrase-multilingual-MiniLM-L12-v2 (Sentence Transformers, PyTorch).
- Intent classification and entity recognition with IOB tagging and
  slot filling.
- Dialogue component (ToD): context management, missing parameters and
  clarification requests.
- Ontology linking actions, resources, views and filters.
- Canvas LMS integration via APIs and an LTI component (JavaScript).
- ONNX conversion for optimized inference.

Recorded results (internal project evaluation):
- Dataset V2: 12,600 examples — 36 intents (350 each).
- 33 IOB labels and 16 entity types.
- Train/validation/test split: 70/15/15.
- Best result: 98.39% intent classification, 99.55% entity recognition.
- ONNX with 100% argmax match against the reference model in the
  performed validation.

Status: evolved from an NLP demo into an LTI integration with Canvas
LMS and a production-oriented beta version.
`),
    "asistente_juridico.txt": L(`Asistente de consulta jurídica en ciberseguridad con RAG

Asistente experimental que responde preguntas sobre legislación y
documentos jurídicos mexicanos relacionados con ciberseguridad y
protección de datos. Las respuestas se apoyan en documentos recuperados,
no en afirmaciones sin evidencia.

Componentes:
- Node.js y APIs de modelos de lenguaje.
- OpenAI Vector Stores / almacenamiento vectorial.
- Recuperación aumentada por generación (RAG).
- Procesamiento de PDF: extracción de texto y OCR como alternativa.
- Metadatos documentales y citas con identificadores de fuente.
- Evaluación de respuestas y casos concretos.

El corpus contempla la Constitución, códigos federales, legislación de
protección de datos, propiedad intelectual, seguridad pública y
criterios judiciales. Si no hay respaldo suficiente, lo señala.
`, `Legal research assistant for cybersecurity with RAG

An experimental assistant that answers questions about Mexican
legislation and legal documents related to cybersecurity and data
protection. Answers are grounded in retrieved documents, not in
unsupported claims.

Components:
- Node.js and language model APIs.
- OpenAI Vector Stores / vector storage.
- Retrieval-augmented generation (RAG).
- PDF processing: text extraction and OCR as a fallback.
- Document metadata and citations with source identifiers.
- Answer and case evaluation.

The corpus includes the Constitution, federal codes, data protection
law, intellectual property, public security and judicial criteria. When
evidence is insufficient, it says so.
`),
    "modelos_locales.txt": L(`Modelos locales e infraestructura de inferencia

Experimentación con ejecución de modelos de lenguaje en infraestructura
local: requisitos de memoria, rendimiento, configuración y exposición
de servicios.

Experiencia práctica:
- Ejecución de modelos mediante vLLM.
- Modelos cuantizados, incluyendo Qwen2.5-32B-Instruct-AWQ.
- API de inferencia compatible con servicios backend.
- Configuración de longitud de contexto y uso de memoria de GPU.
- Servicios con FastAPI.
- Pruebas de carga y observación del comportamiento del servicio.
- Integración de modelos locales con aplicaciones propias.

También un servicio que procesa registros educativos y genera mensajes
de apoyo dirigidos a estudiantes con recomendaciones.
`, `Local models and inference infrastructure

Experimentation with running language models on local infrastructure:
memory requirements, performance, configuration and service exposure.

Hands-on experience:
- Serving models with vLLM.
- Quantized models, including Qwen2.5-32B-Instruct-AWQ.
- Inference API compatible with backend services.
- Context length and GPU memory configuration.
- FastAPI services.
- Load testing and service behavior observation.
- Integration of local models with own applications.

Also a service that processes educational records and generates
supportive, recommendation-bearing messages for students.
`),
    "erm_anestesiologia.txt": L(`Sistema ERM — Colegio de Anestesiología de Tampico

Sistema para centralizar información y procesos administrativos de una
organización profesional de ~560 médicos anestesiólogos.

Incluyó: levantamiento de requerimientos, modelado de datos, diseño de
esquemas, lógica de negocio, implementación backend e integridad de
datos.
`, `ERM system — Colegio de Anestesiología de Tampico

System to centralize information and administrative processes for a
professional organization of ~560 anesthesiologist physicians.

Included: requirements gathering, data modeling, schema design, business
logic, backend implementation and data integrity.
`),
    "carroel.txt": L(`Carroel — Sistema administrativo para escuela de manejo

Software para apoyar la administración de una escuela de manejo:
organizar información y procesos que normalmente requieren seguimiento
manual. Registrar información, administrar entidades, automatizar tareas
y ofrecer una interfaz para operar sin procesos manuales dispersos.

Proyecto de desarrollo de sistemas administrativos; se presentan las
funciones implementadas y verificables.
`, `Carroel — Administrative system for a driving school

Software to support the administration of a driving school: organizing
information and processes that usually require manual tracking. Record
information, manage entities, automate tasks and provide an interface
to operate without scattered manual processes.

Administrative systems development project; only implemented and
verifiable features are presented.
`)
  },
  "habilidades": {
    "lenguajes.txt": L(`Lenguajes de programación:
Python (datos, automatización, IA, servicios), JavaScript (backend,
APIs, Canvas LMS), Node.js (servicios, integración), SQL (relacional),
C++, PHP, HTML y CSS.
`, `Programming languages:
Python (data, automation, AI, services), JavaScript (backend, APIs,
Canvas LMS), Node.js (services, integration), SQL (relational), C++,
PHP, HTML and CSS.
`),
    "ia_datos.txt": L(`Inteligencia artificial y datos:
- NLP: clasificación de intenciones, extracción de entidades, IOB.
- Sentence Transformers, MiniLM, PyTorch.
- Fine-tuning y ajuste de modelos para tareas específicas.
- Preparación y evaluación de datasets, métricas, análisis de errores.
- LLM, RAG, bases de conocimiento, almacenamiento vectorial.
- Prompting e integración mediante APIs.
- Inferencia local: vLLM, ONNX, ONNX Runtime.

Bases de datos y datos:
MySQL, PostgreSQL, MongoDB, SQL, Pandas, JSON, modelado de datos,
diseño de esquemas, validación y consistencia.
`, `Artificial intelligence and data:
- NLP: intent classification, entity extraction, IOB tagging.
- Sentence Transformers, MiniLM, PyTorch.
- Fine-tuning for specific tasks.
- Dataset preparation and evaluation, metrics, error analysis.
- LLMs, RAG, knowledge bases, vector storage.
- Prompting and API-based model integration.
- Local inference: vLLM, ONNX, ONNX Runtime.

Databases and data:
MySQL, PostgreSQL, MongoDB, SQL, Pandas, JSON, data modeling, schema
design, validation and consistency.
`),
    "backend.txt": L(`Backend e integración:
Node.js, APIs REST, consumo de APIs, integración de servicios externos,
FastAPI, lógica de negocio, diseño de servicios, integración de
plataformas, Canvas LMS, LTI (Learning Tools Interoperability), JSON,
arquitectura de aplicaciones backend.
`, `Backend and integration:
Node.js, REST APIs, third-party services integration, FastAPI, business
logic, service design, platform integration, Canvas LMS, LTI (Learning
Tools Interoperability), JSON, backend application architecture.
`),
    "herramientas.txt": L(`Herramientas y entornos:
Git, Docker, Linux (Arch Linux + Hyprland), Windows, Visual Studio Code,
terminal y línea de comandos, entornos de desarrollo locales, GPUs NVIDIA
y modelos cuantizados.

Analítica: Pandas y SQL (práctica), Excel. Power BI: conocimiento
académico (no experiencia profesional).
`, `Tools and environments:
Git, Docker, Linux (Arch Linux + Hyprland), Windows, Visual Studio Code,
terminal and command line, local dev environments, NVIDIA GPUs and
quantized models.

Analytics: Pandas and SQL (practice), Excel. Power BI: academic
knowledge (no professional experience).
`)
  },
  "educacion": {
    "iest_anahuac.txt": L(`Licenciatura en Sistemas Computacionales y Negocios Digitales
IEST Anáhuac
Noveno semestre — graduación prevista: diciembre de 2026.

La formación combina fundamentos de sistemas computacionales con
procesos y negocios digitales: analizar tanto la implementación de una
solución como el proceso que pretende mejorar.
`, `B.Sc. in Computer Systems and Digital Business
IEST Anáhuac
Ninth semester — expected graduation: December 2026.

The program combines computer systems fundamentals with digital business
processes: analyzing both the implementation of a solution and the
process it aims to improve.
`)
  },
  "contacto": {
    "info.txt": L(`Román del Angel Juárez
Tampico, Tamaulipas, México

Correo:  fjrdelangeljr@gmail.com
GitHub:  https://github.com/PWD-Roman
LinkedIn: https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/

CV: escribe 'cv' o 'open perfil' para descargarlo.
`, `Román del Angel Juárez
Tampico, Tamaulipas, Mexico

Email:    fjrdelangeljr@gmail.com
GitHub:   https://github.com/PWD-Roman
LinkedIn: https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/

CV: run 'cv' or 'open perfil' to download it.
`)
  }
};

// ===== Tipo de nodo en el FS =====
function isDir(node) {
  return typeof node === 'object' && node !== null && !node.__i18n;
}
function fileText(node) {
  if (node && typeof node === 'object' && node.__i18n) return node[LANG] || node.en;
  return node;
}

// If there's a persisted fs (user created files), merge them
let fs = savedFiles ? mergeFS(DEFAULT_FS, savedFiles) : deepCopy(DEFAULT_FS);

// Current working directory (array stack) and node reference
let pathStack = []; // e.g [] = ~ ; ['perfil'] => ~/perfil
let cwd = fs;

// Command list for autocomplete
const COMMANDS = ['help','ls','cd','pwd','cat','clear','mkdir','touch','rm','echo','history',
  'neofetch','tree','find','grep','whoami','hostname','date','uname','uptime','which','man',
  'sudo','skills','theme','cv','open','lang','idioma','autocomplete','autoclear'];

// ===== Themes (el comando 'theme' cambia el acento de toda la página) =====
const THEMES = {
  'azul':   { accent: '#39b0ff', accent2: '#00ffaa', label: { es: 'Azul (por defecto)', en: 'Blue (default)' } },
  'verde':  { accent: '#00e676', accent2: '#39b0ff', label: { es: 'Verde', en: 'Green' } },
  'morado': { accent: '#b388ff', accent2: '#ff80ab', label: { es: 'Morado', en: 'Purple' } },
  'ambar':  { accent: '#ffb74d', accent2: '#4dd0e1', label: { es: 'Ámbar', en: 'Amber' } },
  'rosa':   { accent: '#ff6b9d', accent2: '#ffd166', label: { es: 'Rosa', en: 'Pink' } }
};
let currentTheme = localStorage.getItem(STORAGE_KEY + '_theme') || 'azul';
applyTheme(currentTheme, true);

// ===== Neofetch (simulación estilo Arch) =====
const NF_LOGO = [
  '                   -`',
  '                  .o+`',
  '                 `ooo/',
  '                `+oooo:',
  '               `+oooooo:',
  '               -+oooooo+:',
  '             `/:-:++oooo+:',
  '            `/++++/+++++++:',
  '           `/++++++++++++++:',
  '          `/+++o\\o\\o\\o\\ooo/`',
  '         ./ooosssso++osssssso+`',
  '        .oossssso-````/ossssss+`',
  '       -osssssso.      :ssssssso.',
  '      :osssssss/        osssso+++.',
  '     /ossssssss/        +ssssooo/-',
  '   `/ossssso+/:-        -:/+osssso+-',
  '  `+sso+:-`                 `.-/+oso:',
  ' `++:.                           `-/+/',
  ' .`                                 `/'
];

const NF_COLORS = ['#000000','#ff5555','#50fa7b','#f1fa8c','#bd93f9','#ff79c6','#8be9fd','#bbbbbb'];
const NF_COLORS_BRIGHT = ['#555555','#ff6e67','#5efa89','#ffec8b','#c792ea','#ff92df','#a4ffff','#ffffff'];

function buildNeofetch() {
  const usedMem = (2.4 + (performance.now() / 60000) % 1.8).toFixed(1);
  const info = [
    { t: 'roman@arch', cls: 'nf-title' },
    { t: '-------------------------------', cls: '' },
    { t: 'OS: Arch Linux x86_64', cls: '' },
    { t: 'Host: Portfolio Web Terminal 1.0', cls: '' },
    { t: 'Kernel: 6.11.8-arch1-2', cls: '' },
    { t: 'Uptime: ' + formatUptime(performance.now()), cls: '' },
    { t: 'Packages: 1337 (pacman), 8 (flatpak)', cls: '' },
    { t: 'Shell: zsh 5.9', cls: '' },
    { t: `Resolution: ${window.innerWidth}x${window.innerHeight}`, cls: '' },
    { t: 'WM: Hyprland (Wayland)', cls: '' },
    { t: 'Theme: portfolio-' + currentTheme + ' [Dark]', cls: '' },
    { t: 'Terminal: web-terminal', cls: '' },
    { t: 'CPU: AMD Ryzen 5 5500 (6) @ 3.60GHz', cls: '' },
    { t: 'GPU: NVIDIA GeForce RTX 5060', cls: '' },
    { t: `Memory: ${usedMem}GiB / 31.2GiB`, cls: '' },
    { t: '', cls: '' }
  ];

  // Paleta de colores (bloques como neofetch real)
  const blocks = (colors) => colors.map(c =>
    `<span class="nf-block" style="background:${c}"></span>`).join('');
  info.push({ t: blocks(NF_COLORS), cls: '' });
  info.push({ t: blocks(NF_COLORS_BRIGHT), cls: '' });

  const rows = Math.max(NF_LOGO.length, info.length);
  const lines = [];
  for (let i = 0; i < rows; i++) {
    const logoLine = NF_LOGO[i] !== undefined
      ? `<span class="nf-logo">${escapeHtml(NF_LOGO[i].padEnd(42))}</span>` : '<span></span>';
    let infoHtml = '';
    if (info[i] !== undefined) {
      const item = info[i];
      if (item.cls) {
        infoHtml = `<span class="${item.cls}">${item.t}</span>`;
      } else if (item.t.includes('nf-block')) {
        infoHtml = item.t;
      } else {
        infoHtml = escapeHtml(item.t);
      }
    }
    lines.push(logoLine + infoHtml);
  }
  return lines.join('\n');
}

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
      printRaw(T('help').replace('{THEMES}', Object.keys(THEMES).join('|')));
      break;

    case 'ls':
      do_ls(args[0]);
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
      printHTML(buildNeofetch());
      break;

    case 'tree':
      do_tree();
      break;

    case 'find':
      do_find(args[0]);
      break;

    case 'grep':
      do_grep(args[0]);
      break;

    case 'whoami':
      printRaw('roman');
      break;

    case 'hostname':
      printRaw('arch');
      break;

    case 'date':
      printRaw(new Date().toLocaleString(LANG === 'es' ? 'es-MX' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
      break;

    case 'uname':
      if (args[0] === '-a') {
        printRaw('Linux arch 6.11.8-arch1-2 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
      } else {
        printRaw('Linux');
      }
      break;

    case 'uptime':
      printRaw(T('uptime_line', formatUptime(performance.now())));
      break;

    case 'which':
      do_which(args[0]);
      break;

    case 'man':
      do_man(args[0]);
      break;

    case 'sudo':
      printRaw(args.length ? T('sudo_denied') : T('usage_sudo'));
      break;

    case 'skills':
      printRaw(T('skills_text'));
      break;

    case 'theme':
      do_theme(args[0]);
      break;

    case 'cv':
      downloadCV();
      break;

    case 'open':
      do_open(args[0]);
      break;

    case 'lang':
    case 'idioma':
      do_lang(args[0]);
      break;

    case 'autocomplete':
      printRaw(T('autocomplete_tip'));
      break;

    case 'autoclear':
      toggleAutoClear();
      break;

    default:
      printRaw(T('cmd_not_found', command));
  }

  // store fs to localStorage for persistence
  localStorage.setItem(STORAGE_KEY + '_fs', JSON.stringify(stripFunctionsFromFS(fs)));
  // scroll smooth to bottom
  smoothScrollToBottom();
  updatePrompt();
}

/* ----------------- Implementación de comandos ----------------- */

function do_ls(argPath) {
  let node = cwd;
  if (argPath) {
    const resolved = resolveNode(argPath);
    if (!resolved) {
      printRaw(T('invalid_path', argPath));
      return;
    }
    if (!isDir(resolved.node)) {
      printRaw(T('usage_ls_path', argPath));
      return;
    }
    node = resolved.node;
  }
  const keys = Object.keys(node);
  if (keys.length === 0) {
    printRaw('');
    return;
  }
  const lines = keys.map(k => {
    return isDir(node[k]) ? `\uD83D\uDCC1 ${k}` : `\uD83D\uDCC4 ${k}`;
  }).join('   ');
  printRaw(lines);
}

function do_cd(arg) {
  if (!arg) {
    printRaw(T('usage_cd'));
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
  if (arg === '~' || arg === '/') {
    pathStack = [];
    cwd = fs;
    updatePrompt();
    return;
  }
  // absolute path like /perfil or /perfil/sub
  if (arg.startsWith('/')) {
    const parts = arg.split('/').filter(Boolean);
    const node = traversePath(parts, true);
    if (!node) {
      printRaw(T('invalid_path', arg));
      return;
    }
    pathStack = parts;
    cwd = node;
    updatePrompt();
    return;
  }
  // relative folder
  if (isDir(cwd[arg])) {
    pathStack.push(arg);
    cwd = cwd[arg];
    updatePrompt();
  } else {
    printRaw(T('folder_not_found', arg));
  }
}

function do_cat(filename) {
  if (!filename) {
    printRaw(T('usage_cat'));
    return;
  }
  let node = cwd[filename];
  if (filename.includes('/')) {
    const resolved = resolveNode(filename);
    if (!resolved) {
      printRaw(T('file_not_found', filename));
      return;
    }
    node = resolved.node;
  }
  if (node === undefined || node === null) {
    printRaw(T('file_not_found', filename));
    return;
  }
  if (isDir(node)) {
    printRaw(T('is_folder', filename));
    return;
  }
  // typing animation
  typeOut(fileText(node));
}

function do_mkdir(name) {
  if (!name) { printRaw(T('usage_mkdir')); return; }
  if (cwd[name]) { printRaw(T('exists', name)); return; }
  cwd[name] = {};
  printRaw(T('created_dir', name));
}

function do_touch(name) {
  if (!name) { printRaw(T('usage_touch')); return; }
  if (cwd[name]) { printRaw(T('exists', name)); return; }
  cwd[name] = "";
  printRaw(T('created_file', name));
}

function do_rm(name) {
  if (!name) { printRaw(T('usage_rm')); return; }
  if (!cwd[name]) { printRaw(T('not_exists', name)); return; }
  if (isDir(cwd[name])) {
    // check empty
    if (Object.keys(cwd[name]).length > 0) {
      printRaw(T('dir_not_empty'));
      return;
    }
  }
  delete cwd[name];
  printRaw(T('deleted', name));
}

function do_tree() {
  const lines = ['~'];
  (function walk(node, prefix) {
    const keys = Object.keys(node);
    keys.forEach((k, i) => {
      const isLast = i === keys.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const child = node[k];
      if (isDir(child)) {
        lines.push(prefix + branch + k + '/');
        walk(child, prefix + (isLast ? '    ' : '│   '));
      } else {
        lines.push(prefix + branch + k);
      }
    });
  })(fs, '');
  printRaw(lines.join('\n'));
}

function do_find(term) {
  if (!term) { printRaw(T('find_usage')); return; }
  const results = [];
  (function walk(node, path) {
    Object.keys(node).forEach(k => {
      const full = path ? path + '/' + k : k;
      const child = node[k];
      if (k.toLowerCase().includes(term.toLowerCase())) results.push(full);
      if (isDir(child)) walk(child, full);
    });
  })(fs, '');
  printRaw(results.length ? results.join('\n') : T('find_no_results', term));
}

function do_grep(term) {
  if (!term) { printRaw(T('grep_usage')); return; }
  const results = [];
  (function walk(node, path) {
    Object.keys(node).forEach(k => {
      const full = path ? path + '/' + k : k;
      const child = node[k];
      if (isDir(child)) {
        walk(child, full);
      } else if (child !== null && child !== undefined) {
        const text = fileText(child);
        if (typeof text === 'string') {
          text.split('\n').forEach((line, i) => {
            if (line.toLowerCase().includes(term.toLowerCase())) {
              results.push(`${full}:${i+1}: ${line.trim()}`);
            }
          });
        }
      }
    });
  })(fs, '');
  printRaw(results.length ? results.join('\n') : T('grep_no_matches', term));
}

function do_which(name) {
  if (!name) { printRaw(T('usage_which')); return; }
  if (COMMANDS.includes(name.toLowerCase())) {
    printRaw(`/usr/bin/${name}`);
  } else {
    printRaw(T('which_not_found', name));
  }
}

const MAN_PAGES = {
  en: {
    ls: 'ls [path] — lists the contents of a folder.',
    cd: 'cd [folder|..|~|/path] — changes the working directory.',
    pwd: 'pwd — prints the current directory path.',
    cat: 'cat [file|path] — shows a file with a typing animation.',
    tree: 'tree — shows the full file system hierarchy.',
    find: 'find [text] — searches files whose name contains the text.',
    grep: 'grep [text] — searches for matches inside all files.',
    mkdir: 'mkdir [name] — creates a folder in the current directory.',
    touch: 'touch [name] — creates an empty file.',
    rm: 'rm [name] — deletes a file or an empty folder.',
    echo: 'echo [text] — prints text to the terminal.',
    history: 'history — shows executed commands (persistent).',
    neofetch: 'neofetch — system info with ASCII art.',
    whoami: 'whoami — prints the current user name.',
    hostname: 'hostname — prints the host name.',
    date: 'date — shows the current date and time.',
    uname: 'uname [-a] — system name; -a shows everything.',
    uptime: 'uptime — session time and system load.',
    which: 'which [cmd] — shows the path of an installed command.',
    sudo: 'sudo [cmd] — tries to run as root (better not).',
    skills: 'skills — technical skills summary.',
    theme: 'theme [name] — changes the accent color of the page.',
    lang: 'lang [es|en] — switches the interface language.',
    cv: 'cv — downloads the CV as PDF.',
    open: 'open [perfil|linkedin|github|proyectos] — opens external resources.',
    clear: 'clear — clears the terminal screen.',
    man: 'man [command] — shows this short help.',
    help: 'help — lists all available commands.'
  },
  es: {
    ls: 'ls [ruta] — lista el contenido de una carpeta.',
    cd: 'cd [carpeta|..|~|/ruta] — cambia el directorio de trabajo.',
    pwd: 'pwd — imprime la ruta del directorio actual.',
    cat: 'cat [archivo|ruta] — muestra el contenido de un archivo con animación.',
    tree: 'tree — muestra la jerarquía completa del sistema de archivos.',
    find: 'find [texto] — busca archivos cuyo nombre contenga el texto.',
    grep: 'grep [texto] — busca coincidencias dentro de todos los archivos.',
    mkdir: 'mkdir [nombre] — crea una carpeta en el directorio actual.',
    touch: 'touch [nombre] — crea un archivo vacío.',
    rm: 'rm [nombre] — elimina un archivo o una carpeta vacía.',
    echo: 'echo [texto] — imprime texto en la terminal.',
    history: 'history — muestra los comandos ejecutados (persistente).',
    neofetch: 'neofetch — información del sistema con arte ASCII.',
    whoami: 'whoami — imprime el nombre del usuario actual.',
    hostname: 'hostname — imprime el nombre del host.',
    date: 'date — muestra la fecha y hora actuales.',
    uname: 'uname [-a] — nombre del sistema; -a muestra todo.',
    uptime: 'uptime — tiempo de sesión y carga del sistema.',
    which: 'which [cmd] — muestra la ruta de un comando instalado.',
    sudo: 'sudo [cmd] — intenta ejecutar como superusuario (mejor no).',
    skills: 'skills — resumen de habilidades técnicas.',
    theme: 'theme [nombre] — cambia el color de acento de la página.',
    lang: 'lang [es|en] — cambia el idioma de la interfaz.',
    cv: 'cv — descarga el CV en PDF.',
    open: 'open [perfil|linkedin|github|proyectos] — abre recursos externos.',
    clear: 'clear — limpia la pantalla de la terminal.',
    man: 'man [comando] — muestra esta ayuda breve.',
    help: 'help — lista todos los comandos disponibles.'
  }
};

function do_man(name) {
  if (!name) { printRaw(T('usage_man') + '\n' + T('man_list', Object.keys(MAN_PAGES[LANG] || MAN_PAGES.en).join(', '))); return; }
  const pack = MAN_PAGES[LANG] || MAN_PAGES.en;
  const entry = pack[name.toLowerCase()] || MAN_PAGES.en[name.toLowerCase()];
  printRaw(entry ? entry : T('man_missing', name));
}

function do_theme(name) {
  if (!name) {
    const list = Object.entries(THEMES).map(([k, v]) =>
      k === currentTheme ? `* ${k} — ${v.label[LANG] || v.label.en}` : `  ${k} — ${v.label[LANG] || v.label.en}`).join('\n');
    printRaw(`${T('theme_title')}\n${list}\n\n${T('theme_usage_suffix')}`);
    return;
  }
  const key = name.toLowerCase();
  if (!THEMES[key]) {
    printRaw(T('theme_unknown', name, Object.keys(THEMES).join(', ')));
    return;
  }
  applyTheme(key);
  printRaw(T('theme_applied', key, THEMES[key].label[LANG] || THEMES[key].label.en));
}

function applyTheme(name, silent) {
  if (!THEMES[name]) name = 'azul';
  currentTheme = name;
  const root = document.documentElement;
  root.style.setProperty('--accent', THEMES[name].accent);
  root.style.setProperty('--accent-2', THEMES[name].accent2);
  localStorage.setItem(STORAGE_KEY + '_theme', name);
  if (!silent) updatePrompt();
}

function applyLang(newLang) {
  LANG = (newLang === 'es') ? 'es' : 'en';
  localStorage.setItem(STORAGE_KEY + '_lang', LANG);
  document.documentElement.lang = LANG;
  applyFormalLang();
  applyModeButtonText();
}

function do_lang(arg) {
  if (!arg) {
    if (LANG === 'es') { applyLang('en'); printRaw(T('lang_switched')); }
    else { applyLang('es'); printRaw(T('lang_switched')); }
    return;
  }
  const a = arg.toLowerCase();
  if (a === 'es' || a === 'en') {
    if (a === LANG) { printRaw(T('lang_already')); return; }
    applyLang(a);
    printRaw(T('lang_switched'));
  } else {
    printRaw(T('usage_lang'));
  }
}

function downloadCV() {
  if (fs['perfil'] && fs['perfil']['cv.pdf'] !== undefined) {
    printRaw(T('cv_start'));
    const a = document.createElement('a');
    a.href = 'cv.pdf';
    a.download = 'Roman_del_Angel_CV.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    printRaw(T('cv_missing'));
  }
}

function do_open(target) {
  if (!target) { printRaw(T('usage_open')); return; }

  switch(target.toLowerCase()) {
    case 'perfil':
      downloadCV();
      break;

    case 'linkedin':
      printRaw(T('opening_linkedin'));
      window.open('https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/', '_blank');
      break;

    case 'github':
      printRaw(T('opening_github'));
      window.open('https://github.com/PWD-Roman', '_blank');
      break;

    case 'proyectos':
      printRaw(T('projects_summary'));
      break;

    default:
      printRaw(T('open_unknown', target));
  }
}

/* ----------------- Utilities ----------------- */

function printRaw(text){
  // append text to output
  output.innerHTML += escapeHtml(text) + '\n';
}

function printHTML(html){
  // append raw HTML (solo contenido controlado internamente)
  output.innerHTML += html + '\n';
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
    if (isDir(node[p])) {
      node = node[p];
    } else {
      return null;
    }
  }
  return node;
}

// Resuelve rutas con '/' para comandos como cat o ls. Devuelve {node} o null.
function resolveNode(pathStr) {
  const isAbs = pathStr.startsWith('/');
  const parts = pathStr.split('/').filter(Boolean);
  let node = isAbs ? fs : cwd;
  for (const p of parts) {
    if (node[p] === undefined || node[p] === null) return null;
    node = node[p];
  }
  return { node };
}

/* ----------------- Typing animation ----------------- */
let typingEnabled = true;
function typeOut(text, speed = 14) {
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
  const fileCommands = ['cat','rm','touch','mkdir','open','cd','ls','man'];
  if (fileCommands.includes(cmdPart)) {
    if (cmdPart === 'man') {
      suggestions.push(...Object.keys(MAN_PAGES[LANG] || MAN_PAGES.en).filter(m => m.startsWith(rest)));
    } else {
      const files = Object.keys(cwd).filter(k => k.startsWith(rest));
      suggestions.push(...files);
    }
  }
  if (cmdPart === 'theme') {
    suggestions.push(...Object.keys(THEMES).filter(t => t.startsWith(rest)));
  }
  if (cmdPart === 'lang' || cmdPart === 'idioma') {
    suggestions.push(...['es','en'].filter(x => x.startsWith(rest)));
  }

  // dedupe
  const unique = [...new Set(suggestions)].slice(0,50);

  if (unique.length === 0) { hideAutocomplete(); return; }
  showAutocomplete(unique);
}

function showAutocomplete(items) {
  acBox.innerHTML = '';
  items.forEach((it) => {
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
      if (isDir(userFS[k]) && isDir(cp[k])) {
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
  printRaw(T('autoclear', autoClear));
}

/* ----------------- Alternar vista terminal / formal ----------------- */
const modeToggle = document.getElementById('modeToggle');
const terminalEl = document.getElementById('terminal');
const formalEl = document.getElementById('formalView');
let formalMode = localStorage.getItem(STORAGE_KEY + '_mode') === 'formal';

function applyModeButtonText() {
  document.getElementById('modeToggleText').textContent = formalMode ? T('btn_terminal') : T('btn_formal');
  document.getElementById('modeToggleIcon').textContent = formalMode ? '🖥️' : '📄';
}

function applyMode() {
  document.body.classList.toggle('formal', formalMode);
  terminalEl.hidden = formalMode;
  formalEl.hidden = !formalMode;
  applyModeButtonText();
  localStorage.setItem(STORAGE_KEY + '_mode', formalMode ? 'formal' : 'terminal');
  if (formalMode) {
    window.scrollTo(0, 0);
  } else {
    cmd.focus();
    smoothScrollToBottom();
  }
}

modeToggle.addEventListener('click', () => {
  formalMode = !formalMode;
  applyMode();
});

/* ----------------- Idioma de la vista formal ----------------- */
function applyFormalLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = TF(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = TF(el.getAttribute('data-i18n-html'));
  });
}

/* ----------------- Diccionario de la vista formal ----------------- */
const FORMAL = {
  en: {
    f_kicker: 'Portfolio',
    f_role: 'Software Developer · Backend and Applied Artificial Intelligence',
    f_loc: 'Tampico, Tamaulipas, Mexico',
    f_btn_mail: '✉ Email',
    f_about: 'About me',
    f_about_p1: 'I am a software developer focused on backend and applied artificial intelligence. I currently work at ClusterIA, where I prepare and evaluate data, build natural language processing models and integrate AI services with educational platforms such as Canvas LMS.',
    f_about_p2: 'I have also built backend solutions for real organizations, taking part in requirements analysis, data modeling, business logic and implementation. I am interested in building useful, reliable and maintainable systems, understanding how their components connect from data all the way to the user experience.',
    f_exp: 'Experience',
    f_exp1_t: 'Junior AI Developer',
    f_exp1_b: 'ClusterIA / IEST Anáhuac',
    f_exp1_p: 'October 2025 – present',
    f_exp1_i1: 'Prepared and structured datasets for intent classification and NLP.',
    f_exp1_i2: 'Organized examples, labels and entities to train and evaluate models.',
    f_exp1_i3: 'Evaluated models, analyzed errors and detected inconsistencies.',
    f_exp1_i4: 'Integrated AI APIs and services; built a JavaScript LTI integration for Canvas LMS.',
    f_exp1_i5: 'Testing, answer validation, documentation and component stabilization.',
    f_exp1_n: 'Featured project: Canvitas, an NLP-based help assistant for Canvas LMS.',
    f_exp2_t: 'Backend Developer (Freelance)',
    f_exp2_b: 'Colegio de Anestesiología de Tampico',
    f_exp2_p: 'June 2025 – October 2025',
    f_exp2_i1: 'ERM system / administrative platform for a community of ~560 anesthesiologist physicians.',
    f_exp2_i2: 'Requirements gathering, data modeling and schema design.',
    f_exp2_i3: 'Business logic development and backend component implementation.',
    f_exp2_i4: 'Data integrity and consistency; delivery of the developed system.',
    f_exp3_t: 'Independent projects',
    f_exp3_b: 'Administrative systems',
    f_exp3_p: 'personal projects',
    f_exp3_i1: 'Carroel: administrative system for a driving school.',
    f_exp3_i2: 'Tools to record information, manage entities and automate tasks.',
    f_proj: 'Projects',
    f_p1_b: 'NLP · Canvas LMS',
    f_p1_d: 'A natural language assistant that turns everyday-language requests into Canvas LMS API intents. Philosophy: “MiniLM recognizes, ToD decides”.',
    f_p1_i1: 'Multilingual MiniLM + dialogue component (slot filling, context, clarifications).',
    f_p1_i2: 'Dataset V2: 12,600 examples · 36 intents · 33 IOB labels · 16 entities.',
    f_p1_i3: 'LTI integration (JavaScript) and ONNX conversion for optimized inference.',
    f_p1_n: 'Internal project evaluation results: 98.39% intent classification and 99.55% entity recognition (70/15/15 split).',
    f_p2_b: 'Node.js · Vector retrieval',
    f_p2_d: 'An experimental assistant that answers questions about Mexican cybersecurity and data protection legislation, grounded in retrieved documents.',
    f_p2_i1: 'OpenAI Vector Stores, PDF processing and OCR for non-selectable documents.',
    f_p2_i2: 'Traceable citations and references with source identifiers.',
    f_p2_i3: 'Flags missing evidence when retrieval is not sufficient.',
    f_p3_b: 'vLLM · FastAPI · ONNX',
    f_p3_d: 'Local infrastructure to serve language models and consume them from my own applications.',
    f_p3_i1: 'Serving with vLLM and quantized models (Qwen2.5-32B-Instruct-AWQ).',
    f_p3_i2: 'FastAPI services and an inference API compatible with backend services.',
    f_p3_i3: 'Context length, GPU memory configuration and load testing.',
    f_p4_b: 'Backend · Databases',
    f_p4_d: 'System to centralize information and administrative processes for the Colegio de Anestesiología of Tampico (~560 physicians).',
    f_p4_i1: 'Requirements, data modeling, business logic and backend implementation.',
    f_p4_i2: 'Structured information manageable from a centralized system.',
    f_p5_b: 'Administrative system',
    f_p5_d: 'Software to support driving school administration: record information, manage entities and automate previously manual tasks.',
    f_tech: 'Technologies',
    f_t1: 'Practical use in projects',
    f_t2: 'AI and data',
    f_t3: 'Backend and integration',
    f_t4: 'Complementary knowledge',
    f_powbi: 'Power BI (academic)',
    f_edu: 'Education and languages',
    f_edu_t: 'B.Sc. in Computer Systems and Digital Business',
    f_edu_p: 'ninth semester · expected graduation: December 2026',
    f_edu_d: 'A program combining computer systems with digital business processes.',
    f_langs: '<strong>Languages:</strong> Spanish (native) · English (intermediate)',
    f_int: 'Technical interests',
    f_int_1: 'Applied AI',
    f_int_2: 'Local models and privacy',
    f_int_3: 'Natural language processing',
    f_int_4: 'Agents and automation',
    f_int_5: 'Backend and integration',
    f_int_6: 'RAG and knowledge-based systems',
    f_int_7: 'Linux (Arch · Hyprland)',
    f_footer_1: 'Román del Angel Juárez — Tampico, Tamaulipas, Mexico',
    f_footer_2: '<a href="mailto:fjrdelangeljr@gmail.com">fjrdelangeljr@gmail.com</a> · <a href="https://github.com/PWD-Roman" target="_blank" rel="noopener">GitHub</a> · <a href="https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/" target="_blank" rel="noopener">LinkedIn</a>'
  },

  es: {
    f_kicker: 'Portafolio',
    f_role: 'Desarrollador de Software · Backend e Inteligencia Artificial Aplicada',
    f_loc: 'Tampico, Tamaulipas, México',
    f_btn_mail: '✉ Correo',
    f_about: 'Sobre mí',
    f_about_p1: 'Soy desarrollador de software con enfoque en backend e inteligencia artificial aplicada. Actualmente colaboro en ClusterIA, donde trabajo en preparación y evaluación de datos, modelos de procesamiento de lenguaje natural e integración de servicios de IA con plataformas educativas como Canvas LMS.',
    f_about_p2: 'También he desarrollado soluciones backend para organizaciones reales, participando en el análisis de requerimientos, modelado de datos, lógica de negocio e implementación. Me interesa construir sistemas útiles, confiables y mantenibles, entendiendo cómo se conectan sus componentes desde los datos hasta la experiencia del usuario.',
    f_exp: 'Experiencia',
    f_exp1_t: 'Desarrollador Junior de IA',
    f_exp1_b: 'ClusterIA / IEST Anáhuac',
    f_exp1_p: 'octubre 2025 – actualidad',
    f_exp1_i1: 'Preparación y estructuración de datasets para clasificación de intenciones y NLP.',
    f_exp1_i2: 'Organización de ejemplos, etiquetas y entidades para entrenar y evaluar modelos.',
    f_exp1_i3: 'Evaluación de modelos, análisis de errores y detección de inconsistencias.',
    f_exp1_i4: 'Integración de APIs y servicios de IA; integración LTI en JavaScript para Canvas LMS.',
    f_exp1_i5: 'Pruebas, validación de respuestas, documentación y estabilización de componentes.',
    f_exp1_n: 'Proyecto destacado: Canvitas, asistente de ayuda para Canvas LMS basado en NLP.',
    f_exp2_t: 'Desarrollador Backend Freelance',
    f_exp2_b: 'Colegio de Anestesiología de Tampico',
    f_exp2_p: 'junio 2025 – octubre 2025',
    f_exp2_i1: 'Sistema ERM / plataforma administrativa para una comunidad de ~560 médicos anestesiólogos.',
    f_exp2_i2: 'Levantamiento de requerimientos, modelado de datos y diseño de esquemas.',
    f_exp2_i3: 'Desarrollo de lógica de negocio e implementación de componentes backend.',
    f_exp2_i4: 'Integridad y consistencia de los datos; entrega del desarrollo.',
    f_exp3_t: 'Proyectos independientes',
    f_exp3_b: 'Sistemas administrativos',
    f_exp3_p: 'proyectos propios',
    f_exp3_i1: 'Carroel: sistema administrativo para una escuela de manejo.',
    f_exp3_i2: 'Herramientas para registrar información, administrar entidades y automatizar tareas.',
    f_proj: 'Proyectos',
    f_p1_b: 'NLP · Canvas LMS',
    f_p1_d: 'Asistente de lenguaje natural que traduce solicitudes en lenguaje cotidiano a intenciones de la API de Canvas LMS. Filosofía: “MiniLM reconoce, ToD decide”.',
    f_p1_i1: 'MiniLM multilingüe + componente de diálogo (slot filling, contexto, aclaraciones).',
    f_p1_i2: 'Dataset V2: 12,600 ejemplos · 36 intenciones · 33 etiquetas IOB · 16 entidades.',
    f_p1_i3: 'Integración LTI (JavaScript) y conversión a ONNX para inferencia optimizada.',
    f_p1_n: 'Resultados de evaluación interna del proyecto: 98.39% en clasificación de intención y 99.55% en reconocimiento de entidades (split 70/15/15).',
    f_p2_b: 'Node.js · Recuperación vectorial',
    f_p2_d: 'Asistente experimental que responde preguntas sobre legislación mexicana en ciberseguridad y protección de datos, apoyándose en documentos recuperados.',
    f_p2_i1: 'OpenAI Vector Stores, procesamiento de PDF y OCR para documentos sin texto seleccionable.',
    f_p2_i2: 'Citas y referencias trazables con identificadores de fuente.',
    f_p2_i3: 'Señala la falta de evidencia cuando no se localiza respaldo suficiente.',
    f_p3_b: 'vLLM · FastAPI · ONNX',
    f_p3_d: 'Infraestructura local para servir modelos de lenguaje y consumirlos desde aplicaciones propias.',
    f_p3_i1: 'Ejecución con vLLM y modelos cuantizados (Qwen2.5-32B-Instruct-AWQ).',
    f_p3_i2: 'Servicios con FastAPI y API de inferencia compatible con servicios backend.',
    f_p3_i3: 'Configuración de contexto, memoria de GPU y pruebas de carga.',
    f_p4_b: 'Backend · Bases de datos',
    f_p4_d: 'Sistema para centralizar información y procesos administrativos del Colegio de Anestesiología de Tampico (~560 médicos).',
    f_p4_i1: 'Requerimientos, modelado de datos, lógica de negocio e implementación backend.',
    f_p4_i2: 'Información estructurada para administrarse desde un sistema centralizado.',
    f_p5_b: 'Sistema administrativo',
    f_p5_d: 'Software para apoyar la administración de una escuela de manejo: registrar información, administrar entidades y automatizar tareas antes manuales.',
    f_tech: 'Tecnologías',
    f_t1: 'Uso práctico en proyectos',
    f_t2: 'IA y datos',
    f_t3: 'Backend e integración',
    f_t4: 'Conocimientos complementarios',
    f_powbi: 'Power BI (académico)',
    f_edu: 'Educación e idiomas',
    f_edu_t: 'Lic. en Sistemas Computacionales y Negocios Digitales',
    f_edu_p: 'noveno semestre · graduación prevista: diciembre 2026',
    f_edu_d: 'Formación que combina sistemas computacionales con procesos y negocios digitales.',
    f_langs: '<strong>Idiomas:</strong> Español (nativo) · Inglés (intermedio)',
    f_int: 'Intereses técnicos',
    f_int_1: 'IA aplicada',
    f_int_2: 'Modelos locales y privacidad',
    f_int_3: 'Procesamiento de lenguaje natural',
    f_int_4: 'Agentes y automatización',
    f_int_5: 'Backend e integración',
    f_int_6: 'RAG y sistemas basados en conocimiento',
    f_int_7: 'Linux (Arch · Hyprland)',
    f_footer_1: 'Román del Angel Juárez — Tampico, Tamaulipas, México',
    f_footer_2: '<a href="mailto:fjrdelangeljr@gmail.com">fjrdelangeljr@gmail.com</a> · <a href="https://github.com/PWD-Roman" target="_blank" rel="noopener">GitHub</a> · <a href="https://www.linkedin.com/in/roman-del-angel-juarez-a108312b9/" target="_blank" rel="noopener">LinkedIn</a>'
  }
};

/* ----------------- Keyboard focus niceties ----------------- */
// Keep input focused if click anywhere on terminal
document.getElementById('terminal').addEventListener('click', ()=> cmd.focus());

// On load: restore fs, apply language (formal view + button) and mode, print boot
(function initFromStorage(){
  // restore fs user additions
  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY + '_fs') || 'null');
  if (persisted) fs = mergeFS(DEFAULT_FS, persisted);

  applyLang(LANG);
  applyMode();

  // boot output
  printHTML(buildNeofetch());
  printRaw('\n' + T('boot_hint') + '\n' + T('boot_lang_hint') + '\n');

  // allow pressing 'Enter' quickly to start
  cmd.focus();
})();

// Expose some helpers on window for debugging if needed
window._term = { fs, getPathString, pathStack };
