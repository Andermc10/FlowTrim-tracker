# FlowTrim 3.0 — Plan de pruebas manual y de seguridad

> Guía personal en español para validar **cada módulo y cada modal** de FlowTrim a mano, más un bloque de pruebas críticas de seguridad y las herramientas recomendadas.
> Cada caso dice **qué hacer**, **cómo funciona por dentro** y **qué debe pasar exactamente**. Marca ✅/❌ en la columna *Resultado* y anota el `Reference`/`correlationId` si algo falla.
> Los textos de la interfaz se citan en inglés (idioma por defecto); en español deben aparecer traducidos.

---

## 0. Preparación (una sola vez)

| # | Paso | Resultado esperado |
|---|---|---|
| 0.1 | Abrir Docker Desktop y ejecutar `docker start flowtrim-postgres` | `docker ps` muestra `flowtrim-postgres … (healthy)` |
| 0.2 | En `FlowTrim-backend/src/FlowTrim.Api`: `dotnet run --launch-profile http` | Arranca en `http://localhost:5214`. Si faltan `Authentication:Authority/Audience` en User Secrets **no arranca** (fail fast, a propósito) |
| 0.3 | Abrir `http://localhost:5214/api/health` | `200` con API y base de datos `Healthy`. Con el contenedor parado → `503` (sin detalles internos) |
| 0.4 | En `FlowTrim-frontend` (Node 22.23.3): `npx ng serve` | `http://localhost:4200` sirve la landing |
| 0.5 | Tener **dos cuentas Auth0** (A y B) y dos navegadores/perfiles (uno normal y uno incógnito) | Se usan para las pruebas de aislamiento |
| 0.6 | Fecha de referencia | Todas las fechas "hoy" usan **America/Bogota (UTC−5)**. Si pruebas cerca de medianoche, ten en cuenta que el "hoy" del producto puede ser distinto al de UTC |

**Datos semilla sugeridos** (los usarás en todo el plan, crea en este orden):

- Cuentas: `Cash wallet` (Cash, COP, 200 000) · `Main bank` (Bank, COP, 2 000 000) · `Visa` (CreditCard, COP, −300 000) · `USD savings` (Savings, USD, 500).
- Pagos recurrentes: `Netflix` (Subscription, 38 900 COP, Monthly, próxima fecha = hoy + 2) · `Rent` (Bill, 1 200 000 COP, Monthly, hoy + 10) · `Phone` (Bill, 25 000 COP, Weekly, hoy + 1) · `Laptop` (Instalment, 300 000 COP, Monthly, 3 cuotas, 1 pagada, hoy + 5) · `Domain` (Subscription, 15 USD, Yearly, hoy + 40).

---

## 1. Landing (`/`)

**Cómo funciona:** página pública, sin login. Las cifras de las ilustraciones salen de `landing-sample.ts`, calculadas con las fórmulas reales, y están marcadas como *Sample data*. GSAP se carga bajo demanda (import dinámico) solo aquí y **nunca** si el sistema pide movimiento reducido.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 1.1 | Abrir `/` | Hero "Know what you can spend today.", etiqueta **Sample data** visible en los mock-ups | |
| 1.2 | Pulsar `Tab` una vez | Aparece el enlace **Skip to content**; Enter salta al contenido principal | |
| 1.3 | Navegación: *How it works*, *Subscriptions*, *The formula* | Hace scroll a cada sección | |
| 1.4 | Pantalla ≥ 760 px, hacer scroll por "How it works" | La escena queda fija (pinned) y avanza **un paso a la vez** (4 pasos) | |
| 1.5 | Ventana < 760 px | Sin pinning: los pasos aparecen apilados con revelado suave; **sin scroll horizontal** | |
| 1.6 | Windows → Configuración → Accesibilidad → desactivar *Efectos de animación*, recargar | Página completa y estática; en DevTools › Network **no** se descarga el chunk de GSAP | |
| 1.7 | Botón de tema (claro/oscuro) | Cambia el tema, se guarda y persiste al recargar | |
| 1.8 | Botón de idioma | Todos los textos pasan a español; persiste al recargar | |
| 1.9 | **Open workspace** sin sesión | Redirige a `/auth/login` | |
| 1.10 | Ruta inexistente `/xyz` | Página *Not found* | |
| 1.11 | Rutas antiguas `/summary`, `/upcoming`, `/simulator`, `/new` | Redirigen a `/app/summary`, `/app/upcoming`, `/app/simulator`, `/app/subscriptions/new` | |

## 2. Autenticación (`/auth/login`, `/auth/callback`)

**Cómo funciona:** OIDC con Auth0 y **PKCE S256**. El `state`, el `code_verifier` y la URL de retorno se guardan en `sessionStorage`; la URL de retorno se sanea (`toSafeReturnUrl`) para que solo apunte dentro de la app. El token de acceso vive en `sessionStorage` (se pierde al cerrar la pestaña). El API valida emisor, audiencia, firma y que exista `sub`; `owner_id` = `sub`.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 2.1 | `/auth/login` → **Continue with secure sign-in** | Texto "Redirecting to secure sign-in..." y redirección a `dev-flowtrim.us.auth0.com` | |
| 2.2 | Iniciar sesión con la cuenta A | Pasa por `/auth/callback` ("Finishing secure sign-in...") y llega a `/app` (Today). En localhost Auth0 muestra pantalla de consentimiento (normal) | |
| 2.3 | Sin sesión, abrir directamente `/app/budgets` | Login → tras autenticar vuelve a `/app/budgets` | |
| 2.4 | Abrir `/auth/callback?code=x&state=otro` a mano | Error de inicio de sesión con motivo y botón **Back to sign-in**; nunca entra al workspace | |
| 2.5 | DevTools › Application › Session Storage: borrar `flowtrim.access_token` y hacer cualquier acción | El API responde `401` → aviso "Your session expired. Sign in again to continue." y vuelta al login | |
| 2.6 | **Sign out** | Sale de inmediato sin esperar la red ("Signing out..."), cierra sesión en Auth0 y vuelve a la landing; el aviso de cobros se reinicia | |
| 2.7 | Tras salir, botón *Atrás* del navegador hacia `/app` | Pide login de nuevo; no se ven datos cacheados | |

## 3. Shell del workspace (todas las pantallas `/app/*`)

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 3.1 | Escritorio | Rail lateral fijo con grupos **Daily** (Today, Transactions, Accounts, Categories, Calendar, Budgets, Goals), **Recurring payments** (Overview, Recurring payments, Upcoming, Simulator), **Tools** (Analytics & reports, AI Assistant) | |
| 3.2 | Móvil (360 px, DevTools) | Barra inferior con 4 accesos + **More** que abre el resto; sin scroll horizontal | |
| 3.3 | Título de la pestaña del navegador | Traducido según la pantalla (p. ej. "Budgets" / "Presupuestos") | |
| 3.4 | Botón de sonido de alertas | Alterna "Alert sound: on/off" (opt-in, Web Audio); persiste | |
| 3.5 | **Back to landing** | Vuelve a `/` | |
| 3.6 | Bajar mucho en una lista larga | Aparece **Back to top**; al pulsarlo sube | |
| 3.7 | Tecla `N` en cualquier pantalla (sin foco en un campo) | Abre el modal **Quick add** (ver §6) | |
| 3.8 | Aviso de cobros al entrar | **Una vez por sesión**, un toast agrupado "N charges need attention" con los cobros vencidos/hoy/≤ 3 días (con los datos semilla: Phone mañana, Netflix en 2 días). Si hay vencidos, el toast es de error y no se cierra solo. Botón **View upcoming charges** → `/app/upcoming` | |
| 3.9 | Navegar a otra pantalla y volver | El aviso **no** se repite en la misma sesión | |

