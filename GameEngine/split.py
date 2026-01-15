import fitz  # PyMuPDF
import re
import os

# ================= CONFIG =================
INPUT_PDF = r"/mnt/data/Notice-merge.pdf"   # change path if running locally
OUTPUT_DIR = "output_notices"
NOTICES_PER_PAGE = 4
# ==========================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = fitz.open(INPUT_PDF)
notice_count = 0

def extract_part_serial(text):
    part = re.search(r"भाग\s*संख्या:\s*(\d+)", text)
    serial = re.search(r"क्रम\s*संख्या:\s*(\d+)", text)

    part_no = part.group(1) if part else "UNKNOWN"
    serial_no = serial.group(1) if serial else "UNKNOWN"
    return part_no, serial_no

for page_number in range(len(doc)):
    page = doc[page_number]

    # Split page vertically into 4 equal parts
    page_rect = page.rect
    height = page_rect.height / NOTICES_PER_PAGE

    for i in range(NOTICES_PER_PAGE):
        clip = fitz.Rect(
            page_rect.x0,
            page_rect.y0 + i * height,
            page_rect.x1,
            page_rect.y0 + (i + 1) * height
        )

        text = page.get_text("text", clip=clip).strip()

        # Skip empty blocks
        if len(text) < 50:
            continue

        part_no, serial_no = extract_part_serial(text)

        new_doc = fitz.open()
        new_page = new_doc.new_page(
            width=clip.width,
            height=clip.height
        )

        new_page.show_pdf_page(
            new_page.rect,
            doc,
            page_number,
            clip=clip
        )

        filename = f"Part_{part_no}_Serial_{serial_no}.pdf"
        output_path = os.path.join(OUTPUT_DIR, filename)

        new_doc.save(output_path)
        new_doc.close()

        notice_count += 1
        print(f"Saved: {filename}")

doc.close()

print(f"\n✅ DONE! Total notices extracted: {notice_count}")
