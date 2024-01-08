---
draft: false
---

<button id="btn1" class="btn btn-sm btn-outline-primary active" onclick="map(1)">Heat vulnerability index</button>
<button id="btn2" class="btn btn-sm btn-outline-primary" onclick="map(2)">Heat stress deaths</button>

<div id="map1" class="">
<div style="min-height:655px"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/OEVex/embed.js?v=2" charset="utf-8"></script><noscript><img src="https://datawrapper.dwcdn.net/OEVex/full.png" alt="Map showing the heat vulnerability index for 2022 at the neighborhood tabulation area for New York City." /></noscript></div>
</div>

<div id="map2" class="hide">
<div style="min-height:718px"><script type="text/javascript" defer src="https://datawrapper.dwcdn.net/ix4Mc/embed.js?v=1" charset="utf-8"></script><noscript><img src="https://datawrapper.dwcdn.net/ix4Mc/full.png" alt="Map of heat stress deaths for 2022 by neighborhood tabulation areas in New York City" /></noscript></div>
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