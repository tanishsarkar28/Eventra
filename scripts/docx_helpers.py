import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs: top, bottom, left, right
    values: {"val": "single", "sz": "4", "color": "D1D5DB"}
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'D1D5DB'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def add_hyperlink(paragraph, url, text, color="2563EB", underline=True):
    part = paragraph.part
    r_id = part.relate_to(url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = parse_xml(f'<w:hyperlink {nsdecls("w", "r")} r:id="{r_id}" w:history="1"/>')
    new_run = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:rStyle w:val="Hyperlink"/><w:color w:val="{color}"/><w:u w:val="single"/></w:rPr><w:t>{text}</w:t></w:r>')
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)

def style_heading(p, font_size, color_rgb, space_before, space_after, bold=True):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = 'Calibri'
        r.font.size = Pt(font_size)
        r.font.bold = bold
        r.font.color.rgb = color_rgb

def add_callout_box(doc, text, title=None, border_color="2563EB", fill_color="EFF6FF"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=140)
    set_cell_border(cell, 
                    left={"val": "single", "sz": "24", "color": border_color},
                    top={"val": "single", "sz": "4", "color": "E2E8F0"},
                    bottom={"val": "single", "sz": "4", "color": "E2E8F0"},
                    right={"val": "single", "sz": "4", "color": "E2E8F0"})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    if title:
        run_t = p.add_run(f"📌 {title}\n")
        run_t.font.name = 'Calibri'
        run_t.font.size = Pt(10.5)
        run_t.font.bold = True
        run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    run_b = p.add_run(text)
    run_b.font.name = 'Calibri'
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    # spacing after table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def add_custom_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        set_cell_border(hdr_cells[i],
                        top={"sz": 4, "color": "1E3A8A"},
                        bottom={"sz": 12, "color": "0F172A"},
                        left={"sz": 4, "color": "2563EB"},
                        right={"sz": 4, "color": "2563EB"})
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    # Data Rows
    for r_idx, row in enumerate(data):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_hex = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_hex)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=140, right=140)
            set_cell_border(row_cells[c_idx],
                            top={"sz": 4, "color": "E2E8F0"},
                            bottom={"sz": 4, "color": "E2E8F0"},
                            left={"sz": 4, "color": "E2E8F0"},
                            right={"sz": 4, "color": "E2E8F0"})
            p = row_cells[c_idx].paragraphs[0]
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Apply col widths if provided
    if col_widths:
        for row in tbl.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)

    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)
    return tbl

def add_diagram_image(doc, img_path, caption, width_in=6.2):
    if os.path.exists(img_path):
        doc.add_picture(img_path, width=Inches(width_in))
        p_img = doc.paragraphs[-1]
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(10)
        r_cap = p_cap.add_run(f"Figure: {caption}")
        r_cap.font.name = 'Calibri'
        r_cap.font.size = Pt(9)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

print("Helper functions defined.")
