import React, {Component} from 'react';

class GLBackground extends Component{

	constructor(props){
		super(props);

		const colorScheme = props.dark?props.colorSchemes.dark:props.colorSchemes.light;
		this.colorStop1 = Object.assign({},colorScheme.stop1);
		this.colorStop2 = Object.assign({},colorScheme.stop2);

		this._redraw = this._redraw.bind(this);
	}

	componentDidMount(){
		this.ctx = this.node.getContext('2d');
		this._redraw();
	}

	// componentDidUpdate(prevProps){

	// 	if(this.props.dark === prevProps.dark){
	// 		//No changes to color scheme
	// 		this._redraw();
	// 	}else{
	// 		console.log(this.props.dark, prevProps.dark);
	// 		const newColorScheme =this.props.dark?this.props.colorSchemes.dark:this.props.colorSchemes.light;
	// 		this.colorStop1 = Object.assign({},newColorScheme.stop1);
	// 		this.colorStop2 = Object.assign({},newColorScheme.stop2);
	// 	}

	// }

	componentDidUpdate(){

		this._redraw();
		
	}

	_redraw(){

		const {width,height} = this.props;

		//Create a gradient
		const gradient = this.ctx.createLinearGradient(width/4,height,width,0);
		gradient.addColorStop(0,`rgb(${this.colorStop1.r},${this.colorStop1.g},${this.colorStop1.b})`);
		gradient.addColorStop(.6,`rgb(${this.colorStop2.r},${this.colorStop2.g},${this.colorStop2.b})`);

		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0,0,width,height);

	}

	render(){
		const {width,height} = this.props;

		return (
			<canvas className='gl-background'
				style={{
					position:'fixed',
					width,
					height,
					top:0,
					zIndex:-999
				}}
				width={width}
				height={height}
				ref={node=>{this.node=node}}
			/>
		);
	}
}

GLBackground.defaultProps = {
	dark:true,
	colorSchemes:{
		dark:{
			stop1:{r:5,g:5,b:5},
			stop2:{r:50,g:50,b:50}
		},
		light:{
			stop1:{r:200,g:198,b:195},
			stop2:{r:250,g:250,b:250}
		}
	}
}

export default GLBackground;