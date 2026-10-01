# readme

Scan this project thoroughly. Read config files, package.json, template directories, and any existing documentation.

Then generate (or update) a README-MOD.md file at the project root.

Rules:

- Base everything on actual files. Do not guess or assume.
- If something is unclear, add a <!-- TODO: clarify --> comment
- Keep descriptions concise. One to two sentences per item max.
- Use plain language. No marketing or overly technical speak.
- If this is an update run, note what changed at the top under a ## Changelog section with today's date.

Use this structure:

---

# [Project Name]

## Overview

- What this project is and who the client is
- Brief description of the site/application purpose

## Tech stack

- CSS framework (Bootstrap version, etc.)
- Build tool
- Any front-end JS (Alpine.js, etc.)

## Project structure

- Template directory organization
- Key layout and partial files
- Component patterns
- Asset management

## What is unique about this project
- Review the project for any custom modules, features, or functionalities and document them.

## Local development

- How to start the environment
- Build commands

## Content model

- Key sections and entry types
- Any notable content relationships

## Accessibility

- Target WCAG level
- Known accessible component patterns
