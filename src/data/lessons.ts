// ─── Lesson Content ───────────────────────────────────────────────────────────
// Full written lesson content for all 16 weeks.
// Each week has sql[] and python[] arrays of { title, content } sections.
// Content supports markdown-style code fences (~~~sql ... ~~~) and inline `code`.

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
  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 1 — What Even is Data?
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 1,
    sql: [
      {
        title: 'What is a Database?',
        content: `A database is an organized collection of data stored so it can be searched, filtered, and updated efficiently. Think of it like a filing cabinet — but instead of folders you have tables, and instead of flipping through paper you write a query.

The type of database we use in this course is a "relational database." That means data is stored in tables, and those tables can be related to each other. The most common language for talking to a relational database is SQL — Structured Query Language.

Every database is made of:
- **Tables** — like spreadsheet tabs, each one holds one type of data (menu items, orders, customers)
- **Rows** — one record (one menu item, one order)
- **Columns** — the attributes of that record (name, price, category)

The database we're starting with is a Panda Express menu. It has one table called \`menu\` with columns for item name, category, price, and calories.`,
      },
      {
        title: 'Your First SELECT Statement',
        content: `SQL is a language for asking questions of a database. The most fundamental question is: "show me everything in this table." Here's how you write that:

\`\`\`sql
SELECT * FROM menu;
\`\`\`

Breaking that down:
- \`SELECT\` — what columns do you want to see?
- \`*\` — the asterisk means "all columns"
- \`FROM\` — which table?
- \`menu\` — the table name
- \`;\` — ends the statement (like a period at the end of a sentence)

You don't have to select everything. You can pick specific columns:

\`\`\`sql
SELECT item_name, price FROM menu;
\`\`\`

This returns only the item name and price columns — all other columns are ignored. This is important when tables have 50+ columns and you only need 3.`,
      },
      {
        title: 'ORDER BY and LIMIT',
        content: `By default, SQL returns rows in no guaranteed order. If you want a specific order, use ORDER BY:

\`\`\`sql
SELECT item_name, price
FROM menu
ORDER BY price DESC;
\`\`\`

\`DESC\` means descending (highest first). \`ASC\` means ascending (lowest first, and is the default).

\`LIMIT\` lets you cap how many rows come back. Useful when you just want a sample:

\`\`\`sql
SELECT item_name, price
FROM menu
ORDER BY price DESC
LIMIT 5;
\`\`\`

This returns the 5 most expensive items. You'll use this pattern constantly — "top N" queries are one of the most common things analysts run.

The order of these clauses matters: SELECT → FROM → ORDER BY → LIMIT. SQL expects them in this sequence.`,
      },
      {
        title: 'DISTINCT — Removing Duplicates',
        content: `Sometimes you want to know what unique values exist in a column. For example: what categories are in the menu?

\`\`\`sql
SELECT DISTINCT category FROM menu;
\`\`\`

Without \`DISTINCT\`, you'd get one row per menu item, with the category repeated for every item in that category. With \`DISTINCT\`, you get each category exactly once.

This is how you explore a table you've never seen before — run \`DISTINCT\` on key columns to understand what values exist.

Try this: run \`SELECT * FROM menu LIMIT 10\` first to see the raw data, then run \`SELECT DISTINCT category FROM menu\` to see the categories. That two-step process is how any good analyst starts with a new dataset.`,
      },
    ],
    python: [
      {
        title: 'Variables and Data Types',
        content: `In Python, a variable is a named container that holds a value. You create one with a single equals sign:

\`\`\`python
item_name = "Orange Chicken"
price = 6.99
quantity = 3
in_stock = True
\`\`\`

Python has four basic data types you'll use constantly:
- \`str\` — text (always in quotes): \`"Orange Chicken"\`
- \`int\` — whole numbers: \`3\`, \`100\`, \`-5\`
- \`float\` — decimal numbers: \`6.99\`, \`3.14\`
- \`bool\` — True or False (exactly those words, capitalized)

The variable name goes on the left, the value on the right. Python figures out the type automatically — you don't have to declare it.

SQL equivalent: a column in a table has a fixed type (TEXT, INTEGER, REAL). In Python, variables are more flexible — the same variable can hold different types at different times (though that's usually a bad idea).`,
      },
      {
        title: 'print() — Showing Output',
        content: `\`print()\` is how Python shows you something. It's the most basic form of output.

\`\`\`python
print("Hello, world")
print(item_name)
print(price)
print("Item:", item_name, "— Price: $", price)
\`\`\`

You can print text (called "string literals" in quotes), variables, or a mix. When you mix, Python adds a space between each item.

For cleaner output, use f-strings — they let you embed variables directly in text:

\`\`\`python
item_name = "Orange Chicken"
price = 6.99
print(f"{item_name} costs \${price}")
\`\`\`

The \`f\` before the quote tells Python: "this string contains variables in curly braces — replace them with their values." Output: \`Orange Chicken costs $6.99\`

You'll use f-strings constantly. They're the modern, readable way to build strings in Python.`,
      },
      {
        title: 'Your First Python Script',
        content: `Let's write something real. Here's a simple script that represents one Panda Express menu item and displays it:

\`\`\`python
# A single menu item as variables
item_name = "Orange Chicken"
category = "Entrees"
price = 6.99
calories = 490

# Display it
print(f"Item: {item_name}")
print(f"Category: {category}")
print(f"Price: \${price:.2f}")
print(f"Calories: {calories}")
\`\`\`

A few things to notice:
- Lines starting with \`#\` are comments — Python ignores them. They're for humans.
- \`{price:.2f}\` is an f-string format specifier: it formats the number with exactly 2 decimal places. \`6.99\` stays \`6.99\`, but \`7.0\` becomes \`7.00\`.

SQL equivalent: this is like \`SELECT item_name, category, price, calories FROM menu WHERE item_name = 'Orange Chicken'\`. Same data, different way of accessing it.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 2 — Getting Specific
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 2,
    sql: [
      {
        title: 'WHERE — Filtering Rows',
        content: `SELECT shows you columns. WHERE filters rows. Together they let you ask precise questions:

\`\`\`sql
SELECT * FROM orders
WHERE category = 'Entrees';
\`\`\`

Only rows where category is exactly 'Entrees' come back. Everything else is excluded.

Common comparison operators:
- \`=\` equals
- \`!=\` or \`<>\` not equals
- \`>\` greater than, \`<\` less than
- \`>=\` greater than or equal, \`<=\` less than or equal

\`\`\`sql
SELECT item_name, price FROM orders
WHERE price > 5.00;
\`\`\`

Important: text values use single quotes (\`'Entrees'\`). Numbers don't use quotes (\`5.00\`). This is a common beginner mistake.`,
      },
      {
        title: 'AND, OR, NOT — Combining Conditions',
        content: `You can chain multiple conditions with AND and OR:

\`\`\`sql
SELECT * FROM orders
WHERE category = 'Entrees'
  AND quantity > 2;
\`\`\`

AND means both conditions must be true. OR means at least one must be true:

\`\`\`sql
SELECT * FROM orders
WHERE category = 'Entrees'
   OR category = 'Sides';
\`\`\`

NOT inverts a condition:

\`\`\`sql
SELECT * FROM orders
WHERE NOT category = 'Drinks';
\`\`\`

Watch out for operator precedence — AND evaluates before OR, just like multiplication before addition in math. Use parentheses to be explicit:

\`\`\`sql
SELECT * FROM orders
WHERE (category = 'Entrees' OR category = 'Sides')
  AND quantity > 3;
\`\`\`

Without parentheses, this would mean: category = 'Entrees', OR (category = 'Sides' AND quantity > 3). Very different result.`,
      },
      {
        title: 'NULL — The Absent Value',
        content: `NULL means "no value" — not zero, not empty string, but genuinely absent. This trips up almost every beginner.

The wrong way to check for NULL:

\`\`\`sql
-- THIS DOES NOT WORK
SELECT * FROM orders WHERE notes = NULL;
\`\`\`

The right way:

\`\`\`sql
SELECT * FROM orders WHERE notes IS NULL;
SELECT * FROM orders WHERE notes IS NOT NULL;
\`\`\`

Why? Because NULL is not a value — it's the absence of a value. Comparing anything to NULL always returns NULL (not true or false). \`IS NULL\` is a special syntax that actually works.

NULL in practice: if an order has no special notes, the notes column is NULL. If a customer never gave a phone number, their phone column is NULL. Real-world data is full of NULLs. Learning to handle them correctly is one of the most important SQL skills.`,
      },
      {
        title: 'IN and BETWEEN — Cleaner Filters',
        content: `Instead of chaining multiple OR conditions, use IN:

\`\`\`sql
-- Instead of this:
WHERE category = 'Entrees' OR category = 'Sides' OR category = 'Appetizers'

-- Write this:
WHERE category IN ('Entrees', 'Sides', 'Appetizers')
\`\`\`

BETWEEN filters a range (inclusive on both ends):

\`\`\`sql
SELECT * FROM orders
WHERE price BETWEEN 4.00 AND 8.00;
\`\`\`

LIKE matches patterns in text. The \`%\` is a wildcard (matches anything):

\`\`\`sql
SELECT * FROM orders WHERE item_name LIKE 'Orange%';  -- starts with Orange
SELECT * FROM orders WHERE item_name LIKE '%Chicken%'; -- contains Chicken
\`\`\`

These aren't just shortcuts — they make queries easier to read and maintain. If you add a new category, you only change one line instead of three.`,
      },
    ],
    python: [
      {
        title: 'if / elif / else',
        content: `Python's \`if\` statement does exactly what SQL's WHERE clause does — it runs code only when a condition is true.

\`\`\`python
price = 6.99

if price > 8:
    print("Expensive item")
elif price > 5:
    print("Mid-range item")
else:
    print("Budget item")
\`\`\`

The structure:
- \`if\` — first condition to check
- \`elif\` — "else if" — checked only if the \`if\` was false
- \`else\` — runs if nothing above was true

The colon (\`:\`) at the end of each condition is required. The indented block beneath it is what runs when that condition is true. Python uses indentation (4 spaces) to define blocks — there are no curly braces.

SQL equivalent: \`CASE WHEN price > 8 THEN 'Expensive' WHEN price > 5 THEN 'Mid-range' ELSE 'Budget' END\``,
      },
      {
        title: 'Comparison Operators and Boolean Logic',
        content: `Python's comparison operators work the same as SQL's:

\`\`\`python
price = 6.99
category = "Entrees"

# Comparisons
print(price > 5)        # True
print(price == 6.99)    # True  (note: == for comparison, = for assignment)
print(price != 10)      # True
print(category == "Drinks")  # False
\`\`\`

For combining conditions, Python uses \`and\`, \`or\`, \`not\` (all lowercase, unlike SQL):

\`\`\`python
quantity = 4

if category == "Entrees" and quantity > 2:
    print("High-volume entree order")

if category == "Drinks" or price < 3:
    print("Low-cost item")
\`\`\`

The key difference from SQL: in Python you write \`and\` / \`or\` / \`not\`. In SQL you write \`AND\` / \`OR\` / \`NOT\` (case doesn't matter in SQL, but lowercase is convention in Python).`,
      },
      {
        title: 'Filtering a List with a Loop',
        content: `In SQL you filter with WHERE. In Python, you often loop through a list and check each item:

\`\`\`python
orders = [
    {"item": "Orange Chicken", "qty": 3, "status": "complete"},
    {"item": "Fried Rice",     "qty": 1, "status": "complete"},
    {"item": "Chow Mein",      "qty": 5, "status": "pending"},
    {"item": "Orange Chicken", "qty": 4, "status": "complete"},
]

# Find completed orders with quantity > 2
for order in orders:
    if order["status"] == "complete" and order["qty"] > 2:
        print(order["item"], "-", order["qty"])
\`\`\`

Output:
\`\`\`
Orange Chicken - 3
Orange Chicken - 4
\`\`\`

This is exactly what SQL's WHERE does — it just looks more like reading English. SQL hides this loop. Python makes it visible. Understanding this equivalence is key: SQL is a declarative language (you say what you want), Python is imperative (you say how to get it).`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 3 — Doing Math on Data
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 3,
    sql: [
      {
        title: 'Aggregate Functions: COUNT, SUM, AVG',
        content: `Aggregate functions collapse many rows into a single value. Instead of "show me every order," you can ask "how many orders total?" or "what was the total revenue?"

\`\`\`sql
SELECT COUNT(*) FROM sales;           -- total number of rows
SELECT COUNT(notes) FROM sales;       -- rows where notes is NOT NULL
SELECT SUM(revenue) FROM sales;       -- total revenue
SELECT AVG(revenue) FROM sales;       -- average revenue per row
SELECT MIN(revenue) FROM sales;       -- lowest single revenue
SELECT MAX(revenue) FROM sales;       -- highest single revenue
\`\`\`

An important distinction: \`COUNT(*)\` counts all rows including NULLs. \`COUNT(column_name)\` counts only rows where that column has a value. This difference will bite you if you're not careful.

You can give results meaningful names with AS:

\`\`\`sql
SELECT
    COUNT(*) AS total_transactions,
    SUM(revenue) AS total_revenue,
    AVG(revenue) AS avg_per_transaction
FROM sales;
\`\`\``,
      },
      {
        title: 'GROUP BY — Aggregating by Category',
        content: `Aggregate functions collapse everything into one number. GROUP BY lets you break that down by category — one result per group.

\`\`\`sql
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category;
\`\`\`

This gives you one row per category, with the total revenue for each. The GROUP BY column must appear in your SELECT.

You can group by multiple columns:

\`\`\`sql
SELECT category, hour_of_day, SUM(revenue) AS revenue
FROM sales
GROUP BY category, hour_of_day
ORDER BY category, hour_of_day;
\`\`\`

Mental model: GROUP BY sorts the rows into piles (one pile per unique combination of grouped columns), then runs the aggregate function on each pile. The result is one row per pile.`,
      },
      {
        title: 'HAVING — Filtering Groups',
        content: `WHERE filters rows before aggregation. HAVING filters groups after aggregation. This distinction matters.

\`\`\`sql
-- Find categories with total revenue over $1,000
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category
HAVING SUM(revenue) > 1000;
\`\`\`

You cannot use WHERE to filter on an aggregate — this would fail:

\`\`\`sql
-- WRONG — this doesn't work
SELECT category, SUM(revenue)
FROM sales
WHERE SUM(revenue) > 1000
GROUP BY category;
\`\`\`

The rule: if the condition references an aggregate function (SUM, COUNT, AVG...), use HAVING. Otherwise, use WHERE. They can coexist in the same query:

\`\`\`sql
SELECT category, COUNT(*) AS order_count
FROM sales
WHERE status = 'complete'        -- filter rows first
GROUP BY category
HAVING COUNT(*) > 10;            -- then filter groups
\`\`\``,
      },
    ],
    python: [
      {
        title: 'for Loops — Iterating Over Data',
        content: `A for loop runs a block of code once for each item in a sequence. It's Python's way of visiting every row.

\`\`\`python
categories = ["Entrees", "Sides", "Drinks", "Appetizers"]

for category in categories:
    print(category)
\`\`\`

For loops also work on ranges of numbers:

\`\`\`python
for i in range(5):
    print(i)    # prints 0, 1, 2, 3, 4
\`\`\`

A more realistic example — summing revenue from a list of transactions:

\`\`\`python
transactions = [12.50, 8.99, 22.00, 5.75, 18.30]
total = 0

for amount in transactions:
    total = total + amount

print(f"Total revenue: \${total:.2f}")
\`\`\`

SQL equivalent: \`SELECT SUM(amount) FROM transactions\`. The loop makes explicit what SQL does behind the scenes.`,
      },
      {
        title: 'Dictionaries — Grouping Data',
        content: `A dictionary stores key-value pairs. It's the Python equivalent of GROUP BY — you group data into categories and accumulate values per category.

\`\`\`python
sales = [
    {"category": "Entrees", "revenue": 12.50},
    {"category": "Sides",   "revenue": 3.25},
    {"category": "Entrees", "revenue": 8.99},
    {"category": "Drinks",  "revenue": 2.50},
    {"category": "Entrees", "revenue": 15.00},
]

# Group revenue by category (like GROUP BY in SQL)
totals = {}

for sale in sales:
    cat = sale["category"]
    rev = sale["revenue"]
    if cat in totals:
        totals[cat] += rev
    else:
        totals[cat] = rev

print(totals)
# {'Entrees': 36.49, 'Sides': 3.25, 'Drinks': 2.50}
\`\`\`

This is what SQL's \`GROUP BY category, SUM(revenue)\` does — but written out step by step so you can see the mechanism. SQL automates the pile-sorting and summing; Python makes it explicit.`,
      },
      {
        title: 'List Comprehensions — Compact Filtering',
        content: `A list comprehension is a compact way to build a new list from an existing one, with optional filtering. It's faster to write and often faster to execute than a full for loop.

\`\`\`python
revenues = [12.50, 3.25, 8.99, 22.00, 5.75, 18.30, 2.50]

# All revenues above $10
high_rev = [r for r in revenues if r > 10]
print(high_rev)  # [12.50, 22.00, 18.30]

# Double every revenue (transformation)
doubled = [r * 2 for r in revenues]
\`\`\`

Structure: \`[expression for item in iterable if condition]\`

The \`if condition\` part is optional. When you include it, only items where the condition is true end up in the new list.

SQL equivalent of the first example: \`SELECT revenue FROM transactions WHERE revenue > 10\`

List comprehensions are one of those Python features that looks weird at first and then becomes second nature. They're worth learning early.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 4 — Connecting the Dots
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 4,
    sql: [
      {
        title: 'Primary Keys and Foreign Keys',
        content: `Relational databases store different types of data in different tables and link them together. The mechanism for linking is keys.

A **primary key** uniquely identifies each row in a table. No two rows can have the same primary key value.

A **foreign key** is a column in one table that references the primary key of another table. It's how you say "this order belongs to this customer."

\`\`\`sql
-- customers table
-- customer_id is the primary key
SELECT customer_id, name, email FROM customers LIMIT 5;

-- orders table
-- customer_id here is a foreign key — it references customers.customer_id
SELECT order_id, customer_id, total, order_date FROM orders LIMIT 5;
\`\`\`

This separation is not arbitrary — it prevents data duplication. Instead of storing "Justin Becerra, justin@email.com" in every order row, you store it once in customers and reference it by ID.`,
      },
      {
        title: 'INNER JOIN — Matching Rows',
        content: `INNER JOIN combines rows from two tables where there's a matching value in both. Rows with no match in either table are excluded.

\`\`\`sql
SELECT
    customers.name,
    orders.order_id,
    orders.total,
    orders.order_date
FROM customers
INNER JOIN orders
    ON customers.customer_id = orders.customer_id;
\`\`\`

The \`ON\` clause is the join condition — it tells SQL how the tables relate. Always join on the column pair that connects them (usually primary key = foreign key).

You can use table aliases to shorten queries:

\`\`\`sql
SELECT
    c.name,
    o.order_id,
    o.total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
ORDER BY o.order_date DESC;
\`\`\`

\`JOIN\` without a qualifier is the same as \`INNER JOIN\`. Most people write \`JOIN\` for brevity.`,
      },
      {
        title: 'LEFT JOIN — Keeping All Left Rows',
        content: `LEFT JOIN keeps every row from the left table, even if there's no matching row in the right table. Where there's no match, the right table's columns come back as NULL.

\`\`\`sql
SELECT
    c.name,
    c.email,
    o.order_id,
    o.total
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
\`\`\`

Customers who have never placed an order will appear in this result, with NULL in the order_id and total columns.

This is how you find "customers with no orders":

\`\`\`sql
SELECT c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
\`\`\`

The WHERE clause filters to only the rows where the join found no match. This pattern — LEFT JOIN + WHERE right_table.id IS NULL — is one of the most useful SQL patterns you'll ever learn.`,
      },
      {
        title: 'JOIN Types Summary',
        content: `There are four join types. Two matter most in daily work:

**INNER JOIN** — only rows with a match in BOTH tables
\`\`\`sql
SELECT * FROM a INNER JOIN b ON a.id = b.a_id;
\`\`\`

**LEFT JOIN** — all rows from the LEFT table, matched rows from the right
\`\`\`sql
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id;
\`\`\`

**RIGHT JOIN** — all rows from the RIGHT table, matched rows from the left (less common — just swap the table order and use LEFT JOIN instead)

**FULL OUTER JOIN** — all rows from both tables (not supported in SQLite — use UNION of LEFT and RIGHT JOIN)

The mental model: draw two circles (Venn diagram). INNER JOIN is the intersection. LEFT JOIN is the full left circle. The join type determines which records survive when there's no match.

When in doubt, start with LEFT JOIN — it never loses data from your primary table.`,
      },
    ],
    python: [
      {
        title: 'Functions — Reusable Code Blocks',
        content: `A function is a named block of code you can call multiple times. Instead of repeating the same logic, you write it once and call it by name.

\`\`\`python
def calculate_tax(price, rate=0.08):
    return price * rate

def format_price(price):
    return f"\${price:.2f}"

# Using the functions
item_price = 6.99
tax = calculate_tax(item_price)
print(f"Price: {format_price(item_price)}, Tax: {format_price(tax)}")
# Price: $6.99, Tax: $0.56
\`\`\`

Key parts:
- \`def\` — starts a function definition
- The name (\`calculate_tax\`)
- Parameters in parentheses (\`price, rate=0.08\`)
- \`rate=0.08\` is a default parameter — if you don't pass a rate, it uses 0.08
- \`return\` — what the function gives back to the caller

Functions are the foundation of not-repeating-yourself. Any logic you use more than twice should be a function.`,
      },
      {
        title: 'Dictionaries as Relational Data',
        content: `In SQL, a JOIN links two tables on a shared key. In Python, you do the same thing with dictionaries — look up a value by its key.

\`\`\`python
# Simulating two tables as Python dictionaries
customers = {
    1: {"name": "Justin", "email": "justin@example.com"},
    2: {"name": "Maria",  "email": "maria@example.com"},
    3: {"name": "Alex",   "email": "alex@example.com"},
}

orders = [
    {"order_id": 101, "customer_id": 1, "total": 23.50},
    {"order_id": 102, "customer_id": 2, "total": 14.25},
    {"order_id": 103, "customer_id": 1, "total": 8.99},
    {"order_id": 104, "customer_id": 4, "total": 5.00},  # customer 4 doesn't exist
]

# Simulating an INNER JOIN (only orders with a matching customer)
print("--- INNER JOIN ---")
for order in orders:
    cid = order["customer_id"]
    if cid in customers:
        name = customers[cid]["name"]
        print(f"Order {order['order_id']} by {name}: \${order['total']}")

# Simulating a LEFT JOIN (all orders, NULL if customer missing)
print("--- LEFT JOIN ---")
for order in orders:
    cid = order["customer_id"]
    name = customers.get(cid, {}).get("name", "NULL")
    print(f"Order {order['order_id']} by {name}: \${order['total']}")
\`\`\`

\`dict.get(key, default)\` is Python's safe lookup — it returns \`default\` instead of crashing when the key doesn't exist. That's the LEFT JOIN behavior in Python.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 5 — Real Data is Messy
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 5,
    sql: [
      {
        title: 'CASE — Conditional Logic in SQL',
        content: `CASE is SQL's if/else. It lets you create new column values based on conditions.

\`\`\`sql
SELECT
    item_name,
    price,
    CASE
        WHEN price > 8    THEN 'Premium'
        WHEN price > 5    THEN 'Standard'
        ELSE 'Budget'
    END AS price_tier
FROM inventory;
\`\`\`

CASE evaluates top-to-bottom and stops at the first true condition. The \`ELSE\` is optional — without it, unmatched rows get NULL.

You can also use CASE with equality checks:

\`\`\`sql
SELECT
    category,
    CASE category
        WHEN 'Entrees' THEN 'Main'
        WHEN 'Sides'   THEN 'Side'
        WHEN 'Drinks'  THEN 'Beverage'
        ELSE 'Other'
    END AS category_clean
FROM inventory;
\`\`\`

CASE is indispensable for data cleaning, bucketing numeric values, and creating report-ready labels.`,
      },
      {
        title: 'COALESCE and NULLIF',
        content: `\`COALESCE\` returns the first non-NULL value from its arguments. It's the standard way to replace NULLs with defaults.

\`\`\`sql
-- Replace NULL notes with a default message
SELECT
    order_id,
    COALESCE(notes, 'No special instructions') AS notes
FROM orders;

-- Use first non-null of multiple fallbacks
SELECT
    customer_id,
    COALESCE(phone_mobile, phone_home, phone_work, 'No phone on file') AS best_phone
FROM customers;
\`\`\`

\`NULLIF\` is the reverse — it returns NULL if two values are equal, otherwise returns the first value. Useful for avoiding division by zero:

\`\`\`sql
-- Safe division: if total_orders is 0, return NULL instead of crashing
SELECT
    store_id,
    total_revenue / NULLIF(total_orders, 0) AS avg_order_value
FROM store_summary;
\`\`\`

Without \`NULLIF\`, dividing by zero in SQL throws an error. With it, you get NULL, which you can then handle with COALESCE.`,
      },
      {
        title: 'String Functions',
        content: `SQL has functions for cleaning and transforming text:

\`\`\`sql
SELECT
    UPPER(item_name)     AS name_upper,     -- 'orange chicken' → 'ORANGE CHICKEN'
    LOWER(item_name)     AS name_lower,     -- 'ORANGE CHICKEN' → 'orange chicken'
    TRIM(item_name)      AS name_trimmed,   -- removes leading/trailing spaces
    LENGTH(item_name)    AS name_length,    -- number of characters
    SUBSTR(item_name, 1, 6) AS first_six   -- 'Orange Chicken' → 'Orange'
FROM inventory;
\`\`\`

For combining strings, use \`||\` (double pipe) in SQLite:

\`\`\`sql
SELECT first_name || ' ' || last_name AS full_name
FROM customers;
\`\`\`

These become essential when importing data from spreadsheets where the same value was entered a dozen different ways. Data cleaning is 80% of an analyst's real job.`,
      },
    ],
    python: [
      {
        title: 'pandas — DataFrames',
        content: `pandas is Python's data analysis library. Its core object is the \`DataFrame\` — a table with labeled rows and columns, like a SQL table in memory.

\`\`\`python
import pandas as pd

# Create a DataFrame from a dictionary
data = {
    "item_name": ["Orange Chicken", "Fried Rice", "Chow Mein"],
    "category":  ["Entrees", "Sides", "Sides"],
    "price":     [6.99, 3.99, 3.99],
}

df = pd.DataFrame(data)
print(df)
print(df.dtypes)    # column types
print(df.shape)     # (rows, columns)
print(df.head(2))   # first 2 rows
\`\`\`

Key DataFrame operations that mirror SQL:
- \`df.columns\` → column names (like \`SELECT column_name FROM...\`)
- \`df['price']\` → one column as a Series
- \`df[['item_name', 'price']]\` → multiple columns (like SELECT)
- \`df.head(n)\` → first n rows (like LIMIT)
- \`df.shape\` → (row_count, column_count)

pandas is loaded in the Python editor with your weekly dataset already in a variable called \`df\`.`,
      },
      {
        title: 'Handling Missing Values — NaN',
        content: `pandas uses \`NaN\` (Not a Number) for missing values — the equivalent of SQL's NULL.

\`\`\`python
import pandas as pd
import numpy as np

# Check for missing values
print(df.isnull().sum())       # count NaNs per column
print(df.isnull().any())       # True/False per column

# Drop rows with any NaN
df_clean = df.dropna()

# Drop rows where specific column is NaN
df_clean = df.dropna(subset=['price'])

# Fill NaN with a default value
df['notes'] = df['notes'].fillna('No instructions')

# Fill NaN with the column average
df['price'] = df['price'].fillna(df['price'].mean())
\`\`\`

SQL equivalent:
- \`df.isnull()\` → \`IS NULL\`
- \`df.fillna(value)\` → \`COALESCE(column, value)\`
- \`df.dropna()\` → \`WHERE column IS NOT NULL\`

The decision between filling and dropping depends on the business context — you need to document your choice and the reason for it.`,
      },
      {
        title: 'String Cleaning in pandas',
        content: `pandas has a \`.str\` accessor that gives you string methods for an entire column at once:

\`\`\`python
# Standardize category names
df['category'] = df['category'].str.strip()      # remove whitespace
df['category'] = df['category'].str.lower()      # all lowercase
df['category'] = df['category'].str.title()      # Title Case

# Check what's in the column after cleaning
print(df['category'].value_counts())

# Replace inconsistent values
df['category'] = df['category'].replace({
    'entree': 'Entrees',
    'side dish': 'Sides',
    'beverage': 'Drinks',
})

# Remove non-numeric characters from a price column
df['price'] = df['price'].str.replace('$', '', regex=False)
df['price'] = pd.to_numeric(df['price'], errors='coerce')
\`\`\`

\`errors='coerce'\` in \`pd.to_numeric\` turns anything that can't be converted into NaN instead of crashing. That's the safe approach when you're not sure what's in the data.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 6 — Slicing and Dicing
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 6,
    sql: [
      {
        title: 'Subqueries',
        content: `A subquery is a SELECT inside another SELECT. It lets you use the result of one query as input to another.

\`\`\`sql
-- Find employees who earn more than the average salary
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
\`\`\`

The inner query (\`SELECT AVG(salary) FROM employees\`) runs first and returns a single number. The outer query uses that number as its filter threshold.

Subqueries in FROM (called inline views):

\`\`\`sql
SELECT dept, avg_score
FROM (
    SELECT department AS dept, AVG(review_score) AS avg_score
    FROM employees
    GROUP BY department
) AS dept_averages
WHERE avg_score > 80;
\`\`\`

Subqueries work but can get hard to read when nested multiple levels deep. That's where CTEs come in.`,
      },
      {
        title: 'CTEs — WITH Clauses',
        content: `A CTE (Common Table Expression) names a subquery so you can reference it by name. It makes complex queries readable.

\`\`\`sql
WITH dept_averages AS (
    SELECT department, AVG(review_score) AS avg_score
    FROM employees
    GROUP BY department
),
high_performers AS (
    SELECT name, department, review_score
    FROM employees
    WHERE review_score >= 90
)
SELECT
    h.name,
    h.review_score,
    d.avg_score AS dept_average,
    h.review_score - d.avg_score AS above_average_by
FROM high_performers h
JOIN dept_averages d ON h.department = d.department
ORDER BY above_average_by DESC;
\`\`\`

CTEs:
- Run once (defined, then referenced)
- Can be chained — later CTEs can reference earlier ones
- Don't change performance in SQLite, but massively improve readability
- The \`WITH\` keyword starts the chain; each CTE is named with \`AS\`

Senior engineers default to CTEs for anything non-trivial. "Write a CTE" is the answer to most "how do I structure this complex query?" questions.`,
      },
      {
        title: 'Window Functions',
        content: `Window functions compute a value for each row based on a related set of rows — without collapsing the result like GROUP BY does.

\`\`\`sql
SELECT
    name,
    department,
    review_score,
    RANK() OVER (PARTITION BY department ORDER BY review_score DESC) AS dept_rank,
    AVG(review_score) OVER (PARTITION BY department) AS dept_average
FROM employees;
\`\`\`

Breaking down the syntax:
- \`RANK()\` — the window function (also: ROW_NUMBER, DENSE_RANK, LAG, LEAD, SUM, AVG...)
- \`OVER (...)\` — defines the "window" of rows it looks at
- \`PARTITION BY department\` — restart numbering for each department (like GROUP BY, but without collapsing)
- \`ORDER BY review_score DESC\` — determines rank order within each partition

The critical difference from GROUP BY: window functions return one row per original row. GROUP BY collapses rows. Use window functions when you want both the individual row AND a group-level calculation side by side.`,
      },
    ],
    python: [
      {
        title: 'pandas groupby',
        content: `\`groupby()\` is pandas's GROUP BY. It splits the DataFrame into groups and applies an operation to each.

\`\`\`python
# Total revenue by category
by_category = df.groupby('category')['revenue'].sum()
print(by_category)

# Multiple aggregations at once
summary = df.groupby('department').agg(
    avg_score=('review_score', 'mean'),
    max_score=('review_score', 'max'),
    headcount=('name', 'count')
)
print(summary)
\`\`\`

After \`groupby()\`, you apply an aggregation: \`.sum()\`, \`.mean()\`, \`.count()\`, \`.max()\`, \`.min()\`, or \`.agg()\` for multiple at once.

The result is a new DataFrame with one row per group. The grouped column becomes the index by default — use \`.reset_index()\` if you want it as a regular column:

\`\`\`python
summary = df.groupby('department')['salary'].mean().reset_index()
\`\`\``,
      },
      {
        title: 'Boolean Indexing — loc and iloc',
        content: `pandas gives you two main ways to slice data: boolean filtering and position-based indexing.

Boolean indexing (like SQL WHERE):

\`\`\`python
# Filter rows where score > 80
high_scores = df[df['review_score'] > 80]

# Multiple conditions (use & for AND, | for OR, wrap each in parentheses)
top_dept = df[(df['department'] == 'Engineering') & (df['review_score'] >= 90)]
\`\`\`

\`loc\` — label-based: select rows and columns by name

\`\`\`python
# All rows, specific columns
df.loc[:, ['name', 'department', 'review_score']]

# Rows matching a condition, specific columns
df.loc[df['review_score'] > 85, ['name', 'review_score']]
\`\`\`

\`iloc\` — position-based: select by row number and column number (0-indexed)

\`\`\`python
df.iloc[0]          # first row
df.iloc[0:5]        # first 5 rows
df.iloc[:, 0:3]     # all rows, first 3 columns
\`\`\`

For analysis work, you'll mostly use boolean indexing. \`iloc\` is useful when you need specific rows by position.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 7 — Time is a Dimension
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 7,
    sql: [
      {
        title: 'Date Functions in SQLite',
        content: `SQLite stores dates as text (ISO format: \`YYYY-MM-DD\`) or as Unix timestamps. The \`strftime()\` function formats and extracts date parts.

\`\`\`sql
-- Format and extract date parts
SELECT
    sale_date,
    strftime('%Y', sale_date)     AS year,
    strftime('%m', sale_date)     AS month,
    strftime('%d', sale_date)     AS day,
    strftime('%w', sale_date)     AS day_of_week   -- 0=Sunday
FROM sales;
\`\`\`

Group by time period:

\`\`\`sql
-- Revenue by month
SELECT
    strftime('%Y-%m', sale_date) AS month,
    SUM(revenue) AS monthly_revenue
FROM sales
GROUP BY strftime('%Y-%m', sale_date)
ORDER BY month;
\`\`\`

Filter by date range:

\`\`\`sql
SELECT * FROM sales
WHERE sale_date >= '2024-01-01'
  AND sale_date <  '2024-04-01';
\`\`\`

Date comparison works directly on ISO-formatted strings because alphabetical sort matches chronological sort (\`'2024-03'\` > \`'2024-02'\`).`,
      },
      {
        title: 'LAG and LEAD — Period-over-Period',
        content: `LAG lets you look at the previous row's value. LEAD lets you look at the next row's value. Essential for period-over-period comparisons.

\`\`\`sql
WITH monthly AS (
    SELECT
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue) AS revenue
    FROM sales
    GROUP BY month
)
SELECT
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY month) AS mom_change,
    ROUND(
        (revenue - LAG(revenue, 1) OVER (ORDER BY month))
        / LAG(revenue, 1) OVER (ORDER BY month) * 100,
        1
    ) AS mom_pct_change
FROM monthly;
\`\`\`

\`LAG(revenue, 1)\` means "the value of revenue from 1 row back." The \`OVER (ORDER BY month)\` tells it the ordering.

The first month will have NULL for \`prev_month_revenue\` because there's no previous month — handle this with COALESCE if needed.`,
      },
    ],
    python: [
      {
        title: 'pandas Time Series — resample and rolling',
        content: `When your DataFrame has a datetime column as its index, pandas unlocks powerful time series operations.

\`\`\`python
import pandas as pd

# Parse dates and set as index
df['sale_date'] = pd.to_datetime(df['sale_date'])
df = df.set_index('sale_date')

# Resample: aggregate to a different time frequency
monthly = df['revenue'].resample('ME').sum()    # Monthly totals
weekly  = df['revenue'].resample('W').sum()     # Weekly totals
print(monthly)

# Rolling average: smooth out noise
rolling_4wk = df['revenue'].resample('W').sum().rolling(window=4).mean()
print(rolling_4wk)
\`\`\`

\`resample()\` is pandas's GROUP BY for time. Common frequencies: \`'D'\` (day), \`'W'\` (week), \`'ME'\` (month end), \`'QE'\` (quarter end), \`'YE'\` (year end).

\`rolling(window=N).mean()\` computes a moving average over N periods. A 4-week rolling average smooths out weekly volatility to show the underlying trend.`,
      },
      {
        title: 'Period-over-Period with pct_change',
        content: `pandas has a built-in method for percentage change between periods:

\`\`\`python
monthly = df['revenue'].resample('ME').sum()

# Month-over-month percent change
mom_change = monthly.pct_change() * 100

# Combine into a report DataFrame
report = pd.DataFrame({
    'revenue': monthly,
    'mom_pct_change': mom_change.round(1)
})

# Flag months with drops > 15%
report['anomaly'] = report['mom_pct_change'] < -15

print(report)
\`\`\`

\`.pct_change()\` computes \`(current - previous) / previous\`. Multiply by 100 for percentage.

The same logic in SQL requires LAG() and manual arithmetic. pandas makes it one method call. This is a case where Python is genuinely more concise than SQL for time series work.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 8 — Thinking in Sets
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 8,
    sql: [
      {
        title: 'UNION and UNION ALL',
        content: `UNION combines the results of two SELECT statements into one result set. Both queries must return the same number of columns with compatible types.

\`\`\`sql
-- All top products from both East and West regions
SELECT product_id, product_name, 'East' AS region
FROM east_top_products
UNION
SELECT product_id, product_name, 'West' AS region
FROM west_top_products;
\`\`\`

\`UNION\` removes duplicates. \`UNION ALL\` keeps them. Always prefer \`UNION ALL\` when you know there are no duplicates or want to keep them — it's significantly faster because it skips the deduplication step.

\`\`\`sql
-- Combine all regional lists, keep all rows
SELECT product_id, 'East' AS region FROM east_top_ten
UNION ALL
SELECT product_id, 'West' AS region FROM west_top_ten
UNION ALL
SELECT product_id, 'Central' AS region FROM central_top_ten;
\`\`\``,
      },
      {
        title: 'INTERSECT and EXCEPT',
        content: `INTERSECT returns only rows that appear in BOTH result sets — the Venn diagram overlap.

\`\`\`sql
-- Products in the top 10 in BOTH East and West
SELECT product_id FROM east_top_ten
INTERSECT
SELECT product_id FROM west_top_ten;
\`\`\`

EXCEPT returns rows from the first result set that do NOT appear in the second — what's in A but not B.

\`\`\`sql
-- Products in East top 10 but NOT in West top 10
SELECT product_id FROM east_top_ten
EXCEPT
SELECT product_id FROM west_top_ten;
\`\`\`

Draw the Venn diagram before writing the query. It makes the choice obvious:
- Everything in both circles → INTERSECT
- Only in the left circle → EXCEPT
- Both circles combined → UNION

Note: INTERSECT and EXCEPT aren't commonly supported in all databases or may have quirks. In practice, analysts often use JOINs to achieve the same result, which gives more control.`,
      },
    ],
    python: [
      {
        title: 'Python Set Operations',
        content: `Python has a built-in \`set\` type that directly implements the same operations as SQL's set operators.

\`\`\`python
east_top = {101, 102, 103, 104, 105, 106, 107, 108, 109, 110}
west_top = {104, 105, 106, 107, 108, 109, 110, 111, 112, 113}

# UNION — all products in either list
combined = east_top | west_top
print(f"Union: {len(combined)} products")

# INTERSECT — products in both lists
both = east_top & west_top
print(f"In both: {both}")

# EXCEPT — in East but not West
east_only = east_top - west_top
print(f"East only: {east_only}")
\`\`\`

Sets also work with DataFrames — convert a column to a set first:

\`\`\`python
east_ids = set(east_df['product_id'])
west_ids = set(west_df['product_id'])

universal = east_ids & west_ids & central_ids
east_exclusive = east_ids - west_ids - central_ids
\`\`\`

Sets are unordered and deduplicated by definition — identical to SQL set semantics.`,
      },
      {
        title: 'pivot_table — Cross-Tabulation',
        content: `\`pivot_table\` reshapes data from long format to wide format — one row per product, one column per region, values as the metric.

\`\`\`python
import pandas as pd

# Long format: one row per (product, region)
sales = pd.DataFrame({
    'product': ['OC', 'OC', 'FR', 'FR', 'CM'],
    'region':  ['East', 'West', 'East', 'West', 'East'],
    'revenue': [1200, 980, 750, 820, 600],
})

# Pivot: products as rows, regions as columns, revenue as values
pivot = sales.pivot_table(
    values='revenue',
    index='product',
    columns='region',
    aggfunc='sum',
    fill_value=0
)

print(pivot)
# region  East  West
# product
# CM       600     0
# FR       750   820
# OC      1200   980
\`\`\`

\`fill_value=0\` replaces NaN with 0 where a product has no sales in a region. This is the matrix view your product team asked for — one glance tells you the regional performance profile of each product.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 9 — The Full Analyst Workflow
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 9,
    sql: [
      {
        title: 'Views — Saved Queries',
        content: `A view is a saved SELECT query that behaves like a table. Instead of writing the same complex JOIN every time, you create a view once and query it like any table.

\`\`\`sql
CREATE VIEW monthly_revenue AS
SELECT
    strftime('%Y-%m', sale_date) AS month,
    store_id,
    SUM(revenue) AS total_revenue,
    COUNT(*) AS transaction_count
FROM transactions
GROUP BY month, store_id;

-- Now query it like a table
SELECT * FROM monthly_revenue
WHERE month >= '2024-01'
ORDER BY month, total_revenue DESC;
\`\`\`

Views don't store data — they store the query definition. Every time you query a view, it runs the underlying SELECT fresh. Think of them as named, reusable CTEs that persist across sessions.

Use views for:
- Hiding complex join logic from business users
- Enforcing consistent metric definitions ("monthly revenue always means X")
- Simplifying frequently-run queries`,
      },
      {
        title: 'Full Pipeline Query Design',
        content: `Real-world analytical queries have a structure: extract → transform → aggregate → present. CTEs map cleanly onto this:

\`\`\`sql
-- Extract: get raw data with basic filters
WITH raw_data AS (
    SELECT t.*, s.store_name, s.region
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
    WHERE t.sale_date >= date('now', '-90 days')
),

-- Transform: calculate per-transaction metrics
enriched AS (
    SELECT *,
        revenue / NULLIF(quantity, 0) AS unit_price,
        CASE WHEN revenue > 50 THEN 'large' ELSE 'standard' END AS order_size
    FROM raw_data
),

-- Aggregate: roll up to store-month level
store_monthly AS (
    SELECT
        store_name,
        region,
        strftime('%Y-%m', sale_date) AS month,
        SUM(revenue) AS total_revenue,
        COUNT(*) AS order_count,
        AVG(revenue) AS avg_order_value
    FROM enriched
    GROUP BY store_name, region, month
)

-- Present: final output
SELECT *
FROM store_monthly
ORDER BY month, total_revenue DESC;
\`\`\`

This pattern — name each transformation step as a CTE — makes queries auditable and debuggable. You can test each CTE independently.`,
      },
    ],
    python: [
      {
        title: 'The Full pandas Pipeline',
        content: `A pandas pipeline follows the same extract → transform → aggregate → visualize pattern as SQL, but in Python code.

\`\`\`python
import pandas as pd
import sqlite3

# EXTRACT — pull from database
conn = sqlite3.connect('/dataset.db')
df = pd.read_sql("""
    SELECT t.*, s.store_name, s.region
    FROM transactions t
    JOIN stores s ON t.store_id = s.store_id
""", conn)
conn.close()

# TRANSFORM — clean and enrich
df['sale_date'] = pd.to_datetime(df['sale_date'])
df['month'] = df['sale_date'].dt.to_period('M').astype(str)
df['unit_price'] = df['revenue'] / df['quantity'].replace(0, pd.NA)

# AGGREGATE — summarize
summary = df.groupby(['store_name', 'month']).agg(
    total_revenue=('revenue', 'sum'),
    order_count=('transaction_id', 'count'),
    avg_order=('revenue', 'mean')
).reset_index()

print(summary.sort_values('total_revenue', ascending=False).head(10))
\`\`\`

\`pd.read_sql()\` executes a SQL query and returns a DataFrame. This is the bridge between SQL and Python — pull the data with SQL, transform and visualize with Python.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 10 — Automation is the Goal
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 10,
    sql: [
      {
        title: 'Query Templates for Reporting',
        content: `Good reporting queries are parameterizable — you change one value and get a different time period, location, or category.

\`\`\`sql
-- Template: replace the date range to rerun for any period
SELECT
    store_id,
    SUM(revenue) AS period_revenue,
    COUNT(*) AS transaction_count
FROM transactions
WHERE sale_date BETWEEN '2024-01-01' AND '2024-03-31'  -- ← parameter
GROUP BY store_id
ORDER BY period_revenue DESC;
\`\`\`

In Python, you pass parameters safely using the \`?\` placeholder (prevents SQL injection):

\`\`\`python
import sqlite3

def get_store_summary(start_date, end_date):
    conn = sqlite3.connect('/dataset.db')
    query = """
        SELECT store_id, SUM(revenue) AS revenue
        FROM transactions
        WHERE sale_date BETWEEN ? AND ?
        GROUP BY store_id
    """
    df = pd.read_sql(query, conn, params=[start_date, end_date])
    conn.close()
    return df
\`\`\`

Never build SQL strings with string concatenation (\`"WHERE date = '" + user_input + "'"\`) — that's SQL injection. Always use parameterized queries.`,
      },
    ],
    python: [
      {
        title: 'Writing Modular Python Scripts',
        content: `A well-structured script has one function per responsibility. Each function does one thing, takes inputs, and returns outputs. The main block wires them together.

\`\`\`python
import sqlite3
import pandas as pd
from datetime import datetime
import time

DB_PATH = '/dataset.db'

def connect_db(path):
    """Return a database connection."""
    return sqlite3.connect(path)

def get_daily_sales(conn, date):
    """Pull all transactions for a given date."""
    query = "SELECT * FROM transactions WHERE sale_date = ?"
    return pd.read_sql(query, conn, params=[date])

def summarize_by_category(df):
    """Aggregate sales by category."""
    return df.groupby('category').agg(
        revenue=('revenue', 'sum'),
        orders=('transaction_id', 'count')
    ).reset_index()

def save_report(df, filename):
    """Save DataFrame to CSV."""
    df.to_csv(filename, index=False)
    print(f"Saved: {filename}")

def run():
    today = datetime.now().strftime('%Y-%m-%d')
    t0 = time.time()

    print(f"Running report for {today}...")
    conn = connect_db(DB_PATH)
    sales = get_daily_sales(conn, today)
    print(f"  Pulled {len(sales)} transactions in {time.time()-t0:.2f}s")

    summary = summarize_by_category(sales)
    save_report(summary, f"report_{today}.csv")

    conn.close()
    print(f"Done in {time.time()-t0:.2f}s")

run()
\`\`\`

This pattern — separate functions, timing, informative print statements — is what makes scripts maintainable by other people (and by you, six months from now).`,
      },
      {
        title: 'Error Handling with try/except',
        content: `Scripts that run unattended must handle errors gracefully — crash with a useful message, not a wall of traceback.

\`\`\`python
import sqlite3

def safe_query(db_path, query, params=None):
    """Run a query, return DataFrame or None on error."""
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql(query, conn, params=params or [])
        conn.close()
        return df

    except sqlite3.OperationalError as e:
        print(f"[ERROR] Database error: {e}")
        return None

    except FileNotFoundError:
        print(f"[ERROR] Database file not found: {db_path}")
        return None

    except Exception as e:
        print(f"[ERROR] Unexpected error: {type(e).__name__}: {e}")
        return None

result = safe_query('/dataset.db', "SELECT * FROM transactions LIMIT 10")
if result is not None:
    print(result)
else:
    print("Query failed — check the errors above")
\`\`\`

\`try/except\` catches specific exception types. List more specific exceptions first (they get checked in order). The bare \`except Exception\` at the end is a catch-all for anything unexpected.

Callers check the return value (\`if result is not None\`) rather than crashing on errors from the function.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 11 — Scale and Performance
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 11,
    sql: [
      {
        title: 'EXPLAIN QUERY PLAN',
        content: `Before optimizing a query, you need to understand what the database is actually doing. \`EXPLAIN QUERY PLAN\` shows the execution strategy:

\`\`\`sql
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE customer_id = 12345;
\`\`\`

Output to look for:
- **SCAN TABLE** — reading the entire table row by row. Bad for large tables.
- **SEARCH TABLE USING INDEX** — using an index. Good.
- **SEARCH TABLE USING COVERING INDEX** — even better.
- **TEMP B-TREE** — sorting requires a temporary sort structure.

If you see SCAN TABLE on a column you're filtering or joining on, that column needs an index.

\`\`\`sql
-- Check indexes on a table
PRAGMA index_list('transactions');
PRAGMA index_info('idx_transactions_customer');
\`\`\``,
      },
      {
        title: 'Creating Indexes',
        content: `An index is a separate data structure that makes lookups on a column fast. Without an index, the database reads every row. With an index, it jumps directly to matching rows.

\`\`\`sql
-- Create an index on customer_id (improves WHERE and JOIN performance)
CREATE INDEX idx_transactions_customer ON transactions(customer_id);

-- Multi-column index for queries that filter on both columns
CREATE INDEX idx_transactions_store_date ON transactions(store_id, sale_date);

-- Verify it's used
EXPLAIN QUERY PLAN
SELECT * FROM transactions
WHERE store_id = 5 AND sale_date >= '2024-01-01';
\`\`\`

When to index:
- Columns in WHERE clauses that filter large tables
- Columns used in JOIN ON conditions
- Columns in ORDER BY (if you sort by them often)

When NOT to index:
- Tables with < 10,000 rows (full scans are fast enough)
- Columns with very low cardinality (e.g., a boolean column with only two values)
- Columns that are rarely queried

Indexes cost write performance and disk space. Add them strategically, not everywhere.`,
      },
    ],
    python: [
      {
        title: 'Vectorization vs Loops',
        content: `Python loops are slow on large datasets. pandas operations are vectorized — they operate on entire columns at once using optimized C code under the hood.

\`\`\`python
import time
import numpy as np

n = 1_000_000
prices = np.random.uniform(1, 20, n)

# SLOW: Python loop
t0 = time.time()
total = 0
for p in prices:
    total += p * 0.08
print(f"Loop: {time.time()-t0:.3f}s → {total:.2f}")

# FAST: vectorized numpy
t0 = time.time()
total = (prices * 0.08).sum()
print(f"Vectorized: {time.time()-t0:.3f}s → {total:.2f}")
\`\`\`

Typical speedup: 50–500x. The same applies to pandas:

\`\`\`python
# Slow: apply with a lambda (row-by-row Python call)
df['tax'] = df['price'].apply(lambda x: x * 0.08)

# Fast: vectorized operation
df['tax'] = df['price'] * 0.08
\`\`\`

Rule of thumb: if you're writing a loop over DataFrame rows, there's almost certainly a vectorized equivalent that's faster. Look for it before settling for the loop.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEK 12 — Thinking Like a Senior
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 12,
    sql: [
      {
        title: 'Query Readability',
        content: `A query that works is the baseline. A query the next person can understand and modify is the goal.

Bad:
\`\`\`sql
select a.x,b.y,sum(c.z) from t1 a,t2 b,t3 c where a.id=b.id and b.id=c.id and c.dt>'2024-01-01' group by a.x,b.y having sum(c.z)>100 order by 3 desc
\`\`\`

Good:
\`\`\`sql
SELECT
    s.store_name,
    p.product_name,
    SUM(t.revenue) AS total_revenue
FROM transactions t
JOIN stores   s ON t.store_id   = s.store_id
JOIN products p ON t.product_id = p.product_id
WHERE t.sale_date > '2024-01-01'
GROUP BY s.store_name, p.product_name
HAVING SUM(t.revenue) > 100
ORDER BY total_revenue DESC;
\`\`\`

Rules:
- One clause per line
- Indent JOIN conditions under their JOIN
- Use meaningful aliases (s for stores, t for transactions — not a, b, c)
- Always name aggregates with AS
- Never ORDER BY position number (\`ORDER BY 3\`) — use the column name
- Add a comment above the query explaining what it does and why`,
      },
    ],
    python: [
      {
        title: 'Code Review Principles',
        content: `When reviewing code — yours or someone else's — look for four categories of issues:

**1. Correctness bugs** — code that produces wrong results
\`\`\`python
# Bug: this calculates the wrong average (divides by fixed 12, not actual count)
total = sum(monthly_revenues)
average = total / 12  # Wrong if some months have no data

# Fix:
average = total / len([r for r in monthly_revenues if r is not None])
\`\`\`

**2. Readability** — code that's hard to understand
\`\`\`python
# Unclear:
x = [i for i in d if d[i] > t]

# Clear:
high_revenue_stores = [store_id for store_id in daily_totals if daily_totals[store_id] > threshold]
\`\`\`

**3. Fragility** — code that breaks on unexpected input
\`\`\`python
# Fragile: crashes if list is empty
first_item = items[0]

# Safe:
first_item = items[0] if items else None
\`\`\`

**4. Inefficiency** — code that's unnecessarily slow
Covered in Week 11. Loops where vectorization works, repeated database calls in a loop, etc.

When you leave a comment explaining a change, explain the WHY, not the WHAT. "Changed / 12 to / len(...)" is obvious. "Fixed: months with no data were excluded from count but still counted in denominator, causing understated averages" is useful.`,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEKS 13–16 — Phase 4 Capstones
  // ─────────────────────────────────────────────────────────────────────────────
  {
    week: 13,
    sql: [
      {
        title: 'Dimensional Modeling — Star Schema',
        content: `A star schema separates data into fact tables and dimension tables. It's the foundation of most enterprise analytics databases.

**Fact table** — stores measurable events (transactions, clicks, orders). It's wide with many rows and contains numeric measures + foreign keys to dimensions.

**Dimension tables** — describe the entities in your facts (who, what, where, when). Smaller tables, more descriptive columns.

\`\`\`sql
-- Fact table: one row per transaction
CREATE TABLE fact_sales (
    sale_id       INTEGER PRIMARY KEY,
    date_id       INTEGER REFERENCES dim_date(date_id),
    store_id      INTEGER REFERENCES dim_store(store_id),
    product_id    INTEGER REFERENCES dim_product(product_id),
    quantity      INTEGER,
    revenue       REAL,
    discount      REAL
);

-- Dimension: date attributes
CREATE TABLE dim_date (
    date_id   INTEGER PRIMARY KEY,
    date      TEXT,
    year      INTEGER,
    quarter   INTEGER,
    month     INTEGER,
    week      INTEGER,
    day_name  TEXT
);

-- Dimension: product attributes
CREATE TABLE dim_product (
    product_id   INTEGER PRIMARY KEY,
    product_name TEXT,
    category     TEXT,
    subcategory  TEXT,
    unit_cost    REAL
);
\`\`\`

The "star" shape comes from the fact table in the center with dimension tables radiating outward. Analytical queries join the fact table to whichever dimensions you need.`,
      },
    ],
    python: [
      {
        title: 'ETL — Extract, Transform, Load',
        content: `ETL is the process of moving data from a source system into an analytics-ready structure.

\`\`\`python
import sqlite3
import pandas as pd

class ETLPipeline:
    def __init__(self, source_db, target_db):
        self.source = sqlite3.connect(source_db)
        self.target = sqlite3.connect(target_db)

    def extract(self, query):
        """Pull raw data from source."""
        return pd.read_sql(query, self.source)

    def transform_products(self, df):
        """Clean and standardize product data."""
        df['category'] = df['category'].str.strip().str.title()
        df['product_name'] = df['product_name'].str.strip()
        df = df.drop_duplicates(subset=['product_id'])
        return df

    def load(self, df, table_name, if_exists='replace'):
        """Write to target database."""
        df.to_sql(table_name, self.target, if_exists=if_exists, index=False)
        print(f"Loaded {len(df)} rows into {table_name}")

    def run(self):
        raw_products = self.extract("SELECT * FROM products")
        clean_products = self.transform_products(raw_products)
        self.load(clean_products, 'dim_product')

pipeline = ETLPipeline('/dataset.db', '/analytics.db')
pipeline.run()
\`\`\`

A class-based ETL pipeline encapsulates each step. Each method has one job. The \`run()\` method orchestrates them. This is the pattern used in real data engineering work.`,
      },
    ],
  },

  {
    week: 14,
    sql: [
      {
        title: 'Operations KPI Queries — Transit',
        content: `On-time performance is the core KPI for transit operations. The definition matters: "on time" typically means departing within 5 minutes of schedule.

\`\`\`sql
-- On-time performance by route
WITH trip_performance AS (
    SELECT
        route_id,
        trip_id,
        scheduled_departure,
        actual_departure,
        (julianday(actual_departure) - julianday(scheduled_departure)) * 1440 AS delay_minutes
    FROM trips
    WHERE actual_departure IS NOT NULL
),
route_otp AS (
    SELECT
        route_id,
        COUNT(*) AS total_trips,
        SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END) AS on_time_trips,
        AVG(delay_minutes) AS avg_delay,
        ROUND(
            100.0 * SUM(CASE WHEN delay_minutes <= 5 THEN 1 ELSE 0 END)
            / COUNT(*), 1
        ) AS otp_pct
    FROM trip_performance
    GROUP BY route_id
)
SELECT r.route_name, o.otp_pct, o.avg_delay, o.total_trips
FROM route_otp o
JOIN routes r ON o.route_id = r.route_id
ORDER BY o.otp_pct ASC;  -- worst routes first
\`\`\`

\`julianday()\` converts a datetime to a decimal day number. Subtracting two julianday values gives the difference in days; multiply by 1440 to get minutes.`,
      },
    ],
    python: [
      {
        title: 'Automated Performance Alerts',
        content: `A performance monitoring function checks KPIs against thresholds and flags violations. This is the foundation of automated alerting.

\`\`\`python
import pandas as pd
import sqlite3
from datetime import datetime, timedelta

OTP_THRESHOLD = 80.0  # flag routes below 80% on-time

def get_route_performance(conn, days_back=30):
    cutoff = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    return pd.read_sql("""
        SELECT
            r.route_name,
            COUNT(*) as total_trips,
            ROUND(100.0 * SUM(CASE
                WHEN (julianday(t.actual_departure) - julianday(t.scheduled_departure)) * 1440 <= 5
                THEN 1 ELSE 0 END) / COUNT(*), 1) as otp_pct
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

conn = sqlite3.connect('/dataset.db')
perf = get_route_performance(conn)
alerts = flag_underperforming(perf)

print(f"\\n=== PERFORMANCE ALERTS ({datetime.now().strftime('%Y-%m-%d')}) ===")
for _, row in alerts.iterrows():
    print(f"[{row['status']}] {row['route_name']}: {row['otp_pct']}% on-time")
\`\`\``,
      },
    ],
  },

  {
    week: 15,
    sql: [
      {
        title: 'Anomaly Detection in SQL',
        content: `Statistical anomaly detection in SQL uses aggregate functions to establish a baseline, then flags deviations.

\`\`\`sql
-- Establish baseline: mean and standard deviation per category
WITH baseline AS (
    SELECT
        category,
        AVG(revenue) AS mean_revenue,
        -- SQLite has no STDDEV; approximate with variance formula
        SQRT(AVG(revenue * revenue) - AVG(revenue) * AVG(revenue)) AS stddev_revenue
    FROM transactions
    WHERE sale_date < date('now', '-7 days')  -- use historical data for baseline
    GROUP BY category
),
-- Flag rows more than 2 standard deviations from mean
flagged AS (
    SELECT
        t.transaction_id,
        t.sale_date,
        t.category,
        t.revenue,
        b.mean_revenue,
        b.stddev_revenue,
        (t.revenue - b.mean_revenue) / NULLIF(b.stddev_revenue, 0) AS z_score
    FROM transactions t
    JOIN baseline b ON t.category = b.category
    WHERE t.sale_date >= date('now', '-7 days')
)
SELECT *
FROM flagged
WHERE ABS(z_score) > 2
ORDER BY ABS(z_score) DESC;
\`\`\`

A z-score measures how many standard deviations a value is from the mean. Anything above 2 (or below -2) is statistically unusual.`,
      },
    ],
    python: [
      {
        title: 'IQR Anomaly Detection',
        content: `The IQR (Interquartile Range) method is robust to outliers in the baseline — it doesn't assume a normal distribution.

\`\`\`python
import pandas as pd
import numpy as np

def detect_anomalies_iqr(df, column, group_by=None):
    """Flag outliers using the IQR method (1.5x IQR rule)."""

    if group_by:
        results = []
        for group, gdf in df.groupby(group_by):
            gdf = gdf.copy()
            Q1 = gdf[column].quantile(0.25)
            Q3 = gdf[column].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            gdf['is_anomaly'] = ~gdf[column].between(lower, upper)
            gdf['lower_bound'] = lower
            gdf['upper_bound'] = upper
            results.append(gdf)
        return pd.concat(results)
    else:
        df = df.copy()
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        df['is_anomaly'] = ~df[column].between(Q1 - 1.5*IQR, Q3 + 1.5*IQR)
        return df

# Usage
df_flagged = detect_anomalies_iqr(df, column='revenue', group_by='category')
anomalies = df_flagged[df_flagged['is_anomaly']]
print(f"Found {len(anomalies)} anomalies out of {len(df)} transactions")
print(anomalies[['transaction_id', 'category', 'revenue', 'lower_bound', 'upper_bound']])
\`\`\``,
      },
    ],
  },

  {
    week: 16,
    sql: [
      {
        title: 'Portfolio Defense — SQL Review',
        content: `Week 16 is not new material. It's a structured review of every SQL concept from the course, framed as interview-style questions you should be able to answer.

**Phase 1 — Foundations:**
- What is the difference between WHERE and HAVING?
- When would you use LEFT JOIN instead of INNER JOIN?
- What does NULL mean and why can't you use \`= NULL\`?

**Phase 2 — Intermediate:**
- Explain what a window function does. How is RANK() different from ROW_NUMBER()?
- What is a CTE and why would you use one instead of a subquery?
- What does LAG() do? Give a real use case.

**Phase 3 — Integration:**
- What does EXPLAIN QUERY PLAN tell you? What does SCAN TABLE mean?
- When should you create an index? When should you not?

**Capstone defense questions:**
- Walk me through your most complex query. Why did you structure it that way?
- What's a decision you made in Week 14 (transit) that you'd change with more time?
- How did you define "anomaly" in Week 15? What are the tradeoffs of that definition?

If you can answer these in plain English to someone unfamiliar with the domain, you've internalized the material.`,
      },
    ],
    python: [
      {
        title: 'Portfolio Defense — Python Review',
        content: `Same format — review questions you should be able to answer cold.

**Phase 1 — Foundations:**
- What's the difference between \`==\` and \`=\` in Python?
- What is a list comprehension? When would you use one vs a for loop?

**Phase 2 — Intermediate:**
- What is a pandas DataFrame? How is it different from a Python list?
- What does \`groupby().agg()\` do? What SQL statement does it map to?
- What's the difference between \`.loc\` and \`.iloc\`?

**Phase 3 — Integration:**
- What does \`try/except\` do? Why not just let the program crash?
- What is vectorization? Why is \`df['col'] * 2\` faster than a loop?

**Capstone defense questions:**
- Walk me through your ETL class from Week 13. What does each method do?
- In your Week 14 alert system, how did you define the OTP threshold? What would happen if you changed it to 90%?
- In your anomaly detector, what's the tradeoff between IQR and z-score methods?

The goal of this week is to be able to explain your decisions — not just what you did, but why you did it that way and what you'd do differently.`,
      },
    ],
  },
]

export function getWeekLesson(week: number): WeekLesson | undefined {
  return LESSONS.find(l => l.week === week)
}
