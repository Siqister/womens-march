const vertexShaderText = `
	attribute vec3 position;
	attribute vec2 uv;
	attribute vec4 instanceColor;
	attribute vec2 instanceTexUvOffset;
	attribute vec2 instanceTexUvSize;
	attribute vec3 instanceOrientation;

	attribute vec4 instanceTransformCol0;
	attribute vec4 instanceTransformCol1;
	attribute vec4 instanceTransformCol2;
	attribute vec4 instanceTransformCol3;

	attribute vec4 m1Col0;
	attribute vec4 m1Col1;
	attribute vec4 m1Col2;
	attribute vec4 m1Col3;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	uniform vec4 uColor;
	uniform vec4 uOrientation;
	uniform bool uUsePickingColor;
	uniform bool uUseInstanceTransform;
	uniform bool uUseTexture;
	uniform bool uUseOrientation;
	uniform float uInterpolateTransform;

	varying vec4 vColor;
	varying vec4 vVertexPosition;
	varying vec2 vUv;

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

		//Transform vertex position
		vec4 transformedPosition;
		if(uUseInstanceTransform){
			transformedPosition = instanceTransformMatrix * vec4(orientedPosition, 1.0);
		}else{
			transformedPosition = vec4(orientedPosition, 1.0);
		}
		
		//Vertex in world coordinates
		vec4 mvPosition = modelViewMatrix * vec4(transformedPosition.xyz, 1.0);
		gl_Position = projectionMatrix * mvPosition;

		//Varying color based on per instance attribute
		float colorWeighting = 1.0; 
		
		if(uUsePickingColor){
			vColor = instanceColor;
		}else{
			vColor = vec4(uColor.rgb * colorWeighting,1.0);		
		}
		
		vVertexPosition = mvPosition;
		vUv = instanceTexUvOffset + vec2(instanceTexUvSize.x * uv.x, instanceTexUvSize.y * uv.y);

	}
`;

export default vertexShaderText;