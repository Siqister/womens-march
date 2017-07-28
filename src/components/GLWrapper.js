import React, {Component} from 'react';
import * as THREE from 'three';
import {randomNormal} from 'd3';

//TODO: implement trackball control
const TrackballControls = require('three-trackballcontrols');

import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';
import gridVertexShader from '../shaders/gridVertexShader';

//Vertices data
const signVerticesArray = [
	-1.0, 1.0, 0,
	1.0, 1.0, .05,
	1.0, -1.0, 0,
	1.0, -1.0, 0,
	-1.0, -1.0, .05,
	-1.0, 1.0, 0
];
const signUvArray = [
	0,0,
	1,0,
	1,1,
	1,1,
	0,1,
	0,0
];
const arrowVerticesArray = [
	-0.2, 0, 0.2,
	0, 0, -0.5,
	0.2, 0, 0.2
];

class GLWrapper extends Component{
	constructor(props){
		super(props);

		this._animate = this._animate.bind(this);
		this._processData = this._processData.bind(this);
		this._initStaticMeshes = this._initStaticMeshes.bind(this);
		this._setPerInstanceProperties = this._setPerInstanceProperties.bind(this);
		this._pick = this._pick.bind(this);

		this.onMouseMove = this.onMouseMove.bind(this);
		this.onClick = this.onClick.bind(this);

		this.state = {
			//cameraPosition:[0,-58,100],
			cameraPosition:[550,0,550],
			cameraLookAt:[0,0,0],
			speed:.003, //300s for all signs to march through
			//Distribution of signs
			X0:-120,
			X1:120, 
			R:400,
			R_WIGGLE:30,
			//Instance data for signs
			instances:[],
			//Renderer settings
			rendererClearcolor:0xeeeeee
		};

		//Shared 3D assets
		this.meshes = {
			signs:null,
			signsPicking:null,
			arrows:null,
			grid:null,
			target:null
		}
		this.material = null;

	}

	componentDidMount(){
		const {width,height,data} = this.props;
		const {cameraPosition,cameraLookAt,rendererClearcolor} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(60, width/height, 0.01, 3000);
		this.camera.position.set(...cameraPosition);
		this.camera.lookAt(new THREE.Vector3(...cameraLookAt));

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(rendererClearcolor);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.wrapperNode.appendChild(this.renderer.domElement);

		//Init scene
		this.scene = new THREE.Scene();

		//Init picking related
		this.pickingScene = new THREE.Scene();
		this.pickingTexture = new THREE.WebGLRenderTarget(width,height);

		//Init shared material
		//Shader material
		this.material = new THREE.RawShaderMaterial({
			uniforms:{
				uFogFactor:{value:0.000008},
				uColor:{value: new THREE.Vector4(1.0,1.0,1.0,1.0)},
				uUsePickingColor:{value:false},
				uUseInstanceTransform:{value:true},
				uUseTexture:{value:false},
				map:{value:new THREE.TextureLoader().load('./assets/f97b4d0e76df9855d7e3e0b2754c7f9a.jpg')}
			},
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side: THREE.DoubleSide,
			transparent:true
		});

		//Init static meshes and start animation loop
		this._initStaticMeshes();
		this._animate();		
	}

	componentWillReceiveProps(nextProps){
		if(nextProps.data.length !== this.props.data.length){
			//TODO: minimize this
			this.setState({instances: [...this._setPerInstanceProperties(nextProps.data)]}); //nextState, based on nextProps
		}
	}

	componentDidUpdate(prevProps, prevState){
		const {width,height,data} = this.props;

		//Assume width and height are changed
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);
		this.pickingTexture.setSize(width,height);

