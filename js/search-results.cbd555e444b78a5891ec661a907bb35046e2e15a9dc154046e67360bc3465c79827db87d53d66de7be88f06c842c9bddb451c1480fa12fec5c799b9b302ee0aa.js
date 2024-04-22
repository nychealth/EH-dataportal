const searchTerm = DOMPurify.sanitize(new URL(location.href).searchParams.get("search"));
console.log("searchTerm:", searchTerm);

let lunrIndex,
    $results,
    pagesIndex;

// stopwords taken from the 'sw_loughran_mcdonald_long' dataset in the 'lexicon' R package, which sourced it from https://sraf.nd.edu/textual-analysis/stopwords/, modified to remove "above" and "below"
//  'according' is the first full word here that's in PagesIndex and not in the default stop word filter, so you can search for 'according' to test the extended filter

const moreStopWords = ["a", "a's", "able", "about", "according", "accordingly", "across", "actually", "adult", "after", "afterwards", "again",
    "against", "ain't", "all", "allow", "allows", "almost", "alone", "along", "already", "also", "although", "always", "am", "among",
    "amongst", "an", "and", "another", "any", "anybody", "anyhow", "anyone", "anything", "anyway", "anyways", "anywhere", "apart", "appear",
    "appreciate", "appropriate", "are", "aren't", "around", "as", "aside", "ask", "asking", "associated", "at", "available", "away", "awfully",
    "b", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "believe", "beside",
    "besides", "best", "better", "between", "beyond", "both", "brief", "but", "by", "c", "c'mon", "c's", "came", "can", "can't", "cannot",
    "cant", "cause", "causes", "certain", "certainly", "changes", "clearly", "co", "com", "come", "comes", "concerning", "consequently",
    "consider", "considering", "contain", "containing", "contains", "corresponding", "could", "couldn't", "course", "currently", "d",
    "definitely", "described", "despite", "did", "didn't", "different", "do", "does", "doesn't", "doing", "don't", "done", "down", "downwards",
    "during", "e", "each", "edu", "eg", "eight", "either", "else", "elsewhere", "enough", "entirely", "especially", "et", "etc", "even", "ever",
    "every", "everybody", "everyone", "everything", "everywhere", "ex", "exactly", "example", "except", "f", "far", "few", "fifth", "first",
    "five", "followed", "following", "follows", "for", "former", "formerly", "forth", "four", "from", "further", "furthermore", "g", "get",
    "gets", "getting", "given", "gives", "go", "goes", "going", "gone", "got", "gotten", "greetings", "h", "had", "hadn't", "happens", "hardly",
    "has", "hasn't", "have", "haven't", "having", "he", "he's", "hello", "help", "hence", "her", "here", "here's", "hereafter", "hereby", "herein",
    "hereupon", "hers", "herself", "hi", "him", "himself", "his", "hither", "hopefully", "how", "howbeit", "however", "i", "i'd", "i'll", "i'm",
    "i've", "ie", "if", "ignored", "immediate", "in", "inasmuch", "inc", "indeed", "indicate", "indicated", "indicates", "inner", "insofar", "instead",
    "into", "inward", "is", "isn't", "it", "it'd", "it'll", "it's", "its", "itself", "j", "just", "k", "keep", "keeps", "kept", "know", "known", "knows",
    "l", "last", "lately", "later", "latter", "latterly", "least", "less", "lest", "let", "let's", "like", "liked", "likely", "little", "look", "looking",
    "looks", "ltd", "m", "mainly", "many", "may", "maybe", "me", "mean", "meanwhile", "merely", "might", "more", "moreover", "most", "mostly", "much",
    "must", "my", "myself", "n", "name", "namely", "nd", "near", "nearly", "necessary", "need", "needs", "neither", "never", "nevertheless", "new",
    "next", "nine", "no", "nobody", "non", "none", "noone", "nor", "normally", "not", "nothing", "novel", "now", "nowhere", "o", "obviously", "of",
    "off", "often", "oh", "ok", "okay", "old", "on", "once", "one", "ones", "only", "onto", "or", "other", "others", "otherwise", "ought", "our",
    "ours", "ourselves", "out", "outside", "over", "overall", "own", "p", "particular", "particularly", "per", "perhaps", "placed", "please", "plus",
    "possible", "presumably", "probably", "provides", "q", "que", "quite", "qv", "r", "rather", "rd", "re", "really", "reasonably", "regarding",
    "regardless", "regards", "relatively", "respectively", "right", "s", "said", "same", "saw", "say", "saying", "says", "second", "secondly",
    "see", "seeing", "seem", "seemed", "seeming", "seems", "seen", "self", "selves", "sensible", "sent", "serious", "seriously", "seven", "several",
    "shall", "she", "should", "shouldn't", "since", "six", "so", "some", "somebody", "somehow", "someone", "something", "sometime", "sometimes",
    "somewhat", "somewhere", "soon", "sorry", "specified", "specify", "specifying", "still", "sub", "such", "sup", "sure", "t", "t's", "take",
    "taken", "tell", "tends", "th", "than", "thank", "thanks", "thanx", "that", "that's", "thats", "the", "their", "theirs", "them", "themselves",
    "then", "thence", "there", "there's", "thereafter", "thereby", "therefore", "therein", "theres", "thereupon", "these", "they", "they'd",
    "they'll", "they're", "they've", "think", "third", "this", "thorough", "thoroughly", "those", "though", "three", "through", "throughout",
    "thru", "thus", "to", "together", "too", "took", "toward", "towards", "tried", "tries", "truly", "try", "trying", "twice", "two", "u",
    "un", "under", "unfortunately", "unless", "unlikely", "until", "unto", "up", "upon", "us", "use", "used", "useful", "uses", "using",
    "usually", "uucp", "v", "value", "various", "very", "via", "viz", "vs", "w", "want", "wants", "was", "wasn't", "way", "we", "we'd",
    "we'll", "we're", "we've", "welcome", "well", "went", "were", "weren't", "what", "what's", "whatever", "when", "whence", "whenever",
    "where", "where's", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither",
    "who", "who's", "whoever", "whole", "whom", "whose", "why", "will", "willing", "wish", "with", "within", "without", "won't", "wonder",
    "would", "wouldn't", "x", "y", "yes", "yet", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
    "z", "zero", "nyc"];

