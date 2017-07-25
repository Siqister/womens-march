import React, {Component} from 'react';
import * as THREE from 'three';

import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';
import gridVertexShader from '../shaders/gridVertexShader';

class GLWrapper extends Component{
	constructor(props){
		super(props);

		this._animate = this._animate.bind(this);
		this._processData = this._processData.bind(this);
		this._initStaticMeshes = this._initStaticMeshes.bind(this);
		this._setPerInstanceProperties = this._setPerInstanceProperties.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);

		this.state = {
			cameraPosition:[4,12,12],
			cameraLookAt:[0,7,0],
			speed:600000, //300s for all signs to march through
			globalPct:0, //progress of the march, from 0 - 1;
			//Distribution of signs
			X0:-10,
			X1:10, 
			Y_SPREAD:2,
			Z0:-1800,
			Z1:100,
			//Grid
			GRID_X0:-200,
			GRID_X1:200,
			GRID_SPACING_X:3,
			GRID_SPACING_Z:6
		};

		//Direct references to meshes
		this.meshes = {
			signs:null,
			signsPicking:null,
			arrows:null,
			grid:null,
			target:null
		}
	}

	componentDidMount(){
		const {width,height,data} = this.props;
		const {cameraPosition,cameraLookAt} = this.state;

		//Component mounted, initialize camera, renderer, and scene
		//Init camera
		this.camera = new THREE.PerspectiveCamera(60, width/height, 1, 1000);
		this.camera.position.set(...cameraPosition);
		this.camera.lookAt(new THREE.Vector3(...cameraLookAt));

		//Init renderer, and mount renderer dom element
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(0xeeeeee);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.wrapperNode.appendChild(this.renderer.domElement);

		//Init scene
		this.scene = new THREE.Scene();

		//Init picking related
		this.pickingScene = new THREE.Scene();
		this.pickingTexture = new THREE.WebGLRenderTarget(width,height);

		//If data...
		this._initStaticMeshes();
		if(data.length){this._processData(data);}

		this._animate();
	}


	componentDidUpdate(){
		const {width,height,data} = this.props;

		//Assume width and height are changed
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width,height);
		this.pickingTexture.setSize(width,height);

		//If data is injected, process mesh
		//TODO: this will add another set of meshes every time component updates!!
		if(data.length){this._processData(data);}
	}

	onMouseMove(e){
		const x = e.clientX, y = e.clientY;

		//Picking
		this.renderer.render(this.pickingScene, this.camera, this.pickingTexture);
		const pixelBuffer = new Uint8Array(4);
		this.renderer.readRenderTargetPixels(this.pickingTexture, x, this.pickingTexture.height - y, 1, 1, pixelBuffer);
		//Reverse pixel value into id
		const id = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );
		if(this.instances && this.instances[id]){
			//console.log(this.instances[id].offsetPosition);
			const {offsetPosition} = this.instances[id];
			console.log(offsetPosition[0],1,offsetPosition[2]);
			this.meshes.target.position.set(offsetPosition[0],1,offsetPosition[2]);
		}
	}

	_initStaticMeshes(){
		const {Y_SPREAD,Z0,Z1,GRID_X0,GRID_X1,GRID_SPACING_X,GRID_SPACING_Z} = this.state;

		// GRID
		const gridGeometry = new THREE.BufferGeometry();
		const gridVertices = [], gridColors = [], GRID_COLOR = [.7, .7, .7, 1.0];
		for(let xx = GRID_X0; xx <=GRID_X1; xx+=GRID_SPACING_X){
			gridVertices.push(xx, -Y_SPREAD*3, Z0, xx, -Y_SPREAD*3, Z1);
			gridColors.push(...GRID_COLOR, ...GRID_COLOR);
		}
		for(let zz = Z0; zz <= Z1; zz+=GRID_SPACING_Z){
			gridVertices.push(GRID_X0, -Y_SPREAD*3, zz, GRID_X1, -Y_SPREAD*3, zz);
			gridColors.push(...GRID_COLOR, ...GRID_COLOR);
		}
		gridGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(gridVertices),3));
		gridGeometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(gridColors),4));
		const gridMaterial = new THREE.RawShaderMaterial({
			uniforms:{
				uFogFactor:{value:0.0005}
			},
			vertexShader:gridVertexShader,
			fragmentShader:fragmentShader,
			transparent:true
		});
		this.meshes.grid = new THREE.LineSegments(gridGeometry, gridMaterial);

		// TODO: TARGET
		const targetGeometry0 = new THREE.BufferGeometry();
		const targetVertices0 = new THREE.BufferAttribute(new Float32Array([
			-.3,.3,0,
			0,-.6,0,
			.3,.3,0,
			0,.3,-.3,
			0,-.6,0,
			0,.3,.3
		]), 3);
		targetGeometry0.addAttribute('position',targetVertices0);
		const targetMaterial0 = new THREE.MeshNormalMaterial({
			side:THREE.DoubleSide
		});
		this.meshes.target = new THREE.Mesh(targetGeometry0,targetMaterial0);

		this.scene.add(this.meshes.grid);
		this.scene.add(this.meshes.target);
	}

	_processData(data){
		//TODO: do this at some point in the life cycle

		//Process data array
		//Will be called every time component updates with props.data
		const {X0,X1,Y_SPREAD,Z0,Z1} = this.state;

		//SIGNS
		//Randomize positions
		const instances = data.map(this._setPerInstanceProperties);
		const COUNT = instances.length;
		this.instances = instances; //TODO: instances should probably be component state

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
		const arrowVertices = new THREE.BufferAttribute(new Float32Array([-.2,0,-.2,0,0,.2,.2,0,-.2]),3);
		//per instance InstancedBufferAttribute...
		// ...for this.meshes.signs and this.meshes.signsPicking
		const instanceOffsets = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*3),3,1);
		const instanceOrientations = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instanceTransformCol0 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol1 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol2 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1),
			instanceTransformCol3 = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		// ...for this.meshes.arrows
		const arrowOffsets = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*3),3,1);
		const arrowOrientations = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		// ...shared
		const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(COUNT*4),4,1);
		const instancePctStarts = new THREE.InstancedBufferAttribute(new Float32Array(instances.map(v=>v.pctOffset)),1,1);
		
		//...populate attributes with data
		for(let i=0; i<COUNT; i++){
			const {orientation, pickingColor, offsetPosition, transformMatrix} = instances[i];
			const transformMatrixElements = transformMatrix.elements; //in column major format

			instanceOffsets.setXYZ(i,...offsetPosition);
			instanceOrientations.setXYZW(i, orientation.x, orientation.y, orientation.z, orientation.w);
			instanceTransformCol0.setXYZW(i, ...transformMatrixElements.slice(0,4));
			instanceTransformCol1.setXYZW(i, ...transformMatrixElements.slice(4,8));
			instanceTransformCol2.setXYZW(i, ...transformMatrixElements.slice(8,12));
			instanceTransformCol3.setXYZW(i, ...transformMatrixElements.slice(12));

			arrowOffsets.setXYZ(i, offsetPosition[0], -Y_SPREAD*3+.005, offsetPosition[2]);
			arrowOrientations.setXYZW(i, 0.0, 0.0, 1.0, 0.0);

			instanceColors.setXYZW(i, pickingColor.r, pickingColor.g, pickingColor.b, 1.0);
		}

		//GEOMETRY & MESH
		//SIGNS
		//Construct InstancedBufferGeometry
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.addAttribute('position', vertices);
		geometry.addAttribute('instanceOffset', instanceOffsets);
		geometry.addAttribute('instanceColor', instanceColors);
		geometry.addAttribute('instanceOrientation', instanceOrientations);
		geometry.addAttribute('instancePctStart', instancePctStarts);
		geometry.addAttribute('instanceTransformCol0',instanceTransformCol0);
		geometry.addAttribute('instanceTransformCol1',instanceTransformCol1);
		geometry.addAttribute('instanceTransformCol2',instanceTransformCol2);
		geometry.addAttribute('instanceTransformCol3',instanceTransformCol3);
		//RawShaderMaterial
		let material = new THREE.RawShaderMaterial({
			uniforms:{
				uGlobalPct:{value:0.0},
				uZ0:{value:Z0},
				uZ1:{value:Z1},
				uFogFactor:{value:0.0002},
				uColor:{value: new THREE.Vector4(1.0,1.0,1.0,1.0)},
				uUsePickingColor:{value:false},
				uUseInstanceTransform:{value:true}
			},
			vertexShader:vertexShader,
			fragmentShader:fragmentShader,
			side: THREE.DoubleSide,
			transparent:true
		});
		//Geometry + Material -> Mesh
		this.meshes.signs = new THREE.Mesh(geometry,material);

		//ARROWS
		const arrowsGeometry = new THREE.InstancedBufferGeometry();
		arrowsGeometry.addAttribute('position', arrowVertices);
		arrowsGeometry.addAttribute('instanceOffset', arrowOffsets);
		arrowsGeometry.addAttribute('instanceColor', instanceColors);
		arrowsGeometry.addAttribute('instanceOrientation', arrowOrientations);
		arrowsGeometry.addAttribute('instancePctStart', instancePctStarts);
		material = material.clone();
		material.uniforms.uColor.value = new THREE.Vector4(.3,.3,.3,1.0);
		material.uniforms.uUseInstanceTransform.value = false;
		this.meshes.arrows = new THREE.Mesh(arrowsGeometry,material);

		this.scene.add(this.meshes.signs);
		this.scene.add(this.meshes.arrows);
		
		//SIGN FOR PICKING
		material = material.clone();
		material.uniforms.uUsePickingColor.value = true;
		this.meshes.signsPicking = new THREE.Mesh(geometry,material);

		this.pickingScene.add(this.meshes.signsPicking);
	}

	_setPerInstanceProperties(v,i){
		const {X0,X1,Y_SPREAD,Z0,Z1} = this.state;

		//Set per instance transform matrix here
		//https://stackoverflow.com/questions/40100640/three-js-read-a-three-instancedbufferattribute-of-type-mat4-from-the-shader
		//TODO: assume aspect ratio information is provided as image width/image height
		const transformMatrix = new THREE.Matrix4();
		transformMatrix.makeScale(Math.random()*2, 1, Math.random()*.5+.5);

		return {
			id:v.id,
			offsetPosition:[(Math.random()*2-1)*(X1-X0), (Math.random()*2-1)*Y_SPREAD, Math.random()*(Z1-Z0)+Z0], 
			pctOffset:Math.random(), //How far along the march?
			orientation: (new THREE.Vector4(Math.random()*1-.5, Math.random()*.2-.05, 1.0, 0.0)).normalize(),
			transformMatrix,
			pickingColor: (new THREE.Color()).setHex(i)
		};
	}

	_animate(delta){
		const globalPct = (delta%this.state.speed)/this.state.speed;
		// this.setState({globalPct});

		//Each animation frame, update uniforms
		if(this.meshes.signs){
			this.meshes.signs.material.uniforms.uGlobalPct.value = globalPct;
			this.meshes.arrows.material.uniforms.uGlobalPct.value = globalPct;
			this.meshes.signsPicking.material.uniforms.uGlobalPct.value = globalPct;
		}

		this.meshes.target.rotation.y += .03;

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
			>
			</div>
		);
	}
}

export default GLWrapper;