### 3.A Comportamiento común de modales (aplica a TODOS)

**Cómo funciona:** modales nativos `<dialog>` reutilizables (`core/ui/modal`). Los formularios llevan control de cambios sin guardar ("dirty"). Los toasts están en un *popover* para quedar por encima de los modales.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 3.A.1 | Abrir cualquier modal de formulario | El foco va al primer campo; el lector de pantalla anuncia el título (nombre accesible) | |
| 3.A.2 | `Tab` repetido | El foco no se escapa del modal | |
| 3.A.3 | `Esc` o la **X** ("Close dialog") **sin cambios** | Se cierra sin preguntar | |
| 3.A.4 | Escribir algo y luego `Esc`/X/Cancel | Modal **Discard unsaved changes?** con **Keep editing** (vuelve con los datos intactos) y **Discard changes** (cierra y descarta) | |
| 3.A.5 | Al cerrar | El foco vuelve al botón que abrió el modal | |
| 3.A.6 | Toast de error con referencia | Muestra `Ref <id>` y botón **Copy** → "Copied"; el id coincide con la cabecera `X-Correlation-ID` de la respuesta | |
| 3.A.7 | Movimiento reducido activado | Toasts sin animación de muelle/temblor | |

### 3.B Validación de formularios (aplica a TODOS)

Los mensajes de error aparecen **al salir del campo o al intentar guardar**, no mientras escribes por primera vez. El botón de guardar no envía si hay errores. El backend vuelve a validar (es la autoridad): si se salta el frontend, responde `400` ProblemDetails con errores por campo.

---

## 4. Accounts (`/app/accounts`)

**Cómo funciona:** el saldo **nunca se guarda**; se calcula en SQL: `saldo inicial + ingresos + transferencias entrantes − gastos − transferencias salientes`. *In your accounts* suma por moneda las cuentas no archivadas de tipo Cash/Bank/Savings; las tarjetas de crédito van aparte (*Credit cards*, dinero prestado).

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 4.1 | Primera visita sin cuentas | "You have no accounts yet…" + botón **Add your first account** | |
| 4.2 | **New account** → modal *New account* | Campos: Name, Account type (Cash/Bank/Credit card/Savings), Currency, Opening balance | |
| 4.3 | Guardar vacío | "Name is required." · "Enter the opening balance (0 if it is empty)." | |
| 4.4 | Nombre de 61 caracteres | "Name must be at most 60 characters." | |
| 4.5 | Moneda `CO` o `cop1` | "Currency must be a 3-letter code (e.g. COP)." | |
| 4.6 | Crear las 4 cuentas semilla | Toast `"Main bank" was added to your accounts.` por cada una | |
| 4.7 | Crear otra `main bank` (mismo nombre, otras mayúsculas) | Rechazado: el nombre es único por usuario **sin distinguir mayúsculas** | |
| 4.8 | Totales | COP *In your accounts* = 200 000 + 2 000 000 = **2 200 000**; *Credit cards* COP muestra **300 000 owed**; USD = **500**. Nunca se suman COP y USD | |
| 4.9 | Saldo inicial negativo en `Visa` | Permitido; se muestra como deuda (**Owed**) | |
| 4.10 | **Edit account** → cambiar nombre → Save | Toast `"…" was updated.` | |
| 4.11 | **Archive** `Cash wallet` | Toast "…was archived. Its history is kept."; pasa a *Archived accounts*; sale de los totales y de los selectores | |
| 4.12 | **Restore** | Toast "…is active again."; vuelve a los totales | |
| 4.13 | **Delete account** en una cuenta **sin** transacciones | Modal de confirmación → eliminada → toast "…was deleted." | |
| 4.14 | Delete en una cuenta **con** transacciones (después de §6) | Modal **This account cannot be deleted** ("…has transactions… Archive it instead") — el API devuelve `409 account_has_transactions` | |
| 4.15 | Editar la moneda de una cuenta con transacciones | Campo bloqueado con "The currency cannot change because the account has transactions." (API `409 account_currency_locked`) | |
| 4.16 | Archivar todas las cuentas | "All your accounts are archived." | |

## 5. Categories (`/app/categories`)

**Cómo funciona:** la primera vez se crea un set por defecto (**11 de gasto + 3 de ingreso**) en el idioma de la petición (`Accept-Language`). Color e icono salen de listas cerradas.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 5.1 | Primera visita con la cuenta en **español** (usuario nuevo) | 14 categorías por defecto en español, agrupadas en *Expenses* / *Income* | |
| 5.2 | Recargar varias veces | No se duplican (`INSERT … ON CONFLICT DO NOTHING`) | |
| 5.3 | **Expense category** → modal *New category* | Campos: Name, Kind, Color (10), Icon (16) | |
| 5.4 | Nombre de 41 caracteres | "Name must be at most 40 characters." | |
| 5.5 | Crear `Restaurants` (Expense, red, food) | Toast `"Restaurants" was added to your categories.` | |
| 5.6 | Crear otra `Restaurants` de tipo Income | **Permitido** (único por nombre + tipo) | |
| 5.7 | Editar color/icono | Se ve el nuevo color en la lista y en las transacciones | |
| 5.8 | Archive / Restore | Toasts "…was archived. Old transactions keep it." / "…is active again."; archivada no aparece en selectores | |
| 5.9 | Delete sin uso | Eliminada, toast "…was deleted." | |
| 5.10 | Delete con transacciones | Modal **This category cannot be deleted** (`409 category_in_use`) | |
| 5.11 | Cambiar Kind de una categoría usada | Bloqueado: "The kind cannot change because the category has transactions." (`409 category_kind_locked`) | |

## 6. Transactions (`/app/transactions`) y Quick add

