const LEGACY_TOKEN_KEY = 'password'

export async function migrateSyncStorageToLocal() {
	const [syncValues, localValues] = await Promise.all([
		browser.storage.sync.get(null),
		browser.storage.local.get(null),
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
		await browser.storage.local.set(localUpdates)

	const synchronizedKeys = Object.keys(syncValues)
	if (synchronizedKeys.length)
		await browser.storage.sync.remove(synchronizedKeys)

	return localUpdates
}
