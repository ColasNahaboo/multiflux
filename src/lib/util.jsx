import React from 'react'
import dayjs from 'dayjs'

export function relaTimestamp(t) {
	const d = (Date.now() - Date.parse(t)) / 1000
	if (d > 60 * 60 * 24) {
		return Math.floor(d / (60 * 60 * 24)) + 'd'
	} else if (d > 60 * 60) {
		return Math.floor(d / (60 * 60)) + 'h'
	} else {
		return Math.floor(d / 60) + 'm'
	}
}

export function formatDate(t) {
	return dayjs(t).format('D MMM HH:mm')
}

export function linkNewTab(title, link, stripStyle) {
	return (
		<a
			href={link}
			target='_blank'
			rel='noopener noreferrer'
			style={stripStyle && { textDecoration: 'none', color: 'inherit' }}
		>
			{title}
		</a>
	)
}

function hashCode(s) {
	var hash = 0
	for (var i = 0; i < s.length; i++) {
		hash = s.charCodeAt(i) + ((hash << 5) - hash)
	}
	return hash
}

export function createFeedIcon(feedName) {
	var canvas = document.createElement('canvas')
	canvas.width = 16
	canvas.height = 16
	var context = canvas.getContext('2d')

	const color = hashCode(feedName) % 360

	context.beginPath()
	context.rect(0, 0, 16, 16)
	context.fillStyle = 'hsl(' + color + ', 50%, 25%)'
	context.fill()

	context.fillStyle = 'hsl(' + (360 - color) + ', 100%, 75%)'
	context.font = 'bold 14px sans-serif'
	context.textBaseline = 'middle'
	context.textAlign = 'center'
	context.fillText(feedName[0], canvas.width / 2, canvas.height / 2 + 1)

	return canvas.toDataURL()
}
