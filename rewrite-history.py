#!/usr/bin/env python3
"""
Rewrite git history to fix commit emails
Replaces old emails with the correct one
"""
import subprocess
import os

os.chdir('.')

# Define email mappings
email_mappings = {
    'your-email@example.com': 'bjoniyal@gmail.com',
    'tudum@example.com': 'bjoniyal@gmail.com',
}

print("Rewriting git history to fix emails...")
print("=" * 60)

for old_email, new_email in email_mappings.items():
    print(f"Replacing: {old_email} -> {new_email}")
    
    # Use git filter-branch to rewrite history
    env_filter = f"""
if [ "$GIT_COMMITTER_EMAIL" = "{old_email}" ]; then
    export GIT_COMMITTER_NAME="Joniyal"
    export GIT_COMMITTER_EMAIL="{new_email}"
fi
if [ "$GIT_AUTHOR_EMAIL" = "{old_email}" ]; then
    export GIT_AUTHOR_NAME="Joniyal"
    export GIT_AUTHOR_EMAIL="{new_email}"
fi
"""
    
    result = subprocess.run(
        ['git', 'filter-branch', '--env-filter', env_filter, '--tag-name-filter', 'cat', '--', '--all'],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"  ✅ Success")
    else:
        print(f"  ⚠️ Warning: {result.stderr[:100]}")

print("=" * 60)
print("✅ History rewrite complete!")
print("\nNow run: git push origin main --force-with-lease")
