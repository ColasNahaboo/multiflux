import React, { useState, useEffect, useMemo, useRef } from 'react'
import { apiCall, relaTimestamp, requestBadgeRefresh } from './lib/util'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'
import Icon from './Icon'
import { beginAutoRead } from '../settings-utils'
import { bookmarkStateControlStyles } from './readStateStyles'
import { PRIMARY_HEADER_HEIGHT } from './layout'

const Favico = styled.img`
	width: 16px;
	height: 16px;
	vertical-align: middle;
`

const ItemList = styled.div`
	width: 100%;
`

const ItemListRow = styled.div`
	position: relative;
	display: flex;
	gap: 10px;
	min-width: 0;
	padding: 8px 10px 8px 12px;
	border-bottom: 1px solid ${(props) => props.theme.listheaderbg};
	box-sizing: border-box;
	color: ${(props) => props.theme.text};
	background-color: ${(props) =>
		props.selected ? props.theme.selectbg : 'inherit'};
	&:hover {
		background-color: ${(props) =>
			props.selected ? props.theme.selectbg : props.theme.hoverbg};
		cursor: pointer;
	}
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 3px;
		background: ${(props) =>
			props.selected ? props.theme.feedbubble : 'transparent'};
	}
`

const Thumbnail = styled.img`
	flex: 0 0 86px;
	width: 86px;
	height: 86px;
	object-fit: cover;
	background: ${(props) => props.theme.listheaderbg};
`

const ItemText = styled.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5px;
`

const ItemMeta = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 6px;
	min-width: 0;
	font-size: 11px;
	line-height: 16px;
	color: ${(props) => props.theme.preview};
`

const SourceSpacer = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`

const Source = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;
	min-width: 0;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
`

const SourceTitle = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
`

const Age = styled.div`
	flex: 0 0 auto;
	margin-left: auto;
	color: ${(props) => props.theme.text};
	font-size: 11px;
	opacity: 0.75;
	white-space: nowrap;
`

const Headline = styled.div`
	min-width: 0;
	font-size: 15px;
	font-weight: ${(props) => (props.read ? 500 : 700)};
	line-height: 1.32;
	color: ${(props) => props.theme.text};
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow-wrap: anywhere;
`

const ItemActions = styled.button`
	flex: 0 0 auto;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	width: 24px;
	height: 24px;
	min-height: 24px;
	padding: 3px 0 0;
	color: ${(props) =>
		props.read ? props.theme.preview : props.theme.unreaddot};
	background: transparent;
`

const BookmarkButton = styled(ItemActions)`
	${bookmarkStateControlStyles}
`

const ItemBrowserContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
`

const ItemListContainer = styled.div`
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
`

const ItemListState = styled.div`
	padding: 24px 16px;
	color: ${(props) => props.theme.muted};
	text-align: center;
`

const extractThumbnail = (item) => {
	if (item.image_url) return item.image_url
	if (item.image) return item.image

	const enclosure = (item.enclosures || []).find(
		(e) => e.mime_type && e.mime_type.indexOf('image/') === 0 && e.url
	)
	if (enclosure) return enclosure.url

	const span = document.createElement('span')
	span.innerHTML = item.content || ''
	const image = span.querySelector('img[src]')
	return image ? image.getAttribute('src') : null
}

const FeedItem = React.forwardRef((props, ref) => (
	<ItemListRow
		read={props.item.status !== 'unread'}
		ref={ref}
		selected={props.selected}
		onClick={props.onItemChange}
	>
		{props.thumbnail && <Thumbnail src={props.thumbnail} alt='' />}
		<ItemText>
			<ItemMeta>
				{props.showSource ? (
					<Source>
						<Favico
							src={props.feed.icon_data}
							alt={props.feed.title}
							title={props.feed.title}
						/>
						<SourceTitle>{props.feed.title}</SourceTitle>
					</Source>
				) : (
					<SourceSpacer />
				)}
				<Age title={props.item.published_at}>
					{relaTimestamp(props.item.published_at)}
				</Age>
			</ItemMeta>
			<Headline read={props.item.status !== 'unread'}>
				{props.item.title}
			</Headline>
		</ItemText>
		<BookmarkButton
			$starred={Boolean(props.item.starred)}
			onClick={(event) => {
				event.stopPropagation()
				props.toggleBookmark()
			}}
			title={props.item.starred ? 'Unstar article' : 'Star article'}
			aria-label={props.item.starred ? 'Unstar article' : 'Star article'}
		>
			<Icon name='star' size={16} />
		</BookmarkButton>
	</ItemListRow>
))

