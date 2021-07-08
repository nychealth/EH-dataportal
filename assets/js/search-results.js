const searchTerm = new URL(location.href).searchParams.get("search");
let lunrIndex,
$results,
pagesIndex;

// Initialize lunrjs using our generated index file
function initLunr() {
    var request = new XMLHttpRequest();
    request.open('GET', '/ehs-data-portal-frontend-temp/js/lunr/PagesIndex.json', true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            pagesIndex = JSON.parse(request.responseText);

            // Set up lunrjs by declaring the fields we use
            // Also provide their boost level for the ranking
            lunrIndex = lunr(function () {
                this.field("title", {
                    boost: 10
                });
                this.field("tags", {
                    boost: 5
                });
                this.field("categories", {
                    boost: 5
                });
                this.field("keywords", {
                    boost: 5
                });
                this.field("indicators", {
                    boost: 5
                });
                this.field("neighborhood", {
                    boost: 5
                });
                this.field("seo_description", {
                    boost: 5
                });
                this.field("seo_title", {
                    boost: 5
                });
                this.field("type", {
                    boost: 5
                });
                this.field("content_yml", {
                    boost: 5
                });
                this.field("data_json", {
                    boost: 5
                });
                this.field("content");

                // ref is the result item identifier (I chose the page URL)
                this.ref("href");
                for (var i = 0; i < pagesIndex.length; ++i) {
                    this.add(pagesIndex[i]);
                }
            });
            initUI();
        } else {
            var err = textStatus + ", " + error;
            console.error("Error getting Hugo index flie:", err);
        }
    };

    request.send();
}

// Nothing crazy here, just hook up a event handler on the input field
function initUI() {
    const textSearchTerms = document.querySelectorAll('.search_term');

    if (searchTerm) {
        textSearchTerms.forEach(term => {
            term.innerHTML = `'${searchTerm}'`
        })
        
        // add some fuzzyness to the string matching to help with spelling mistakes.
        var fuzzLength = Math.round(Math.min(Math.max(searchTerm.length / 4, 1), 3));
        var fuzzyQuery = searchTerm + '~' + fuzzLength;

        // var results = search(fuzzyQuery);
        var results = search(searchTerm);
        renderResults(results);
    } else {
        // redirect to the homepage if there is no search term
        window.location.href = '/ehs-data-portal-frontend-temp/'
    }
}

/**
* Trigger a search in lunr and transform the result
*
* @param  {String} query
* @return {Array}  results
*/
function search(query) {
    // Find the item in our index corresponding to the lunr one to have more info
    // Lunr result: 
    //  {ref: "/section/page1", score: 0.2725657778206127}
    // Our result:
    //  {title:"Page1", href:"/section/page1", ...}
    return lunrIndex.search(query).map(function (result) {
        return pagesIndex.filter(function (page) {
            return page.href === result.ref;
        })[0];
    });
}

/**
* Display the results
*
* @param  {Array} results to display
*/
function renderResults(results) {
    const $searchResultsTitle = document.querySelector('.search-results-title');
    const $other = document.getElementById("other");
    const $nieghborhoodReports = document.getElementById("neighborhood_reports");
    const $dataStories = document.getElementById("data_stories");
    const $keyTopics = document.getElementById("key_topics");
    const $dataExplorer = document.getElementById("data_explorer");

    let resultsCount = 0;
    let nieghborhoodReportsCount = 0;
    let dataStoriesCount = 0;
    let keyTopicsCount = 0;
    let dataExplorerCount = 0;
    let othersCount = 0;

    const nieghborhoodResults = [];
    const dataStoriesResults = [];
    const keyTopicsResults = [];
    const dataExplorerResults = [];
    const otherResults = [];

    if (!results.length) {
        $searchResultsTitle.innerHTML = `We couldn't find any results for '${searchTerm}'`;
        return;
    }

    results.forEach(function (result) {
        var li = document.createElement('li');
        var ahref = document.createElement('a');
        ahref.href = result.href;
        ahref.text = result.title;
        li.append(ahref);
        resultsCount = resultsCount += 1;
        $searchResultsTitle.innerHTML = 
            `<span class="fas fa-search fa-md"></span> ${resultsCount} results for '${searchTerm}'`;

        const section = (str) => {
            if (result.href.includes(str)) {
                return true;
            } else {
                return false;
            }
        }

        if (section('neighborhood_reports')) {
            ahref.text = result.seo_title;
            nieghborhoodResults.push(ahref);
        } else if (section('data_stories')) {
            dataStoriesResults.push(ahref);
        } else if (section('key_topics')) {
            keyTopicsResults.push(ahref);
        } else if (section('data_explorer')) {
            dataExplorerResults.push(ahref);
        } else {
            otherResults.push(ahref);
        }
    });

    const displaySection = (count, el) => {
        if (count > 0) {
            el.querySelector('.search-results-info').innerHTML =
                `<strong>${count}</strong> results for <strong>'${searchTerm}'</strong>`;
            el.removeAttribute('hidden');
        }
    }

    const handleResults = (el, arr, count) => {
        count = arr.length;
        if (count > 0) {
            const ol = document.createElement('ol');
            el.append(ol)
            
            arr.slice(0, 5).map(link => {
                const li = document.createElement('li');
                li.setAttribute('class', 'pb-3 pb-sm-0')
                li.append(link);
                el.querySelector('ol').appendChild(li);
            })
        }
        
        if (count > 5) {
            const btn = document.createElement("BUTTON");
            btn.innerHTML = "Show more";
            btn.setAttribute('class', 'btn btn-md btn-report');
            el.append(btn);
            const showMoreResults = () => {
                arr.slice(10).map(link => {
                    var li = document.createElement('li');
                    li.append(link);
                    el.querySelector('ol').appendChild(li);
                });
                removeBtn();
            }

            btn.addEventListener('click', showMoreResults);
            const removeBtn = () => {
                btn.remove();
                btn.removeEventListener('click', showMoreResults);
            }
            
        }

        displaySection(count, el);
    }

    handleResults($nieghborhoodReports, nieghborhoodResults, nieghborhoodReportsCount);
    handleResults($dataStories, dataStoriesResults, dataStoriesCount);
    handleResults($keyTopics, keyTopicsResults, keyTopicsCount);
    handleResults($dataExplorer, dataExplorerResults, dataExplorerCount);
    handleResults($other, otherResults, othersCount);
    
}

// Init
initLunr();