**Cómo funciona:** tipos Income / Expense / Transfer. La moneda es la de la cuenta. Las transferencias solo van entre cuentas de la **misma moneda** y **nunca** cuentan como ingreso ni gasto. Fecha ≤ hoy (Bogotá). No se aceptan cuentas/categorías archivadas para datos nuevos. Página de 50 con **Load more**.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 6.1 | Sin cuentas | "Add an account first: every transaction belongs to one." | |
| 6.2 | **Add transaction** → modal *New transaction* | Selector de tipo, Account, Category (chips ordenados por uso en 90 días), Amount, Date (hoy por defecto), Description, Note | |
| 6.3 | Guardar vacío | "Choose an account." · "Choose a category." · importe requerido | |
| 6.4 | Fecha de mañana | "The date cannot be in the future." | |
| 6.5 | Descripción de 141 / nota de 501 caracteres | "Description must be at most 140 characters." / "Note must be at most 500 characters." | |
| 6.6 | Importe `0` o negativo | Rechazado (debe ser > 0) | |
| 6.7 | Gasto 50 000 en `Main bank`, categoría Food | Toast "Transaction recorded."; fila agrupada bajo el día de hoy con `−50 000`; saldo de Main bank = **1 950 000** | |
| 6.8 | Ingreso 1 000 000 en `Main bank` (Salary) | Saldo = **2 950 000**; totales del mes: Income 1 000 000, Expenses 50 000, Net 950 000 | |
| 6.9 | Transferencia 100 000 de `Main bank` a `Cash wallet` | El selector *To account* solo muestra cuentas COP ("Only accounts in the same currency…"); saldos 2 850 000 / 300 000; **Income/Expenses del mes no cambian** | |
| 6.10 | Intentar transferir a `USD savings` | No aparece como destino; forzando el API → `400` | |
| 6.11 | Transferencia a la misma cuenta | Rechazada | |
| 6.12 | Editar la transacción (icono lápiz) | Modal *Edit transaction*; al guardar, toast "Transaction updated." y el saldo se recalcula | |
| 6.13 | Delete → modal "This removes the transaction and updates the account balance:" | Toast "Transaction deleted."; saldo recalculado | |
| 6.14 | Mes anterior / siguiente | Cambia el mes; mes vacío → "No transactions this month yet." | |
| 6.15 | Filtros: cuenta, categoría, tipo, búsqueda | Combinables; sin resultados → "No transactions match these filters." · **Clear filters** los limpia. Filtrar por cuenta **incluye las transferencias entrantes** | |
| 6.16 | Buscar `%` o `_` | Se tratan como texto literal (búsqueda `ILIKE` escapada), no como comodines | |
| 6.17 | Crear > 50 transacciones en un mes (o usar el import) | Aparece **Load more** y trae las siguientes | |
| **Quick add** | | | |
| 6.18 | Pulsar `N` (o botón **Add** del encabezado / FAB en móvil) | Modal **Quick add** con la **última cuenta usada** preseleccionada (`localStorage`) | |
| 6.19 | Teclear importe → `Tab` a un chip de categoría → `Enter` | Guarda sin ratón; toast "Expense recorded · Food · 12 000" | |
| 6.20 | **Save and add another** | Guarda y deja el formulario listo para otra | |
| 6.21 | Quick add sin cuentas | "You need an account before recording a transaction…" | |
| 6.22 | Pulsar `N` con el foco dentro de un campo de texto | Escribe la letra; **no** abre el modal | |

## 7. Bank CSV import (`/app/transactions/import`)

**Cómo funciona:** vista previa **sin estado** — nada se guarda hasta confirmar; al confirmar se reenvía el mismo archivo. Importes negativos = gasto, positivos = ingreso. Filas que ya existen en la cuenta se saltan (bloqueo por usuario con `pg_advisory_xact_lock`). Límites: `.csv`, 256 KB, 500 filas.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 7.1 | Abrir desde **Import CSV** en Transactions | Aviso "Nothing is saved until you confirm. Rows already in the account are skipped." | |
| 7.2 | Elegir cuenta + categoría de gasto e ingreso por defecto + archivo válido (`date,description,amount[,category]`) | Tabla de vista previa con estado por fila; las categorías que no coinciden muestran "(default: no match)" | |
| 7.3 | Fila con importe `1.000,50` o `1,000.50` | Fila inválida (dígitos, máximo 2 decimales, sin separador de miles) | |
| 7.4 | Fila con importe `0` | "cannot be zero." | |
| 7.5 | Fila con fecha futura | "cannot be in the future." | |
| 7.6 | **Add N movements** | Toast "N movements imported."; botón **View transactions** | |
| 7.7 | Volver a importar el **mismo** archivo | Todas las filas salen "Already in this account."; se crean 0 | |
| 7.8 | Archivar la categoría por defecto entre la vista previa y la confirmación | "Check the account and the default categories: one of them is no longer available." | |
| 7.9 | Archivo `.txt`, archivo vacío, > 256 KB, > 500 filas, ANSI con tildes | Mensajes respectivos: extensión .csv · "The file is empty." · "larger than 256 KB" (`413`) · "more than 500 rows" · "Save the file as UTF-8…" | |

## 9. Today (`/app`)

**Cómo funciona (fórmula):**
`disponible` = Σ saldos de cuentas Cash/Bank/Savings no archivadas (por moneda) ·
`comprometido` = Σ importes de **cada ocurrencia esperada** de pagos activos desde su próxima fecha hasta fin de mes (cada vencida cuenta una vez) ·
`díasRestantes` = último día del mes − hoy + 1 ·
**Safe to spend today** = `max(0, (disponible − comprometido) / díasRestantes)`, 2 decimales `AwayFromZero` · `shortfall` = `max(0, comprometido − disponible)`.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 9.1 | Usuario nuevo sin datos | Guía con dos pasos: **Add an account** y **Record what you spend** | |
| 9.2 | Con los datos semilla | Una tarjeta **por moneda** con "Safe to spend today" y "Per day for the N days left this month, today included." | |
| 9.3 | Calcular a mano con el desglose **How is this calculated?** | Disponible, comprometido "until <fin de mes>" y días restantes coinciden; el resultado coincide con tu cálculo (ojo: `Phone` semanal cuenta **cada** semana restante del mes) | |
| 9.4 | Hacer el comprometido mayor que el disponible (p. ej. Rent de 5 000 000) | Safe to spend = **0** y aviso "Expected charges until the end of the month exceed your available money by X." | |
| 9.5 | Visa (tarjeta) con saldo | **No** suma al disponible | |
| 9.6 | Tarjetas: Spent today, Income/Expenses/Net this month | Coinciden con Transactions del mes | |
| 9.7 | Recent transactions / Accounts / Charges until the end of the month | Listas coherentes; cobros vencidos marcados **Overdue**; nota "Expected subscription charges, not payments…" | |
| 9.8 | Budgets to watch (tras §14) | Aparecen los presupuestos en Warning/Exceeded | |
| 9.9 | Caveat al pie | "An estimate, not financial advice…" visible | |

## 10. Recurring payments (`/app/subscriptions`)

**Cómo funciona:** el código/API se llama `subscriptions`; la UI dice **Recurring payments**. Tipos Subscription/Bill/Instalment. Equivalente mensual: semanal ×52/12, quincenal ×26/12, mensual =, trimestral /3, anual /12 (2 decimales `AwayFromZero`). La lista carga **todas** las páginas (`listAll`).

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 10.1 | Lista vacía | "No recurring payments yet." + **Add your first recurring payment** | |
| 10.2 | **Add payment** → `/app/subscriptions/new` (página, no modal) | Formulario: Type, Name, Category (opcional), Amount, Currency, Billing cycle (5 ciclos), Next billing date, Status, Payment link, Default account, Default expense category | |
| 10.3 | Guardar vacío | "Name is required." · "Amount is required." · "Next billing date is required." | |
| 10.4 | Nombre de 121, categoría de 61 | "Name must be at most 120 characters." / "Category must be at most 60 characters." | |
| 10.5 | Importe `0`, `-5`, `10.999` | "Amount must be greater than zero." / "Use at most 2 decimals." | |
| 10.6 | Fecha de ayer al **crear** | "Next billing date cannot be in the past." | |
| 10.7 | Payment link `http://x.com`, `javascript:alert(1)`, `https://user:pass@x.com` | "Use an https:// address without a user name or password (at most 500 characters)." | |
| 10.8 | Default account | Solo cuentas no archivadas; sugerida al marcar como pagado | |
| 10.9 | Crear los 5 pagos semilla | Toast `"Netflix" was added to your recurring payments.`; filas con insignia de tipo y "Weekly renewal", "Monthly renewal"… | |
| 10.10 | Tipo **Instalment plan** | Aparecen "Number of instalments" (1–600, "Use a whole number from 1 to 600.") e "Instalments already paid" (0 a total−1, "Use a whole number from 0 to one less than the total.") | |
| 10.11 | Fila de Laptop | Barra de progreso "1 of 3 paid" | |
| 10.12 | Fila con payment link | Enlace **Pay at provider ↗** abre en pestaña nueva ("(opens in a new tab)") | |
| 10.13 | Buscar `net` | Filtra por nombre; sin resultados → "No recurring payments match your search." | |
| 10.14 | **Filter by type** = Bill | Solo Rent y Phone | |
| 10.15 | **Edit** → `/app/subscriptions/:id/edit` | Datos cargados; sección **Recent payments** ("No payments recorded from FlowTrim yet." si no hay) | |
| 10.16 | Editar sin tocar la fecha (aunque ya esté vencida) | Se permite guardar (la fecha solo se valida si **cambia**) | |
| 10.17 | Salir del formulario con cambios sin guardar | Modal **Discard unsaved changes?** | |
| 10.18 | `/app/subscriptions/<guid-inexistente>/edit` | "Recurring payment not found." y formulario oculto | |
| 10.19 | **Delete** → modal **Delete recurring payment?** "This action cannot be undone for <name>" | Toast `"…" was deleted.`; si tenía pagos registrados, las transacciones de gasto **se conservan** | |
| 10.20 | Status = Inactive | Sale de Overview, Today, Upcoming, Simulator y analytics | |

