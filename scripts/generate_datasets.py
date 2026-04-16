#!/usr/bin/env python3
"""
generate_datasets.py — Run once at setup.
Creates realistic SQLite databases for each week's exercises.
"""

import os
import sqlite3
import random
import json
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(PROJECT_ROOT, "public", "datasets")

random.seed(42)  # Reproducible


def rnd(a, b):
    return round(random.uniform(a, b), 2)


def rnd_int(a, b):
    return random.randint(a, b)


def choice(lst):
    return random.choice(lst)


def create_db(filename):
    path = os.path.join(OUT_DIR, filename)
    if os.path.exists(path):
        os.remove(path)
    conn = sqlite3.connect(path)
    return conn, conn.cursor()


# ──────────────────────────────────────────────────────────────
# WEEK 1 — panda_express_menu.db
# ──────────────────────────────────────────────────────────────
def week1_menu():
    conn, cur = create_db("week1_menu.db")
    cur.executescript("""
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        );
        CREATE TABLE menu_items (
            id INTEGER PRIMARY KEY,
            category_id INTEGER REFERENCES categories(id),
            name TEXT NOT NULL,
            price REAL NOT NULL,
            calories INTEGER,
            is_available INTEGER DEFAULT 1,
            is_new INTEGER DEFAULT 0,
            description TEXT
        );
    """)
    categories = [
        (1, 'Entrees', 'Main dishes - the stars of the meal'),
        (2, 'Sides', 'Rice, noodles, and veggies'),
        (3, 'Appetizers', 'Starters and small bites'),
        (4, 'Drinks', 'Beverages and fountain drinks'),
        (5, 'Desserts', 'Sweet endings'),
    ]
    cur.executemany("INSERT INTO categories VALUES (?,?,?)", categories)
    items = [
        (1,1,'Orange Chicken',6.99,490,1,0,'Our signature dish — crispy chicken in sweet orange sauce'),
        (2,1,'Beijing Beef',6.99,690,1,0,'Crispy beef with bell peppers in savory Beijing sauce'),
        (3,1,'Kung Pao Chicken',6.99,290,1,0,'Diced chicken with peanuts in spicy sauce'),
        (4,1,'Broccoli Beef',6.99,150,1,0,'Tender beef with fresh broccoli'),
        (5,1,'Mushroom Chicken',6.99,220,1,0,'Marinated chicken with mushrooms and zucchini'),
        (6,1,'String Bean Chicken',6.99,190,1,0,'Chicken breast with green beans'),
        (7,1,'Black Pepper Angus Steak',8.99,180,1,1,'Premium Angus steak'),
        (8,1,'Honey Walnut Shrimp',8.99,360,1,0,'Shrimp with honey sauce and walnuts'),
        (9,1,'Grilled Teriyaki Chicken',6.99,300,1,0,'Grilled chicken with teriyaki sauce'),
        (10,1,'SweetFire Chicken Breast',6.99,380,1,0,'Crispy chicken with pineapple and sweet chili'),
        (11,2,'Chow Mein',4.99,510,1,0,'Stir-fried noodles with vegetables'),
        (12,2,'Fried Rice',4.99,520,1,0,'Wok-tossed rice with egg and soy'),
        (13,2,'White Steamed Rice',3.99,380,1,0,'Classic steamed white rice'),
        (14,2,'Super Greens',4.99,90,1,0,'Broccoli, kale, and cabbage blend'),
        (15,3,'Cream Cheese Rangoon',3.99,190,1,0,'Crispy wontons filled with cream cheese'),
        (16,3,'Apple Pie Roll',3.99,230,1,0,'Apple pie filling in a crispy roll'),
        (17,3,'Chicken Egg Roll',2.99,200,1,0,'Classic egg roll with chicken'),
        (18,4,'Fountain Drink',2.49,None,1,0,'Pepsi products — free refills'),
        (19,4,'Bottled Water',1.99,0,1,0,'16oz bottled water'),
        (20,4,'Apple Juice',2.49,110,1,0,'100% apple juice'),
        (21,5,'Fortune Cookie',0.50,32,1,0,'Classic fortune cookie'),
        (22,5,'Mango Pineapple Drink',3.49,230,1,1,'NEW seasonal beverage'),
    ]
    cur.executemany("INSERT INTO menu_items VALUES (?,?,?,?,?,?,?,?)", items)
    conn.commit()
    conn.close()
    print("  ✓ week1_menu.db")


