// @flow
import { app, Menu, dialog, BrowserWindow } from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.settingsWindow = null;
  }

  showSettingsWindow() {
    if (!this.settingsWindow) {
      this.settingsWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        modal: true
      });

      this.settingsWindow.loadURL(`file://${__dirname}/settings.html`);

      // @TODO: Use 'ready-to-show' event
      //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
      this.settingsWindow.webContents.on('did-finish-load', () => {
        if (!this.settingsWindow) {
          throw new Error('"settingsWindow" is not defined');
        }
        this.settingsWindow.show();
        this.settingsWindow.focus();
      });

      this.settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });
    }
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Rowan Mileage Log',
      submenu: [
        {
          label: 'About Rowan Mileage Log',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        {
          label: 'Hide Rowan Mileage Log',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };

    const subMenuFile = {
      label: 'File',
      submenu: [
        {
          label: 'Load',
          submenu: [
            {
              label: 'Mileage CSV File',
              click: () => {
                dialog.showOpenDialog(
                  {
                    title: 'Load Mileage CSV File',
                    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
                    properties: ['openFile']
                  },
                  filenames => {
                    this.mainWindow.send('read-trips-csv', filenames);
                    console.log(filenames);
                  }
                );
              }
            },
            {
              label: 'Tolls CSV File',
              click: () => {
                dialog.showOpenDialog(
                  {
                    title: 'Load Mileage CSV File',
                    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
                    properties: ['openFile']
                  },
                  filenames => {
                    this.mainWindow.send('read-tolls-csv', filenames);
                    console.log(filenames);
                  }
                );
              }
            },
            {
              label: 'Rowan Mileage Log Settings File',
              click: () => {
                dialog.showOpenDialog(
                  {
                    title: 'Load Rowan Mileage Log Settings File',
                    filters: [
                      { name: 'Config Files', extensions: ['conf', 'json'] }
                    ],
                    properties: ['openFile']
                  },
                  filenames => {
                    this.mainWindow.send('load-settings-file', filenames);
                    console.log(filenames);
                  }
                );
              }
            }
          ]
        },

        {
          label: 'Export as PDF',
          click: () => {
            this.mainWindow.send('prepare-pdf');
          }
        }
      ]
    };

    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        {
          label: 'Settings',
          click: () => {
            this.showSettingsWindow();
          }
        }
      ]
    };

    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        }
      ]
    };

    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };

    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuFile, subMenuEdit, subMenuView, subMenuWindow];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: 'Load',
            submenu: [
              {
                label: 'Mileage CSV File',
                click: () => {
                  dialog.showOpenDialog(
                    {
                      title: 'Load Mileage CSV File',
                      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
                      properties: ['openFile']
                    },
                    filenames => {
                      this.mainWindow.send('read-trips-csv', filenames);
                      console.log(filenames);
                    }
                  );
                }
              },
              {
                label: 'Tolls CSV File',
                click: () => {
                  dialog.showOpenDialog(
                    {
                      title: 'Load Mileage CSV File',
                      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
                      properties: ['openFile']
                    },
                    filenames => {
                      this.mainWindow.send('read-tolls-csv', filenames);
                      console.log(filenames);
                    }
                  );
                }
              },
              {
                label: 'Rowan Mileage Log Settings File',
                click: () => {
                  dialog.showOpenDialog(
                    {
                      title: 'Load Rowan Mileage Log Settings File',
                      filters: [{ name: 'Config Files', extensions: ['conf'] }],
                      properties: ['openFile']
                    },
                    filenames => {
                      this.mainWindow.send('load-settings-file', filenames);
                      console.log(filenames);
                    }
                  );
                }
              }
            ]
          },

          {
            label: 'Export as PDF',
            click: () => {
              this.mainWindow.send('prepare-pdf');
            }
          },

          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&Edit',
        submenu: [
          {
            label: 'Settings',
            click: () => {
              this.showSettingsWindow();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.toggleDevTools();
                  }
                }
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      }
    ];

    return templateDefault;
  }
}
