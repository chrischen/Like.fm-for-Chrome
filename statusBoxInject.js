// Inject into IFRAME
$(document).ready(function(){
    if ($("#sbWrapper").length > 0) {
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if (request.messageType == "statusBox.collapse") {
                $("#sbMore").hide();
                $("#sbContent").hide();
                LikeFM.resizeWindow();
            }

            sendResponse({}); // snub them.
        });

        var LikeFM = {
            // After an action that might change the UI box size, call this
            resizeWindow: function() {
                chrome.extension.sendRequest({messageType: "statusBox.resize", data: {width:$("#sbWrapper").width()+10, height:Math.max($("#sbWrapper").height(),$(".ui-menu").height()+10)+30}}, function(response) {
                });
            }
        };
        // Refit window on first load
        LikeFM.resizeWindow();

        $("a").click(function(){
            LikeFM.resizeWindow();    
        });

        // Comm link with injected script
        document.getElementById('LikeFMComm').addEventListener('resizeEvent', function() {
            // Send message to background process
            LikeFM.resizeWindow();
        });
    }
});
