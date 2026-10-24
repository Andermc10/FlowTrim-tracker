"""Genera docs/FLOWTRIM-RESUMEN-ES.pdf: qué es FlowTrim y qué hace, en español y en pocas páginas.

Reutiliza los estilos de create-complete-report.py. Las imágenes salen de FlowTrim-frontend/docs/screenshots
(datos ficticios). Uso: python scripts/create-summary-es.py
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer

SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE_SPEC = spec_from_file_location("report_helpers", SCRIPT_DIR / "create-complete-report.py")
HELPERS = module_from_spec(SOURCE_SPEC)
SOURCE_SPEC.loader.exec_module(HELPERS)

ROOT = SCRIPT_DIR.parents[1]
OUTPUT = ROOT / "FlowTrim-tracker" / "docs" / "FLOWTRIM-RESUMEN-ES.pdf"
# Capturas con la interfaz en español (datos ficticios), propias de este resumen.
SHOTS = ROOT / "FlowTrim-tracker" / "docs" / "images"

styles = HELPERS.styles
p, table, bullets, image = HELPERS.p, HELPERS.table, HELPERS.bullets, HELPERS.image
PAGE_WIDTH, PAGE_HEIGHT = HELPERS.PAGE_WIDTH, HELPERS.PAGE_HEIGHT

# Los estilos de portada del informe completo son claros (para fondo oscuro); aquí la página es blanca.
styles.add(ParagraphStyle(name="SummaryTitle", parent=styles["CoverTitle"], textColor=HELPERS.INK))
styles.add(ParagraphStyle(name="SummarySubtitle", parent=styles["CoverSubtitle"], textColor=HELPERS.TEAL))
styles.add(ParagraphStyle(name="FormulaFlow", parent=styles["H3Flow"], textColor=HELPERS.INK, spaceBefore=2, spaceAfter=6))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HELPERS.LINE)
    canvas.setLineWidth(0.5)
    canvas.line(1.5 * cm, 1.25 * cm, PAGE_WIDTH - 1.5 * cm, 1.25 * cm)
    canvas.setFont(HELPERS.REGULAR_FONT, 7.5)
    canvas.setFillColor(HELPERS.MUTED)
    canvas.drawString(1.5 * cm, 0.8 * cm, "FlowTrim · Resumen del producto · Octubre de 2026")
    canvas.drawRightString(PAGE_WIDTH - 1.5 * cm, 0.8 * cm, f"Página {doc.page}")
    canvas.restoreState()


def h1(text):
    return Paragraph(text, styles["H1Flow"])


def figure(name, caption, width=16.5 * cm):
    return KeepTogether([image(SHOTS / name, width), Spacer(1, 0.12 * cm), p(caption, "SmallFlow"), Spacer(1, 0.4 * cm)])


def build_story():
    story = [
        p("FLOWTRIM / RESUMEN", "SmallFlow"),
        Spacer(1, 0.2 * cm),
        Paragraph("Qué es FlowTrim y qué hace", styles["SummaryTitle"]),
        p("Aplicación web de finanzas personales del día a día. Versión 3.0, octubre de 2026.", "SummarySubtitle"),
        Spacer(1, 0.5 * cm),
        h1("En pocas palabras"),
        p("FlowTrim te responde una pregunta concreta: <b>¿cuánto puedes gastar hoy sin descuadrar el mes?</b> "
          "Registras tus cuentas y tus gastos en segundos; la aplicación resta lo que todavía falta pagar este mes "
          "(tus suscripciones) y reparte lo que queda entre los días restantes. Cada cifra muestra cómo se calculó."),
        p("También te ayuda a controlar las suscripciones y cobros automáticos que se olvidan: su costo mensual real, "
          "avisos antes de cada cobro y un simulador para decidir qué cancelar."),
        Spacer(1, 0.2 * cm),
        h1("Qué puedes hacer"),
        table(
            ["Módulo", "Para qué sirve"],
            [
                ["Hoy", "La portada: cuánto puedes gastar hoy por moneda, lo gastado hoy, ingresos y gastos del mes, "
                        "tus cuentas, los últimos movimientos y los cobros que faltan antes de fin de mes."],
                ["Movimientos", "Ingresos, gastos y transferencias entre tus cuentas, por mes, agrupados por día, con "
                                "filtros y totales."],
                ["Registro rápido", "Pulsa la tecla N en cualquier pantalla: importe, Tab a la categoría, Enter. Recuerda "
                                    "tu última cuenta y pone primero tus categorías más usadas."],
                ["Cuentas", "Efectivo, banco, ahorros y tarjetas de crédito. El saldo se calcula con tus movimientos; "
                            "una tarjeta que debe dinero se muestra como deuda."],
                ["Categorías", "Tus propias categorías de gasto e ingreso, con color e ícono. Se crea un set inicial."],
                ["Suscripciones", "Costo mensual equivalente (los planes anuales se dividen entre 12), proyección anual, "
                                  "próximos cobros con cuenta regresiva y \"marcar como pagado\"."],
                ["Simulador", "Cuánto ahorrarías en 1, 12 y 24 meses si cancelas algo. No cancela nada."],
                ["Analítica y reporte", "Gasto por categoría y por mes, y un reporte para imprimir o guardar en PDF."],
                ["Importar y exportar", "Suscripciones desde un CSV (también el formato de Excel) con vista previa antes "
                                        "de guardar nada."],
                ["Asistente IA", "Preguntas en lenguaje natural sobre tus datos. Las cifras las calcula FlowTrim; la IA "
                                 "solo las explica."],
                ["Para todos", "Español e inglés, tema claro y oscuro, uso con teclado y en el celular."],
            ],
            [3.6 * cm, 12.9 * cm],
        ),
        PageBreak(),
        h1("Cómo se calcula \"Puedes gastar hoy\""),
        p("(dinero disponible − cobros esperados hasta fin de mes) ÷ días que quedan, contando hoy", "FormulaFlow"),
        bullets([
            "Dinero disponible: efectivo, banco y ahorros. Las tarjetas de crédito no cuentan, porque es dinero prestado.",
            "Cobros esperados: suscripciones activas que vencen antes de que termine el mes (incluidas las vencidas).",
            "Si los cobros superan tu dinero, la cifra es 0 y la pantalla te muestra cuánto falta.",
            "Las monedas nunca se suman ni se convierten: cada moneda tiene su propia cifra.",
        ]),
        p("Ejemplo: tienes 1.175.000 COP entre efectivo y banco, Netflix (38.900) se cobra antes de fin de mes y "
          "quedan 10 días: (1.175.000 − 38.900) ÷ 10 = <b>113.610 COP por día</b>."),
        p("Es una estimación, no una asesoría financiera: supone que no tendrás otros ingresos ni gastos este mes.",
          "SmallFlow"),
        Spacer(1, 0.3 * cm),
        h1("Lo que FlowTrim no hace"),
        bullets([
            "No se conecta a tu banco ni mueve dinero: los datos los escribes tú.",
            "No inventa pagos: un cobro de suscripción es \"esperado\" hasta que tú lo marcas como pagado.",
            "No cancela suscripciones en otras empresas: el simulador solo calcula.",
            "No adivina: los mismos datos siempre dan el mismo resultado.",
        ]),
        Spacer(1, 0.3 * cm),
        h1("Seguridad y datos"),
        bullets([
            "Inicio de sesión seguro (Auth0, OIDC con PKCE); la aplicación nunca ve tu contraseña.",
            "Cada registro pertenece a quien inició sesión; la base de datos impide que se mezclen datos entre usuarios.",
            "Las preguntas al asistente no envían identificadores internos ni datos de otros usuarios.",
        ]),
        Spacer(1, 0.3 * cm),
        h1("Cómo está hecho"),
        p("Backend en C# con ASP.NET Core (.NET 10) y PostgreSQL; frontend en Angular 22. Más de 600 pruebas "
          "automáticas en el backend y más de 200 en el frontend, con integración continua en GitHub. Es un proyecto "
          "de portafolio con código público."),
        PageBreak(),
        h1("Así se ve"),
        p("Capturas con datos ficticios, tema oscuro y la interfaz en español. Están en "
          "<font face='Courier'>FlowTrim-tracker/docs/images/</font>; las del README (en inglés), en "
          "<font face='Courier'>FlowTrim-frontend/docs/screenshots/</font>.", "SmallFlow"),
        Spacer(1, 0.2 * cm),
        figure("landing.png", "Página de inicio (landing): presenta la cifra del día y el recorrido de la aplicación."),
        figure("today.png", "Hoy: cuánto puedes gastar por día, las cifras del mes, cuentas, movimientos y cobros."),
        figure("transactions.png", "Movimientos del mes agrupados por día, con totales y filtros."),
        figure("accounts.png", "Cuentas con su saldo calculado; la tarjeta de crédito aparece como deuda."),
    ]
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.7 * cm,
        title="FlowTrim — Resumen del producto",
        author="Ander",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=footer)])
    # bullets() devuelve una lista de párrafos: se aplana antes de construir.
    story = []
    for item in build_story():
        story.extend(item if isinstance(item, list) else [item])
    doc.build(story)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
