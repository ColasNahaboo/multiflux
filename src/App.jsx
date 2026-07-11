import React, { useState, useEffect, useRef } from 'react'
import FeedBrowser from './FeedBrowser'
import ItemBrowser from './ItemBrowser'
import ItemViewer from './ItemViewer'
import KeyHelpModal from './KeyHelpModal'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'
import { apiCall, createFeedIcon, requestBadgeRefresh } from './lib/util'
import { GlobalStyles } from './globalStyles'
import { ThemeProvider } from 'styled-components'
import { lightTheme, darkTheme } from './themes'
import ClickNHold from './ClickNHold'
import Icon from './Icon'

const ErrorDiv = styled.div`
	padding: 10px;
	background-color: ${(props) => props.theme.errorbg};
	color: ${(props) => props.theme.errorfg};
	text-align: center;
	position: absolute;
	width: 100%;
	z-index: 100;
	font-weight: bold;
`

const ErrorClose = styled.div`
	float: right;
	margin-right: 20px;
`

const FloatingButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	width: 32px;
	height: 32px;
	padding: 0;
	background: transparent;
	color: ${(props) => props.theme.muted};
	&:hover {
		color: ${(props) => props.theme.text};
	}
`

const AppLayout = styled.div`
	height: 100vh;
	width: 100vw;
	display: flex;
	overflow: hidden;
	background: ${(props) => props.theme.surface};
`

const Pane = styled.div`
	overflow: auto;
	min-width: 0;
`

const FeedPane = styled(Pane)`
	flex: 0 0 ${(props) => props.width}px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: ${(props) => props.theme.navbg};
	border-right: 1px solid ${(props) => props.theme.border};
`

const ItemPane = styled(Pane)`
	flex: 0 0 ${(props) => props.width}px;
	display: flex;
	flex-direction: column;
	background: ${(props) => props.theme.surface};
`

const ReaderPane = styled(Pane)`
	flex: 1 1 auto;
	min-width: ${() => READER_MIN_WIDTH}px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: ${(props) => props.theme.surface};
`

const ResizeHandle = styled.div`
	flex: 0 0 5px;
	margin: 0 -3px;
	border-left: 2px solid transparent;
	border-right: 2px solid transparent;
	cursor: col-resize;
	box-sizing: border-box;
	background-clip: padding-box;
	z-index: 1;
	touch-action: none;
	&:hover {
		background: ${(props) => props.theme.border};
	}
`

const ItemResizeHandle = styled(ResizeHandle)`
	position: relative;
	flex-basis: 1px;
	margin: 0;
	border: 0;
	background: ${(props) => props.theme.border};
	&::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -4px;
		width: 9px;
	}
`

const FeedToolbar = styled.div`
	height: 34px;
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 0 6px;
	border-bottom: 1px solid ${(props) => props.theme.border};
	box-sizing: border-box;
`

const SearchForm = styled.form`
	display: flex;
	align-items: center;
	gap: 4px;
	height: 52px;
	padding: 4px 6px;
	box-sizing: border-box;
	border-bottom: 1px solid ${(props) => props.theme.border};
`

const SearchFields = styled.div`
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
	flex-direction: column;
	gap: 2px;
`

const SearchScope = styled.div`
	font-size: 10px;
	line-height: 12px;
	color: ${(props) => props.theme.muted};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const SearchInput = styled.input`
	flex: 1 1 auto;
	min-width: 0;
	height: 28px;
	padding: 4px 7px;
	box-sizing: border-box;
`

const ToolbarSpacer = styled.div`
	flex: 1 1 auto;
`

const FEED_MIN_WIDTH = 180
const FEED_MAX_WIDTH = 520
const ITEM_MIN_WIDTH = 300
const ITEM_MAX_WIDTH = 520
const ITEM_MAX_VIEWPORT_RATIO = 0.5
const READER_MIN_WIDTH = 420
const RESIZE_HANDLE_WIDTH = 5
const DEFAULT_FEED_WIDTH = 278
const DEFAULT_ITEM_WIDTH = 380
const PRODUCT_TITLE = 'Miniflux Companion'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getStoredNumber = (key) => {
	const stored = localStorage.getItem(key)
	if (!stored || !/^\d+$/.test(stored)) return null
	const value = Number(stored)
	return Number.isFinite(value) && value > 0 ? value : null
}

