if (top === self) {
    // Inject into TOP page
    // Injected into all supported sites

    // Initialize StatusBox - prevents double declaration
    if (!document.getElementById('LikeFMStatusBox')) {
        var LikeFM = {
            promptLink: function() {
                // No session exists
                function goToLinkPage() {
                    chrome.extension.sendRequest({messageType: "link"});
                }
                if (!document.getElementById("LikeFMNotice")) {
                    var notice = document.createElement('div');
                    notice.setAttribute('id','LikeFMNotice');
                    notice.style.position = "fixed";
                    notice.style.top = 0;
                    notice.style.width = "100%";
                    notice.style.zIndex = "999999";
                    notice.style.background = "#dfdfdf";
                    notice.style.borderTop = "1px solid #f2f2f2";
                    notice.style.borderBottom = "1px solid #8e8e8e";
                    notice.style.fontSize = "0.9em";
                    notice.style.fontFamily = "helvetica";
                    notice.innerHTML = '<div style="float:left;padding:.4em" ><img style="vertical-align:bottom" src="https://like.fm/img/like_small.png" /> Like.fm for Chrome (click to dismiss)</div><div style="float:right">You have not linked an account to this extension. Songs you play will not be sent to Like.fm. <input type="button" id="link-account" value="Link my account" /></div>';
                    document.body.insertBefore(notice,document.body.firstChild);
                    document.getElementById("link-account").onclick = goToLinkPage;
                    notice.onclick = function() {
                        notice.style.display = "none";
                    };
                }
            },
            // Info Box
            createStatusBox: function() {
                this.statusBox = document.createElement("iframe");
                this.statusBox.setAttribute("id","LikeFMStatusBox");
                this.statusBox.setAttribute("scrolling","no");
                this.statusBox.style.position = "fixed";
                this.statusBox.style.top = "20px";
                this.statusBox.style.right = 0;
                this.statusBox.style.width = "300px";
                this.statusBox.style.height = "100px";
                this.statusBox.style.zIndex = "99999999";
                this.statusBox.style.background = "transparent";
                this.statusBox.style.border = "none";
                this.statusBox.style.fontSize = "0.9em";
                this.statusBox.style.fontFamily = "helvetica";
                this.statusBox.style.display = "none";
                document.body.insertBefore(this.statusBox,document.body.firstChild);
                //document.getElementById("link-account").onclick = goToLinkPage;
                //statusBox.onclick = function() {
                //    statusBox.style.display = "none";
                //}; 
            },
            updateStatusBox: function(track,session_key) {
                $(this.statusBox).attr("src","https://like.fm/api/1.0/?method=user.getStatusBox&sk=" + session_key + "&t=" + encodeURIComponent(track.title) + "&a=" + encodeURIComponent(track.artist) + "&b=&trackId=" + track.trackId + "&s=" + encodeURIComponent(track.source));
            }
        };
    
        // Receive from background script
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if (request.messageType == "statusBox.show") {
                if (request.resp) {
                    var resp = request.resp;
                    var track = {};
                    track.title = resp["nowplaying"]["track"]["#text"];
                    track.artist = resp["nowplaying"]["artist"]["#text"];
                    track.trackId = resp["nowplaying"]["trackId"];
                    track.album = resp["nowplaying"]["album"]["#text"];
                    track.source = resp["nowplaying"]["source"]["#text"];
                    LikeFM.updateStatusBox(track,request.session_key);
                }
                $("#LikeFMStatusBox").fadeIn();
            } else if (request.messageType == "statusBox.resize") {
                $("#LikeFMStatusBox").height(request.data.height);
                $("#LikeFMStatusBox").width(request.data.width);
            }

            sendResponse({}); // snub them.
        });

        LikeFM.createStatusBox();
        $(document).click(function(){});
    }

    // Replace the button
    if (window.location.href.match(/^https?:\/\/(?:www.)?like.fm\/signup\/download/i)) {
        var installBttn = document.getElementById('install-browser');
        if (installBttn) {
            installBttn.className = installBttn.className + " disabled";
            installBttn.textContent = 'Installed';
            
            // Request session
            chrome.extension.sendRequest({messageType: "getSession"});
        }
    }

    // Check if there is a token exchange message
    else if (document.getElementById('LikeFMTokenAuthenticated')) {
        // Request session
        chrome.extension.sendRequest({messageType: "getSession"});
    } else {
        // Check if session exists
        if (!window.location.href.match(/^https?:\/\/(?:www.)?like.fm\//i)) {
            chrome.extension.sendRequest({messageType: "checkSession"}, function(response) {
               if (response)
                   LikeFM.promptLink();
            });
        }
    }
}
