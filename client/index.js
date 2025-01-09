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
  const traceOutputChannel = vscode.window.createOutputChannel("Silex Language Server trace");
  const serverBinary = getServerBinaryPath();

  const serverOptions = {
    run: { command: serverBinary, transport: TransportKind.stdio },
    debug: { command: serverBinary, transport: TransportKind.stdio },
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'silex' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
    },
    traceOutputChannel
  };

  client = new LanguageClient(
    'silexLanguageServer',
    'Silex Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
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
