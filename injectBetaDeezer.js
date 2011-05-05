function fireTrackEvent(data) {

	function getTrack( optionalData )
	{
		var track = {};
				
		track.title = dzPlayer.songTitle ;
		track.artist = dzPlayer.artistName;
		track.album = dzPlayer.albumTitle ;

		track.percent = dzPlayer.position/dzPlayer.duration;
		track.isPlaying = dzPlayer.playing ;
		
		track.position = dzPlayer.position ;
		// console.log( "GETINFO : " + track.artist + " - " + track.title + " - isPlaying : " + track.isPlaying + " - percent : " + track.percent ) ;
		return track ;
	} 


    // Context of the page
    var hiddenDiv = document.getElementById('LikeFMComm');
    var myTrack = getTrack(data) ;
	hiddenDiv.textContent = JSON.stringify(myTrack);
    hiddenDiv.dispatchEvent(trackEvent);
}

function LikeFMInject () {
    // Comm link with content script
    trackEvent = document.createEvent('Event');
    trackEvent.initEvent('myTrackEvent', true, true);

	oldDoAction = playercontrol.callBackPlayer ;
	
	function newDoAction(propName, val) {
		// console.log( "action : " + propName ) ;
		fireTrackEvent(propName != "finish") ;
		
		return oldDoAction.call(this, propName, val) ;
	}

    function bind() {
        try {
			playercontrol.callBackPlayer=newDoAction ;
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

        var myTrack = JSON.parse(document.getElementById('LikeFMComm').textContent);
		var percent = myTrack.percent ; // dzPlayer.position/dzPlayer.duration;
        track.lsource = 'Deezer.com';
        track.source = 'P';

        if (myTrack.isPlaying && myTrack.position == 0
            && (
                (LikeFM.currentTrack
                    && ( myTrack.title != LikeFM.currentTrack.title || 
						 myTrack.artist != LikeFM.currentTrack.artist)
                ) || !LikeFM.currentTrack
            )
        ) {
            track.title = myTrack.title;
            track.artist = myTrack.artist;
            track.album = myTrack.album;
            track.type = 'touch';
            // Send message to background process
			// console.log( "TOUCH : " + track.artist + " - " + track.title ) ;
            chrome.extension.sendRequest({messageType:"track",data:track});

            LikeFM.currentTrack = track;
            
        } else if (myTrack.isPlaying && percent > 0.8 && LikeFM.currentTrack) {
            track.title = myTrack.title;
            track.artist = myTrack.artist;
            track.album = myTrack.album;
			track.type = 'finish';
			// Send message to background process
			// console.log( "FINISH : " + track.artist + " - " + track.title ) ;
			chrome.extension.sendRequest({messageType:"track",data:track});
			LikeFM.currentTrack = null;
        } 
		
    });
}
