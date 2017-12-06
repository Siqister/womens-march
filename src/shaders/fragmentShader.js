const fragmentShaderText = `
	precision mediump float;

	uniform float uFogFactor;
	uniform bool uUsePickingColor;
	uniform bool uUseTexture;
	uniform bool uUseHighlight;

	uniform sampler2D map;

	varying vec4 vVertexPosition;
	varying vec2 vUv;
	varying vec4 vColor; 
	varying vec4 vLightWeighting;
	varying float vHighlightBool;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + uFogFactor * dot(vVertexPosition, vVertexPosition));

		if(uUsePickingColor){

			//For off-canvas picking texture
			//No fog attenuation, no texture; output per instance color directly
			gl_FragColor = vColor;

		}else if(uUseTexture){

			//For signs and mouse target
			vec4 textureColor = texture2D(map, vec2(vUv.x, vUv.y));
			vec3 rgb = (textureColor * vColor * vLightWeighting).rgb;
			float average = (rgb.r + rgb.g + rgb.b)/6.0;
			vec3 greyscale = vec3(average, average, average);

			if(uUseHighlight){
				//Use vHighlightBool to mix rgb and greyscale. 1 = full rgb, 0 = full greyscale
				gl_FragColor = vec4((1.0 - vHighlightBool) * greyscale + vHighlightBool * rgb, atten);
			}else{
				gl_FragColor = vec4(rgb, atten);
			}

		}else{

			//For everything else
			gl_FragColor = vec4(vColor.rgb * vLightWeighting.rgb, atten);

		}
	}
`;

export default fragmentShaderText;