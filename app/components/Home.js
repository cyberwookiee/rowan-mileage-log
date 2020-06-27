/* eslint-disable no-param-reassign */
// @flow
import React, { Component } from 'react';
import { remote } from 'electron';
import MileageLog from './MileageLog';

import styles from './Home.css';
import defaultConfig from '../defaultConfig.json';

const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const path = require('path');

const userData = 'userData';
// const logs = 'logs';

const csvTokenRx = /("(?:[^"]|"")*"|[^,"\n\r]*)(,|\r?\n|\r)/y;

const csvUnEscapeQuoteRx = /""/g;

const configFileName = 'mileageLog.conf';

type Props = {};

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

function csvParse(s) {
  if (s && s.slice(-1) !== '\n') s += '\n';
  let ok;
  const rows = [];
  let row = [];
  csvTokenRx.lastIndex = 0;
  for (;;) {
    ok = csvTokenRx.lastIndex === s.length;
    const m = s.match(csvTokenRx);
    if (!m) break;
    let v = m[1];
    const d = m[2];
    if (v[0] === '"') {
      v = v.slice(1, -1);
      v = v.replace(csvUnEscapeQuoteRx, '"');
    }
    if (d === ',' || v) row.push(v);
    if (d !== ',') {
      rows.push(row);
      row = [];
    }
  }
  return ok ? rows : null;
}

// const logsPath = remote.app.getPath(logs);

function getConfigFilePath() {
  const userDataPath = remote.app.getPath(userData);

  const configFilePath = path.join(userDataPath, configFileName);

  console.log(configFilePath);

  return configFilePath;
}

function findMostLikelyHeaderLine(mileageHeaderLine, contents) {
  const expectedHeaderValues = mileageHeaderLine.split(',');

  const lines = contents.split(/\r?\n/);
  let index = 0;
  let indexNumMatches = 0;

  lines.forEach((line, i) => {
    const cols = line.split(',');

    let matches = 0;

    expectedHeaderValues.forEach(expected => {
      matches += cols.findIndex(col => expected === col) >= 0 ? 1 : 0;
    });

    if (matches > indexNumMatches) {
      index = i;
      indexNumMatches = matches;
    }
  });
  return index;
}

export default class Home extends Component<Props> {
  props: Props;

  constructor(props) {
    super(props);

    this.handleSelectTripsFile = this.handleSelectTripsFile.bind(this);
    this.handleSelectTollsFile = this.handleSelectTollsFile.bind(this);
    this.processTripsFile = this.processTripsFile.bind(this);
    this.processTollsFile = this.processTollsFile.bind(this);
    this.reloadConfig = this.reloadConfig.bind(this);
    this.replaceConfig = this.replaceConfig.bind(this);

    const configFilePath = getConfigFilePath();

    if (!fileExists(configFilePath)) {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig));
    }

    const contents = fs.readFileSync(configFilePath, 'utf8');
    const config = JSON.parse(contents);

    this.state = { trips: [], tolls: [], printing: false, config };

    ipc.on('prepare-pdf', () => {
      this.setState({ printing: true }, () => {
        ipc.send('print-to-pdf');
      });
    });

    ipc.on('reload-config', this.reloadConfig);

    ipc.on('wrote-pdf', () => {
      this.setState({ printing: false });
    });

    ipc.on('read-tolls-csv', (event, paths) => {
      this.handleSelectTollsFile(paths);
    });

    ipc.on('read-trips-csv', (event, paths) => {
      this.handleSelectTripsFile(paths);
    });

    ipc.on('load-settings-file', (event, paths) => {
      this.replaceConfig(paths);
    });
  }

  replaceConfig(paths) {
    if (paths != null && paths.length > 0) {
      const configFilePath = getConfigFilePath();
      const contents = fs.readFileSync(paths[0], 'utf8');
      const config = JSON.parse(contents);
      fs.writeFileSync(configFilePath, JSON.stringify(config));
      this.setState({ config });
    }
  }

  reloadConfig() {
    const { config } = this.state;
    const configFilePath = getConfigFilePath();

    const newContents = fs.readFileSync(configFilePath, 'utf8');
    const newConfig = JSON.parse(newContents);

    const processTrips =
      newConfig.mileageHeaderLine !== config.mileageHeaderLine;
    const processTolls = newConfig.tollsHeaderLine !== config.tollsHeaderLine;

    this.setState({ config: newConfig }, () => {
      if (processTrips) {
        this.processTripsFile();
      }
      if (processTolls) {
        this.processTollsFile();
      }
    });
  }

  processTripsFile() {
    const { tripsFilePath, config } = this.state;
    if (tripsFilePath) {
      const columns = config.mileageHeaderLine.split(',');

      fs.readFile(tripsFilePath, 'utf8', (pErr, contents) => {
        if (pErr) {
          console.error(pErr);
        } else {
          const index = findMostLikelyHeaderLine(
            config.mileageHeaderLine,
            contents
          );

          const lines = csvParse(contents).map(l =>
            columns.reduce((row, col, idx) => {
              row[col] = l[idx];
              return row;
            }, {})
          );

          this.setState({ trips: lines.slice(index + 1) });
        }
      });
    }
  }

  processTollsFile() {
    const { tollsFilePath, config } = this.state;
    if (tollsFilePath) {
      const columns = config.tollsHeaderLine.split(',');

      fs.readFile(tollsFilePath, 'utf8', (pErr, contents) => {
        if (pErr) {
          console.error(pErr);
        } else {
          let lines = csvParse(contents);

          lines = lines.map(l =>
            columns.reduce((row, col, idx) => {
              row[col] = l[idx];
              return row;
            }, {})
          );

          this.setState({ tolls: lines.slice(1) });
        }
      });
    }
  }

  handleSelectTripsFile(paths) {
    if (paths != null && paths.length > 0) {
      this.setState({ tripsFilePath: paths[0] }, this.processTripsFile);
    }
  }

  handleSelectTollsFile(paths) {
    if (paths != null && paths.length > 0) {
      this.setState({ tollsFilePath: paths[0] }, this.processTollsFile);
    }
  }

  render() {
    const { printing, trips, tolls, config } = this.state;

    if (printing) {
      return (
        <MileageLog
          config={config}
          trips={trips}
          tolls={tolls}
          printing={printing}
        />
      );
    }

    return (
      <div className={styles.container}>
        <MileageLog
          config={config}
          trips={trips}
          tolls={tolls}
          printing={printing}
        />
      </div>
    );
  }
}