### 10.A Modal **Mark as paid**

**Cómo funciona:** dos modos. *Record the payment in an account* → crea un **Expense** enlazado (`recurring_payment_id`) en una cuenta de la **misma moneda** y avanza la fecha **un ciclo**, todo en una sola transacción de base de datos. *Only move the next date* → solo avanza la fecha, sin gasto.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 10.A.1 | Abrir Mark as paid en Netflix | Título, importe y fecha "due"; opción *Record…* con la Default account y el importe del pago precargados | |
| 10.A.2 | Pago en USD (`Domain`) sin cuenta USD activa | "You have no active account in USD. Add one to record this payment, or only move the next date." | |
| 10.A.3 | Sin cuenta / sin categoría / fecha futura | "Choose the account you paid from." · "Choose an expense category." · "The payment date cannot be in the future." | |
| 10.A.4 | Cambiar el importe (factura variable) y **Record payment** | Toast "38 900 for "Netflix" recorded in Main bank. Next expected charge: <fecha+1 mes>."; aparece el gasto en Transactions; baja el saldo; Recent payments lo lista | |
| 10.A.5 | **Only move the next date** → **Move next date** | Toast `"Phone" marked as paid. Next expected charge: <fecha+7 días>.`; **no** se crea transacción | |
| 10.A.6 | Pago mensual con fecha 31 | La siguiente fecha se ajusta al último día del mes (p. ej. 30/02 → 28 o 29) | |
| 10.A.7 | Laptop (2 de 3) → marcar pagado | Progreso 2 of 3; otra vez → toast "…is fully paid. The plan is completed…", insignia **Completed**, estado Inactive y deja de contar como cobro esperado | |

### 10.B Usage y costo por uso (`/app/subscriptions/:id/usage`)

**Cómo funciona:** uso **declarado** (no verificado). Costo por uso = pagado en el periodo / usos del periodo; sin registros o con 0 usos → **no calculable** (nunca divide por cero).

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 10.B.1 | Abrir **Usage** de Netflix | Aviso "Usage is declared by you, not verified automatically."; "No usage recorded yet." | |
| 10.B.2 | Costo por uso sin datos | "Not enough data to compute cost per use." / "No usage in the selected period." | |
| 10.B.3 | Fecha futura / conteo vacío / `-1` / `2.5` / notas de 501 | "Usage date cannot be in the future." · "Usage count is required." · "…zero or greater." · "…must be a whole number." · "Notes must be at most 500 characters." | |
| 10.B.4 | Registrar 3 usos hoy → **Record usage** | Toast `Usage recorded for "Netflix".`; aparece en *Recent usage*; costo por uso = costo del periodo / 3 | |
| 10.B.5 | Registrar conteo 0 | Permitido; si el total del periodo es 0 → sigue "not calculable", nunca "Infinity" | |
| 10.B.6 | **Back to list** | Vuelve a la lista | |

## 11. Subscription CSV import (`/app/subscriptions/import`)

**Cómo funciona:** igual que el import bancario (vista previa sin estado, confirmar reenvía el archivo). Duplicado = mismo usuario + nombre (sin mayúsculas) + moneda, contra lo existente o contra una fila anterior. Acepta formato `,` y formato Excel en español `;` con coma decimal y `dd/MM/yyyy`.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 11.1 | **Download template** | Descarga una plantilla CSV (con `sep=,`) | |
| 11.2 | Subir la plantilla rellenada con 3 filas válidas | Contadores: rows / will be created / invalid / duplicates; botón **Create subscriptions (3)** | |
| 11.3 | Fila `Netflix,…,COP` ya existente | "Already in your subscriptions (same name and currency)" | |
| 11.4 | Dos filas iguales en el archivo | La segunda: "Same as row N" | |
| 11.5 | Filas con errores: fecha pasada, `billing_cycle=Daily`, moneda `PESOS`, `status=Paused`, celdas de más | Mensajes por campo (`date_in_past`, `invalid_billing_cycle`, `invalid_currency`, `invalid_status`, `wrong_cell_count`) | |
| 11.6 | Solo filas inválidas/duplicadas | "There is nothing to create: fix the invalid rows…" | |
| 11.7 | Confirmar | Pantalla **Import finished** con created / skipped as invalid / skipped as duplicates; toast "Subscriptions imported: N" | |
| 11.8 | Crear a mano una suscripción incluida en el archivo **entre** la vista previa y la confirmación | "The preview expected X; your subscriptions changed in between, so the result was recalculated." y no se duplica | |
| 11.9 | Archivo exportado desde Report (§16) | Se importa tal cual (`monthly_equivalent` se ignora; "Ignored columns: …") | |
| 11.10 | Archivo `;` con `38900,50` y `25/12/2026` | Se interpreta correctamente | |
| 11.11 | Errores de archivo: comillas sin cerrar, columna repetida, faltan columnas, separador `|` | "A quoted cell is never closed…" · "A column appears twice…" · "The first row must include…" · "Separate the columns with commas or semicolons." | |
| 11.12 | ⚠️ **Hallazgo conocido** | El texto de ayuda y el error `invalid_billing_cycle` dicen "Monthly or Yearly", pero el backend acepta también `Weekly`, `Biweekly` y `Quarterly`. Comprueba que una fila `Weekly` se importa → el texto de la UI está desactualizado (bug de copy) | |

