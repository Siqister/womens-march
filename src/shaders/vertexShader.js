const vertexShaderText = `
	attribute vec3 position;
	attribute vec2 uv;
	attribute vec4 instanceColor;

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
	uniform bool uUsePickingColor;
	uniform bool uUseInstanceTransform;
	uniform bool uUseTexture;
	uniform float uInterpolateTransform;

	varying vec4 vColor;
	varying vec4 vVertexPosition;
	varying vec2 vUv;

	void main(){
		//Calculate per instance transform matrix from m0 and m1
		mat4 instanceTransformMatrix = mat4(
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


		//Transform vertex position
		vec4 transformedPosition;
		if(uUseInstanceTransform){
			transformedPosition = instanceTransformMatrix * vec4(position, 1.0);
		}else{
			transformedPosition = vec4(position, 1.0);
		}
		
		//Re-orient in model coordinates
		//vec3 vcV = cross(instanceOrientation.xyz, transformedPosition.xyz);
		//vec3 orientedPosition = vcV * (2.0 * instanceOrientation.w) + (cross(instanceOrientation.xyz,vcV)*2.0+transformedPosition.xyz);

		//Vertex in view coordinates
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
		vUv = uv;

	}
`;

export default vertexShaderText;