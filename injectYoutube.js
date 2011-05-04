function determineAndSendTrack(type) {
   if (document.getElementById("watch-description-extra-info")) {
        var nodes = null;
        var trackEl = null;
        var trackExtUrl = null;
        var track = {};
        track.lsource = 'YouTube';
        track.source = 'P';
        
        if (document.getElementById("watch-description-extra-info")) {
            var anchors = document.getElementsByTagName("a");
            // Check for Amazon Link
            for (var a in anchors) {
                if (anchors[a].textContent == "AmazonMP3") {
                    trackExtUrl = anchors[a].getAttribute("href");
                }
            }
        }

        if (!trackExtUrl && document.getElementById("watch-description")) {
            nodes = document.getElementById("watch-description").childNodes;
            // Check for tagging
            for (var i in nodes) {
                if (nodes[i].textContent && i == nodes.length - 2) {
                    if (nodes[i].childNodes && nodes[i].childNodes.length > 1)
                        trackEl = nodes[i].childNodes[nodes[i].childNodes.length-2];
                }
            }
        }

        var re = new RegExp('\\bmusic-note\\b');
        if (trackEl && trackEl.childNodes && re.test(trackEl.childNodes[1].getAttribute("class"))) {
            var trackStr = trackEl.childNodes[3].textContent.split(" - ",2);
            track.title = trackStr[1];
            track.artist = trackStr[0];
            track.type = type;

            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
            // Send to the UI status
            // ...
        } else if (trackExtUrl) {
            track.type = type;
            track.amazonLink = trackExtUrl;
            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
            // Send to the UI status
            // ...
        } else if (document.getElementById("eow-category").childNodes[0].textContent.match(/Music|Musik|Música|Musika|Musique|Glazba|Musica|Zene|Muziek|Musikk|Muzyka|Музыка|Hudba|Musiikki|Μουσική|Музика|מוסיקה|संगीत|音乐|音樂|音楽|음악/i)) { // English (both), Dansk, Deutsh, Espangnol (both), Filipino, Francais, Hrvatski, Italiano, Magyar, Nederlands, Norsk, Polski, Portugues (both), Pyccĸий, Slovenský, Suomi, Svenska, Čeština, Ελληνικά, Српски, עברית, हिन्द, 中文 (both), 日本語, 한국어
            track.query = document.getElementById("eow-title").textContent;
            track.type = type;
            // Send message to background process
            chrome.extension.sendRequest({messageType: "track",data:track});
            // Send to the UI status
            // ...
        }
    }
}

// Injected functions
function fireTrackEvent(newState) {
    if ( newState == 1 ) {
        if (!LikeFM.statusInterval) {
            LikeFM.statusInterval = setInterval(function() {
                var player = document.getElementById("movie_player");
                if (player.getCurrentTime() > player.getDuration() * 0.6) {
                    fireTrackEvent('finish');
                    clearInterval(LikeFM.statusInterval);
                }
            },500);
        }
    } else if ( newState == 0 ) {
        clearInterval(LikeFM.statusInterval);
        LikeFM.statusInterval = null;
    }

    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.textContent = JSON.stringify(newState);
    hiddenDiv.dispatchEvent(__lfm_trackEvent);

};

var LikeFMInject = function() {
    // Comm link with content script
    __lfm_trackEvent = document.createEvent('Event');
    __lfm_trackEvent.initEvent('myTrackEvent', true, true);

    window['onYouTubePlayerReady'] = function(){
        __lfm_originalFunc();
        document.getElementById("movie_player").addEventListener("onStateChange",'fireTrackEvent');
    };
    document.getElementById("movie_player").addEventListener("onStateChange",'fireTrackEvent');
};

// Inject interface with page scripts
if (!document.getElementById("LikeFMInject")) {
    var script = document.createElement('script');
    script.setAttribute('id','LikeFMInject');
    script.appendChild(document.createTextNode('var LikeFM = {}; var __lfm_trackEvent; var __lfm_originalFunc=function(){};if (window[\'onYouTubePlayerReady\']) __lfm_originalFunc = window[\'onYouTubePlayerReady\'];' + fireTrackEvent + '(' + LikeFMInject +')();'));
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
        } else if (newState == 'finish') {
            determineAndSendTrack('finish');
        }
    });
}