## 12. Overview (`/app/summary`), Upcoming (`/app/upcoming`) y Simulator (`/app/simulator`)

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| **Overview** | Σ equivalente mensual de pagos **activos**, por moneda; proyección anual = Σ (equivalente mensual por pago, redondeado) × 12 | | |
| 12.1 | Con los datos semilla (COP) | MONTHLY BURN = 38 900 + 1 200 000 + 25 000×52/12 (=108 333,33) + 300 000 = **1 647 233,33**; anual = ×12; USD 15/12 = **1,25** por separado | |
| 12.2 | Poner Rent en Inactive | Desaparece del total; "Active services" baja en 1 | |
| 12.3 | Sin pagos activos | "No active subscriptions yet." | |
| **Upcoming** | Ventanas: Overdue · Today · Due within 3 days · Due within 7 days · Later, ordenadas por urgencia | | |
| 12.4 | Abrir | "As of <hoy Bogotá>"; Phone "in 1 day(s)" (*Due within 3 days*), Netflix "in 2 day(s)", Rent "Later"… | |
| 12.5 | Editar un pago a fecha de hoy (permitido) y otro en el pasado vía API/BD | "Today" / "N day(s) overdue" con insignia **Overdue** | |
| 12.6 | Aviso al pie | "An expected renewal is not a confirmed charge." | |
| **Simulator** | Ahorro = Σ equivalente mensual de lo seleccionado × meses (1, 12, 24). **Nunca guarda nada** | | |
| 12.7 | Sin selección | Ahorro 0, "Choose any active service to see the difference." | |
| 12.8 | Seleccionar Netflix | "1 selected"; Current monthly 1 647 233,33 → Projected 1 608 333,33; ahorro 38 900 / 466 800 / 933 600 | |
| 12.9 | Seleccionar rápido varias casillas | El resultado final corresponde a la última selección (las peticiones viejas se cancelan) | |
| 12.10 | Recargar / ir a la lista | Nada se canceló ni cambió | |
| 12.11 | Supuestos visibles | "Assumes constant prices." · "Excludes taxes, penalties and price changes." · "Not guaranteed." | |

## 13. Calendar (`/app/calendar`)

**Cómo funciona:** une las ocurrencias esperadas de los pagos recurrentes (mismo `RecurrenceSchedule`) con los totales diarios **registrados**.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 13.1 | Abrir mes actual | Totales del mes: Expected / Spent / Received; Phone aparece **cada semana** | |
| 13.2 | Clic en un día | Detalle con *Expected charges* y *Recorded*; día vacío → "Nothing expected or recorded this day." | |
| 13.3 | Mes siguiente | Ocurrencias proyectadas (Laptop no pasa de las cuotas restantes) | |
| 13.4 | Mes vacío | "Nothing expected or recorded this month." | |

## 14. Budgets (`/app/budgets`)

**Cómo funciona:** gastado = Σ gastos **registrados** de la categoría en la moneda del presupuesto en el mes en curso (los cobros esperados no cuentan). % con 1 decimal: **On track** < 80 % ≤ **Close to the limit** · **Over the limit** si gastado ≥ límite.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 14.1 | Sin presupuestos | "No budgets yet." + **Create your first budget** | |
| 14.2 | **Add budget** → modal *New budget* | Expense category (solo de gasto), Currency, Monthly limit ("The same limit applies every month.") | |
| 14.3 | Sin categoría / sin límite / límite 0 | "Choose a category." · "The monthly limit is required." · > 0 | |
| 14.4 | Food COP 100 000 con 50 000 gastados | **On track**, 50,0 %, "50 000 left this month" | |
| 14.5 | Gastar 30 000 más | 80,0 % → **Close to the limit**; aparece en Today › Budgets to watch | |
| 14.6 | Gastar 25 000 más | **Over the limit**, "5 000 over the limit" | |
| 14.7 | Otro presupuesto Food COP | "This category already has a budget in that currency. Edit it instead." (`409 budget_exists`); Food **USD** sí se permite | |
| 14.8 | Edit / Delete ("Delete budget?… Your transactions are not affected.") | Toasts "Budget for Food updated./deleted." | |
| 14.9 | Archivar la categoría | El presupuesto muestra "Archived category" | |
| 14.10 | Eliminar la categoría (sin transacciones) | El presupuesto se elimina en cascada | |

## 15. Goals (`/app/goals`)

**Cómo funciona:** ahorrado = Σ aportes (negativos = retiros). Restante = max(0, meta − ahorrado). Con fecha: meses hasta el mes meta inclusive (≥ 1) y *Needed per month* = restante / meses. *Estimated completion* = mes actual + techo(restante / promedio de los 3 últimos meses completos). Los aportes son **declarados**, no mueven dinero de las cuentas.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 15.1 | **Add goal** → modal *New goal* | Name (≤ 60), Currency, Target amount, Target date opcional | |
| 15.2 | Fecha pasada / sin meta / nombre de 61 | "The target date cannot be in the past." · "The target amount is required." · "Name must be at most 60 characters." | |
| 15.3 | Crear "Trip to Cartagena", 1 200 000 COP, fecha dentro de 6 meses | Toast `Goal "Trip to Cartagena" created.`; "0 % saved"; Needed per month = 1 200 000 / meses (contando el mes actual y el de la meta) | |
| 15.4 | **Add or withdraw** → modal | "Saved so far: 0 of 1 200 000."; tipo Contribution/Withdrawal; aviso "This records what you set aside; it does not move money…" | |
| 15.5 | Aporte 300 000 hoy | Toast `Contribution added to "…".`; 25 % saved; saldos de cuentas **sin cambios** | |
| 15.6 | Retiro de 400 000 | Rechazado: lo ahorrado no puede quedar por debajo de 0 (`400`) | |
| 15.7 | Retiro de 100 000 | Toast `Withdrawal recorded in "…".` | |
| 15.8 | Fecha futura / nota de 201 | "The date cannot be in the future." / "Note must be at most 200 characters." | |
| 15.9 | **History (N)** → modal "History of …" → borrar el **aporte** de 300 000 dejando el retiro | "Deleting this entry would leave the goal below zero. Delete the withdrawal first." (`409 goal_saved_negative`) | |
| 15.10 | Cambiar la moneda de un objetivo con aportes | "The currency of a goal with contributions cannot change." (`409 goal_currency_locked`) | |
| 15.11 | Sin 3 meses completos de historial | Estimated completion = "Not enough data yet" | |
| 15.12 | Llegar a la meta | Insignia **Completed**; si pasa la fecha sin completarla → **Past target date** | |
| 15.13 | Delete goal ("…and its history will be deleted. Your accounts are not affected.") | Toast `Goal "…" deleted.` | |

## 16. Analytics & reports (`/app/analytics`)

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| **Charts** | | | |
| 16.1 | Abrir pestaña Charts | Selector de moneda; Monthly equivalent; donut *Spending by category*; barras *Most expensive subscriptions* (top 5); *Expected charges, next 12 months* con meses pico resaltados | |
| 16.2 | **Show data** en cada gráfico | Tabla accesible con las mismas cifras | |
| 16.3 | Pago sin categoría | Aparece como "Uncategorized" | |
| 16.4 | Todas las suscripciones con equivalente 0 / sin activas | "Add an active subscription to see your charts." — **nunca** un 500 | |
| 16.5 | Cambiar tema claro/oscuro | Los gráficos repintan con los colores del tema | |
| **Report** (`/app/analytics/report`; `/app/report` redirige aquí) | | | |
| 16.6 | Abrir | Documento con fecha "Generated on …", resumen por moneda, gráficos, tabla de suscripciones, próximos cobros y supuestos | |
| 16.7 | **Export CSV** | "Exporting..." → "Downloaded subscriptions-….csv"; abre bien en Excel (BOM + `sep=,`); columnas `name, amount, currency, billing_cycle, next_billing_date, …` | |
| 16.8 | Pago con nombre `=1+1` o `@SUM(A1)` y exportar | En Excel la celda aparece como texto (`'=1+1`), **no** se ejecuta la fórmula | |
| 16.9 | **Print / Save as PDF** | Vista de impresión en tema claro aunque la app esté en oscuro, sin rail ni botones; gráficos redimensionados | |
| 16.10 | 360 px | Sin desbordamiento horizontal (las secciones hacen scroll solo en pantalla) | |
| **Statement** (`/app/analytics/statement`) | Solo transacciones registradas; transferencias excluidas; cada moneda por separado | | |
| 16.11 | Mes con datos | Income, Expenses, Net, **Savings rate** (= net/income; "No income" si no hay ingresos) | |
| 16.12 | Comparación con el mes anterior | "You spent X % more/less than in <mes>." / "same" / "No expenses in <mes> to compare with." | |
| 16.13 | Top expense categories | Tabla Category / Amount / Share | |
| 16.14 | Mes vacío | "Nothing recorded this month." | |
| 16.15 | En español | Títulos tipo "Octubre de 2026" (no "Octubre De 2026") | |

