function calculateAuthToken(timestamp,secret) {
    return Crypto.MD5(secret + timestamp);
}

function calculateSignature(args, secret) {
    var keys = [];
    var string_to_sign = '';
    for (var key in args) {
        keys.push(key);
    }
    keys.sort();

    keys.forEach(function(key) {
        string_to_sign += key + args[key];
    });


    string_to_sign += secret;

    return Crypto.MD5(string_to_sign);
}

var LikeFM = {
    version: '1.0.15-chrome',
    currentTrack: null,
    rawTrack: null,
    finishTimeout: null,
    timestamp: null,
    handshake: function() {
        var ts = Math.round(new Date().getTime() / 1000);
        var args = {
            "hs":"true",
            "p":"1.0",
            "c":"",
            "v":this.version,
            "u":localStorage['name'],
            "t":ts,
            "a": calculateAuthToken(ts,'4c5fbddec6eea1aecedaa2ff'),
            "api_key":'ac5dbe86ac1e96c2d31f8d1d',
            "sk":localStorage['session_key']
        };

        $.get('http://like.fm/update2/',args,function(data,code) {
            var response = data.split("\n",4);
            if (response[0] == 'OK') {
                localStorage['s_session'] = response[1];
                localStorage['touch'] = response[2];
                localStorage['finish'] = response[3];
            } else if (response[0] == 'BADAUTH') {

            }
        },'text');
    },
    sendTouchSignal: function(implicitFinish) {
        var that = this;
        setTimeout(function(){
            if (that.currentTrack && localStorage['s_session']) {
                var track = that.currentTrack;

                var args = {
                    s:localStorage['s_session'], // session id
                    lv:LikeFM.version // client version - Like.fm only
                };

                if (track.artist)
                    args.a = track.artist;

                if (track.title)
                    args.t = track.title;

                if (track.album)
                    args.b = track.album;

                if (track.length)
                    args.l = track.length;

                if (track.position)
                    args.n = track.position;

                if (track.mbid)
                    args.m = track.mbid;

                if (track.genre)
                    args.lg = track.genre;

                if (track.lrating)
                    args.lr = track.lrating;

                if (track.lsource)
                    args.lo = track.lsource;

                // Send Touch signal
                $.ajax({
                    url:localStorage['touch'],
                    data:args,
                    success:function(data,textStatus) {
                        if (data == 'BADSESSION') {
                            delete localStorage['session_key'];
                            delete localStorage['s_session'];
                            delete localStorage['touch'];
                            delete localStorage['finish'];
                        }
                    },
                    error: function(request,textStatus,error) {
                    },
                    type:"POST"
                });

                if (implicitFinish) {
                    if (LikeFM.finishTimeout)
                        clearTimeout(LikeFM.finishTimeout);
                    LikeFM.finishTimeout = setTimeout(function() {
                        LikeFM.sendFinishSignal();
                    },120000); // 120000 miliseconds is 2 minutes
                }
            } else {
                that.handshake();
            }
        },1000);
    },
    sendFinishSignal: function() {
        if (this.currentTrack && localStorage['s_session']) {
            var track = this.currentTrack;

            var args = {
                s:localStorage['s_session'], // session id
                i:LikeFM.timestamp,
                lv:LikeFM.version // client version - Like.fm only
            };

            if (track.lsource)
                args.lo = track.lsource;

            if (track.artist)
                args.a = track.artist;

            if (track.title)
                args.t = track.title;

            if (track.album)
                args.b = track.album;

            if (track.length)
                args.l = track.length;

            if (track.position)
                args.n = track.position;

            if (track.mbid)
                args.m = track.mbid;

            if (track.genre)
                args.lg = track.genre;

            if (track.lrating)
                args.lr = track.lrating;

            if (track.source)
                args.o = track.source;

            if (track.rating)
                args.r = track.rating;

            // Send Touch signal
            $.ajax({
                url:localStorage['finish'],
                data:args,
                success:function(data,textStatus) {
                    if (data == 'BADSESSION') {
                        delete localStorage['session_key'];
                        delete localStorage['s_session'];
                        delete localStorage['touch'];
                        delete localStorage['finish'];
                    }
                },
                error: function(request,textStatus,error) {
                },
                type:"POST"
            });
        } else {
            this.handshake();
        }
    },
    initPandora: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectPandora.js"});
        this.initSupported(tabId);
    },
    initYoutube: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectYoutube.js"});
        this.initSupported(tabId);
    },
    initGrooveshark: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectGrooveshark.js"});
        this.initSupported(tabId);
    },
    initMeemix: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectMeemix.js"});
        this.initSupported(tabId);
    },
    initEarbits: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectEarbits.js"});
        this.initSupported(tabId);
    },
    initRdio: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectRdio.js"});
        this.initSupported(tabId);
    },
    initSupported: function(tabId) {
        chrome.tabs.executeScript(tabId,
            {file:"injectSupported.js"});
    }
};
