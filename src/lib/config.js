import { normalizeServerUrl } from './settings.js'
import { buildKeymap } from './keymap.js'

function stripComment(line) {
	if (!line.includes('#')) return line
	let quote = null
	for (let i = 0; i < line.length; i++) {
		const ch = line[i]
		if (quote) {
			if (ch === quote) quote = null
		} else if (ch === '"' || ch === "'") quote = ch
		else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1])))
			return line.slice(0, i)
	}
	return line
}

export function parseSimpleYaml(text) {
	const config = {}
	let currentKey = null
	let currentKind = null
	const lines = String(text).split(/\r?\n/)
	lines.forEach((raw, index) => {
		const lineNo = index + 1
		const line = stripComment(raw)
		if (!line.trim() || /^\s*#/.test(line)) return
		const listItem = line.match(/^\s+-\s+(.*)$/)
		if (listItem) {
			if (currentKind !== 'list')
				throw new Error(`YAML list item without key on line ${lineNo}`)
			config[currentKey].push(unquote(listItem[1].trim()))
			return
		}
		const pair = line.match(/^(\s*)([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
		if (!pair) throw new Error(`Invalid YAML on line ${lineNo}`)
		const [, indent, key, value] = pair
		if (indent) {
			if (!currentKey)
				throw new Error(`Unexpected indentation on line ${lineNo}`)
			if (currentKind === 'list') {
				if (config[currentKey].length)
					throw new Error(
						`Mixed list and map under ${currentKey} on line ${lineNo}`
					)
				config[currentKey] = {}
				currentKind = 'map'
			}
			if (currentKind !== 'map')
				throw new Error(`Unexpected indentation on line ${lineNo}`)
			if (!value)
				throw new Error(`Nested key without value on line ${lineNo}`)
			config[currentKey][key] = scalar(value.trim())
			return
		}
		currentKey = key
		if (value === '') {
			config[key] = []
			currentKind = 'list'
		} else {
			config[key] = scalar(value.trim())
			currentKind = null
		}
	})
	// An empty "key:" with no children stays an empty list; convert maps
	// lazily assigned above only when children were map pairs.
	return config
}

function scalar(value) {
	const unquoted = unquote(value)
	if (unquoted !== value) return unquoted
	if (value === 'true') return true
	if (value === 'false') return false
	if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
	return value
}

function unquote(value) {
	const match = value.match(/^"(.*)"$/) || value.match(/^'(.*)'$/)
	return match ? match[1] : value
}

export function applyDefaults(raw) {
	if (!raw.url) throw new Error('config: url is required')
	if (!raw.apiToken) throw new Error('config: apiToken is required')
	const theme = raw.theme ?? 'auto'
	if (!['auto', 'light', 'dark'].includes(theme))
		throw new Error(`config: invalid theme "${theme}"`)
	const oaMode = raw.oaMode ?? 'window'
	if (!['tab', 'popup', 'popdecor', 'window'].includes(oaMode))
		throw new Error(`config: invalid oaMode "${oaMode}"`)
	const oaGeometry = parseOaGeometry(raw.oaGeometry)
	return {
		server: normalizeServerUrl(raw.url),
		configPath: String(raw.configPath || '/etc/multiflux/config.yaml'),
		apiToken: String(raw.apiToken).trim(),
		maxItems: Math.min(
			1000,
			Math.max(10, Math.round(Number(raw.maxItems) || 100))
		),
		refreshMinutes: Number(raw.refresh) || 0,
		theme,
		oaMode,
		oaGeometry,
		autoReadTitleKeywords: Array.isArray(raw.autoReadTitleKeywords)
			? raw.autoReadTitleKeywords.map(String)
			: String(raw.autoReadTitleKeywords || '')
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
		keymap: buildKeymap(
			raw.keys && !Array.isArray(raw.keys) ? raw.keys : undefined
		),
	}
}

export function parseOaGeometry(value) {
	if (value === undefined || value === null || value === '')
		return { preset: 'right' }
	const text = String(value).trim()
	if (['right', 'half'].includes(text)) return { preset: text }
	const parts = text.split(',')
	if (parts.length === 4 && parts.every((p) => /^-?\d+$/.test(p.trim()))) {
		const [x, y, w, h] = parts.map((p) => Number(p.trim()))
		if (w > 0 && h > 0) return { x, y, w, h }
	}
	throw new Error(
		`config: invalid oaGeometry "${text}" (use right|same|half or x,y,w,h)`
	)
}

export async function loadConfig(fetcher = fetch) {
	let response
	try {
		response = await fetcher('config.yaml', { cache: 'no-store' })
	} catch {
		throw new Error('Could not reach config.yaml')
	}
	if (!response.ok)
		throw new Error(`Could not load config.yaml (HTTP ${response.status})`)
	const text = await response.text()
	if (/^\s*</.test(text))
		throw new Error(
			'config.yaml was served as HTML — Apache is not serving it as text'
		)
	return applyDefaults(parseSimpleYaml(text))
}
