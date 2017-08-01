export default `
	//hemisphereFragmentShader

	precision mediump float;

	varying vec3 vNormal;

	void main(void){
		float atten = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);

		gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0) + vec4(0.1, 0.1, 0.1, 1.0)*atten;
	}
`;