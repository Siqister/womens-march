import React, {Component} from 'react';

const defaultSliderStyle = {
	display:'inline-block',
	float:'right',
	position:'relative'
};
const defaultElementStyle = {
	position:'absolute',
	margin:0
}

class Slider extends Component{

	constructor(props){
		super(props);

		this._renderPositions = this._renderPositions.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);

		this.state = {
			dragging:false,
			targetPosition: props.currentPosition*props.width/(props.positions.length-1)
		};

	}

	componentWillReceiveProps(nextProps){

		const {currentPosition, width, positions} = nextProps;
		const num = positions.length;

		this.setState({
			targetPosition: currentPosition*width/(num-1)
		});

	}

	_renderPositions(p,i){

		const {width, height} = this.props;
		const size = 8;
		const num = this.props.positions.length;
		const positionStyle = Object.assign({}, defaultElementStyle, {
				width: size,
				height: size,
				left: i*width/(num-1) - size/2,
				top: height/2 - size/2,
				background:`${this.props.color}`,
				borderRadius:size
			});

		return <div style={positionStyle} key={i} className='slider-position'/>;

	}

	handleClick(e){

		const position = Math.round((e.pageX - e.currentTarget.getBoundingClientRect().left)/this.props.width*(this.props.positions.length-1));
		this.props.onChange(position);

	}

	handleMouseDown(e){

		const {targetPosition} = this.state;

		this.setState({
			dragging:true,
			prevX:e.pageX,
			prevPosition:targetPosition
		});

	}

	handleMouseMove(e){

		if(!this.state.dragging) return;

		const {prevPosition, prevX} = this.state;
		let targetPosition = prevPosition + e.pageX - prevX;
		if(targetPosition <= 0){
			targetPosition = 0;
		}else if(targetPosition >= this.props.width){
			targetPosition = this.props.width;
		}

		this.setState({
			targetPosition:targetPosition
		});

	}

	handleMouseUp(e){

		this.setState({
			dragging:false
		});

	}

	render(){

		const {pullRight, positions, width, height, currentPosition, style, color, layoutComputing, targetColor} = this.props;
		const {dragging} = this.state;
		const num = positions.length

		const sliderStyle = Object.assign({}, 
			defaultSliderStyle, 
			pullRight?{float:'right'}:{float:'left'},
			{width, height},
			style
		);

		return (
			<div className='slider-container' style={sliderStyle}
				onClick={this.handleClick}
				onMouseDown = {this.handleMouseDown}
				onMouseMove = {this.handleMouseMove}
				onMouseUp = {this.handleMouseUp}
				ref={node=>{this.containerNode = node}}
			>
				<svg className='slider-target' style={ Object.assign({}, defaultElementStyle, {
					width:30, //dragging?25:20,
					height:30, //dragging?25:20,
					transform:'translate(-50%,-50%)',
					left: this.state.targetPosition,
					top: height/2,
					//borderRadius: 20*2,
					transition:'all 100ms',
					//background:targetColor,
					//opacity:dragging?.6:.2
				}) }>
					<circle className='inner'
						cx={15}
						cy={15}
						r={dragging?12:10}
						fill={targetColor}
						fillOpacity={dragging?.6:.2}
						style={{
							transition:'all 100ms'
						}}
					/>
					<circle className='outer'
						cx={15}
						cy={15}
						r={dragging?12:10}
						fill='none'
						stroke={layoutComputing?targetColor:'none'}
						strokeWidth='2px'
						style={{strokeDasharray:`${Math.PI*19}px ${Math.PI*19}px`, animation:'spinning 500ms infinite'}}
					/>
				</svg>
				{positions.map(this._renderPositions)}
			</div>
		);

	}
}

Slider.defaultProps = {
	positions:[
		{value:1},
		{value:2},
		{value:3}
	],
	currentPosition:0,
	width:256,
	height:48,
	color:'rgb(180,180,180)',
	targetColor:'rgb(255,255,255)',
	layoutComputing:false
}

export default Slider;