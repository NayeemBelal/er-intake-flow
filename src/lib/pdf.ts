import { PDFDocument, StandardFonts, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib'

export interface SignaturePlacement {
  pageIndex: number  // 0-based
  x: number
  y: number
  width: number
  height: number
}

export async function loadAndFillPdf(
  formName: string,
  values: Record<string, string>,
  signatureDataUrl?: string,
  signaturePlacements?: SignaturePlacement[]
): Promise<Uint8Array | null> {
  try {
    const res = await fetch(`/forms/${formName}.pdf`)
    if (!res.ok) return null

    const pdfBytes = await res.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const form = pdfDoc.getForm()

    for (const [fieldName, value] of Object.entries(values)) {
      if (!value) continue
      try {
        const field = form.getField(fieldName)
        if (field instanceof PDFTextField) {
          field.setText(value)
        } else if (field instanceof PDFCheckBox && value === 'true') {
          field.check()
        }
      } catch {
        // Field doesn't exist in this PDF — skip
      }
    }

    // Draw English checkbox mark — no AcroForm field exists for it
    if (formName === 'registration' && values['lang_english'] === 'true') {
      try {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const pages = pdfDoc.getPages()
        pages[0].drawText('X', { x: 389, y: 505, size: 7, font, color: rgb(0, 0, 0) })
      } catch {
        // Skip if drawing fails
      }
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    form.updateFieldAppearances(font)
    form.flatten()

    // Draw signatures AFTER flatten so the empty AcroForm appearance doesn't overwrite them
    if (signatureDataUrl && signaturePlacements && signaturePlacements.length > 0) {
      try {
        const sigImg = await pdfDoc.embedPng(signatureDataUrl)
        const pages = pdfDoc.getPages()
        for (const p of signaturePlacements) {
          if (p.pageIndex < pages.length) {
            pages[p.pageIndex].drawImage(sigImg, {
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
            })
          }
        }
      } catch {
        // Skip if embedding fails
      }
    }

    return await pdfDoc.save()
  } catch {
    return null
  }
}

export async function mergePdfs(pdfBytesList: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const bytes of pdfBytesList) {
    const doc = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  return merged.save()
}
