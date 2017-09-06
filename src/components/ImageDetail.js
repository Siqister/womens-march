import React from 'react';

const color = 'rgb(80,80,80)';

const imageDetailStyle = {
	position:'absolute',
	width:'100%',
	bottom:'25%',
	top:'25%',
	pointerEvents:'none'
}

const imageDetailListItemStyle = {
	color:`${color}`,
	background:'rgb(255,255,255)',
	display:'inline'
}

const buttonContainerStyle = {
	position:'absolute',
	width:160,
	height:60,
	top:'100%',
	left:'50%',
	transform:'translate(-50%,-20px)',
	background:'red',
	pointerEvents:'auto'
}

const ImageDetailListItem = props => {
	return <li>
		<span style={imageDetailListItemStyle}>
			<span style={{fontSize:'.6em', display:'block'}}>{props.id}</span>
			<span style={{fontSize:'1.1em', padding:'5px', boxSizing:'border-box'}}>{JSON.stringify(props.data[props.id])}</span>
		</span>
	</li>
}

const ImageDetail = props => {

	return (
		<div className='image-detail'
			style={imageDetailStyle}
		>
			<ul className='image-detail-list'
				style={{
					listStyle:'none'
				}}
			>
				<ImageDetailListItem data={props.data} id='id'/>
				<ImageDetailListItem data={props.data} id='rotated'/>
			</ul>
			<div className='button-container'
				style={buttonContainerStyle}>

			</div>
		</div>
	);
}

export default ImageDetail;