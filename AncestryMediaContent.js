

/*
* Creating javascript to be used in the main actions from the popup.
*/

var downloadDelay = 2; // # of seconds.
var url = window.location.href;

if(actionmethod === undefined)
{
	var actionmethod = '';

	if(url.endsWith('&AncestryMediaDownload=1')) 
	{
		if(url.includes('/photo?')) {
			// start downloading the next set of photos as soon as the page loads.
			document.addEventListener('DOMContentLoaded', loadedForPhotos);
		}
		if(url.includes('/story?')) {
			// start downloading the next set of photos as soon as the page loads.
			document.addEventListener('DOMContentLoaded', loadedForStories, false);
		}
	}

}

// on first run, figure out the right download style
if(actionmethod == 'media') {
	if(url.includes('/photo?') || url.endsWith('/photo'))
		actionmethod = 'photos';
	else if(url.includes('/story?') || url.endsWith('/story'))
		actionmethod = 'stories';
	else alert('Please navigate to the Ancestry Media Gallery Photos or Stories tab');
}

if(actionmethod == 'photos')
{
	if(/trees.ancestry.com\/tree\/.*\/photo/.test(url))
		downloadAncestryPhotos();
}
else if(actionmethod == 'stories')
{
	if(/trees.ancestry.com\/tree\/.*\/story/.test(url))
		downloadAncestryStories();
}


// class="mediaFigure"   class="mediaItem"  a  img
// download image orig
//http://mediasvc.ancestry.com/v2/image/namespaces/1093/media/d63d5729-5a4b-4360-9f86-01bd878eabc6?client=TreesUI

// link to main image page
//http://mediasvc.ancestry.com/v2/image/namespaces/1093/media/d63d5729-5a4b-4360-9f86-01bd878eabc6.jpg?client=TreeService&MaxSide=160

function downloadAncestryPhotos()
{
	// get total count
	// class="pageOf"

	var metaFile = '';
	var elems = document.getElementsByClassName('mediaItem');
	for(var idx = 0; idx < elems.length; idx++)
	{
		(function(idx) {
			var html = elems[idx].innerHTML;
			var startIdx = html.indexOf('src="') + 5;
			var endIdx = html.indexOf('?client=', startIdx);
			var photoUrl = html.substring(startIdx, endIdx) + '?client=TreesUI';
			var name = elems[idx].nextSibling.nextSibling.childNodes[1].innerText;
			var photoType = html.substring(endIdx-4, endIdx);
			
			metaFile += '"'+name+'","'+photoType+'","'+photoUrl+'"\n';

			setTimeout(function(){ 
				downloadFile(photoUrl, 'ancestryPhoto'+idx+'.jpg');
			}, 1000*idx*downloadDelay);
		})(idx);
	}
	
	downloadMetaFile(metaFile, 'Photos');

	setTimeout(function(){ 
		navigateNextPage('&AncestryMediaDownload=1');
	}, (1000*elems.length*downloadDelay)+3000); // extra three seconds to make sure all the pages downloads are going.

}

function loadedForPhotos() 
{
	// wait another 3 seconds for good measure.
	setTimeout(function(){ actionmethod = 'photos'; downloadAncestryPhotos(); }, 3000);
}







// class=Story class="story_pdf"
// http://trees.ancestry.com/tree/32168548/downloadmedia/17084f07-b68b-46e8-994e-7b9a5cf09163?usePUBJs=true

// class=Story class="story_inline"
// http://trees.ancestry.com/tree/32168548/story/523?pgn=32912&usePUBJs=true&_phsrc=rdW266

// class=Story class="story_word"
// http://trees.ancestry.com/tree/32168548/downloadmedia/b2c7463c-5b97-421a-b043-4fa35ad5c408?usePUBJs=true

function downloadAncestryStories() 
{
	// create a .csv file with file names and guids per page.
	var metaFile = '';
	var elems = document.getElementsByClassName('Story');
	for(var idx = 0; idx < elems.length; idx++)
	{
		(function(idx) {
			var html = elems[idx].innerHTML;
			var startIdx = html.indexOf('href="') + 6;
			var endIdx = html.indexOf('">', startIdx);
			var fileUrl = html.substring(startIdx, endIdx);
			var nameEndIdx = html.indexOf('</a>', endIdx);
			var name = html.substring(endIdx + 2, nameEndIdx);

			var fileType = '';
			if(html.indexOf('class="story_inline"') > -1)
				fileType = 'inline';
			else if(html.indexOf('class="story_pdf"') > -1)
				fileType = 'pdf';
			else if(html.indexOf('class="story_word"') > -1)
				fileType = 'word';

			metaFile += '"'+name+'","'+fileType+'","'+fileUrl+'"\n';

			// inline stories can't be just downloaded, they need to be parsed out.
			if(fileType == 'inline')
			{
				setTimeout(function(){ 
					downloadText(fileUrl, 'ancestryfile_'+idx+'_'+name+'.html');
				}, 1000*idx*downloadDelay);
			}
			else
			{
				setTimeout(function(){ 
					downloadFile(fileUrl, 'ancestryFile'+idx);
				}, 1000*idx*downloadDelay);
			}
		})(idx);
	}
	
	downloadMetaFile(metaFile, 'Stories');
	
	setTimeout(function(){ 
		navigateNextPage('&AncestryMediaDownload=1');
	}, (1000*elems.length*downloadDelay)+3000); // extra three seconds to make sure all the pages downloads are going.
}

function loadedForStories() 
{
	// wait another 2 seconds for good measure.
	setTimeout(function(){ actionmethod = 'stories'; downloadAncestryStories(); }, 3000);
}








function downloadFile(fileUrl, fileName) 
{
	var a = document.createElement('a');
	a.href = fileUrl;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function downloadText(fileUrl, fileName)
{
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			var startIdx = this.responseText.indexOf('<div class="storyDiv">') + 22;
			var endIdx = this.responseText.indexOf('</div>', startIdx);
			var fileText = this.responseText.substring(startIdx, endIdx);
			fileText = '<html><body><h2>' + fileName + '</h2><div>' + fileText + '</div></body></html>';
			fileText = 'data:application/octet-stream;charset=utf-8;base64,' + window.btoa(fileText);
			downloadFile(fileText, fileName);
		}
	}
  
	xhr.open("GET", fileUrl);
    //xhr.responseType = "document";
    xhr.send();
	
}

function downloadMetaFile(metaBody, mediaType)
{
	var fileText = '"name","type","url"\n';
	fileText += metaBody;
	fileText = 'data:application/octet-stream;charset=utf-8;base64,' + window.btoa(fileText);
	
	var startIdx = window.location.href.indexOf('pgNum=') + 6;
	var page = "1";
	if(startIdx > -1) 
	{
		var endIdx = window.location.href.indexOf('&', startIdx);
		if(endIdx < 0) endIdx = window.location.href.length;
		page = window.location.href.substring(startIdx, endIdx);
	}
	
	var fileName = 'AncestryMetaFile_' + mediaType + '_pg_' + page + '.csv';
	
	downloadFile(fileText, fileName);
}

function navigateNextPage(urlEnding)
{
	var nextpage = document.getElementsByClassName('pagination')[0].getElementsByClassName('selected')[0].nextSibling.nextSibling.childNodes[1];
	
	// check for the last page and exit if so.
	if(nextpage.innerText == '>') {
		alert('Downloads have all been started.');
		return;
	}
	
	nextpage.href = nextpage.href.replace(urlEnding, '') + urlEnding;
	nextpage.click();

}

















