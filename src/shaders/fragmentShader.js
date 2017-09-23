const fragmentShaderText = `
	precision mediump float;

	uniform float uFogFactor;
	uniform bool uUsePickingColor;
	uniform bool uUseTexture;

	uniform sampler2D map;

	varying vec4 vColor;
	varying vec4 vVertexPosition;
	varying vec2 vUv;
	varying vec4 vLightWeighting;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + uFogFactor * dot(vVertexPosition, vVertexPosition));

		if(uUsePickingColor){

			//If using color for picking, don't make use fog attenuation
			gl_FragColor = vColor;

		}else{

			if(uUseTexture){
				vec4 textureColor = texture2D(map, vec2(vUv.x, vUv.y));
				gl_FragColor = vec4((textureColor*vColor*vLightWeighting).rgb, atten);
			}else{
				gl_FragColor = vec4(vColor.rgb*vLightWeighting.rgb, atten);
			}

		}
	}
`;

export default fragmentShaderText;