# ──────────────────────────────────────────────────────────────
# WEEK 2 — week2_orders.db  (with NULLs and edge cases)
# ──────────────────────────────────────────────────────────────
def week2_orders():
    conn, cur = create_db("week2_orders.db")
    cur.executescript("""
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            order_date TEXT,
            customer_name TEXT,
            item_name TEXT,
            quantity INTEGER,
            unit_price REAL,
            total_price REAL,
            status TEXT,
            location TEXT,
            employee_id INTEGER
        );
    """)

    statuses = ['complete', 'pending', 'cancelled', 'refunded']
    locations = ['Downtown', 'Eastside', 'Westgate', 'University', 'Airport']
    items = ['Orange Chicken', 'Beijing Beef', 'Chow Mein', 'Fried Rice', 'Kung Pao Chicken',
             'Broccoli Beef', 'Cream Cheese Rangoon', 'Fountain Drink']
    prices = {'Orange Chicken': 6.99, 'Beijing Beef': 6.99, 'Chow Mein': 4.99,
              'Fried Rice': 4.99, 'Kung Pao Chicken': 6.99, 'Broccoli Beef': 6.99,
              'Cream Cheese Rangoon': 3.99, 'Fountain Drink': 2.49}

    rows = []
    base = datetime(2024, 1, 1)
    for i in range(1, 3001):
        item = choice(items)
        qty = rnd_int(1, 5)
        price = prices[item]
        total = round(qty * price, 2)
        # Introduce NULLs intentionally
        cust_name = choice(['Alice', 'Bob', 'Carlos', 'Diana', 'Ethan', None, None])
        emp_id = choice([101, 102, 103, 104, None])
        order_date = (base + timedelta(days=rnd_int(0, 364))).strftime('%Y-%m-%d')
        status = choice(statuses)
        # Cancelled orders have NULL total
        if status == 'cancelled':
            total = None
        rows.append((i, order_date, cust_name, item, qty, price, total, status,
                      choice(locations), emp_id))

    cur.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?)", rows)
    conn.commit()
    conn.close()
    print("  ✓ week2_orders.db")


# ──────────────────────────────────────────────────────────────
# WEEK 3 — week3_sales_by_hour.db
# ──────────────────────────────────────────────────────────────
def week3_sales():
    conn, cur = create_db("week3_sales.db")
    cur.executescript("""
        CREATE TABLE hourly_sales (
            id INTEGER PRIMARY KEY,
            sale_date TEXT NOT NULL,
            hour_of_day INTEGER NOT NULL,
            location TEXT NOT NULL,
            category TEXT NOT NULL,
            item_name TEXT NOT NULL,
            units_sold INTEGER NOT NULL,
            revenue REAL NOT NULL
        );
    """)

    locations = ['Downtown', 'Eastside', 'Westgate', 'University', 'Airport']
    categories = {
        'Entrees': [('Orange Chicken', 6.99), ('Beijing Beef', 6.99), ('Kung Pao Chicken', 6.99)],
        'Sides': [('Chow Mein', 4.99), ('Fried Rice', 4.99), ('White Steamed Rice', 3.99)],
        'Drinks': [('Fountain Drink', 2.49), ('Bottled Water', 1.99)],
    }

    # Realistic hourly distribution: lunch and dinner peaks
    hour_weights = {
        10: 0.3, 11: 0.7, 12: 1.5, 13: 1.8, 14: 1.2, 15: 0.6,
        16: 0.5, 17: 0.8, 18: 1.9, 19: 2.0, 20: 1.4, 21: 0.7, 22: 0.3
    }

    rows = []
    row_id = 1
    base = datetime(2024, 1, 1)
    for day_offset in range(90):  # 3 months
        date_str = (base + timedelta(days=day_offset)).strftime('%Y-%m-%d')
        is_weekend = (base + timedelta(days=day_offset)).weekday() >= 5
        for loc in locations:
            for hour, base_weight in hour_weights.items():
                weight = base_weight * (1.3 if is_weekend else 1.0)
                for cat, items in categories.items():
                    item_name, price = choice(items)
                    units = max(0, int(random.gauss(weight * 8, 3)))
                    if units > 0:
                        rows.append((row_id, date_str, hour, loc, cat, item_name,
                                     units, round(units * price, 2)))
                        row_id += 1

    cur.executemany("INSERT INTO hourly_sales VALUES (?,?,?,?,?,?,?,?)", rows)
    conn.commit()
    conn.close()
    print(f"  ✓ week3_sales.db ({len(rows)} rows)")


