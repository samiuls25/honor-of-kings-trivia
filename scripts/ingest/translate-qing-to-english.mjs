import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_INPUT = 'data/processed/skins.qing.normalized.json'
const DEFAULT_OUTPUT = 'data/processed/skins.qing.en.normalized.json'
const DEFAULT_CACHE = 'data/processed/qing.translate-cache.en.json'

function hasCjk(value) {
  return /[\u3400-\u9FFF]/u.test(value)
}

function toTitleCaseFromSlug(value) {
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeEnglish(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
}

async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function translateText(text, cache) {
  const input = String(text || '').trim()
  if (!input) {
    return ''
  }

  if (!hasCjk(input)) {
    return input
  }

  if (cache[input]) {
    return cache[input]
  }

  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(input)}`

  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json,text/plain,*/*',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Translation request failed: HTTP ${response.status}`)
  }

  const payload = await response.json()
  const pieces = Array.isArray(payload?.[0]) ? payload[0] : []
  const translated = normalizeEnglish(pieces.map((piece) => String(piece?.[0] || '')).join(''))

  cache[input] = translated || input
  return cache[input]
}

function collectTranslationInputs(records) {
  const unique = new Set()

  for (const record of records) {
    unique.add(record.heroName)
    unique.add(record.skinName)

    for (const alias of record.heroAliases || []) {
      unique.add(alias)
    }

    for (const alias of record.skinAliases || []) {
      unique.add(alias)
    }
  }

  return [...unique]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

function applyTranslation(records, map) {
  return records.map((record) => {
    const heroAliases = (record.heroAliases || []).map((alias) => map[alias] || alias)
    const skinAliases = (record.skinAliases || []).map((alias) => map[alias] || alias)

    const translatedHeroName = normalizeEnglish(map[record.heroName] || record.heroName)
    const translatedSkinName = normalizeEnglish(map[record.skinName] || record.skinName)

    const fallbackHeroName = toTitleCaseFromSlug(record.heroId || 'hero')
    const fallbackSkinName = toTitleCaseFromSlug(
      String(record.id || '').replace(new RegExp(`^${String(record.heroId || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`), '') || 'skin',
    )

    const heroName = hasCjk(translatedHeroName)
      ? fallbackHeroName || 'Hero'
      : translatedHeroName

    const skinName = hasCjk(translatedSkinName)
      ? fallbackSkinName || 'Skin'
      : translatedSkinName

    return {
      ...record,
      heroName,
      heroAliases: heroAliases.filter((alias) => !hasCjk(alias)),
      skinName,
      skinAliases: skinAliases.filter((alias) => !hasCjk(alias)),
      source: `${record.source}|translated-en`,
    }
  })
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT
  const outputPath = process.argv[3] || DEFAULT_OUTPUT
  const cachePath = process.argv[4] || DEFAULT_CACHE

  const records = await readJsonSafe(inputPath, null)
  if (!Array.isArray(records)) {
    throw new Error(`Expected array in ${inputPath}`)
  }

  const cache = await readJsonSafe(cachePath, {})
  const inputs = collectTranslationInputs(records)

  let translatedCount = 0

  for (const input of inputs) {
    const translated = await translateText(input, cache)
    if (translated !== input) {
      translatedCount += 1
    }
  }

  const translatedMap = cache
  const translatedRecords = applyTranslation(records, translatedMap)

  await fs.mkdir(path.dirname(outputPath), { recursive: true })

  await Promise.all([
    fs.writeFile(outputPath, `${JSON.stringify(translatedRecords, null, 2)}\n`, 'utf8'),
    fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8'),
  ])

  console.log(`Translated ${translatedCount} unique strings to English.`)
  console.log(`Wrote ${outputPath}`)
  console.log(`Updated ${cachePath}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
