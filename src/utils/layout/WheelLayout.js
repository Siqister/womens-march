import Layout from './Layout';
import {randomNormal, pie} from 'd3';
import * as THREE from 'three';

export default class WheelLayout extends Layout{

	constructor(){
		
		super();
		this.randomX = null;
		this.randomR = null;
		this.pieLayout = pie().padAngle(Math.PI/180*15).value(v => v[1]);

		this.compute = this.compute.bind(this);
		this.computePerInstance = this.computePerInstance.bind(this);

	}

	compute(data, imagesToHighlight=[]){

		this.randomX = randomNormal(this.x, this.xStdDev);
		this.randomR = randomNormal(this.r, this.rStdDev);

		//Highlight attribute
		const imageMap = data.reduce((acc,val)=>{
				if(!acc[val.id]){
					acc[val.id] = Object.assign({},val);
				}
				return acc;
			}, {})
		imagesToHighlight.forEach(id => {
			imageMap[id].highlight = true;
		});


		if(this.groupByAccessor){
			const groups = data.map(this.groupByAccessor)
				.reduce((result,value)=>{
					if(result[value]==undefined){
						result[value] = 0;
					}else{
						result[value] += 1;
					}
					return result;
				},{}) //reduce to a map of unique values

			this.slices = this.pieLayout(Object.entries(groups))
				.reduce((result,value)=>{
					result[value.data[0]] = value;
					return result;
				},{});
		}

		return Object.values(imageMap).map(this.computePerInstance);

	}

	computePerInstance(v,i){
		//Texture mapping-related
		const {frame} = v;

		//Position-related
		const radius = this.randomR();
		let theta;
		if(this.groupByAccessor){
			const {startAngle, endAngle, padAngle} = this.slices[this.groupByAccessor(v,i)];
			theta = Math.random()*(endAngle-padAngle-startAngle) + startAngle;
		}else{
			theta = Math.random()*Math.PI*2;
		}

		//For signs: per instance position, rotation, and scale
		let z = Math.cos(theta)*radius;
		let y = Math.sin(theta)*radius;
		const x = this.randomX();

		this.position.set(x,y,z);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI/2-theta-Math.PI/8*(Math.random()*.5+1));
		this.scale.set(frame.w/10, frame.h/10, 10);
		this.transformMatrixSign.compose(this.position, this.rotation, this.scale);

		//For arrows
		z = Math.cos(theta)*(radius + this.rStdDev);
		y = Math.sin(theta)*(radius + this.rStdDev);

		this.position.set(x,y,z);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI/2-theta);
		this.scale.set(7,7,7);
		this.transformMatrixArrow.compose(this.position, this.rotation, this.scale);

		//Per instance datum
		return {
			id:v.id,
			filename:v.filename,
			highlight:v.highlight?1.0:0.0, //glsl attribute has to be float
			transformMatrixSign:this.transformMatrixSign.clone(),
			transformMatrixArrow:this.transformMatrixArrow.clone(),
			pickingColor: this.color.clone().setHex(i),
			arrowColor: v.highlight?new THREE.Color('rgb(237,12,110)'):new THREE.Color('rgb(0,160,172)'),
			textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
			textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096], //FIXME: hardcoded
			x,
			theta,
			radius
		};
	}

}