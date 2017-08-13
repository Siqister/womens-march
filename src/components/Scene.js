import React, {Component} from 'react';
import Waypoint from 'react-waypoint';

const sceneStyle = {
	width: '100%',
	height: '150%'
}

const Scene = props => {

	return (
		<Waypoint
			onEnter={props.onSceneEnter}
		>
			<div
				style={sceneStyle}
			>
				{props.children}
			</div>
		</Waypoint>
	);

}

export default Scene;