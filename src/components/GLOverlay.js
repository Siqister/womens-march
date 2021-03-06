import React, {Component} from 'react';
import {scaleLinear} from 'd3';
import {fetchMetadata} from '../utils/utils';
import * as THREE from 'three';

const glOverlayStyle = {
	position:'fixed',
	pointerEvents:'none',
	top:0,
	left:0,
	transition:'opacity 500ms'
}

class GLOverlay extends Component{

	constructor(props){

		super(props);

		this._redraw = this._redraw.bind(this);

		this.state = {
			highlight:[],
			highlightMetadata:{}
		}

		this.scaleR = scaleLinear().range([15,40]).domain([1000,100]).clamp(true);
		this.scaleFontSize = scaleLinear().range([10,25]).domain([1000,100]).clamp(true);
		this.scaleOpacity = scaleLinear().range([0.3,0.8]).domain([1000,200]).clamp(true);

	}

	componentDidMount(){

		this.ctx = this.canvasNode.getContext('2d');
		this.ctx.globalCompositeOperation = 'screen';
		this._redraw();

	}

	componentWillReceiveProps(nextProps){

		if(nextProps.instances !== this.props.instances){
			//sign instances have been re-laid out
			//Pick any random 5 to highlight
			const length = nextProps.instances.length;
			const highlight = Array.from({length:10}).map(v => {
				const instance = nextProps.instances[Math.floor(Math.random()*length)];

				fetchMetadata(instance.filename)
					.then(res => res.json())
					.then(metadata => {
						const {highlightMetadata} = this.state;
						this.setState({
							highlightMetadata: Object.assign({},highlightMetadata,{[metadata.filename]:metadata.mText || ''})
						});
					});

				return instance;
			});

			this.setState({
				highlight
			});
		}

	}

	componentDidUpdate(){

		this._redraw();

	}

	_redraw(){

		const {rotation, camera, width, height} = this.props;

		this.ctx.strokeStyle = 'rgb(255,255,255)';
		this.ctx.clearRect(0,0,width,height);

		this.state.highlight.forEach(d => {

			//TODO: take into account global rotation
			//Convert 3d coordinates to 2d canvas coordinates
			const eyeSpace = new THREE.Vector4(0,0,0,1).applyMatrix4(d.transformMatrixSign.clone().premultiply(camera.matrixWorldInverse));
			const clipSpace = eyeSpace.applyMatrix4(camera.projectionMatrix);
			const distToCamera = Math.sqrt(eyeSpace.x*eyeSpace.x + eyeSpace.y*eyeSpace.y + eyeSpace.z*eyeSpace.z);
			const radius = this.scaleR(distToCamera);

			const clipX = clipSpace.x/clipSpace.w;
			const clipY = clipSpace.y/clipSpace.w;
			const screenX = width/2 + clipX*width/2;
			const screenY = height/2 - clipY*height/2;

			const {r,g,b} = d.arrowColor;

			this.ctx.strokeStyle = `rgba(${r*255},${g*255},${b*255},.8)`;
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			this.ctx.moveTo(screenX+radius,screenY);
			this.ctx.arc(screenX, screenY, radius, 0, Math.PI*2);
			this.ctx.closePath();
			this.ctx.stroke();

			this.ctx.fillStyle = `rgba(255,255,255,${this.scaleOpacity(distToCamera)})`;
			this.ctx.strokeStyle = `rgba(255,255,255,${this.scaleOpacity(distToCamera)})`;
			this.ctx.beginPath();
			this.ctx.moveTo(screenX+2,screenY);
			this.ctx.arc(screenX, screenY, 2, 0, Math.PI*2);
			this.ctx.closePath();
			this.ctx.fill();

			//text
			const text = this.state.highlightMetadata[d.filename];
			this.ctx.font = `${this.scaleFontSize(distToCamera)}px sans-serif`;
			this.ctx.fillText(text, screenX+4, screenY+this.scaleFontSize(distToCamera)/2);
		});

	}

	render(){

		const {width,height,dragging,cameraTransitioning,selectedImageId} = this.props;

		return <canvas
			ref={node => {this.canvasNode = node}}
			className='gl-overlay'
			width={width}
			height={height}
			style={Object.assign({}, glOverlayStyle, {opacity:(dragging||cameraTransitioning||selectedImageId)?0.01:1})}
		/>

	}

}

export default GLOverlay;