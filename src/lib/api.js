import { getRuntimeConfig } from '../runtimeConfig.js'

// All Miniflux access goes through apiCall(): it adds the /v1/ endpoint and
// the API token, decodes JSON payloads and reports failures through the
// given error handler. The trailing `fetcher` argument exists for tests.
export function apiCall(
	s,
	errorHandler,
	body = null,
	method = body ? 'PUT' : 'GET',
	fetcher = fetch
) {
	const runtime = getRuntimeConfig()
	const server = runtime.server
	const token = runtime.apiToken
	if (!(server && token)) {
		errorHandler('Server settings not configured.')
		return new Promise((x, y) => {
			return null
		})
	}

	const params = { headers: { 'X-Auth-Token': token } }
	if (method !== 'GET') params['method'] = method
	if (body) {
		params['body'] = JSON.stringify(body)
	}

	const url = server + '/v1/' + s
	const err = (s) => errorHandler(s + ' (' + url + ')')

	return fetcher(url, params)
		.then((r) => {
			if (!r.ok) {
				throw r
			}
			if (r.status === 204) {
				return r
			}
			// Some successful replies carry no payload at all — e.g. the 202
			// of POST entries/{id}/save — so an empty body is not an error.
			return r.text().then((text) => (text.trim() ? JSON.parse(text) : r))
		})

		.catch(async (e) => {
			if (e instanceof TypeError) {
				err(e.message)
			} else if (e instanceof Response) {
				const contentType = e.headers.get('content-type')
				if (
					contentType &&
					contentType.indexOf('application/json') !== -1
				) {
					const msg = await e.json().catch(() => null)
					err(msg?.error_message || `HTTP ${e.status}`)
				} else {
					const msg = await e.text().catch(() => '')
					err(msg || `HTTP ${e.status}`)
				}
			} else {
				err(String(e))
			}
			return Promise.reject()
		})
}
