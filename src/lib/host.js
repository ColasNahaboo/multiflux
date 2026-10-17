import { getRuntimeConfig } from '../runtimeConfig'

const OA_WINDOW_NAME = 'multiflux-oa'

export function openOriginalArticle(url) {
	if (!url) return
	const { oaMode } = getRuntimeConfig()
	if (oaMode === 'tab') {
		window.open(url, '_blank', 'noopener')
		return
	}
	// Feature string is required: featureless window.open() opens a tab in
	// modern browsers. The named target still reuses the same window.
	const width = Math.min(Math.round(window.screen.availWidth / 2), 900)
	const height = window.screen.availHeight
	const left = window.screen.availLeft + window.screen.availWidth - width
	const features = `width=${width},height=${height},left=${left},top=${window.screen.availTop}`
	const win = window.open(url, OA_WINDOW_NAME, features)
	if (!win) {
		window.open(url, '_blank', 'noopener')
		return
	}
	try {
		if (win.location.href !== url) win.location.href = url
	} catch {
		// cross-origin: cannot read location, cannot navigate either
	}
	win.focus()
}

export function readStoredTheme() {
	const value = localStorage.getItem('multiflux_theme')
	return ['auto', 'light', 'dark'].includes(value) ? value : null
}

export function writeStoredTheme(value) {
	localStorage.setItem('multiflux_theme', value)
}