## 17. AI Assistant (`/app/insights`)

**Cómo funciona:** la IA (Groq, o el proveedor *Fake* en local) **no calcula**: elige herramientas C# de solo lectura (lista cerrada) y explica sus resultados. Las cifras (`figures`) las construye el backend, no el texto del modelo. Límite **5 preguntas / 60 s por usuario**, presupuesto de 45 s, pregunta ≤ 500 caracteres. Nunca se envían ids, owner ni token al proveedor.

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 17.1 | Abrir | Aviso "…not financial advice. Your question is sent to an external AI provider: do not include personal data."; 7 preguntas sugeridas | |
| 17.2 | Sugerencia "How much do I spend per month on subscriptions?" | "Checking your data…" → respuesta + bloque **Figures calculated by FlowTrim** con el mismo número que Overview; **Assumptions**; **Check it in** → enlace a Overview; **How this was answered** con las herramientas usadas | |
| 17.3 | "How much would I save in a year if I cancel Netflix?" | Figura de ahorro = Simulator (12 meses) | |
| 17.4 | "How are my budgets?" / "How are my savings goals?" / "How much did I spend this month?" | Cifras = Budgets / Goals / Statement | |
| 17.5 | "What's the weather?" | Mensaje *unsupported*: "I can only answer questions about your FlowTrim money…" sin cifras | |
| 17.6 | "Cost per use of Spotify" (no existe) | *no_data*: "Check that the subscription name matches one of yours:" | |
| 17.7 | Pregunta vacía o de 501 caracteres | "Write a question of up to 500 characters." | |
| 17.8 | 6 preguntas en menos de 60 s | La 6.ª: "Too many questions. You can ask again in N s." con cuenta atrás (`429` + `Retry-After`) | |
| 17.9 | Cancelar una pregunta en curso | Se detiene; el servidor no registra un error 500 | |
| 17.10 | Parar el API y preguntar | "Cannot reach the server…" | |

## 18. Aislamiento entre usuarios (crítico)

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 18.1 | Iniciar sesión con la cuenta **B** en incógnito | B ve todo vacío (salvo sus categorías por defecto) | |
| 18.2 | Copiar la URL de edición de un pago de A (`/app/subscriptions/<id>/edit`) y abrirla con B | "Recurring payment not found." (el API responde **404**, no 403, para no revelar que existe) | |
| 18.3 | B crea un pago `Netflix` | Permitido (los duplicados son por usuario) | |
| 18.4 | Importar en B el CSV exportado por A | Se crea todo en B; A no cambia | |
| 18.5 | La IA en B | Solo responde con datos de B | |

## 19. App móvil (FlowTrim-Mobile, EP-17)

