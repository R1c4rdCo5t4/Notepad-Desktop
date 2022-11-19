const { app, BrowserWindow, ipcMain, dialog, Notification, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const defaultMenu = require('electron-default-menu');
var textField = ""
var currentFileSaved = true
const isDevEnv = process.env.NODE_ENV === "development";

if (isDevEnv) {
  try {
    require('electron-reloader')(module)
  }
  catch {
    
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let openedFilePath;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    // titleBarOverlay: {
    //   color: '#ffff',
    //   symbolColor: '#ffff'
    // },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));




  // Open the DevTools.
  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }


  const fileMenu = {
    label: "File",
    submenu: [
      {
        label: "New File",
        click: () => ipcMain.emit("new-file-triggered"),
      },
      {
        label: "Open File",
        click: () => currentFileSaved ? ipcMain.emit("open-file-triggered") : unsavedFileDialog(),
      },
      {
        label: "Open Recent",
        role: "recentdocuments",
        submenu: [
          {
            label: "Clear Recent",
            role: "clearrecentdocuments",
          },
         
        ],
        
      },
      {type: "separator"},
    {
      label: "Save",
      click: () => saveFile(openedFilePath,textField),
    },
    {
    label: "Save as",
    click: () => saveFileDialog(textField),
    },
    {type: "separator"},
    {
    role: "quit",
    }]
  } 
 
  let menu = defaultMenu(app, shell);
 
  menu.unshift(fileMenu);

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const handleError = () => {
  new Notification({
    title: "Error",
    body:"Sorry, something went wrong.",
  }).show()
}


ipcMain.on("new-file-triggered", () => {
  saveFileDialog()
})


ipcMain.on("open-file-triggered", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Text Documents (*.txt)", extensions: ["txt"] }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];


      fs.readFile(filePath, "utf8", (error, content) => {
        if (error) {
          handleError();
        } else {
      
          openedFilePath = filePath;
          // updateRecents(filePath)
          mainWindow.webContents.send("file-opened", { filePath, content });

        }
      });
    });
});

ipcMain.on("file-content-updated", (_, content) => {
  textField = content
  currentFileSaved = false
})

const saveFile = (filePath, content) => {
  mainWindow.webContents.send("file-saved", { });
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      handleError()
    } else {
      console.log("File saved.")
      
    }
  })
  currentFileSaved = true
  
}

const saveFileDialog = (content = "") => {
  mainWindow.webContents.send("file-saved", { });
  dialog.showSaveDialog(mainWindow, {
    filters: [{name:"Text Documents (*.txt)", extensions:["txt"]}]
  }).then(({ filePath }) => {
    openedFilePath = filePath;
    console.log("file path", filePath)
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        handleError()
      }
      else {
        // updateRecents(filePath)
        mainWindow.webContents.send("file-created-saved", filePath,content)
     } 
    })
  })
}

const unsavedFileDialog = () => {
  const options = {
    type: 'question',
    buttons: ['Cancel', 'Save', 'Discard'],
    defaultId: 2,
    title: 'Question',
    message: `Do you want to save changes to ${path.parse(openedFilePath).base}?`,
    // detail: 'Changes will be lost',
    // checkboxLabel: 'Remember my answer',
    // checkboxChecked: true,
  };

  dialog.showMessageBox(null, options).then(
    (data) => { console.log(data.response ,typeof data.response)
      switch (data.response) {
        case 0: console.log("Canceled"); break;
        case 1: saveFile(openedFilePath, textField);ipcMain.emit("open-file-triggered"); break;
        case 2: console.log("Discarded Changes"); ipcMain.emit("open-file-triggered"); break;
      }
    }
 
  )
  
}


function updateRecents(path, clear = false) {
  const currentMenu = Menu.getApplicationMenu();
  if (!currentMenu) return;

  const recents = currentMenu.items
  // console.log(typeof currentMenu.getMenuItemById('File'))
  // recents.forEach(i => console.log(i))
  console.log("1")
  if (!recents) return;
  console.log("2")
  // Clear menu if requested.
  if (clear) {
    config.set('recentDocuments', []);
    recents.submenu.clear();
    recents.submenu.append(new MenuItem({ key: 'null', label: 'No Recent Documents', enabled: false }));
    Menu.setApplicationMenu(currentMenu);
    return;
  }

  const item = new MenuItem({
    label: require('path').basename(path),
    click: () => this.open(path)
  });

  // If first recent item clear empty placeholder.
  if (recents.submenu.items[0].key == 'null') {
    recents.submenu.clear();
    recents.submenu.append(item);
  }
  // Limit to maximum 10 recents.
  else if (recents.submenu.items.length >= 10) {
    const items = recents.submenu.items;
    recents.submenu.clear();
    items.push(item);
    items.slice(10).forEach((i) => recents.submenu.append(i));
  }
  // Otherwise just add item.
  else recents.submenu.append(item);

  // Update application menu.
  Menu.setApplicationMenu(currentMenu);
}