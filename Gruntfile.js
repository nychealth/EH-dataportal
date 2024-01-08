// this sits at the top level of the local dir, so "content" and "docs" are folders at the top level
// in GHA it sits in GITHUB_WORKSPACE

const YAML = require('yamljs');
const S = require("string");
const { pathToFileURL } = require('url');
const aq = require('arquero');

let content_dir;
let build_dir;
let static_dir;

// check to see if this is running on GHA

if (typeof process.env.GITHUB_WORKSPACE != "undefined") {

    // if it is, use GHA env vars
    
    // these are hard-coded for now, but GHA vars would allow us to change them dynamically
    
    content_dir  = process.env.GITHUB_WORKSPACE + "/content";
    build_dir    = process.env.GITHUB_WORKSPACE + "/docs";
    static_dir   = process.env.GITHUB_WORKSPACE + "/static";
    
} else {

    // if not, set vars relative to local dir
    
    content_dir  = "content";
    build_dir    = "docs";
    static_dir   = "static";
    
}

module.exports = function(grunt) {
    
    grunt.registerTask("lunr-index", function() {

        // grunt.log.writeln("path.resolve()", path.resolve());
        
        // top-level indexing function //
        
        var indexPages = function() {

            var mdPagesIndex = [];
            var htmlPagesIndex = [];
            var pagesIndex = [];

            // this is convoluted but necessary to get an arquero table with the right structure
            var de_indicator_names  = aq.from(aq.from(grunt.file.readJSON(build_dir + "/IndicatorMetadata/indicator_names.json")).array("value"));
            var nr_indicator_names  = grunt.file.readJSON(build_dir + "/IndicatorMetadata/nr_indicator_names.json");
            var topic_indicators = grunt.file.readJSON(build_dir + "/IndicatorMetadata/topic_indicators.json");
            
            // grunt.log.writeln(de_indicator_names.array("value"))

            // ------------------------------------------------------------------------------- //
            // running `processFile` on all HTML files on dev-prod branch
            // ------------------------------------------------------------------------------- //

            // ([rootdir, subdir] are necessary in the function call, or else grunt throws an error, so we need them, even though they don't do anything)
            
            grunt.file.recurse(build_dir, function(abspath, rootdir, subdir, filename) {

                // The full path to the current file, which is nothing more than
                // the rootdir + subdir + filename arguments, joined.
                // abspath

                // The root directory, as originally specified.
                // rootdir

                // The current file's directory, relative to rootdir.
                // subdir
                
                // The filename of the current file, without any directory parts.
                // filename
                
                if (S(filename).endsWith(".html")) {
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename, de_indicator_names);

                    // put the pageObj data into the index, labeled with pageObj.href
                    htmlPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            // ------------------------------------------------------------------------------- //
            // running `processFile` on all MD files in "content"
            // ------------------------------------------------------------------------------- //
            
            grunt.file.recurse(content_dir, function(abspath, rootdir, subdir, filename) {

                
                if (S(filename).endsWith(".md")) {
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename, de_indicator_names, nr_indicator_names);

                    if (pageObj === "draft") {
                        // grunt.log.writeln([">>> draft", abspath]);
                        return;
                    }

                    pagesIndex.push(pageObj);

                    // put the pageObj data into the index, labeled with pageObj.href
                    mdPagesIndex[pageObj.href] = pageObj;
                }
            });

            // ------------------------------------------------------------------------------- //
            // creating separate entries in the index for indicators
            // ------------------------------------------------------------------------------- //

            // unique indicators, only 1 subtopic per indicator
            
            let aq_topic_indicators = aq.from(topic_indicators)
                .rename({key: "subtopic"})
                .derive({
                    IndicatorID: d => d.value.IndicatorID,
                    subtopic_name: d => d.value.subtopic_name
                })
                .select(aq.not("value"))
                .unroll("IndicatorID")
                .dedupe("IndicatorID")
                .join(de_indicator_names, "IndicatorID")
                

            // add each row to the index

            for (const row of aq_topic_indicators) {

                pageObj = {
                    title: row.name,
                    displayTitle: row.name,
                    indicator_descriptions: row.description,
                    indicator_ids: row.IndicatorID,
                    href: 'data-explorer/' + row.subtopic + "/?id=" + row.IndicatorID
                };

                pagesIndex.push(pageObj);

            }
            

            // ------------------------------------------------------------------------------- //
            // adding page's HTML content to its MD index
            // ------------------------------------------------------------------------------- //
            
            mdPagesIndex.forEach(function(page){

                // add html content to md content

                pageObj = {
                    content: htmlPagesIndex[page.href].content,
                    keywords: page.keywords 
                };
                
                pagesIndex.push(pageObj);
                
            })
            
            return pagesIndex;
        };
        

        // ------------------------------------------------------------------------------- //
        //  defining general `processFile` function, which calls type-specific functions
        // ------------------------------------------------------------------------------- //
        
        var processFile = function(abspath, rootdir, subdir, filename, de_indicator_names, nr_indicator_names) {

            var pageIndex;
            
            if (filename !== '.DS_Store') {
                
                if (S(filename).endsWith(".html")) {
                    
                    pageIndex = processHTMLFile(abspath, rootdir, subdir, filename);

                } else if (S(filename).endsWith(".md")) {
                    
                    pageIndex = processMDFile(abspath, rootdir, subdir, filename, de_indicator_names, nr_indicator_names);
                    
                }
                
                return pageIndex;
            }
            
        };
        

        // ------------------------------------------------------------------------------- //
        // defining HTML-specific function
        // ------------------------------------------------------------------------------- //

        // this only processes files from "build_dir"
        
        var processHTMLFile = function(abspath, rootdir, subdir, filename) {

            var content = grunt.file.read(abspath);
            
            // replace all file extensions, i.e. everything after a period

            var pageName = S(filename).replace(/\..*/, "").s;
            
            href = subdir + "/" + pageName;

            // grunt.log.writeln([">>> ", href, " - content: ", S(content[2]).s]);

            let contentParsed = S(content[2])
                .stripTags()
                .replace(/(<!--)(.|[\r\n])*?(-->)/gm, "")
                .replace(/[!\"#\＄%&\'\(\)\*\+,-\./:;<=>\?@\[\\\]\^`{\|}~]/g, "")
                .replace(/\s-\s/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .s

            return {
                searchTitle: pageName,
                displayTitle: pageName,
                href: S(href).dasherize().s.toLowerCase(),
                content: contentParsed
            };
        };
        
        
        // ------------------------------------------------------------------------------- //
        //  defining MD-specific function
        // ------------------------------------------------------------------------------- //
        
        var processMDFile = function(abspath, rootdir, subdir, filename, de_indicator_names, nr_indicator_names) {

            var content = grunt.file.read(abspath);
            var pageIndex;
            let indicator_ids;
            let indicator_names;
            let indicator_descriptions;
            let searchTitle;
            let seo_title;

            // grunt.log.writeln("de_indicator_names", de_indicator_names);
            // grunt.log.writeln("nr_indicator_names", nr_indicator_names);

            // First separate the Front Matter from the content and parse it
            
            content = content.split("---");
            
            var frontMatter;

            try {
                frontMatter = YAML.parse(content[1].trim());
            } catch (e) {
                grunt.log.writeln(e.message);
            }

            // if this is draft content, stop processing

            if (frontMatter.draft == true) {
                return "draft";
            }

            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
            // data explorer indicator names
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

            if (abspath.match(/data-explorer/) && typeof frontMatter.indicators != 'undefined' && frontMatter.indicators != null) {

                indicator_ids = [...new Set(frontMatter.indicators.flatMap(x => x.IndicatorID))];

                // grunt.log.writeln(filename, ":", grunt.log.wordlist(indicator_ids));

                let indicator_details = de_indicator_names
                    .filter(aq.escape(d => indicator_ids.includes(d.IndicatorID)))
                
                indicator_names = indicator_details
                    .array("name")
                    .join("##")
                
                indicator_descriptions = indicator_details
                    .array("description")
                    .join("##")
                
                // grunt.log.writeln("indicator_names", indicator_names);
                // grunt.log.writeln("indicator_descriptions", indicator_descriptions);

            }
            

            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
            // neighborhood reports indicator names
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

            if (abspath.match(/neighborhood-reports/)) {

                if (filename.match("activedesign.md\.md|asthma\.md|climateandhealth\.md|housing\.md|outdoorair\.md")) {

                    let title = S(frontMatter.title).replace(/\s+/g, "_").replace(/,/g, "")
                    
                    // grunt.log.writeln(filename, ":", title.s);
                    
                    // add these fields to NR topic landing pages
                    
                    searchTitle = frontMatter.title;
                    displayTitle = frontMatter.title;
                    seo_title = frontMatter.seo_title;
                    summary = frontMatter.summary;

                    // grunt.log.writeln(filename, ":", nr_indicator_names);
                    // grunt.log.writeln(filename, ":", grunt.log.wordlist(nr_indicator_names));

                    indicator_names = [...new Set(nr_indicator_names.filter(d => d.title == title).indicator_names)].join(" ")
                    indicator_descriptions = [...new Set(nr_indicator_names.filter(d => d.title == title).indicator_descriptions)].join(" ")

                    // grunt.log.writeln(filename, ":", nr_indicator_names);
                    // grunt.log.writeln(filename, ":", grunt.log.wordlist(nr_indicator_names));
                    

                } else {
                    // only add displayTitle for NR neighborhood pages, i.e. searchTitle = undefined
                    // we don't want every neighborhood to show up in topic searches
                    displayTitle = frontMatter.seo_title;
                }

            } else {

                // add these fields for all non-NR pages

                searchTitle = frontMatter.title;
                displayTitle = frontMatter.title;
                seo_title = frontMatter.seo_title;
                summary = frontMatter.summary;

            }
            
            // replace all file extensions, i.e. everything after a period

            var pageName = S(filename).replace(/\..*/, "").s;
            
            // if the filename has "index", maybe has 3 characters (".zh" or ".es") and then ends with ".md"
            
            if (filename.search(/index.{0,3}\.md/) >= 0) {
                
                if (filename.search(/\.zh/) >= 0) {
                    
                    href = "zh/" + subdir;
                    
                } else if (filename.search(/\.es/) >= 0) {
                    
                    href = "es/" + subdir;
                    
                } else {
                    
                    href = subdir;
                    
                }
                
            } else {
                
                href = subdir + "/" + pageName;
                
            }

            // allow indexing of page root

            href = typeof href === "undefined" ? "" : href;

            // grunt.log.writeln("pageName:", pageName, " > ", "href: ", href);

            let contentParsed = S(content[2])
                .replace(/<!--(.|[\r\n])*?-->/gm, "")
                .replace(/{{<.*rawhtml.*>}}(.|[\r\n])*?{{<.*\/rawhtml.*>}}/gm, "@")
                .stripTags()
                .replace(/[!\"#\＄%&\'\(\)\*\+,-\./:;<=>\?@\[\\\]\^`{\|}~]/g, "")
                .replace(/\s-\s/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .s
            
            // grunt.log.writeln("href [MD]:", href);
            // if (href.startsWith("zh")) grunt.log.writeln("\n\n", href, "\n\n", contentParsed)


            // Build Lunr index for this page (keeping "-" in content)

            pageIndex = {
                title: searchTitle,
                displayTitle: displayTitle,
                indicator_names: indicator_names,
                indicator_descriptions: indicator_descriptions,
                summary: summary,
                // tags: frontMatter.tags,
                categories: frontMatter.categories,
                keywords: frontMatter.keywords,
                indicator_ids: indicator_ids,
                neighborhood: frontMatter.neighborhood,
                // data_json: frontMatter.data_json,
                // content_yml: frontMatter.content_yml,
                // type: frontMatter.type,
                seo_title: seo_title,
                // seo_description: frontMatter.seo_description,
                // seo_image: frontMatter.seo_image,
                content: contentParsed,
                href: S(href).trim().s.toLowerCase()
            };
            
            return pageIndex;
        };
        
        // save to docs
        grunt.file.write(`${build_dir}/js/lunr/PagesIndex.json`, JSON.stringify(indexPages(), replacer = null, space = 4));
        grunt.log.ok("Index built to docs");
        
        // copy to static (for local serving)
        grunt.file.copy(`${build_dir}/js/lunr/PagesIndex.json`, `${static_dir}/js/lunr/PagesIndex.json`);
        grunt.log.ok("Index copied to static");

    });
};
