// Native

import { parse } from "url";

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import next from "next";
import { createServer } from "http";
// Prepare the renderer once the app is ready
app.on("ready", async () => {
  const nextApp = next({
    dev: isDev,
    dir: app.getAppPath() + "/renderer",
  });
  const requestHandler = nextApp.getRequestHandler();
  // Build the renderer code and watch the files
  await nextApp.prepare();
  // Create a new native HTTP server (which supports hot code reloading)
  createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    requestHandler(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL("http://localhost:3000/");
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
