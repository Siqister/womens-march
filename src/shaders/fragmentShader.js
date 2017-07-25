const fragmentShaderText = `
	precision mediump float;

	uniform float uFogFactor;
	uniform bool uUsePickingColor;


	varying vec4 vColor;
	varying vec4 vVertexPosition;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + uFogFactor * dot(vVertexPosition, vVertexPosition));

		if(uUsePickingColor){
			//If using color for picking, don't make transparent
			gl_FragColor = vColor;
		}else{
			gl_FragColor = vec4(vColor.rgb, atten);
		}
	}
`;

export default fragmentShaderText;