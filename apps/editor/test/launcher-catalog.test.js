import test from 'node:test'
import assert from 'node:assert/strict'
import { diagramTypes } from '../src/diagram-types.js'
import {
  launcherCatalog,
  launcherCatalogGroups,
  launcherEntryFor,
  filterLauncherCatalog,
} from '../src/launcher-catalog.js'

test('launcher groups cover every diagram type exactly once in the source order', () => {
  const groupedIds = launcherCatalogGroups.flatMap(group => group.items.map(item => item.id))
  assert.equal(launcherCatalog.length, 30)
  assert.equal(groupedIds.length, diagramTypes.length)
  assert.equal(new Set(groupedIds).size, groupedIds.length)
  assert.deepEqual(new Set(groupedIds), new Set(diagramTypes.map(type => type.id)))
  assert.deepEqual(launcherCatalog.map(item => item.id), diagramTypes.map(type => type.id))
  assert.deepEqual(launcherCatalogGroups.map(group => [group.label, group.items.length]), [
    ['Flow & sequence', 6],
    ['Architecture', 6],
    ['Data & charts', 4],
    ['Network & hardware', 7],
    ['Drawing & ASCII', 7],
  ])
})

test('catalog entries are normalized with group and format metadata', () => {
  for (const entry of launcherCatalog) {
    assert.equal(typeof entry.id, 'string')
    assert.equal(typeof entry.label, 'string')
    assert.equal(typeof entry.description, 'string')
    assert.ok(entry.description.length > 0)
    assert.equal(typeof entry.groupId, 'string')
    assert.equal(typeof entry.groupLabel, 'string')
    assert.ok(Array.isArray(entry.extensions))
  }
  assert.equal(launcherEntryFor('not-a-format'), null)
  assert.equal(launcherEntryFor('wireviz').groupLabel, 'Network & hardware')
})

test('catalog filtering is case-insensitive across id, label, description, and extension', () => {
  assert.deepEqual(filterLauncherCatalog('PLANTUML').map(entry => entry.id), ['plantuml', 'c4plantuml'])
  assert.deepEqual(filterLauncherCatalog('wIrInG').map(entry => entry.id), ['wireviz'])
  assert.deepEqual(filterLauncherCatalog('.yaml').map(entry => entry.id), ['wireviz'])
  assert.deepEqual(filterLauncherCatalog('   '), launcherCatalog)
})
