import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';

import {fetchImageList, fetchMetadata, fetchSprite} from '../utils/utils';
import Navigation from './Navigation';
import GLWrapper from './GLWrapper';
import GLBackground from './GLBackground';
import Image from './Image';
import Scene from './Scene';

import Intro from './Intro';


class App extends Component{

	constructor(props){

		super(props);

		this.state = {
			images:[],
			selectedImageMetadata:null,
			selectedImageIndex:props.match.params.index?+props.match.params.index:null,
			currentScene:0,

			width:0,
			height:0,
			showIntro:false,

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

				this._loadSelectedImageMetadata(this.state.selectedImageIndex);

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
			this._loadSelectedImageMetadata(index);
		}
	}

	_loadSelectedImageMetadata(index){

		if(!this.state.images[index]) return;
		const filename = this.state.images[index].filename;

		this.setState({
			selectedImageIndex: index,
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
			sprite,
			width, height,
			currentScene,
			textureLoading,
			metadataLoading,
			layoutComputing,
			selectedImageIndex,
			selectedImageMetadata
		} = this.state;
		const sceneSetting = this.props.scenes[currentScene];

		console.groupCollapsed('App:re-render');
		console.log(`App:render:${new Date()}`);
		console.log('textureLoading / metadataLoading / layoutComputing: '+ this.state.textureLoading + ' / ' + this.state.metadataLoading + '/ ' + this.state.layoutComputing);
		console.log(selectedImageMetadata);
		console.log(selectedImageIndex);
		console.log(images[selectedImageIndex]);
		console.groupEnd();


		return (
			<div className='app' ref={(node)=>{this.appNode = node}} >
				<Navigation
					selectedImageIndex={selectedImageIndex?(selectedImageIndex):null}
					scenes={this.props.scenes}
					currentScene={currentScene}
					onSceneSettingChange={(i)=>{this.setState({currentScene:i})}}
					colors={this.props.colors}
					collapse={this.state.showIntro}
					layoutComputing={layoutComputing}
				/>
				<Scene 
					onSceneEnter={()=>{ this.setState({showIntro:true}) }}
					onSceneLeave={()=>{ this.setState({showIntro:false, currentScene:1}) }}
				>
					<Intro colors={this.props.colors}/>
				</Scene>
				<Scene height={height+300} />
				{width&&height&&<GLBackground 
					width={width} 
					height={height} 
				/>}
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
					onLayoutStart={this._handleLayoutStart}
					onLayoutEnd={this._handleLayoutEnd}
				/>}
				<Image
					metadata={selectedImageMetadata}
					imageIndex={selectedImageIndex?(selectedImageIndex):null}
					loading={textureLoading || metadataLoading}
					next={ Math.floor(Math.random()*(images.length-1)) }
					prev={ Math.floor(Math.random()*(images.length-1)) }
					colors={this.props.colors}
				/>
			</div>
		);

	}
}


App.defaultProps = {
	scenes:[
		{
			id:1,
			position: [1500, 0, 1500],
			layout: 'wheel',
			layoutGroupBy: null
		},
		{
			id:4,
			position: [0,0,800],
			layout: 'sphere'
		},
		{
			id:6,
			position: [0,0,960],
			layout: 'sphereCluster',
			layoutGroupBy: (v,i)=> (Math.floor(Math.random()*7)) //FIXME: dummy nesting
		}
	],
	colors:['rgb(240,240,240)', 'rgb(180,180,180)', 'rgb(80,80,80)']
};

export default App;