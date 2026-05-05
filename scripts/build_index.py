#!/usr/bin/env python3
"""
build_index.py — 索引生成脚本
从 posts/ 生成 content-index.json, route-map.json, archive-tree.json
"""

import json
import os
import re
import yaml
from pathlib import Path
from datetime import datetime

POSTS_DIR = Path(__file__).parent.parent / 'posts'
PUBLIC_DIR = Path(__file__).parent.parent / 'public'

# Types are dynamically discovered from posts/ subdirectories
def get_valid_types():
    return {d.name for d in POSTS_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')}


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
    except yaml.YAMLError:
        return None


def get_uri(rel_path: Path) -> str:
    """Generate URI from relative path."""
    stem = rel_path.stem
    if stem == 'README':
        uri = '/' + str(rel_path.parent)
    else:
        uri = '/' + str(rel_path.with_suffix(''))
    uri = uri.replace('\\', '/')
    if uri == '/.':
        uri = '/'
    return uri


def build_content_index() -> list[dict]:
    """Build the content index from all posts."""
    entries = []

    for root, _, files in os.walk(POSTS_DIR):
        for f in sorted(files):
            if not f.endswith(('.md', '.mdx')):
                continue

            filepath = Path(root) / f
            rel_path = filepath.relative_to(POSTS_DIR)
            parts = str(rel_path).split(os.sep)
            content_type = parts[0]

            if content_type not in get_valid_types():
                continue

            fm = extract_frontmatter(filepath)
            if fm is None:
                continue

            status = fm.get('status', 'draft')
            if status != 'published':
                continue

            uri = get_uri(rel_path)
            is_readme = filepath.stem == 'README'

            entry = {
                'id': str(rel_path.with_suffix('')).replace('\\', '/'),
                'uri': uri,
                'type': content_type,
                'title': fm.get('title', 'Untitled'),
                'date': str(fm.get('date', '')) if fm.get('date') else '',
                'status': status,
                'summary': fm.get('summary', ''),
                'description': fm.get('description', fm.get('summary', '')),
                'tags': fm.get('tags', []),
                'featured': fm.get('featured', False),
                'isDirectory': is_readme,
            }

            # Optional fields
            if fm.get('cover'):
                entry['cover'] = fm['cover']
            if fm.get('updated'):
                entry['updated'] = str(fm['updated'])
            if fm.get('series'):
                entry['series'] = fm['series']
            if fm.get('order') is not None:
                entry['order'] = fm['order']
            if fm.get('stack'):
                entry['stack'] = fm['stack']
            if fm.get('links'):
                entry['links'] = fm['links']
            if fm.get('workStatus'):
                entry['workStatus'] = fm['workStatus']

            entries.append(entry)

    # Sort by date descending
    entries.sort(key=lambda e: e.get('date', ''), reverse=True)
    return entries


def build_route_map(entries: list[dict]) -> dict:
    """Build URI → file path mapping."""
    route_map = {}
    for entry in entries:
        route_map[entry['uri']] = entry['id']
    return route_map


def build_archive_tree(entries: list[dict]) -> list[dict]:
    """Build hierarchical archive tree."""
    tree = {}
    directory_meta = {entry['uri']: entry for entry in entries if entry.get('isDirectory')}

    for entry in entries:
        content_type = entry['type']
        if content_type not in tree:
            type_meta = directory_meta.get('/' + content_type, {})
            tree[content_type] = {
                'path': '/' + content_type,
                'type': content_type,
                'title': type_meta.get('title', content_type),
                'children': {},
                'entries': [],
            }

        # README 是目录页，不作为文章条目统计；它只提供目录元信息。
        if entry.get('isDirectory'):
            continue

        # Determine depth
        uri_parts = entry['uri'].strip('/').split('/')
        if len(uri_parts) <= 2:
            tree[content_type]['entries'].append({
                'uri': entry['uri'],
                'title': entry['title'],
                'date': entry['date'],
            })
        else:
            # Nested content - add to sub-path
            sub_path = '/'.join(uri_parts[:2])
            if sub_path not in tree[content_type]['children']:
                tree[content_type]['children'][sub_path] = {
                    'path': '/' + sub_path,
                    'title': uri_parts[1].replace('-', ' ').title(),
                    'entries': [],
                }
            tree[content_type]['children'][sub_path]['entries'].append({
                'uri': entry['uri'],
                'title': entry['title'],
                'date': entry['date'],
            })

    # Convert to list format
    result = []
    for type_node in tree.values():
        node = {
            'path': type_node['path'],
            'type': type_node['type'],
            'title': type_node['title'],
            'entries': type_node['entries'],
            'children': list(type_node['children'].values()),
        }
        result.append(node)

    return result


def main():
    print("═══ sevth-blog build index ═══\n")

    PUBLIC_DIR.mkdir(exist_ok=True)

    # Build content index
    print("▶ Building content index...")
    entries = build_content_index()
    content_index_path = PUBLIC_DIR / 'content-index.json'
    content_index_path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f"  Generated {len(entries)} entries → {content_index_path}")

    # Build route map
    print("▶ Building route map...")
    route_map = build_route_map(entries)
    route_map_path = PUBLIC_DIR / 'route-map.json'
    route_map_path.write_text(
        json.dumps(route_map, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f"  Generated {len(route_map)} routes → {route_map_path}")

    # Build archive tree
    print("▶ Building archive tree...")
    archive_tree = build_archive_tree(entries)
    tree_path = PUBLIC_DIR / 'archive-tree.json'
    tree_path.write_text(
        json.dumps(archive_tree, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f"  Generated {len(archive_tree)} type nodes → {tree_path}")

    print(f"\n✓ Index build complete.")


if __name__ == '__main__':
    main()
