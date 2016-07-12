const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const path = require('path');

var mainWindow = null;

// Quit when all windows are closed.

const onQuit = function() {
  app.quit()
};

const encodeArgsAsQueryString =
  args =>
  args.reduce
  ( ({flag, query}, arg) =>
    ( /^--\w+$/.test(arg) // If new flag swap flag.
    ? { flag: arg.substr(2)
      , query:
        ( query === ""
        ? `${arg.substr(2)}`
        : `${query}&${arg.substr(2)}`
        )
      }
    : flag == null  // If there is no flag then skip.
    ? { flag
      , query
      }
    : { flag
      , query:
        ( ( query.endsWith(`&${flag}`) || query === flag )
        ? `${query}=${encodeURIComponent(arg)}`
        : `${query}&${flag}=${encodeURIComponent(arg)}`
        )
      }
    )
  , { flag: null
    , query: ""
    }
  )
  .query



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.

var onReady = function() {
  // Create the browser window.
  mainWindow = new BrowserWindow
  ( { width: 1024
    , height: 740
    , frame: false
    , webPreferences:
      { nodeIntegration: true
      , preload: path.resolve(path.join('.'), 'electron-preload.js')
      }
    }
  );

  // and load the index.html of the app.
  mainWindow.loadURL
  (`file://${path.resolve(module.filename, '../dist/index.html')}?${encodeArgsAsQueryString(process.argv.slice(2))}`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

app.on('window-all-closed', onQuit);
app.on('ready', onReady);
