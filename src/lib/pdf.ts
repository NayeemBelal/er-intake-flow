import { PDFDocument } from 'pdf-lib'

export async function loadAndFillPdf(
  formName: string,
  values: Record<string, string>,
  signatureDataUrl?: string
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
        const type = field.constructor.name
        if (type === 'PDFTextField') {
          form.getTextField(fieldName).setText(value)
        } else if (type === 'PDFCheckBox' && value === 'true') {
          form.getCheckBox(fieldName).check()
        }
      } catch {
        // Field doesn't exist in this PDF — skip
      }
    }

    // Embed signature image on the last page
    if (signatureDataUrl) {
      try {
        const sigImg = await pdfDoc.embedPng(signatureDataUrl)
        const pages = pdfDoc.getPages()
        const lastPage = pages[pages.length - 1]
        lastPage.drawImage(sigImg, { x: 50, y: 50, width: 200, height: 60 })
      } catch {
        // Skip if embedding fails
      }
    }

    form.flatten()
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
