function fireTrackEvent(data) {
    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.innerText = JSON.stringify(data);
    hiddenDiv.dispatchEvent(__lfm_trackEvent);
}
function LikeFMInject () {
    // Comm link with content script
    __lfm_trackEvent = document.createEvent('Event');
    __lfm_trackEvent.initEvent('myTrackEvent', true, true);

    EbApp.bindEvent("track-started", function(event, track){
        fireTrackEvent({title:track.get("name"),artist:track.get("artist_name"),album:track.get("album_name"),type:'touch'});
    });

    // can use event "track-completed" if you want to only log when the track is fully listened to (i.e. when the player advances to the next track automatically)
    EbApp.bindEvent("track-listened", function(event, track){
        fireTrackEvent({title:track.get("name"),artist:track.get("artist_name"),album:track.get("album_name"),type:'finish'});
    });
      
}

// Below is in the context of content script

// Injected script
if (!document.getElementById("LikeFMInject")) {
    var script = document.createElement('script');
    script.setAttribute('id','LikeFMInject');
    script.appendChild(document.createTextNode('var __lfm_trackEvent;' + fireTrackEvent + '('+ LikeFMInject +')();'));
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
        track.lsource = 'Earbits';
        track.source = 'E';

        // Send message to background process
       chrome.extension.sendRequest({messageType:"track",data:track});
    });
}
