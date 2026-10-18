import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveCurrentFeed } from '../src/lib/settings.js'

const tree = [
	{ id: -3, title: 'Global Unread' },
	{ id: -1, title: 'All', fetch_url: 'entries' },
	{ id: -2, title: 'Starred', fetch_url: 'entries?starred=true' },
	{ id: 5, title: 'Cat', unreads: 0 },
	{ id: 86, title: 'Gone', fetch_url: 'feeds/86/entries', is_feed: true },
]

test('selection refresh re-adopts the matching feed from the new tree', () => {
	const current = { id: 86, title: 'Old', fetch_url: 'x', is_feed: true }
	const next = resolveCurrentFeed(current, tree)
	assert.equal(next.title, 'Gone')
})

test('pseudo feeds survive a refresh unchanged', () => {
	for (const id of [-1, -2, -3]) {
		const current = tree.find((item) => item.id === id)
		const next = resolveCurrentFeed(current, tree)
		assert.equal(next.id, id)
	}
})

test('a deleted feed clears the selection instead of going stale', () => {
	const current = {
		id: 999,
		title: 'Deleted',
		fetch_url: 'feeds/999/entries',
		is_feed: true,
	}
	assert.equal(resolveCurrentFeed(current, tree), undefined)
})

test('a deleted category clears the selection', () => {
	const current = { id: 42, title: 'Old category' }
	assert.equal(resolveCurrentFeed(current, tree), undefined)
})

test('no selection stays no selection', () => {
	assert.equal(resolveCurrentFeed(undefined, tree), undefined)
})
