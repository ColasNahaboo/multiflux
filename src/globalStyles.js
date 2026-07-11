import { createGlobalStyle } from 'styled-components'
export const GlobalStyles = createGlobalStyle`
	body {
		margin: 0px;
		font-family: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
		font-size: 13px;
		background: ${({ theme }) => theme.body};
		color: ${({ theme }) => theme.text};
		overflow: hidden;
	}
	html,
	body,
	#root {
		height: 100%;
	}
	body.pane-resizing {
		cursor: col-resize;
		user-select: none;
	}
	a {
		color: ${({ theme }) => theme.link};
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	button {
		border: 1px solid transparent;
		border-radius: 2px;
		background-color: ${(props) => props.theme.buttonbg};
		color: ${(props) => props.theme.buttonfg};
		font: inherit;
		min-height: 28px;
	}
	button:hover {
		background-color: ${(props) => props.theme.hoverbg};
		border-color: ${(props) => props.theme.border};
	}
	button:focus-visible,
	select:focus-visible,
	a:focus-visible {
		outline: 2px solid ${(props) => props.theme.accent};
		outline-offset: 1px;
	}
	select {
		background: ${(props) => props.theme.dropdownbg};
		color: ${(props) => props.theme.dropdownfg};
		border: 1px solid ${(props) => props.theme.border};
		border-radius: 2px;
		font: inherit;
		min-height: 28px;
		padding: 0 26px 0 8px;
	}
	#itemcontent img {
		max-width: 100%;
		height: auto;
	}
	.cnh_holding button {
		background: -webkit-linear-gradient(
			${(props) => props.theme.buttonbg},
			${(props) => props.theme.buttonbg})
			${(props) => props.theme.buttonfg} no-repeat 0 0;
		background: linear-gradient(
			${(props) => props.theme.buttonfg},
			${(props) => props.theme.buttonfg})
			${(props) => props.theme.buttonbg} no-repeat 0 0;
		mix-blend-mode: multiply;
		background-size: 100% 100%;
		-webkit-animation: fill 2s forwards infinite;
		animation: fill 2s forwards infinite;
		color: ${(props) => props.theme.buttonbg};
	}
	@-webkit-keyframes fill {
		to { background-size: 100% 0}
	}
	@keyframes fill {
		to { background-size: 100% 0}
	}
	input {
		border: 1px solid ${(props) => props.theme.border};
		border-radius: 2px;
		background: ${(props) => props.theme.surface};
		color: ${(props) => props.theme.text};
		font: inherit;
		min-height: 28px;
		padding: 2px 8px;
		box-sizing: border-box;
	}
	`
