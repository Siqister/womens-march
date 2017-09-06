import React, {Component} from 'react';
import {mouse} from 'd3';

//ANIMATED BUTTON HOC
export const animatedButton = Component => class extends React.Component{

	constructor(props){
		super(props);

		this.state = {
			color:'rgb(120,120,120)'
		}

		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
	}

	handleMouseEnter(){
		this.outerCircle.style.strokeDasharray = `${Math.PI*2*19}px ${Math.PI*2*19}px`;
		this.setState({
			color:'rgb(50,50,50)'
		});
	}

	handleMouseLeave(){
		this.outerCircle.style.strokeDasharray = `0px ${Math.PI*2*19}px`;
		this.setState({
			color:'rgb(120,120,120)'
		});
	}

	render(){

		const style = {};
		if(this.props.centered){
			style.left = '50%';
			style.position = 'absolute';
			style.transform = 'translate(-50%)';
		} 
		if(this.props.pullRight){
			style.float = 'right';
		}

		const {disabled,onClick} = this.props;

		return (<button 
				style={style}
				onMouseEnter={this.handleMouseEnter}
				onMouseLeave={this.handleMouseLeave}
				onClick={onClick}
				disabled={disabled}
			>
			<svg width={40} height={40} style={{position:'absolute'}}>
				<circle cx={20} cy={20} r={19} fill='none' stroke={disabled?'rgb(120,120,120)':'rgb(120,120,120)'} strokeWidth='2px'/>
				<circle cx={20} cy={20} r={19} fill='none' stroke={disabled?'rgb(120,120,120)':'rgb(50,50,50)'} strokeWidth='2px' 
					ref={node=>{this.outerCircle=node}}
					style={{transition:'stroke-dasharray 500ms', strokeDasharray:`0px ${Math.PI*2*19}px`}}
				/>
			</svg>
			<Component style={{margin:8}} color={disabled?'rgb(120,120,120)':this.state.color}/>
		</button>);

	}

}

//LOADING INDICATOR
const loadingIndicatorStyle = {
	width:40,
	height:40,
	position:'absolute',
	left:'50%',
	transform:'translate(-50%)',
	display:'inline-block'
}

export const LoadingIndicator = props => {

	return (
		<div style={Object.assign({},loadingIndicatorStyle,props.style)}>
			<svg width={40} height={40}>
				<circle cx={20} cy={20} r={19} fill='none' stroke='rgb(180,180,180)' strokeWidth='2px'/>
				<circle cx={20} cy={20} r={19} fill='none' stroke='rgb(50,50,50)' strokeWidth='2px' 
					style={{strokeDasharray:`${Math.PI*19}px ${Math.PI*19}px`, animation:'spinning 500ms infinite'}}
				/>
			</svg>
		</div>
	);
}


//SLIDER
const defaultSliderStyle = {
	display:'inline-block',
	float:'right',
	position:'relative'
};
const defaultElementStyle = {
	position:'absolute',
	margin:0
}
const color = 'rgb(180,180,180)';

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
			targetPosition:0
		}

	}

	componentWillReceiveProps(nextProps){

		const {currentPosition, width, positions} = nextProps;
		const num = positions.length;

		this.setState({
			targetPosition: currentPosition*width/(num-1) - 20/2
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
				background:`${color}`,
				borderRadius:size
			});

		return <div style={positionStyle} key={i} className='slider-position'/>;

	}

	handleClick(e){

		const position = Math.round((e.pageX - e.currentTarget.offsetLeft)/this.props.width*(this.props.positions.length-1));
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
			targetPosition = this.props.width + 10;
		}

		this.setState({
			targetPosition:targetPosition - 10
		});
	}

	handleMouseUp(e){
		this.setState({
			dragging:false
		});
	}

	render(){

		const {pullRight, positions, width, height, currentPosition} = this.props;
		const num = positions.length

		const sliderStyle = Object.assign({}, 
			defaultSliderStyle, 
			pullRight?{float:'right'}:{float:'left'},
			{width, height});

		return (
			<div className='slider-container' style={sliderStyle}
				onClick={this.handleClick}
				onMouseDown = {this.handleMouseDown}
				onMouseMove = {this.handleMouseMove}
				onMouseUp = {this.handleMouseUp}
			>
				<hr style={ Object.assign({}, defaultElementStyle, {
					width:'100%',
					height:0,
					top:height/2-1,
					borderBottom:`1px solid ${color}`,
					borderTop:'none',
					boxSize:'content-box'
				}) }/>
				{positions.map(this._renderPositions)}
				<div className='slider-target' style={ Object.assign({}, defaultElementStyle, {
					width:20,
					height:20,
					left: this.state.targetPosition,
					top: height/2 - 20/2,
					border: `2px solid ${color}`,
					borderRadius: 20*2,
					transition:'left 50ms'
				}) }/>
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
	height:48
}

export {Slider};

