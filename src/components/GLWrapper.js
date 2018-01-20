import React, {Component} from 'react';
import * as THREE from 'three';
const OrbitControls = require('three-orbitcontrols');
const TWEEN = require('tween.js');

import GLOverlay from './GLOverlay';

import {signVerticesArray, signNormalsArray, signUvArray, arrowVerticesArray} from '../utils/utils';
import {WheelLayout, SphereLayout, SphereClusterLayout, PrecomputedLayout} from '../utils/layout/index';
import * as glUtils from '../utils/gl_utils';
import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';

class GLWrapper extends Component{

	constructor(props){

		super(props);

		this._animate = this._animate.bind(this);
		this._initStaticMeshes = this._initStaticMeshes.bind(this);
		this._initMeshes = this._initMeshes.bind(this);
		this._updateMeshes = this._updateMeshes.bind(this);
		this._showSelectedImage = this._showSelectedImage.bind(this);
		this._hideSelectedImage = this._hideSelectedImage.bind(this);
		this._setTarget = this._setTarget.bind(this);
		this._pick = this._pick.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onClick = this.onClick.bind(this);

		this.state = {

			//GL animation state
			cameraLookAt: [0,0,0],
			cameraUp: [.5,1,0],
			speed:0, //.001, //Rotational speed
			light: [500,700,50],

			//Controls spatial distribution of the signs
			X:0,
			X_WIGGLE:100, 
			R:450,
			R_WIGGLE:30,

			//Per-instance data for each sign, contains:
			// - transform mat4 for sign
			// - transform mat4 for arrows
			// - id
			// - zero-based index
			// - texture uv offset
			// - picking color based on zero-based index
			//is recomputed on scene/layout change and initial data injection
			instances:[],

			dragging:false,
			cameraTransitioning:false,

			fogFactor:0.000002 //fogFactor uniform for this.meshes.sign
		};

		//GL state
		//Not part of this.state, as it will trigger too many calls to shouldComponentUpdate
		this.rotation = 0;

		//Shared GL assets
		this.camera = null;
		this.renderer = null;
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
		this.ambientLight = new THREE.Vector4(...props.scene.ambientLight);

		//Cancellation token used to reject layout Promise
		this.cancelToken = {};

	}

	componentDidMount(){

		const {width,height,data,scene} = this.props;
		const {cameraLookAt} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(60, width/height, 0.5, 4000);
		this.camera.position.set(...scene.cameraPosition);
		this.camera.lookAt(new THREE.Vector3(...cameraLookAt));
		this.camera.zoom = 1;
		this.camera.up = new THREE.Vector3(...this.state.cameraUp).normalize(); //TODO: turn into a prop

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
		this.renderer.setClearColor(0xeeeeee, 0);
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
				//fog, color, and light
				uFogFactor:{value:0.000004},
				uColor:{value: new THREE.Vector4(1.0,1.0,1.0,1.0)},
				uLightSourcePosition:{value:new THREE.Vector3(...this.state.light)},
				uAmbientLight:{value:this.ambientLight},
				uDirectionalLight:{value: new THREE.Vector4(.9, .9, 1.0, 1.0)},
				//orientation
				uOrientation:{value:new THREE.Vector4(0.0,0.0,1.0,0.0)},
				//boolean flags to determine how vertices are treated
				uUsePerInstanceColor:{value:false},
				uUseFogAtten:{value:true},
				uUseTexture:{value:false},
				uUseOrientation:{value:false},
				uUseLighting:{value:false},
				uUseHighlight:{value:false}, //differentiate between highlighted and unhighlighted signs
				//sprite
				map:{value:null},
				//for interpolating between source and target attribute values
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
			.onStart(()=>{
				//this.setState({cameraTransitioning:true}); //hide overlay at the start
			})
			.onUpdate(()=>{
				this.camera.lookAt(new THREE.Vector3(...cameraLookAt)); //Tweens camera position 
			})
			.onComplete(()=>{
				//this.setState({cameraTransitioning:false});
			});
		this.tween.updatePickedTarget = new TWEEN.Tween({x:0})
			.to({x:1}, 500)
			.easing(TWEEN.Easing.Cubic.Out); //Tweens meshes.pickedTarget
		this.tween.updateMeshes = new TWEEN.Tween({x:0})
			.to({x:1}, 1000)
			.easing(TWEEN.Easing.Cubic.InOut); //Tweens meshes.signs, meshes.arrows, meshes.signsPicking
		this.tween.ambientLight = new TWEEN.Tween(this.ambientLight);
		this.tween.fog = new TWEEN.Tween({x:0})
			.to({x:1},500)
			.easing(TWEEN.Easing.Cubic.InOut); //Tweens fog
		this.tween.foo = new TWEEN.Tween(); //Placeholder tween, no-op

		//Init static meshes and start animation loop
		this._initStaticMeshes();
		this._animate();		

	}

