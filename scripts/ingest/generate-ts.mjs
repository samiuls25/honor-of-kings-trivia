import fs from 'node:fs/promises'

const skinsPath = process.argv[2] || 'data/processed/skins.normalized.json'
const metaPath = process.argv[3] || 'data/processed/meta.json'
const outputPath = process.argv[4] || 'src/data/skins.generated.ts'

async function main() {
  const [skinsRaw, metaRaw] = await Promise.all([
    fs.readFile(skinsPath, 'utf8'),
    fs.readFile(metaPath, 'utf8'),
  ])

  const skins = JSON.parse(skinsRaw)
  const meta = JSON.parse(metaRaw)

  if (!Array.isArray(skins)) {
    throw new Error(`Expected array in ${skinsPath}`)
  }

  const fileContents = `import type { SkinRecord } from '../types'\n\nexport const GENERATED_SKINS: SkinRecord[] = ${JSON.stringify(skins, null, 2)}\n\nexport const GENERATED_DATASET_META = ${JSON.stringify(meta, null, 2)} as const\n`

  await fs.writeFile(outputPath, fileContents, 'utf8')

  console.log(`Generated ${outputPath} from ${skinsPath}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
