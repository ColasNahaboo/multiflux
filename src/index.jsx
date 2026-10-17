import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { configureRuntime } from './runtimeConfig'
import { loadConfig } from './lib/config'

const root = createRoot(document.getElementById('root'))

function Loading() {
	return (
		<p style={{ fontFamily: 'system-ui', padding: 20 }}>Loading reader…</p>
	)
}

function ConfigError({ message }) {
	return (
		<div style={{ fontFamily: 'system-ui', padding: 24 }}>
			<h2>Multiflux could not start</h2>
			<p>{message}</p>
			<p style={{ color: '#666' }}>
				Edit <code>config.yaml</code> next to this page (it is served
				from the app directory) and reload.
			</p>
			<button type='button' onClick={() => window.location.reload()}>
				Reload
			</button>
		</div>
	)
}

async function renderApp() {
	root.render(<Loading />)
	let config
	try {
		config = await loadConfig()
	} catch (error) {
		console.error('Could not load config.yaml:', error)
		root.render(<ConfigError message={String(error.message)} />)
		return
	}
	config.initialSearch = new URLSearchParams(window.location.search)
		.get('search')
		?.trim()

	configureRuntime(config)
	root.render(
		<React.StrictMode>
			<App config={config} />
		</React.StrictMode>
	)
}

renderApp()
