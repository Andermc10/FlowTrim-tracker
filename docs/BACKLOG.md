# Backlog de FlowTrim

> Generado desde `scripts/data.mjs`. No editar a mano: edita el archivo de datos y ejecuta `node scripts/generate-backlog.mjs`.

## Resumen

| ID | Historia | Prioridad | Estimación | Dependencias | Tareas |
|---|---|---|---|---|---|
| EP-00 | Preparación del repositorio, entorno y arquitectura | P0 | Día 1 · 5 h | Ninguna | 4 |
| HU-01 | Registrar suscripción | P0 | 5–7 h | Dominio y persistencia (EP-00) | 4 |
| HU-02 | Consultar y mantener suscripciones | P0 | 5–7 h | HU-01 | 2 |
| HU-03 | Ver resumen financiero | P0 | 3–4 h | HU-01, HU-02 | 3 |
| HU-04 | Consultar próximos cobros y cuenta regresiva | P0 | 3–4 h | HU-01 | 3 |
| HU-05 | Registrar uso de una suscripción | P1 | 3–4 h | HU-01 | 3 |
| HU-06 | Calcular costo por uso | P1 | 2–3 h | HU-05 | 2 |
| HU-07 | Simular cancelación y ahorro potencial | P0 | 4–6 h | HU-01, HU-03 | 2 |
| HU-08 | Integrar Angular con la API | P0 | 5–7 h | HU-01, HU-02 | 3 |
| HU-09 | Validaciones y manejo de errores | P0 | 3–5 h | Transversal | 3 |
| HU-10 | Pruebas automatizadas de reglas financieras | P0 | 4–6 h | HU-03, HU-04, HU-06, HU-07 | 5 |
| HU-11 | Documentar y presentar el proyecto | P0 | 3–5 h | Todas las historias principales | 5 |
| HU-12 | Autenticación y aislamiento multiusuario | P2 | 8–14 h | MVP estable | 0 |
| HU-13 | Notificaciones externas programadas | P2 | 6–10 h | Fechas y configuración | 0 |
| HU-14 | Importar movimientos desde CSV | P2 | 6–10 h | Modelo de transacciones futuro | 0 |
| HU-15 | Extraer motor analítico a Python/FastAPI | P3 | 8–12 h | Necesidad técnica validada | 0 |

## EP-00: Preparación del repositorio, entorno y arquitectura

**Prioridad:** P0 · **Estimación:** Día 1 · 5 h · **Dependencias:** Ninguna

> Dejar el entorno listo para programar: solución .NET por capas, PostgreSQL local reproducible, health check y SPA Angular compilando (Fase 0 del plan).

**Criterios de aceptación**

- [ ] La solución .NET 10 compila con `dotnet build` y respeta la regla de dependencias entre capas.
- [ ] PostgreSQL arranca con `docker compose up` y es accesible desde la API usando secretos locales (nada sensible en Git).
- [ ] `GET /api/health` responde 200 si API y BD están operativas y indica indisponibilidad sin exponer detalles internos si la BD cae.
- [ ] La app Angular compila con `npm run build`.
- [ ] Estructura versionada y README inicial actualizado.

**Reglas y notas**

- Arquitectura: monolito modular por capas (un único backend desplegable, sin microservicios).
- Regla de dependencias: Api → Application + Infrastructure; Application → Domain; Infrastructure → Domain/Application; Domain no depende de nada.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 1 | backend | Crear solución .NET 10 con proyectos por capas | 1.5 h |
| 1 | backend | PostgreSQL con Docker Compose y secretos locales | 1.5 h |
| 1 | backend | Endpoint GET /api/health (API + base de datos) | 1 h |
| 1 | frontend | Inicializar aplicación Angular (TypeScript + SCSS) | 1 h |

## HU-01: Registrar suscripción

**Prioridad:** P0 · **Estimación:** 5–7 h · **Dependencias:** Dominio y persistencia (EP-00)

