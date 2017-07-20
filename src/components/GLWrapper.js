import React, {Component} from 'react';
import React3 from 'react-three-renderer';
import * as THREE from 'three';

//Version 1 of this, using react-three-renderer


class GLWrapper extends Component{
	constructor(props){
		super(props);

		this.state = {
			cameraPosition: new THREE.Vector3(0,0,5),
			cubeRotation: new THREE.Euler()
		};

		this._onAnimate = this._onAnimate.bind(this);
	}

	_onAnimate(){
		const {x,y} = this.state.cubeRotation;

		this.setState({
			cubeRotation: new THREE.Euler(x+.1, y+.1, 0)
		});
	}

	render(){
		const {width,height} = this.props;

		return (
		<React3
			width={width} height={height}
			onAnimate={this._onAnimate}
			mainCamera="camera"
		>
			<scene>
				<perspectiveCamera 
					name='camera'
					fov={75}
					aspect={width/height}
					near={.01}
					far={1000}

					position={this.state.cameraPosition}
				/>
				<mesh
					rotation={this.state.cubeRotation}
				>
					<boxGeometry 
						width={1}
						height={1}
						depth={1}
					/>
					<meshBasicMaterial 
						color={0x00ff00}
					/>
				</mesh>
			</scene>
		</React3>
		);
	}
}

export default GLWrapper;