import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';

import {fetchImageList, fetchMetadata, fetchSprite} from '../utils';
import Navigation from './Navigation';
import Toolbar from './Toolbar';
import GLWrapper from './GLWrapper';
import Image from './Image';

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
			selectedImageMetadata:null,
			selectedImageIndex:null,
			width:0,
			height:0,
			currentScene:0,
			sprite:null,
			textureLoading:false,
			metadataLoading:false
		};

		this._handleSelect = this._handleSelect.bind(this);
		this._handleTextureLoadStart = this._handleTextureLoadStart.bind(this);
		this._handleTextureLoadEnd = this._handleTextureLoadEnd.bind(this);

	}

	componentDidMount(){

		//Compute width and height from .app
		//Updatte state and trigger re-render
		this.setState({
			width: this.appNode.clientWidth,
			height: this.appNode.clientHeight
		});

		//Request initial data, which includes large sprite and layout data...
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

		//Window resize event
		window.addEventListener('resize',()=>{
			this.setState({
				width: this.appNode.clientWidth,
				height: this.appNode.clientHeight
			});
		});

	}

	componentWillReceiveProps(nextProps){
		
		if(!nextProps.match.params.index){
			this.setState({
				selectedImageMetadata:null,
				selectedImageIndex:null
			});
		}else{

			const index = +nextProps.match.params.index;
			if(!this.state.images[index]) return;
			const filename = this.state.images[index].filename;
			//FIXME: for debugging, remove
			//const filename = '101D0001_DSC4101.jpg';
			//const filename = '100D0001_DSC2813.jpg'

			this.setState({
				selectedImageIndex: index,
				metadataLoading: true
			});

			fetchMetadata(filename)
				.then(res => {
					const metadata = res.json();
					console.log(metadata);
					return metadata;
				}, err => {
					console.log('Server error: ' + filename);
					this.setState({
						selectedImageMetadata:null,
						metadataLoading:false
					});
				})
				.then(res => {
					this.setState({
						selectedImageMetadata:res,
						metadataLoading:false
					});
				}, err => {
					console.log('Empty JSON: ' + filename);
					this.setState({
						selectedImageMetadata:null,
						metadataLoading:false
					});
				});
		}

	}

	_handleSelect(index){

		this.props.history.push(`/images/${index}`);

	}

	_handleTextureLoadStart(){

		this.setState({
			textureLoading:true
		});
	}

	_handleTextureLoadEnd(){
		this.setState({
			textureLoading:false
		});
	}


	componentWillUnmount(){

		window.removeEventListener('resize');

	}

	render(){

		const {images,
			sprite,
			width, height,
			currentScene,
			textureLoading,
			metadataLoading,
			selectedImageIndex,
			selectedImageMetadata
		} = this.state;
		const sceneSetting = this.props.scenes[currentScene];

		console.groupCollapsed('App:re-render');
		console.log(`App:render:${new Date()}`);
		console.log('textureLoading / metadataLoading: '+ this.state.textureLoading + ' / ' + this.state.metadataLoading);
		console.log(selectedImageMetadata);
		console.log(selectedImageIndex);
		console.log(images[selectedImageIndex]);
		console.groupEnd();


		return (
			<div className='app' ref={(node)=>{this.appNode = node}} >
				<Navigation
					selectedImageIndex={selectedImageIndex?(selectedImageIndex):null}
				/>
				{width&&height&&<GLWrapper 
					width={width} 
					height={height} 
					data={images}
					selectedImageIndex={selectedImageIndex?(selectedImageIndex):null}
					sprite={sprite}
					sceneId={sceneSetting.id}
					cameraPosition={sceneSetting.position}
					layout={sceneSetting.layout}
					layoutGroupBy={sceneSetting.layoutGroupBy?sceneSetting.layoutGroupBy:null}
					onSelect={this._handleSelect}
					onTextureLoadStart={this._handleTextureLoadStart}
					onTextureLoadEnd={this._handleTextureLoadEnd}
				/>}
				<Image
					metadata={selectedImageMetadata}
					imageIndex={selectedImageIndex?(selectedImageIndex):null}
					loading={textureLoading || metadataLoading}
					next={ Math.floor(Math.random()*(images.length-1)) }
					prev={ Math.floor(Math.random()*(images.length-1)) }
				/>
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