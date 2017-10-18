import React,{Component} from 'react';
import {nest} from 'd3';
import {ToolbarGroup} from 'material-ui/Toolbar';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class extends Component{

	constructor(props){

		super(props);

		this.state = {
			values:[]
		};

		this._handleChange = this._handleChange.bind(this);

	}

	_handleChange(event,index,values){

		this.setState({
			values
		});

		this.props.onFilter(...values);

	}

	render(){

		const {data, accessor, name, onFilter, keys} = this.props;
		const {values} = this.state;
		const countByKey = nest().key(accessor).rollup(l => l.length).map(data);

		return	<ToolbarGroup style={{margin:'0 5px'}}>
			<SelectField
				multiple={true}
				hintText={name}
				value={values}
				onChange={this._handleChange}
				floatingLabelText={name}
			>
				{keys.map(key => (<MenuItem
					key={key}
					checked={values&&values.indexOf(key)>-1}
					value={key}
					primaryText={key}
					secondaryText={countByKey.get(key)}
				 />))}
			</SelectField>
		</ToolbarGroup>

	}

}