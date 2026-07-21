import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { configureRuntime } from './runtimeConfig'
import { migrateSyncStorageToLocal } from '../storage-utils.js'

const root = createRoot(document.getElementById('root'))

async function loadExtensionSettings() {
	await migrateSyncStorageToLocal()
	const localSettings = await browser.storage.local.get([
		'url',
		'apiToken',
		'refresh',
		'maxItems',
		'theme',
		'autoReadTitleKeywords',
	])

	return {
		extensionMode: true,
		server: localSettings.url || '',
		apiToken: localSettings.apiToken || '',
		maxItems: Math.min(
			1000,
			Math.max(10, Math.round(Number(localSettings.maxItems) || 100))
		),
		refreshMinutes: Number(localSettings.refresh) || 0,
		theme: ['auto', 'light', 'dark'].includes(localSettings.theme)
			? localSettings.theme
			: 'auto',
		autoReadTitleKeywords: Array.isArray(
			localSettings.autoReadTitleKeywords
		)
			? localSettings.autoReadTitleKeywords
			: String(localSettings.autoReadTitleKeywords || '')
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
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
				onClick={() => browser.runtime.openOptionsPage()}
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
				onClick={() => browser.runtime.openOptionsPage()}
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
