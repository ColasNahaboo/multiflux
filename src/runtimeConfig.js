const runtimeConfig = {
	extensionMode: true,
	server: null,
	apiToken: null,
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