# ──────────────────────────────────────────────────────────────
# WEEK 4 — week4_customers_orders.db  (relational, requires JOINs)
# ──────────────────────────────────────────────────────────────
def week4_customers():
    conn, cur = create_db("week4_customers.db")
    cur.executescript("""
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            tier TEXT DEFAULT 'bronze',
            joined_date TEXT,
            city TEXT
        );
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            customer_id INTEGER REFERENCES customers(id),
            order_date TEXT,
            total_amount REAL,
            status TEXT,
            location TEXT
        );
        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id),
            item_name TEXT,
            quantity INTEGER,
            unit_price REAL
        );
    """)

    cities = ['Salt Lake City', 'Provo', 'Ogden', 'St. George', 'Logan']
    tiers = ['bronze', 'silver', 'gold', 'platinum']
    tier_weights = [0.6, 0.25, 0.12, 0.03]

    customers = []
    for i in range(1, 501):
        tier = random.choices(tiers, weights=tier_weights)[0]
        joined = (datetime(2022, 1, 1) + timedelta(days=rnd_int(0, 730))).strftime('%Y-%m-%d')
        customers.append((i, f"Customer_{i:03d}",
                          f"customer{i}@example.com" if rnd_int(0, 10) > 1 else None,
                          tier, joined, choice(cities)))
    cur.executemany("INSERT INTO customers VALUES (?,?,?,?,?,?)", customers)

    items_menu = [
        ('Orange Chicken', 6.99), ('Beijing Beef', 6.99), ('Chow Mein', 4.99),
        ('Fried Rice', 4.99), ('Kung Pao Chicken', 6.99), ('Fountain Drink', 2.49),
        ('Cream Cheese Rangoon', 3.99),
    ]
    locations = ['Downtown', 'Eastside', 'Westgate', 'University', 'Airport']

    orders = []
    order_items = []
    order_id = 1
    item_id = 1
    base = datetime(2024, 1, 1)

    # Some customers have no orders (for LEFT JOIN exercises)
    active_customers = [c[0] for c in customers if rnd_int(0, 10) > 1]

    for cust_id in active_customers:
        num_orders = random.choices([1, 2, 3, 5, 10], weights=[0.4, 0.3, 0.15, 0.1, 0.05])[0]
        for _ in range(num_orders):
            date = (base + timedelta(days=rnd_int(0, 364))).strftime('%Y-%m-%d')
            status = choice(['complete', 'complete', 'complete', 'pending', 'cancelled'])
            loc = choice(locations)
            # Build order items
            n_items = rnd_int(1, 4)
            total = 0
            for _ in range(n_items):
                item_name, price = choice(items_menu)
                qty = rnd_int(1, 3)
                order_items.append((item_id, order_id, item_name, qty, price))
                total += qty * price
                item_id += 1
            orders.append((order_id, cust_id, date, round(total, 2), status, loc))
            order_id += 1

    cur.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?)", orders)
    cur.executemany("INSERT INTO order_items VALUES (?,?,?,?,?)", order_items)
    conn.commit()
    conn.close()
    print(f"  ✓ week4_customers.db ({len(customers)} customers, {len(orders)} orders)")


# ──────────────────────────────────────────────────────────────
# WEEK 5 — week5_messy_inventory.db  (deliberately messy)
# ──────────────────────────────────────────────────────────────
def week5_messy():
    conn, cur = create_db("week5_messy.db")
    cur.executescript("""
        CREATE TABLE inventory (
            id INTEGER PRIMARY KEY,
            item_name TEXT,
            category TEXT,
            quantity_on_hand TEXT,
            unit_cost TEXT,
            supplier TEXT,
            last_restocked TEXT,
            reorder_threshold TEXT,
            notes TEXT
        );
    """)

    items = [
        'Orange Chicken', 'Beijing Beef', 'Kung Pao Chicken', 'Broccoli Beef',
        'Chow Mein', 'Fried Rice', 'White Rice', 'Super Greens', 'Egg Roll',
        'Cream Cheese Rangoon', 'Napkins', 'Chopsticks', 'Takeout Boxes',
        'Soy Sauce Packets', 'Fortune Cookies',
    ]
    categories = ['Food - Entree', 'Food - Side', 'Food - Appetizer', 'Supplies', 'Packaging']
    suppliers = ['FoodCo', 'PandaSupply', 'RestaurantDepot', 'SYSCO', None]

    rows = []
    for i in range(1, 401):
        item = choice(items)
        # Introduce various data quality issues
        qty = rnd_int(0, 500)
        qty_str = choice([str(qty), f"{qty} units", f"{qty}  ", str(qty) if rnd_int(0,5) > 0 else None])
        cost = rnd(0.50, 25.00)
        cost_str = choice([str(cost), f"${cost}", f"{cost}" if rnd_int(0,4) > 0 else None])
        cat = choice(categories)
        # Some categories are inconsistently cased
        cat = choice([cat, cat.lower(), cat.upper(), cat if rnd_int(0,3) > 0 else None])
        base_date = datetime(2024, 1, 1) + timedelta(days=rnd_int(0, 364))
        date_str = choice([
            base_date.strftime('%Y-%m-%d'),
            base_date.strftime('%m/%d/%Y'),
            base_date.strftime('%B %d, %Y'),
            None
        ])
        threshold = rnd_int(10, 100)
        threshold_str = choice([str(threshold), f"{threshold} units", None])
        notes = choice([None, None, 'needs review', 'URGENT', 'duplicate', ''])
        rows.append((i, item, cat, qty_str, cost_str, choice(suppliers),
                     date_str, threshold_str, notes))

    # Add deliberate duplicates
    dup_count = 0
    for row in random.sample(rows, 30):
        rows.append((len(rows) + dup_count + 1, row[1], row[2], row[3], row[4],
                     row[5], row[6], row[7], 'duplicate'))
        dup_count += 1

    cur.executemany("INSERT INTO inventory VALUES (?,?,?,?,?,?,?,?,?)", rows)
    conn.commit()
    conn.close()
    print(f"  ✓ week5_messy.db ({len(rows)} rows with intentional mess)")


