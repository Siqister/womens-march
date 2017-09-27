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
		const gradient = this.ctx.createLinearGradient(width/4,height,width,0);
		//Light
		// gradient.addColorStop(0,'rgb(200,198,195)');
		// gradient.addColorStop(.6,'rgb(250,250,250)');
		//Dark
		gradient.addColorStop(0,'rgb(5,5,5)');
		gradient.addColorStop(.6,'rgb(50,50,50)');

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