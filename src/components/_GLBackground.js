import React, {Component} from 'react';

class GLBackground extends Component{

	constructor(props){
		super(props);

		this._redraw = this._redraw.bind(this);
	}

	componentDidMount(){
		this.ctx = this.node.getContext('2d');

		this._redraw();
	}

	componentDidUpdate(){
		this._redraw();
	}

	_redraw(){

		const {width,height} = this.props;

		//Create a gradient
		const gradient = this.ctx.createLinearGradient(0,0,0,height);
		gradient.addColorStop(0,'rgb(205,215,215)');
		gradient.addColorStop(.8,'rgb(245,245,250)');

		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0,0,width,height);

	}

	render(){
		const {width,height} = this.props;

		return (
			<canvas 
				style={{
					position:'fixed',
					width:width,
					height:height,
					zIndex:-999
				}}
				width={width}
				height={height}
				ref={node=>{this.node=node}}
			/>
		);
	}
}

export default GLBackground;