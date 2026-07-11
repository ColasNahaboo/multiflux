import React, { useState, useEffect, useRef, useReducer } from 'react'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'
import { relaTimestamp } from './lib/util'
import Icon from './Icon'
import FeedContextMenu, {
	AddFeedDialog,
	SourceTextDialog,
} from './FeedContextMenu'

const FeedList = styled.div`
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 8px 0 14px;
	color: ${(props) => props.theme.text};
`

const UnreadBubble = styled.span`
	margin-left: auto;
	font-size: 12px;
	color: ${(props) => props.theme.muted};
	min-width: 22px;
	text-align: right;
	flex: 0 0 auto;
`

const MoreButton = styled.button`
	position: absolute;
	right: 4px;
	top: 50%;
	transform: translateY(-50%);
	display: ${(props) => (props.$visible ? 'inline-flex' : 'none')};
	width: 22px;
	height: 24px;
	min-height: 24px;
	padding: 0;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.selectbg};
	color: ${(props) => props.theme.muted};
`

const FeedRow = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	height: 32px;
	padding: 0 12px 0
		${(props) =>
			props.isFeed ? '22px' : props.isCategory ? '6px' : '12px'};
	box-sizing: border-box;
	font-weight: ${(props) => (props.isCategory ? 500 : 400)};
	background-color: ${(props) =>
		props.selected ? props.theme.selectbg : 'inherit'};
	color: ${(props) =>
		props.error
			? props.theme.errorentry
			: props.unread
			? props.theme.text
			: props.theme.readentry};
	&:hover {
		background-color: ${(props) => props.theme.hoverbg};
		cursor: pointer;
	}
	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 4px;
		bottom: 4px;
		width: 3px;
		background: ${(props) =>
			props.selected ? props.theme.accent : 'transparent'};
	}
	&:hover ${MoreButton}, ${MoreButton}:focus-visible {
		display: inline-flex;
	}
`

const Favico = styled.img`
	width: 16px;
	height: 16px;
	flex: 0 0 16px;
	object-fit: contain;
`

const FloatingButton = styled.button`
	font-size: 14px;
	height: 28px;
	min-width: 28px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	color: ${(props) => props.theme.muted};
	&:hover {
		color: ${(props) => props.theme.text};
	}
`

const Collapse = styled.button`
	width: 16px;
	height: 24px;
	min-height: 24px;
	flex: 0 0 16px;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	color: ${(props) => props.theme.muted};
	&:hover {
		cursor: pointer;
	}
`

const SectionTitle = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.muted};
`

const SectionHeader = styled.div`
	position: sticky;
	top: 0;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin: 4px 6px 6px;
	font-size: 12px;
	color: ${(props) => props.theme.muted};
	background: ${(props) => props.theme.navbg};
`

const SectionActions = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`

const CreateMenu = styled.div`
	position: absolute;
	top: 30px;
	right: 0;
	z-index: 320;
	width: 150px;
	padding: 4px;
	background: ${(props) => props.theme.surface};
	border: 1px solid ${(props) => props.theme.border};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);

	button {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		background: transparent;
	}
`

const FeedTitle = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: ${(props) => (props.selected ? 600 : 'inherit')};
`

const TopIcon = styled.span`
	display: flex;
	align-items: center;
	width: 16px;
	flex: 0 0 16px;
	color: ${(props) => props.theme.accent};
	text-align: center;
`

const collapseReducer = (state, action) => {
	let newstate
	switch (action.type) {
		case 'collapse':
			newstate = [...state, action.category]
			break
		case 'expand':
			newstate = state.filter((i) => i !== action.category)
			break
		default:
			return state
	}
	localStorage.setItem('collapsed', JSON.stringify(newstate))
	return newstate
}

