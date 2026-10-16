from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, PageBreak, Paragraph, Spacer
from reportlab.lib.units import cm


SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE_SPEC = spec_from_file_location("report_helpers", SCRIPT_DIR / "create-complete-report.py")
REPORT_HELPERS = module_from_spec(SOURCE_SPEC)
SOURCE_SPEC.loader.exec_module(REPORT_HELPERS)

ROOT = SCRIPT_DIR.parents[1]
OUTPUT = ROOT / "FlowTrim-tracker" / "docs" / "FLOWTRIM-INFORME-COMPLETO-ES.pdf"
LANDING_IMAGE = ROOT / "FlowTrim-frontend" / "docs" / "screenshots" / "landing.png"
WORKSPACE_IMAGE = ROOT / "FlowTrim-frontend" / "docs" / "screenshots" / "workspace.png"

styles = REPORT_HELPERS.styles
PAGE_WIDTH = REPORT_HELPERS.PAGE_WIDTH
PAGE_HEIGHT = REPORT_HELPERS.PAGE_HEIGHT
footer = REPORT_HELPERS.footer
section = REPORT_HELPERS.section
p = REPORT_HELPERS.p
code = REPORT_HELPERS.code
table = REPORT_HELPERS.table
bullets = REPORT_HELPERS.bullets
image = REPORT_HELPERS.image


