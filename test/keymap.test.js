import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
	DEFAULT_KEYMAP,
	buildKeymap,
	isReservedBinding,
	formatBinding,
} from '../src/lib/keymap.js'
import { parseSimpleYaml } from '../src/lib/config.js'

test('defaults cover every action with a valid binding', () => {
	for (const [action, binding] of Object.entries(DEFAULT_KEYMAP)) {
		assert.doesNotThrow(() => buildKeymap({ [action]: binding }), action)
	}
})

test('overrides replace defaults per action and normalize case', () => {
	const map = buildKeymap({ nextItem: 'Right,N,J,E,Space' })
	assert.equal(map.nextItem, 'right,n,j,e,space')
	assert.equal(map.prevItem, DEFAULT_KEYMAP.prevItem)
})

test('multiple aliases stay comma separated', () => {
	const map = buildKeymap({ prevItem: 'left, k, q' })
	assert.equal(map.prevItem, 'left,k,q')
})

test('shift, ctrl and alt modifiers are accepted', () => {
	const map = buildKeymap({
		toggleTheme: 'ctrl+alt+t',
		markAllRead: 'shift+a',
	})
	assert.equal(map.toggleTheme, 'ctrl+alt+t')
	assert.equal(map.markAllRead, 'shift+a')
})

test('unknown actions are rejected', () => {
	assert.throws(() => buildKeymap({ bogusAction: 'x' }), /bogusAction/)
})

test('invalid tokens are rejected with the offending binding', () => {
	assert.throws(() => buildKeymap({ toggleStar: 'f,' }), /toggleStar/)
	assert.throws(() => buildKeymap({ toggleStar: '' }), /toggleStar/)
	assert.throws(() => buildKeymap({ toggleStar: 'ctrl+' }), /toggleStar/)
})

test('reserved browser shortcuts are rejected', () => {
	assert.ok(isReservedBinding('ctrl+t'))
	assert.ok(isReservedBinding('ctrl+shift+t'))
	assert.ok(isReservedBinding('ctrl+w'))
	assert.ok(isReservedBinding('alt+left'))
	assert.throws(() => buildKeymap({ nextItem: 'ctrl+t' }), /reserved/i)
})

test('empty overrides yield the defaults', () => {
	assert.deepEqual(buildKeymap(undefined), DEFAULT_KEYMAP)
	assert.deepEqual(buildKeymap({}), DEFAULT_KEYMAP)
})

test('formatBinding renders human-readable chords', () => {
	assert.equal(formatBinding('shift+d'), 'Shift+D')
	assert.equal(formatBinding('left,p,k,q'), 'Left/p/k/q')
	assert.equal(formatBinding('ctrl+alt+t'), 'Ctrl+Alt+T')
	assert.equal(formatBinding('pagedown'), 'PageDown')
	assert.equal(formatBinding('esc'), 'Esc')
	assert.equal(formatBinding('v,d'), 'v/d')
})

test('keys.example.yaml documents exactly the defaults', () => {
	const text = readFileSync(
		new URL('../keys.example.yaml', import.meta.url),
		'utf8'
	)
	assert.deepEqual(parseSimpleYaml(text).keys, DEFAULT_KEYMAP)
})
