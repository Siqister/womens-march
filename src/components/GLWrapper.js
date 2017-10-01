import React, {Component} from 'react';
import * as THREE from 'three';
const OrbitControls = require('three-orbitcontrols');
const TWEEN = require('tween.js');

import {WheelLayout, TileLayout, SphereLayout, signVerticesArray, signNormalsArray, signUvArray, arrowVerticesArray} from '../utils/utils';
import * as glUtils from '../utils/gl_utils';
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
			light: [500,700,50],

			//Controls spatial distribution of the signs
			X:0,
			X_WIGGLE:100, 
			R:450,
			R_WIGGLE:30,

			//Per instance data, initial transform mat4, target transform mat4
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
			pickedTarget:null,
			hemisphere:null
		}
		this.material = null;
		this.pickedTargetTexture = new THREE.TextureLoader();
		this.pickedTargetTexture.crossOrigin = '';

		//Previous mouse client location
		this.prevX = null;
		this.prevY = null;

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
		this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
		this.renderer.setClearColor(rendererClearcolor, 0);
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
				uUseLighting:{value:false},
				uOrientation:{value:new THREE.Vector4(0.0,0.0,1.0,0.0)},
				uLightSourcePosition:{value:new THREE.Vector3(...this.state.light)},
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
			}); //Tweens camera position 
		this.tween.updatePickedTarget = new TWEEN.Tween({x:0})
			.to({x:1}, 500)
			.easing(TWEEN.Easing.Cubic.Out); //Tweens meshes.pickedTarget
		this.tween.updateMeshes = new TWEEN.Tween({x:0})
			.to({x:1}, 2000)
			.easing(TWEEN.Easing.Cubic.InOut); //Tweens meshes.signs, meshes.arrows, meshes.signsPicking
		this.tween.fog = new TWEEN.Tween({x:0})
			.to({x:1},500)
			.easing(TWEEN.Easing.Cubic.InOut); //Tweens fog
		this.tween.foo = new TWEEN.Tween(); //Placeholder tween, no op

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
		//Re-orient camera
		if(this.props.sceneId !== sceneId){
			this.tween.camera
				.to({ x : cameraPosition[0], y : cameraPosition[1], z : cameraPosition[2]}, 2000)
				.start();
		}

		//If props.sceneId changes (which implies layout change), or
		//if props.data.length changes (e.g. initial data injection)
		//Layout data again
		if(this.props.sceneId !== sceneId || nextProps.data.length !== this.props.data.length){

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
		//FIXME: circular calling of this._showSelectedImage
		if(selectedImageIndex){
			if(selectedImageIndex === this.props.selectedImageIndex) return; 
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

		//Respond to changes to this.state.instances
		if(this.state.instances.length !== prevState.instances.length){
			//Initial data injection
			this._initMeshes();
		}else{
			//Relayout
			this._updateMeshes();
		}

	}

	onMouseMove(e){

		const {width,height} = this.props;
		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y); //use current e.clientX / e.clientY to select index of image

		//Set transform matrix and texture-related attribute values for this.meshes.target
		if(this.state.instances && this.state.instances[index]){
			
			glUtils.updateTransformMatrices(this.meshes.target, this.state.instances[index].transformMatrixSign, this.state.instances[index].transformMatrixSign, 0);
			
			const {instanceTexUvOffset, instanceTexUvSize} = this.meshes.target.geometry.attributes;
			instanceTexUvOffset.setXY(0, ...this.state.instances[index].textureUvOffset);
			instanceTexUvSize.setXY(0, ...this.state.instances[index].textureUvSize);
			instanceTexUvOffset.needsUpdate = true;
			instanceTexUvSize.needsUpdate = true;
		}

		//Slightly re-orient this.meshes.pickedTarget
		if(this.prevX && this.prevY){
			const offsetX = (x-this.prevX)/width,
				offsetY = -(y-this.prevY)/height;
			this.meshes.pickedTarget.material.uniforms.uOrientation.value = new THREE.Vector4(offsetX, offsetY, 1.0, 0.0).normalize();
		
			this.prevX = x;
			this.prevY = y;
		}else{
			this.prevX = x;
			this.prevY = y;
		}

	}

	onClick(e){

		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y);
		if(this.state.instances && this.state.instances[index]){
			this.props.onSelect(index);
		}

	}

	_initStaticMeshes(){

		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const normals = new THREE.BufferAttribute(new Float32Array(signNormalsArray),3);

		//TARGET
		const targetGeometry = new THREE.InstancedBufferGeometry();
		targetGeometry.addAttribute('position',vertices);
		targetGeometry.addAttribute('uv',uv);
		targetGeometry.addAttribute('instanceTexUvOffset', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		targetGeometry.addAttribute('instanceTexUvSize', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		glUtils.initTransformMatrixAttrib(targetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const targetMaterial = this.material.clone();
		targetMaterial.uniforms.uColor.value = new THREE.Vector4(.6,.6,.6,1.0);
		targetMaterial.uniforms.uFogFactor.value = 0;
		targetMaterial.uniforms.uUseTexture.value = true;

		this.meshes.target = new THREE.Mesh(targetGeometry,targetMaterial);
		this.scene.add(this.meshes.target);


		//PICKED TARGET
		const pickedTargetGeometry = new THREE.InstancedBufferGeometry();
		pickedTargetGeometry.addAttribute('position',vertices);
		pickedTargetGeometry.addAttribute('uv',uv);
		pickedTargetGeometry.addAttribute('normal', normals);
		pickedTargetGeometry.addAttribute('instanceTexUvOffset', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		pickedTargetGeometry.addAttribute('instanceTexUvSize', new THREE.InstancedBufferAttribute(new Float32Array(2),2,1));
		glUtils.initTransformMatrixAttrib(pickedTargetGeometry,1); //Initialize per instance transform mat4 instancedBufferAttribute

		const pickedTargetMaterial = targetMaterial.clone();
		pickedTargetMaterial.uniforms.uColor.value = new THREE.Vector4(1.0, 1.0, 1.0, 1.0);
		pickedTargetMaterial.uniforms.uUseOrientation.value = true;

		this.meshes.pickedTarget = new THREE.Mesh(pickedTargetGeometry,pickedTargetMaterial);
		this.scene.add(this.meshes.pickedTarget);


		//HEMISPHERE LIGHT
		// const hemisphereGeometry = new THREE.SphereBufferGeometry(this.state.R*5);
		// const hemisphereMaterial = new THREE.ShaderMaterial({
		// 	side:THREE.DoubleSide,
		// 	vertexShader:hemisphereVs,
		// 	fragmentShader:hemisphereFs,
		// 	blending: THREE.AdditiveBlending
		// });
		// this.meshes.hemisphere = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
		// this.scene.add(this.meshes.hemisphere);


		//Set up tweening of picked signs
		this.tween.updatePickedTarget
			.onUpdate(v=>{
				this.meshes.pickedTarget.material.uniforms.uInterpolateTransform.value = v;
			});

	}

	_initMeshes(){

		//Called when this.state.instances is initially populated and this.props.sprite is initially available

		const {instances, light} = this.state;
		const COUNT = instances.length;

		//Map this.props.sprite to this.meshes.pickedTarget
		this.meshes.pickedTarget.material.uniforms.map.value = this.props.sprite;
		this.meshes.target.material.uniforms.map.value = this.props.sprite;

		//Initialize per vertex BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const normals = new THREE.BufferAttribute(new Float32Array(signNormalsArray), 3);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array(arrowVerticesArray),3);
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceTexUvOffset = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);
		const instanceTexUvSize = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);
		

		//GEOMETRY, MATERIAL & MESH: SIGNS
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('uv', uv);
		geometry.addAttribute('normal', normals)
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceTexUvOffset', instanceTexUvOffset);
		geometry.addAttribute('instanceTexUvSize', instanceTexUvSize);
		glUtils.initTransformMatrixAttrib(geometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		let material = this.material.clone();
		material.uniforms.uUseTexture.value = true;
		material.uniforms.map.value = this.props.sprite; //this.texture;
		material.uniforms.uFogFactor.value = .000003;
		material.uniforms.uUseLighting.value = true;
		//material.blending = THREE.AdditiveBlending;
		//Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);


		//GEOMETRY, MATERIAL & MESH: ARROWS
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceColor', instanceColors);
		glUtils.initTransformMatrixAttrib(arrowsGeometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		material = this.material.clone();
		material.uniforms.uColor.value = new THREE.Vector4(237/255,12/255,110/255,1.0);
		material.uniforms.uFogFactor.value = 0.000005;
		material.blending = THREE.AdditiveBlending;
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

			glUtils.updateTransformMatrices(this.meshes.signs, transformMatrixSign, transformMatrixSign, i);
			glUtils.updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, transformMatrixArrow, i);
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

			glUtils.updateTransformMatrices(this.meshes.signs, null, transformMatrixSign, i);
			glUtils.updateTransformMatrices(this.meshes.arrows, null, transformMatrixArrow, i);
		}

		this.tween.updateMeshes
			.start()
			.onComplete(()=>{
				for(let i=0; i<COUNT; i++){
					const {transformMatrixSign, transformMatrixArrow} = instances[i];

					glUtils.updateTransformMatrices(this.meshes.signs, transformMatrixSign, null, i);
					glUtils.updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, null, i);
				}
			});
	}

	_showSelectedImage(index){

		if(!this.state.instances[index]) return;

		const _instance = this.state.instances[index];

		//this.meshes.pickedTarget: texture
		//Reset texture uniform of pickedTarget back to large sprite...
		const pickedTarget = this.meshes.pickedTarget;
		pickedTarget.visible = false;

		pickedTarget.material.uniforms.map.value = this.props.sprite;
		const {instanceTexUvOffset, instanceTexUvSize} = pickedTarget.geometry.attributes;
		instanceTexUvOffset.setXY(0, ..._instance.textureUvOffset);
		instanceTexUvSize.setXY(0, ..._instance.textureUvSize);
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;
		//...then immediately start requesting high-res texture
		this.props.onTextureLoadStart();
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

				this.props.onTextureLoadEnd();

			}})(Date.now()), xhr => {
				//Progress callback, no op
			}, xhr => {
				this.props.onTextureLoadEnd();
				console.error(new Error(`Texture for image ${_instance.id} not loaded`)); //FIXME: remove in production
			});


		//Move camera in place, and move this.meshes.pickedSign in front of camera
		//Step 1: determine location for camera
		let m0, m1; //m0: original (world) transform matrix for pickedSign, m1: final world transform matrix for pickedSign
		
		m0 = _instance.transformMatrixSign.clone();
		m0.premultiply(new THREE.Matrix4().makeRotationFromEuler(this.meshes.target.rotation));
		const p0 = new THREE.Vector3();
		m0.decompose(p0, new THREE.Quaternion(), new THREE.Vector3());

		//Step 3: tween this.meshes.pickedTarget in place
		this.tween.updatePickedTarget
			.onComplete(()=>{
				glUtils.updateTransformMatrices(pickedTarget, m1, null, 0);
			})
			.stop();

		//Step 2: tween camera
		//At completion, set the initial and target transform matrices for this.meshes.pickedTarget
		//and initiate tweening
		this.tween.camera
			.to({x:p0.x*2, y:p0.y*2, z:p0.z*2}, 1000)
			.onComplete(()=>{

				//Work out m0
				m0 = _instance.transformMatrixSign.clone();
				m0.premultiply(new THREE.Matrix4().makeRotationFromEuler(this.meshes.target.rotation));

				//Work out m1
				const p1 = new THREE.Vector3(0, 0, -35),
					r1 = new THREE.Quaternion(),
					s1 = new THREE.Vector3(); //Store decomposed matrix4
				_instance.transformMatrixSign.decompose(new THREE.Vector3(), new THREE.Quaternion(), s1);
				this.camera.matrixWorld.decompose(new THREE.Vector3(), r1, new THREE.Vector3());
				this.camera.localToWorld(p1);
				m1 = new THREE.Matrix4().compose(p1, r1, s1);
				m1.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0,Math.PI,0))); //Flip along x

				//Update m0 and m1 attribute for pickedTarget
				glUtils.updateTransformMatrices(pickedTarget, m0, m1, 0);
				pickedTarget.visible = true;

			})
			.chain(this.tween.updatePickedTarget)
			.start();


		//Move this.meshes.target in place
		const target = this.meshes.target;
		glUtils.updateTransformMatrices(target, _instance.transformMatrixSign, null, 0);
		target.geometry.attributes.instanceTexUvOffset.setXY(0, ..._instance.textureUvOffset);
		target.geometry.attributes.instanceTexUvSize.setXY(0, ..._instance.textureUvSize);
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;


		//Increase uFogFactor (fade background)
		const currentFogFactor = this.meshes.signs.material.uniforms.uFogFactor.value;
		this.tween.fog
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uFogFactor.value = v*0.00003 + (1-v)*currentFogFactor;
			})
			.start();

	}

	_hideSelectedImage(index){

		//Hide this.meshes.pickedTarget		
		const _instance = this.state.instances[index];
		const s1 = new THREE.Vector3();
		const r1 = new THREE.Quaternion();
		const p1 = new THREE.Vector3(20,20,5);
		_instance.transformMatrixSign.decompose(new THREE.Vector3(), new THREE.Quaternion(), s1);
		this.camera.matrixWorld.decompose(new THREE.Vector3(), r1, new THREE.Vector3());
		this.camera.localToWorld(p1);
		const m1 = new THREE.Matrix4().compose(p1, r1, s1);
		m1.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0,Math.PI,0))); //Flip along x

		const pickedTarget = this.meshes.pickedTarget;
		glUtils.updateTransformMatrices(pickedTarget, null, m1, 0);
		this.tween.updatePickedTarget.stop().start();

		//Transform camera back to where it started
		const {cameraPosition} = this.props;
		this.tween.camera
			.to({x: cameraPosition[0], y: cameraPosition[1], z: cameraPosition[2]}, 2000)
			.chain(this.tween.foo) //No op
			.onComplete(()=>{ /* No op */})
			.start();

		//Decrease uFogFactor 
		const currentFogFactor = this.meshes.signs.material.uniforms.uFogFactor.value;
		this.tween.fog
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uFogFactor.value = v*0.000003 + (1-v)*currentFogFactor;
			})
			.start();

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
					width, height,
					top:0,
					zIndex:-998
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