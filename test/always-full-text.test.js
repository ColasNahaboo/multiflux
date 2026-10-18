import test from 'node:test'
import assert from 'node:assert/strict'
import {
	readAlwaysFullTextFeedIds,
	writeAlwaysFullTextFeedIds,
	hasFetchedFullTextEntry,
	markFullTextEntryFetched,
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

test('reads and writes deduplicated positive feed IDs', () => {
	const storage = makeStorage({
		always_full_text_feeds: JSON.stringify([3, 3, '4', -1]),
	})
	assert.deepEqual(readAlwaysFullTextFeedIds(storage), [3])

	writeAlwaysFullTextFeedIds(storage, [2, 2, 0, 5])
	assert.equal(storage.getItem('always_full_text_feeds'), '[2,5]')
})

test('corrupt feed preferences safely read as an empty list', () => {
	assert.deepEqual(
		readAlwaysFullTextFeedIds(makeStorage({ always_full_text_feeds: '{' })),
		[]
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
