import React, {Component} from 'react';
const crossfilter = require('crossfilter');
import {nest} from 'd3';
import {CategoricalDimension} from './Dimension';
import {MobilePortrait, Default} from '../Responsive';

const facetBrowserStatusStyle = {
	position:'absolute',
	padding:'10px 15px',
	top:0,
	transform:'translate(0,-100%)',
	fontSize:'16px',
}

const facetBrowserStyle = {
	width:'100%',
	height:70,
	position:'absolute',
	bottom:0,
	pointerEvents:'all',
	display:'flex'
};

export default class extends Component{

	constructor(props){

		super(props);

		this.state = {
			filteredData:[...props.data]
		}

		//Initialize crossfilter with props.data
		this.cf = crossfilter(props.data);
		this.cfDimensions = {};
		props.dimensions.forEach(dimension => {
			this.cfDimensions[dimension.name] = this.cf.dimension(dimension.accessor);
		});

		this._renderDimension = this._renderDimension.bind(this);

	}

	componentWillReceiveProps(nextProps){

		if(nextProps.data !== this.props.data){
			//TODO: this doesn't deal with incremental addition of data
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

		this.props.onFilter(filteredData.map(d => d.id));

	}

	_renderDimension(d,i){

		switch(d.type){
			case 'continuous':
			case 'single':
			case 'multiple':
			default:
				let keys = nest().key(d.accessor).entries(this.props.data).map(d=>d.key);
				return <CategoricalDimension
					colors={this.props.colors}
					name={d.name}
					accessor={d.accessor}
					data={this.state.filteredData}
					onFilter={this._onFilter.bind(this, d.name, d.type)}
					keys={keys}
					key={i}
				/>
		}

	}

	_toggleDimensions(e){

		//

	}

	render(){

		const {data,colors} = this.props;
		const {filteredData} = this.state;
		const highlightingAll = data.length === filteredData.length;

		return <div>
			<Default>
				<div  
					className='facet-browser' 
					style={facetBrowserStyle}
				>
					<div
						className='facet-browser-status'
						style={Object.assign({}, facetBrowserStatusStyle, {color:colors[1]})}
					>
						Highlighting <span className='label' style={{background:highlightingAll?colors[2]:'rgb(237,12,110)'}}>{highlightingAll?'all':filteredData.length}</span> signs
					</div>
					{this.props.dimensions.map(this._renderDimension)}
				</div>
			</Default>
			<MobilePortrait>
				<div  
					className='facet-browser' 
					style={facetBrowserStyle}
				>
					<div
						className='facet-browser-status'
						style={Object.assign({}, facetBrowserStatusStyle, {
							color:colors[1],
							left:'50%',
							top:'50%',
							transform:'translate(-50%,-50%)',
							cursor:'pointer',
							background:colors[3],
							borderRadius:'1em'
						})}
						onClick={this._toggleDimensions}
					>
						<span className='label' style={{background:highlightingAll?colors[2]:'rgb(237,12,110)'}}>{highlightingAll?'all':filteredData.length}</span> signs
					</div>
				</div>
			</MobilePortrait>
		</div>

	}

}