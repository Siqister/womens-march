const vertexShaderText = `
	attribute vec3 position;
	attribute vec3 instanceOffset;
	attribute vec4 instanceColor;
	attribute vec4 instanceOrientation;
	attribute float instancePctStart;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	uniform float uGlobalPct;

	varying vec4 vColor;
	varying vec4 vVertexPosition;

	void main(){
		//Calculate instanceOffsetAtPct at given % progress
		float pct = instancePctStart + uGlobalPct;
		if(pct>1.0){
			pct = pct - 1.0;
		}
		float zOffset = -1000.0*(1.0-pct) + 500.0*pct;
		vec3 instanceOffsetAtPct = vec3(instanceOffset.xy, zOffset);
		
		//Re-orient in model coordinates
		vec3 vcV = cross(instanceOrientation.xyz, position);
		vec3 orientedPosition = vcV * (2.0 * instanceOrientation.w) + (cross(instanceOrientation.xyz,vcV)*2.0+position);

		//Offset per instance
		vec3 offsetPosition = instanceOffsetAtPct + orientedPosition;

		//Vertex in view coordinates
		vec4 mvPosition = modelViewMatrix * vec4(offsetPosition, 1.0);
		gl_Position = projectionMatrix * mvPosition;
		
		vColor = instanceColor;
		vVertexPosition = mvPosition;
	}
`;

export default vertexShaderText;