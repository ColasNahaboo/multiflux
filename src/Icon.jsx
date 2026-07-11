import React from 'react'
import {
	ArrowSync16Regular,
	Checkmark16Regular,
	ChevronDown16Regular,
	ChevronRight16Regular,
	Circle16Regular,
	CircleHint16Regular,
	Comment16Regular,
	Dismiss16Regular,
	Filter16Regular,
	Search16Regular,
	Navigation16Regular,
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

const icons = {
	menu: Navigation16Regular,
	refresh: ArrowSync16Regular,
	settings: Settings16Regular,
	checkAll: Checkmark16Regular,
	filter: Filter16Regular,
	newspaper: News16Regular,
	star: Star16Regular,
	more: MoreHorizontal16Regular,
	edit: Edit16Regular,
	delete: Delete16Regular,
	website: Globe16Regular,
	add: Add16Regular,
	externalLink: Open16Regular,
	comments: Comment16Regular,
	search: Search16Regular,
	dismiss: Dismiss16Regular,
	circle: Circle16Regular,
	checkCircle: CircleHint16Regular,
	chevronRight: ChevronRight16Regular,
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