# ──────────────────────────────────────────────────────────────
# WEEK 6 — week6_employee_performance.db
# ──────────────────────────────────────────────────────────────
def week6_employees():
    conn, cur = create_db("week6_employees.db")
    cur.executescript("""
        CREATE TABLE departments (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            manager_id INTEGER,
            budget REAL
        );
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            manager_id INTEGER,
            hire_date TEXT,
            salary REAL,
            role TEXT
        );
        CREATE TABLE performance_reviews (
            id INTEGER PRIMARY KEY,
            employee_id INTEGER REFERENCES employees(id),
            review_date TEXT,
            score INTEGER,
            reviewer_id INTEGER,
            quarter TEXT,
            year INTEGER,
            notes TEXT
        );
        CREATE TABLE sales_targets (
            id INTEGER PRIMARY KEY,
            employee_id INTEGER REFERENCES employees(id),
            month TEXT,
            target_amount REAL,
            actual_amount REAL
        );
    """)

    depts = [(1,'Operations',None,500000),(2,'Sales',None,800000),(3,'Analytics',None,350000),
             (4,'HR',None,200000),(5,'Marketing',None,300000)]
    cur.executemany("INSERT INTO departments VALUES (?,?,?,?)", depts)

    roles = {'Operations': ['Manager', 'Supervisor', 'Associate'],
             'Sales': ['Account Executive', 'Sales Rep', 'Junior Rep'],
             'Analytics': ['Senior Analyst', 'Analyst', 'Junior Analyst'],
             'HR': ['HR Manager', 'HR Coordinator', 'Recruiter'],
             'Marketing': ['Marketing Manager', 'Campaign Manager', 'Content Creator']}

    dept_names = {1:'Operations', 2:'Sales', 3:'Analytics', 4:'HR', 5:'Marketing'}
    salary_ranges = {1:(40000,90000), 2:(50000,120000), 3:(65000,140000),
                     4:(45000,85000), 5:(50000,100000)}

    employees = []
    for i in range(1, 201):
        dept_id = rnd_int(1, 5)
        dept_name = dept_names[dept_id]
        role = choice(roles[dept_name])
        sal_min, sal_max = salary_ranges[dept_id]
        salary = round(random.uniform(sal_min, sal_max) / 1000) * 1000
        hire_date = (datetime(2018, 1, 1) + timedelta(days=rnd_int(0, 2000))).strftime('%Y-%m-%d')
        mgr_id = rnd_int(1, 20) if i > 20 else None
        employees.append((i, f"Employee_{i:03d}", dept_id, mgr_id, hire_date, salary, role))
    cur.executemany("INSERT INTO employees VALUES (?,?,?,?,?,?,?)", employees)

    # Update department managers
    for dept_id in range(1, 6):
        mgr = [e for e in employees if e[2] == dept_id][0]
        cur.execute("UPDATE departments SET manager_id=? WHERE id=?", (mgr[0], dept_id))

    reviews = []
    rev_id = 1
    for emp in employees:
        for year in [2023, 2024]:
            for q in ['Q1', 'Q2', 'Q3', 'Q4']:
                # Score with some performance variance
                base_score = rnd_int(60, 100)
                score = min(100, max(40, int(random.gauss(base_score, 10))))
                date = f"{year}-{(int(q[1])*3):02d}-15"
                notes = choice(['Exceeded expectations', 'Met expectations',
                                'Needs improvement', None, None])
                reviews.append((rev_id, emp[0], date, score, rnd_int(1, 20), q, year, notes))
                rev_id += 1
    cur.executemany("INSERT INTO performance_reviews VALUES (?,?,?,?,?,?,?,?)", reviews)

    targets = []
    tgt_id = 1
    for emp in [e for e in employees if e[2] == 2]:  # Sales dept only
        for month_offset in range(12):
            month = (datetime(2024, 1, 1) + timedelta(days=month_offset*30)).strftime('%Y-%m')
            target = round(rnd(8000, 25000), -2)
            actual = round(target * rnd(0.6, 1.4), -2)
            targets.append((tgt_id, emp[0], month, target, actual))
            tgt_id += 1
    cur.executemany("INSERT INTO sales_targets VALUES (?,?,?,?,?)", targets)

    conn.commit()
    conn.close()
    print(f"  ✓ week6_employees.db ({len(employees)} employees, {len(reviews)} reviews)")


