/**
 * Gera os assets de NFT a partir dos originais exportados do Figma.
 *
 * Os originais (`assets-source/*.png`) são as 4 artes base do arquivo.
 * O layout do Figma reaproveita a mesma arte com variações de cor para
 * compor coleções diferentes; este script reproduz essa lógica de forma
 * determinística e versionável, em vez de versionar 24 arquivos editados
 * manualmente.
 *
 * Uso: pnpm assets
 */
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const sourceDir = path.join(root, 'assets-source')
const outputDir = path.join(root, 'public', 'assets', 'nfts')

/** 6 variações por arte base = 24 NFTs no catálogo. */
const VARIANTS = [
  { hue: 0, saturation: 1, brightness: 1 },
  { hue: 18, saturation: 1.08, brightness: 1.02 },
  { hue: -24, saturation: 0.92, brightness: 0.98 },
  { hue: 42, saturation: 1.12, brightness: 1.04 },
  { hue: -48, saturation: 0.88, brightness: 0.96 },
  { hue: 8, saturation: 0.78, brightness: 1.06 },
]

const BASES = ['1.png', '2.png', '3.png', '4.png']

async function main() {
  await mkdir(outputDir, { recursive: true })

  let index = 0
  for (const [baseIndex, base] of BASES.entries()) {
    for (const [variantIndex, variant] of VARIANTS.entries()) {
      index += 1
      const slug = `ape-${String(index).padStart(2, '0')}`
      const output = path.join(outputDir, `${slug}.webp`)

      await sharp(path.join(sourceDir, base))
        .modulate({
          hue: variant.hue,
          saturation: variant.saturation,
          brightness: variant.brightness,
        })
        .resize(900, 900, { fit: 'cover' })
        .webp({ quality: 82, effort: 5 })
        .toFile(output)

      console.log(
        `[assets] ${slug} <- ${base} (base ${baseIndex + 1}, var ${variantIndex + 1})`,
      )
    }
  }

  console.log(`[assets] ${index} imagens geradas em public/assets/nfts`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
