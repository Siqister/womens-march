const vertexShaderText = `
	attribute vec3 position;
	attribute vec2 uv;
	attribute vec3 normal;
	attribute vec4 instanceColor;
	attribute vec4 instanceClusterColor0;
	attribute vec4 instanceClusterColor1;
	attribute vec2 instanceTexUvOffset;
	attribute vec2 instanceTexUvSize;

	attribute vec4 instanceTransformCol0;
	attribute vec4 instanceTransformCol1;
	attribute vec4 instanceTransformCol2;
	attribute vec4 instanceTransformCol3;

	attribute vec4 m1Col0;
	attribute vec4 m1Col1;
	attribute vec4 m1Col2;
	attribute vec4 m1Col3;

	//Available by default through THREE.RawShaderMaterial
	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	uniform mat3 normalMatrix;

	//Uniforms: boolean flags
	uniform bool uUsePickingColor;
	uniform bool uUseClusterColor;
	uniform bool uUseTexture;
	uniform bool uUseOrientation;
	uniform bool uUseLighting;

	//Uniforms: other
	uniform vec4 uColor;
	uniform vec4 uOrientation;
	uniform float uInterpolateTransform;
	uniform vec3 uLightSourcePosition;
	uniform vec4 uAmbientLight;
	uniform vec4 uDirectionalLight;

	varying vec4 vColor;
	varying vec4 vVertexPosition;
	varying vec2 vUv;
	varying vec4 vLightWeighting;

	void main(){
		//Calculate per instance transform matrix from m0 and m1
		mat4 m0 = mat4(
			instanceTransformCol0,
			instanceTransformCol1,
			instanceTransformCol2,
			instanceTransformCol3
		);
		mat4 m1 = mat4(
			m1Col0,
			m1Col1,
			m1Col2,
			m1Col3
		);
		mat4 instanceTransformMatrix = m0 * (1.0 - uInterpolateTransform) + m1 * uInterpolateTransform;

		//Re-orient vertex position
		vec3 orientedPosition;
		if(uUseOrientation){
			vec3 vcV = cross(uOrientation.xyz, position.xyz);
			orientedPosition = vcV * (2.0 * uOrientation.w) + (cross(uOrientation.xyz,vcV)*2.0+position.xyz);
		}else{
			orientedPosition = position;
		}

		//Per-instance transform orientedPosition, and compute mvPosition
		vec4 mvPosition = modelViewMatrix * vec4((instanceTransformMatrix * vec4(orientedPosition,1.0)).xyz, 1.0);
		gl_Position = projectionMatrix * mvPosition;

		//Per instance "tinting" color
		if(uUsePickingColor){
			vColor = instanceColor; //for off canvas picking
		}else if(uUseClusterColor){
			vec4 instanceClusterColor = (1.0 - uInterpolateTransform) * instanceClusterColor0 + uInterpolateTransform * instanceClusterColor1;
			vColor = vec4(uColor.xyz * instanceClusterColor.xyz, 1.0); //white by default
		}else{
			vColor = uColor; //for everything except signs
		}

		//Directional lighting
		vec4 lightWeighting;
		if(uUseLighting){
			vec3 instanceNormal = normalize( (instanceTransformMatrix * vec4(normal, 0.0)).xyz );
			vec3 transformedNormal = normalMatrix * instanceNormal;
			vec3 lightDirection = normalize(uLightSourcePosition - mvPosition.xyz);
			lightWeighting = uAmbientLight + 1.5 * uDirectionalLight * max(dot(transformedNormal, lightDirection), 0.0);
		}else{
			lightWeighting = vec4(1.0, 1.0, 1.0, 1.0);
		}
		
		vVertexPosition = mvPosition;
		vUv = instanceTexUvOffset + vec2(instanceTexUvSize.x * uv.x, instanceTexUvSize.y * uv.y);
		vLightWeighting = lightWeighting;

	}
`;

export default vertexShaderText;