> Como usuario, quiero registrar una suscripción con nombre, importe, moneda, ciclo y próxima fecha de cobro para centralizar mis gastos recurrentes.

**Criterios de aceptación**

- [ ] Dado un formulario válido, cuando lo envío, entonces la API crea el registro y devuelve su identificador.
- [ ] El nombre no puede estar vacío y el importe debe ser mayor que cero.
- [ ] El ciclo de cobro debe pertenecer a los valores admitidos.
- [ ] La suscripción creada aparece en el listado y persiste tras reiniciar la API.
- [ ] Si los datos no son válidos, la API devuelve 400 con errores comprensibles y no persiste el registro.

**Reglas y notas**

- Ciclos del MVP: mensual y anual (ampliar solo si no compromete el alcance).
- Moneda por defecto: COP. Estados: activa / inactiva.
- No exponer entidades de EF directamente: usar DTO de creación/actualización y de respuesta.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 2 | backend | Dominio: entidad Subscription, enums y reglas | 2 h |
| 2 | backend | Persistencia: DbContext, mapeo EF Core y migración inicial | 2 h |
| 3 | backend | API: DTOs y POST /api/subscriptions | 2 h |
| 7 | frontend | UI: formulario de alta de suscripción | 2 h |

## HU-02: Consultar y mantener suscripciones

**Prioridad:** P0 · **Estimación:** 5–7 h · **Dependencias:** HU-01

> Como usuario, quiero consultar, editar y eliminar mis suscripciones para mantener los datos actualizados.

**Criterios de aceptación**

- [ ] El listado devuelve las suscripciones existentes con paginación o un límite razonable definido.
- [ ] Consultar un identificador existente devuelve 200; uno inexistente devuelve 404.
- [ ] Editar datos válidos actualiza el registro persistido.
- [ ] Eliminar un registro existente devuelve 204 y deja de aparecer en consultas posteriores.
- [ ] La interfaz confirma la eliminación y muestra errores si la operación falla.

**Reglas y notas**

- Códigos HTTP: 200 consulta/edición, 204 eliminación, 404 inexistente, 400 datos inválidos.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 3 | backend | API: listado (con límite/paginación), detalle, edición y eliminación | 3 h |
| 7 | frontend | UI: listado con búsqueda simple, edición y eliminación con confirmación | 3 h |

## HU-03: Ver resumen financiero

**Prioridad:** P0 · **Estimación:** 3–4 h · **Dependencias:** HU-01, HU-02

> Como usuario, quiero ver mi gasto mensual equivalente y una proyección anual para entender el costo de mis suscripciones.

**Criterios de aceptación**

- [ ] Los importes mensuales se consideran equivalentes al importe mensual.
- [ ] Los importes anuales se normalizan dividiendo el importe por 12.
- [ ] La proyección anual corresponde a la suma de costos mensuales equivalentes multiplicada por 12.
- [ ] Los servicios inactivos no se incluyen en el gasto activo, según la regla documentada.
- [ ] El sistema no suma importes de monedas diferentes sin una conversión explícita.
- [ ] Con cero suscripciones, los totales devueltos son cero y la interfaz muestra un estado vacío.

**Reglas y notas**

- Fórmulas: mensual = importe; anual = importe / 12; proyección anual = Σ mensual equivalente × 12.
- Supone precios constantes y servicios vigentes. Sin conversión de divisas en el MVP.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 4 | backend | Servicio financiero: costo mensual equivalente y proyección anual | 2 h |
| 5 | backend | API: GET /api/summary (total mensual, proyección anual, activas) | 2 h |
| 8 | frontend | Dashboard: tarjetas de resumen financiero | 2 h |

## HU-04: Consultar próximos cobros y cuenta regresiva

**Prioridad:** P0 · **Estimación:** 3–4 h · **Dependencias:** HU-01

