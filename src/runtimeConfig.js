const runtimeConfig = {
	server: null,
	apiToken: null,
	oaMode: 'window',
	maxItems: 100,
	refreshMinutes: 0,
	theme: 'auto',
	autoReadTitleKeywords: [],
}

export function configureRuntime(config) {
	Object.assign(runtimeConfig, config)
}

export function getRuntimeConfig() {
	return runtimeConfig
}