function FeedItemList(props) {
	const selectedItem = useRef()

	// Thumbnail extraction parses the article HTML, so resolve it once per
	// entry when the item data changes instead of on every render. Entries
	// keep their thumbnail across reconciliations because ids are stable.
	const thumbnailCache = useRef(new Map())
	const thumbnails = useMemo(() => {
		const previous = thumbnailCache.current
		const next = new Map()
		props.items.forEach((item) => {
			next.set(
				item.id,
				previous.has(item.id)
					? previous.get(item.id)
					: extractThumbnail(item)
			)
		})
		thumbnailCache.current = next
		return next
	}, [props.items])

	const itemChange = (item) => {
		if (item) {
			props.onItemChange(item)
			if (item.status === 'unread') props.markRead([item])
		}
	}
	const kbItemChange = (item, e) => {
		itemChange(item)
		if (selectedItem.current)
			selectedItem.current.scrollIntoView({ block: 'center' })
		e.preventDefault()
	}
	useHotkeys(
		'left,p,k,q',
		(e) => {
			kbItemChange(
				props.items[
					props.currentIndex - 1 >= 0 ? props.currentIndex - 1 : 0
				],
				e
			)
		},
		[props.items, props.currentIndex]
	)
	useHotkeys(
		'right,n,j,space,e',
		(e) => {
			kbItemChange(
				props.items[
					props.currentIndex + 1 < props.items.length
						? props.currentIndex + 1
						: props.currentIndex < 0
						? 0
						: props.items.length - 1
				],
				e
			)
		},
		[props.items, props.currentIndex]
	)
	useHotkeys(
		'home',
		(e) => {
			kbItemChange(props.items[0], e)
		},
		[props.items, props.currentIndex]
	)
	useHotkeys(
		'end',
		(e) => {
			kbItemChange(props.items[props.items.length - 1], e)
		},
		[props.items, props.currentIndex]
	)
	useHotkeys(
		'm',
		(e) => {
			if (props.currentIndex >= 0)
				props.markRead(
					[props.items[props.currentIndex]],
					props.items[props.currentIndex].status === 'unread'
				)
		},
		[props.items, props.currentIndex]
	)
	useHotkeys(
		't',
		(e) => {
			if (props.currentIndex < 0) return
			const current = props.items[props.currentIndex]
			const older = props.items.filter(
				(x) =>
					x.published_at < current.published_at &&
					x.status === 'unread'
			)
			props.markRead(older, true)
		},
		[props.items, props.currentIndex]
	)

	return (
		<ItemList>
			{props.items.map((item) => (
				<FeedItem
					key={item.id}
					ref={props.currentItem === item ? selectedItem : null}
					item={item}
					selected={props.currentItem === item}
					thumbnail={thumbnails.get(item.id)}
					showSource={props.showSource}
					feed={
						props.feeds.find(
							(f) => f.id === item.feed.id && f.category
						) || item.feed
					}
					onItemChange={() => itemChange(item)}
					toggleBookmark={() => props.onToggleBookmark(item)}
					errorHandler={props.errorHandler}
				/>
			))}
		</ItemList>
	)
}

const Header = styled.div`
	flex: 0 0 ${PRIMARY_HEADER_HEIGHT}px;
	height: ${PRIMARY_HEADER_HEIGHT}px;
	min-height: ${PRIMARY_HEADER_HEIGHT}px;
	padding: 2px 8px;
	width: 100%;
	box-sizing: border-box;
	background: ${(props) => props.theme.readerBar};
	border-bottom: 1px solid ${(props) => props.theme.border};
`
const HeaderText = styled.div`
	min-width: 0;
	display: flex;
	align-items: baseline;
	gap: 6px;
	flex: 1 1 0;
`
const HeaderTitle = styled.span`
	font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
	font-weight: 400;
	font-size: 12px;
	letter-spacing: 0.18em;
	line-height: 1.25;
	color: ${(props) => props.theme.muted};
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`
const HeaderControls = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 2px;
	flex-wrap: nowrap;
	flex: 0 0 auto;
