import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'

const keyMap = [
	['Up', 'Open previous feed'],
	['Down', 'Open next feed'],
	['U', 'Toggle showing unread/all feeds'],
	['x', 'Collapse/uncollapse current category'],
	['Left/p/k/q', 'Open previous item'],
	['Right/n/j/e/Space', 'Open next item'],
	['Home', 'Open first item'],
	['End', 'Open last item'],
	['PageUp', 'Scroll item content up'],
	['PageDown', 'Scroll item content down'],
	['m', 'Mark item as read/unread'],
	['A', 'Mark all items as read'],
	['u', 'Toggle showing unread/all items'],
	['s', 'Toggle item sort order'],
	['f', 'Star/unstar item'],
	['v', 'Open original link in a new tab'],
	['c', 'Open comments in a new tab'],
	['D', 'Toggle light/dark theme'],
	['r', 'Refresh unread counts'],
	['R', 'Fetch feeds and refresh the feed list'],
	['h/?', 'Show keyboard shortcuts'],
	['Escape/Enter', 'Close this window'],
]

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

export default function KeyHelpModal({ onClose }) {
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
					{keyMap.map(([key, command]) => (
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
