import { DEFAULT_KEYMAP } from './lib/keymap.js'

const runtimeConfig = {
	server: null,
	apiToken: null,
	oaMode: 'window',
	maxItems: 100,
	refreshMinutes: 0,
	theme: 'auto',
	autoReadTitleKeywords: [],
	keymap: DEFAULT_KEYMAP,
}

export function configureRuntime(config) {
	Object.assign(runtimeConfig, config)
}

export function getRuntimeConfig() {
	return runtimeConfig
}
