import React from 'react';
import {CSSTransitionGroup} from 'react-transition-group';

import {animatedButton, LoadingIndicator} from './ui';
import NavigationBefore from 'material-ui/svg-icons/image/navigate-before';
import NavigationAfter from 'material-ui/svg-icons/image/navigate-next';
import Close from 'material-ui/svg-icons/navigation/close';

const color = 'rgb(80,80,80)';

const imageStyle = {
	position:'fixed',
	width:'100%',
	bottom:'25%',
	top:'60px',
	pointerEvents:'none'
}

const imageDetailListStyle = {
	position: 'absolute',
	padding: '5px 0'
}

const imageDetailListItemStyle = {
	width:'100%',
	padding:'5px 0',
	clear:'both'
}

const ImageDetailValueStyle = {
	display:'inline',
	margin:'3px',
	fontSize:'.7em',
	float:'left'
}

const buttonContainerStyle = {
	position:'absolute',
	width:160,
	height:50,
	top:'100%',
	left:'50%',
	transform:'translate(-50%,-20px)',
	pointerEvents:'auto'
}

const PrevButton = animatedButton(NavigationBefore);
const NextButton = animatedButton(NavigationAfter);
const ExitButton = animatedButton(Close);

const ImageDetailValue = props => 
	<li style={ImageDetailValueStyle}>
		{props.type=='color'?<span style={{
			width:15,
			height:15,
			borderRadius:20,
			background:`#${props.value}`,
			display:'inline-block'
		}}></span>:props.value}
	</li>

const ImageDetailListItem = props => {

	const field = props.field.toUpperCase();
	const value = props.data[props.id];

	return <li 
		style={ Object.assign({}, imageDetailListItemStyle, {
			color: props.colors[0],
			borderBottomColor: props.colors[2]
		}) } 
		className='clearfix'
	>
		<span style={{fontSize:'.7em', display:'block'}}>{field}</span>
		<span style={{fontSize:'1.3em', display:'block'}}>
			{Array.isArray(value)?<ul>
				{value.map(v=><ImageDetailValue value={v} type={props.type} key={v}/>)}
			</ul>:JSON.stringify(value)}
		</span>
	</li>
}

const Image = props => {

	return (
		<div className='image-detail'
			style={imageStyle}
		>
			<div className='container'>
				<div className='col-md-3 col-md-offset-9'>
					<CSSTransitionGroup
						transitionName='image-detail-list'
						transitionAppear={true}
						transitionAppearTimeout={300}
						transitionEnterTimeout={300}
						transitionLeaveTimeout={300}
					>
						{props.metadata&&<ul className='image-detail-list' 
							style={ Object.assign({}, imageDetailListStyle, {borderBottom:`1px solid ${props.colors[1]}`}) } 
							key={props.metadata._id}
						>
							<ImageDetailListItem colors={props.colors} data={props.metadata} id='_id' field='Unique ID'/>
							<ImageDetailListItem colors={props.colors} data={props.metadata} id='filename' field='File'/>
							<ImageDetailListItem colors={props.colors} data={props.metadata} id='colors' field='Colors' type='color'/>
							<ImageDetailListItem colors={props.colors} data={props.metadata} id='labels' field='Labels'/>
							
						</ul>}
					</CSSTransitionGroup>
				</div>
			</div>
			{props.imageIndex&&<div className='button-container'
				style={buttonContainerStyle}>
				<PrevButton disabled={props.loading} url={`/images/${props.prev}`}/>
				{props.loading&&<LoadingIndicator />}
				{!props.loading&&<ExitButton centered url='/'/>}
				<NextButton disabled={props.loading} pullRight url={`/images/${props.next}`}/>
			</div>}
		</div>
	);
}

export default Image;