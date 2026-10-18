const NAMED_KEYS = new Set([
	'esc',
	'escape',
	'enter',
	'space',
	'tab',
	'backspace',
	'delete',
	'home',
	'end',
	'pageup',
	'pagedown',
	'up',
	'down',
	'left',
	'right',
	'contextmenu',
])

const SYMBOL_KEYS = new Set(['?', '/', '+', '-', '.', ',', ';', '`', '\\'])
const MODIFIERS = new Set(['ctrl', 'shift', 'alt'])

// Shortcuts the browser owns; rebinding them would only break things.
const RESERVED = new Set([
	'ctrl+t',
	'ctrl+n',
	'ctrl+w',
	'ctrl+o',
	'ctrl+j',
	'ctrl+s',
	'ctrl+p',
	'ctrl+f',
	'ctrl+g',
	'ctrl+shift+t',
	'ctrl+shift+n',
	'ctrl+shift+delete',
	'ctrl+tab',
	'ctrl+shift+tab',
	'ctrl+pageup',
	'ctrl+pagedown',
	'alt+left',
	'alt+right',
	'alt+f4',
])

export function isReservedBinding(binding) {
	return RESERVED.has(binding.toLowerCase())
}

function validateToken(token, action) {
	if (!token)
		throw new Error(`keys: invalid binding "${token}" for ${action}`)
	const parts = token.split('+')
	const key = parts.pop()
	const mods = parts.map((m) => m.toLowerCase())
	if (mods.some((m) => !MODIFIERS.has(m)))
		throw new Error(`keys: invalid binding "${token}" for ${action}`)
	if (key === '?') return
	const lower = key.toLowerCase()
	const named =
		NAMED_KEYS.has(lower) ||
		SYMBOL_KEYS.has(key) ||
		(/^[a-z0-9]$/.test(lower) && mods.length === 0)
	const chorded = /^[a-z0-9]$/.test(lower) && mods.length > 0
	if (!named && !chorded)
		throw new Error(`keys: invalid binding "${token}" for ${action}`)
}

export function normalizeBinding(binding, action) {
	const raw = String(binding).split(',')
	if (raw.some((token) => !token.trim()))
		throw new Error(`keys: empty binding for ${action}`)
	const tokens = raw.map((token) => token.trim().toLowerCase())
	for (const token of tokens) {
		validateToken(token, action)
		if (isReservedBinding(token))
			throw new Error(
				`keys: "${token}" for ${action} is reserved by the browser`
			)
	}
	return [...new Set(tokens)].join(',')
}

export const DEFAULT_KEYMAP = {
	help: 'h,?',
	clearSearch: 'esc',
	toggleTheme: 'shift+d',
	refreshCounts: 'r',
	refreshFeeds: 'shift+r',
	toggleAlwaysOpen: 'shift+v',
	toggleAlwaysFullText: 'shift+w',
	prevFeed: 'up',
	nextFeed: 'down',
	toggleHideReadFeeds: 'shift+u',
	toggleCategoryCollapse: 'x',
	prevItem: 'left,p,k,q',
	nextItem: 'right,n,j,e,space',
	firstItem: 'home',
	lastItem: 'end',
	toggleRead: 'm',
	markOlderRead: 't',
	markAllRead: 'shift+a',
	toggleShowRead: 'u',
	toggleSort: 's',
	toggleStar: 'f',
	openOriginal: 'v,d',
	openOriginalTab: 'a',
	fetchFullText: 'w',
	openComments: 'c',
	scrollDown: 'pagedown',
	scrollUp: 'pageup',
}

export function buildKeymap(overrides) {
	const map = { ...DEFAULT_KEYMAP }
	if (!overrides) return map
	const seen = new Map()
	for (const [action, binding] of Object.entries(DEFAULT_KEYMAP)) {
		for (const token of binding.split(',')) seen.set(token, action)
	}
	for (const [action, binding] of Object.entries(overrides)) {
		if (!(action in DEFAULT_KEYMAP))
			throw new Error(`keys: unknown action "${action}"`)
		const normalized = normalizeBinding(binding, action)
		for (const token of normalized.split(',')) {
			const owner = seen.get(token)
			if (owner && owner !== action)
				throw new Error(
					`keys: "${token}" is already bound to ${owner}, not ${action}`
				)
			seen.set(token, action)
		}
		map[action] = normalized
	}
	return map
}

const DISPLAY_NAMES = {
	esc: 'Esc',
	space: 'Space',
	pagedown: 'PageDown',
	pageup: 'PageUp',
	up: 'Up',
	down: 'Down',
	left: 'Left',
	right: 'Right',
	home: 'Home',
	end: 'End',
}

const MODIFIER_DISPLAY = { ctrl: 'Ctrl', shift: 'Shift', alt: 'Alt' }

export function formatBinding(binding) {
	return binding
		.split(',')
		.map((token) => {
			const parts = token.split('+')
			const key = parts.pop()
			const mods = parts.map((m) => MODIFIER_DISPLAY[m] || m)
			const display =
				DISPLAY_NAMES[key] ||
				(mods.length && /^[a-z0-9]$/.test(key)
					? key.toUpperCase()
					: key)
			return [...mods, display].join('+')
		})
		.join('/')
}
