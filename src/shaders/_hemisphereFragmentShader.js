export default `
	//hemisphereFragmentShader

	precision mediump float;

	varying vec3 vNormal;

	void main(void){
		float atten = pow(0.4 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);

		gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0) + vec4(0.2, 0.2, 0.2, 1.0)*atten;
	}
`;