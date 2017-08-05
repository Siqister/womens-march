import React, {Component} from 'react';
import * as THREE from 'three';
import {randomNormal, interpolate} from 'd3';
const OrbitControls = require('three-orbitcontrols');
const TWEEN = require('tween.js');

import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';

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
			cameraLookAt:[0,0,0],
			speed:.003, //Rotational speed
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

		//Shared GL assets
		this.meshes = {
			signs:null,
			signsPicking:null,
			arrows:null,
			target:null,
			pickedTarget:null
		}
		this.material = null;
		this.texture = new THREE.TextureLoader().load('./assets/f97b4d0e76df9855d7e3e0b2754c7f9a.jpg');
	}

	componentDidMount(){
		const {width,height,data,cameraPosition} = this.props;
		const {cameraLookAt,rendererClearcolor} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(60, width/height, 0.01, 3000);
		this.camera.position.set(...cameraPosition);
		this.camera.lookAt(new THREE.Vector3(...cameraLookAt));
		this.camera.zoom = 1;

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
				map:{value:null},
				uInterpolateTransform:{value:0.0}
			},
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side: THREE.DoubleSide,
			transparent:true
		});

		//Init orbitControls
		this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
		this.orbitControls.enableDamping = true;
		this.orbitControls.dampingFactor = 0.5;
		this.orbitControls.enableZoom = false;

		//Init tweens
		this.tween = {};
		this.tween.camera = new TWEEN.Tween(this.camera.position)
			.easing(TWEEN.Easing.Cubic.InOut);
		this.tween.transform = new TWEEN.Tween({x:0})
			.to({x:1}, 500)
			.easing(TWEEN.Easing.Cubic.InOut);

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
		const {width,height,data,cameraPosition} = this.props;

		//Assume width and height are changed
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);
		this.pickingTexture.setSize(width,height);

		//Assume cameraPosition has been updated; tween camera position to props.cameraPosition
		//TODO: compare props.cameraPosition and prevProps.cameraPosition before tweening
		const cameraLookAt = new THREE.Vector3(...this.state.cameraLookAt);
		this.tween.camera
			.to({ x : cameraPosition[0], y : cameraPosition[1], z : cameraPosition[2]}, 2000)
			.onUpdate(()=>{
				this.camera.lookAt(cameraLookAt);
			})
			.start();

		//If new data is injected, process mesh
		if(this.state.instances.length !== prevState.instances.length){
			
			//TODO: remove previously added dynamic meshes
			this._processData(this.state.instances);
		}

	}

	onMouseMove(e){

		const x = e.clientX, y = e.clientY;
		const id = this._pick(x,y);

		//Set transform matrix for this.meshes.target
		if(this.state.instances && this.state.instances[id]){
			this._updateTransformMatrices(this.meshes.target, this.state.instances[id].transformMatrixSign, this.state.instances[id].transformMatrixSign, 0);
		}

	}

	onClick(e){

		const x = e.clientX, y = e.clientY;
		const id = this._pick(x,y);

		if(this.state.instances && this.state.instances[id]){
			this.props.handleSelect(id);

			//Given instance, recalculate and reset its transform matrix
			//Transform matrix m0
			const m0 = this.state.instances[id].transformMatrixSign.clone();
			m0.premultiply(new THREE.Matrix4().makeRotationFromEuler(this.meshes.target.rotation));

			//Transform matrix m1
			const p = new THREE.Vector3(0, 0, -50),
				r = new THREE.Quaternion(),
				s = new THREE.Vector3(); //Store decomposed matrix4
			this.state.instances[id].transformMatrixSign.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
			this.camera.matrixWorld.decompose(new THREE.Vector3(), r, new THREE.Vector3());
			this.camera.localToWorld(p);
			const m1 = new THREE.Matrix4().compose(p, r, s);

			this._updateTransformMatrices(this.meshes.pickedTarget, m0, m1, 0);

			this.tween.transform
				.onUpdate(v=>{
					this.meshes.pickedTarget.material.uniforms.uInterpolateTransform.value = v;
				})
				.start();
		}

	}

	_initStaticMeshes(){

		//TARGET
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);

		const targetGeometry = new THREE.InstancedBufferGeometry();
		targetGeometry.addAttribute('position',vertices);
		targetGeometry.addAttribute('uv',uv);
		this._initTransformMatrixAttrib(targetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const targetMaterial = this.material.clone();
		targetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0,0.0,0.0,1.0);
		targetMaterial.uniforms.uFogFactor.value = 0;
		targetMaterial.uniforms.uUseTexture.value = true;
		targetMaterial.uniforms.map.value = this.texture;

		this.meshes.target = new THREE.Mesh(targetGeometry,targetMaterial);
		this.scene.add(this.meshes.target);


		//PICKED TARGET
		const pickedTargetGeometry = new THREE.InstancedBufferGeometry();
		pickedTargetGeometry.addAttribute('position',vertices);
		pickedTargetGeometry.addAttribute('uv',uv);
		this._initTransformMatrixAttrib(pickedTargetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const pickedTargetMaterial = targetMaterial.clone();
		pickedTargetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0, 1.0, 1.0, 1.0);
		pickedTargetMaterial.uniforms.map.value = this.texture;

		this.meshes.pickedTarget = new THREE.Mesh(pickedTargetGeometry,pickedTargetMaterial);
		this.scene.add(this.meshes.pickedTarget);

	}

	_processData(data){

		//Process data array; called when props.data changes
		const {instances} = this.state;
		const COUNT = instances.length;

		//Initialize per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array(arrowVerticesArray),3);
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		

		//GEOMETRY, MATERIAL & MESH: SIGNS
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('uv',uv);
		geometry.addAttribute('instanceColor', instanceColors);
		this._initTransformMatrixAttrib(geometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		let material = this.material.clone();
		material.uniforms.uUseTexture.value = true;
		material.uniforms.map.value = this.texture;
		//Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);


		//GEOMETRY, MATERIAL & MESH: ARROWS
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceColor', instanceColors);
		this._initTransformMatrixAttrib(arrowsGeometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		material = this.material.clone();
		material.uniforms.uColor.value = new THREE.Vector4(.9,.3,.3,1.0);
		material.uniforms.uFogFactor.value = 0.00001;
		//Mesh
		this.meshes.arrows = new THREE.Mesh(arrowsGeometry,material);
		

		//SIGN FOR PICKING
		material = this.material.clone();
		material.uniforms.uUsePickingColor.value = true;
		this.meshes.signsPicking = new THREE.Mesh(geometry,material);


		//Add meshes to scenes
		this.scene.add(this.meshes.signs);
		this.scene.add(this.meshes.arrows);
		this.pickingScene.add(this.meshes.signsPicking);


		//Populate attributes with value
		for(let i=0; i<COUNT; i++){
			const {pickingColor, transformMatrixSign, transformMatrixArrow} = instances[i];

			this._updateTransformMatrices(this.meshes.signs, transformMatrixSign, transformMatrixSign, i);
			this._updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, transformMatrixArrow, i);
			instanceColors.setXYZW(i, pickingColor.r, pickingColor.g, pickingColor.b, 1.0);
		}
		instanceColors.needsUpdate = true;


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
				pickingColor: color.clone().setHex(i),
				x,
				theta,
				radius
			};
		});

	}

	_updateTransformMatrices(mesh,m0,m1,index){

		//Given mesh containing (instanced) buffer geometry, update its starting and/or ending transform mat4 attribute at index i
		const {instanceTransformCol0, 
			instanceTransformCol1, 
			instanceTransformCol2, 
			instanceTransformCol3,
			m1Col0,
			m1Col1,
			m1Col2,
			m1Col3
		} = mesh.geometry.attributes;
		let transformMatrixElements;

		if(m0){
			transformMatrixElements = m0.elements;
			instanceTransformCol0.setXYZW(index, ...transformMatrixElements.slice(0,4)); instanceTransformCol0.needsUpdate = true;
			instanceTransformCol1.setXYZW(index, ...transformMatrixElements.slice(4,8)); instanceTransformCol1.needsUpdate = true;
			instanceTransformCol2.setXYZW(index, ...transformMatrixElements.slice(8,12)); instanceTransformCol2.needsUpdate = true;
			instanceTransformCol3.setXYZW(index, ...transformMatrixElements.slice(12)); instanceTransformCol3.needsUpdate = true;
		}
		if(m1){
			transformMatrixElements = m1.elements;
			m1Col0.setXYZW(index, ...transformMatrixElements.slice(0,4)); m1Col0.needsUpdate = true;
			m1Col1.setXYZW(index, ...transformMatrixElements.slice(4,8)); m1Col1.needsUpdate = true;
			m1Col2.setXYZW(index, ...transformMatrixElements.slice(8,12)); m1Col2.needsUpdate = true;
			m1Col3.setXYZW(index, ...transformMatrixElements.slice(12)); m1Col3.needsUpdate = true;
		}

	}

	_initTransformMatrixAttrib(instancedBufferGeometry,instanceCount){

		//Given instancedBufferGeometry and instanceCount, init correct attributes for two mat4 transform matrices
		const instanceTransform0Col0 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			instanceTransform0Col1 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			instanceTransform0Col2 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			instanceTransform0Col3 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1);
		const m1Col0 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			m1Col1 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			m1Col2 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1),
			m1Col3 = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount*4),4,1);

		instancedBufferGeometry.addAttribute('instanceTransformCol0', instanceTransform0Col0);
		instancedBufferGeometry.addAttribute('instanceTransformCol1', instanceTransform0Col1);
		instancedBufferGeometry.addAttribute('instanceTransformCol2', instanceTransform0Col2);
		instancedBufferGeometry.addAttribute('instanceTransformCol3', instanceTransform0Col3);

		instancedBufferGeometry.addAttribute('m1Col0', m1Col0);
		instancedBufferGeometry.addAttribute('m1Col1', m1Col1);
		instancedBufferGeometry.addAttribute('m1Col2', m1Col2);
		instancedBufferGeometry.addAttribute('m1Col3', m1Col3);

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

		this.orbitControls.update();
		TWEEN.update();

		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this._animate);

	}

	render(){
		const {width,height} = this.props;

		return (
			<div className='gl-wrapper'
				style={{
					position:'fixed',
					width, height
				}}
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