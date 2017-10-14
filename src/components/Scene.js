import React, {Component} from 'react';

const Scene = props => {

	return (
		<div
			style={{
				height:props.height?props.height:'auto',
				pointerEvents:'none',
				position:'relative'
			}}
			id={props.id}
		>
			{props.children}
		</div>
	);

}

Scene.defaultProps = {
	height:null
}

export default Scene;