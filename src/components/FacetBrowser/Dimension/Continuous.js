import React,{Component} from 'react';
import {ToolbarGroup} from 'material-ui/Toolbar';

const dimensionInnerStyle = {
	height:72,
	width:256,
	fontSize:16,
	lineHeight:'24px',
	position:'relative'
};

const labelStyle = {
	position:'absolute',
	lineHeight:'22px',
	top:38,
	transform:'scale(0.75) translate(0px, -28px)',
	color:'rgba(255,255,255,.3)'
}

export default class extends Component{

	constructor(props){

		super(props);

		this.state={
			expand:false,
			extent:[]
		}

	}

	render(){

		const {name, accessor} = this.props;

		return <ToolbarGroup 
			className='dimension continuous' 
			onFocus={() => {console.log('hello'); this.setState({focus:true});}}
		>
			<div className='dimension-inner' style={dimensionInnerStyle}>
				<label style={labelStyle}>{name}</label>
				<div style={{
					position:'absolute',
					bottom:12
				}}>
					00 - 00
				</div>
			</div>
		</ToolbarGroup>

	}

}