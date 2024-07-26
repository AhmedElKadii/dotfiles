
const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('motivation.getMotivated', function () {
		const RedditImageFetcher = require("reddit-image-fetcher");
		const fetchPromise =  RedditImageFetcher.fetch({
			type: "custom",
			total: 1,
			subreddit: ["GetMotivated"]
		  })
		  fetchPromise.then(response =>{
			return response
		  }).then(people=>{
			const imageLink = people.map(link=>link.image).join("\n")
			console.log(imageLink)
			vscode.env.openExternal(imageLink)
			
		  })
		
		
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
