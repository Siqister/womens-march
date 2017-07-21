import React, {Component} from 'react';
import * as THREE from 'three';

import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';

class GLWrapper extends Component{
	constructor(props){
		super(props);

		this._animate = this._animate.bind(this);
		this._processData = this._processData.bind(this);

		this.state = {
			cameraPosition:{x:8,y:10,z:20},
			speed:150000 //300s for all signs to march through
		};

		//Direct references to meshes
		this.meshes = {
			signs:null,
			grid:null
		}
	}

	componentDidMount(){
		const {width,height,data} = this.props;
		const {cameraPosition} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
		this.camera.position.x = cameraPosition.x;
		this.camera.position.y = cameraPosition.y;
		this.camera.position.z = cameraPosition.z;
		this.camera.lookAt(new THREE.Vector3(0,4,0));

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(0x030303);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.wrapperNode.appendChild(this.renderer.domElement);

		//Init scene
		this.scene = new THREE.Scene();

		//If data...
		if(data.length){this._processData(data);}

		this._animate();
	}

	componentDidUpdate(){
		const {width,height,data} = this.props;

		//Assume width and height are changed
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);

		//If data is injected, process mesh
		if(data.length){this._processData(data);}
	}

	_processData(data){
		//Process data array
		//Will be called every time component updates with props.data

		//Randomize position x, y, and pct
		const X_SPREAD = 40, Y_SPREAD = 2, Z_SPREAD = 100;
		const instances = data.map(v=>({
			id:v.id,
			position:[(Math.random()*2-1)*X_SPREAD, (Math.random()*2-1)*Y_SPREAD, (Math.random()*2-1)*Z_SPREAD],
			pctOffset:Math.random() //How far along the march?
		}));
		const COUNT = instances.length;

		//Construct InstancedBufferGeometry
		const geometry = new THREE.InstancedBufferGeometry();

		//per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(3*6),3);
		vertices.setXYZ(0, -0.75, 1.0, 0);
		vertices.setXYZ(1, 0.75, 1.0, 0);
		vertices.setXYZ(2, 0.75, -1.0, 0);
		vertices.setXYZ(3, 0.75, -1.0, 0);
		vertices.setXYZ(4, -0.75, -1.0, 0);
		vertices.setXYZ(5, -0.75, 1.0, 0);
		geometry.addAttribute('position', vertices);

		//per instance InstancedBufferAttribute
		const instanceOffsets = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*3),3,1);
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceOrientations = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instancePctStarts = new THREE.InstancedBufferAttribute(new Float32Array(instances.map(v=>v.pctOffset)),1,1);
		for(let i=0; i<COUNT; i++){
			const orientation = new THREE.Vector4(Math.random()*.4-.2, Math.random()*.2-.05, 1.0, 0.0);
			orientation.normalize();

			instanceOffsets.setXYZ(i,...instances[i].position);
			instanceColors.setXYZW(i, Math.random(), Math.random(), Math.random(), 1.0);
			instanceOrientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);
		}
		geometry.addAttribute('instanceOffset', instanceOffsets);
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceOrientation', instanceOrientations);
		geometry.addAttribute('instancePctStart', instancePctStarts);

		//RawShaderMaterial
		const material = new THREE.RawShaderMaterial({
			uniforms:{
				uGlobalPct:{value:0.0}
			},
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side: THREE.DoubleSide,
			transparent:true
		});

		//Geometry + Material -> Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);

		this.scene.add(this.meshes.signs);
	}

	_animate(delta){

		//Each animation frame, update globalPct uniform
		if(this.meshes.signs){
			this.meshes.signs.material.uniforms.uGlobalPct.value = (delta%this.state.speed)/this.state.speed;
		}

		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this._animate);
	}

	render(){
		const {width,height} = this.props;

		return (
			<div className='gl-wrapper'
				style={{width,height}}
				ref={(node)=>{this.wrapperNode=node}}
			>
			</div>
		);
	}
}

export default GLWrapper;