export const DEFAULT_SETTINGS = Object.freeze({
	url: '',
	refresh: 5,
	badgeTextColor: '#ffffff',
	badgeBgColor: '#ff6f00',
	openMode: 'unread',
	tabMode: 'new',
	instantUpdate: false,
	useEnhancedReader: false,
	maxItems: 100,
	theme: 'auto',
	autoReadTitleKeywords: [],
})

export function normalizeServerUrl(value) {
	const url = new URL(String(value).trim())
	if (!['http:', 'https:'].includes(url.protocol))
		throw new Error('Invalid URL')
	url.hash = ''
	url.search = ''
	return url.href.replace(/\/$/, '')
}

export function parseKeywords(value) {
	const values = Array.isArray(value) ? value : String(value || '').split(',')
	const seen = new Set()
	return values.flatMap((item) =>
		String(item)
			.split(',')
			.map((keyword) => keyword.trim())
			.filter((keyword) => {
				const normalized = keyword.toLocaleLowerCase()
				if (!normalized || seen.has(normalized)) return false
				seen.add(normalized)
				return true
			})
	)
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function titleMatchesKeywords(title, keywords) {
	return parseKeywords(keywords).some((keyword) => {
		const escaped = escapeRegExp(keyword)
		const pattern = keyword.includes(' ')
			? escaped
			: `(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`
		return new RegExp(pattern, 'iu').test(String(title || ''))
	})
}

export function beginAutoRead(
	entries,
	keywords,
	markRead,
	pendingIds = new Set()
) {
	const matchingEntries = []
	const visibleEntries = []
	for (const entry of entries) {
		if (
			entry.status === 'unread' &&
			titleMatchesKeywords(entry.title, keywords)
		) {
			matchingEntries.push(entry)
		} else {
			visibleEntries.push(entry)
		}
	}
	const requestedEntries = matchingEntries.filter(
		(entry) => !pendingIds.has(entry.id)
	)
	const completion = requestedEntries.length
		? Promise.resolve(markRead(requestedEntries.map((entry) => entry.id)))
		: Promise.resolve()
	return { visibleEntries, matchingEntries, requestedEntries, completion }
}

export async function testMinifluxConnection(
	serverUrl,
	apiToken,
	fetcher = fetch
) {
	const server = normalizeServerUrl(serverUrl)
	if (!String(apiToken || '').trim()) throw new Error('Enter an API token.')
	let response
	try {
		response = await fetcher(`${server}/v1/me`, {
			headers: { 'X-Auth-Token': apiToken },
		})
	} catch {
		throw new Error('Could not reach the Miniflux server.')
	}
	if (!response.ok)
		throw new Error(
			response.status === 401 || response.status === 403
				? 'Miniflux rejected the API token.'
				: `Miniflux returned HTTP ${response.status}.`
		)
	const user = await response.json()
	if (!Number.isFinite(Number(user.id)) || !user.username)
		throw new Error('Miniflux returned an unexpected account response.')
	return {
		id: Number(user.id),
		username: String(user.username),
		hostname: new URL(server).hostname,
	}
}