> Como usuario, quiero ver los próximos cobros y los días restantes para anticiparme a las renovaciones.

**Criterios de aceptación**

- [ ] Los próximos cobros se ordenan por fecha ascendente.
- [ ] La cuenta regresiva usa una fecha de referencia definida y no depende de cálculos inconsistentes del navegador.
- [ ] La interfaz diferencia cobros pasados, de hoy y próximos.
- [ ] Una fecha pasada no se presenta como un cobro futuro.
- [ ] Las alertas del MVP son visuales dentro de la aplicación; no se afirma que se haya enviado un correo o push.

**Reglas y notas**

- Ventanas de alerta: vencido, hoy, próximos 3 días, próximos 7 días.
- Definir zona horaria y fecha de referencia (cálculo en el servidor).
- Una renovación prevista no equivale a una transacción confirmada.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 4 | backend | Cálculo de días hasta el próximo cobro | 1.5 h |
| 5 | backend | API: próximos cobros ordenados y ventanas de alerta | 2 h |
| 8 | frontend | Panel de próximos cobros con cuenta regresiva y alertas visuales | 2 h |

## HU-05: Registrar uso de una suscripción

**Prioridad:** P1 · **Estimación:** 3–4 h · **Dependencias:** HU-01

> Como usuario, quiero registrar la frecuencia con la que uso una suscripción para conservar un historial de aprovechamiento.

**Criterios de aceptación**

- [ ] Solo se pueden crear registros asociados a una suscripción existente.
- [ ] La fecha es válida y la cantidad de usos no puede ser negativa.
- [ ] Los registros quedan persistidos y se pueden consultar por suscripción y periodo.
- [ ] La interfaz muestra un mensaje de éxito o error según el resultado de la API.

**Reglas y notas**

- `UsageRecord`: Id, SubscriptionId, UsageDate, UsageCount, Notes (opcional). El uso es declarado por el usuario, no verificado.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 6 | backend | Dominio y persistencia: UsageRecord y migración | 1.5 h |
| 6 | backend | API: registrar y consultar usos por suscripción y periodo | 2 h |
| 9 | frontend | UI: registrar uso con mensajes de éxito/error | 1.5 h |

## HU-06: Calcular costo por uso

**Prioridad:** P1 · **Estimación:** 2–3 h · **Dependencias:** HU-05

> Como usuario, quiero conocer el costo por uso declarado durante un periodo para detectar servicios poco aprovechados.

**Criterios de aceptación**

- [ ] El cálculo utiliza el costo correspondiente al mismo periodo que los usos registrados.
- [ ] Si hay usos válidos, el costo por uso se calcula como total del periodo dividido entre usos.
- [ ] Si no hay registros o el total de usos es cero, se devuelve un estado no calculable, sin dividir por cero.
- [ ] La interfaz indica que la frecuencia de uso es declarada por el usuario y no verificada automáticamente.

**Reglas y notas**

- Sin datos suficientes → mostrar «sin datos suficientes»; nunca infinito ni error de división.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 6 | backend | Servicio de costo por uso y endpoint con estado no calculable | 2 h |
| 9 | frontend | UI: mostrar costo por uso y aviso de uso declarado | 1.5 h |

## HU-07: Simular cancelación y ahorro potencial

**Prioridad:** P0 · **Estimación:** 4–6 h · **Dependencias:** HU-01, HU-03

> Como usuario, quiero seleccionar suscripciones y simular su cancelación para comparar el gasto actual con el ahorro potencial.

**Criterios de aceptación**

- [ ] La selección de servicios recalcula el escenario sin persistir cancelaciones reales.
- [ ] El ahorro se calcula con el costo mensual equivalente de los elementos seleccionados por el horizonte elegido.
- [ ] El usuario puede comparar el escenario base y el escenario simulado.
- [ ] Los supuestos de precios constantes y ausencia de penalizaciones se muestran junto al resultado.
- [ ] La simulación admite una selección vacía y devuelve ahorro cero.

