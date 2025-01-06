const path = require('path');
const vscode = require('vscode');
const { LanguageClient, LanguageClientOptions, TransportKind, Trace } = require('vscode-languageclient/node');

let client;

function getServerBinaryPath() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    return path.join(__dirname, '..', 'server', 'silex-lsp-win.exe');
  } else if (platform === 'linux') {
    return arch === 'arm64'
      ? path.join(__dirname, '..', 'server', 'silex-lsp-linux-arm64')
      : path.join(__dirname, '..', 'server', 'silex-lsp-linux');
  }

  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

function activate(context) {
  const serverBinary = getServerBinaryPath();
  const traceOutputChannel = vscode.window.createOutputChannel("Silex Language Server trace");

  const serverOptions = {
    run: { command: serverBinary, transport: TransportKind.stdio },
    debug: { command: serverBinary, transport: TransportKind.stdio },
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'silex' }],
    synchronize: {
      configurationSection: 'editor',
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
    },
    initializationOptions: {
      tabSize: vscode.workspace.getConfiguration('editor').get('tabSize', 4),
    },
    middleware: {
      sendRequest: (method, params, token, next) => {
        console.log(`[Client] Sending Request: ${method}`, params);
        return next(method, params, token);
      },
    },
    traceOutputChannel,
    trace: 2,
  };

  client = new LanguageClient(
    'silexLanguageServer',
    'Silex Language Server',
    serverOptions,
    clientOptions
  );

  client.start();

  client.onNotification((method, params) => {
    console.log(`[Client] Received Notification: ${method}`, params);
  });
}

function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

module.exports = {
  activate,
  deactivate,
};
