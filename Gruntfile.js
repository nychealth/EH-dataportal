
// this sits at the top level of the local dir, so "content" and "docs" are folders at the top level
// in GHA it sits in GITHUB_WORKSPACE

const YAML = require('yamljs');
const S = require("string");
const { pathToFileURL } = require('url');
const aq = require('arquero');


// check to see if this is running on GHA

if (typeof process.env.GITHUB_WORKSPACE != "undefined") {

    // if it is, use GHA env vars
    
    // these are hard-coded for now, but GHA vars would allow us to change them dynamically
    
    var content_dir  = process.env.GITHUB_WORKSPACE + "/content";
    var build_dir    = process.env.GITHUB_WORKSPACE + "/docs";
    var static_dir   = process.env.GITHUB_WORKSPACE + "/static";
    
} else {

    // if not, set vars relative to local dir
    
    var content_dir  = "content";
    var build_dir    = "docs";
    var static_dir   = "static";
    
}

module.exports = function(grunt) {
    
    grunt.registerTask("lunr-index", function() {

        // grunt.log.writeln("path.resolve()", path.resolve());
        
        // top-level indexing function //
        
        var indexPages = function() {

            var mdPagesIndex = [];
            var htmlPagesIndex = [];
            var pagesIndex = [];
            var indicator_names = aq.from(grunt.file.readJSON(build_dir + "/IndicatorData/indicator_names.json"));
            var nr_indicator_names = aq.from(grunt.file.readJSON(build_dir + "/IndicatorData/nr_indicator_names.json"));

            //--------------------------------------------------------------------------------//
            // running `processFile` on all HTML files on gh-pages branch
            //--------------------------------------------------------------------------------//

            // ([rootdir, subdir] are necessary in the function call, or else grunt throws an error, so we need them, even though they don't do anything)
            
            grunt.file.recurse(build_dir, function(abspath, rootdir, subdir, filename) {

                // grunt.log.writeln("recurse html:", indicator_names['1']);

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
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename, indicator_names);

                    // put the pageObj data into the index, labeled with pageObj.href
                    htmlPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            //--------------------------------------------------------------------------------//
            // running `processFile` on all MD files in "content"
            //--------------------------------------------------------------------------------//
            
            grunt.file.recurse(content_dir, function(abspath, rootdir, subdir, filename) {

                
                if (S(filename).endsWith(".md")) {
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename, indicator_names);

                    if (pageObj === "draft") {
                        // grunt.log.writeln([">>> draft", abspath]);
                        return;
                    }

                    pagesIndex.push(pageObj);

                    // put the pageObj data into the index, labeled with pageObj.href
                    mdPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            //--------------------------------------------------------------------------------//
            // adding page's HTML content to its MD index
            //--------------------------------------------------------------------------------//
            
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
        

        //--------------------------------------------------------------------------------//
        //  defining general `processFile` function, which calls type-specific functions
        //--------------------------------------------------------------------------------//
        
        var processFile = function(abspath, rootdir, subdir, filename, indicator_names) {

            var pageIndex;
            
            if (filename !== '.DS_Store') {
                
                if (S(filename).endsWith(".html")) {
                    
                    pageIndex = processHTMLFile(abspath, rootdir, subdir, filename, indicator_names);

                } else if (S(filename).endsWith(".md")) {
                    
                    pageIndex = processMDFile(abspath, rootdir, subdir, filename, indicator_names);
                    
                }
                
                return pageIndex;
            }
            
        };
        

        //--------------------------------------------------------------------------------//
        // defining HTML-specific function
        //--------------------------------------------------------------------------------//

        // this only processes files from "build_dir"
        
        var processHTMLFile = function(abspath, rootdir, subdir, filename, indicator_names) {

            var content = grunt.file.read(abspath);
            
            // replace all file extensions, i.e. everything after a period

            var pageName = S(filename).replace(/\..*/, "").s;
            
            href = subdir + "/" + pageName;

            // console.log("href [HTML]:", href);
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
                title: pageName,
                href: S(href).dasherize().s.toLowerCase(),
                content: contentParsed
            };
        };
        
        
        //--------------------------------------------------------------------------------//
        //  defining MD-specific function
        //--------------------------------------------------------------------------------//
        
        var processMDFile = function(abspath, rootdir, subdir, filename, indicator_names) {

            var content = grunt.file.read(abspath);
            var pageIndex;
            let these_indicator_ids;
            let these_names;
            
            // grunt.log.writeln("indicator_names", indicator_names);

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

            if (abspath.match(/data-explorer/) && typeof frontMatter.indicators != 'undefined') {

                these_indicator_ids = [...new Set(frontMatter.indicators.flatMap(x => x.IndicatorID))];

                grunt.log.writeln(filename, ":", grunt.log.wordlist(these_indicator_ids));

                these_names = indicator_names
                    .filter(aq.escape(d => these_indicator_ids.includes(parseInt(d.key))))
                    .reify()
                    .array("value")
                
                // grunt.log.writeln("these_names", grunt.log.wordlist(these_names));

            }
            
            if (abspath.match(/neighborhood-reports/) && !filename.match("index")) {

                these_indicator_ids = [...new Set(frontMatter.indicators.flatMap(x => x.IndicatorID))];

                grunt.log.writeln(filename, ":", grunt.log.wordlist(these_indicator_ids));

                these_names = indicator_names
                    .filter(aq.escape(d => these_indicator_ids.includes(parseInt(d.key))))
                    .reify()
                    .array("value")
                
                // grunt.log.writeln("these_names", grunt.log.wordlist(these_names));

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
                title: frontMatter.title,
                indicator_names: these_names,
                tags: frontMatter.tags,
                categories: frontMatter.categories,
                keywords: frontMatter.keywords,
                indicators: these_indicator_ids,
                neighborhood: frontMatter.neighborhood,
                summary: frontMatter.summary,
                data_json: frontMatter.data_json,
                content_yml: frontMatter.content_yml,
                type: frontMatter.type,
                seo_title: frontMatter.seo_title,
                seo_description: frontMatter.seo_description,
                seo_image: frontMatter.seo_image,
                href: S(href).trim().s.toLowerCase(),
                content: contentParsed
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
