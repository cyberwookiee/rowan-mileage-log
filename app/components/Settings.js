// @flow
import React, { Component } from 'react';
import {remote} from 'electron';
import { Flex, Box } from 'reflexbox';

import defaultConfig from '../defaultConfig.json';

const fs = require('fs');
const path = require('path');
const ipc = require('electron').ipcRenderer;

const userData = 'userData';

const configFileName='mileageLog.conf';

type Props = {};

function fileExists(filePath){
    try
    {
        return fs.statSync(filePath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

export default class Settings extends Component<Props> {
  props: Props;

  constructor(props) {
    super(props);
        
    this.handleChange = this.handleChange.bind(this);

	const userDataPath = remote.app.getPath(userData);
	const configFilePath = path.join(userDataPath,configFileName)

	if(!fileExists(configFilePath)){
		fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig));
	}
	
	const contents = fs.readFileSync(configFilePath, 'utf8');
	const config = JSON.parse(contents);

	this.state = { config };
  }

  handleChange(k,e){
    const {config} = this.state;
    config[k] = e.target.value;
    this.setState({config});

	const userDataPath = remote.app.getPath(userData);
	const configFilePath = path.join(userDataPath,configFileName);
    fs.writeFileSync(configFilePath, JSON.stringify(config));
    ipc.send('reload-config');
  }
  
  render() {
	const {config} = this.state;
    
    return(
        <div className="settings">
            <div className="settings-header">
                <h1 className="text-center">Milegage Log Settings</h1>
            </div>
            <div className="settings-table">
                {Object.keys(config).map((k) => 
                    <Flex className="height-50" key={k} align='center'>
                        <Box className="full-height borders text-center" w={4/12}>{k}</Box>
                        <Box className="full-height borders text-center" w={8/12}><input className="full-width full-height" type="text" name={k} value={config[k]} onChange={this.handleChange.bind(null,k)}/></Box>
                    </Flex>
                )}
            </div>
       </div>
    );
  }
}
