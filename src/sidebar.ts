import * as vscode from "vscode";
import { getNonce } from "./util/common.util";

export class Sidebar implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "searchQuestion": {
                    if (!data.value) {
                        return;
                    }
                    vscode.commands.executeCommand("askguru.search");
                    //vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "askQuestion": {
                    if (!data.value) {
                        return;
                    }
                    vscode.commands.executeCommand("askguru.askQuestion");
                    //vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "view", "sidebar-view", "dist", "index.js")
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "view", "sidebar-view", "dist", "index.css")
        );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                        Use a content security policy to only allow loading images from https or from our extension directory,
                        and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'self';frame-src https://giphy.com/; connect-src http://localhost:8088; img-src * 'self' data: vscode-resource: https:; script-src vscode-resource: https://unpkg.com/; style-src vscode-resource: https://unpkg.com/ 'unsafe-inline';" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link href="${styleMainUri}" rel="stylesheet">
            <script defer src="${scriptUri}"></script>
        </head>
        <body>            
            <div id="app"></div>
        </body>
        </html> 
        `;
    }
}