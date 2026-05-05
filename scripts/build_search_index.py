#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_search_index.py — 搜索索引生成脚本

从 posts/ 下所有 published 的 .md / .mdx 抽取可搜索字段，
执行中文分词（jieba），输出到 public/search-index.json。

索引字段:
    id         唯一标识（= uri）
    uri        URI
    type       内容类型
    title      标题
    summary    摘要
    tags       标签
    headings   二级 / 三级标题文本
    body       正文纯文本（去 Markdown 语法，限长）
    tokens     分词后的空格分隔 token 字符串
    date       日期
    featured   是否精选

前端搜索（例如 MiniSearch）可按需加载本文件并做字段权重检索。
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import yaml

try:
    import jieba
except ImportError:  # pragma: no cover
    jieba = None

# ─── 配置 ───

POSTS_DIR = Path(__file__).parent.parent / 'posts'
PUBLIC_DIR = Path(__file__).parent.parent / 'public'

# 正文摘取长度上限（按字符计），避免索引过大
BODY_CHAR_LIMIT = 600

# 需要被索引的最小内容长度（过滤几乎空白的文件）
MIN_BODY_LENGTH = 10


# ─── 工具函数 ───

def get_valid_types() -> set[str]:
    """发现 posts/ 下的所有类型栏文件夹。"""
    return {
        d.name
        for d in POSTS_DIR.iterdir()
        if d.is_dir() and not d.name.startswith('.')
    }


def extract_frontmatter_and_body(filepath: Path) -> tuple[dict | None, str]:
    """从 markdown 文件中抽取 frontmatter 与正文。"""
    content = filepath.read_text(encoding='utf-8')
    if not content.startswith('---'):
        return None, content
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, content
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return None, parts[2] if len(parts) >= 3 else ''
    body = parts[2] if len(parts) >= 3 else ''
    return fm, body


def get_uri(rel_path: Path) -> str:
    """由相对 posts/ 的路径生成 URI（与 build_index.py 保持一致）。"""
    stem = rel_path.stem
    if stem == 'README':
        uri = '/' + str(rel_path.parent)
    else:
        uri = '/' + str(rel_path.with_suffix(''))
    uri = uri.replace('\\', '/')
    if uri == '/.':
        uri = '/'
    return uri


def extract_headings(body: str) -> list[str]:
    """抽取 markdown 中二级、三级标题。"""
    headings: list[str] = []
    for match in re.finditer(r'^(#{2,3})\s+(.+)$', body, re.MULTILINE):
        text = match.group(2).strip()
        if text:
            headings.append(text)
    return headings


def strip_markdown(body: str) -> str:
    """将 markdown 清理为近似纯文本，用于 body 字段与分词。"""
    text = body

    # 代码块
    text = re.sub(r'```[\s\S]*?```', ' ', text)
    text = re.sub(r'`([^`]*)`', r'\1', text)

    # 图片 / 链接
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)

    # HTML 标签
    text = re.sub(r'<[^>]+>', ' ', text)

    # Markdown 语法字符
    text = re.sub(r'^\s{0,3}#{1,6}\s+', ' ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*>', ' ', text, flags=re.MULTILINE)
    text = re.sub(r'[*_~]{1,3}', '', text)
    text = re.sub(r'^\s*[-+*]\s+', ' ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', ' ', text, flags=re.MULTILINE)

    # 折叠空白
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tokenize(text: str) -> str:
    """对中文为主的文本做分词，返回空格分隔的 token 字符串。"""
    if not text:
        return ''
    if jieba is None:
        # 没装 jieba 时退化为按非字母数字切分
        tokens = re.findall(r'[\w\u4e00-\u9fff]+', text.lower())
        return ' '.join(tokens)
    raw_tokens = jieba.lcut(text, cut_all=False)
    tokens = [t.strip().lower() for t in raw_tokens if t.strip()]
    # 去掉纯空白 / 单个标点
    tokens = [t for t in tokens if re.search(r'[\w\u4e00-\u9fff]', t)]
    return ' '.join(tokens)


# ─── 主流程 ───

def build_search_entries() -> list[dict[str, object]]:
    """遍历 posts/ 生成搜索索引条目。"""
    entries: list[dict[str, object]] = []
    valid_types = get_valid_types()

    for root, _, files in os.walk(POSTS_DIR):
        for filename in sorted(files):
            if not filename.endswith(('.md', '.mdx')):
                continue

            filepath = Path(root) / filename
            rel_path = filepath.relative_to(POSTS_DIR)
            parts = str(rel_path).split(os.sep)

            # 根目录的特殊文件（例如 about.md）也纳入索引
            content_type = parts[0] if parts[0] in valid_types else ''
            if content_type == '' and len(parts) > 1:
                continue

            fm, body = extract_frontmatter_and_body(filepath)
            if fm is None:
                continue
            if fm.get('status') != 'published':
                continue

            # README 目录页默认纳入（作为导航 / 专题检索入口）
            is_readme = filepath.stem == 'README'
            uri = get_uri(rel_path)
            title = str(fm.get('title') or 'Untitled')
            summary = str(fm.get('summary') or fm.get('description') or '')
            tags = list(fm.get('tags') or [])
            featured = bool(fm.get('featured') or False)
            date = str(fm.get('date') or '')

            plain_body = strip_markdown(body)
            if not is_readme and len(plain_body) < MIN_BODY_LENGTH and not summary:
                # 几乎空的内容条目跳过
                continue

            headings = extract_headings(body)
            body_snippet = plain_body[:BODY_CHAR_LIMIT]

            token_source = ' '.join([
                title,
                summary,
                ' '.join(tags),
                ' '.join(headings),
                body_snippet,
            ])
            tokens = tokenize(token_source)

            entries.append({
                'id': uri,
                'uri': uri,
                'type': content_type,
                'title': title,
                'summary': summary,
                'tags': tags,
                'headings': headings,
                'body': body_snippet,
                'tokens': tokens,
                'date': date,
                'featured': featured,
                'isDirectory': is_readme,
            })

    entries.sort(key=lambda e: str(e.get('date', '')), reverse=True)
    return entries


def main() -> None:
    print('═══ build search index ═══\n')

    if jieba is None:
        print('  WARNING: jieba 未安装，中文分词将退化为按字符切分。')
        print('           推荐执行 `pip3 install -r scripts/requirements.txt`\n')

    PUBLIC_DIR.mkdir(exist_ok=True)

    print('▶ Building search index...')
    entries = build_search_entries()
    output_path = PUBLIC_DIR / 'search-index.json'
    output_path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    print(f'  Indexed {len(entries)} entries → {output_path}')
    print('\n✓ Search index build complete.')


if __name__ == '__main__':
    main()
