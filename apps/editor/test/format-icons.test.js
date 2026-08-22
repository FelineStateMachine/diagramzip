import assert from 'node:assert/strict'
import test from 'node:test'
import { formatIconMarkup, hasFormatIcon } from '../src/format-icons.js'
import { launcherCatalog } from '../src/launcher-catalog.js'

test('every launcher format has a static iconographic representation', () => {
  for (const entry of launcherCatalog) {
    assert.equal(hasFormatIcon(entry.id), true, `${entry.id} should have an assigned icon`)
    assert.match(formatIconMarkup(entry.id), /^<svg[^>]+>.+<\/svg>$/)
  }
})
