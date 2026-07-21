import test from 'node:test'
import assert from 'node:assert/strict'

import { migrateSyncStorageToLocal } from '../storage-utils.js'

const makeArea = (initial = {}, setError = null) => {
	const values = { ...initial }
	return {
		values,
		async get(keys) {
			if (keys === null) return { ...values }
			return Object.fromEntries(
				keys
					.filter((key) => Object.hasOwn(values, key))
					.map((key) => [key, values[key]])
			)
		},
		async set(updates) {
			if (setError) throw setError
			Object.assign(values, updates)
		},
		async remove(keys) {
			for (const key of keys) delete values[key]
		},
	}
}

const configureBrowser = (sync, local) => {
	globalThis.browser = {
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
	configureBrowser(sync, local)

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
	configureBrowser(sync, local)

	await migrateSyncStorageToLocal()

	assert.equal(local.values.apiToken, 'legacy-secret')
	assert.deepEqual(sync.values, {})
})

test('does not remove synchronized values when the local write fails', async () => {
	const sync = makeArea({ url: 'https://news.example' })
	const local = makeArea({}, new Error('local storage unavailable'))
	configureBrowser(sync, local)

	await assert.rejects(
		migrateSyncStorageToLocal(),
		/local storage unavailable/
	)
	assert.deepEqual(sync.values, { url: 'https://news.example' })
})
