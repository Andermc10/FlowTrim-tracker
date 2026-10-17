// =====================================================================
// FlowTrim · Fuente única de verdad del backlog
// Edita ESTE archivo para cambiar historias, criterios o tareas y luego
// ejecuta:  node scripts/setup-github.mjs   (crea/actualiza en GitHub)
//           node scripts/generate-backlog.mjs   (regenera docs/BACKLOG.md)
// Basado en: Documento contextualizador v1.0 + Plan de 2 semanas / Backlog HU
// =====================================================================

export const config = {
  owner: 'Andermc10',
  repos: {
    tracker: 'FlowTrim-tracker',
    backend: 'FlowTrim-backend',
    frontend: 'FlowTrim-frontend',
  },
  projectTitle: 'FlowTrim',
};

export const labels = [
  { name: 'user-story', color: '0E8A16', description: 'Historia de usuario (valor para el usuario)' },
  { name: 'epic', color: '3E4B9E', description: 'Agrupador de trabajo técnico' },
  { name: 'task', color: '1D76DB', description: 'Tarea técnica derivada de una historia' },
  { name: 'bug', color: 'D73A4A', description: 'Defecto' },
  { name: 'P0', color: 'B60205', description: 'Imprescindible para el MVP' },
  { name: 'P1', color: 'D93F0B', description: 'Valor importante si el calendario lo permite' },
  { name: 'P2', color: 'FBCA04', description: 'Posterior al MVP' },
  { name: 'P3', color: 'C5DEF5', description: 'Futuro / solo si hay necesidad validada' },
  { name: 'backend', color: '5319E7', description: 'ASP.NET Core / EF Core / PostgreSQL' },
  { name: 'frontend', color: '0052CC', description: 'Angular / TypeScript / SCSS' },
  { name: 'tracker', color: '7057FF', description: 'Backlog, specifications and project documentation' },
  { name: 'infra', color: '006B75', description: 'Entorno, Docker, configuración' },
  { name: 'testing', color: 'BFD4F2', description: 'Pruebas automatizadas o manuales' },
  { name: 'docs', color: '0075CA', description: 'Documentación' },
  { name: 'design', color: 'A2EEEF', description: 'Visual identity and user experience' },
  { name: 'post-mvp', color: 'CFD3D7', description: 'Fuera del MVP inicial' },
  { name: 'optional', color: 'EDEDED', description: 'Solo si el tiempo lo permite' },
  { name: 'blocked', color: '000000', description: 'Bloqueado: indicar causa y siguiente acción' },
];

export const milestones = {
  tracker: [
    { key: 'mvp', title: 'MVP v1.0', description: 'Historias P0/P1 del MVP: registrar, consultar, resumen, próximos cobros, uso, simulador, pruebas y documentación.' },
    { key: 'post', title: 'Post-MVP', description: 'Backlog posterior al MVP.' },
    { key: 'visual', title: 'Visual Experience Redesign', description: 'Landing, application shell, theme modes, responsive navigation and visual redesign of the MVP screens.' },
    { key: 'enhancements', title: 'Localization and Motion', description: 'Bilingual interface, explicit return-to-landing navigation and accessible landing motion.' },
    { key: 'quality', title: 'Interaction and Responsive Quality', description: 'Fixed workspace shell, modal CRUD, icon actions, responsive verification and landing content refinement.' },
    { key: 'flowtrim2', title: 'FlowTrim 2.0', description: 'Secure multi-user access, explainable AI insights, CI/CD, public delivery, subscription catalog import and portfolio evidence.' },
  ],
  code: [
    { key: 's1', title: 'Sprint 1 - Base, CRUD y motor financiero (Días 1-5)', description: 'Fases 0, 1 y 2: repositorio, dominio, persistencia, CRUD, reglas financieras, resumen y próximos cobros.' },
    { key: 's2', title: 'Sprint 2 - Uso, frontend y cierre (Días 6-10)', description: 'Fases 3 a 6: uso y costo por uso, Angular integrado, dashboard, simulador, calidad y publicación.' },
    { key: 'post', title: 'Post-MVP', description: 'Backlog posterior al MVP.' },
    { key: 'visual', title: 'Visual Experience Redesign', description: 'Landing, application shell, theme modes, responsive navigation and visual redesign of the MVP screens.' },
    { key: 'enhancements', title: 'Localization and Motion', description: 'Bilingual interface, explicit return-to-landing navigation and accessible landing motion.' },
    { key: 'quality', title: 'Interaction and Responsive Quality', description: 'Fixed workspace shell, modal CRUD, icon actions, responsive verification and landing content refinement.' },
    { key: 'flowtrim2', title: 'FlowTrim 2.0', description: 'Secure multi-user access, explainable AI insights, CI/CD, public delivery, subscription catalog import and portfolio evidence.' },
  ],
};

export const dod = [
  'Cumple todos los criterios de aceptación de la historia.',
  'El código compila y no introduce errores conocidos.',
  'La lógica importante tiene pruebas automatizadas (`dotnet test`) o una justificación documentada si se aplaza.',
  'Las entradas se validan en el backend y los errores se presentan de forma coherente.',
  'Se integra con la base de datos real cuando requiere persistencia.',
  'La interfaz contempla carga, vacío, éxito y error cuando corresponde.',
  'Cambio versionado con commit descriptivo (`feat(HU-xx): ...`).',
  'README y backlog reflejan el estado real; no se declara implementada una función pendiente.',
];