# ──────────────────────────────────────────────────────────────
# WEEK 7 — week7_timeseries.db  (2 years of sales data)
# ──────────────────────────────────────────────────────────────
def week7_timeseries():
    conn, cur = create_db("week7_timeseries.db")
    cur.executescript("""
        CREATE TABLE daily_sales (
            id INTEGER PRIMARY KEY,
            sale_date TEXT NOT NULL,
            location TEXT NOT NULL,
            category TEXT NOT NULL,
            total_orders INTEGER,
            total_revenue REAL,
            avg_order_value REAL,
            new_customers INTEGER
        );
    """)

    locations = ['Downtown', 'Eastside', 'Westgate', 'University', 'Airport']
    categories = ['Entrees', 'Sides', 'Drinks', 'Appetizers']

    rows = []
    row_id = 1
    base = datetime(2023, 1, 1)
    for day_offset in range(730):  # 2 years
        date = base + timedelta(days=day_offset)
        date_str = date.strftime('%Y-%m-%d')
        is_weekend = date.weekday() >= 5
        # Seasonality: summer and holidays are busier
        month = date.month
        seasonal = 1.0 + 0.2 * abs(month - 6.5) / 6.5  # slight summer dip, winter peak
        if month == 12:
            seasonal *= 1.3  # Holiday boost
        if month in [6, 7, 8]:
            seasonal *= 0.9  # Summer slight dip

        for loc in locations:
            loc_factor = {'Downtown': 1.4, 'Eastside': 1.0, 'Westgate': 0.9,
                          'University': 0.8, 'Airport': 1.2}.get(loc, 1.0)
            for cat in categories:
                cat_factor = {'Entrees': 1.0, 'Sides': 0.6, 'Drinks': 0.4, 'Appetizers': 0.3}.get(cat, 0.5)
                base_orders = 80 * loc_factor * cat_factor * seasonal
                if is_weekend:
                    base_orders *= 1.25
                orders = max(1, int(random.gauss(base_orders, base_orders * 0.15)))
                avg_val = rnd(4.50, 8.50)
                revenue = round(orders * avg_val, 2)
                new_custs = max(0, int(orders * rnd(0.05, 0.15)))
                rows.append((row_id, date_str, loc, cat, orders, revenue,
                             round(avg_val, 2), new_custs))
                row_id += 1

    # Insert a few anomalies for detection exercises
    for row in random.sample(rows, 20):
        idx = rows.index(row)
        rows[idx] = (row[0], row[1], row[2], row[3],
                     row[4] * rnd_int(5, 10),  # sudden spike
                     row[5] * rnd_int(5, 10), row[6], row[7])

    cur.executemany("INSERT INTO daily_sales VALUES (?,?,?,?,?,?,?,?)", rows)
    conn.commit()
    conn.close()
    print(f"  ✓ week7_timeseries.db ({len(rows)} rows)")