		//If new data is injected, process mesh
		if(this.state.instances.length !== prevState.instances.length){
			//TODO: remove previously added dynamic meshes
			this._processData(this.state.instances);
		}
	}

	onMouseMove(e){
		const x = e.clientX, y = e.clientY;
		const id = this._pick(x,y);

		if(this.state.instances && this.state.instances[id]){
			const transformMatrixElements = this.state.instances[id].transformMatrixSign.elements;

			const {instanceTransformCol0, instanceTransformCol1, instanceTransformCol2, instanceTransformCol3} = this.meshes.target.geometry.attributes;
			instanceTransformCol0.setXYZW(0, ...transformMatrixElements.slice(0,4));
			instanceTransformCol1.setXYZW(0, ...transformMatrixElements.slice(4,8));
			instanceTransformCol2.setXYZW(0, ...transformMatrixElements.slice(8,12));
			instanceTransformCol3.setXYZW(0, ...transformMatrixElements.slice(12));
			instanceTransformCol0.needsUpdate = true;
			instanceTransformCol1.needsUpdate = true;
			instanceTransformCol2.needsUpdate = true;
			instanceTransformCol3.needsUpdate = true;
		}
	}

	onClick(e){
		const x = e.clientX, y = e.clientY;
		const id = this._pick(x,y);

		if(this.state.instances && this.state.instances[id]){
			this.props.handleSelect(id);
		}
	}

	_initStaticMeshes(){
		const {R, R_WIGGLE} = this.state;

		//Target
		const vertices = new THREE.BufferAttribute(new Float32Array(6*3),3);
		vertices.setXYZ(0, -1.0, 1.0, 0);
		vertices.setXYZ(1, 1.0, 1.0, .05);
		vertices.setXYZ(2, 1.0, -1.0, 0);
		vertices.setXYZ(3, 1.0, -1.0, 0);
		vertices.setXYZ(4, -1.0, -1.0, .05);
		vertices.setXYZ(5, -1.0, 1.0, 0);
		const uv = new THREE.BufferAttribute(new Float32Array(6*2),2);
		uv.setXY(0,0,0);
		uv.setXY(1,1,0);
		uv.setXY(2,1,1);
		uv.setXY(3,1,1);
		uv.setXY(4,0,1);
		uv.setXY(5,0,0);

		const targetTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			targetTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			targetTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			targetTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1);
		const targetGeometry = new THREE.InstancedBufferGeometry();
		targetGeometry.addAttribute('position',vertices);
		targetGeometry.addAttribute('uv',uv);
		targetGeometry.addAttribute('instanceTransformCol0', targetTransformCol0);
		targetGeometry.addAttribute('instanceTransformCol1', targetTransformCol1);
		targetGeometry.addAttribute('instanceTransformCol2', targetTransformCol2);
		targetGeometry.addAttribute('instanceTransformCol3', targetTransformCol3);

		const targetMaterial = this.material.clone();
		targetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0,0.0,0.0,1.0);
		targetMaterial.uniforms.uFogFactor.value = 0;
		targetMaterial.uniforms.uUseTexture.value = true;

		this.meshes.target = new THREE.Mesh(targetGeometry,targetMaterial);
		this.scene.add(this.meshes.target);
	}

	_processData(data){
		//Process data array
		//Will be called every time component updates with props.data
		const {instances} = this.state;
		const COUNT = instances.length;

		//SIGNS
		//ATTRIBUTES...
		//...set up attributes
		//per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(3*6),3);
		vertices.setXYZ(0, -1.0, 1.0, 0);
		vertices.setXYZ(1, 1.0, 1.0, .05);
		vertices.setXYZ(2, 1.0, -1.0, 0);
		vertices.setXYZ(3, 1.0, -1.0, 0);
		vertices.setXYZ(4, -1.0, -1.0, .05);
		vertices.setXYZ(5, -1.0, 1.0, 0);
		const uv = new THREE.BufferAttribute(new Float32Array(6*2),2);
		uv.setXY(0,0,0);
		uv.setXY(1,1,0);
		uv.setXY(2,1,1);
		uv.setXY(3,1,1);
		uv.setXY(4,0,1);
		uv.setXY(5,0,0);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array([-.2,0,.2,0,0,-.5,.2,0,.2]),3);
		//per instance InstancedBufferAttribute...
		const instanceTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceArrowTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		// ...shared
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		
		//...populate attributes with data
		for(let i=0; i<COUNT; i++){
			const {pickingColor, transformMatrixSign, transformMatrixArrow} = instances[i];

			const transformMatrixElements = transformMatrixSign.elements; //in column major format
			instanceTransformCol0.setXYZW(i, ...transformMatrixElements.slice(0,4));
			instanceTransformCol1.setXYZW(i, ...transformMatrixElements.slice(4,8));
			instanceTransformCol2.setXYZW(i, ...transformMatrixElements.slice(8,12));
			instanceTransformCol3.setXYZW(i, ...transformMatrixElements.slice(12));

			const arrowTransformMatrixElements = transformMatrixArrow.elements;
			instanceArrowTransformCol0.setXYZW(i, ...arrowTransformMatrixElements.slice(0,4));
			instanceArrowTransformCol1.setXYZW(i, ...arrowTransformMatrixElements.slice(4,8));
			instanceArrowTransformCol2.setXYZW(i, ...arrowTransformMatrixElements.slice(8,12));
			instanceArrowTransformCol3.setXYZW(i, ...arrowTransformMatrixElements.slice(12));

			instanceColors.setXYZW(i, pickingColor.r, pickingColor.g, pickingColor.b, 1.0);
		}

		//GEOMETRY & MESH
		//SIGNS
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('uv',uv);
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceTransformCol0',instanceTransformCol0);
		geometry.addAttribute('instanceTransformCol1',instanceTransformCol1);
		geometry.addAttribute('instanceTransformCol2',instanceTransformCol2);
		geometry.addAttribute('instanceTransformCol3',instanceTransformCol3);
		//RawShaderMaterial
		let material = this.material.clone();
		material.uniforms.uUseTexture.value = true;
		material.uniforms.map.value = new THREE.TextureLoader().load('./assets/f97b4d0e76df9855d7e3e0b2754c7f9a.jpg');
		//Geometry + Material -> Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);

		//ARROWS
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceColor', instanceColors);
		arrowsGeometry.addAttribute('instanceTransformCol0',instanceArrowTransformCol0);
		arrowsGeometry.addAttribute('instanceTransformCol1',instanceArrowTransformCol1);
		arrowsGeometry.addAttribute('instanceTransformCol2',instanceArrowTransformCol2);
		arrowsGeometry.addAttribute('instanceTransformCol3',instanceArrowTransformCol3);

		material = this.material.clone();
		material.uniforms.uColor.value = new THREE.Vector4(.9,.3,.3,1.0);
		material.uniforms.uFogFactor.value = 0.00001;

		this.meshes.arrows = new THREE.Mesh(arrowsGeometry,material);

		this.scene.add(this.meshes.signs);
		this.scene.add(this.meshes.arrows);
		//this.meshes.signs.position.y = 58;
		//this.meshes.arrows.position.y = 58;
		
		//SIGN FOR PICKING
		material = this.material.clone();
		material.uniforms.uUsePickingColor.value = true;
		this.meshes.signsPicking = new THREE.Mesh(geometry,material);

		this.pickingScene.add(this.meshes.signsPicking);
		//this.meshes.signsPicking.position.y = 58;
	}

	_setPerInstanceProperties(data){
		const {X0,X1,R,R_WIGGLE} = this.state;

		const position = new THREE.Vector3();
		const rotation = new THREE.Quaternion();
		const scale = new THREE.Vector3();
		const transformMatrixSign = new THREE.Matrix4();
		const transformMatrixArrow = new THREE.Matrix4();
		const normalMatrix = new THREE.Matrix3();
		const X_AXIS = new THREE.Vector3(1,0,0);
		const color = new THREE.Color();
		const random = randomNormal(0,(X1-X0)/2);

		return data.map((v,i)=>{
			const theta = Math.random()*Math.PI*2; 
			const radius = R + R_WIGGLE*(Math.random()-.5);

			//For signs: per instance position, rotation, and scale
			let z = Math.cos(theta)*radius;
			let y = Math.sin(theta)*radius;
			const x = random();

			position.set(x,y,z);
			rotation.setFromAxisAngle(X_AXIS, Math.PI/2-theta-Math.PI/8*(Math.random()*.5+1));
			scale.set(Math.random()*5+8, Math.random()*5+8, 10);
			transformMatrixSign.compose(position,rotation,scale);

			//For arrows
			z = Math.cos(theta)*(radius+R_WIGGLE);
			y = Math.sin(theta)*(radius+R_WIGGLE);

			position.set(x,y,z);
			rotation.setFromAxisAngle(X_AXIS, Math.PI/2-theta);
			scale.set(10,10,10);
			transformMatrixArrow.compose(position,rotation,scale);

			return {
				id:v.id,
				index:i,
				transformMatrixSign:transformMatrixSign.clone(),
				transformMatrixArrow:transformMatrixArrow.clone(),
				pickingColor: color.clone().setHex(i)
			};
		});
	}

	_pick(x,y){
		this.renderer.render(this.pickingScene, this.camera, this.pickingTexture);
		const pixelBuffer = new Uint8Array(4);
		this.renderer.readRenderTargetPixels(this.pickingTexture,x,this.pickingTexture.height-y,1,1,pixelBuffer);
		const id = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );

		return id;
	}

	_animate(delta){
		if(this.meshes.signs){
			this.meshes.signs.rotation.x -= this.state.speed;
			this.meshes.signsPicking.rotation.x -= this.state.speed;
			this.meshes.arrows.rotation.x -= this.state.speed;
			this.meshes.target.rotation.x -= this.state.speed;
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
				onMouseMove={this.onMouseMove}
				onClick={this.onClick}
			>
			</div>
		);
	}
}

GLWrapper.defaultProps = {
	data:[]
};

export default GLWrapper;