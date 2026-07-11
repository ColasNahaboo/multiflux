import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { configureRuntime } from './runtimeConfig'

const root = createRoot(document.getElementById('root'))

const storageGet = (area, keys) =>
	new Promise((resolve) => chrome.storage[area].get(keys, resolve))

const storageSet = (area, values) =>
	new Promise((resolve, reject) =>
		chrome.storage[area].set(values, () => {
			if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
			else resolve()
		})
	)

const storageRemove = (area, keys) =>
	new Promise((resolve, reject) =>
		chrome.storage[area].remove(keys, () => {
			if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
			else resolve()
		})
	)

async function loadExtensionSettings() {
	const [syncSettings, localSettings] = await Promise.all([
		storageGet('sync', ['url', 'password', 'refresh', 'maxItems', 'theme']),
		storageGet('local', ['apiToken']),
	])

	let apiToken = localSettings.apiToken
	if (!apiToken && syncSettings.password) {
		await storageSet('local', { apiToken: syncSettings.password })
		apiToken = syncSettings.password
	}
	if (apiToken && syncSettings.password) {
		await storageRemove('sync', 'password')
	}

	return {
		extensionMode: true,
		server: syncSettings.url || '',
		apiToken: apiToken || '',
		maxItems: Math.min(
			1000,
			Math.max(10, Math.round(Number(syncSettings.maxItems) || 100))
		),
		refreshMinutes: Number(syncSettings.refresh) || 0,
		theme: ['auto', 'light', 'dark'].includes(syncSettings.theme)
			? syncSettings.theme
			: 'auto',
		initialSearch: new URLSearchParams(window.location.search)
			.get('search')
			?.trim(),
	}
}

function Loading() {
	return (
		<p style={{ fontFamily: 'system-ui', padding: 20 }}>Loading reader…</p>
	)
}

function MissingSettings() {
	return (
		<div style={{ fontFamily: 'system-ui', padding: 24 }}>
			<h2>Miniflux connection settings are missing</h2>
			<p>
				Configure the Miniflux URL and API token in extension settings.
			</p>
			<button
				type='button'
				onClick={() => chrome.runtime.openOptionsPage()}
			>
				Open extension settings
			</button>
		</div>
	)
}

function StorageError() {
	return (
		<div style={{ fontFamily: 'system-ui', padding: 24 }}>
			<h2>Extension settings could not be loaded</h2>
			<p>Reload the extension and try opening the reader again.</p>
			<button
				type='button'
				onClick={() => chrome.runtime.openOptionsPage()}
			>
				Open extension settings
			</button>
		</div>
	)
}

async function renderApp() {
	root.render(<Loading />)
	let extensionConfig
	try {
		extensionConfig = await loadExtensionSettings()
	} catch (error) {
		console.error('Could not load extension settings:', error)
		root.render(<StorageError />)
		return
	}
	if (!extensionConfig.server || !extensionConfig.apiToken) {
		root.render(<MissingSettings />)
		return
	}

	configureRuntime(extensionConfig)
	root.render(
		<React.StrictMode>
			<App extensionConfig={extensionConfig} />
		</React.StrictMode>
	)
}

renderApp()
