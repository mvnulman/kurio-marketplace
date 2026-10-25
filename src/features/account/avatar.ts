/** Redimensiona e comprime a imagem escolhida para um avatar quadrado (data URL). */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error('Envie uma imagem PNG, JPEG ou WebP.')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('A imagem é muito grande (máximo de 8 MB).')
  }

  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar a imagem neste navegador.')

  // Recorte central (cover) para manter o rosto no quadro.
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
  bitmap.close()

  return canvas.toDataURL('image/webp', 0.85)
}