const extendedStopWordFilter = lunr.generateStopWordFilter(moreStopWords);
lunr.Pipeline.registerFunction(extendedStopWordFilter, 'extendedStopWordFilter');

// Initialize lunrjs using our generated index file

function initLunr() {

    var request = new XMLHttpRequest();

    // download grunt-generated index data

    request.open('GET', `${baseURL}js/lunr/PagesIndex.json`, true); // baseURL declared in head.html

    request.onload = function () {

        if (request.status >= 200 && request.status < 400) {

            // parse index data

            pagesIndex = JSON.parse(request.responseText);

            // Set up lunrjs by declaring the fields we use
            // Also provide their boost level for the ranking

            lunrIndex = lunr(function () {

                // console.log("this [lunr]", this);

                // add extended stop word filter after default

                this.pipeline.before(lunr.stopWordFilter, extendedStopWordFilter);

                this.field("title", {
                    boost: 10
                });
                this.field("indicator_names", {
                    boost: 8
                });
                this.field("indicator_descriptions", {
                    boost: 6
                });
                this.field("summary", {
                    boost: 6
                });
                // this.field("tags", {
                //     boost: 5
                // });
                this.field("categories", {
                    boost: 5
                });
                this.field("keywords", {
                    boost: 9
                });
                this.field("indicator_ids", {
                    boost: 5
                });
                this.field("neighborhood", {
                    boost: 7
                });
                this.field("seo_title", {
                    boost: 5
                });
                // this.field("seo_description", {
                //     boost: 5
                // });
                // this.field("type", {
                //     boost: 5
                // });
                // this.field("content_yml", {
                //     boost: 5
                // });
                // this.field("data_json", {
                //     boost: 5
                // });
                this.field("content");

                // ref is the result item identifier (I chose the page URL)
                this.ref("href");

                for (var i = 0; i < pagesIndex.length; ++i) {
                    this.add(pagesIndex[i]);
                }

            });

            initUI();

        } else {
            var err = request.status + ", " + request.statusText;
            console.error("Error getting Hugo index flie:", err);
            // console.log("Request object:", request);
        }
    };

    request.send();
}

// Nothing crazy here, just hook up a event handler on the input field
function initUI() {

    // const textSearchTerms = document.querySelectorAll('.search_term');

    // console.log("textSearchTerms:", textSearchTerms);

    if (searchTerm) {

        // set the input to the searched term

        $('form[role="search"] input').val(searchTerm)

        // add some fuzzyness to the string matching to help with spelling mistakes.
        // var fuzzLength = Math.round(Math.min(Math.max(searchTerm.length / 4, 1), 3));
        // var fuzzyQuery = searchTerm + '~' + fuzzLength;

        // var results = search(fuzzyQuery);

        // ----------------------------------------------------- //
        // search call
        // ----------------------------------------------------- //
        // get search results

        var results = search(searchTerm);

        // ----------------------------------------------------- //
        // renderResults call
        // ----------------------------------------------------- //
        // render search results

        renderResults(results);

    } else {
        // redirect to the homepage if there is no search term
        window.location.href = baseURL;
    }
}

