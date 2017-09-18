import React, {Component} from 'react';
import {Slider} from './ui';

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

const NavigationBlock = props =>  <span style={Object.assign({}, navigationBlockStyle, props.style)}>
			{props.children}
		</span>


class Navigation extends Component{

	constructor(props){

		super(props);
		this._handleSceneSettingChange = this._handleSceneSettingChange.bind(this);

	}

	_handleSceneSettingChange(value){

		this.props.onSceneSettingChange(value);

	}

	render(){

		return <nav className='navigation' role='navigation' style={navigationStyle}>
			<div className='container'>
				<div className='col-md-3 clearfix'><NavigationBlock>Art of the March</NavigationBlock></div>
				<div className='col-md-6 clearfix'>
					<NavigationBlock style={{width:'30%', float:'left'}}>Layout</NavigationBlock>
					<NavigationBlock style={{width:'70%', float:'left'}}>
						<Slider
							positions={this.props.scenes}
							currentPosition={this.props.currentScene}
							style={{top:60, transform:'translate(0,-50%)'}}
							color='rgb(120,120,120)'
							onChange={this._handleSceneSettingChange}
						/>
					</NavigationBlock>
				</div>
				<div className='col-md-3 clearfix'><NavigationBlock>Image</NavigationBlock></div>
			</div>
		</nav>
	}

}

export default Navigation;