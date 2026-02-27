import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'

// Configure the worker script for pdf.js to prevent lagging the main UI thread.
// Using explicit Vite URL import to bundle the local worker and avoid CDN CORS errors.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
/**
 * Converts any compatible image file or the first page of a PDF into a standard PNG Blob.
 * 
 * @param {File|Blob} fileOrBlob The raw uploaded file
 * @param {string} mimeType The mime type (important if passing a raw Blob from a ZIP)
 * @returns {Promise<Blob>} A standard 'image/png' Blob
 */
export async function standardizeFileToPNG(fileOrBlob, mimeType = null) {
  const type = mimeType || fileOrBlob.type || ''

  if (type === 'application/pdf') {
    return convertPdfToPng(fileOrBlob)
  } else if (type.startsWith('image/')) {
    return convertImageToPng(fileOrBlob)
  } else {
    throw new Error('Unsupported file format. Please upload an Image or PDF.')
  }
}

/**
 * Reads a PDF, grabs the first page, renders it to a hidden canvas, and exports as PNG
 */
async function convertPdfToPng(pdfFileOrBlob) {
  const arrayBuffer = await pdfFileOrBlob.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  
  // Only process the first page as the certificate face
  const page = await pdf.getPage(1)

  // Set the rendering scale. 2.0 or 3.0 gives good quality for OCR and readability.
  const scale = 2.5 
  const viewport = page.getViewport({ scale })

  // Prepare canvas using DOM
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.height = viewport.height
  canvas.width = viewport.width

  // Render PDF page into canvas context
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  }
  
  await page.render(renderContext).promise

  // Extract exactly as a PNG blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png', 1.0)
  })
}

/**
 * Reads an image, draws it to a hidden canvas (fixing orientation/format), and exports as PNG
 */
async function convertImageToPng(imageFileOrBlob) {
  // If it's already a perfect standard PNG, we could technically skip, 
  // but drawing it to canvas strips metadata (EXIF GPS data) which is good for privacy.
  const objectUrl = URL.createObjectURL(imageFileOrBlob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      // Fill background with white in case it's a transparent image (like a vector)
      // otherwise transparent areas might turn black in some OCRs.
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', 1.0)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for standardization.'))
    }
    img.src = objectUrl
  })
}
