#!/usr/bin/env python3
"""
parse_content.py — Run once at setup.
Extracts text from the three book sources and saves to src/data/curriculum.json
"""

import os
import re
import json
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Source paths (relative to project root parent, i.e. ~/learning-app/)
LEARNING_APP = os.path.expanduser("~/learning-app")
SQL_PDF = os.path.join(LEARNING_APP, "sql-book", "introduction-to-sql-light.pdf")
AUTOMATE_DIR = os.path.join(LEARNING_APP, "python-automate", "automatetheboringstuff.com", "2e")
MCKINNEY_DIR = os.path.join(LEARNING_APP, "python-data-analysis", "wesmckinney.com", "book")


def parse_sql_book(pdf_path):
    """Extract chapters from the SQL PDF using pdfplumber."""
    chapters = []
    try:
        import pdfplumber
    except ImportError:
        print("  ⚠ pdfplumber not installed. Run: pip install pdfplumber")
        return _fallback_sql_chapters()

    if not os.path.exists(pdf_path):
        print(f"  ⚠ SQL PDF not found at {pdf_path}")
        return _fallback_sql_chapters()

    print(f"  Parsing SQL PDF: {pdf_path}")
    current_chapter = {"title": "Introduction", "content": "", "source": "iliev_sql", "chapter_num": 0}
    all_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            all_text.append(text)

    full_text = "\n".join(all_text)

    # Split on chapter headings
    chapter_pattern = re.compile(
        r'(?:^|\n)(Chapter\s+\d+[\s\S]{0,200}?)(?=\nChapter\s+\d+|\Z)',
        re.MULTILINE
    )

    # Simpler: split by "Chapter N" lines
    lines = full_text.split("\n")
    chapter_num = 0
    current_title = "Introduction"
    current_lines = []

    for line in lines:
        ch_match = re.match(r'^Chapter\s+(\d+)', line.strip(), re.IGNORECASE)
        if ch_match:
            if current_lines:
                chapters.append({
                    "title": current_title,
                    "content": "\n".join(current_lines),
                    "source": "iliev_sql",
                    "chapter_num": chapter_num
                })
            chapter_num = int(ch_match.group(1))
            current_title = line.strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        chapters.append({
            "title": current_title,
            "content": "\n".join(current_lines),
            "source": "iliev_sql",
            "chapter_num": chapter_num
        })

    if not chapters:
        return _fallback_sql_chapters()

    print(f"    → {len(chapters)} chapters extracted")
    return chapters


def _fallback_sql_chapters():
    """Fallback SQL chapter stubs when PDF can't be parsed."""
    print("  Using fallback SQL chapter stubs.")
    chapters = []
    topics = [
        (0, "Introduction to Databases", "A database is an organized collection of structured data. SQL (Structured Query Language) is the language used to interact with relational databases."),
        (1, "What is SQL?", "SQL stands for Structured Query Language. It allows you to query, insert, update, and delete data in relational databases like MySQL, PostgreSQL, and SQLite."),
        (2, "SQL Syntax and SELECT", "The SELECT statement retrieves data from a table. Basic syntax: SELECT column1, column2 FROM table_name;"),
        (3, "WHERE Clause", "The WHERE clause filters rows based on conditions. Example: SELECT * FROM orders WHERE quantity > 5 AND status = 'complete';"),
        (4, "Aggregate Functions", "COUNT(), SUM(), AVG(), MIN(), MAX() summarize data. Use GROUP BY to aggregate across categories."),
        (5, "JOINs", "JOINs combine rows from multiple tables. INNER JOIN returns matching rows. LEFT JOIN returns all left rows plus matches."),
        (6, "Data Types and NULL", "NULL represents missing data. Use IS NULL and IS NOT NULL to filter. COALESCE returns the first non-NULL value."),
        (7, "Subqueries and CTEs", "Subqueries nest one SELECT inside another. CTEs (WITH clauses) name subqueries for readability."),
        (8, "Date Functions", "Date functions let you extract parts of dates, compare time ranges, and calculate differences between timestamps."),
        (9, "UNION and Set Operations", "UNION combines result sets. INTERSECT finds rows in both sets. EXCEPT finds rows in the first set but not the second."),
    ]
    for num, title, content in topics:
        chapters.append({"title": title, "content": content, "source": "iliev_sql", "chapter_num": num})
    return chapters


