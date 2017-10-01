import React, {Component} from 'react';
import Waypoint from 'react-waypoint';

const sceneStyle = {
	width: '100%',
	//height: '150%'
}

const Scene = props => {

	return (
		<Waypoint
			onEnter={props.onSceneEnter}
			onLeave={props.onSceneLeave}
		>
			<div
				style={{
					height:props.height?props.height:'auto',
					pointerEvents:'none'
				}}
			>
				{props.children}
			</div>
		</Waypoint>
	);

}

Scene.defaultProps = {
	height:null
}

export default Scene;