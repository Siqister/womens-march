import React, {Component} from 'react';
import * as THREE from 'three';
const OrbitControls = require('three-orbitcontrols');
const TWEEN = require('tween.js');

import {WheelLayout, TileLayout, SphereLayout, signVerticesArray, signUvArray, arrowVerticesArray} from '../utils';
import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';
import hemisphereVs from '../shaders/hemisphereVertexShader';
import hemisphereFs from '../shaders/hemisphereFragmentShader';


class GLWrapper extends Component{

	constructor(props){

		super(props);

		this._animate = this._animate.bind(this);
		this._initMeshes = this._initMeshes.bind(this);
		this._initStaticMeshes = this._initStaticMeshes.bind(this);
		this._updateMeshes = this._updateMeshes.bind(this);
		this._showSelectedImage = this._showSelectedImage.bind(this);
		this._hideSelectedImage = this._hideSelectedImage.bind(this);
		this._pick = this._pick.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onClick = this.onClick.bind(this);

		this.state = {
			cameraLookAt: new THREE.Vector3(0,0,0),
			cameraUp: [.5,1,0],
			speed:.001, //Rotational speed
			//Distribution of signs
			X:0,
			X_WIGGLE:100, 
			R:450,
			R_WIGGLE:30,
			//Instance data for signs
			instances:[], //contains final/target per instance transform
			//Renderer settings
			rendererClearcolor:0xeeeeee
		};

		//Shared GL assets
		this.meshes = {
			signs:null,
			signsPicking:null,
			arrows:null,
			target:null,
			pickedTarget:null,
			hemisphere:null
		}
		this.material = null;
		this.pickedTargetTexture = new THREE.TextureLoader();
		this.pickedTargetTexture.crossOrigin = '';

	}

	componentDidMount(){
		const {width,height,data,cameraPosition} = this.props;
		const {cameraLookAt,rendererClearcolor} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(60, width/height, 0.5, 4000);
		this.camera.position.set(...cameraPosition);
		this.camera.lookAt(cameraLookAt);
		this.camera.zoom = 1;
		this.camera.up = new THREE.Vector3(...this.state.cameraUp).normalize(); //TODO: turn into a prop

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer({antialias:true});
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
				uFogFactor:{value:0.000004},
				uColor:{value: new THREE.Vector4(1.0,1.0,1.0,1.0)},
				uUsePickingColor:{value:false},
				uUseInstanceTransform:{value:true},
				uUseTexture:{value:false},
				uUseOrientation:{value:false},
				uOrientation:{value:new THREE.Vector4(0.0,0.0,1.0,0.0)},
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
			.easing(TWEEN.Easing.Cubic.InOut)
			.onUpdate(()=>{
				this.camera.lookAt(this.state.cameraLookAt);
			});
		this.tween.transform = new TWEEN.Tween({x:0})
			.to({x:1}, 500)
			.easing(TWEEN.Easing.Cubic.Out);
		this.tween.updateMeshes = new TWEEN.Tween({x:0})
			.to({x:1}, 1000)
			.easing(TWEEN.Easing.Cubic.InOut);

		//Init static meshes and start animation loop
		this._initStaticMeshes();
		this._animate();		

	}

