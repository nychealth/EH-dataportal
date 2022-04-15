---
title: "将健康数据映射到纽约市的社区"
date: 2020-08-01T08:33:22-04:00
draft: false
seo_title: "将健康数据映射到纽约市的社区"
seo_description: "关于地理的一切：卫生局数据中的社区边界"
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

纽约市有数百个社区和几乎同样多的划分社区边界的方法。当您[访问环境与健康数据门户网站或卫生局](https://a816-dohbesp.nyc.gov/IndicatorPublic/Subtopic.aspx)（Health Department）的其他数据资源时，您可能会注意到数据以多种不同的社区方案呈现。

例如，深入研究哮喘数据页面，您会发现基于UHF34社区方案划分的[患有哮喘的成人](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=18,4466a0,11,Summarize)数据、基于UHF42社区方案划分的[患有哮喘的公立学校儿童](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2147,4466a0,11,Summarize)数据以及基于NTA方案划分的[哮喘急诊科就诊人数](https://a816-dohbesp.nyc.gov/IndicatorPublic/VisualizationData.aspx?id=2383,4466a0,11,Summarize)数据。门户网站上提供的其他数据由CD、邮编、PUMA划分，有时甚至依据警察辖区划分。这些社区方案是什么，为什么我们使用这一种而不是另一种，为什么整个系统不一致？

卫生局数据中最常见的社区边界是社区单元（Community Districts，CD）、公共使用微数据区（Public Use Microdata Areas，PUMA）和联合医院基金社区（United Hospital Fund neighborhoods，UHF）。这三种常见的社区方案具有不同的组成模块。让我们来探索这些吧。

{{< rawhtml >}}
 </div>
    <!--start wide-->
    <div class="wide my-4">
        <h4 class="text-center mb-3">嵌套：不同社区方案如何具有不同的基础单位</h4>
        <div class="row" style="font-size: 14px;">
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #22669e;">社区单元</span> 和 <span style="font-weight: bold; color: #474747;">PUMAs</span> 的边界相似.</p>
                <div style="width: 100%; height: 275px; background-color: #d0dce8; border-radius: 10px; border: 1px solid grey;"></div>
                <div style="height: 275px; border: 3px solid grey; margin-left: -15px; margin-top: -260px; width: 100%; border-radius: 10px;">
                <p class="text-center">PUMA</p></div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #474747;">PUMAs</span> 由 NTA组成， 由人口普查区组成</p>
                <div style="width: 100%; height: 275px; border: 3px solid grey; border-radius: 10px;">
                <div id="ntaparent" style="width:50%; height:100%; float:right; border-radius: 5px;">
                <div style="width: 100%; height: 50%; border-radius: 5px;"></div>
                <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #deb6e6;"><p class="text-center">NTA</p>
                    <div id="ctparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 22%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #f9f9f9;"><p class="text-center" style="font-size: 12px;">人口普查区</p></div>
                        </div>
                        <div id="emptyct" style="width:50%; height:100%;"></div>
                </div>
                </div>
                <div id="emptyparent" style="width:50%; height:100%; border-radius: 5px;">
                </div>
                </div>
            </div>
            <div class="col-lg-4 col-sm-8 mx-auto mb-2">
                <p><span style="font-weight: bold; color: #104e34;">UHFs</span> 由邮编制表区域（ZCTA）组成。</p>
                <div style="width: 100%; height: 275px; background-color: #b4ccc2; border-radius: 10px; border: 1px solid grey;">
                    <div id="uhfparent" style="width:50%; height:100%; float:right">
                        <div style="width: 100%; height: 50%;"></div>
                        <div style="width: 100%; height: 50%; border-radius: 5px; background-color: #e7edf3;"><p class="text-center">邮编（或ZCTA)</p></div>
                        </div>
                        <div id="uhfparent" style="width:50%; height:100%;"></div>
                </div>
            </div>
        </div>
    </div>
    <!--end wide-->
<div class="narrow">

{{< /rawhtml >}}

#### 社区单元
纽约市共有59个社区单元（CD），每个社区单元由一个社区委员会监管，该委员会就土地使用、分区、城市预算等提出建议。作为政治边界，CD是有益于分解城市运营的地理单位。[了解有关社区委员会的更多信息](https://www1.nyc.gov/site/cau/community-boards/about-commmunity-boards.page)。

#### 公共使用微数据区
公共使用微数据区（Public Use Microdata Areas，PUMA）的边界由美国人口普查定义。他们由人口普查区组成。

纽约市有55个PUMA。PUMA与社区单元具有相似的边界，这意味着通常可以将其中一个用作另一个方案的替代。在下面的地图中，请注意位于Greenpoint/Williamsburg的Brooklyn CD 1与PUMA几乎相同。

四个PUMA区域是由两个CD区域合二为一。请注意South Bronx区的两个CD区域是如何合并成一个 PUMA区域。

每个PUMA都细分为社区制表区（NTA），每个NTA进一步细分为人口普查区。

Each PUMA breaks down into Neighborhood Tabulation Areas (NTAs), and each NTA breaks down even further into census tracts.

{{< rawhtml >}}
<input type="radio" name="mainRadioGroup" value="CD" id="ucd" checked> <label for="ucd">社区单元</label> &nbsp;&nbsp;
<input type="radio" name="mainRadioGroup" value="PUMA" id="upuma"/> <label for="upuma">PUMAs</label> &nbsp;&nbsp;
<input type="radio" name="mainRadioGroup" value="nta" id="unta"> <label for="unta">NTAs</label>

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

#### 联合医院基金社区
联合医院基金社区（United Hospital Fund neighborhoods，UHF）的边界基于邮编。这个地理单位是由卫生局、联合医院基金社区和其他市政机构在20世纪80年代创建的。它们设计用于健康研究，类似于纽约市的社区单元。

健康数据（例如某人的住院记录或对一项调查的回复）通常包括一个人的邮编。它是行政管理数据中最容易获得的地理信息。这也是大多数人在回答调查时都知道并可以提供的社区指代

为了保护隐私，我们经常捆绑（或汇总）来自一个更大区域的数据，因此我们需要一组由邮编组成的社区方案：UHF。通过邮编收集数据，然后“汇总”到UHF社区，几十年来这种方案一直用于健康研究。我们的调查方法（如社区健康调查）旨在包括来自每个UHF社区的足够多的人口，以便所有纽约人都有一个“代表性样本”，这样我们就能够以统计可信度高的方式对比社区。通常，我们使用UHF42社区方案，将纽约市分为42个社区。不过，有时我们会使用UHF34社区方案——通过将一些社区组合在一起，我们可以提高调查的统计效力。

在下面的地图中，请注意位于South Bronx区的三个UHF42社区如何合并为一个UHF34社区，以及UHF社区如何将邮编（或更准确地说，邮编制表区域）作为其基础单位.

{{< rawhtml >}}
  <input type="radio" name="uhfRadioGroup" value="42" id="42" checked> <label for="42">UHF42</label> &nbsp;&nbsp;
  <input type="radio" name="uhfRadioGroup" value="34" id="34"/> <label for="34">UHF34</label> &nbsp;&nbsp;
  <input type="radio" name="uhfRadioGroup" value="zip" id="zip"> <label for="zip">邮编</label>

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



### 当边界重叠时如何选择？
这些不同的社区边界会使事情变得令人困惑。例如，假设您住在Ditmas Park，并且您想将一些健康数据带到您的社区委员会的一场会议上。Ditmas Park是位于Flatbush/Midwood的社区单元14的一部分。但CD14跨越两个不同的UHF社区。

我们有一[个工具可以帮助您查看重叠和差异](https://a816-dohbesp.nyc.gov/IndicatorPublic/CommunityDistrict.aspx)，以便您可以选择使用哪种社区方案进行报告，但它仍然提出了一个难题：您会带哪些社区的数据参加您的社区委员会会议？

{{< figure src="overlap.png" alt="An example of a Community District that overlaps two UHF42 neighborhoods.">}}

在EH数据门户网站上，我们汇总了来自许多不同来源的数据。它们可能不完全按照我们希望的方式排列：当出于不同目的以不同方式收集数据时，可用的基础地理方案会有所不同。没有一个一致的基础单位确实使事情变得复杂。

但是，任何绘制边界或汇总数据的方式都可以消除组内的某些差异。尽管数据存在局限性，但我们仍然可以按地理位置查看健康模式，并了解有关社区差异及其原因的宝贵信息。社区健康数据可以告诉我们很多信息，即使它们的边界不能完美地代表纽约市的所有社区。

---

如果您正在映射健康数据，您可以[在我们的Github资源库中下载和使用shapefile、geojson和topojson文件](https://github.com/nycehs/NYC_geography)。