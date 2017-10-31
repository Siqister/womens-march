import React, {Component} from 'react';
const crossfilter = require('crossfilter');
import {nest, extent} from 'd3';
import {Toolbar} from 'material-ui/Toolbar';

import {CategoricalDimension, ContinuousDimension} from './Dimension';

const facetBrowserStyle = {
	width:'100%',
	height:100,
	position:'absolute',
	bottom:0,
	pointerEvents:'all'
}

const toolBarStyle = {
	justifyContent:'none',
	background:'none'
}

export default class FacetBrowser extends Component{

	constructor(props){

		super(props);

		this.state = {
			filteredData:[]
		};

		//Initialize crossfilter and crossfilter dimensions
		this.cf = crossfilter(props.data);
		this.cfDimensions = {};
		props.dimensions.forEach(d=>{
			this.cfDimensions[d.name] = this.cf.dimension(d.accessor);
		});

		this._renderDimension = this._renderDimension.bind(this);

	}

	componentWillReceiveProps(nextProps){

		if(nextProps.data !== this.props.data){
			//FIXME: doesn't deal with incremental data addtiions
			this.cf.add(nextProps.data); 
			this.setState({
				filteredData:[...nextProps.data]
			});
		}

	}

	shouldComponentUpdate(nextProps, nextState){

		if(nextProps.data===this.props.data 
			&& nextProps.dimensions===this.props.dimensions
			&& nextState.filteredData===this.state.filteredData
		){
			return false;
		}else{
			return true;
		}

	}

	_onFilter(dimensionName, dimensionType, ...values){

		const dimension = this.cfDimensions[dimensionName];

		//Filter for categorical values
		if(values.length===0){
			//Nothing selected on this dimension
			dimension.filter(null);
		}else{
			dimension.filter(d => values.indexOf(d)>-1);
		}
		const filteredData = dimension.top(Infinity);
		this.setState({
			filteredData:[...filteredData]
		});

		//TODO
		//Filter for continuous values

		//Update rest of viz
		//FIXME: If every sign is selected, then don't highlight anything
		this.props.onFilter(filteredData.length===this.props.data.length?[]:filteredData.map(d => d.id));

	}

	_renderDimension(d,i){

		switch(d.type){
			case 'continuous':
				const ext = extent(this.props.data, d.accessor);
				return <ContinuousDimension
					name={d.name}
					accessor={d.accessor}
					data={this.state.filteredData}
					onFilter={this._onFilter.bind(this, d.name, d.type)}
					extent={ext}
					key={i}
				/>
			case 'single':
			case 'multiple':
			default:
				let keys = nest().key(d.accessor).entries(this.props.data).map(d=>d.key);
				return <CategoricalDimension
					name={d.name}
					accessor={d.accessor}
					data={this.state.filteredData}
					onFilter={this._onFilter.bind(this, d.name, d.type)}
					keys={keys}
					key={i}
				/>
		}

	}

	render(){

		return (<div className='facet-browser-wrapper' style={facetBrowserStyle}>
			<div className='facet-browser-inner' style={{padding:'0 60px'}}>
				<Toolbar style={toolBarStyle} className='clearfix'>
					{this.props.dimensions.map(this._renderDimension)}
				</Toolbar>
			</div>
		</div>)

	}

}

