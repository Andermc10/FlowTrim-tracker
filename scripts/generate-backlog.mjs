#!/usr/bin/env node
// Regenera docs/BACKLOG.md a partir de scripts/data.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stories } from './data.mjs';
import { storyTitle } from './lib.mjs';

const out = ['# Backlog de FlowTrim', '', '> Generado desde `scripts/data.mjs`. No editar a mano: edita el archivo de datos y ejecuta `node scripts/generate-backlog.mjs`.', ''];
out.push('## Resumen', '', '| ID | Historia | Prioridad | Estimación | Dependencias | Tareas |', '|---|---|---|---|---|---|');
for (const s of stories) out.push(`| ${s.id} | ${s.title} | ${s.priority} | ${s.estimate} | ${s.deps} | ${s.tasks.length} |`);
out.push('');
for (const s of stories) {
  out.push(`## ${storyTitle(s)}`, '', `**Prioridad:** ${s.priority} · **Estimación:** ${s.estimate} · **Dependencias:** ${s.deps}${s.milestone === 'post' ? ' · _Post-MVP_' : ''}`, '', `> ${s.story}`, '', '**Criterios de aceptación**', '');
  s.criteria.forEach((c) => out.push(`- [ ] ${c}`));
  if (s.notes?.length) { out.push('', '**Reglas y notas**', ''); s.notes.forEach((n) => out.push(`- ${n}`)); }
  if (s.tasks.length) {
    out.push('', '**Tareas técnicas**', '', '| Día | Repo | Tarea | Est. |', '|---|---|---|---|');
    [...s.tasks].sort((a, b) => a.day - b.day).forEach((t) => out.push(`| ${t.day} | ${t.repo} | ${t.title} | ${t.est} h |`));
  }
  out.push('');
}
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'BACKLOG.md');
writeFileSync(file, out.join('\n'), 'utf8');
console.log('✓ docs/BACKLOG.md generado');
