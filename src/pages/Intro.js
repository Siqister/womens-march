import React from 'react';

const introStyle = {
	backgroundColor:'transparent',
	margin:'60px 0',
	zIndex:9,
	fontSize:'1.2em'
}


const Intro = props => {

	const style = Object.assign({}, introStyle, {color:props.colors[0]});

	return (
		<div className='intro' style={{background:'black'}}>
			<div className='container'>
				<div className='col-md-6 col-md-offset-3'>
					<div style={style}>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris finibus ligula enim. Nunc euismod, libero eleifend faucibus pellentesque, arcu ante ullamcorper felis, sed fermentum sapien ligula et metus. Aenean dapibus vitae turpis at aliquam. Fusce id est ante. Duis rutrum diam vitae dui varius, et pellentesque erat laoreet. Pellentesque convallis vulputate turpis non placerat. Quisque mollis velit est, at cursus tortor mattis quis. Morbi ac viverra est. Etiam faucibus, nunc non vehicula dapibus, odio orci dapibus nibh, id lobortis odio felis id eros. Nullam dapibus ipsum eget massa condimentum, vel tristique felis semper.</p>
						<p>Donec vulputate ex dignissim porta volutpat. Nunc vehicula neque id enim faucibus, et semper dolor porta. Vivamus malesuada lacus at felis finibus suscipit. Donec in nunc ut felis viverra mattis in ac arcu. Ut molestie neque enim, ut convallis velit congue eu. Morbi vehicula eu quam ac ornare. Quisque vehicula libero in massa ultricies, vel fermentum sapien ullamcorper. Integer a maximus arcu, id tristique massa.</p>
						<p>Donec vulputate ex dignissim porta volutpat. Nunc vehicula neque id enim faucibus, et semper dolor porta. Vivamus malesuada lacus at felis finibus suscipit. Donec in nunc ut felis viverra mattis in ac arcu. Ut molestie neque enim, ut convallis velit congue eu. Morbi vehicula eu quam ac ornare. Quisque vehicula libero in massa ultricies, vel fermentum sapien ullamcorper. Integer a maximus arcu, id tristique massa.</p>
					</div>
				</div>
			</div>
		</div>
	);

}

export default Intro;