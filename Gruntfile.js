
// this sits at the top level of the local dir, so "content" and "docs" are folders at the top level
// in GHA it sits in GITHUB_WORKSPACE/[branch_name]

var YAML = require('yamljs');
var S = require("string");
const { pathToFileURL } = require('url');

// these are hard-coded for now, but GHA vars would allow us to change them dynamically

var content_dir = process.env.GITHUB_WORKSPACE + "/development/content";
var build_dir   = process.env.GITHUB_WORKSPACE + "/gh-pages";

console.log("content_dir", content_dir);
console.log("build_dir", build_dir);

// site_root variable, constructed from repo name and github organization

var repo_name  = process.env.GITHUB_REPOSITORY;               // nycehs/ehs-data-portal-frontend-temp"
var repo_owner = process.env.GITHUB_REPOSITORY_OWNER;         // nycehs
var site_root  = S(repo_name).chompLeft(repo_owner + "/").s;  // ehs-data-portal-frontend-temp

console.log("repo_name", repo_name);
console.log("repo_owner", repo_owner);
console.log("site_root", site_root);


module.exports = function(grunt) {
    
    grunt.registerTask("lunr-index", function() {
        
        // top-level indexing function //
        
        var indexPages = function() {

            var mdPagesIndex = [];
            var htmlPagesIndex = [];
            var pagesIndex = [];
            

            //--------------------------------------------------------------------------------//
            // running `processFile` on all HTML files in "docs"
            //--------------------------------------------------------------------------------//

            // ([rootdir, subdir] are necessary in the function call, or else grunt throws an error, so we need them, even though they don't do anything)
            
            grunt.file.recurse(build_dir, function(abspath, rootdir, subdir, filename) {

                if (S(filename).endsWith(".html")) {
                    
                    pageObj = processFile(abspath, filename);
                    htmlPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            //--------------------------------------------------------------------------------//
            // running `processFile` on all MD files in "content"
            //--------------------------------------------------------------------------------//
            
            grunt.file.recurse(content_dir, function(abspath, rootdir, subdir, filename) {
                
                if (S(filename).endsWith(".md")) {
                    
                    pageObj = processFile(abspath, filename);
                    pagesIndex.push(processFile(abspath, filename));
                    mdPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            //--------------------------------------------------------------------------------//
            // adding related HTML content to MD index
            //--------------------------------------------------------------------------------//
            
            mdPagesIndex.forEach(function(page){
                
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
        

        //--------------------------------------------------------------------------------//
        // defining HTML-specific function
        //--------------------------------------------------------------------------------//
        
        var processHTMLFile = function(abspath, filename) {
            
            var content = grunt.file.read(abspath);
            var pageName = S(filename).chompRight(".html").s;
            
            // delete path up to "content", then turn into a string

            var href = S(abspath).chompLeft("content").s;
            
            // "site_root" is the page root, and the URL is that + md/html folder + the page title

            href = site_root + "/" + href;
            
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().stripPunctuation().s
            };
        };
        

        //--------------------------------------------------------------------------------//
        //  defining MD-specific function
        //--------------------------------------------------------------------------------//
        
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
            
            href = site_root + "/" + href;
            
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

        grunt.file.write(build_dir + "/js/lunr/PagesIndex.json", JSON.stringify(indexPages(), replacer = null, space = 4));
        grunt.log.ok("Index built");

    });
};
