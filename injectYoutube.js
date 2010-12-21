function determineAndSendTrack(type) {
   if (document.getElementById("watch-description")) {
        var nodes = document.getElementById("watch-description").childNodes;
        var trackEl;
        var track = {};
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

            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
        } else if (document.getElementById("eow-category").childNodes[0].textContent.match(/Music|Musik|Música|Musika|Musique|Glazba|Musica|Zene|Muziek|Musikk|Muzyka|Музыка|Hudba|Musiikki|Μουσική|Музика|מוסיקה|संगीत|音乐|音樂|音楽|음악/i)) { // English (both), Dansk, Deutsh, Espangnol (both), Filipino, Francais, Hrvatski, Italiano, Magyar, Nederlands, Norsk, Polski, Portugues (both), Pyccĸий, Slovenský, Suomi, Svenska, Čeština, Ελληνικά, Српски, עברית, हिन्द, 中文 (both), 日本語, 한국어
            track.query = document.getElementById("eow-title").textContent;
            track.type = type;
            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
        }
    }
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
           determineAndSendTrack('touch');
        } else if (newState == 0) {
            determineAndSendTrack('finish');
        }
        
    });
}