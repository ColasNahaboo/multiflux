const fields = [
	'url',
	'refresh',
	'badgeTextColor',
	'badgeBgColor',
	'openMode',
	'tabMode',
	'instantUpdate',
	'useEnhancedReader',
	'maxItems',
	'theme',
]
const BADGE_REFRESH_MESSAGE = 'refreshBadge'

function requestBackgroundRefresh() {
	chrome.runtime.sendMessage(
		{ type: BADGE_REFRESH_MESSAGE, resetAlarm: true },
		(response) => {
			if (chrome.runtime.lastError || !response?.ok) {
				console.error(
					'Could not refresh the unread badge:',
					chrome.runtime.lastError?.message || response?.error
				)
			}
		}
	)
}

function loadApiToken() {
	chrome.storage.local.get('apiToken', (localData) => {
		chrome.storage.sync.get('password', (syncData) => {
			const apiToken = localData.apiToken || syncData.password || ''
			document.getElementById('apiToken').value = apiToken

			if (!localData.apiToken && syncData.password) {
				chrome.storage.local.set(
					{ apiToken: syncData.password },
					() => {
						if (!chrome.runtime.lastError) {
							chrome.storage.sync.remove('password', () => {
								requestBackgroundRefresh()
							})
						}
					}
				)
			} else if (localData.apiToken && syncData.password) {
				chrome.storage.sync.remove('password')
			}
		})
	})
}

function updateReaderModeState() {
	const enhancedReaderEnabled =
		document.getElementById('useEnhancedReader').checked
	document.getElementById('openModeGroup').disabled = enhancedReaderEnabled
	document.getElementById('enhancedReaderSettings').disabled =
		!enhancedReaderEnabled
}

chrome.storage.sync.get(fields, (data) => {
	document.getElementById('url').value = data.url || ''
	document.getElementById('refresh').value = data.refresh || 5
	document.getElementById('maxItems').value = data.maxItems || 100
	document.getElementById('theme').value = ['auto', 'light', 'dark'].includes(
		data.theme
	)
		? data.theme
		: 'auto'
	document.getElementById('badgeTextColor').value =
		data.badgeTextColor || '#ffffff'
	document.getElementById('badgeBgColor').value =
		data.badgeBgColor || '#ff6f00'

	document.querySelector(
		`input[name="openMode"][value="${data.openMode || 'unread'}"]`
	).checked = true

	document.querySelector(
		`input[name="tabMode"][value="${data.tabMode || 'new'}"]`
	).checked = true

	document.getElementById('instantUpdate').checked = !!data.instantUpdate
	document.getElementById('useEnhancedReader').checked =
		!!data.useEnhancedReader
	updateReaderModeState()
})

loadApiToken()

document
	.getElementById('useEnhancedReader')
	.addEventListener('change', updateReaderModeState)

document.getElementById('save').addEventListener('click', () => {
	const serverUrl = url.value.trim()
	const requestedMaximumItems = Number(maxItems.value)

	if (!Number.isFinite(requestedMaximumItems)) {
		alert('Maximum items must be a number between 10 and 1000.')
		return
	}

	const maximumItems = Math.min(
		1000,
		Math.max(10, Math.round(requestedMaximumItems))
	)
	maxItems.value = maximumItems

	let origin
	try {
		origin = new URL(serverUrl).origin + '/*'
	} catch (e) {
		alert('Invalid Miniflux URL')
		return
	}

	chrome.permissions.request({ origins: [origin] }, (granted) => {
		if (!granted) {
			alert('Permission denied. Cannot connect to Miniflux.')
			return
		}

		const syncSettings = {
			url: serverUrl,
			refresh: Number(refresh.value),
			maxItems: maximumItems,
			theme: theme.value,
			badgeTextColor: badgeTextColor.value,
			badgeBgColor: badgeBgColor.value,
			openMode: document.querySelector('input[name="openMode"]:checked')
				.value,
			tabMode: document.querySelector('input[name="tabMode"]:checked')
				.value,
			instantUpdate: instantUpdate.checked,
			useEnhancedReader: useEnhancedReader.checked,
		}

		chrome.storage.local.set({ apiToken: apiToken.value }, () => {
			if (chrome.runtime.lastError) {
				alert('Could not save the API token.')
				return
			}
			chrome.storage.sync.set(syncSettings, () => {
				if (chrome.runtime.lastError) {
					alert('Could not save extension settings.')
					return
				}
				chrome.storage.sync.remove('password', () => {
					requestBackgroundRefresh()
					status.textContent = 'Saved.'
					setTimeout(() => (status.textContent = ''), 1500)
				})
			})
		})
	})
})
