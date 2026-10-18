import React from 'react'

export default function AppLogo({ size = 18 }) {
	return (
		<img
			src='icons/multiflux.svg'
			alt=''
			draggable='false'
			title={`Multiflux v${__APP_VERSION__}`}
			aria-label={`Multiflux v${__APP_VERSION__}`}
			style={{
				width: size,
				height: size,
				flex: '0 0 auto',
				userSelect: 'none',
			}}
		/>
	)
}
