import React, {Component} from 'react';
import {nest} from 'd3';

const highlightColor = 'rgb(237,12,110)';

const menuItemStyle = {
	padding:'5px 20px',
	fontSize:'16px',
	cursor:'pointer'
};

const menuStyle = {
	padding:'20px 0',
	borderRadius:'.25em',
	position:'absolute',
	bottom:0,
	left:15,
	right:15,
	transform:'translate(0,100%)',
	opacity:.01,
	transition:'all 200ms'
}

const dimensionSummaryStyle = {
	padding:'8px 0',
	margin:'0 15px'
};

const dimensionStyle = {
	position:'relative'
};

const MenuItem = props => {

	return <li 
		style={Object.assign({}, {color:props.selected?highlightColor:'white'}, menuItemStyle)}
		onClick={props.handleClick}
	>
		<span>{props.name}</span>
		<span 
			className='pull-right label'
			style={{
				background:props.selected?highlightColor:'rgb(50,50,50)',
				color:props.selected?'white':'rgb(100,100,100)'
			}}
			>{props.count}
		</span>
	</li>

};

class CategoricalDimension extends Component{

	constructor(props){

		super(props);

		this.nestByKey = nest().key(props.accessor).rollup(ls => ls.length);

		this.state = {
			selectedKeys:[],
			collapse:true,
			countByKey:this.nestByKey.map(props.data)
		}

		this._handleChange = this._handleChange.bind(this);
		this._handleMouseEnter = this._handleMouseEnter.bind(this);
		this._handleMouseLeave = this._handleMouseLeave.bind(this);

	}

	componentWillReceiveProps(nextProps){

		if(nextProps.accessor !== this.props.accessor){
			this.nestByKey = nest().key(nextProps.accessor).rollup(ls => ls.length);
		}

		if(nextProps.data !== this.props.data){
			this.setState({
				countByKey:this.nestByKey.map(nextProps.data)
			});
		}

	}

	_handleChange(key){

		if(this.state.selectedKeys.indexOf(key)>-1){
			const index = this.state.selectedKeys.indexOf(key);
			const selectedKeys = this.state.selectedKeys.slice();
			selectedKeys.splice(index,1);
			this.setState({selectedKeys});
			this.props.onFilter(...selectedKeys);
		}else{
			const selectedKeys = this.state.selectedKeys.slice();
			selectedKeys.push(key);
			this.setState({selectedKeys});
			this.props.onFilter(...selectedKeys);
		}

	}

	_handleMouseEnter(event){

		this.setState({
			collapse:false
		});

	}

	_handleMouseLeave(event){

		this.setState({
			collapse:true
		});

	}

	_renderSelectedKeys(){

		if(this.state.selectedKeys.length){
			return this.state.selectedKeys.map(key => <span
				key={key}
				className='label'
				style={{
					color:'white',
					background:highlightColor,
					marginRight:'5px'
				}}
			>
				{key}	
			</span>)
		}else{
			return <span 
				className='label'
				style={{
					color:this.props.colors[1],
					background:this.props.colors[2]
				}}
			>All</span>
		}

	}

	render(){

		const {keys,data,accessor,width,name,colors} = this.props;
		const {selectedKeys,collapse,countByKey} = this.state;

		const baseColor = selectedKeys.length?colors[1]:colors[2];

		return <div className='dimension categorical'
				style={Object.assign({}, dimensionStyle, {width:width})}
				onMouseEnter={this._handleMouseEnter}
				onMouseLeave={this._handleMouseLeave}
			>
			<div 
				className='dimension-summary'
				style={Object.assign({}, dimensionSummaryStyle, {
					borderTop:`1px solid ${baseColor}`,
					borderBottom:`1px solid ${baseColor}`
				})}
			>
				<label
					style={{
						fontSize:'12px',
						display:'block',
						color:baseColor
					}}
				>	
					{name.toUpperCase()}
				</label>
				{this._renderSelectedKeys()}
			</div>
			<ul 
				className='menu'
				style={Object.assign({}, menuStyle, {
					transform:`translate(0,${collapse?'100%':'-10px'})`,
					opacity:`${collapse?.01:1}`,
					background:colors[3]
				})}
			>
				{keys.map(key => <MenuItem
					key = {key}
					name = {key}
					count = {countByKey.get(key)}
					selected = {selectedKeys && selectedKeys.indexOf(key)>-1}
					handleClick = {event => {this._handleChange(key);}}
				/>)}
			</ul>
		</div>

	}

}

CategoricalDimension.defaultProps = {
	width:256
}

export default CategoricalDimension;