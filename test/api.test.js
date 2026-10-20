import test from 'node:test'
import assert from 'node:assert/strict'
import { apiCall } from '../src/lib/api.js'
import { configureRuntime } from '../src/runtimeConfig.js'

configureRuntime({
	server: 'https://news.example',
	apiToken: 'secret',
})

const jsonResponse = (status, body) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	})

test('save requests send the entry to the Miniflux save endpoint', async () => {
	const errors = []
	let request
	const result = await apiCall(
		'entries/42/save',
		(error) => errors.push(error),
		null,
		'POST',
		async (url, params) => {
			request = { url, params }
			return new Response('', {
				status: 202,
				headers: { 'content-type': 'application/json' },
			})
		}
	)

	assert.deepEqual(errors, [])
	assert.ok(result instanceof Response)
	assert.equal(request.url, 'https://news.example/v1/entries/42/save')
	assert.equal(request.params.method, 'POST')
	assert.equal(request.params.headers['X-Auth-Token'], 'secret')
})

test('successful replies with an empty body are not treated as errors', async () => {
	const errors = []
	const result = await apiCall(
		'entries/42/save',
		(error) => errors.push(error),
		null,
		'POST',
		async () => new Response(null, { status: 202 })
	)
	assert.deepEqual(errors, [])
	assert.ok(result instanceof Response)
})

test('JSON bodies are decoded before being handed to the caller', async () => {
	const result = await apiCall(
		'integrations/status',
		() => {},
		null,
		'GET',
		async () => jsonResponse(200, { has_integrations: true })
	)
	assert.deepEqual(result, { has_integrations: true })
})

test('API errors reach the error handler with the Miniflux message', async () => {
	const errors = []
	await assert.rejects(
		apiCall(
			'entries/42/save',
			(error) => errors.push(error),
			null,
			'POST',
			async () =>
				jsonResponse(400, {
					error_message: 'no third-party integration enabled',
				})
		)
	)
	assert.equal(errors.length, 1)
	assert.match(errors[0], /no third-party integration enabled/)
	assert.match(errors[0], /entries\/42\/save/)
})

test('non-JSON error bodies surface as plain text', async () => {
	const errors = []
	await assert.rejects(
		apiCall(
			'feeds',
			(error) => errors.push(error),
			null,
			'GET',
			async () =>
				new Response('Bad Gateway', {
					status: 502,
					headers: { 'content-type': 'text/html' },
				})
		)
	)
	assert.deepEqual(errors, ['Bad Gateway (https://news.example/v1/feeds)'])
})
