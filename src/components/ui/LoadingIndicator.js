import React from 'react';

//LOADING INDICATOR
const loadingIndicatorStyle = {
	width:40,
	height:40,
	position:'absolute',
	left:'50%',
	transform:'translate(-50%)',
	display:'inline-block'
}

const LoadingIndicator = props => {

	return (
		<div style={Object.assign({},loadingIndicatorStyle,props.style)}>
			<svg width={40} height={40}>
				<circle cx={20} cy={20} r={19} fill='none' stroke='rgb(180,180,180)' strokeWidth='2px'/>
				<circle cx={20} cy={20} r={19} fill='none' stroke='rgb(50,50,50)' strokeWidth='2px' 
					style={{strokeDasharray:`${Math.PI*19}px ${Math.PI*19}px`, animation:'spinning 500ms infinite'}}
				/>
			</svg>
		</div>
	);
}

export default LoadingIndicator;