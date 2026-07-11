import { css } from 'styled-components'

export const readStateControlStyles = css`
	color: ${(props) =>
		props.$isRead ? props.theme.accent : props.theme.muted};
	background: transparent;

	&:hover {
		color: ${(props) =>
			props.$isRead ? props.theme.accent : props.theme.muted};
		background: ${(props) => props.theme.accentSoft};
		border-color: ${(props) =>
			props.$isRead ? props.theme.accent : props.theme.border};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.accent};
		outline-offset: 1px;
	}
`

export const bookmarkStateControlStyles = css`
	color: ${(props) =>
		props.$starred ? props.theme.accent : props.theme.muted};
	background: transparent;

	&:hover {
		color: ${(props) =>
			props.$starred ? props.theme.accent : props.theme.text};
		background: ${(props) => props.theme.accentSoft};
		border-color: ${(props) =>
			props.$starred ? props.theme.accent : props.theme.border};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.accent};
		outline-offset: 1px;
	}
`
