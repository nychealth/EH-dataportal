# TO DO and notes
---
- Index to contain most recent data stories
- Each subtopic gets array of hyperlinks to indicators

---
## Specific sections
### DATA STORIES:
- Figure out Hero Image / Title Overlay / alternate template approach
- Enhanced Data Story landing page with stories sorted by 'topic' 
- Stories:
    - Resources at the end via markdown
    - Tagged items (keywords? subtopics?) in sidebar

### KEY TOPICS:
 - Build out individual pages.
    - Ingest vs manual?

### DATA EXPLORER
- Reposition indicators to be on top on mobile
- Add indicators as an indicators array - can I loop through that? 
- Subtopic single page:
    - Ingest related data stories
    - Ingest related Key Topics
    - Keyword array with HTML? 

---
## BIG QUESTIONS as we learn/develop
- How to override template items? EG, suppress nav menu on Home, or header on Data Stories. (Is the answer to rearrange our partials scheme?)
- how to get nav menu highlighted upon content area? See partials/header.html and [.isMenuCurrent documentation](https://gohugo.io/templates/menu-templates/) and .hasChildren ?
- Why tweaking better/worse text breaks Hugo.
- How do we create an array of keywords and use them later? See [.Site.Pages documentation](https://gohugo.io/variables/site/)
- Can we access metadata from another content section? Yes, using [.Site.Pages](https://gohugo.io/variables/site/), .Site.Sections, and if functions.
- What is our tagging/category/variable scheme?

---

## Tagging scheme notes: what do we want to accomplish?
- On a subtopic page, show related Data Stories
    - do we want to do this on Indicator pages?
    - what's the plan for when we standalone subtopic pages expire and Subtopic About gets combined with Default Indicator displaying?
- On a Data Story, show related Key Topics
    - If page has category, show associated key topic
    - Do we want to show related indicators and subtopics, or can we just handle that manually?
- On a Key Topic, show related Data Stories
    - Scan .Site.pages, if page has category = key topic, show Data Story.
    - we could manually manage this but it would be better to have it automatic, since we publish Data Stories more often than we publish new Indicators
    - Do we want Key Topics to automatically display related Indicators, or manually manage it?
- What do we want to display on an Indicator page? 
    - Related indicators determined via Linked Data?
    - Related Key Topics? 
- Should we use frontmatter, or a separate data file? 
- Is manually managing content better than managing a complex cross-area multidirectional tagging scheme?