**Cómo funciona:** app React Native + Expo (Android) que usa la **misma API** que la web. No calcula dinero: todas las cifras vienen del backend y la app solo las formatea. Estas pruebas son las que faltan para cerrar HU-81..HU-90 (#192, #194–#201): el código ya está en `main` con pruebas automáticas, pero cada historia exige verlo en un **teléfono real**.

**Preparación móvil (una sola vez):**

| # | Paso | Resultado esperado | Resultado |
|---|---|---|---|
| 19.0.1 | Crear la app **Native** en Auth0 siguiendo `FlowTrim-Mobile/docs/AUTH0-SETUP.md` (callback y logout `flowtrim://callback`, rotación de refresh token, *Allow Offline Access* en la API) | La app aparece en el tenant con su Client ID (público, no es secreto) | |
| 19.0.2 | En `FlowTrim-Mobile`: copiar `.env.example` a `.env` y poner `EXPO_PUBLIC_API_URL=http://<IP-del-PC>:5214` y los valores públicos de Auth0 | `.env` **no** aparece en `git status` (está ignorado) | |
| 19.0.3 | API con `dotnet run --launch-profile http` escuchando en la red local (mismo Wi-Fi que el teléfono) | Desde el navegador del teléfono, `http://<IP-del-PC>:5214/api/health` responde `200` | |
| 19.0.4 | `npm run android` (development build en el teléfono por USB) | La app abre sin pantalla roja | |

| # | Historia | Paso | Resultado esperado | Resultado |
|---|---|---|---|---|
| 19.1 | HU-81 | Abrir la app con el teléfono en español y tema oscuro; luego en inglés y claro | Cuatro pestañas (Hoy · Movimientos · Pagos · Plan), en el idioma y tema del teléfono, sin textos cortados a 360 dp | |
| 19.2 | HU-83 | "Iniciar sesión" con la cuenta A | Se abre la página de Auth0 en el navegador del sistema (no dentro de la app) y vuelve a Hoy con los datos de A | |
| 19.3 | HU-83 | Cerrar la app y abrirla al día siguiente | Sigue la sesión sin volver a pedir contraseña (refresh token) | |
| 19.4 | HU-83 | Ajustes › Cerrar sesión; entrar con la cuenta B; reiniciar la app | B no ve **nada** de A (tampoco tras reiniciar: la copia local se borró) | |
| 19.5 | HU-84 | Activar "Bloquear con huella o PIN"; salir más de 60 s y volver | Pide huella/PIN antes de mostrar datos; en apps recientes la vista sale en blanco y no deja hacer capturas | |
| 19.6 | HU-85 | Comparar Hoy en el teléfono y en la web (`/app`) | Mismas cifras de "Puedes gastar hoy", cobros y presupuestos; "¿Cómo se calcula?" muestra la fórmula | |
| 19.7 | HU-86 | "+" › gasto de 12.500 en efectivo › Guardar | Aparece en Movimientos del teléfono **y** en `/app/transactions` de la web; Hoy baja en la web | |
| 19.8 | HU-86 | "+" con importe `1.500` (punto como miles) | Error en el campo: sin separadores de miles; no se guarda nada | |
| 19.9 | HU-87 | Pagos › "Marcar como pagado" en un pago mensual con cuenta | Se registra el gasto y la próxima fecha avanza un ciclo; ambos se ven en la web | |
| 19.10 | HU-87 | "Pagar en el proveedor ↗" | Abre el enlace `https://` en el navegador del sistema | |
| 19.11 | HU-88 | Plan › meta › "Aportar o retirar" › aporte de 50.000 | El ahorrado sube en el teléfono y en `/app/goals` | |
| 19.12 | HU-88 | Retirar más de lo ahorrado | Error en el importe; la meta no baja de 0 | |
| 19.13 | HU-89 | Ajustes › "Recordarme los cargos esperados" | Android pide el permiso de notificaciones **solo** en ese momento | |
| 19.14 | HU-89 | Con un pago que vence mañana, esperar a las 09:00 | Llega "Cargo esperado mañana"; en la pantalla de bloqueo **no** se ve el importe; tocarla abre Pagos | |
| 19.15 | HU-89 | Negar el permiso en el diálogo | El interruptor queda apagado con la explicación de dónde activarlo | |
| 19.16 | HU-90 | Cargar Hoy y Pagos, activar modo avión, cerrar y abrir la app | Hoy y Pagos muestran la copia con "Sin conexión · actualizado <hora>"; no hay errores | |
| 19.17 | HU-90 | En modo avión pulsar "+" | Explica "Sin conexión: conéctate para guardar"; nada queda en cola | |
| 19.18 | HU-90 | Quitar el modo avión | El aviso desaparece y las cifras se recargan solas | |

> Al terminar cada fila en ✅ se puede cerrar la historia correspondiente en el tablero (los PR usaron `Refs #n`, no `Closes`, precisamente para esperar esta verificación). HU-91 (APK de release) sigue bloqueada por HU-40: el APK de release exige una API pública en `https://`.

---

# PARTE II — Pruebas críticas de seguridad

> Solo contra tu entorno **local** (o futuros entornos tuyos). Ejecuta las herramientas dinámicas (ZAP, sqlmap, jwt_tool) con la base de datos de desarrollo, nunca contra Auth0 ni contra Groq.

Para las pruebas con `curl` necesitas un token: inicia sesión, en DevTools › Application › Session Storage copia `flowtrim.access_token` y guárdalo en `TOKEN_A` (y `TOKEN_B` para la cuenta B). En PowerShell: `$A="<token>"`; en Git Bash: `A=<token>`.

## S1. Autenticación y autorización (OWASP API1/API2/API5)

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S1.1 | `curl -i http://localhost:5214/api/subscriptions` (sin token) | `401` | |
| S1.2 | Recorrer **todos** los endpoints sin token: `/api/accounts`, `/categories`, `/transactions`, `/dashboard/today`, `/calendar`, `/budgets`, `/goals`, `/statements`, `/summary`, `/analytics`, `/reports/subscriptions.csv`, `/simulations`, `/insights/questions`, `/subscription-imports/preview`, `/transaction-imports/preview` | Todos `401`; solo `/api/health` es público | |
| S1.3 | Token con la firma alterada (cambia el último carácter) | `401` | |
| S1.4 | Token con `alg: none` o firmado HS256 con la clave pública (usa **jwt_tool**: `jwt_tool <token> -X a` y `-X k`) | `401` | |
| S1.5 | Token caducado (espera a que caduque o usa uno viejo) | `401` y en la UI "Your session expired." | |
| S1.6 | Token de otra audiencia/emisor (p. ej. del `fake-issuer` local cuando el API apunta a Auth0) | `401` | |
| S1.7 | **IDOR lectura**: con `TOKEN_B`, `GET /api/subscriptions/<id de A>`, `/api/accounts/<id de A>`, `/api/goals/<id de A>`, `/api/subscriptions/<id de A>/payments`, `/usage-records`, `/cost-per-use` | `404` en todos | |
| S1.8 | **IDOR escritura**: con `TOKEN_B`, `PUT`/`DELETE` sobre ids de A, `POST /api/subscriptions/<id A>/mark-paid`, `POST /api/goals/<id A>/contributions`, `DELETE /api/goals/<id A>/contributions/<cid A>` | `404`; los datos de A **no cambian** (verifícalo con A) | |
| S1.9 | **Referencias cruzadas**: con `TOKEN_B` crear una transacción con `accountId`/`categoryId` de A; un pago con `defaultAccountId` de A; un presupuesto con `categoryId` de A | `400` con error de campo (las FK compuestas `(owner_id, …)` lo impiden también en la BD) | |
| S1.10 | **Mass assignment**: añadir `"ownerId":"otro"`, `"id":"…"`, `"paidInstalments":999`, `"createdAt":"2000-01-01"` en el JSON de POST/PUT | Se ignoran: el `owner_id` siempre sale del `sub` del token | |
| S1.11 | Open redirect: `/auth/login?returnUrl=https://evil.com` y `returnUrl=//evil.com` | Tras el login vuelve dentro de la app, nunca a `evil.com` | |

## S2. Validación de entrada e inyección (API3/API8, CWE-89/79/1236)

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S2.1 | SQLi en búsqueda: `GET /api/transactions?search=' OR 1=1--` y `?search=%25` | Respuesta normal filtrando el texto literal; sin errores SQL. Opcional: `sqlmap -u "http://localhost:5214/api/transactions?search=x" -H "Authorization: Bearer $A" --level 3 --risk 1` → "not injectable" | |
| S2.2 | XSS almacenado: nombre de pago/cuenta/categoría/nota = `<img src=x onerror=alert(1)>` y `<script>alert(1)</script>` | Se muestra como texto en todas las pantallas (lista, Today, calendario, informe, toasts, IA); no salta ningún alert | |
| S2.3 | Payment link `javascript:alert(1)`, `data:text/html,…`, `https://a@b.com`, uno de 501 caracteres, enviado **directo al API** | `400` (la validación también está en el backend, no solo en Angular) | |
| S2.4 | CSV formula injection: importar un pago llamado `=HYPERLINK("http://evil","x")` y exportar | La celda exportada empieza por `'` | |
| S2.5 | JSON malformado / cuerpo truncado / `Content-Type` incorrecto | `400` ProblemDetails (nunca `500`) | |
| S2.6 | Tipos fuera de rango: `amount: 1e30`, `amount: -1`, `"billingCycle":"Daily"`, fecha `2026-02-30`, GUID inválido en la ruta | `400` (o `404` para la ruta con restricción `:guid`) | |
| S2.7 | Cabecera `X-Correlation-ID` con 500 caracteres o con saltos de línea | Se ignora y se genera un id nuevo (no hay log injection) | |
| S2.8 | Paginación abusiva: `?pageSize=100000` | Se limita al máximo (200) | |

## S3. Subida de archivos (CWE-400/434)

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S3.1 | CSV de 257 KB en ambos imports | `413` con `code: file_too_large` | |
| S3.2 | 501 filas | `too_many_rows` | |
| S3.3 | `.exe` renombrado a `.csv` / binario aleatorio | `invalid_encoding` o `malformed_csv`; nunca `500` | |
| S3.4 | Nombre de archivo `../../etc/passwd.csv` | Sin efecto: el archivo nunca se escribe en disco | |
| S3.5 | Archivo con 1 fila y 10 000 columnas / celda de 200 KB | Rechazo controlado; el API sigue respondiendo | |

## S4. Errores, cabeceras y configuración (API8, CWE-209)

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S4.1 | Provocar un `500` (p. ej. parar Postgres y llamar a `/api/accounts`) | ProblemDetails genérico con `correlationId`; **sin** stack trace, SQL, cadena de conexión ni nombres de clases | |
| S4.2 | `ASPNETCORE_ENVIRONMENT=Production`: abrir `/openapi/v1.json` | `404` (OpenAPI solo en Development) | |
| S4.3 | Production: respuesta HTTPS | Cabecera `Strict-Transport-Security` y redirección HTTP→HTTPS | |
| S4.4 | CORS: `curl -i -H "Origin: https://evil.com" -X OPTIONS http://localhost:5214/api/subscriptions -H "Access-Control-Request-Method: GET"` | Sin `Access-Control-Allow-Origin` para ese origen; con `http://localhost:4200` sí | |
| S4.5 | Production con `Cors:AllowedOrigins` = `http://…` o `*` | El API **no arranca** (fail fast, el mensaje no imprime los valores) | |
| S4.6 | ⚠️ **Hallazgo a revisar**: cabeceras de seguridad | Hoy **no** se envían `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` ni `Permissions-Policy` (ni en el API ni en `index.html`). El token está en `sessionStorage`, así que una CSP estricta es la defensa clave frente a XSS. Candidato a issue (se configuran en el hosting de HU-40 y/o un middleware) | |
| S4.7 | Logs del API (consola JSON fuera de Development) | No contienen tokens, preguntas/respuestas de la IA, contenido de los CSV ni SQL | |
| S4.8 | Rate limit IA (ver 17.8) con un script de 20 peticiones | `429` a partir de la 6.ª, por usuario (B no se ve afectado por A) | |
| S4.9 | ⚠️ Sin rate limit general | Solo `/insights` está limitado; anótalo como riesgo aceptado para local / a resolver en el hosting | |

## S5. Secretos y repositorio

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S5.1 | `gitleaks detect --source . -v` en los 3 repos (historial completo) | 0 hallazgos reales (los valores públicos de Auth0 tenant/audience no son secretos) | |
| S5.2 | `git grep -n "ApiKey\|Password=\|gsk_"` | Ninguna clave de Groq ni contraseña; solo `change_me_local_password` en `.env.example` | |
| S5.3 | `.env` y `appsettings.*.local` en `.gitignore` | Sí | |
| S5.4 | GitHub › Settings › Code security: secret scanning + push protection activados | Activados (gratis en repos públicos) | |

## S6. Base de datos

| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| S6.1 | `docker exec -it flowtrim-postgres psql -U flowtrim -c "\du"` | ⚠️ El usuario de la app es el `POSTGRES_USER` del contenedor → **superusuario**. Recomendado: crear un rol `flowtrim_app` sin `SUPERUSER`/`CREATEDB`, dueño solo del esquema, y usarlo en la cadena de conexión (las migraciones con otro rol) | |
| S6.2 | Puerto publicado | `docker port flowtrim-postgres` → solo debería escuchar en `127.0.0.1` (hoy `5432:5432` = todas las interfaces). Cambiar a `"127.0.0.1:${POSTGRES_PORT:-5432}:5432"` | |
| S6.3 | `SHOW password_encryption;` | `scram-sha-256` | |
| S6.4 | Restricciones: intentar en SQL `INSERT` con `amount = 0`, `usage_count = -1`, transacción con cuenta de otro owner | Rechazado por `CHECK` / FK compuesta | |
| S6.5 | Contraseña local | No es la de `.env.example` | |

---

# PARTE III — Herramientas recomendadas

Todas gratuitas. ⭐ = recomendación principal.

| Capa | Herramienta | Qué detecta | Cómo usarla |
|---|---|---|---|
| **Repo / CI** | ⭐ **GitHub CodeQL** (Code scanning) | SAST de C# y TypeScript (inyección, XSS, rutas, criptografía) | Gratis en repos públicos: Settings › Code security › *Default setup* |
| | ⭐ **Dependabot alerts + security updates** | CVEs en NuGet y npm | Activar en Settings; crea PRs solos |
| | ⭐ **Secret scanning + push protection** | Claves subidas por error | Activar en Settings |
| | ⭐ **gitleaks** | Secretos en todo el historial, en local | `winget install gitleaks` → `gitleaks detect -v` |
| | **OSV-Scanner** | CVEs de lockfiles (`package-lock.json`, `packages.lock.json`) | `osv-scanner scan -r .` |
| | **Semgrep CE** | Reglas SAST/OWASP rápidas, complementa a Sonar | `pipx install semgrep` → `semgrep --config p/owasp-top-ten --config p/csharp --config p/typescript` |
| | **Trivy** | CVEs de imágenes Docker (`postgres:17`), malas configuraciones de Compose/IaC, secretos | `docker run aquasec/trivy image postgres:17` · `trivy fs .` · `trivy config .` |
| **Backend** | ⭐ **SonarQube** (C#) | Bugs, vulnerabilidades, *security hotspots*, code smells, cobertura | Ver sección siguiente |
| | ⭐ `dotnet list package --vulnerable --include-transitive` | Paquetes NuGet con CVE | Ya lo hace NuGet al compilar (NU1903); ejecútalo antes de cada release |
| | **.NET analyzers** (`<AnalysisMode>All</AnalysisMode>`, reglas CA2100/CA3xxx/CA5xxx) | Problemas de seguridad en compilación | Una propiedad en `Directory.Build.props` (sin dependencias nuevas) |
| | ⭐ **OWASP ZAP** (DAST) | Cabeceras ausentes, CORS, errores con información, inyección, a partir del OpenAPI | `docker run -t zaproxy/zap-stable zap-api-scan.py -t http://host.docker.internal:5214/openapi/v1.json -f openapi -z "-config replacer.full_list(0).replacement=Bearer $A …"` |
| | **jwt_tool** | `alg:none`, confusión de claves, `kid`, caducidad | `python jwt_tool.py <token> -M at -t http://localhost:5214/api/accounts -rh "Authorization: Bearer"` |
| | **sqlmap** | Confirmar que no hay SQLi en filtros/búsquedas | Ver S2.1 |
| | Bruno / Postman / `FlowTrim.Api.http` | Repetir los casos S1–S4 como colección | Guardar los casos IDOR con dos tokens |
| **Frontend** | ⭐ **SonarQube** (TS/HTML/CSS) | Bugs, XSS por `innerHTML`/`bypassSecurityTrust*`, smells | Mismo servidor |
| | ⭐ `npm audit --omit=dev` | CVEs de dependencias de producción | En `FlowTrim-frontend` |
| | **OWASP ZAP baseline** | Cabeceras/CSP/cookies del SPA servido | `docker run -t zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:4200` |
| | **Mozilla Observatory / securityheaders.com** | Nota de cabeceras | Solo cuando exista despliegue (HU-40) |
| | **Lighthouse** (DevTools) | Buenas prácticas + accesibilidad | DevTools › Lighthouse |
| **Base de datos** | **Trivy image** sobre `postgres:17` | CVEs de la imagen | Ver arriba |
| | Checklist `psql` (S6) | Roles, privilegios, cifrado de contraseñas, puerto | Manual |
| | **Testcontainers** (ya existe) | Restricciones `CHECK`/FK reales | `dotnet test --filter Category=Integration` |

### SonarQube: dos caminos

| | **A. SonarQube Cloud** ⭐ (recomendado) | **B. SonarQube Community Build local (Docker)** |
|---|---|---|
| Coste | Gratis para repos **públicos** (los dos lo son) | Gratis |
| Recursos de tu PC | Ninguno (se ejecuta en GitHub Actions) | ~2–3 GB de RAM + Java 17 para el scanner .NET. **Tu PC tiene 7,7 GB y ~0,7 GB libres**: es muy probable que Elasticsearch no arranque o que todo vaya lentísimo |
| Integración | Comenta en los PRs y aplica Quality Gate en el CI | Manual |
| Qué necesitas | Cuenta en sonarcloud.io con GitHub, importar los 2 repos, un secret `SONAR_TOKEN` por repo y un paso en el workflow | `docker run -d --name sonarqube -p 9000:9000 sonarqube:community`, instalar JDK 17, `dotnet tool install -g dotnet-sonarscanner`, generar un token en `http://localhost:9000` |
| Backend | `dotnet sonarscanner begin /k:… /d:sonar.cs.opencover.reportsPaths=**/coverage.opencover.xml` → `dotnet build` → `dotnet test --collect:"XPlat Code Coverage"` → `end` | Igual, con `/d:sonar.host.url=http://localhost:9000` |
| Frontend | `npx @sonar/scan` con `sonar.javascript.lcov.reportPaths=coverage/lcov.info` | Igual |
