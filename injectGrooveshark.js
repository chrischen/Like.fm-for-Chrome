var LikeFM = {};

function fireTrackEvent(data) {
    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.innerText = JSON.stringify(data);
    hiddenDiv.dispatchEvent(trackEvent);
}
function LikeFMInject () {
    // Comm link with content script
    trackEvent = document.createEvent('Event');
    trackEvent.initEvent('myTrackEvent', true, true);

    function bind() {
        try {
            window.Grooveshark.setSongStatusCallback("fireTrackEvent");
        } catch (e) {
            setTimeout(bind,1200);
        }
    }
    bind();
}

// Below is in the context of content script
// Injected script
if (!document.getElementById("LikeFMInject")) {
    var script = document.createElement('script');
    script.setAttribute('id','LikeFMInject');
    script.appendChild(document.createTextNode('var trackEvent;' + fireTrackEvent + '('+ LikeFMInject +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
}

// Comm link medium div
if (!document.getElementById("LikeFMComm")) {
    var comm = document.createElement('div');
    comm.setAttribute('id','LikeFMComm');
    (document.body || document.documentElement).appendChild(comm);

    // Comm link with injected script
    document.getElementById('LikeFMComm').addEventListener('myTrackEvent', function() {
        var track = {};
        var data = JSON.parse(document.getElementById('LikeFMComm').textContent);
        var percent = data.song.position/data.song.calculatedDuration;
        track.lsource = 'Grooveshark';
        track.source = 'P';

        if (data.song.position == 0
            && (
                    (LikeFM.currentTrack
                        && (data.song.songName != LikeFM.currentTrack.title || data.song.artistName != LikeFM.currentTrack.artist)
                    ) || !LikeFM.currentTrack
                )
        ) {
            track.title = data.song.songName;
            track.artist = data.song.artistName;
            track.album = data.song.albumName;
            track.type = 'touch';
            // Send message to background process
            chrome.extension.sendRequest({messageType:"track",data:track});

            LikeFM.currentTrack = track;
            
        } else if (data.status == 'playing' && percent > 0.8 && LikeFM.currentTrack) {
            track.title = data.song.songName;
            track.artist = data.song.artistName;
            track.album = data.song.albumName;
            track.type = 'finish';

            // Send message to background process
            chrome.extension.sendRequest({messageType:"track",data:track});
            LikeFM.currentTrack = null;
        }
    });
}