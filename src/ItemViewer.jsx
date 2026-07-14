import React, { useEffect, useRef, useState } from 'react'
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
	display: flex;
	align-items: flex-start;
	gap: 14px;
	padding: 14px 16px 12px;
	box-sizing: border-box;
	background-color: ${(props) => props.theme.readerBar};
	border-bottom: 1px solid ${(props) => props.theme.border};
	z-index: 2;
`

const HeaderContent = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`

const HeaderActions = styled.div`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: 6px;
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
	max-width: 960px;
	margin: 0 auto;
	padding: 24px clamp(20px, 5%, 42px) 64px;
	box-sizing: border-box;
	color: ${(props) => props.theme.text};
	overflow-wrap: anywhere;
`

const ItemTitle = styled.h1`
	margin-top: 0;
	margin-bottom: 7px;
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
`

const ItemMeta = styled.div`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	font-size: 14px;
	line-height: 1.45;
	color: ${(props) => props.theme.muted};
	a {
		color: inherit;
	}
`

const FeedIcon = styled.img`
	width: 16px;
	height: 16px;
	flex: 0 0 16px;
	object-fit: contain;
`

const FallbackFeedIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	flex: 0 0 16px;
	color: ${(props) => props.theme.muted};
`

const MetaText = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const FeedLink = styled.a`
	min-width: 0;
	max-width: 45%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: inherit;
`

const MetaSeparator = styled.span`
	flex: 0 0 auto;
`

const PublishedDate = styled.span`
	flex: 0 0 auto;
	white-space: nowrap;
`

const ItemContent = styled.div`
	font-size: 17px;
	line-height: 1.62;
	color: ${(props) => props.theme.text};
	overflow-wrap: anywhere;

	> p,
	> h1,
	> h2,
	> h3,
	> h4,
	> h5,
	> h6,
	> ul,
	> ol,
	> blockquote,
	> pre,
	> table {
		max-width: ${(props) => props.theme.readerWidth};
		margin-left: auto;
		margin-right: auto;
	}

	p {
		margin-top: 0;
		margin-bottom: 1.1em;
	}
	img,
	video,
	iframe {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		margin: 24px auto;
	}
	iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
	}
	blockquote {
		margin-top: 1.2em;
		margin-bottom: 1.2em;
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
		box-sizing: border-box;
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
	width: 26px;
	height: 26px;
	min-width: 26px;
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
	&:disabled {
		cursor: default;
		opacity: 0.45;
	}
`

const ShareIcon = styled.span`
	display: block;
	width: 16px;
	height: 16px;
	background-color: ${(props) =>
		props.$active ? props.theme.accent : props.theme.muted};
	-webkit-mask: url(${(props) => props.$src}) center / 16px 16px no-repeat;
	mask: url(${(props) => props.$src}) center / 16px 16px no-repeat;
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

const getOriginalUrl = (item) => {
	if (typeof item?.url !== 'string') return null

	try {
		const originalUrl = item.url.trim()
		const url = new URL(originalUrl)
		return url.protocol === 'http:' || url.protocol === 'https:'
			? originalUrl
			: null
	} catch {
		return null
	}
}

function ItemViewer(props) {
	const item = props.currentItem
	const feed = props.feed || item?.feed
	const commentsUrl = getCommentsUrl(item)
	const originalUrl = getOriginalUrl(item)
	const topRef = useRef()
	const articleScrollRef = useRef()
	const shareFeedbackTimersRef = useRef({})
	const [activeShareControls, setActiveShareControls] = useState({})

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

	useEffect(
		() => () => {
			Object.values(shareFeedbackTimersRef.current).forEach((timer) =>
				window.clearTimeout(timer)
			)
		},
		[]
	)

	const showShareFeedback = (control) => {
		window.clearTimeout(shareFeedbackTimersRef.current[control])
		setActiveShareControls((current) => ({ ...current, [control]: true }))
		shareFeedbackTimersRef.current[control] = window.setTimeout(() => {
			setActiveShareControls((current) => ({
				...current,
				[control]: false,
			}))
		}, 2000)
	}
	const shareOnTelegram = () => {
		if (!originalUrl) return
		window.location.href = `tg://msg_url?url=${encodeURIComponent(
			originalUrl
		)}&text=${encodeURIComponent(item.title || '')}`
		showShareFeedback('telegram')
	}
	const shareByEmail = () => {
		if (!originalUrl) return
		const title = item.title || ''
		const mailtoUrl = `mailto:?subject=${encodeURIComponent(
			title
		)}&body=${encodeURIComponent(`${title}\n\n${originalUrl}`)}`
		window.open(mailtoUrl, '_blank', 'noopener,noreferrer')
		showShareFeedback('email')
	}
	const copyTitleAndLink = async () => {
		if (!originalUrl) return
		try {
			await navigator.clipboard.writeText(
				`${item.title || ''}\n${originalUrl}`
			)
			showShareFeedback('copy')
		} catch (error) {
			console.warn('Unable to copy article title and link', error)
		}
	}

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
				<HeaderContent>
					<ItemTitle>
						<TitleLink
							href={item.url}
							target='_blank'
							rel='noopener noreferrer'
							title='Open original article'
							aria-label={`Open original article: ${item.title}`}
						>
							{item.title}
						</TitleLink>
					</ItemTitle>
					<ItemMeta>
						{feed.icon_data ? (
							<FeedIcon src={feed.icon_data} alt='' />
						) : (
							<FallbackFeedIcon aria-hidden='true'>
								<Icon name='website' size={14} />
							</FallbackFeedIcon>
						)}
						<FeedLink
							href='#'
							title={feed.title}
							onClick={() => props.onFeedChange(item.feed)}
						>
							{feed.title}
						</FeedLink>
						{item.author && (
							<>
								<MetaSeparator>·</MetaSeparator>
								<MetaText title={item.author}>
									{item.author}
								</MetaText>
							</>
						)}
						<MetaSeparator>·</MetaSeparator>
						<PublishedDate title={item.published_at}>
							{formatDate(item.published_at)}
						</PublishedDate>
					</ItemMeta>
				</HeaderContent>
				<HeaderActions>
					<ActionButton
						title='Share via Telegram'
						aria-label='Share via Telegram'
						disabled={!originalUrl}
						onClick={shareOnTelegram}
					>
						<ShareIcon
							$src='./icons/telegram-16.png'
							$active={activeShareControls.telegram}
							aria-hidden='true'
						/>
					</ActionButton>
					<ActionButton
						title='Share via email'
						aria-label='Share via email'
						disabled={!originalUrl}
						onClick={shareByEmail}
					>
						<ShareIcon
							$src='./icons/email-16.png'
							$active={activeShareControls.email}
							aria-hidden='true'
						/>
					</ActionButton>
					<ActionButton
						title='Copy title and link'
						aria-label='Copy article title and link'
						disabled={!originalUrl}
						onClick={copyTitleAndLink}
					>
						<ShareIcon
							$src='./icons/copy-title-link-16.png'
							$active={activeShareControls.copy}
							aria-hidden='true'
						/>
					</ActionButton>
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
						<Icon name='checkCircle' size={16} />
					</ReadStateAction>
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
					{commentsUrl && (
						<ActionButton
							title='Open comments link'
							aria-label='Open comments link'
							onClick={() => window.open(commentsUrl, '_blank')}
						>
							<Icon name='comments' />
						</ActionButton>
					)}
				</HeaderActions>
			</ItemHeader>
			<ArticleScroll ref={articleScrollRef}>
				<ReaderArticle>
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
