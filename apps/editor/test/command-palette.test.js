import assert from 'node:assert/strict'
import test from 'node:test'
import { createCommandPaletteModel, flattenCommandGroups } from '../src/command-palette.js'

const commands = [
  { id: 'open', label: 'Open File', description: 'Open a diagram', keywords: ['load'], shortcut: '⌘O', run: () => 'open' },
  { id: 'disabled', label: 'Open Recent', disabled: true },
  { id: 'save', label: 'Save File', keywords: 'persist', shortcut: '⌘S', run: () => 'save' },
  { id: 'export', label: 'Export SVG', description: 'Download image', run: () => 'export' },
]

test('flattens groups in stable order', () => {
  assert.deepEqual(flattenCommandGroups([
    { id: 'files', commands: commands.slice(0, 2) },
    { id: 'share', commands: commands.slice(2) },
  ]), commands)
})

test('filters case-insensitively by all query tokens across command fields', () => {
  const model = createCommandPaletteModel([{ commands }])
  assert.deepEqual(model.filter('  SVG download '), [commands[3]])
  assert.deepEqual(model.filter('LOAD ⌘o'), [commands[0]])
  assert.deepEqual(model.filter('file'), [commands[0], commands[2]])
})

test('selectFirst chooses the first enabled result and navigation skips disabled commands cyclically', () => {
  const model = createCommandPaletteModel([{ commands }])
  assert.equal(model.selectFirst(), commands[0])
  assert.equal(model.next(), commands[2])
  assert.equal(model.next(), commands[3])
  assert.equal(model.next(), commands[0])
  assert.equal(model.previous(), commands[3])
  assert.equal(model.previous(), commands[2])
})

test('navigation with no current selection starts at the relevant end and handles no results', () => {
  const model = createCommandPaletteModel([{ commands }])
  assert.equal(model.previous(), commands[3])
  assert.equal(model.filter('missing').length, 0)
  assert.equal(model.next(), null)
  assert.equal(model.selected, null)
})

test('lookup and selecting by id preserve command identity, while disabled commands cannot be selected', () => {
  const model = createCommandPaletteModel([{ commands }])
  assert.equal(model.getById('save'), commands[2])
  assert.equal(model.selectById('save'), commands[2])
  assert.equal(model.selectedId, 'save')
  assert.equal(model.selectById('disabled'), null)
  assert.equal(model.getById('unknown'), null)
})