def parse_html_book(directory, source_name):
    """Extract chapters from HTML files."""
    chapters = []
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print(f"  ⚠ beautifulsoup4 not installed. Run: pip install beautifulsoup4")
        return []

    if not os.path.exists(directory):
        print(f"  ⚠ Directory not found: {directory}")
        return []

    # Gather HTML files
    html_files = []
    for entry in os.scandir(directory):
        if entry.is_file() and entry.name.endswith('.html'):
            html_files.append(entry.path)
        elif entry.is_dir():
            # Automate the Boring Stuff has chapter subdirectories
            for sub in os.scandir(entry.path):
                if sub.name == 'index.html':
                    html_files.append(sub.path)

    html_files.sort()
    print(f"  Parsing {len(html_files)} HTML files from {directory}")

    for filepath in html_files:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')

            # Extract title
            h1 = soup.find('h1')
            title_text = h1.get_text().strip() if h1 else os.path.basename(os.path.dirname(filepath))

            # Extract code blocks separately
            code_blocks = []
            for code_tag in soup.find_all(['pre', 'code']):
                code_text = code_tag.get_text()
                if len(code_text.strip()) > 10:  # Skip trivial snippets
                    code_blocks.append(code_text)
                code_tag.replace_with(f'\n[CODE_BLOCK_{len(code_blocks)-1}]\n')

            # Remove nav, footer, script, style
            for tag in soup.find_all(['nav', 'footer', 'script', 'style', 'head']):
                tag.decompose()

            body_text = soup.get_text(separator='\n', strip=True)
            # Clean up excessive whitespace
            body_text = re.sub(r'\n{3,}', '\n\n', body_text)

            chapters.append({
                "title": title_text,
                "content": body_text[:8000],  # Cap per chapter
                "code_blocks": code_blocks[:20],
                "source": source_name,
                "filename": os.path.basename(filepath)
            })
        except Exception as e:
            print(f"    ⚠ Error parsing {filepath}: {e}")

    print(f"    → {len(chapters)} chapters extracted")
    return chapters


# Map SQL chapters to curriculum weeks
SQL_WEEK_MAP = {0: 1, 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8}

# Map Automate chapters to weeks (by index)
AUTOMATE_WEEK_MAP = {
    0: 1, 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4,
    8: 5, 9: 5, 10: 6, 11: 6, 12: 7, 13: 7, 14: 8, 15: 8,
    16: 9, 17: 10, 18: 10, 19: 11, 20: 12
}

MCKINNEY_ORDER = [
    'preliminaries.html', 'python-basics.html', 'python-builtin.html',
    'ipython.html', 'numpy-basics.html', 'advanced-numpy.html',
    'pandas-basics.html', 'data-loading.html', 'data-cleaning.html',
    'data-wrangling.html', 'data-aggregation.html',
    'plotting-and-visualization.html', 'data-analysis-examples.html',
    'modeling.html', 'accessing-data.html',
]

MCKINNEY_WEEK_MAP = {
    0: 9, 1: 9, 2: 9, 3: 10, 4: 10, 5: 11, 6: 9, 7: 10, 8: 10,
    9: 11, 10: 11, 11: 12, 12: 13, 13: 15, 14: 14
}


def build_week_map(sql_chapters, automate_chapters, mckinney_chapters):
    """Organize all content into week buckets."""
    weeks = {w: {"sql": [], "python": [], "week": w} for w in range(1, 17)}

    for ch in sql_chapters:
        week = SQL_WEEK_MAP.get(ch.get('chapter_num', 0), 1)
        weeks[week]["sql"].append(ch)

    for i, ch in enumerate(automate_chapters):
        week = AUTOMATE_WEEK_MAP.get(i, min(i // 2 + 1, 8))
        weeks[week]["python"].append({**ch, "book": "automate"})

    for i, ch in enumerate(mckinney_chapters):
        week = MCKINNEY_WEEK_MAP.get(i, min(i + 9, 16))
        weeks[week]["python"].append({**ch, "book": "mckinney"})

    return weeks


if __name__ == "__main__":
    print("\n📚 Parsing book content...\n")

    sql_chapters = parse_sql_book(SQL_PDF)
    automate_chapters = parse_html_book(AUTOMATE_DIR, "sweigart_automate")
    mckinney_chapters = parse_html_book(MCKINNEY_DIR, "mckinney_pydata")

    week_map = build_week_map(sql_chapters, automate_chapters, mckinney_chapters)

    curriculum = {
        "sql_chapters": sql_chapters,
        "automate_chapters": automate_chapters,
        "mckinney_chapters": mckinney_chapters,
        "weeks": week_map,
        "meta": {
            "sql_chapter_count": len(sql_chapters),
            "automate_chapter_count": len(automate_chapters),
            "mckinney_chapter_count": len(mckinney_chapters),
        }
    }

    out_dir = os.path.join(PROJECT_ROOT, "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "curriculum.json")

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(curriculum, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved curriculum.json")
    print(f"   SQL chapters:      {len(sql_chapters)}")
    print(f"   Automate chapters: {len(automate_chapters)}")
    print(f"   McKinney chapters: {len(mckinney_chapters)}")
    print(f"   Output: {out_path}\n")
