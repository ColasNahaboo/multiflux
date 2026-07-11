import React from 'react'

class ClickNHold extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			holding: false,
			start: 0,
			ended: true,
			clickEvent: null,
			isEnough: false,
		}
		this.timer = null
		this.unmounted = false
		this.startTime = 0
		this.ended = true
		this.clickEvent = null
		this.start = this.start.bind(this)
		this.end = this.end.bind(this)
		this.timeout = this.timeout.bind(this)
		this.clickCapture = this.clickCapture.bind(this)
	}

	componentDidMount() {
		this.unmounted = false
	}

	componentWillUnmount() {
		this.unmounted = true
		clearTimeout(this.timer)
		this.timer = null
		document.documentElement.removeEventListener('mouseup', this.end)
		document.documentElement.removeEventListener('touchend', this.end)
		document.documentElement.removeEventListener('touchcancel', this.end)
	}

	start(event) {
		const start = Date.now()
		const eventCopy = Object.assign({}, event)
		eventCopy.type = 'ClickNHold'
		this.startTime = start
		this.ended = false
		this.clickEvent = eventCopy
		this.setState({
			start,
			holding: true,
			ended: false,
			clickEvent: eventCopy,
			isEnough: false,
		})

		const rightNumber = this.props.time && this.props.time > 0
		const time = rightNumber ? this.props.time : 2
		if (!rightNumber) {
			console.warn(
				'You have specified an invalid time prop for ClickNHold. You need to specify a number > 0. Default time is 2.'
			)
		}

		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.timeout(start), time * 1000 + 1)

		if (this.props.onStart) this.props.onStart(event)
		document.documentElement.addEventListener('mouseup', this.end)
		document.documentElement.addEventListener('touchend', this.end)
		document.documentElement.addEventListener('touchcancel', this.end)
	}

	end(event) {
		document.documentElement.removeEventListener('mouseup', this.end)
		document.documentElement.removeEventListener('touchend', this.end)
		document.documentElement.removeEventListener('touchcancel', this.end)
		clearTimeout(this.timer)
		this.timer = null

		if (this.ended || this.unmounted) return false

		const minDiff = this.props.time * 1000
		const diff = Date.now() - this.startTime
		const isEnough = diff >= minDiff

		this.ended = true
		this.clickEvent = null
		this.setState({
			holding: false,
			ended: true,
			clickEvent: null,
			isEnough,
		})
		if (this.props.onEnd) this.props.onEnd(event, isEnough)
		return false
	}

	clickCapture(event) {
		if (this.state.isEnough) event.stopPropagation()
	}

	timeout(start) {
		if (this.unmounted) return
		if (!this.ended && start === this.startTime) {
			if (this.props.onClickNHold) {
				this.props.onClickNHold(start, this.clickEvent)
				this.setState({ holding: false })
			}
		}
	}

	render() {
		let className = this.props.className ? this.props.className + ' ' : ' '
		className += this.state.holding ? 'cnh_holding ' : ''
		className += this.state.ended ? 'cnh_ended ' : ''

		return (
			<div
				style={this.props.style}
				className={className}
				onMouseDown={this.start}
				onTouchStart={this.start}
				onMouseUp={this.end}
				onClickCapture={this.clickCapture}
				onTouchCancel={this.end}
				onTouchEnd={this.end}
			>
				{React.isValidElement(this.props.children)
					? React.cloneElement(this.props.children)
					: null}
			</div>
		)
	}
}

export default ClickNHold
