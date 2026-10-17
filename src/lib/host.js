import { getRuntimeConfig } from '../runtimeConfig'

const OA_WINDOW_NAME = 'multiflux-oa'

export function openOriginalArticle(url) {
	if (!url) return
	const { oaMode } = getRuntimeConfig()
	if (oaMode === 'tab') {
		window.open(url, '_blank', 'noopener')
		return
	}
	const win = window.open(url, OA_WINDOW_NAME)
	if (win && !win.closed) {
		try {
			win.location.href = url
		} catch {}
		win.focus()
	}
}

export function readStoredTheme() {
	const value = localStorage.getItem('multiflux_theme')
	return ['auto', 'light', 'dark'].includes(value) ? value : null
}

export function writeStoredTheme(value) {
	localStorage.setItem('multiflux_theme', value)
}
