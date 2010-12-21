function fireTrackEvent(data) {
    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.innerText = JSON.stringify(data);
    hiddenDiv.dispatchEvent(trackEvent);
}
function LikeFMInject () {
    // Comm link with content script
    trackEvent = document.createEvent('Event');
    trackEvent.initEvent('myTrackEvent', true, true);

    MeeMixPlayer.setEventHandler("SongPlaying", function(songData){
        fireTrackEvent({title:songData.title,artist:songData.artist,type:'touch'});
    });
    MeeMixPlayer.setEventHandler("SongFinishing", function(songData){
        fireTrackEvent({title:songData.title,artist:songData.artist,type:'finish'});
    });
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
    comm.style.display = 'none';
    
    (document.body || document.documentElement).appendChild(comm);

    // Comm link with injected script
    document.getElementById('LikeFMComm').addEventListener('myTrackEvent', function() {
        var track = JSON.parse(document.getElementById('LikeFMComm').textContent);
        track.lsource = 'Meemix.com';
        track.source = 'E';

        // Send message to background process
       chrome.extension.sendRequest({messageType:"track",data:track});
    });
}