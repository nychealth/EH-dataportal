#!/usr/bin/env bash
#
# Creates a CloudCannon site connected to a branch of this repository.
# Bash counterpart of create_cloudcannon_site.ps1. Every run creates a real
# site, so check which branch is checked out first, or pass --branch.
#
# Usage: ./create_cloudcannon_site.sh [--branch B] [--name N] [--org O] [--remote R] [--dry-run]
#   --branch   branch the site builds from (default: the checked-out branch)
#   --name     site name (default: the branch name)
#   --org      CloudCannon organization name, ID, or UUID (default: 39854)
#   --remote   git remote whose URL CloudCannon connects to (default: origin)
#   --dry-run  print the command instead of running it

set -euo pipefail

branch=''
name=''
org='39854'
remote='origin'
dry_run=false

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        --branch)  branch="${2:?--branch needs a value}"; shift 2 ;;
        --name)    name="${2:?--name needs a value}"; shift 2 ;;
        --org)     org="${2:?--org needs a value}"; shift 2 ;;
        --remote)  remote="${2:?--remote needs a value}"; shift 2 ;;
        --dry-run) dry_run=true; shift ;;
        *)         echo "Unknown argument: $1" >&2; exit 2 ;;
    esac
done

if ! command -v cloudcannon > /dev/null; then
    echo 'cloudcannon is not on PATH.' >&2
    exit 2
fi

# Tested explicitly so the failure names the remote, rather than set -e
# exiting silently after git's own message.
if ! url="$(git remote get-url "$remote")"; then
    echo "No git remote named '$remote'." >&2
    exit 1
fi

# --show-current prints nothing on a detached HEAD, which would create a
# site with no branch and no name.
if [ -z "$branch" ]; then
    branch="$(git branch --show-current)"
fi
if [ -z "$branch" ]; then
    echo 'HEAD is detached; pass --branch.' >&2
    exit 1
fi

name="${name:-$branch}"

# CloudCannon takes the branch as a #suffix on the remote URL.
cmd=(cloudcannon sites create "--name=$name" "--org=$org" "$url#$branch")

if $dry_run; then
    echo "${cmd[*]}"
else
    "${cmd[@]}"
fi