def build_story():
    story = []

    story.extend([
        Spacer(1, 2.4 * cm),
        p("FLOWTRIM / INFORME COMPLETO", "SmallFlow"),
        Spacer(1, 0.25 * cm),
        Paragraph("Informe de producto, arquitectura e implementación", styles["CoverTitle"]),
        p("Descripción integral de la aplicación FlowTrim: propósito, funcionalidades, módulos, tecnología, arquitectura, reglas de negocio, base de datos, estándares, pruebas, ejecución local y estado de entrega.", "CoverSubtitle"),
        Spacer(1, 0.8 * cm),
        p("Estado: MVP completo con las iteraciones visuales, de localización y de calidad interactiva EP-01, EP-02 y EP-03 entregadas.", "CoverSubtitle"),
        Spacer(1, 4.5 * cm),
        p("Preparado para Ander", "CoverSubtitle"),
        p("Octubre de 2026", "CoverSubtitle"),
        PageBreak(),
    ])

    story += section("1. Resumen ejecutivo", "Qué existe actualmente y qué se ha entregado.")
    story.append(p("FlowTrim es una aplicación full-stack de finanzas personales enfocada en suscripciones digitales recurrentes. Ayuda a centralizar suscripciones, entender su costo mensual equivalente, anticipar renovaciones, comparar escenarios de cancelación e identificar servicios que podrían estar infrautilizados."))
    story.append(p("El producto es determinista y transparente por diseño. No se conecta a bancos, no confirma transacciones reales, no verifica la actividad del usuario y no cancela servicios de terceros. El usuario introduce sus datos y FlowTrim explica cómo se produce cada número."))
    story.append(p("El MVP funcional está completo. Las iteraciones posteriores agregaron identidad visual, landing page, workspace responsive, temas claro/oscuro, localización inglés/español, motion, navegación fija, scroll aislado de tablas, modales CRUD, iconos y protección de formularios con cambios sin guardar."))
    story.append(table(
        ["Área", "Estado actual"],
        [
            ["Backend", "API ASP.NET Core .NET 10, persistencia PostgreSQL y 90 pruebas backend aprobadas"],
            ["Frontend", "SPA Angular 21 standalone, 16 pruebas frontend aprobadas y build de producción exitoso"],
            ["Base de datos", "PostgreSQL 17 mediante Docker Compose y migraciones EF Core aplicadas explícitamente"],
            ["UX", "Landing, workspace, temas, localización, CRUD modal y responsive entregados"],
            ["Entrega", "Frontend main y tracker main incluyen EP-03; backend main incluye HU-06"],
        ],
        [4.2 * cm, 12.3 * cm],
    ))

    story += section("2. Qué es FlowTrim", "Introducción al producto y valor para el usuario.")
    story.append(p("FlowTrim nace de un problema financiero cotidiano: las suscripciones son fáciles de contratar y fáciles de olvidar. Un cobro mensual puede parecer pequeño de forma aislada, pero una cartera de servicios crea un gasto recurrente constante que se vuelve difícil de interpretar cuando los ciclos, las monedas y las fechas de renovación están distribuidos entre distintos proveedores."))
    story.append(p("FlowTrim convierte ese gasto invisible en una superficie de control explícita. El usuario puede registrar una suscripción, ver su costo normalizado, entender qué está próximo a cobrarse, registrar un uso declarado y simular qué ocurriría al recortar determinados servicios."))
    story.append(Paragraph("Objetivo del producto", styles["H2Flow"]))
    story += bullets([
        "Ofrecer un único lugar para consultar suscripciones, importes y próximas fechas de cobro.",
        "Mostrar el costo mensual equivalente y la proyección anual realista.",
        "Prevenir renovaciones inesperadas con cuentas regresivas y alertas visuales.",
        "Revelar servicios potencialmente infrautilizados mediante costo por uso declarado.",
        "Comparar escenarios de cancelación sin persistir una cancelación real.",
        "Demostrar una aplicación full-stack completa, testeable y reproducible.",
    ])
    story.append(Paragraph("Principios del producto", styles["H2Flow"]))
    story += bullets([
        "Transparencia: cada número mostrado debe tener una fórmula u origen visible.",
        "Accionabilidad: comparar escenarios en lugar de limitarse a listar gastos.",
        "Honestidad: separar cobros esperados de transacciones confirmadas y uso declarado de uso verificado.",
        "Simplicidad técnica: mantener un backend desplegable y evitar servicios especulativos.",
        "Calidad demostrable: pruebas, validaciones, errores controlados y ejecución reproducible.",
    ])

    story += section("3. Funcionalidades principales", "Qué puede hacer un usuario actualmente.")
    story.append(table(["Funcionalidad", "Descripción"], [
        ["Gestión de suscripciones", "Crear, listar, buscar, editar y eliminar suscripciones."],
        ["Resumen financiero", "Consultar equivalente mensual, proyección anual y servicios activos por moneda."],
        ["Próximos cobros", "Revisar cobros vencidos, de hoy, de 3 días, de 7 días y posteriores."],
        ["Uso declarado", "Registrar cantidades de uso por fecha y notas opcionales."],
        ["Costo por uso", "Calcular costo por uso declarado sin dividir por cero."],
        ["Simulador", "Comparar gasto actual y escenario de recorte a 1, 12 y 24 meses."],
        ["Landing y workspace", "Entender el producto antes de entrar al centro de control financiero."],
        ["Temas e idiomas", "Usar modo claro/oscuro e interfaz persistente en inglés/español."],
        ["CRUD modal", "Gestionar suscripciones con modales accesibles e iconos reutilizables."],
    ], [4.2 * cm, 12.3 * cm]))

    story += section("4. Roadmap entregado", "Épicas e historias completadas.")
    story.append(table(["ID", "Alcance", "Estado"], [
        ["EP-00", "Preparación de repositorio, entorno y arquitectura", "Completada"],
        ["HU-01", "Registrar suscripción", "Completada"],
        ["HU-02", "Consultar, editar y eliminar suscripciones", "Completada"],
        ["HU-03", "Resumen financiero", "Completada"],
        ["HU-04", "Próximos cobros y cuenta regresiva", "Completada"],
        ["HU-05", "Registros de uso declarado", "Completada"],
        ["HU-06", "Costo por uso", "Completada"],
        ["HU-07", "Simulador de cancelación", "Completada"],
        ["HU-08", "Integración Angular con API", "Completada"],
        ["HU-09", "Validación y errores", "Completada"],
        ["HU-10", "Pruebas de reglas financieras", "Completada"],
        ["HU-11", "Documentación y demo", "Completada"],
        ["EP-01", "Rediseño visual / HU-16 a HU-24", "Completada"],
        ["EP-02", "Localización y motion / HU-25 a HU-27", "Completada"],
        ["EP-03", "Interacción y calidad responsive / HU-28 a HU-32", "Completada"],
    ], [2.3 * cm, 10.7 * cm, 3.5 * cm]))
    story.append(p("Las historias posteriores al MVP permanecen planificadas: HU-12 autenticación y aislamiento multiusuario, HU-13 notificaciones externas, HU-14 importación CSV y HU-15 extracción analítica condicional a Python/FastAPI."))

    story += section("5. Arquitectura del sistema", "Cómo está organizado FlowTrim.")
    story.append(p("FlowTrim es un monolito modular con backend .NET por capas y frontend Angular independiente. El backend es un único servicio desplegable. Las reglas de dominio permanecen separadas de la infraestructura y la API expone DTOs, no entidades EF Core."))
    story.append(code("Navegador\n  -> Componentes Angular standalone\n  -> Servicios HTTP tipados\n  -> Endpoints Minimal API ASP.NET Core\n  -> Handlers de Application\n  -> Repositorios de Infrastructure\n  -> EF Core / Npgsql\n  -> PostgreSQL"))
    story.append(Paragraph("Regla de dependencias del backend", styles["H2Flow"]))
    story.append(table(["Capa", "Responsabilidad", "Dependencias permitidas"], [
        ["FlowTrim.Api", "Endpoints HTTP, DI, CORS, configuración y errores", "Application, Infrastructure"],
        ["FlowTrim.Application", "Casos de uso, DTOs, contratos y orquestación", "Domain"],
        ["FlowTrim.Domain", "Entidades, reglas y calculadoras financieras puras", "Ninguna"],
        ["FlowTrim.Infrastructure", "EF Core, PostgreSQL, migraciones, repositorios y health checks", "Application, Domain"],
        ["FlowTrim.Tests", "Pruebas xUnit de dominio y aplicación", "Proyectos bajo prueba"],
    ], [4 * cm, 8 * cm, 4.5 * cm]))
    story.append(Paragraph("Estructura frontend", styles["H2Flow"]))
    story += bullets([
        "Componentes standalone con TypeScript estricto y templates estrictos.",
        "Features para subscriptions, summary, simulator y landing.",
        "Servicios core para errores HTTP, temas e internacionalización.",
        "SCSS y custom properties CSS para Carbon Signal y sus temas.",
        "Iconos SVG y modales nativos reutilizables sin dependencias innecesarias.",
        "Signals para estado local, sin un segundo state manager global.",
    ])

    story += section("6. Modelo de dominio y reglas de negocio", "El motor financiero determinista.")
    story.append(Paragraph("Subscription", styles["H2Flow"]))
    story.append(p("Subscription contiene identificador, nombre, categoría opcional, importe, moneda, ciclo de cobro, próxima fecha, estado y timestamps. Su factory protege las invariantes y no permite setters públicos que las eviten."))
    story.append(Paragraph("UsageRecord", styles["H2Flow"]))
    story.append(p("UsageRecord pertenece a una suscripción y almacena fecha, cantidad de uso no negativa y notas opcionales. El consumo es declarado por el usuario y no se verifica de forma independiente."))
    story.append(Paragraph("Fórmulas financieras", styles["H2Flow"]))
    story.append(table(["Indicador", "Regla", "Caveat"], [
        ["Equivalente mensual", "Importe mensual; importe anual dividido entre 12", "Los anuales se redondean a dos decimales con AwayFromZero."],
        ["Proyección anual", "Suma de equivalentes activos multiplicada por 12", "Se calcula por moneda y nunca se convierten monedas."],
        ["Ahorro potencial", "Equivalente mensual seleccionado multiplicado por horizonte", "Escenario; excluye impuestos, penalizaciones y cambios de precio."],
        ["Días hasta cobro", "NextBillingDate menos fecha de referencia del servidor", "Las fechas pasadas se clasifican como vencidas."],
        ["Costo por uso", "Costo del periodo dividido entre usos declarados", "Sin registros o con cero usos: no calculable, nunca infinito."],
    ], [4 * cm, 7 * cm, 5.5 * cm]))

    story += section("7. API backend", "Rutas, contratos y comportamiento.")
    story.append(table(["Método", "Ruta", "Propósito"], [
        ["GET", "/api/health", "Disponibilidad de API y base de datos"],
        ["GET", "/api/subscriptions?page=&amp;pageSize=", "Lista paginada"],
        ["GET", "/api/subscriptions/{id}", "Detalle"],
        ["POST", "/api/subscriptions", "Crear suscripción"],
        ["PUT", "/api/subscriptions/{id}", "Actualizar suscripción"],
        ["DELETE", "/api/subscriptions/{id}", "Eliminar suscripción"],
        ["GET", "/api/summary", "Resumen financiero por moneda"],
        ["GET", "/api/subscriptions/upcoming", "Próximos cobros y alertas"],
        ["POST", "/api/subscriptions/{id}/usage-records", "Registrar uso declarado"],
        ["GET", "/api/subscriptions/{id}/usage-records", "Listar usos"],
        ["GET", "/api/subscriptions/{id}/cost-per-use", "Costo por uso declarado"],
        ["POST", "/api/simulations", "Simulación no persistente"],
    ], [2 * cm, 8.2 * cm, 5.3 * cm]))
    story.append(Paragraph("Estándares HTTP y errores", styles["H2Flow"]))
    story += bullets([
        "201 Created para creación exitosa de suscripciones y usos.",
        "204 No Content para eliminación exitosa.",
        "400 ValidationProblemDetails para entradas inválidas.",
        "404 ProblemDetails para recursos inexistentes.",
        "500 genérico sin stack traces, secretos ni detalles internos.",
        "CORS configurable y restringido al origen de desarrollo por defecto.",
    ])

    story += section("8. Base de datos y persistencia", "Cómo se crea y evoluciona PostgreSQL.")
    story.append(p("Docker Compose ejecuta PostgreSQL 17. La imagen oficial crea la base y el usuario iniciales a partir de POSTGRES_USER, POSTGRES_PASSWORD y POSTGRES_DB del archivo local .env. Después, EF Core crea el esquema mediante migraciones aplicadas explícitamente con dotnet ef database update."))
    story.append(code("flowtrim-postgres\n  PostgreSQL 17\n  puerto host: 5433 en el entorno actual\n  puerto interno: 5432\n  base: flowtrim\n  volumen: flowtrim_pgdata"))
    story.append(Paragraph("Tablas", styles["H2Flow"]))
    story.append(table(["Tabla", "Propósito", "Restricciones"], [
        ["subscriptions", "Servicios recurrentes y facturación", "amount > 0; checks de ciclo y estado; índice por next_billing_date"],
        ["usage_records", "Historial de uso declarado", "usage_count >= 0; foreign key; ON DELETE CASCADE"],
        ["__EFMigrationsHistory", "Migraciones EF aplicadas", "Mantenida por EF Core"],
    ], [4 * cm, 7 * cm, 4.5 * cm]))
    story.append(p("Los identificadores de base de datos usan snake_case. El dinero usa numeric(18,2), los timestamps timestamptz, las fechas date y los enums texto legible con CHECK constraints."))

    story += section("9. Frontend y sistema visual", "La experiencia actual de FlowTrim.")
    story.append(p("El frontend tiene dos capas visuales. La landing pública introduce el producto, explica el problema y muestra un preview. El workspace /app es el centro operativo con sidebar fijo, temas, selector de idioma, estado de API y navegación por features."))
    story.append(Paragraph("Paleta Carbon Signal", styles["H2Flow"]))
    story.append(table(["Token", "Oscuro", "Claro", "Significado"], [
        ["Primary", "#1FC1CE", "#087F89", "Acciones, foco y marca"],
        ["Success", "#00C483", "#008F61", "Ahorro y estados saludables"],
        ["Warning", "#FFB547", "#A86400", "Próximos cobros y cautela"],
        ["Danger", "#FF6B6B", "#C63D47", "Eliminación y errores"],
        ["Background", "#070B0D", "#F3F7F6", "Lienzo de la aplicación"],
    ], [3.5 * cm, 3.5 * cm, 3.5 * cm, 5 * cm]))
    story.append(Paragraph("Comportamiento UX entregado", styles["H2Flow"]))
    story += bullets([
        "Tema claro/oscuro persistente con fallback a la preferencia del sistema.",
        "Idioma inglés/español persistente con fallback seguro a inglés.",
        "Sidebar fijo en desktop y navegación fija en mobile.",
        "Feature rail con scroll snap nativo.",
        "Soporte para reduced motion.",
        "Modal nativo reusable con X, Escape y cierre por backdrop.",
        "Protección contra pérdida de datos en formularios dirty.",
        "Iconos SVG con etiquetas accesibles para CRUD.",
    ])
    story.append(Spacer(1, 0.2 * cm))
    story.append(image(LANDING_IMAGE, 16.5 * cm))
    story.append(p("Figura 1. Landing actual con identidad Carbon Signal, preview del workspace y narrativa de producto.", "SmallFlow"))
    story.append(Spacer(1, 0.2 * cm))
    story.append(image(WORKSPACE_IMAGE, 16.5 * cm))
    story.append(p("Figura 2. Workspace actual con navegación fija, tema claro y tarjetas financieras por moneda.", "SmallFlow"))

    story += section("10. Ejecución local", "Cómo ejecutar el sistema completo en Windows.")
    story.append(Paragraph("Requisitos", styles["H2Flow"]))
    story += bullets([
        ".NET 10 SDK.",
        "Node.js compatible con Angular 21; el entorno documentado usa Node 22.15.0.",
        "npm 10.",
        "Docker Desktop y Docker Compose.",
    ])
    story.append(Paragraph("Backend y base de datos", styles["H2Flow"]))
    story.append(code("cd C:\\PROJECTS\\PROJECTS\\FlowTrim\\FlowTrim-backend\n\n# Crear .env desde la plantilla si hace falta\nCopy-Item .env.example .env\n\n# Iniciar PostgreSQL\ndocker compose up -d\ndocker compose ps\n\n# Aplicar migraciones EF Core\ndotnet tool restore\ndotnet ef database update --project src/FlowTrim.Infrastructure --startup-project src/FlowTrim.Api\n\n# Configurar User Secrets una vez\ndotnet user-secrets set \"ConnectionStrings:FlowTrimDb\" \"Host=localhost;Port=5433;Database=flowtrim;Username=flowtrim;Password=TU_PASSWORD\" --project src/FlowTrim.Api\n\n# Ejecutar API\ndotnet run --project src/FlowTrim.Api --launch-profile http"))
    story.append(p("La API queda en http://localhost:5214. El health endpoint debe devolver Healthy para API y base de datos."))
    story.append(Paragraph("Frontend", styles["H2Flow"]))
    story.append(code("cd C:\\PROJECTS\\PROJECTS\\FlowTrim\\FlowTrim-frontend\nnpm install\nnpm start"))
    story.append(p("El frontend queda en http://localhost:4200. Usa / para la landing y /app para el workspace."))
    story.append(Paragraph("Comandos útiles", styles["H2Flow"]))
    story.append(code("dotnet build FlowTrim.slnx\ndotnet test FlowTrim.slnx\nnpm test -- --watch=false\nnpm run build\ndocker compose down"))

    story += section("11. Inspección de base de datos con DBeaver", "Valores de conexión del entorno local actual.")
    story.append(table(["Campo", "Valor"], [
        ["Motor", "PostgreSQL 17"],
        ["Host", "localhost"],
        ["Puerto", "5433 en el entorno actual"],
        ["Base", "flowtrim"],
        ["Usuario", "Valor de POSTGRES_USER en .env"],
        ["Password", "Valor de POSTGRES_PASSWORD en .env"],
        ["Schema", "public"],
    ], [5 * cm, 11 * cm]))
    story.append(p("En DBeaver abre flowtrim -> Schemas -> public -> Tables. Las tablas principales son subscriptions, usage_records y __EFMigrationsHistory."))
    story.append(code("SELECT * FROM public.subscriptions ORDER BY next_billing_date;\n\nSELECT * FROM public.usage_records ORDER BY usage_date DESC;\n\nSELECT s.name, u.usage_date, u.usage_count, u.notes\nFROM public.usage_records AS u\nJOIN public.subscriptions AS s ON s.id = u.subscription_id\nORDER BY u.usage_date DESC;"))
    story.append(p("DBeaver permite revisar columnas, constraints, índices y foreign keys. La API no necesita estar ejecutándose para conectar; el contenedor PostgreSQL debe estar healthy."))

    story += section("12. Estándares y principios de ingeniería", "Convenciones aplicadas en el proyecto.")
    story += bullets([
        "Identificadores fuente, rutas API, nombres de base de datos, archivos y elementos técnicos en inglés.",
        "Comentarios de código en español según la convención existente; la interfaz soporta inglés y español.",
        "Commits en inglés con Conventional Commits y ramas por tarea.",
        "Specs, issues nuevas y PRs en inglés para el portfolio público.",
        "Entidades de dominio protegen invariantes mediante factories y mutación controlada.",
        "Dinero con decimal; fórmulas puras y testeadas.",
        "I/O asíncrono con CancellationToken en backend.",
        "La API nunca expone entidades EF Core directamente.",
        "Validación en límites de API y dominio.",
        "RFC 7807 ProblemDetails sin filtraciones internas.",
        "TypeScript estricto, templates Angular estrictos y componentes standalone.",
        "Preferencias de usuario en cliente, sin estado adicional en backend.",
        "Accesibilidad con labels semánticos, focus, teclado y reduced motion.",
        "Arquitectura preservada: sin microservicios, state manager competidor ni dependencias especulativas.",
    ])

    story += section("13. Evidencia de verificación", "Pruebas y comprobaciones ejecutadas.")
    story.append(table(["Comprobación", "Resultado"], [
        ["Pruebas backend", "90 aprobadas"],
        ["Pruebas frontend después de EP-03", "16 aprobadas"],
        ["Build frontend de producción", "Exitoso sin errores ni warnings"],
        ["Health API real", "API y PostgreSQL saludables"],
        ["Cost-per-use real", "200 calculable, 200 no calculable y 404 verificados"],
        ["Browser QA landing", "Cero errores de consola y requests fallidos"],
        ["Browser QA workspace", "Overview con API real, cero errores"],
        ["Browser QA modal", "Modal de creación con labels y orden Cancel/Primary correcto"],
        ["Browser QA localización", "Landing cambió a español y workspace mostró selector"],
    ], [6.2 * cm, 9.8 * cm]))
    story.append(p("El flujo de verificación es explícito: implementar, compilar, ejecutar unit tests, ejecutar contra PostgreSQL, revisar el UI en un navegador real y documentar el resultado."))

    story += section("14. Seguridad, privacidad y limitaciones", "Lo que FlowTrim deliberadamente no afirma.")
    story += bullets([
        "Todavía no existe autenticación ni aislamiento por usuario; no debe publicarse con datos privados sin HU-12.",
        "No existe integración bancaria, detección automática de transacciones ni cancelación de terceros.",
        "Los registros de uso son declarados y no verificados.",
        "Las fechas de renovación esperadas no son transacciones bancarias confirmadas.",
        "No se realiza conversión de monedas.",
        "No se envían emails, SMS ni notificaciones push.",
        "El despliegue público sigue diferido porque no se ha elegido proveedor.",
        "El backend mantiene documentada la advertencia NU1903 de OpenAPI como deuda técnica.",
        "El frontend mantiene Angular 21 y legacy-peer-deps por la decisión actual de compatibilidad Node/npm.",
    ])

    story += section("15. Roadmap pendiente", "Trabajo deliberadamente fuera de la entrega actual.")
    story.append(table(["Elemento", "Por qué está pendiente"], [
        ["HU-12 autenticación y aislamiento multiusuario", "Es necesaria antes de publicar datos privados; no se ha elegido proveedor de identidad."],
        ["HU-13 notificaciones externas", "Requiere ejecución en background y proveedor email/push."],
        ["HU-14 importación CSV", "Requiere un modelo futuro de transacciones separado de renovaciones esperadas."],
        ["HU-15 analítica Python/FastAPI", "No existe una necesidad técnica validada; el motor C# determinista es suficiente."],
        ["Despliegue público #27", "No se ha seleccionado proveedor ni arquitectura de hosting."],
        ["Ciclos adicionales y catálogo de categorías", "Decisiones de producto pendientes que no bloquean el MVP."],
    ], [6 * cm, 10 * cm]))

    story += section("16. Historial de entrega", "Puntos principales fusionados.")
    story.append(table(["Entrega", "Resultado"], [
        ["Backend PR #31", "HU-01 registrar suscripción"],
        ["Backend PR #40 / Frontend PR #22", "HU-05 uso declarado"],
        ["Backend PR #41 / Frontend PR #23", "HU-06 costo por uso"],
        ["Frontend PR #42 / Tracker PR #38", "EP-01 rediseño visual"],
        ["Frontend PR #48 / Tracker PR #43", "EP-02 localización y motion"],
        ["Frontend PR #59 / Tracker PR #50", "EP-03 interacción y calidad responsive"],
        ["v0.1.0", "Release inicial documentado después del hito MVP P0"],
    ], [6 * cm, 10 * cm]))
    story.append(p("Estado actual: backend y frontend main sincronizados. El tracker contiene las specs de EP-01, EP-02 y EP-03. El archivo specs/_TEMPLATE.md ya existía sin seguimiento y se dejó intacto."))

    story += section("17. Evaluación final", "Madurez actual del producto.")
    story.append(p("FlowTrim evolucionó de un MVP funcional a una experiencia de producto coherente. Sus principales fortalezas son la lógica financiera determinista, los supuestos explícitos, la base PostgreSQL reproducible y una identidad frontend cada vez más intencional. El siguiente umbral importante no es otra capa visual: es autenticación y aislamiento de datos antes del despliegue público."))
    story.append(p("El sistema actual es adecuado para demostraciones locales, portfolio, evaluación técnica y desarrollo continuo. Todavía no debe considerarse un servicio financiero público multiusuario, y la documentación conserva explícitamente esa distinción."))

    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(1.5 * cm, 1.65 * cm, PAGE_WIDTH - 3 * cm, PAGE_HEIGHT - 3 * cm, id="normal")
    document = BaseDocTemplate(
        str(OUTPUT), pagesize=(PAGE_WIDTH, PAGE_HEIGHT), leftMargin=1.5 * cm,
        rightMargin=1.5 * cm, topMargin=1.5 * cm, bottomMargin=1.65 * cm,
        title="FlowTrim - Informe completo de producto y tecnología",
        author="Equipo FlowTrim",
        subject="Informe completo en español de FlowTrim",
    )
    document.addPageTemplates([PageTemplate(id="flowtrim-es", frames=frame, onPage=footer)])
    document.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
