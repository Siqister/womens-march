import React, {Component} from 'react';
import AutoComplete from 'material-ui/AutoComplete';
import {Slider} from './ui';

const toolbarStyle = {
	position:'absolute',
	height:'100px',
	width:'100%',
	bottom:'0px'
}

export default class MyToolbar extends Component{
	constructor(props){
		super(props);

		this._handleUpdateInput = this._handleUpdateInput.bind(this);
		this._handleSceneSettingChange = this._handleSceneSettingChange.bind(this);

		this.state = {
			dataSource:[]
		}
	}

	_handleUpdateInput(value){

		this.setState({
			dataSource:[value, value+value, value+value+value]
		});

	}

	_handleSceneSettingChange(value){

		this.props.onSceneSettingChange(value);

	}

	render(){

		return (
			<div className='toolbar' style={toolbarStyle}>
				<div className='container'>
					<AutoComplete
						hintText='Search by metadata value'
						onUpdateInput={this._handleUpdateInput}
						dataSource={this.state.dataSource}
						targetOrigin={{vertical: 'bottom', horizontal: 'left'}}
					/>
					<Slider 
						pullRight
						positions={this.props.scenes}
						currentPosition={this.props.currentScene}
						onChange={this._handleSceneSettingChange}
					/>
				</div>
			</div>
		);

	}
}