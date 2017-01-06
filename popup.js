

function ancestryPhotos()
{
	var btn = document.getElementById('btnDownloadMedia');

	if(btn.value == 'Stop Downloading Media')
	{
		chrome.tabs.executeScript({
			code: 'window.location.href = window.location.href.replace("&AncestryMediaDownload=1", "")'
		});
		btn.value = 'Download Media';
	}
	else 
	{
		chrome.tabs.executeScript({
			code: 'var actionmethod = "media"'
		});
		chrome.tabs.executeScript(null, {file: "AncestryMediaContent.js"});
		
		btn.value = 'Stop Downloading Media';
	}
}






function init() 
{
	document.getElementById('btnDownloadMedia').addEventListener('click', ancestryPhotos, false);

	let request = new XMLHttpRequest();
	let message = "v=1&tid=UA-6097089-14&cid=35009a79-1a05-49d7-b876-2b884d0f825b&aip=1&ds=add-on&t=event&ec=AAA&ea=popup";

	request.open("POST", "https://www.google-analytics.com/collect", true);
	request.send(message);
}    
document.addEventListener('DOMContentLoaded', init);
