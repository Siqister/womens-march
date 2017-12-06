import * as THREE from 'three';
import {map, scaleLinear} from 'd3';
import {fetchLayout} from '../utils';
import Layout from './Layout';

export default class PrecomputedLayout extends Layout{

	constructor(){

		super();

		this.src = null;
		this.compute = this.compute.bind(this);
		this.computeInstance = this.computeInstance.bind(this);

	}

	compute(data, imagesToHighlight=[]){

		//Merge data and imagesToHighlight
		const imageMap = data.reduce((acc,val)=>{
			if(!acc[val.id]) acc[val.id] = Object.assign({},val);
			return acc;
		},{});

		imagesToHighlight.forEach(id => {
			imageMap[id].highlight = true;
		});

		return fetchLayout(this.src)
			.then(res => {
				//Map of pre-computed 3D coordinates
				const coordinatesMap = map(res, d => d.id);
				//Mine for max distance from center
				const maxDistance = Math.max(...res.map(d => Math.sqrt(d.x*d.x+d.y*d.y+d.z*d.z)));
				return {res, coordinatesMap, maxDistance};
			})
			.then(({coordinatesMap, maxDistance}) => 
				Object.values(imageMap).map(d => {

					if(coordinatesMap.get(d.id)){
						const coords = coordinatesMap.get(d.id);
						const scale = this.r/maxDistance;
						return Object.assign({},d,{
							x:coords.x*scale,
							y:coords.y*scale,
							z:coords.z*scale
						});
					}else{
						return Object.assign({},d,{x:0, y:0, z:0});
					}

				})
				.map(this.computeInstance)
			);

	}

	computeInstance(v,i){

		const {frame} = v;
		const rotationMat4 = new THREE.Matrix4();

		//Sign
		this.position.set(v.x,v.y,v.z);
		this.up.set(Math.random()*.6-.3, 1, 0).normalize();
		rotationMat4.lookAt(this.position, this.CENTER, this.up);
		
		this.scale.set(frame.w/8, frame.h/8, 10);
		this.transformMatrixSign.compose(this.position, this.rotation, this.scale);
		this.transformMatrixSign.multiply(rotationMat4);

		//Arrow
		this.position.set(v.x,v.y,v.z);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI*2);
		this.scale.set(5,5,v.highlight?14:7);
		this.transformMatrixArrow.compose(this.position, this.rotation, this.scale);
		this.transformMatrixArrow.multiply(rotationMat4);

		return {
			id:v.id,
			filename:v.filename,
			highlight:v.highlight?1.0:0.0, //glsl attribute has to be float
			transformMatrixSign: this.transformMatrixSign.clone(),
			transformMatrixArrow: this.transformMatrixArrow.clone(),
			pickingColor: this.color.clone().setHex(i),
			arrowColor: v.highlight?new THREE.Color('rgb(237,12,110)'):new THREE.Color('rgb(0,160,172)'),
			//clusterColor: v.highlight?new THREE.Color('rgb(255,255,255)'):new THREE.Color('rgb(255,255,50)'),
			textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
			textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
		};

	}

	setDataSource(_){

		this.src = _;
		return this;

	}

}