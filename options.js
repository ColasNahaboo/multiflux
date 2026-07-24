import {
	DEFAULT_SETTINGS,
	normalizeServerUrl,
	parseKeywords,
	testMinifluxConnection,
} from './settings-utils.js'
import { migrateSyncStorageToLocal } from './storage-utils.js'

const fields = Object.keys(DEFAULT_SETTINGS)
const byId = (id) => document.getElementById(id)
let keywords = []
let initialSnapshot = ''
let loading = true

function requestBackgroundRefresh() {
	browser.runtime.sendMessage({ type: 'refreshBadge', resetAlarm: true }).catch(() => {})
}

function updateBadgePreview() {
	byId('previewCount').style.color = byId('badgeTextColor').value
	byId('previewCount').style.backgroundColor = byId('badgeBgColor').value
}

function renderKeywords() {
	byId('chips').replaceChildren(
		...keywords.map((keyword, index) => {
			const chip = document.createElement('span')
			chip.className = 'chip'
			chip.append(document.createTextNode(keyword))
			const remove = document.createElement('button')
			remove.type = 'button'
			remove.textContent = '×'
			remove.setAttribute('aria-label', `Remove ${keyword}`)
			remove.addEventListener('click', () => {
				keywords.splice(index, 1)
				renderKeywords()
				markDirty()
			})
			chip.append(remove)
			return chip
		})
	)
}

function commitKeywords(value = byId('keywordInput').value) {
	keywords = parseKeywords([...keywords, ...String(value).split(',')])
	byId('keywordInput').value = ''
	renderKeywords()
	markDirty()
}

function currentSettings() {
	return {
		url: byId('url').value.trim(),
		refresh: Number(byId('refresh').value),
		badgeTextColor: byId('badgeTextColor').value,
		badgeBgColor: byId('badgeBgColor').value,
		maxItems: Number(byId('maxItems').value),
		theme: byId('theme').value,
		autoReadTitleKeywords: keywords,
		apiToken: byId('apiToken').value,
	}
}

const snapshot = () => JSON.stringify(currentSettings())
function markDirty() {
	if (!loading) byId('save').disabled = snapshot() === initialSnapshot
}

function applySettings(settings, apiToken = byId('apiToken').value) {
	for (const id of [
		'url',
		'refresh',
		'badgeTextColor',
		'badgeBgColor',
		'maxItems',
		'theme',
	])
		byId(id).value = settings[id]
	byId('apiToken').value = apiToken
	keywords = parseKeywords(settings.autoReadTitleKeywords)
	renderKeywords()
	updateBadgePreview()
}

async function load() {
	await migrateSyncStorageToLocal()
	const local = await browser.storage.local.get([...fields, 'apiToken', 'account'])
	applySettings(
		{
			...DEFAULT_SETTINGS,
			...local,
			autoReadTitleKeywords: parseKeywords(local.autoReadTitleKeywords),
		},
		local.apiToken || ''
	)
	if (local.account) showAccount(local.account)
	const releaseVersion = browser.runtime.getManifest().version
	byId('version').textContent = `Version ${releaseVersion}`
	loading = false
	initialSnapshot = snapshot()
	markDirty()
}

function showAccount(account) {
	byId('connectionStatus').classList.add('visible')
	const heading = document.createElement('strong')
	heading.textContent = `Connected as ${account.username}`
	const details = document.createElement('span')
	details.textContent = `User ID ${account.id} · ${account.hostname}`
	byId('connectionStatus').replaceChildren(heading, details)
}

byId('keywordInput').addEventListener('keydown', (event) => {
	if (event.key === 'Enter' || event.key === ',') {
		event.preventDefault()
		commitKeywords()
	} else if (
		event.key === 'Backspace' &&
		!event.currentTarget.value &&
		keywords.length
	) {
		keywords.pop()
		renderKeywords()
		markDirty()
	}
})
byId('keywordInput').addEventListener('paste', (event) => {
	const text = event.clipboardData.getData('text')
	if (text.includes(',')) {
		event.preventDefault()
		commitKeywords(text)
	}
})
document.querySelectorAll('input,select').forEach((element) =>
	element.addEventListener('input', () => {
		if (element.type === 'color') updateBadgePreview()
		markDirty()
	})
)

byId('testConnection').addEventListener('click', async () => {
	const button = byId('testConnection')
	button.disabled = true
	byId('connectionError').textContent = ''
	byId('connectionStatus').classList.remove('visible')
	try {
		const normalized = normalizeServerUrl(byId('url').value)
		const origin = `${new URL(normalized).origin}/*`
		const granted = await browser.permissions.request({ origins: [origin] })
		if (!granted)
			throw new Error('Permission denied. Cannot connect to Miniflux.')
		const account = await testMinifluxConnection(
			normalized,
			byId('apiToken').value
		)
		byId('url').value = normalized
		await browser.storage.local.set({ account })
		showAccount(account)
		markDirty()
	} catch (error) {
		byId('connectionError').textContent =
			error.message === 'Invalid URL'
				? 'Enter a valid HTTP or HTTPS Miniflux URL.'
				: error.message
	} finally {
		button.disabled = false
	}
})

byId('reset').addEventListener('click', () => {
	applySettings(DEFAULT_SETTINGS, '')
	byId('connectionStatus').classList.remove('visible')
	byId('connectionError').textContent = ''
	markDirty()
})
byId('save').addEventListener('click', async () => {
	byId('status').textContent = ''
	try {
		if (byId('keywordInput').value.trim()) commitKeywords()
		const settings = currentSettings()
		if (!Number.isInteger(settings.refresh) || settings.refresh < 1)
			throw new Error('Refresh time must be a positive integer.')
		if (
			!Number.isInteger(settings.maxItems) ||
			settings.maxItems < 10 ||
			settings.maxItems > 1000
		)
			throw new Error(
				'Maximum items must be an integer between 10 and 1000.'
			)
		settings.url = normalizeServerUrl(settings.url)
		const granted = await browser.permissions.request({
			origins: [`${new URL(settings.url).origin}/*`],
		})
		if (!granted)
			throw new Error('Permission denied. Cannot connect to Miniflux.')
		await browser.storage.local.set(settings)
		byId('url').value = settings.url
		initialSnapshot = snapshot()
		markDirty()
		requestBackgroundRefresh()
		byId('status').textContent = 'Changes saved.'
		setTimeout(() => {
			byId('status').textContent = ''
		}, 1800)
	} catch (error) {
		byId('status').textContent = error.message
	}
})
window.addEventListener('beforeunload', (event) => {
	if (!byId('save').disabled) {
		event.preventDefault()
		event.returnValue = ''
	}
})
load().catch(() => {
	byId('status').textContent = 'Settings could not be loaded.'
})
