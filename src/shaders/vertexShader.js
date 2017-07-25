const vertexShaderText = `
	attribute vec3 position;
	attribute vec3 instanceOffset;
	attribute vec4 instanceColor;
	attribute vec4 instanceOrientation;
	attribute float instancePctStart;

	attribute vec4 instanceTransformCol0;
	attribute vec4 instanceTransformCol1;
	attribute vec4 instanceTransformCol2;
	attribute vec4 instanceTransformCol3;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	uniform float uGlobalPct;
	uniform float uZ0;
	uniform float uZ1;
	uniform vec4 uColor;
	uniform bool uUsePickingColor;
	uniform bool uUseInstanceTransform;

	varying vec4 vColor;
	varying vec4 vVertexPosition;

	void main(){
		//Calculate per instance transform matrix from its 4 columns
		mat4 instanceTransformMatrix = mat4(
			instanceTransformCol0,
			instanceTransformCol1,
			instanceTransformCol2,
			instanceTransformCol3
		);

		//Calculate instanceOffsetAtPct at given % progress
		float pct = instancePctStart + uGlobalPct;
		if(pct>1.0){
			pct = pct - 1.0;
		}
		float zOffset = uZ0*(1.0-pct) + uZ1*pct;
		vec3 instanceOffsetAtPct = vec3(instanceOffset.xy, zOffset);

		//Transform (scale) vertex position
		vec4 transformedPosition;
		if(uUseInstanceTransform){
			transformedPosition = instanceTransformMatrix * vec4(position, 1.0);
		}else{
			transformedPosition = vec4(position, 1.0);
		}
		
		//Re-orient in model coordinates
		vec3 vcV = cross(instanceOrientation.xyz, transformedPosition.xyz);
		vec3 orientedPosition = vcV * (2.0 * instanceOrientation.w) + (cross(instanceOrientation.xyz,vcV)*2.0+transformedPosition.xyz);

		//Offset position per instance in model coordinates
		vec3 offsetPosition = instanceOffsetAtPct + orientedPosition;

		//Vertex in view coordinates
		vec4 mvPosition = modelViewMatrix * vec4(offsetPosition, 1.0);
		gl_Position = projectionMatrix * mvPosition;

		//Varying color based on per instanceOrientation
		float colorWeighting = max(dot(vec3(0.0,0.0,1.0),instanceOrientation.xyz),0.0);
		

		if(uUsePickingColor){
			vColor = instanceColor;
		}else{
			vColor = vec4(uColor.rgb * colorWeighting,1.0);		
		}
		vVertexPosition = mvPosition;
	}
`;

export default vertexShaderText;