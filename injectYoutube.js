function determineAndSendTrack(type) {
   var track = {};
   if (document.getElementById("watch-description")) {
        var nodes = document.getElementById("watch-description").childNodes;
        var trackEl;
        track.lsource = 'YouTube';
        track.source = 'P';
        for (var i in nodes) {
            if (nodes[i].textContent && i == nodes.length - 2) {
                if (nodes[i].childNodes && nodes[i].childNodes.length > 1)
                    trackEl = nodes[i].childNodes[nodes[i].childNodes.length-2];
            }
        }
        if (trackEl && trackEl.childNodes[1].getAttribute("class") == "master-sprite music-note") {
            var trackStr = trackEl.childNodes[3].textContent.split(" - ",2);
            track.title = trackStr[1];
            track.artist = trackStr[0];
            track.type = type;
	    if (document.getElementById('LikeFMRatingPopup')) {
		rating = document.getElementById('LikeFMRatingPopup').rating
		if (rating > 0) {
		    track.rating = rating
		}
	    }

            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
        } else if (document.getElementById("eow-category").childNodes[0].textContent.match(/Music|Musik|Música|Musika|Musique|Glazba|Musica|Zene|Muziek|Musikk|Muzyka|Музыка|Hudba|Musiikki|Μουσική|Музика|מוסיקה|संगीत|音乐|音樂|音楽|음악/i)) { // English (both), Dansk, Deutsh, Espangnol (both), Filipino, Francais, Hrvatski, Italiano, Magyar, Nederlands, Norsk, Polski, Portugues (both), Pyccĸий, Slovenský, Suomi, Svenska, Čeština, Ελληνικά, Српски, עברית, हिन्द, 中文 (both), 日本語, 한국어
            track.query = document.getElementById("eow-title").textContent;
            track.type = type;
            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
        }
    }
    return track;
}
// Injected functions
function fireTrackEvent(newState) {
  var hiddenDiv = document.getElementById('LikeFMComm');
  hiddenDiv.textContent = JSON.stringify(newState);
  hiddenDiv.dispatchEvent(trackEvent);
};

var LikeFMInject = function() {
    // Comm link with content script
    trackEvent = document.createEvent('Event');
    trackEvent.initEvent('myTrackEvent', true, true);

    window['onYouTubePlayerReady'] = function(){
        document.getElementById("movie_player").addEventListener("onStateChange",'fireTrackEvent');
    };
    document.getElementById("movie_player").addEventListener("onStateChange",'fireTrackEvent');
};

// Inject interface with page scripts
if (!document.getElementById("LikeFMInject")) {
    var script = document.createElement('script');
    script.setAttribute('id','LikeFMInject');
    script.appendChild(document.createTextNode('var trackEvent;' + fireTrackEvent + '(' + LikeFMInject +')();'));
    document.documentElement.getElementsByTagName("HEAD")[0].appendChild(script);
}

// Create Comm div
if (!document.getElementById("LikeFMComm")) {
    var comm = document.createElement('div');
    comm.setAttribute('id','LikeFMComm');
    comm.style.display = 'none';
    
    (document.body || document.documentElement).appendChild(comm);

    // Comm link with injected script
    comm.addEventListener('myTrackEvent', function() {
        var newState = JSON.parse(comm.textContent);
        if (newState == 1) {
           var track = determineAndSendTrack('touch');
	   promptRating(track);
        } else if (newState == 0) {
            var track = determineAndSendTrack('finish');
        }
    });
}

// Rating popup related code
function hoverStarRating(rating) {
    return function() {
	for (var i = 1; i <= rating; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px -32px"
	}
	for (var i = rating + 1; i <= 5; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px 0px"
	}
    };
}

function restoreStarRating() {
    return function() {
	rating = document.getElementById('LikeFMRatingPopup').rating
	for (var i = 1; i <= rating; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px -16px"
	}
	for (var i = rating + 1; i <= 5; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px 0px"
	}
    };
}

