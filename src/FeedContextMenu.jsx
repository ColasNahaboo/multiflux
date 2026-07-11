import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Icon from './Icon'

const Menu = styled.div`
	position: fixed;
	left: ${(props) => props.x}px;
	top: ${(props) => props.y}px;
	z-index: 300;
	min-width: 190px;
	padding: 4px;
	background: ${(props) => props.theme.surface};
	border: 1px solid ${(props) => props.theme.border};
	border-radius: 4px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	&[aria-busy='true'] button {
		pointer-events: none;
		opacity: 0.6;
	}
`

const MenuButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 5px 8px;
	background: transparent;
	text-align: left;
	color: ${(props) =>
		props.$danger ? props.theme.errorentry : props.theme.text};
	&[aria-disabled='true'] {
		opacity: 0.55;
	}
`

const Separator = styled.div`
	border-top: 1px solid ${(props) => props.theme.border};
	margin: 4px 2px;
`

const MenuStatus = styled.div`
	padding: 5px 8px;
	font-size: 11px;
	color: ${(props) => props.theme.muted};
`

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 400;
	display: grid;
	place-items: center;
	background: ${(props) => props.theme.modalbg};
`

const Dialog = styled.form`
	width: min(440px, calc(100vw - 32px));
	max-height: calc(100vh - 32px);
	overflow: auto;
	padding: 20px;
	box-sizing: border-box;
	background: ${(props) => props.theme.surface};
	border: 1px solid ${(props) => props.theme.border};
	border-radius: 6px;
	box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);

	label {
		display: block;
		margin: 12px 0;
	}
	input[type='text'],
	input[type='url'],
	select {
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
`

const DialogActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 18px;
`

const DestructiveButton = styled.button`
	color: ${(props) => props.theme.errorentry};
	background: ${(props) => props.theme.errorbg};
	border-color: ${(props) => props.theme.errorentry};
`

const DialogError = styled.p`
	color: ${(props) => props.theme.errorentry};
	font-weight: 600;
