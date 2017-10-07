import * as THREE from 'three';

export default class Layout{

	constructor(){

		this.x = 0;
		this.xStdDev = 0;
		this.r = 0;
		this.rStdDev = 0;
		this.groupByAccessor = null;

		this.position = new THREE.Vector3();
		this.rotation = new THREE.Quaternion();
		this.scale = new THREE.Vector3();
		this.up = new THREE.Vector3();
		this.transformMatrixSign = new THREE.Matrix4();
		this.transformMatrixArrow = new THREE.Matrix4();
		this.color = new THREE.Color();

		this.X_AXIS = new THREE.Vector3(1,0,0);
		this.CENTER = new THREE.Vector3(0,0,0);

	}

	setX(_){
		this.x = _;
		return this;
	}

	setXStdDev(_){
		this.xStdDev = _;
		return this;
	}

	setR(_){
		this.r = _;
		return this;
	}

	setRStdDev(_){
		this.rStdDev = _;
		return this;
	}

	setGroupByAccessor(_){
		this.groupByAccessor = _;
		return this;
	}

}