	componentWillReceiveProps(nextProps){

		const {data,
			sprite,
			sceneId,
			cameraPosition,
			layout, 
			layoutGroupBy,
			selectedImageIndex} = nextProps;

		if(sprite){
			sprite.flipY = false; //FIXME: shouldn't mutate incoming props.sprite
		}

		//If props.sceneId changes
		//Reorient camera
		if(this.props.sceneId !== sceneId){
			this.tween.camera
				.to({ x : cameraPosition[0], y : cameraPosition[1], z : cameraPosition[2]}, 2000)
				.start();
		}

		//If props.sceneId changes (which implies layout change), or
		//if props.data.length changes (e.g. initial data injection)
		//Layout data again
		if(this.props.sceneId !== sceneId || nextProps.data.length !== this.props.data.length){

			console.log('GLWrapper:layout');
			let setPerInstanceProperties;

			const wheelLayout = WheelLayout()
				.x(this.state.X, this.state.X_WIGGLE)
				.r(this.state.R, this.state.R_WIGGLE)
				.groupBy(layoutGroupBy);
			const sphereLayout = SphereLayout()
				.r(this.state.R);

			switch(layout){
				case 'wheel':
					setPerInstanceProperties = wheelLayout;
					break;
				case 'sphere':
					setPerInstanceProperties = sphereLayout;
					break;
				default:
					setPerInstanceProperties = wheelLayout;
			}

			this.setState({
				instances: [...setPerInstanceProperties(nextProps.data)]
			}); 
		}

		//Given props.selectedImageIndex, call this._showSelectedImage()
		//FIXME: this will be a problem if props.selectedImageIndex is set at the same time as, or before, props.data
		//because state.instances is set asynchromously
		if(selectedImageIndex){
			this._showSelectedImage(selectedImageIndex);
		}else if(this.props.selectedImageIndex){
			this._hideSelectedImage(this.props.selectedImageIndex);
		}

	}

	shouldComponentUpdate(nextProps, nextState){

		//Only update if props.width or props.height change, or this.state.instances changes
		//Otherwise, skip re-render, and handle prop changes in the Three.js environment (via componentWillReceiveProps)
		if(this.props.width !== nextProps.width 
			|| this.props.height !== nextProps.height
			|| this.state.instances !== nextState.instances){
			return true;
		}else{
			return false;
		}

	}

	componentDidUpdate(prevProps, prevState){

		//Component is updated only after changes to props.width, props.height, or state.instances (re-layout)
		const {width,height,data,cameraPosition,sceneId} = this.props;

		//Assume width and height are changed
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);
		this.pickingTexture.setSize(width,height);

