const fragmentShaderText = `
	precision mediump float;

	uniform float uFogFactor;
	uniform bool uUsePickingColor;
	uniform bool uUseTexture;

	uniform sampler2D map;

	varying vec4 vColor;
	varying vec4 vVertexPosition;
	varying vec2 vUv;

	void main(){
		//Fog attenuation
		float atten = 1.0/(1.0 + uFogFactor * dot(vVertexPosition, vVertexPosition));

		if(uUsePickingColor){
			//If using color for picking, don't make transparent
			gl_FragColor = vColor;
		}else{
			vec4 textureColor;

			if(uUseTexture){
				//textureColor = vec4(0.0,1.0,1.0,1.0);
				textureColor = texture2D(map, vec2(vUv.x, vUv.y));
				//textureColor = vec4(vUv,1.0,1.0);
				gl_FragColor = vec4((textureColor*vColor).rgb, atten);
			}else{
				textureColor = vec4(1.0,1.0,1.0,1.0);
				gl_FragColor = vec4(vColor.rgb, atten);
			}

		}
	}
`;

export default fragmentShaderText;