**Reglas y notas**

- Ahorro = Σ costo mensual equivalente seleccionado × meses. Horizontes iniciales: 1, 12 y 24 meses (o seleccionable).
- No es ahorro garantizado: puede haber impuestos, cambios de precio o penalizaciones.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 9 | backend | Servicio y endpoint de simulación de ahorro (sin persistir) | 2 h |
| 9 | frontend | Simulador: selección, comparación base vs escenario y supuestos visibles | 3 h |

## HU-08: Integrar Angular con la API

**Prioridad:** P0 · **Estimación:** 5–7 h · **Dependencias:** HU-01, HU-02

> Como usuario, quiero gestionar mis datos desde la interfaz web para no tener que llamar manualmente a los endpoints.

**Criterios de aceptación**

- [ ] El frontend consulta y modifica los datos a través de la API.
- [ ] No se usan datos hardcodeados como fuente final de las operaciones principales.
- [ ] Se muestran estados de carga, vacío, éxito y error.
- [ ] La configuración de URL de API se puede cambiar por entorno.
- [ ] CORS permite el origen de desarrollo requerido sin abrir indiscriminadamente todos los orígenes en producción.

**Reglas y notas**

- Integración real desde el Día 7 para detectar problemas pronto.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 7 | frontend | Base Angular: layout, navegación, estilos SCSS y tipos TypeScript | 2 h |
| 7 | frontend | Servicio HTTP, environments (apiUrl) y estados carga/vacío/éxito/error | 3 h |
| 7 | backend | CORS: permitir el origen de desarrollo de Angular | 1 h |

## HU-09: Validaciones y manejo de errores

**Prioridad:** P0 · **Estimación:** 3–5 h · **Dependencias:** Transversal

> Como usuario, quiero recibir mensajes comprensibles cuando una operación no puede completarse para corregir mis datos.

**Criterios de aceptación**

- [ ] Los errores de validación se devuelven con un formato consistente.
- [ ] Los errores internos no exponen stack traces ni secretos al cliente.
- [ ] La API usa códigos HTTP coherentes para éxito, validación y recurso inexistente.
- [ ] La interfaz presenta un mensaje accionable sin bloquearse.

**Reglas y notas**

- Códigos esperados: 200, 201, 204, 400, 404 (y 500 genérico sin detalles internos).

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 3 | backend | Middleware global de excepciones (sin stack traces ni secretos) | 1.5 h |
| 3 | backend | Validaciones centralizadas y formato de error 400 consistente | 1.5 h |
| 8 | frontend | Interceptor HTTP y mensajes de error accionables | 1.5 h |

## HU-10: Pruebas automatizadas de reglas financieras

**Prioridad:** P0 · **Estimación:** 4–6 h · **Dependencias:** HU-03, HU-04, HU-06, HU-07

> Como desarrollador, quiero verificar automáticamente las reglas de negocio para reducir regresiones.

**Criterios de aceptación**

- [ ] Existen pruebas para normalización mensual/anual, proyección, fechas y costo por uso.
- [ ] Se cubren importes inválidos, listas vacías, cero usos y servicios inactivos.
- [ ] Las pruebas se ejecutan con dotnet test.
- [ ] Las pruebas no requieren datos personales ni credenciales reales.

**Reglas y notas**

- Las pruebas se escriben junto con cada regla (no al final). Pruebas de integración se añaden cuando corresponda.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 4 | backend | Pruebas xUnit: normalización mensual/anual y proyección anual | 2 h |
| 5 | backend | Pruebas xUnit: fechas, días restantes y ventanas de alerta | 1.5 h |
| 6 | backend | Pruebas xUnit: costo por uso (casos límite) | 1.5 h |
| 9 | backend | Pruebas xUnit: simulador de ahorro | 1.5 h |
| 9 | backend | Ejecutar lista de pruebas manuales de aceptación E2E | 2 h |

