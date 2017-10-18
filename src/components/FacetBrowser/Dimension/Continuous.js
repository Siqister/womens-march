import React,{Component} from 'react';

export default class extends Component{

	render(){

		const {name, accessor} = this.props;

		return <div>
			<p>{name}</p>
		</div>

	}

}