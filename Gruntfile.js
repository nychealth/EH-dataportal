
var YAML = require('yamljs');
var S = require("string");
const { pathToFileURL } = require('url');

var CONTENT_PATH_PREFIX = "./content";
var HTML_PATH_PREFIX = "./docs";

// subdirectory variable below has been added to assist in updating hrefs for results; change in one place

var SUBDIRECTORY = "/ehs-data-portal-frontend-temp";

module.exports = function(grunt) {
    
    grunt.registerTask("lunr-index", function() {
        
        grunt.log.writeln("Build pages index");
        
        //  top-level indexing function  //
        
        var indexPages = function() {
            var mdPagesIndex = [];
            var htmlPagesIndex = [];
            var pagesIndex = [];
            
            // running `processFile` on all HTML files in "docs"
            
            grunt.file.recurse(HTML_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                if (S(filename).endsWith(".html")) {
                    // grunt.verbose.writeln("Parse file:",abspath);
                    pageObj = processFile(abspath, filename);
                    htmlPagesIndex[pageObj.href] = pageObj;
                }
            });
            
            // running `processFile` on all MD files in "content"
            
            grunt.file.recurse(CONTENT_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                if (S(filename).endsWith(".md")) {
                    // grunt.verbose.writeln("Parse file:",abspath);
                    pageObj = processFile(abspath, filename);
                    pagesIndex.push(processFile(abspath, filename));
                    mdPagesIndex[pageObj.href] = pageObj;
                }
            });
            
            // adding related HTML content to MD index
            
            mdPagesIndex.forEach(function(page){
                
                pageObj = {
                    content: htmlPagesIndex[page.href].content,
                    keywords: page.keywords 
                };
                // console.log('Page Object: ', pageObj)
                pagesIndex.push(pageObj);
                
            })
            
            return pagesIndex;
        };
        
        //  defining  general`processFile` function, which calls type-specific functions  //
        
        var processFile = function(abspath, filename) {
            
            var pageIndex;
            
            if (filename !== '.DS_Store') {
                if (S(filename).endsWith(".html")) {
                    pageIndex = processHTMLFile(abspath, filename);
                } else if (S(filename).endsWith(".md")) {
                    pageIndex = processMDFile(abspath, filename);
                }
                
                return pageIndex;
            }
            
        };
        
        //  defining HTML-specific function  //
        
        var processHTMLFile = function(abspath, filename) {
            
            var content = grunt.file.read(abspath);
            var pageName = S(filename).chompRight(".html").s;
            var href = S(abspath).chompLeft("content").s;
            
            // href = SUBDIRECTORY + "/" + href;
            href = SUBDIRECTORY + href;
            
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().stripPunctuation().s
            };
        };
        
        //  defining MD-specific function  //
        
        var processMDFile = function(abspath, filename) {
            
            var content = grunt.file.read(abspath);
            var pageIndex;
            
            // First separate the Front Matter from the content and parse it
            
            content = content.split("---");
            
            var frontMatter;

            try {
                frontMatter = YAML.parse(content[1].trim());
            } catch (e) {
                console.log(e.message);
            }
            
            // href for index.md files stops at the folder name
            
            var href = S(abspath).chompLeft("content").chompRight(".md").s;

            if (filename === "_index.md" || filename === "index.md") {
                
                href = S(abspath).chompLeft("content").chompRight(filename).s;
                
            }
            
            // href = SUBDIRECTORY + "/" + href;
            href = SUBDIRECTORY + href;
            
            // Build Lunr index for this page

            pageIndex = {
                title: frontMatter.title,
                tags: frontMatter.tags,
                categories: frontMatter.categories,
                keywords: frontMatter.keywords,
                indicators: frontMatter.indicators,
                neighborhood: frontMatter.neighborhood,
                summary: frontMatter.summary,
                data_json: frontMatter.data_json,
                content_yml: frontMatter.content_yml,
                type: frontMatter.type,
                seo_title: frontMatter.seo_title,
                seo_description: frontMatter.seo_description,
                seo_image: frontMatter.seo_image,
                href: href.toLowerCase(),
                content: S(content[2]).trim().stripTags().stripPunctuation().s
            };
            
            return pageIndex;
        };

        grunt.file.write("./static/js/lunr/PagesIndex.json", JSON.stringify(indexPages(), replacer = null, space = 4));
        grunt.log.ok("Index built");
    });
};
