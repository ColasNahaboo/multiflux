import test from 'node:test'
import assert from 'node:assert/strict'
import {
	fetchContentPath,
	mergeFetchedContent,
} from '../src/lib/entryContent.js'

test('fetch-content requests persist the extracted article in Miniflux', () => {
	assert.equal(
		fetchContentPath(98937),
		'entries/98937/fetch-content?update_content=true'
	)
})

test('fetched content replaces only the article fields returned by Miniflux', () => {
	const entry = {
		id: 7,
		title: 'Article title',
		content: '<p>RSS summary</p>',
		reading_time: 1,
		status: 'unread',
	}
	const fetched = {
		content: '<p>Full article</p>',
		reading_time: 4,
	}

	assert.deepEqual(mergeFetchedContent(entry, fetched), {
		...entry,
		content: '<p>Full article</p>',
		reading_time: 4,
	})
})

test('fetched content preserves the existing reading time if Miniflux omits it', () => {
	const entry = { id: 7, content: '<p>Summary</p>', reading_time: 1 }

	assert.deepEqual(mergeFetchedContent(entry, { content: '<p>Full</p>' }), {
		...entry,
		content: '<p>Full</p>',
	})
})