`
const ControlButton = styled.button`
	height: 28px;
	min-height: 28px;
	width: 28px;
	min-width: 28px;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	color: ${(props) => props.theme.muted};
	&:hover {
		color: ${(props) => props.theme.text};
	}
`
const HeaderTop = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	min-width: 0;
`
const HeaderSelect = styled.select`
	width: 54px;
	height: 22px;
	min-height: 22px;
	padding-left: 4px;
	padding-right: 16px;
	appearance: none;
	border-color: transparent;
	background: linear-gradient(
				45deg,
				transparent 50%,
				${(props) => props.theme.muted} 50%
			)
			right 8px center / 5px 5px no-repeat,
		linear-gradient(
				135deg,
				${(props) => props.theme.muted} 50%,
				transparent 50%
			)
			right 5px center / 5px 5px no-repeat,
		transparent;
	border-radius: 2px;
	color: ${(props) => props.theme.text};
	&:hover,
	&:focus {
		background-color: ${(props) => props.theme.hoverbg};
		border-color: ${(props) => props.theme.border};
		outline: none;
	}
`

const ReadFilterSelect = styled(HeaderSelect)`
	width: 68px;
`

function FeedItemHeader(props) {
	const markAllRead = () => {
		props.markRead(props.items)
	}
	useHotkeys('shift+A', () => markAllRead(), [props.items])
	useHotkeys('u', () => props.setShowRead(!props.showRead), [props.showRead])
	useHotkeys('s', () => props.setSortOldFirst(!props.sortOldFirst), [
		props.sortOldFirst,
	])

	return (
		<Header>
			<HeaderTop>
				{(props.currentFeed || props.searchQuery) && (
					<HeaderText>
						<HeaderTitle>
							{props.searchQuery
								? `Search ${props.searchScopeLabel}: ${props.searchQuery}`
								: props.currentFeed.title}
						</HeaderTitle>
					</HeaderText>
				)}
				<HeaderControls>
					{props.feedPaneCollapsed && (
						<ControlButton
							onClick={props.onRestoreFeedPane}
							title='Show feed navigation'
							aria-label='Show feed navigation'
						>
							<Icon name='chevronRight' />
						</ControlButton>
					)}
					{props.searchQuery && (
						<ControlButton
							onClick={props.onClearSearch}
							title='Clear search'
							aria-label='Clear search'
						>
							<Icon name='dismiss' />
						</ControlButton>
					)}
					<ControlButton
						onClick={markAllRead}
						title='Mark all as read'
						aria-label='Mark all as read'
					>
						<Icon name='checkCircle' size={16} />
					</ControlButton>
					<ReadFilterSelect
						title='Filter articles'
						value={props.showRead ? 'a' : 'u'}
						onChange={(v) => {
							props.setShowRead(v.target.value === 'a')
							v.target.blur()
						}}
					>
						<option value='u'>Unread</option>
						<option value='a'>All</option>
					</ReadFilterSelect>
					<HeaderSelect
						title='Sort articles'
						value={props.sortOldFirst ? 'o' : 'n'}
						onChange={(v) => {
							props.setSortOldFirst(v.target.value === 'o')
							v.target.blur()
						}}
					>
						<option value='n'>New</option>
						<option value='o'>Old</option>
					</HeaderSelect>
				</HeaderControls>
			</HeaderTop>
		</Header>
	)
}