const getInitialFeedWidth = () => {
	return clamp(
		getStoredNumber('feed_pane_width') || DEFAULT_FEED_WIDTH,
		FEED_MIN_WIDTH,
		FEED_MAX_WIDTH
	)
}

const getInitialItemWidth = () => {
	const collapsed = localStorage.getItem('feed_pane_collapsed') === 'true'
	const feedWidth = collapsed ? 0 : getInitialFeedWidth()
	const availableMax = Math.max(
		ITEM_MIN_WIDTH,
		Math.min(
			ITEM_MAX_WIDTH,
			window.innerWidth * ITEM_MAX_VIEWPORT_RATIO,
			window.innerWidth -
				feedWidth -
				READER_MIN_WIDTH -
				(collapsed ? RESIZE_HANDLE_WIDTH : RESIZE_HANDLE_WIDTH * 2)
		)
	)
	const stored = getStoredNumber('item_pane_width')
	if (!stored || stored < ITEM_MIN_WIDTH || stored > availableMax) {
		return clamp(DEFAULT_ITEM_WIDTH, ITEM_MIN_WIDTH, availableMax)
	}
	return stored
}

const sum = (arr) => {
	return arr.reduce((a, b) => {
		return a + (b['unreads'] || 0)
	}, 0)
}

const darkModeMediaQuery = window.matchMedia
	? window.matchMedia('(prefers-color-scheme: dark)').matches
		? darkTheme
		: lightTheme
	: lightTheme