## HU-11: Documentar y presentar el proyecto

**Prioridad:** P0 · **Estimación:** 3–5 h · **Dependencias:** Todas las historias principales

> Como reclutador o desarrollador, quiero entender cómo ejecutar y evaluar FlowTrim para verificar su calidad.

**Criterios de aceptación**

- [ ] README describe problema, funciones, arquitectura y stack real.
- [ ] Incluye instrucciones de instalación y ejecución local.
- [ ] Documenta configuración de secretos sin publicar valores sensibles.
- [ ] Incluye endpoints principales, capturas y limitaciones conocidas.
- [ ] Las funciones pendientes no se presentan como terminadas.

**Reglas y notas**

- Despliegue público: objetivo de cierre solo si el tiempo y los proveedores lo permiten; si no, guía reproducible y tarea futura.

**Tareas técnicas**

| Día | Repo | Tarea | Est. |
|---|---|---|---|
| 10 | backend | Revisión de calidad y seguridad previa al release | 1.5 h |
| 10 | backend | README backend: arquitectura, instalación, secretos y endpoints | 2 h |
| 10 | frontend | README frontend: instalación, configuración de API y capturas | 1.5 h |
| 10 | backend | Crear release/etiqueta inicial y anotar mejoras futuras | 0.5 h |
| 10 | backend | (Opcional) Despliegue público de API, BD y frontend | 2 h |

## HU-12: Autenticación y aislamiento multiusuario

**Prioridad:** P2 · **Estimación:** 8–14 h · **Dependencias:** MVP estable · _Post-MVP_

> Como usuario, quiero iniciar sesión y ver solo mis suscripciones para proteger mis datos financieros.

**Criterios de aceptación**

- [ ] (Propuesto, por refinar) Registro e inicio de sesión seguros.
- [ ] (Propuesto, por refinar) Cada usuario solo puede leer/modificar sus propios datos.
- [ ] (Propuesto, por refinar) Endpoints protegidos y pruebas de autorización.

**Reglas y notas**

- Necesario antes de ofrecer el servicio públicamente con datos privados.

## HU-13: Notificaciones externas programadas

**Prioridad:** P2 · **Estimación:** 6–10 h · **Dependencias:** Fechas y configuración · _Post-MVP_

> Como usuario, quiero recibir recordatorios antes de un cobro para no sorprenderme.

**Criterios de aceptación**

- [ ] (Propuesto, por refinar) Preferencias de recordatorio configurables.
- [ ] (Propuesto, por refinar) Tareas en segundo plano que envían correo/push antes del cobro.

**Reglas y notas**

- Fuera del MVP: las alertas del MVP son solo visuales dentro de la aplicación.

## HU-14: Importar movimientos desde CSV

**Prioridad:** P2 · **Estimación:** 6–10 h · **Dependencias:** Modelo de transacciones futuro · _Post-MVP_

> Como usuario, quiero importar movimientos desde un CSV para detectar cobros recurrentes sin digitarlos.

**Criterios de aceptación**

- [ ] (Propuesto, por refinar) Validación y vista previa antes de importar.
- [ ] (Propuesto, por refinar) Separar historial de transacciones confirmadas de fechas previstas.

## HU-15: Extraer motor analítico a Python/FastAPI

**Prioridad:** P3 · **Estimación:** 8–12 h · **Dependencias:** Necesidad técnica validada · _Post-MVP_

> Como desarrollador, quiero extraer el motor analítico a un servicio independiente solo si existe una necesidad analítica concreta.

**Criterios de aceptación**

- [ ] (Propuesto, por refinar) Existe una necesidad medible que justifica el microservicio.
- [ ] (Propuesto, por refinar) Contrato HTTP documentado y pruebas de integración.

**Reglas y notas**

- No es dependencia del MVP; la proyección determinista es suficiente.