`

function EditFeedDialog({ feed, categories, onCancel, onSave }) {
	const [values, setValues] = useState({
		title: feed.title || '',
		category_id: feed.category?.id || '',
		feed_url: feed.feed_url || '',
		site_url: feed.site_url || '',
		disabled: Boolean(feed.disabled),
		crawler: Boolean(feed.crawler),
	})
	const titleRef = useRef()
	useEffect(() => titleRef.current?.focus(), [])

	const update = (key, value) =>
		setValues((current) => ({ ...current, [key]: value }))
	return (
		<Overlay
			onMouseDown={(event) =>
				event.target === event.currentTarget && onCancel()
			}
		>
			<Dialog
				role='dialog'
				aria-modal='true'
				aria-labelledby='edit-feed-title'
				onKeyDown={(event) => event.key === 'Escape' && onCancel()}
				onSubmit={(event) => {
					event.preventDefault()
					onSave({
						...values,
						category_id: Number(values.category_id),
					})
				}}
			>
				<h2 id='edit-feed-title'>Edit feed</h2>
				<label>
					Title
					<input
						ref={titleRef}
						type='text'
						value={values.title}
						onChange={(e) => update('title', e.target.value)}
						required
					/>
				</label>
				<label>
					Category
					<select
						value={values.category_id}
						onChange={(e) => update('category_id', e.target.value)}
					>
						{categories.map((category) => (
							<option key={category.id} value={category.id}>
								{category.title}
							</option>
						))}
					</select>
				</label>
				<label>
					Feed URL
					<input
						type='url'
						value={values.feed_url}
						onChange={(e) => update('feed_url', e.target.value)}
						required
					/>
				</label>
				<label>
					Site URL
					<input
						type='url'
						value={values.site_url}
						onChange={(e) => update('site_url', e.target.value)}
					/>
				</label>
				<label>
					<input
						type='checkbox'
						checked={values.disabled}
						onChange={(e) => update('disabled', e.target.checked)}
					/>{' '}
					Disabled
				</label>
				<label>
					<input
						type='checkbox'
						checked={values.crawler}
						onChange={(e) => update('crawler', e.target.checked)}
					/>{' '}
					Fetch full content with crawler
				</label>
				<DialogActions>
					<button type='button' onClick={onCancel}>
						Cancel
					</button>
					<button type='submit'>Save</button>
				</DialogActions>
			</Dialog>
		</Overlay>
	)
}

export function SourceTextDialog({
	title,
	label,
	initialValue = '',
	inputType = 'text',
	submitLabel,
	onCancel,
	onSave,
}) {
	const [value, setValue] = useState(initialValue)
	const inputRef = useRef()
	useEffect(() => inputRef.current?.focus(), [])
	return (
		<Overlay
			onMouseDown={(event) =>
				event.target === event.currentTarget && onCancel()
			}
		>
			<Dialog
				role='dialog'
				aria-modal='true'
				aria-label={title}
				onKeyDown={(event) => event.key === 'Escape' && onCancel()}
				onSubmit={(event) => {
					event.preventDefault()
					onSave(value.trim())
				}}
			>
				<h2>{title}</h2>
				<label>
					{label}
					<input
						ref={inputRef}
						type={inputType}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						required
					/>
				</label>
				<DialogActions>
					<button type='button' onClick={onCancel}>
						Cancel
					</button>
					<button type='submit'>{submitLabel}</button>
				</DialogActions>
			</Dialog>
		</Overlay>
	)
}

export function AddFeedDialog({
	categories,
	categoryFeeds,
	sourcesLoading,
	initialCategoryId = '',
	onCancel,
	onSave,
}) {
	const [feedUrl, setFeedUrl] = useState('')
	const [categoryId, setCategoryId] = useState(initialCategoryId)
	const inputRef = useRef()
	useEffect(() => inputRef.current?.focus(), [])
	return (
		<Overlay
			onMouseDown={(event) =>
				event.target === event.currentTarget && onCancel()
			}
		>
			<Dialog
				role='dialog'
				aria-modal='true'
				aria-label='Add feed'
				onKeyDown={(event) => event.key === 'Escape' && onCancel()}
				onSubmit={(event) => {
					event.preventDefault()
					onSave(
						feedUrl.trim(),
						categoryId ? Number(categoryId) : null
					)
				}}
			>
				<h2>Add feed</h2>
				<label>
					Website or feed URL
					<input
						ref={inputRef}
						type='url'
						value={feedUrl}
						onChange={(event) => setFeedUrl(event.target.value)}
						required
					/>
				</label>
				<label>
					Category
					<select
						value={categoryId}
						onChange={(event) => setCategoryId(event.target.value)}
					>
						<option value=''>No category selected</option>
						{categories.map((category) => (
							<option key={category.id} value={category.id}>
								{category.title}
							</option>
						))}
					</select>
				</label>
				<DialogActions>
					<button type='button' onClick={onCancel}>
						Cancel
					</button>
					<button type='submit'>Add feed</button>
				</DialogActions>
			</Dialog>
		</Overlay>
	)
}

function DeleteSourceDialog({
	source,
	categoryFeeds,
	sourcesLoading,
	onCancel,
	onDelete,
}) {
	const cancelRef = useRef()
	const [deleting, setDeleting] = useState(false)
	const [error, setError] = useState()
	const isFeed = Boolean(source.is_feed)
	const nonEmptyCategory = !isFeed && categoryFeeds.length > 0
	useEffect(() => cancelRef.current?.focus(), [])

	const performDelete = async () => {
		if (sourcesLoading || nonEmptyCategory) return
		setDeleting(true)
		setError(null)
		try {
			await onDelete()
		} catch {
			setDeleting(false)
			setError(`Could not delete ${isFeed ? 'feed' : 'category'}.`)
		}
	}

	return (
		<Overlay>
			<Dialog
				role='dialog'
				aria-modal='true'
				aria-labelledby='delete-source-title'
				onKeyDown={(event) =>
					event.key === 'Escape' && !deleting && onCancel()
				}
				onSubmit={(event) => event.preventDefault()}
			>
				<h2 id='delete-source-title'>
					{isFeed
						? `Delete “${source.title}”?`
						: `Delete category “${source.title}”?`}
				</h2>
				{isFeed ? (
					<>
						<p>
							This will remove the feed and its stored entries
							from Miniflux.
						</p>
						<p>This cannot be undone.</p>
					</>
				) : nonEmptyCategory ? (
					<>
						<p>
							Category “{source.title}” contains{' '}
							{categoryFeeds.length}{' '}
							{categoryFeeds.length === 1 ? 'feed' : 'feeds'}:
						</p>
						<ul>
							{categoryFeeds.map((feed) => (
								<li key={feed.id}>{feed.title}</li>
							))}
						</ul>
						<p>
							Miniflux rejects deletion while feeds still
							reference this category. Move or delete these feeds
							first.
						</p>
					</>
				) : sourcesLoading ? (
					<p>
						Category membership is still loading. Deletion is
						unavailable.
					</p>
				) : (
					<p>This cannot be undone.</p>
				)}
				{error && <DialogError role='alert'>{error}</DialogError>}
				<DialogActions>
					<button
						ref={cancelRef}
						type='button'
						disabled={deleting}
						onClick={onCancel}
					>
						Cancel
					</button>
					<DestructiveButton
						type='button'
						disabled={
							deleting || sourcesLoading || nonEmptyCategory
						}
						onClick={performDelete}
					>
						{deleting
							? 'Deleting…'
							: isFeed
							? 'Delete feed'
							: 'Delete category'}
					</DestructiveButton>
				</DialogActions>
			</Dialog>
		</Overlay>
	)
}

export default function FeedContextMenu({
	source: feed,
	categories,
	categoryFeeds,
	sourcesLoading,
	anchor,
	menuId,
	returnFocus,
	onClose,
	onMarkRead,
	onRefresh,
	onEdit,
	onDelete,
	onRefreshCategory,
	onAddFeed,
	onRenameCategory,
	onDeleteCategory,
	onScheduleClose,
	onCancelClose,
	onDialogOpen,
}) {
	const menuRef = useRef()
	const [dialog, setDialog] = useState()
	const [busy, setBusy] = useState(false)
	const isFeed = Boolean(feed.is_feed)
	const siteUrl = (() => {
		try {
			const url = new URL(feed.site_url)
			return ['http:', 'https:'].includes(url.protocol)
				? feed.site_url
				: null
		} catch {
			return null
		}
	})()
	useEffect(() => menuRef.current?.querySelector('button')?.focus(), [])
	useEffect(() => {
		if (dialog) return
		const dismissOnPointer = (event) => {
			if (
				!menuRef.current?.contains(event.target) &&
				!returnFocus?.contains?.(event.target)
			)
				close()
		}
		const dismissOnFocus = (event) => {
			if (
				!menuRef.current?.contains(event.target) &&
				!returnFocus?.contains?.(event.target) &&
				event.target !== returnFocus
			)
				close()
		}
		document.addEventListener('pointerdown', dismissOnPointer)
		document.addEventListener('focusin', dismissOnFocus)
		return () => {
			document.removeEventListener('pointerdown', dismissOnPointer)
			document.removeEventListener('focusin', dismissOnFocus)
		}
	})

	const close = () => {
		onClose()
		requestAnimationFrame(() => returnFocus?.focus())
	}
	const act = async (action) => {
		setBusy(true)
		try {
			await action()
			close()
		} catch {
			setBusy(false)
		}
	}
	const openDeleteDialog = () => {
		setDialog('delete')
		onDialogOpen()
	}
	const buttons = () => [...menuRef.current.querySelectorAll('button')]
	return (
		<>
			{!dialog && (
				<Menu
					id={menuId}
					ref={menuRef}
					role='menu'
					aria-busy={busy}
					x={anchor.x}
					y={anchor.y}
					onKeyDown={(event) => {
						const items = buttons()
						const index = items.indexOf(document.activeElement)
						if (event.key === 'Escape') close()
						if (event.key === 'ArrowDown') {
							event.preventDefault()
							items[(index + 1) % items.length]?.focus()
						}
						if (event.key === 'ArrowUp') {
							event.preventDefault()
							items[
								(index - 1 + items.length) % items.length
							]?.focus()
						}
					}}
					onPointerEnter={onCancelClose}
					onPointerLeave={onScheduleClose}
				>
					{busy && <MenuStatus role='status'>Working…</MenuStatus>}
					<MenuButton role='menuitem' onClick={() => act(onMarkRead)}>
						<Icon name='checkAll' />
						{isFeed ? 'Mark all as read' : 'Mark category as read'}
					</MenuButton>
					{isFeed ? (
						<>
							<MenuButton
								role='menuitem'
								onClick={() => act(onRefresh)}
							>
								<Icon name='refresh' />
								Refresh feed
							</MenuButton>
							{siteUrl && (
								<MenuButton
									role='menuitem'
									onClick={() =>
										act(() =>
											window.open(
												siteUrl,
												'_blank',
												'noopener,noreferrer'
											)
										)
									}
								>
									<Icon name='website' />
									Open feed website
								</MenuButton>
							)}
							<MenuButton
								role='menuitem'
								onClick={() => {
									setDialog('edit')
									onDialogOpen()
								}}
							>
								<Icon name='edit' />
								Edit feed
							</MenuButton>
							<Separator />
							<MenuButton
								role='menuitem'
								$danger
								onClick={openDeleteDialog}
							>
								<Icon name='delete' />
								Delete feed
							</MenuButton>
						</>
					) : (
						<>
							<MenuButton
								role='menuitem'
								onClick={() => act(onRefreshCategory)}
							>
								<Icon name='refresh' />
								Refresh category
							</MenuButton>
							<MenuButton
								role='menuitem'
								onClick={() => {
									setDialog('add')
									onDialogOpen()
								}}
							>
								<Icon name='newspaper' />
								Add feed to category
							</MenuButton>
							<MenuButton
								role='menuitem'
								onClick={() => {
									setDialog('rename')
									onDialogOpen()
								}}
							>
								<Icon name='edit' />
								Rename category
							</MenuButton>
							<Separator />
							<MenuButton
								role='menuitem'
								$danger
								onClick={openDeleteDialog}
							>
								<Icon name='delete' />
								Delete category
							</MenuButton>
						</>
					)}
				</Menu>
			)}
			{dialog === 'edit' && (
				<EditFeedDialog
					feed={feed}
					categories={categories}
					onCancel={close}
					onSave={(values) => act(() => onEdit(values))}
				/>
			)}
			{dialog === 'add' && (
				<AddFeedDialog
					categories={categories}
					initialCategoryId={feed.id}
					onCancel={close}
					onSave={(value) => act(() => onAddFeed(value))}
				/>
			)}
			{dialog === 'rename' && (
				<SourceTextDialog
					title='Rename category'
					label='Category name'
					initialValue={feed.title}
					submitLabel='Rename'
					onCancel={close}
					onSave={(value) => act(() => onRenameCategory(value))}
				/>
			)}
			{dialog === 'delete' && (
				<DeleteSourceDialog
					source={feed}
					categoryFeeds={categoryFeeds || []}
					sourcesLoading={sourcesLoading}
					onCancel={close}
					onDelete={async () => {
						await (isFeed ? onDelete() : onDeleteCategory())
						close()
					}}
				/>
			)}
		</>
	)
}
