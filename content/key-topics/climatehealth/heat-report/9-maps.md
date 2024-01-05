---
---

<button id="btn1" class="btn btn-sm btn-outline-primary active" onclick="map(1)">Heat vulnerability index</button>
<button id="btn2" class="btn btn-sm btn-outline-primary" onclick="map(2)">Heat stress deaths</button>

<div id="map1" class="">
<iframe title="Heat vulnerability index" aria-label="Map" id="datawrapper-chart-P5pGy" src="https://datawrapper.dwcdn.net/P5pGy/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="727" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();</script>
</div>

<div id="map2" class="hide">
<iframe title="Count of heat stress deaths" aria-label="Map" id="datawrapper-chart-JmIkL" src="https://datawrapper.dwcdn.net/JmIkL/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="727" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();</script>
</div>

<script>
function map(x) {
    document.getElementById('btn1').classList.remove('active')
    document.getElementById('btn2').classList.remove('active')
    document.getElementById('map1').classList.add('hide')
    document.getElementById('map2').classList.add('hide')
    var btn = 'btn'+x
    var map = 'map'+x
    document.getElementById(btn).classList.add('active')
    document.getElementById(map).classList.remove('hide')
}
</script>