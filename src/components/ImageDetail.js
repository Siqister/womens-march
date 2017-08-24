import React from 'react';

const color = 'rgb(80,80,80)';

const imageDetailStyle = {
	position:'absolute',
	width:256,
	bottom:'50%',
	left:'50%',
	padding:'10px 10px',
	marginLeft:'50px',
	pointerEvents:'none'
}

const imageDetailListItemStyle = {
	color:`${color}`,
	background:'rgb(255,255,255)',
	display:'inline'
}

const ImageDetailListItem = props => {
	return <li>
		<span style={imageDetailListItemStyle}>
			<span style={{fontSize:'.6em', display:'block'}}>{props.id}</span>
			<span style={{fontSize:'1.1em', padding:'5px', boxSizing:'border-box'}}>{JSON.stringify(props.data[props.id])}</span>
		</span>
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