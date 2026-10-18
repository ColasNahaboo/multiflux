const FEED_STORAGE_KEY = 'always_full_text_feeds'
const FETCHED_ENTRY_STORAGE_KEY = 'full_text_fetched_entries'
const MAX_FETCHED_ENTRY_IDS = 5000

const readFeedIds = (storage) => {
	try {
		const ids = JSON.parse(storage.getItem(FEED_STORAGE_KEY) || 'null')
		if (!Array.isArray(ids)) return []
		return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))]
	} catch {
		return []
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

const writeFeedIds = (storage, ids) => {
	const validIds = Array.isArray(ids)
		? ids.filter((id) => Number.isInteger(id) && id > 0)
		: []
	storage.setItem(FEED_STORAGE_KEY, JSON.stringify([...new Set(validIds)]))
}

export const readAlwaysFullTextFeedIds = (storage) => readFeedIds(storage)

export const writeAlwaysFullTextFeedIds = (storage, ids) =>
	writeFeedIds(storage, ids)

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
