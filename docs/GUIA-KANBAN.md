# Guía de trabajo: Issues + GitHub Projects (Kanban)

## 1. Cómo encajan las piezas

- **Issue** = una tarjeta de trabajo (una historia o una tarea).
- **Repositorio** = donde viven el código y sus Issues.
- **Project** = el tablero Kanban. No guarda nada propio: muestra Issues de varios repos y les añade campos (estado, prioridad, estimación).

Estructura de FlowTrim:

```
FlowTrim-tracker   ← HU-01…HU-15 + EP-00 (qué valor se entrega y cuándo está "hecho")
   └─ sub-issues / checklist de tareas
FlowTrim-backend   ← tareas técnicas de API/dominio/BD/pruebas
FlowTrim-frontend  ← tareas técnicas de Angular
Project "FlowTrim" ← un tablero con todo
```

Una historia (HU) vive en el tracker porque casi siempre toca backend y frontend a la vez. Cada tarea técnica referencia a su historia (`Parte de HU-01 → tracker#N`) y la historia lista sus tareas con barra de progreso.

## 2. Configuración inicial (una vez)

1. Ejecuta `node scripts/setup-github.mjs` (ver README). Crea etiquetas, milestones, 55 Issues (16 historias/épicas + 39 tareas) y el Project con campos **Priority**, **Estimate (h)** y **Plan day**.
2. En el Project: **+ New view → Board**, agrupado por **Status**. Esa es tu vista Kanban. Mantén también una vista Table para planificar.
3. **Settings → Workflows → Auto-add to project**: actívalo para cada uno de los tres repos para que todo Issue nuevo entre al tablero solo.
4. **Settings → Status**: columnas sugeridas `Backlog · Todo · In Progress · In Review · Done` (y `Blocked` si lo necesitas).
5. Ejecuta `node scripts/install-templates.mjs`: copia las plantillas de historia, tarea, bug y PR a la carpeta `.github` de los tres repos. Luego haz commit y push en cada uno.
6. (Opcional) Crea un campo **Iteration** con 2 iteraciones de una semana: Sprint 1 (Días 1–5) y Sprint 2 (Días 6–10).

## 3. Flujo diario

1. **Inicio del día (5–10 min):** elige un resultado verificable; mueve **una** tarjeta a *In Progress*.
2. Crea una rama desde el Issue: `feature/hu-01-registrar-suscripcion` (o desde el botón *Create a branch* del Issue).
3. Commits con prefijo de historia: `feat(HU-01): valida importe mayor que cero`, `test(HU-03): cubre ciclo anual`, `fix(HU-04): ...`.
4. Abre un **Pull Request** con `Closes #<issue>` (entre repos: `Closes Andermc10/FlowTrim-tracker#N`). Al fusionarlo, el Issue se cierra y la tarjeta pasa sola a **Done**.
5. **Fin del día (10 min):** `dotnet build && dotnet test` y `npm run build`; registra bloqueos; actualiza el tablero.

Reglas del tablero:

- **Límite de trabajo en curso:** máximo 1–2 tarjetas en *In Progress*.
- No empieces algo nuevo si lo anterior impide compilar o ejecutar el flujo principal.
- Una **historia** pasa a *Done* solo cuando todos sus criterios de aceptación y la Definition of Done están marcados.
- *Blocked*: etiqueta `blocked` + comentario con la causa y la siguiente acción.
- Cada dos días revisa si el alcance sigue siendo viable; si no, protege los **P0** y mueve P1/P2 al siguiente sprint.

## 4. Metodología aplicada

| Elemento | Cómo se usa en FlowTrim |
|---|---|
| Backlog | `docs/BACKLOG.md` y Issues con etiqueta `user-story` ordenados por prioridad |
| Prioridad | P0 imprescindible · P1 valor importante · P2/P3 posteriores (etiqueta + campo del Project) |
| Sprints | 2 sprints de una semana (milestones en backend/frontend, campo Iteration opcional) |
| Estimación | Horas orientativas en el campo **Estimate (h)** |
| Definition of Done | Checklist dentro de cada historia (viene del plan de 2 semanas) |
| Ceremonias ligeras | Inicio de día, cierre de día y revisión cada 2 días |
| Release | Milestone **MVP v1.0** + etiqueta Git `v1.0.0` |

## 5. Cómo agregar una historia nueva

- Rápido: *New issue → Historia de usuario* en el tracker y completa la plantilla.
- Reproducible: añádela en `scripts/data.mjs` y vuelve a ejecutar `node scripts/setup-github.mjs`; solo crea lo que falta.

## 6. Notas sobre los documentos originales

El documento de especificación inicial hablaba de .NET 8, microservicio Python y 4 días. El documento contextualizador v1.0 y el plan de 2 semanas lo reemplazan: **.NET 10 LTS, monolito modular por capas, sin Python en el MVP, 10 días laborables**. El backlog de este repo sigue las decisiones más recientes.
