import test from 'node:test'
import assert from 'node:assert/strict'

import { migrateSyncStorageToLocal } from '../storage-utils.js'

const makeArea = (initial = {}, setError = null) => {
	const values = { ...initial }
	return {
		values,
		get(keys, callback) {
			if (keys === null) {
				callback({ ...values })
				return
			}
			callback(
				Object.fromEntries(
					keys
						.filter((key) => Object.hasOwn(values, key))
						.map((key) => [key, values[key]])
				)
			)
		},
		set(updates, callback) {
			globalThis.chrome.runtime.lastError = setError
			if (!setError) Object.assign(values, updates)
			callback()
			globalThis.chrome.runtime.lastError = null
		},
		remove(keys, callback) {
			for (const key of keys) delete values[key]
			callback()
		},
	}
}

const configureChrome = (sync, local) => {
	globalThis.chrome = {
		runtime: { lastError: null },
		storage: { sync, local },
	}
}

test('migrates all synchronized settings without replacing local values', async () => {
	const sync = makeArea({
		url: 'https://old.example',
		refresh: 10,
		futurePreference: true,
	})
	const local = makeArea({ url: 'https://local.example' })
	configureChrome(sync, local)

	await migrateSyncStorageToLocal()

	assert.deepEqual(local.values, {
		url: 'https://local.example',
		refresh: 10,
		futurePreference: true,
	})
	assert.deepEqual(sync.values, {})
})

test('migrates the legacy password to a local API token', async () => {
	const sync = makeArea({ password: 'legacy-secret' })
	const local = makeArea()
	configureChrome(sync, local)

	await migrateSyncStorageToLocal()

	assert.equal(local.values.apiToken, 'legacy-secret')
	assert.deepEqual(sync.values, {})
})

test('does not remove synchronized values when the local write fails', async () => {
	const sync = makeArea({ url: 'https://news.example' })
	const local = makeArea({}, new Error('local storage unavailable'))
	configureChrome(sync, local)

	await assert.rejects(
		migrateSyncStorageToLocal(),
		/local storage unavailable/
	)
	assert.deepEqual(sync.values, { url: 'https://news.example' })
})