	componentWillReceiveProps(nextProps){

		const {data,
			imagesToHighlight,
			sprite,
			sceneId,
			scene } = nextProps;

		if(sprite){
			sprite.flipY = false; //FIXME: shouldn't mutate incoming props.sprite
		}

		//On scene change, restore to scene defaults: scene.cameraPosition, scene.ambientLight, scene.speed
		if(this.props.scene !== scene){
			this.tween.camera
				.to({ x : scene.cameraPosition[0], y : scene.cameraPosition[1], z : scene.cameraPosition[2]}, 2000)
				.start();

			if(this.meshes.signs){
				const l = scene.ambientLight;
				this.tween.ambientLight
					.to({x:l[0], y:l[1], z:l[2], w:l[3]}, 3000)
					.onUpdate(()=>{ this.meshes.signs.material.uniforms.uAmbientLight.value = this.ambientLight })
					.start();
			}

			this.setState({
				speed:typeof(scene.speed)==='undefined'?0:scene.speed,
				fogFactor:typeof(scene.fogFactor)==='undefined'?0.000002:scene.fogFactor
			});
		}

		//On scene change or initial data injection, recompute per-instance transform for each sign again
		if(this.props.scene !== scene 
			|| data.length !== this.props.data.length
			|| imagesToHighlight !== this.props.imagesToHighlight
		){

			let setPerInstanceProperties;

			const wheelLayout = new WheelLayout()
				.setX(this.state.X)
				.setXStdDev(this.state.X_WIGGLE)
				.setR(this.state.R)
				.setRStdDev(this.state.R_WIGGLE)
				.setGroupByAccessor(scene.layoutGroupBy);

			const sphereLayout = new SphereLayout()
				.setR(this.state.R);

			// const sphereClusterLayout = new SphereClusterLayout()
			// 	.setR(this.state.R*1.2)
			// 	.setGroupByAccessor(scene.layoutGroupBy);

			const tsneLayout = new PrecomputedLayout()
				.setR(this.state.R*3)
				.setDataSource(scene.dataSource);

			switch(scene.layout){
				case 'wheel':
					setPerInstanceProperties = wheelLayout.compute;
					break;
				case 'sphere':
					setPerInstanceProperties = sphereLayout.compute;
					break;
				// case 'sphereCluster':
				// 	setPerInstanceProperties = sphereClusterLayout.compute;
				// 	break;
				case 'tsne':
					setPerInstanceProperties = tsneLayout.compute;
					break;
				default:
					setPerInstanceProperties = sphereLayout.compute;
			}

			//Cancel any existing layout computation
			if(this.cancelToken.cancel){
				this.cancelToken.cancel();
			}
			this.props.onLayoutStart();
			//Compute a new layout, return a promise that is either immediately resolved
			//or resolved later (if sphereClusterLayout)
			Promise.resolve(setPerInstanceProperties(data, imagesToHighlight, this.cancelToken))
				.then(instances => {
					this.props.onLayoutEnd();
					this.setState({instances});
				}, err => {
					console.log(err);
					console.log('Layout is overriden and cancelled');
					this.props.onLayoutEnd();
				});

		}

	}

	shouldComponentUpdate(nextProps, nextState){

		//Otherwise, skip re-render, and handle prop changes in the Three.js environment (via componentWillReceiveProps)
		if(this.props.width !== nextProps.width 
			|| this.props.height !== nextProps.height
			|| this.state.instances !== nextState.instances
			|| this.state.dragging !== nextState.dragging
			|| this.state.cameraTransitioning !== nextState.cameraTransitioning
			|| this.props.selectedImageId !== nextProps.selectedImageId
			|| this.props.scene !== nextProps.scene
		){

			//DEBUG
			// console.group('GLWrapper:shouldComponentUpdate');
			// if(this.props.width !== nextProps.width) console.log('Width changed');
			// if(this.props.height !== nextProps.height) console.log('Height changed');
			// if(this.state.instances !== nextState.instances) console.log('Instances changed');
			// if(this.state.dragging !== nextState.dragging) console.log('dragging changed');
			// if(this.props.selectedImageId !== nextProps.selectedImageId) console.log('selectedImageId changed');
			// if(this.props.scene !== nextProps.scene) console.log('scene changed');
			// console.groupEnd();

			return true;
		}else{
			return false;
		}

	}