function FeedBrowser(props) {
	const [contextMenu, setContextMenu] = useState()
	const [contextDialogOpen, setContextDialogOpen] = useState(false)
	const [createMenuOpen, setCreateMenuOpen] = useState(false)
	const [createDialog, setCreateDialog] = useState()
	const dismissTimer = useRef()
	const createButtonRef = useRef()
	const createActionsRef = useRef()
	const isSelected = (item) =>
		Boolean(
			props.currentFeed &&
				item.id === props.currentFeed.id &&
				item.fetch_url === props.currentFeed.fetch_url
		)
	const [hideRead, setHideRead] = useState(
		localStorage.getItem('feedfilter') === 'a'
	)

	const [collapsed, dispatch] = useReducer(
		collapseReducer,
		JSON.parse(localStorage.getItem('collapsed')) || []
	)
	const toggleHideRead = () => {
		setHideRead(!hideRead)
		localStorage.setItem('feedfilter', hideRead ? 'u' : 'a')
	}

	const [feeds, setFeeds] = useState([])
	const selectedFeed = useRef()

	const afterChange = (e) => {
		if (selectedFeed.current) {
			selectedFeed.current.scrollIntoView({ block: 'center' })
		}
		e.preventDefault()
	}

	useHotkeys(
		'up',
		(e) => {
			props.onFeedChange(
				feeds[
					feeds.indexOf(props.currentFeed) - 1 >= 0
						? feeds.indexOf(props.currentFeed) - 1
						: 0
				]
			)
			afterChange(e)
		},
		[props, feeds]
	)

	useHotkeys(
		'down',
		(e) => {
			props.onFeedChange(
				feeds[
					feeds.indexOf(props.currentFeed) + 1 < feeds.length
						? feeds.indexOf(props.currentFeed) + 1
						: feeds.length - 1
				]
			)
			afterChange(e)
		},
		[props, feeds]
	)

	useHotkeys('shift+u', () => toggleHideRead(), [hideRead])

	useHotkeys(
		'x',
		() => {
			if (!props.currentFeed) return
			const cat = props.currentFeed.is_feed
				? props.currentFeed.category.id
				: props.currentFeed.id
			if (cat < 0) return
			dispatch({
				type: collapsed.includes(cat) ? 'expand' : 'collapse',
				category: cat,
			})
		},
		[props.currentFeed, collapsed]
	)

	useEffect(() => {
		setFeeds(
			props.feeds.filter(
				(f) =>
					(!hideRead || f.unreads > 0) &&
					(!f.is_feed ||
						(f.is_feed && !collapsed.includes(f.category.id)))
			)
		)
		props.clearTrigger(false)
	}, [props, hideRead, collapsed])

	const openFeedMenu = (item, event, returnFocus = event.currentTarget) => {
		if (!(item.is_feed || (!item.fetch_url && item.id > 0))) return
		event.preventDefault()
		event.stopPropagation()
		const rect = event.currentTarget.getBoundingClientRect()
		if (
			contextMenu?.feed.id === item.id &&
			contextMenu?.feed.is_feed === item.is_feed &&
			event.type === 'click'
		) {
			setContextMenu(null)
			requestAnimationFrame(() => returnFocus?.focus())
			return
		}
		setCreateMenuOpen(false)
		setContextDialogOpen(false)
		setContextMenu({
			feed: item,
			anchor: {
				x: Math.max(
					8,
					Math.min(
						event.clientX || rect.right,
						window.innerWidth - 210
					)
				),
				y: Math.max(
					8,
					Math.min(
						event.clientY || rect.bottom,
						window.innerHeight - 280
					)
				),
			},
			returnFocus,
		})
	}
	const cancelDelayedClose = () => clearTimeout(dismissTimer.current)
	const scheduleDelayedClose = () => {
		cancelDelayedClose()
		dismissTimer.current = setTimeout(() => setContextMenu(null), 300)
	}
	useEffect(() => () => cancelDelayedClose(), [])
	useEffect(() => {
		if (!createMenuOpen) return
		const closeCreateMenu = (event) => {
			if (!createActionsRef.current?.contains(event.target))
				setCreateMenuOpen(false)
		}
		document.addEventListener('pointerdown', closeCreateMenu)
		return () =>
			document.removeEventListener('pointerdown', closeCreateMenu)
	}, [createMenuOpen])

	return (
		<FeedList>
			<SectionHeader>
				<SectionTitle>Subscriptions</SectionTitle>
				<SectionActions
					ref={createActionsRef}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							setCreateMenuOpen(false)
							createButtonRef.current?.focus()
						}
					}}
				>
					<FloatingButton
						ref={createButtonRef}
						title='Add source'
						aria-label='Add feed or category'
						aria-expanded={createMenuOpen}
						aria-controls='source-create-menu'
						onClick={(event) => {
							event.stopPropagation()
							setContextMenu(null)
							setCreateMenuOpen((open) => !open)
						}}
					>
						<Icon name='add' />
					</FloatingButton>
					{createMenuOpen && (
						<CreateMenu id='source-create-menu' role='menu'>
							<button
								role='menuitem'
								onClick={() => {
									setCreateMenuOpen(false)
									setCreateDialog('feed')
								}}
							>
								<Icon name='newspaper' />
								Add feed
							</button>
							<button
								role='menuitem'
								onClick={() => {
									setCreateMenuOpen(false)
									setCreateDialog('category')
								}}
							>
								<Icon name='add' />
								Add category
							</button>
						</CreateMenu>
					)}
					<FloatingButton
						onClick={(v) => {
							toggleHideRead()
							v.target.blur()
						}}
						title='Toggle showing all/unread feeds'
						aria-label='Toggle showing all or unread feeds'
					>
						<Icon name='filter' />
					</FloatingButton>
				</SectionActions>
			</SectionHeader>
			{feeds.map((item) => (
				<div key={item.fetch_url || item.id}>
					<FeedRow
						tabIndex={
							item.is_feed || (!item.fetch_url && item.id > 0)
								? 0
								: undefined
						}
						ref={isSelected(item) ? selectedFeed : null}
						isFeed={item.is_feed}
						isCategory={!item.fetch_url}
						selected={isSelected(item)}
						unread={item.unreads}
						error={item.parsing_error_count}
						title={
							item.parsing_error_message ||
							'Updated ' + relaTimestamp(item.checked_at) + ' ago'
						}
						onContextMenu={(event) => openFeedMenu(item, event)}
						onClick={() => props.onFeedChange(item)}
						onKeyDown={(event) => {
							if (
								event.key === 'ContextMenu' ||
								(event.shiftKey && event.key === 'F10')
							)
								openFeedMenu(item, event)
						}}
					>
						{!item.fetch_url &&
							(collapsed.includes(item.id) ? (
								<Collapse
									title='Expand category'
									aria-label='Expand category'
									onPointerDown={(e) => e.stopPropagation()}
									onClick={(e) => {
										e.stopPropagation()
										dispatch({
											type: 'expand',
											category: item.id,
										})
									}}
								>
									<Icon name='chevronRight' size={16} />
								</Collapse>
							) : (
								<Collapse
									title='Collapse category'
									aria-label='Collapse category'
									onPointerDown={(e) => e.stopPropagation()}
									onClick={(e) => {
										e.stopPropagation()
										dispatch({
											type: 'collapse',
											category: item.id,
										})
									}}
								>
									<Icon name='chevronDown' size={16} />
								</Collapse>
							))}
						{!item.is_feed && item.fetch_url && (
							<TopIcon>
								<Icon
									name={item.id === -1 ? 'newspaper' : 'star'}
									size={16}
								/>
							</TopIcon>
						)}
						{item.is_feed && <Favico src={item.icon_data} />}
						<FeedTitle selected={isSelected(item)}>
							{item.id === -1 ? 'All articles' : item.title}
						</FeedTitle>
						{item.unreads > 0 && (
							<UnreadBubble>{item.unreads}</UnreadBubble>
						)}
						{(item.is_feed || (!item.fetch_url && item.id > 0)) && (
							<MoreButton
								$visible={isSelected(item)}
								title={
									item.is_feed
										? 'Feed actions'
										: 'Category actions'
								}
								onPointerEnter={cancelDelayedClose}
								onPointerLeave={scheduleDelayedClose}
								aria-label={`Actions for ${item.title}`}
								aria-expanded={
									contextMenu?.feed.id === item.id &&
									!contextDialogOpen
								}
								aria-controls={
									contextMenu?.feed.id === item.id &&
									!contextDialogOpen
										? `source-menu-${item.id}`
										: undefined
								}
								onPointerDown={(event) =>
									event.stopPropagation()
								}
								onClick={(event) => openFeedMenu(item, event)}
							>
								<Icon name='more' size={16} />
							</MoreButton>
						)}
					</FeedRow>
				</div>
			))}
			{contextMenu && (
				<FeedContextMenu
					source={contextMenu.feed}
					categories={props.feeds.filter(
						(item) => !item.fetch_url && item.id > 0
					)}
					categoryFeeds={props.feeds.filter(
						(item) =>
							item.is_feed &&
							item.category?.id === contextMenu.feed.id
					)}
					sourcesLoading={props.sourcesLoading}
					anchor={contextMenu.anchor}
					menuId={`source-menu-${contextMenu.feed.id}`}
					returnFocus={contextMenu.returnFocus}
					onClose={() => setContextMenu(null)}
					onMarkRead={() => props.markAllRead(contextMenu.feed)}
					onRefresh={() => props.refreshFeed(contextMenu.feed)}
					onEdit={(values) =>
						props.editFeed(contextMenu.feed, values)
					}
					onDelete={() => props.deleteFeed(contextMenu.feed)}
					onRefreshCategory={() =>
						props.refreshCategory(contextMenu.feed)
					}
					onAddFeed={(feedUrl) =>
						props.addFeed(contextMenu.feed, feedUrl)
					}
					onRenameCategory={(title) =>
						props.renameCategory(contextMenu.feed, title)
					}
					onDeleteCategory={() =>
						props.deleteCategory(contextMenu.feed)
					}
					onScheduleClose={scheduleDelayedClose}
					onCancelClose={cancelDelayedClose}
					onDialogOpen={() => setContextDialogOpen(true)}
				/>
			)}
			{createDialog === 'feed' && (
				<AddFeedDialog
					categories={props.feeds.filter(
						(item) => !item.fetch_url && item.id > 0
					)}
					onCancel={() => {
						setCreateDialog(null)
						createButtonRef.current?.focus()
					}}
					onSave={(feedUrl, categoryId) =>
						props
							.addFeed(
								categoryId
									? props.feeds.find(
											(item) =>
												item.id === categoryId &&
												!item.fetch_url
									  )
									: null,
								feedUrl
							)
							.then(() => setCreateDialog(null))
					}
				/>
			)}
			{createDialog === 'category' && (
				<SourceTextDialog
					title='Add category'
					label='Category name'
					submitLabel='Add category'
					onCancel={() => {
						setCreateDialog(null)
						createButtonRef.current?.focus()
					}}
					onSave={(title) =>
						props
							.createCategory(title)
							.then(() => setCreateDialog(null))
					}
				/>
			)}
		</FeedList>
	)
}

export default FeedBrowser
