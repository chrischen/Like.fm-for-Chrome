// Injected into all supported sites
function promptLink() {
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
        notice.style.zIndex = "1001";
        notice.style.background = "#dfdfdf";
        notice.style.borderTop = "1px solid #f2f2f2";
        notice.style.borderBottom = "1px solid #8e8e8e";
        notice.style.fontSize = "0.9em";
        notice.style.fontFamily = "helvetica";
        notice.innerHTML = '<div style="float:left;padding:.4em" ><img style="vertical-align:bottom" src="http://like.fm/img/like_small.png" /> Like.fm for Chrome (click to dismiss)</div><div style="float:right">You have not linked an account to this extension. Songs you play will not be sent to Like.fm. <input type="button" id="link-account" value="Link my account" /></div>';
        document.body.insertBefore(notice,document.body.firstChild);
        document.getElementById("link-account").onclick = goToLinkPage;
        notice.onclick = function() {
            notice.style.display = "none";
        };
    }
}

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
               promptLink();
        });
    }
}

