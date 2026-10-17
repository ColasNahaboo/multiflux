import test from 'node:test'
import assert from 'node:assert/strict'
import { oaFeatures } from '../src/lib/host.js'

const reader = {
	screenX: 100,
	screenY: 50,
	outerWidth: 1200,
	outerHeight: 900,
	screen: {
		availLeft: 0,
		availTop: 0,
		availWidth: 1920,
		availHeight: 1040,
	},
}

test('right preset: flush against reader right edge, same size', () => {
	assert.equal(
		oaFeatures({ preset: 'right' }, reader),
		'left=1300,top=50,width=1200,height=900'
	)
})

test('half preset: right half of the screen', () => {
	assert.equal(
		oaFeatures({ preset: 'half' }, reader),
		'left=960,top=0,width=960,height=1040'
	)
})

test('explicit geometry is passed through', () => {
	assert.equal(
		oaFeatures({ x: 1920, y: 0, w: 1280, h: 1024 }, reader),
		'left=1920,top=0,width=1280,height=1024'
	)
})

test('multi-monitor left negative x works', () => {
	const cfg = { x: -1920, y: 0, w: 1280, h: 1024 }
	assert.equal(
		oaFeatures(cfg, reader),
		'left=-1920,top=0,width=1280,height=1024'
	)
})
