import React from 'react';

const color = 'rgb(255,255,255)';

const imageDetailStyle = {
	position:'absolute',
	width:256,
	bottom:'50%',
	left:'50%',
	padding:'10px 10px',
	marginLeft:'100px',
	background:'rgb(50,50,50)'
}

const imageDetailListItemStyle = {
	color:`${color}`,
	display:'block'
}

const ImageDetailListItem = props => {
	return <li style={{
		padding:'5px 0'
	}}>
		<span style={Object.assign({}, imageDetailListItemStyle, {fontSize:'.6em'})}>{props.id}</span>
		<span style={Object.assign({}, imageDetailListItemStyle, {fontSize:'1.1em'})}>{JSON.stringify(props.data[props.id])}</span>
	</li>
}

const ImageDetail = (props) => {

	console.log(props.data);

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
		</div>
	);
}

export default ImageDetail;