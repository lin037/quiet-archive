#!/usr/bin/env python3
"""
check.py — 内容校验脚本
验证 posts/ 目录结构和 frontmatter 规范。
"""

import os
import re
import sys
import yaml
from pathlib import Path

# ─── Configuration ───

VALID_TYPES = None  # Dynamic: any folder is a valid type

VALID_STATUSES = {'draft', 'published', 'archived'}

REQUIRED_FIELDS = {'title', 'status'}

# Path naming: lowercase letters, digits, hyphens only
PATH_PATTERN = re.compile(r'^[a-z0-9][a-z0-9\-]*$')

POSTS_DIR = Path(__file__).parent.parent / 'posts'


# ─── Helpers ───

def extract_frontmatter(filepath: Path) -> dict | None:
    """Extract YAML frontmatter from a markdown file."""
    content = filepath.read_text(encoding='utf-8')
    if not content.startswith('---'):
        return None
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None
    try:
        return yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        print(f"  ERROR: Invalid YAML in {filepath}: {e}")
        return None


def check_path_segment(segment: str) -> bool:
    """Check if a path segment follows naming convention."""
    return bool(PATH_PATTERN.match(segment))


# ─── Validators ───

def validate_directory_structure() -> list[str]:
    """Validate top-level directory names under posts/."""
    errors = []
    if not POSTS_DIR.exists():
        errors.append("ERROR: posts/ directory does not exist")
        return errors

    for item in POSTS_DIR.iterdir():
        if item.is_dir():
            if item.name.startswith('.'):
                continue
            if not check_path_segment(item.name):
                errors.append(
                    f"ERROR: Invalid directory name: posts/{item.name} "
                    f"(only lowercase a-z, 0-9, hyphens allowed)"
                )
    return errors


def validate_file_names() -> list[str]:
    """Validate all file and directory names under posts/."""
    errors = []
    for root, dirs, files in os.walk(POSTS_DIR):
        rel_root = Path(root).relative_to(POSTS_DIR)

        # Check directory names
        for d in dirs:
            if d.startswith('.'):
                continue
            if not check_path_segment(d):
                errors.append(
                    f"ERROR: Invalid directory name: {rel_root / d} "
                    f"(only lowercase a-z, 0-9, hyphens allowed)"
                )

        # Check file names
        for f in files:
            if f.startswith('.'):
                continue
            if f == 'README.md':
                continue
            stem = Path(f).stem
            suffix = Path(f).suffix
            if suffix not in ('.md', '.mdx'):
                errors.append(f"WARNING: Non-markdown file: {rel_root / f}")
                continue
            if not check_path_segment(stem):
                errors.append(
                    f"ERROR: Invalid file name: {rel_root / f} "
                    f"(only lowercase a-z, 0-9, hyphens allowed)"
                )
    return errors


def validate_frontmatter() -> list[str]:
    """Validate frontmatter of all content files."""
    errors = []
    uris = {}

    for root, _, files in os.walk(POSTS_DIR):
        for f in files:
            if not f.endswith(('.md', '.mdx')):
                continue
            filepath = Path(root) / f
            rel_path = filepath.relative_to(POSTS_DIR)

            fm = extract_frontmatter(filepath)
            if fm is None:
                errors.append(f"ERROR: Missing or invalid frontmatter: {rel_path}")
                continue

            # Check required fields
            for field in REQUIRED_FIELDS:
                if field not in fm:
                    errors.append(f"ERROR: Missing required field '{field}': {rel_path}")

            # Check status value
            status = fm.get('status', 'draft')
            if status not in VALID_STATUSES:
                errors.append(
                    f"ERROR: Invalid status '{status}' in {rel_path} "
                    f"(valid: {', '.join(VALID_STATUSES)})"
                )

            # Generate URI and check conflicts
            stem = filepath.stem
            if stem == 'README':
                uri = '/' + str(rel_path.parent)
            else:
                uri = '/' + str(rel_path.with_suffix(''))

            uri = uri.replace('\\', '/')  # Windows compat
            if uri == '/.':
                uri = '/'

            if uri in uris:
                errors.append(
                    f"ERROR: URI conflict: {rel_path} and {uris[uri]} "
                    f"both resolve to {uri}"
                )
            else:
                uris[uri] = rel_path

    return errors


def validate_image_refs() -> list[str]:
    """Check for external image references (warning only)."""
    warnings = []
    url_pattern = re.compile(r'!\[.*?\]\((https?://.*?)\)')

    for root, _, files in os.walk(POSTS_DIR):
        for f in files:
            if not f.endswith(('.md', '.mdx')):
                continue
            filepath = Path(root) / f
            rel_path = filepath.relative_to(POSTS_DIR)
            content = filepath.read_text(encoding='utf-8')

            for match in url_pattern.finditer(content):
                warnings.append(
                    f"WARNING: External image in {rel_path}: {match.group(1)}"
                )

    return warnings


# ─── Main ───

def main():
    print("═══ sevth-blog content check ═══\n")

    all_issues = []

    print("▶ Checking directory structure...")
    issues = validate_directory_structure()
    all_issues.extend(issues)
    for i in issues:
        print(f"  {i}")

    print("▶ Checking file names...")
    issues = validate_file_names()
    all_issues.extend(issues)
    for i in issues:
        print(f"  {i}")

    print("▶ Checking frontmatter...")
    issues = validate_frontmatter()
    all_issues.extend(issues)
    for i in issues:
        print(f"  {i}")

    print("▶ Checking image references...")
    issues = validate_image_refs()
    all_issues.extend(issues)
    for i in issues:
        print(f"  {i}")

    # Summary
    errors = [i for i in all_issues if i.startswith('ERROR')]
    warnings = [i for i in all_issues if i.startswith('WARNING')]

    print(f"\n{'═' * 40}")
    print(f"  Errors:   {len(errors)}")
    print(f"  Warnings: {len(warnings)}")
    print(f"{'═' * 40}")

    if errors:
        print("\n✗ Check failed.")
        sys.exit(1)
    else:
        print("\n✓ All checks passed.")
        sys.exit(0)


if __name__ == '__main__':
    main()
