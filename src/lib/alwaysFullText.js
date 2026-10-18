const FEED_STORAGE_KEY = 'always_full_text_feeds'
const FETCHED_ENTRY_STORAGE_KEY = 'full_text_fetched_entries'
const MAX_FETCHED_ENTRY_IDS = 5000

const sanitizeIds = (ids) =>
	Array.isArray(ids)
		? [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))]
		: []

const readFeedState = (storage) => {
	try {
		const value = JSON.parse(storage.getItem(FEED_STORAGE_KEY) || 'null')
		if (Array.isArray(value))
			return { enabled: sanitizeIds(value), disabled: [] }
		return {
			enabled: sanitizeIds(value?.enabled),
			disabled: sanitizeIds(value?.disabled),
		}
	} catch {
		return { enabled: [], disabled: [] }
	}
}

const readFetchedEntries = (storage) => {
	try {
		const entries = JSON.parse(
			storage.getItem(FETCHED_ENTRY_STORAGE_KEY) || 'null'
		)
		return Array.isArray(entries)
			? entries.filter(
					(entry) =>
						Number.isInteger(entry?.id) &&
						entry.id > 0 &&
						typeof entry.signature === 'string'
			  )
			: []
	} catch {
		return []
	}
}

const contentSignature = (content) => {
	let hash = 2166136261
	const text = String(content || '')
	for (let index = 0; index < text.length; index++) {
		hash ^= text.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}
	return `${text.length}:${hash >>> 0}`
}

const writeFeedState = (storage, state) => {
	storage.setItem(
		FEED_STORAGE_KEY,
		JSON.stringify({
			enabled: sanitizeIds(state.enabled),
			disabled: sanitizeIds(state.disabled),
		})
	)
}

export const fullTextActiveForFeed = (feed, state) => {
	if (!Number.isInteger(feed?.id)) return false
	if (state.disabled.includes(feed.id)) return false
	return Boolean(feed.crawler) || state.enabled.includes(feed.id)
}

export const toggleFullTextFeed = (state, feed, active) => {
	const id = feed.id
	const without = (list) => list.filter((x) => x !== id)
	if (active)
		return {
			enabled: without(state.enabled),
			disabled: feed.crawler
				? [...without(state.disabled), id]
				: without(state.disabled),
		}
	return {
		enabled: feed.crawler
			? without(state.enabled)
			: [...without(state.enabled), id],
		disabled: without(state.disabled),
	}
}

export const readFullTextState = (storage) => readFeedState(storage)

export const writeFullTextState = (storage, state) =>
	writeFeedState(storage, state)

export const hasFetchedFullTextEntry = (storage, entry) => {
	if (!entry || !Number.isInteger(entry.id) || entry.id <= 0) return false
	const signature = contentSignature(entry.content)
	return readFetchedEntries(storage).some(
		(cached) => cached.id === entry.id && cached.signature === signature
	)
}

export const markFullTextEntryFetched = (storage, entry) => {
	if (!entry || !Number.isInteger(entry.id) || entry.id <= 0) return
	const entries = readFetchedEntries(storage).filter(
		(cached) => cached.id !== entry.id
	)
	entries.push({ id: entry.id, signature: contentSignature(entry.content) })

	try {
		storage.setItem(
			FETCHED_ENTRY_STORAGE_KEY,
			JSON.stringify(entries.slice(-MAX_FETCHED_ENTRY_IDS))
		)
	} catch {
		// The reader still works if its small local fetch cache cannot be saved.
	}
}
