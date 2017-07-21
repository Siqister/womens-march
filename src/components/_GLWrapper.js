import React, {Component} from 'react';
import * as THREE from 'three';

import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';

//Version 1 of this, using raw THREE.js with React
console.log(vertexShader);
console.log(fragmentShader);


class GLWrapper extends Component{
	constructor(props){
		super(props);

		this._animate = this._animate.bind(this);
		this._processData = this._processData.bind(this);
	}

	componentDidMount(){
		const {width,height,data} = this.props;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(45, width/height, 1, 300);
		this.camera.position.z = 30;
		this.camera.position.x = 30;
		this.camera.lookAt(new THREE.Vector3(0,0,0));

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(0x010101);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.wrapperNode.appendChild(this.renderer.domElement);

		console.log(this.renderer.extensions.get( 'ANGLE_instanced_arrays' ));

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
		//Trial: add instancedBufferGeometry
		//Adapted from this example: https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing.html
		
		//Geometry
		const geometry = new THREE.InstancedBufferGeometry();

		//Per vertex attribute
		const vertices = new THREE.BufferAttribute(new Float32Array(1*3*3),3); //(TypedArray, ItemSize);
		vertices.setXYZ(0, -.5, -.5, 0);
		vertices.setXYZ(1, 0, .5, 0);
		vertices.setXYZ(2, .5, -.5, 0); //BufferAttribute.setXYZ(index, x, y, z)
		geometry.addAttribute('position', vertices);

		//Per vertex attribute
		const COUNT = 6000;
		const offsets = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*3),3,1); //TypedArray, ItemSize, meshPerAttribute
		for(let i=0; i<COUNT; i++){
			offsets.setXYZ(i, Math.random()*100-50, Math.random()*100-50, Math.random()*100-50);
		}
		geometry.addAttribute('instanceOffset', offsets);

		const colors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		for(let i=0; i<COUNT; i++){
			colors.setXYZW(i, Math.random(), Math.random(), Math.random(), Math.random());
		}
		geometry.addAttribute('instanceColor', colors);

		const orientations = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		for(let i=0; i<COUNT; i++){
			const orientation = new THREE.Vector4(Math.random()*.6-.3, Math.random()*.6-.3, 1.0, 0.0);
			orientation.normalize();
			orientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);
		}
		geometry.addAttribute('instanceOrientation', orientations);

		//Material
		const material = new THREE.RawShaderMaterial({
			uniforms:{
				sineTime: {value: 1.0}
			},
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side: THREE.DoubleSide,
			transparent:true
		});

		//Mesh
		const mesh = new THREE.Mesh(geometry, material);

		this.scene.add(mesh);
	}

	_animate(delta){
		const mesh = this.scene.children[0];
		if(mesh){
			mesh.rotation.y = delta * .0001;
			mesh.material.uniforms.sineTime.value = Math.sin(delta * .0005);
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