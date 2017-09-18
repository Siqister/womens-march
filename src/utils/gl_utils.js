import * as THREE from 'three';

export const initTransformMatrixAttrib = (instancedBufferGeometry,instanceCount) => {

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

export const updateTransformMatrices = (mesh, m0, m1, index) => {
	
	//Given mesh containing (instanced) buffer geometry, update its starting and/or ending transform mat4 attribute at index i
	//mesh.geometry.attributes is assumed to contain the following attributes:
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

