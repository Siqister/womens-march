const fragmentShaderText = `
	precision mediump float;

	varying vec4 vColor;
	varying vec4 vVertexPosition;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + .0002 * dot(vVertexPosition, vVertexPosition));
		gl_FragColor = vec4(vColor.rgb*vec3(atten,atten,atten), 1.0);
	}
`;

export default fragmentShaderText;