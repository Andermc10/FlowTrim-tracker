// Utilidades compartidas: construcción de cuerpos de Issues
import { dod, config } from './data.mjs';

export const repoSlug = (key) => `${config.owner}/${config.repos[key]}`;

export const milestoneKeyForTask = (day) => (day <= 5 ? 's1' : 's2');

export function storyLabels(s) {
  const l = [s.kind === 'epic' ? 'epic' : 'user-story', s.priority];
  if (s.milestone === 'post') l.push('post-mvp');
  return l;
}

export function taskLabels(t, s) {
  return ['task', t.repo, s.priority, ...(t.extra ?? [])];
}

export const storyTitle = (s) => `${s.id}: ${s.title}`;
export const taskTitle = (t, s) => `[${s.id}] ${t.title}`;

export function storyBody(s, taskRefs = []) {
  const out = [];
  out.push('## Historia de usuario', '', s.story, '');
  out.push('## Criterios de aceptación', '');
  s.criteria.forEach((c) => out.push(`- [ ] ${c}`));
  out.push('');
  if (s.notes?.length) {
    out.push('## Reglas de negocio y notas', '');
    s.notes.forEach((n) => out.push(`- ${n}`));
    out.push('');
  }
  out.push('## Datos de planificación', '');
  out.push('| Prioridad | Estimación | Dependencias |', '|---|---|---|');
  out.push(`| ${s.priority} | ${s.estimate} | ${s.deps} |`, '');
  out.push('## Tareas técnicas', '');
  if (taskRefs.length) {
    taskRefs.forEach((r) => out.push(`- [ ] ${r.ref} — ${r.title} _(${r.repo}, Día ${r.day})_`));
  } else {
    out.push('_Se desglosan al planificar el sprint._');
  }
  out.push('');
  out.push('## Definition of Done', '');
  dod.forEach((d) => out.push(`- [ ] ${d}`));
  out.push('');
  out.push('> Principio de trabajo: incrementos verticales (modelo → regla → persistencia → endpoint → interfaz → prueba). La historia solo pasa a **Done** cuando cumple todos los criterios, no porque exista una pantalla o un endpoint.');
  return out.join('\n');
}

export function taskBody(t, s, storyNumber) {
  const out = [];
  out.push(`Parte de **${s.id}: ${s.title}** → ${repoSlug('tracker')}#${storyNumber}`, '');
  out.push('## Alcance', '');
  t.items.forEach((i) => out.push(`- [ ] ${i}`));
  out.push('');
  out.push('## Planificación', '');
  out.push(`- Día del plan: **${t.day}** · Estimación: **${t.est} h** · Prioridad: **${s.priority}**`, '');
  out.push('## Listo cuando', '');
  out.push('- [ ] Compila y las pruebas relevantes pasan (`dotnet test` / `npm run build`).');
  out.push('- [ ] Cumple los criterios de aceptación de la historia que le corresponden.');
  out.push('- [ ] Commit descriptivo y PR con `Closes #<este issue>`.');
  return out.join('\n');
}
