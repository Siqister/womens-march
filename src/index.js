import React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import App from './components/App';

import 'bootstrap/dist/css/bootstrap.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './stylesheet/main.css';

render(
	<MuiThemeProvider>
		<App />
	</MuiThemeProvider>, 
	document.getElementById('root'));

injectTapEventPlugin();
