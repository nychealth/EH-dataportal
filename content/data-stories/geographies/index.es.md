---
title: "Los límites del vecindario en los datos del Departamento de Salud"
date: 2020-08-01T08:33:22-04:00
draft: false
seo_title: "Los límites del vecindario en los datos del Departamento de Salud."
seo_description: "Diagramar los datos sanitarios en los vecindarios de la ciudad de Nueva York."
tags: 
categories: ["internal","neighborhoods"]
keywords: ["geography","maps","neighborhoods","health data","methods","geographic"]
image: ds-geographies.jpg
layout: single
menu:
    main:
        identifier: '02'
vega: true
photocredit: "Edwin J. Torres/Mayoral Photography Office"
---

La ciudad de Nueva York posee cientos de vecindarios y casi la misma cantidad de formas de diagramar los límites de los vecindarios. Cuando [visita el Portal de Datos Ambientales y Sanitarios](https://a816-dohbesp.nyc.gov/IndicatorPublic/Subtopic.aspx) u otros recursos de datos del Departamento de Salud (Health Department), es posible que note que la información está disponible en diferentes esquemas de vecindarios.

Por ejemplo, si busca en las páginas de datos sobre asma, encontrará que NTA ofrece datos sobre [Adultos con asma](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=18,4466a0,11,Summarize) presentados a través de los vecindarios de UHF34, [Niños de escuelas públicas con asma](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2147,4466a0,11,Summarize) presentados a través de los vecindarios de UHF42 y [Visitas por asma a la sala de emergencias](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2383,4466a0,11,Summarize) - FLAG INCOMPLETE SENTENCE?. Se ofrecen otros datos del portal por CD, código postal, PUMA y, en ocasiones, incluso por distrito policial. **¿Qué son estos esquemas de vecindarios, por qué usamos uno y no el otro, y por qué no está integrado todo el sistema?**

Los límites más comunes de vecindarios en los datos del Departamento de Salud son vecindarios de Distritos Comunitarios (Community Districts, CD), Áreas de Microdatos de Uso Público (Public Use Microdata Areas, PUMA) y Fondo Hospitalario Unido (United Hospital Fund, UHF). Estos tres esquemas de vecindarios tradicionales poseen diferentes pilares principales. Analicémoslos.


{{< rawhtml >}}
 </div>
    <!--start wide-->
    <div class="wide my-4">
        <h4 class="text-center mb-3">Jerarquización: cómo los esquemas de vecindarios poseen diferentes unidades de origen</h4>
        <div class="row" style="font-size: 14px;">
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p>Los <span style="font-weight: bold; color: #22669e;">Distritos Comunitarios</span> y <span style="font-weight: bold; color: #474747;">las PUMA</span> poseen límites similares.</p>
                <div style="width: 100%; height: 275px; background-color: #d0dce8; border-radius: 10px; border: 1px solid grey;"></div>
                <div style="height: 275px; border: 3px solid grey; margin-left: -15px; margin-top: -260px; width: 100%; border-radius: 10px;">
                <p class="text-center">PUMA</p></div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p>Las <span style="font-weight: bold; color: #474747;">PUMA</span> están formadas por NTA, que a su vez están compuestas por áreas de censo. </p>
                <div style="width: 100%; height: 275px; border: 3px solid grey; border-radius: 10px;">
                <div id="ntaparent" style="width:50%; height:100%; float:right; border-radius: 5px;">
                <div style="width: 100%; height: 50%; border-radius: 5px;"></div>
                <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #deb6e6;"><p class="text-center">NTA</p>
                    <div id="ctparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 22%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #f9f9f9;"><p class="text-center" style="font-size: 12px;">Área de censo</p></div>
                        </div>
                        <div id="emptyct" style="width:50%; height:100%;"></div>
                </div>
                </div>
                <div id="emptyparent" style="width:50%; height:100%; border-radius: 5px;">
                </div>
                </div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p>Los <span style="font-weight: bold; color: #104e34;">UHF</span>están compuestos por áreas de tabulación de códigos postales (ZCTA).</p>
                <div style="width: 100%; height: 275px; background-color: #b4ccc2; border-radius: 10px; border: 1px solid grey;">
                    <div id="uhfparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 50%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #e7edf3;"><p class="text-center">Código postal (o ZCTA)</p></div>
                        </div>
                        <div id="uhfparent" style="width:50%; height:100%;"></div>
                </div>
            </div>
        </div>
    </div>
    <!--end wide-->
<div class="narrow">

{{< /rawhtml >}}

#### Distritos Comunitarios
Existen 59 Distritos Comunitarios (Community Districts, CD) en la ciudad de Nueva York, cada uno supervisado por una Junta Comunitaria que brinda asesoramiento sobre el uso de la tierra, la zonificación, los presupuestos de la ciudad y más. Como límite político, los CD son unidades geográficas útiles para dividir las operaciones de la ciudad. [Obtenga más información sobre las Juntas Comunitarias](https://www1.nyc.gov/site/cau/community-boards/about-commmunity-boards.page).

#### Áreas de Microdatos de Uso Público
Las Áreas de Microdatos de Uso Público (Public Use Microdata Areas, PUMA) tienen límites definidos por el Censo de los EE. UU. Están compuestas por grupos de áreas de censo.

Hay 55 PUMA en la ciudad de Nueva York. Las PUMA tienen límites similares a los Distritos Comunitarios, lo que significa que, a menudo, uno puede usarse como representación del otro. En el siguiente mapa, observe cómo el CD 1 de Brooklyn, en Greenpoint/Williamsburg, es casi idéntico a la PUMA.

Hay cuatro PUMA compuestas por dos CD combinados en uno. Observe cómo dos CD en South Bronx se combinan para formar una PUMA.

Cada PUMA se divide en áreas de tabulación de vecindarios (NTA), y cada NTA se divide aún más en áreas de censo.

{{< rawhtml >}}
<input type="radio" name="mainRadioGroup" value="CD" id="ucd" checked> <label for="ucd">Distritos Comunitarios</label> &nbsp;&nbsp;
<input type="radio" name="mainRadioGroup" value="PUMA" id="upuma"/> <label for="upuma">PUMA</label> &nbsp;&nbsp;
<input type="radio" name="mainRadioGroup" value="nta" id="unta"> <label for="unta">NTA</label>

<script>
let cdSpec = "mapcd.vl.json";
let pumaSpec = "mappuma.vl.json";
let ntaSpec = "mapnta.vl.json";

// this code listens to the form with map chooser; must run after DOM loads
window.onload =listenRadios;

function listenRadios() {
  radios = document.querySelectorAll('input[type=radio][name="mainRadioGroup"]');
  radios.forEach(radio => radio.addEventListener('change', () => {
    if (radio.value==='CD') {
        buildMap(cdSpec);
        console.log('cd chosen')
        }
    else if (radio.value==='nta') {
        buildMap(ntaSpec);
        console.log('nta chosen')
        }
    else {
        buildMap(pumaSpec);
        console.log('puma chosen!')
        }  // for if chosenField is PUMA
    ;
  }));
};

function buildMap(spec) {
    vegaEmbed("#map1",spec);
}

</script>

{{< /rawhtml >}}

{{< vega id="map1" spec="mapcd.vl.json" height="550px" >}}

#### Vecindarios del Fondo Hospitalario Unido
Los vecindarios del Fondo Hospitalario Unido (United Hospital Fund, UHF) poseen límites basado en códigos postales. Esta geografía fue creada por el Departamento de Salud, el Fondo Hospitalario Unido y otras agencias de la ciudad en la década de 1980. Se diseñaron para realizar investigaciones sanitarias, y para que fuera similar a los Distritos Comunitarios de la ciudad de Nueva York.

Los datos sanitarios, como el registro de hospitalización de alguien, por ejemplo, o la respuesta a una encuesta, suelen incluir el código postal de la persona. Es la información geográfica más fácilmente disponible en los datos administrativos. La designación del vecindario también es el dato que las personas más conocen y que pueden brindar al responder una encuesta.

A fin de proteger la privacidad, solemos agrupar (o conglomerar) datos de un área más grande, por lo que necesitamos un esquema de vecindarios que estén compuestos por un conjunto de códigos postales: UHF. La recolección de datos por código postal y su posterior “transformación” en vecindarios de UHF se ha utilizado en la investigación sanitaria durante décadas. Los métodos para nuestras encuestas (como la Encuesta de Salud Comunitaria) están diseñados para incluir a suficientes personas de cada vecindario de UHF a fin de que haya una “muestra representativa” de todos los neoyorquinos, y para que podamos comparar los vecindarios con una alta fiabilidad estadística. Por lo general, usamos los vecindarios de UHF42, que dividen a la ciudad en 42 vecindarios. Sin embargo, a veces usamos los vecindarios de UHF34; agrupando algunos de los vecindarios, podemos aumentar el poder estadístico de una encuesta.

En el siguiente mapa, observe cómo tres vecindarios de UHF42 en South Bronx se combinan en un vecindario de UHF34, y cómo los vecindarios de UHF tienen códigos postales (o, más precisamente, áreas de tabulación de códigos postales) como su unidad de origen.

{{< rawhtml >}}
  <input type="radio" name="uhfRadioGroup" value="42" id="42" checked> <label for="42">UHF42</label> &nbsp;&nbsp;
  <input type="radio" name="uhfRadioGroup" value="34" id="34"/> <label for="34">UHF34</label> &nbsp;&nbsp;
  <input type="radio" name="uhfRadioGroup" value="zip" id="zip"> <label for="zip">Códigos postales</label>

<script>
let uhf42Spec = "map42.vl.json";
let uhf34Spec = "map34.vl.json";
let zipSpec = "mapZIP.vl.json";

function listenButtons() {
  buttons = document.querySelectorAll('input[type=radio][name="uhfRadioGroup"]');
  buttons.forEach(button => button.addEventListener('change', () => {
    if (button.value==='42') {
        buildMap2(uhf42Spec);
        }
    else if (button.value==='34') {
        buildMap2(uhf34Spec);
        }
    else {
        buildMap2(zipSpec);
        }  // for if chosenField is PUMA
    ;
  }));
};

listenButtons();

function buildMap2(spec) {
    vegaEmbed("#map2",spec);
}

</script>

{{< /rawhtml >}}

{{< vega id="map2" spec="map42.vl.json" height="550px" >}}



### ¿Cómo escoger cuando los límites se superponen?
Estos límites de vecindarios diferentes pueden complicar las cosas. Por ejemplo, supongamos que usted vive en Ditmas Park y quiere obtener algunos datos sanitarios para una reunión de su Junta Comunitaria. Ditmas Park es parte del Distrito Comunitario 14, Flatbush/Midwood. Pero el CD14 abarca dos vecindarios diferentes de UHF.

Tenemos [una herramienta que ayuda a ver la superposición y las diferencias](https://a816-dohbesp.nyc.gov/IndicatorPublic/CommunityDistrict.aspx) para que pueda elegir qué informe de vecindario usar; sin embargo, sigue surgiendo una pregunta difícil: ¿los datos de qué vecindario llevará a la reunión de la Junta Comunitaria?

{{< figure src="overlap.png" alt="An example of a Community District that overlaps two UHF42 neighborhoods.">}}

En el Portal de Datos Ambientales y Sanitarios (EH), sumamos datos de múltiples fuentes diferentes. Es posible que no se alineen exactamente de la forma que queremos: cuando los datos se recopilan de diferentes formas para fines distintos, habrá diferencias en la geografía subyacente disponible. El hecho de que no haya una unidad de origen consistente dificulta las cosas.

Sim embargo, cualquier forma de diagramar los límites o de sumar datos aplacará algunas variaciones en los grupos. A pesar de las limitaciones en los datos, aún podemos observar patrones sanitarios por geografía, y obtener información valiosa sobre cómo los vecindarios se diferencian y por qué. Los datos sanitarios de los vecindarios tienen mucho que decirnos, incluso cuando sus límites no son representaciones perfectas de las comunidades de la ciudad de Nueva York.

---

Si está diagramando datos sanitarios, puede [descargar y usar los archivos shapefiles, geojson y topojson en nuestro repositorio de Github.](https://github.com/nycehs/NYC_geography).