import Layout from './Layout';
import {nest, hierarchy, tree} from 'd3';
import * as THREE from 'three';

const StaticForceLayoutWorker = require('worker-loader!../workers/StaticForceLayoutWorker');

export default class SphereClusterLayout extends Layout{

	constructor(){

		super();

		this.compute = this.compute.bind(this);
		this.computePerInstance = this.computePerInstance.bind(this);

		this.treeLayout = tree();

	}

	compute(data, cancelToken){

		const nestedData = nest()
			.key(this.groupByAccessor)
			.entries(data);
		const rootNode = hierarchy({key:'root',values:nestedData}, d => d.values);

		//Compute tree layout and get links
		const links = this.treeLayout(rootNode).links();
		rootNode.fx = 0;
		rootNode.fy = 0;

		//Use webworker to compute a static 3d force layout
		return new Promise((resolve, reject)=>{

			const staticForceLayoutWorker = new StaticForceLayoutWorker();

			staticForceLayoutWorker.postMessage({
				nodes: rootNode.descendants().map( n => {
					n.x = (Math.random()-.5)*this.r/2; 
					n.y = (Math.random()-.5)*this.r/2; 
					n.z = (Math.random()-.5)*this.r/2; 
					return n}
				),
				links,
				r: this.r,
			});

			staticForceLayoutWorker.addEventListener('message', e => {
				
				switch (e.data.type){
					case 'tick':
						break;
					case 'end':
						resolve(e.data.nodes.filter(d => d.depth===2).map(this.computePerInstance));
						break;
				}

			});

			cancelToken.cancel = () => {
				reject('Layout is cancelled');
			}

		});

	}

	computePerInstance(v,i){

		//Texture-mapping related
		const {frame} = v.data;

		//Construct per instance transform matrices 
		const instanceNormal = new THREE.Vector3(v.x, v.y, v.z).normalize();
		const instanceR = this.r + Math.random()*40-20;
		this.position.copy(instanceNormal);
		this.position.multiplyScalar(instanceR);
		const rotationMat4 = new THREE.Matrix4();

		this.up.set(Math.random()*.6-.3, 1, 0).normalize();
		rotationMat4.lookAt(this.position, this.CENTER, this.up);
		
		this.scale.set(frame.w/8, frame.h/8, 10);
		this.transformMatrixSign.compose(this.position, this.rotation, this.scale);
		this.transformMatrixSign.multiply(rotationMat4);

		this.position.copy(instanceNormal);
		this.position.multiplyScalar(instanceR + 15);
		this.rotation.setFromAxisAngle(this.X_AXIS, Math.PI*2);
		this.scale.set(7,7,7);
		this.transformMatrixArrow.compose(this.position, this.rotation, this.scale);
		this.transformMatrixArrow.multiply(rotationMat4);

		return {
			id:v.data.id,
			index:i,
			transformMatrixSign:this.transformMatrixSign.clone(),
			transformMatrixArrow:this.transformMatrixArrow.clone(),
			pickingColor: this.color.clone().setHex(i),
			textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
			textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
		};

	}

}