		//Assume this.state.instances changed (re-layout or data injection)
		if(this.state.instances.length !== prevState.instances.length){
			this._initMeshes();
		}else{
			this._updateMeshes();
		}

	}

	onMouseMove(e){

		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y);

		//Set transform matrix and texture-related attribute values for this.meshes.target
		if(this.state.instances && this.state.instances[index]){
			this._updateTransformMatrices(this.meshes.target, this.state.instances[index].transformMatrixSign, this.state.instances[index].transformMatrixSign, 0);
			
			const {instanceTexUvOffset, instanceTexUvSize} = this.meshes.target.geometry.attributes;
			instanceTexUvOffset.setXY(0, ...this.state.instances[index].textureUvOffset);
			instanceTexUvSize.setXY(0, ...this.state.instances[index].textureUvSize);
			instanceTexUvOffset.needsUpdate = true;
			instanceTexUvSize.needsUpdate = true;
		}

		//Slightly re-orient this.meshes.pickedTarget
		const {width,height} = this.props;
		const offsetX = x/width*2-1,
			offsetY = 1-y/height*2;
		this.meshes.pickedTarget.material.uniforms.uOrientation.value = new THREE.Vector4(offsetX/5, offsetY/5, 1.0, 0.0).normalize();

	}

	onClick(e){

		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y);
		if(this.state.instances && this.state.instances[index]){
			this.props.handleSelect(index);
		}

	}

	_initStaticMeshes(){

		//TARGET
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);

		const targetGeometry = new THREE.InstancedBufferGeometry();
		targetGeometry.addAttribute('position',vertices);
		targetGeometry.addAttribute('uv',uv);
		targetGeometry.addAttribute('instanceTexUvOffset', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		targetGeometry.addAttribute('instanceTexUvSize', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		this._initTransformMatrixAttrib(targetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const targetMaterial = this.material.clone();
		targetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0,0.0,0.0,1.0);
		targetMaterial.uniforms.uFogFactor.value = 0;
		targetMaterial.uniforms.uUseTexture.value = true;

		this.meshes.target = new THREE.Mesh(targetGeometry,targetMaterial);
		this.scene.add(this.meshes.target);


		//PICKED TARGET
		const pickedTargetGeometry = new THREE.InstancedBufferGeometry();
		pickedTargetGeometry.addAttribute('position',vertices);
		pickedTargetGeometry.addAttribute('uv',uv);
		pickedTargetGeometry.addAttribute('instanceTexUvOffset', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		pickedTargetGeometry.addAttribute('instanceTexUvSize', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		this._initTransformMatrixAttrib(pickedTargetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const pickedTargetMaterial = targetMaterial.clone();
		pickedTargetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0, 1.0, 1.0, 1.0);
		pickedTargetMaterial.uniforms.uUseOrientation.value = true;

		this.meshes.pickedTarget = new THREE.Mesh(pickedTargetGeometry,pickedTargetMaterial);
		this.scene.add(this.meshes.pickedTarget);


		//HEMISPHERE LIGHT
		const hemisphereGeometry = new THREE.SphereBufferGeometry(this.state.R*5);
		const hemisphereMaterial = new THREE.ShaderMaterial({
			side:THREE.DoubleSide,
			vertexShader:hemisphereVs,
			fragmentShader:hemisphereFs,
			blending: THREE.AdditiveBlending
		});
		this.meshes.hemisphere = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
		this.scene.add(this.meshes.hemisphere);


		//Set up tweening of picked signs
		this.tween.transform
			.onUpdate(v=>{
				this.meshes.pickedTarget.material.uniforms.uInterpolateTransform.value = v;
			});

	}

	_initMeshes(){

		const {instances} = this.state;
		const COUNT = instances.length;

		//Map this.props.sprite to this.meshes.pickedTarget
		this.meshes.pickedTarget.material.uniforms.map.value = this.props.sprite;

		//Initialize per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array(arrowVerticesArray),3);
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceTexUvOffset = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);
		const instanceTexUvSize = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);
		

		//GEOMETRY, MATERIAL & MESH: SIGNS
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('uv',uv);
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceTexUvOffset', instanceTexUvOffset);
		geometry.addAttribute('instanceTexUvSize', instanceTexUvSize);
		this._initTransformMatrixAttrib(geometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		let material = this.material.clone();
		material.uniforms.uUseTexture.value = true;
		material.uniforms.map.value = this.props.sprite; //this.texture;
		material.uniforms.uFogFactor.value = .000003;
		//material.blending = THREE.AdditiveBlending;
		//Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);


		//GEOMETRY, MATERIAL & MESH: ARROWS
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceColor', instanceColors);
		this._initTransformMatrixAttrib(arrowsGeometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		material = this.material.clone();
		material.uniforms.uColor.value = new THREE.Vector4(237/255,12/255,110/255,1.0);
		material.uniforms.uFogFactor.value = 0.000005;
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
			const {pickingColor, transformMatrixSign, transformMatrixArrow, textureUvOffset, textureUvSize} = instances[i];

			this._updateTransformMatrices(this.meshes.signs, transformMatrixSign, transformMatrixSign, i);
			this._updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, transformMatrixArrow, i);
			instanceColors.setXYZW(i, pickingColor.r, pickingColor.g, pickingColor.b, 1.0);
			instanceTexUvOffset.setXY(i, ...textureUvOffset);
			instanceTexUvSize.setXY(i, ...textureUvSize);
		}
		instanceColors.needsUpdate = true;
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;


		//Set up tween
		this.tween.updateMeshes
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uInterpolateTransform.value = v;
				this.meshes.arrows.material.uniforms.uInterpolateTransform.value = v;
				this.meshes.signsPicking.material.uniforms.uInterpolateTransform.value = v;
			});

	}

	_updateMeshes(){

		//Called when this.state.instances is updated, 
		const {instances} = this.state;
		const COUNT = instances.length;

		//Populate attributes with value
		for(let i=0; i<COUNT; i++){
			const {pickingColor, transformMatrixSign, transformMatrixArrow} = instances[i];

			this._updateTransformMatrices(this.meshes.signs, null, transformMatrixSign, i);
			this._updateTransformMatrices(this.meshes.arrows, null, transformMatrixArrow, i);
		}

		this.tween.updateMeshes
			.start()
			.onComplete(()=>{
				for(let i=0; i<COUNT; i++){
					const {transformMatrixSign, transformMatrixArrow} = instances[i];

					this._updateTransformMatrices(this.meshes.signs, transformMatrixSign, null, i);
					this._updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, null, i);
				}
			});
	}

	_showSelectedImage(index){
		
		if(!this.state.instances[index]) return;

		const _instance = this.state.instances[index];

		//Given instance, calculate its current (world) transform matrix and target transform matrix
		//Transform matrix m0
		const m0 = _instance.transformMatrixSign.clone();
		m0.premultiply(new THREE.Matrix4().makeRotationFromEuler(this.meshes.target.rotation));

		//Transform matrix m1
		const p = new THREE.Vector3(0, 0, -45),
			r = new THREE.Quaternion(),
			s = new THREE.Vector3(); //Store decomposed matrix4
		_instance.transformMatrixSign.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
		this.camera.matrixWorld.decompose(new THREE.Vector3(), r, new THREE.Vector3());
		this.camera.localToWorld(p);
		const m1 = new THREE.Matrix4().compose(p, r, s);
		//Flip along x axis
		m1.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0,Math.PI,0)));

		const pickedTarget = this.meshes.pickedTarget;
		pickedTarget.material.uniforms.map.value = this.props.sprite;

		//Update attribute for this.meshes.pickedTarget, move it in front of the camera
		this._updateTransformMatrices(pickedTarget, m0, m1, 0);
		const {instanceTexUvOffset, instanceTexUvSize} = pickedTarget.geometry.attributes;
		instanceTexUvOffset.setXY(0, ..._instance.textureUvOffset);
		instanceTexUvSize.setXY(0, ..._instance.textureUvSize);
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;

		//Load high-res texture for pickedTarget
		this.pickedTargetTexture.load(`https://s3.us-east-2.amazonaws.com/artofthemarch/med_res/${_instance.id}`, (timestamp => {

			pickedTarget.timestamp = timestamp; //timestamp of the last request

			return texture => {
				//Loaded texture is from an outdated request...
				if(timestamp < pickedTarget.timestamp) return;

				//Texture fully loaded
				texture.generateMipmaps = false;
				texture.minFilter = THREE.LinearFilter;

				instanceTexUvOffset.setXY(0, 0, 0);
				instanceTexUvSize.setXY(0, 1, 1);
				instanceTexUvOffset.needsUpdate = true;
				instanceTexUvSize.needsUpdate = true;
				pickedTarget.material.uniforms.map.value = texture;
			}})(Date.now()), xhr => {
				//Progress callback, no op
			}, xhr => {
				console.log(`Texture for image ${_instance.id} not loaded`); //FIXME: remove in production
			});

		this.tween.transform
			.onComplete(()=>{
				this._updateTransformMatrices(pickedTarget, m1, null, 0);
			})
			.start()
	}

	_hideSelectedImage(index){

		//Hide this.meshes.pickedTarget		
		const _instance = this.state.instances[index];
		const s = new THREE.Vector3();
		_instance.transformMatrixSign.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
		const m1 = new THREE.Matrix4().compose(new THREE.Vector3(0,0,4000), new THREE.Quaternion(), s);

		const pickedTarget = this.meshes.pickedTarget;
		this._updateTransformMatrices(pickedTarget, null, m1, 0);

		this.tween.transform.start();

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

		console.log('GLWrapper:render');
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
	data:[],
	sceneId:null
};

export default GLWrapper;