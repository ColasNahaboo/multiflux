const ALARM_NAME = 'miniflux-refresh'
const DEFAULT_REFRESH_MINUTES = 5
const MINIMUM_REFRESH_MINUTES = 1
const BADGE_REFRESH_MESSAGE = 'refreshBadge'
const BADGE_REFRESH_DEBOUNCE_MS = 300
let badgeRefreshTimer
let resetAlarmWithNextBadgeRefresh = false
let badgeRefreshResponders = []

console.info('Miniflux Companion service worker started')

/* ---------------- settings ---------------- */

async function getSettings() {
	return new Promise((resolve) => {
		chrome.storage.sync.get(
			[
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
				'autoReadTitleKeywords',
			],
			resolve
		)
	})
}

async function getApiToken() {
	const [localData, syncData] = await Promise.all([
		chrome.storage.local.get('apiToken'),
		chrome.storage.sync.get('password'),
	])

	let apiToken = localData.apiToken
	if (!apiToken && syncData.password) {
		await chrome.storage.local.set({ apiToken: syncData.password })
		apiToken = syncData.password
		await chrome.storage.sync.remove('password')
		console.info('Legacy API token migrated to local storage')
	}

	return apiToken
}

/* ---------------- alarms ---------------- */

async function resetAlarm() {
	const { refresh = DEFAULT_REFRESH_MINUTES } = await getSettings()
	const requestedMinutes = Number(refresh)
	const periodInMinutes = Math.max(
		MINIMUM_REFRESH_MINUTES,
		Number.isFinite(requestedMinutes)
			? requestedMinutes
			: DEFAULT_REFRESH_MINUTES
	)
	await chrome.alarms.clear(ALARM_NAME)
	await chrome.alarms.create(ALARM_NAME, {
		periodInMinutes,
	})
}

/* ---------------- badge update ---------------- */

async function updateBadge() {
	try {
		const {
			url,
			badgeTextColor = '#ffffff',
			badgeBgColor = '#ff6f00',
		} = await getSettings()
		const apiToken = await getApiToken()

		console.info('Badge refresh configuration', {
			url: url ? 'configured' : 'missing',
			token: apiToken ? 'present' : 'missing',
		})

		if (!url || !apiToken) {
			await chrome.action.setBadgeText({ text: '' })
			console.info('Badge text applied', { text: '' })
			return
		}

		const apiUrl = url.replace(/\/$/, '') + '/v1/feeds/counters'
		const resp = await fetch(apiUrl, {
			headers: {
				'X-Auth-Token': apiToken,
			},
		})

		if (!resp.ok) {
			throw new Error('HTTP ' + resp.status)
		}

		const data = await resp.json()

		// Modern Miniflux counters format:
		// { reads: {id: n, ...}, unreads: {id: n, ...} }
		let unread = 0
		if (data.unreads && typeof data.unreads === 'object') {
			for (const count of Object.values(data.unreads)) {
				unread += Number(count) || 0
			}
		}
		console.info('Unread count received', { unread })

		const badgeText = unread > 0 ? String(unread) : ''
		await chrome.action.setBadgeBackgroundColor({ color: badgeBgColor })
		await chrome.action.setBadgeTextColor({ color: badgeTextColor })
		await chrome.action.setBadgeText({ text: badgeText })
		console.info('Badge text applied', { text: badgeText })
	} catch (err) {
		console.error('Miniflux badge request/runtime error:', err)
		await chrome.action.setBadgeBackgroundColor({ color: '#b00020' })
		await chrome.action.setBadgeTextColor({ color: '#ffffff' })
		await chrome.action.setBadgeText({ text: '!' })
	}
}

async function initializeServiceWorker() {
	try {
		await resetAlarm()
		await updateBadge()
	} catch (err) {
		console.error('Miniflux service-worker initialization error:', err)
	}
}

/* ---------------- lifecycle ---------------- */

chrome.runtime.onInstalled.addListener(() => {
	initializeServiceWorker()
})

chrome.runtime.onStartup.addListener(() => {
	initializeServiceWorker()
})

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		updateBadge()
	}
})

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === 'sync' && changes.refresh) resetAlarm()

	const relevantSyncChanges = [
		'url',
		'password',
		'badgeTextColor',
		'badgeBgColor',
	]
	if (
		(areaName === 'sync' &&
			relevantSyncChanges.some((key) => changes[key])) ||
		(areaName === 'local' && changes.apiToken)
	) {
		updateBadge()
	}
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type !== BADGE_REFRESH_MESSAGE) return false

	resetAlarmWithNextBadgeRefresh ||= Boolean(message.resetAlarm)
	badgeRefreshResponders.push(sendResponse)
	clearTimeout(badgeRefreshTimer)
	badgeRefreshTimer = setTimeout(async () => {
		const responders = badgeRefreshResponders
		const shouldResetAlarm = resetAlarmWithNextBadgeRefresh
		badgeRefreshResponders = []
		resetAlarmWithNextBadgeRefresh = false

		try {
			if (shouldResetAlarm) await resetAlarm()
			await updateBadge()
			responders.forEach((respond) => respond({ ok: true }))
		} catch (error) {
			console.error('Miniflux badge refresh message error:', error)
			responders.forEach((respond) =>
				respond({ ok: false, error: String(error) })
			)
		}
	}, BADGE_REFRESH_DEBOUNCE_MS)
	return true
})

initializeServiceWorker()

/* ---------------- click behavior ---------------- */

chrome.action.onClicked.addListener(async () => {
	const {
		url,
		openMode = 'unread',
		tabMode = 'new',
		instantUpdate = false,
		useEnhancedReader = false,
	} = await getSettings()

	let targetUrl
	let focusUrl

	if (useEnhancedReader) {
		targetUrl = chrome.runtime.getURL('index.html')
		focusUrl = targetUrl
	} else {
		if (!url) return

		let path = '/unread'
		if (openMode === 'categories') path = '/categories'
		if (openMode === 'feeds') path = '/feeds'

		const baseUrl = url.replace(/\/$/, '')
		targetUrl = baseUrl + path
		focusUrl = baseUrl + '*'
	}

	if (tabMode === 'focus') {
		const tabs = await chrome.tabs.query({ url: focusUrl })
		if (tabs.length > 0) {
			await chrome.tabs.update(tabs[0].id, { active: true })
			await chrome.windows.update(tabs[0].windowId, { focused: true })

			if (instantUpdate) updateBadge()
			return
		}
	}

	chrome.tabs.create({ url: targetUrl })

	if (instantUpdate) updateBadge()
})