// ---------------------------------------------------------------------
// Historias y épicas (viven en el repo tracker). Cada una lista sus tareas
// técnicas, que se crean como Issues en backend / frontend.
// day = día del plan (1..10); est = horas orientativas.
// ---------------------------------------------------------------------
export const stories = [
  {
    id: 'EP-00',
    kind: 'epic',
    title: 'Preparación del repositorio, entorno y arquitectura',
    priority: 'P0',
    estimate: 'Día 1 · 5 h',
    estimateH: 5,
    deps: 'Ninguna',
    milestone: 'mvp',
    story: 'Dejar el entorno listo para programar: solución .NET por capas, PostgreSQL local reproducible, health check y SPA Angular compilando (Fase 0 del plan).',
    criteria: [
      'La solución .NET 10 compila con `dotnet build` y respeta la regla de dependencias entre capas.',
      'PostgreSQL arranca con `docker compose up` y es accesible desde la API usando secretos locales (nada sensible en Git).',
      '`GET /api/health` responde 200 si API y BD están operativas y indica indisponibilidad sin exponer detalles internos si la BD cae.',
      'La app Angular compila con `npm run build`.',
      'Estructura versionada y README inicial actualizado.',
    ],
    notes: [
      'Arquitectura: monolito modular por capas (un único backend desplegable, sin microservicios).',
      'Regla de dependencias: Api → Application + Infrastructure; Application → Domain; Infrastructure → Domain/Application; Domain no depende de nada.',
    ],
    tasks: [
      {
        repo: 'backend', day: 1, est: 1.5, extra: ['infra'],
        title: 'Crear solución .NET 10 con proyectos por capas',
        items: [
          'Crear solución y proyectos `FlowTrim.Api`, `FlowTrim.Application`, `FlowTrim.Domain`, `FlowTrim.Infrastructure`, `FlowTrim.Tests` (xUnit).',
          'Configurar referencias respetando la regla de dependencias.',
          'Verificar `dotnet build` y `dotnet test` (aunque no haya pruebas aún).',
          'Añadir `.gitignore` de .NET y hacer commit.',
        ],
      },
      {
        repo: 'backend', day: 1, est: 1.5, extra: ['infra'],
        title: 'PostgreSQL con Docker Compose y secretos locales',
        items: [
          'Crear `docker-compose.yml` con PostgreSQL y volumen persistente.',
          'Configurar la cadena de conexión con User Secrets / variables de entorno (no subir valores reales).',
          'Añadir `.env.example` sin secretos y verificar `.gitignore`.',
          'Documentar en el README cómo levantar la base de datos.',
        ],
      },
      {
        repo: 'backend', day: 1, est: 1, extra: ['infra'],
        title: 'Endpoint GET /api/health (API + base de datos)',
        items: [
          'Implementar el endpoint que compruebe API y conexión a PostgreSQL.',
          'Devolver 200 cuando todo está bien y un estado de indisponibilidad (p. ej. 503) sin detalles internos cuando la BD no responde.',
          'Probar apagando el contenedor de PostgreSQL.',
        ],
      },
      {
        repo: 'frontend', day: 1, est: 1, extra: ['infra'],
        title: 'Inicializar aplicación Angular (TypeScript + SCSS)',
        items: [
          'Crear el proyecto Angular con SCSS como preprocesador de estilos.',
          'Verificar `npm run build` y `npm start`.',
          'Actualizar el README inicial y hacer commit.',
        ],
      },
    ],
  },

  {
    id: 'HU-01',
    kind: 'story',
    title: 'Registrar suscripción',
    priority: 'P0',
    estimate: '5–7 h',
    estimateH: 6,
    deps: 'Dominio y persistencia (EP-00)',
    milestone: 'mvp',
    story: 'Como usuario, quiero registrar una suscripción con nombre, importe, moneda, ciclo y próxima fecha de cobro para centralizar mis gastos recurrentes.',
    criteria: [
      'Dado un formulario válido, cuando lo envío, entonces la API crea el registro y devuelve su identificador.',
      'El nombre no puede estar vacío y el importe debe ser mayor que cero.',
      'El ciclo de cobro debe pertenecer a los valores admitidos.',
      'La suscripción creada aparece en el listado y persiste tras reiniciar la API.',
      'Si los datos no son válidos, la API devuelve 400 con errores comprensibles y no persiste el registro.',
    ],
    notes: [
      'Ciclos del MVP: mensual y anual (ampliar solo si no compromete el alcance).',
      'Moneda por defecto: COP. Estados: activa / inactiva.',
      'No exponer entidades de EF directamente: usar DTO de creación/actualización y de respuesta.',
    ],
    tasks: [
      {
        repo: 'backend', day: 2, est: 2,
        title: 'Dominio: entidad Subscription, enums y reglas',
        items: [
          'Entidad `Subscription`: Id, Name, Category, Amount, Currency, BillingCycle, NextBillingDate, Status, CreatedAt, UpdatedAt.',
          'Tipos controlados `BillingCycle` (Monthly, Yearly) y `SubscriptionStatus` (Active, Inactive).',
          'Reglas: nombre requerido, importe > 0, moneda válida, fecha válida.',
          'Pruebas unitarias de las reglas del dominio.',
        ],
      },
      {
        repo: 'backend', day: 2, est: 2, extra: ['infra'],
        title: 'Persistencia: DbContext, mapeo EF Core y migración inicial',
        items: [
          'Agregar paquetes EF Core / Npgsql compatibles con .NET 10 y herramientas de migración.',
          'Crear `ApplicationDbContext` y configuración de mapeo de `Subscription`.',
          'Crear la migración inicial y ejecutar `dotnet ef database update`.',
          'Verificar la tabla creada en PostgreSQL.',
        ],
      },
      {
        repo: 'backend', day: 3, est: 2,
        title: 'API: DTOs y POST /api/subscriptions',
        items: [
          'DTO de creación y de respuesta (sin exponer entidades de EF).',
          'Caso de uso en Application para crear la suscripción.',
          'Responder 201 con el identificador (y cabecera Location) al crear.',
          'Responder 400 con errores comprensibles ante datos inválidos, sin persistir.',
          'Probar con Swagger UI / archivo `.http`.',
        ],
      },
      {
        repo: 'frontend', day: 7, est: 2,
        title: 'UI: formulario de alta de suscripción',
        items: [
          'Formulario reactivo con nombre, categoría, importe, moneda, ciclo y próxima fecha de cobro.',
          'Validación en cliente coherente con las reglas del backend (el backend sigue siendo la fuente de verdad).',
          'Estados de envío, éxito y error; mostrar errores 400 del API.',
          'La nueva suscripción aparece en el listado tras guardar.',
        ],
      },
    ],
  },

  {
    id: 'HU-02',
    kind: 'story',
    title: 'Consultar y mantener suscripciones',
    priority: 'P0',
    estimate: '5–7 h',
    estimateH: 6,
    deps: 'HU-01',
    milestone: 'mvp',
    story: 'Como usuario, quiero consultar, editar y eliminar mis suscripciones para mantener los datos actualizados.',
    criteria: [
      'El listado devuelve las suscripciones existentes con paginación o un límite razonable definido.',
      'Consultar un identificador existente devuelve 200; uno inexistente devuelve 404.',
      'Editar datos válidos actualiza el registro persistido.',
      'Eliminar un registro existente devuelve 204 y deja de aparecer en consultas posteriores.',
      'La interfaz confirma la eliminación y muestra errores si la operación falla.',
    ],
    notes: ['Códigos HTTP: 200 consulta/edición, 204 eliminación, 404 inexistente, 400 datos inválidos.'],
    tasks: [
      {
        repo: 'backend', day: 3, est: 3,
        title: 'API: listado (con límite/paginación), detalle, edición y eliminación',
        items: [
          'GET /api/subscriptions con paginación o límite máximo definido.',
          'GET /api/subscriptions/{id}: 200 si existe, 404 si no.',
          'PUT /api/subscriptions/{id}: 200 con datos válidos, 400 si inválidos, 404 si no existe.',
          'DELETE /api/subscriptions/{id}: 204 si existe, 404 si no.',
          'Verificar que los datos sobreviven al reinicio de la API.',
          'Documentar los endpoints (Swagger).',
        ],
      },
      {
        repo: 'frontend', day: 7, est: 3,
        title: 'UI: listado con búsqueda simple, edición y eliminación con confirmación',
        items: [
          'Tabla/lista de suscripciones con búsqueda simple.',
          'Edición reutilizando el formulario de alta.',
          'Diálogo de confirmación antes de eliminar.',
          'Estados de carga, lista vacía y error.',
        ],
      },
    ],
  },

  {
    id: 'HU-03',
    kind: 'story',
    title: 'Ver resumen financiero',
    priority: 'P0',
    estimate: '3–4 h',
    estimateH: 3.5,
    deps: 'HU-01, HU-02',
    milestone: 'mvp',
    story: 'Como usuario, quiero ver mi gasto mensual equivalente y una proyección anual para entender el costo de mis suscripciones.',
    criteria: [
      'Los importes mensuales se consideran equivalentes al importe mensual.',
      'Los importes anuales se normalizan dividiendo el importe por 12.',
      'La proyección anual corresponde a la suma de costos mensuales equivalentes multiplicada por 12.',
      'Los servicios inactivos no se incluyen en el gasto activo, según la regla documentada.',
      'El sistema no suma importes de monedas diferentes sin una conversión explícita.',
      'Con cero suscripciones, los totales devueltos son cero y la interfaz muestra un estado vacío.',
    ],
    notes: [
      'Fórmulas: mensual = importe; anual = importe / 12; proyección anual = Σ mensual equivalente × 12.',
      'Supone precios constantes y servicios vigentes. Sin conversión de divisas en el MVP.',
    ],
    tasks: [
      {
        repo: 'backend', day: 4, est: 2,
        title: 'Servicio financiero: costo mensual equivalente y proyección anual',
        items: [
          'Implementar la normalización por ciclo (mensual = importe, anual = importe / 12).',
          'Implementar la proyección anual y definir la política de redondeo.',
          'Excluir inactivas y no mezclar monedas (agrupar totales por moneda).',
          'Documentar las reglas/supuestos en el código y el README.',
        ],
      },
      {
        repo: 'backend', day: 5, est: 2,
        title: 'API: GET /api/summary (total mensual, proyección anual, activas)',
        items: [
          'Devolver total mensual equivalente, proyección anual y cantidad de suscripciones activas por moneda.',
          'Con cero suscripciones, devolver totales en cero.',
          'Probar listas vacías, varias monedas y estados inactivos.',
        ],
      },
      {
        repo: 'frontend', day: 8, est: 2,
        title: 'Dashboard: tarjetas de resumen financiero',
        items: [
          'Tarjetas de gasto mensual equivalente, proyección anual y activas, conectadas al API real.',
          'Formato monetario correcto (COP) y estado vacío coherente.',
          'Diseño adaptable y accesibilidad básica.',
        ],
      },
    ],
  },

  {
    id: 'HU-04',
    kind: 'story',
    title: 'Consultar próximos cobros y cuenta regresiva',
    priority: 'P0',
    estimate: '3–4 h',
    estimateH: 3.5,
    deps: 'HU-01',
    milestone: 'mvp',
    story: 'Como usuario, quiero ver los próximos cobros y los días restantes para anticiparme a las renovaciones.',
    criteria: [
      'Los próximos cobros se ordenan por fecha ascendente.',
      'La cuenta regresiva usa una fecha de referencia definida y no depende de cálculos inconsistentes del navegador.',
      'La interfaz diferencia cobros pasados, de hoy y próximos.',
      'Una fecha pasada no se presenta como un cobro futuro.',
      'Las alertas del MVP son visuales dentro de la aplicación; no se afirma que se haya enviado un correo o push.',
    ],
    notes: [
      'Ventanas de alerta: vencido, hoy, próximos 3 días, próximos 7 días.',
      'Definir zona horaria y fecha de referencia (cálculo en el servidor).',
      'Una renovación prevista no equivale a una transacción confirmada.',
    ],
    tasks: [
      {
        repo: 'backend', day: 4, est: 1.5,
        title: 'Cálculo de días hasta el próximo cobro',
        items: [
          'Definir fecha de referencia y zona horaria.',
          'Calcular días restantes; tratar fechas pasadas e inactivas.',
          'Pruebas de límites de fecha (hoy, ayer, mañana, cambio de mes/año).',
        ],
      },
      {
        repo: 'backend', day: 5, est: 2,
        title: 'API: próximos cobros ordenados y ventanas de alerta',
        items: [
          'Endpoint de próximos cobros ordenados por fecha ascendente.',
          'Clasificar cada cobro: vencido, hoy, ≤3 días, ≤7 días, posterior.',
          'Probar lista vacía y servicios inactivos.',
        ],
      },
      {
        repo: 'frontend', day: 8, est: 2,
        title: 'Panel de próximos cobros con cuenta regresiva y alertas visuales',
        items: [
          'Mostrar fecha y días restantes por cobro, con estilos distintos por estado de alerta.',
          'Diferenciar pasados, hoy y próximos; no presentar fechas pasadas como futuras.',
          'Estado vacío y de error; sin afirmar notificaciones externas.',
        ],
      },
    ],
  },

  {
    id: 'HU-05',
    kind: 'story',
    title: 'Registrar uso de una suscripción',
    priority: 'P1',
    estimate: '3–4 h',
    estimateH: 3.5,
    deps: 'HU-01',
    milestone: 'mvp',
    story: 'Como usuario, quiero registrar la frecuencia con la que uso una suscripción para conservar un historial de aprovechamiento.',
    criteria: [
      'Solo se pueden crear registros asociados a una suscripción existente.',
      'La fecha es válida y la cantidad de usos no puede ser negativa.',
      'Los registros quedan persistidos y se pueden consultar por suscripción y periodo.',
      'La interfaz muestra un mensaje de éxito o error según el resultado de la API.',
    ],
    notes: ['`UsageRecord`: Id, SubscriptionId, UsageDate, UsageCount, Notes (opcional). El uso es declarado por el usuario, no verificado.'],
    tasks: [
      {
        repo: 'backend', day: 6, est: 1.5,
        title: 'Dominio y persistencia: UsageRecord y migración',
        items: [
          'Entidad `UsageRecord` relacionada con `Subscription`.',
          'Reglas: UsageCount ≥ 0 y fecha válida.',
          'Mapeo EF Core y migración; verificar la tabla.',
        ],
      },
      {
        repo: 'backend', day: 6, est: 2,
        title: 'API: registrar y consultar usos por suscripción y periodo',
        items: [
          'POST de uso: 201 si válido; 404 si la suscripción no existe; 400 si negativo o fecha inválida.',
          'GET de usos filtrando por suscripción y periodo.',
          'Pruebas con varios registros y periodos.',
        ],
      },
      {
        repo: 'frontend', day: 9, est: 1.5,
        title: 'UI: registrar uso con mensajes de éxito/error',
        items: [
          'Formulario de registro de uso por suscripción (fecha, cantidad, nota).',
          'Mensajes de éxito/error según la respuesta de la API.',
        ],
      },
    ],
  },

  {
    id: 'HU-06',
    kind: 'story',
    title: 'Calcular costo por uso',
    priority: 'P1',
    estimate: '2–3 h',
    estimateH: 2.5,
    deps: 'HU-05',
    milestone: 'mvp',
    story: 'Como usuario, quiero conocer el costo por uso declarado durante un periodo para detectar servicios poco aprovechados.',
    criteria: [
      'El cálculo utiliza el costo correspondiente al mismo periodo que los usos registrados.',
      'Si hay usos válidos, el costo por uso se calcula como total del periodo dividido entre usos.',
      'Si no hay registros o el total de usos es cero, se devuelve un estado no calculable, sin dividir por cero.',
      'La interfaz indica que la frecuencia de uso es declarada por el usuario y no verificada automáticamente.',
    ],
    notes: ['Sin datos suficientes → mostrar «sin datos suficientes»; nunca infinito ni error de división.'],
    tasks: [
      {
        repo: 'backend', day: 6, est: 2,
        title: 'Servicio de costo por uso y endpoint con estado no calculable',
        items: [
          'Calcular costo del periodo ÷ usos del mismo periodo.',
          'Devolver estado «no calculable» si no hay registros o el total de usos es 0 (sin división por cero).',
          'Exponer el endpoint de consulta por suscripción y periodo.',
        ],
      },
      {
        repo: 'frontend', day: 9, est: 1.5,
        title: 'UI: mostrar costo por uso y aviso de uso declarado',
        items: [
          'Mostrar el costo por uso o «sin datos suficientes».',
          'Indicar que la frecuencia es declarada por el usuario, no verificada.',
        ],
      },
    ],
  },

  {
    id: 'HU-07',
    kind: 'story',
    title: 'Simular cancelación y ahorro potencial',
    priority: 'P0',
    estimate: '4–6 h',
    estimateH: 5,
    deps: 'HU-01, HU-03',
    milestone: 'mvp',
    story: 'Como usuario, quiero seleccionar suscripciones y simular su cancelación para comparar el gasto actual con el ahorro potencial.',
    criteria: [
      'La selección de servicios recalcula el escenario sin persistir cancelaciones reales.',
      'El ahorro se calcula con el costo mensual equivalente de los elementos seleccionados por el horizonte elegido.',
      'El usuario puede comparar el escenario base y el escenario simulado.',
      'Los supuestos de precios constantes y ausencia de penalizaciones se muestran junto al resultado.',
      'La simulación admite una selección vacía y devuelve ahorro cero.',
    ],
    notes: [
      'Ahorro = Σ costo mensual equivalente seleccionado × meses. Horizontes iniciales: 1, 12 y 24 meses (o seleccionable).',
      'No es ahorro garantizado: puede haber impuestos, cambios de precio o penalizaciones.',
    ],
    tasks: [
      {
        repo: 'backend', day: 9, est: 2,
        title: 'Servicio y endpoint de simulación de ahorro (sin persistir)',
        items: [
          'Recibir ids seleccionados y horizonte(s) de 1, 12 y 24 meses.',
          'Devolver gasto base, gasto del escenario y ahorro por horizonte.',
          'Selección vacía → ahorro cero; no modifica el estado persistido.',
          'Reutilizar el servicio financiero existente (no duplicar fórmulas).',
        ],
      },
      {
        repo: 'frontend', day: 9, est: 3,
        title: 'Simulador: selección, comparación base vs escenario y supuestos visibles',
        items: [
          'Selección de suscripciones y horizonte; recálculo inmediato del escenario.',
          'Comparar gasto actual vs. escenario simulado (gráfico solo si ayuda a interpretar).',
          'Mostrar supuestos: precios constantes, sin penalizaciones; aclarar que no cancela servicios ni garantiza ahorro.',
          'Selección vacía → ahorro 0.',
        ],
      },
    ],
  },

  {
    id: 'HU-08',
    kind: 'story',
    title: 'Integrar Angular con la API',
    priority: 'P0',
    estimate: '5–7 h',
    estimateH: 6,
    deps: 'HU-01, HU-02',
    milestone: 'mvp',
    story: 'Como usuario, quiero gestionar mis datos desde la interfaz web para no tener que llamar manualmente a los endpoints.',
    criteria: [
      'El frontend consulta y modifica los datos a través de la API.',
      'No se usan datos hardcodeados como fuente final de las operaciones principales.',
      'Se muestran estados de carga, vacío, éxito y error.',
      'La configuración de URL de API se puede cambiar por entorno.',
      'CORS permite el origen de desarrollo requerido sin abrir indiscriminadamente todos los orígenes en producción.',
    ],
    notes: ['Integración real desde el Día 7 para detectar problemas pronto.'],
    tasks: [
      {
        repo: 'frontend', day: 7, est: 2,
        title: 'Base Angular: layout, navegación, estilos SCSS y tipos TypeScript',
        items: [
          'Layout y navegación (dashboard, suscripciones, simulador).',
          'Estilos base SCSS (variables, tipografía, componentes comunes).',
          'Tipos TypeScript que reflejan los DTO de la API.',
        ],
      },
      {
        repo: 'frontend', day: 7, est: 3,
        title: 'Servicio HTTP, environments (apiUrl) y estados carga/vacío/éxito/error',
        items: [
          'Servicio HTTP tipado para la API.',
          'Configuración de `apiUrl` por entorno (development / production).',
          'Componentes/patrón reutilizable para los estados de carga, vacío, éxito y error.',
          'Validar el flujo completo contra PostgreSQL (no datos fijos); recargar y confirmar que los datos se recuperan.',
        ],
      },
      {
        repo: 'backend', day: 7, est: 1,
        title: 'CORS: permitir el origen de desarrollo de Angular',
        items: [
          'Política CORS con origen configurable por entorno (`http://localhost:4200` en desarrollo).',
          'No abrir todos los orígenes en producción.',
        ],
      },
    ],
  },

  {
    id: 'HU-09',
    kind: 'story',
    title: 'Validaciones y manejo de errores',
    priority: 'P0',
    estimate: '3–5 h',
    estimateH: 4,
    deps: 'Transversal',
    milestone: 'mvp',
    story: 'Como usuario, quiero recibir mensajes comprensibles cuando una operación no puede completarse para corregir mis datos.',
    criteria: [
      'Los errores de validación se devuelven con un formato consistente.',
      'Los errores internos no exponen stack traces ni secretos al cliente.',
      'La API usa códigos HTTP coherentes para éxito, validación y recurso inexistente.',
      'La interfaz presenta un mensaje accionable sin bloquearse.',
    ],
    notes: ['Códigos esperados: 200, 201, 204, 400, 404 (y 500 genérico sin detalles internos).'],
    tasks: [
      {
        repo: 'backend', day: 3, est: 1.5,
        title: 'Middleware global de excepciones (sin stack traces ni secretos)',
        items: [
          'Manejo centralizado de excepciones no controladas → 500 genérico.',
          'Registrar el detalle en logs del servidor, no en la respuesta.',
        ],
      },
      {
        repo: 'backend', day: 3, est: 1.5,
        title: 'Validaciones centralizadas y formato de error 400 consistente',
        items: [
          'Formato único de errores de validación (p. ej. ProblemDetails con lista de errores por campo).',
          'Aplicarlo a todos los endpoints existentes.',
          'Pruebas del formato de error.',
        ],
      },
      {
        repo: 'frontend', day: 8, est: 1.5,
        title: 'Interceptor HTTP y mensajes de error accionables',
        items: [
          'Interceptor que traduce errores 400/404/500 a mensajes comprensibles.',
          'La UI nunca queda bloqueada tras un error.',
        ],
      },
    ],
  },

  {
    id: 'HU-10',
    kind: 'story',
    title: 'Pruebas automatizadas de reglas financieras',
    priority: 'P0',
    estimate: '4–6 h',
    estimateH: 5,
    deps: 'HU-03, HU-04, HU-06, HU-07',
    milestone: 'mvp',
    story: 'Como desarrollador, quiero verificar automáticamente las reglas de negocio para reducir regresiones.',
    criteria: [
      'Existen pruebas para normalización mensual/anual, proyección, fechas y costo por uso.',
      'Se cubren importes inválidos, listas vacías, cero usos y servicios inactivos.',
      'Las pruebas se ejecutan con dotnet test.',
      'Las pruebas no requieren datos personales ni credenciales reales.',
    ],
    notes: ['Las pruebas se escriben junto con cada regla (no al final). Pruebas de integración se añaden cuando corresponda.'],
    tasks: [
      {
        repo: 'backend', day: 4, est: 2, extra: ['testing'],
        title: 'Pruebas xUnit: normalización mensual/anual y proyección anual',
        items: [
          'Ciclo mensual (COP 35.000 → 35.000) y anual (COP 120.000 → 10.000).',
          'Proyección anual de ambas = COP 540.000.',
          'Importes inválidos, lista vacía, inactivas y monedas distintas.',
        ],
      },
      {
        repo: 'backend', day: 5, est: 1.5, extra: ['testing'],
        title: 'Pruebas xUnit: fechas, días restantes y ventanas de alerta',
        items: [
          'Hoy, ayer, mañana, 3 y 7 días, cambio de mes/año.',
          'Fechas pasadas no se tratan como futuras.',
        ],
      },
      {
        repo: 'backend', day: 6, est: 1.5, extra: ['testing'],
        title: 'Pruebas xUnit: costo por uso (casos límite)',
        items: [
          'Varios registros y periodos.',
          'Sin registros y cero usos → no calculable, sin excepción de división.',
        ],
      },
      {
        repo: 'backend', day: 9, est: 1.5, extra: ['testing'],
        title: 'Pruebas xUnit: simulador de ahorro',
        items: [
          'Horizontes 1, 12 y 24 meses.',
          'Selección vacía → ahorro 0; no cambia estado persistido.',
        ],
      },
      {
        repo: 'backend', day: 9, est: 2, extra: ['testing'],
        title: 'Ejecutar lista de pruebas manuales de aceptación E2E',
        items: [
          'Crear mensual COP 35.000 → equivalente mensual COP 35.000.',
          'Crear anual COP 120.000 → equivalente mensual COP 10.000.',
          'Proyección anual de ambas activas = COP 540.000.',
          'Editar un importe y comprobar que los totales cambian al consultar de nuevo.',
          'Eliminar una suscripción: desaparece del listado y de los totales activos.',
          'Crear sin nombre o con importe 0: la API rechaza la petición.',
          'Simular selección: no modifica el estado persistido.',
          'Costo por uso con 0 usos: ni infinito ni error de división.',
          'Apagar PostgreSQL: el health check indica indisponibilidad sin exponer detalles.',
          'Recargar el frontend: los datos se recuperan desde la API.',
        ],
      },
    ],
  },

  {
    id: 'HU-11',
    kind: 'story',
    title: 'Documentar y presentar el proyecto',
    priority: 'P0',
    estimate: '3–5 h',
    estimateH: 4,
    deps: 'Todas las historias principales',
    milestone: 'mvp',
    story: 'Como reclutador o desarrollador, quiero entender cómo ejecutar y evaluar FlowTrim para verificar su calidad.',
    criteria: [
      'README describe problema, funciones, arquitectura y stack real.',
      'Incluye instrucciones de instalación y ejecución local.',
      'Documenta configuración de secretos sin publicar valores sensibles.',
      'Incluye endpoints principales, capturas y limitaciones conocidas.',
      'Las funciones pendientes no se presentan como terminadas.',
    ],
    notes: ['Despliegue público: objetivo de cierre solo si el tiempo y los proveedores lo permiten; si no, guía reproducible y tarea futura.'],
    tasks: [
      {
        repo: 'backend', day: 10, est: 1.5, extra: ['infra'],
        title: 'Revisión de calidad y seguridad previa al release',
        items: [
          'Revisar validaciones, errores, secretos y configuración por entorno.',
          'Verificar `dotnet build` y `dotnet test` en limpio.',
          'Confirmar que no hay secretos en el historial ni en el repositorio.',
        ],
      },
      {
        repo: 'backend', day: 10, est: 2, extra: ['docs'],
        title: 'README backend: arquitectura, instalación, secretos y endpoints',
        items: [
          'Problema, funciones y stack real (.NET 10, EF Core + Npgsql, PostgreSQL, xUnit).',
          'Diagrama de arquitectura por capas.',
          'Instalación y ejecución local (Docker Compose, migraciones, User Secrets).',
          'Tabla de endpoints principales y limitaciones conocidas.',
        ],
      },
      {
        repo: 'frontend', day: 10, est: 1.5, extra: ['docs'],
        title: 'README frontend: instalación, configuración de API y capturas',
        items: [
          'Instalación, `npm start` y configuración de `apiUrl`.',
          'Capturas de pantalla del dashboard, listado y simulador.',
          'Limitaciones conocidas.',
        ],
      },
      {
        repo: 'backend', day: 10, est: 0.5, extra: ['docs'],
        title: 'Crear release/etiqueta inicial y anotar mejoras futuras',
        items: [
          'Etiqueta `v1.0.0` (o `v0.1.0`) en backend y frontend.',
          'Actualizar el backlog post-MVP con los aprendizajes.',
        ],
      },
      {
        repo: 'backend', day: 10, est: 2, extra: ['optional', 'infra'],
        title: '(Opcional) Despliegue público de API, BD y frontend',
        items: [
          'Elegir proveedor de hosting (decisión pendiente).',
          'Configurar variables de entorno/secretos en el proveedor.',
          'Si no es posible, documentar los pasos pendientes en el README.',
        ],
      },
    ],
  },

  // ---------------- Post-MVP ----------------
  // FlowTrim 2.0 starts with secure ownership. HU-12 is intentionally kept as
  // the existing product story and refined instead of creating a duplicate.
  {
    id: 'HU-12', kind: 'story', title: 'Autenticación y aislamiento multiusuario',
    priority: 'P0', estimate: '16–22 h', estimateH: 19, deps: 'MVP estable', milestone: 'flowtrim2',
    story: 'Como usuario, quiero iniciar sesión y ver solo mis suscripciones para proteger mis datos financieros.',
    criteria: [
      'El usuario puede registrarse, iniciar sesión y cerrar sesión mediante un proveedor OIDC/JWT seleccionado para el proyecto.',
      'La API valida issuer, audience, firma y expiración del token antes de ejecutar endpoints privados.',
      'Cada suscripción y registro de uso queda asociado a un propietario y todas las consultas filtran por el usuario autenticado.',
      'Un usuario no puede leer, editar, eliminar ni simular datos pertenecientes a otra cuenta, aunque conozca sus identificadores.',
      'Las rutas privadas de Angular requieren autenticación y el interceptor envía el token sin registrar credenciales ni tokens.',
      'Las pruebas de integración cubren acceso permitido, acceso anónimo y acceso cruzado entre dos usuarios.',
    ],
    notes: [
      'Usar un proveedor gestionado compatible con OIDC/JWT; no construir recuperación de contraseñas propia en esta iteración.',
      'Agregar un usuario interno o una asociación estable con el subject externo para mantener una frontera clara entre identidad y dominio.',
      'Definir una estrategia explícita para datos existentes: base de demo reiniciable o asignación controlada al primer usuario.',
      'La autorización debe existir en backend; una guarda de Angular solo mejora la experiencia y nunca es la única protección.',
    ],
    tasks: [
      {
        repo: 'backend', day: 2, est: 3, extra: ['infra'],
        title: 'Configure OIDC/JWT authentication and identity mapping',
        items: [
          'Select one provider and document issuer, audience, local development setup and required claims.',
          'Configure ASP.NET Core authentication and authorization without storing provider secrets in Git.',
          'Create the current-user abstraction and map the external subject to a stable application identity.',
          'Keep `/api/health` public and require authorization for private endpoints.',
        ],
      },
      {
        repo: 'backend', day: 3, est: 5, extra: ['infra'],
        title: 'Add ownership model and database migration',
        items: [
          'Add the application user mapping and owner foreign keys using English snake_case identifiers.',
          'Add indexes and explicit foreign-key delete behavior.',
          'Define the migration strategy for existing single-user development data.',
          'Review generated SQL before applying the migration.',
        ],
      },
      {
        repo: 'backend', day: 4, est: 5,
        title: 'Scope repositories and handlers by authenticated owner',
        items: [
          'Update subscription and usage repository contracts to require the current owner.',
          'Apply owner predicates to list, detail, summary, upcoming, usage, cost-per-use and simulation flows.',
          'Return the same safe not-found behavior for missing and non-owned resources.',
          'Do not trust owner identifiers sent by the client.',
        ],
      },
      {
        repo: 'frontend', day: 4, est: 3,
        title: 'Add authentication screens, guard and token interceptor',
        items: [
          'Add login, registration handoff and logout states using the selected provider flow.',
          'Protect the existing `/app` routes with a route guard.',
          'Attach bearer tokens through the existing HTTP layer and handle 401/403 states.',
          'Preserve the existing standalone component, signals and localization patterns.',
        ],
      },
      {
        repo: 'backend', day: 5, est: 2, extra: ['testing'],
        title: 'Test authentication and cross-user authorization',
        items: [
          'Test anonymous rejection for private endpoints.',
          'Test two users with isolated subscriptions and usage records.',
          'Test read, update, delete, summary, upcoming and simulation isolation.',
          'Use fake tokens or a test authentication handler; never use real credentials.',
        ],
      },
      {
        repo: 'frontend', day: 5, est: 1, extra: ['testing'],
        title: 'Verify authenticated route and error states',
        items: [
          'Test redirect behavior, logout and expired-session handling.',
          'Test that tokens are not written to logs or user-facing errors.',
          'Verify loading, error, forbidden and empty states in the protected workspace.',
        ],
      },
    ],
  },
  {
    id: 'HU-13', kind: 'story', title: 'Notificaciones externas programadas',
    priority: 'P2', estimate: '6–10 h', estimateH: 8, deps: 'Fechas y configuración', milestone: 'post',
    story: 'Como usuario, quiero recibir recordatorios antes de un cobro para no sorprenderme.',
    criteria: [
      '(Propuesto, por refinar) Preferencias de recordatorio configurables.',
      '(Propuesto, por refinar) Tareas en segundo plano que envían correo/push antes del cobro.',
    ],
    notes: ['Fuera del MVP: las alertas del MVP son solo visuales dentro de la aplicación.'],
    tasks: [],
  },
  {
    id: 'HU-14', kind: 'story', title: 'Importar movimientos desde CSV',
    priority: 'P2', estimate: '6–10 h', estimateH: 8, deps: 'Modelo de transacciones futuro', milestone: 'post',
    story: 'Como usuario, quiero importar movimientos desde un CSV para detectar cobros recurrentes sin digitarlos.',
    criteria: [
      '(Propuesto, por refinar) Validación y vista previa antes de importar.',
      '(Propuesto, por refinar) Separar historial de transacciones confirmadas de fechas previstas.',
    ],
    notes: ['Se mantiene fuera de FlowTrim 2.0 porque requiere un modelo de transacciones confirmadas separado de las renovaciones esperadas. La importación de suscripciones usa HU-43 a HU-46.'],
    tasks: [],
  },
  {
    id: 'HU-15', kind: 'story', title: 'Extraer motor analítico a Python/FastAPI',
    priority: 'P3', estimate: '8–12 h', estimateH: 10, deps: 'Necesidad técnica validada', milestone: 'post',
    story: 'Como desarrollador, quiero extraer el motor analítico a un servicio independiente solo si existe una necesidad analítica concreta.',
    criteria: [
      '(Propuesto, por refinar) Existe una necesidad medible que justifica el microservicio.',
      '(Propuesto, por refinar) Contrato HTTP documentado y pruebas de integración.',
    ],
    notes: ['No es dependencia del MVP; la proyección determinista es suficiente.'],
    tasks: [],
  },

  // ---------------- FlowTrim 2.0: Secure platform ----------------
  {
    id: 'EP-04', kind: 'epic', title: 'Secure Multi-User Foundation',
    priority: 'P0', estimate: '16-22 h', estimateH: 19, deps: 'MVP v1.0', milestone: 'flowtrim2',
    story: 'As a FlowTrim owner, I want secure identity and server-side ownership boundaries so that private financial data can be used in a public demo safely.',
    criteria: [
      'Authentication and authorization are enforced by the ASP.NET Core API.',
      'Subscriptions, usage records and financial calculations are scoped to the authenticated owner.',
      'The Angular workspace is protected without changing the existing feature architecture.',
      'Cross-user authorization tests pass against a database-backed application boundary.',
      'The identity provider, claims and migration strategy are documented.',
    ],
    notes: ['HU-12 is the implementation story for this epic. No custom password or recovery system is introduced.'],
    tasks: [],
  },

  // ---------------- FlowTrim 2.0: AI insights ----------------
  {
    id: 'EP-05', kind: 'epic', title: 'FlowTrim Insights',
    priority: 'P1', estimate: '18-24 h', estimateH: 21, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As a FlowTrim user, I want to ask questions about my recurring spending and receive transparent explanations based on my own data.',
    criteria: [
      'The assistant uses authenticated owner-scoped data only.',
      'Financial values come from deterministic application tools rather than model-generated arithmetic.',
      'Responses expose relevant figures, assumptions and data sources.',
      'Provider failures, missing data, timeouts and usage limits have controlled behavior.',
      'The feature is available from a focused Angular workspace route without replacing existing navigation.',
    ],
    notes: ['No RAG, vector database, autonomous agent or conversation persistence is required for this MVP.'],
    tasks: [],
  },
  {
    id: 'HU-33', kind: 'story', title: 'Configure the AI provider boundary',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As a maintainer, I want the AI provider behind a small application contract so that provider details do not leak into financial rules or API endpoints.',
    criteria: [
      'The provider is configured through environment settings and no API key is committed.',
      'Application code depends on a small typed provider contract.',
      'The provider request supports cancellation, timeout and bounded output.',
      'A fake provider can be injected for tests without external network calls.',
    ],
    notes: ['The provider may interpret a question and select an allowed tool, but it cannot execute SQL or mutate domain data.'],
    tasks: [
      { repo: 'backend', day: 6, est: 2, extra: ['infra'], title: 'Add typed AI provider configuration and adapter', items: ['Add environment-backed options.', 'Add a small provider interface and one adapter.', 'Add timeout and cancellation handling.', 'Keep secrets out of logs and responses.'] },
      { repo: 'backend', day: 6, est: 1.5, extra: ['testing'], title: 'Add fake provider tests', items: ['Create deterministic fake responses.', 'Test provider failure and timeout mapping.', 'Verify no real credentials are needed.'] },
    ],
  },
  {
    id: 'HU-34', kind: 'story', title: 'Expose deterministic financial tools',
    priority: 'P1', estimate: '4-5 h', estimateH: 4.5, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As the Insights orchestrator, I want typed financial tools so that every answer is based on the existing FlowTrim calculation engine.',
    criteria: [
      'Tools exist for spending summary, upcoming renewals, cost per use and savings simulation.',
      'Every tool receives the authenticated owner context from the server.',
      'Tools reuse existing handlers and domain calculators instead of duplicating formulas.',
      'Tool results identify currencies, assumptions and whether values are estimates or declared data.',
      'Tool inputs are bounded and invalid subscription identifiers cannot escape the owner scope.',
    ],
    notes: ['Tool names and schemas are internal contracts; they are not arbitrary public database operations.'],
    tasks: [
      { repo: 'backend', day: 7, est: 3, title: 'Implement owner-scoped financial tool contracts', items: ['Define typed tool input/output records.', 'Wrap existing summary, upcoming, cost-per-use and simulation handlers.', 'Return explicit no-data and non-calculable states.', 'Add owner-scoped validation.'] },
      { repo: 'backend', day: 7, est: 1.5, extra: ['testing'], title: 'Test deterministic tool outputs', items: ['Cover currencies, empty data, zero usage and simulations.', 'Verify tools cannot access another owner.', 'Verify values match existing domain tests.'] },
    ],
  },
  {
    id: 'HU-35', kind: 'story', title: 'Answer protected financial questions',
    priority: 'P1', estimate: '4-5 h', estimateH: 4.5, deps: 'HU-33, HU-34', milestone: 'flowtrim2',
    story: 'As an authenticated user, I want to ask a bounded financial question so that FlowTrim explains my registered data without inventing calculations.',
    criteria: [
      'The protected endpoint accepts a non-empty question with a documented maximum length.',
      'The orchestrator can invoke only the allow-listed financial tools.',
      'The response includes an answer, figures used, assumptions and source references.',
      'Provider errors, unsupported questions, empty data and rate limits return actionable safe responses.',
      'Questions and responses are not persisted in the MVP unless a later privacy decision approves retention.',
    ],
    notes: ['The generated prose is explanatory; the backend tool results remain authoritative for money and dates.'],
    tasks: [
      { repo: 'backend', day: 8, est: 3, title: 'Implement protected Insights endpoint and orchestration', items: ['Add the endpoint and request/response DTOs.', 'Build the allow-listed tool orchestration.', 'Add bounded request validation and provider timeout mapping.', 'Add a per-user request limit suitable for the demo.'] },
      { repo: 'backend', day: 8, est: 1.5, extra: ['testing'], title: 'Test safe AI response behavior', items: ['Test supported and unsupported questions.', 'Test provider failure, empty data and rate-limit responses.', 'Test that owner scope is preserved through orchestration.'] },
    ],
  },
  {
    id: 'HU-36', kind: 'story', title: 'Add the FlowTrim Insights workspace',
    priority: 'P1', estimate: '4-5 h', estimateH: 4.5, deps: 'HU-35', milestone: 'flowtrim2',
    story: 'As a user, I want a focused Insights screen so that I can ask questions and understand the evidence behind each response.',
    criteria: [
      'The workspace exposes an authenticated Insights route using the existing Angular standalone feature pattern.',
      'The screen includes suggested questions and a typed question input.',
      'Loading, empty, success, provider error, unauthorized and rate-limit states are visible and actionable.',
      'Responses render highlighted figures, assumptions and source details without unsafe HTML injection.',
      'The view supports keyboard navigation, visible focus, responsive layouts and both existing languages.',
    ],
    tasks: [
      { repo: 'frontend', day: 9, est: 3, title: 'Build the Insights feature and API service', items: ['Add route, navigation item and typed models.', 'Add HTTP service and request cancellation where practical.', 'Render answer, figures, assumptions and sources.', 'Reuse existing theme and localization services.'] },
      { repo: 'frontend', day: 9, est: 1.5, extra: ['testing'], title: 'Test Insights states and accessibility', items: ['Test loading, empty, success and failure states.', 'Test keyboard/focus behavior and responsive layout.', 'Test localized labels and safe rendering.'] },
    ],
  },
  {
    id: 'HU-37', kind: 'story', title: 'Verify Insights evidence and limits',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-35, HU-36', milestone: 'flowtrim2',
    story: 'As a recruiter or maintainer, I want evidence that Insights is controlled and explainable so that the AI integration is trustworthy rather than decorative.',
    criteria: [
      'At least four representative questions are documented with expected tool results.',
      'Tests prove that generated answers cannot replace deterministic financial values.',
      'Rate limits, timeout behavior and provider outages are demonstrated.',
      'The README documents privacy boundaries and what data is sent to the provider.',
      'The demo checklist includes a successful question and a controlled failure.',
    ],
    tasks: [
      { repo: 'backend', day: 10, est: 2, extra: ['testing', 'docs'], title: 'Create Insights verification matrix', items: ['Document representative prompts and expected evidence.', 'Add contract tests for response shape and limits.', 'Record provider failure and timeout behavior.'] },
      { repo: 'tracker', day: 10, est: 1.5, extra: ['docs'], title: 'Document AI privacy and demo boundaries', items: ['Document data minimization and retention decisions.', 'Add demo questions and expected explanations.', 'Document non-goals such as banking advice and autonomous actions.'] },
    ],
  },

  // ---------------- FlowTrim 2.0: Delivery ----------------
  {
    id: 'EP-06', kind: 'epic', title: 'CI/CD, Public Delivery and Observability',
    priority: 'P0', estimate: '12-16 h', estimateH: 14, deps: 'MVP v1.0', milestone: 'flowtrim2',
    story: 'As a recruiter or maintainer, I want FlowTrim tested and deployable from version control so that the project demonstrates delivery discipline, not only local development.',
    criteria: [
      'Pull requests run backend tests, frontend tests and production builds.',
      'Deployment uses environment variables and managed secrets rather than committed credentials.',
      'The deployed API exposes a safe health check for API and PostgreSQL availability.',
      'CORS, logging and runtime configuration differ safely between development and production.',
      'A reproducible demo and rollback/diagnostic notes are documented.',
    ],
    notes: ['Keep the current single-deployable backend architecture. Do not add Kubernetes or a message broker for this milestone.'],
    tasks: [],
  },
  {
    id: 'HU-38', kind: 'story', title: 'Run automated CI for backend and frontend',
    priority: 'P0', estimate: '3-4 h', estimateH: 3.5, deps: 'MVP v1.0', milestone: 'flowtrim2',
    story: 'As a maintainer, I want every change checked automatically so that regressions are detected before deployment.',
    criteria: [
      'Backend CI restores, builds and runs all xUnit tests.',
      'Frontend CI installs from the lockfile, runs tests and builds production output.',
      'CI fails on a broken build, failed test or missing required configuration.',
      'Secrets and personal data are not printed in workflow logs.',
      'The workflow is documented for both repository locations.',
    ],
    tasks: [
      { repo: 'backend', day: 1, est: 1.5, extra: ['infra'], title: 'Add backend GitHub Actions workflow', items: ['Use the repository-supported .NET SDK.', 'Run restore, build and test.', 'Upload useful test artifacts only when safe.'] },
      { repo: 'frontend', day: 1, est: 1.5, extra: ['infra'], title: 'Add frontend GitHub Actions workflow', items: ['Use the lockfile and supported Node/npm versions.', 'Run tests in non-watch mode and production build.', 'Avoid exposing environment secrets.'] },
    ],
  },
  {
    id: 'HU-39', kind: 'story', title: 'Harden environment configuration and CORS',
    priority: 'P0', estimate: '2-3 h', estimateH: 2.5, deps: 'HU-12, HU-38', milestone: 'flowtrim2',
    story: 'As an operator, I want environment-specific configuration so that a public deployment does not reuse unsafe local defaults.',
    criteria: [
      'Database, identity, AI and allowed-origin settings come from environment configuration or managed secrets.',
      'Production startup fails clearly when a required secret or setting is missing.',
      'Production CORS allows only the deployed frontend origin and required headers such as Authorization.',
      'Local `.env.example` and User Secrets instructions contain placeholders only.',
      'Logs never include connection strings, tokens, API keys or full private prompts.',
    ],
    tasks: [
      { repo: 'backend', day: 2, est: 1.5, extra: ['infra'], title: 'Configure production settings and CORS', items: ['Add typed options and startup validation.', 'Allow Authorization and required preflight headers.', 'Document local and deployed configuration.'] },
      { repo: 'frontend', day: 2, est: 1, extra: ['infra'], title: 'Configure frontend API and identity environments', items: ['Keep API base URLs environment-specific.', 'Document public client configuration separately from secrets.', 'Verify no private values enter the bundle.'] },
    ],
  },
  {
    id: 'HU-40', kind: 'story', title: 'Deploy the public demonstration environment',
    priority: 'P0', estimate: '4-6 h', estimateH: 5, deps: 'HU-12, HU-38, HU-39', milestone: 'flowtrim2',
    story: 'As a recruiter, I want to open a working FlowTrim demo so that I can evaluate the product without reproducing the local environment first.',
    criteria: [
      'Frontend, API and PostgreSQL run in a documented hosted environment.',
      'Database schema is applied through an explicit migration process.',
      'The public demo uses non-sensitive seed data or an empty onboarding flow.',
      'Health checks and logs make startup and database failures diagnosable without exposing internals.',
      'Deployment can be repeated from the repository using documented steps or CI.',
    ],
    tasks: [
      { repo: 'backend', day: 11, est: 2.5, extra: ['infra'], title: 'Deploy API and PostgreSQL with safe runtime configuration', items: ['Select a simple hosting arrangement and document the trade-off.', 'Configure migrations, connection string and health checks.', 'Verify restart behavior and database persistence.'] },
      { repo: 'frontend', day: 11, est: 1.5, extra: ['infra'], title: 'Deploy Angular production build', items: ['Configure production API URL.', 'Verify client-side route fallback.', 'Verify browser access to protected workspace.'] },
      { repo: 'tracker', day: 11, est: 1, extra: ['docs'], title: 'Document demo access and operational runbook', items: ['Record demo URL and non-sensitive test account instructions.', 'Document health, logs, restart and rollback checks.', 'Document known hosting limitations.'] },
    ],
  },
  {
    id: 'HU-41', kind: 'story', title: 'Add structured logs and correlation evidence',
    priority: 'P1', estimate: '2-3 h', estimateH: 2.5, deps: 'HU-40', milestone: 'flowtrim2',
    story: 'As a maintainer, I want safe request correlation and latency evidence so that production failures can be investigated without exposing financial data.',
    criteria: [
      'Requests have a correlation identifier that is returned or traceable without exposing user secrets.',
      'Logs include route, status, duration and failure category at appropriate levels.',
      'Sensitive headers, tokens, prompts and response bodies are excluded or redacted.',
      'Health checks distinguish API and database availability.',
      'The README explains how to inspect a failed demo request safely.',
    ],
    tasks: [
      { repo: 'backend', day: 12, est: 2, extra: ['infra'], title: 'Implement safe request correlation and structured logging', items: ['Add correlation middleware or equivalent existing pipeline component.', 'Log bounded operational metadata.', 'Redact sensitive values and verify exception behavior.'] },
      { repo: 'tracker', day: 12, est: 0.5, extra: ['docs'], title: 'Document operational evidence', items: ['Add example health response.', 'Document correlation lookup and privacy rules.'] },
    ],
  },
  {
    id: 'HU-42', kind: 'story', title: 'Prepare portfolio delivery evidence',
    priority: 'P1', estimate: '2-3 h', estimateH: 2.5, deps: 'HU-38, HU-40, HU-41', milestone: 'flowtrim2',
    story: 'As a recruiter, I want a concise technical narrative and verification evidence so that the project decisions are easy to evaluate in an interview.',
    criteria: [
      'The README explains the problem, architecture, security boundary, AI boundary and deployment.',
      'The repository links to CI status, demo instructions and relevant screenshots or recorded evidence.',
      'The documentation distinguishes confirmed transactions, expected renewals and declared usage.',
      'Known limitations and deferred features are listed honestly.',
      'A five-minute demo path is documented from login to Insights response.',
    ],
    tasks: [
      { repo: 'tracker', day: 13, est: 2.5, extra: ['docs'], title: 'Write FlowTrim 2.0 portfolio and demo documentation', items: ['Summarize architecture and key trade-offs.', 'Add evidence links and demo script.', 'List limitations, privacy boundaries and deferred work.'] },
    ],
  },

  // ---------------- FlowTrim 2.0: Subscription import ----------------
  {
    id: 'EP-07', kind: 'epic', title: 'Subscription Catalog Import',
    priority: 'P1', estimate: '12-16 h', estimateH: 14, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As a user, I want to import my subscription catalog from a documented CSV so that I can onboard without entering every service manually.',
    criteria: [
      'The feature imports subscriptions, not confirmed bank transactions.',
      'Rows are validated before persistence and errors identify row and field.',
      'The user can preview valid rows, invalid rows and possible duplicates.',
      'Confirmation persists only accepted rows within a controlled transaction.',
      'The import is owner-scoped, bounded in size and documented with a sample file.',
    ],
    notes: ['HU-14 remains reserved for a future transaction model. This epic does not infer real payment history.'],
    tasks: [],
  },
  {
    id: 'HU-43', kind: 'story', title: 'Define and validate subscription CSV input',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As a user, I want a documented CSV format with row-level validation so that I can correct my file before importing it.',
    criteria: [
      'The documented MVP format contains name, amount, currency, billing cycle and next billing date.',
      'The API rejects unsupported file types, excessive size and excessive row count.',
      'Dates, amounts, currencies and billing cycles use explicit parsing rules.',
      'Each invalid row returns a stable row number, field and safe error code/message.',
      'No invalid row is persisted during preview.',
    ],
    tasks: [
      { repo: 'backend', day: 14, est: 3, title: 'Implement bounded CSV parser and validation contract', items: ['Define the documented columns and sample.', 'Parse with explicit culture/date rules.', 'Enforce file and row limits.', 'Reuse domain validation after parsing.'] },
      { repo: 'tracker', day: 14, est: 0.5, extra: ['docs'], title: 'Document subscription CSV format', items: ['Add sample CSV.', 'Document delimiters, headers, decimal/date formats and limitations.'] },
    ],
  },
  {
    id: 'HU-44', kind: 'story', title: 'Preview duplicates and import results',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-43', milestone: 'flowtrim2',
    story: 'As a user, I want a preview that identifies duplicates and valid rows so that I can decide what will be imported before committing it.',
    criteria: [
      'The preview returns a bounded import identifier and does not persist accepted subscriptions yet.',
      'Rows are classified as valid, invalid or possible duplicate.',
      'Duplicate detection is owner-scoped and uses documented matching fields.',
      'The preview summary reports accepted, rejected and duplicate counts.',
      'Preview data expires or is discarded safely if confirmation does not occur.',
    ],
    tasks: [
      { repo: 'backend', day: 15, est: 3, title: 'Implement owner-scoped import preview', items: ['Add preview request/response DTOs.', 'Detect duplicates against existing owner data and within the file.', 'Avoid persisting unconfirmed records.', 'Define preview expiration or bounded in-memory representation.'] },
      { repo: 'frontend', day: 15, est: 0.5, title: 'Render import preview summary contract', items: ['Prepare typed preview models and row classifications.', 'Keep the confirmation action disabled until a valid preview exists.'] },
    ],
  },
  {
    id: 'HU-45', kind: 'story', title: 'Confirm owner-scoped subscription import',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-44', milestone: 'flowtrim2',
    story: 'As a user, I want to confirm valid CSV rows so that FlowTrim adds them atomically to my subscription catalog.',
    criteria: [
      'Only a valid, unexpired preview owned by the authenticated user can be confirmed.',
      'Accepted rows are persisted in one transaction or none are persisted.',
      'Duplicate rows are skipped or rejected according to the documented user choice.',
      'The response reports created, skipped and failed counts without exposing another owner’s data.',
      'A repeated confirmation cannot create duplicate records from the same preview.',
    ],
    tasks: [
      { repo: 'backend', day: 16, est: 3, title: 'Implement transactional import confirmation', items: ['Persist accepted rows with owner identity.', 'Add idempotency/confirmation state.', 'Return import summary and safe errors.', 'Test rollback and repeated confirmation.'] },
      { repo: 'backend', day: 16, est: 0.5, extra: ['testing'], title: 'Test import authorization and transaction boundaries', items: ['Test cross-user preview rejection.', 'Test rollback on persistence failure.', 'Test duplicate behavior.'] },
    ],
  },
  {
    id: 'HU-46', kind: 'story', title: 'Add subscription import workspace flow',
    priority: 'P1', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-44, HU-45', milestone: 'flowtrim2',
    story: 'As a user, I want to upload, review and confirm a CSV through the workspace so that onboarding is clear and reversible before persistence.',
    criteria: [
      'The UI supports file selection, preview, correction/replacement and explicit confirmation.',
      'The table shows row number, field errors, duplicate status and accepted values.',
      'Loading, empty, success, validation error, expired preview and server error states are handled.',
      'The flow is accessible by keyboard and usable on mobile without requiring a wide table viewport.',
      'The UI clearly states that the import creates expected subscriptions, not confirmed transactions.',
    ],
    tasks: [
      { repo: 'frontend', day: 17, est: 3, title: 'Build CSV import preview and confirmation UI', items: ['Add file picker and upload service.', 'Render responsive preview table and summary.', 'Add confirmation and replacement flows.', 'Localize labels and error messages.'] },
      { repo: 'frontend', day: 17, est: 0.5, extra: ['testing'], title: 'Test import UX states and accessibility', items: ['Test invalid file, duplicate, success and expired preview states.', 'Test keyboard focus and mobile layout.', 'Verify no optimistic persistence before confirmation.'] },
    ],
  },

  // ---------------- FlowTrim 2.0: Quality evidence ----------------
  {
    id: 'EP-08', kind: 'epic', title: 'Integration and Portfolio Evidence',
    priority: 'P0', estimate: '10-14 h', estimateH: 12, deps: 'EP-04, EP-05, EP-06', milestone: 'flowtrim2',
    story: 'As a maintainer, I want integration and release evidence so that FlowTrim 2.0 can be defended with reproducible results in an interview.',
    criteria: [
      'The main authenticated flow is tested against PostgreSQL and the real API boundary.',
      'Negative authorization scenarios are automated rather than only manually described.',
      'The critical demo path is verified in a browser against the deployed environment or a reproducible local stack.',
      'Performance, security and known limitations are documented without invented metrics.',
    ],
    notes: ['Testing increases confidence in the existing architecture; it does not justify introducing a new test framework unless required.'],
    tasks: [],
  },
  {
    id: 'HU-47', kind: 'story', title: 'Add database-backed integration tests',
    priority: 'P0', estimate: '4-5 h', estimateH: 4.5, deps: 'HU-12', milestone: 'flowtrim2',
    story: 'As a developer, I want API integration tests against PostgreSQL so that ownership filters and migrations are verified beyond in-memory unit tests.',
    criteria: [
      'Tests run against a disposable PostgreSQL instance or an equivalent isolated CI service.',
      'Migrations and database constraints are applied before tests.',
      'Tests cover create, list, update, delete, summary, usage and simulation through the API boundary.',
      'Tests cover two-user isolation and anonymous rejection.',
      'Tests do not require real provider credentials or personal data.',
    ],
    tasks: [
      { repo: 'backend', day: 18, est: 3.5, extra: ['testing'], title: 'Create PostgreSQL API integration test harness', items: ['Use the existing xUnit structure and a disposable database strategy.', 'Apply migrations and isolate test data.', 'Exercise the API boundary with fake authentication.'] },
      { repo: 'backend', day: 18, est: 1, extra: ['testing'], title: 'Add ownership and migration regression cases', items: ['Test constraints, indexes and owner predicates.', 'Test reset/cleanup and repeatability in CI.'] },
    ],
  },
  {
    id: 'HU-48', kind: 'story', title: 'Verify the critical browser flow',
    priority: 'P0', estimate: '3-4 h', estimateH: 3.5, deps: 'HU-12, HU-36, HU-40', milestone: 'flowtrim2',
    story: 'As a recruiter, I want the main user journey verified in a browser so that the deployed product is more than a collection of passing unit tests.',
    criteria: [
      'The browser flow covers login, workspace load, subscription data and one Insights question.',
      'A second account cannot see the first account’s data.',
      'The flow records loading, empty and controlled error states where relevant.',
      'Browser checks report no unexpected console errors or failed requests.',
      'The flow is reproducible from documented seed or setup instructions.',
    ],
    tasks: [
      { repo: 'frontend', day: 19, est: 2.5, extra: ['testing'], title: 'Add browser smoke flow for authenticated workspace', items: ['Reuse the project browser QA approach where available.', 'Verify login, route guard, workspace, Insights and logout.', 'Verify responsive critical states.'] },
      { repo: 'tracker', day: 19, est: 1, extra: ['docs'], title: 'Document browser acceptance evidence', items: ['Record setup, expected checkpoints and known provider limitations.', 'Link screenshots or a short recording when available.'] },
    ],
  },
  {
    id: 'HU-49', kind: 'story', title: 'Complete FlowTrim 2.0 release readiness review',
    priority: 'P0', estimate: '2-3 h', estimateH: 2.5, deps: 'EP-04, EP-05, EP-06, HU-47, HU-48', milestone: 'flowtrim2',
    story: 'As a maintainer, I want a release checklist so that FlowTrim 2.0 is published only when security, tests, deployment and documentation agree with the actual implementation.',
    criteria: [
      'All P0 acceptance criteria are checked against the code and deployed environment.',
      'The backend, frontend and tracker documentation describe the same routes, configuration and limitations.',
      'No real credentials, private data or misleading financial claims remain in the repositories.',
      'CI is green for the release commit and the demo health check is healthy.',
      'The release notes summarize implemented features and explicitly list deferred work.',
    ],
    tasks: [
      { repo: 'tracker', day: 20, est: 2.5, extra: ['docs', 'testing'], title: 'Run FlowTrim 2.0 release readiness checklist', items: ['Review P0 stories and evidence.', 'Reconcile README, specs and backlog.', 'Prepare release notes and deferred roadmap.', 'Confirm no secrets or unsupported claims are committed.'] },
    ],
  },

  // ---------------- Visual Experience Redesign ----------------
  {
    id: 'EP-01', kind: 'epic', title: 'FlowTrim Visual Experience Redesign',
    priority: 'P1', estimate: '40-55 h', estimateH: 47.5, deps: 'MVP complete', milestone: 'visual',
    story: 'As a FlowTrim user or recruiter, I want a distinctive and accessible product experience so that the application feels professional, clear and memorable.',
    criteria: [
      'The application has a documented FlowTrim visual identity with dark and light palettes.',
      'The public landing page and application workspace have clearly separated layouts.',
      'The workspace has responsive desktop and mobile navigation.',
      'The MVP screens are visually redesigned without changing financial rules or API contracts.',
      'The complete frontend passes build, unit tests and browser acceptance checks after the redesign.',
    ],
    notes: [
      'Initial implementation uses SCSS, CSS custom properties and SVG without adding a state manager.',
      'Backend behavior, persistence and financial calculations remain unchanged.',
    ],
    tasks: [],
  },
  {
    id: 'HU-16', kind: 'story', title: 'Define FlowTrim visual identity',
    priority: 'P1', estimate: '4-6 h', estimateH: 5, deps: 'EP-01', milestone: 'visual',
    story: 'As a FlowTrim user, I want a consistent visual identity so that the application feels clear, professional and recognizable.',
    criteria: [
      'All application screens use centralized color, spacing, typography and elevation tokens.',
      'The dark theme uses the Carbon Signal palette with black, teal and green accents.',
      'The light theme uses an accessible palette that preserves the same brand identity.',
      'The application includes a FlowTrim wordmark and custom SVG brand mark.',
      'Interactive states include consistent hover, focus, disabled, success, warning and error treatments.',
      'Normal text and controls meet WCAG AA contrast requirements in both themes.',
    ],
    notes: ['No backend or API changes are required.'],
    tasks: [
      {
        repo: 'frontend', day: 11, est: 2, extra: ['design'],
        title: 'Create FlowTrim design tokens and brand assets',
        items: ['Define CSS custom properties for colors, spacing, typography and elevation.', 'Create the FlowTrim SVG mark and wordmark.', 'Document the visual tokens.'],
      },
      {
        repo: 'frontend', day: 11, est: 3, extra: ['design'],
        title: 'Apply shared visual states and accessibility foundations',
        items: ['Replace unrelated hardcoded colors with semantic tokens.', 'Define focus, hover, disabled, success, warning and error states.', 'Check contrast in both themes.'],
      },
    ],
  },
  {
    id: 'HU-17', kind: 'story', title: 'Create the application shell and navigation',
    priority: 'P1', estimate: '5-7 h', estimateH: 6, deps: 'HU-16', milestone: 'visual',
    story: 'As a FlowTrim user, I want a clear application shell so that I can move between financial tools without feeling lost.',
    criteria: [
      'Desktop workspace navigation is presented as a vertical navigation rail.',
      'The active route has a visible brand-colored indicator.',
      'The FlowTrim logo links to the landing page or workspace overview according to the route design.',
      'The Add subscription action is accessible from the workspace shell.',
      'Mobile view uses a mobile-friendly top bar, drawer or bottom navigation.',
      'All existing features remain reachable through the redesigned navigation.',
      'Unknown routes render a controlled not-found state.',
    ],
    notes: ['Existing routes must remain supported or redirect cleanly to their new workspace equivalents.'],
    tasks: [
      {
        repo: 'frontend', day: 11, est: 3, extra: ['design'],
        title: 'Build the workspace shell and desktop navigation',
        items: ['Separate landing and workspace layouts.', 'Create the desktop navigation rail.', 'Add active route styling and primary actions.'],
      },
      {
        repo: 'frontend', day: 11, est: 3, extra: ['design'],
        title: 'Build responsive navigation and route compatibility',
        items: ['Create mobile navigation behavior.', 'Preserve or redirect existing routes.', 'Verify keyboard and screen-reader navigation.'],
      },
    ],
  },
  {
    id: 'HU-18', kind: 'story', title: 'Add dark and light theme modes',
    priority: 'P1', estimate: '3-5 h', estimateH: 4, deps: 'HU-16, HU-17', milestone: 'visual',
    story: 'As a FlowTrim user, I want to switch between dark and light mode so that I can use the application comfortably in different environments.',
    criteria: [
      'The initial theme follows the system preference when the user has no saved preference.',
      'Users can switch between dark and light mode without a full page reload.',
      'The selected theme persists between browser sessions.',
      'All screens, forms, tables, cards and alerts use the active theme.',
      'The theme toggle has an accessible name and visible focus state.',
      'The application still renders when local storage is unavailable.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 12, est: 2, extra: ['design'],
        title: 'Implement theme state and persistence',
        items: ['Create a theme service inside the existing core structure.', 'Persist the selected theme in local storage.', 'Support system preference detection.'],
      },
      {
        repo: 'frontend', day: 12, est: 2, extra: ['design'],
        title: 'Add and test the accessible theme toggle',
        items: ['Add the theme toggle to the workspace shell.', 'Test both themes across all current screens.', 'Verify focus and contrast states.'],
      },
    ],
  },
  {
    id: 'HU-19', kind: 'story', title: 'Create the FlowTrim landing page',
    priority: 'P1', estimate: '5-8 h', estimateH: 6.5, deps: 'HU-16, HU-17, HU-18', milestone: 'visual',
    story: 'As a new user or recruiter, I want to understand FlowTrim immediately so that I know what problem it solves and how to enter the application.',
    criteria: [
      'The root route displays a dedicated landing page instead of the subscriptions table.',
      'The hero explains that FlowTrim tracks subscriptions, recurring costs and underused services.',
      'The main call to action opens the workspace.',
      'Feature sections describe only functionality that already exists.',
      'Example metrics or mockups are clearly identified as examples when they are not API data.',
      'The landing page is responsive and does not require the backend to render.',
      'The page includes an appropriate document title and description.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 12, est: 4, extra: ['design'],
        title: 'Build the landing hero and product sections',
        items: ['Create the hero, calls to action and product preview.', 'Add the three product pillars.', 'Add the transparent formula and limitations sections.'],
      },
      {
        repo: 'frontend', day: 12, est: 2.5, extra: ['design'],
        title: 'Add responsive landing behavior and metadata',
        items: ['Tune mobile and desktop layouts.', 'Add page metadata.', 'Verify the landing page without an API connection.'],
      },
    ],
  },
  {
    id: 'HU-20', kind: 'story', title: 'Redesign the workspace overview',
    priority: 'P1', estimate: '5-8 h', estimateH: 6.5, deps: 'HU-17, HU-18, HU-19', milestone: 'visual',
    story: 'As a FlowTrim user, I want an overview screen that prioritizes important financial information so that I can understand my situation quickly.',
    criteria: [
      'The workspace overview displays the monthly equivalent and annual projection from the existing API.',
      'Financial values remain grouped by currency.',
      'Upcoming charges are visible without opening another screen.',
      'Potential savings are represented visually when available.',
      'Loading, empty, success and error states remain available.',
      'The overview uses responsive visual hierarchy without hardcoded business data.',
      'Overview actions open the corresponding detailed feature.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 13, est: 4, extra: ['design'],
        title: 'Create the overview metric hierarchy',
        items: ['Build the primary monthly spend metric.', 'Add secondary annual and active-service metrics.', 'Add upcoming charges and savings previews.'],
      },
      {
        repo: 'frontend', day: 13, est: 2.5, extra: ['design'],
        title: 'Add CSS and SVG financial indicators',
        items: ['Add bars, sparklines or indicators without a new chart dependency.', 'Preserve all data states.', 'Verify both themes.'],
      },
    ],
  },
  {
    id: 'HU-21', kind: 'story', title: 'Redesign subscriptions and forms',
    priority: 'P1', estimate: '5-7 h', estimateH: 6, deps: 'HU-16, HU-17, HU-18', milestone: 'visual',
    story: 'As a FlowTrim user, I want the subscription list and forms to be visually clear so that I can manage recurring services quickly.',
    criteria: [
      'Desktop subscription rows clearly prioritize name, amount, status and next billing date.',
      'Mobile subscriptions render as readable cards without horizontal scrolling.',
      'Upcoming or overdue charges receive the corresponding visual treatment.',
      'Search behavior continues to filter the current subscription list.',
      'Create and edit forms group fields visually and keep accessible labels.',
      'Backend validation errors remain visible and actionable in the redesigned form.',
      'Usage, edit and delete actions continue to work after the redesign.',
      'The empty state encourages adding the first subscription.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 14, est: 3, extra: ['design'],
        title: 'Redesign the subscription list',
        items: ['Build the desktop list and mobile card treatment.', 'Add category, status and billing-date visual cues.', 'Redesign search and actions.'],
      },
      {
        repo: 'frontend', day: 14, est: 3, extra: ['design'],
        title: 'Redesign subscription forms and states',
        items: ['Redesign create and edit forms.', 'Improve loading, empty, validation and error states.', 'Preserve current API behavior.'],
      },
    ],
  },
  {
    id: 'HU-22', kind: 'story', title: 'Redesign summary and upcoming charges',
    priority: 'P1', estimate: '4-6 h', estimateH: 5, deps: 'HU-20, HU-21', milestone: 'visual',
    story: 'As a FlowTrim user, I want summary and upcoming charges to be visually prioritized so that I can identify financial pressure and imminent renewals at a glance.',
    criteria: [
      'Summary cards prioritize monthly equivalent and annual projection.',
      'Multiple currencies remain visually separated.',
      'The summary empty state is branded and actionable.',
      'Upcoming charges are presented as a timeline or grouped alert layout.',
      'Overdue, today and upcoming charges have distinct semantic treatments.',
      'Alert meaning does not depend only on color.',
      'Loading and error states remain available in both themes.',
      'The server-calculated countdown remains the source of truth.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 15, est: 2.5, extra: ['design'],
        title: 'Redesign financial summary visual hierarchy',
        items: ['Redesign currency cards.', 'Add stronger metric hierarchy.', 'Improve empty and explanatory states.'],
      },
      {
        repo: 'frontend', day: 15, est: 2.5, extra: ['design'],
        title: 'Redesign upcoming charges as visual alert groups',
        items: ['Build timeline or grouped alert sections.', 'Add semantic labels and icons.', 'Verify countdown and theme behavior.'],
      },
    ],
  },
  {
    id: 'HU-23', kind: 'story', title: 'Redesign simulator and usage experience',
    priority: 'P1', estimate: '5-7 h', estimateH: 6, deps: 'HU-20, HU-21, HU-22', milestone: 'visual',
    story: 'As a FlowTrim user, I want the simulator and usage screens to make decisions easier to understand so that I can identify what to trim.',
    criteria: [
      'Simulator selections are visually distinct and remain accessible.',
      'Base and scenario values are visually comparable after every selection change.',
      'The selected horizon is clearly highlighted.',
      'Savings use the success treatment without implying a guarantee.',
      'Simulator assumptions state that no cancellation is persisted.',
      'Empty simulator selection displays zero savings and a useful state.',
      'Calculable cost per use is the primary metric on the usage screen.',
      'Insufficient usage data is clearly presented without an alarming error treatment.',
      'The usage screen states that usage is declared and not verified.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 16, est: 3, extra: ['design'],
        title: 'Redesign simulator selection and comparison',
        items: ['Redesign selection controls.', 'Add base-versus-scenario comparison.', 'Add horizon selector and assumptions panel.'],
      },
      {
        repo: 'frontend', day: 16, est: 3, extra: ['design'],
        title: 'Redesign usage and cost-per-use presentation',
        items: ['Promote the cost-per-use result.', 'Improve not-calculable and declared-usage states.', 'Preserve record history and form behavior.'],
      },
    ],
  },
  {
    id: 'HU-24', kind: 'story', title: 'Verify responsive accessibility and visual quality',
    priority: 'P1', estimate: '4-6 h', estimateH: 5, deps: 'HU-16, HU-17, HU-18, HU-19, HU-20, HU-21, HU-22, HU-23', milestone: 'visual',
    story: 'As a FlowTrim user, I want the redesigned application to remain usable across devices and assistive technologies so that visual improvements do not reduce usability.',
    criteria: [
      'Main screens work at mobile, tablet and desktop widths without unwanted horizontal scrolling.',
      'Keyboard navigation has logical order and visible focus states.',
      'Buttons, links and icon-only controls have accessible names.',
      'Dark and light themes meet the defined contrast requirements.',
      'Reduced-motion preferences reduce non-essential animation.',
      'npm test and npm run build pass after the redesign.',
      'Browser acceptance checks produce no redesign-related console or network errors.',
      'README screenshots represent the current interface.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 17, est: 3, extra: ['testing'],
        title: 'Run responsive and accessibility verification',
        items: ['Check 360px, tablet, desktop and wide desktop layouts.', 'Check keyboard flow and accessible names.', 'Check reduced-motion behavior.'],
      },
      {
        repo: 'frontend', day: 17, est: 2, extra: ['testing', 'docs'],
        title: 'Run regression checks and update visual documentation',
        items: ['Run unit tests and production build.', 'Run browser acceptance checks.', 'Replace outdated screenshots and update the README.'],
      },
    ],
  },

  // ---------------- Localization and Motion ----------------
  {
    id: 'EP-02', kind: 'epic', title: 'Localization and Motion Layer',
    priority: 'P1', estimate: '12-18 h', estimateH: 15, deps: 'EP-01 complete', milestone: 'enhancements',
    story: 'As a FlowTrim user, I want to choose my language, return to the product landing page and experience purposeful motion so that the product feels complete and expressive.',
    criteria: [
      'The user can switch the interface between English and Spanish from the landing and workspace.',
      'The selected language persists between browser sessions without backend changes.',
      'The workspace provides a visible way back to the landing page.',
      'The landing page includes meaningful motion and an interactive scrollable feature rail.',
      'Motion respects prefers-reduced-motion and does not block content or navigation.',
      'The frontend passes tests, build and browser checks in both languages.',
    ],
    notes: ['Localization is presentation-only and remains in the Angular client. No external translation service is required.'],
    tasks: [],
  },
  {
    id: 'HU-25', kind: 'story', title: 'Add English and Spanish interface localization',
    priority: 'P1', estimate: '6-8 h', estimateH: 7, deps: 'EP-02', milestone: 'enhancements',
    story: 'As a FlowTrim user, I want to switch between English and Spanish so that I can use the product in my preferred language.',
    criteria: [
      'The language selector is available on the landing page and workspace shell.',
      'The selected language changes navigation, headings, buttons, labels, empty states and errors without a reload.',
      'The default language is English when no preference exists.',
      'The selected language persists between browser sessions.',
      'Financial values, dates and API data remain unchanged by language switching.',
      'The language selector has an accessible name and visible focus state.',
      'Missing translation keys fall back safely to English.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 18, est: 4, extra: ['design'],
        title: 'Implement typed client-side localization',
        items: ['Create language state and persistence in the existing core structure.', 'Add English and Spanish dictionaries.', 'Add a standalone translation pipe or equivalent typed presentation helper.'],
      },
      {
        repo: 'frontend', day: 18, est: 3, extra: ['testing'],
        title: 'Localize current feature screens and verify fallback behavior',
        items: ['Localize shell, landing, subscriptions, summary, upcoming, simulator and usage screens.', 'Translate known API-provided simulator assumptions where applicable.', 'Test language switching and persistence.'],
      },
    ],
  },
  {
    id: 'HU-26', kind: 'story', title: 'Provide a visible return-to-landing path',
    priority: 'P1', estimate: '1-2 h', estimateH: 1.5, deps: 'EP-01 complete', milestone: 'enhancements',
    story: 'As a workspace user, I want a clear way to return to the FlowTrim landing page so that I can revisit the product introduction.',
    criteria: [
      'The workspace logo provides a clear route to `/` or a dedicated Back to landing action is visible.',
      'The return action works from desktop and mobile workspace layouts.',
      'The action has an accessible name and visible focus state.',
      'Returning to the landing page does not lose persisted theme or language preferences.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 18, est: 1.5,
        title: 'Add explicit workspace-to-landing navigation',
        items: ['Link the workspace brand and a labeled secondary action to `/`.', 'Verify desktop and mobile behavior.'],
      },
    ],
  },
  {
    id: 'HU-27', kind: 'story', title: 'Add purposeful and accessible landing motion',
    priority: 'P1', estimate: '5-8 h', estimateH: 6.5, deps: 'HU-25, HU-26', milestone: 'enhancements',
    story: 'As a landing-page visitor, I want the product story to move and respond with intent so that FlowTrim feels alive without becoming distracting.',
    criteria: [
      'The hero includes restrained entrance and ambient motion that supports hierarchy.',
      'The landing includes an interactive horizontal feature rail using scroll snap or an equivalent native interaction.',
      'Cards have meaningful hover or focus feedback without hiding content.',
      'Motion is implemented with CSS, SVG or a justified lightweight mechanism rather than a large animation dependency.',
      'prefers-reduced-motion disables or minimizes non-essential animation.',
      'Motion does not introduce console errors, layout overflow or blocked keyboard navigation.',
      'The landing remains responsive at mobile, tablet and desktop widths.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 19, est: 4, extra: ['design'],
        title: 'Build landing motion and interactive feature rail',
        items: ['Add CSS keyframe entrance and ambient effects.', 'Add a scroll-snap feature rail with visible controls or natural horizontal scroll.', 'Add card hover and focus states.'],
      },
      {
        repo: 'frontend', day: 19, est: 2.5, extra: ['testing'],
        title: 'Verify reduced motion and responsive behavior',
        items: ['Test prefers-reduced-motion.', 'Test keyboard navigation and mobile overflow.', 'Run browser checks without console or network errors.'],
      },
    ],
  },

  // ---------------- Interaction and Responsive Quality ----------------
  {
    id: 'EP-03', kind: 'epic', title: 'Interaction and Responsive Quality',
    priority: 'P1', estimate: '20-30 h', estimateH: 25, deps: 'EP-02 complete', milestone: 'quality',
    story: 'As a FlowTrim user, I want fluid interactions, modal CRUD and reliable responsive behavior so that the polished visual experience remains practical and trustworthy.',
    criteria: [
      'Landing motion is smooth and does not animate layout properties unnecessarily.',
      'Workspace navigation remains fixed while page content and tables scroll independently.',
      'CRUD operations use accessible icon actions and reusable modal components.',
      'Unsaved form information is protected when a modal is dismissed.',
      'Responsive, keyboard, reduced-motion and code-quality checks pass without warnings.',
    ],
    notes: ['No backend or database changes are required.'],
    tasks: [],
  },
  {
    id: 'HU-28', kind: 'story', title: 'Optimize landing motion performance',
    priority: 'P1', estimate: '3-5 h', estimateH: 4, deps: 'EP-02', milestone: 'quality',
    story: 'As a visitor, I want landing motion to feel fluid so that the visual experience feels intentional rather than slow.',
    criteria: [
      'Motion uses transform and opacity instead of layout-triggering properties where possible.',
      'Hero and card animations remain smooth on supported desktop and mobile browsers.',
      'No unnecessary animation library is added unless a measured requirement justifies it.',
      'prefers-reduced-motion disables non-essential motion.',
      'Browser checks show no visual regressions or console errors.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 20, est: 2, extra: ['design'],
        title: 'Optimize motion primitives and performance',
        items: ['Replace margin-based motion with compositor-friendly transforms.', 'Tune easing and durations.', 'Keep animation ownership near the landing components.'],
      },
      {
        repo: 'frontend', day: 20, est: 2, extra: ['testing'],
        title: 'Verify motion and reduced-motion behavior',
        items: ['Check desktop and mobile browsers.', 'Check reduced-motion preference.', 'Check console and layout stability.'],
      },
    ],
  },
  {
    id: 'HU-29', kind: 'story', title: 'Fix workspace navigation and scroll containment',
    priority: 'P1', estimate: '3-5 h', estimateH: 4, deps: 'EP-01', milestone: 'quality',
    story: 'As a workspace user, I want the sidebar to stay fixed and tables to scroll independently so that navigation remains available while reviewing data.',
    criteria: [
      'Desktop sidebar remains fixed for the full viewport height.',
      'Mobile navigation remains fixed without covering content unexpectedly.',
      'Tables have an isolated scroll viewport with sticky headers where appropriate.',
      'The body does not gain accidental horizontal overflow.',
      'The workspace logo returns to `/app` and the separate landing action returns to `/`.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 20, est: 2, extra: ['design'],
        title: 'Fix fixed shell and table scroll behavior',
        items: ['Use fixed desktop rail and responsive content offsets.', 'Add table viewport and sticky headers.', 'Verify mobile navigation.'],
      },
      {
        repo: 'frontend', day: 20, est: 2, extra: ['testing'],
        title: 'Verify route behavior and overflow containment',
        items: ['Verify workspace and landing links.', 'Check table scroll at supported breakpoints.', 'Check no horizontal overflow.'],
      },
    ],
  },
  {
    id: 'HU-30', kind: 'story', title: 'Add reusable CRUD modals and icon actions',
    priority: 'P1', estimate: '7-10 h', estimateH: 8.5, deps: 'EP-02, HU-29', milestone: 'quality',
    story: 'As a user, I want CRUD actions in accessible modals so that I can manage subscriptions without losing context.',
    criteria: [
      'Create and edit actions open a reusable modal over the subscription list.',
      'Delete opens a confirmation modal with an explicit destructive action.',
      'CRUD actions use accessible icons with labels and tooltips.',
      'Cancel appears before the primary action in modal footers.',
      'Modals close through X, Escape or backdrop click.',
      'Dirty forms ask for confirmation before discarding information.',
      'API validation errors keep the modal open and preserve entered values.',
      'Existing validation and API behavior remains unchanged.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 21, est: 3, extra: ['design'],
        title: 'Create reusable modal and icon UI primitives',
        items: ['Build native dialog modal shell.', 'Build SVG icon component.', 'Add focus, close and backdrop behavior.'],
      },
      {
        repo: 'frontend', day: 21, est: 5.5, extra: ['testing'],
        title: 'Integrate CRUD modal flows',
        items: ['Move create/edit flows into modal mode.', 'Add delete confirmation.', 'Protect dirty forms and verify API errors.'],
      },
    ],
  },
  {
    id: 'HU-31', kind: 'story', title: 'Refine landing commercial content',
    priority: 'P1', estimate: '4-6 h', estimateH: 5, deps: 'EP-02', milestone: 'quality',
    story: 'As a new visitor, I want a clear commercial story so that I understand the problem, the solution and why FlowTrim is useful.',
    criteria: [
      'Landing explains the objective, the recurring-spend problem and the FlowTrim solution.',
      'Sections use visual storytelling without fabricating financial claims.',
      'The interactive rail supports the commercial narrative.',
      'Calls to action route to the workspace and remain visible in both languages.',
      'Responsive and reduced-motion behavior remains intact.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 22, est: 3, extra: ['design'],
        title: 'Add objective, problem and solution sections',
        items: ['Create narrative sections.', 'Add visual diagrams/cards.', 'Keep claims honest and product-aligned.'],
      },
      {
        repo: 'frontend', day: 22, est: 2, extra: ['testing'],
        title: 'Verify commercial landing content',
        items: ['Check both languages.', 'Check responsive layout.', 'Check CTA and scroll behavior.'],
      },
    ],
  },
  {
    id: 'HU-32', kind: 'story', title: 'Complete responsive, accessibility and code-quality QA',
    priority: 'P1', estimate: '3-5 h', estimateH: 4, deps: 'HU-28, HU-29, HU-30, HU-31', milestone: 'quality',
    story: 'As a maintainer, I want the frontend to be verified for responsiveness, accessibility and scalable code practices so that future features do not regress the experience.',
    criteria: [
      'Strict TypeScript and Angular template checks pass.',
      'Unit tests and production build pass without errors or warnings.',
      'Code uses English identifiers and existing architecture patterns.',
      'Reusable modal, icon, localization and table behaviors are covered by focused tests.',
      'Browser QA covers desktop, tablet and mobile layouts.',
      'Keyboard, focus, modal, reduced-motion and language switching behavior are verified.',
      'No console errors, failed requests or accidental overflow remain.',
    ],
    tasks: [
      {
        repo: 'frontend', day: 23, est: 2, extra: ['testing'],
        title: 'Run responsive accessibility and code-quality checks',
        items: ['Check supported viewport matrix.', 'Check keyboard and screen-reader labels.', 'Run formatting and strict build checks.'],
      },
      {
        repo: 'frontend', day: 23, est: 2, extra: ['testing', 'docs'],
        title: 'Run regression QA and update documentation',
        items: ['Run unit tests and production build.', 'Run browser smoke tests for CRUD and landing.', 'Update screenshots and README if visual behavior changed.'],
      },
    ],
  },
];

export default { config, labels, milestones, stories, dod };
