#!/usr/bin/env python3
import subprocess
import sys

# Get all commits
result = subprocess.run(['git', 'log', '--format=%H'], cwd='.', capture_output=True, text=True)
commits = result.stdout.strip().split('\n')

print(f"Total commits: {len(commits)}")
print("Rewriting commits with incorrect email...")

# Rewrite each commit
env_filter = """
if [ "$GIT_COMMITTER_EMAIL" = "your-email@example.com" ]; then
    export GIT_COMMITTER_NAME="Joniyal"
    export GIT_COMMITTER_EMAIL="bjoniyal@gmail.com"
fi
if [ "$GIT_AUTHOR_EMAIL" = "your-email@example.com" ]; then
    export GIT_AUTHOR_NAME="Joniyal"
    export GIT_AUTHOR_EMAIL="bjoniyal@gmail.com"
fi
"""

subprocess.run(['git', 'filter-branch', '--env-filter', env_filter, '--tag-name-filter', 'cat', '--', '--all'], cwd='.')
print("Done! Now force push with: git push origin main --force-with-lease")
