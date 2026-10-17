import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSimpleYaml, applyDefaults } from '../src/lib/config.js'

test('parses flat scalars, booleans, and numbers', () => {
	const cfg = parseSimpleYaml(
		[
			'# comment',
			'url: https://rss.nahaboo.org',
			'apiToken: deadbeef',
			'maxItems: 250',
			'refresh: 30',
			'theme: dark',
			'oaMode: tab',
			'',
		].join('\n')
	)
	assert.equal(cfg.url, 'https://rss.nahaboo.org')
	assert.equal(cfg.apiToken, 'deadbeef')
	assert.equal(cfg.maxItems, 250)
	assert.equal(cfg.refresh, 30)
	assert.equal(cfg.theme, 'dark')
	assert.equal(cfg.oaMode, 'tab')
})

test('parses quoted values and inline lists', () => {
	const cfg = parseSimpleYaml(
		['url: "https://a.example"', "theme: 'light'"].join('\n')
	)
	assert.equal(cfg.url, 'https://a.example')
	assert.equal(cfg.theme, 'light')
})

test('parses block list of keywords', () => {
	const cfg = parseSimpleYaml(
		['autoReadTitleKeywords:', '  - trump', '  - "elon musk"', ''].join(
			'\n'
		)
	)
	assert.deepEqual(cfg.autoReadTitleKeywords, ['trump', 'elon musk'])
})

test('rejects malformed lines', () => {
	assert.throws(() => parseSimpleYaml('no colon here'), /line 1/)
	assert.throws(() => parseSimpleYaml('url: ok\n  indented: bad'), /line 2/)
})

test('applyDefaults fills missing keys and validates', () => {
	const cfg = applyDefaults({
		url: 'https://rss.nahaboo.org/',
		apiToken: 'x',
	})
	assert.equal(cfg.server, 'https://rss.nahaboo.org')
	assert.equal(cfg.maxItems, 100)
	assert.equal(cfg.theme, 'auto')
	assert.equal(cfg.oaMode, 'window')
	assert.deepEqual(cfg.autoReadTitleKeywords, [])
	assert.throws(
		() => applyDefaults({ url: 'https://x', apiToken: 'x', theme: 'neon' }),
		/theme/
	)
	assert.throws(() => applyDefaults({ url: '' }), /url/)
	assert.throws(() => applyDefaults({ url: 'https://x' }), /apiToken/)
})

test('maxItems is clamped to 10..1000', () => {
	assert.equal(
		applyDefaults({ url: 'https://x', apiToken: 't', maxItems: 5 })
			.maxItems,
		10
	)
	assert.equal(
		applyDefaults({ url: 'https://x', apiToken: 't', maxItems: 99999 })
			.maxItems,
		1000
	)
})

test('oaGeometry defaults to right preset', () => {
	const cfg = applyDefaults({ url: 'https://x', apiToken: 't' })
	assert.deepEqual(cfg.oaGeometry, { preset: 'right' })
})

test('oaGeometry accepts presets', () => {
	for (const preset of ['right', 'half']) {
		const cfg = applyDefaults({
			url: 'https://x',
			apiToken: 't',
			oaGeometry: preset,
		})
		assert.deepEqual(cfg.oaGeometry, { preset })
	}
})

test('oaGeometry accepts x,y,w,h tuple', () => {
	const cfg = applyDefaults({
		url: 'https://x',
		apiToken: 't',
		oaGeometry: '1920,0,1280,1024',
	})
	assert.deepEqual(cfg.oaGeometry, { x: 1920, y: 0, w: 1280, h: 1024 })
	const left = applyDefaults({
		url: 'https://x',
		apiToken: 't',
		oaGeometry: '-1920,0,1280,1024',
	})
	assert.deepEqual(left.oaGeometry, { x: -1920, y: 0, w: 1280, h: 1024 })
})

test('oaGeometry rejects malformed values', () => {
	for (const bad of ['top', '1,2,3', 'a,b,c,d', '1,2,3,4,5', '1,,3,4']) {
		assert.throws(
			() =>
				applyDefaults({
					url: 'https://x',
					apiToken: 't',
					oaGeometry: bad,
				}),
			/oaGeometry/,
			`should reject "${bad}"`
		)
	}
})
