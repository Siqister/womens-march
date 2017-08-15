import React from 'react';

const color = 'rgb(150,150,150)';

const imageDetailStyle = {
	position:'absolute',
	width:256,
	top:'50%',
	left:'50%',
	padding:'20px 15px',
	marginLeft:'100px'
}

const imageDetailListItemStyle = {
	color:`${color}`,
	display:'block'
}

const ImageDetailListItem = props => {
	return <li style={{
		borderBottom:`1px solid ${color}`,
		padding:'10px 0'
	}}>
		<span style={Object.assign({}, imageDetailListItemStyle, {fontSize:'.8em'})}>{props.id}</span>
		<span style={Object.assign({}, imageDetailListItemStyle, {fontSize:'1.3em'})}>{JSON.stringify(props.data[props.id])}</span>
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