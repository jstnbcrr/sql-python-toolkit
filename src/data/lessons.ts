// ─── Lesson Content ───────────────────────────────────────────────────────────
// Source books:
//   SQL  → "Introduction to SQL" by Bobby Iliev (introduction-to-sql-light.pdf)
//   Py1  → "Automate the Boring Stuff with Python" 2e by Al Sweigart (automatetheboringstuff.com)
//   Py2  → "Python for Data Analysis" 3e by Wes McKinney (wesmckinney.com/book)
//
// Teaching approach: content is drawn from these books, adapted to the
// Panda Express / SunTran operations context. Not copy-pasted — integrated.

export interface LessonSection {
  title: string
  content: string
}

export interface WeekLesson {
  week: number
  sql: LessonSection[]
  python: LessonSection[]
}

export const LESSONS: WeekLesson[] = [

  // ─── WEEK 1 ──────────────────────────────────────────────────────────────────
  {
    week: 1,
    sql: [
      {
        title: 'What is a Database?',
        content: `Bobby Iliev's SQL book opens with this definition: "A database is an organized collection of data, generally stored and accessed electronically from a computer system."

Before databases, businesses kept records in flat files — literally text files or spreadsheets. That works for small operations. It breaks down the moment you need to answer questions like: "Which Panda Express menu items in the Entrees category sold more than 200 units last Tuesday?" A spreadsheet becomes a tangle of VLOOKUP formulas. A database answers in one clean query.

The standard type of database used in business is a **relational database**. "Relational" means data is stored in tables that can be connected to each other. Iliev defines it: a relational database management system (RDBMS) "stores data in tables and allows you to define relationships between tables." An orders table relates to a customers table relates to a menu table. You can trace any thread through the data.

The database we use in this app is **SQLite**. It stores an entire database in a single file — no server needed. The same SQL you write here works on MySQL, PostgreSQL, and SQL Server with minor syntax variations. The fundamentals are universal.

**Why SQL before Python for data work?** Because data almost always lives in a database first. Python code that can't reach a database is limited to pre-made files. SQL is the language of the data layer. A manager asking "how much did we sell last Tuesday?" isn't thinking about Python loops — they're thinking about a number that lives in a table. SQL is the most direct path to that number.

Iliev's context: "There are many different database management systems. MySQL, PostgreSQL, SQLite, Microsoft SQL Server, Oracle Database" — and they all speak SQL. The syntax differences are minor. What you learn here transfers.`,
      },
      {
        title: 'Tables, Rows, and Columns',
        content: `A database is made of tables. A table is made of columns (the structure) and rows (the data). From Iliev's book, every column has a defined data type that controls what values it can hold:

- \`INT\` — whole numbers: quantity: 3, store_id: 12, week: 1
- \`DECIMAL(8,2)\` — decimal numbers with precision: price: 6.99, revenue: 12450.75
- \`VARCHAR(n)\` — variable-length text up to n characters: name: "Orange Chicken"
- \`TEXT\` — longer text with no fixed limit: description, notes
- \`BOOLEAN\` — true or false (stored as 1/0 in SQLite)
- \`DATE\` — calendar date as YYYY-MM-DD: 2024-03-15
- \`DATETIME\` — date + time: 2024-03-15 14:22:05

The menu_items table in this week's database:

~~~
id | name                  | category | price | calories
---+-----------------------+----------+-------+---------
 1 | Orange Chicken        | Entrees  |  6.99 |      490
 2 | Fried Rice            | Sides    |  3.99 |      520
 3 | Chow Mein             | Sides    |  3.99 |      510
 4 | Honey Walnut Shrimp   | Entrees  |  8.99 |      360
 5 | Fountain Drink        | Drinks   |  2.49 |        0
~~~

Each row is one menu item. Each column holds exactly one kind of information. The \`id\` column is the **primary key** — it uniquely identifies every row. No two items share an id. That uniqueness is enforced by the database, not by you.

Iliev's point about data types is practical: "If you define a column as INT, the database won't let you insert text into it." The database enforces the contract. This is the biggest difference from a spreadsheet — in Excel, nothing stops you from typing "six" in a Price column. A database rejects it.

**Column constraints** Iliev covers:
- \`NOT NULL\` — the field must have a value; blank is not allowed
- \`PRIMARY KEY\` — uniquely identifies each row; automatically NOT NULL
- \`DEFAULT value\` — used when no value is provided on insert
- \`UNIQUE\` — no two rows can have the same value in this column

Constraints are how a database stays trustworthy. Data that violates a constraint is rejected at write time — not discovered weeks later in a report.`,
      },
      {
        title: 'SELECT — Retrieving Data',
        content: `Iliev's breakdown: "SELECT — First, we specify the action we want to execute. * — The star indicates we want to get all columns. FROM — tells the database which table we want to select from."

The most basic query:

~~~sql
SELECT * FROM menu_items;
~~~

The \`*\` means "all columns." Every row, every column comes back. Fine for exploration — expensive on large tables. Name the columns you actually need:

~~~sql
SELECT name, price, calories
FROM menu_items;
~~~

**Column aliases with AS** — rename columns in the output:

~~~sql
SELECT
    name        AS item_name,
    price       AS price_usd,
    calories    AS cal_count
FROM menu_items;
~~~

The database column stays named \`name\` — you're only renaming it in the output. Aliases matter when presenting results to non-technical people or when a calculated column needs a readable label.

**ORDER BY** — control the sort order:

~~~sql
SELECT name, price
FROM menu_items
ORDER BY price DESC;
~~~

\`DESC\` = highest first. \`ASC\` = lowest first (default when not specified). Sort by multiple columns — the first breaks ties, the second resolves them:

~~~sql
SELECT name, category, price
FROM menu_items
ORDER BY category ASC, price DESC;
~~~

**LIMIT** — cap the number of rows returned:

~~~sql
SELECT name, price
FROM menu_items
ORDER BY price DESC
LIMIT 5;
~~~

The 5 most expensive items. Iliev's note: clause order is fixed. SQL requires: SELECT → FROM → ORDER BY → LIMIT. They cannot be shuffled.

**Comments in SQL** — use \`--\` for a single-line comment:

~~~sql
-- Find the most expensive menu items
SELECT name, price
FROM menu_items
ORDER BY price DESC
LIMIT 5;
~~~

Comments are documentation. A query you wrote three months ago with no comments is a puzzle. A query with one clear comment tells the next person (or your future self) exactly what it does.`,
      },
      {
        title: 'DISTINCT and Pattern Matching',
        content: `**DISTINCT** removes duplicate values. Use it when you want to see what unique values exist in a column:

~~~sql
SELECT DISTINCT category FROM menu_items;
~~~

Without DISTINCT: one row per menu item, category repeating for each. With DISTINCT: one row per category. For a table with 30 Entrees and 15 Sides, DISTINCT gives you 2 rows instead of 45.

Applied to multiple columns — returns unique combinations:

~~~sql
SELECT DISTINCT category, price FROM menu_items;
~~~

**LIKE** — Iliev covers this under "Pattern Matching." Two wildcard characters:
- \`%\` — matches any number of characters (including zero)
- \`_\` — matches exactly one character

~~~sql
-- Items ending with "Chicken"
SELECT * FROM menu_items WHERE name LIKE '%Chicken';

-- Items containing "Rice" anywhere (case-insensitive in SQLite)
SELECT * FROM menu_items WHERE name LIKE '%Rice%';

-- Items whose name is exactly 9 characters starting with "Fried"
SELECT * FROM menu_items WHERE name LIKE 'Fried____';
~~~

Iliev's example from the book: \`SELECT * FROM users WHERE username LIKE '%y'\` — usernames ending in the letter y. Same pattern, different table.

**The exploration workflow** every analyst uses when starting with a new dataset:

~~~sql
-- Step 1: what tables exist?
SELECT name FROM sqlite_master WHERE type = 'table';

-- Step 2: what does the data look like?
SELECT * FROM menu_items LIMIT 5;

-- Step 3: what unique categories exist?
SELECT DISTINCT category FROM menu_items;

-- Step 4: how many items are there?
SELECT COUNT(*) FROM menu_items;
~~~

Run these four queries on any new table before writing anything complex. They answer "what am I working with?" before you commit to an approach.`,
      },
      {
        title: 'How SQL Evaluates a Query',
        content: `Here's something Iliev makes clear that trips up beginners: SQL doesn't execute in the order you write it. Written order: SELECT → FROM → WHERE → ORDER BY. Execution order:

~~~
1. FROM        — choose and load the table
2. WHERE       — filter rows down
3. GROUP BY    — group them (week 3)
4. HAVING      — filter groups (week 3)
5. SELECT      — choose which columns / calculate values
6. ORDER BY    — sort the results
7. LIMIT       — cap the count
~~~

**Why this matters in practice:**

WHERE runs before SELECT. That means column aliases defined in SELECT are not yet visible when WHERE runs. This query fails:

~~~sql
-- BROKEN — alias 'price_usd' doesn't exist when WHERE runs
SELECT price AS price_usd FROM menu_items
WHERE price_usd > 5;

-- CORRECT — use the original column name
SELECT price AS price_usd FROM menu_items
WHERE price > 5;
~~~

ORDER BY runs after SELECT, so aliases ARE visible there:

~~~sql
-- FINE — aliases work in ORDER BY
SELECT price AS price_usd FROM menu_items
ORDER BY price_usd DESC;
~~~

FROM runs before SELECT, which means the database scans the table before it knows which columns you want. Writing \`SELECT *\` vs \`SELECT name, price\` doesn't change what rows get scanned — it only changes what columns come back. On large tables, this is why adding an index (a week 7 topic) on the WHERE column speeds things up.

Understanding this order makes SQL error messages readable. When you see "column does not exist" or "ambiguous column reference," the execution order tells you which clause is running and why the column isn't visible yet.`,
      },
    ],
    python: [
      {
        title: 'Expressions and the Interactive Shell',
        content: `Sweigart opens Chapter 1 of Automate the Boring Stuff with this: "You can run the interactive shell by launching the Mu editor... You should see a >>> prompt."

In this app, the Python editor IS that interactive shell — but you can write multiple lines and run them together. Type code, press Run, see results immediately. No setup, no file saving, no compile step.

The most basic Python instruction is an **expression** — a combination of values and operators that reduces to a single value:

~~~python
2 + 2         # 4
5 * 3         # 15
22 / 8        # 2.75   (true division — always returns a float)
22 // 8       # 2      (floor division — drops the decimal)
22 % 8        # 6      (modulus — the remainder after division)
2 ** 3        # 8      (exponent — 2 to the power of 3)
~~~

Sweigart's operator precedence (highest to lowest): \`**\` first, then \`*\`, \`/\`, \`//\`, \`%\`, then \`+\` and \`-\`. Use parentheses to override:

~~~python
2 + 3 * 4     # 14 — multiplication happens first
(2 + 3) * 4   # 20 — parentheses force addition first
~~~

The modulo operator \`%\` is worth memorizing. It gives you the remainder: \`22 % 8 = 6\` means "22 divided by 8 leaves 6 left over." Real uses: check if a number is even (\`n % 2 == 0\`), cycle through values, split items into groups.

**Errors are normal.** Sweigart: "An error message won't break your computer, so don't be afraid to make mistakes. A crash just means the program stopped running unexpectedly." Python error messages are informative — they tell you the line number and the type of problem. Reading them is a skill you build by seeing many of them.

When Python can't evaluate an expression, it raises an exception. \`10 / 0\` gives a ZeroDivisionError. \`int("abc")\` gives a ValueError. The error name tells you what went wrong; the message tells you where.`,
      },
      {
        title: 'Variables and Data Types',
        content: `From Sweigart Chapter 1 — variables store values so you can use them later. A variable is a name that points to a value in memory:

~~~python
item_name = "Orange Chicken"   # str
price     = 6.99               # float
quantity  = 3                  # int
in_stock  = True               # bool
~~~

The four core data types:
- \`str\` — text in quotes: \`"Orange Chicken"\` or \`'Orange Chicken'\` (both work)
- \`int\` — whole number: \`3\`, \`42\`, \`-7\`
- \`float\` — decimal: \`6.99\`, \`3.14\`, \`-0.5\`
- \`bool\` — exactly \`True\` or \`False\` (capital first letter, no quotes)

Variable naming rules from Sweigart: one word, no spaces, letters/numbers/underscores only, can't start with a number. \`item_name\` ✓, \`1item\` ✗, \`item name\` ✗.

The \`type()\` function tells you what type a value is:

~~~python
type("Orange Chicken")   # <class 'str'>
type(6.99)               # <class 'float'>
type(3)                  # <class 'int'>
type(True)               # <class 'bool'>
~~~

**Type conversion** — converting between types:

~~~python
str(3.99)       # "3.99"   — number becomes a string
int("42")       # 42       — string becomes an integer
float("6.99")   # 6.99     — string becomes a float
int(6.99)       # 6        — drops the decimal (truncates, doesn't round)
bool(0)         # False    — zero is falsy
bool(42)        # True     — any non-zero number is truthy
bool("")        # False    — empty string is falsy
bool("hi")      # True     — any non-empty string is truthy
~~~

Type conversion matters constantly. Data from files, databases, and user input often arrives as strings even when you need numbers. The pattern \`int(input("How many? "))\` appears in nearly every beginner program.

**The SQL connection:** SQL's \`INT\`, \`VARCHAR\`, \`DECIMAL\`, \`BOOLEAN\` map directly to Python's \`int\`, \`str\`, \`float\`, \`bool\`. Same concept, different syntax. When you pull data from a database into Python, numeric columns become \`int\` or \`float\`, text columns become \`str\`.`,
      },
      {
        title: 'Strings in Depth',
        content: `Sweigart spends significant time on strings because text is everywhere in real data — item names, category labels, customer notes, addresses. A \`str\` in Python is a sequence of characters.

**String concatenation** with \`+\`:

~~~python
first = "Orange"
last  = "Chicken"
full  = first + " " + last
print(full)   # Orange Chicken
~~~

**f-strings** — the modern way to embed variables in text:

~~~python
item  = "Orange Chicken"
price = 6.99
print(f"{item} costs \${price:.2f}")   # Orange Chicken costs $6.99
~~~

The \`f\` before the quote makes it an f-string. Anything in \`{}\` is evaluated and inserted. \`:.2f\` formats a float to 2 decimal places.

**Built-in string methods** — functions you call on any string:

~~~python
name = "  orange chicken  "
name.strip()             # "orange chicken"   — removes surrounding whitespace
name.strip().title()     # "Orange Chicken"   — chained calls

name = "Orange Chicken"
name.upper()             # "ORANGE CHICKEN"
name.lower()             # "orange chicken"
name.replace("Chicken", "Beef")   # "Orange Beef"
name.startswith("Orange")         # True
name.endswith("Chicken")          # True
name.count("n")                   # 2
name.split(" ")                   # ["Orange", "Chicken"]
~~~

**String indexing and slicing** — Sweigart: strings work like lists of characters:

~~~python
name = "Orange Chicken"
name[0]      # "O"       — index 0 is first character
name[-1]     # "n"       — negative index counts from end
name[0:6]    # "Orange"  — slice: start up to (not including) end
name[7:]     # "Chicken" — from index 7 to end
len(name)    # 14
~~~

**Why this matters:** McKinney's data cleaning chapter says analysts spend 80% of their time preparing data. Dirty strings — extra whitespace, inconsistent case, mixed formats — are responsible for much of that. \`.strip()\`, \`.lower()\`, \`.replace()\` are your first line of defense. In data work, you'll clean strings before almost every analysis.`,
      },
      {
        title: 'print(), input(), and len()',
        content: `Sweigart's three workhorses from Chapter 1 that appear in virtually every Python program:

**print()** — display output. Accepts any number of arguments, separates them with spaces:

~~~python
print("Hello, Panda Express")
print("Item:", item_name, "| Price:", price)
print()   # empty line
~~~

**Separator and end parameters** — advanced print options:

~~~python
# Default separator is a space; override with sep=
print("Orange", "Chicken", sep="-")   # Orange-Chicken

# Default end is newline; override with end=
print("Loading", end="...")
print("done")   # prints: Loading...done  (on the same line)
~~~

**Aligned output with f-strings** — useful for reports:

~~~python
items = [("Orange Chicken", 6.99, 490), ("Fried Rice", 3.99, 520)]

print(f"{'Item':<20} {'Price':>7} {'Cal':>6}")
print("-" * 35)
for name, price, cal in items:
    print(f"{name:<20} \${price:>6.2f} {cal:>6}")

# Item                   Price    Cal
# -----------------------------------
# Orange Chicken          $6.99    490
# Fried Rice              $3.99    520
~~~

\`<\` left-aligns, \`>\` right-aligns, the number is the column width. This creates clean tabular output.

**len()** — count characters in a string, or items in a list:

~~~python
len("Orange Chicken")       # 14
len(["Entrees", "Sides"])   # 2
~~~

SQL equivalent: \`LENGTH(name)\` does exactly what Python's \`len(name)\` does.

**input()** — reads typed input. Always returns a string:

~~~python
item = input("Enter item name: ")
qty  = int(input("How many? "))   # convert to int right away
total = qty * 6.99
print(f"Total for {qty}x {item}: \${total:.2f}")
~~~

The pattern \`int(input(...))\` is so common it becomes muscle memory. Read first, convert second.`,
      },
    ],
  },

  // ─── WEEK 2 ──────────────────────────────────────────────────────────────────
  {
    week: 2,
    sql: [
      {
        title: 'WHERE — Filtering Rows',
        content: `Iliev's book: "You can use SELECT to get all of your users or a list of users that match a certain criteria."

The WHERE clause is that criteria. It filters which rows come back before any output is produced. Without it you get everything; with it you get only what matches:

~~~sql
SELECT * FROM menu_items
WHERE category = 'Entrees';
~~~

Only rows where category is exactly 'Entrees' come back. Iliev's point: WHERE is evaluated before SELECT — the database filters first, then decides what to show you.

**All comparison operators:**

~~~sql
-- Equality and inequality
WHERE category = 'Entrees'       -- equals (single = in SQL, not ==)
WHERE category != 'Drinks'       -- not equal
WHERE category <> 'Drinks'       -- also not equal (older style)

-- Numeric comparisons
WHERE price > 5.00
WHERE price >= 5.00              -- greater than or equal
WHERE calories < 400
WHERE calories <= 400

-- String comparisons (alphabetical)
WHERE name > 'M'                 -- names that come after M alphabetically
~~~

Important detail from Iliev: text values always use single quotes (\`'Entrees'\`). Numbers never use quotes (\`5.00\`). Mixing these up is one of the most common beginner SQL errors — and the database gives you an obscure error message instead of telling you exactly what's wrong.

**Filtering with calculations** — you can use expressions in WHERE:

~~~sql
-- Items with more than 100 calories per dollar (poor value)
SELECT name, price, calories
FROM menu_items
WHERE (calories / price) > 100;
~~~

WHERE evaluates the expression for every row and keeps the ones where it's true.`,
      },
      {
        title: 'AND, OR, NOT — Combining Conditions',
        content: `Iliev covers combining conditions to narrow or broaden filters. AND requires both conditions to be true; OR requires at least one:

~~~sql
-- Both must be true — Entrees AND expensive
SELECT name, price FROM menu_items
WHERE category = 'Entrees'
  AND price > 7.00;

-- Either can be true — Entrees OR Sides
SELECT name, category FROM menu_items
WHERE category = 'Entrees'
   OR category = 'Sides';

-- NOT inverts a condition
SELECT name, category FROM menu_items
WHERE NOT category = 'Drinks';
~~~

**Operator precedence — the hidden trap.** AND evaluates before OR, exactly like multiplication before addition in math. This query is ambiguous:

~~~sql
-- What does this actually mean?
WHERE category = 'Entrees' OR category = 'Sides' AND price > 7.00
~~~

SQL reads it as: \`category = 'Entrees'\` OR \`(category = 'Sides' AND price > 7.00)\`. That probably isn't what you intended. The fix: always use parentheses when mixing AND and OR:

~~~sql
-- Explicit — what you actually want
WHERE (category = 'Entrees' OR category = 'Sides')
  AND price > 7.00
~~~

**Multiple conditions on one column** — use AND to build a range:

~~~sql
-- Items between $4 and $8 (inclusive)
SELECT name, price FROM menu_items
WHERE price >= 4.00
  AND price <= 8.00;
~~~

This is equivalent to \`BETWEEN\` (covered next) but the explicit AND version is sometimes clearer about intent.

Iliev's rule: always use parentheses when mixing AND and OR. It costs nothing and makes your intent clear to both the database and the next person reading your query.`,
      },
      {
        title: 'NULL — The Absent Value',
        content: `Iliev dedicates a section to NULL because it trips up almost every beginner. His book: "By default, each column in your table can hold NULL values."

NULL means no value was provided — not zero, not an empty string, but genuinely absent. A customer who skipped the phone field: their phone column is NULL. An order with no notes: notes column is NULL. An item with unknown calories: calories column is NULL.

**The trap — you cannot compare NULL with \`=\`:**

~~~sql
-- WRONG — this returns zero rows, not an error
SELECT * FROM menu_items WHERE calories = NULL;

-- ALSO WRONG
SELECT * FROM menu_items WHERE calories != NULL;
~~~

Why? Because NULL is not a value — it's the absence of one. The expression \`calories = NULL\` doesn't return true or false; it returns NULL. And NULL is never true, so the WHERE clause filters out every row.

**The correct approach — IS NULL and IS NOT NULL:**

~~~sql
-- Items where calories is unknown
SELECT name FROM menu_items WHERE calories IS NULL;

-- Items where calories is known
SELECT name, calories FROM menu_items WHERE calories IS NOT NULL;
~~~

**NULL in arithmetic** — NULL propagates. Any arithmetic with NULL returns NULL:

~~~sql
-- If price is NULL, this whole expression is NULL
SELECT name, price * 1.1 AS price_with_tax FROM menu_items;
-- Rows with NULL price come back with NULL tax
~~~

From Iliev: "To prevent NULLs, add NOT NULL when creating the table." In real-world data you'll encounter NULLs constantly. Checking for them before analysis is not optional — it's the first step in any data quality review.

**COALESCE** — provides a default value when something is NULL:

~~~sql
SELECT name, COALESCE(calories, 0) AS calories
FROM menu_items;
~~~

This substitutes 0 wherever calories is NULL. More on COALESCE in Week 5.`,
      },
      {
        title: 'IN, BETWEEN, and Readable Filters',
        content: `Iliev covers shortcuts that make WHERE clauses more readable and easier to maintain.

**IN** — replaces a chain of OR conditions:

~~~sql
-- Instead of:
WHERE category = 'Entrees' OR category = 'Sides' OR category = 'Drinks'

-- Write:
WHERE category IN ('Entrees', 'Sides', 'Drinks')
~~~

IN works with numbers too:

~~~sql
SELECT * FROM menu_items
WHERE id IN (1, 3, 7, 12);
~~~

**NOT IN** — excludes a list:

~~~sql
SELECT name FROM menu_items
WHERE category NOT IN ('Drinks', 'Desserts');
~~~

**BETWEEN** — inclusive range filter:

~~~sql
SELECT name, price FROM menu_items
WHERE price BETWEEN 3.00 AND 7.00;
~~~

Both endpoints are included. Equivalent to \`price >= 3.00 AND price <= 7.00\`, but more readable.

**BETWEEN with dates** — one of its most common uses:

~~~sql
SELECT * FROM sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-03-31';
~~~

The date format SQLite uses is \`'YYYY-MM-DD'\`. Always in quotes, always this order.

**Why these matter beyond readability:** If you add a new category to your menu, you update one IN list instead of finding every OR chain that references categories throughout your queries. Maintainability is part of writing good SQL — not just correctness.`,
      },
      {
        title: 'String Functions in WHERE',
        content: `Iliev covers string functions as tools for filtering and transforming text. In WHERE clauses, they let you clean or normalize data on the fly before comparing.

**UPPER() and LOWER()** — standardize case for comparison:

~~~sql
-- Find regardless of how the category was typed
SELECT * FROM menu_items
WHERE LOWER(category) = 'entrees';

-- This catches 'Entrees', 'ENTREES', 'entrees', 'EnTReEs'
~~~

**TRIM()** — remove leading and trailing whitespace:

~~~sql
SELECT * FROM menu_items
WHERE TRIM(name) = 'Orange Chicken';
-- Matches even if someone stored "  Orange Chicken  " by mistake
~~~

**LENGTH()** — filter by string length:

~~~sql
-- Items with short names (good for label space)
SELECT name FROM menu_items
WHERE LENGTH(name) <= 10;

-- Items with suspiciously short names (possible data entry errors)
SELECT name FROM menu_items
WHERE LENGTH(name) < 3;
~~~

**SUBSTR()** — extract part of a string:

~~~sql
-- Items that start with 'Or' (first 2 characters)
SELECT name FROM menu_items
WHERE SUBSTR(name, 1, 2) = 'Or';
~~~

\`SUBSTR(column, start_position, length)\` — positions start at 1 in SQL (not 0 like Python).

**REPLACE()** — swap text:

~~~sql
-- Normalize a misspelling in output (doesn't change the stored data)
SELECT REPLACE(name, 'Chiken', 'Chicken') AS corrected_name
FROM menu_items;
~~~

These functions run on every row, so they can slow down large queries if used in WHERE. Keeping source data clean (correct case, no extra spaces) is always better than filtering around it at query time.`,
      },
    ],
    python: [
      {
        title: 'Boolean Values and Comparison Operators',
        content: `Sweigart opens Chapter 2: "Before you learn about flow control statements, you first need to learn how to represent those yes and no options."

Boolean values in Python are exactly \`True\` or \`False\` — capitalized, no quotes. They're not strings:

~~~python
True    # valid — the boolean True
"True"  # valid — the string "True" (completely different thing)
true    # NameError — Python is case-sensitive; 'true' is undefined
~~~

**Comparison operators** produce booleans:

~~~python
price = 6.99

price > 5           # True
price >= 6.99       # True
price == 6.99       # True  (== compares values)
price = 6.99        # SyntaxError if used in an expression
                    # (= is assignment, not comparison)
price != 10         # True
price < 3           # False
~~~

Sweigart's key note: "The == operator asks whether two values are the same as each other. The = operator puts the value on the right into the variable on the left." Using = instead of == in a condition is one of the most common errors beginners make.

**Boolean operators** — \`and\`, \`or\`, \`not\` (lowercase in Python):

~~~python
category = "Entrees"
quantity  = 4
price     = 6.99

category == "Entrees" and quantity > 2    # True (both true)
category == "Drinks"  or  price < 10     # True (second is true)
not (price > 10)                         # True (price is not > 10)
~~~

**Short-circuit evaluation** — Sweigart notes Python stops evaluating as soon as the result is determined. For \`and\`: if the first condition is False, the second is never checked. For \`or\`: if the first is True, the second is skipped. This matters when the second condition would cause an error if evaluated with certain inputs.

**Truthiness** — in Python, values can be "truthy" or "falsy" without being literal True/False:

~~~python
bool(0)      # False — zero is falsy
bool(1)      # True  — any non-zero is truthy
bool("")     # False — empty string is falsy
bool("hi")   # True  — non-empty string is truthy
bool([])     # False — empty list is falsy
bool([1,2])  # True  — non-empty list is truthy
~~~`,
      },
      {
        title: 'if / elif / else — Flow Control',
        content: `From Sweigart Chapter 2: "Flow control statements can decide which Python instructions to execute under which conditions."

He uses flowchart diagrams — branching paths with diamonds (decisions) and rectangles (actions). The \`if\` statement is that decision diamond:

~~~python
price = 6.99

if price > 8:
    print("Premium item")
elif price > 5:
    print("Standard item")
else:
    print("Budget item")
# Output: Standard item
~~~

Structure: \`if\` keyword → condition → colon → indented block. The block runs only when the condition is True. \`elif\` (else-if) is checked only if the previous condition was False. \`else\` runs only if nothing above was True.

**Indentation is the structure.** Python uses 4 spaces to mark a code block. Unlike languages that use \`{}\`, Python's indentation is not optional formatting — it's the syntax. Sweigart: "Python knows where the if block ends when it encounters a statement indented as much as the initial if statement."

**Nested conditions** — an \`if\` inside another \`if\`:

~~~python
category = "Entrees"
price    = 9.99

if category == "Entrees":
    if price > 9:
        print("Premium entree")
    else:
        print("Standard entree")
else:
    print("Not an entree")
~~~

This can also be written with \`and\`:

~~~python
if category == "Entrees" and price > 9:
    print("Premium entree")
~~~

**Practical data classification** — the most common use of if/elif/else in data work:

~~~python
items = [("Orange Chicken", 6.99), ("Honey Walnut Shrimp", 8.99), ("Fountain Drink", 2.49)]

for name, price in items:
    if price > 8:
        tier = "Premium"
    elif price > 5:
        tier = "Standard"
    else:
        tier = "Budget"
    print(f"{name:<25} {tier}")
~~~

SQL equivalent: \`CASE WHEN price > 8 THEN 'Premium' WHEN price > 5 THEN 'Standard' ELSE 'Budget' END\` — identical logic.`,
      },
      {
        title: 'while Loops and for Loops',
        content: `Sweigart Chapter 2 covers both loop types. A **while loop** keeps running as long as a condition is True:

~~~python
items_to_process = 5

while items_to_process > 0:
    print(f"Processing... {items_to_process} left")
    items_to_process -= 1   # -= is shorthand for = minus 1

print("Done!")
~~~

**Infinite loop danger** — if the condition never becomes False, the loop runs forever. Always make sure the loop variable changes each iteration.

**for loops** — iterate over a sequence a fixed number of times. Sweigart: "The range() function returns a sequence of numbers."

~~~python
for i in range(5):
    print(i)       # 0, 1, 2, 3, 4

for i in range(1, 6):
    print(i)       # 1, 2, 3, 4, 5

for i in range(0, 10, 2):
    print(i)       # 0, 2, 4, 6, 8  (step by 2)
~~~

**for loops over lists** — the most common pattern in data processing:

~~~python
categories = ["Entrees", "Sides", "Drinks", "Appetizers"]

for category in categories:
    print(f"Category: {category}")
~~~

**break and continue** — Sweigart covers these as loop control:

~~~python
for price in [3.99, 5.99, 8.99, 12.99]:
    if price > 10:
        break           # stop the loop entirely
    print(price)
# Prints 3.99, 5.99, 8.99

for price in [3.99, None, 8.99]:
    if price is None:
        continue        # skip this iteration, go to next
    print(price)
# Prints 3.99, 8.99
~~~

\`break\` exits the loop. \`continue\` skips to the next iteration. In data work, \`continue\` handles missing or invalid values cleanly without nested \`if\` blocks.`,
      },
      {
        title: 'Putting It Together — A Mini Data Processor',
        content: `Here's how this week's concepts combine into a real data-processing pattern. This is the shape of code you'll write again and again:

~~~python
# Menu items: (name, category, price, calories)
menu_items = [
    ("Orange Chicken",       "Entrees", 6.99, 490),
    ("Fried Rice",           "Sides",   3.99, 520),
    ("Chow Mein",            "Sides",   3.99, 510),
    ("Honey Walnut Shrimp",  "Entrees", 8.99, 360),
    ("Fountain Drink",       "Drinks",  2.49,   0),
    ("Beijing Beef",         "Entrees", 6.99, 470),
]

# Filter: Entrees only, under 500 calories
print("Entrees under 500 calories:")
print(f"{'Name':<25} {'Price':>7} {'Cal':>5}")
print("-" * 40)

for name, category, price, calories in menu_items:
    if category == "Entrees" and calories < 500:
        print(f"{name:<25} \${price:>6.2f} {calories:>5}")
~~~

SQL equivalent:

~~~sql
SELECT name, price, calories
FROM menu_items
WHERE category = 'Entrees'
  AND calories < 500;
~~~

Both produce the same result. The SQL version is shorter; the Python version gives you more control. This is the comparison you'll keep making throughout this course — SQL for retrieval and aggregation, Python for custom logic and output formatting.

**Counting in a loop** — the Python equivalent of SQL's COUNT:

~~~python
total = 0
entree_count = 0

for name, category, price, calories in menu_items:
    total += price               # running sum
    if category == "Entrees":
        entree_count += 1

print(f"Total menu cost:  \${total:.2f}")
print(f"Number of entrees: {entree_count}")
~~~

This is exactly what \`SUM(price)\` and \`COUNT(*) WHERE category = 'Entrees'\` do in SQL — just made explicit.`,
      },
    ],
  },

  // ─── WEEK 3 ──────────────────────────────────────────────────────────────────
  {
    week: 3,
    sql: [
      {
        title: 'Aggregate Functions',
        content: `Iliev covers aggregates as the way to summarize data rather than retrieve individual rows. Instead of seeing every sale, you ask: how many total? what's the sum? what's the average?

~~~sql
SELECT COUNT(*) FROM sales;           -- total rows (including NULLs)
SELECT COUNT(notes) FROM sales;       -- rows where notes is NOT NULL
SELECT SUM(revenue) FROM sales;       -- total of all revenue values
SELECT AVG(revenue) FROM sales;       -- mean revenue per row
SELECT MIN(revenue) FROM sales;       -- smallest single value
SELECT MAX(revenue) FROM sales;       -- largest single value
~~~

**The COUNT distinction** — Iliev emphasizes this: \`COUNT(*)\` counts all rows including NULLs. \`COUNT(column_name)\` counts only rows where that column has a value. If 10 of your 50 orders have no notes, \`COUNT(*)\` returns 50 and \`COUNT(notes)\` returns 40. Both numbers are valid — they answer different questions.

Name your aggregates with AS:

~~~sql
SELECT
    COUNT(*)          AS total_orders,
    SUM(revenue)      AS total_revenue,
    ROUND(AVG(revenue), 2) AS avg_order_value,
    MAX(revenue)      AS largest_order,
    MIN(revenue)      AS smallest_order
FROM sales;
~~~

**ROUND()** — takes two arguments: the value and the decimal places. \`ROUND(AVG(revenue), 2)\` gives you average revenue to the penny instead of 12 decimal places.

**Aggregates with WHERE** — filter first, then aggregate:

~~~sql
-- Average revenue for completed orders only
SELECT AVG(revenue) AS avg_completed_revenue
FROM sales
WHERE status = 'complete';
~~~

The WHERE clause runs before the aggregate. Only completed orders are counted. This is how you get meaningful business numbers — not "average of everything" but "average of what actually counts."

**Multiple aggregates in one query** — the most common pattern in reporting:

~~~sql
SELECT
    COUNT(*)                    AS total_orders,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(revenue)                AS gross_revenue,
    ROUND(AVG(revenue), 2)      AS avg_ticket,
    MAX(revenue)                AS max_order,
    MIN(revenue)                AS min_order
FROM sales
WHERE sale_date >= '2024-01-01';
~~~

One query, one scan of the table, six different summary numbers. This is more efficient than running six separate queries.`,
      },
      {
        title: 'GROUP BY and HAVING',
        content: `Iliev: GROUP BY groups rows that share the same value in a column into summary rows — one row per group instead of one row per record.

~~~sql
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category;
~~~

Mental model: GROUP BY sorts all rows into piles by the grouped column, then runs the aggregate on each pile separately. One pile per category, SUM applied to each pile.

**Multiple GROUP BY columns** — group by combinations:

~~~sql
SELECT
    category,
    strftime('%Y-%m', sale_date)  AS month,
    SUM(revenue)                  AS monthly_revenue,
    COUNT(*)                      AS order_count
FROM sales
GROUP BY category, month
ORDER BY month, total_revenue DESC;
~~~

One row per category-per-month. This is the shape of most real business reporting.

**The rule for GROUP BY:** every column in SELECT must either be in GROUP BY or wrapped in an aggregate function. This is because after grouping, each group becomes one row — the database doesn't know which individual value to show for non-grouped, non-aggregated columns.

**HAVING** — filters groups after aggregation. WHERE runs before grouping; HAVING runs after:

~~~sql
-- Categories with more than $1,000 in total revenue
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category
HAVING SUM(revenue) > 1000
ORDER BY total_revenue DESC;
~~~

The rule: if your filter condition uses an aggregate function (SUM, COUNT, AVG...), it must go in HAVING. If it doesn't, it goes in WHERE.

**Both in the same query:**

~~~sql
SELECT category, COUNT(*) AS order_count
FROM sales
WHERE status = 'complete'         -- ← filters rows BEFORE grouping
GROUP BY category
HAVING COUNT(*) >= 10             -- ← filters groups AFTER aggregation
ORDER BY order_count DESC;
~~~

Read this as: "From completed orders only, group by category, then show only categories that have at least 10 orders, sorted from most to least."`,
      },
      {
        title: 'ORDER BY with Aggregates and ROUND',
        content: `Ordering aggregate results turns a table of numbers into a ranked answer:

~~~sql
-- Which category generates the most revenue?
SELECT
    category,
    ROUND(SUM(revenue), 2)  AS total_revenue,
    COUNT(*)                AS order_count,
    ROUND(AVG(revenue), 2)  AS avg_order
FROM sales
GROUP BY category
ORDER BY total_revenue DESC;
~~~

You can ORDER BY a column alias (the name you gave it with AS) in SQLite.

**The full clause order SQL expects:**

~~~
SELECT    ← what to show
FROM      ← which table
WHERE     ← filter rows (before grouping)
GROUP BY  ← group them
HAVING    ← filter groups (after grouping)
ORDER BY  ← sort results
LIMIT     ← cap count
~~~

**Practical reporting query** — a weekly sales summary:

~~~sql
SELECT
    strftime('%w', sale_date)     AS day_of_week,   -- 0=Sunday, 6=Saturday
    COUNT(*)                      AS total_orders,
    ROUND(SUM(revenue), 2)        AS total_revenue,
    ROUND(AVG(revenue), 2)        AS avg_order_value,
    COUNT(DISTINCT customer_id)   AS unique_customers
FROM sales
WHERE sale_date >= date('now', '-7 days')
GROUP BY day_of_week
ORDER BY total_revenue DESC;
~~~

\`strftime()\` is SQLite's date formatting function. \`'%w'\` extracts the day of week as a number. \`date('now', '-7 days')\` means "today minus 7 days" — a rolling window.

This single query gives a Panda Express manager everything they need to staff the week: which day is busiest, average ticket, how many unique customers. That's the power of aggregates.`,
      },
      {
        title: 'CASE Inside Aggregates',
        content: `Combining CASE with aggregate functions creates conditional counts and sums — one of the most powerful SQL patterns. Iliev covers CASE in more depth in Week 5, but the aggregate version is worth introducing now.

**Conditional COUNT** — count rows that meet a condition:

~~~sql
SELECT
    COUNT(*) AS total_items,
    SUM(CASE WHEN category = 'Entrees' THEN 1 ELSE 0 END) AS entree_count,
    SUM(CASE WHEN price > 7 THEN 1 ELSE 0 END)            AS premium_count,
    SUM(CASE WHEN calories < 400 THEN 1 ELSE 0 END)        AS low_cal_count
FROM menu_items;
~~~

Each \`SUM(CASE WHEN ... THEN 1 ELSE 0 END)\` counts rows where the condition is true. This is more concise than running separate queries with WHERE.

**Conditional SUM** — sum only values that meet a condition:

~~~sql
SELECT
    SUM(revenue)                                            AS total_revenue,
    SUM(CASE WHEN category = 'Entrees' THEN revenue END)   AS entree_revenue,
    SUM(CASE WHEN category = 'Sides'   THEN revenue END)   AS sides_revenue
FROM sales;
~~~

When CASE has no ELSE clause, unmatched rows return NULL. \`SUM()\` ignores NULLs, so only matching rows contribute to the total.

**Percentage breakdown in one query:**

~~~sql
SELECT
    ROUND(100.0 * SUM(CASE WHEN category = 'Entrees' THEN revenue ELSE 0 END)
          / SUM(revenue), 1) AS entree_pct,
    ROUND(100.0 * SUM(CASE WHEN category = 'Sides' THEN revenue ELSE 0 END)
          / SUM(revenue), 1) AS sides_pct
FROM sales;
~~~

The \`100.0 *\` forces floating-point division. This pattern appears in virtually every business intelligence report — it's how dashboards calculate "what percentage of revenue came from X."`,
      },
    ],
    python: [
      {
        title: 'Functions — def, parameters, return',
        content: `Sweigart Chapter 3: "A function is like a miniprogram within a program. A major purpose of functions is to group code that gets executed multiple times."

Without functions, you copy and paste. With functions, you write once and call many times:

~~~python
def greet_item(item_name, price):
    print(f"{item_name} costs \${price:.2f}")

greet_item("Orange Chicken", 6.99)
greet_item("Fried Rice", 3.99)
greet_item("Chow Mein", 3.99)
~~~

**Parameters** are the inputs listed in the \`def\`. **Arguments** are the values you pass when calling. In \`greet_item("Orange Chicken", 6.99)\`, the string and number are arguments that fill in \`item_name\` and \`price\`.

**Return values** — Sweigart: "When creating a function using the def statement, you can specify what the return value should be with a return statement":

~~~python
def calculate_tax(price, rate=0.0875):
    return price * rate

def total_with_tax(price):
    return price + calculate_tax(price)

# Functions calling other functions
receipt = total_with_tax(6.99)
print(f"\${receipt:.2f}")   # $7.60
~~~

**Default parameters** — \`rate=0.0875\` is used if you don't pass a rate argument. Override by passing one explicitly: \`calculate_tax(6.99, 0.07)\`.

**Multiple return values** — Python lets a function return a tuple:

~~~python
def analyze_price(price):
    tier = "Premium" if price > 8 else "Standard" if price > 5 else "Budget"
    tax  = round(price * 0.0875, 2)
    total = round(price + tax, 2)
    return tier, tax, total

tier, tax, total = analyze_price(6.99)
print(f"Tier: {tier}, Tax: \${tax}, Total: \${total}")
~~~

This is called "tuple unpacking" — Python fills in the three variables from the three returned values, in order.`,
      },
      {
        title: 'Scope and Exception Handling',
        content: `Sweigart Chapter 3 covers two concepts that confuse beginners: scope and error handling.

**Scope** — variables created inside a function only exist inside that function (local scope):

~~~python
def make_report():
    title = "Sales Summary"    # local variable — only visible inside here
    print(title)

make_report()
print(title)   # NameError: name 'title' is not defined
~~~

Variables outside functions are "global" — visible everywhere. Variables inside functions are "local" — visible only inside that function. The cleanest approach: pass values as parameters and return them. Avoid global variables except for true constants.

**Exception handling** with try/except — Sweigart Chapter 3:

~~~python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Cannot divide by zero")
        return None

def safe_int(text):
    try:
        return int(text)
    except ValueError:
        print(f"'{text}' is not a valid number")
        return None

print(safe_divide(10, 2))     # 5.0
print(safe_divide(10, 0))     # prints error, returns None
print(safe_int("42"))         # 42
print(safe_int("abc"))        # prints error, returns None
~~~

The pattern: \`try\` runs the risky code. \`except ExceptionType\` catches a specific error and handles it gracefully. The program continues instead of crashing.

**None** — Sweigart: "Functions without a return statement return None." It represents the absence of a value:

~~~python
result = safe_divide(10, 0)
if result is None:
    print("Calculation failed — using default")
    result = 0
~~~

Always use \`is None\` and \`is not None\` to check for None — not \`== None\`. This mirrors SQL's \`IS NULL\` and \`IS NOT NULL\` for the same reason.`,
      },
      {
        title: 'Lists',
        content: `Sweigart Chapter 4: "A list is a value that contains multiple values in an ordered sequence."

~~~python
menu_items = ['Orange Chicken', 'Fried Rice', 'Chow Mein', 'Broccoli Beef']
~~~

**Indexing** — zero-based. First item is index 0:

~~~python
menu_items[0]    # 'Orange Chicken'
menu_items[1]    # 'Fried Rice'
menu_items[-1]   # 'Broccoli Beef'   (negative counts from end)
menu_items[-2]   # 'Chow Mein'
~~~

**Slicing** \`[start:end]\` — returns a new list from start up to (not including) end:

~~~python
menu_items[1:3]   # ['Fried Rice', 'Chow Mein']
menu_items[:2]    # ['Orange Chicken', 'Fried Rice']
menu_items[2:]    # ['Chow Mein', 'Broccoli Beef']
menu_items[:]     # copy of the entire list
~~~

**Essential list methods:**

~~~python
items = ['Orange Chicken', 'Fried Rice']

items.append('Chow Mein')          # add to end
items.insert(1, 'Beijing Beef')    # insert at index 1
items.remove('Fried Rice')         # remove first occurrence
items.pop()                        # remove and return last item
items.pop(0)                       # remove and return item at index 0
items.sort()                       # sort in place (alphabetical)
items.sort(reverse=True)           # sort descending
items.reverse()                    # reverse in place
len(items)                         # count items
'Fried Rice' in items              # True/False — membership check
items.index('Chow Mein')           # position of item (raises ValueError if not found)
items.count('Orange Chicken')      # how many times it appears
~~~

**Iterating** — the most common list pattern:

~~~python
prices = [6.99, 3.99, 3.99, 8.99, 2.49]
total = 0
for price in prices:
    total += price
print(f"Total: \${total:.2f}")

# Enumerate: gives both index and value
for i, item in enumerate(menu_items):
    print(f"{i+1}. {item}")
~~~

SQL connection: a list is like a single-column table. \`len()\` = \`COUNT(*)\`. \`in\` = \`WHERE x IN (...)\`. \`sort()\` = \`ORDER BY\`.`,
      },
      {
        title: 'List Comprehensions',
        content: `List comprehensions are Python's most powerful one-liner — Sweigart covers them as a compact way to build lists from other sequences. They replace 3-4 lines of for-loop code with one line:

**Traditional loop approach:**

~~~python
prices = [6.99, 3.99, 3.99, 8.99, 2.49]

# Get all prices above $5
expensive = []
for price in prices:
    if price > 5:
        expensive.append(price)
~~~

**List comprehension:**

~~~python
expensive = [price for price in prices if price > 5]
# [6.99, 8.99]
~~~

Structure: \`[expression for item in iterable if condition]\`

**More examples:**

~~~python
items = [("Orange Chicken", 6.99), ("Fried Rice", 3.99), ("Honey Walnut Shrimp", 8.99)]

# All names
names    = [name for name, price in items]

# Names of items over $7
premium  = [name for name, price in items if price > 7]

# Prices with tax applied
with_tax = [round(price * 1.0875, 2) for name, price in items]

# Uppercase category names
cats     = ["entrees", "sides", "drinks"]
upper    = [c.upper() for c in cats]    # ['ENTREES', 'SIDES', 'DRINKS']
~~~

**Comprehensions for aggregation** — combined with \`sum()\` and \`len()\`:

~~~python
total    = sum(price for name, price in items)
avg      = total / len(items)
premium_count = sum(1 for name, price in items if price > 7)
~~~

\`sum(expression for item in iterable)\` is called a "generator expression" — it's like a list comprehension but more memory-efficient because it doesn't build the full list.

SQL equivalent: SELECT with a WHERE clause + aggregation. In Python, comprehensions are the closest thing to SQL's inline filtering.`,
      },
    ],
  },

  // ─── WEEK 4 ──────────────────────────────────────────────────────────────────
  {
    week: 4,
    sql: [
      {
        title: 'Primary Keys and Foreign Keys',
        content: `Iliev explains keys through the table creation syntax he uses throughout the book. A **primary key** uniquely identifies each row — the database enforces that no two rows can share the same value:

~~~sql
CREATE TABLE customers (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     VARCHAR(255) NOT NULL,
    email    VARCHAR(255) UNIQUE,
    phone    VARCHAR(20)
);
~~~

Iliev: "The primary key column is a unique identifier for our users. We want the id column to be unique, and also, whenever we add new users, we want the ID to autoincrement for each new user." AUTOINCREMENT means the database assigns the next available ID — you don't supply it.

A **foreign key** is a column in one table that references the primary key of another:

~~~sql
CREATE TABLE orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,    -- references customers.id
    item_id     INTEGER NOT NULL,    -- references menu_items.id
    quantity    INTEGER DEFAULT 1,
    order_date  DATETIME,
    total       DECIMAL(8,2)
);
~~~

\`customer_id\` in the orders table points to the \`id\` column in customers. That reference is the "relational" in relational database.

**Why separate tables?** Iliev's reasoning: instead of storing the customer's name and email in every single order row, you store it once in customers and reference it by ID. If a customer changes their email, you update one row — not thousands of order rows. This is called **normalization** — eliminating data duplication.

**The data integrity benefit:** a foreign key constraint (which SQLite supports but doesn't enforce by default) prevents orders from pointing to customers that don't exist. It's how databases stay consistent at scale.`,
      },
      {
        title: 'INNER JOIN',
        content: `Iliev covers JOINs as the mechanism to combine data from related tables. **INNER JOIN** returns only rows where there's a match in both tables:

~~~sql
SELECT
    c.name          AS customer_name,
    c.email,
    o.id            AS order_id,
    o.total,
    o.order_date
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
ORDER BY o.order_date DESC;
~~~

The \`ON\` clause specifies the join condition — which columns connect the tables. Always join on the primary key / foreign key pair. The \`c\` and \`o\` are **table aliases** — Iliev uses these to avoid writing the full table name repeatedly. \`customers c\` means "in this query, refer to the customers table as c."

What INNER JOIN excludes: any customer with no orders won't appear. Any order with no matching customer won't appear. It's the intersection of both tables — only rows with a match on both sides.

**Three-table join** — join as many tables as you need:

~~~sql
SELECT
    c.name          AS customer,
    m.name          AS item,
    o.quantity,
    o.total,
    o.order_date
FROM orders o
JOIN customers  c ON o.customer_id = c.id
JOIN menu_items m ON o.item_id     = m.id
ORDER BY o.order_date DESC
LIMIT 10;
~~~

Each JOIN adds a new table. The ON clause specifies how it connects. This query bridges three tables — orders, customers, and menu_items — to show who ordered what.

**JOIN without INNER** is the same as INNER JOIN — it's just shorter:

~~~sql
SELECT c.name, o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id;
~~~`,
      },
      {
        title: 'LEFT JOIN — Keeping Unmatched Rows',
        content: `**LEFT JOIN** keeps every row from the left table even when there's no match in the right table. Unmatched right-side columns come back as NULL.

~~~sql
SELECT
    c.name,
    c.email,
    o.id    AS order_id,
    o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;
~~~

Customers who've never placed an order appear in the results — with NULL in order_id and total. An INNER JOIN would silently drop them.

**The classic "find no match" pattern:**

~~~sql
-- Customers who have NEVER placed an order
SELECT c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
~~~

The LEFT JOIN brings in all customers, putting NULL where no order exists. WHERE then filters to only those NULL rows. Result: customers with zero order history — a list you'd use for a re-engagement campaign.

**LEFT JOIN with aggregation** — how many orders per customer, including those with none:

~~~sql
SELECT
    c.name,
    COUNT(o.id)             AS order_count,
    COALESCE(SUM(o.total), 0) AS lifetime_value
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY lifetime_value DESC;
~~~

\`COUNT(o.id)\` counts only non-NULL order IDs — customers with no orders get 0. \`COALESCE(SUM(o.total), 0)\` turns NULL (no orders = NULL sum) into 0.

Iliev's rule: use INNER JOIN when you only want matched records. Use LEFT JOIN when you need all records from the primary table regardless. In practice, LEFT JOIN appears more often — it's less likely to silently drop data you needed.`,
      },
      {
        title: 'Joining and Aggregating Together',
        content: `The real power emerges when you combine JOINs with GROUP BY and aggregates. This is the pattern behind virtually every business dashboard:

~~~sql
-- Revenue by category, last 30 days
SELECT
    m.category,
    COUNT(o.id)                   AS orders,
    SUM(o.quantity)               AS units_sold,
    ROUND(SUM(o.total), 2)        AS total_revenue,
    ROUND(AVG(o.total), 2)        AS avg_ticket
FROM orders o
JOIN menu_items m ON o.item_id = m.id
WHERE o.order_date >= date('now', '-30 days')
GROUP BY m.category
ORDER BY total_revenue DESC;
~~~

This crosses orders and menu_items, filters to the last 30 days, groups by category, and aggregates. Five clauses, two tables, four metrics.

**Alias everything** once queries get complex:

~~~sql
WITH recent_orders AS (
    SELECT o.*, m.name AS item_name, m.category
    FROM orders o
    JOIN menu_items m ON o.item_id = m.id
    WHERE o.order_date >= date('now', '-7 days')
)
SELECT
    category,
    COUNT(*)              AS order_count,
    ROUND(SUM(total), 2)  AS revenue
FROM recent_orders
GROUP BY category
ORDER BY revenue DESC;
~~~

The CTE (WITH clause) names the joined result so the main query stays readable. This is the professional pattern — break complex logic into named steps.

**The mental model for multi-table queries:** first figure out which tables hold the data you need. Then figure out how they connect (foreign keys). Then write the JOIN. Then add WHERE, GROUP BY, aggregates. Build incrementally — don't try to write the final query first.`,
      },
    ],
    python: [
      {
        title: 'Dictionaries',
        content: `Sweigart Chapter 5: "Like a list, a dictionary is a mutable collection of many values. But unlike indexes for lists, indexes for dictionaries can use many different data types, not just integers. Indexes for dictionaries are called keys."

~~~python
menu_item = {
    'name':     'Orange Chicken',
    'category': 'Entrees',
    'price':    6.99,
    'calories': 490
}

# Access by key
menu_item['name']      # 'Orange Chicken'
menu_item['price']     # 6.99

# Add or update
menu_item['in_stock'] = True         # add new key
menu_item['price']    = 7.49         # update existing key

# Delete
del menu_item['calories']
~~~

**KeyError** — accessing a key that doesn't exist crashes with KeyError. Use \`.get()\` for safe access:

~~~python
menu_item['allergens']              # KeyError: 'allergens'
menu_item.get('allergens')          # None  (no crash)
menu_item.get('allergens', 'N/A')   # 'N/A' (default value)
~~~

**Dictionary methods:**

~~~python
menu_item.keys()     # all keys as a view
menu_item.values()   # all values as a view
menu_item.items()    # all key-value pairs as tuples

# Iterate over key-value pairs
for key, value in menu_item.items():
    print(f"{key}: {value}")

# Check if key exists
'price' in menu_item    # True
'tax'   in menu_item    # False
~~~

Sweigart: "Unlike lists, items in dictionaries are unordered" (in Python 3.7+ they maintain insertion order, but you shouldn't rely on position).`,
      },
      {
        title: 'Dictionaries as Tables — Simulating SQL',
        content: `Sweigart Chapter 5 shows how dictionaries model real-world structured data. A list of dictionaries is Python's version of a database table:

~~~python
# Each dictionary = one row
menu_items = [
    {'id': 1, 'name': 'Orange Chicken',      'category': 'Entrees', 'price': 6.99},
    {'id': 2, 'name': 'Fried Rice',          'category': 'Sides',   'price': 3.99},
    {'id': 3, 'name': 'Honey Walnut Shrimp', 'category': 'Entrees', 'price': 8.99},
    {'id': 4, 'name': 'Fountain Drink',      'category': 'Drinks',  'price': 2.49},
]

# SQL: SELECT * FROM menu_items WHERE category = 'Entrees'
entrees = [item for item in menu_items if item['category'] == 'Entrees']

# SQL: SELECT SUM(price) FROM menu_items
total = sum(item['price'] for item in menu_items)

# SQL: ORDER BY price DESC LIMIT 3
top3 = sorted(menu_items, key=lambda x: x['price'], reverse=True)[:3]
~~~

**Simulating a JOIN with nested lookup:**

~~~python
customers = {1: {'name': 'Justin'}, 2: {'name': 'Maria'}}
orders    = [
    {'order_id': 101, 'customer_id': 1, 'item': 'Orange Chicken', 'total': 13.98},
    {'order_id': 102, 'customer_id': 2, 'item': 'Fried Rice',     'total':  3.99},
    {'order_id': 103, 'customer_id': 1, 'item': 'Chow Mein',      'total':  7.98},
]

# SQL: SELECT c.name, o.item, o.total FROM orders o JOIN customers c ON ...
for order in orders:
    customer = customers.get(order['customer_id'], {'name': 'Unknown'})
    print(f"{customer['name']:<10} | {order['item']:<20} | \${order['total']:.2f}")
~~~

This is exactly what SQL's JOIN does — Python just makes the lookup mechanism visible instead of hiding it inside the database engine.`,
      },
      {
        title: 'Dictionary Comprehensions and Grouping',
        content: `Just as list comprehensions build lists in one line, **dictionary comprehensions** build dictionaries:

~~~python
items = [("Orange Chicken", 6.99), ("Fried Rice", 3.99), ("Chow Mein", 3.99)]

# Build a dict: name → price
price_lookup = {name: price for name, price in items}
# {'Orange Chicken': 6.99, 'Fried Rice': 3.99, 'Chow Mein': 3.99}

# Build a dict: name → price with tax
with_tax = {name: round(price * 1.0875, 2) for name, price in items}

# Filter: only items over $5
expensive = {name: price for name, price in items if price > 5}
~~~

**Grouping with dictionaries** — the Python equivalent of GROUP BY:

~~~python
menu_items = [
    {'name': 'Orange Chicken', 'category': 'Entrees', 'price': 6.99},
    {'name': 'Fried Rice',     'category': 'Sides',   'price': 3.99},
    {'name': 'Chow Mein',      'category': 'Sides',   'price': 3.99},
    {'name': 'Honey Walnut',   'category': 'Entrees', 'price': 8.99},
]

# Group items by category — SQL: GROUP BY category
by_category = {}
for item in menu_items:
    cat = item['category']
    if cat not in by_category:
        by_category[cat] = []
    by_category[cat].append(item)

# Aggregate: count and total per category
for cat, items in by_category.items():
    count = len(items)
    total = sum(i['price'] for i in items)
    print(f"{cat:<10}: {count} items, \${total:.2f} total")
~~~

This "group by dictionary" pattern is the manual version of what pandas' \`.groupby()\` does automatically (Week 7). Understanding it manually first makes the pandas shortcut intuitive rather than magical.`,
      },
      {
        title: 'Reading Data with sqlite3',
        content: `Python's built-in \`sqlite3\` module connects to SQLite databases and runs SQL queries — bridging everything you've learned in both tracks.

~~~python
import sqlite3

# Connect and query
conn   = sqlite3.connect('week4_menu.db')
cursor = conn.cursor()

cursor.execute("SELECT name, category, price FROM menu_items ORDER BY price DESC")
rows = cursor.fetchall()

for row in rows:
    name, category, price = row    # unpack the tuple
    print(f"{name:<25} {category:<10} \${price:.2f}")

conn.close()
~~~

**fetchall()** returns all rows as a list of tuples. **fetchone()** returns just the next row. **fetchmany(n)** returns at most n rows.

**Parameterized queries** — the safe way to pass values into SQL. Never use string concatenation to build queries (SQL injection risk):

~~~python
category = "Entrees"

# WRONG — vulnerable to SQL injection
cursor.execute(f"SELECT * FROM menu_items WHERE category = '{category}'")

# CORRECT — use ? placeholder
cursor.execute("SELECT * FROM menu_items WHERE category = ?", (category,))
rows = cursor.fetchall()
~~~

The \`?\` placeholder is filled in safely by the library. The second argument is a tuple — hence the trailing comma for a single value: \`(category,)\`.

**Getting column names:**

~~~python
cursor.execute("SELECT name, price FROM menu_items")
columns = [desc[0] for desc in cursor.description]   # ['name', 'price']
rows    = cursor.fetchall()

# Convert to list of dicts — much nicer to work with
data = [dict(zip(columns, row)) for row in rows]
for item in data:
    print(item['name'], item['price'])
~~~

This is the pattern pandas uses internally when you call \`pd.read_sql()\`. Understanding it manually makes the library feel less like magic.`,
      },
    ],
  },

  // ─── WEEK 5 ──────────────────────────────────────────────────────────────────
  {
    week: 5,
    sql: [
      {
        title: 'CASE — Conditional Logic',
        content: `CASE is SQL's if/else. Iliev's book covers conditional expressions as a way to transform data inline rather than filtering it out. Instead of writing multiple queries or post-processing the results in Python, you embed the logic directly in your SELECT so the database does the categorization work.

~~~sql
SELECT
    item_name,
    price,
    CASE
        WHEN price > 8    THEN 'Premium'
        WHEN price > 5    THEN 'Standard'
        ELSE 'Budget'
    END AS price_tier
FROM inventory;
~~~

CASE evaluates top-to-bottom and stops at the first true condition — exactly like Python's if/elif/else chain. The ELSE is optional; without it, unmatched rows get NULL instead. At Panda Express, a price tier label like this lets the regional manager quickly scan which items are driving margin vs. which are volume plays.

**Simplified (simple) CASE form** — when checking equality on a single column, the short form is cleaner:

~~~sql
SELECT
    category,
    CASE category
        WHEN 'Entrees'   THEN 'Main Dish'
        WHEN 'Sides'     THEN 'Side Dish'
        WHEN 'Drinks'    THEN 'Beverage'
        WHEN 'Desserts'  THEN 'Sweet'
        ELSE 'Other'
    END AS category_label
FROM inventory;
~~~

**CASE inside aggregate functions** is one of the most powerful patterns in SQL. It acts as a conditional sum or conditional count — letting you pivot counts or totals into separate columns without using GROUP BY:

~~~sql
-- Sales summary split by time of day, all in one row per store
SELECT
    store_id,
    COUNT(*)                                              AS total_orders,
    SUM(CASE WHEN order_hour < 12 THEN 1 ELSE 0 END)     AS morning_orders,
    SUM(CASE WHEN order_hour BETWEEN 12 AND 14 THEN 1 ELSE 0 END) AS lunch_orders,
    SUM(CASE WHEN order_hour >= 17 THEN 1 ELSE 0 END)    AS dinner_orders,
    SUM(CASE WHEN price > 8 THEN revenue ELSE 0 END)     AS premium_revenue
FROM orders
GROUP BY store_id;
~~~

Iliev emphasizes this pattern: "CASE expressions can be used inside aggregate functions to create conditional aggregations, which is one of the most efficient ways to pivot data in SQL without a dedicated PIVOT keyword."

**Nested CASE** — you can nest CASE expressions inside each other, though readability suffers. A cleaner approach is to use a CTE (Week 6) to name the first CASE result and then apply a second CASE on top:

~~~sql
-- Classify items by both price AND calorie count
SELECT
    item_name,
    CASE
        WHEN price > 8 AND calories < 400 THEN 'Premium Light'
        WHEN price > 8 AND calories >= 400 THEN 'Premium Indulgent'
        WHEN price <= 8 AND calories < 400 THEN 'Value Light'
        ELSE 'Value Indulgent'
    END AS menu_segment
FROM inventory;
~~~

The rule of thumb: if your CASE has more than 4-5 branches, consider whether a lookup table joined in would be cleaner and more maintainable.`,
      },
      {
        title: 'COALESCE and NULL Handling',
        content: `Iliev explains NULL in the context of table definitions: "By default, each column in your table can hold NULL values." In practice, real operational data is full of NULLs — a customer who didn't leave a phone number, a transaction with no discount code, a bus route with no end time recorded. Handling them correctly before analysis is non-negotiable.

**NULL is not zero and not an empty string.** Any arithmetic with NULL returns NULL. Any comparison with NULL (even \`NULL = NULL\`) returns NULL, not TRUE. That's why \`WHERE column = NULL\` never works — you must use \`IS NULL\` or \`IS NOT NULL\`.

~~~sql
-- Wrong — returns no rows even when NULLs exist
SELECT * FROM orders WHERE discount_code = NULL;

-- Correct
SELECT * FROM orders WHERE discount_code IS NULL;
SELECT * FROM orders WHERE discount_code IS NOT NULL;
~~~

\`COALESCE\` returns the first non-NULL value from its argument list — SQL's null-coalescing operator:

~~~sql
-- Replace NULL notes with a default string
SELECT
    order_id,
    COALESCE(notes, 'No special instructions') AS notes
FROM orders;

-- Try multiple fallback columns in order
SELECT
    customer_id,
    COALESCE(phone_mobile, phone_home, phone_work, 'No phone on file') AS best_phone
FROM customers;

-- For SunTran: fill missing route capacity with system default
SELECT
    route_id,
    route_name,
    COALESCE(max_capacity, 40) AS capacity
FROM routes;
~~~

\`NULLIF\` is the inverse — it returns NULL if two values are equal, otherwise it returns the first value. The classic use case is avoiding division-by-zero errors:

~~~sql
-- Safe average order value — if a store had 0 transactions, return NULL not error
SELECT
    store_id,
    SUM(revenue)                           AS total_revenue,
    COUNT(*)                               AS order_count,
    SUM(revenue) / NULLIF(COUNT(*), 0)     AS avg_order_value
FROM sales
GROUP BY store_id;
~~~

**String cleaning functions** Iliev covers as essential data preparation:

~~~sql
SELECT
    UPPER(item_name)            AS name_upper,
    LOWER(category)             AS category_lower,
    TRIM(item_name)             AS name_trimmed,        -- removes leading/trailing spaces
    LTRIM(item_name)            AS left_trimmed,        -- left side only
    RTRIM(item_name)            AS right_trimmed,       -- right side only
    LENGTH(item_name)           AS name_length,
    SUBSTR(item_name, 1, 6)     AS first_six_chars,
    REPLACE(item_name, ' ', '_') AS name_snake_case
FROM inventory;
~~~

**NULL in aggregate functions** — this is subtle but important. COUNT(*) counts all rows including NULLs. COUNT(column) counts only non-NULL values in that column. SUM, AVG, MAX, MIN all silently ignore NULLs:

~~~sql
SELECT
    COUNT(*)              AS total_rows,
    COUNT(discount_code)  AS rows_with_discount,    -- ignores NULLs
    AVG(tip_amount)       AS avg_tip_excl_null       -- NULLs excluded from average
FROM orders;
~~~

Knowing this distinction matters when you're reporting: "What % of transactions included a discount?" requires COUNT(*) in the denominator, not COUNT(discount_code).`,
      },
      {
        title: 'Calculated Columns and Derived Values',
        content: `SQL columns don't have to come directly from table data — you can compute new values on the fly using arithmetic, functions, and expressions. Iliev covers this as "derived columns," and they're the building block for analytical reports.

**Basic column arithmetic** using standard operators (\`+\`, \`-\`, \`*\`, \`/\`):

~~~sql
SELECT
    item_name,
    price,
    cost,
    price - cost                       AS gross_profit,
    (price - cost) / price * 100.0     AS margin_pct,
    price * 1.089                      AS price_with_tax    -- Utah sales tax
FROM inventory;
~~~

**ROUND and CAST** — control numeric precision and data types:

~~~sql
SELECT
    item_name,
    price,
    cost,
    ROUND(price - cost, 2)                        AS gross_profit,
    ROUND((price - cost) / price * 100.0, 1)      AS margin_pct,
    CAST(price AS INTEGER)                        AS price_dollars_only,
    CAST(calories AS REAL) / serving_size         AS calories_per_oz
FROM inventory;
~~~

\`ROUND(value, decimal_places)\` is straightforward. \`CAST\` converts between types — \`INTEGER\`, \`REAL\`, \`TEXT\`, \`NUMERIC\`. Watch out: integer division in SQLite drops the decimal, so \`7 / 2 = 3\` not \`3.5\`. Use \`7 / 2.0\` or \`CAST(7 AS REAL) / 2\` to force floating-point division.

**Derived metrics for Panda Express operations:**

~~~sql
SELECT
    t.store_id,
    s.store_name,
    COUNT(*)                                       AS total_orders,
    SUM(t.revenue)                                 AS total_revenue,
    ROUND(SUM(t.revenue) / COUNT(*), 2)            AS avg_order_value,
    ROUND(SUM(t.revenue) / SUM(t.items_sold), 2)  AS revenue_per_unit,
    ROUND(SUM(t.items_sold) / COUNT(*), 1)         AS avg_items_per_order
FROM transactions t
JOIN stores s ON t.store_id = s.store_id
GROUP BY t.store_id, s.store_name
ORDER BY revenue_per_unit DESC;
~~~

\`revenue_per_unit\` is a common retail KPI — it answers "how much revenue does each menu item sold generate?" Higher means the store is selling more premium items or upselling combos effectively.

**Column aliases** with \`AS\` are required whenever a column name would otherwise be ambiguous (e.g., expressions have no inherent name). Alias names can be used in ORDER BY but NOT in WHERE (the WHERE clause evaluates before the SELECT). To filter on a calculated column, wrap the calculation in a subquery or CTE:

~~~sql
-- This doesn't work — WHERE runs before SELECT aliases are defined:
-- SELECT price - cost AS profit FROM inventory WHERE profit > 3;

-- This works — use the same expression in WHERE:
SELECT price - cost AS profit FROM inventory WHERE price - cost > 3;

-- Or use a subquery:
SELECT * FROM (
    SELECT item_name, price - cost AS profit FROM inventory
) WHERE profit > 3;
~~~

**Percentage of total** — a common derived calculation using a window function or subquery:

~~~sql
SELECT
    item_name,
    revenue,
    ROUND(revenue * 100.0 / SUM(revenue) OVER (), 1) AS pct_of_total
FROM item_revenue
ORDER BY revenue DESC;
~~~

The \`SUM(revenue) OVER ()\` with an empty OVER() computes the grand total across all rows, which you then divide each row's revenue by to get its share.`,
      },
    ],
    python: [
      {
        title: 'pandas — Introduction from McKinney',
        content: `McKinney opens the pandas chapter: "pandas will be a major tool of interest throughout much of the rest of the book. It contains data structures and data manipulation tools designed to make data cleaning and analysis fast and convenient in Python."

The core object is the **DataFrame** — a 2D labeled table, essentially a spreadsheet or SQL table inside Python. McKinney: "pandas adopts significant parts of NumPy's idiomatic style of array-based computing, especially array-based functions and a preference for data processing without for loops." That last point is crucial — you rarely loop over rows in pandas; instead you operate on entire columns at once, which is both faster and more readable.

~~~python
import pandas as pd

# DataFrame from a dictionary (each key becomes a column)
data = {
    'item_name': ['Orange Chicken', 'Fried Rice', 'Chow Mein', 'Beijing Beef'],
    'category':  ['Entrees', 'Sides', 'Sides', 'Entrees'],
    'price':     [6.99, 3.99, 3.99, 6.99],
    'calories':  [490, 520, 510, 470],
    'cost':      [2.10, 1.20, 1.15, 2.05],
}

df = pd.DataFrame(data)
print(df)
print(df.dtypes)        # column data types — object = string, float64, int64
print(df.shape)         # (rows, columns) as a tuple, e.g. (4, 5)
print(df.head(2))       # first 2 rows (default is 5)
print(df.tail(2))       # last 2 rows
print(df.describe())    # summary stats for numeric columns: mean, std, min, max, quartiles
print(df.info())        # column types AND non-null counts — great for spotting NaNs
~~~

**Selecting columns** — single brackets give you a Series (one column), double brackets give you a DataFrame (one or more columns):

~~~python
# Single column → Series
prices = df['price']
print(type(prices))    # <class 'pandas.core.series.Series'>

# Multiple columns → DataFrame
subset = df[['item_name', 'price', 'calories']]
print(type(subset))    # <class 'pandas.core.frame.DataFrame'>
~~~

McKinney: "The biggest difference [from NumPy] is that pandas is designed for working with tabular or heterogeneous data" — meaning columns can have different types, just like a database table. The \`index\` is pandas' row label system — by default it's 0, 1, 2... but it can be set to any column (like \`item_name\` or a date).

In this app, your weekly dataset is already loaded as \`df\`. Always start with \`print(df.head())\` and \`print(df.info())\` to understand what you're working with before doing any analysis.`,
      },
      {
        title: 'Handling Missing Data — McKinney Chapter 7',
        content: `McKinney's data cleaning chapter opens: "During the course of doing data analysis and modeling, a significant amount of time is spent on data preparation: loading, cleaning, transforming, and rearranging. Such tasks are often reported to take up 80% or more of an analyst's time."

pandas uses \`NaN\` (Not a Number) for missing numeric values and \`None\`/\`NaN\` for strings — Python's equivalent of SQL's NULL. The key insight is that NaN propagates silently: \`5 + NaN = NaN\`, so a single missing value can corrupt an entire column's aggregate if you don't handle it.

~~~python
# Detect missing values — your first step on any new dataset
print(df.isnull().sum())        # count NaNs per column
print(df.isnull().mean() * 100) # % of values that are missing per column
print(df.isnull().any())        # True/False — does each column have any NaN?
print(df[df.isnull().any(axis=1)])  # show rows that have at least one NaN
~~~

**Dropping missing values** — McKinney's \`dropna()\` section:

~~~python
df_clean = df.dropna()                          # drop rows with ANY NaN
df_clean = df.dropna(subset=['price'])          # drop only where price is NaN
df_clean = df.dropna(how='all')                 # only drop if ALL columns are NaN
df_clean = df.dropna(thresh=4)                  # keep rows with at least 4 non-NaN values
~~~

**Filling missing values** — McKinney's \`fillna()\` section:

~~~python
df['notes'] = df['notes'].fillna('No special instructions')  # constant fill
df['price'] = df['price'].fillna(df['price'].mean())         # fill with column mean
df['price'] = df['price'].fillna(df['price'].median())       # fill with median (better for skewed data)
df['category'] = df['category'].fillna(df['category'].mode()[0])  # most frequent value
df['revenue'] = df['revenue'].ffill()   # forward fill — carry last known value forward
df['revenue'] = df['revenue'].bfill()   # backward fill — use next known value
~~~

McKinney on the decision: "For numeric data, a common choice is to fill NaN with the mean or median of the column. For categorical data, the most frequent value or a specific sentinel value is typical." In a Panda Express context: if \`tip_amount\` is null, it likely means no tip was given — fill with 0. If \`item_price\` is null, the data is probably corrupt — investigate before filling.

**String cleaning with the \`.str\` accessor** — McKinney introduces this vectorized string interface in Chapter 7:

~~~python
df['category'] = df['category'].str.strip()          # remove whitespace
df['category'] = df['category'].str.lower()          # standardize case
df['item_name'] = df['item_name'].str.title()        # Title Case
df['item_name'] = df['item_name'].str.replace('  ', ' ')  # collapse double spaces

# Check what's left after cleaning
print(df['category'].value_counts())
print(df['category'].unique())
~~~

**Detecting and handling duplicates** — often paired with null handling:

~~~python
print(df.duplicated().sum())               # how many exact duplicate rows?
df_deduped = df.drop_duplicates()          # drop exact duplicates
df_deduped = df.drop_duplicates(subset=['order_id'])  # deduplicate on key column
~~~`,
      },
      {
        title: 'Adding and Transforming Columns in pandas',
        content: `Once your data is loaded and cleaned, the next step is creating new columns — the pandas equivalent of SQL's calculated columns and CASE expressions. McKinney covers this throughout Chapter 5 and Chapter 7 as "transformation" operations.

**Simple column arithmetic** — pandas operates column-wise, so arithmetic between columns works element by element:

~~~python
import pandas as pd

df['gross_profit']  = df['price'] - df['cost']
df['margin_pct']    = (df['price'] - df['cost']) / df['price'] * 100
df['price_with_tax'] = df['price'] * 1.089    # Utah sales tax

# Round to clean up floating-point noise
df['margin_pct'] = df['margin_pct'].round(1)
df['gross_profit'] = df['gross_profit'].round(2)

print(df[['item_name', 'price', 'cost', 'gross_profit', 'margin_pct']])
~~~

**\`apply()\`** — runs a Python function on every element of a column (or every row). McKinney covers this as the escape hatch when vectorized operations aren't sufficient:

~~~python
# apply() with a lambda — equivalent to a SQL CASE expression
df['price_tier'] = df['price'].apply(lambda x: 'Premium' if x > 8 else ('Standard' if x > 5 else 'Budget'))

# apply() with a named function — better for complex logic
def classify_item(row):
    if row['calories'] > 500 and row['price'] > 7:
        return 'High-Cal Premium'
    elif row['calories'] > 500:
        return 'High-Cal Value'
    elif row['price'] > 7:
        return 'Low-Cal Premium'
    else:
        return 'Light Value'

df['segment'] = df.apply(classify_item, axis=1)   # axis=1 means apply row-wise
~~~

**\`map()\`** — replaces values using a dictionary lookup. Cleaner than \`apply()\` when you just need a simple substitution:

~~~python
category_map = {
    'Entrees': 'Main Dish',
    'Sides':   'Side Dish',
    'Drinks':  'Beverage',
    'Desserts': 'Sweet',
}
df['category_label'] = df['category'].map(category_map)
# Values not in the dictionary become NaN — use .fillna() to handle unmapped values
df['category_label'] = df['category_label'].fillna('Other')
~~~

**\`pd.cut()\`** — bins continuous values into labeled categories. McKinney's pandas equivalent of a CASE/BETWEEN range check:

~~~python
# Bin calorie counts into named ranges
df['calorie_tier'] = pd.cut(
    df['calories'],
    bins=[0, 300, 500, 700, float('inf')],
    labels=['Light', 'Moderate', 'Hearty', 'Indulgent']
)

# Bin prices into quartiles
df['price_quartile'] = pd.qcut(df['price'], q=4, labels=['Q1', 'Q2', 'Q3', 'Q4'])
# pd.qcut uses quantile-based bins (equal frequency), pd.cut uses fixed-width bins
~~~

**\`assign()\`** — McKinney's method-chaining friendly way to add multiple columns at once. Returns a new DataFrame, leaving the original unchanged:

~~~python
df_enriched = (
    df
    .assign(gross_profit = lambda d: d['price'] - d['cost'])
    .assign(margin_pct   = lambda d: (d['gross_profit'] / d['price'] * 100).round(1))
    .assign(price_tier   = lambda d: pd.cut(d['price'], bins=[0, 5, 8, 99],
                                            labels=['Budget', 'Standard', 'Premium']))
)
print(df_enriched.head())
~~~

McKinney notes: "\`assign()\` is especially useful when chaining multiple transformation steps together, as it avoids creating intermediate variables and makes the data pipeline readable from top to bottom."

The \`lambda d:\` syntax inside \`assign\` lets you reference newly created columns in the same chain — \`margin_pct\` references \`gross_profit\` which was created in the previous \`assign\` call.`,
      },
    ],
  },

  // ─── WEEK 6 ──────────────────────────────────────────────────────────────────
  {
    week: 6,
    sql: [
      {
        title: 'Subqueries and CTEs',
        content: `A subquery is a SELECT inside another SELECT. The inner query runs first and its result feeds into the outer query. Subqueries let you filter on aggregate results — something WHERE alone cannot do, because WHERE runs before GROUP BY.

~~~sql
-- Stores generating above-average revenue (WHERE can't filter on AVG directly)
SELECT store_id, SUM(revenue) AS total_revenue
FROM transactions
GROUP BY store_id
HAVING SUM(revenue) > (SELECT AVG(store_total) FROM (
    SELECT SUM(revenue) AS store_total FROM transactions GROUP BY store_id
));
~~~

Subqueries in the FROM clause (called **inline views** or **derived tables**) give you a named result set to query against:

~~~sql
SELECT dept, avg_score
FROM (
    SELECT department AS dept, AVG(review_score) AS avg_score
    FROM employees
    GROUP BY department
) AS dept_averages
WHERE avg_score > 80;
~~~

The alias (\`AS dept_averages\`) is required in most databases — SQL needs a name for the derived table.

**Correlated subqueries** — subqueries that reference the outer query. They run once per outer row, which makes them powerful but potentially slow:

~~~sql
-- For each employee, show their score and how far above/below their dept average they are
SELECT
    e.name,
    e.department,
    e.review_score,
    e.review_score - (
        SELECT AVG(e2.review_score)
        FROM employees e2
        WHERE e2.department = e.department    -- correlated: references outer 'e'
    ) AS vs_dept_avg
FROM employees e;
~~~

**CTEs (Common Table Expressions)** — the WITH clause names a subquery so you can reference it by name. Iliev recommends CTEs as the professional default for anything beyond trivial queries:

~~~sql
WITH dept_averages AS (
    SELECT
        department,
        AVG(review_score) AS avg_score,
        COUNT(*)          AS headcount
    FROM employees
    GROUP BY department
),
above_avg AS (
    -- Second CTE can reference the first
    SELECT department
    FROM dept_averages
    WHERE avg_score > 80
)
SELECT
    e.name,
    e.review_score,
    d.avg_score       AS dept_average,
    e.review_score - d.avg_score AS above_avg_by
FROM employees e
JOIN dept_averages d ON e.department = d.department
WHERE e.department IN (SELECT department FROM above_avg)
ORDER BY above_avg_by DESC;
~~~

CTEs chain naturally — each CTE can reference any CTE defined before it. They don't change performance in SQLite but make complex queries dramatically more readable and maintainable. Senior engineers default to CTEs for anything non-trivial because each CTE can be tested in isolation.`,
      },
      {
        title: 'Window Functions',
        content: `Window functions compute a value for each row using a related set of rows — without collapsing the results the way GROUP BY does. This is the key distinction that makes them so powerful: every input row appears in the output, enriched with aggregate context about its group.

~~~sql
SELECT
    name,
    department,
    review_score,
    RANK()     OVER (PARTITION BY department ORDER BY review_score DESC) AS dept_rank,
    AVG(review_score) OVER (PARTITION BY department)                     AS dept_average,
    review_score - AVG(review_score) OVER (PARTITION BY department)      AS vs_dept_avg,
    COUNT(*)   OVER (PARTITION BY department)                            AS dept_size
FROM employees;
~~~

Breaking down the OVER clause syntax:
- \`OVER ()\` — window = all rows in the result set (grand total/average)
- \`OVER (PARTITION BY department)\` — restart the calculation for each department
- \`OVER (ORDER BY review_score DESC)\` — running calculation ordered by score
- \`OVER (PARTITION BY department ORDER BY review_score DESC)\` — both partitioned and ordered

The result: every employee row is preserved AND each row now knows its rank within its department, the department's average, and how far above/below average they are. GROUP BY would have collapsed to one row per department. Window functions give you individual and group context simultaneously.

**Ranking functions compared:**

~~~sql
SELECT
    name,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) AS row_num,    -- 1,2,3,4,5 — no ties ever
    RANK()       OVER (ORDER BY score DESC) AS rank_gaps,  -- 1,2,2,4,5 — gaps after ties
    DENSE_RANK() OVER (ORDER BY score DESC) AS rank_dense  -- 1,2,2,3,4 — no gaps
FROM scores;
~~~

**NTILE** — divide rows into N equal-sized buckets. Useful for percentile groupings:

~~~sql
SELECT
    store_id,
    total_revenue,
    NTILE(4) OVER (ORDER BY total_revenue DESC) AS revenue_quartile
    -- 1 = top 25%, 2 = next 25%, etc.
FROM store_totals;
~~~

**Practical Panda Express window function example** — find the top revenue item per category:

~~~sql
WITH ranked AS (
    SELECT
        item_name,
        category,
        SUM(revenue) AS item_revenue,
        RANK() OVER (PARTITION BY category ORDER BY SUM(revenue) DESC) AS rnk
    FROM order_items
    GROUP BY item_name, category
)
SELECT item_name, category, item_revenue
FROM ranked
WHERE rnk = 1;
~~~

This "top N per group" pattern is one of the most common interview questions and real-world reporting tasks in SQL — window functions are the clean solution.`,
      },
      {
        title: 'Chaining Multiple CTEs',
        content: `The real power of CTEs emerges when you chain three or more of them together to build a step-by-step analytical pipeline. Each CTE represents one transformation stage, and you can test each step independently by running just that CTE's SELECT statement.

Iliev's book describes this as "building a query incrementally — each CTE is a named intermediate result that the next step can use as if it were a table."

**Building a Panda Express store performance report step by step:**

~~~sql
-- Step 1: Get raw transactions with store info attached
WITH raw_data AS (
    SELECT
        t.transaction_id,
        t.store_id,
        s.store_name,
        s.region,
        t.sale_date,
        t.revenue,
        t.items_sold
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
    WHERE t.sale_date >= date('now', '-90 days')
),

-- Step 2: Aggregate to store-month level
-- (Test this CTE independently by copying just this SELECT to verify the aggregation)
monthly_store AS (
    SELECT
        store_id,
        store_name,
        region,
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue)                 AS monthly_revenue,
        SUM(items_sold)              AS monthly_items,
        COUNT(*)                     AS transaction_count,
        ROUND(SUM(revenue) / COUNT(*), 2) AS avg_order_value
    FROM raw_data
    GROUP BY store_id, store_name, region, month
),

-- Step 3: Add regional context — how does each store compare to its region?
regional_benchmarks AS (
    SELECT
        region,
        month,
        AVG(monthly_revenue)    AS region_avg_revenue,
        MAX(monthly_revenue)    AS region_max_revenue
    FROM monthly_store
    GROUP BY region, month
),

-- Step 4: Final output — join store data with regional benchmarks
final AS (
    SELECT
        m.store_name,
        m.region,
        m.month,
        m.monthly_revenue,
        m.avg_order_value,
        r.region_avg_revenue,
        ROUND(m.monthly_revenue - r.region_avg_revenue, 0) AS vs_region_avg,
        RANK() OVER (PARTITION BY m.region, m.month ORDER BY m.monthly_revenue DESC)
            AS rank_in_region
    FROM monthly_store m
    JOIN regional_benchmarks r
        ON m.region = r.region AND m.month = r.month
)

SELECT * FROM final
WHERE month = strftime('%Y-%m', date('now', '-1 month'))   -- last complete month
ORDER BY region, rank_in_region;
~~~

**How to debug a CTE chain:**

1. Run just the first CTE: \`WITH raw_data AS (...) SELECT * FROM raw_data LIMIT 10;\`
2. Add the second CTE and run up to it: \`WITH raw_data AS (...), monthly_store AS (...) SELECT * FROM monthly_store LIMIT 10;\`
3. Continue adding CTEs one at a time until you find the step producing unexpected results.

This incremental testing approach is far faster than trying to debug a 60-line monolithic query. Each CTE is a checkpoint.

**SunTran equivalent** — the same pattern applies to transit analytics:

~~~sql
WITH trips AS (
    SELECT route_id, trip_date, passenger_count, on_time
    FROM trip_logs WHERE trip_date >= date('now', '-30 days')
),
route_stats AS (
    SELECT
        route_id,
        COUNT(*)                          AS total_trips,
        AVG(passenger_count)              AS avg_passengers,
        ROUND(AVG(CASE WHEN on_time THEN 1.0 ELSE 0 END) * 100, 1) AS on_time_pct
    FROM trips
    GROUP BY route_id
),
flagged AS (
    SELECT *, CASE WHEN on_time_pct < 80 THEN 'Needs Review' ELSE 'OK' END AS status
    FROM route_stats
)
SELECT * FROM flagged ORDER BY on_time_pct ASC;
~~~`,
      },
    ],
    python: [
      {
        title: 'pandas groupby — McKinney Chapter 10',
        content: `McKinney opens Chapter 10: "Categorizing a dataset and applying a function to each group, whether an aggregation or transformation, can be a critical component of a data analysis workflow."

He describes the **split-apply-combine** pattern: pandas splits the DataFrame into groups based on one or more columns, applies a function to each group independently, then combines the results back into a single DataFrame. This is the pandas equivalent of SQL's GROUP BY.

~~~python
import pandas as pd

# Single-column groupby
by_category = df.groupby('category')['revenue'].sum()
print(by_category)           # Series with category as index, revenue sums as values
print(type(by_category))     # pandas.core.series.Series

# Multiple columns, multiple aggregations — named aggregation syntax (pandas 0.25+)
summary = df.groupby('department').agg(
    avg_score  = ('review_score', 'mean'),
    max_score  = ('review_score', 'max'),
    min_score  = ('review_score', 'min'),
    headcount  = ('name',         'count'),
    total_comp = ('salary',       'sum')
)
print(summary)
~~~

**Named aggregation** (\`new_col_name = ('source_col', 'function')\`) is McKinney's recommended syntax — it's explicit, readable, and gives you clean column names in one step.

**Multiple group-by columns** — equivalent to SQL's \`GROUP BY col1, col2\`:

~~~python
# Panda Express: revenue by category AND region
region_category = df.groupby(['region', 'category'])['revenue'].agg(['sum', 'mean', 'count'])
print(region_category)

# Reset index to get a flat DataFrame (group columns become regular columns)
region_category = region_category.reset_index()
print(region_category.head(10))
~~~

McKinney: "One reason for the popularity of relational databases and SQL is the ease with which data can be joined, filtered, transformed, and aggregated. However, query languages like SQL impose certain limitations on the kinds of group operations that can be performed. With the expressiveness of Python and pandas, we can perform quite complex group operations by expressing them as custom Python functions."

**Custom aggregation functions** — pass a lambda or function to \`agg()\` for anything not covered by built-ins:

~~~python
# Custom function: revenue range (max - min) per store
store_stats = df.groupby('store_id').agg(
    revenue_range = ('daily_revenue', lambda x: x.max() - x.min()),
    p90_revenue   = ('daily_revenue', lambda x: x.quantile(0.90)),
    cv            = ('daily_revenue', lambda x: x.std() / x.mean())  # coefficient of variation
)
~~~

**transform()** vs \`agg()\` — a subtle but important distinction McKinney covers. \`agg()\` reduces a group to one row. \`transform()\` returns a Series with the same length as the original DataFrame, which lets you add group-level context back to individual rows:

~~~python
# Add department average score back to every employee row (same as SQL window function)
df['dept_avg_score'] = df.groupby('department')['review_score'].transform('mean')
df['vs_dept_avg'] = df['review_score'] - df['dept_avg_score']
print(df[['name', 'department', 'review_score', 'dept_avg_score', 'vs_dept_avg']])
~~~

This is the pandas equivalent of \`AVG(review_score) OVER (PARTITION BY department)\` — each row keeps its individual data while gaining the group context.`,
      },
      {
        title: 'Boolean Indexing and loc/iloc — McKinney Chapter 5',
        content: `McKinney covers data selection as one of the most fundamental pandas skills. Boolean indexing is the pandas equivalent of SQL's WHERE clause — it filters rows based on a condition.

**Boolean indexing basics:**

~~~python
# A comparison returns a boolean Series (True/False for each row)
mask = df['review_score'] > 80
print(mask.head())        # True, False, True, True, False...
print(mask.sum())         # how many True values (rows that pass the filter)

# Pass the mask inside brackets to filter
high_scores = df[mask]
# Or inline:
high_scores = df[df['review_score'] > 80]
~~~

**Multiple conditions** — wrap each condition in parentheses and use \`&\` (AND), \`|\` (OR), \`~\` (NOT):

~~~python
# AND — both conditions must be True
top_eng = df[(df['department'] == 'Engineering') & (df['review_score'] >= 90)]

# OR — either condition
sr_or_high = df[(df['title'] == 'Senior') | (df['review_score'] >= 95)]

# NOT — negate a condition
not_eng = df[~(df['department'] == 'Engineering')]

# Panda Express example: premium items that are not drinks
premium_food = df[(df['price'] > 8) & (df['category'] != 'Drinks')]
~~~

**\`isin()\`** — filter by a list of values, equivalent to SQL's IN operator:

~~~python
target_stores = [101, 105, 112]
store_subset = df[df['store_id'].isin(target_stores)]

# Exclude certain categories (NOT IN)
no_desserts = df[~df['category'].isin(['Desserts', 'Drinks'])]
~~~

**\`loc\`** — label-based selection. McKinney: "loc is for selection by label, which can be row labels (index values) or column names":

~~~python
# Syntax: df.loc[row_selector, column_selector]
# Use slice ':' to mean "all"

# All rows, specific columns
df.loc[:, ['name', 'department', 'review_score']]

# Rows where condition is True, specific columns
df.loc[df['review_score'] > 85, ['name', 'department', 'review_score']]

# Using loc to update values safely (avoids SettingWithCopyWarning)
df.loc[df['review_score'] > 95, 'designation'] = 'Star Performer'
~~~

**\`iloc\`** — position-based selection by integer index. McKinney uses this when you need positional slicing:

~~~python
df.iloc[0]              # first row as a Series
df.iloc[-1]             # last row
df.iloc[0:5]            # first 5 rows (exclusive end)
df.iloc[:, 0:3]         # all rows, first 3 columns
df.iloc[0, 2]           # specific cell: row 0, column 2
df.iloc[[0, 5, 10], :]  # rows 0, 5, and 10
~~~

**McKinney's guidance on when to use each:**
- Boolean indexing — for conditional filtering based on values (most common in analysis)
- \`loc\` — when you know the label/column name and may want to select+update in one step
- \`iloc\` — when you need position-based slicing, like "give me the first 10 rows and columns 2-5"

**Avoid chained indexing** — a common pitfall McKinney warns about. \`df[condition]['column'] = value\` may not update the original DataFrame:

~~~python
# BAD — may not work, raises SettingWithCopyWarning
df[df['dept'] == 'Engineering']['score'] = 99

# GOOD — use loc with both conditions
df.loc[df['dept'] == 'Engineering', 'score'] = 99
~~~`,
      },
      {
        title: 'pandas merge() — The JOIN Equivalent',
        content: `McKinney dedicates a substantial portion of Chapter 8 to combining datasets: "Merging or joining tables is a fundamental operation for most relational data. pandas contains a full-featured, high-performance in-memory join operation, \`pd.merge()\`, that is very similar to relational database join operations."

In SQL you use JOIN. In pandas you use \`pd.merge()\` (or the equivalent \`df.merge()\` method on a DataFrame). The logic is identical — match rows from two DataFrames on a shared key.

**Inner join** — keep only rows with matching keys in both DataFrames:

~~~python
import pandas as pd

# Two DataFrames to join
stores = pd.DataFrame({
    'store_id':   [101, 102, 103, 104],
    'store_name': ['SLC Downtown', 'Provo', 'Ogden', 'St. George'],
    'region':     ['North', 'South', 'North', 'South'],
})

sales = pd.DataFrame({
    'store_id': [101, 101, 102, 103, 105],    # note: 105 is not in stores, 104 has no sales
    'date':     ['2024-01-01', '2024-01-02', '2024-01-01', '2024-01-01', '2024-01-01'],
    'revenue':  [1200, 980, 750, 820, 600],
})

# INNER JOIN — only store_ids that exist in BOTH DataFrames
result = pd.merge(sales, stores, on='store_id', how='inner')
print(result)
# store 104 (no sales) and store 105 (not in stores table) are both excluded
~~~

**Left join** — keep all rows from the left DataFrame, fill missing right-side data with NaN:

~~~python
# LEFT JOIN — keep all sales, bring in store info where available
result = pd.merge(sales, stores, on='store_id', how='left')
print(result)
# store 105's row appears with NaN for store_name and region
~~~

McKinney: "A left join keeps all the keys from the left table, padding with NaN on the right side where no match exists. This is the most common merge type in data analysis because you want to start with your primary dataset and enrich it."

**Joining on different column names** using \`left_on\` and \`right_on\`:

~~~python
# If the key columns have different names in each DataFrame
pd.merge(sales, stores, left_on='location_id', right_on='store_id', how='left')
~~~

**Handling duplicate column names** with \`suffixes\`— if both DataFrames have a column with the same name (e.g., both have \`name\`), pandas appends suffixes to distinguish them:

~~~python
result = pd.merge(
    employees,
    managers,
    on='department',
    how='left',
    suffixes=('_employee', '_manager')   # 'name' becomes 'name_employee' and 'name_manager'
)
~~~

**Merge types summary:**

~~~python
pd.merge(left, right, on='key', how='inner')  # Only matching rows
pd.merge(left, right, on='key', how='left')   # All left rows, matching right
pd.merge(left, right, on='key', how='right')  # Matching left, all right rows
pd.merge(left, right, on='key', how='outer')  # All rows from both, NaN where no match
~~~

**Panda Express practical example** — join transactions with menu data to add category and cost information:

~~~python
merged = pd.merge(
    transactions,                          # left: one row per sale
    menu_items[['item_id', 'item_name', 'category', 'cost']],  # right: item master data
    on='item_id',
    how='left'
)
merged['gross_profit'] = merged['revenue'] - merged['cost']
print(merged.groupby('category')['gross_profit'].sum().sort_values(ascending=False))
~~~

After merging, always check for unexpected NaNs: \`print(merged.isnull().sum())\` — NaNs in joined columns indicate unmatched keys, which often signals a data quality issue worth investigating.`,
      },
    ],
  },

  // ─── WEEK 7 ──────────────────────────────────────────────────────────────────
  {
    week: 7,
    sql: [
      {
        title: 'Date Functions in SQLite',
        content: `SQLite stores dates as ISO-format text (\`YYYY-MM-DD\`) or Unix timestamps. Because ISO format sorts alphabetically in the same order as chronologically, string comparisons work correctly for date filtering — a reliable quirk that makes SQLite date handling straightforward.

The primary date function is \`strftime(format, date)\`, which extracts or formats date parts:

~~~sql
SELECT
    sale_date,
    strftime('%Y',  sale_date)  AS year,           -- '2024'
    strftime('%m',  sale_date)  AS month_num,       -- '01' through '12'
    strftime('%d',  sale_date)  AS day_num,         -- '01' through '31'
    strftime('%w',  sale_date)  AS day_of_week,     -- '0'=Sunday, '6'=Saturday
    strftime('%H',  sale_date)  AS hour,            -- '00' through '23'
    strftime('%Y-%m', sale_date) AS year_month      -- '2024-01'
FROM sales;
~~~

**Group by time period** — the most common date operation in reporting:

~~~sql
-- Revenue by month: group on the formatted string so all days in a month collapse together
SELECT
    strftime('%Y-%m', sale_date)  AS month,
    SUM(revenue)                  AS monthly_revenue,
    COUNT(*)                      AS transaction_count,
    ROUND(SUM(revenue) / COUNT(*), 2) AS avg_order_value
FROM sales
GROUP BY strftime('%Y-%m', sale_date)
ORDER BY month;

-- Panda Express: which day of week drives the most revenue?
SELECT
    CASE strftime('%w', sale_date)
        WHEN '0' THEN 'Sunday'    WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'   WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'  WHEN '5' THEN 'Friday'
        ELSE 'Saturday'
    END AS day_name,
    strftime('%w', sale_date)    AS day_num,
    SUM(revenue)                 AS total_revenue,
    COUNT(*)                     AS transaction_count
FROM sales
GROUP BY strftime('%w', sale_date)
ORDER BY day_num;
~~~

**Date range filtering** — ISO dates sort alphabetically = chronologically:

~~~sql
-- Q1 2024
SELECT * FROM sales
WHERE sale_date >= '2024-01-01'
  AND sale_date <  '2024-04-01';

-- Last 30 days (dynamic — recalculates relative to today)
SELECT * FROM sales
WHERE sale_date >= date('now', '-30 days');

-- Last complete month
SELECT * FROM sales
WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', date('now', '-1 month'));
~~~

**Date arithmetic** — SQLite has two approaches. The \`date()\` function with modifiers for relative dates, and \`julianday()\` for precise day-count calculations:

~~~sql
-- date() modifiers for relative dates
SELECT
    date('now')               AS today,
    date('now', '-7 days')    AS week_ago,
    date('now', '-1 month')   AS month_ago,
    date('now', 'start of month') AS first_of_month,
    date('now', 'start of month', '-1 month') AS first_of_last_month;

-- julianday() for precise day-count arithmetic
-- (converts a date to a decimal day number since noon Jan 1, 4713 BC)
SELECT
    customer_id,
    MAX(order_date)                                              AS last_order,
    ROUND(julianday('now') - julianday(MAX(order_date)))        AS days_since_last_order,
    MIN(order_date)                                             AS first_order,
    ROUND(julianday(MAX(order_date)) - julianday(MIN(order_date))) AS customer_lifespan_days
FROM orders
GROUP BY customer_id
ORDER BY days_since_last_order DESC;
~~~

**SunTran bus scheduling example** — find routes that haven't run on time in the last 7 days:

~~~sql
SELECT
    route_id,
    COUNT(*) AS trips_last_7_days,
    SUM(CASE WHEN on_time = 1 THEN 1 ELSE 0 END) AS on_time_trips,
    ROUND(AVG(CASE WHEN on_time = 1 THEN 100.0 ELSE 0 END), 1) AS on_time_pct
FROM trip_logs
WHERE trip_date >= date('now', '-7 days')
GROUP BY route_id
HAVING on_time_pct < 80
ORDER BY on_time_pct ASC;
~~~`,
      },
      {
        title: 'LAG and Period-over-Period Analysis',
        content: `\`LAG\` and \`LEAD\` are window functions that let you reference values from adjacent rows. \`LAG(col, n)\` looks n rows back; \`LEAD(col, n)\` looks n rows forward. Together they enable period-over-period comparisons — the most common request from any operations or finance team.

**Month-over-month revenue change:**

~~~sql
WITH monthly AS (
    SELECT
        strftime('%Y-%m', sale_date)  AS month,
        SUM(revenue)                  AS revenue,
        COUNT(*)                      AS order_count
    FROM sales
    GROUP BY month
),
with_lag AS (
    SELECT
        month,
        revenue,
        order_count,
        LAG(revenue,     1) OVER (ORDER BY month) AS prev_month_revenue,
        LAG(order_count, 1) OVER (ORDER BY month) AS prev_month_orders
    FROM monthly
)
SELECT
    month,
    revenue,
    prev_month_revenue,
    revenue - prev_month_revenue                                    AS revenue_change,
    ROUND(
        100.0 * (revenue - prev_month_revenue) / prev_month_revenue,
        1
    )                                                               AS revenue_pct_change,
    ROUND(
        100.0 * (order_count - prev_month_orders) / prev_month_orders,
        1
    )                                                               AS orders_pct_change
FROM with_lag
WHERE prev_month_revenue IS NOT NULL    -- skip the first month (no prior data)
ORDER BY month;
~~~

\`LAG(revenue, 1)\` means "the value of revenue from 1 row back." The \`OVER (ORDER BY month)\` defines the ordering context — what "previous" means. Without ORDER BY, the concept of "previous" is undefined.

The first row in the ordered set always has NULL for LAG (no row before it). Use \`COALESCE\` or a WHERE filter to handle this gracefully.

**Week-over-week by store** — adding PARTITION BY lets you do period-over-period within each subgroup:

~~~sql
WITH weekly_store AS (
    SELECT
        store_id,
        strftime('%Y-W%W', sale_date) AS week,
        SUM(revenue)                  AS weekly_revenue
    FROM sales
    GROUP BY store_id, week
)
SELECT
    store_id,
    week,
    weekly_revenue,
    LAG(weekly_revenue, 1) OVER (PARTITION BY store_id ORDER BY week) AS prev_week,
    ROUND(
        100.0 * (weekly_revenue - LAG(weekly_revenue, 1) OVER (PARTITION BY store_id ORDER BY week))
        / LAG(weekly_revenue, 1) OVER (PARTITION BY store_id ORDER BY week),
        1
    ) AS wow_pct_change
FROM weekly_store
ORDER BY store_id, week;
~~~

\`PARTITION BY store_id\` means the LAG restarts for each store — so "previous week" for store 101 is the prior week's data for store 101, not a different store.

**LEAD example — days until next delivery:**

~~~sql
SELECT
    order_id,
    order_date,
    LEAD(order_date, 1) OVER (ORDER BY order_date) AS next_order_date,
    ROUND(
        julianday(LEAD(order_date, 1) OVER (ORDER BY order_date))
        - julianday(order_date)
    ) AS days_until_next_order
FROM supplier_orders
ORDER BY order_date;
~~~

**Naming repeated window expressions with CTEs** — the OVER clause can get verbose when repeated. Use a CTE to compute the LAG once and reference it multiple times:

~~~sql
WITH monthly AS (
    SELECT strftime('%Y-%m', sale_date) AS month, SUM(revenue) AS revenue
    FROM sales GROUP BY month
),
mom AS (
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS prev
    FROM monthly
)
SELECT
    month,
    revenue,
    prev                                        AS prev_month,
    revenue - prev                              AS absolute_change,
    ROUND(100.0 * (revenue - prev) / prev, 1)  AS pct_change,
    CASE
        WHEN revenue > prev * 1.05 THEN 'Growing (>5%)'
        WHEN revenue < prev * 0.95 THEN 'Declining (>5%)'
        ELSE 'Stable'
    END AS trend_label
FROM mom
WHERE prev IS NOT NULL;
~~~`,
      },
      {
        title: 'Running Totals and Cumulative Sums',
        content: `A running total (cumulative sum) adds up a value progressively as you move through ordered rows. It answers questions like "what was our revenue so far at the end of each month?" or "how many transactions have we processed since the start of the quarter?"

The key is \`SUM() OVER (ORDER BY ...)\` — when you add ORDER BY to a window function without PARTITION BY, the window expands as rows are processed in order:

~~~sql
-- Cumulative revenue over time for a single store
SELECT
    strftime('%Y-%m', sale_date)  AS month,
    SUM(revenue)                  AS monthly_revenue,
    SUM(SUM(revenue)) OVER (ORDER BY strftime('%Y-%m', sale_date))
                                  AS cumulative_revenue
FROM sales
WHERE store_id = 101
GROUP BY month
ORDER BY month;
~~~

The \`SUM(SUM(revenue))\` double-aggregation looks strange but is correct: the inner SUM groups by month (GROUP BY), and the outer SUM accumulates the monthly totals in window-order.

**Running count** — how many orders have we received so far in the year?

~~~sql
SELECT
    order_date,
    order_id,
    COUNT(*) OVER (ORDER BY order_date) AS running_order_count
FROM orders
WHERE strftime('%Y', order_date) = '2024'
ORDER BY order_date;
~~~

**Cumulative sum partitioned by group** — restart the running total for each store or category:

~~~sql
WITH monthly_store AS (
    SELECT
        store_id,
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue) AS monthly_rev
    FROM sales
    GROUP BY store_id, month
)
SELECT
    store_id,
    month,
    monthly_rev,
    SUM(monthly_rev) OVER (
        PARTITION BY store_id       -- restart cumulative total per store
        ORDER BY month              -- accumulate in chronological order
    ) AS ytd_revenue,
    SUM(monthly_rev) OVER (
        PARTITION BY store_id
        ORDER BY month
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- explicit frame (default behavior)
    ) AS ytd_revenue_explicit
FROM monthly_store
ORDER BY store_id, month;
~~~

**Running percentage of total** — what fraction of annual revenue had been earned by the end of each month?

~~~sql
WITH monthly AS (
    SELECT
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue) AS monthly_rev
    FROM sales
    WHERE strftime('%Y', sale_date) = '2024'
    GROUP BY month
)
SELECT
    month,
    monthly_rev,
    SUM(monthly_rev) OVER (ORDER BY month)     AS cumulative_rev,
    SUM(monthly_rev) OVER ()                   AS annual_total,
    ROUND(
        100.0 * SUM(monthly_rev) OVER (ORDER BY month)
        / SUM(monthly_rev) OVER (),
        1
    )                                          AS pct_of_annual
FROM monthly
ORDER BY month;
~~~

\`SUM(monthly_rev) OVER ()\` with an empty window computes the grand total (all rows). This is your denominator. The numerator uses the ordered cumulative sum. Dividing them gives the running percentage.

This kind of report is extremely common in operations: "by end of March, we had achieved 28% of our annual revenue target" — you build that with a running total divided by the annual total.`,
      },
    ],
    python: [
      {
        title: 'Time Series with pandas — McKinney Chapter 11',
        content: `McKinney Chapter 11: "Time series data is an important form of structured data in many different fields, including finance, economics, ecology, neuroscience, and physics. There are many things one may wish to do with time series data: indexing, slicing, aggregating, resampling, and more."

**Converting to datetime and setting the index:**

~~~python
import pandas as pd

df['sale_date'] = pd.to_datetime(df['sale_date'])  # parse string to datetime64
df = df.set_index('sale_date')                     # make it the index

# Once set as index, you can slice with date strings
jan_data  = df['2024-01']              # all of January 2024
q1_data   = df['2024-01':'2024-03']    # Q1 2024
recent    = df['2024-06-01':]          # everything from June 1st on
~~~

**DatetimeIndex attributes** — once the index is a DatetimeIndex, you get free date component access:

~~~python
print(df.index.year)       # array of years
print(df.index.month)      # array of month numbers
print(df.index.day_name()) # ['Monday', 'Tuesday', ...]
print(df.index.dayofweek)  # 0=Monday, 6=Sunday

# Add day-of-week as a column for grouping
df['day_of_week'] = df.index.day_name()
~~~

**\`resample()\`** — McKinney's method for time-based aggregation. "Similar in spirit to groupby, it involves splitting the time series, applying a function, and combining the results":

~~~python
monthly    = df['revenue'].resample('ME').sum()     # month-end totals
weekly     = df['revenue'].resample('W').sum()      # weekly totals
daily      = df['revenue'].resample('D').sum()      # daily (fills gaps with NaN)
quarterly  = df['revenue'].resample('QE').sum()     # quarter-end totals

# Multiple aggregations
monthly_summary = df['revenue'].resample('ME').agg(['sum', 'mean', 'count'])
print(monthly_summary)
~~~

Frequency string reference from McKinney: \`'D'\` day, \`'W'\` week, \`'ME'\` month end, \`'QE'\` quarter end, \`'YE'\` year end, \`'h'\` hour, \`'min'\` minute.

**\`rolling()\`** — compute a moving window calculation. McKinney: "Rolling statistics are another type of time series transformation, for example computing a trailing 7-day average":

~~~python
weekly_rev = df['revenue'].resample('W').sum()

# 4-week rolling average — smooths out noise, reveals the underlying trend
rolling_4w  = weekly_rev.rolling(window=4).mean()

# Rolling with minimum periods — useful when you have incomplete windows at the start
rolling_min = weekly_rev.rolling(window=4, min_periods=1).mean()

# Rolling standard deviation — measures consistency/volatility
rolling_std = weekly_rev.rolling(window=4).std()

print(pd.DataFrame({
    'weekly':      weekly_rev,
    'rolling_avg': rolling_4w,
    'rolling_std': rolling_std
}).tail(10))
~~~

**Panda Express weekly trend example:**

~~~python
# Resample to week, then compute rolling stats
weekly = df.resample('W').agg(
    revenue      = ('revenue',    'sum'),
    transactions = ('order_id',   'count'),
    avg_order    = ('revenue',    'mean')
)

weekly['revenue_trend'] = weekly['revenue'].rolling(4).mean()
weekly['revenue_wow_pct'] = weekly['revenue'].pct_change() * 100

# Flag weeks that dropped more than 10% from prior week
weekly['alert'] = weekly['revenue_wow_pct'] < -10
print(weekly[weekly['alert']])
~~~`,
      },
      {
        title: 'Period-over-Period Comparisons in pandas',
        content: `McKinney covers period-over-period analysis in Chapter 11 as a core time series operation. The tools are \`pct_change()\`, \`shift()\`, and \`diff()\` — the Python equivalents of SQL's LAG and LEAD.

**\`pct_change()\`** — calculates percentage change between the current and prior period:

~~~python
import pandas as pd

monthly_rev = df['revenue'].resample('ME').sum()

# Month-over-month percent change
mom = monthly_rev.pct_change()         # returns decimal (0.05 = 5% increase)
mom_pct = monthly_rev.pct_change() * 100  # multiply for readable percentage

# Year-over-year: compare to 12 periods back
yoy = monthly_rev.pct_change(periods=12) * 100

print(pd.DataFrame({
    'revenue':   monthly_rev,
    'mom_pct':   mom_pct.round(1),
    'yoy_pct':   yoy.round(1)
}))
~~~

**\`shift()\`** — shifts a Series by N periods, equivalent to SQL's LAG (positive N = look back):

~~~python
monthly_rev = df['revenue'].resample('ME').sum()

# Manually compute MoM change using shift
prev_month   = monthly_rev.shift(1)          # lag by 1 period
mom_change   = monthly_rev - prev_month      # absolute change
mom_pct      = (monthly_rev / prev_month - 1) * 100  # same as pct_change()

# Shift forward (like SQL's LEAD) to see the "next" value
next_month   = monthly_rev.shift(-1)
gap_to_next  = next_month - monthly_rev

print(pd.DataFrame({
    'revenue':     monthly_rev,
    'prev_month':  prev_month,
    'change':      mom_change.round(0),
    'pct_change':  mom_pct.round(1)
}).tail(6))
~~~

**\`diff()\`** — calculates absolute difference (not percentage) between consecutive periods. Cleaner than \`x - x.shift(1)\` when you just need the delta:

~~~python
# Daily revenue differences
daily_rev    = df['revenue'].resample('D').sum()
daily_change = daily_rev.diff()                 # equivalent to daily_rev - daily_rev.shift(1)
daily_change_7d = daily_rev.diff(7)             # compare to same day last week

print("Biggest single-day drops:")
print(daily_change.nsmallest(5))
~~~

**Full period-over-period analysis DataFrame — Panda Express example:**

~~~python
# Start with weekly aggregation
weekly = df.resample('W').agg(
    revenue      = ('revenue',    'sum'),
    orders       = ('order_id',   'count'),
    avg_check    = ('revenue',    'mean')
).reset_index()

weekly.columns = ['week_end', 'revenue', 'orders', 'avg_check']

# Add all comparison metrics
weekly['prev_week_rev']  = weekly['revenue'].shift(1)
weekly['wow_change']     = weekly['revenue'].diff()
weekly['wow_pct']        = weekly['revenue'].pct_change() * 100
weekly['rolling_4w_avg'] = weekly['revenue'].rolling(4).mean()
weekly['vs_rolling_avg'] = weekly['revenue'] - weekly['rolling_4w_avg']

# Classify each week's performance
weekly['performance'] = pd.cut(
    weekly['wow_pct'],
    bins=[-float('inf'), -10, -5, 5, 10, float('inf')],
    labels=['Sharp Drop', 'Declining', 'Stable', 'Growing', 'Strong Growth']
)

print(weekly[['week_end', 'revenue', 'wow_pct', 'performance']].tail(10))
~~~

**Comparing this year to last year (same period)** — a very common business question:

~~~python
# Group by (year, month) first
df['year']  = df.index.year
df['month'] = df.index.month

monthly_by_year = df.groupby(['year', 'month'])['revenue'].sum().unstack(level=0)
# unstack(level=0) pivots years into columns: columns are 2023, 2024, etc.

monthly_by_year['yoy_change'] = monthly_by_year[2024] - monthly_by_year[2023]
monthly_by_year['yoy_pct'] = (monthly_by_year[2024] / monthly_by_year[2023] - 1) * 100
print(monthly_by_year.round(1))
~~~`,
      },
    ],
  },

  // ─── WEEK 8 ──────────────────────────────────────────────────────────────────
  {
    week: 8,
    sql: [
      {
        title: 'UNION and UNION ALL',
        content: `UNION combines result sets from two or more SELECT statements into a single result set. The rules are simple: both queries must return the same number of columns, and the corresponding columns must have compatible data types. Column names come from the first SELECT.

**UNION vs UNION ALL** — the critical difference:

~~~sql
-- UNION removes duplicate rows (runs a DISTINCT on the combined result — slower)
SELECT product_id, product_name, 'East' AS region
FROM east_top_products
UNION
SELECT product_id, product_name, 'West' AS region
FROM west_top_products;

-- UNION ALL keeps ALL rows including duplicates (no deduplication — faster)
SELECT product_id, 'East'    AS region FROM east_top_ten
UNION ALL
SELECT product_id, 'Central' AS region FROM central_top_ten
UNION ALL
SELECT product_id, 'West'    AS region FROM west_top_ten;
~~~

Always default to \`UNION ALL\` unless you specifically need deduplication. \`UNION\` has to sort or hash the entire combined result set to find duplicates, which adds overhead — especially on large tables.

**Practical UNION ALL: combining data from multiple sources into one analysis table:**

~~~sql
-- Panda Express: combine actual sales with a "budget" table for variance analysis
SELECT
    store_id,
    strftime('%Y-%m', sale_date) AS month,
    SUM(revenue)                 AS amount,
    'Actual'                     AS type
FROM transactions
GROUP BY store_id, month

UNION ALL

SELECT
    store_id,
    budget_month                 AS month,
    budget_revenue               AS amount,
    'Budget'                     AS type
FROM store_budgets;
~~~

Now you can wrap this in a CTE and query it like a single table:

~~~sql
WITH combined AS (
    SELECT store_id, month, SUM(revenue) AS amount, 'Actual' AS type
    FROM transactions GROUP BY store_id, month
    UNION ALL
    SELECT store_id, budget_month, budget_revenue, 'Budget'
    FROM store_budgets
)
SELECT
    a.store_id,
    a.month,
    a.amount                              AS actual,
    b.amount                              AS budget,
    a.amount - b.amount                   AS variance,
    ROUND(100.0 * a.amount / b.amount - 100, 1) AS pct_to_budget
FROM combined a
JOIN combined b ON a.store_id = b.store_id AND a.month = b.month
WHERE a.type = 'Actual' AND b.type = 'Budget'
ORDER BY a.store_id, a.month;
~~~

**UNION for schema consolidation** — combining identically structured tables from different time periods or regions:

~~~sql
-- Append historical archives to current table
SELECT *, '2024' AS source_year FROM transactions_2024
UNION ALL
SELECT *, '2023' AS source_year FROM transactions_2023
UNION ALL
SELECT *, '2022' AS source_year FROM transactions_2022
ORDER BY sale_date;
~~~

This is the SQL equivalent of \`pd.concat()\` in pandas — stacking DataFrames vertically.`,
      },
      {
        title: 'INTERSECT and EXCEPT',
        content: `INTERSECT and EXCEPT complete the SQL set operation toolkit. Think of them visually as Venn diagram operations: UNION = everything in both circles, INTERSECT = only the overlap, EXCEPT = left circle minus the overlap.

**INTERSECT** — returns only rows that appear in BOTH result sets:

~~~sql
-- Items that rank in the top 10 in BOTH East AND West regions
SELECT item_id FROM east_top_ten
INTERSECT
SELECT item_id FROM west_top_ten;

-- Employees who appear in BOTH the high-performer list AND the promotion candidate list
SELECT employee_id FROM high_performers
INTERSECT
SELECT employee_id FROM promotion_candidates;
~~~

**EXCEPT** — returns rows from the first result set that do NOT appear in the second:

~~~sql
-- Items in East top 10 that did NOT make the West top 10 (East exclusives)
SELECT item_id FROM east_top_ten
EXCEPT
SELECT item_id FROM west_top_ten;

-- Panda Express: stores that hit their monthly target in January but NOT in February
SELECT store_id FROM january_target_achievers
EXCEPT
SELECT store_id FROM february_target_achievers;
~~~

Note: EXCEPT is the SQL standard name. Some databases (SQL Server, MySQL) use \`MINUS\` instead.

**Rewriting with JOIN** — in practice, senior analysts often replace INTERSECT/EXCEPT with JOIN patterns because they allow you to select additional columns beyond just the key:

~~~sql
-- INTERSECT equivalent using INNER JOIN (and you can add more columns)
SELECT e.item_id, e.item_name, e.east_rank, w.west_rank
FROM east_top_ten e
INNER JOIN west_top_ten w ON e.item_id = w.item_id
ORDER BY e.east_rank;

-- EXCEPT equivalent using LEFT JOIN + IS NULL
SELECT e.item_id, e.item_name, e.east_rank
FROM east_top_ten e
LEFT JOIN west_top_ten w ON e.item_id = w.item_id
WHERE w.item_id IS NULL
ORDER BY e.east_rank;
~~~

The JOIN approach is more powerful: you can include rank from both sides, add WHERE conditions, JOIN to a third table for names, and generally have more control over the output.

**SunTran route analysis with set operations:**

~~~sql
-- Routes running during morning peak (6-9am)
WITH morning_routes AS (
    SELECT DISTINCT route_id FROM trip_logs
    WHERE strftime('%H', departure_time) BETWEEN '06' AND '08'
),
evening_routes AS (
    SELECT DISTINCT route_id FROM trip_logs
    WHERE strftime('%H', departure_time) BETWEEN '16' AND '18'
)
-- Routes that run in BOTH peak periods (all-day routes)
SELECT route_id, 'Both peaks' AS coverage FROM morning_routes
INTERSECT
SELECT route_id, 'Both peaks' FROM evening_routes

UNION ALL

-- Morning-only routes
SELECT route_id, 'Morning only' AS coverage FROM morning_routes
EXCEPT
SELECT route_id, 'Morning only' FROM evening_routes;
~~~`,
      },
      {
        title: 'Combining Set Operations with Aggregation',
        content: `Set operations become most useful in practice when combined with aggregation — you union the data, then aggregate it, or you aggregate first and then union the summaries. This section shows the professional patterns.

**Pattern 1: Union-then-aggregate** — stack rows from multiple sources, then summarize:

~~~sql
-- Panda Express: compare performance across all regions in one report
-- First, create a unified view of all transactions with region labels
WITH all_transactions AS (
    SELECT revenue, items_sold, 'North' AS region FROM north_transactions
    UNION ALL
    SELECT revenue, items_sold, 'South' AS region FROM south_transactions
    UNION ALL
    SELECT revenue, items_sold, 'West'  AS region FROM west_transactions
),
-- Then aggregate the combined data
regional_summary AS (
    SELECT
        region,
        COUNT(*)                          AS total_transactions,
        SUM(revenue)                      AS total_revenue,
        ROUND(AVG(revenue), 2)            AS avg_order_value,
        ROUND(AVG(items_sold), 1)         AS avg_items_per_order
    FROM all_transactions
    GROUP BY region
),
-- Add a grand total row using UNION ALL
with_total AS (
    SELECT region, total_transactions, total_revenue, avg_order_value, avg_items_per_order
    FROM regional_summary
    UNION ALL
    SELECT 'TOTAL' AS region,
        SUM(total_transactions),
        SUM(total_revenue),
        ROUND(SUM(total_revenue) / SUM(total_transactions), 2),
        NULL
    FROM regional_summary
)
SELECT * FROM with_total
ORDER BY CASE WHEN region = 'TOTAL' THEN 1 ELSE 0 END, total_revenue DESC;
~~~

**Pattern 2: Aggregate-then-union** — compute separate summaries then stack them for a multi-section report:

~~~sql
-- Weekly report: top items by revenue AND top items by volume in one query
WITH by_revenue AS (
    SELECT
        item_name,
        SUM(revenue)   AS metric_value,
        'Top by Revenue' AS ranking_type
    FROM order_items
    GROUP BY item_name
    ORDER BY metric_value DESC
    LIMIT 5
),
by_volume AS (
    SELECT
        item_name,
        COUNT(*)       AS metric_value,
        'Top by Volume' AS ranking_type
    FROM order_items
    GROUP BY item_name
    ORDER BY metric_value DESC
    LIMIT 5
)
SELECT ranking_type, item_name, metric_value FROM by_revenue
UNION ALL
SELECT ranking_type, item_name, metric_value FROM by_volume
ORDER BY ranking_type, metric_value DESC;
~~~

**Pattern 3: Exception reports using EXCEPT + aggregation** — find stores that appeared in last month's top performers but dropped out this month:

~~~sql
WITH last_month_top AS (
    SELECT store_id
    FROM transactions
    WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', date('now', '-1 month'))
    GROUP BY store_id
    ORDER BY SUM(revenue) DESC
    LIMIT 10
),
this_month_top AS (
    SELECT store_id
    FROM transactions
    WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', date('now'))
    GROUP BY store_id
    ORDER BY SUM(revenue) DESC
    LIMIT 10
),
dropped_out AS (
    SELECT store_id FROM last_month_top
    EXCEPT
    SELECT store_id FROM this_month_top
)
SELECT
    d.store_id,
    s.store_name,
    SUM(CASE WHEN strftime('%Y-%m', t.sale_date) = strftime('%Y-%m', date('now', '-1 month'))
             THEN t.revenue END) AS last_month_rev,
    SUM(CASE WHEN strftime('%Y-%m', t.sale_date) = strftime('%Y-%m', date('now'))
             THEN t.revenue END) AS this_month_rev
FROM dropped_out d
JOIN stores s ON d.store_id = s.store_id
JOIN transactions t ON d.store_id = t.store_id
GROUP BY d.store_id, s.store_name
ORDER BY last_month_rev DESC;
~~~

This combines EXCEPT (to find the "dropped out" stores), CASE-based conditional aggregation (to get both months' revenue in one query), and a multi-table JOIN — demonstrating how all the SQL skills from Weeks 5-8 layer together in a real analytical report.`,
      },
    ],
    python: [
      {
        title: 'Python Sets and Data Wrangling — McKinney Chapter 8',
        content: `Python's built-in \`set\` type implements the same mathematical set operations as SQL's UNION, INTERSECT, and EXCEPT. Unlike SQL, Python sets work on pure collections of values — they don't carry column context — but they're fast and useful for membership testing and key comparisons.

**Basic set operations:**

~~~python
east_top  = {101, 102, 103, 104, 105, 106, 107, 108, 109, 110}
west_top  = {104, 105, 106, 107, 108, 111, 112, 113, 114, 115}

# Set operators
east_top | west_top    # UNION — everything in either set: {101..115}
east_top & west_top    # INTERSECT — only in both: {104, 105, 106, 107, 108}
east_top - west_top    # EXCEPT — in east but not west: {101, 102, 103, 109, 110}
west_top - east_top    # EXCEPT reversed — in west but not east: {111..115}
east_top ^ west_top    # SYMMETRIC DIFFERENCE — in one but not both

# Method equivalents (same results)
east_top.union(west_top)
east_top.intersection(west_top)
east_top.difference(west_top)
~~~

**Applying set operations to DataFrame columns:**

~~~python
import pandas as pd

east_ids = set(east_df['item_id'])
west_ids = set(west_df['item_id'])

universal_items = east_ids & west_ids          # appear in both regions
east_exclusive  = east_ids - west_ids          # east only
west_exclusive  = west_ids - east_ids          # west only

# Use isin() to filter a DataFrame to items in a set
universal_df = menu_df[menu_df['item_id'].isin(universal_items)]
east_only_df  = menu_df[menu_df['item_id'].isin(east_exclusive)]

print(f"Universal items (both regions): {len(universal_items)}")
print(f"East-only items: {len(east_exclusive)}")
print(universal_df[['item_id', 'item_name']])
~~~

**pd.concat()** — the pandas equivalent of SQL's UNION ALL. Stacks DataFrames vertically:

~~~python
# Stack multiple regional DataFrames into one (SQL's UNION ALL)
all_regions = pd.concat([north_df, south_df, west_df], ignore_index=True)

# Add a label column before concatenating (equivalent to adding a literal string in SQL)
north_df['region'] = 'North'
south_df['region'] = 'South'
west_df['region']  = 'West'
all_regions = pd.concat([north_df, south_df, west_df], ignore_index=True)

# UNION (deduplicated) — concat + drop_duplicates
union_deduped = pd.concat([east_df, west_df]).drop_duplicates(subset=['item_id'])
~~~

**Membership testing with sets is much faster than lists** — important for large DataFrames:

~~~python
# Slow — checking membership in a list is O(n)
top_items_list = [101, 102, 103, 104, 105]
df[df['item_id'].isin(top_items_list)]   # still fast because isin() handles this

# For Python-level membership tests in loops or apply(), use a set
top_items_set = {101, 102, 103, 104, 105}
101 in top_items_set    # O(1) — instant regardless of set size
101 in top_items_list   # O(n) — slower for large collections
~~~`,
      },
      {
        title: 'pivot_table and melt — Reshaping DataFrames',
        content: `McKinney dedicates significant space in Chapter 10 to data reshaping: converting between **wide format** (one row per entity, many columns) and **long format** (one row per observation). These two formats serve different purposes: long format is better for analysis and groupby operations; wide format is better for display and comparison.

**\`pivot_table()\`** — converts long format to wide format while aggregating. McKinney: "Pivot tables are a way to aggregate and reshape data simultaneously":

~~~python
import pandas as pd

# Long format: one row per (store, month, category) combination
sales = pd.DataFrame({
    'store':    ['SLC', 'SLC', 'SLC', 'Provo', 'Provo', 'Provo'],
    'month':    ['Jan', 'Feb', 'Mar', 'Jan', 'Feb', 'Mar'],
    'category': ['Entrees', 'Entrees', 'Entrees', 'Entrees', 'Entrees', 'Entrees'],
    'revenue':  [12000, 13500, 11800, 9200, 9800, 10100],
})

# Wide format: months become columns
pivot = sales.pivot_table(
    values   = 'revenue',       # what to aggregate
    index    = 'store',         # becomes the row labels
    columns  = 'month',         # unique values become column headers
    aggfunc  = 'sum',           # how to aggregate (sum, mean, count, etc.)
    fill_value = 0              # replace NaN with 0 where no data exists
)
print(pivot)
~~~

**Multiple values and multiple aggfuncs:**

~~~python
# Panda Express: pivot with both sum and mean, two metrics
pivot2 = df.pivot_table(
    values  = ['revenue', 'items_sold'],
    index   = 'store_id',
    columns = 'category',
    aggfunc = {'revenue': 'sum', 'items_sold': 'mean'},
    fill_value = 0
)
# Result has a MultiIndex on columns: (revenue, Entrees), (revenue, Sides), (items_sold, Entrees)...
pivot2.columns = ['_'.join(col).strip() for col in pivot2.columns]  # flatten MultiIndex
print(pivot2.head())
~~~

**Adding margins (totals row/column):**

~~~python
pivot_with_totals = df.pivot_table(
    values   = 'revenue',
    index    = 'region',
    columns  = 'category',
    aggfunc  = 'sum',
    fill_value = 0,
    margins  = True,        # adds "All" row and column with totals
    margins_name = 'Total'
)
print(pivot_with_totals)
~~~

**\`pd.melt()\`** — the reverse of pivot: converts wide format back to long format. McKinney: "The inverse operation of pivoting is called melting or unpivoting":

~~~python
# Wide format (what pivot_table produces)
wide = pd.DataFrame({
    'store':    ['SLC', 'Provo', 'Ogden'],
    'Jan_rev':  [12000, 9200, 7800],
    'Feb_rev':  [13500, 9800, 8100],
    'Mar_rev':  [11800, 10100, 7900],
})

# Melt to long format
long = pd.melt(
    wide,
    id_vars    = ['store'],              # columns to keep as-is (the identifier)
    value_vars = ['Jan_rev', 'Feb_rev', 'Mar_rev'],  # columns to unpivot
    var_name   = 'month',               # name for the new "variable" column
    value_name = 'revenue'              # name for the new "value" column
)
print(long)
# Result: store | month   | revenue
#         SLC   | Jan_rev | 12000
#         SLC   | Feb_rev | 13500
#         ...
~~~

**stack() and unstack()** — McKinney's lower-level reshaping tools that operate on MultiIndex DataFrames:

~~~python
# stack() moves columns into the index (wide → long)
# unstack() moves index levels into columns (long → wide)

# Example: a grouped result with MultiIndex
grouped = df.groupby(['region', 'category'])['revenue'].sum()
print(grouped)          # MultiIndex Series: (region, category) → revenue

wide = grouped.unstack(level='category')   # category becomes column headers
print(wide)             # DataFrame: region as index, category as columns

long_again = wide.stack()   # back to long format
print(long_again)
~~~

**When to use which:**
- \`pivot_table()\` — when you want to aggregate AND reshape in one step. Most common for report building.
- \`melt()\` — when you need to go from a wide spreadsheet format to long format for analysis.
- \`stack()\`/\`unstack()\` — when working with MultiIndex structures from groupby.

A common real-world workflow: receive data in wide format from a report (one column per month), \`melt()\` it to long format, analyze with \`groupby()\`, then \`pivot_table()\` the final result for presentation.`,
      },
    ],
  },

  // ─── WEEK 9 ──────────────────────────────────────────────────────────────────
  {
    week: 9,
    sql: [
      {
        title: 'Views and Pipeline Query Design',
        content: `A view is a saved SELECT query stored in the database under a name. Query it exactly like a table — but the underlying SELECT re-executes fresh every time you hit it. Views don't store data; they store logic.

~~~sql
CREATE VIEW monthly_store_revenue AS
SELECT
    strftime('%Y-%m', sale_date) AS month,
    store_id,
    SUM(revenue)                 AS total_revenue,
    COUNT(*)                     AS transaction_count,
    ROUND(SUM(revenue) / COUNT(*), 2) AS avg_order_value
FROM transactions
GROUP BY month, store_id;

-- Query it like any table
SELECT *
FROM monthly_store_revenue
WHERE month >= '2024-01'
ORDER BY month, total_revenue DESC;
~~~

The main benefit is **consistency**. Every analyst and every dashboard that queries \`monthly_store_revenue\` uses the same definition of "monthly revenue." Without the view, different people write slightly different GROUP BY queries and end up with different numbers.

**Replacing and dropping views** — you cannot ALTER a view's definition in SQLite. To change it, drop and recreate:

~~~sql
DROP VIEW IF EXISTS monthly_store_revenue;

CREATE VIEW monthly_store_revenue AS
SELECT
    strftime('%Y-%m', sale_date) AS month,
    store_id,
    SUM(revenue)                 AS total_revenue,
    COUNT(*)                     AS transaction_count,
    ROUND(SUM(revenue) / COUNT(*), 2) AS avg_order_value,
    MAX(revenue)                 AS largest_order    -- new column added
FROM transactions
GROUP BY month, store_id;
~~~

\`DROP VIEW IF EXISTS\` is the safe pattern — it won't error if the view doesn't exist yet. Use this at the top of any script that rebuilds a view.

**View limitations** — views are read-only in most contexts. You cannot INSERT or UPDATE through a view in SQLite (some databases support "updatable views" under strict conditions, but SQLite does not). Views also carry a small performance cost on complex queries because the database re-runs the full SELECT every time — they don't cache results.

**When views hurt performance** — if your view aggregates millions of rows and you query it thousands of times per day, you're re-aggregating millions of rows every single time. In that situation, use a **materialized table** instead: run the aggregation once on a schedule and write the results into a real table with \`CREATE TABLE AS SELECT ...\`. This is the pattern used in data warehouses.

**View vs CTE vs Temp Table** — knowing which to reach for:

- **View**: when multiple queries or multiple people need the same reusable logic. Permanent, database-level, no expiration.
- **CTE** (\`WITH\` clause): when you need intermediate steps inside a single complex query. Lives only for the duration of that one query. Best for step-by-step breakdowns.
- **Temp Table** (\`CREATE TEMP TABLE\`): when you need to run an expensive computation once and then query the results multiple times within a session. Persists for the duration of your database connection, then disappears.

~~~sql
-- Temp table: compute the expensive aggregation once, query it many ways
CREATE TEMP TABLE store_month_stats AS
SELECT
    store_id,
    strftime('%Y-%m', sale_date) AS month,
    SUM(revenue)                 AS revenue,
    COUNT(*)                     AS orders
FROM transactions
WHERE sale_date >= date('now', '-365 days')
GROUP BY store_id, month;

-- Now query the temp table multiple times cheaply
SELECT * FROM store_month_stats WHERE revenue > 50000;
SELECT store_id, AVG(revenue) FROM store_month_stats GROUP BY store_id;
~~~

**Naming conventions** — treat query objects like you treat Python functions: name them for what they represent, not how they're built. Use prefixes to signal the type:

- \`v_monthly_store_revenue\` — prefix \`v_\` for views
- \`tmp_store_month_stats\` — prefix \`tmp_\` for temp tables
- \`cte_raw_data\`, \`cte_enriched\` — prefix \`cte_\` for CTE names inside a query

Add a comment block at the top of any view or script explaining its purpose, inputs, and any assumptions:

~~~sql
-- =============================================================================
-- View: v_route_otp_30d
-- Purpose: On-time performance by route over the rolling 30-day window.
-- On-time definition: departed within 5 minutes of scheduled departure.
-- Refreshes: real-time (no caching). Use tmp_route_otp for batch reports.
-- Author: Justin Becerra | Last updated: 2024-01
-- =============================================================================
CREATE VIEW v_route_otp_30d AS
SELECT
    route_id,
    COUNT(*)                                                AS total_trips,
    SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)   AS on_time_trips,
    ROUND(100.0 *
        SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)
        / COUNT(*), 1)                                      AS otp_pct
FROM trip_logs
WHERE trip_date >= date('now', '-30 days')
GROUP BY route_id;
~~~

Good documentation is what separates a solo script you throw away from a query asset your team can maintain.`,
      },
      {
        title: 'Designing for Maintainability',
        content: `Iliev's book consistently uses clear formatting and meaningful aliases. This section elevates that from style preference to a professional discipline: every query you write should be legible to someone who has never seen it before — including you, six months later.

**The query header block** — treat complex SQL like source code. Add a comment block at the top:

~~~sql
-- ============================================================
-- Report: Panda Express Weekly Store Performance Summary
-- Description: Revenue, orders, and AOV by store for the last
--              complete 7-day period. Excludes voided transactions.
-- Schedule: Run every Monday at 06:00 AM.
-- Tables: transactions, stores
-- Author: Justin Becerra
-- ============================================================
WITH report_window AS (
    -- Define the window once here so it's easy to change
    SELECT
        date('now', 'weekday 0', '-14 days') AS start_date,
        date('now', 'weekday 0', '-7 days')  AS end_date
),
filtered_txns AS (
    SELECT
        t.store_id,
        t.revenue,
        t.transaction_id,
        t.sale_date
    FROM transactions t
    CROSS JOIN report_window w          -- bring in the window dates
    WHERE t.sale_date >= w.start_date
      AND t.sale_date <  w.end_date
      AND t.is_voided  = 0             -- exclude voided transactions
),
store_summary AS (
    SELECT
        store_id,
        SUM(revenue)                       AS total_revenue,
        COUNT(*)                           AS order_count,
        ROUND(SUM(revenue) / COUNT(*), 2)  AS avg_order_value
    FROM filtered_txns
    GROUP BY store_id
)
SELECT
    s.store_name,
    s.region,
    ss.total_revenue,
    ss.order_count,
    ss.avg_order_value
FROM store_summary ss
JOIN stores s ON ss.store_id = s.store_id
ORDER BY ss.total_revenue DESC;
~~~

Notice how \`report_window\` CTE holds the date range as a single named object. When the business decides to change from 7-day to 14-day windows, you change one place. That's maintainability.

**Naming conventions for columns and aliases:**

~~~sql
-- BAD: ambiguous, abbreviated, unclear
SELECT a.nm, b.tot, c.rv, d.dt
FROM cust a, ord b, txn c, sto d
WHERE a.id = b.cid AND b.id = c.oid;

-- GOOD: self-documenting — you know what this does without a schema
SELECT
    c.customer_name,
    o.order_id,
    t.revenue          AS transaction_revenue,
    s.store_name
FROM customers    c
JOIN orders       o ON c.customer_id = o.customer_id
JOIN transactions t ON o.order_id    = t.order_id
JOIN stores       s ON t.store_id    = s.store_id;
~~~

Rules that experienced SQL writers follow:
1. One clause per line (\`SELECT\`, \`FROM\`, \`WHERE\`, \`GROUP BY\`, \`HAVING\`, \`ORDER BY\`)
2. Always alias aggregated columns with \`AS\` — \`SUM(revenue) AS total_revenue\`, never \`SUM(revenue)\` alone
3. Never use \`ORDER BY 3\` — always use the column name. Column positions change when queries are edited
4. Use table aliases consistently — pick one letter or short prefix per table and use it everywhere
5. Align the \`ON\` clauses in JOINs so keys are easy to scan visually

**Self-documenting WHERE clauses** — a named constant is clearer than a magic number:

~~~sql
-- Confusing: what does 5 mean? What does 80 mean?
WHERE delay_minutes > 5 AND otp_pct < 80

-- Better: add inline comments to explain business logic
WHERE delay_minutes > 5           -- "late" = more than 5 min past schedule
  AND otp_pct < 80                -- below SunTran's 80% OTP target threshold
~~~

The goal is a query that reads like a specification — not just a set of instructions to the database, but a record of what the business rule is and why the query is written the way it is.`,
      },
    ],
    python: [
      {
        title: 'The Full pandas Pipeline — McKinney Integration',
        content: `McKinney's book is structured around this workflow: load data from a source, clean and validate it, transform it, analyze it. The \`pd.read_sql()\` function is the bridge between SQL and pandas — it runs a SQL query and immediately returns a DataFrame.

**The Extract step** — pull from SQLite using a parameterized query:

~~~python
import pandas as pd
import sqlite3

conn = sqlite3.connect('/dataset.db')

# Use a real SQL query for the heavy lifting — filtering and joining in the DB
# is faster than pulling everything into Python and filtering there
df = pd.read_sql("""
    SELECT
        t.transaction_id,
        t.sale_date,
        t.revenue,
        t.quantity,
        t.store_id,
        s.store_name,
        s.region,
        m.item_name,
        m.category
    FROM transactions t
    JOIN stores    s ON t.store_id = s.store_id
    JOIN menu_items m ON t.item_id = m.item_id
    WHERE t.sale_date >= date('now', '-90 days')
      AND t.is_voided = 0
""", conn)

conn.close()
print(f"Extracted {len(df):,} rows with {df.shape[1]} columns")
print(df.dtypes)   # always check dtypes immediately after loading
~~~

**The Transform step** — McKinney's data cleaning and enrichment patterns:

~~~python
# 1. Parse dates — always needed because SQL returns dates as strings
df['sale_date'] = pd.to_datetime(df['sale_date'])

# 2. Derive new columns from existing ones
df['month']       = df['sale_date'].dt.to_period('M').astype(str)   # '2024-01'
df['day_of_week'] = df['sale_date'].dt.day_name()                    # 'Monday'
df['is_weekend']  = df['sale_date'].dt.dayofweek >= 5               # True/False

# 3. Compute unit price, guarding against divide-by-zero (McKinney's replace pattern)
df['unit_price'] = df['revenue'] / df['quantity'].replace(0, pd.NA)

# 4. Standardize string columns — inconsistent casing is a common data quality issue
df['category']   = df['category'].str.strip().str.title()
df['region']     = df['region'].str.strip().str.upper()

# 5. Handle missing values — drop rows where the core measure is null
print(f"Null revenue rows: {df['revenue'].isna().sum()}")
df = df.dropna(subset=['revenue'])

# 6. Remove clear outliers (negative revenue = data entry error)
df = df[df['revenue'] > 0]

print(f"Clean dataset: {len(df):,} rows")
~~~

**The Aggregate step** — McKinney's named aggregation syntax:

~~~python
# Aggregate to store-month level
summary = df.groupby(['store_name', 'region', 'month']).agg(
    total_revenue = ('revenue',        'sum'),
    order_count   = ('transaction_id', 'count'),
    avg_order     = ('revenue',        'mean'),
    unique_items  = ('item_name',      'nunique')
).reset_index()

# Add derived metrics after aggregation
summary['avg_order']     = summary['avg_order'].round(2)
summary['revenue_share'] = (
    summary['total_revenue'] / summary['total_revenue'].sum() * 100
).round(1)

# Sort and preview
print(summary.sort_values('total_revenue', ascending=False).head(10))
~~~

**The Load step** — writing results to a file or back to the database:

~~~python
# Write to CSV for stakeholders
output_path = f"store_summary_{pd.Timestamp.now().strftime('%Y%m%d')}.csv"
summary.to_csv(output_path, index=False)
print(f"Saved {len(summary):,} rows to {output_path}")

# Or write back to SQLite for use in downstream queries
conn = sqlite3.connect('/dataset.db')
summary.to_sql('store_monthly_summary', conn, if_exists='replace', index=False)
conn.close()
print("Written to store_monthly_summary table")
~~~

McKinney's guidance is to use SQL for filtering, joining, and initial aggregation — operations the database engine is optimized for. Use pandas for reshaping, string operations, derived columns, and anything involving Python logic. The extract query should be specific: don't pull \`SELECT *\` and filter in Python if you can filter in the WHERE clause.`,
      },
      {
        title: 'The SQL vs Python Decision Framework',
        content: `One of the most practical skills you develop as a data analyst is knowing when to do work in SQL versus Python. Sweigart's automation mindset — "is there a way to make this easier, faster, or repeatable?" — applies here. The question isn't which tool you prefer; it's which tool is better suited for the specific task.

**Do it in SQL when:**

~~~sql
-- 1. FILTERING LARGE DATASETS — always filter in the DB, not in Python
--    Bad pattern: pull 10M rows into Python, then df[df['date'] > '2024-01']
--    Good: filter in WHERE so only relevant rows cross the network/disk boundary

SELECT * FROM transactions
WHERE sale_date >= date('now', '-30 days')
  AND store_id IN (101, 102, 103);

-- 2. JOINS — SQL engines are highly optimized for join operations
--    Joining in pandas works, but for tables with millions of rows,
--    the database does it faster and with less memory

SELECT t.*, s.store_name, s.region
FROM transactions t
JOIN stores s ON t.store_id = s.store_id;

-- 3. INITIAL AGGREGATION — GROUP BY in SQL reduces the data volume
--    before Python ever sees it. Sum 10M rows to 100 monthly totals in SQL;
--    pandas then only processes 100 rows

SELECT strftime('%Y-%m', sale_date) AS month,
       store_id, SUM(revenue) AS revenue
FROM transactions
GROUP BY month, store_id;
~~~

**Do it in Python (pandas) when:**

~~~python
import pandas as pd

# 1. RESHAPING — pivot_table, melt, stack/unstack
#    SQL can pivot but it's awkward and requires knowing column values in advance
pivot = df.pivot_table(
    values='revenue', index='store_id', columns='month', aggfunc='sum'
)

# 2. STRING CLEANING — regex, strip, title case, fuzzy matching
#    SQLite's string functions are limited; Python's are rich
df['category'] = df['category'].str.strip().str.title()
df['normalized'] = df['store_name'].str.replace(r'\\s+', ' ', regex=True)

# 3. STATISTICAL ANALYSIS — percentiles, IQR, rolling windows
#    Python has scipy, numpy, and pandas statistical methods
Q1  = df['revenue'].quantile(0.25)
Q3  = df['revenue'].quantile(0.75)
IQR = Q3 - Q1

# 4. ITERATIVE LOGIC — anything with branching, loops, or state
#    SQL is set-based; Python handles sequential, conditional logic naturally
for store_id, group in df.groupby('store_id'):
    if group['revenue'].sum() > 100_000:
        send_alert(store_id, group['revenue'].sum())

# 5. OUTPUT FORMATTING — CSV, Excel, charts, email reports
df.to_csv('report.csv', index=False)
df.to_excel('report.xlsx', sheet_name='Summary', index=False)
~~~

**The hybrid pattern** — this is what professionals actually do:

~~~python
import sqlite3
import pandas as pd

conn = sqlite3.connect('/dataset.db')

# SQL does the heavy lifting: filter, join, initial aggregate
df = pd.read_sql("""
    SELECT
        s.store_name, s.region,
        strftime('%Y-%m', t.sale_date) AS month,
        SUM(t.revenue)   AS revenue,
        COUNT(*)         AS orders
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
    WHERE t.sale_date >= date('now', '-365 days')
    GROUP BY s.store_name, s.region, month
""", conn)
conn.close()

# Python does the reshaping and analysis: pivot by month, compute YoY
monthly_pivot = df.pivot_table(
    values='revenue', index=['store_name', 'region'],
    columns='month', aggfunc='sum', fill_value=0
)
monthly_pivot['total_ytd'] = monthly_pivot.sum(axis=1)
monthly_pivot = monthly_pivot.sort_values('total_ytd', ascending=False)
print(monthly_pivot.head(10))
~~~

Sweigart's automation mindset says: automate the part that keeps being done manually. In data pipelines, the extract query is usually stable (SQL), but the output format and business logic change frequently (Python). Keep them in separate functions so you can update one without touching the other.`,
      },
    ],
  },

  // ─── WEEK 10 ─────────────────────────────────────────────────────────────────
  {
    week: 10,
    sql: [
      {
        title: 'INSERT, UPDATE, DELETE — DML with Transactions',
        content: `Iliev covers data modification statements (DML — Data Manipulation Language) as a core SQL topic. These are less frequent in analysis work than SELECT, but essential to understand for loading data, correcting records, and building ETL pipelines.

**INSERT** — add new rows to a table:

~~~sql
-- Single row insert
INSERT INTO menu_items (item_name, category, price, calories)
VALUES ('Honey Walnut Shrimp', 'Entrees', 8.99, 370);

-- Multi-row insert (more efficient than repeated single inserts)
INSERT INTO menu_items (item_name, category, price, calories)
VALUES
    ('Mushroom Chicken',   'Entrees', 7.49, 220),
    ('Broccoli Beef',      'Entrees', 7.49, 150),
    ('Chow Mein',          'Sides',   4.40, 510);

-- Insert from a SELECT — copy rows from one table into another
INSERT INTO menu_archive (item_name, category, price, archived_date)
SELECT item_name, category, price, date('now')
FROM menu_items
WHERE discontinued = 1;
~~~

**UPDATE** — Iliev's warning is clear: "If we don't specify a WHERE clause, all of the entries from the table will be affected." Always test your WHERE clause with a SELECT before running UPDATE:

~~~sql
-- Test first: which rows will this affect?
SELECT item_name, price FROM menu_items WHERE item_name = 'Orange Chicken';

-- Then update
UPDATE menu_items
SET price = 7.49
WHERE item_name = 'Orange Chicken';

-- Multi-column update
UPDATE menu_items
SET price       = 8.99,
    calories    = 490,
    last_updated = date('now')
WHERE item_id = 42;
~~~

**DELETE** — Iliev: "The DELETE statement would remove data from your database." Same rule: DELETE without WHERE removes every row.

~~~sql
-- Delete specific rows
DELETE FROM menu_items WHERE item_id = 12;

-- Delete with a subquery — remove all items from categories that have no orders
DELETE FROM menu_items
WHERE category IN (
    SELECT category FROM menu_items
    EXCEPT
    SELECT DISTINCT category FROM order_items
);
~~~

**Transactions — BEGIN / COMMIT / ROLLBACK** — the safety net for any DML that modifies multiple rows or multiple tables. Iliev covers transactions as essential for data integrity:

~~~sql
-- Wrap modifications in a transaction so you can undo if something goes wrong
BEGIN TRANSACTION;

    UPDATE menu_items SET price = 8.99 WHERE item_id = 42;
    UPDATE menu_items SET price = 7.49 WHERE item_id = 43;
    INSERT INTO price_change_log (item_id, old_price, new_price, changed_date)
    VALUES (42, 7.49, 8.99, date('now')),
           (43, 8.99, 7.49, date('now'));

-- If everything looks right:
COMMIT;

-- Or if something is wrong — undo all changes since BEGIN:
-- ROLLBACK;
~~~

Without a transaction, if the INSERT into the log table fails after the UPDATEs succeed, your prices are updated but the log has no record. The transaction ensures all-or-nothing: either every statement commits, or none of them do.

**Upsert with INSERT OR REPLACE** — a SQLite-specific shortcut that inserts a row if the primary key doesn't exist, or replaces the existing row if it does. Useful for ETL loads where you don't know if a row is new or updated:

~~~sql
-- If a row with this item_id already exists, replace it entirely.
-- If not, insert it as new.
INSERT OR REPLACE INTO menu_items (item_id, item_name, category, price, calories)
VALUES (42, 'Orange Chicken', 'Entrees', 8.99, 490);
~~~

**DELETE vs TRUNCATE** — SQLite does not have a TRUNCATE command. To remove all rows from a table quickly, use \`DELETE FROM table_name\` (no WHERE clause). In other databases like PostgreSQL, \`TRUNCATE\` is faster because it skips row-by-row logging — but in SQLite, \`DELETE\` without a WHERE and wrapped in a transaction is the standard pattern.`,
      },
      {
        title: 'Data Quality Checks Before Writing',
        content: `Before you INSERT or UPDATE production data, run validation queries to confirm the source data meets your expectations. This is the "check before you write" discipline that separates safe ETL from risky ETL.

**Row count check** — confirm the source has the expected volume:

~~~sql
-- How many rows are you about to load?
SELECT COUNT(*) AS row_count FROM staging_transactions;

-- Compare to what's already in the target
SELECT COUNT(*) AS existing_rows FROM transactions;

-- If staging has far fewer rows than expected, something went wrong upstream
-- Don't load until you understand why
~~~

**Duplicate check** — duplicates in a load will either violate a PRIMARY KEY constraint (and crash) or silently inflate your metrics (and be wrong):

~~~sql
-- Find duplicate transaction_ids in the staging table
SELECT transaction_id, COUNT(*) AS occurrences
FROM staging_transactions
GROUP BY transaction_id
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- If this returns any rows, deduplicate before loading
-- You can use a CTE to keep only the first occurrence of each duplicate
WITH deduped AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY created_at DESC) AS rn
    FROM staging_transactions
)
INSERT INTO transactions
SELECT transaction_id, sale_date, store_id, revenue, quantity
FROM deduped
WHERE rn = 1;
~~~

**NULL check on required columns** — your target table probably has NOT NULL constraints on key fields. Find NULLs before loading:

~~~sql
-- Which required fields have nulls in staging?
SELECT
    COUNT(*) AS total_rows,
    SUM(CASE WHEN transaction_id IS NULL THEN 1 ELSE 0 END) AS null_txn_id,
    SUM(CASE WHEN sale_date      IS NULL THEN 1 ELSE 0 END) AS null_date,
    SUM(CASE WHEN revenue        IS NULL THEN 1 ELSE 0 END) AS null_revenue,
    SUM(CASE WHEN store_id       IS NULL THEN 1 ELSE 0 END) AS null_store
FROM staging_transactions;

-- Goal: all four "null_" columns should be 0 before loading
~~~

**Range check** — verify that numeric values are in sensible ranges:

~~~sql
SELECT
    MIN(revenue)   AS min_rev,
    MAX(revenue)   AS max_rev,
    AVG(revenue)   AS avg_rev,
    SUM(CASE WHEN revenue < 0    THEN 1 ELSE 0 END) AS negative_rev,
    SUM(CASE WHEN revenue > 5000 THEN 1 ELSE 0 END) AS suspiciously_high
FROM staging_transactions;
~~~

**Referential integrity check** — before loading fact rows, confirm that all foreign keys exist in the dimension tables:

~~~sql
-- Are there store_ids in staging that don't exist in the stores table?
SELECT DISTINCT s.store_id
FROM staging_transactions s
LEFT JOIN stores st ON s.store_id = st.store_id
WHERE st.store_id IS NULL;

-- If this returns any rows, either the stores table is missing entries
-- or the staging data has bad store_ids
-- Either way — don't load until resolved
~~~

**The validation wrapper pattern** — put all checks in a single query that returns a pass/fail summary:

~~~sql
SELECT
    (SELECT COUNT(*) FROM staging_transactions)                              AS total_rows,
    (SELECT COUNT(*) FROM staging_transactions WHERE transaction_id IS NULL) AS null_ids,
    (SELECT COUNT(*) FROM staging_transactions WHERE revenue < 0)            AS negative_rev,
    (SELECT COUNT(*) FROM (
        SELECT transaction_id, COUNT(*) AS cnt FROM staging_transactions
        GROUP BY transaction_id HAVING cnt > 1
    ))                                                                       AS duplicate_ids;
-- All columns except total_rows should be 0 before proceeding
~~~

Run this validation query as the first step of any ETL script. If any check fails, log the problem and abort — don't load bad data and then spend two days debugging why the dashboard numbers are wrong.`,
      },
    ],
    python: [
      {
        title: 'Modular Script Design — Sweigart Principles',
        content: `Sweigart's Chapter 3 principle applied to data scripts: "A major purpose of functions is to group code that gets executed multiple times. Without a function defined, you would have to copy and paste this code each time."

This applies directly to ETL pipelines. A poorly structured script puts everything in sequence at the top level — every change is risky because you can't tell what touches what. A well-structured script groups related operations into named functions with clear responsibilities.

**The single-responsibility principle** — each function does exactly one thing:

~~~python
import sqlite3
import pandas as pd
from datetime import datetime
import time

DB_PATH = '/dataset.db'

def get_connection(path: str) -> sqlite3.Connection:
    """Open and return a database connection. Caller is responsible for closing."""
    return sqlite3.connect(path)

def fetch_daily_sales(conn: sqlite3.Connection, date_str: str) -> pd.DataFrame:
    """Pull all non-voided transactions for a given date. Returns DataFrame."""
    return pd.read_sql(
        """
        SELECT
            t.transaction_id,
            t.sale_date,
            t.store_id,
            t.revenue,
            t.quantity,
            m.category
        FROM transactions t
        JOIN menu_items m ON t.item_id = m.item_id
        WHERE t.sale_date = ?
          AND t.is_voided = 0
        """,
        conn,
        params=[date_str]
    )

def validate_sales(df: pd.DataFrame) -> bool:
    """Check that the loaded data passes basic sanity checks. Returns True if clean."""
    if df.empty:
        print("[WARN] No transactions found for this date")
        return False
    null_revenue = df['revenue'].isna().sum()
    if null_revenue > 0:
        print(f"[WARN] {null_revenue} rows with null revenue")
        return False
    negative_rev = (df['revenue'] < 0).sum()
    if negative_rev > 0:
        print(f"[WARN] {negative_rev} rows with negative revenue — check data")
        return False
    return True

def summarize_by_category(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate revenue and order count by category. Returns summary DataFrame."""
    return df.groupby('category').agg(
        revenue    = ('revenue',        'sum'),
        orders     = ('transaction_id', 'count'),
        avg_order  = ('revenue',        'mean')
    ).reset_index().round({'revenue': 2, 'avg_order': 2})

def save_report(df: pd.DataFrame, path: str) -> None:
    """Write DataFrame to CSV and print confirmation."""
    df.to_csv(path, index=False)
    print(f"  Saved {len(df):,} rows → {path}")

def run() -> None:
    """Main entry point — orchestrates extract, validate, transform, load."""
    today = datetime.now().strftime('%Y-%m-%d')
    t0    = time.time()
    print(f"Running report for {today}...")

    conn  = get_connection(DB_PATH)
    sales = fetch_daily_sales(conn, today)
    conn.close()

    print(f"  Loaded {len(sales):,} transactions ({time.time()-t0:.2f}s)")

    if not validate_sales(sales):
        print("[ABORT] Validation failed — report not generated")
        return

    summary = summarize_by_category(sales)
    report_path = f"daily_report_{today}.csv"
    save_report(summary, report_path)
    print(f"Done in {time.time()-t0:.2f}s total")

run()
~~~

Sweigart's insight: "The real value of a function is not just avoiding code duplication — it's giving a block of code a name, so you can reason about what the program does at a higher level." The \`run()\` function reads like an English description of the pipeline: fetch → validate → summarize → save.

**Type hints** — the \`conn: sqlite3.Connection\` and \`-> pd.DataFrame\` annotations are optional but serve as documentation. They tell the next reader exactly what goes in and comes out of each function, without having to trace through the implementation.

**Constants at the top** — \`DB_PATH = '/dataset.db'\` at module level means one place to change the database path. Never embed file paths or thresholds as magic strings inside functions.`,
      },
      {
        title: 'Error Handling, Retry Logic, and Logging',
        content: `Sweigart's Chapter 3 introduces \`try\`/\`except\` as the mechanism for handling runtime errors gracefully. A production script needs more than basic error handling — it needs retry logic for transient failures and logging so you know what happened after the fact.

**Basic try/except — Sweigart's pattern:**

~~~python
import sqlite3
import pandas as pd

def safe_query(db_path: str, query: str, params: list = None) -> pd.DataFrame | None:
    """
    Run a query, return a DataFrame, or None on failure.
    Lists specific exceptions most likely to occur — Sweigart's recommendation.
    """
    try:
        conn = sqlite3.connect(db_path)
        df   = pd.read_sql(query, conn, params=params or [])
        conn.close()
        return df

    except sqlite3.OperationalError as e:
        # Table doesn't exist, bad column name, locked database, etc.
        print(f"[ERROR] Database operational error: {e}")
        return None

    except sqlite3.DatabaseError as e:
        # Corrupt database, schema mismatch
        print(f"[ERROR] Database error: {e}")
        return None

    except FileNotFoundError:
        print(f"[ERROR] Database file not found: {db_path}")
        return None

    except Exception as e:
        # Catch-all for anything unexpected — always last
        print(f"[ERROR] Unexpected {type(e).__name__}: {e}")
        return None
~~~

Sweigart: never use a bare \`except:\` without an exception type — it catches \`KeyboardInterrupt\` and \`SystemExit\`, which are signals you almost always want to propagate.

**Retry logic** — some failures are transient (locked database, network hiccup). Retry logic gives the system time to recover:

~~~python
import time

def query_with_retry(db_path: str, query: str, max_attempts: int = 3,
                     delay_seconds: float = 2.0) -> pd.DataFrame | None:
    """
    Attempt a query up to max_attempts times with a delay between retries.
    Returns DataFrame on success, None if all attempts fail.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            conn = sqlite3.connect(db_path, timeout=10)
            df   = pd.read_sql(query, conn)
            conn.close()
            if attempt > 1:
                print(f"  Succeeded on attempt {attempt}")
            return df

        except sqlite3.OperationalError as e:
            if 'locked' in str(e).lower() and attempt < max_attempts:
                print(f"  [RETRY {attempt}/{max_attempts}] Database locked, waiting {delay_seconds}s...")
                time.sleep(delay_seconds)
            else:
                print(f"  [ERROR] Failed after {attempt} attempts: {e}")
                return None
~~~

**Structured logging** — \`print()\` is fine for development. For production scripts, Python's \`logging\` module writes timestamped messages that you can route to files, which is essential for debugging jobs that run overnight:

~~~python
import logging
from datetime import datetime

# Configure logging once at the top of the script
LOG_PATH = f"etl_{datetime.now().strftime('%Y%m%d')}.log"

logging.basicConfig(
    level    = logging.INFO,
    format   = '%(asctime)s [%(levelname)s] %(message)s',
    handlers = [
        logging.FileHandler(LOG_PATH),     # write to file
        logging.StreamHandler()            # also print to console
    ]
)
logger = logging.getLogger(__name__)

# Use logger instead of print
def run_etl():
    logger.info("ETL pipeline started")
    try:
        conn = sqlite3.connect('/dataset.db')
        df   = pd.read_sql("SELECT * FROM transactions LIMIT 100", conn)
        conn.close()
        logger.info(f"Extracted {len(df):,} rows")
        # ... transform and load
        logger.info("ETL pipeline completed successfully")

    except Exception as e:
        logger.error(f"ETL pipeline failed: {type(e).__name__}: {e}")
        raise   # re-raise so the caller (or scheduler) knows it failed

run_etl()
~~~

The log file output looks like:
\`2024-01-15 06:03:11 [INFO] ETL pipeline started\`
\`2024-01-15 06:03:12 [INFO] Extracted 48,392 rows\`
\`2024-01-15 06:03:14 [INFO] ETL pipeline completed successfully\`

When a job fails at 2am, the log file tells you exactly which step failed and why — without having to reproduce the failure interactively.`,
      },
    ],
  },

  // ─── WEEK 11 ─────────────────────────────────────────────────────────────────
  {
    week: 11,
    sql: [
      {
        title: 'EXPLAIN QUERY PLAN and Indexing Strategy',
        content: `Iliev covers indexes in the table design section: "As the volume of data grows, searching by attributes other than the primary key can become increasingly slow. To optimize such queries, you can introduce an INDEX on specific columns."

\`EXPLAIN QUERY PLAN\` shows you what the database engine actually does to run a query. Run it before any query you suspect is slow:

~~~sql
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE customer_id = 12345;
-- Output without index: SCAN TABLE transactions (~full table read)
-- Output with index:    SEARCH TABLE transactions USING INDEX idx_cust (~instant)
~~~

**What to look for in the output:**
- **SCAN TABLE** — reads every row from first to last. Fine for small tables; very slow on millions of rows.
- **SEARCH TABLE USING INDEX** — uses an index to jump directly to matching rows. Fast regardless of table size.
- **SEARCH TABLE USING INTEGER PRIMARY KEY** — SQLite's fastest lookup: finds a row by rowid in O(log n) time.

**Creating indexes:**

~~~sql
-- Single-column indexes on frequently filtered columns
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date     ON transactions(sale_date);
CREATE INDEX idx_trips_route           ON trip_logs(route_id);

-- Verify they're created
SELECT name, tbl_name FROM sqlite_master WHERE type = 'index';
~~~

**Composite (multi-column) indexes** — Iliev's guidance: "for queries filtering on multiple columns, use a composite index with the most selective column first." A composite index on \`(store_id, sale_date)\` covers queries that filter on store_id alone OR on both columns together, but NOT on sale_date alone:

~~~sql
CREATE INDEX idx_transactions_store_date ON transactions(store_id, sale_date);

-- This query USES the composite index (store_id is the leading column)
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE store_id = 101 AND sale_date >= '2024-01-01';

-- This also uses it (leading column only)
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE store_id = 101;

-- This does NOT use it efficiently (skips the leading column)
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE sale_date >= '2024-01-01';
-- → SCAN TABLE (needs its own index on sale_date)
~~~

**Covering indexes** — an index that contains all the columns a query needs is called "covering." SQLite can satisfy the query entirely from the index without touching the main table at all — even faster than a regular index lookup:

~~~sql
-- If you frequently run this query:
SELECT store_id, sale_date, revenue FROM transactions WHERE store_id = 101;

-- A covering index includes all three columns
CREATE INDEX idx_covering_store ON transactions(store_id, sale_date, revenue);
-- Now SQLite reads this index only — never touches the main table rows
~~~

**When NOT to index** — indexes are not free. Every INSERT, UPDATE, or DELETE on a table also updates every index on that table. The tradeoffs:

- **High-churn tables**: if a table receives thousands of inserts per minute, too many indexes slow down the writes. Prioritize the two or three most-queried columns.
- **Small tables**: a table with fewer than ~10,000 rows is fast to scan. An index adds overhead for little benefit.
- **Low-selectivity columns**: a column with only two distinct values (like a boolean \`is_active\`) is a poor index candidate — the index points to half the table regardless.
- **Never index without benchmarking**: run \`EXPLAIN QUERY PLAN\` before and after to confirm the index is actually being used.

**Practical index plan for the capstone schema:**

~~~sql
-- SunTran analytical query patterns demand these indexes
CREATE INDEX idx_trip_logs_date     ON trip_logs(trip_date);
CREATE INDEX idx_trip_logs_route    ON trip_logs(route_id);
CREATE INDEX idx_trip_logs_rt_date  ON trip_logs(route_id, trip_date);  -- composite
CREATE INDEX idx_routes_active      ON routes(is_active);               -- low-selectivity, may skip

-- After creating, verify each with EXPLAIN QUERY PLAN
EXPLAIN QUERY PLAN
SELECT route_id, COUNT(*), AVG(delay_minutes)
FROM trip_logs
WHERE trip_date >= date('now', '-30 days')
GROUP BY route_id;
~~~`,
      },
      {
        title: 'Query Optimization Patterns',
        content: `Knowing how to read \`EXPLAIN QUERY PLAN\` is step one. Step two is knowing the SQL patterns that cause slow queries — and their faster alternatives.

**Avoid SELECT *** — pulling every column is almost always wasteful. The database reads, transmits, and your application processes more data than you need:

~~~sql
-- SLOW and risky: pulls all 40 columns, including BLOBs and long text fields
SELECT * FROM transactions WHERE store_id = 101;

-- FAST and explicit: only the three columns this query actually needs
SELECT transaction_id, sale_date, revenue
FROM transactions
WHERE store_id = 101;
~~~

The explicit column list also documents intent — it tells the next reader exactly what this query cares about.

**EXISTS vs IN for subqueries** — \`EXISTS\` short-circuits as soon as it finds one match; \`IN\` evaluates the entire subquery first:

~~~sql
-- SLOWER: IN materializes all matching store_ids before the outer query runs
SELECT route_id, otp_pct
FROM route_stats
WHERE route_id IN (
    SELECT route_id FROM high_ridership_routes
    WHERE avg_daily_riders > 500
);

-- FASTER: EXISTS stops as soon as it confirms one match exists
SELECT rs.route_id, rs.otp_pct
FROM route_stats rs
WHERE EXISTS (
    SELECT 1
    FROM high_ridership_routes hr
    WHERE hr.route_id = rs.route_id
      AND hr.avg_daily_riders > 500
);
~~~

For small subquery results (\<1000 rows), the difference is negligible. For large subqueries, EXISTS can be dramatically faster.

**Avoid correlated subqueries in SELECT** — a correlated subquery re-runs for every row of the outer query. With 100,000 rows, that's 100,000 subquery executions:

~~~sql
-- VERY SLOW: the subquery runs once per row in routes
SELECT
    route_id,
    (SELECT COUNT(*) FROM trip_logs t WHERE t.route_id = r.route_id) AS trip_count
FROM routes r;

-- FAST: compute all counts once with a JOIN, then bring them to routes
SELECT
    r.route_id,
    COUNT(t.trip_id) AS trip_count
FROM routes r
LEFT JOIN trip_logs t ON r.route_id = t.route_id
GROUP BY r.route_id;
~~~

**Filter pushdown** — apply WHERE conditions as early as possible, before joins and aggregations see more rows than necessary:

~~~sql
-- INEFFICIENT: joins all transactions to all stores, THEN filters
SELECT s.store_name, SUM(t.revenue)
FROM transactions t
JOIN stores s ON t.store_id = s.store_id
WHERE s.region = 'North'       -- filter applied after the full join
GROUP BY s.store_name;

-- EFFICIENT: filter the stores table down to North first (CTE), then join
WITH north_stores AS (
    SELECT store_id, store_name FROM stores WHERE region = 'North'
)
SELECT ns.store_name, SUM(t.revenue)
FROM transactions t
JOIN north_stores ns ON t.store_id = ns.store_id
GROUP BY ns.store_name;
~~~

The optimizer often handles this automatically, but being explicit in your CTEs guarantees it.

**The HAVING trap** — HAVING filters after aggregation. Use WHERE to filter individual rows before they reach GROUP BY:

~~~sql
-- Slower: groups all categories including ones you'll throw away
SELECT category, SUM(revenue) AS total
FROM transactions
GROUP BY category
HAVING category != 'Voided';

-- Faster: removes 'Voided' rows before they participate in grouping at all
SELECT category, SUM(revenue) AS total
FROM transactions
WHERE category != 'Voided'    -- filter here, not in HAVING
GROUP BY category;
~~~

The rule: if the filter condition doesn't reference an aggregate function (SUM, COUNT, AVG), put it in WHERE, not HAVING. HAVING is for filtering on the result of an aggregation (e.g., \`HAVING SUM(revenue) > 10000\`).`,
      },
    ],
    python: [
      {
        title: 'Vectorization — McKinney\'s Core Principle',
        content: `McKinney's pandas book is built on one core idea stated in Chapter 5: "pandas adopts significant parts of NumPy's idiomatic style of array-based computing, especially array-based functions and a **preference for data processing without for loops**."

That last phrase is the key insight. Python loops are slow on large data because each iteration goes through the Python interpreter's overhead. Vectorized operations bypass the interpreter — they dispatch to compiled C or Fortran code that processes entire arrays at once.

**Benchmark: loop vs vectorized:**

~~~python
import numpy as np
import pandas as pd
import time

n = 1_000_000
prices = pd.Series(np.random.uniform(1, 20, n))

# SLOW — Python loop: processes one element at a time
t0    = time.time()
total = 0
for p in prices:
    total += p * 0.08
print(f"Loop: {time.time()-t0:.3f}s  →  total = {total:.2f}")

# FAST — vectorized: entire array in one C-level operation
t0    = time.time()
total = (prices * 0.08).sum()
print(f"Vectorized: {time.time()-t0:.3f}s  →  total = {total:.2f}")
# Typical output: Loop: 0.412s   Vectorized: 0.003s  (~137x faster)
~~~

**apply() is slow — vectorized operations are fast:**

~~~python
# SLOW: apply() calls a Python function for each row — defeats vectorization
df['tax']          = df['price'].apply(lambda x: x * 0.08)
df['discounted']   = df['price'].apply(lambda x: x * 0.90 if x > 10 else x)

# FAST: arithmetic on the whole column at once
df['tax']          = df['price'] * 0.08

# FAST: np.where() for conditional assignment (vectorized if/else)
import numpy as np
df['discounted']   = np.where(df['price'] > 10, df['price'] * 0.90, df['price'])

# FAST: pd.cut() for binning (instead of apply with if/elif chains)
df['price_tier']   = pd.cut(
    df['price'],
    bins   = [0, 5, 10, 15, float('inf')],
    labels = ['Budget', 'Standard', 'Premium', 'Luxury']
)
~~~

**String operations — use .str accessor, not apply():**

~~~python
# SLOW: apply with Python string methods
df['category'] = df['category'].apply(lambda x: x.strip().title())
df['has_chicken'] = df['item_name'].apply(lambda x: 'chicken' in x.lower())

# FAST: pandas .str accessor — vectorized string operations
df['category']    = df['category'].str.strip().str.title()
df['has_chicken'] = df['item_name'].str.lower().str.contains('chicken')
~~~

**Multiple column operations in one pass:**

~~~python
# Compute several derived columns without looping
df['gross_profit']   = df['revenue'] - df['cost']
df['margin_pct']     = (df['gross_profit'] / df['revenue'] * 100).round(1)
df['above_avg']      = df['revenue'] > df['revenue'].mean()
df['revenue_rank']   = df['revenue'].rank(ascending=False, method='dense').astype(int)

# All four lines run vectorized — the DataFrame is processed column by column
# using optimized NumPy operations
~~~

**When apply() is acceptable** — there are cases where there's no clean vectorized equivalent:

~~~python
# Complex multi-column logic with no np.where equivalent
# apply() with axis=1 processes each row — still slow, but sometimes necessary
def classify_trip(row):
    if row['delay_minutes'] > 15:
        return 'Very Late'
    elif row['delay_minutes'] > 5:
        return 'Late'
    elif row['delay_minutes'] < -2:
        return 'Early'
    else:
        return 'On Time'

# With apply (acceptable for complex logic that can't be vectorized)
df['status'] = df.apply(classify_trip, axis=1)

# Better: use np.select for multi-condition vectorized assignment
conditions = [
    df['delay_minutes'] > 15,
    df['delay_minutes'] > 5,
    df['delay_minutes'] < -2
]
choices = ['Very Late', 'Late', 'Early']
df['status'] = np.select(conditions, choices, default='On Time')
~~~

McKinney's rule of thumb: if you find yourself writing a for loop over DataFrame rows, or an \`apply()\` with a simple calculation, there is almost certainly a vectorized equivalent. The pandas and NumPy documentation are full of them.`,
      },
      {
        title: 'Profiling and Finding Bottlenecks',
        content: `Knowing that vectorization is faster is one thing. Knowing which part of your script is actually slow — and by how much — requires profiling. Sweigart's automation mindset applies here: measure before optimizing.

**time.time() — the simplest profiling tool:**

~~~python
import time

def time_step(label: str, start: float) -> float:
    """Print elapsed time since start, return current time for chaining."""
    elapsed = time.time() - start
    print(f"  [{label}] {elapsed:.3f}s")
    return time.time()

t0 = time.time()

# Step 1: Extract
conn = sqlite3.connect('/dataset.db')
df   = pd.read_sql("SELECT * FROM transactions", conn)
conn.close()
t0 = time_step("Extract", t0)

# Step 2: Clean
df['sale_date'] = pd.to_datetime(df['sale_date'])
df = df.dropna(subset=['revenue'])
t0 = time_step("Clean", t0)

# Step 3: Aggregate
summary = df.groupby(['store_id', 'month'])['revenue'].sum()
t0 = time_step("Aggregate", t0)

# Output example:
#   [Extract]   2.341s    ← the bottleneck — slow because pulling too many rows
#   [Clean]     0.082s
#   [Aggregate] 0.011s
~~~

When you see a step taking 10x longer than others, that's where to focus optimization.

**Chunking large datasets** — when a table is too large to fit comfortably in memory, read it in chunks:

~~~python
import pandas as pd
import sqlite3

conn       = sqlite3.connect('/dataset.db')
chunk_size = 50_000   # rows per chunk
results    = []

# Read in 50k-row chunks, summarize each chunk, then combine summaries
for chunk in pd.read_sql(
    "SELECT store_id, sale_date, revenue FROM transactions",
    conn,
    chunksize=chunk_size
):
    # Summarize the chunk while it's in memory
    chunk_summary = chunk.groupby('store_id')['revenue'].sum()
    results.append(chunk_summary)

conn.close()

# Combine all chunk summaries into a final result
final = pd.concat(results).groupby(level=0).sum()
print(final.sort_values(ascending=False).head(10))
~~~

This pattern processes 10 million rows using only 50,000 rows of memory at a time.

**cProfile — the built-in function-level profiler:**

~~~python
import cProfile
import pstats

# Profile the entire run() function
profiler = cProfile.Profile()
profiler.enable()

run()   # your pipeline function

profiler.disable()

# Print the top 10 slowest functions
stats = pstats.Stats(profiler).sort_stats('cumulative')
stats.print_stats(10)

# Typical output:
#    ncalls  tottime  cumtime  filename:function
#     1       0.001    2.341   run:extract()
#  48392      0.082    0.082   {method 'strip' of 'str'}
#     1       0.011    0.011   run:aggregate()
~~~

\`cumtime\` (cumulative time including all called subfunctions) is usually the most useful column. The function with the highest cumtime is your bottleneck.

**pandas memory profiling** — DataFrames can use surprising amounts of RAM:

~~~python
# Check how much memory each column uses
print(df.memory_usage(deep=True))

# Common optimization: downcast numeric types
# int64 uses 8 bytes per value; int32 uses 4; int16 uses 2
df['store_id']    = df['store_id'].astype('int16')    # if store_id < 32767
df['quantity']    = df['quantity'].astype('int8')     # if quantity < 127

# Convert low-cardinality strings to category type (massive memory savings)
print(f"Before: {df['category'].memory_usage(deep=True):,} bytes")
df['category'] = df['category'].astype('category')
print(f"After:  {df['category'].memory_usage(deep=True):,} bytes")
# A column with 5 unique values in 1M rows: ~8MB → ~40KB
~~~

Profiling discipline: measure first, then optimize. Guessing which part of the code is slow is almost always wrong.`,
      },
    ],
  },

  // ─── WEEK 12 ─────────────────────────────────────────────────────────────────
  {
    week: 12,
    sql: [
      {
        title: 'Query Readability and SQL Style Guide',
        content: `Iliev's book consistently formats queries for readability — each clause on its own line, consistent indentation, meaningful aliases. This isn't aesthetic preference; it's a maintenance discipline. Queries you write today will be read by your future self and your colleagues. Make their job easy.

**Before vs After — the transformation:**

~~~sql
-- BEFORE: how queries often look when written under time pressure
select a.name,b.total,sum(c.revenue) from customers a,orders b,transactions c where a.id=b.customer_id and b.id=c.order_id and c.date>'2024-01-01' group by a.name,b.total having sum(c.revenue)>100 order by 3 desc

-- AFTER: readable, maintainable, self-documenting
SELECT
    c.customer_name,
    o.order_id,
    SUM(t.revenue)  AS total_revenue
FROM customers    c
JOIN orders       o ON c.customer_id = o.customer_id
JOIN transactions t ON o.order_id    = t.order_id
WHERE t.sale_date > '2024-01-01'
GROUP BY c.customer_name, o.order_id
HAVING SUM(t.revenue) > 100
ORDER BY total_revenue DESC;
~~~

**The SQL style rules that experienced analysts follow:**

**1. One clause per line** — \`SELECT\`, \`FROM\`, \`WHERE\`, \`GROUP BY\`, \`HAVING\`, \`ORDER BY\`, \`LIMIT\` each get their own line. This makes it trivial to comment out one clause to debug.

**2. Align column lists** — indent the column list two to four spaces and align the \`AS\` keywords:

~~~sql
SELECT
    store_id,
    store_name,
    region,
    SUM(revenue)              AS total_revenue,
    COUNT(*)                  AS order_count,
    ROUND(AVG(revenue), 2)   AS avg_order_value
FROM transactions
~~~

**3. Meaningful table aliases** — use the first letter or a logical abbreviation of the table name, consistently:

~~~sql
-- Clear: c = customers, o = orders, t = transactions, s = stores
FROM customers    c
JOIN orders       o ON c.customer_id = o.customer_id
JOIN transactions t ON o.order_id    = t.order_id
JOIN stores       s ON t.store_id    = s.store_id

-- Confusing: meaningless single letters with no relationship to table names
FROM customers a, orders b, transactions c
~~~

**4. Always alias aggregates** — bare \`SUM(revenue)\` is harder to reference in downstream CTEs and harder for readers to understand:

~~~sql
-- BAD: unnamed aggregate
SELECT store_id, SUM(revenue), COUNT(*) FROM transactions GROUP BY store_id;

-- GOOD: every aggregate has a name
SELECT
    store_id,
    SUM(revenue)  AS total_revenue,
    COUNT(*)      AS order_count
FROM transactions
GROUP BY store_id;
~~~

**5. Never ORDER BY column position** — \`ORDER BY 3\` means "order by the third column." When someone adds a column or rearranges the SELECT list, the sort silently changes:

~~~sql
-- BAD: ORDER BY 3 means "sort by SUM(revenue)" today, but may mean something else tomorrow
SELECT store_id, region, SUM(revenue) FROM transactions GROUP BY store_id, region ORDER BY 3 DESC;

-- GOOD: always name the column you're sorting by
SELECT
    store_id,
    region,
    SUM(revenue)  AS total_revenue
FROM transactions
GROUP BY store_id, region
ORDER BY total_revenue DESC;
~~~

**6. Document business logic inline:**

~~~sql
SELECT
    route_id,
    -- "On time" = departed within 5 minutes of scheduled departure
    -- This threshold is defined in SunTran's service standard SOP-OPS-04
    SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)   AS on_time_trips,
    COUNT(*)                                               AS total_trips,
    ROUND(100.0 *
        SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)
        / COUNT(*), 1)                                     AS otp_pct
FROM trip_logs
WHERE trip_date >= date('now', '-30 days')
GROUP BY route_id
HAVING otp_pct < 80   -- alert threshold: routes below SunTran's 80% target
ORDER BY otp_pct ASC;
~~~

**Naming conventions for database objects:**

- Tables: lowercase, plural, snake_case — \`transactions\`, \`dim_stores\`, \`fact_sales\`
- Views: \`v_\` prefix — \`v_monthly_revenue\`, \`v_route_otp\`
- Indexes: \`idx_tablename_column\` — \`idx_transactions_store_date\`
- CTEs inside a query: \`snake_case\`, descriptive — \`raw_trips\`, \`route_summary\`, \`final_report\`

Consistent naming means you never wonder whether a view is called \`MonthlyRevenue\` or \`monthly_revenue_view\` or \`vw_monthly_rev\`.`,
      },
      {
        title: 'The Senior Engineer Review Checklist',
        content: `Before running any significant query in a production context — one that modifies data, feeds a dashboard, or gets sent to a stakeholder — experienced SQL practitioners run through a mental checklist. Here are the ten questions worth asking.

**1. Does the query have a WHERE clause, and is it correct?**

~~~sql
-- Without WHERE: deletes every row in the table
DELETE FROM transactions;

-- With WHERE: deletes only the intended rows
DELETE FROM transactions WHERE transaction_id = 98765 AND is_voided = 1;
~~~

**2. Are all JOINs producing the expected number of rows?**

~~~sql
-- Check: how many rows does the join produce vs. how many are in each source?
SELECT COUNT(*) FROM transactions;            -- 50,000
SELECT COUNT(*) FROM transactions t
JOIN stores s ON t.store_id = s.store_id;    -- Still 50,000? Good. More? You have duplicate store_ids.
~~~

**3. Is the aggregation at the right grain?**

~~~sql
-- What is one row in the result? Store-month? Store-day? Transaction?
-- If you're not sure, add LIMIT 10 and examine the output before removing it.
SELECT store_id, strftime('%Y-%m', sale_date) AS month, SUM(revenue)
FROM transactions
GROUP BY store_id, month
LIMIT 10;  -- remove LIMIT only after you've verified the grain is correct
~~~

**4. Are NULLs being handled intentionally?**

~~~sql
-- WHERE col != 'value' does NOT include rows where col IS NULL
-- If you want to exclude 'Voided' AND include NULLs, be explicit:
WHERE (category != 'Voided' OR category IS NULL)
~~~

**5. Does the date filter cover the intended window — and nothing more?**

~~~sql
-- Common off-by-one: "last month" vs "last 30 days" vs "the previous calendar month"
WHERE sale_date >= date('now', '-30 days')                              -- rolling 30 days
WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', date('now','-1 month'))  -- calendar month
-- These are NOT the same — know which one you need
~~~

**6. Could a DISTINCT be hiding a join problem?**

~~~sql
-- If you added DISTINCT to "fix" unexpected duplicates, understand WHY duplicates appeared
-- The root cause is usually a one-to-many JOIN that multiplies rows
-- Adding DISTINCT removes the symptom but not the cause
SELECT DISTINCT customer_id FROM orders o JOIN transactions t ON o.order_id = t.order_id;
-- Ask: why are there duplicate customer_ids? Is the join correct?
~~~

**7. Is the ORDER BY meaningful — not just decorative?**

~~~sql
-- ORDER BY without LIMIT is purely cosmetic — the database sorts for no reason
-- Only sort if you actually need the result in a specific order
-- If you need top-N, always pair ORDER BY with LIMIT
SELECT store_id, SUM(revenue) AS rev FROM transactions GROUP BY store_id
ORDER BY rev DESC LIMIT 10;  -- top 10 stores: ORDER BY is justified
~~~

**8. Has the query been tested on a small dataset first?**

~~~sql
-- Add a WHERE to limit scope while developing, remove it after verification
WHERE sale_date >= '2024-01-01' AND sale_date < '2024-01-08'  -- test on one week first
~~~

**9. Are the column aliases and CTE names self-explanatory?**

Review: if someone who doesn't know this codebase reads your query, do the names make the logic clear? If you have a CTE called \`x\` or a column called \`val\`, rename them.

**10. Does the query's result match a manual spot-check?**

~~~sql
-- Pick one specific store_id and month and calculate the expected result by hand (or with a simple query)
SELECT SUM(revenue) FROM transactions WHERE store_id = 101 AND strftime('%Y-%m', sale_date) = '2024-01';
-- Then verify that your complex query returns the same number for store 101, January 2024
-- If it doesn't match, your query has a bug
~~~

This checklist takes 60 seconds on a simple query and 5 minutes on a complex one. It has saved countless hours of debugging wrong numbers in production dashboards.`,
      },
    ],
    python: [
      {
        title: 'Code Review — Four Categories of Issues',
        content: `Sweigart's book teaches programming by showing you working code and explaining how it works. Code review is the inverse — reading existing code and identifying what's wrong before it reaches production. Four categories cover nearly every issue.

**1. Correctness bugs** — code that produces wrong results without crashing. These are the most dangerous because there's no error message:

~~~python
# Bug: divides by fixed 12 regardless of how many months have data
# If data only covers 9 months, this understates the average by 25%
average_monthly_revenue = sum(monthly_revenues) / 12

# Fix: divide by the actual number of data points
# pandas .mean() handles this automatically (ignores NaN)
average_monthly_revenue = monthly_series.mean()

# If working with a plain list:
valid = [r for r in monthly_revenues if r is not None]
average_monthly_revenue = sum(valid) / len(valid) if valid else 0
~~~

Another classic correctness bug — mutating a DataFrame you think you're just reading:

~~~python
# Bug: filtered_df is a VIEW into df, not a copy
# Assigning to filtered_df['status'] may modify df silently
filtered_df = df[df['revenue'] > 1000]
filtered_df['status'] = 'High Value'   # SettingWithCopyWarning

# Fix: always .copy() when you'll modify a filtered DataFrame
filtered_df = df[df['revenue'] > 1000].copy()
filtered_df['status'] = 'High Value'   # modifies only filtered_df
~~~

**2. Readability bugs** — code that works but no one can understand or maintain:

~~~python
# Unreadable: single-letter names, no context
x = [i for i in d if d[i] > t]
r = sum(x) / len(x) if x else 0

# Readable: names tell the story
high_revenue_stores = [
    store_id
    for store_id, revenue in daily_totals.items()
    if revenue > REVENUE_THRESHOLD
]
avg_high_revenue = sum(high_revenue_stores) / len(high_revenue_stores) if high_revenue_stores else 0
~~~

**3. Fragility bugs** — code that works on the happy path but breaks on edge cases:

~~~python
# Crashes with IndexError if the list is empty
first_transaction = transactions[0]

# Crashes with KeyError if the store_id doesn't exist
store_name = store_lookup[store_id]

# Crashes with ZeroDivisionError if order_count is 0
avg_value = total_revenue / order_count

# Safe patterns — Sweigart's defensive programming:
first_transaction = transactions[0] if transactions else None
store_name        = store_lookup.get(store_id, 'Unknown Store')
avg_value         = total_revenue / order_count if order_count > 0 else 0
~~~

**4. Inefficiency** — loops where vectorized operations are available (covered in Week 11):

~~~python
# Slow: apply() with a simple arithmetic calculation
df['tax'] = df['price'].apply(lambda x: x * 0.08)

# Fast: vectorized column arithmetic
df['tax'] = df['price'] * 0.08
~~~

**How to write a useful code review comment:**

When you find an issue, explain the WHY — not just what changed:

~~~python
# UNHELPFUL comment:
# Changed /12 to /len(valid)

# HELPFUL comment:
# Fixed average calculation: the original code divided by 12 (fixed months),
# but months with missing data were excluded from the sum while still being
# counted in the denominator. This caused the average to be understated
# by ~25% when 3 months of data were missing. Now divides by actual
# count of non-null months.
~~~

The helpful comment would let a colleague understand the original bug, why it mattered, and confirm the fix is correct — without having to reproduce the problem themselves.`,
      },
      {
        title: 'Refactoring a Real Script',
        content: `Refactoring is rewriting working code to be more readable and maintainable — without changing what it does. Sweigart's programs throughout the book are intentionally clear and well-structured; refactoring is the process of getting messy real-world code to that standard.

**Before — a typical 50-line procedural script:**

~~~python
# report.py — written quickly to meet a deadline
import sqlite3, pandas as pd
from datetime import datetime

c = sqlite3.connect('/dataset.db')
df = pd.read_sql("SELECT * FROM transactions WHERE sale_date >= '2024-01-01'", c)
c.close()
df['sale_date'] = pd.to_datetime(df['sale_date'])
df['month'] = df['sale_date'].dt.to_period('M').astype(str)
df2 = df[df['is_voided'] == 0]
df3 = df2.groupby(['store_id','month'])['revenue'].sum().reset_index()
df3.columns = ['store_id','month','rev']
stores = pd.read_sql("SELECT * FROM stores", sqlite3.connect('/dataset.db'))
df4 = df3.merge(stores[['store_id','store_name','region']], on='store_id')
df5 = df4.sort_values('rev', ascending=False)
df5.to_csv(f"report_{datetime.now().strftime('%Y%m%d')}.csv", index=False)
print('done')
~~~

Problems: single-letter variable names (\`c\`, \`df2\`, \`df5\`), no validation, two separate database connections, unclear what each transformation does, no error handling, magic string date.

**After — the same logic, refactored:**

~~~python
# report.py — refactored for clarity and maintainability
import sqlite3
import pandas as pd
from datetime import datetime

# ── Constants ────────────────────────────────────────────────────────────────
DB_PATH       = '/dataset.db'
REPORT_START  = '2024-01-01'
OUTPUT_PREFIX = 'store_monthly_report'

# ── Extract ──────────────────────────────────────────────────────────────────
def load_transactions(db_path: str, start_date: str) -> pd.DataFrame:
    """Pull non-voided transactions from start_date forward."""
    conn = sqlite3.connect(db_path)
    df   = pd.read_sql(
        """
        SELECT
            t.transaction_id,
            t.sale_date,
            t.store_id,
            t.revenue,
            s.store_name,
            s.region
        FROM transactions t
        JOIN stores s ON t.store_id = s.store_id
        WHERE t.sale_date  >= ?
          AND t.is_voided   = 0
        """,
        conn,
        params=[start_date]
    )
    conn.close()
    return df

# ── Transform ────────────────────────────────────────────────────────────────
def add_month_column(df: pd.DataFrame) -> pd.DataFrame:
    """Parse sale_date and derive the month period string."""
    df = df.copy()
    df['sale_date'] = pd.to_datetime(df['sale_date'])
    df['month']     = df['sale_date'].dt.to_period('M').astype(str)
    return df

def aggregate_by_store_month(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize revenue and order count at the store-month grain."""
    return df.groupby(['store_id', 'store_name', 'region', 'month']).agg(
        total_revenue = ('revenue', 'sum'),
        order_count   = ('transaction_id', 'count'),
        avg_order     = ('revenue', 'mean')
    ).reset_index().round({'total_revenue': 2, 'avg_order': 2})

# ── Load ─────────────────────────────────────────────────────────────────────
def save_csv(df: pd.DataFrame, prefix: str) -> str:
    """Write DataFrame to a dated CSV file, return the file path."""
    path = f"{prefix}_{datetime.now().strftime('%Y%m%d')}.csv"
    df.to_csv(path, index=False)
    return path

# ── Orchestrator ─────────────────────────────────────────────────────────────
def run() -> None:
    print(f"Building store report from {REPORT_START}...")

    raw     = load_transactions(DB_PATH, REPORT_START)
    print(f"  Loaded {len(raw):,} transactions")

    enriched = add_month_column(raw)
    summary  = aggregate_by_store_month(enriched)
    print(f"  Summarized to {len(summary):,} store-month rows")

    path = save_csv(summary.sort_values('total_revenue', ascending=False), OUTPUT_PREFIX)
    print(f"  Saved → {path}")

run()
~~~

**What changed and why:**

1. Variable names \`df\`, \`df2\`, \`df5\` → \`raw\`, \`enriched\`, \`summary\` — names reflect the data's stage in the pipeline
2. Two database connections → one connection in \`load_transactions()\` that always closes
3. Magic date string \`'2024-01-01'\` → named constant \`REPORT_START\` at the top — one place to change
4. The join now happens in SQL (faster) rather than a Python merge after loading
5. Each function has one responsibility and a docstring
6. The \`run()\` function reads like an English description of the process

The before and after produce identical CSV output. Refactoring changed the code, not the behavior.`,
      },
    ],
  },

  // ─── WEEKS 13–16: Capstone Phases ────────────────────────────────────────────
  {
    week: 13,
    sql: [
      {
        title: 'Dimensional Modeling — The Kimball Approach',
        content: `Ralph Kimball's Data Warehouse Toolkit defines the star schema: a central fact table surrounded by dimension tables. Kimball's opening framing: "The most important thing to understand about dimensional modeling is that it is designed for queryability, not for transaction processing." This is the standard model for analytical databases and the foundation of the capstone.

**The star schema pattern:**

~~~
         dim_date ─────┐
         dim_route ────┤
                       ▼
                   fact_trips   ← center of the star
                       ▲
         dim_stop  ────┘
         dim_driver────┘
~~~

**Fact table** — stores measurable events. One row per event (one row per trip). Contains numeric measures + foreign keys pointing to dimension tables:

~~~sql
CREATE TABLE fact_trips (
    trip_id              INTEGER PRIMARY KEY,
    date_id              INTEGER NOT NULL REFERENCES dim_date(date_id),
    route_id             INTEGER NOT NULL REFERENCES dim_route(route_id),
    driver_id            INTEGER REFERENCES dim_driver(driver_id),
    scheduled_departure  TEXT,
    actual_departure     TEXT,
    delay_minutes        REAL,       -- measure: minutes late (negative = early)
    passenger_count      INTEGER,    -- measure: riders on this trip
    revenue              REAL,       -- measure: fare revenue collected
    is_cancelled         INTEGER DEFAULT 0  -- measure: 0/1 flag
);
~~~

**Dimension tables** — describe the who, what, where, when of your facts:

~~~sql
CREATE TABLE dim_date (
    date_id    INTEGER PRIMARY KEY,   -- YYYYMMDD integer key: 20240115
    full_date  TEXT NOT NULL,         -- '2024-01-15'
    year       INTEGER,
    quarter    INTEGER,               -- 1-4
    month      INTEGER,               -- 1-12
    month_name TEXT,                  -- 'January'
    week_num   INTEGER,               -- 1-53
    day_of_week INTEGER,              -- 0=Sunday, 6=Saturday
    day_name   TEXT,                  -- 'Monday'
    is_weekend INTEGER,               -- 0/1
    is_holiday INTEGER                -- 0/1
);

CREATE TABLE dim_route (
    route_id     INTEGER PRIMARY KEY,
    route_name   TEXT NOT NULL,
    route_type   TEXT,                -- 'Local', 'Express', 'Shuttle'
    start_stop   TEXT,
    end_stop     TEXT,
    is_active    INTEGER DEFAULT 1
);

CREATE TABLE dim_driver (
    driver_id    INTEGER PRIMARY KEY,
    driver_name  TEXT NOT NULL,
    hire_date    TEXT,
    license_class TEXT
);
~~~

**Snowflake schema vs star schema** — Kimball distinguishes these. In a star schema, dimensions are denormalized (flat, one table per dimension). In a snowflake schema, dimensions are normalized (a route dimension might reference a separate \`dim_route_type\` table). Kimball strongly advocates for the star schema: "The snowflake schema conserves disk space at the expense of query complexity. In a dimensional model built for reporting, this is the wrong tradeoff."

For the SunTran capstone, use the star schema. Flat dimensions make join logic simple.

**Slowly Changing Dimensions (SCDs)** — Kimball's concept for what happens when dimension values change over time:

- **Type 1 SCD** — overwrite the old value. Simple but destroys history. Use when history doesn't matter (e.g., correcting a typo in a driver name).
- **Type 2 SCD** — add a new row with the updated value and mark the old row as expired. Preserves full history. Use when you need to know "what was the route type at the time of this trip?"

~~~sql
-- Type 2 SCD pattern: add effective_from / effective_to columns
CREATE TABLE dim_route (
    route_key      INTEGER PRIMARY KEY,  -- surrogate key (new row = new key)
    route_id       INTEGER,              -- natural/business key (stays the same)
    route_name     TEXT,
    route_type     TEXT,
    effective_from TEXT,
    effective_to   TEXT,                 -- NULL means "currently active"
    is_current     INTEGER DEFAULT 1
);

-- When route 7 changes from 'Local' to 'Express' on 2024-03-01:
UPDATE dim_route SET effective_to = '2024-02-29', is_current = 0
WHERE route_id = 7 AND is_current = 1;

INSERT INTO dim_route (route_id, route_name, route_type, effective_from, effective_to, is_current)
VALUES (7, 'Route 7 Central', 'Express', '2024-03-01', NULL, 1);
~~~

**Grain definition** — Kimball: "Declaring the grain means specifying exactly what one row in the fact table represents. The grain is the single most important design decision in dimensional modeling." For the SunTran capstone, the grain of \`fact_trips\` is **one scheduled trip departure**. One row = one bus leaving one stop at one scheduled time.`,
      },
      {
        title: 'Writing the Capstone Schema',
        content: `Here are the actual CREATE TABLE statements for the SunTran capstone data model. These implement the star schema from the previous section with the SunTran domain context.

~~~sql
-- =============================================================
-- SunTran Analytics Warehouse — Capstone Schema
-- Grain: fact_trips = one scheduled trip departure
-- Author: Justin Becerra | Week 13 Capstone
-- =============================================================

-- Drop in reverse dependency order (facts first, then dims)
DROP TABLE IF EXISTS fact_trips;
DROP TABLE IF EXISTS dim_date;
DROP TABLE IF EXISTS dim_route;
DROP TABLE IF EXISTS dim_driver;
DROP TABLE IF EXISTS dim_stop;

-- ── Dimension: Date ──────────────────────────────────────────
CREATE TABLE dim_date (
    date_id      INTEGER PRIMARY KEY,   -- YYYYMMDD e.g. 20240115
    full_date    TEXT    NOT NULL UNIQUE,
    year         INTEGER NOT NULL,
    quarter      INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    month        INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    month_name   TEXT    NOT NULL,
    week_num     INTEGER NOT NULL,
    day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    day_name     TEXT    NOT NULL,
    is_weekend   INTEGER NOT NULL DEFAULT 0,
    is_holiday   INTEGER NOT NULL DEFAULT 0
);

-- ── Dimension: Route ─────────────────────────────────────────
CREATE TABLE dim_route (
    route_id     INTEGER PRIMARY KEY,
    route_name   TEXT    NOT NULL,
    route_type   TEXT    NOT NULL DEFAULT 'Local',  -- 'Local','Express','Shuttle'
    start_stop   TEXT,
    end_stop     TEXT,
    total_stops  INTEGER,
    is_active    INTEGER NOT NULL DEFAULT 1
);

-- ── Dimension: Driver ────────────────────────────────────────
CREATE TABLE dim_driver (
    driver_id     INTEGER PRIMARY KEY,
    driver_name   TEXT    NOT NULL,
    hire_date     TEXT,
    license_class TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1
);

-- ── Dimension: Stop ──────────────────────────────────────────
CREATE TABLE dim_stop (
    stop_id      INTEGER PRIMARY KEY,
    stop_name    TEXT    NOT NULL,
    latitude     REAL,
    longitude    REAL,
    is_terminal  INTEGER NOT NULL DEFAULT 0
);

-- ── Fact: Trips ──────────────────────────────────────────────
CREATE TABLE fact_trips (
    trip_id             INTEGER PRIMARY KEY,
    date_id             INTEGER NOT NULL REFERENCES dim_date(date_id),
    route_id            INTEGER NOT NULL REFERENCES dim_route(route_id),
    driver_id           INTEGER          REFERENCES dim_driver(driver_id),
    origin_stop_id      INTEGER          REFERENCES dim_stop(stop_id),
    scheduled_departure TEXT    NOT NULL,
    actual_departure    TEXT,
    delay_minutes       REAL    GENERATED ALWAYS AS (
        ROUND(
            (julianday(actual_departure) - julianday(scheduled_departure)) * 1440,
            1
        )
    ) STORED,
    passenger_count     INTEGER NOT NULL DEFAULT 0,
    revenue_collected   REAL    NOT NULL DEFAULT 0.0,
    is_cancelled        INTEGER NOT NULL DEFAULT 0,
    notes               TEXT
);

-- ── Indexes for analytical queries ───────────────────────────
CREATE INDEX idx_fact_trips_date    ON fact_trips(date_id);
CREATE INDEX idx_fact_trips_route   ON fact_trips(route_id);
CREATE INDEX idx_fact_trips_driver  ON fact_trips(driver_id);
CREATE INDEX idx_fact_trips_rt_date ON fact_trips(route_id, date_id);
~~~

The \`delay_minutes\` column uses SQLite's **generated column** feature — the database computes it automatically from \`actual_departure\` and \`scheduled_departure\` whenever a row is inserted. You never need to calculate it manually; it's always accurate.

Load order matters: always load dimension tables before fact tables because the fact table's foreign keys reference the dimension tables. If you try to INSERT into \`fact_trips\` before \`dim_route\` has data, you'll get a foreign key constraint violation.`,
      },
    ],
    python: [
      {
        title: 'ETL Pipeline — Extract, Transform, Load',
        content: `An ETL pipeline moves data from a source system (raw operational data) into your analytics structure (the star schema). McKinney's data wrangling chapters cover the transform step in detail. The key discipline is keeping each step separate and validating between them.

**The pipeline class pattern:**

~~~python
import sqlite3
import pandas as pd
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

class SunTranETL:
    """
    ETL pipeline: raw operational data → SunTran analytics warehouse.
    Source: /operational.db (live dispatch system)
    Target: /warehouse.db  (star schema for reporting)
    """

    def __init__(self, source_path: str, target_path: str, mode: str = 'incremental'):
        self.source_path = source_path
        self.target_path = target_path
        self.mode = mode   # 'full' = reload everything, 'incremental' = new rows only
        logger.info(f"ETL initialized | mode={mode}")

    # ── Extract ─────────────────────────────────────────────────────────────

    def extract_trips(self) -> pd.DataFrame:
        """Pull raw trip records from the operational database."""
        conn = sqlite3.connect(self.source_path)

        if self.mode == 'incremental':
            # Pull only trips since the last successful load
            target_conn = sqlite3.connect(self.target_path)
            last_date = pd.read_sql(
                "SELECT MAX(scheduled_departure) AS last_load FROM fact_trips",
                target_conn
            ).iloc[0]['last_load'] or '2020-01-01'
            target_conn.close()
            query = "SELECT * FROM raw_trips WHERE scheduled_departure > ?"
            params = [last_date]
        else:
            query  = "SELECT * FROM raw_trips"
            params = []

        df = pd.read_sql(query, conn, params=params)
        conn.close()
        logger.info(f"Extracted {len(df):,} trip records (mode={self.mode})")
        return df

    # ── Transform ───────────────────────────────────────────────────────────

    def validate(self, df: pd.DataFrame, step: str) -> bool:
        """Basic data quality checks — abort if anything looks wrong."""
        issues = []

        null_cols = df.isnull().sum()
        critical_nulls = null_cols[
            null_cols > 0 and null_cols.index.isin(['route_id', 'scheduled_departure'])
        ]
        if not critical_nulls.empty:
            issues.append(f"NULLs in critical columns: {critical_nulls.to_dict()}")

        if (df.get('passenger_count', pd.Series([0])) < 0).any():
            issues.append("Negative passenger counts found")

        if issues:
            for issue in issues:
                logger.error(f"[{step}] Validation failed: {issue}")
            return False

        logger.info(f"[{step}] Validation passed — {len(df):,} rows")
        return True

    def transform_trips(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize raw trips for the fact table."""
        df = df.copy()

        # Parse and validate dates
        df['scheduled_departure'] = pd.to_datetime(df['scheduled_departure'])
        df['actual_departure']    = pd.to_datetime(df['actual_departure'], errors='coerce')

        # Derive date_id for joining to dim_date (YYYYMMDD integer)
        df['date_id'] = df['scheduled_departure'].dt.strftime('%Y%m%d').astype(int)

        # Clean numeric fields
        df['passenger_count']   = df['passenger_count'].fillna(0).clip(lower=0).astype(int)
        df['revenue_collected'] = df['revenue_collected'].fillna(0.0).clip(lower=0)
        df['is_cancelled']      = df['is_cancelled'].fillna(0).astype(int)

        # Back to string for SQLite storage
        df['scheduled_departure'] = df['scheduled_departure'].dt.strftime('%Y-%m-%d %H:%M')
        df['actual_departure']    = df['actual_departure'].dt.strftime('%Y-%m-%d %H:%M')

        logger.info(f"Transform complete — {len(df):,} rows ready")
        return df

    # ── Load ────────────────────────────────────────────────────────────────

    def load(self, df: pd.DataFrame, table: str, if_exists: str = 'append') -> None:
        """Write transformed data to the target warehouse."""
        conn = sqlite3.connect(self.target_path)
        df.to_sql(table, conn, if_exists=if_exists, index=False)
        conn.close()
        logger.info(f"Loaded {len(df):,} rows → {table}")

    # ── Orchestrator ────────────────────────────────────────────────────────

    def run(self) -> bool:
        logger.info("=== ETL pipeline starting ===")
        try:
            raw      = self.extract_trips()
            if not self.validate(raw, 'extract'):
                return False

            cleaned  = self.transform_trips(raw)
            if not self.validate(cleaned, 'transform'):
                return False

            self.load(cleaned, 'fact_trips')
            logger.info("=== ETL pipeline complete ===")
            return True

        except Exception as e:
            logger.error(f"Pipeline failed: {type(e).__name__}: {e}")
            return False

# Run the pipeline
pipeline = SunTranETL('/operational.db', '/warehouse.db', mode='incremental')
pipeline.run()
~~~`,
      },
      {
        title: 'Building the dim_date Table',
        content: `The date dimension is one of the most valuable tables in a data warehouse. Kimball calls it "the most important dimension" — it lets you slice any fact by day, week, month, quarter, year, weekend/weekday, or holiday without computing those values at query time.

Rather than manually writing INSERT statements for thousands of dates, generate the entire dimension programmatically with pandas:

~~~python
import pandas as pd
import sqlite3

def build_dim_date(start: str, end: str, db_path: str) -> pd.DataFrame:
    """
    Generate a complete date dimension table for the given date range.
    Kimball's date dimension: one row per calendar day, every useful attribute pre-computed.

    Args:
        start: start date string 'YYYY-MM-DD'
        end:   end date string 'YYYY-MM-DD'
        db_path: target SQLite database path
    """
    # pandas date_range generates every calendar day in the range
    dates = pd.date_range(start=start, end=end, freq='D')
    print(f"Generating {len(dates):,} date rows ({start} → {end})")

    df = pd.DataFrame({'full_date': dates})

    # ── Date component columns ────────────────────────────────────────────
    df['date_id']     = df['full_date'].dt.strftime('%Y%m%d').astype(int)
    df['year']        = df['full_date'].dt.year
    df['quarter']     = df['full_date'].dt.quarter
    df['month']       = df['full_date'].dt.month
    df['month_name']  = df['full_date'].dt.strftime('%B')          # 'January'
    df['week_num']    = df['full_date'].dt.isocalendar().week.astype(int)
    df['day_of_week'] = df['full_date'].dt.dayofweek              # 0=Monday, 6=Sunday
    df['day_name']    = df['full_date'].dt.strftime('%A')          # 'Monday'

    # ── Derived flags ─────────────────────────────────────────────────────
    df['is_weekend']  = (df['day_of_week'] >= 5).astype(int)       # Sat=5, Sun=6

    # US Federal holidays — add the ones relevant to SunTran service
    federal_holidays = {
        '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27',
        '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-11',
        '2024-11-28', '2024-12-25',
        '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26',
        '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-11',
        '2025-11-27', '2025-12-25',
    }
    df['full_date_str'] = df['full_date'].dt.strftime('%Y-%m-%d')
    df['is_holiday']    = df['full_date_str'].isin(federal_holidays).astype(int)

    # ── Service type column (useful for SunTran reporting) ────────────────
    df['service_type'] = 'Weekday'
    df.loc[df['is_weekend'] == 1,  'service_type'] = 'Weekend'
    df.loc[df['is_holiday'] == 1,  'service_type'] = 'Holiday'

    # Format full_date as string for SQLite
    df['full_date'] = df['full_date_str']
    df = df.drop(columns=['full_date_str'])

    # Reorder columns to match the CREATE TABLE definition
    df = df[[
        'date_id', 'full_date', 'year', 'quarter', 'month', 'month_name',
        'week_num', 'day_of_week', 'day_name', 'is_weekend', 'is_holiday',
        'service_type'
    ]]

    # ── Load to database ──────────────────────────────────────────────────
    conn = sqlite3.connect(db_path)
    df.to_sql('dim_date', conn, if_exists='replace', index=False)
    conn.close()

    print(f"Loaded {len(df):,} rows → dim_date")
    print(df[df['is_holiday'] == 1][['full_date', 'day_name', 'service_type']].to_string(index=False))
    return df

# Build dim_date for the capstone — cover the full project period plus buffer
dim = build_dim_date('2023-01-01', '2025-12-31', '/warehouse.db')
print(dim.sample(5).to_string(index=False))
~~~

**Verify the dimension in SQL after loading:**

~~~sql
-- Row count
SELECT COUNT(*) FROM dim_date;           -- should be ~1096 for 3 years

-- Check the weekend flag
SELECT day_name, is_weekend, COUNT(*)
FROM dim_date
GROUP BY day_name, is_weekend
ORDER BY is_weekend, day_name;

-- Check holidays
SELECT full_date, day_name, service_type
FROM dim_date
WHERE is_holiday = 1
ORDER BY full_date;

-- Now you can answer "how does OTP differ on holidays vs weekdays?"
SELECT
    d.service_type,
    COUNT(*)                                                         AS total_trips,
    ROUND(100.0 * SUM(CASE WHEN t.delay_minutes <= 5 THEN 1 ELSE 0 END) / COUNT(*), 1) AS otp_pct
FROM fact_trips t
JOIN dim_date d ON t.date_id = d.date_id
GROUP BY d.service_type
ORDER BY otp_pct DESC;
~~~

The date dimension transforms a raw \`scheduled_departure\` timestamp into a rich analytical object. Every time-based question — "does OTP drop on Mondays?", "how does ridership differ between holidays and regular days?", "what's the busiest week of the year?" — answers in a simple GROUP BY against \`dim_date\`.`,
      },
    ],
  },

  {
    week: 14,
    sql: [
      {
        title: 'Transit Operations KPIs',
        content: `On-time performance (OTP) is the core operational metric for transit. Kimball's book calls these "operational KPIs" — measures that directly indicate whether the operation is functioning as designed. OTP tells you whether the service is reliable. Supplementary KPIs tell you whether it's efficient and financially sustainable.

**Core OTP query — using the fact_trips table:**

~~~sql
WITH route_summary AS (
    SELECT
        t.route_id,
        COUNT(*)                                                       AS total_trips,
        SUM(CASE WHEN t.delay_minutes <= 5  THEN 1 ELSE 0 END)        AS on_time_trips,
        SUM(CASE WHEN t.delay_minutes > 15  THEN 1 ELSE 0 END)        AS severely_late,
        SUM(CASE WHEN t.is_cancelled = 1    THEN 1 ELSE 0 END)        AS cancelled_trips,
        ROUND(AVG(t.delay_minutes), 1)                                 AS avg_delay_min,
        ROUND(100.0 *
            SUM(CASE WHEN t.delay_minutes <= 5 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*) - SUM(t.is_cancelled), 0), 1)           AS otp_pct
    FROM fact_trips t
    WHERE t.date_id >= 20240101
    GROUP BY t.route_id
)
SELECT
    r.route_name,
    r.route_type,
    s.total_trips,
    s.on_time_trips,
    s.cancelled_trips,
    s.avg_delay_min,
    s.otp_pct,
    CASE
        WHEN s.otp_pct >= 90 THEN 'Excellent'
        WHEN s.otp_pct >= 80 THEN 'Meets Target'
        WHEN s.otp_pct >= 70 THEN 'Warning'
        ELSE 'Critical'
    END AS performance_tier
FROM route_summary s
JOIN dim_route r ON s.route_id = r.route_id
ORDER BY s.otp_pct ASC;
~~~

The \`NULLIF(COUNT(*) - SUM(is_cancelled), 0)\` expression excludes cancelled trips from the OTP denominator — a cancelled trip can't be "on time."

**Headway analysis** — headway is the time between consecutive bus departures on the same route. Shorter headway = more frequent service = better rider experience:

~~~sql
WITH departures AS (
    SELECT
        route_id,
        actual_departure,
        LAG(actual_departure) OVER (
            PARTITION BY route_id
            ORDER BY actual_departure
        ) AS prev_departure
    FROM fact_trips
    WHERE is_cancelled = 0
      AND actual_departure IS NOT NULL
      AND date_id >= 20240101
),
headways AS (
    SELECT
        route_id,
        ROUND(
            (julianday(actual_departure) - julianday(prev_departure)) * 1440,
            1
        ) AS headway_minutes
    FROM departures
    WHERE prev_departure IS NOT NULL
      AND (julianday(actual_departure) - julianday(prev_departure)) * 1440 < 120
      -- exclude overnight gaps (>2h = different service period)
)
SELECT
    r.route_name,
    ROUND(AVG(h.headway_minutes), 1)    AS avg_headway_min,
    ROUND(MIN(h.headway_minutes), 1)    AS min_headway_min,
    ROUND(MAX(h.headway_minutes), 1)    AS max_headway_min
FROM headways h
JOIN dim_route r ON h.route_id = r.route_id
GROUP BY h.route_id, r.route_name
ORDER BY avg_headway_min;
~~~

**Passenger load factor** — what fraction of capacity is being used? Load factor = passengers / capacity. An empty bus is wasted cost; an overcrowded bus loses riders:

~~~sql
SELECT
    r.route_name,
    SUM(t.passenger_count)                           AS total_passengers,
    COUNT(*)                                         AS total_trips,
    ROUND(AVG(t.passenger_count), 1)                 AS avg_passengers_per_trip,
    -- Assume 40-passenger capacity per bus
    ROUND(AVG(t.passenger_count) / 40.0 * 100, 1)   AS avg_load_factor_pct,
    SUM(CASE WHEN t.passenger_count > 36 THEN 1 ELSE 0 END) AS overcrowded_trips
FROM fact_trips t
JOIN dim_route r ON t.route_id = r.route_id
WHERE t.date_id >= 20240101
  AND t.is_cancelled = 0
GROUP BY t.route_id, r.route_name
ORDER BY avg_load_factor_pct DESC;
~~~

**Revenue per mile (proxy)** — measures operational efficiency. With SunTran data, we approximate using revenue per trip:

~~~sql
SELECT
    r.route_name,
    SUM(t.revenue_collected)                                   AS total_revenue,
    COUNT(*)                                                   AS total_trips,
    ROUND(SUM(t.revenue_collected) / NULLIF(COUNT(*), 0), 2)  AS revenue_per_trip,
    ROUND(AVG(t.passenger_count), 1)                          AS avg_passengers,
    ROUND(SUM(t.revenue_collected) / NULLIF(SUM(t.passenger_count), 0), 2) AS revenue_per_rider
FROM fact_trips t
JOIN dim_route r ON t.route_id = r.route_id
WHERE t.date_id >= 20240101
  AND t.is_cancelled = 0
GROUP BY t.route_id, r.route_name
ORDER BY revenue_per_trip DESC;
~~~`,
      },
      {
        title: 'Building the OTP Dashboard Query',
        content: `The OTP dashboard query is the capstone SQL deliverable — a single multi-CTE query that combines on-time performance, ridership, headway, and service quality into one comprehensive view. This is the kind of query you'd build to feed a Tableau or Power BI dashboard.

~~~sql
-- =============================================================
-- SunTran Operations Dashboard — Rolling 30-Day Summary
-- One row per route with all key operational KPIs
-- Author: Justin Becerra | Week 14 Capstone
-- =============================================================

WITH
-- ── Step 1: Define the reporting window ──────────────────────
report_window AS (
    SELECT
        date('now', '-30 days') AS start_date,
        date('now')             AS end_date,
        -- Convert to date_id integer for joining dim_date
        CAST(strftime('%Y%m%d', date('now', '-30 days')) AS INTEGER) AS start_date_id,
        CAST(strftime('%Y%m%d', date('now'))             AS INTEGER) AS end_date_id
),

-- ── Step 2: Filter facts to the window ───────────────────────
period_trips AS (
    SELECT t.*
    FROM fact_trips t
    CROSS JOIN report_window w
    WHERE t.date_id BETWEEN w.start_date_id AND w.end_date_id
),

-- ── Step 3: OTP metrics per route ────────────────────────────
otp_stats AS (
    SELECT
        route_id,
        COUNT(*)                                                           AS total_trips,
        SUM(is_cancelled)                                                  AS cancelled,
        COUNT(*) - SUM(is_cancelled)                                       AS operated,
        SUM(CASE WHEN delay_minutes <= 5  AND is_cancelled = 0 THEN 1 ELSE 0 END) AS on_time,
        SUM(CASE WHEN delay_minutes > 15  AND is_cancelled = 0 THEN 1 ELSE 0 END) AS severely_late,
        ROUND(AVG(CASE WHEN is_cancelled = 0 THEN delay_minutes END), 1)  AS avg_delay,
        ROUND(100.0 *
            SUM(CASE WHEN delay_minutes <= 5 AND is_cancelled = 0 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*) - SUM(is_cancelled), 0), 1)                 AS otp_pct
    FROM period_trips
    GROUP BY route_id
),

-- ── Step 4: Ridership and revenue metrics ────────────────────
ridership AS (
    SELECT
        route_id,
        SUM(passenger_count)                                           AS total_riders,
        ROUND(AVG(passenger_count), 1)                                 AS avg_riders_per_trip,
        ROUND(AVG(CAST(passenger_count AS REAL) / 40.0 * 100), 1)     AS avg_load_pct,
        SUM(revenue_collected)                                         AS total_revenue,
        ROUND(SUM(revenue_collected) / NULLIF(SUM(passenger_count), 0), 2) AS revenue_per_rider
    FROM period_trips
    WHERE is_cancelled = 0
    GROUP BY route_id
),

-- ── Step 5: Compare this period to the prior 30 days ─────────
prior_period AS (
    SELECT
        t.route_id,
        ROUND(100.0 *
            SUM(CASE WHEN t.delay_minutes <= 5 AND t.is_cancelled = 0 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*) - SUM(t.is_cancelled), 0), 1) AS prior_otp_pct
    FROM fact_trips t
    CROSS JOIN report_window w
    WHERE t.date_id BETWEEN
        CAST(strftime('%Y%m%d', date(w.start_date, '-30 days')) AS INTEGER)
        AND w.start_date_id - 1
    GROUP BY t.route_id
)

-- ── Final output ─────────────────────────────────────────────
SELECT
    r.route_name,
    r.route_type,
    o.total_trips,
    o.cancelled,
    o.otp_pct,
    p.prior_otp_pct,
    ROUND(o.otp_pct - p.prior_otp_pct, 1)     AS otp_change,
    o.avg_delay                                AS avg_delay_min,
    ri.avg_riders_per_trip,
    ri.avg_load_pct,
    ri.revenue_per_rider,
    CASE
        WHEN o.otp_pct >= 90                   THEN 'Excellent'
        WHEN o.otp_pct >= 80                   THEN 'Meets Target'
        WHEN o.otp_pct >= 70                   THEN 'Warning'
        ELSE                                        'Critical'
    END AS performance_tier,
    CASE
        WHEN o.otp_pct < 80 AND (o.otp_pct - p.prior_otp_pct) < -5  THEN 'Declining — Needs Attention'
        WHEN o.otp_pct < 80 AND (o.otp_pct - p.prior_otp_pct) >= 0  THEN 'Below Target — Improving'
        WHEN o.otp_pct >= 80 AND (o.otp_pct - p.prior_otp_pct) < -5 THEN 'At Risk — Trend Down'
        ELSE                                                               'Stable'
    END AS trend_status
FROM otp_stats o
JOIN dim_route  r  ON o.route_id = r.route_id
JOIN ridership  ri ON o.route_id = ri.route_id
LEFT JOIN prior_period p ON o.route_id = p.route_id
WHERE r.is_active = 1
ORDER BY o.otp_pct ASC;   -- worst routes first — action items at the top
~~~

This query is your capstone SQL artifact. It demonstrates: multi-CTE pipeline design, window-period comparison using LAG-equivalent logic, LEFT JOIN for prior period (routes might be new), NULLIF to prevent division by zero, CASE-based performance classification, and self-documenting structure with comments.`,
      },
    ],
    python: [
      {
        title: 'Automated Performance Monitoring',
        content: `The Python side of the OTP dashboard pulls from the warehouse, runs the analysis, and produces alerts. The goal is a script you can schedule to run every morning — Sweigart's automation mindset applied to transit operations.

~~~python
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
DB_PATH        = '/warehouse.db'
OTP_TARGET     = 80.0    # SunTran's minimum acceptable OTP threshold
CRITICAL_OTP   = 70.0    # below this = critical alert
ANALYSIS_DAYS  = 30      # rolling window

# ── Data extraction ──────────────────────────────────────────────────────────
def get_route_performance(conn: sqlite3.Connection, days_back: int = ANALYSIS_DAYS) -> pd.DataFrame:
    """Pull OTP and ridership metrics for each route over the rolling window."""
    cutoff_id = int(
        (datetime.now() - timedelta(days=days_back)).strftime('%Y%m%d')
    )
    return pd.read_sql(
        """
        SELECT
            r.route_id,
            r.route_name,
            r.route_type,
            COUNT(*)                                                            AS total_trips,
            SUM(t.is_cancelled)                                                AS cancelled,
            ROUND(100.0 *
                SUM(CASE WHEN t.delay_minutes <= 5 AND t.is_cancelled = 0 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*) - SUM(t.is_cancelled), 0), 1)               AS otp_pct,
            ROUND(AVG(CASE WHEN t.is_cancelled = 0 THEN t.delay_minutes END), 1) AS avg_delay,
            ROUND(AVG(CAST(t.passenger_count AS REAL)), 1)                    AS avg_riders,
            SUM(t.revenue_collected)                                          AS total_revenue
        FROM fact_trips t
        JOIN dim_route r ON t.route_id = r.route_id
        WHERE t.date_id >= ?
          AND r.is_active = 1
        GROUP BY r.route_id, r.route_name, r.route_type
        """,
        conn,
        params=[cutoff_id]
    )

# ── Analysis ─────────────────────────────────────────────────────────────────
def classify_routes(df: pd.DataFrame) -> pd.DataFrame:
    """Add performance tier and alert level columns."""
    df = df.copy()

    # Performance tier
    df['performance_tier'] = pd.cut(
        df['otp_pct'],
        bins   = [0, CRITICAL_OTP, OTP_TARGET, 90, 100],
        labels = ['Critical', 'Warning', 'Meets Target', 'Excellent'],
        right  = True
    )

    # Alert level (for notification logic)
    df['alert_level'] = 'OK'
    df.loc[df['otp_pct'] < OTP_TARGET,  'alert_level'] = 'WARNING'
    df.loc[df['otp_pct'] < CRITICAL_OTP, 'alert_level'] = 'CRITICAL'

    return df.sort_values('otp_pct')

def compute_system_summary(df: pd.DataFrame) -> dict:
    """Compute fleet-wide summary statistics."""
    operated = df[df['cancelled'] < df['total_trips']]
    return {
        'total_routes':    len(df),
        'routes_on_target': (df['otp_pct'] >= OTP_TARGET).sum(),
        'routes_critical':  (df['otp_pct'] < CRITICAL_OTP).sum(),
        'fleet_otp_pct':   round(
            operated['otp_pct'].mean(), 1
        ),
        'total_riders':    df['avg_riders'].sum(),
        'total_revenue':   df['total_revenue'].sum(),
    }

# ── Reporting ────────────────────────────────────────────────────────────────
def print_alerts(df: pd.DataFrame) -> None:
    """Print formatted alert output to console and log."""
    alerts = df[df['alert_level'] != 'OK']

    if alerts.empty:
        logger.info("No alerts — all routes meeting OTP target")
        return

    print(f"\n{'='*60}")
    print(f"  OTP ALERTS — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}")
    for _, row in alerts.iterrows():
        print(
            f"  [{row['alert_level']:8s}] {row['route_name']:<20s} "
            f"OTP: {row['otp_pct']:5.1f}%  "
            f"Avg delay: {row['avg_delay']:4.1f} min  "
            f"Riders/trip: {row['avg_riders']:4.1f}"
        )
    print(f"{'='*60}\n")

# ── Main ─────────────────────────────────────────────────────────────────────
def run_monitoring() -> None:
    logger.info("Starting performance monitoring run")
    conn = sqlite3.connect(DB_PATH)

    perf      = get_route_performance(conn)
    conn.close()
    logger.info(f"Loaded data for {len(perf)} routes")

    classified = classify_routes(perf)
    summary    = compute_system_summary(classified)

    logger.info(
        f"Fleet OTP: {summary['fleet_otp_pct']}% | "
        f"{summary['routes_on_target']}/{summary['total_routes']} routes on target | "
        f"{summary['routes_critical']} critical"
    )

    print_alerts(classified)

run_monitoring()
~~~`,
      },
      {
        title: 'Generating the Weekly Report',
        content: `A monitoring script that prints to the console is a starting point. A professional weekly report is a formatted artifact — a CSV that goes to a manager, a text summary that gets emailed, or both. Sweigart's automation principle: if you do it manually every week, automate it.

~~~python
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
import os

DB_PATH      = '/warehouse.db'
REPORT_DIR   = '/reports'
OTP_TARGET   = 80.0

def get_weekly_data(conn: sqlite3.Connection) -> pd.DataFrame:
    """Pull performance data for the last 7 complete days."""
    cutoff_id = int(
        (datetime.now() - timedelta(days=7)).strftime('%Y%m%d')
    )
    return pd.read_sql(
        """
        SELECT
            d.full_date,
            d.day_name,
            d.service_type,
            r.route_name,
            COUNT(*)                                                      AS trips,
            ROUND(100.0 *
                SUM(CASE WHEN t.delay_minutes <= 5 AND t.is_cancelled=0 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*) - SUM(t.is_cancelled), 0), 1)         AS otp_pct,
            SUM(t.passenger_count)                                       AS riders,
            ROUND(SUM(t.revenue_collected), 2)                           AS revenue
        FROM fact_trips t
        JOIN dim_date  d ON t.date_id  = d.date_id
        JOIN dim_route r ON t.route_id = r.route_id
        WHERE t.date_id >= ?
          AND r.is_active = 1
        GROUP BY d.full_date, d.day_name, d.service_type, r.route_name
        ORDER BY d.full_date, r.route_name
        """,
        conn,
        params=[cutoff_id]
    )

def build_daily_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate to daily fleet-level totals."""
    return df.groupby(['full_date', 'day_name', 'service_type']).agg(
        total_trips  = ('trips',   'sum'),
        fleet_otp    = ('otp_pct', 'mean'),
        total_riders = ('riders',  'sum'),
        total_revenue= ('revenue', 'sum')
    ).reset_index().round({'fleet_otp': 1, 'total_revenue': 2})

def build_route_summary(df: pd.DataFrame) -> pd.DataFrame:
    """7-day summary per route."""
    return df.groupby('route_name').agg(
        total_trips    = ('trips',   'sum'),
        avg_otp_pct    = ('otp_pct', 'mean'),
        total_riders   = ('riders',  'sum'),
        total_revenue  = ('revenue', 'sum')
    ).reset_index().sort_values('avg_otp_pct').round({'avg_otp_pct': 1, 'total_revenue': 2})

def generate_text_summary(daily: pd.DataFrame, routes: pd.DataFrame) -> str:
    """Produce a formatted plain-text report string."""
    week_end  = datetime.now().strftime('%Y-%m-%d')
    week_otp  = daily['fleet_otp'].mean()
    riders    = daily['total_riders'].sum()
    revenue   = daily['total_revenue'].sum()
    on_target = (routes['avg_otp_pct'] >= OTP_TARGET).sum()

    worst_routes = routes.head(3)
    best_routes  = routes.tail(3).iloc[::-1]

    lines = [
        f"{'='*55}",
        f"  SUNTRAN WEEKLY PERFORMANCE REPORT",
        f"  Week ending: {week_end}",
        f"{'='*55}",
        f"",
        f"  Fleet OTP:         {week_otp:.1f}%",
        f"  Routes on target:  {on_target} / {len(routes)}",
        f"  Total riders:      {riders:,.0f}",
        f"  Total revenue:     \${revenue:,.2f}",
        f"",
        f"  TOP PERFORMERS:",
        *[f"    {row['route_name']:<22} {row['avg_otp_pct']:5.1f}%"
          for _, row in best_routes.iterrows()],
        f"",
        f"  NEEDS ATTENTION:",
        *[f"    {row['route_name']:<22} {row['avg_otp_pct']:5.1f}%  ← {'CRITICAL' if row['avg_otp_pct'] < 70 else 'WARNING'}"
          for _, row in worst_routes.iterrows()],
        f"",
        f"{'='*55}",
    ]
    return "\n".join(lines)

def save_report(daily: pd.DataFrame, routes: pd.DataFrame,
                summary_text: str, report_dir: str) -> None:
    """Write CSV files and text summary to the report directory."""
    os.makedirs(report_dir, exist_ok=True)
    date_str = datetime.now().strftime('%Y%m%d')

    daily_path  = os.path.join(report_dir, f"daily_otp_{date_str}.csv")
    routes_path = os.path.join(report_dir, f"route_summary_{date_str}.csv")
    text_path   = os.path.join(report_dir, f"weekly_summary_{date_str}.txt")

    daily.to_csv(daily_path,   index=False)
    routes.to_csv(routes_path, index=False)
    with open(text_path, 'w') as f:
        f.write(summary_text)

    print(f"Reports written to {report_dir}/")

def run():
    conn    = sqlite3.connect(DB_PATH)
    raw     = get_weekly_data(conn)
    conn.close()

    daily   = build_daily_summary(raw)
    routes  = build_route_summary(raw)
    summary = generate_text_summary(daily, routes)

    print(summary)
    save_report(daily, routes, summary, REPORT_DIR)

run()
~~~

The \`\$\` in \`\${revenue:,.2f}\` is a Python f-string — the \`\\$\` notation keeps the dollar sign literal inside the template literal in this file. The report produces three files: a daily breakdown CSV, a route summary CSV, and a human-readable text summary.`,
      },
    ],
  },

  {
    week: 15,
    sql: [
      {
        title: 'Statistical Anomaly Detection in SQL',
        content: `Anomaly detection in SQL is built on one question: "is this data point far from normal?" The z-score is the standard measure of "how far" — it expresses distance in units of standard deviation. A z-score of +2.0 means the value is 2 standard deviations above the mean, which is unusual but not impossible. A z-score of +4.0 is almost certainly a data error or a genuine operational incident worth investigating.

**The math:**

z = (observed value − mean) / standard deviation

SQLite doesn't have a built-in \`STDDEV()\` function, but you can compute it using the computational formula:

σ = SQRT(E[X²] − E[X]²)  =  SQRT(AVG(x²) − AVG(x)²)

**Full z-score anomaly detection query:**

~~~sql
WITH baseline AS (
    -- Establish "normal" from historical data (everything except the last 7 days)
    -- Using a longer baseline gives more stable statistics
    SELECT
        route_id,
        AVG(passenger_count)                                         AS mean_riders,
        -- SQLite's standard deviation formula
        SQRT(
            AVG(passenger_count * passenger_count)
            - AVG(passenger_count) * AVG(passenger_count)
        )                                                            AS stddev_riders
    FROM fact_trips
    WHERE date_id < CAST(strftime('%Y%m%d', date('now', '-7 days')) AS INTEGER)
      AND is_cancelled = 0
    GROUP BY route_id
    HAVING COUNT(*) >= 20    -- need at least 20 trips for reliable statistics
),
recent_trips AS (
    -- The trips we're evaluating — last 7 days
    SELECT
        t.trip_id,
        t.route_id,
        t.date_id,
        t.passenger_count,
        t.delay_minutes
    FROM fact_trips t
    WHERE t.date_id >= CAST(strftime('%Y%m%d', date('now', '-7 days')) AS INTEGER)
      AND t.is_cancelled = 0
),
scored AS (
    SELECT
        r.trip_id,
        r.route_id,
        r.date_id,
        r.passenger_count,
        b.mean_riders,
        b.stddev_riders,
        ROUND(
            (r.passenger_count - b.mean_riders)
            / NULLIF(b.stddev_riders, 0),     -- NULLIF prevents division by zero
            2
        ) AS z_score
    FROM recent_trips r
    JOIN baseline b ON r.route_id = b.route_id
)
SELECT
    s.trip_id,
    dr.route_name,
    s.date_id,
    s.passenger_count,
    ROUND(s.mean_riders, 1)   AS historical_mean,
    ROUND(s.stddev_riders, 1) AS historical_stddev,
    s.z_score,
    CASE
        WHEN ABS(s.z_score) > 3 THEN 'Extreme Outlier'
        WHEN ABS(s.z_score) > 2 THEN 'Outlier'
        ELSE 'Unusual'
    END AS anomaly_severity,
    CASE
        WHEN s.z_score > 2  THEN 'Unexpectedly High Ridership'
        WHEN s.z_score < -2 THEN 'Unexpectedly Low Ridership'
    END AS interpretation
FROM scored s
JOIN dim_route dr ON s.route_id = dr.route_id
WHERE ABS(s.z_score) > 2
ORDER BY ABS(s.z_score) DESC;
~~~

**Business interpretation of z-scores:**

A z-score of +3 on ridership means the bus had roughly 3× the normal variation in passengers above average. This could mean: a special event nearby, a connecting route was cancelled forcing passengers onto this one, or a data entry error (someone entered 3 passengers as 300). The anomaly detection query surfaces the data point — human judgment determines the cause.

**Why \`HAVING COUNT(*) >= 20\`** — standard deviation computed from fewer than 20 data points is unreliable. A route that only ran twice in the baseline period would show a very small (or zero) stddev, causing every recent trip to appear as an extreme anomaly. The HAVING filter protects against this.`,
      },
      {
        title: 'Alerting Queries',
        content: `Anomaly detection that runs manually is useful. Anomaly detection that runs on a schedule and surfaces only the issues that need attention is operational. Alerting queries are designed to return rows only when something is wrong — zero rows = everything is fine.

**OTP alert query — runs daily:**

~~~sql
-- Returns routes that failed to meet OTP target yesterday
-- Zero rows = no alerts. Rows = routes needing attention.
WITH yesterday_trips AS (
    SELECT
        t.route_id,
        COUNT(*)                                                             AS trips,
        SUM(t.is_cancelled)                                                 AS cancelled,
        ROUND(100.0 *
            SUM(CASE WHEN t.delay_minutes <= 5 AND t.is_cancelled=0 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*) - SUM(t.is_cancelled), 0), 1)                AS otp_pct,
        ROUND(AVG(CASE WHEN t.is_cancelled=0 THEN t.delay_minutes END), 1) AS avg_delay
    FROM fact_trips t
    WHERE t.date_id = CAST(strftime('%Y%m%d', date('now', '-1 day')) AS INTEGER)
    GROUP BY t.route_id
    HAVING (COUNT(*) - SUM(t.is_cancelled)) >= 3  -- need at least 3 operated trips
)
SELECT
    r.route_name,
    y.trips,
    y.cancelled,
    y.otp_pct,
    y.avg_delay,
    CASE WHEN y.otp_pct < 70 THEN 'CRITICAL' ELSE 'WARNING' END AS alert_level
FROM yesterday_trips y
JOIN dim_route r ON y.route_id = r.route_id
WHERE y.otp_pct < 80    -- alert threshold
ORDER BY y.otp_pct ASC;
~~~

**Ridership anomaly alert query — runs daily:**

~~~sql
WITH baseline AS (
    SELECT
        route_id,
        AVG(passenger_count)   AS mean_riders,
        SQRT(AVG(passenger_count * passenger_count)
             - AVG(passenger_count) * AVG(passenger_count)) AS stddev_riders
    FROM fact_trips
    WHERE date_id < CAST(strftime('%Y%m%d', date('now', '-7 days')) AS INTEGER)
      AND is_cancelled = 0
    GROUP BY route_id
    HAVING COUNT(*) >= 20
)
SELECT
    r.route_name,
    t.date_id,
    SUM(t.passenger_count)    AS daily_riders,
    ROUND(b.mean_riders, 1)   AS expected_per_trip,
    ROUND(
        (AVG(t.passenger_count) - b.mean_riders) / NULLIF(b.stddev_riders, 0),
        2
    )                         AS z_score,
    'Low Ridership Alert'     AS alert_type
FROM fact_trips t
JOIN dim_route r  ON t.route_id = r.route_id
JOIN baseline  b  ON t.route_id = b.route_id
WHERE t.date_id = CAST(strftime('%Y%m%d', date('now', '-1 day')) AS INTEGER)
  AND t.is_cancelled = 0
GROUP BY t.route_id, r.route_name, t.date_id, b.mean_riders, b.stddev_riders
HAVING (AVG(t.passenger_count) - b.mean_riders) / NULLIF(b.stddev_riders, 0) < -2
ORDER BY z_score ASC;
~~~

**Cancelled trip spike alert:**

~~~sql
-- Alert when cancellation rate yesterday was more than 3x the 30-day average
WITH recent_avg AS (
    SELECT
        route_id,
        AVG(CAST(is_cancelled AS REAL)) AS avg_cancel_rate
    FROM fact_trips
    WHERE date_id BETWEEN
        CAST(strftime('%Y%m%d', date('now', '-31 days')) AS INTEGER)
        AND CAST(strftime('%Y%m%d', date('now', '-2 days')) AS INTEGER)
    GROUP BY route_id
),
yesterday AS (
    SELECT
        route_id,
        AVG(CAST(is_cancelled AS REAL)) AS yesterday_cancel_rate
    FROM fact_trips
    WHERE date_id = CAST(strftime('%Y%m%d', date('now', '-1 day')) AS INTEGER)
    GROUP BY route_id
)
SELECT
    r.route_name,
    ROUND(y.yesterday_cancel_rate * 100, 1) AS yesterday_cancel_pct,
    ROUND(a.avg_cancel_rate * 100, 1)       AS baseline_cancel_pct,
    ROUND(y.yesterday_cancel_rate / NULLIF(a.avg_cancel_rate, 0), 1) AS spike_ratio,
    'Cancellation Spike'                    AS alert_type
FROM yesterday y
JOIN recent_avg  a ON y.route_id = a.route_id
JOIN dim_route   r ON y.route_id = r.route_id
WHERE y.yesterday_cancel_rate > a.avg_cancel_rate * 3   -- 3x normal rate = alert
  AND y.yesterday_cancel_rate > 0.1                     -- at least 10% cancelled
ORDER BY spike_ratio DESC;
~~~

The pattern in all three queries is the same: compute a baseline, compare yesterday's data to it, and return rows only when the comparison exceeds the alert threshold. Zero rows from any of these queries is a good morning.`,
      },
    ],
    python: [
      {
        title: 'IQR Anomaly Detection — McKinney Statistical Methods',
        content: `McKinney covers descriptive statistics including quartiles in Chapter 5. The IQR (Interquartile Range) method is an alternative to z-score anomaly detection that doesn't assume your data follows a normal distribution. Transit ridership data is often right-skewed (a few very busy trips pull the mean up), making the IQR method more robust for this domain.

**The math:**

- Q1 = 25th percentile, Q3 = 75th percentile
- IQR = Q3 − Q1 (the middle 50% of the data)
- Lower fence = Q1 − 1.5 × IQR
- Upper fence = Q3 + 1.5 × IQR
- Any value outside the fences is flagged as an outlier

This is "Tukey's fences," introduced by John Tukey in 1977 — the same method that box plots use to identify outliers.

**IQR vs z-score** — why IQR is more robust:

The z-score uses the mean and standard deviation, both of which are heavily influenced by extreme values. If a route had one day with 500 riders due to a festival, the mean and stddev shift to accommodate it — making subsequent normal days look like low outliers. The IQR uses the median (implicitly, via Q1 and Q3), which is resistant to extreme values.

**Implementation:**

~~~python
import pandas as pd
import sqlite3
import numpy as np
from datetime import datetime

DB_PATH = '/warehouse.db'

def detect_anomalies_iqr(df: pd.DataFrame, column: str,
                          group_col: str | None = None,
                          fence_multiplier: float = 1.5) -> pd.DataFrame:
    """
    Flag outliers using Tukey's IQR fence method.
    McKinney .quantile(0.25) and .quantile(0.75) do the work.

    Args:
        df:               input DataFrame
        column:           column to check for outliers
        group_col:        if provided, compute IQR separately per group
        fence_multiplier: 1.5 = standard outlier, 3.0 = extreme outlier only
    """
    results = []
    groups  = df.groupby(group_col) if group_col else [(None, df)]

    for group_val, gdf in groups:
        gdf = gdf.copy()

        Q1   = gdf[column].quantile(0.25)
        Q3   = gdf[column].quantile(0.75)
        IQR  = Q3 - Q1

        # Tukey fences
        lower = Q1 - fence_multiplier * IQR
        upper = Q3 + fence_multiplier * IQR

        gdf['is_anomaly']    = ~gdf[column].between(lower, upper)
        gdf['lower_fence']   = round(lower, 2)
        gdf['upper_fence']   = round(upper, 2)
        gdf['IQR']           = round(IQR, 2)
        gdf['group_label']   = group_val

        results.append(gdf)

    combined = pd.concat(results, ignore_index=True)
    return combined

# ── Load data ─────────────────────────────────────────────────────────────────
conn = sqlite3.connect(DB_PATH)
df   = pd.read_sql(
    """
    SELECT t.trip_id, t.route_id, r.route_name, t.date_id,
           t.passenger_count, t.delay_minutes
    FROM fact_trips t
    JOIN dim_route r ON t.route_id = r.route_id
    WHERE t.date_id >= 20240101 AND t.is_cancelled = 0
    """,
    conn
)
conn.close()

# ── Run IQR detection per route ───────────────────────────────────────────────
df_flagged = detect_anomalies_iqr(df, column='passenger_count', group_col='route_name')

# ── Summarize findings ────────────────────────────────────────────────────────
anomalies = df_flagged[df_flagged['is_anomaly']].copy()
anomalies['direction'] = np.where(
    anomalies['passenger_count'] > anomalies['upper_fence'],
    'High',
    'Low'
)

print(f"IQR Anomaly Detection Results")
print(f"{'='*50}")
print(f"Total trips analyzed:   {len(df):,}")
print(f"Anomalies detected:     {len(anomalies):,} ({len(anomalies)/len(df)*100:.1f}%)")
print(f"  High ridership:       {(anomalies['direction']=='High').sum():,}")
print(f"  Low ridership:        {(anomalies['direction']=='Low').sum():,}")
print()

# Show worst anomalies per route
print("Top anomalies by route:")
print(anomalies.groupby('route_name').size().sort_values(ascending=False).head(10).to_string())
~~~`,
      },
      {
        title: 'Connecting the Anomaly System to the Pipeline',
        content: `Anomaly detection is only useful if it produces an action. The full loop is: detect anomalies → flag them → generate a report → (optionally) trigger an alert. This section connects the IQR detection from the previous lesson into the reporting pipeline from Week 14.

~~~python
import pandas as pd
import sqlite3
import numpy as np
from datetime import datetime, timedelta
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

DB_PATH    = '/warehouse.db'
REPORT_DIR = '/reports'

# ── Step 1: Detect anomalies ──────────────────────────────────────────────────
def detect_and_flag(conn: sqlite3.Connection, lookback_days: int = 30) -> pd.DataFrame:
    """
    Pull recent trips, compute IQR bounds from 30-day baseline,
    flag anomalies, and return a DataFrame with anomaly columns added.
    """
    cutoff_id = int(
        (datetime.now() - timedelta(days=lookback_days)).strftime('%Y%m%d')
    )
    df = pd.read_sql(
        """
        SELECT t.trip_id, t.route_id, r.route_name, d.full_date,
               d.day_name, d.service_type,
               t.passenger_count, t.delay_minutes, t.is_cancelled
        FROM fact_trips t
        JOIN dim_route r ON t.route_id = r.route_id
        JOIN dim_date  d ON t.date_id  = d.date_id
        WHERE t.date_id >= ? AND t.is_cancelled = 0
        ORDER BY d.full_date, r.route_name
        """,
        conn,
        params=[cutoff_id]
    )
    logger.info(f"Loaded {len(df):,} trips for anomaly analysis")

    # Compute IQR bounds per route
    bounds = df.groupby('route_id')['passenger_count'].agg(
        Q1 = lambda x: x.quantile(0.25),
        Q3 = lambda x: x.quantile(0.75)
    ).reset_index()
    bounds['IQR']         = bounds['Q3'] - bounds['Q1']
    bounds['lower_fence'] = bounds['Q1'] - 1.5 * bounds['IQR']
    bounds['upper_fence'] = bounds['Q3'] + 1.5 * bounds['IQR']

    df = df.merge(bounds[['route_id', 'lower_fence', 'upper_fence', 'IQR']], on='route_id')

    # Flag anomalies
    df['is_anomaly'] = ~df['passenger_count'].between(
        df['lower_fence'], df['upper_fence']
    )
    df['anomaly_direction'] = np.where(
        df['passenger_count'] > df['upper_fence'], 'High',
        np.where(df['passenger_count'] < df['lower_fence'], 'Low', 'Normal')
    )

    anomaly_count = df['is_anomaly'].sum()
    logger.info(f"Detected {anomaly_count} anomalies ({anomaly_count/len(df)*100:.1f}%)")
    return df

# ── Step 2: Summarize anomalies by route ──────────────────────────────────────
def build_anomaly_report(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize anomaly counts and rates per route."""
    anomalies = df[df['is_anomaly']].copy()

    summary = anomalies.groupby(['route_name', 'anomaly_direction']).agg(
        anomaly_count = ('trip_id', 'count'),
        avg_riders    = ('passenger_count', 'mean'),
        dates_affected= ('full_date', 'nunique')
    ).reset_index()

    # Add the route's normal bounds for context
    bounds_cols = df.groupby('route_name').agg(
        total_trips   = ('trip_id', 'count'),
        lower_fence   = ('lower_fence', 'first'),
        upper_fence   = ('upper_fence', 'first')
    ).reset_index()

    report = summary.merge(bounds_cols, on='route_name').round({
        'avg_riders': 1, 'lower_fence': 1, 'upper_fence': 1
    })
    return report.sort_values('anomaly_count', ascending=False)

# ── Step 3: Write flagged trips to the warehouse ──────────────────────────────
def persist_flags(df: pd.DataFrame, conn: sqlite3.Connection) -> None:
    """
    Write anomaly flags back to a dedicated table in the warehouse.
    This allows downstream SQL queries to join against anomaly data.
    """
    flagged = df[df['is_anomaly']][
        ['trip_id', 'route_id', 'full_date', 'passenger_count',
         'lower_fence', 'upper_fence', 'anomaly_direction']
    ].copy()
    flagged['detected_at'] = datetime.now().strftime('%Y-%m-%d %H:%M')

    flagged.to_sql('anomaly_flags', conn, if_exists='append', index=False)
    logger.info(f"Persisted {len(flagged):,} anomaly flags → anomaly_flags table")

# ── Step 4: Generate the report ───────────────────────────────────────────────
def generate_report(anomaly_summary: pd.DataFrame, output_dir: str) -> None:
    """Save CSV and print a text summary."""
    os.makedirs(output_dir, exist_ok=True)
    date_str = datetime.now().strftime('%Y%m%d')
    csv_path = os.path.join(output_dir, f"anomaly_report_{date_str}.csv")
    anomaly_summary.to_csv(csv_path, index=False)
    logger.info(f"Anomaly report saved → {csv_path}")

    print(f"\n{'='*55}")
    print(f"  ANOMALY REPORT — {datetime.now().strftime('%Y-%m-%d')}")
    print(f"{'='*55}")
    print(anomaly_summary.head(10).to_string(index=False))
    print(f"{'='*55}\n")

# ── Orchestrator ──────────────────────────────────────────────────────────────
def run_anomaly_pipeline() -> None:
    logger.info("Starting anomaly detection pipeline")
    conn = sqlite3.connect(DB_PATH)

    df      = detect_and_flag(conn, lookback_days=30)
    report  = build_anomaly_report(df)
    persist_flags(df, conn)
    conn.close()

    generate_report(report, REPORT_DIR)
    logger.info("Anomaly pipeline complete")

run_anomaly_pipeline()
~~~

The complete loop: **detect** (IQR bounds computed from recent history) → **flag** (each trip marked as Normal/High/Low) → **persist** (flags written to \`anomaly_flags\` table for SQL queries to join against) → **report** (CSV output and console summary). The \`anomaly_flags\` table is what makes this operational — future SQL queries can join to it to answer "which flagged routes also had OTP problems?"`,
      },
    ],
  },

  {
    week: 16,
    sql: [
      {
        title: 'Portfolio Defense — SQL Review Questions',
        content: `Week 16 is defense, not new material. These are the questions you should answer cold — without looking at your code. For each question, the "why it matters" section explains what the interviewer is actually testing.

**Foundations from Iliev's book:**

**Q: What does \`SELECT *\` return vs \`SELECT column_name\`? When would you use each?**
\`SELECT *\` returns every column. Use it only when exploring data interactively. In production queries, always name the columns you need — it documents intent, prevents breakage when tables gain new columns, and often improves performance by reducing data transfer.
*Why it matters: shows you understand the difference between exploration and production code.*

**Q: Iliev distinguishes NULL from empty string and zero. Explain the difference.**
NULL means "no value / unknown." An empty string is a known value (a string with zero characters). Zero is a known numeric value. \`WHERE revenue = 0\` and \`WHERE revenue IS NULL\` select completely different rows. Arithmetic with NULL produces NULL: \`5 + NULL = NULL\`.
*Why it matters: NULL handling is the source of some of the most subtle data bugs in production.*

**Q: What does a \`NOT NULL\` constraint do at the table level?**
It prevents any INSERT or UPDATE from leaving that column empty. The database engine enforces this — if your ETL tries to insert a row with a null \`route_id\`, the insert fails with an error, which is better than silently accepting bad data.
*Why it matters: constraints are your last line of defense against bad data in the warehouse.*

**Aggregation and grouping:**

**Q: What is the difference between WHERE and HAVING?**
WHERE filters rows before they're grouped. HAVING filters groups after aggregation. You can't use WHERE to filter on \`SUM(revenue)\` because the sum doesn't exist yet at the WHERE stage — rows haven't been grouped yet. Use HAVING for conditions on aggregate functions.
*Why it matters: this is one of the most common SQL interview questions. Get it right.*

**Q: When do \`COUNT(*)\` and \`COUNT(column_name)\` return different numbers?**
\`COUNT(*)\` counts all rows including those with NULL in any column. \`COUNT(column_name)\` counts only rows where that specific column is NOT NULL. If 100 trips have no \`driver_id\` assigned, \`COUNT(*)\` = 1000, \`COUNT(driver_id)\` = 900.
*Why it matters: silently undercounting due to NULLs is a common correctness bug.*

**JOINs:**

**Q: When does INNER JOIN exclude rows that LEFT JOIN would include?**
INNER JOIN excludes rows from the left table that have no match in the right table. LEFT JOIN keeps all left rows and fills unmatched right-side columns with NULL. Classic example: \`SELECT * FROM routes LEFT JOIN trips ON routes.route_id = trips.route_id WHERE trips.trip_id IS NULL\` — finds routes that have never run a trip.
*Why it matters: choosing the wrong join type silently drops data from your analysis.*

**Q: Write the LEFT JOIN pattern to find customers with no orders.**

~~~sql
SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;   -- NULL on right side = no match found
~~~

*Why it matters: this pattern — left join + IS NULL filter — is how you find "missing" records without a NOT IN subquery.*

**Performance and design:**

**Q: What does \`EXPLAIN QUERY PLAN\` tell you?**
It shows the execution strategy SQLite chose: whether it will SCAN the full table row by row, or SEARCH it using an index. "SCAN TABLE" on a large table is a red flag — it means every row is examined regardless of your WHERE filter. "SEARCH TABLE USING INDEX" means the engine jumped directly to matching rows.
*Why it matters: you can't optimize what you can't measure.*

**Q: What is a CTE and why is it more readable than a nested subquery?**
A CTE (\`WITH name AS (...)\`) gives an intermediate result set a name so you can reference it clearly. A nested subquery buries logic inside other logic, making it hard to read or debug incrementally. CTEs let you test each step independently.
*Why it matters: interviewers care that you can write maintainable code, not just correct code.*

**Capstone-specific:**

**Q: Walk through your Week 14 OTP dashboard query. Why does it use \`NULLIF()\`?**
\`NULLIF(x, 0)\` returns NULL when x is 0, which prevents division-by-zero in the OTP percentage calculation. If a route had all trips cancelled (zero operated trips), dividing on_time / operated would crash without NULLIF. Returning NULL instead of crashing is the correct behavior — it propagates "no data" rather than a wrong number.

**Q: In Week 15, what's the tradeoff between z-score and IQR for anomaly detection?**
Z-score uses mean and standard deviation — which are sensitive to extreme values. One day of unusually high ridership inflates both, making normal days look like low outliers. IQR uses quartiles, which are resistant to extreme values (the median doesn't move much when one tail is extreme). For skewed transit data, IQR is more robust. Z-score is fine when data is approximately normal.

**Q: What would break in your Week 13 ETL if the source table schema changed?**
Any column reference in the \`pd.read_sql()\` extract query that references a renamed or dropped column would raise an error. Any transform that relies on a column's data type (e.g., \`pd.to_datetime()\`) would fail if the column changed from string to integer. This is why production ETLs include schema validation at the extract step — check that expected columns exist and have expected types before proceeding.`,
      },
      {
        title: 'What to Bring to the Interview',
        content: `The capstone defense isn't just a test — it's a dress rehearsal for the technical interview you'll walk into at SunTran or your next employer. This section maps each phase of the 16 weeks to the portfolio talking points and interview evidence it produced.

**Phase 1: SQL Foundations (Weeks 1–6)**

*Talking point:* "I can write analytical SQL from scratch — filtering, aggregating, joining multiple tables, and expressing complex logic with CASE statements and CTEs."

*Evidence:* The CTE pipeline from Week 8 (multi-step regional analysis), the window function queries from Week 6 (RANK, NTILE, LAG for period-over-period comparison). Show these in a GitHub repo or a portfolio document.

*Question you should be ready for:* "Write a query that finds the top 3 revenue-generating routes for each region." — Window functions + RANK + PARTITION BY.

**Phase 2: Python + pandas Foundations (Weeks 1–8)**

*Talking point:* "I can use Python and pandas to load, clean, transform, and analyze tabular data. I know when to do work in SQL vs Python."

*Evidence:* The pandas pipeline from Week 9 showing extract → transform → aggregate → load. The pivot_table and merge examples from Weeks 8-9 showing reshaping fluency.

*Question you should be ready for:* "How would you join two DataFrames in pandas? What's the equivalent SQL?" — pd.merge() with how='left', and the SQL LEFT JOIN.

**Phase 3: Data Engineering (Weeks 9–12)**

*Talking point:* "I can write production-quality code — modular functions, error handling with logging, and clean readable code that someone else can maintain."

*Evidence:* The refactored script from Week 12 (before/after comparison shows awareness of code quality). The retry-with-logging pattern from Week 10.

*Question you should be ready for:* "If your ETL job failed at 2am, how would you know what went wrong?" — Structured logging to a file with timestamps and error context.

**Phase 4: Capstone (Weeks 13–16)**

*Talking point:* "I designed and built a complete data pipeline for SunTran — from schema design to ETL to KPI reporting to anomaly detection. I understand the end-to-end flow."

*Evidence:* The full star schema DDL from Week 13. The OTP dashboard query from Week 14. The anomaly detection pipeline from Week 15. These three artifacts together demonstrate full-stack data engineering capability.

*Questions you should be ready for:*
- "What is a fact table and what is a dimension table?"
- "Walk me through your ETL pipeline — what happens at each step?"
- "How does your anomaly detection work? Why did you choose IQR over z-score?"
- "If ridership dropped 40% on Route 7 yesterday, how would your system surface that?"

**How to present your portfolio:**

1. **Lead with the problem, not the code.** "SunTran needed a way to automatically flag routes with deteriorating on-time performance" is more compelling than "I wrote a Python script."
2. **Show the before/after** for any refactoring work. The contrast makes the value of clean code concrete.
3. **Be ready to explain one decision you made differently** — "I originally used z-score but switched to IQR because transit ridership is right-skewed, and the z-score was flagging normal weekdays as anomalies." This shows critical thinking, not just execution.
4. **Know your numbers** — how many routes, how many trips per day, what OTP threshold, what the anomaly rate was. Talking about real numbers signals you actually ran the code.`,
      },
    ],
    python: [
      {
        title: 'Portfolio Defense — Python Review Questions',
        content: `**From Sweigart's foundations — answer these cold:**

**Q: What is the difference between \`=\` and \`==\`?**
\`=\` is assignment: \`x = 5\` gives the variable x the value 5. \`==\` is comparison: \`x == 5\` returns True or False. Sweigart calls this one of the most common beginner mistakes because they look similar and both are valid syntax — so the bug doesn't always crash the program.
*Why it matters: using \`=\` inside a condition compiles but produces unexpected behavior in some contexts.*

**Q: What does a function return if it has no \`return\` statement?**
It returns \`None\` — Python's null value. This is also what you get from functions that only reach the end without hitting a \`return\`. A function that silently returns None when it should return a DataFrame is a common fragility bug.

**Q: What's the difference between a list and a dictionary? When do you use each?**
A list is an ordered sequence accessed by integer position: \`items[0]\`. A dictionary is a mapping of keys to values, accessed by key: \`store_names[101]\`. Use lists when order matters or you're iterating. Use dictionaries when you want fast lookup by a meaningful key.

**Q: Sweigart Chapter 3 — what is scope? What's the difference between local and global?**
A local variable exists only inside the function where it was created. A global variable exists at the module level and can be read from any function. Sweigart's guidance: prefer local variables and pass data explicitly as function parameters — it makes code easier to reason about.

**pandas foundations:**

**Q: What is a DataFrame? How does it differ from a list of lists?**
A DataFrame is a two-dimensional labeled data structure — rows and columns, like a SQL table in memory. Unlike a list of lists, columns have names and data types, you can index by label or condition, and all of pandas' vectorized operations are available. \`df['revenue'].sum()\` is one line; the same operation on a list of lists requires a loop.

**Q: Why does McKinney say "preference for data processing without for loops"?**
Python for loops execute one iteration at a time through the Python interpreter's overhead. Vectorized pandas/NumPy operations dispatch to compiled C code that processes entire arrays in a single call. On 1 million rows, vectorized operations are typically 50–500× faster than equivalent loops.

**Q: What does \`groupby().agg()\` do? Write the SQL equivalent.**
\`groupby()\` splits the DataFrame into groups based on one or more columns. \`agg()\` applies aggregation functions to each group and combines the results. SQL equivalent:

~~~python
df.groupby('store_id').agg(revenue=('revenue','sum'), orders=('order_id','count'))
# SQL: SELECT store_id, SUM(revenue) AS revenue, COUNT(order_id) AS orders
#      FROM df GROUP BY store_id;
~~~

**Q: What does \`fillna()\` do? When would you fill vs drop?**
\`fillna(value)\` replaces NaN values with a specified value. \`dropna()\` removes rows with NaN. Use fill when there's a meaningful replacement (e.g., fill missing \`passenger_count\` with 0 for cancelled trips). Use drop when the row without that value is useless for your analysis (e.g., a transaction with no \`revenue\` can't be analyzed).

**Integration questions:**

**Q: In your pipeline, when did you choose SQL vs pandas?**
SQL for filtering, joining, and initial aggregation — operations the database engine is optimized for, and where reducing data volume before Python sees it matters. Pandas for reshaping (pivot_table, melt), string cleaning, derived columns, statistical methods (IQR, rolling averages), and output formatting. The SQL vs Python decision framework from Week 9 guides this.

**Capstone questions:**

**Q: In Week 13, why do you load dimensions before facts?**
The fact table's foreign keys (\`date_id\`, \`route_id\`, \`driver_id\`) reference the dimension tables. If \`dim_route\` is empty when you try to insert into \`fact_trips\`, the foreign key constraint fires and the insert fails. Dimensions first ensures all the referenced keys exist before any fact rows reference them.

**Q: In Week 14, what threshold did you use for "on time"? What changes if SunTran uses 3 minutes?**
5 minutes — within 5 minutes of scheduled departure is "on time." If the threshold moved to 3 minutes, the OTP percentage would drop for every route (a stricter definition means fewer trips qualify). The SQL query would change in one place: \`CASE WHEN delay_minutes <= 3\`. The Python report threshold \`OTP_TARGET = 80.0\` stays the same — that's the target percentage, not the definition of on-time. Separating the two concerns (definition vs target) is why they're in different places.

**Q: What is the one skill from these 16 weeks you're least confident in? What's your plan?**
Be honest — this question comes up in real interviews. A thoughtful answer ("I'm less comfortable with performance tuning — I know how to read EXPLAIN QUERY PLAN but I haven't worked with tables large enough to make it a regular practice. I plan to practice on larger datasets.") is much better than a deflected non-answer.`,
      },
      {
        title: 'What You\'ve Actually Built',
        content: `Sixteen weeks of work. Before you defend it, step back and take stock of what exists that didn't exist before. This is the full stack you've built.

**Layer 1: The SQL Analytical Foundation (Weeks 1–8)**

You can now write SQL that does everything a working analyst needs: filter, group, aggregate, join multiple tables, handle NULLs, compute time-based metrics, use window functions for ranking and period-over-period analysis, use CTEs for step-by-step query decomposition, and work with set operations (UNION, INTERSECT, EXCEPT). You can read EXPLAIN QUERY PLAN and create the right indexes to fix a slow query.

This covers the content of Iliev's full SQL book plus the advanced analytics patterns from McKinney's SQL-adjacent chapters.

**Layer 2: The Python Data Pipeline (Weeks 1–12)**

You can write Python scripts that are production-quality — not just working, but maintainable. Specifically:
- Load data from SQLite with \`pd.read_sql()\`
- Clean and transform DataFrames using pandas idioms (no loops)
- Aggregate with \`groupby().agg()\` using named aggregations
- Reshape with \`pivot_table()\` and \`melt()\`
- Handle time series with \`resample()\` and \`rolling()\`
- Write modular, single-responsibility functions
- Handle errors gracefully with try/except and structured logging
- Profile and optimize slow code

This covers Sweigart's automation mindset plus McKinney's data wrangling toolkit.

**Layer 3: The SunTran Analytics Warehouse (Weeks 13–16)**

You designed and built a complete data warehouse for public transit analytics:

~~~
/warehouse.db
├── dim_date      (1,096 rows — every day 2023–2025 with all calendar attributes)
├── dim_route     (SunTran routes with type and status)
├── dim_driver    (driver master data)
├── dim_stop      (bus stops with coordinates)
└── fact_trips    (one row per trip departure — the analytical grain)
~~~

**Layer 4: The ETL Pipeline (Week 13)**

\`SunTranETL\` class: extract from operational database → validate (null checks, range checks, referential integrity) → transform (parse dates, derive date_id, standardize strings) → load to warehouse. Supports full and incremental modes. Logs every step with timestamps.

**Layer 5: The KPI Reporting System (Week 14)**

Two artifacts:
1. **SQL**: The OTP dashboard query — a 5-CTE query that computes on-time performance, headway, load factor, and period-over-period comparison in one statement. This is the SQL you'd connect to Tableau.
2. **Python**: The weekly report generator — pulls from the warehouse, classifies routes by performance tier, produces CSV files and a formatted text summary. Scheduled to run every Monday morning.

**Layer 6: The Anomaly Detection System (Week 15)**

Three-part system:
1. **SQL alerting queries**: Three queries designed to surface OTP failures, ridership drops, and cancellation spikes when run on a schedule. Zero rows = no issues.
2. **Python IQR detector**: Computes per-route IQR bounds, flags every trip as Normal/High/Low.
3. **Full pipeline**: detect → persist flags to \`anomaly_flags\` table → generate report → log results. Future SQL queries can join \`fact_trips\` to \`anomaly_flags\` to correlate OTP problems with ridership anomalies.

**What this stack demonstrates:**

- **Schema design**: Kimball star schema with fact and dimension tables, proper foreign keys, generated columns, and indexes
- **Data engineering**: ETL with validation, error handling, incremental loading, and structured logging
- **SQL analytics**: multi-CTE pipelines, window functions, period-over-period analysis, statistical anomaly detection
- **Python engineering**: modular design, vectorization, profiling, automated reporting
- **Domain knowledge**: transit KPIs (OTP, headway, load factor, revenue per rider), SunTran operational context

That is a data analyst portfolio. Own it.`,
      },
    ],
  },
]

export function getWeekLesson(week: number): WeekLesson | undefined {
  return LESSONS.find(l => l.week === week)
}
