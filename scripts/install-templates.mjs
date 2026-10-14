#!/usr/bin/env node
// Copia las plantillas de Issues y Pull Requests a la carpeta .github de cada repo local.
// Se asume que los tres repos están como carpetas hermanas (misma carpeta padre):
//   FlowTrim/FlowTrim-tracker  FlowTrim/FlowTrim-backend  FlowTrim/FlowTrim-frontend
// Uso:  node scripts/install-templates.mjs [--force]
// No sobrescribe archivos existentes salvo que uses --force.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from './data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parent = path.dirname(root);
const force = process.argv.includes('--force');

function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = path.join(src, name); const d = path.join(dst, name);
    if (statSync(s).isDirectory()) { copyDir(s, d); continue; }
    if (existsSync(d) && !force) { console.log(`· existe, se omite: ${d}`); continue; }
    cpSync(s, d); console.log(`+ ${d}`);
  }
}

for (const key of ['tracker', 'backend', 'frontend']) {
  const target = key === 'tracker' ? root : path.join(parent, config.repos[key]);
  if (!existsSync(target)) { console.log(`! No encuentro ${target}; se omite ${key}.`); continue; }
  copyDir(path.join(root, 'github-templates', key), path.join(target, '.github'));
}
console.log('\nListo. Haz commit y push de la carpeta .github en cada repo.');
