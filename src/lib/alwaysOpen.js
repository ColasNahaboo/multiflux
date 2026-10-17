const STORAGE_KEY = 'always_open_original_feeds'

export const readAlwaysOpenFeedIds = (storage) => {
	const stored = storage.getItem(STORAGE_KEY)
	try {
		return (JSON.parse(stored) || []).filter(
			(id) => Number.isInteger(id) && id > 0
		)
	} catch {
		return []
	}
}

export const writeAlwaysOpenFeedIds = (storage, ids) => {
	storage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}
