import test from 'node:test'
import assert from 'node:assert/strict'
import {
	readAlwaysOpenFeedIds,
	writeAlwaysOpenFeedIds,
} from '../src/lib/alwaysOpen.js'

const makeStorage = (initial = {}) => {
	const values = { ...initial }
	return {
		getItem: (key) => values[key] ?? null,
		setItem: (key, value) => {
			values[key] = String(value)
		},
	}
}

test('reads stored positive integer feed ids', () => {
	const storage = makeStorage({
		always_open_original_feeds: JSON.stringify([1, 2, 3]),
	})
	assert.deepEqual(readAlwaysOpenFeedIds(storage), [1, 2, 3])
})

test('drops malformed and non-integer values and survives bad JSON', () => {
	assert.deepEqual(
		readAlwaysOpenFeedIds(
			makeStorage({
				always_open_original_feeds: JSON.stringify([1, '2', -3]),
			})
		),
		[1]
	)
	assert.deepEqual(
		readAlwaysOpenFeedIds(
			makeStorage({ always_open_original_feeds: 'nope' })
		),
		[]
	)
	assert.deepEqual(readAlwaysOpenFeedIds(makeStorage()), [])
})

test('writes deduplicated ids', () => {
	const storage = makeStorage()
	writeAlwaysOpenFeedIds(storage, [1, 1, 2])
	assert.equal(
		storage.getItem('always_open_original_feeds'),
		JSON.stringify([1, 2])
	)
})
