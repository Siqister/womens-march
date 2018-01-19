import React from 'react';
import CircularProgress from 'material-ui/CircularProgress';

const coverStyle = {
	position:'absolute',
	width:'100%',
	height:'300px',
	top:0,
	left:0,
	background:'pink'
}

const iframeStyle = {
	border:'none',
	margin:'20px'
}

const introStyle = {
	backgroundColor:'transparent',
	zIndex:9,
	fontSize:'1.2em'
}

const statusStyle = {
	padding:'8px',
	borderRadius:'.25em',
	textAlign:'center',
	fontSize:'1.2em'
}

const Intro = props => {

	const style = Object.assign({}, introStyle, {
		color:props.colors[0], 
		marginTop:props.height,
		transform:'translate(0,-100px)'
	});

	return (
		<div className='intro' style={{minHeight:props.height}}>
			<div className='intro-cover' style={Object.assign({}, coverStyle, {height:props.height})}>
				<iframe 
					src="https://player.vimeo.com/video/200573710?autoplay=1" 
					width={props.width-40} 
					height={props.height-40} 
					frameBorder="0" 
					webkitallowfullscreen mozallowfullscreen allowfullscreen
					style={iframeStyle}
				/>
			</div>
			<div className='container intro-content'>
				<div className='col-md-6 col-md-offset-3'>
					<div className='intro-text-block' style={style}>
						<p className='lead'>Mauris finibus ligula enim. Nunc euismod, libero eleifend faucibus pellentesque, arcu ante ullamcorper felis, sed fermentum sapien ligula et metus. Aenean dapibus vitae turpis at aliquam. Fusce id est ante. Duis rutrum diam vitae dui varius, et pellentesque erat laoreet. Pellentesque convallis vulputate turpis non placerat. Quisque mollis velit est, at cursus tortor mattis quis. Morbi ac viverra est. Etiam faucibus, nunc non vehicula dapibus, odio orci dapibus nibh, id lobortis odio felis id eros. Nullam dapibus ipsum eget massa condimentum, vel tristique felis semper.</p>
						<p>Donec vulputate ex dignissim porta volutpat. Nunc vehicula neque id enim faucibus, et semper dolor porta. Vivamus malesuada lacus at felis finibus suscipit. Donec in nunc ut felis viverra mattis in ac arcu. Ut molestie neque enim, ut convallis velit congue eu. Morbi vehicula eu quam ac ornare. Quisque vehicula libero in massa ultricies, vel fermentum sapien ullamcorper. Integer a maximus arcu, id tristique massa.</p>
						<p>Donec vulputate ex dignissim porta volutpat. Nunc vehicula neque id enim faucibus, et semper dolor porta. Vivamus malesuada lacus at felis finibus suscipit. Donec in nunc ut felis viverra mattis in ac arcu. Ut molestie neque enim, ut convallis velit congue eu. Morbi vehicula eu quam ac ornare. Quisque vehicula libero in massa ultricies, vel fermentum sapien ullamcorper. Integer a maximus arcu, id tristique massa.</p>
					</div>
					<div className='status' style={Object.assign({}, statusStyle, {color:props.colors[1], background:props.colors[3]})}>
					    <CircularProgress color={props.colors[2]} size={18} thickness={3} />   Loading 5970 signs. This may take a moment...
					</div>
				</div>
			</div>
		</div>
	);

}

export default Intro;