function setStarRating(rating) {
    return function() {
	for (var i = 1; i <= rating; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px -16px"
	}
	for (var i = rating + 1; i <= 5; i++) {
	    document.getElementById('LikeFMRating' + i).style.backgroundPosition = "0px 0px"
	}
	document.getElementById('LikeFMRatingPopup').rating = rating
    };
}

function promptRating(track) {
    if (document.getElementById('LikeFMRatingPopup') || localStorage.neverShowRatingBar) {
	return;
    }

    var notice = document.createElement('div');
    notice.setAttribute('id','LikeFMRatingPopup');
    notice.setAttribute('rating', 0);
    notice.style.position = "fixed";
    notice.style.top = 0;
    notice.style.width = "100%";
    notice.style.zIndex = "1001";
    notice.style.background = "#dfdfdf";
    notice.style.borderTop = "1px solid #f2f2f2";
    notice.style.borderBottom = "1px solid #8e8e8e";
    notice.style.fontSize = "0.9em";
    notice.style.fontFamily = "helvetica";
    notice.innerHTML = '<div style="float:left;padding:.4em" ><img style="vertical-align:bottom" src="http://like.fm/img/like_small.png" /> Like.fm for Chrome '
	+ '(<a href="#" id="LikeFMNeverShow" value>Never show rating bar</a>)'
	+ '</div>'
	+ '<div style="float:right; fontSize=1em">'
        + '<div style="float:right; padding-left: 15px">'
	+ ' <input id="LikeFMShare" type="button" value="Share" />'
	+ ' <input id="LikeFMClose" type="button" value="Close" />'
	+ '</div>'
        + '<div id="LikeFMRating5" style="float: right; background:url(\'http://like.fm/img/icons/star.gif\') no-repeat 0 0px; height:17px; width:15px"></div>'
        + '<div id="LikeFMRating4" style="float: right; background:url(\'http://like.fm/img/icons/star.gif\') no-repeat 0 0px; height:17px; width:15px"></div>'
        + '<div id="LikeFMRating3" style="float: right; background:url(\'http://like.fm/img/icons/star.gif\') no-repeat 0 0px; height:17px; width:15px"></div>'
        + '<div id="LikeFMRating2" style="float: right; background:url(\'http://like.fm/img/icons/star.gif\') no-repeat 0 0px; height:17px; width:15px"></div>'
        + '<div id="LikeFMRating1" style="float: right; background:url(\'http://like.fm/img/icons/star.gif\') no-repeat 0 0px; height:17px; width:15px"></div>'
	+ '<div style="float:right; font-size:12px; padding-top:3px">Rate "'
	+ track.title.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") + '" by '
	+ track.artist.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") + ': &nbsp; </div>'
	+ '</div>';
    document.body.insertBefore(notice,document.body.firstChild);
    for (var i = 1; i <= 5; i++) {
	document.getElementById('LikeFMRating' + i).onclick = setStarRating(i);
	document.getElementById('LikeFMRating' + i).onmouseover = hoverStarRating(i);
	document.getElementById('LikeFMRating' + i).onmouseout = restoreStarRating();
    }
    document.getElementById("LikeFMClose").onclick = function() {
        notice.style.display = "none";
	var share = document.getElementById('LikeFMSharePopup')
	if (share) {
	    share.style.display = "none";
	}
    };
    document.getElementById("LikeFMShare").onclick = function() {
	var share = document.getElementById('LikeFMSharePopup')
	if (share && share.style.display != "none") {
	    share.style.display = (share.style.display == "none" ? "block" : "none");
	    return;
	}
        share = document.createElement('div');
	share.setAttribute('id', 'LikeFMSharePopup');
	share.style.position = "fixed";
	share.style.zIndex = "1002";
	share.style.top = "24px";
	share.style.right = "1px";
	share.style.background = '#FFFFFF'
	share.style.border = '1px solid #555555'
	share.innerHTML = '<iframe width="320" height="240" scrolling="no" src="'
	    + 'http://www.like.fm/'
	    + '"></iframe>';
	document.body.insertBefore(share, document.body.firstChild)
    };
    document.getElementById("LikeFMNeverShow").onclick = function() {
	localStorage.neverShowRatingBar = true
        notice.style.display = "none";
    };
}