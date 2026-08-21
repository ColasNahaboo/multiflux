import test from 'node:test'
import assert from 'node:assert/strict'
import {
	beginAutoRead,
	normalizeServerUrl,
	parseKeywords,
	titleMatchesKeywords,
	testMinifluxConnection,
} from '../settings-utils.js'

test('auto-read entries are excluded before their IDs are batch marked', async () => {
	const entries = [
		{ id: 1, title: 'Ordinary article', status: 'unread' },
		{ id: 2, title: 'Trump update', status: 'unread' },
	]
	let requestedIds
	const result = beginAutoRead(entries, ['trump'], async (entryIds) => {
		requestedIds = entryIds
	})
	assert.deepEqual(
		result.visibleEntries.map((entry) => entry.id),
		[1]
	)
	assert.deepEqual(requestedIds, [2])
	await result.completion
})

test('parses comma-delimited keywords and rejects case-insensitive duplicates', () => {
	assert.deepEqual(parseKeywords(' Trump, climate change, ,TRUMP '), [
		'Trump',
		'climate change',
	])
})

test('whole words do not match parts of longer words', () => {
	assert.equal(titleMatchesKeywords('Trump speaks', ['trump']), true)
	assert.equal(titleMatchesKeywords('A new trumpet', ['trump']), false)
})

test('multiword phrases match case-insensitively', () => {
	assert.equal(
		titleMatchesKeywords('The CLIMATE CHANGE debate', ['climate change']),
		true
	)
})

test('normalizes Miniflux API endpoints without removing reverse-proxy paths', () => {
	assert.equal(
		normalizeServerUrl('https://news.example/v1'),
		'https://news.example'
	)
	assert.equal(
		normalizeServerUrl('https://news.example/v1/'),
		'https://news.example'
	)
	assert.equal(
		normalizeServerUrl('https://news.example/miniflux/v1/'),
		'https://news.example/miniflux'
	)
})

test('/v1/me returns typed account details without retaining the token', async () => {
	let request
	const account = await testMinifluxConnection(
		'https://news.example/',
		'secret',
		async (...args) => {
			request = args
			return {
				ok: true,
				json: async () => ({ id: 7, username: 'reader' }),
			}
		}
	)
	assert.deepEqual(account, {
		id: 7,
		username: 'reader',
		hostname: 'news.example',
	})
	assert.equal(request[0], 'https://news.example/v1/me')
	assert.equal('apiToken' in account, false)
})

test('connection testing accepts a pasted /v1 API endpoint', async () => {
	let request
	await testMinifluxConnection(
		'https://news.example/v1/',
		'secret',
		async (...args) => {
			request = args
			return {
				ok: true,
				json: async () => ({ id: 7, username: 'reader' }),
			}
		}
	)
	assert.equal(request[0], 'https://news.example/v1/me')
})

test('/v1/me reports authentication and network failures safely', async () => {
	await assert.rejects(
		testMinifluxConnection('https://news.example', 'secret', async () => ({
			ok: false,
			status: 401,
		})),
		/rejected/
	)
	await assert.rejects(
		testMinifluxConnection('https://news.example', 'secret', async () => {
			throw new Error('secret')
		}),
		/Could not reach/
	)
})