// ----------------------------------------------------- //
// search def
// ----------------------------------------------------- //

  const escape_space = match =>  {
    return match.replaceAll(/\s/g, "\\ ");
  }

  const add_plus = match =>  {

    // if this quoted term doesn't have a space, add a plus
    // if (match.match(/\s/) === null) {

        return match.replace(/.+/, "+$&");

    // } else {

    //     return match;

    // }
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

    // implement exact searches for terms that include quotes. If a phrase is quoted, then escape the spaces,
    //  so that lunr doesn't tokenize the words separately. If a single word is quoted, append a "+" to it, to tell lunr
    //  that the word is required

    // check for quotes

    if (query.match(/".+"/) !== null) {

        query = query

            // if there's a space inside the quote, escape it
            .replaceAll(/"(.*?)"/g, escape_space)

            // add a plus to denote required terms
            .replaceAll(/"(.*?)"/g, add_plus)

            // remove the surrounding quotes
            .replaceAll(/(")(.*?)(")/g, "$2")

        // escape the escape characters, so that they appear in the console
        console.log("lunr query:", query.replace(/\\/, "\\\\"));
    }


    return lunrIndex.search(query).map(function (result) {

        // console.log("result [lunrIndex]", result);

        return pagesIndex.filter(function (page) {

            // console.log("page.ref [pagesIndex]", page.href);

            return page.href === result.ref;

        })[0];
    });
}


// ----------------------------------------------------- //
// renderResults def
// ----------------------------------------------------- //
/**
* Display the results
*
* @param  {Array} results to display
*/
function renderResults(results) {

    console.log("results [renderResults]", results);

    const $searchResultsTitle = document.querySelector('.search-results-title');
    const $other = document.getElementById("other");
    const $nieghborhoodReports = document.getElementById("neighborhood-reports");
    const $dataStories = document.getElementById("data-stories");
    const $keyTopics = document.getElementById("key-topics");
    const $dataExplorer = document.getElementById("data-explorer");

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
        $searchResultsTitle.innerHTML = `We couldn't find any results for <strong><em>${DOMPurify.sanitize(searchTerm)}</em></strong>`;
        return;
    }

    results.forEach(function (result) {

        var li = document.createElement('li');
        var ahref = document.createElement('a');
        ahref.setAttribute('class', 'search-result-entry');
        ahref.href = baseURL + result.href;
        ahref.text = result.displayTitle;

        li.append(ahref);
        // console.log("ahref", ahref);

        resultsCount = resultsCount += 1;
        $searchResultsTitle.innerHTML = `<i class="fa fa-magnifying-glass"></i> <strong>${resultsCount}</strong> results for <strong><em>${DOMPurify.sanitize(searchTerm)}</em></strong>`;

        const section = (str) => {
            if (result.href.includes(str)) {
                return true;
            } else {
                return false;
            }
        }

        if (section('neighborhood-reports')) {
            nieghborhoodResults.push(ahref);

        } else if (section('data-stories')) {
            dataStoriesResults.push(ahref);

        } else if (section('key-topics')) {
            keyTopicsResults.push(ahref);

        } else if (section('data-explorer')) {
            dataExplorerResults.push(ahref);

        } else {
            otherResults.push(ahref);
        }
    });

    const displaySection = (count, el) => {
        if (count > 0) {
            el.querySelector('.search-results-info').innerHTML =
                `<strong>${count}</strong> results for <strong><em>${DOMPurify.sanitize(searchTerm)}</em></strong>`;
            el.removeAttribute('hidden');
        }
    }


    // ----------------------------------------------------- //
    // handleResults def
    // ----------------------------------------------------- //

    const handleResults = (el, arr, count) => {

        // console.log("handleResults", arr);

        count = arr.length;

        if (count > 0) {

            const ol = document.createElement('ol');
            el.append(ol)

            // slice from beginning to 5

            arr.slice(0, 5).map(link => {

                // console.log("link", link);

                const li = document.createElement('li');
                li.setAttribute('class', 'pb-3 pb-sm-0');
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

                // slice from 5 to end

                arr.slice(5).map(link => {

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

        var searchResult = document.getElementsByClassName("search-result-entry");

        for(let i = 0; i < searchResult.length; i++) {
            searchResult[i].addEventListener("click", function(event) {
              gtag("event", "click_search", {
                'click_url': this.getAttribute("href")
              })
            })
        }

    }


    // ----------------------------------------------------- //
    // handleResults call
    // ----------------------------------------------------- //

    handleResults($nieghborhoodReports, nieghborhoodResults, nieghborhoodReportsCount);
    handleResults($dataStories, dataStoriesResults, dataStoriesCount);
    handleResults($keyTopics, keyTopicsResults, keyTopicsCount);
    handleResults($dataExplorer, dataExplorerResults, dataExplorerCount);
    handleResults($other, otherResults, othersCount);

}

// Init
initLunr();
