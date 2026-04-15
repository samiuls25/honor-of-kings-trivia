import fs from 'node:fs/promises'

const inputPath = process.argv[2] || 'data/processed/skins.normalized.json'

async function main() {
  const raw = await fs.readFile(inputPath, 'utf8')
  const skins = JSON.parse(raw)

  if (!Array.isArray(skins)) {
    throw new Error(`Expected array in ${inputPath}`)
  }

  const issues = []
  const ids = new Set()

  skins.forEach((skin, index) => {
    const entry = `record ${index + 1}`

    if (!skin || typeof skin !== 'object') {
      issues.push(`${entry}: value must be an object`)
      return
    }

    if (!skin.id || typeof skin.id !== 'string') {
      issues.push(`${entry}: missing string id`)
    } else if (ids.has(skin.id)) {
      issues.push(`${entry}: duplicate id ${skin.id}`)
    } else {
      ids.add(skin.id)
    }

    if (!skin.heroId || typeof skin.heroId !== 'string') {
      issues.push(`${entry}: missing string heroId`)
    }

    if (!skin.heroName || typeof skin.heroName !== 'string') {
      issues.push(`${entry}: missing string heroName`)
    }

    if (!skin.skinName || typeof skin.skinName !== 'string') {
      issues.push(`${entry}: missing string skinName`)
    }

    if (!Array.isArray(skin.heroAliases)) {
      issues.push(`${entry}: heroAliases must be an array`)
    }

    if (!Array.isArray(skin.skinAliases)) {
      issues.push(`${entry}: skinAliases must be an array`)
    }

    if (!skin.imageUrl || typeof skin.imageUrl !== 'string') {
      issues.push(`${entry}: missing string imageUrl`)
    } else if (
      !skin.imageUrl.startsWith('http://') &&
      !skin.imageUrl.startsWith('https://') &&
      !skin.imageUrl.startsWith('data:')
    ) {
      issues.push(`${entry}: imageUrl should be absolute URL or data URI`)
    }

    if (!skin.source || typeof skin.source !== 'string') {
      issues.push(`${entry}: missing string source`)
    }
  })

  if (issues.length > 0) {
    console.error(`Validation failed with ${issues.length} issue(s):`)
    for (const issue of issues) {
      console.error(`- ${issue}`)
    }
    process.exit(1)
  }

  console.log(`Validation passed: ${skins.length} records`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
