import React, {Component} from 'react';
import {mouse} from 'd3';

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
				background:'rgb(180,180,180)',
				borderRadius:size
			});

		return <div style={positionStyle} key={i} className='slider-position'/>;

	}

	handleClick(e){

		const position = Math.round((e.pageX - e.currentTarget.offsetLeft)/this.props.width*(this.props.positions.length-1));
		this.props.onChange(position);
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
				onDragStart={(e)=>{console.log(e)}}
				onDrag={(e)=>{console.log(e)}}
				onDragEnd={e=>{console.log(e)}}
				onClick={this.handleClick}
			>
				<hr style={ Object.assign({}, defaultElementStyle, {
					width:'100%',
					height:0,
					top:height/2-1,
					borderBottom:'1px solid rgb(180,180,180)'
				}) }/>
				{positions.map(this._renderPositions)}
				<div className='slider-target' style={ Object.assign({}, defaultElementStyle, {
					width:20,
					height:20,
					left: currentPosition*width/(num-1) - 20/2,
					top: height/2 - 20/2,
					border: '2px solid rgb(180,180,180)',
					borderRadius: 20*2
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

export default Slider;