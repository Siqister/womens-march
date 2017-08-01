const vertexShaderText = `
	attribute vec3 position;
	attribute vec4 color;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	varying vec4 vColor;
	varying vec4 vVertexPosition;

	void main(){
		vec4 mvPosition = modelViewMatrix * vec4(position,1.0);
		gl_Position = projectionMatrix * mvPosition;

		vColor = color;
		vVertexPosition = mvPosition;
	}
`;

export default vertexShaderText;