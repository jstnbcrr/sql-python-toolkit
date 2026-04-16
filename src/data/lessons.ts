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

In plain terms: a database is a collection of data structured into tables. Iliev compares it to spreadsheets — and that's a good starting point. You've probably used Excel or Google Sheets. A database table works the same way at first glance: rows of data, columns of attributes.

The difference is scale and precision. A spreadsheet handles hundreds of rows comfortably. A database handles millions. And unlike a spreadsheet, a database enforces rules — data types, required fields, relationships between tables.

For our purposes: the Panda Express menu is a table. Each row is one menu item. Each column is an attribute of that item — name, category, price, calories. That's a database.

The type we use in this app is a **relational database** (specifically SQLite). "Relational" means tables can be linked to each other. An orders table can reference a menu table. A bus routes table can reference a stops table. That linking is what makes databases powerful.`,
      },
      {
        title: 'Tables, Rows, and Columns',
        content: `From Iliev's book, a table has columns with specific data types. He lists the most common ones:

- \`INT\` — whole numbers (quantity: 3, store_id: 12)
- \`VARCHAR(n)\` — text up to n characters (item_name, category)
- \`TEXT\` — longer text with no fixed limit
- \`BOOLEAN\` — true or false
- \`DATE\` — a calendar date

The menu table in this week's database looks like this:

~~~
+----+----------------+----------+-------+----------+
| id | item_name      | category | price | calories |
+----+----------------+----------+-------+----------+
|  1 | Orange Chicken | Entrees  |  6.99 |      490 |
|  2 | Fried Rice     | Sides    |  3.99 |      520 |
|  3 | Chow Mein      | Sides    |  3.99 |      510 |
+----+----------------+----------+-------+----------+
~~~

Each row is one menu item. Each column holds one type of information. The \`id\` column is the **primary key** — it uniquely identifies each row. No two items share an id.

This structure is not arbitrary. Separating data into typed columns is what lets SQL ask precise questions of it.`,
      },
      {
        title: 'SELECT — Retrieving Data',
        content: `Iliev's book breaks down the SELECT statement like this:

~~~sql
SELECT * FROM users;
~~~

His rundown: "SELECT — First, we specify the action we want to execute. * — The star indicates we want to get all columns. FROM — tells MySQL which table we want to select from."

In our context:

~~~sql
SELECT * FROM menu_items;
~~~

This returns every row, every column. The \`*\` is a wildcard meaning "all columns." For exploration it's fine. For production queries, you want to name the columns explicitly:

~~~sql
SELECT name, price FROM menu_items;
~~~

This returns only the item name and price. When a table has 30 columns and you need 3, naming them is essential.

**ORDER BY** — control the sort order:

~~~sql
SELECT name, price
FROM menu_items
ORDER BY price DESC;
~~~

\`DESC\` = descending (highest first). \`ASC\` = ascending (lowest first, and is the default).

**LIMIT** — cap the result:

~~~sql
SELECT name, price
FROM menu_items
ORDER BY price DESC
LIMIT 5;
~~~

The 5 most expensive items. Iliev notes that clause order matters: SELECT → FROM → ORDER BY → LIMIT. SQL expects them in this sequence.`,
      },
      {
        title: 'DISTINCT and Pattern Matching',
        content: `**DISTINCT** removes duplicate values from results. Use it when you want to know what unique values exist:

~~~sql
SELECT DISTINCT category FROM menu_items;
~~~

Without DISTINCT you'd get one row per menu item, category repeated for each. With it — one row per category.

**LIKE** — Iliev covers this under "Pattern Matching." Two wildcard characters:
- \`%\` — matches any number of characters (including zero)
- \`_\` — matches exactly one character

~~~sql
-- Items whose name ends with "Chicken"
SELECT * FROM menu_items WHERE name LIKE '%Chicken';

-- Items whose name contains "rice" anywhere
SELECT * FROM menu_items WHERE name LIKE '%rice%';

-- Items starting with exactly one character then "ried"
SELECT * FROM menu_items WHERE name LIKE '_ried%';
~~~

Iliev's example from the book: \`SELECT * FROM users WHERE username LIKE '%y'\` — finds usernames ending with the letter y. Same logic, different table.

Run \`SELECT DISTINCT category FROM menu_items\` first. That tells you what categories exist. Then use LIKE to explore naming patterns. That two-step exploration is how you start with any new dataset.`,
      },
    ],
    python: [
      {
        title: 'Expressions and the Interactive Shell',
        content: `Sweigart opens Chapter 1 of Automate the Boring Stuff with this: "You can run the interactive shell by launching the Mu editor... You should see a >>> prompt."

In this app, the Python editor IS that interactive shell — but more powerful. You type code, press Run, and see results immediately.

The most basic Python instruction is an **expression** — a value combined with an operator that reduces to a single value:

~~~python
2 + 2        # evaluates to 4
5 * 3        # evaluates to 15
22 / 8       # evaluates to 2.75
22 // 8      # evaluates to 2  (floor division — drops the decimal)
22 % 8       # evaluates to 6  (modulus — the remainder)
2 ** 3       # evaluates to 8  (exponent — 2 to the power of 3)
~~~

Sweigart's operator precedence table (highest to lowest): \`**\` first, then \`*\`, \`/\`, \`//\`, \`%\`, then \`+\` and \`-\`. Same as math class. Use parentheses to override: \`(2 + 3) * 4\` = 20, not 14.

**Errors are okay.** Sweigart's note: "An error message won't break your computer, so don't be afraid to make mistakes. A crash just means the program stopped running unexpectedly." Every programmer reads error messages constantly. It's normal.`,
      },
      {
        title: 'Variables and Data Types',
        content: `From Sweigart Chapter 1 — variables store values so you can use them later:

~~~python
item_name = "Orange Chicken"
price = 6.99
quantity = 3
in_stock = True
~~~

The four basic data types Sweigart covers:
- \`str\` — text in quotes: \`"Orange Chicken"\`
- \`int\` — whole number: \`3\`
- \`float\` — decimal number: \`6.99\`
- \`bool\` — exactly \`True\` or \`False\` (capital T/F, no quotes)

Variable naming rules from Sweigart: "It can be only one word with no spaces. It can use only letters, numbers, and the underscore character. It can't begin with a number." So \`item_name\` is valid, \`1item\` is not.

**Type conversion** — Sweigart shows how to switch between types:

~~~python
str(3.99)    # turns the number 3.99 into the string "3.99"
int("42")    # turns the string "42" into the number 42
float("6.99") # turns the string "6.99" into the number 6.99
~~~

This matters when data comes in as text that needs to be treated as a number — which happens constantly with real-world data.`,
      },
      {
        title: 'print(), input(), and len()',
        content: `Sweigart introduces three built-in functions in Chapter 1 that you'll use constantly:

**print()** — displays output:

~~~python
print("Hello, Panda Express")
print(item_name)
print("Item:", item_name, "Price:", price)
~~~

When you pass multiple things to \`print()\`, it separates them with a space automatically.

**f-strings** — Sweigart covers string formatting as the modern way to embed variables in text:

~~~python
item_name = "Orange Chicken"
price = 6.99
print(f"{item_name} costs \${price:.2f}")
# Orange Chicken costs $6.99
~~~

The \`f\` before the quote activates f-string mode. Variables in \`{curly braces}\` get replaced with their values. The \`:.2f\` after a variable formats it as a decimal with 2 places.

**input()** — reads text typed by the user:

~~~python
name = input("What is your name? ")
print(f"Hello, {name}")
~~~

**len()** — returns the length of a string or list:

~~~python
len("Orange Chicken")   # 14
len([1, 2, 3])          # 3
~~~

SQL equivalent: \`LENGTH(item_name)\` does the same thing as Python's \`len(item_name)\`.`,
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

The WHERE clause is that criteria. It filters which rows come back:

~~~sql
SELECT * FROM orders
WHERE category = 'Entrees';
~~~

Only rows where category is exactly 'Entrees' come back. Iliev's rundown: the WHERE clause is evaluated before SELECT — the database filters first, then decides what to show you.

Comparison operators:
- \`=\` equals (note: single = in SQL, not ==)
- \`!=\` or \`<>\` not equals
- \`>\` greater than, \`<\` less than
- \`>=\` greater than or equal, \`<=\` less than or equal

~~~sql
SELECT name, price FROM orders
WHERE price > 5.00;

SELECT * FROM orders
WHERE status != 'cancelled';
~~~

Important detail from Iliev: text values use single quotes (\`'Entrees'\`). Numbers do not use quotes (\`5.00\`). Mixing these up is one of the most common beginner SQL errors.`,
      },
      {
        title: 'AND, OR, NOT',
        content: `Iliev covers combining conditions to narrow or broaden filters:

~~~sql
SELECT * FROM orders
WHERE category = 'Entrees'
  AND quantity > 2;
~~~

AND means BOTH conditions must be true. OR means at least one must be:

~~~sql
SELECT * FROM orders
WHERE category = 'Entrees'
   OR category = 'Sides';
~~~

NOT inverts a condition:

~~~sql
SELECT * FROM orders
WHERE NOT category = 'Drinks';
~~~

**Operator precedence warning** — AND evaluates before OR, same as multiplication before addition in math. Without parentheses this can produce unexpected results:

~~~sql
-- AMBIGUOUS — does OR apply to both conditions or just the second?
WHERE category = 'Entrees' OR category = 'Sides' AND quantity > 3

-- EXPLICIT — use parentheses to be clear
WHERE (category = 'Entrees' OR category = 'Sides') AND quantity > 3
~~~

Always use parentheses when mixing AND and OR. It makes your intent clear to both the database and the next person reading your query.`,
      },
      {
        title: 'NULL — The Absent Value',
        content: `Iliev dedicates a section to NULL because it trips up almost everyone. His book: "By default, each column in your table can hold NULL values."

NULL means no value was provided — not zero, not an empty string, but genuinely absent. A customer who didn't leave a phone number: their phone column is NULL. An order with no special instructions: notes column is NULL.

The trap: you cannot compare NULL with \`=\`:

~~~sql
-- WRONG — this returns nothing, not an error
SELECT * FROM orders WHERE notes = NULL;
~~~

The right way:

~~~sql
-- Correct
SELECT * FROM orders WHERE notes IS NULL;
SELECT * FROM orders WHERE notes IS NOT NULL;
~~~

Why? Because NULL is not a value — it's the absence of one. The expression \`notes = NULL\` doesn't return true or false; it returns NULL. And NULL is never true.

From Iliev: "If you wanted to allow NULL values for a column, you don't need to do anything — it's the default. To prevent NULLs, add NOT NULL when creating the table." In real-world data you'll encounter NULLs constantly. Handling them correctly separates clean analysis from incorrect analysis.`,
      },
      {
        title: 'IN and BETWEEN',
        content: `Iliev's book covers shortcuts that make queries more readable.

**IN** replaces multiple OR conditions:

~~~sql
-- Instead of:
WHERE category = 'Entrees' OR category = 'Sides' OR category = 'Appetizers'

-- Write:
WHERE category IN ('Entrees', 'Sides', 'Appetizers')
~~~

**BETWEEN** filters an inclusive range:

~~~sql
SELECT * FROM orders
WHERE price BETWEEN 4.00 AND 8.00;
~~~

Both endpoints are included. This is equivalent to \`price >= 4.00 AND price <= 8.00\`.

**LIKE** with wildcards (from Iliev's pattern matching section):

~~~sql
-- Items starting with "Orange"
SELECT * FROM orders WHERE name LIKE 'Orange%';

-- Items containing "Chicken" anywhere
SELECT * FROM orders WHERE name LIKE '%Chicken%';
~~~

These aren't just shortcuts — they make queries easier to maintain. If you add a new category later, you change one line in the IN list rather than adding another OR.`,
      },
    ],
    python: [
      {
        title: 'Boolean Values and Comparison Operators',
        content: `Sweigart opens Chapter 2: "Before you learn about flow control statements, you first need to learn how to represent those yes and no options."

Boolean values in Python are exactly \`True\` or \`False\` — capitalized, no quotes. Sweigart's example from the interactive shell:

~~~python
spam = True
spam          # True

true          # NameError: name 'true' is not defined
              # (lowercase 'true' doesn't work)
~~~

Comparison operators produce Boolean values:

~~~python
price = 6.99

price > 5          # True
price == 6.99      # True  (== compares, = assigns — different!)
price != 10        # True
price < 3          # False
~~~

Sweigart notes: "The == operator (equal to) asks whether two values are the same. The = operator (assignment) puts the value on the right into the variable on the left." This is one of the most common beginner mistakes — using = when you mean ==.

Boolean operators: \`and\`, \`or\`, \`not\` (all lowercase in Python, unlike SQL's AND/OR/NOT):

~~~python
category = "Entrees"
quantity = 4

category == "Entrees" and quantity > 2   # True
category == "Drinks"  or  price < 3      # False
not (price > 10)                         # True
~~~`,
      },
      {
        title: 'if / elif / else — Flow Control',
        content: `From Sweigart Chapter 2: "Flow control statements can decide which Python instructions to execute under which conditions."

He uses flowchart diagrams in the book — branching paths with diamonds (decisions) and rectangles (actions). The \`if\` statement is that diamond:

~~~python
price = 6.99

if price > 8:
    print("Premium item")
elif price > 5:
    print("Standard item")
else:
    print("Budget item")
~~~

Sweigart's structure: the \`if\` keyword, a condition, a colon. Then an indented block — "the clause" — that runs when the condition is True. The \`elif\` (else if) checks another condition only if the first was False. The \`else\` runs only if nothing above was True.

**Indentation is the rule.** Python uses 4 spaces (or one tab) to mark a block. Sweigart: "Python knows where the if block ends when it encounters a statement that is indented as much as the initial if statement." No curly braces — indentation IS the structure.

SQL equivalent: \`CASE WHEN price > 8 THEN 'Premium' WHEN price > 5 THEN 'Standard' ELSE 'Budget' END\` — same logic, different syntax.`,
      },
      {
        title: 'while Loops and for Loops',
        content: `Sweigart Chapter 2 covers both loop types. A **while loop** keeps running as long as a condition is True:

~~~python
items_remaining = 3

while items_remaining > 0:
    print(f"Processing item, {items_remaining} left")
    items_remaining = items_remaining - 1

print("Done")
~~~

A **for loop** with \`range()\` runs a fixed number of times. Sweigart: "The range() function returns a sequence of numbers."

~~~python
for i in range(5):
    print(i)       # prints 0, 1, 2, 3, 4
~~~

\`range(start, stop)\` — starts at \`start\`, stops BEFORE \`stop\`:

~~~python
for i in range(1, 6):
    print(i)       # prints 1, 2, 3, 4, 5
~~~

For loops also iterate directly over a list (covered more in Week 3):

~~~python
categories = ["Entrees", "Sides", "Drinks"]

for category in categories:
    print(category)
~~~

\`break\` exits a loop early. \`continue\` skips to the next iteration. Sweigart uses these in games and interactive programs — you'll use them in data validation.`,
      },
    ],
  },

  // ─── WEEK 3 ──────────────────────────────────────────────────────────────────
  {
    week: 3,
    sql: [
      {
        title: 'Aggregate Functions',
        content: `Iliev covers aggregates as the way to summarize data rather than retrieve individual rows. Instead of seeing every sale, you ask: how many? how much total? what's the average?

~~~sql
SELECT COUNT(*) FROM sales;           -- total number of rows
SELECT COUNT(notes) FROM sales;       -- rows where notes is NOT NULL
SELECT SUM(revenue) FROM sales;       -- total of all revenue values
SELECT AVG(revenue) FROM sales;       -- average revenue per row
SELECT MIN(revenue) FROM sales;       -- smallest single value
SELECT MAX(revenue) FROM sales;       -- largest single value
~~~

Critical distinction Iliev makes: \`COUNT(*)\` counts all rows including those with NULLs. \`COUNT(column_name)\` counts only rows where that column has a value. If 10 orders have no notes, \`COUNT(*)\` includes them but \`COUNT(notes)\` doesn't. This difference produces different numbers and both are sometimes what you want.

Name your results with AS:

~~~sql
SELECT
    COUNT(*)        AS total_orders,
    SUM(revenue)    AS total_revenue,
    AVG(revenue)    AS avg_order_value,
    MAX(revenue)    AS largest_order
FROM sales;
~~~`,
      },
      {
        title: 'GROUP BY and HAVING',
        content: `Iliev's book: GROUP BY groups rows that have the same values in specified columns into summary rows.

~~~sql
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category;
~~~

One row per category, with the sum of revenue for that category. Mental model: GROUP BY sorts rows into piles by the grouped column, then runs the aggregate on each pile.

You can group by multiple columns:

~~~sql
SELECT category, hour_of_day, SUM(revenue) AS revenue
FROM sales
GROUP BY category, hour_of_day
ORDER BY category, hour_of_day;
~~~

**HAVING** filters groups AFTER aggregation. This is the distinction Iliev emphasizes — WHERE filters rows before grouping, HAVING filters groups after:

~~~sql
-- Find categories with more than $500 in total revenue
SELECT category, SUM(revenue) AS total_revenue
FROM sales
GROUP BY category
HAVING SUM(revenue) > 500;
~~~

The rule: if your condition references an aggregate function (SUM, COUNT, AVG...), use HAVING. Otherwise use WHERE. They can both appear in the same query:

~~~sql
SELECT category, COUNT(*) AS order_count
FROM sales
WHERE status = 'complete'         -- filters rows first
GROUP BY category
HAVING COUNT(*) > 10;             -- then filters groups
~~~`,
      },
      {
        title: 'ORDER BY with Aggregates',
        content: `ORDER BY works on the results of aggregates too — sort by the calculated column:

~~~sql
-- Which hour of the day had the most revenue? Show highest first.
SELECT
    strftime('%H', sale_time)  AS hour,
    SUM(revenue)               AS hourly_revenue,
    COUNT(*)                   AS order_count
FROM sales
GROUP BY hour
ORDER BY hourly_revenue DESC;
~~~

You can ORDER BY a column alias (the name you gave it with AS) in most databases including SQLite.

The full clause order that SQL expects:

~~~
SELECT
FROM
WHERE        ← filters rows
GROUP BY     ← groups them
HAVING       ← filters groups
ORDER BY     ← sorts results
LIMIT        ← caps results
~~~

Iliev's book notes that understanding this order matters because SQL evaluates them in this sequence internally — even though you write SELECT first, the database processes FROM and WHERE before it knows what to show you.`,
      },
    ],
    python: [
      {
        title: 'Functions — def, parameters, return',
        content: `Sweigart Chapter 3: "A function is like a miniprogram within a program."

His first example:

~~~python
def hello():
    print('Howdy!')
    print('Howdy!!!')
    print('Hello there.')

hello()
hello()
hello()
~~~

"A major purpose of functions is to group code that gets executed multiple times. Without a function defined, you would have to copy and paste this code each time." That's the point — write once, use many times.

**Parameters** are the inputs a function accepts. **Arguments** are the values you pass when calling it:

~~~python
def greet_item(item_name, price):
    print(f"{item_name} is available for \${price:.2f}")

greet_item("Orange Chicken", 6.99)
greet_item("Fried Rice", 3.99)
~~~

**Return values** — Sweigart: "When creating a function using the def statement, you can specify what the return value should be with a return statement":

~~~python
def calculate_tax(price, rate=0.08):
    return price * rate

tax = calculate_tax(6.99)
print(tax)   # 0.5592

# Default parameters: rate=0.08 is used if you don't pass one
tax_ca = calculate_tax(6.99, 0.0725)
~~~`,
      },
      {
        title: 'Scope and the None Value',
        content: `Sweigart covers two concepts in Chapter 3 that confuse beginners: scope and None.

**Scope** — variables created inside a function only exist inside that function:

~~~python
def make_report():
    report_title = "Sales Summary"    # local variable
    print(report_title)

make_report()
print(report_title)   # NameError — report_title doesn't exist here
~~~

Variables inside a function are "local." Variables outside are "global." Sweigart's rule: "If you need to modify a global variable from within a function, use the global keyword." But in practice, the cleaner approach is to pass values in as parameters and return values out.

**None** — Sweigart: "Functions that don't have a return statement return None." It represents the absence of a value:

~~~python
def say_hello():
    print("Hello")
    # no return statement

result = say_hello()
print(result)    # None

# None is Python's equivalent of SQL's NULL
# Check for it with: if result is None:
~~~

**Exception handling** from Sweigart Chapter 3:

~~~python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Error: cannot divide by zero")
        return None

print(safe_divide(10, 2))    # 5.0
print(safe_divide(10, 0))    # Error message, then None
~~~`,
      },
      {
        title: 'Lists',
        content: `Sweigart Chapter 4: "A list is a value that contains multiple values in an ordered sequence."

~~~python
menu_items = ['Orange Chicken', 'Fried Rice', 'Chow Mein', 'Broccoli Beef']
~~~

**Indexing** — Sweigart: "The first value in the list is at index 0." Zero-based:

~~~python
menu_items[0]    # 'Orange Chicken'
menu_items[1]    # 'Fried Rice'
menu_items[-1]   # 'Broccoli Beef'  (negative indexes count from end)
~~~

**Slicing** \`[start:end]\` — returns a new list from start up to (not including) end:

~~~python
menu_items[1:3]   # ['Fried Rice', 'Chow Mein']
menu_items[:2]    # ['Orange Chicken', 'Fried Rice']
menu_items[2:]    # ['Chow Mein', 'Broccoli Beef']
~~~

**List methods** Sweigart covers:

~~~python
menu_items.append('Honey Walnut Shrimp')  # adds to end
menu_items.insert(1, 'Beijing Beef')      # inserts at position 1
menu_items.remove('Chow Mein')            # removes first match
menu_items.sort()                         # sorts in place (alphabetical)
len(menu_items)                           # number of items
'Fried Rice' in menu_items                # True — checks membership
~~~

SQL equivalent: a list is like a single-column table. \`len()\` is like \`COUNT(*)\`. \`in\` is like \`WHERE item IN (...)\`.`,
      },
    ],
  },

  // ─── WEEK 4 ──────────────────────────────────────────────────────────────────
  {
    week: 4,
    sql: [
      {
        title: 'Primary Keys and Foreign Keys',
        content: `Iliev's book explains keys through the table creation syntax he uses throughout. A primary key uniquely identifies each row — no duplicates allowed:

~~~sql
CREATE TABLE customers
(
    id       INT PRIMARY KEY AUTO_INCREMENT,
    name     VARCHAR(255) NOT NULL,
    email    VARCHAR(255)
);
~~~

Iliev: "The primary key column is a unique identifier for our users. We want the id column to be unique, and also, whenever we add new users, we want the ID to autoincrement for each new user."

A **foreign key** is a column in one table that references the primary key of another:

~~~sql
CREATE TABLE orders
(
    id          INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,          -- this references customers.id
    total       DECIMAL(8,2),
    order_date  DATE
);
~~~

The \`customer_id\` in the orders table "belongs to" the \`id\` column in the customers table. That relationship is the "relational" in relational database.

Why separate the tables? Iliev's reasoning: instead of storing the customer's name and email in every single order row, you store it once in customers and reference it by ID. If a customer changes their email, you update one row — not thousands.`,
      },
      {
        title: 'INNER JOIN',
        content: `Iliev covers JOINs as the mechanism to combine data from related tables. INNER JOIN returns only rows where there's a match in both tables:

~~~sql
SELECT
    c.name,
    c.email,
    o.id        AS order_id,
    o.total,
    o.order_date
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
ORDER BY o.order_date DESC;
~~~

The \`ON\` clause specifies the join condition — which columns connect the two tables. Always join on the primary key / foreign key pair.

The \`c\` and \`o\` are table aliases — Iliev uses these to avoid writing the full table name repeatedly. \`customers c\` means "call the customers table 'c' in this query."

What gets excluded: any customer with no orders won't appear. Any order with no matching customer won't appear. INNER JOIN is the intersection — only matched rows from both sides.

~~~sql
-- Simpler: JOIN without INNER means the same thing in most databases
SELECT c.name, o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id;
~~~`,
      },
      {
        title: 'LEFT JOIN — Keeping Unmatched Rows',
        content: `LEFT JOIN keeps every row from the left table even when there's no match in the right. Unmatched right-side columns come back as NULL.

~~~sql
SELECT
    c.name,
    c.email,
    o.id    AS order_id,
    o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;
~~~

Customers who've never ordered appear with NULL in the order_id and total columns.

**The classic pattern** — finding records with no match:

~~~sql
-- Customers who have NEVER placed an order
SELECT c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
~~~

First the LEFT JOIN brings in all customers, putting NULL where no order exists. Then WHERE filters to only those NULLs. The result: customers with no order history.

Iliev's distinction: use INNER JOIN when you only want matched records. Use LEFT JOIN when you need all records from the primary table regardless of whether matches exist. In practice you'll reach for LEFT JOIN more often — it's less likely to silently drop data you need.`,
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

menu_item['name']      # 'Orange Chicken'
menu_item['price']     # 6.99
~~~

**vs. Lists** — Sweigart's contrast: "Unlike lists, items in dictionaries are unordered. While the order of items matters for lists, it does not matter what order the key-value pairs are typed in a dictionary."

Dictionary methods Sweigart covers:

~~~python
menu_item.keys()    # dict_keys(['name', 'category', 'price', 'calories'])
menu_item.values()  # dict_values(['Orange Chicken', 'Entrees', 6.99, 490])
menu_item.items()   # dict_items([('name', 'OC'), ('category', 'Entrees')...])

# Safe lookup — returns default if key doesn't exist (won't crash)
menu_item.get('allergens', 'not listed')   # 'not listed'
~~~

**KeyError** — Sweigart: "Trying to access a key that does not exist in a dictionary will result in a KeyError error message." Use \`.get()\` to avoid this.`,
      },
      {
        title: 'Dictionaries as Data Structures',
        content: `Sweigart Chapter 5 shows how dictionaries model real-world structured data. His tic-tac-toe example uses a dictionary to represent a board. The same idea applies to representing database rows:

~~~python
# A list of dictionaries = a table
orders = [
    {'order_id': 101, 'customer': 'Justin', 'item': 'Orange Chicken', 'qty': 2},
    {'order_id': 102, 'customer': 'Maria',  'item': 'Fried Rice',     'qty': 1},
    {'order_id': 103, 'customer': 'Justin', 'item': 'Chow Mein',      'qty': 3},
]

# Iterate and access like SQL rows
for order in orders:
    print(f"Order {order['order_id']}: {order['customer']} ordered {order['qty']}x {order['item']}")
~~~

**Nested dictionaries** — Sweigart's "structuring data" section shows dictionaries containing dictionaries:

~~~python
customers = {
    1: {'name': 'Justin', 'email': 'j@example.com'},
    2: {'name': 'Maria',  'email': 'm@example.com'},
}

# Simulating a JOIN — look up customer by foreign key
for order in orders:
    cid = order.get('customer_id')
    customer = customers.get(cid, {})
    name = customer.get('name', 'Unknown')
    print(f"Order for: {name}")
~~~

This is exactly what SQL's JOIN does — Python just makes the mechanism visible instead of hiding it.`,
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
