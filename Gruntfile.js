
// this sits at the top level of the local dir, so "content" and "docs" are folders at the top level
// in GHA it sits in GITHUB_WORKSPACE/[branch_name]

var YAML = require('yamljs');
var S = require("string");
const { pathToFileURL } = require('url');

// these are hard-coded for now, but GHA vars would allow us to change them dynamically

var content_dir = process.env.GITHUB_WORKSPACE + "/development/content";
var build_dir   = process.env.GITHUB_WORKSPACE + "/gh-pages";

// console.log("content_dir", content_dir);
// console.log("build_dir", build_dir);

// site_root variable, constructed from repo name and github organization

var repo_name  = process.env.GITHUB_REPOSITORY;               // nycehs/ehs-data-portal-frontend-temp"
var repo_owner = process.env.GITHUB_REPOSITORY_OWNER;         // nycehs
var site_root  = S(repo_name).chompLeft(repo_owner + "/").s;  // ehs-data-portal-frontend-temp

// console.log("repo_name", repo_name);
// console.log("repo_owner", repo_owner);
// console.log("site_root", site_root);


module.exports = function(grunt) {
    
    grunt.registerTask("lunr-index", function() {
        
        // top-level indexing function //
        
        var indexPages = function() {

            var mdPagesIndex = [];
            var htmlPagesIndex = [];
            var pagesIndex = [];
            

            //--------------------------------------------------------------------------------//
            // running `processFile` on all HTML files on gh-pages branch
            //--------------------------------------------------------------------------------//

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
                    
                    console.log("abspath [HTML recurse]:", abspath);
                    console.log("rootdir [HTML recurse]:", rootdir);
                    console.log("subdir [HTML recurse]:", subdir);
                    console.log("filename [HTML recurse]:", filename);
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename);

                    // put the pageObj data into the index, labeled with pageObj.href
                    htmlPagesIndex[pageObj.href] = pageObj;
                }
            });
            

            //--------------------------------------------------------------------------------//
            // running `processFile` on all MD files in "content"
            //--------------------------------------------------------------------------------//
            
            grunt.file.recurse(content_dir, function(abspath, rootdir, subdir, filename) {
                
                if (S(filename).endsWith(".md")) {
                    
                    console.log("abspath [MD recurse]:", abspath);
                    console.log("rootdir [MD recurse]:", rootdir);
                    console.log("subdir [MD recurse]:", subdir);
                    console.log("filename [MD recurse]:", filename);
                    
                    // pageObj = processFile(abspath, filename);
                    // pagesIndex.push(processFile(abspath, filename));
                    
                    pageObj = processFile(abspath, rootdir, subdir, filename);
                    // pagesIndex.push(processFile(abspath, rootdir, subdir, filename));
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
        
        var processFile = function(abspath, rootdir, subdir, filename) {
            
            var pageIndex;
            
            if (filename !== '.DS_Store') {
                
                if (S(filename).endsWith(".html")) {
                    
                    pageIndex = processHTMLFile(abspath, rootdir, subdir, filename);
                    
                } else if (S(filename).endsWith(".md")) {
                    
                    pageIndex = processMDFile(abspath, rootdir, subdir, filename);
                    
                }
                
                return pageIndex;
            }
            
        };
        

        //--------------------------------------------------------------------------------//
        // defining HTML-specific function
        //--------------------------------------------------------------------------------//

        // this only processes files from "build_dir"
        
        var processHTMLFile = function(abspath, rootdir, subdir, filename) {
            
            var content = grunt.file.read(abspath);
            
            // replace all file extensions, i.e. everything after a period

            var pageName = S(filename).replace(/\..*/, "").s;
            
            href = site_root + subdir + "/" + pageName;

            console.log("href [HTML]:", href);
            
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().stripPunctuation().s
            };
        };
        
        
        //--------------------------------------------------------------------------------//
        //  defining MD-specific function
        //--------------------------------------------------------------------------------//
        
        var processMDFile = function(abspath, rootdir, subdir, filename) {
            
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
            
            
            // replace all file extensions, i.e. everything after a period

            var pageName = S(filename).replace(/\..*/, "").s;
            
            // if the filename has "index", maybe has 3 characters (".cn" or ".es") and then ends with ".md"

            if (filename.search(/index.{0,3}\.md/) >= 0) {
                
                href = site_root + subdir;
                
            } else {

                href = site_root + subdir + "/" + pageName;

            }
            
            console.log("href [MD]:", href);
            

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
