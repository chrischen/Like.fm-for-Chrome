var LikeFM = {};

function fireTrackEvent(data,posUpdate) {
    // Context of the page
    var track = window.player_model.playingTrack;

    if (posUpdate) {
        if (__lfm_hold == true)
            return false;
        track.__lfm_statusUpdate = true;
        track.__lfm_pos = data;
    } else {
        track.__lfm_status = data;
        setTimeout(function(){ __lfm_hold = false},1000);
    }

    var hiddenDiv = document.getElementById('LikeFMComm');
    hiddenDiv.innerText = JSON.stringify(track);
    hiddenDiv.dispatchEvent(__lfm_trackEvent);
}

function LikeFMInject () {
    // Comm link with content script
    __lfm_trackEvent = document.createEvent('Event');
    __lfm_trackEvent.initEvent('myTrackEvent', true, true);

    function bind() {
        window.positionChanged = function (a){$("#playerTrackSlider").progressSlider({value:((a>0)?a/player_model.duration:0)});
        updateTrackSliderLabelValue(a);
        var b=$.Event("positionChanged");
        b.position=a;
        $(document).trigger(b);
        fireTrackEvent(a,true);
        }

        window.playStateChanged = function (c){if(playingSomewhereElseDialog!==null){playingSomewhereElseDialog.dialog("close");
        playingSomewhereElseDialog=null
        }var a=["paused","playing","stopped","buffering","offline"];
        log("playState: "+a[c]);
        $.each(a,function(e,d){$("body").removeClass(d)
        });
        $("body").addClass(a[c]);
        window.player_model.playState=c;
        var b=$.Event("playStateChanged");
        b.playState=c;
        $(document).trigger(b);
        __lfm_hold = true;
        fireTrackEvent(c,false);
        }
                        
    }
    bind();
}

// Below is in the context of content script
// Injected script
if (!document.getElementById("LikeFMInject")) {
    var script = document.createElement('script');
    script.setAttribute('id','LikeFMInject');
    script.appendChild(document.createTextNode('var LikeFM = {}; var __lfm_trackEvent; var __lfm_hold;' + fireTrackEvent + '('+ LikeFMInject +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
}

// Comm link medium div
if (!document.getElementById("LikeFMComm")) {
    var comm = document.createElement('div');
    comm.style.display = "none";
    comm.setAttribute('id','LikeFMComm');
    (document.body || document.documentElement).appendChild(comm);

    // Comm link with injected script
    document.getElementById('LikeFMComm').addEventListener('myTrackEvent', function() {
        var track = {};
        var song = JSON.parse(document.getElementById('LikeFMComm').textContent);
        track.lsource = 'Rdio';
        track.source = 'P';

        if (song.__lfm_status == 1 && !song.__lfm_statusUpdate) {
            track.title = song.name;
            track.artist = song.artist;
            track.album = song.album
            track.type = 'touch';
            // Send message to background process
            chrome.extension.sendRequest({messageType:"track",data:track});

            LikeFM.currentTrack = track;
        } else {
            var percent = song.__lfm_pos/song.duration;
            if (song.__lfm_status == 1 && percent > 0.8 && LikeFM.currentTrack) {
                track.title = song.name;
                track.artist = song.artist;
                track.album = song.album;
                track.type = 'finish';

                // Send message to background process
                chrome.extension.sendRequest({messageType:"track",data:track});
                LikeFM.currentTrack = null;
            }
        }
    });
}

