import { normalizeServerUrl } from './settings.js'

export function parseSimpleYaml(text) {
	const config = {}
	let currentListKey = null
	const lines = String(text).split(/\r?\n/)
	lines.forEach((raw, index) => {
		const lineNo = index + 1
		if (!raw.trim() || /^\s*#/.test(raw)) return
		const listItem = raw.match(/^\s+-\s+(.*)$/)
		if (listItem) {
			if (!currentListKey)
				throw new Error(`YAML list item without key on line ${lineNo}`)
			config[currentListKey].push(unquote(listItem[1].trim()))
			return
		}
		if (/^\s/.test(raw))
			throw new Error(`Unexpected indentation on line ${lineNo}`)
		const pair = raw.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/)
		if (!pair) throw new Error(`Invalid YAML on line ${lineNo}`)
		currentListKey = null
		const [, key, value] = pair
		if (value === '') {
			config[key] = []
			currentListKey = key
		} else {
			config[key] = scalar(value.trim())
		}
	})
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
	if (!['window', 'tab'].includes(oaMode))
		throw new Error(`config: invalid oaMode "${oaMode}"`)
	return {
		server: normalizeServerUrl(raw.url),
		apiToken: String(raw.apiToken).trim(),
		maxItems: Math.min(
			1000,
			Math.max(10, Math.round(Number(raw.maxItems) || 100))
		),
		refreshMinutes: Number(raw.refresh) || 0,
		theme,
		oaMode,
		autoReadTitleKeywords: Array.isArray(raw.autoReadTitleKeywords)
			? raw.autoReadTitleKeywords.map(String)
			: String(raw.autoReadTitleKeywords || '')
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean),
	}
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
