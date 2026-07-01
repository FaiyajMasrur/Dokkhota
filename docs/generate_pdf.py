from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pathlib import Path

md_path = Path('docs/TEAM_HANDOVER_GUIDE.md')
pdf_path = Path('docs/TEAM_HANDOVER_GUIDE.pdf')
lines = md_path.read_text(encoding='utf-8').splitlines()

c = canvas.Canvas(str(pdf_path), pagesize=letter)
c.setFont('Helvetica', 10)
y = letter[1] - 40

for line in lines:
    if y < 40:
        c.showPage()
        c.setFont('Helvetica', 10)
        y = letter[1] - 40
    c.drawString(40, y, line[:110])
    y -= 12

c.save()
print('PDF created:', pdf_path)
