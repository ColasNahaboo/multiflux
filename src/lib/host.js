import { getRuntimeConfig } from '../runtimeConfig.js'

const OA_WINDOW_NAME = 'multiflux-oa'

// Pure geometry resolution, testable: `win` is the reader window
// (screenX/screenY/outerWidth/outerHeight + screen.avail* fields).
export function oaFeatures(geometry, win) {
	const screen = win.screen
	let x, y, w, h
	if ('preset' in geometry) {
		if (geometry.preset === 'half') {
			w = Math.round(screen.availWidth / 2)
			h = screen.availHeight
			x = screen.availLeft + screen.availWidth - w
			y = screen.availTop
		} else {
			// right: flush against the reader's right edge, same size
			x = win.screenX + win.outerWidth
			y = win.screenY
			w = win.outerWidth
			h = win.outerHeight
		}
	} else {
		;({ x, y, w, h } = geometry)
	}
	return `left=${Math.round(x)},top=${Math.round(y)},width=${Math.round(
		w
	)},height=${Math.round(h)}`
}

export function openOriginalArticle(url) {
	if (!url) return
	const config = getRuntimeConfig()
	if (config.oaMode === 'tab') {
		window.open(url, '_blank', 'noopener')
		return
	}
	// Feature string is required: featureless window.open() opens a tab in
	// modern browsers. The named target still reuses the same window.
	const features = oaFeatures(config.oaGeometry, window)
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
