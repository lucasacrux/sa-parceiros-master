export function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.openAIChat', () => {
        // Logic for opening the OpenAI chat interface
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}