function ItemBrowser(props) {
	const [items, setItems] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [loadError, setLoadError] = useState()
	const [sortOldFirst, setSortOldFirst] = useState(
		localStorage.getItem('sort') !== null
			? localStorage.getItem('sort') === 'o'
			: props.entrySortDirection === 'asc'
	)
	const [showRead, setShowRead] = useState(
		localStorage.getItem('filter') === 'a'
	)
	const pendingAutoReadIds = useRef(new Set())

	const reconcileItems = (entryIds = [], status, feedIds = []) => {
		const affectedIds = new Set(entryIds)
		const affectedFeedIds = new Set(feedIds)
		const isAffected = (item) =>
			affectedIds.has(item.id) || affectedFeedIds.has(item.feed.id)
		setItems((currentItems) => {
			const nextItems = currentItems.map((item) =>
				isAffected(item) ? { ...item, status } : item
			)

			if (props.currentItem && isAffected(props.currentItem)) {
				props.onItemChange(
					nextItems.find(
						(item) => item.id === props.currentItem.id
					) || null
				)
			}

			return nextItems
		})
	}

	useEffect(() => {
		if (
			!props.readReconciliation?.entryIds?.length &&
			!props.readReconciliation?.feedIds?.length
		)
			return
		reconcileItems(
			props.readReconciliation.entryIds || [],
			props.readReconciliation.status || 'read',
			props.readReconciliation.feedIds || []
		)
		// Reconcile only when a completed external mark-read action is published.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.readReconciliation])

	useEffect(() => {
		const updatedItem = props.bookmarkReconciliation?.item
		if (!updatedItem) return

		setItems((currentItems) => {
			const selectedIndex = currentItems.findIndex(
				(item) => item.id === props.currentItem?.id
			)
			const existingIndex = currentItems.findIndex(
				(item) => item.id === updatedItem.id
			)
			let nextItems = currentItems.map((item) =>
				item.id === updatedItem.id ? updatedItem : item
			)

			const starredView = props.currentFeed?.id === -2
			if (starredView && !updatedItem.starred) {
				nextItems = nextItems.filter(
					(item) => item.id !== updatedItem.id
				)
			} else if (
				starredView &&
				updatedItem.starred &&
				existingIndex < 0 &&
				(showRead || updatedItem.status === 'unread') &&
				!props.searchQuery
			) {
				nextItems = [...nextItems, updatedItem].sort((a, b) =>
					sortOldFirst
						? a.published_at.localeCompare(b.published_at)
						: b.published_at.localeCompare(a.published_at)
				)
			}

			if (props.currentItem?.id === updatedItem.id) {
				if (starredView && !updatedItem.starred) {
					props.onItemChange(
						nextItems[
							Math.min(selectedIndex, nextItems.length - 1)
						] || null
					)
				} else {
					props.onItemChange(updatedItem)
				}
			}

			return nextItems
		})
		// Reconcile only when a completed bookmark mutation is published.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.bookmarkReconciliation])

	useEffect(() => {
		let cancelled = false
		const fetchItems = async () => {
			if (!props.currentFeed && !props.searchQuery) {
				setItems([])
				return
			}

			setIsLoading(true)
			setLoadError(null)
			const urls = props.searchQuery
				? [
						props.searchPath +
							(props.searchPath.includes('?') ? '&' : '?') +
							'search=' +
							encodeURIComponent(props.searchQuery),
				  ]
			: props.currentFeed.fetch_url
			? [props.currentFeed.fetch_url]
			: props.currentFeed.id === -3
			? props.feeds
					.filter((f) => f.is_feed && !f.hide_globally)
					.map((f) => f.fetch_url)
			: props.feeds
						.filter((f) => f.category)
						.filter((f) => f.category.id === props.currentFeed.id)
						.map((f) => f.fetch_url)

			try {
				const result = await Promise.all(
					urls.map((url) =>
						apiCall(
							url +
								(url.includes('?') ? '&' : '?') +
								'limit=' +
								props.maxItems +
								'&order=published_at&direction=' +
								(sortOldFirst ? 'asc' : 'desc') +
								(showRead ? '' : '&status=unread'),
							props.searchQuery
								? (error) =>
										!cancelled &&
										setLoadError(String(error))
								: props.errorHandler
						)
					)
				)
				const nextItems = []
				result.forEach((response) =>
					nextItems.push(...response.entries)
				)
				const autoRead = beginAutoRead(
					nextItems,
					showRead ? [] : props.autoReadTitleKeywords,
					(entryIds) =>
						apiCall('entries', () => {}, {
							entry_ids: entryIds,
							status: 'read',
						}),
					pendingAutoReadIds.current
				)
				autoRead.requestedEntries.forEach((item) =>
					pendingAutoReadIds.current.add(item.id)
				)
				if (!cancelled) {
					setItems(
						autoRead.visibleEntries.sort((a, b) =>
							sortOldFirst
								? a.published_at.localeCompare(b.published_at)
								: b.published_at.localeCompare(a.published_at)
						)
					)
					if (autoRead.requestedEntries.length)
						props.adjustUnreadCounts(autoRead.requestedEntries, -1)
				}
				if (autoRead.requestedEntries.length) {
					autoRead.completion
						.then(() => {
							requestBadgeRefresh()
							props.updateUnread([
								...new Set(
									autoRead.requestedEntries.map(
										(item) => item.feed.id
									)
								),
							])
						})
						.catch(() => {
							if (!cancelled) {
								props.adjustUnreadCounts(
									autoRead.requestedEntries,
									1
								)
								setItems((current) =>
									[...current, ...autoRead.requestedEntries]
										.filter(
											(item, index, all) =>
												all.findIndex(
													(candidate) =>
														candidate.id === item.id
												) === index
										)
										.sort((a, b) =>
											sortOldFirst
												? a.published_at.localeCompare(
														b.published_at
												  )
												: b.published_at.localeCompare(
														a.published_at
												  )
										)
								)
								props.errorHandler(
									'Some automatically filtered articles could not be marked read.'
								)
							}
						})
						.finally(() =>
							autoRead.requestedEntries.forEach((item) =>
								pendingAutoReadIds.current.delete(item.id)
							)
						)
				}
			} catch {
				if (!cancelled && props.searchQuery) {
					setItems([])
					setLoadError('Search could not be completed.')
				}
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}
		fetchItems()
		return () => {
			cancelled = true
		}
	}, [
		sortOldFirst,
		showRead,
		props.currentFeed,
		props.feeds,
		props.errorHandler,
		props.maxItems,
		props.searchPath,
		props.searchQuery,
		props.viewRevision,
		props.autoReadTitleKeywords,
	])

	const markRead = async (i, read) => {
		if (i.length > 0) {
			const status = read || read === undefined ? 'read' : 'unread'
			if (i.length === 1) {
				await props.onSetReadState(i[0], status)
				return
			}
			await apiCall('entries', props.errorHandler, {
				entry_ids: i.map((x) => x.id),
				status,
			})
			requestBadgeRefresh()
			props.updateUnread(
				i
					.map((x) => x.feed.id)
					.filter((f, index, self) => self.indexOf(f) === index)
			)

			reconcileItems(
				i.map((item) => item.id),
				status
			)
		}
	}
	return (
		<ItemBrowserContainer>
			<FeedItemHeader
				items={items}
				currentFeed={props.currentFeed}
				searchQuery={props.searchQuery}
				searchScopeLabel={props.searchScopeLabel}
				onClearSearch={props.onClearSearch}
				sortOldFirst={sortOldFirst}
				setSortOldFirst={(b) => {
					setSortOldFirst(b)
					localStorage.setItem('sort', b ? 'o' : 'n')
				}}
				showRead={showRead}
				setShowRead={(b) => {
					setShowRead(b)
					localStorage.setItem('filter', b ? 'a' : 'u')
				}}
				markRead={markRead}
				errorHandler={props.errorHandler}
				feedPaneCollapsed={props.feedPaneCollapsed}
				onRestoreFeedPane={props.onRestoreFeedPane}
			/>

			<ItemListContainer>
				{isLoading ? (
					<ItemListState role='status'>
						{props.searchQuery ? 'Searching...' : 'Loading...'}
					</ItemListState>
				) : props.searchQuery && loadError ? (
					<ItemListState role='alert'>{loadError}</ItemListState>
				) : props.searchQuery && items.length === 0 ? (
					<ItemListState role='status'>No results</ItemListState>
				) : (
					<FeedItemList
						items={items}
						feeds={props.feeds}
						currentItem={props.currentItem}
						currentIndex={
							props.currentItem
								? items.indexOf(props.currentItem)
								: -1
						}
						onItemChange={props.onItemChange}
						markRead={markRead}
						onToggleBookmark={props.onToggleBookmark}
						errorHandler={props.errorHandler}
						showSource={
							!!props.searchQuery ||
							!props.currentFeed ||
							!props.currentFeed.is_feed
						}
					/>
				)}
			</ItemListContainer>
		</ItemBrowserContainer>
	)
}

export default ItemBrowser
