import browser from 'webextension-polyfill'
import { migrateSyncStorageToLocal } from './storage-utils.js'

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

function getSettings() {
	return browser.storage.local.get([
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
	])
}

async function getApiToken() {
	const { apiToken } = await browser.storage.local.get('apiToken')
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
	await browser.alarms.clear(ALARM_NAME)
	await browser.alarms.create(ALARM_NAME, {
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
			await browser.action.setBadgeText({ text: '' })
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
		await browser.action.setBadgeBackgroundColor({ color: badgeBgColor })
		await browser.action.setBadgeTextColor({ color: badgeTextColor })
		await browser.action.setBadgeText({ text: badgeText })
		console.info('Badge text applied', { text: badgeText })
	} catch (err) {
		console.error('Miniflux badge request/runtime error:', err)
		await browser.action.setBadgeBackgroundColor({ color: '#b00020' })
		await browser.action.setBadgeTextColor({ color: '#ffffff' })
		await browser.action.setBadgeText({ text: '!' })
	}
}

async function initializeServiceWorker() {
	try {
		await migrateSyncStorageToLocal()
		await resetAlarm()
		await updateBadge()
	} catch (err) {
		console.error('Miniflux service-worker initialization error:', err)
	}
}

/* ---------------- lifecycle ---------------- */

browser.runtime.onInstalled.addListener(() => {
	initializeServiceWorker()
})

browser.runtime.onStartup.addListener(() => {
	initializeServiceWorker()
})

browser.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		updateBadge()
	}
})

browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== 'local') return
	if (changes.refresh) resetAlarm()

	const relevantLocalChanges = ['url', 'badgeTextColor', 'badgeBgColor']
	if (relevantLocalChanges.some((key) => changes[key]) || changes.apiToken) {
		updateBadge()
	}
})

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

browser.action.onClicked.addListener(async () => {
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
		targetUrl = browser.runtime.getURL('index.html')
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
		const tabs = await browser.tabs.query({ url: focusUrl })
		if (tabs.length > 0) {
			await browser.tabs.update(tabs[0].id, { active: true })
			await browser.windows.update(tabs[0].windowId, { focused: true })

			if (instantUpdate) updateBadge()
			return
		}
	}

	browser.tabs.create({ url: targetUrl })

	if (instantUpdate) updateBadge()
})