function App({ extensionConfig }) {
	const [theme, setThemeState] = useState(extensionConfig.theme)
	const maxItems = extensionConfig.maxItems
	const refreshInterval = extensionConfig.refreshMinutes * 60 * 1000
	const setTheme = (value) => {
		setThemeState(value)
		chrome.storage.sync.set({ theme: value })
	}

	const [error, setError] = useState()
	const [currentFeed, setCurrentFeed] = useState()
	const [currentItem, setCurrentItem] = useState()
	const [feeds, setFeeds] = useState([])
	const [sourcesLoading, setSourcesLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState(
		extensionConfig?.initialSearch || ''
	)
	const [searchInput, setSearchInput] = useState(
		extensionConfig?.initialSearch || ''
	)
	const [searchOpen, setSearchOpen] = useState(
		!!extensionConfig?.initialSearch
	)
	const searchInputRef = useRef()
	const previousItemRef = useRef()

	const [helpOpen, setHelpOpen] = useState(false)

	const [updateFeedsTrigger, setUpdateFeedsTrigger] = useState(true)
	const [renderFeedsTrigger, setRenderFeedsTrigger] = useState(true)
	const [updateUnreadTrigger, setUpdateUnreadTrigger] = useState([])
	const [readReconciliation, setReadReconciliation] = useState()
	const [bookmarkReconciliation, setBookmarkReconciliation] = useState()
	const [viewRevision, setViewRevision] = useState(0)
	const [feedPaneWidth, setFeedPaneWidth] = useState(getInitialFeedWidth)
	const [itemPaneWidth, setItemPaneWidth] = useState(getInitialItemWidth)
	const [feedPaneCollapsed, setFeedPaneCollapsed] = useState(
		localStorage.getItem('feed_pane_collapsed') === 'true'
	)
	const [dragging, setDragging] = useState(null)
	const layoutRef = useRef()
	const readerRef = useRef()
	const dragRef = useRef()
	const searchPath = currentFeed
		? currentFeed.is_feed
			? `feeds/${currentFeed.id}/entries`
			: currentFeed.fetch_url
			? currentFeed.fetch_url
			: `categories/${currentFeed.id}/entries`
		: 'entries'
	const searchScopeLabel =
		!currentFeed || currentFeed.id === -1
			? 'all articles'
			: currentFeed.title

	useEffect(() => {
		document.title = currentItem?.title
			? `${currentItem.title} | ${PRODUCT_TITLE}`
			: PRODUCT_TITLE
	}, [currentItem])

	const clearSearch = () => {
		const url = new URL(window.location.href)
		url.searchParams.delete('search')
		window.history.replaceState(null, '', url)
		setSearchQuery('')
		setSearchInput('')
		setSearchOpen(false)
		setCurrentItem(previousItemRef.current || null)
		previousItemRef.current = null
	}

	const submitSearch = (event) => {
		event.preventDefault()
		const query = searchInput.trim()
		if (!query) {
			clearSearch()
			return
		}
		if (!searchQuery) previousItemRef.current = currentItem
		const url = new URL(window.location.href)
		url.searchParams.set('search', query)
		window.history.replaceState(null, '', url)
		setCurrentItem(null)
		setSearchQuery(query)
		setViewRevision((revision) => revision + 1)
	}

	const selectFeed = (feed) => {
		previousItemRef.current = null
		setCurrentItem(null)
		setCurrentFeed(feed)
		setViewRevision((revision) => revision + 1)
	}

	useEffect(() => {
		if (searchOpen) searchInputRef.current?.focus()
	}, [searchOpen])

	const [, updateState] = React.useState()
	const forceUpdate = React.useCallback(() => updateState({}), [])

	// eslint-disable-next-line
	const cache = JSON.parse(localStorage.getItem('favicons')) || {}

	useEffect(() => {
		const fetchFeeds = async () => {
			setSourcesLoading(true)
			try {
				const [apiFeeds, apiCategories] = await Promise.all([
					apiCall('feeds', setError),
					apiCall('categories', setError),
				])
				const categoryById = new Map(
					apiCategories.map((category) => [category.id, category])
				)

				const feedTree = [
					{ id: -1, title: 'All', fetch_url: 'entries', unreads: 0 },
					{
						id: -2,
						title: 'Starred',
						fetch_url: 'entries?starred=true',
						unreads: 0,
					},
				]

				apiCategories
					.sort((a, b) => a.title.localeCompare(b.title))
					.forEach((category) => {
						feedTree.push({ ...category, unreads: 0 })
						feedTree.push(
							...apiFeeds
								.filter(
									(feed) => feed.category?.id === category.id
								)
								.sort((a, b) => a.title.localeCompare(b.title))
								.map((feed) => ({
									...feed,
									category: categoryById.get(
										feed.category.id
									),
									fetch_url: 'feeds/' + feed.id + '/entries',
									is_feed: true,
								}))
						)
					})

				feedTree.forEach(async (f) => {
					f.icon_data = createFeedIcon(f.title)
					if (f.icon && f.id in cache) {
						f.icon_data = cache[f.id]
					} else if (f.icon) {
						try {
							const icon = await apiCall(
								'feeds/' + f.id + '/icon',
								(e) => {}
							)
							f.icon_data = 'data:' + icon.data
						} catch {}

						localStorage.setItem(
							'favicons',
							JSON.stringify({
								...JSON.parse(localStorage.getItem('favicons')),
								[f.id]: f.icon_data,
							})
						)
						forceUpdate()
					}
				})
				setFeeds(feedTree)
				setCurrentFeed((current) => {
					if (!current) return current
					return (
						feedTree.find(
							(item) =>
								item.id === current.id &&
								Boolean(item.is_feed) ===
									Boolean(current.is_feed) &&
								Boolean(item.fetch_url) ===
									Boolean(current.fetch_url)
						) || current
					)
				})
				setUpdateUnreadTrigger(feedTree)
			} finally {
				setSourcesLoading(false)
			}
		}
		if (updateFeedsTrigger) fetchFeeds()
		setUpdateFeedsTrigger(false)
	}, [updateFeedsTrigger, cache, forceUpdate])

	useEffect(() => {
		if (refreshInterval > 0) {
			let timer = setInterval(
				() => setUpdateFeedsTrigger(true),
				refreshInterval
			)
			return () => clearInterval(timer)
		}
	}, [refreshInterval])

	useEffect(() => {
		const updateUnread = async (f, state) => {
			if (parseInt(f)) {
				state = feeds
				f = feeds.find((x) => x.id === f && x.fetch_url)
			}
			if (!f.fetch_url) return

			const unread = await apiCall(
				f.fetch_url +
					(f.fetch_url.includes('?') ? '&' : '?') +
					'status=unread&limit=1',
				setError
			)
			f['unreads'] = unread.total
			setRenderFeedsTrigger(true)

			state
				.filter((f) => !f.fetch_url)
				.forEach((c) => {
					c['unreads'] = sum(
						state.filter(
							(x) => x.category && x.category.id === c.id
						)
					)
				})

			forceUpdate()
		}

		if (updateUnreadTrigger.length > 0) {
			;[-2, -1, ...updateUnreadTrigger].forEach((u) =>
				updateUnread(u, updateUnreadTrigger)
			)
			setUpdateUnreadTrigger([])
		}
	}, [feeds, forceUpdate, updateUnreadTrigger])

	const markAllRead = async (f) => {
		const feedIds = f.is_feed
			? [f.id]
			: feeds
					.filter(
						(item) => item.is_feed && item.category?.id === f.id
					)
					.map((item) => item.id)
		await apiCall(
			f.is_feed
				? `feeds/${f.id}/mark-all-as-read`
				: `categories/${f.id}/mark-all-as-read`,
			setError,
			{}
		)
		requestBadgeRefresh()
		setReadReconciliation({ feedIds, status: 'read' })
		setCurrentItem((item) =>
			item && feedIds.includes(item.feed.id)
				? { ...item, status: 'read' }
				: item
		)
		setUpdateUnreadTrigger(feedIds)
	}

	const refreshFeedCounts = () => {
		setUpdateUnreadTrigger(feeds.map((x) => x.id))
		setViewRevision((revision) => revision + 1)
	}
	const refreshFeeds = async () => {
		await apiCall('feeds/refresh', setError, {})
		setUpdateFeedsTrigger(true)
		setViewRevision((revision) => revision + 1)
	}
	const activeScopeIncludesFeed = (feed) =>
		currentFeed?.id === -1 ||
		currentFeed?.id === feed.id ||
		(!currentFeed?.is_feed && currentFeed?.id === feed.category?.id)
	const refreshSingleFeed = async (feed) => {
		await apiCall(`feeds/${feed.id}/refresh`, setError, {})
		setUpdateFeedsTrigger(true)
		if (activeScopeIncludesFeed(feed))
			setViewRevision((revision) => revision + 1)
	}
	const editFeed = async (feed, values) => {
		await apiCall(`feeds/${feed.id}`, setError, values)
		const category = feeds.find(
			(item) => !item.fetch_url && item.id === values.category_id
		)
		const updatedFeed = { ...feed, ...values, category }
		setFeeds((current) =>
			current.map((item) => (item.id === feed.id ? updatedFeed : item))
		)
		if (currentFeed?.id === feed.id) setCurrentFeed(updatedFeed)
		setUpdateFeedsTrigger(true)
		if (
			activeScopeIncludesFeed(feed) ||
			(!currentFeed?.is_feed && currentFeed?.id === values.category_id)
		)
			setViewRevision((revision) => revision + 1)
	}
	const deleteFeed = async (feed) => {
		await apiCall(`feeds/${feed.id}`, setError, null, 'DELETE')
		requestBadgeRefresh()
		setFeeds((current) => current.filter((item) => item.id !== feed.id))
		if (currentFeed?.id === feed.id) {
			setCurrentFeed(undefined)
			setCurrentItem(undefined)
		} else if (currentItem?.feed?.id === feed.id) {
			setCurrentItem(undefined)
		}
		setUpdateFeedsTrigger(true)
		if (activeScopeIncludesFeed(feed))
			setViewRevision((revision) => revision + 1)
	}
	const refreshCategory = async (category) => {
		await apiCall(`categories/${category.id}/refresh`, setError, {})
		setUpdateFeedsTrigger(true)
		if (currentFeed?.id === category.id || currentFeed?.id === -1)
			setViewRevision((revision) => revision + 1)
	}
	const addFeed = async (category, feedUrl) => {
		const payload = { feed_url: feedUrl }
		if (category) payload.category_id = category.id
		setSourcesLoading(true)
		try {
			const created = await apiCall('feeds', setError, payload, 'POST')
			const createdFeed = await apiCall(
				`feeds/${created.feed_id}`,
				setError
			)
			const authoritativeCategory = feeds.find(
				(item) =>
					!item.fetch_url && item.id === createdFeed.category?.id
			)
			setFeeds((current) => [
				...current,
				{
					...createdFeed,
					category: authoritativeCategory || createdFeed.category,
					fetch_url: `feeds/${createdFeed.id}/entries`,
					is_feed: true,
				},
			])
			setUpdateFeedsTrigger(true)
		} catch (error) {
			setSourcesLoading(false)
			throw error
		}
	}
	const createCategory = async (title) => {
		const category = await apiCall(
			'categories',
			setError,
			{ title },
			'POST'
		)
		setFeeds((current) => [...current, { ...category, unreads: 0 }])
		setUpdateFeedsTrigger(true)
	}
	const renameCategory = async (category, title) => {
		const updated = await apiCall(`categories/${category.id}`, setError, {
			title,
		})
		setFeeds((current) =>
			current.map((item) => {
				if (item.id === category.id && !item.is_feed)
					return { ...item, ...updated }
				if (item.category?.id === category.id)
					return {
						...item,
						category: { ...item.category, ...updated },
					}
				return item
			})
		)
		if (currentFeed?.id === category.id)
			setCurrentFeed((current) => ({ ...current, ...updated }))
	}
	const deleteCategory = async (category) => {
		const categoryFeeds = feeds.filter(
			(item) => item.is_feed && item.category?.id === category.id
		)
		if (categoryFeeds.length) {
			const message =
				'Move or delete the feeds in this category before deleting it.'
			setError(message)
			throw new Error(message)
		}
		await apiCall(`categories/${category.id}`, setError, null, 'DELETE')
		setFeeds((current) => current.filter((item) => item.id !== category.id))
		if (currentFeed?.id === category.id) {
			setCurrentFeed(undefined)
			setCurrentItem(undefined)
		}
	}
	const setReadState = async (item, status) => {
		if (!item) return
		await apiCall('entries', setError, {
			entry_ids: [item.id],
			status,
		})
		requestBadgeRefresh()
		setUpdateUnreadTrigger([item.feed.id])
		setReadReconciliation({ entryIds: [item.id], status })
		setCurrentItem((current) =>
			current?.id === item.id ? { ...current, status } : current
		)
	}
	const toggleBookmark = async (item) => {
		if (!item) return
		await apiCall('entries/' + item.id + '/bookmark', setError, {})
		// Miniflux entry responses expose bookmark state as `starred`.
		const updatedItem = { ...item, starred: !Boolean(item.starred) }
		setBookmarkReconciliation({ item: updatedItem })
		setCurrentItem((current) =>
			current?.id === updatedItem.id ? updatedItem : current
		)
	}

	const getMaxFeedWidth = (containerWidth, itemWidth) => {
		return Math.max(
			FEED_MIN_WIDTH,
			Math.min(
				FEED_MAX_WIDTH,
				containerWidth -
					itemWidth -
					READER_MIN_WIDTH -
					RESIZE_HANDLE_WIDTH * 2
			)
		)
	}

	const getMaxItemWidth = (containerWidth, feedWidth, collapsed) => {
		return Math.max(
			ITEM_MIN_WIDTH,
			Math.min(
				ITEM_MAX_WIDTH,
				containerWidth * ITEM_MAX_VIEWPORT_RATIO,
				containerWidth -
					(collapsed ? 0 : feedWidth) -
					READER_MIN_WIDTH -
					(collapsed ? RESIZE_HANDLE_WIDTH : RESIZE_HANDLE_WIDTH * 2)
			)
		)
	}

	const clampPaneWidths = (feedWidth, itemWidth, collapsed) => {
		const containerWidth = layoutRef.current
			? layoutRef.current.clientWidth
			: window.innerWidth
		const nextFeedWidth = collapsed
			? feedWidth
			: clamp(
					feedWidth,
					FEED_MIN_WIDTH,
					getMaxFeedWidth(containerWidth, itemWidth)
			  )
		const nextItemWidth = clamp(
			itemWidth,
			ITEM_MIN_WIDTH,
			getMaxItemWidth(containerWidth, nextFeedWidth, collapsed)
		)
		return { feedWidth: nextFeedWidth, itemWidth: nextItemWidth }
	}

	const persistPaneWidths = (feedWidth, itemWidth) => {
		localStorage.setItem('feed_pane_width', feedWidth)
		localStorage.setItem('item_pane_width', itemWidth)
	}

	const updatePaneWidths = (feedWidth, itemWidth, collapsed) => {
		const next = clampPaneWidths(feedWidth, itemWidth, collapsed)
		setFeedPaneWidth(next.feedWidth)
		setItemPaneWidth(next.itemWidth)
		persistPaneWidths(next.feedWidth, next.itemWidth)
	}

	const resetItemPaneWidth = () => {
		updatePaneWidths(feedPaneWidth, DEFAULT_ITEM_WIDTH, feedPaneCollapsed)
	}

	const collapseFeedPane = () => {
		setFeedPaneCollapsed(true)
		localStorage.setItem('feed_pane_collapsed', 'true')
		updatePaneWidths(feedPaneWidth, itemPaneWidth, true)
	}

	const restoreFeedPane = () => {
		setFeedPaneCollapsed(false)
		localStorage.setItem('feed_pane_collapsed', 'false')
		updatePaneWidths(feedPaneWidth, itemPaneWidth, false)
	}

	const startResize = (pane, event) => {
		event.preventDefault()
		dragRef.current = {
			pane,
			startX: event.clientX,
			feedPaneWidth,
			itemPaneWidth,
			feedPaneCollapsed,
		}
		setDragging(pane)
	}

	const resizeWithKeyboard = (pane, event) => {
		const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
		if (!keys.includes(event.key)) return
		event.preventDefault()

		const containerWidth = layoutRef.current
			? layoutRef.current.clientWidth
			: window.innerWidth
		if (pane === 'feed') {
			if (event.key === 'Home') {
				updatePaneWidths(FEED_MIN_WIDTH, itemPaneWidth, false)
			} else if (event.key === 'End') {
				updatePaneWidths(
					getMaxFeedWidth(containerWidth, itemPaneWidth),
					itemPaneWidth,
					false
				)
			} else {
				updatePaneWidths(
					feedPaneWidth + (event.key === 'ArrowRight' ? 10 : -10),
					itemPaneWidth,
					false
				)
			}
		} else if (event.key === 'Home') {
			updatePaneWidths(feedPaneWidth, ITEM_MIN_WIDTH, feedPaneCollapsed)
		} else if (event.key === 'End') {
			updatePaneWidths(
				feedPaneWidth,
				getMaxItemWidth(
					containerWidth,
					feedPaneWidth,
					feedPaneCollapsed
				),
				feedPaneCollapsed
			)
		} else {
			updatePaneWidths(
				feedPaneWidth,
				itemPaneWidth + (event.key === 'ArrowRight' ? 10 : -10),
				feedPaneCollapsed
			)
		}
	}

	useEffect(() => {
		if (!dragging) return

		const move = (event) => {
			if (!dragRef.current) return
			const delta = event.clientX - dragRef.current.startX
			if (dragRef.current.pane === 'feed') {
				updatePaneWidths(
					dragRef.current.feedPaneWidth + delta,
					dragRef.current.itemPaneWidth,
					false
				)
			} else {
				updatePaneWidths(
					dragRef.current.feedPaneWidth,
					dragRef.current.itemPaneWidth + delta,
					dragRef.current.feedPaneCollapsed
				)
			}
		}

		const stop = () => {
			dragRef.current = null
			setDragging(null)
		}

		document.body.classList.add('pane-resizing')
		window.addEventListener('pointermove', move)
		window.addEventListener('pointerup', stop)
		window.addEventListener('pointercancel', stop)
		return () => {
			document.body.classList.remove('pane-resizing')
			window.removeEventListener('pointermove', move)
			window.removeEventListener('pointerup', stop)
			window.removeEventListener('pointercancel', stop)
		}
		// eslint-disable-next-line
	}, [dragging])

	useEffect(() => {
		const resize = () => {
			updatePaneWidths(feedPaneWidth, itemPaneWidth, feedPaneCollapsed)
		}
		window.addEventListener('resize', resize)
		return () => window.removeEventListener('resize', resize)
	})

	useHotkeys(
		'h',
		() => {
			setHelpOpen(true)
		},
		[]
	)
	useHotkeys(
		'esc',
		() => {
			if (searchOpen || searchQuery) clearSearch()
		},
		[searchOpen, searchQuery]
	)
	useHotkeys(
		'shift+d',
		() => {
			setTheme(theme === 'light' ? 'dark' : 'light')
		},
		[theme]
	)

	useHotkeys(
		'r',
		() => {
			refreshFeedCounts()
		},
		[feeds]
	)
	useHotkeys(
		'shift+r',
		() => {
			refreshFeeds()
		},
		[feeds]
	)

	return (
		<ThemeProvider
			theme={
				theme === 'auto'
					? darkModeMediaQuery
					: theme === 'light'
					? lightTheme
					: darkTheme
			}
		>
			<GlobalStyles />
			{helpOpen ? (
				<KeyHelpModal onClose={() => setHelpOpen(false)} />
			) : (
				<div>
					{error && (
						<ErrorDiv>
							API error: {String(error)}
							<ErrorClose>
								<button onClick={() => setError(null)}>
									X
								</button>
							</ErrorClose>
						</ErrorDiv>
					)}

					<AppLayout ref={layoutRef}>
						{!feedPaneCollapsed && (
							<>
								<FeedPane width={feedPaneWidth}>
									<FeedToolbar>
										<FloatingButton
											onClick={collapseFeedPane}
											title='Collapse feed navigation'
											aria-label='Collapse feed navigation'
										>
											<Icon name='menu' />
										</FloatingButton>
										<ToolbarSpacer />
										<FloatingButton
											onClick={() => setSearchOpen(true)}
											title={`Search ${searchScopeLabel}`}
											aria-label={`Search ${searchScopeLabel}`}
										>
											<Icon name='search' size={16} />
										</FloatingButton>
										<ClickNHold
											time={2}
											onClickNHold={refreshFeeds}
											onEnd={(e, enough) => {
												if (!enough) refreshFeedCounts()
												e.target.blur()
											}}
										>
											<FloatingButton
												title='Short press to refresh unread count, long press to trigger fetch and full refresh'
												aria-label='Refresh feeds'
											>
												<Icon name='refresh' />
											</FloatingButton>
										</ClickNHold>
										<FloatingButton
											onClick={() =>
												chrome.runtime.openOptionsPage()
											}
											title='Settings'
											aria-label='Settings'
										>
											<Icon name='settings' />
										</FloatingButton>
									</FeedToolbar>
									{searchOpen && (
										<SearchForm
											onSubmit={submitSearch}
											role='search'
										>
											<SearchFields>
												<SearchScope>
													Search {searchScopeLabel}
												</SearchScope>
												<SearchInput
													ref={searchInputRef}
													type='search'
													value={searchInput}
													onChange={(event) =>
														setSearchInput(
															event.target.value
														)
													}
													onKeyDown={(event) => {
														if (
															event.key ===
															'Escape'
														) {
															event.preventDefault()
															event.stopPropagation()
															clearSearch()
														}
													}}
													placeholder='Search'
													aria-label={`Search ${searchScopeLabel}`}
												/>
											</SearchFields>
											<FloatingButton
												type='submit'
												title='Search articles'
												aria-label='Search articles'
											>
												<Icon name='search' size={16} />
											</FloatingButton>
											{searchInput && (
												<FloatingButton
													type='button'
													onClick={clearSearch}
													title='Clear search'
													aria-label='Clear search'
												>
													<Icon
														name='dismiss'
														size={16}
													/>
												</FloatingButton>
											)}
										</SearchForm>
									)}
									<FeedBrowser
										currentFeed={currentFeed}
										feeds={feeds}
										onFeedChange={selectFeed}
										markAllRead={markAllRead}
										refreshFeed={refreshSingleFeed}
										editFeed={editFeed}
										deleteFeed={deleteFeed}
										refreshCategory={refreshCategory}
										addFeed={addFeed}
										createCategory={createCategory}
										renameCategory={renameCategory}
										deleteCategory={deleteCategory}
										sourcesLoading={sourcesLoading}
										errorHandler={setError}
										updateTrigger={renderFeedsTrigger}
										clearTrigger={setRenderFeedsTrigger}
									/>
								</FeedPane>
								<ResizeHandle
									role='separator'
									aria-orientation='vertical'
									aria-label='Resize feed navigation'
									aria-valuemin={FEED_MIN_WIDTH}
									aria-valuemax={getMaxFeedWidth(
										layoutRef.current
											? layoutRef.current.clientWidth
											: window.innerWidth,
										itemPaneWidth
									)}
									aria-valuenow={feedPaneWidth}
									tabIndex='0'
									onPointerDown={(event) =>
										startResize('feed', event)
									}
									onKeyDown={(event) =>
										resizeWithKeyboard('feed', event)
									}
								/>
							</>
						)}
						<ItemPane width={itemPaneWidth}>
							<ItemBrowser
								currentFeed={currentFeed}
								currentItem={currentItem}
								feeds={feeds}
								onItemChange={setCurrentItem}
								updateUnread={setUpdateUnreadTrigger}
								errorHandler={setError}
								feedPaneCollapsed={feedPaneCollapsed}
								onRestoreFeedPane={restoreFeedPane}
								maxItems={maxItems}
								searchQuery={searchQuery}
								searchPath={searchPath}
								searchScopeLabel={searchScopeLabel}
								onClearSearch={clearSearch}
								readReconciliation={readReconciliation}
								viewRevision={viewRevision}
								onSetReadState={setReadState}
								bookmarkReconciliation={bookmarkReconciliation}
								onToggleBookmark={toggleBookmark}
							/>
						</ItemPane>
						<ItemResizeHandle
							role='separator'
							aria-orientation='vertical'
							aria-label='Resize article list'
							aria-valuemin={ITEM_MIN_WIDTH}
							aria-valuemax={getMaxItemWidth(
								layoutRef.current
									? layoutRef.current.clientWidth
									: window.innerWidth,
								feedPaneWidth,
								feedPaneCollapsed
							)}
							aria-valuenow={itemPaneWidth}
							tabIndex='0'
							onPointerDown={(event) =>
								startResize('items', event)
							}
							onDoubleClick={resetItemPaneWidth}
							onKeyDown={(event) =>
								resizeWithKeyboard('items', event)
							}
						/>
						<ReaderPane ref={readerRef}>
							<ItemViewer
								currentItem={currentItem}
								scrollContainerRef={readerRef}
								onFeedChange={(f) =>
									selectFeed(feeds.find((i) => i.id === f.id))
								}
								errorHandler={setError}
								onSetReadState={setReadState}
								onToggleBookmark={toggleBookmark}
							/>
						</ReaderPane>
					</AppLayout>
				</div>
			)}
		</ThemeProvider>
	)
}

export default App
