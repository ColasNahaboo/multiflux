import test from 'node:test'
import assert from 'node:assert/strict'
import {
	readFullTextState,
	writeFullTextState,
	hasFetchedFullTextEntry,
	markFullTextEntryFetched,
	fullTextActiveForFeed,
	toggleFullTextFeed,
} from '../src/lib/alwaysFullText.js'

const makeStorage = (initial = {}) => {
	const values = { ...initial }
	return {
		getItem: (key) => values[key] ?? null,
		setItem: (key, value) => {
			values[key] = String(value)
		},
	}
}

test('legacy array storage migrates to the enabled list', () => {
	const storage = makeStorage({
		always_full_text_feeds: JSON.stringify([3, 3, '4', -1]),
	})
	assert.deepEqual(readFullTextState(storage), {
		enabled: [3],
		disabled: [],
	})
})

test('reads and writes deduplicated positive feed IDs per list', () => {
	const storage = makeStorage()
	writeFullTextState(storage, {
		enabled: [2, 2, 0, 5],
		disabled: [7, 'x', -3, null],
	})
	assert.deepEqual(readFullTextState(storage), {
		enabled: [2, 5],
		disabled: [7],
	})
})

test('corrupt feed preferences safely read as empty lists', () => {
	assert.deepEqual(
		readFullTextState(makeStorage({ always_full_text_feeds: '{' })),
		{
			enabled: [],
			disabled: [],
		}
	)
})

test('records successfully fetched entries to avoid repeating extraction', () => {
	const storage = makeStorage()
	const summary = { id: 42, content: '<p>Summary</p>' }
	const fullText = { id: 42, content: '<p>Full article</p>' }
	assert.equal(hasFetchedFullTextEntry(storage, summary), false)
	markFullTextEntryFetched(storage, fullText)
	assert.equal(hasFetchedFullTextEntry(storage, fullText), true)
	assert.equal(hasFetchedFullTextEntry(storage, summary), false)
	markFullTextEntryFetched(storage, fullText)
	assert.equal(
		JSON.parse(storage.getItem('full_text_fetched_entries')).length,
		1
	)
})

test('ignores invalid fetched entry IDs', () => {
	const storage = makeStorage()
	markFullTextEntryFetched(storage, { id: -1, content: 'content' })
	assert.equal(storage.getItem('full_text_fetched_entries'), null)
})

test('bounds the fetched-entry cache', () => {
	const storage = makeStorage({
		full_text_fetched_entries: JSON.stringify(
			Array.from({ length: 5000 }, (_, index) => ({
				id: index + 1,
				signature: 'signature',
			}))
		),
	})
	markFullTextEntryFetched(storage, { id: 5001, content: 'content' })

	const cache = JSON.parse(storage.getItem('full_text_fetched_entries'))
	assert.equal(cache.length, 5000)
	assert.equal(cache[0].id, 2)
	assert.equal(cache.at(-1).id, 5001)
})

const idle = { enabled: [], disabled: [] }

test('server crawler flag enables full text without manual toggle', () => {
	assert.equal(fullTextActiveForFeed({ id: 9, crawler: true }, idle), true)
	assert.equal(
		fullTextActiveForFeed(
			{ id: 9, crawler: false },
			{ ...idle, enabled: [9] }
		),
		true
	)
	assert.equal(fullTextActiveForFeed({ id: 9, crawler: false }, idle), false)
	assert.equal(
		fullTextActiveForFeed(undefined, { ...idle, enabled: [9] }),
		false
	)
})

test('W turns server crawler auto-fetch off and back on', () => {
	let state = toggleFullTextFeed(idle, { id: 9, crawler: true }, true)
	assert.deepEqual(state, { enabled: [], disabled: [9] })
	assert.equal(fullTextActiveForFeed({ id: 9, crawler: true }, state), false)
	state = toggleFullTextFeed(state, { id: 9, crawler: true }, false)
	assert.deepEqual(state, idle)
	assert.equal(fullTextActiveForFeed({ id: 9, crawler: true }, state), true)
})

test('W on a manual feed keeps the enabled list', () => {
	let state = toggleFullTextFeed(
		{ enabled: [5], disabled: [] },
		{ id: 5, crawler: false },
		true
	)
	assert.deepEqual(state, idle)
	state = toggleFullTextFeed(state, { id: 5, crawler: false }, false)
	assert.deepEqual(state, { enabled: [5], disabled: [] })
})

test('W on a non-crawler feed can pre-enable it', () => {
	const state = toggleFullTextFeed(idle, { id: 7, crawler: false }, false)
	assert.deepEqual(state, { enabled: [7], disabled: [] })
	assert.equal(fullTextActiveForFeed({ id: 7, crawler: false }, state), true)
})
