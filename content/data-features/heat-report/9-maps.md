---
draft: false
---

<button id="btn1" class="btn btn-sm btn-outline-primary active" onclick="map(1)">Heat vulnerability index</button>
<button id="btn2" class="btn btn-sm btn-outline-primary" onclick="map(2)">Heat stress deaths</button>

<div id="map1" class="">
<iframe title="2024 - Heat vulnerability index" aria-label="Map" id="datawrapper-chart-OEVex" src="https://datawrapper.dwcdn.net/OEVex/6/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="655" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r,i=0;r=e[i];i++)if(r.contentWindow===a.source){var d=a.data["datawrapper-height"][t]+"px";r.style.height=d}}}))}();
</script>
</div>

<div id="map2" class="hide">
<div style="min-height:717px" id="datawrapper-vis-05b1J"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/05b1J/embed.js" charset="utf-8" data-target="#datawrapper-vis-05b1J"></script><noscript><img src="https://datawrapper.dwcdn.net/05b1J/full.png" alt="Map of heat stress deaths for 2022 by neighborhood tabulation areas in New York City" /></noscript></div>
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
