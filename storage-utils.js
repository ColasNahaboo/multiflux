const LEGACY_TOKEN_KEY = 'password'

const storageGet = (storageArea, keys) =>
	new Promise((resolve) => storageArea.get(keys, resolve))

const storageSet = (storageArea, values) =>
	new Promise((resolve, reject) =>
		storageArea.set(values, () =>
			chrome.runtime.lastError
				? reject(chrome.runtime.lastError)
				: resolve()
		)
	)

const storageRemove = (storageArea, keys) =>
	new Promise((resolve, reject) =>
		storageArea.remove(keys, () =>
			chrome.runtime.lastError
				? reject(chrome.runtime.lastError)
				: resolve()
		)
	)

export async function migrateSyncStorageToLocal() {
	const [syncValues, localValues] = await Promise.all([
		storageGet(chrome.storage.sync, null),
		storageGet(chrome.storage.local, null),
	])
	const localUpdates = {}

	for (const [key, value] of Object.entries(syncValues)) {
		if (key !== LEGACY_TOKEN_KEY && !Object.hasOwn(localValues, key))
			localUpdates[key] = value
	}
	if (
		Object.hasOwn(syncValues, LEGACY_TOKEN_KEY) &&
		!Object.hasOwn(localValues, 'apiToken') &&
		!Object.hasOwn(localUpdates, 'apiToken')
	)
		localUpdates.apiToken = syncValues[LEGACY_TOKEN_KEY]

	if (Object.keys(localUpdates).length)
		await storageSet(chrome.storage.local, localUpdates)

	const synchronizedKeys = Object.keys(syncValues)
	if (synchronizedKeys.length)
		await storageRemove(chrome.storage.sync, synchronizedKeys)

	return localUpdates
}
