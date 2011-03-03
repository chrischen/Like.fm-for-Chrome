var LikeFM = {};

function fireTrackEvent(data) {
    // Context of the page
    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.textContent = JSON.stringify(data);
    hiddenDiv.dispatchEvent(trackEvent);

    if (data.status == 'playing' && !LikeFM.statusInterval) {
        // Song has started playing - start polling
        LikeFM.statusInterval = setInterval(function() {
            var status = Grooveshark.getCurrentSongStatus();
            status.statusUpdate = true;
            fireTrackEvent(status);
        },500);
    } else if (data.status == 'completed') {
        clearInterval(LikeFM.statusInterval);
        LikeFM.statusInterval = null;
    }
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
    script.appendChild(document.createTextNode('var LikeFM = {}; var trackEvent;' + fireTrackEvent + '('+ LikeFMInject +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
}

// Comm link medium div
if (!document.getElementById("LikeFMComm")) {
    var comm = document.createElement('div');
    comm.setAttribute('id','LikeFMComm');
    comm.style.display = "none";

    (document.body || document.documentElement).appendChild(comm);

    // Comm link with injected script
    document.getElementById('LikeFMComm').addEventListener('myTrackEvent', function() {
        var track = {};
        var data = JSON.parse(document.getElementById('LikeFMComm').textContent);
        var percent = data.song.position/data.song.calculatedDuration;
        track.lsource = 'Grooveshark';
        track.source = 'P';

        if (data.status == 'playing' && !data.statusUpdate) {
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
