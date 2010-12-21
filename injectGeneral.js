var embeds = document.getElementsByTagName("embed");
var objs = document.getElementsByTagName("object");

function filter (el,attr) {
    if (el.getAttribute(attr) && el.getAttribute(attr).indexOf("http://www.youtube.com") == 0) {
        alert('found');
    }
}

for (var el in embeds) {
    filter(el,"src");
}

for (var el in objs) {
    filter(el,"data");
}