import React from 'react'
import {
	ArrowSync16Regular,
	Checkmark16Regular,
	CheckmarkCircle16Regular,
	ChevronDown16Regular,
	ChevronRight16Regular,
	ChevronLeft16Regular,
	Circle16Regular,
	Comment16Regular,
	Dismiss16Regular,
	Filter16Regular,
	Search16Regular,
	News16Regular,
	Open16Regular,
	Settings16Regular,
	Star16Regular,
	MoreHorizontal16Regular,
	Edit16Regular,
	Delete16Regular,
	Globe16Regular,
	Add16Regular,
} from '@fluentui/react-icons'

function GithubIcon({ className = '', style }) {
	return (
		<svg
			className={className}
			style={style}
			viewBox='0 0 16 16'
			width='16'
			height='16'
			fill='currentColor'
			aria-hidden='true'
		>
			<path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z' />
		</svg>
	)
}

const icons = {
	refresh: ArrowSync16Regular,
	settings: Settings16Regular,
	github: GithubIcon,
	checkAll: Checkmark16Regular,
	filter: Filter16Regular,
	newspaper: News16Regular,
	star: Star16Regular,
	more: MoreHorizontal16Regular,
	edit: Edit16Regular,
	delete: Delete16Regular,
	website: Globe16Regular,
	globe: Globe16Regular,
	add: Add16Regular,
	externalLink: Open16Regular,
	comments: Comment16Regular,
	search: Search16Regular,
	dismiss: Dismiss16Regular,
	circle: Circle16Regular,
	checkCircle: CheckmarkCircle16Regular,
	chevronRight: ChevronRight16Regular,
	chevronLeft: ChevronLeft16Regular,
	chevronDown: ChevronDown16Regular,
}

export default function Icon({ name, size = 14, className = '', style }) {
	const Component = icons[name]
	return (
		<Component
			className={className}
			style={{ width: size, height: size, ...style }}
			aria-hidden='true'
		/>
	)
}
