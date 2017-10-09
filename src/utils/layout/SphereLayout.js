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
			if(!result[val.filename]) result[val.filename] = Object.assign({},val);
			return result;
		},{});
		imagesToHighlight.forEach(filename => {
			imageMap[filename].highlight = true;
		});

		return Object.values(imageMap).map(this.computePerInstance);

	}

	computePerInstance(v,i){

		//Texture-mapping related
		const {frame} = v;

		//Construct per instance transform matrices 
		const instanceNormal = this.sphericalNormals[i];
		const instanceR = this.r + Math.random()*40-20 + (v.highlight?120:0);
		let instancePosition = instanceNormal.map(v=>v*instanceR);
		const rotationMat4 = new THREE.Matrix4();

		this.position.set(...instancePosition);

		this.up.set(Math.random()*.6-.3, 1, 0).normalize();
		rotationMat4.lookAt(this.position, this.CENTER, this.up);
		
		this.scale.set(frame.w/8, frame.h/8, 10);
		this.transformMatrixSign.compose(this.position, this.rotation, this.scale);
		this.transformMatrixSign.multiply(rotationMat4);

		instancePosition = instanceNormal.map(v=>v*(instanceR+15));
		this.position.set(...instancePosition);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI*2);
		this.scale.set(7,7,(v.highlight?14:7));
		this.transformMatrixArrow.compose(this.position, this.rotation, this.scale);
		this.transformMatrixArrow.multiply(rotationMat4);

		return {
			id:v.id,
			index:i,
			transformMatrixSign: this.transformMatrixSign.clone(),
			transformMatrixArrow: this.transformMatrixArrow.clone(),
			pickingColor: this.color.clone().setHex(i),
			clusterColor: new THREE.Color('rgb(255,255,255)'),
			textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
			textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
		};

	}

}