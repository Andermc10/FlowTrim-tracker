#!/usr/bin/env node
// FlowTrim · Crea etiquetas, milestones, Issues y el GitHub Project (Kanban).
// Requisitos: Node 20+, GitHub CLI (`gh`) autenticado con scope `project`.
//   gh auth login
//   gh auth refresh -s project
// Uso:
//   node scripts/setup-github.mjs --dry-run      (solo muestra qué haría)
//   node scripts/setup-github.mjs                (ejecuta)
// Opciones: --owner X  --skip-project  --private
// Es idempotente: si lo repites no duplica Issues (los detecta por título).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { config, labels, milestones, stories } from './data.mjs';
import {
  repoSlug, milestoneKeyForTask, storyLabels, taskLabels,
  storyTitle, taskTitle, storyBody, taskBody,
} from './lib.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DRY = flag('--dry-run');
const SKIP_PROJECT = flag('--skip-project');
const PRIVATE = flag('--private');
config.owner = opt('--owner', config.owner);

const tmp = mkdtempSync(path.join(tmpdir(), 'flowtrim-'));
process.on('exit', () => { try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

const log = (...a) => console.log(...a);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
let fileSeq = 0;
const bodyFile = (text) => { const f = path.join(tmp, `b${fileSeq++}.md`); writeFileSync(f, text, 'utf8'); return f; };

function gh(args, { mutate = true, json = false, allowFail = false } = {}) {
  if (DRY && mutate) { log(`  [dry-run] gh ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`); return json ? null : ''; }
  try {
    const out = execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    return json ? JSON.parse(out) : out.trim();
  } catch (e) {
    if (allowFail) return null;
    const msg = (e.stderr || e.message || '').toString().trim();
    throw new Error(`gh ${args.slice(0, 3).join(' ')} falló: ${msg}`);
  }
}

// ---------- 1. Verificaciones ----------
log('\n== 1. Verificando GitHub CLI ==');
if (gh(['auth', 'status'], { mutate: false, allowFail: true }) === null) {
  console.error('✗ gh no está autenticado. Ejecuta:  gh auth login');
  process.exit(1);
}
if (!SKIP_PROJECT && gh(['project', 'list', '--owner', config.owner, '--limit', '1', '--format', 'json'], { mutate: false, allowFail: true }) === null) {
  console.error('✗ Falta el permiso "project". Ejecuta:  gh auth refresh -s project   y vuelve a correr el script.');
  process.exit(1);
}
log('✓ gh autenticado');

// ---------- 2. Repositorios ----------
log('\n== 2. Repositorios ==');
for (const key of ['tracker', 'backend', 'frontend']) {
  const slug = repoSlug(key);
  const exists = gh(['repo', 'view', slug, '--json', 'name'], { mutate: false, allowFail: true }) !== null;
  if (exists) { log(`✓ ${slug} existe`); continue; }
  if (key === 'tracker') {
    log(`+ Creando ${slug}`);
    gh(['repo', 'create', slug, PRIVATE ? '--private' : '--public', '--description', 'FlowTrim · Seguimiento ágil: backlog, historias de usuario y documentación de proceso']);
  } else {
    console.error(`✗ ${slug} no existe. Créalo primero o ajusta scripts/data.mjs`);
    process.exit(1);
  }
}
const slugs = { tracker: repoSlug('tracker'), backend: repoSlug('backend'), frontend: repoSlug('frontend') };

// ---------- 3. Etiquetas ----------
log('\n== 3. Etiquetas ==');
for (const slug of Object.values(slugs)) {
  for (const l of labels) {
    gh(['label', 'create', l.name, '--repo', slug, '--color', l.color, '--description', l.description, '--force']);
  }
  log(`✓ ${labels.length} etiquetas en ${slug}`);
}

// ---------- 4. Milestones ----------
log('\n== 4. Milestones ==');
const msTitle = {}; // msTitle[repoKey][key] = título
for (const key of Object.keys(slugs)) {
  const defs = key === 'tracker' ? milestones.tracker : milestones.code;
  msTitle[key] = {};
  const existing = (gh(['api', `repos/${slugs[key]}/milestones?state=all&per_page=100`, '--jq', '.[].title'], { mutate: false, allowFail: true }) || '').split('\n').filter(Boolean);
  for (const m of defs) {
    msTitle[key][m.key] = m.title;
    if (existing.includes(m.title)) continue;
    gh(['api', `repos/${slugs[key]}/milestones`, '-f', `title=${m.title}`, '-f', `description=${m.description}`]);
    log(`+ ${slugs[key]}: ${m.title}`);
  }
}

// ---------- 5. Issues ----------
log('\n== 5. Issues ==');
const existingIssues = {};
for (const key of Object.keys(slugs)) {
  const list = gh(['issue', 'list', '--repo', slugs[key], '--state', 'all', '--limit', '1000', '--json', 'number,title,url'], { mutate: false, json: true, allowFail: true }) || [];
  existingIssues[key] = new Map(list.map((i) => [i.title, i]));
}
let fakeNumber = 1000;
function ensureIssue(repoKey, title, body, lbls, milestoneKey) {
  const found = existingIssues[repoKey].get(title);
  if (found) return { ...found, created: false };
  const args = ['issue', 'create', '--repo', slugs[repoKey], '--title', title, '--body-file', bodyFile(body), '--milestone', msTitle[repoKey][milestoneKey]];
  lbls.forEach((l) => args.push('--label', l));
  const out = gh(args);
  const url = DRY ? `https://github.com/${slugs[repoKey]}/issues/${++fakeNumber}` : out.split('\n').pop().trim();
  const number = Number(url.match(/(\d+)$/)[1]);
  const issue = { number, title, url, created: true };
  existingIssues[repoKey].set(title, issue);
  if (!DRY) sleep(1200); // evita límites secundarios de GitHub
  return issue;
}

const allItems = []; // { url, kind, priority, est, day }
const createdTasks = [];
for (const s of stories) {
  const story = ensureIssue('tracker', storyTitle(s), storyBody(s), storyLabels(s), s.milestone);
  log(`${story.created ? '+' : '·'} ${slugs.tracker}#${story.number} ${storyTitle(s)}`);
  allItems.push({ url: story.url, priority: s.priority, est: s.estimateH, day: '' });

  const refs = [];
  for (const t of s.tasks) {
    const issue = ensureIssue(t.repo, taskTitle(t, s), taskBody(t, s, story.number), taskLabels(t, s), milestoneKeyForTask(t.day));
    log(`    ${issue.created ? '+' : '·'} ${slugs[t.repo]}#${issue.number} ${taskTitle(t, s)}`);
    refs.push({ ref: `${slugs[t.repo]}#${issue.number}`, title: t.title, repo: t.repo, day: t.day });
    allItems.push({ url: issue.url, priority: s.priority, est: t.est, day: `Día ${t.day}` });
    if (issue.created) createdTasks.push({ story, issue, repo: t.repo });
  }
  if (refs.length) {
    // Actualiza la historia con la lista de tareas (GitHub la muestra con progreso)
    gh(['issue', 'edit', String(story.number), '--repo', slugs.tracker, '--body-file', bodyFile(storyBody(s, refs))]);
  }
}

// Sub-issues nativos (si la función está disponible en tu cuenta; si falla, se ignora)
if (!DRY && createdTasks.length) {
  log('\n== 5b. Enlazando sub-issues ==');
  let ok = 0;
  for (const { story, issue, repo } of createdTasks) {
    const id = gh(['api', `repos/${slugs[repo]}/issues/${issue.number}`, '--jq', '.id'], { mutate: false, allowFail: true });
    if (!id) continue;
    const r = gh(['api', '-X', 'POST', `repos/${slugs.tracker}/issues/${story.number}/sub_issues`, '-F', `sub_issue_id=${id}`], { allowFail: true });
    if (r !== null) ok++;
  }
  log(`✓ ${ok}/${createdTasks.length} sub-issues enlazados (el resto queda enlazado por texto en la descripción)`);
}

// ---------- 6. Project ----------
if (SKIP_PROJECT) { log('\n(omitido: --skip-project)'); finish(null); }
log('\n== 6. GitHub Project (Kanban) ==');
let project = (gh(['project', 'list', '--owner', config.owner, '--limit', '100', '--format', 'json'], { mutate: false, json: true, allowFail: true })?.projects || [])
  .find((p) => p.title === config.projectTitle);
if (!project) {
  log(`+ Creando proyecto "${config.projectTitle}"`);
  project = gh(['project', 'create', '--owner', config.owner, '--title', config.projectTitle, '--format', 'json'], { json: true }) || { number: 0, id: 'DRY', url: '(dry-run)' };
} else log(`✓ Proyecto existente #${project.number}`);
const P = String(project.number);

gh(['project', 'edit', P, '--owner', config.owner,
  '--description', 'Kanban de FlowTrim: historias de usuario (tracker) y tareas técnicas (backend/frontend).',
  '--readme', [
    '# FlowTrim · Tablero',
    '',
    '**Flujo:** Todo → In Progress → Done. Máximo 1–2 tarjetas en In Progress.',
    '',
    'Una historia pasa a Done solo si cumple sus criterios de aceptación y la Definition of Done.',
    'Los PR cierran su Issue con `Closes #n` (o `Closes Owner/Repo#n` entre repos).',
  ].join('\n')], { allowFail: true });

for (const key of Object.keys(slugs)) {
  gh(['project', 'link', P, '--owner', config.owner, '--repo', slugs[key]], { allowFail: true });
}
log('✓ Repositorios vinculados al proyecto');

const listFields = () => gh(['project', 'field-list', P, '--owner', config.owner, '--format', 'json'], { mutate: false, json: true })?.fields || [];
let fields = DRY ? [] : listFields();
const ensureField = (name, type, options) => {
  if (fields.find((f) => f.name === name)) return;
  const a = ['project', 'field-create', P, '--owner', config.owner, '--name', name, '--data-type', type];
  if (options) a.push('--single-select-options', options);
  gh(a);
  log(`+ Campo "${name}"`);
};
ensureField('Priority', 'SINGLE_SELECT', 'P0,P1,P2,P3');
ensureField('Estimate (h)', 'NUMBER');
ensureField('Plan day', 'TEXT');
if (!DRY) fields = listFields();

const F = (n) => fields.find((f) => f.name === n);
const opt1 = (f, n) => f?.options?.find((o) => o.name.toLowerCase() === n.toLowerCase())?.id;
const status = F('Status'); const prio = F('Priority'); const est = F('Estimate (h)'); const day = F('Plan day');

log(`\nAñadiendo ${allItems.length} tarjetas al tablero y rellenando campos (puede tardar unos minutos)...`);
let n = 0;
for (const it of allItems) {
  const added = gh(['project', 'item-add', P, '--owner', config.owner, '--url', it.url, '--format', 'json'], { json: true, allowFail: true });
  const itemId = added?.id;
  n++;
  if (DRY || !itemId) continue;
  const edit = (field, ...extra) => field && gh(['project', 'item-edit', '--id', itemId, '--project-id', project.id, '--field-id', field.id, ...extra], { allowFail: true });
  if (status && opt1(status, 'Todo')) edit(status, '--single-select-option-id', opt1(status, 'Todo'));
  if (prio && opt1(prio, it.priority)) edit(prio, '--single-select-option-id', opt1(prio, it.priority));
  if (est) edit(est, '--number', String(it.est));
  if (day && it.day) edit(day, '--text', it.day);
  if (n % 10 === 0) log(`  ${n}/${allItems.length}`);
}
finish(project);

function finish(p) {
  log('\n================ LISTO ================');
  log(`Tracker : https://github.com/${slugs.tracker}/issues`);
  if (p) log(`Proyecto: ${p.url}`);
  log('\nPasos MANUALES que GitHub no permite por CLI (2 minutos):');
  log('  1. En el Project: "+ New view" → Layout: Board → agrupa por Status (esa es tu vista Kanban).');
  log('  2. Settings → Workflows → "Auto-add to project": activa uno por repo (tracker, backend, frontend).');
  log('  3. (Opcional) Settings → Status: añade columnas "Backlog", "In Review" y "Blocked".');
  log('  4. (Opcional) Settings → "New field" → Iteration: crea 2 iteraciones de 1 semana (Sprint 1 y 2).');
  if (DRY) log('\n(Esto fue un dry-run: no se creó nada.)');
  process.exit(0);
}