	componentDidUpdate(prevProps, prevState){

		const {width, height, selectedImageId} = this.props;

		//Given new props.width and props.height, update camera and off-camera texture
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);
		this.pickingTexture.setSize(width,height);

		//Given new state.instances, either initialize or update the dynamic meshes
		if(this.state.instances.length !== prevState.instances.length){
			//Initial data injection
			this._initMeshes();
		}else if(this.meshes.signs){
			//Relayout
			this._updateMeshes();
		}

		//Show or hide selected image based on props.selectedImageId and state.instances
		//TODO: dragging state change should trigger this._showSelectedImage
		if(selectedImageId){
			if(selectedImageId !== prevProps.selectedImageId 
				|| this.state.instances !== prevState.instances
				//|| this.state.dragging !== prevState.dragging
			){
				this._showSelectedImage(selectedImageId);
			}
		}else if(prevProps.selectedImageId){
			this._hideSelectedImage(prevProps.selectedImageId);
		}

	}

	onMouseMove(e){

		const {width,height} = this.props;
		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y); //use current e.clientX / e.clientY to select index of image

		//Set transform matrix and texture-related attribute values for this.meshes.target
		this._setTarget(index);

		//Slightly re-orient this.meshes.pickedTarget
		this.meshes.pickedTarget.material.uniforms.uOrientation.value = new THREE.Vector4(
				(x/width-.5)/2,
				(y/height-.5)/2,
				1.0,
				0.0
			).normalize();

		//Slightly move light source

	}

	onMouseDown(e){

		//Dragging starts
		this.setState({dragging:true});

	}

	onMouseUp(e){

		if(this.props.scene.layout === 'tsne'){
			//pre-computed tsne layout; signs will need to individually reoriented towards camera
			//Two transformations required to face camera: counter-balance rotations to this.meshes.signs & make it face camera
			const rotationInverse = new THREE.Matrix4().getInverse(new THREE.Matrix4().makeRotationFromEuler(this.meshes.signs.rotation));
			const cameraRotation = new THREE.Matrix4().extractRotation(this.camera.matrixWorld);
			const faceCamera = cameraRotation.premultiply(rotationInverse);

			const instances = this.state.instances.map(instance => {
				return Object.assign({}, instance, {
					transformMatrixSign:(instance._transformMatrixSign.clone()).multiply(faceCamera),
					transformMatrixArrow:(instance._transformMatrixArrow.clone()).multiply(faceCamera)
				});
			});

			this.setState({
				dragging:false,
				instances
			});
		}else{
			//Dragging ends
			this.setState({dragging:false});
		}

	}

	onClick(e){

		const x = e.clientX, y = e.clientY;
		const index = this._pick(x,y);
		if(this.state.instances[index] && index){
			this.props.onSelect(this.state.instances[index].id);
			this._setTarget(index);
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

		//Initialize dynamic meshes (sign and arrow)
		const {instances, light, fogFactor} = this.state;
		const COUNT = instances.length;

		//Map this.props.sprite to this.meshes.pickedTarget
		this.meshes.pickedTarget.material.uniforms.map.value = this.props.sprite;
		this.meshes.target.material.uniforms.map.value = this.props.sprite;

		//Initialize BufferAttribute
		const vertices = new THREE.BufferAttribute(new Float32Array(signVerticesArray),3);
		const uv = new THREE.BufferAttribute(new Float32Array(signUvArray),2);
		const normals = new THREE.BufferAttribute(new Float32Array(signNormalsArray), 3);
		const arrowVertices = new THREE.BufferAttribute(new Float32Array(arrowVerticesArray),3);
		const arrowInstanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceTexUvOffset = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);
		const instanceTexUvSize = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*2),2,1);

		const instanceHighlightBool0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT),1,1);
		const instanceHighlightBool1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT),1,1);
		

		//---this.meshes.signs---
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('uv', uv);
		geometry.addAttribute('normal', normals)
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceTexUvOffset', instanceTexUvOffset);
		geometry.addAttribute('instanceTexUvSize', instanceTexUvSize);
		geometry.addAttribute('instanceHighlightBool0', instanceHighlightBool0);
		geometry.addAttribute('instanceHighlightBool1', instanceHighlightBool1);
		glUtils.initTransformMatrixAttrib(geometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		let material = this.material.clone();
		material.uniforms.uUseTexture.value = true;
		material.uniforms.map.value = this.props.sprite; //this.texture;
		material.uniforms.uFogFactor.value = fogFactor;
		material.uniforms.uUseLighting.value = true;
		material.uniforms.uUseHighlight.value = true;
		//material.blending = THREE.AdditiveBlending;
		//Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);


		//---this.meshes.arrows---
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceColor', arrowInstanceColors);
		glUtils.initTransformMatrixAttrib(arrowsGeometry, COUNT); //Initialize per instance transform mat4 instancedBufferAttribute
		//RawShaderMaterial
		material = this.material.clone();
		material.uniforms.uFogFactor.value = 0.000005;
		material.uniforms.uUseFogAtten.value = false;
		material.uniforms.uUsePerInstanceColor.value = true;
		material.blending = THREE.AdditiveBlending;
		//Mesh
		this.meshes.arrows = new THREE.Mesh(arrowsGeometry,material);
		

		//---this.meshes.signsPicking---
		material = this.material.clone();
		material.uniforms.uUsePerInstanceColor.value = true;
		material.uniforms.uUseFogAtten.value = false;
		this.meshes.signsPicking = new THREE.Mesh(geometry,material);


		//Add meshes to scenes
		this.scene.add(this.meshes.signs);
		this.scene.add(this.meshes.arrows);
		this.pickingScene.add(this.meshes.signsPicking);


		//Populate attributes with value
		for(let i=0; i<COUNT; i++){
			const {pickingColor, arrowColor, transformMatrixSign, transformMatrixArrow, textureUvOffset, textureUvSize, highlight} = instances[i];

			glUtils.updateTransformMatrices(this.meshes.signs, transformMatrixSign, transformMatrixSign, i);
			glUtils.updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, transformMatrixArrow, i);
			instanceColors.setXYZW(i, pickingColor.r, pickingColor.g, pickingColor.b, 1.0);
			instanceTexUvOffset.setXY(i, ...textureUvOffset);
			instanceTexUvSize.setXY(i, ...textureUvSize);
			instanceHighlightBool0.setX(i, highlight);
			instanceHighlightBool1.setX(i, highlight);
			arrowInstanceColors.setXYZW(i, arrowColor.r, arrowColor.g, arrowColor.b, 1.0);
		}
		instanceColors.needsUpdate = true;
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;
		instanceHighlightBool0.needsUpdate = true;
		instanceHighlightBool1.needsUpdate = true;
		arrowInstanceColors.needsUpdate = true;


		//Set up tween
		this.tween.updateMeshes
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uInterpolateTransform.value = v;
				this.meshes.arrows.material.uniforms.uInterpolateTransform.value = v;
				this.meshes.signsPicking.material.uniforms.uInterpolateTransform.value = v;
			});

	}

	_updateMeshes(){

		const {instances,fogFactor} = this.state;
		const COUNT = instances.length;
		const {instanceHighlightBool0, instanceHighlightBool1} = this.meshes.signs.geometry.attributes;
		const arrowInstanceColors = this.meshes.arrows.geometry.attributes.instanceColor;

		//Populate target attribute value
		for(let i=0; i<COUNT; i++){
			const {transformMatrixSign, transformMatrixArrow, highlight, arrowColor, clusterColor:clusterColorValue} = instances[i];

			glUtils.updateTransformMatrices(this.meshes.signs, null, transformMatrixSign, i);
			glUtils.updateTransformMatrices(this.meshes.arrows, null, transformMatrixArrow, i);

			instanceHighlightBool1.setX(i, highlight);
			arrowInstanceColors.setXYZW(i, arrowColor.r, arrowColor.g, arrowColor.b, 1.0);
		}
		instanceHighlightBool1.needsUpdate = true;
		arrowInstanceColors.needsUpdate = true;

		//Interpolate towards target attribute value
		//On completion, update initial attribute value to old target attribute value
		this.tween.updateMeshes
			.start()
			.onComplete(()=>{
				for(let i=0; i<COUNT; i++){
					const {transformMatrixSign, transformMatrixArrow, highlight} = instances[i];

					glUtils.updateTransformMatrices(this.meshes.signs, transformMatrixSign, null, i);
					glUtils.updateTransformMatrices(this.meshes.arrows, transformMatrixArrow, null, i);

					instanceHighlightBool0.setX(i, highlight);

				}
				instanceHighlightBool0.needsUpdate = true;
			});

		const currentFogFactor = this.meshes.signs.material.uniforms.uFogFactor.value;
		this.tween.fog
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uFogFactor.value = v*fogFactor + (1-v)*currentFogFactor;
			})
			.start();
	}

	_showSelectedImage(id){

		const _instance = this.state.instances.filter(v=>v.id===id)[0];
		if(!_instance) return;

		//---this.meshes.pickedTarget---
		//Set texture and tween in front of camera
		this._setTarget(this.state.instances.findIndex(v=>v.id===id));

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
		this.pickedTargetTexture.load(`https://s3.us-east-2.amazonaws.com/artofthemarch/med_res/${_instance.filename}`, (timestamp => {

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
				console.error(new Error(`Texture for image ${_instance.filename} not loaded`)); //FIXME: remove in production
			});


		//Move camera in place, and move this.meshes.pickedSign in front of camera
		//Step 1: determine location for camera
		let m0, m1; //m0: original (world) transform matrix for pickedTarget, m1: final world transform matrix for pickedTarget
		
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

				//On camera tween complete, show overlay again
				//this.setState({cameraTransitioning:false});

			})
			.chain(this.tween.updatePickedTarget)
			.start();


		//---global changes---
		//Increase uFogFactor (fade this.meshes.signs)
		const currentFogFactor = this.meshes.signs.material.uniforms.uFogFactor.value;
		this.tween.fog
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uFogFactor.value = v*0.00004 + (1-v)*currentFogFactor;
			})
			.start();

	}

	_hideSelectedImage(id){

		const _instance = this.state.instances.filter(v=>v.id===id)[0];
		if(!_instance) return;

		const {fogFactor} = this.state;

		//Hide this.meshes.pickedTarget		
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
		const currentCameraPosition = this.camera.position;
		const currentCameraDist = currentCameraPosition.length();
		const targetCameraDist = new THREE.Vector3(...this.props.scene.cameraPosition).length();
		const {x,y,z} = currentCameraPosition;
		this.tween.camera
			.to({
				x: x/currentCameraDist*targetCameraDist, 
				y: y/currentCameraDist*targetCameraDist, 
				z: z/currentCameraDist*targetCameraDist}, 2000)
			.chain(this.tween.foo) //No op
			.onComplete(()=>{
				//this.setState({cameraTransitioning:false});
			})
			.start();

		//Decrease uFogFactor 
		const currentFogFactor = this.meshes.signs.material.uniforms.uFogFactor.value;
		this.tween.fog
			.onUpdate(v=>{
				this.meshes.signs.material.uniforms.uFogFactor.value = v*fogFactor + (1-v)*currentFogFactor;
			})
			.start();

	}

	_pick(x,y){

		this.renderer.render(this.pickingScene, this.camera, this.pickingTexture);
		const pixelBuffer = new Uint8Array(4);
		this.renderer.readRenderTargetPixels(this.pickingTexture,x,this.pickingTexture.height-y,1,1,pixelBuffer);
		const index = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );
		return index;

	}

	_setTarget(index){

		const _instance = this.state.instances[index];
		if(!_instance) return;

		glUtils.updateTransformMatrices(this.meshes.target, _instance.transformMatrixSign, _instance.transformMatrixSign, 0);
		
		const {instanceTexUvOffset, instanceTexUvSize} = this.meshes.target.geometry.attributes;
		instanceTexUvOffset.setXY(0, ..._instance.textureUvOffset);
		instanceTexUvSize.setXY(0, ..._instance.textureUvSize);
		instanceTexUvOffset.needsUpdate = true;
		instanceTexUvSize.needsUpdate = true;

	}

	_animate(delta){

		if(this.meshes.signs){
			this.rotation -= this.state.speed;
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

		const {width,height,scene} = this.props;
		const {instances, dragging, cameraTransitioning} = this.state;

		return (
			<div className = 'gl-wrapper'>
				{scene.showOverlay&&<GLOverlay
					width={width}
					height={height}
					dragging={dragging}
					cameraTransitioning={cameraTransitioning}
					instances={instances}
					rotation={this.rotation}
					camera={this.camera}
				/>}
				<div className='gl-canvas'
					style={{
						position:'fixed',
						width, height,
						top:0,
						zIndex:-998
					}}
					ref={(node)=>{this.wrapperNode=node}}
					onMouseDown={this.onMouseDown}
					onMouseUp={this.onMouseUp}
					onMouseMove={this.onMouseMove}
					onClick={this.onClick}
				/>
			</div>
		);
	}
}

GLWrapper.defaultProps = {
	data:[],
	sceneId:null,
	scene:{
		id:null,
		ambientLight:[0.0,0.0,0.0,1.0]
	}
};

export default GLWrapper;