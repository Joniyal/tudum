#!/bin/bash

# Script to rewrite git history with correct email
# This will replace all commits with wrong email to the correct one

export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch --env-filter '
if [ "$GIT_COMMITTER_EMAIL" = "your-email@example.com" ]
then
    export GIT_COMMITTER_NAME="Joniyal"
    export GIT_COMMITTER_EMAIL="bjoniyal@gmail.com"
fi
if [ "$GIT_AUTHOR_EMAIL" = "your-email@example.com" ]
then
    export GIT_AUTHOR_NAME="Joniyal"
    export GIT_AUTHOR_EMAIL="bjoniyal@gmail.com"
fi
' --tag-name-filter cat -- --all

echo "Git history rewritten!"
echo "Now you need to force push with: git push origin main --force-with-lease"
