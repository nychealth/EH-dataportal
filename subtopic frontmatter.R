###########################################################################################-
###########################################################################################-
##
##  subtopic frontmatter
##
###########################################################################################-
###########################################################################################-

#=========================================================================================#
# Setting up ----
#=========================================================================================#

#-----------------------------------------------------------------------------------------#
# Loading libraries
#-----------------------------------------------------------------------------------------#

library(tidyverse)
library(DBI)
library(dbplyr)
library(odbc)
library(lubridate)
library(writexl)
library(yaml)
library(fs)
library(jsonlite)

#-----------------------------------------------------------------------------------------#
# Connecting to BESP_Indicator
#-----------------------------------------------------------------------------------------#

# determining driver to use (so script works across machines)

odbc_driver <- 
    odbcListDrivers() %>% 
    pull(name) %>% 
    unique() %>% 
    str_subset("ODBC Driver") %>% 
    sort(decreasing = TRUE) %>% 
    head(1)

# if no "ODBC Driver", use Windows built-in driver

if (length(odbc_driver) == 0) odbc_driver <- "SQL Server"


# using Windows auth with no DSN

EHDP_odbc <-
    dbConnect(
        drv = odbc::odbc(),
        driver = paste0("{", odbc_driver, "}"),
        server = "SQLIT04A",
        database = "BESP_Indicator",
        trusted_connection = "yes"
    )


#=========================================================================================#
# Pulling data ----
#=========================================================================================#

avail_data <- 
    EHDP_odbc %>% 
    tbl("avail_data") %>% 
    filter(public_display_flag == "Y") %>% 
    select(Indicator, internal_id) %>% 
    distinct() %>% 
    collect()

subtopic_internal_indicator <-
    EHDP_odbc %>%
    tbl("subtopic_internal_indicator") %>%
    select(internal_id, subtopic_id) %>%
    collect()

internal_indicator <-
    EHDP_odbc %>%
    tbl("internal_indicator") %>%
    select(internal_id, label) %>%
    collect()

subtopic <-
    EHDP_odbc %>%
    tbl("subtopic") %>%
    select(subtopic_id, Subtopic = name) %>%
    collect() %>% 
    mutate(subtopic_name = Subtopic %>% str_remove_all(",") %>% str_replace_all(" ", "-") %>% str_to_lower())

indicator_group <- 
    EHDP_odbc %>% 
    tbl("indicator_group") %>% 
    select(group_title_id, internal_id) %>% 
    collect()

indicator_group_title <- 
    EHDP_odbc %>% 
    tbl("indicator_group_title") %>% 
    select(group_title_id, header = group_title_label) %>% 
    collect()


dbDisconnect(EHDP_odbc)

#-----------------------------------------------------------------------------------------#
# joining to get headers
#-----------------------------------------------------------------------------------------#

subtopic_indicator_groups <- 
    left_join(
        avail_data,
        subtopic_internal_indicator, 
        by = "internal_id"
    ) %>% 
    left_join(
        .,
        internal_indicator, 
        by = "internal_id"
    ) %>% 
    left_join(
        .,
        subtopic, 
        by = "subtopic_id"
    ) %>% 
    left_join(
        .,
        indicator_group, 
        by = "internal_id"
    ) %>% 
    left_join(
        ., 
        indicator_group_title, 
        by = "group_title_id"
    ) %>% 
    mutate(
        across(where(is.character), ~ rlang::as_utf8_character(enc2native(.x))),
        header = replace_na(header, "0")
    ) %>% 
    arrange(Subtopic, header, label) %>% 
    mutate(header = header %>% str_replace("0", "null")) %>% 
    select(Subtopic, subtopic_name, subtopic_id, header, Indicator, label, IndicatorID = internal_id)


write_xlsx(subtopic_indicator_groups, "subtopic_indicator_groups.xlsx")


#=========================================================================================#
# looping through existing frontmatter ----
#=========================================================================================#

#-----------------------------------------------------------------------------------------#
# getting md files
#-----------------------------------------------------------------------------------------#

subtopic_md_files <- dir_ls("content/data-explorer")

#-----------------------------------------------------------------------------------------#
# looping
#-----------------------------------------------------------------------------------------#


for (i in 1:length(subtopic_md_files)) {
    
    
    this_subtopic_file <- subtopic_md_files[i]
    
    cat(i, ":", this_subtopic_file, "\n")
    
    if (path_file(this_subtopic_file) == "all-data.md") next
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # read in markdown file 
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    current_markdown <- read_file(this_subtopic_file)
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # detect line ending style
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    linebreak <- if_else(str_detect(current_markdown, "\r\n"), "\r\n", "\n")
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # get current subtopic indicators
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    current_indicators_frontmatter <- 
        current_markdown %>% 
        str_extract("indicators:(.|\r\n|\n)*menu:") %>% 
        str_remove("menu:") %>% 
        str_remove("indicators:") %>% 
        str_remove_all("-") %>% 
        str_squish() %>% 
        fromJSON() %>% 
        as_tibble()
    
    if (nrow(current_indicators_frontmatter) == 0) {
        
        cat("NEXTED", this_subtopic_file, "\n")
        
        next
        
    }
    
    current_indicators_frontmatter <- 
        current_indicators_frontmatter %>% 
        select(subtopic_id, IndicatorID = internal_id)
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # join current subtopic indicators to header in database
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    this_subtopic_data <- 
        left_join(
            current_indicators_frontmatter,
            subtopic_indicator_groups %>% select(subtopic_id, IndicatorID, header),
            by = c("subtopic_id", "IndicatorID")
        ) %>% 
        mutate(header = replace_na("null"))
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # loop through headers
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    header_list <- list()
    
    unique_headers <- unique(this_subtopic_data$header)
    
    
    for (j in 1:length(unique_headers)) {
        
        
        this_header <- unique_headers[j]
        
        # format object so that it converts to correct YAML
        
        this_header_data <- 
            this_subtopic_data %>% 
            filter(header == unique_headers[j])
        
        header_list[[j]] <- 
            list(
                header = `class<-`(unique_headers[j], "verbatim"),
                IndicatorID = this_header_data$IndicatorID
            )
        
    }
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # convert to yaml
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    indicators_frontmatter <- 
        list(indicators = header_list) %>% 
        as.yaml(line.sep = linebreak, indent.mapping.sequence = FALSE)
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # replace current indicators JSON with YAML
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    new_markdown <- 
        current_markdown %>% 
        str_replace("indicators:.*(\r\n|\n)menu:", paste0(indicators_frontmatter, "menu:"))
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    # overwrite subtopic markdown
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - #
    
    write_file(new_markdown, this_subtopic_file)
    
    
}


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #
# #                             ---- THIS IS THE END! ----
# #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
