from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "FlowTrim-tracker" / "docs" / "FLOWTRIM-COMPLETE-REPORT.pdf"
LANDING_IMAGE = ROOT / "FlowTrim-frontend" / "docs" / "screenshots" / "landing.png"
WORKSPACE_IMAGE = ROOT / "FlowTrim-frontend" / "docs" / "screenshots" / "workspace.png"
SUBSCRIPTIONS_IMAGE = ROOT / "FlowTrim-frontend" / "docs" / "screenshots" / "subscriptions.png"


def register_fonts():
    regular = Path("C:/Windows/Fonts/segoeui.ttf")
    bold = Path("C:/Windows/Fonts/segoeuib.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("FlowTrimSans", str(regular)))
        pdfmetrics.registerFont(TTFont("FlowTrimSans-Bold", str(bold)))
        return "FlowTrimSans", "FlowTrimSans-Bold"
    return "Helvetica", "Helvetica-Bold"


REGULAR_FONT, BOLD_FONT = register_fonts()
PAGE_WIDTH, PAGE_HEIGHT = A4
INK = colors.HexColor("#102023")
MUTED = colors.HexColor("#607277")
TEAL = colors.HexColor("#087F89")
BRIGHT_TEAL = colors.HexColor("#1FC1CE")
GREEN = colors.HexColor("#008F61")
LIGHT = colors.HexColor("#F3F7F6")
LINE = colors.HexColor("#D6E2E0")
SOFT = colors.HexColor("#EAF2F1")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["Title"], fontName=BOLD_FONT, fontSize=31,
    leading=35, textColor=colors.white, alignment=TA_LEFT, spaceAfter=16,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle", parent=styles["Normal"], fontName=REGULAR_FONT, fontSize=13,
    leading=19, textColor=colors.HexColor("#D8F5F3"), alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="H1Flow", parent=styles["Heading1"], fontName=BOLD_FONT, fontSize=21,
    leading=25, textColor=INK, spaceBefore=15, spaceAfter=9,
))
styles.add(ParagraphStyle(
    name="H2Flow", parent=styles["Heading2"], fontName=BOLD_FONT, fontSize=14,
    leading=18, textColor=TEAL, spaceBefore=12, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="H3Flow", parent=styles["Heading3"], fontName=BOLD_FONT, fontSize=10.5,
    leading=14, textColor=INK, spaceBefore=8, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="BodyFlow", parent=styles["BodyText"], fontName=REGULAR_FONT, fontSize=9.2,
    leading=14, textColor=INK, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="SmallFlow", parent=styles["BodyText"], fontName=REGULAR_FONT, fontSize=7.8,
    leading=10.5, textColor=MUTED, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="CodeFlow", parent=styles["Code"], fontName="Courier", fontSize=7.4,
    leading=10, textColor=colors.HexColor("#EAF2F1"), backColor=colors.HexColor("#102023"),
    borderPadding=8, spaceBefore=4, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="TableHeadFlow", parent=styles["BodyText"], fontName=BOLD_FONT, fontSize=7.6,
    leading=9, textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="TableBodyFlow", parent=styles["BodyText"], fontName=REGULAR_FONT, fontSize=7.4,
    leading=9.5, textColor=INK,
))
styles.add(ParagraphStyle(
    name="CalloutFlow", parent=styles["BodyText"], fontName=REGULAR_FONT, fontSize=9.2,
    leading=14, textColor=INK, backColor=SOFT, borderColor=LINE, borderWidth=0.6,
    borderPadding=9, spaceBefore=6, spaceAfter=8,
))


def p(text, style="BodyFlow"):
    return Paragraph(text, styles[style])


def bullets(items):
    result = []
    for item in items:
        result.append(Paragraph(f"- {item}", styles["BodyFlow"]))
    return result


def code(text):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(escaped.replace("\n", "<br/>"), styles["CodeFlow"])


def table(headers, rows, widths=None):
    data = [[Paragraph(str(value), styles["TableHeadFlow"]) for value in headers]]
    data.extend([[Paragraph(str(value), styles["TableBodyFlow"]) for value in row] for row in rows])
    result = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return result


