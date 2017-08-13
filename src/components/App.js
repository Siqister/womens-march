import React, {Component} from 'react';

import {fetchData} from '../utils';

import Scene from './Scene';
import GLWrapper from './GLWrapper';
import GLBackground from './GLBackground';

//TODO: remove scene settings from App.js
const scenes = {
	march:{
		position: [0, -58, 100],
		layout: 'march'
	},
	wheel:{
		position: [250, 0, 600],
		layout: 'wheel',
		layoutGroupBy: (v,i)=>v%3
	},
	bigWheel:{
		position: [500, 0, 600],
		layout: 'wheel',
		layoutGroupBy: null
	},
	sphere:{
		position: [0,0,20],
		layout: 'sphere'
	}
}

class App extends Component{
	constructor(props){
		super(props);

		this.state = {
			images:[],
			width:0,
			height:0,
			sceneSetting:scenes.bigWheel
		};

		this._handleSelect = this._handleSelect.bind(this);
		this._onScenePositionChange = this._onScenePositionChange.bind(this);
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

	_onSceneEnter(scene){
		switch(scene){
			case 'scene-1':
				this.setState({sceneSetting:scenes.bigWheel});
				break;
			case 'scene-2':
				this.setState({sceneSetting:scenes.sphere});
				break;
			default:
				this.setState({sceneSetting:scenes.bigWheel});
		}
	}

	_onScenePositionChange(v){
		console.log(v);
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
					layoutGroupBy={sceneSetting.layoutGroupBy?sceneSetting.layoutGroupBy:null}
					handleSelect={this._handleSelect}
				/>}
				{width&&height&&<GLBackground 
					width={width}
					height={height}
				/>}
				<Scene
					onSceneEnter={this._onSceneEnter.bind(this,'scene-1')}
				>
					<h1>Scene one</h1>
				</Scene>
				<Scene
					onSceneEnter={this._onSceneEnter.bind(this,'scene-2')}
				>
					<h1>Scene two</h1>
				</Scene>


			</div>
		);
	}
}

export default App;