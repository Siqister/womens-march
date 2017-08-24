import React, {Component} from 'react';

import {fetchImageList, fetchMetadata, fetchSprite} from '../utils';
import Toolbar from './Toolbar';
import Scene from './Scene';
import GLWrapper from './GLWrapper';
import GLBackground from './GLBackground';
import ImageDetail from './ImageDetail';

//TODO: remove scene settings from App.js
const scenes = [
	{
		id:1,
		position: [1500, 0, 1500],
		layout: 'wheel',
		layoutGroupBy: null
	},
	{
		id:2,
		position: [250, 0, 600],
		layout: 'wheel',
		layoutGroupBy: (v,i)=>v%3
	},
	{
		id:3,
		position: [0, -58, 100],
		layout: 'march'
	},
	{
		id:4,
		position: [0,0,800],
		layout: 'sphere'
	},
	{
		id:5,
		position: [0,0,20],
		layout: 'sphere'
	}
];

class App extends Component{
	constructor(props){
		super(props);

		this.state = {
			images:[],
			selectedImage:[],
			width:0,
			height:0,
			currentScene:0,
			sprite:null
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
		Promise.all([fetchImageList(), fetchSprite()])
			.then(([data,texture]) => {
				const {images} = this.state;
				this.setState({
					images:[...images, ...data],
					sprite:texture,
					currentScene:3
				});
			});

		//FIXME
		fetchMetadata()
			.then(res=>res.json())
			.then(res=>{console.log(res)});

		//Window resize event
		window.addEventListener('resize',()=>{
			this.setState({
				width: this.appNode.clientWidth,
				height: this.appNode.clientHeight
			});
		});
	}

	_handleSelect(id){
		
		const selectedImage = this.state.images.filter(v=>v.id===id);
		this.setState({
			selectedImage:[...selectedImage]
		});

	}

	componentWillUnmount(){
		window.removeEventListener('resize');
	}

	render(){
		const {images,sprite,width,height,currentScene,selectedImage} = this.state;
		const sceneSetting = this.props.scenes[currentScene];

		return (
			<div className='app' ref={(node)=>{this.appNode = node}} 
			>
				{width&&height&&<GLWrapper 
					width={width} 
					height={height} 
					data={images}
					sprite={sprite}
					sceneId={sceneSetting.id}
					cameraPosition={sceneSetting.position}
					layout={sceneSetting.layout}
					layoutGroupBy={sceneSetting.layoutGroupBy?sceneSetting.layoutGroupBy:null}
					handleSelect={this._handleSelect}
				/>}
				{selectedImage.length&&<ImageDetail
					data={selectedImage[0]}
				/>}
				<Toolbar 
					scenes={this.props.scenes}
					currentScene={currentScene}
					onSceneSettingChange={(i)=>{this.setState({currentScene:i})}}
				/>
			</div>
		);
	}
}

App.defaultProps = {
	scenes:scenes
};

export default App;