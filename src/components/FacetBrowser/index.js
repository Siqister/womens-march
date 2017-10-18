import React, {Component} from 'react';
const crossfilter = require('crossfilter');
import {nest, extent} from 'd3';
import {Toolbar} from 'material-ui/Toolbar';

import {MultipleDimension, ContinuousDimension} from './Dimension';

const facetBrowserStyle = {
	width:'100%',
	height:60,
	background:'linear-gradient(120deg, rgb(5,5,5), rgb(40,40,40))',
	position:'absolute',
	bottom:0,
	pointerEvents:'all'
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

		//For categorical values
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

		//Update rest of viz
		if(values.length===0){
			this.props.onFilter([]);
		}else{
			this.props.onFilter(filteredData.map(d => d.filename));
		}

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
				return <MultipleDimension
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

		console.log('FacetBrowser:re-render');

		return (<div className='facet-browser-wrapper' style={facetBrowserStyle}>
			<Toolbar>
				{this.props.dimensions.map(this._renderDimension)}
			</Toolbar>
		</div>)

	}

}

