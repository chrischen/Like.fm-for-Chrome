function fireTrackEvent(data) {


    // Context of the page
    var hiddenDiv = document.getElementById('LikeFMComm');
    var myTrack = data ;
	hiddenDiv.textContent = JSON.stringify(myTrack);
    hiddenDiv.dispatchEvent(trackEvent);
}

function LikeFMInject () {
    // Comm link with content script
    trackEvent = document.createEvent('Event');
    trackEvent.initEvent('myTrackEvent', true, true);

	oldPlayOrStop = PlayOrStop ;
	oldUpdatePlaylist = UpdatePlaylist ;
	var isPlaying = false ;
	var tr = {} ;
	function newPlayOrStop(action, checkNagRma) 
	{
		var myAction = action ;
		if (action == 'resume')
			myAction= (gPlayOrStopStatus == 'play') ? 'noop' : 'play';
		else if (action == 'toggle')
			myAction = (gPlayOrStopStatus == 'play') ? 'stop' : 'play';
		isPlaying = (myAction == 'play') ;
		tr.isPlaying = isPlaying ;
		// console.log("PLAYORSTOP : isPlaying : " + isPlaying ) ;
		// Call the orginal function/method
		return oldPlayOrStop(action, checkNagRma)  ;
	}
	
	function newUpdatePlaylist(results) 
	{ 
		
		
		function remove( str, str2) 
		{
			return str.replace( str2, "" );
		}
		
		function cleanResult( str ) 
		{
			var result = str ;
			result = remove(result, "</span>");
			result = remove(result, "<span class='title'>");
			result = remove(result, "<span class='artist'>");
			result = remove(result, "<span class='album'>");
			return result ; 
		}
		// Send the previous track as finished
		if( tr.title != null && isPlaying && tr.percent != 0.9)
		{
			tr.position = 2; 
			tr.percent = 0.9 ; 
			// console.log( "GETINFO (2) : " + tr.artist + " - " + tr.title + " - isPlaying : " + tr.isPlaying + " - percent : " + tr.percent ) ;
			fireTrackEvent(tr) ;	
			//tr = {} ;
		}
		
		if( results != null )
		{
			var title = cleanResult(results.title);
			var artist = cleanResult(results.artist);
			if( title == tr.title && artist == tr.artist )
			{
				tr.position = 2; 
				tr.percent = 0.9 ; 
			}
			else
			{
				tr.position = 0; 
				tr.percent = 0 ; 
			}
			tr.title = title ;
			tr.artist = artist ;
			tr.album = cleanResult(results.album);
			tr.isPlaying = isPlaying ;
		}
		else
		{
			tr = {} ;
		}
		// console.log( "GETINFO : " + tr.artist + " - " + tr.title + " - isPlaying : " + tr.isPlaying + " - percent : " + tr.percent ) ;
		fireTrackEvent(tr) ;	
		return oldUpdatePlaylist(results)  ;
	}

    function bind() {
        try {
			PlayOrStop = newPlayOrStop ;
			UpdatePlaylist = newUpdatePlaylist ; 
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

		track.lsource = 'Live365.com';
		track.source = 'P';
		
        if (myTrack.position == 0
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
			// Update the position 
			var hiddenDiv = document.getElementById('LikeFMComm');
			myTrack.position = 1 ;
			hiddenDiv.textContent = JSON.stringify(myTrack);
            
        } 
		else if (myTrack.isPlaying && percent > 0.8 && LikeFM.currentTrack ) {
			
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
