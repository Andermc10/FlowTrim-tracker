# FlowTrim · Tracker

Repositorio de seguimiento ágil de **FlowTrim**: historias de usuario con criterios de aceptación, backlog priorizado y automatización para montar el tablero Kanban en GitHub Projects.

| Repo | Contenido |
|---|---|
| `FlowTrim-tracker` (este) | Historias de usuario (HU-xx), épicas, backlog y documentación de proceso |
| `FlowTrim-backend` | Tareas técnicas de API, dominio, EF Core, PostgreSQL y pruebas |
| `FlowTrim-frontend` | Tareas técnicas de Angular |
| Project **FlowTrim** | Tablero Kanban único que muestra los Issues de los tres repos |

## Contenido

- `docs/BACKLOG.md`: backlog completo legible (historias, criterios, tareas).
- `docs/GUIA-KANBAN.md`: cómo trabajar día a día con Issues, ramas, PR y el tablero.
- `scripts/data.mjs`: **fuente única** del backlog (editable).
- `scripts/setup-github.mjs`: crea etiquetas, milestones, Issues y el Project en GitHub.
- `github-templates/`: plantillas de Issue (historia, tarea, bug) y de Pull Request para cada repo.
- `scripts/install-templates.mjs`: copia esas plantillas a la carpeta `.github` de los tres repos locales.

## Puesta en marcha

```bash
# 1) Autenticación (una sola vez)
gh auth login
gh auth refresh -s project        # permiso necesario para GitHub Projects

# 2) Instalar plantillas de Issue/PR en los 3 repos locales (luego commit + push)
node scripts/install-templates.mjs

# 3) Ver qué haría sin crear nada
node scripts/setup-github.mjs --dry-run

# 4) Ejecutar de verdad (idempotente: repetirlo no duplica Issues)
node scripts/setup-github.mjs
```

Requisitos: Node 20+ y GitHub CLI. Después sigue los 4 pasos manuales que el script imprime al final (vista Board, auto-add, columnas extra, iteraciones) y lee `docs/GUIA-KANBAN.md`.

## Principios

Incrementos verticales, alcance pequeño, commits frecuentes y una historia solo está **Done** cuando cumple su Definition of Done. Las cifras de la app son estimaciones basadas en datos declarados por el usuario.
