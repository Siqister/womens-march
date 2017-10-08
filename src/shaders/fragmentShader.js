const fragmentShaderText = `
	precision mediump float;

	uniform float uFogFactor;
	uniform bool uUsePickingColor;
	uniform bool uUseTexture;

	uniform sampler2D map;

	varying vec4 vVertexPosition;
	varying vec2 vUv;
	varying vec4 vColor; 
	varying vec4 vLightWeighting;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + uFogFactor * dot(vVertexPosition, vVertexPosition));

		// How final color is determined:
		// - if "uUsePickingColor" = true, then use instance color "vColor" directly without applying effects
		// - else
		// -- if "uUseTexture", then use textureColor, followed by tinting with "vColor", then by lighting, and finally fog attenuation
		// -- else, start with "vColor", followed by lighting, and finally fog attenuation

		if(uUsePickingColor){

			//If using color for picking, don't make use fog attenuation
			gl_FragColor = vColor;

		}else{

			if(uUseTexture){
				vec4 textureColor = texture2D(map, vec2(vUv.x, vUv.y));
				gl_FragColor = vec4( (textureColor*vColor*vLightWeighting).rgb, atten );
			}else{
				gl_FragColor = vec4(vColor.rgb*vLightWeighting.rgb, atten);
			}

		}
	}
`;

export default fragmentShaderText;