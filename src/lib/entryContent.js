export function fetchContentPath(entryId) {
	return `entries/${encodeURIComponent(
		entryId
	)}/fetch-content?update_content=true`
}

export function mergeFetchedContent(entry, fetchedContent) {
	return {
		...entry,
		content: fetchedContent.content,
		...(fetchedContent.reading_time == null
			? {}
			: { reading_time: fetchedContent.reading_time }),
	}
}