def section(title, subtitle=None):
    result = [Paragraph(title, styles["H1Flow"])]
    if subtitle:
        result.append(p(subtitle, "SmallFlow"))
    return result


def image(path, width=16.5 * cm):
    if not path.exists():
        return p(f"Image not available: {path.name}", "SmallFlow")
    from PIL import Image as PillowImage
    with PillowImage.open(path) as source:
        ratio = source.height / source.width
    return Image(str(path), width=width, height=width * ratio)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(1.5 * cm, 1.25 * cm, PAGE_WIDTH - 1.5 * cm, 1.25 * cm)
    canvas.setFont(REGULAR_FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.5 * cm, 0.8 * cm, "FlowTrim - Complete Product and Technical Report")
    canvas.drawRightString(PAGE_WIDTH - 1.5 * cm, 0.8 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build_story():
    story = []

    story.append(Spacer(1, 2.4 * cm))
    story.append(p("FLOWTRIM / COMPLETE REPORT", "SmallFlow"))
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph("Product, architecture and implementation report", styles["CoverTitle"]))
    story.append(p("A complete description of the current FlowTrim application, its purpose, modules, technology, architecture, business rules, implementation standards, local operation and verified delivery status.", "CoverSubtitle"))
    story.append(Spacer(1, 0.8 * cm))
    story.append(p("Status: MVP complete with post-MVP visual, localization and interaction hardening delivered through EP-01, EP-02 and EP-03.", "CoverSubtitle"))
    story.append(Spacer(1, 4.5 * cm))
    story.append(p("Prepared for Ander", "CoverSubtitle"))
    story.append(p("October 2026", "CoverSubtitle"))
    story.append(PageBreak())

    story += section("1. Executive summary", "What exists today and what has been delivered.")
    story.append(p("FlowTrim is a full-stack personal-finance web application focused on recurring digital subscriptions. It helps a person centralize subscriptions, understand their real monthly-equivalent cost, anticipate renewals, compare cancellation scenarios and identify services that may be underused."))
    story.append(p("The product is intentionally deterministic and transparent. It does not connect to banks, does not confirm real transactions, does not verify user activity and does not cancel third-party services. The user owns the data and FlowTrim explains how each number is produced."))
    story.append(p("The functional MVP is complete. The later experience iterations added a brand identity, landing page, responsive workspace, persisted light/dark themes, English/Spanish localization, landing motion, fixed navigation, isolated table scrolling, reusable CRUD modals, icon actions and dirty-form protection."))
    story.append(table(
        ["Area", "Current status"],
        [
            ["Backend", "ASP.NET Core .NET 10 API, PostgreSQL persistence, 90 passing backend tests"],
            ["Frontend", "Angular 21 standalone SPA, 16 passing frontend tests, production build passing"],
            ["Database", "PostgreSQL 17 via Docker Compose, EF Core migrations applied explicitly"],
            ["UX", "Landing, workspace shell, themes, localization, modal CRUD and responsive layout delivered"],
            ["Delivery", "Frontend main and tracker main include EP-03; backend main includes HU-06"],
        ],
        [4.2 * cm, 12.3 * cm],
    ))

    story += section("2. What is FlowTrim?", "Product introduction and user value.")
    story.append(p("FlowTrim addresses a familiar financial problem: recurring services are easy to start and easy to forget. A monthly charge may feel small in isolation, but a portfolio of subscriptions creates a predictable burn rate that is difficult to see when billing cycles, currencies and renewal dates are distributed across different providers."))
    story.append(p("FlowTrim turns that invisible recurring spend into an explicit control surface. A user can register a subscription, see the normalized cost, understand what is due soon, record declared usage and simulate what could happen if selected services were trimmed."))
    story.append(Paragraph("Product objective", styles["H2Flow"]))
    story += bullets([
        "Give a person one place to see every recurring subscription, its amount and next billing date.",
        "Show the real monthly-equivalent cost and annual projection.",
        "Prevent surprise renewals with visual countdowns and alert windows.",
        "Reveal potentially underused services through declared cost-per-use information.",
        "Compare cancellation scenarios without persisting a cancellation.",
        "Demonstrate a complete, testable full-stack portfolio application.",
    ])
    story.append(Paragraph("Product principles", styles["H2Flow"]))
    story += bullets([
        "Transparency: every displayed number should have a visible formula or source.",
        "Actionability: compare scenarios instead of only listing expenses.",
        "Honesty: distinguish expected charges from confirmed transactions and declared usage from verified usage.",
        "Technical simplicity: keep one deployable backend and avoid speculative services.",
        "Demonstrable quality: tests, validation, error handling and reproducible local setup are part of the product.",
    ])

    story += section("3. Main capabilities", "What a user can do with the current product.")
    capability_rows = [
        ["Subscription management", "Create, list, search, edit and delete subscriptions."],
        ["Financial summary", "See monthly equivalent, annual projection and active services per currency."],
        ["Upcoming charges", "Review overdue, today, 3-day, 7-day and later renewal windows."],
        ["Declared usage", "Record dated usage counts and optional notes for a subscription."],
        ["Cost per use", "Calculate period cost per declared use without division by zero."],
        ["Cancellation simulator", "Compare current and simulated spending across 1, 12 and 24 months."],
        ["Landing and workspace", "Understand the product before entering the responsive financial workspace."],
        ["Themes and languages", "Use persisted light/dark mode and English/Spanish interface localization."],
        ["Modal CRUD", "Manage subscriptions through reusable accessible modals with icon actions."],
    ]
    story.append(table(["Capability", "Description"], capability_rows, [4.2 * cm, 12.3 * cm]))

    story += section("4. Delivered roadmap", "Stories and epics completed in the project.")
    roadmap_rows = [
        ["EP-00", "Repository, environment and architecture setup", "Complete"],
        ["HU-01", "Register a subscription", "Complete"],
        ["HU-02", "View, edit and delete subscriptions", "Complete"],
        ["HU-03", "Financial summary", "Complete"],
        ["HU-04", "Upcoming charges and countdown", "Complete"],
        ["HU-05", "Declared usage records", "Complete"],
        ["HU-06", "Cost per use", "Complete"],
        ["HU-07", "Cancellation simulator", "Complete"],
        ["HU-08", "Angular to API integration", "Complete"],
        ["HU-09", "Validation and error handling", "Complete"],
        ["HU-10", "Financial rule tests", "Complete"],
        ["HU-11", "Documentation and demo", "Complete"],
        ["EP-01", "Visual experience redesign / HU-16 to HU-24", "Complete"],
        ["EP-02", "Localization and motion / HU-25 to HU-27", "Complete"],
        ["EP-03", "Interaction and responsive quality / HU-28 to HU-32", "Complete"],
    ]
    story.append(table(["ID", "Scope", "Status"], roadmap_rows, [2.3 * cm, 10.7 * cm, 3.5 * cm]))
    story.append(p("Post-MVP stories remain planned rather than implemented: HU-12 authentication and multi-user isolation, HU-13 scheduled external notifications, HU-14 CSV transaction import and HU-15 conditional Python/FastAPI analytics extraction."))

    story += section("5. System architecture", "How the solution is organized.")
    story.append(p("FlowTrim is a modular monolith with a layered .NET backend and a standalone Angular frontend. The backend remains one deployable service. Domain rules are kept independent from infrastructure and the API exposes DTOs rather than EF Core entities."))
    story.append(code("Browser\n  -> Angular standalone components\n  -> Typed HTTP services\n  -> ASP.NET Core Minimal API endpoints\n  -> Application handlers\n  -> Infrastructure repositories\n  -> EF Core / Npgsql\n  -> PostgreSQL"))
    story.append(Paragraph("Backend dependency rule", styles["H2Flow"]))
    story.append(table(["Layer", "Responsibility", "Allowed dependencies"], [
        ["FlowTrim.Api", "HTTP endpoints, DI, CORS, configuration and error pipeline", "Application, Infrastructure"],
        ["FlowTrim.Application", "Use cases, DTOs, contracts and orchestration", "Domain"],
        ["FlowTrim.Domain", "Entities, value rules and pure financial calculators", "None"],
        ["FlowTrim.Infrastructure", "EF Core, PostgreSQL, migrations, repositories and health checks", "Application, Domain"],
        ["FlowTrim.Tests", "xUnit tests for domain and application behavior", "Tested projects"],
    ], [4 * cm, 8 * cm, 4.5 * cm]))
    story.append(Paragraph("Frontend structure", styles["H2Flow"]))
    story += bullets([
        "Standalone Angular components with strict TypeScript and strict templates.",
        "Feature-oriented areas for subscriptions, summary, simulator and landing.",
        "Core services for HTTP error handling, theme state and localization.",
        "SCSS and CSS custom properties for Carbon Signal tokens and theme modes.",
        "Native SVG icon and modal primitives to avoid unnecessary UI dependencies.",
        "Signals for local reactive state; no competing global state manager.",
    ])

    story += section("6. Domain model and business rules", "The deterministic financial engine.")
    story.append(Paragraph("Subscription", styles["H2Flow"]))
    story.append(p("A Subscription contains an identifier, name, optional category, amount, ISO-style currency code, billing cycle, next billing date, status and audit timestamps. The domain factory validates invariants and does not expose public setters that bypass them."))
    story.append(Paragraph("UsageRecord", styles["H2Flow"]))
    story.append(p("A UsageRecord belongs to a subscription and stores a usage date, a non-negative usage count and optional notes. Usage is explicitly declared by the user and is not independently verified."))
    story.append(Paragraph("Financial formulas", styles["H2Flow"]))
    story.append(table(["Indicator", "Rule", "Important caveat"], [
        ["Monthly equivalent", "Monthly amount; yearly amount divided by 12", "Yearly values are rounded to two decimals using AwayFromZero."],
        ["Annual projection", "Sum of active monthly equivalents multiplied by 12", "Calculated per currency; currencies are never converted or combined."],
        ["Potential savings", "Selected monthly equivalent multiplied by selected horizon", "Scenario only; taxes, penalties and future price changes are excluded."],
        ["Days until charge", "NextBillingDate minus server reference date", "Past values are overdue, not future charges."],
        ["Cost per use", "Period cost divided by total declared uses", "No records or zero uses return not calculable, never infinity."],
    ], [4 * cm, 7 * cm, 5.5 * cm]))

    story += section("7. Backend API", "Routes, contracts and behavior.")
    api_rows = [
        ["GET", "/api/health", "API and database availability"],
        ["GET", "/api/subscriptions?page=&amp;pageSize=", "Paged subscription list"],
        ["GET", "/api/subscriptions/{id}", "Subscription detail"],
        ["POST", "/api/subscriptions", "Create subscription"],
        ["PUT", "/api/subscriptions/{id}", "Update subscription"],
        ["DELETE", "/api/subscriptions/{id}", "Delete subscription"],
        ["GET", "/api/summary", "Financial summary per currency"],
        ["GET", "/api/subscriptions/upcoming", "Upcoming charges and alert windows"],
        ["POST", "/api/subscriptions/{id}/usage-records", "Register declared usage"],
        ["GET", "/api/subscriptions/{id}/usage-records", "List usage records"],
        ["GET", "/api/subscriptions/{id}/cost-per-use", "Cost per declared use"],
        ["POST", "/api/simulations", "Non-persistent cancellation simulation"],
    ]
    story.append(table(["Method", "Route", "Purpose"], api_rows, [2 * cm, 8.2 * cm, 5.3 * cm]))
    story.append(Paragraph("HTTP and error standards", styles["H2Flow"]))
    story += bullets([
        "201 Created is returned for successful subscription and usage creation.",
        "204 No Content is returned for successful deletion.",
        "400 ValidationProblemDetails is returned for invalid input.",
        "404 ProblemDetails is returned for unknown resources.",
        "Unexpected failures return a generic 500 without stack traces, connection strings or internal details.",
        "CORS is configurable and defaults to the Angular development origin only.",
    ])

    story += section("8. Database and persistence", "How PostgreSQL is created and evolved.")
    story.append(p("Docker Compose runs the official PostgreSQL 17 image. The initial database and database user are created by the image from POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB values in the local .env file. The application schema is then created by EF Core migrations, applied explicitly with dotnet ef database update."))
    story.append(code("flowtrim-postgres\n  PostgreSQL 17\n  host port: 5433 in the current environment\n  internal port: 5432\n  database: flowtrim\n  named volume: flowtrim_pgdata"))
    story.append(Paragraph("Tables", styles["H2Flow"]))
    story.append(table(["Table", "Purpose", "Important constraints"], [
        ["subscriptions", "Recurring services and billing metadata", "amount > 0; text checks for billing cycle and status; index on next_billing_date"],
        ["usage_records", "Declared usage history", "usage_count >= 0; foreign key to subscriptions; ON DELETE CASCADE"],
        ["__EFMigrationsHistory", "Applied EF Core migrations", "Maintained by EF Core"],
    ], [4 * cm, 7 * cm, 4.5 * cm]))
    story.append(p("Database identifiers use lowercase snake_case. Money uses numeric(18,2), timestamps use timestamptz, dates use date and enums are stored as readable text with database CHECK constraints."))

    story += section("9. Frontend and visual system", "The current FlowTrim experience.")
    story.append(p("The frontend now has two visual layers. The public landing page introduces the product, explains the problem and shows a sample product preview. The /app workspace provides the operational control surface with a fixed navigation rail, theme toggle, language selector, API status and feature navigation."))
    story.append(Paragraph("Carbon Signal palette", styles["H2Flow"]))
    story.append(table(["Token", "Dark value", "Light value", "Meaning"], [
        ["Primary", "#1FC1CE", "#087F89", "Actions, focus, brand signal"],
        ["Success", "#00C483", "#008F61", "Savings and healthy states"],
        ["Warning", "#FFB547", "#A86400", "Upcoming or caution states"],
        ["Danger", "#FF6B6B", "#C63D47", "Destructive and error states"],
        ["Background", "#070B0D", "#F3F7F6", "Application canvas"],
    ], [3.5 * cm, 3.5 * cm, 3.5 * cm, 5 * cm]))
    story.append(Paragraph("UX behavior delivered", styles["H2Flow"]))
    story += bullets([
        "Persisted dark/light theme with system preference fallback.",
        "Persisted English/Spanish language selection with safe English fallback.",
        "Fixed sidebar on desktop and fixed mobile navigation.",
        "Scrollable feature rail using native scroll snap.",
        "Reduced-motion support for non-essential animation.",
        "Reusable native dialog modal with X, Escape and backdrop close requests.",
        "Dirty-form protection before discarding create/edit data.",
        "SVG icon actions with accessible labels and tooltips for CRUD.",
    ])
    story.append(Spacer(1, 0.2 * cm))
    story.append(image(LANDING_IMAGE, 16.5 * cm))
    story.append(p("Figure 1. Current FlowTrim landing page with Carbon Signal identity, sample workspace preview and product narrative.", "SmallFlow"))
    story.append(Spacer(1, 0.2 * cm))
    story.append(image(WORKSPACE_IMAGE, 16.5 * cm))
    story.append(p("Figure 2. Current workspace overview with fixed navigation, light theme and currency-separated financial cards.", "SmallFlow"))

    story += section("10. Local execution", "How to run the complete system on Windows.")
    story.append(Paragraph("Prerequisites", styles["H2Flow"]))
    story += bullets([
        ".NET 10 SDK.",
        "Node.js compatible with Angular 21; the documented environment uses Node 22.15.0.",
        "npm 10.",
        "Docker Desktop and Docker Compose.",
    ])
    story.append(Paragraph("Backend and database", styles["H2Flow"]))
    story.append(code("cd C:\\PROJECTS\\PROJECTS\\FlowTrim\\FlowTrim-backend\n\n# Create .env from the template if needed\nCopy-Item .env.example .env\n\n# Start PostgreSQL\ndocker compose up -d\ndocker compose ps\n\n# Apply EF Core migrations\ndotnet tool restore\ndotnet ef database update --project src/FlowTrim.Infrastructure --startup-project src/FlowTrim.Api\n\n# Configure User Secrets once\ndotnet user-secrets set \"ConnectionStrings:FlowTrimDb\" \"Host=localhost;Port=5433;Database=flowtrim;Username=flowtrim;Password=YOUR_PASSWORD\" --project src/FlowTrim.Api\n\n# Run the API\ndotnet run --project src/FlowTrim.Api --launch-profile http"))
    story.append(p("The API runs at http://localhost:5214. The health endpoint should return Healthy for both API and database."))
    story.append(Paragraph("Frontend", styles["H2Flow"]))
    story.append(code("cd C:\\PROJECTS\\PROJECTS\\FlowTrim\\FlowTrim-frontend\nnpm install\nnpm start"))
    story.append(p("The frontend runs at http://localhost:4200. Use / for the landing page and /app for the workspace."))
    story.append(Paragraph("Useful commands", styles["H2Flow"]))
    story.append(code("dotnet build FlowTrim.slnx\ndotnet test FlowTrim.slnx\nnpm test -- --watch=false\nnpm run build\ndocker compose down"))

    story += section("11. Database inspection with DBeaver", "Connection values for the current local environment.")
    story.append(table(["Field", "Value"], [
        ["Database engine", "PostgreSQL 17"],
        ["Host", "localhost"],
        ["Port", "5433 in the current environment"],
        ["Database", "flowtrim"],
        ["Username", "Value of POSTGRES_USER in .env"],
        ["Password", "Value of POSTGRES_PASSWORD in .env"],
        ["Schema", "public"],
    ], [5 * cm, 11 * cm]))
    story.append(p("In DBeaver open flowtrim -> Schemas -> public -> Tables. The main tables are subscriptions, usage_records and __EFMigrationsHistory."))
    story.append(code("SELECT * FROM public.subscriptions ORDER BY next_billing_date;\n\nSELECT * FROM public.usage_records ORDER BY usage_date DESC;\n\nSELECT s.name, u.usage_date, u.usage_count, u.notes\nFROM public.usage_records AS u\nJOIN public.subscriptions AS s ON s.id = u.subscription_id\nORDER BY u.usage_date DESC;"))
    story.append(p("DBeaver can inspect columns, constraints, indexes and foreign keys. The API does not need to be running for DBeaver to connect; only the PostgreSQL container must be healthy."))

    story += section("12. Standards and engineering principles", "Conventions used throughout the project.")
    story += bullets([
        "Source identifiers, API routes, database names, filenames and technical identifiers are English.",
        "Code comments follow the established Spanish project convention; user-facing UI supports English and Spanish.",
        "Git commits use English Conventional Commits and task branches.",
        "Specs, new tracker issues and PR descriptions use English for the public portfolio workflow.",
        "Domain entities protect invariants through factories and controlled mutation.",
        "Money uses decimal; business formulas are pure and unit-tested.",
        "I/O is asynchronous and uses CancellationToken in the backend.",
        "The API never exposes EF Core entities directly.",
        "Validation exists at API and domain boundaries.",
        "Errors use RFC 7807 ProblemDetails and do not leak internal details.",
        "The frontend uses strict TypeScript, strict Angular templates and standalone components.",
        "User preferences are client-side and do not require backend state.",
        "Accessibility includes semantic labels, focus states, keyboard behavior and reduced motion.",
        "Architecture is preserved: no microservices, no competing state manager and no speculative dependencies.",
    ])

    story += section("13. Verification and quality evidence", "What has been executed successfully.")
    story.append(table(["Check", "Result"], [
        ["Backend unit/application tests", "90 passed"],
        ["Frontend unit/service tests after EP-03", "16 passed"],
        ["Frontend production build", "Passed without build errors or warnings"],
        ["Live API health", "Healthy API and PostgreSQL connection"],
        ["Live cost-per-use endpoint", "200 calculable, 200 not calculable and 404 unknown subscription verified"],
        ["Landing browser QA", "Rendered with zero console errors and zero failed requests"],
        ["Workspace browser QA", "API-backed overview rendered with zero console errors and zero failed requests"],
        ["Modal browser QA", "Create modal rendered with labels, Cancel first and primary action second"],
        ["Localization browser QA", "Landing changed to Spanish and workspace exposed language control"],
    ], [6.2 * cm, 9.8 * cm]))
    story.append(p("The project uses an explicit verification loop: implement, build, run unit tests, run the application against PostgreSQL, inspect the UI in a real browser, then document the result."))

    story += section("14. Security, privacy and limitations", "What FlowTrim deliberately does not claim.")
    story += bullets([
        "No authentication or user isolation exists yet; the application is not ready for public private-data use without HU-12.",
        "No bank integration, automatic transaction detection or third-party cancellation exists.",
        "Usage records are declared by the user and are not verified.",
        "Expected renewal dates are not confirmed bank transactions.",
        "No currency conversion is performed.",
        "No emails, SMS or push notifications are sent.",
        "Public deployment remains deferred because no hosting provider has been selected.",
        "The backend has a documented NU1903 OpenAPI dependency warning that remains technical debt.",
        "The frontend keeps Angular 21 and legacy-peer-deps because of the current Node/npm compatibility decision.",
    ])

    story += section("15. Pending roadmap", "Work that remains intentionally outside the current MVP delivery.")
    story.append(table(["Item", "Why it remains pending"], [
        ["HU-12 authentication and multi-user isolation", "Required before public use with private data; scope and identity provider are not selected."],
        ["HU-13 scheduled external notifications", "Requires background execution and an email/push provider."],
        ["HU-14 CSV transaction import", "Requires a future transaction model distinct from expected subscription renewals."],
        ["HU-15 Python/FastAPI analytics", "No validated technical need; deterministic C# engine is sufficient today."],
        ["Public deployment task #27", "Hosting provider and deployment architecture are not selected."],
        ["Additional billing cycles and category catalog", "Pending product decisions that do not block the current MVP."],
    ], [6 * cm, 10 * cm]))

    story += section("16. Delivery history", "Key merged delivery points.")
    story.append(table(["Delivery", "Result"], [
        ["Backend PR #31", "HU-01 register subscription"],
        ["Backend PR #40 / Frontend PR #22", "HU-05 declared usage"],
        ["Backend PR #41 / Frontend PR #23", "HU-06 cost per use"],
        ["Frontend PR #42 / Tracker PR #38", "EP-01 visual experience redesign"],
        ["Frontend PR #48 / Tracker PR #43", "EP-02 localization and motion"],
        ["Frontend PR #59 / Tracker PR #50", "EP-03 interaction and responsive quality"],
        ["v0.1.0", "Initial documented release created after the P0 MVP milestone"],
    ], [6 * cm, 10 * cm]))
    story.append(p("Current repository state: backend and frontend main branches are synchronized. The tracker contains the delivered EP-01, EP-02 and EP-03 specifications. A pre-existing untracked specs/_TEMPLATE.md file remains intentionally untouched."))

    story += section("17. Final assessment", "Current product maturity.")
    story.append(p("FlowTrim has moved from a functional MVP into a coherent product experience. Its core strength is the combination of deterministic financial logic, explicit assumptions, reproducible PostgreSQL setup and an increasingly deliberate frontend identity. The next major product threshold is not another visual layer; it is authentication and data isolation before public deployment."))
    story.append(p("The current system is suitable for local demonstration, portfolio review, technical evaluation and continued feature development. It is not yet positioned as a public multi-user financial service, and the documentation intentionally preserves that distinction."))

    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(1.5 * cm, 1.65 * cm, PAGE_WIDTH - 3 * cm, PAGE_HEIGHT - 3 * cm, id="normal")
    document = BaseDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        topMargin=1.5 * cm, bottomMargin=1.65 * cm,
        title="FlowTrim - Complete Product and Technical Report",
        author="FlowTrim team",
        subject="Complete product, technical and implementation report for FlowTrim",
    )
    document.addPageTemplates([PageTemplate(id="flowtrim", frames=frame, onPage=footer)])
    document.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
