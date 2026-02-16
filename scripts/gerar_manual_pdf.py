from __future__ import annotations

from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image

BASE_DIR = Path(__file__).resolve().parents[1]
SOURCE_MD = BASE_DIR / "MANUAL_USUARIO_POR_TELA.md"
OUT_PDF = BASE_DIR / "dist" / "Manual_Usuario_ComandaFacil.pdf"


def md_to_story(md_text: str):
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    h_style = styles["Heading2"]
    p_style = styles["BodyText"]
    p_style.fontName = "Helvetica"
    p_style.leading = 14

    bullet_style = ParagraphStyle(
        "BulletCustom",
        parent=p_style,
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=4,
    )

    story = []
    lines = md_text.splitlines()
    for raw in lines:
        line = raw.rstrip()
        if not line:
            story.append(Spacer(1, 0.18 * cm))
            continue

        if line.startswith("# "):
            story.append(Paragraph(line[2:].strip(), title_style))
            story.append(Spacer(1, 0.2 * cm))
            continue

        if line.startswith("## "):
            story.append(Paragraph(line[3:].strip(), h_style))
            story.append(Spacer(1, 0.1 * cm))
            continue

        if line.startswith("- "):
            story.append(Paragraph(line[2:].strip(), bullet_style, bulletText="•"))
            continue

        if line.startswith("  - "):
            story.append(Paragraph(line[4:].strip(), bullet_style, bulletText="◦"))
            continue
        
        # Support for images: ![Alt text](path/to/image.png)
        if line.startswith("![") and "](" in line and line.endswith(")"):
            try:
                # Extract path: ![...](path)
                _, path_part = line.split("](", 1)
                image_rel_path = path_part[:-1]
                image_full_path = BASE_DIR / image_rel_path
                
                if image_full_path.exists():
                    # Resize logic: limit width to ~16cm (A4 - margins)
                    # ReportLab Image(filename, width, height)
                    # We can use use 'auto' or calculate aspect ratio, but SimpleDocTemplate 
                    # doesn't auto-scale content easily without help.
                    # As a simple heuristic, we'll fix width to 15cm and let height scale automatically
                    # by reading the image first or just letting ReportLab handle it if we don't pass dims?
                    # Using preserveAspectRatio=True with a set width/height box is safest.
                    
                    img = Image(str(image_full_path))
                    
                    # Simple scaling to max width 16cm
                    max_width = 16 * cm
                    img_width = img.drawWidth
                    img_height = img.drawHeight
                    
                    if img_width > max_width:
                        ratio = max_width / img_width
                        img.drawWidth = max_width
                        img.drawHeight = img_height * ratio
                    
                    story.append(img)
                    story.append(Spacer(1, 0.2 * cm))
                else:
                    print(f"Aviso: Imagem nao encontrada: {image_full_path}")
            except Exception as e:
                print(f"Erro ao processar imagem na linha '{line}': {e}")
            continue

        story.append(Paragraph(line, p_style))

    return story


def main() -> int:
    if not SOURCE_MD.exists():
        raise SystemExit(f"Arquivo nao encontrado: {SOURCE_MD}")

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    content = SOURCE_MD.read_text(encoding="utf-8")
    story = md_to_story(content)
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", getSampleStyleSheet()["Italic"]))

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title="Manual do Usuario - ComandaFacil",
        author="ComandaFacil",
    )
    doc.build(story)
    print(str(OUT_PDF))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

