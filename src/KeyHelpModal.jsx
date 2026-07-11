import React from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { useHotkeys } from 'react-hotkeys-hook'

const keyMap = [
	['Up', 'Open previous feed'],
	['Down', 'Open next feed'],
	['U', 'Toggle showing unread/all feeds'],
	['x', 'Collapse/uncollapse current category'],
	['Left/p/k', 'Open previous item'],
	['Right/n/j/Space', 'Open next item'],
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
	['h', 'Show keyboard shortcuts'],
	['Escape/Enter', 'Close this window'],
]

const ModalAdapter = ({ className, modalClassName, ...props }) => (
	<Modal className={modalClassName} portalClassName={className} {...props} />
)

const StyledModal = styled(ModalAdapter).attrs({
	overlayClassName: 'Overlay',
	modalClassName: 'Modal',
})`
	.Modal {
		position: absolute;
		top: 50%;
		left: 50%;
		background-color: ${(props) => props.theme.surface};
		border: 1px solid ${(props) => props.theme.border};
		box-shadow: 0 12px 42px rgba(0, 0, 0, 0.18);
		padding: 22px;
		transform: translate(-50%, -50%);
		max-height: 86vh;
		overflow: auto;
	}
	.Overlay {
		position: fixed;
		inset: 0;
		background-color: ${(props) => props.theme.modalbg};
		z-index: 200;
	}
`

const KeyTable = styled.table`
	text-align: center;
	padding: 5px;
`

export default function KeyHelpModal({ onClose }) {
	useHotkeys('esc, enter', onClose)

	return (
		<StyledModal isOpen ariaHideApp={false}>
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
			<button type='button' onClick={onClose}>
				OK
			</button>
		</StyledModal>
	)
}
