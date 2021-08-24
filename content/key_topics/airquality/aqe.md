---
title: "Your Neighborhood's Air Quality"
date: 2021-08-24T12:04:44-04:00
draft: false
tags: 
categories: [airquality]
relatedCategory: airquality
keywords: 
menu:
    main:
        identifier: '05'
layout: aqe
---

Your neighborhood's air quality. Insert neighborhood to continue. 

So here's what we've done:
- reorganized pages into directories with _index.md
- gave each _index a layout: single to ensure displays as single page
- but this breaks the ranging through pages on Key Topics page. 

Questions to pursue:
- on Key Topics section page, how do we only display Key Topics that are index pages?
- What's the best way to handle these custom pages that have their own CSS and JS? Is it more like a custom template - where most of the stuff is built into the 'template' page? E.g., we put ```layout: aqe``` in our frontmatter, and we just write most of the page in themes/layouts/key_topics/airquality/aqe.html?



{{< rawhtml >}}

{{< /rawhtml >}}

