'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// pdf.js 3.11.174 via CDN — avoids all Next.js/webpack bundling issues
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfjsLib = any

interface Props {
  pdfPath: string
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  lockedFields?: string[]
  signatureFieldNames?: string[]
  errors?: Record<string, string>
}

export function PdfFormFiller({
  pdfPath,
  values,
  onChange,
  lockedFields = [],
  signatureFieldNames = ['Patient Signature'],
  errors = {},
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const annotationLayerRef = useRef<HTMLDivElement>(null)

  // Natural page width at scale=1 (used to compute fit-to-width scale)
  const naturalWidthRef = useRef(0)
  // Current render scale — set to fit container width, updated on resize
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
  useEffect(() => { scaleRef.current = scale }, [scale])

  // Internal form data store — not reactive, avoids re-render loops
  const formDataRef = useRef<Record<string, string>>({})
  // Stable refs to avoid stale closures in renderPage
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  const lockedFieldsRef = useRef(lockedFields)
  useEffect(() => { lockedFieldsRef.current = lockedFields }, [lockedFields])
  const signatureFieldNamesRef = useRef(signatureFieldNames)
  useEffect(() => { signatureFieldNamesRef.current = signatureFieldNames }, [signatureFieldNames])

  const [pdfjsLib, setPdfjsLib] = useState<PdfjsLib>(null)
  const [pdfDoc, setPdfDoc] = useState<PdfjsLib>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Keep pdfDoc in a ref so renderPage can access the current version
  const pdfDocRef = useRef<PdfjsLib>(null)
  useEffect(() => { pdfDocRef.current = pdfDoc }, [pdfDoc])

  // ─── Step 1: Load pdf.js from CDN ─────────────────────────────────────────
  useEffect(() => {
    // If already loaded (e.g. hot-reload), reuse it
    const existing = (window as PdfjsLib)['pdfjs-dist/build/pdf']
    if (existing) {
      existing.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
      setPdfjsLib(existing)
      return
    }

    const script = document.createElement('script')
    script.src = PDFJS_CDN
    script.async = true
    script.onload = () => {
      const lib = (window as PdfjsLib)['pdfjs-dist/build/pdf']
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
      setPdfjsLib(lib)
    }
    script.onerror = () => setLoadError('Failed to load PDF viewer. Check your internet connection.')
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  // ─── Step 2: Load PDF when lib is ready ───────────────────────────────────
  useEffect(() => {
    if (!pdfjsLib) return

    // Seed internal form data from parent values (pre-fills from intake)
    formDataRef.current = { ...values }

    setIsLoading(true)
    setLoadError(null)

    pdfjsLib.getDocument(pdfPath).promise
      .then(async (doc: PdfjsLib) => {
        // Measure natural page width to compute fit-to-screen scale
        const firstPage = await doc.getPage(1)
        const naturalVp = firstPage.getViewport({ scale: 1, rotation: 0 })
        naturalWidthRef.current = naturalVp.width

        const containerWidth = containerRef.current?.clientWidth ?? 390
        const fitScale = containerWidth / naturalVp.width
        scaleRef.current = fitScale
        setScale(fitScale)

        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setCurrentPage(1)
      })
      .catch(() => {
        setLoadError('Failed to load the form PDF.')
        setIsLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfjsLib, pdfPath])

  // ─── Step 3: Render page whenever pdfDoc or currentPage changes ──────────
  const renderPage = useCallback(async (doc: PdfjsLib, pageNum: number) => {
    if (!doc || !canvasRef.current || !annotationLayerRef.current) return
    setIsLoading(true)

    try {
      const page = await doc.getPage(pageNum)
      // Force rotation: 0 — the PDF has a Rotate entry that pdf.js would apply,
      // producing an upside-down render. We override it here so the content
      // renders at its stored (correct) orientation.
      const viewport = page.getViewport({ scale: scaleRef.current, rotation: 0 })

      // Render PDF to canvas — scale by devicePixelRatio for sharp text on retina/mobile
      const dpr = window.devicePixelRatio || 1
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      ctx.scale(dpr, dpr)
      await page.render({ canvasContext: ctx, viewport }).promise

      // Build annotation layer
      const annotations = await page.getAnnotations()
      const layer = annotationLayerRef.current
      layer.innerHTML = ''
      layer.style.width = `${viewport.width}px`
      layer.style.height = `${viewport.height}px`

      const widgets = annotations.filter((a: PdfjsLib) => a.subtype === 'Widget')

      for (const ann of widgets) {
        const r = viewport.convertToViewportRectangle(ann.rect)
        const left = Math.min(r[0], r[2])
        const top = Math.min(r[1], r[3])
        const width = Math.abs(r[2] - r[0])
        const height = Math.abs(r[3] - r[1])

        const isLocked = lockedFieldsRef.current.includes(ann.fieldName)
        const isSignature =
          signatureFieldNamesRef.current.includes(ann.fieldName) || ann.fieldType === 'Sig'
        const isCheckbox = ann.fieldType === 'Btn'

        if (isSignature) {
          buildSignatureField(layer, ann.fieldName, left, top, width, height)
        } else if (isCheckbox) {
          // exportValue is the specific value this button represents (e.g. 'English', 'Yes')
          const exportValue: string = ann.exportValue ?? ann.buttonValue ?? 'true'
          buildCheckboxField(layer, ann.fieldName, exportValue, left, top, width, height)
        } else {
          buildTextField(layer, ann.fieldName, left, top, width, height, isLocked)
        }
      }
    } catch (e) {
      console.error('renderPage error', e)
    }

    setIsLoading(false)
  }, []) // stable — uses refs for all mutable deps

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage)
  }, [pdfDoc, currentPage, scale, renderPage])

  // Re-seed formDataRef when parent provides values after initial load
  // (e.g. audit page loads patient's saved form values after PDF is already rendered)
  useEffect(() => {
    let needsRerender = false
    for (const [key, val] of Object.entries(values)) {
      if (val && !formDataRef.current[key]) {
        formDataRef.current[key] = val
        needsRerender = true
      }
    }
    if (needsRerender && pdfDoc) {
      renderPage(pdfDoc, currentPage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  // Re-fit on container resize (orientation change, window resize)
  useEffect(() => {
    if (!containerRef.current || !naturalWidthRef.current) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width
      if (!width || !naturalWidthRef.current) return
      const fitScale = width / naturalWidthRef.current
      setScale(fitScale)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [pdfDoc])

  // ─── Field builders (DOM manipulation) ────────────────────────────────────

  function buildTextField(
    layer: HTMLDivElement,
    fieldName: string,
    left: number, top: number, width: number, height: number,
    isLocked: boolean,
  ) {
    const input = document.createElement('input')
    input.type = 'text'
    input.name = fieldName
    input.disabled = isLocked
    input.autocomplete = 'off'
    input.value = formDataRef.current[fieldName] ?? ''

    const fontSize = Math.max(9, Math.min(13, height * 0.52))

    input.style.cssText = [
      `position:absolute`,
      `left:${left}px`,
      `top:${top}px`,
      `width:${width}px`,
      `height:${height}px`,
      `margin:0`,
      `padding:0 4px`,
      `font-size:${fontSize}px`,
      `font-family:inherit`,
      `border:none`,
      `outline:none`,
      `line-height:1`,
      `border-radius:2px`,
      `transition:background 0.15s`,
      isLocked
        ? `background:rgba(219,234,254,0.65);color:#475569;cursor:not-allowed`
        : `background:rgba(254,240,138,0.45);color:#0f172a`,
    ].join(';')

    if (!isLocked) {
      input.onfocus = () => { input.style.background = 'rgba(255,255,255,0.95)'; input.style.outline = '2px solid #3b82f6'; input.style.outlineOffset = '0px' }
      input.onblur = () => { input.style.background = 'rgba(254,240,138,0.45)'; input.style.outline = 'none' }
      input.oninput = () => {
        formDataRef.current[fieldName] = input.value
        onChangeRef.current(fieldName, input.value)
      }
    }

    layer.appendChild(input)
  }

  function buildCheckboxField(
    layer: HTMLDivElement,
    fieldName: string,
    exportValue: string,
    left: number, top: number, width: number, height: number,
  ) {
    // Accept both the PDF's native exportValue AND the string 'true' that we
    // store when filling programmatically via expandRadioValues / loadAndFillPdf.
    const stored = formDataRef.current[fieldName]
    const isChecked = stored === exportValue || stored === 'true'

    const box = document.createElement('div')

    box.style.cssText = [
      `position:absolute`,
      `left:${left}px`,
      `top:${top}px`,
      `width:${width}px`,
      `height:${height}px`,
      `border-radius:2px`,
      `cursor:pointer`,
      `display:flex`,
      `align-items:center`,
      `justify-content:center`,
      `font-size:${height * 0.75}px`,
      `line-height:1`,
      `color:#78350f`,
      `font-weight:bold`,
      `user-select:none`,
      `transition:background 0.1s`,
      `background:${isChecked ? 'rgba(254,221,0,0.85)' : 'rgba(254,240,138,0.55)'}`,
      `border:1.5px solid ${isChecked ? 'rgba(161,98,7,0.7)' : 'rgba(202,138,4,0.45)'}`,
    ].join(';')

    box.textContent = isChecked ? '✓' : ''

    function applyState(checked: boolean) {
      box.textContent = checked ? '✓' : ''
      box.style.background = checked ? 'rgba(254,221,0,0.85)' : 'rgba(254,240,138,0.55)'
      box.style.border = checked
        ? '2px solid rgba(161,98,7,0.7)'
        : '2px solid rgba(202,138,4,0.45)'
    }

    box.onclick = () => {
      const currentlyChecked = formDataRef.current[fieldName] === exportValue || formDataRef.current[fieldName] === 'true'
      const nowChecked = !currentlyChecked
      // Always store 'true' — consistent with loadAndFillPdf's check() trigger
      formDataRef.current[fieldName] = nowChecked ? 'true' : ''
      onChangeRef.current(fieldName, nowChecked ? 'true' : '')
      applyState(nowChecked)
    }

    layer.appendChild(box)
  }

  function buildSignatureField(
    layer: HTMLDivElement,
    fieldName: string,
    left: number, top: number, width: number, height: number,
  ) {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = [
      `position:absolute`,
      `left:${left}px`,
      `top:${top}px`,
      `width:${width}px`,
      `height:${height}px`,
      `border:1.5px dashed #93c5fd`,
      `border-radius:3px`,
      `background:rgba(239,246,255,0.85)`,
      `overflow:hidden`,
      `cursor:crosshair`,
      `touch-action:none`,
    ].join(';')

    const sigCanvas = document.createElement('canvas')
    sigCanvas.width = Math.floor(width * 2)
    sigCanvas.height = Math.floor(height * 2)
    sigCanvas.style.cssText = `width:100%;height:100%;display:block;cursor:crosshair`

    // Restore existing signature if present
    const existing = formDataRef.current[fieldName]
    if (existing) {
      const img = new Image()
      img.onload = () => {
        const ctx = sigCanvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height)
      }
      img.src = existing
    }

    // Placeholder text
    const placeholder = document.createElement('div')
    placeholder.style.cssText = [
      `position:absolute;inset:0;display:flex;align-items:center;justify-content:center`,
      `pointer-events:none;color:#93c5fd;font-size:${Math.max(9, height * 0.3)}px;font-family:inherit`,
      existing ? 'opacity:0' : 'opacity:1',
    ].join(';')
    placeholder.textContent = 'Sign here'

    // Drawing logic
    let drawing = false
    let lastX = 0
    let lastY = 0

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = sigCanvas.getBoundingClientRect()
      const scaleX = sigCanvas.width / rect.width
      const scaleY = sigCanvas.height / rect.height
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      drawing = true
      const pos = getPos(e)
      lastX = pos.x; lastY = pos.y
    }

    function draw(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing) return
      const ctx = sigCanvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      lastX = pos.x; lastY = pos.y
      placeholder.style.opacity = '0'
    }

    function endDraw() {
      if (!drawing) return
      drawing = false
      const dataUrl = sigCanvas.toDataURL('image/png')
      formDataRef.current[fieldName] = dataUrl
      onChangeRef.current(fieldName, dataUrl)
    }

    sigCanvas.addEventListener('mousedown', startDraw)
    sigCanvas.addEventListener('mousemove', draw)
    sigCanvas.addEventListener('mouseup', endDraw)
    sigCanvas.addEventListener('mouseleave', endDraw)
    sigCanvas.addEventListener('touchstart', startDraw, { passive: false })
    sigCanvas.addEventListener('touchmove', draw, { passive: false })
    sigCanvas.addEventListener('touchend', endDraw)

    wrapper.appendChild(sigCanvas)
    wrapper.appendChild(placeholder)
    layer.appendChild(wrapper)
  }

  // ─── Page navigation ───────────────────────────────────────────────────────

  function handlePrev() {
    if (currentPage > 1) setCurrentPage(p => p - 1)
  }

  function handleNext() {
    if (currentPage < numPages) setCurrentPage(p => p + 1)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="py-16 text-center px-6">
        <p className="text-red-500 text-sm">{loadError}</p>
      </div>
    )
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      {/* Error banner */}
      {hasErrors && (
        <div className="w-full px-4 mb-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700 font-medium">
              Please fill in all required fields highlighted in the form.
            </p>
          </div>
        </div>
      )}

      {/* PDF canvas + annotation layer */}
      <div className="w-full overflow-x-auto">
        <div className="relative w-max mx-auto shadow-lg bg-white">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Loading form...</span>
              </div>
            </div>
          )}

          {/* The PDF canvas */}
          <canvas ref={canvasRef} className="block" />

          {/* The interactive AcroForm annotation layer */}
          <div
            ref={annotationLayerRef}
            className="absolute top-0 left-0 pointer-events-auto"
          />
        </div>
      </div>

      {/* Page navigation */}
      {numPages > 1 && (
        <div className="flex items-center gap-4 mt-4 mb-2">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-colors"
          >
            ← Prev Page
          </button>
          <span className="text-sm text-slate-500 font-medium tabular-nums">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= numPages}
            className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-colors"
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  )
}
