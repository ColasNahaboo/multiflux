import React, { useEffect, useRef } from 'react'
import { formatDate } from './lib/util'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'
import Icon from './Icon'
import {
	bookmarkStateControlStyles,
	readStateControlStyles,
} from './readStateStyles'

const ItemHeader = styled.div`
	flex: 0 0 auto;
	height: 34px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 18px;
	padding: 0 18px;
	box-sizing: border-box;
	background-color: ${(props) => props.theme.readerBar};
	border-bottom: 1px solid ${(props) => props.theme.border};
	z-index: 2;
`

const ViewerShell = styled.div`
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
`

const ArticleScroll = styled.div`
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
`

const ReaderArticle = styled.article`
	max-width: ${(props) => props.theme.readerWidth};
	margin: 0 auto;
	padding: 34px 48px 72px;
	box-sizing: border-box;
	color: ${(props) => props.theme.text};
	overflow-wrap: anywhere;
`

const ItemTitle = styled.h1`
	margin: 0 0 14px;
	font-size: 22px;
	line-height: 1.28;
	font-weight: 700;
	color: ${(props) => props.theme.text};
	a {
		color: inherit;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
`

const TitleLink = styled.a`
	display: inline;

	svg {
		margin-left: 6px;
		color: ${(props) => props.theme.muted};
		vertical-align: 0.05em;
	}
`

const ItemMeta = styled.div`
	margin-bottom: 26px;
	font-size: 14px;
	line-height: 1.45;
	color: ${(props) => props.theme.muted};
	a {
		color: inherit;
	}
`

const ItemContent = styled.div`
	font-size: 17px;
	line-height: 1.62;
	color: ${(props) => props.theme.text};
	overflow-wrap: anywhere;

	p {
		margin: 0 0 1.1em;
	}
	img,
	video,
	iframe {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 24px auto;
	}
	iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
	}
	blockquote {
		margin: 1.2em 0;
		padding: 0.2em 0 0.2em 1em;
		border-left: 3px solid ${(props) => props.theme.border};
		color: ${(props) => props.theme.muted};
	}
	pre,
	code {
		font-family: Consolas, 'SFMono-Regular', Menlo, monospace;
		background: ${(props) => props.theme.listheaderbg};
	}
	pre {
		overflow-x: auto;
		padding: 12px;
	}
	table {
		max-width: 100%;
		border-collapse: collapse;
		display: block;
		overflow-x: auto;
	}
	td,
	th {
		border: 1px solid ${(props) => props.theme.border};
		padding: 6px 8px;
	}
`

const ActionButton = styled.button`
	width: 28px;
	height: 28px;
	min-width: 28px;
	padding: 0;
	background: transparent;
	border-color: transparent;
	line-height: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.theme.muted};
	&:hover {
		cursor: pointer;
		color: ${(props) => props.theme.text};
	}
`

const ReadStateAction = styled(ActionButton)`
	${readStateControlStyles}
`

const BookmarkAction = styled(ActionButton)`
	${bookmarkStateControlStyles}
`

const getCommentsUrl = (item) => {
	if (typeof item?.comments_url !== 'string') return null
	const commentsUrl = item.comments_url.trim()
	if (!commentsUrl) return null

	try {
		const resolvedCommentsUrl = new URL(commentsUrl, item.url).href
		const resolvedArticleUrl = new URL(item.url).href
		if (resolvedCommentsUrl === resolvedArticleUrl) return null
	} catch {
		if (commentsUrl === item.url) return null
	}

	return commentsUrl
}

function ItemViewer(props) {
	const item = props.currentItem
	const commentsUrl = getCommentsUrl(item)
	const topRef = useRef()
	const articleScrollRef = useRef()

	useHotkeys('f', () => toggleStar(), [item])
	useHotkeys('v', () => item && window.open(item.url, '_blank'), [item])
	useHotkeys('c', () => commentsUrl && window.open(commentsUrl, '_blank'), [
		commentsUrl,
	])
	useHotkeys(
		'pagedown',
		(e) => {
			e.preventDefault()
			const el = articleScrollRef.current
			if (el) el.scrollTop += el.clientHeight
		},
		[]
	)
	useHotkeys(
		'pageup',
		(e) => {
			e.preventDefault()
			const el = articleScrollRef.current
			if (el) el.scrollTop -= el.clientHeight
		},
		[]
	)

	useEffect(() => {
		if (articleScrollRef.current) articleScrollRef.current.scrollTop = 0
	}, [props.currentItem])

	const toggleStar = async () => {
		if (item) await props.onToggleBookmark(item)
	}
	const toggleRead = async () => {
		if (!item) return
		await props.onSetReadState(
			item,
			item.status === 'unread' ? 'read' : 'unread'
		)
	}
	return !item ? null : (
		<ViewerShell ref={topRef}>
			<ItemHeader>
				<ReadStateAction
					$isRead={item.status !== 'unread'}
					title={
						item.status === 'unread'
							? 'Mark as read'
							: 'Mark as unread'
					}
					aria-label={
						item.status === 'unread'
							? 'Mark as read'
							: 'Mark as unread'
					}
					onClick={toggleRead}
				>
					<Icon
						name={
							item.status === 'unread' ? 'checkCircle' : 'circle'
						}
					/>
				</ReadStateAction>
				{commentsUrl && (
					<ActionButton
						title='Open comments link'
						aria-label='Open comments link'
						onClick={() => window.open(commentsUrl, '_blank')}
					>
						<Icon name='comments' />
					</ActionButton>
				)}
				<BookmarkAction
					$starred={Boolean(item.starred)}
					title={item.starred ? 'Unstar article' : 'Star article'}
					aria-label={
						item.starred ? 'Unstar article' : 'Star article'
					}
					onClick={toggleStar}
				>
					<Icon name='star' />
				</BookmarkAction>
			</ItemHeader>
			<ArticleScroll ref={articleScrollRef}>
				<ReaderArticle>
					<ItemTitle>
						<TitleLink
							href={item.url}
							target='_blank'
							rel='noopener noreferrer'
							title='Open original article'
							aria-label={`Open original article: ${item.title}`}
						>
							{item.title}
							<Icon name='externalLink' size={16} />
						</TitleLink>
					</ItemTitle>
					<ItemMeta>
						{/* eslint-disable-next-line */}
						<a
							href='#'
							onClick={() => props.onFeedChange(item.feed)}
						>
							{item.feed.title}
						</a>
						{item.author && <> · {item.author}</>}
						<> · {formatDate(item.published_at)}</>
					</ItemMeta>
					<ItemContent
						id='itemcontent'
						dangerouslySetInnerHTML={{ __html: item.content }}
					/>
				</ReaderArticle>
			</ArticleScroll>
		</ViewerShell>
	)
}

export default ItemViewer
