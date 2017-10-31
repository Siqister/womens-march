import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';

import {fetchImageList, fetchMetadata, fetchSprite} from '../utils/utils';

import Banner from './Banner';
import Navigation from './Navigation';
import GLWrapper from './GLWrapper';
import GLBackground from './GLBackground';
import Image from './Image';
import ScrollContent from '../pages/ScrollContent';

class App extends Component{

	constructor(props){

		super(props);

		this.state = {
			images:[],
			imagesToHighlight:[],
			selectedImageMetadata:null,
			selectedImageId:props.match.params.id?props.match.params.id:null,
			currentScene:0,

			width:0,
			height:0,

			sprite:null,
			textureLoading:false,
			metadataLoading:false,
			layoutComputing:false
		};

		this._handleSelect = this._handleSelect.bind(this);
		this._handleTextureLoadStart = this._handleTextureLoadStart.bind(this);
		this._handleTextureLoadEnd = this._handleTextureLoadEnd.bind(this);
		this._loadSelectedImageMetadata = this._loadSelectedImageMetadata.bind(this);
		this._handleLayoutStart = this._handleLayoutStart.bind(this);
		this._handleLayoutEnd = this._handleLayoutEnd.bind(this);

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
					currentScene:0
				});

				this._loadSelectedImageMetadata(this.state.selectedImageId);

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
		
		if(!nextProps.match.params.id){
			this.setState({
				selectedImageMetadata:null,
				selectedImageId:null
			});
		}else{
			const id = nextProps.match.params.id;
			this._loadSelectedImageMetadata(id);
		}
	}

	_loadSelectedImageMetadata(id){

		const _image = this.state.images.filter(image => image.id===id)[0];
		if(!_image) return;

		const filename = _image.filename;

		this.setState({
			selectedImageId: id,
			metadataLoading: true
		});

		fetchMetadata(filename)
			.then(res => {
				const metadata = res.json();
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

	_handleSelect(id){

		this.props.history.push(`/images/${id}`);

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

	_handleLayoutStart(){

		this.setState({
			layoutComputing:true
		});
	}

	_handleLayoutEnd(){

		this.setState({
			layoutComputing:false
		});
	}

	componentWillUnmount(){

		window.removeEventListener('resize');

	}

	render(){

		const {images,
			imagesToHighlight,
			sprite,
			width, height,
			currentScene,
			textureLoading,
			metadataLoading,
			layoutComputing,
			selectedImageId,
			selectedImageMetadata
		} = this.state;
		const sceneSetting = this.props.scenes[currentScene];

		console.group('App:re-render');
		console.log(this.state.images);
		// console.log(`App:render:${new Date()}`);
		// console.log('textureLoading / metadataLoading / layoutComputing: '+ this.state.textureLoading + ' / ' + this.state.metadataLoading + '/ ' + this.state.layoutComputing);
		console.log(selectedImageMetadata);
		console.log(selectedImageId);
		// console.log(images[selectedImageIndex]);
		// console.log(imagesToHighlight);
		console.log(`currentScene:${currentScene}`);
		console.groupEnd();

		//Compute next and prev randomized id to navigate to
		const nextId = images.length?images[Math.floor(Math.random()*(images.length-1))].id:null;
		const prevId = images.length?images[Math.floor(Math.random()*(images.length-1))].id:null;

		return (
			<div className='app' ref={(node)=>{this.appNode = node}} >
				<Banner colors={this.props.colors} />
				<ScrollContent 
					colors={this.props.colors}
					height={height}
					scenes={this.props.scenes}
					data={images}
					onFilter={ids => { this.setState({imagesToHighlight:[...ids]}); }}
				/>
				<Navigation 
					colors={this.props.colors}
					scenes={this.props.scenes}
					layoutComputing={layoutComputing}
					currentScene={currentScene}
					onSceneChange={i => { this.setState({currentScene:i}); }}
				/>
				{width&&height&&<GLBackground 
					width={width} 
					height={height}
				/>}
				{width&&height&&<GLWrapper 
					width={width} 
					height={height} 
					data={images}
					imagesToHighlight={imagesToHighlight}
					selectedImageId={selectedImageId?selectedImageId:null}
					sprite={sprite}
					scene={sceneSetting}
					onSelect={this._handleSelect}
					onTextureLoadStart={this._handleTextureLoadStart}
					onTextureLoadEnd={this._handleTextureLoadEnd}
					onLayoutStart={this._handleLayoutStart}
					onLayoutEnd={this._handleLayoutEnd}
				/>}
				<Image
					metadata={selectedImageMetadata}
					selectedImageId={selectedImageId?selectedImageId:null}
					loading={textureLoading || metadataLoading}
					next={ nextId }
					prev={ prevId }
					colors={this.props.colors}
				/>
			</div>
		);

	}
}


App.defaultProps = {
	scenes:[
		{
			id:'scene-1', //Required, unique ID
			desc:'Scene 1',
			cameraPosition: [1500, 0, 1500], //Required, camera position
			layout: 'wheel', //Required, must be one of 'wheel', 'sphere', or 'sphereCluster'
			layoutGroupBy: null,
			ambientLight: [0.0,0.0,.1,1.0] //Required, ambient light for this scene
		},
		{
			id:'scene-2', 
			desc:'Scene 2',
			cameraPosition: [0,0,800],
			layout: 'sphere',
			ambientLight: [0.0,0.0,.1,1.0]
		},
		{
			id:'cluster',
			desc:'Cluster',
			cameraPosition: [0,0,850],
			layout: 'sphereCluster',
			layoutGroupBy: (v,i) => (Math.floor(Math.random()*4)), //FIXME: dummy nesting
			ambientLight: [1.0,1.0,1.0,1.0]
		},
		{
			id:'browse', //last scene contains facet browser
			desc:'Facet browse',
			cameraPosition: [0,0,800],
			layout: 'sphere',
			ambientLight: [0.0,0.0,.1,1.0]
		}
	],
	colors:['rgb(240,240,240)', 'rgb(180,180,180)', 'rgb(80,80,80)']
};

export default App;