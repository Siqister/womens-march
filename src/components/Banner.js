import React from 'react';

const bannerStyle = {
	position: 'fixed',
	width:'100%',
	height:60,
	top:0,
	zIndex:999
};

const Banner = ({colors}) => {

	return (
		<div className='banner' style={Object.assign({}, bannerStyle, {color:colors[0]})}>
			<div className='container-fluid'>
				<h1
					style={{
						lineHeight:'60px',
						fontSize:'16px'
					}}
				>Art of the March</h1>
			</div>
		</div>
	);

}

export default Banner;