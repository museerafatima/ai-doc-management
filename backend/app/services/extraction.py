import fitz  # PyMuPDF
from docx import Document as DocxDocument


def extract_pdf_text(filepath: str) -> str:
    text_parts = []

    with fitz.open(filepath) as pdf:
        for page in pdf:
            text_parts.append(page.get_text())

    return "\n".join(text_parts).strip()


def extract_docx_text(filepath: str) -> str:
    doc = DocxDocument(filepath)
    paragraphs = [p.text for p in doc.paragraphs]

    return "\n".join(paragraphs).strip()


def pdf_has_no_text(filepath: str) -> bool:
    # Scanned PDFs return an empty string here.
    # That's our OCR trigger (Day 4).
    return len(extract_pdf_text(filepath)) < 20