# ──────────────────────────────────────────────────────────────
# WEEK 8 — week8_regional.db  (multi-region, set operations)
# ──────────────────────────────────────────────────────────────
def week8_regional():
    conn, cur = create_db("week8_regional.db")
    cur.executescript("""
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            base_price REAL
        );
        CREATE TABLE east_region_sales (
            id INTEGER PRIMARY KEY,
            product_id INTEGER REFERENCES products(id),
            month TEXT,
            units_sold INTEGER,
            revenue REAL,
            rank_in_region INTEGER
        );
        CREATE TABLE west_region_sales (
            id INTEGER PRIMARY KEY,
            product_id INTEGER REFERENCES products(id),
            month TEXT,
            units_sold INTEGER,
            revenue REAL,
            rank_in_region INTEGER
        );
        CREATE TABLE north_region_sales (
            id INTEGER PRIMARY KEY,
            product_id INTEGER REFERENCES products(id),
            month TEXT,
            units_sold INTEGER,
            revenue REAL,
            rank_in_region INTEGER
        );
    """)

    products = [
        (1,'Orange Chicken','Entrees',6.99),(2,'Beijing Beef','Entrees',6.99),
        (3,'Kung Pao Chicken','Entrees',6.99),(4,'Broccoli Beef','Entrees',6.99),
        (5,'Mushroom Chicken','Entrees',6.99),(6,'String Bean Chicken','Entrees',6.99),
        (7,'Honey Walnut Shrimp','Entrees',8.99),(8,'Grilled Teriyaki Chicken','Entrees',6.99),
        (9,'Chow Mein','Sides',4.99),(10,'Fried Rice','Sides',4.99),
        (11,'White Steamed Rice','Sides',3.99),(12,'Super Greens','Sides',4.99),
        (13,'Cream Cheese Rangoon','Appetizers',3.99),(14,'Egg Roll','Appetizers',2.99),
        (15,'Apple Pie Roll','Appetizers',3.99),
    ]
    cur.executemany("INSERT INTO products VALUES (?,?,?,?)", products)

    def gen_region_sales(region_name, popular_ids, table_name):
        rows = []
        row_id = 1
        for month_offset in range(12):
            month = (datetime(2024, 1, 1) + timedelta(days=month_offset*30)).strftime('%Y-%m')
            # Rank products — different regions have different favorites
            product_sales = []
            for prod in products:
                popularity = 2.0 if prod[0] in popular_ids else 1.0
                units = max(1, int(random.gauss(100 * popularity, 30)))
                product_sales.append((prod[0], units, round(units * prod[3], 2)))
            product_sales.sort(key=lambda x: x[1], reverse=True)
            for rank, (prod_id, units, rev) in enumerate(product_sales, 1):
                rows.append((row_id, prod_id, month, units, rev, rank))
                row_id += 1
        return rows

    east_popular = [1, 3, 9, 13]  # Orange Chicken, Kung Pao, Chow Mein, Rangoon
    west_popular = [2, 7, 10, 14]  # Beijing Beef, Shrimp, Fried Rice, Egg Roll
    north_popular = [1, 4, 9, 12]  # Orange Chicken, Broccoli Beef, Chow Mein, Greens

    east = gen_region_sales('east', east_popular, 'east_region_sales')
    west = gen_region_sales('west', west_popular, 'west_region_sales')
    north = gen_region_sales('north', north_popular, 'north_region_sales')

    cur.executemany("INSERT INTO east_region_sales VALUES (?,?,?,?,?,?)", east)
    cur.executemany("INSERT INTO west_region_sales VALUES (?,?,?,?,?,?)", west)
    cur.executemany("INSERT INTO north_region_sales VALUES (?,?,?,?,?,?)", north)
    conn.commit()
    conn.close()
    print(f"  ✓ week8_regional.db")


