import React, {Component} from 'react';
import Waypoint from 'react-waypoint';

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