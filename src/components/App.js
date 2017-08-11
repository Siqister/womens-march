import React, {Component} from 'react';
import Waypoint from 'react-waypoint';

import {fetchData} from '../utils';

import GLWrapper from './GLWrapper';
import GLBackground from './GLBackground';

const scenes = {
	march:{
		position: [0, -58, 100],
		layout: 'march'
	},
	wheel:{
		position: [450, 0, 500],
		layout: 'wheel'
	},
	far:{
		position: [1500,0,800],
		layout: 'wheel'
	}
}

class App extends Component{
	constructor(props){
		super(props);

		this.state = {
			images:[],
			width:0,
			height:0,
			sceneSetting:scenes.wheel
		};

		this._handleSelect = this._handleSelect.bind(this);
	}

	componentDidMount(){
		//Compute width and height from .app
		//Updatte state and trigger re-render
		this.setState({
			width: this.appNode.clientWidth,
			height: this.appNode.clientHeight
		});

		//Request data...
		//...on data request complete, update state and trigger re-render
		fetchData()
			.then(data => {
				const {images} = this.state;
				this.setState({
					images:[...images, ...data]
				});
			});

		//Window resize event
		window.addEventListener('resize',()=>{
			this.setState({
				width: this.appNode.clientWidth,
				height: this.appNode.clientHeight
			});
		});
	}

	_handleSelect(id){
		console.log(id);
	}

	componentWillUnmount(){
		window.removeEventListener('resize');
	}

	render(){
		const {images,width,height,sceneSetting} = this.state;

		return (
			<div className='app' ref={(node)=>{this.appNode = node}} >
				{width&&height&&<GLWrapper 
					width={width} 
					height={height} 
					data={images}
					cameraPosition={sceneSetting.position}
					layout={sceneSetting.layout}
					layoutGroupBy={(v,i)=>(i%2)}
					handleSelect={this._handleSelect}
				/>}
				{width&&height&&<GLBackground 
					width={width}
					height={height}
				/>}
			</div>
		);
	}
}

export default App;