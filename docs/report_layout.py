from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs/assets'
OUT = ROOT / 'output'
ASSETS.mkdir(parents=True, exist_ok=True)
OUT.mkdir(exist_ok=True)
FONT = 'C:/Windows/Fonts/times.ttf'
BOLD = 'C:/Windows/Fonts/timesbd.ttf'

doc = Document()
sec=doc.sections[0]
sec.page_width=Mm(210); sec.page_height=Mm(297)
sec.top_margin=Mm(20); sec.bottom_margin=Mm(20); sec.left_margin=Mm(25); sec.right_margin=Mm(15)
sec.footer_distance=Mm(10); sec.different_first_page_header_footer=True
for name in ['Normal','Title','Heading 1','Heading 2','Heading 3','Caption']:
    st=doc.styles[name]; st.font.name='Times New Roman'; st.font.size=Pt(12); st.font.color.rgb=RGBColor(0,0,0)
    fonts=st.element.get_or_add_rPr().rFonts
    for key in list(fonts.attrib):
        if 'Theme' in key or 'theme' in key: del fonts.attrib[key]
    for key in ['ascii','hAnsi','eastAsia','cs']: fonts.set(qn('w:'+key),'Times New Roman')
    st.paragraph_format.space_after=Pt(6)
    st.paragraph_format.line_spacing=1.25
for border in list(doc.styles.element.iter(qn('w:pBdr'))): border.getparent().remove(border)
normal=doc.styles['Normal']; normal.paragraph_format.first_line_indent=Mm(10); normal.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
for name in ['Heading 1','Heading 2']:
    doc.styles[name].font.bold=True
    doc.styles[name].paragraph_format.first_line_indent=Mm(0)
    doc.styles[name].paragraph_format.keep_with_next=True
doc.styles['Heading 1'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.styles['Heading 1'].paragraph_format.space_after=Pt(16)
doc.styles['Caption'].font.italic=False
doc.styles['Caption'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.styles['Caption'].paragraph_format.first_line_indent=Mm(0)
fp=sec.footer.paragraphs[0]; fp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
field=OxmlElement('w:fldSimple'); field.set(qn('w:instr'),'PAGE'); fp._p.append(field)
doc.core_properties.author='Клебанський Іван Михайлович'
doc.core_properties.title='Фронтенд підсистеми генерації звітів'
doc.core_properties.subject='Індивідуальний STEM-проєкт з ОК Розробник фронтенду програмних систем'
markdown=[]

def p(text,bold=False,align=None):
    q=doc.add_paragraph(); q.add_run(text).bold=bold
    previous=q._p.getprevious()
    if previous is not None and previous.tag == qn('w:tbl'): q.paragraph_format.space_before=Pt(6)
    if align is not None: q.alignment=align; q.paragraph_format.first_line_indent=Mm(0)
    markdown.append(text+'\n')
    return q
def h(text,level=2):
    doc.add_heading(text,level); markdown.append('#'*level+' '+text+'\n')
def page(title):
    h(title,1); doc.paragraphs[-1].paragraph_format.page_break_before=True
def fig(file,caption,width=165):
    q=doc.add_paragraph(); q.alignment=WD_ALIGN_PARAGRAPH.CENTER; q.paragraph_format.first_line_indent=Mm(0)
    q.add_run().add_picture(str(ASSETS/file),width=Mm(width))
    q.paragraph_format.keep_with_next=True
    doc.add_paragraph(caption,'Caption')
    markdown.append(f'![{caption}](assets/{file})\n')
def table(caption,headers,rows,widths):
    q=p(caption); q.paragraph_format.first_line_indent=Mm(0); q.paragraph_format.keep_with_next=True
    t=doc.add_table(rows=1, cols=len(headers)); t.style='Table Grid'; t.autofit=False
    borders=OxmlElement('w:tblBorders')
    for edge in ['top','left','bottom','right','insideH','insideV']:
        border=OxmlElement('w:'+edge); border.set(qn('w:val'),'single'); border.set(qn('w:sz'),'4'); border.set(qn('w:color'),'D9D9D9'); borders.append(border)
    t._tbl.tblPr.append(borders)
    for cell,w in zip(t.columns,widths): cell.width=Mm(w)
    for c,v in zip(t.rows[0].cells,headers): c.text=v
    repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        for c,v in zip(t.add_row().cells,row): c.text=str(v)
    for ri,row in enumerate(t.rows):
        cant=OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(cant)
        for c,w in zip(row.cells,widths):
            c.width=Mm(w)
            from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
            c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if ri==0:
                fill=OxmlElement('w:shd'); fill.set(qn('w:fill'),'E8EBEE'); c._tc.get_or_add_tcPr().append(fill)
            for q in c.paragraphs:
                q.paragraph_format.first_line_indent=Mm(0); q.paragraph_format.line_spacing=1.0; q.paragraph_format.space_after=Pt(3); q.paragraph_format.space_before=Pt(3); q.alignment=WD_ALIGN_PARAGRAPH.LEFT
                for r in q.runs: r.font.size=Pt(12); r.bold=(ri==0)
    markdown.append('| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,r))+' |' for r in rows)+'\n')

