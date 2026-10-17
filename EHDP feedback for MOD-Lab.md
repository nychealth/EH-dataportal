# EHDP feedback for MOD-Lab

## Questions:

- why is all the code wrapped inside an immediately invoked function expression with `var`? is this the best idiom to use for this case? from what i've read, there are definite benefits, but it also seems like an outdated practice, and moreover, inconsistent with the way we usually write JavaScript.

## Preferences

- use `let` and `const` instead of `var`
- prefer named arrow functions instead of function declarations (unless we need their unique properties)
- more vertical whitespace
- more comments
- 4 spaces for indent


## Things to look into

- Hook up new NR flow to the NR section page
- zoom to map on report change - initialize map with previous point and zoom level?
- print view seems broken
