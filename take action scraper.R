#------------------------------------------------------------------------------#
#------------------------------------------------------------------------------#
# This is the scraper for the Portal 'Take Action' widget
#------------------------------------------------------------------------------#
#------------------------------------------------------------------------------#


#------------------------------------------------------------------------------#
# load libraries
#------------------------------------------------------------------------------#

library(tidyverse)
library(rvest)

#------------------------------------------------------------------------------#
# begin scraping
#------------------------------------------------------------------------------#

# scrape entire page
page <- read_html("https://council.nyc.gov/districts/")

# identify table in page
meta_table <- page %>% html_table(fill = TRUE)

# pull out usable format of data, drop picture column (x3)
table <- meta_table[[1]]

table <- table[-c(3,7)] %>% 
    rename(
        District=X1,
        CouncilMember=X2,
        Borough=X4,
        Party=X5,
        Neighborhoods=X6
    ) %>% 
    mutate(
        Email="NA"
    )

for (i in 1:nrow(table)) {
    email <- paste(
        "District", as.character(i), "@council.nyc.gov", sep="")
    table[i,6] <- email
}

print(table)

write.csv(table, "C:/Users/amorrill/Desktop/council.csv", row.names=FALSE)

#------------------------------------------------------------------------------#
#------------------------------------------------------------------------------#
    # This is the end!
#------------------------------------------------------------------------------#
#------------------------------------------------------------------------------#