# ──────────────────────────────────────────────────────────────
# WEEK 9 — week9_company_ops.db  (full integration week)
# ──────────────────────────────────────────────────────────────
def week9_company_ops():
    conn, cur = create_db("week9_company_ops.db")
    cur.executescript("""
        CREATE TABLE stores (
            id INTEGER PRIMARY KEY,
            name TEXT,
            city TEXT,
            state TEXT,
            opened_date TEXT,
            region TEXT,
            store_type TEXT,
            sq_footage INTEGER
        );
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            store_id INTEGER REFERENCES stores(id),
            name TEXT,
            role TEXT,
            hourly_wage REAL,
            hire_date TEXT
        );
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY,
            store_id INTEGER REFERENCES stores(id),
            transaction_date TEXT,
            transaction_time TEXT,
            total_amount REAL,
            payment_method TEXT,
            items_count INTEGER
        );
        CREATE TABLE store_metrics (
            id INTEGER PRIMARY KEY,
            store_id INTEGER REFERENCES stores(id),
            metric_date TEXT,
            customer_count INTEGER,
            avg_wait_minutes REAL,
            food_cost_pct REAL,
            labor_cost_pct REAL,
            customer_satisfaction REAL
        );
    """)

    states = ['UT', 'NV', 'AZ', 'CA', 'CO']
    regions = ['Mountain West', 'Southwest', 'Pacific Coast']
    store_types = ['Mall', 'Strip Mall', 'Standalone', 'Food Court', 'Drive-Thru']

    stores = []
    for i in range(1, 16):  # 15 stores — enough for analytics exercises
        state = choice(states)
        region = choice(regions)
        opened = (datetime(2010, 1, 1) + timedelta(days=rnd_int(0, 4000))).strftime('%Y-%m-%d')
        stores.append((i, f"Store #{i:03d}", f"City_{i}", state, opened, region,
                       choice(store_types), rnd_int(1200, 3000)))
    cur.executemany("INSERT INTO stores VALUES (?,?,?,?,?,?,?,?)", stores)

    employees = []
    emp_id = 1
    roles = ['Store Manager', 'Assistant Manager', 'Shift Lead', 'Cook', 'Cashier', 'Drive-Thru']
    wages = {'Store Manager': 22, 'Assistant Manager': 18, 'Shift Lead': 15,
             'Cook': 14, 'Cashier': 13, 'Drive-Thru': 13}
    for store in stores:
        n_emps = rnd_int(8, 20)
        for j in range(n_emps):
            role = choice(roles) if j > 1 else ('Store Manager' if j == 0 else 'Assistant Manager')
            wage = wages[role] * rnd(0.9, 1.2)
            hire = (datetime(2020, 1, 1) + timedelta(days=rnd_int(0, 1500))).strftime('%Y-%m-%d')
            employees.append((emp_id, store[0], f"Emp_{emp_id:04d}", role, round(wage, 2), hire))
            emp_id += 1
    cur.executemany("INSERT INTO employees VALUES (?,?,?,?,?,?)", employees)

    transactions = []
    txn_id = 1
    base = datetime(2024, 1, 1)
    payment_methods = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Pay', 'Gift Card']
    for store in stores:
        for day_offset in range(90):
            date = base + timedelta(days=day_offset)
            date_str = date.strftime('%Y-%m-%d')
            n_txns = rnd_int(5, 20)  # Kept small for browser performance
            for _ in range(n_txns):
                hour = random.choices(list(range(10, 23)),
                                      weights=[1,2,4,5,3,2,2,3,5,5,4,2,1])[0]
                time_str = f"{hour:02d}:{rnd_int(0,59):02d}:00"
                amount = round(rnd(5, 45), 2)
                items = rnd_int(1, 6)
                transactions.append((txn_id, store[0], date_str, time_str, amount,
                                     choice(payment_methods), items))
                txn_id += 1

    cur.executemany("INSERT INTO transactions VALUES (?,?,?,?,?,?,?)", transactions)

    metrics = []
    met_id = 1
    for store in stores:
        for day_offset in range(90):
            date_str = (base + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            metrics.append((met_id, store[0], date_str,
                            rnd_int(100, 600), rnd(2.0, 12.0),
                            rnd(28.0, 35.0), rnd(25.0, 38.0), rnd(3.5, 5.0)))
            met_id += 1
    cur.executemany("INSERT INTO store_metrics VALUES (?,?,?,?,?,?,?,?)", metrics)

    conn.commit()
    conn.close()
    print(f"  ✓ week9_company_ops.db ({len(transactions)} transactions, {len(stores)} stores)")


# ──────────────────────────────────────────────────────────────
# WEEK 14 — week14_transit.db  (SunTran-style transit data)
# ──────────────────────────────────────────────────────────────
def week14_transit():
    conn, cur = create_db("week14_transit.db")
    cur.executescript("""
        CREATE TABLE routes (
            id INTEGER PRIMARY KEY,
            route_number TEXT,
            route_name TEXT,
            route_type TEXT,
            total_stops INTEGER,
            avg_duration_minutes INTEGER
        );
        CREATE TABLE stops (
            id INTEGER PRIMARY KEY,
            route_id INTEGER REFERENCES routes(id),
            stop_name TEXT,
            stop_order INTEGER,
            latitude REAL,
            longitude REAL,
            is_transfer_hub INTEGER DEFAULT 0
        );
        CREATE TABLE trips (
            id INTEGER PRIMARY KEY,
            route_id INTEGER REFERENCES routes(id),
            trip_date TEXT,
            scheduled_departure TEXT,
            actual_departure TEXT,
            scheduled_arrival TEXT,
            actual_arrival TEXT,
            passengers_boarded INTEGER,
            passengers_alighted INTEGER,
            vehicle_id TEXT,
            driver_id INTEGER
        );
        CREATE TABLE ridership (
            id INTEGER PRIMARY KEY,
            route_id INTEGER REFERENCES routes(id),
            ridership_date TEXT,
            day_type TEXT,
            total_boardings INTEGER,
            peak_hour_boardings INTEGER,
            revenue REAL
        );
    """)

    route_data = [
        (1,'1','Downtown Circulator','Local',12,25),
        (2,'3','University Express','Express',8,18),
        (3,'5','Airport Shuttle','Express',6,35),
        (4,'7','Eastside Local','Local',18,45),
        (5,'10','Westgate Mall','Local',14,30),
        (6,'15','Hospital Route','Local',10,22),
        (7,'20','Tech Park Shuttle','Express',5,15),
        (8,'25','North Connector','Local',20,55),
    ]
    cur.executemany("INSERT INTO routes VALUES (?,?,?,?,?,?)", route_data)

    stops = []
    stop_id = 1
    base_lat, base_lon = 37.0902, -111.6503  # St. George, UT area
    for route in route_data:
        for stop_order in range(1, route[5] + 1):
            lat = base_lat + rnd(-0.05, 0.05)
            lon = base_lon + rnd(-0.05, 0.05)
            is_hub = 1 if stop_order in [1, route[5] // 2, route[5]] else 0
            stops.append((stop_id, route[0], f"{route[2]} Stop {stop_order}",
                          stop_order, lat, lon, is_hub))
            stop_id += 1
    cur.executemany("INSERT INTO stops VALUES (?,?,?,?,?,?,?)", stops)

    trips = []
    ridership_rows = []
    trip_id = 1
    rid_id = 1
    base = datetime(2024, 1, 1)
    day_types = {0:'Weekday',1:'Weekday',2:'Weekday',3:'Weekday',4:'Weekday',5:'Weekend',6:'Weekend'}

    for day_offset in range(180):
        date = base + timedelta(days=day_offset)
        date_str = date.strftime('%Y-%m-%d')
        day_type = day_types[date.weekday()]

        for route in route_data:
            # Ridership varies by route type and day
            base_board = 200 if route[4] == 'Express' else 350
            if day_type == 'Weekend':
                base_board = int(base_board * 0.6)
            total_board = max(10, int(random.gauss(base_board, base_board * 0.2)))
            peak_board = int(total_board * rnd(0.25, 0.40))
            fare = 1.50
            ridership_rows.append((rid_id, route[0], date_str, day_type,
                                   total_board, peak_board, round(total_board * fare, 2)))
            rid_id += 1

            # Generate trips throughout the day
            for hour in range(6, 22, 2):
                sched_dep = f"{hour:02d}:{rnd_int(0,30):02d}:00"
                delay_min = max(0, int(random.gauss(2, 5)))
                actual_dep_dt = datetime.strptime(f"{date_str} {sched_dep}", '%Y-%m-%d %H:%M:%S') + timedelta(minutes=delay_min)
                actual_dep = actual_dep_dt.strftime('%H:%M:%S')
                duration = route[5]
                sched_arr = (datetime.strptime(f"{date_str} {sched_dep}", '%Y-%m-%d %H:%M:%S') + timedelta(minutes=duration)).strftime('%H:%M:%S')
                actual_arr = (actual_dep_dt + timedelta(minutes=duration + rnd_int(-2, 8))).strftime('%H:%M:%S')
                boarded = max(0, int(random.gauss(30, 15)))
                alighted = max(0, boarded + rnd_int(-5, 5))
                trips.append((trip_id, route[0], date_str, sched_dep, actual_dep,
                              sched_arr, actual_arr, boarded, alighted,
                              f"BUS-{rnd_int(100,199)}", rnd_int(1, 50)))
                trip_id += 1

    cur.executemany("INSERT INTO trips VALUES (?,?,?,?,?,?,?,?,?,?,?)", trips)
    cur.executemany("INSERT INTO ridership VALUES (?,?,?,?,?,?,?)", ridership_rows)
    conn.commit()
    conn.close()
    print(f"  ✓ week14_transit.db ({len(trips)} trips, {len(ridership_rows)} ridership records)")


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"\n🗄  Generating datasets → {OUT_DIR}\n")

    week1_menu()
    week2_orders()
    week3_sales()
    week4_customers()
    week5_messy()
    week6_employees()
    week7_timeseries()
    week8_regional()
    week9_company_ops()
    week14_transit()

    # Create symlinks / copies for remaining weeks
    import shutil
    week_aliases = {
        'week10_reporting.db': 'week9_company_ops.db',
        'week11_large.db': 'week7_timeseries.db',
        'week12_messy_code.db': 'week6_employees.db',
        'week13_retail.db': 'week9_company_ops.db',
        'week15_anomaly.db': 'week7_timeseries.db',
        'week16_portfolio.db': 'week9_company_ops.db',
    }
    for alias, source in week_aliases.items():
        src = os.path.join(OUT_DIR, source)
        dst = os.path.join(OUT_DIR, alias)
        if os.path.exists(src) and not os.path.exists(dst):
            shutil.copy2(src, dst)
            print(f"  ✓ {alias} (aliased from {source})")

    # Write a manifest
    manifest = {
        "datasets": {
            f"week{w}": f"week{w}_*.db" for w in range(1, 17)
        },
        "generated_at": datetime.now().isoformat()
    }
    with open(os.path.join(OUT_DIR, "manifest.json"), 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"\n✅ All datasets generated.\n")
