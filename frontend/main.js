const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let flaskProcess = null;

function createWindow() {
  flaskProcess = spawn('python', ['backend/app.py'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      FLASK_ENV: 'production',
      FLASK_DEBUG: '0'
    }
  });

  flaskProcess.stdout.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask error: ${data}`);
  });

  flaskProcess.on('error', (error) => {
    console.error('Failed to start Flask process:', error);
    dialog.showErrorBox('Ошибка', 'Не удалось запустить сервер парсера. Убедитесь, что установлен Python и все зависимости.');
  });

  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });

  mainWindow = new BrowserWindow({
    width: 400,
    height: 910,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    alwaysOnTop: false,
    resizable: false,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadFile('frontend/index.html');
  
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.show();
    }, 1000);
  });
  
  mainWindow.on('closed', () => {
    if (flaskProcess) {
      flaskProcess.kill();
      flaskProcess = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (flaskProcess) {
    flaskProcess.kill();
    flaskProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (flaskProcess) {
    flaskProcess.kill();
    flaskProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('save-file', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: data.filename + '.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });
  
  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data.results, null, 2));
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Диалог отменен' };
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return result;
});