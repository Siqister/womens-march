import Layout from './Layout';
import {randomNormal, pie} from 'd3';
import * as THREE from 'three';

export default class SphereLayout extends Layout{

	constructor(){

		super();

		this.compute = this.compute.bind(this);
		this.computePerInstance = this.computePerInstance.bind(this);

	}

	compute(data, imagesToHighlight=[]){

		this.spriteSize = data.size;

		const LNG_BANDS = Math.ceil(Math.sqrt(data.length)); 
		const LAT_BANDS = Math.ceil(data.length/LNG_BANDS);

		//Compute position based on theta (lat) and phi (lng)
		this.sphericalNormals = []; //array of possible spherical normals in (x,y,z)

		for(let lat=0; lat<=LAT_BANDS; lat++){
			const theta = lat*Math.PI/LAT_BANDS; //TODO: range may be <180deg
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for(let lng=0; lng<=LNG_BANDS*(sinTheta*1.56); lng++){
				const phi = lng*Math.PI*2/(LNG_BANDS*(sinTheta*1.56)); //TODO: range may be < 360deg FIXME: hardcoded fudge constant
				const sinPhi = Math.sin(phi);
				const cosPhi = Math.cos(phi);

				const sphericalNormal = [cosPhi*sinTheta, cosTheta, sinPhi*sinTheta];
				this.sphericalNormals.push(sphericalNormal);
			}
		} 

		//Combine data and imagesToHighlight
		const imageMap = data.reduce((result,val)=>{
			if(!result[val.id]) result[val.id] = Object.assign({},val);
			return result;
		},{});
		imagesToHighlight.forEach(id => {
			imageMap[id].highlight = true;
		});

		return Object.values(imageMap).map(this.computePerInstance);

	}

	computePerInstance(v,i){

		//Texture-mapping related
		const {frame} = v;

		//Sign
		const instanceNormal = this.sphericalNormals[i];
		const instanceR = this.r + Math.random()*40-20 + (v.highlight?20:0); 
		let instancePosition = instanceNormal.map(v=>v*instanceR);
		const xyz = [...instancePosition];
		const rotationMat4 = new THREE.Matrix4();

		this.position.set(...instancePosition);

		this.up.set(Math.random()*.6-.3, 1, 0).normalize();
		rotationMat4.lookAt(this.position, this.CENTER, this.up);
		
		this.scale.set(frame.w/(this.spriteSize/2048*2), frame.h/(this.spriteSize/2048*2), 10);
		this.transformMatrixSign.compose(this.position, this.rotation, this.scale);
		this.transformMatrixSign.multiply(rotationMat4);

		const signScale = this.scale.clone();

		//Arrow
		instancePosition = instanceNormal.map(v => v*(instanceR + 15 + (v.highlight?15:0)));
		this.position.set(...instancePosition);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI*2);
		this.scale.set(5,5,(v.highlight?14:7));
		this.transformMatrixArrow.compose(this.position, this.rotation, this.scale);
		this.transformMatrixArrow.multiply(rotationMat4);

		return {
			id:v.id,
			frame:v.frame,
			filename:v.filename,
			xyz:xyz,
			highlight:v.highlight?1.0:0.0, //glsl attribute has to be float
			transformMatrixSign: this.transformMatrixSign.clone(),
			transformMatrixArrow: this.transformMatrixArrow.clone(),
			scaleVec3: signScale,
			pickingColor: this.color.clone().setHex(i),
			arrowColor: v.highlight?new THREE.Color('rgb(237,12,110)'):new THREE.Color('rgb(125,125,125)'),//new THREE.Color('rgb(0,160,172)'),
			textureUvOffset: [(frame.x+(this.spriteSize/2048/2))/this.spriteSize, (frame.y+(this.spriteSize/2048/2))/this.spriteSize], //FIXME: hardcoded
			textureUvSize: [(frame.w-this.spriteSize/2048)/this.spriteSize, (frame.h-this.spriteSize/2048)/this.spriteSize] //FIXME: hardcoded
		};

	}

}