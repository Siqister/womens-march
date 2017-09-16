import React, {Component} from 'react';

const navigationStyle = {
	position: 'absolute',
	width:'100%',
	height:60,
	zIndex:999
}

const navigationBlockStyle = {
	height:60,
	lineHeight:'60px',
	borderBottom:'2px solid rgb(120,120,120)',
	color:'rgb(80,80,80)',
	display:'block',
	fontSize:'1.3em'
}

const NavigationBlock = props => <span style={navigationBlockStyle}>
		{props.children}
	</span>

class Navigation extends Component{

	render(){
		return <nav className='navigation' role='navigation' style={navigationStyle}>
			<div className='container'>
				<div className='col-md-3'><NavigationBlock>Art of the March</NavigationBlock></div>
				<div className='col-md-6'><NavigationBlock>Layout</NavigationBlock></div>
				<div className='col-md-3'><NavigationBlock>Image</NavigationBlock></div>
			</div>
		</nav>
	}

}

export default Navigation;