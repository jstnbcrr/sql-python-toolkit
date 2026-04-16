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
        content: `CASE is SQL's if/else. Iliev's book covers conditional expressions as a way to transform data inline rather than filtering it out.

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

CASE evaluates top-to-bottom and stops at the first true condition — same as Python's if/elif/else. The ELSE is optional; without it unmatched rows get NULL.

Simplified form when checking equality on one column:

~~~sql
SELECT
    category,
    CASE category
        WHEN 'Entrees' THEN 'Main Dish'
        WHEN 'Sides'   THEN 'Side Dish'
        WHEN 'Drinks'  THEN 'Beverage'
        ELSE 'Other'
    END AS category_label
FROM inventory;
~~~

CASE inside aggregate functions — very powerful:

~~~sql
-- Count only rows meeting a condition (like a conditional COUNT)
SELECT
    COUNT(*) AS total_items,
    SUM(CASE WHEN price > 5 THEN 1 ELSE 0 END) AS premium_count
FROM inventory;
~~~`,
      },
      {
        title: 'COALESCE and NULL Handling',
        content: `Iliev explains NULL in the context of the table definition: "By default, each column in your table can hold NULL values." In practice, this means real data is full of NULLs that need to be handled before analysis.

\`COALESCE\` returns the first non-NULL value from its list of arguments:

~~~sql
-- Replace NULL notes with a default
SELECT
    order_id,
    COALESCE(notes, 'No special instructions') AS notes
FROM orders;

-- Try multiple fallback columns
SELECT
    customer_id,
    COALESCE(phone_mobile, phone_home, 'No phone on file') AS contact
FROM customers;
~~~

\`NULLIF\` is the inverse — returns NULL if two values are equal, otherwise returns the first value. Used to avoid division by zero:

~~~sql
-- Safe division: if denominator is 0, return NULL instead of crashing
SELECT
    store_id,
    SUM(revenue) / NULLIF(COUNT(*), 0) AS avg_order_value
FROM sales
GROUP BY store_id;
~~~

String functions Iliev covers for data cleaning:

~~~sql
SELECT
    UPPER(item_name)       AS name_upper,
    LOWER(category)        AS category_lower,
    TRIM(item_name)        AS name_no_whitespace,
    LENGTH(item_name)      AS name_length,
    SUBSTR(item_name,1,6)  AS first_six_chars
FROM inventory;
~~~`,
      },
    ],
    python: [
      {
        title: 'pandas — Introduction from McKinney',
        content: `McKinney opens the pandas chapter: "pandas will be a major tool of interest throughout much of the rest of the book. It contains data structures and data manipulation tools designed to make data cleaning and analysis fast and convenient in Python."

The core object is the **DataFrame** — a 2D labeled table. McKinney: "pandas adopts significant parts of NumPy's idiomatic style of array-based computing, especially array-based functions and a preference for data processing without for loops."

~~~python
import pandas as pd

# DataFrame from a dictionary (each key is a column)
data = {
    'item_name': ['Orange Chicken', 'Fried Rice', 'Chow Mein'],
    'category':  ['Entrees', 'Sides', 'Sides'],
    'price':     [6.99, 3.99, 3.99],
    'calories':  [490, 520, 510],
}

df = pd.DataFrame(data)
print(df)
print(df.dtypes)        # column data types
print(df.shape)         # (rows, columns) as a tuple
print(df.head(2))       # first 2 rows (default is 5)
print(df.tail(2))       # last 2 rows
print(df.describe())    # summary statistics for numeric columns
~~~

McKinney: "The biggest difference [from NumPy] is that pandas is designed for working with tabular or heterogeneous data" — meaning columns can have different types, just like a database table.

In this app, your weekly dataset is already loaded as \`df\`. Run \`print(df.head())\` to see what you're working with.`,
      },
      {
        title: 'Handling Missing Data — McKinney Chapter 7',
        content: `McKinney's data cleaning chapter opens: "During the course of doing data analysis and modeling, a significant amount of time is spent on data preparation: loading, cleaning, transforming, and rearranging. Such tasks are often reported to take up 80% or more of an analyst's time."

pandas uses \`NaN\` (Not a Number) for missing values — Python's equivalent of SQL's NULL:

~~~python
# Detect missing values
print(df.isnull().sum())      # count NaNs per column
print(df.isnull().any())      # True/False — does each column have any NaN?

# From McKinney's dropna section:
df_clean = df.dropna()                     # drop rows with ANY NaN
df_clean = df.dropna(subset=['price'])     # drop only where price is NaN

# From McKinney's fillna section:
df['notes'] = df['notes'].fillna('No instructions')     # fill with constant
df['price'] = df['price'].fillna(df['price'].mean())    # fill with average
~~~

McKinney on the decision: "For numeric data, a common choice is to fill NaN with the mean or median of the column. For categorical data, the most frequent value or a specific sentinel value is typical." The right choice depends on the business context — document your decision.

String cleaning with the \`.str\` accessor McKinney introduces:

~~~python
df['category'] = df['category'].str.strip()   # remove whitespace
df['category'] = df['category'].str.lower()   # standardize case
print(df['category'].value_counts())           # check what's in there
~~~`,
      },
    ],
  },

  // ─── WEEK 6 ──────────────────────────────────────────────────────────────────
  {
    week: 6,
    sql: [
      {
        title: 'Subqueries and CTEs',
        content: `A subquery is a SELECT inside another SELECT. The inner query runs first and its result feeds into the outer query:

~~~sql
-- Employees earning more than the company average
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
~~~

Subqueries in the FROM clause (inline views) let you filter on aggregate results:

~~~sql
SELECT dept, avg_score
FROM (
    SELECT department AS dept, AVG(review_score) AS avg_score
    FROM employees
    GROUP BY department
) AS dept_averages
WHERE avg_score > 80;
~~~

**CTEs (Common Table Expressions)** — the WITH clause names a subquery so you can reference it by name. Easier to read than nested subqueries:

~~~sql
WITH dept_averages AS (
    SELECT department, AVG(review_score) AS avg_score
    FROM employees
    GROUP BY department
)
SELECT
    e.name,
    e.review_score,
    d.avg_score       AS dept_average,
    e.review_score - d.avg_score AS above_avg_by
FROM employees e
JOIN dept_averages d ON e.department = d.department
ORDER BY above_avg_by DESC;
~~~

CTEs can chain — later CTEs can reference earlier ones. They don't change performance in SQLite but make complex queries dramatically more readable. Senior engineers default to CTEs for anything non-trivial.`,
      },
      {
        title: 'Window Functions',
        content: `Window functions compute a value for each row using a related set of rows — without collapsing the results the way GROUP BY does. This is the key distinction:

~~~sql
SELECT
    name,
    department,
    review_score,
    RANK() OVER (PARTITION BY department ORDER BY review_score DESC) AS dept_rank,
    AVG(review_score) OVER (PARTITION BY department) AS dept_average
FROM employees;
~~~

Breaking down the syntax:
- \`RANK()\` — the function being computed
- \`OVER (...)\` — defines the window (which rows to look at)
- \`PARTITION BY department\` — restart the calculation for each department
- \`ORDER BY review_score DESC\` — determines the ranking order within each partition

The result: every employee row is preserved AND each row now knows its rank within its department AND the department's average. GROUP BY would have collapsed to one row per department. Window functions give you both individual and group context simultaneously.

Common window functions:
- \`ROW_NUMBER()\` — unique sequential number, no ties
- \`RANK()\` — ranking with gaps (two 1st place means no 2nd place)
- \`DENSE_RANK()\` — ranking without gaps
- \`LAG(col, n)\` — value from n rows before this one
- \`LEAD(col, n)\` — value from n rows after this one`,
      },
    ],
    python: [
      {
        title: 'pandas groupby — McKinney Chapter 10',
        content: `McKinney opens Chapter 10: "Categorizing a dataset and applying a function to each group, whether an aggregation or transformation, can be a critical component of a data analysis workflow."

He describes the **split-apply-combine** pattern: split the data into groups, apply a function to each group, combine the results back.

~~~python
# Total revenue by category
by_category = df.groupby('category')['revenue'].sum()
print(by_category)

# Multiple aggregations with agg() — McKinney's preferred approach
summary = df.groupby('department').agg(
    avg_score  = ('review_score', 'mean'),
    max_score  = ('review_score', 'max'),
    headcount  = ('name',         'count')
)
print(summary)
~~~

McKinney: "One reason for the popularity of relational databases and SQL is the ease with which data can be joined, filtered, transformed, and aggregated. However, query languages like SQL impose certain limitations on the kinds of group operations that can be performed. With the expressiveness of Python and pandas, we can perform quite complex group operations by expressing them as custom Python functions."

Reset the index to get a flat DataFrame:

~~~python
summary = df.groupby('category')['revenue'].sum().reset_index()
# Now 'category' is a regular column, not the index
~~~`,
      },
      {
        title: 'Boolean Indexing and loc/iloc — McKinney Chapter 5',
        content: `McKinney covers data selection as one of the most important pandas skills. Boolean indexing is the pandas equivalent of SQL's WHERE clause:

~~~python
# Filter rows where score > 80
high_scores = df[df['review_score'] > 80]

# Multiple conditions — wrap each in parentheses, use & for AND, | for OR
top_eng = df[(df['department'] == 'Engineering') & (df['review_score'] >= 90)]
~~~

McKinney on \`loc\` — label-based selection by row and column name:

~~~python
# All rows, specific columns
df.loc[:, ['name', 'department', 'review_score']]

# Rows where condition is True, specific columns
df.loc[df['review_score'] > 85, ['name', 'review_score']]
~~~

And \`iloc\` — position-based selection by integer position:

~~~python
df.iloc[0]           # first row as a Series
df.iloc[0:5]         # first 5 rows
df.iloc[:, 0:3]      # all rows, first 3 columns
df.iloc[0, 2]        # specific cell: row 0, column 2
~~~

McKinney's guidance: use boolean indexing for conditional filtering (most common in analysis), \`loc\` when you know the label, \`iloc\` when you know the position.`,
      },
    ],
  },

  // ─── WEEK 7 ──────────────────────────────────────────────────────────────────
  {
    week: 7,
    sql: [
      {
        title: 'Date Functions in SQLite',
        content: `SQLite stores dates as ISO-format text (\`YYYY-MM-DD\`) or Unix timestamps. The \`strftime()\` function formats and extracts date parts.

~~~sql
SELECT
    sale_date,
    strftime('%Y', sale_date)    AS year,
    strftime('%m', sale_date)    AS month,
    strftime('%d', sale_date)    AS day,
    strftime('%w', sale_date)    AS day_of_week   -- 0=Sunday, 6=Saturday
FROM sales;
~~~

Group by time period:

~~~sql
-- Revenue by month
SELECT
    strftime('%Y-%m', sale_date) AS month,
    SUM(revenue)                 AS monthly_revenue,
    COUNT(*)                     AS transaction_count
FROM sales
GROUP BY strftime('%Y-%m', sale_date)
ORDER BY month;
~~~

Date range filtering — ISO-format dates sort alphabetically which matches chronological order:

~~~sql
SELECT * FROM sales
WHERE sale_date >= '2024-01-01'
  AND sale_date <  '2024-04-01';
~~~

Date arithmetic with \`julianday()\` — converts a date to a decimal day number. Subtracting two gives days between them:

~~~sql
-- Days since last order for each customer
SELECT
    customer_id,
    MAX(order_date) AS last_order,
    ROUND(julianday('now') - julianday(MAX(order_date))) AS days_since
FROM orders
GROUP BY customer_id;
~~~`,
      },
      {
        title: 'LAG and Period-over-Period Analysis',
        content: `LAG lets you reference a previous row's value. This is how you calculate period-over-period change — comparing this month to last month, this week to last week:

~~~sql
WITH monthly AS (
    SELECT
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue)                 AS revenue
    FROM sales
    GROUP BY month
)
SELECT
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month)  AS prev_month,
    revenue - LAG(revenue, 1) OVER (ORDER BY month) AS change,
    ROUND(
        100.0 * (revenue - LAG(revenue, 1) OVER (ORDER BY month))
        / LAG(revenue, 1) OVER (ORDER BY month),
        1
    ) AS pct_change
FROM monthly;
~~~

\`LAG(revenue, 1)\` means "the value of revenue from 1 row back." The \`OVER (ORDER BY month)\` defines the ordering — what "previous" means.

The first month will have NULL for \`prev_month\` because there's no row before it. Handle this with COALESCE if the NULL causes issues downstream.

LEAD works the same way but looks forward instead of back — useful for calculating time until next event, or flagging upcoming renewals.`,
      },
    ],
    python: [
      {
        title: 'Time Series with pandas — McKinney Chapter 11',
        content: `McKinney Chapter 11: "Time series data is an important form of structured data in many different fields, including finance, economics, ecology, neuroscience, and physics."

Convert a column to datetime and set it as the index:

~~~python
import pandas as pd

df['sale_date'] = pd.to_datetime(df['sale_date'])
df = df.set_index('sale_date')
~~~

**resample()** — McKinney's method for time-based aggregation. "Similar in spirit to groupby, it involves splitting the time series, applying a function, and combining the results":

~~~python
monthly = df['revenue'].resample('ME').sum()    # month-end totals
weekly  = df['revenue'].resample('W').sum()     # weekly totals
daily   = df['revenue'].resample('D').sum()     # daily totals (fills gaps with NaN)
~~~

Frequency strings from McKinney: \`'D'\` day, \`'W'\` week, \`'ME'\` month end, \`'QE'\` quarter end, \`'YE'\` year end.

**rolling()** — compute a moving window calculation:

~~~python
# 4-week rolling average — smooths out weekly noise to show trend
rolling_avg = df['revenue'].resample('W').sum().rolling(window=4).mean()
print(rolling_avg)
~~~

**pct_change()** — McKinney's built-in for period-over-period percent change:

~~~python
monthly_rev = df['revenue'].resample('ME').sum()
mom_change  = monthly_rev.pct_change() * 100    # multiply by 100 for %
print(mom_change.round(1))
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
        content: `UNION combines result sets from two SELECT statements. Both queries must return the same number of columns with compatible types.

~~~sql
-- All top products from East and West, labeled by region
SELECT product_id, product_name, 'East' AS region
FROM east_top_products
UNION
SELECT product_id, product_name, 'West' AS region
FROM west_top_products;
~~~

\`UNION\` removes duplicates. \`UNION ALL\` keeps all rows including duplicates. Always prefer \`UNION ALL\` when you know there are no duplicates or want to keep them — it skips the deduplication step and runs faster.

~~~sql
-- Combine all three regional lists, keep everything
SELECT product_id, 'East'    AS region FROM east_top_ten
UNION ALL
SELECT product_id, 'Central' AS region FROM central_top_ten
UNION ALL
SELECT product_id, 'West'    AS region FROM west_top_ten;
~~~`,
      },
      {
        title: 'INTERSECT and EXCEPT',
        content: `**INTERSECT** — returns only rows that appear in BOTH result sets:

~~~sql
-- Products in the top 10 in BOTH East AND West
SELECT product_id FROM east_top_ten
INTERSECT
SELECT product_id FROM west_top_ten;
~~~

**EXCEPT** — returns rows from the first result that do NOT appear in the second:

~~~sql
-- Products in East top 10 but NOT in West
SELECT product_id FROM east_top_ten
EXCEPT
SELECT product_id FROM west_top_ten;
~~~

Draw the Venn diagram before writing the query. UNION = both circles. INTERSECT = overlap only. EXCEPT = left circle minus the overlap.

In practice, senior analysts often replace INTERSECT/EXCEPT with equivalent JOIN patterns for more control:

~~~sql
-- INTERSECT equivalent using JOIN
SELECT e.product_id
FROM east_top_ten e
INNER JOIN west_top_ten w ON e.product_id = w.product_id;

-- EXCEPT equivalent using LEFT JOIN + IS NULL
SELECT e.product_id
FROM east_top_ten e
LEFT JOIN west_top_ten w ON e.product_id = w.product_id
WHERE w.product_id IS NULL;
~~~`,
      },
    ],
    python: [
      {
        title: 'Python Sets and Data Wrangling — McKinney Chapter 8',
        content: `Python's built-in \`set\` type implements the same operations as SQL's set operators:

~~~python
east_top  = {101, 102, 103, 104, 105, 106, 107, 108, 109, 110}
west_top  = {104, 105, 106, 107, 108, 111, 112, 113, 114, 115}

east_top | west_top    # UNION — everything in either set
east_top & west_top    # INTERSECT — only in both sets
east_top - west_top    # EXCEPT — in east but not west
~~~

Apply to DataFrame columns:

~~~python
east_ids = set(east_df['product_id'])
west_ids = set(west_df['product_id'])

universal  = east_ids & west_ids         # in both regions
east_only  = east_ids - west_ids         # east exclusive
~~~

**pivot_table** — McKinney Chapter 10 covers this as reshaping data from long format to wide format:

~~~python
# Long format: one row per (product, region) combination
sales = pd.DataFrame({
    'product': ['OC', 'OC', 'FR', 'FR'],
    'region':  ['East', 'West', 'East', 'West'],
    'revenue': [1200, 980, 750, 820],
})

# Wide format: products as rows, regions as columns
pivot = sales.pivot_table(
    values='revenue',
    index='product',
    columns='region',
    aggfunc='sum',
    fill_value=0
)
print(pivot)
~~~

McKinney: "Pivot tables are a way to aggregate and reshape data simultaneously." The result is one row per product with one column per region — an immediate visual comparison.`,
      },
    ],
  },

  // ─── WEEK 9 ──────────────────────────────────────────────────────────────────
  {
    week: 9,
    sql: [
      {
        title: 'Views and Pipeline Query Design',
        content: `A view is a saved SELECT query stored in the database. Query it like a table — the underlying SELECT runs fresh each time:

~~~sql
CREATE VIEW monthly_store_revenue AS
SELECT
    strftime('%Y-%m', sale_date) AS month,
    store_id,
    SUM(revenue)  AS total_revenue,
    COUNT(*)      AS transaction_count
FROM transactions
GROUP BY month, store_id;

-- Query it like any table
SELECT *
FROM monthly_store_revenue
WHERE month >= '2024-01'
ORDER BY month, total_revenue DESC;
~~~

Views enforce consistent metric definitions. "Monthly revenue" means the same thing to every query that uses this view.

**Full pipeline with CTEs** — the professional pattern for complex analytical queries:

~~~sql
-- Step 1: extract raw data
WITH raw AS (
    SELECT t.*, s.store_name, s.region
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
    WHERE t.sale_date >= date('now', '-90 days')
),
-- Step 2: enrich with calculated fields
enriched AS (
    SELECT *,
        CASE WHEN revenue > 50 THEN 'large' ELSE 'standard' END AS order_size
    FROM raw
),
-- Step 3: aggregate
summary AS (
    SELECT store_name, region,
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue) AS revenue, COUNT(*) AS orders
    FROM enriched
    GROUP BY store_name, region, month
)
SELECT * FROM summary ORDER BY month, revenue DESC;
~~~

Each CTE is one step. You can test each independently by running just that CTE's SELECT.`,
      },
    ],
    python: [
      {
        title: 'The Full pandas Pipeline — McKinney Integration',
        content: `McKinney's book is built around this workflow: load data from a source, clean it, transform it, analyze it. \`pd.read_sql()\` is the bridge between SQL and pandas:

~~~python
import pandas as pd
import sqlite3

# EXTRACT — pull from SQLite using a SQL query
conn = sqlite3.connect('/dataset.db')
df = pd.read_sql("""
    SELECT t.*, s.store_name, s.region
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
    WHERE t.sale_date >= date('now', '-90 days')
""", conn)
conn.close()

# TRANSFORM — McKinney's data prep pipeline
df['sale_date']  = pd.to_datetime(df['sale_date'])
df['month']      = df['sale_date'].dt.to_period('M').astype(str)
df['unit_price'] = df['revenue'] / df['quantity'].replace(0, pd.NA)
df = df.dropna(subset=['revenue'])

# AGGREGATE — McKinney's groupby pattern
summary = df.groupby(['store_name', 'month']).agg(
    total_revenue = ('revenue', 'sum'),
    order_count   = ('transaction_id', 'count'),
    avg_order     = ('revenue', 'mean')
).reset_index()

print(summary.sort_values('total_revenue', ascending=False).head(10))
~~~

Use SQL for what it does best (filtering, joining, initial aggregation). Use pandas for what it does best (reshaping, cleaning, advanced transformations, visualization prep). This is the real-world analyst workflow.`,
      },
    ],
  },

  // ─── WEEK 10 ─────────────────────────────────────────────────────────────────
  {
    week: 10,
    sql: [
      {
        title: 'INSERT, UPDATE, DELETE — Iliev\'s DML Section',
        content: `Iliev covers data modification statements thoroughly. These are less common in analysis but essential to understand.

**INSERT** — from Iliev's book:

~~~sql
INSERT INTO menu (item_name, category, price, calories)
VALUES ('Honey Walnut Shrimp', 'Entrees', 8.99, 370);
~~~

Iliev's rundown: "INSERT INTO — specifies the table. The column list tells MySQL which columns to insert into. VALUES — the actual data."

**UPDATE** — Iliev: "In order to modify data in your database, you could use the UPDATE statement":

~~~sql
UPDATE menu
SET price = 7.49
WHERE name = 'Orange Chicken';
~~~

Iliev's warning: "If we don't specify a WHERE clause, all of the entries from the table will be affected." Always include a WHERE clause unless you intentionally want to update every row.

**DELETE** — Iliev: "The DELETE statement would remove data from your database":

~~~sql
DELETE FROM menu_items WHERE id = 12;
~~~

Same warning applies: DELETE without WHERE deletes everything. In production systems you'd use a transaction to wrap modifications so you can roll back if something goes wrong.

**Comments** — Iliev covers inline and block comments:

~~~sql
SELECT * FROM menu_items; -- Get all menu items

/*
  This query pulls active items only.
  Updated 2024-01 by Justin Becerra
*/
SELECT * FROM menu_items WHERE active = 1;
~~~`,
      },
    ],
    python: [
      {
        title: 'Modular Script Design — Sweigart Principles',
        content: `Sweigart's Chapter 3 principle applied to scripts: "A major purpose of functions is to group code that gets executed multiple times. Without a function defined, you would have to copy and paste this code each time."

Applied to reporting scripts:

~~~python
import sqlite3
import pandas as pd
from datetime import datetime
import time

DB_PATH = '/dataset.db'

def get_connection(path):
    """Return a database connection. One job: connect."""
    return sqlite3.connect(path)

def fetch_daily_sales(conn, date_str):
    """Pull all transactions for a given date."""
    return pd.read_sql(
        "SELECT * FROM transactions WHERE sale_date = ?",
        conn,
        params=[date_str]
    )

def summarize_by_category(df):
    """Aggregate revenue and order count by category."""
    return df.groupby('category').agg(
        revenue = ('revenue', 'sum'),
        orders  = ('transaction_id', 'count')
    ).reset_index()

def save_report(df, path):
    """Save DataFrame as CSV."""
    df.to_csv(path, index=False)
    print(f"  Saved: {path}")

def run():
    today = datetime.now().strftime('%Y-%m-%d')
    t0    = time.time()

    print(f"Running report for {today}...")
    conn    = get_connection(DB_PATH)
    sales   = fetch_daily_sales(conn, today)
    print(f"  {len(sales)} transactions in {time.time()-t0:.2f}s")

    summary = summarize_by_category(sales)
    save_report(summary, f"report_{today}.csv")
    conn.close()
    print(f"Done in {time.time()-t0:.2f}s total")

run()
~~~

Sweigart's approach: each function does one thing, has a clear name, and can be tested independently. The \`run()\` function at the bottom wires everything together.`,
      },
      {
        title: 'Error Handling — Sweigart Chapter 3',
        content: `Sweigart's Chapter 3 introduces \`try\`/\`except\` as the mechanism for handling runtime errors gracefully. His example uses \`ZeroDivisionError\`. The same pattern handles database errors:

~~~python
def safe_query(db_path, query, params=None):
    """
    Run a query safely. Returns DataFrame or None on failure.
    Sweigart's pattern: try the operation, catch specific exceptions.
    """
    try:
        conn = sqlite3.connect(db_path)
        df   = pd.read_sql(query, conn, params=params or [])
        conn.close()
        return df

    except sqlite3.OperationalError as e:
        print(f"[ERROR] Database error: {e}")
        return None

    except FileNotFoundError:
        print(f"[ERROR] Database not found at: {db_path}")
        return None

    except Exception as e:
        print(f"[ERROR] Unexpected: {type(e).__name__}: {e}")
        return None

# Caller checks the return value
result = safe_query('/dataset.db', "SELECT * FROM transactions LIMIT 5")
if result is not None:
    print(result)
else:
    print("Query failed — check errors above")
~~~

Sweigart's principle: list more specific exceptions first. The bare \`except Exception\` at the end is the catch-all. Never use a bare \`except:\` with no exception type — it catches keyboard interrupts and other signals you usually don't want to swallow.`,
      },
    ],
  },

  // ─── WEEK 11 ─────────────────────────────────────────────────────────────────
  {
    week: 11,
    sql: [
      {
        title: 'EXPLAIN QUERY PLAN and Indexing',
        content: `Iliev's book covers indexes in the table design section: "As the volume of data grows, searching by attributes other than the primary key can become increasingly slow. To optimize such queries, you can introduce an INDEX on specific columns."

\`EXPLAIN QUERY PLAN\` shows what the database actually does to execute a query:

~~~sql
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE customer_id = 12345;
~~~

What to look for:
- **SCAN TABLE** — reads every row. Slow on large tables.
- **SEARCH TABLE USING INDEX** — jumped directly to matching rows. Fast.

Create an index when you see SCAN on a column you filter or join on:

~~~sql
-- Iliev's syntax: CREATE INDEX name ON table(column)
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date     ON transactions(sale_date);

-- Multi-column index for queries that filter on both
CREATE INDEX idx_transactions_store_date ON transactions(store_id, sale_date);
~~~

Verify it worked:

~~~sql
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE customer_id = 12345;
-- Should now show: SEARCH TABLE USING INDEX
~~~

Iliev's guidance: "For queries filtering on multiple columns, consider a composite index with the most selective column first." Add indexes on columns in WHERE clauses, JOIN conditions, and ORDER BY. Don't index every column — indexes slow down writes and use disk space.`,
      },
    ],
    python: [
      {
        title: 'Vectorization — McKinney\'s Core Principle',
        content: `McKinney's pandas book is built on one core idea he states in Chapter 5: "pandas adopts significant parts of NumPy's idiomatic style of array-based computing, especially array-based functions and a **preference for data processing without for loops**."

That last phrase is the key. Python loops are slow on large data. Vectorized operations process entire columns at once using optimized C code under the hood:

~~~python
import numpy as np
import time

n = 1_000_000
prices = np.random.uniform(1, 20, n)

# SLOW — Python loop
t0    = time.time()
total = 0
for p in prices:
    total += p * 0.08
print(f"Loop: {time.time()-t0:.3f}s")

# FAST — vectorized (McKinney's preferred approach)
t0    = time.time()
total = (prices * 0.08).sum()
print(f"Vectorized: {time.time()-t0:.3f}s")
~~~

Typical speedup: 50–500x. Applied to pandas DataFrames:

~~~python
# Slow: apply() calls a Python function row by row
df['tax'] = df['price'].apply(lambda x: x * 0.08)

# Fast: vectorized operation on the whole column at once
df['tax'] = df['price'] * 0.08

# Also fast: multiple columns at once
df['revenue_after_tax'] = df['revenue'] * (1 - df['tax_rate'])
~~~

McKinney's rule of thumb: if you find yourself writing a for loop over DataFrame rows, there is almost certainly a vectorized equivalent. Look for it.`,
      },
    ],
  },

  // ─── WEEK 12 ─────────────────────────────────────────────────────────────────
  {
    week: 12,
    sql: [
      {
        title: 'Query Readability and Code Review Mindset',
        content: `Iliev's book consistently formats queries for readability — each clause on its own line, consistent indentation. This isn't style preference; it's maintenance discipline.

**Before** (how junior analysts often write):

~~~sql
select a.name,b.total,sum(c.revenue) from customers a,orders b,transactions c where a.id=b.customer_id and b.id=c.order_id and c.date>'2024-01-01' group by a.name,b.total having sum(c.revenue)>100 order by 3 desc
~~~

**After** (readable, maintainable):

~~~sql
SELECT
    c.name,
    o.id            AS order_id,
    SUM(t.revenue)  AS total_revenue
FROM customers c
JOIN orders       o ON c.id          = o.customer_id
JOIN transactions t ON o.id          = t.order_id
WHERE t.sale_date > '2024-01-01'
GROUP BY c.name, o.id
HAVING SUM(t.revenue) > 100
ORDER BY total_revenue DESC;
~~~

Rules:
- One clause per line
- Meaningful aliases (c for customers, not a)
- Always name aggregates with AS
- Never ORDER BY column position (ORDER BY 3) — use the column name
- Add a comment explaining what the query does and why
- The next person reading this query might be you in six months`,
      },
    ],
    python: [
      {
        title: 'Code Review — Four Categories of Issues',
        content: `Sweigart's book teaches programming by showing you working code and explaining how it works. Code review is the inverse — reading existing code and finding what's wrong. Four categories:

**1. Correctness bugs** — code that produces wrong results without crashing:

~~~python
# Bug: divides by fixed 12 regardless of how many months have data
average = sum(monthly_revenues) / 12

# Fix: divide by actual count of non-None values
average = sum(r for r in monthly_revenues if r is not None) / \
          len([r for r in monthly_revenues if r is not None])
# Or with pandas: monthly_series.mean() (ignores NaN automatically)
~~~

**2. Readability** — code that works but no one can understand:

~~~python
# Unreadable
x = [i for i in d if d[i] > t]

# Readable
high_revenue_stores = [
    store_id for store_id, revenue in daily_totals.items()
    if revenue > revenue_threshold
]
~~~

**3. Fragility** — code that breaks on edge cases:

~~~python
# Crashes if list is empty
first = items[0]

# Safe — Sweigart's defensive pattern
first = items[0] if items else None
~~~

**4. Inefficiency** — loops where vectorization is available (Week 11).

When you comment a change, explain the WHY. "Changed /12 to /len()" is obvious. "Fixed: months with no data were counted in denominator but excluded from sum, causing the average to be understated" is useful.`,
      },
    ],
  },

  // ─── WEEKS 13–16: Capstone Phases ────────────────────────────────────────────
  {
    week: 13,
    sql: [
      {
        title: 'Dimensional Modeling — The Kimball Approach',
        content: `Ralph Kimball's Data Warehouse Toolkit (the PDF in your Downloads folder) defines the star schema: a central fact table surrounded by dimension tables. This is the standard model for analytical databases.

**Fact table** — stores measurable events. Wide with many rows. Contains numeric measures + foreign keys pointing to dimensions:

~~~sql
CREATE TABLE fact_sales (
    sale_id     INTEGER PRIMARY KEY,
    date_id     INTEGER REFERENCES dim_date(date_id),
    store_id    INTEGER REFERENCES dim_store(store_id),
    product_id  INTEGER REFERENCES dim_product(product_id),
    quantity    INTEGER,
    revenue     REAL,
    discount    REAL
);
~~~

**Dimension tables** — describe the who, what, where, when of your facts:

~~~sql
CREATE TABLE dim_date (
    date_id   INTEGER PRIMARY KEY,
    full_date TEXT,
    year      INTEGER,
    quarter   INTEGER,
    month     INTEGER,
    day_name  TEXT
);

CREATE TABLE dim_product (
    product_id   INTEGER PRIMARY KEY,
    product_name TEXT,
    category     TEXT,
    unit_cost    REAL
);
~~~

The "star" comes from the fact table in the center with dimensions radiating out. Analytical queries join fact to whichever dimensions you need. Load dimensions first (they're referenced by the fact table), then load facts.`,
      },
    ],
    python: [
      {
        title: 'ETL Pipeline — Extract, Transform, Load',
        content: `An ETL pipeline moves data from a source system into your analytics structure. McKinney's data wrangling chapters are the Python side of this. The class structure keeps each step separate:

~~~python
import sqlite3
import pandas as pd

class ETLPipeline:
    def __init__(self, source_path, target_path):
        self.source = sqlite3.connect(source_path)
        self.target = sqlite3.connect(target_path)

    def extract(self, query):
        """Pull raw data from source database."""
        return pd.read_sql(query, self.source)

    def transform_products(self, df):
        """McKinney data cleaning pattern: standardize and deduplicate."""
        df['category']     = df['category'].str.strip().str.title()
        df['product_name'] = df['product_name'].str.strip()
        df = df.drop_duplicates(subset=['product_id'])
        return df

    def load(self, df, table_name, if_exists='replace'):
        """Write to target. if_exists='append' to add rows."""
        df.to_sql(table_name, self.target, if_exists=if_exists, index=False)
        print(f"  Loaded {len(df):,} rows → {table_name}")

    def run(self):
        products = self.extract("SELECT * FROM raw_products")
        products = self.transform_products(products)
        self.load(products, 'dim_product')

ETLPipeline('/dataset.db', ':memory:').run()
~~~`,
      },
    ],
  },

  {
    week: 14,
    sql: [
      {
        title: 'Transit Operations KPIs',
        content: `On-time performance is the core operational metric for transit. Kimball's book calls these "operational KPIs" — measures that directly indicate whether the operation is functioning as designed.

~~~sql
WITH trip_delay AS (
    SELECT
        t.route_id,
        t.trip_id,
        -- julianday difference in minutes
        ROUND((julianday(t.actual_departure)
               - julianday(t.scheduled_departure)) * 1440, 1) AS delay_minutes
    FROM trips t
    WHERE t.actual_departure IS NOT NULL
),
route_summary AS (
    SELECT
        route_id,
        COUNT(*)                                                   AS total_trips,
        SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)       AS on_time,
        ROUND(AVG(delay_minutes), 1)                               AS avg_delay,
        ROUND(100.0 *
            SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)
            / COUNT(*), 1)                                         AS otp_pct
    FROM trip_delay
    GROUP BY route_id
)
SELECT r.route_name, s.otp_pct, s.avg_delay, s.total_trips
FROM route_summary s
JOIN routes r ON s.route_id = r.route_id
ORDER BY s.otp_pct ASC;  -- worst routes first
~~~

"On time" = departed within 5 minutes of schedule. That definition is a business decision — document it. SunTran's actual threshold may differ.`,
      },
    ],
    python: [
      {
        title: 'Automated Performance Monitoring',
        content: `~~~python
import pandas as pd
import sqlite3
from datetime import datetime, timedelta

OTP_THRESHOLD = 80.0

def get_route_performance(conn, days_back=30):
    cutoff = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    return pd.read_sql("""
        SELECT r.route_name,
               COUNT(*) AS total_trips,
               ROUND(100.0 * SUM(
                   CASE WHEN (julianday(t.actual_departure)
                              - julianday(t.scheduled_departure)) * 1440 <= 5
                   THEN 1 ELSE 0 END
               ) / COUNT(*), 1) AS otp_pct
        FROM trips t
        JOIN routes r ON t.route_id = r.route_id
        WHERE t.actual_departure IS NOT NULL
          AND t.actual_departure >= ?
        GROUP BY r.route_name
    """, conn, params=[cutoff])

def flag_underperforming(df, threshold=OTP_THRESHOLD):
    flagged = df[df['otp_pct'] < threshold].copy()
    flagged['status'] = flagged['otp_pct'].apply(
        lambda x: 'CRITICAL' if x < 70 else 'WARNING'
    )
    return flagged.sort_values('otp_pct')

conn    = sqlite3.connect('/dataset.db')
perf    = get_route_performance(conn)
alerts  = flag_underperforming(perf)

print(f"\\n=== ALERTS ({datetime.now().strftime('%Y-%m-%d')}) ===")
for _, row in alerts.iterrows():
    print(f"[{row['status']}] {row['route_name']}: {row['otp_pct']}% on-time")
~~~`,
      },
    ],
  },

  {
    week: 15,
    sql: [
      {
        title: 'Statistical Anomaly Detection in SQL',
        content: `~~~sql
WITH baseline AS (
    -- Establish normal behavior from historical data
    SELECT
        category,
        AVG(revenue)  AS mean_rev,
        -- SQLite approximation of standard deviation
        SQRT(AVG(revenue * revenue) - AVG(revenue) * AVG(revenue)) AS stddev_rev
    FROM transactions
    WHERE sale_date < date('now', '-7 days')
    GROUP BY category
),
scored AS (
    SELECT
        t.transaction_id,
        t.sale_date,
        t.category,
        t.revenue,
        b.mean_rev,
        b.stddev_rev,
        ROUND(
            (t.revenue - b.mean_rev) / NULLIF(b.stddev_rev, 0),
            2
        ) AS z_score
    FROM transactions t
    JOIN baseline b ON t.category = b.category
    WHERE t.sale_date >= date('now', '-7 days')
)
SELECT *
FROM scored
WHERE ABS(z_score) > 2
ORDER BY ABS(z_score) DESC;
~~~

A z-score above 2 (or below -2) is more than 2 standard deviations from the mean — statistically unusual. \`NULLIF(b.stddev_rev, 0)\` prevents division by zero if a category has no variance.`,
      },
    ],
    python: [
      {
        title: 'IQR Anomaly Detection — McKinney Statistical Methods',
        content: `McKinney covers descriptive statistics including quartiles in his pandas chapter. The IQR method doesn't assume a normal distribution — more robust for skewed operational data:

~~~python
import pandas as pd

def detect_anomalies_iqr(df, column, group_col=None):
    """
    Flag outliers using the IQR method (Tukey's fence: 1.5 x IQR).
    McKinney's quartile methods: .quantile(0.25) and .quantile(0.75)
    """
    results = []
    groups  = df.groupby(group_col) if group_col else [(None, df)]

    for group_val, gdf in groups:
        gdf  = gdf.copy()
        Q1   = gdf[column].quantile(0.25)
        Q3   = gdf[column].quantile(0.75)
        IQR  = Q3 - Q1
        low  = Q1 - 1.5 * IQR
        high = Q3 + 1.5 * IQR

        gdf['is_anomaly']   = ~gdf[column].between(low, high)
        gdf['lower_bound']  = low
        gdf['upper_bound']  = high
        results.append(gdf)

    return pd.concat(results)

df_flagged = detect_anomalies_iqr(df, column='revenue', group_col='category')
anomalies  = df_flagged[df_flagged['is_anomaly']]

print(f"Found {len(anomalies)} anomalies out of {len(df):,} transactions")
print(anomalies[['transaction_id', 'category', 'revenue',
                  'lower_bound', 'upper_bound']].to_string())
~~~`,
      },
    ],
  },

  {
    week: 16,
    sql: [
      {
        title: 'Portfolio Defense — SQL Review Questions',
        content: `Week 16 is defense, not new material. These are the questions you should answer cold — without looking at your code.

**From Iliev's SQL book foundations:**
- What does \`SELECT *\` return vs \`SELECT column_name\`? Why would you use each?
- Iliev distinguishes NULL from empty string and zero. Explain the difference.
- What does Iliev's \`NOT NULL\` constraint do at the table level?

**Aggregation and grouping:**
- What is the difference between WHERE and HAVING? Why can't you use WHERE to filter on SUM()?
- Iliev uses \`COUNT(*)\` and \`COUNT(column)\` — when do they return different numbers?

**JOINs:**
- When does INNER JOIN exclude rows that LEFT JOIN would include?
- Write the LEFT JOIN pattern to find customers with no orders.

**Advanced:**
- Explain what \`EXPLAIN QUERY PLAN\` tells you. What does "SCAN TABLE" mean?
- When should you add an index? Give two examples from the capstone work.
- What is a CTE and why is it more readable than a nested subquery?

**Capstone specific:**
- Walk through your Week 14 OTP query. Why did you use \`julianday()\`?
- In Week 15, how did you define "anomaly"? What's the tradeoff between z-score and IQR?
- What would break in your Week 13 ETL if the source table schema changed?`,
      },
    ],
    python: [
      {
        title: 'Portfolio Defense — Python Review Questions',
        content: `**From Sweigart's Automate the Boring Stuff foundations:**
- What is the difference between \`=\` and \`==\` in Python? (Sweigart flags this as one of the most common beginner mistakes)
- Sweigart explains scope in Chapter 3. What is the difference between a local and global variable?
- What does a function return if it has no \`return\` statement? What is that value called?
- Sweigart Chapter 5: What is the difference between a list and a dictionary? When do you use each?

**pandas — McKinney foundations:**
- What is a DataFrame? How does it differ from a Python list of lists?
- McKinney says pandas has "a preference for data processing without for loops." Why? What's the performance reason?
- What does \`groupby().agg()\` do? Write the SQL equivalent.
- What does \`fillna()\` do? When would you fill vs drop?

**Integration:**
- In your pipeline work, when did you use SQL and when did you use pandas? What drove the choice?
- McKinney's cleaning chapter says 80% of analyst time is data prep. Did that match your experience in these 16 weeks?

**Capstone specific:**
- In Week 13, why do you load dimensions before facts in an ETL?
- In Week 14, what threshold did you use for "on time"? What would change if SunTran used 3 minutes instead of 5?
- In Week 16 right now: what is the one skill you're least confident in? What's your plan to fix it?`,
      },
    ],
  },
]

export function getWeekLesson(week: number): WeekLesson | undefined {
  return LESSONS.find(l => l.week === week)
}
