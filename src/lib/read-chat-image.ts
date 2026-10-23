"use client"

const MAX_EDGE = 1600

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Gambar tidak bisa dibuka."))
    }
    image.src = url
  })
}

/** Perkecil screenshot besar biar OCR lebih cepat di HP. */
async function prepareImage(file: Blob): Promise<Blob> {
  const image = await loadImage(file)
  const longest = Math.max(image.width, image.height)
  if (longest <= MAX_EDGE) return file

  const scale = MAX_EDGE / longest
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  )
  return blob ?? file
}

/** Rapikan noise OCR umum dari screenshot WA / Instagram. */
export function normalizeOcrText(text: string) {
  return text
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[|]/g, "I")
    .replace(/\bjam\s*[Oo](\d)/gi, "jam 0$1")
    .replace(/\bpukul\s*[Oo](\d)/gi, "pukul 0$1")
    .replace(/(\d)[Oo](\d{2})\b/g, "$10$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function extractTextFromChatImage(
  file: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const prepared = await prepareImage(file)
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("ind+eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.(Math.round(message.progress * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(prepared)
    return normalizeOcrText(text)
  } finally {
    await worker.terminate()
  }
}

export function isChatImageFile(file: File | Blob | null | undefined): file is File {
  if (!file || !(file instanceof File)) return false
  if (file.type.startsWith("image/")) return true
  return /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(file.name)
}
