import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatBinding } from './lib/keymap'

const ACTIONS = [
	['prevFeed', 'Open previous feed'],
	['nextFeed', 'Open next feed'],
	['toggleHideReadFeeds', 'Toggle showing unread/all feeds'],
	['toggleCategoryCollapse', 'Collapse/uncollapse current category'],
	['prevItem', 'Open previous item'],
	['nextItem', 'Open next item'],
	['firstItem', 'Open first item'],
	['lastItem', 'Open last item'],
	['scrollUp', 'Scroll item content up'],
	['scrollDown', 'Scroll item content down'],
	['toggleRead', 'Mark item as read/unread'],
	['markOlderRead', 'Mark older items as read'],
	['markAllRead', 'Mark all items as read'],
	['toggleShowRead', 'Toggle showing unread/all items'],
	['toggleSort', 'Toggle item sort order'],
	['toggleStar', 'Star/unstar item'],
	['openOriginal', 'Open original article in the OA window'],
	['openOriginalTab', 'Open original article in a new tab'],
	['fetchFullText', 'Fetch and save full article content'],
	['saveEntry', 'Save entry to linkding'],
	['toggleAlwaysOpen', 'Always open original link for this feed'],
	['toggleAlwaysFullText', 'Toggle auto-fetch on first view for this feed'],
	['openComments', 'Open comments in a new tab'],
	['toggleTheme', 'Toggle light/dark theme'],
	['refreshCounts', 'Refresh unread counts'],
	['refreshFeeds', 'Fetch feeds and refresh the feed list'],
	['help', 'Show keyboard shortcuts'],
	['clearSearch', 'Clear search'],
]

const STATIC_KEYS = [['Esc/Enter', 'Close this window']]

const StyledDialog = styled.dialog`
	background-color: ${(props) => props.theme.surface};
	color: inherit;
	border: 1px solid ${(props) => props.theme.border};
	box-shadow: 0 12px 42px rgba(0, 0, 0, 0.18);
	padding: 22px;
	max-height: 86vh;
	overflow: auto;

	&::backdrop {
		background-color: ${(props) => props.theme.modalbg};
	}
`

const KeyTable = styled.table`
	text-align: center;
	padding: 5px;
`

export default function KeyHelpModal({ keymap, onClose }) {
	const dialogRef = useRef(null)
	const previouslyFocusedRef = useRef(document.activeElement)

	useEffect(() => {
		const dialog = dialogRef.current
		dialog.showModal()

		return () => {
			if (dialog.open) dialog.close()
			previouslyFocusedRef.current?.focus()
		}
	}, [])

	useHotkeys('esc, enter', onClose)

	return (
		<StyledDialog ref={dialogRef} onCancel={onClose}>
			<h2>Keyboard shortcuts</h2>
			<KeyTable>
				<thead>
					<tr>
						<th>Key</th>
						<th>Command</th>
					</tr>
				</thead>
				<tbody>
					{ACTIONS.map(([action, command]) => (
						<tr key={action}>
							<td>{formatBinding(keymap[action])}</td>
							<td>{command}</td>
						</tr>
					))}
					{STATIC_KEYS.map(([key, command]) => (
						<tr key={key}>
							<td>{key}</td>
							<td>{command}</td>
						</tr>
					))}
				</tbody>
			</KeyTable>
			<button type='button' onClick={onClose} autoFocus>
				OK
			</button>
		</StyledDialog>
	)
}
