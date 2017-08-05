import React, {Component} from 'react';
import * as THREE from 'three';
import {randomNormal, interpolate} from 'd3';
//TODO: implement trackball control
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
				map:{value:null}
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
		const cameraPositionTween = new TWEEN.Tween(this.camera.position)
			.to({ x : cameraPosition[0], y : cameraPosition[1], z : cameraPosition[2]}, 2000)
			.easing(TWEEN.Easing.Cubic.InOut)
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

			//Given instance, recalculate and reset its transform matrix
			//TODO: determining position, rotation and scale of target at any given moment
			//Start mat4: instance transform x target.matrixWorld
			//End mat4: instance scale x camera.matrixWorld x z offset

			//Before: this works
			const m0 = this.state.instances[id].transformMatrixSign.clone();
			const rotation = new THREE.Matrix4().makeRotationFromEuler(this.meshes.target.rotation);
			m0.premultiply(rotation);

			//After
			const _scale = new THREE.Vector3();
			const _position = new THREE.Vector3();
			const _rotation = new THREE.Quaternion();
			const _translate = new THREE.Matrix4().makeTranslation(0,0,-50);
			m0.decompose(_position, _rotation, _scale);
			console.log(_scale);
			console.log(_translate);
			const m1 = new THREE.Matrix4();
			m1.makeScale(_scale.x, _scale.y, _scale.z);
			m1.premultiply(this.camera.matrixWorld);
			m1.premultiply(_translate);

			const matrixInterpolater = interpolate(m0.elements, m1.elements);

			

			const pickedSignTween = new TWEEN.Tween({x:0})
				.to({x:1},500)
				.onUpdate(v=>{
					const transformMatrixElements = matrixInterpolater(v);
			const {instanceTransformCol0, instanceTransformCol1, instanceTransformCol2, instanceTransformCol3} = this.meshes.pickedTarget.geometry.attributes;
			instanceTransformCol0.setXYZW(0, ...transformMatrixElements.slice(0,4));
			instanceTransformCol1.setXYZW(0, ...transformMatrixElements.slice(4,8));
			instanceTransformCol2.setXYZW(0, ...transformMatrixElements.slice(8,12));
			instanceTransformCol3.setXYZW(0, ...transformMatrixElements.slice(12));
			instanceTransformCol0.needsUpdate = true;
			instanceTransformCol1.needsUpdate = true;
			instanceTransformCol2.needsUpdate = true;
			instanceTransformCol3.needsUpdate = true;
				})
							.easing(TWEEN.Easing.Cubic.InOut)

				.start();


		}

	}

	_initStaticMeshes(){

		const {R, R_WIGGLE} = this.state;

		//TARGET
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);

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
		targetMaterial.uniforms.map.value = this.texture;

		this.meshes.target = new THREE.Mesh(targetGeometry,targetMaterial);
		this.scene.add(this.meshes.target);

		//PICKED TARGET
		const pickedTargetTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			pickedTargetTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			pickedTargetTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1),
			pickedTargetTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(1*4),4,1);
		const pickedTargetGeometry = new THREE.InstancedBufferGeometry();
		pickedTargetGeometry.addAttribute('position',vertices);
		pickedTargetGeometry.addAttribute('uv',uv);
		pickedTargetGeometry.addAttribute('instanceTransformCol0', pickedTargetTransformCol0);
		pickedTargetGeometry.addAttribute('instanceTransformCol1', pickedTargetTransformCol1);
		pickedTargetGeometry.addAttribute('instanceTransformCol2', pickedTargetTransformCol2);
		pickedTargetGeometry.addAttribute('instanceTransformCol3', pickedTargetTransformCol3);

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

		//SIGNS
		//Attributes...
		//...per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array(arrowVerticesArray),3);
		//...per instance InstancedBufferAttribute...
		const instanceTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceArrowTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceArrowTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		// ...shared between sign and arrow
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		
		//Populate attribute with data
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
		material.uniforms.map.value = this.texture;
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
		
		//SIGN FOR PICKING
		material = this.material.clone();
		material.uniforms.uUsePickingColor.value = true;
		this.meshes.signsPicking = new THREE.Mesh(geometry,material);

		this.pickingScene.add(this.meshes.signsPicking);

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