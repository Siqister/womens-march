import Layout from './Layout';
import {nest, hierarchy, tree, extent, scaleLog, scaleLinear, scaleOrdinal} from 'd3';
import * as THREE from 'three';

const StaticForceLayoutWorker = require('worker-loader!../workers/StaticForceLayoutWorker');

export default class SphereClusterLayout extends Layout{

	constructor(){

		super();

		this.compute = this.compute.bind(this);
		this.computePerInstance = this.computePerInstance.bind(this);

		this.treeLayout = tree();
		this.rScale = scaleLinear();
		this.clusterColorScale = scaleOrdinal()
			.range([
				0x00ff80,
				0x330066,
				0x00ff1a,
				0xf51268,
				0xffdb4b,
				'rgb(0,0,255)',
				'rgb(255,0,255)',
				'rgb(255,128,225)'
			]); //FIXME: extract category colors from this module

	}

	compute(data, imagesToHighlight=[], cancelToken){

		const nestedData = nest()
			.key(this.groupByAccessor)
			.entries(data)
			.map(cluster => ({
					key:cluster.key,
					values:cluster.values.map(d => Object.assign({},d,{cluster:cluster.key}))
			}));

		this.clusterColorScale.domain(nestedData.map(cluster => cluster.key));

		const rootNode = hierarchy({key:'root',values:nestedData}, d => d.values);

		//Compute tree layout and get links
		const links = this.treeLayout(rootNode).links();
		rootNode.fx = 0;
		rootNode.fy = 0;

		//Set range for this.rScale
		this.rScale.range([0, this.r]);

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
						const nodes = e.data.nodes.filter(d => d.depth===2);
						this.rScale.domain(extent(nodes.map(d => Math.sqrt(d.x*d.x+d.y*d.y+d.z+d.z))));
						resolve(nodes.map(this.computePerInstance));
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
		const {frame, cluster} = v.data;

		//Construct per instance transform matrices 
		const instanceNormal = new THREE.Vector3(v.x, v.y, v.z).normalize();
		const instanceR = this.r + this.rScale(Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z)) - this.r;
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
			clusterColor: new THREE.Color(this.clusterColorScale(cluster)),
			textureUvOffset: [(frame.x+2)/2/4096, (frame.y+2)/2/4096], //FIXME: hardcoded
			textureUvSize: [(frame.w-4)/2/4096, (frame.h-4)/2/4096] //FIXME: hardcoded
		};

	}

}