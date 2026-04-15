import type { SkinRecord } from '../types'

export const GENERATED_SKINS: SkinRecord[] = []

export const GENERATED_DATASET_META = {
  version: '0.0.0',
  source: 'none',
  items: 0,
  note: 'No generated dataset yet. Run npm run ingest:all after adding a capture file.',
} as const
