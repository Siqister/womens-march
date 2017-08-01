export default `
	//hemisphereVertexShader

	varying vec3 vNormal;

	void main(void){
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		vNormal = normalize(normalMatrix * normal);
	}
`;