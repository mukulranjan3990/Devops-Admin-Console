import json
import os
import sys

# 1. Dynamically locate absolute paths relative to where this script sits
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
json_file = os.path.join(BASE_DIR, 'database.json')
sql_file = os.path.join(BASE_DIR, 'db.sql')

print(f"Reading data from: {json_file}")

# 2. Open file with permission error fallbacks (Handles OneDrive/Windows locks)
try:
    with open(json_file, 'r+', encoding='utf-8') as f:
        raw_data = json.load(f)
except PermissionError:
    try:
        with open(json_file, 'r', encoding='utf-8', errors='ignore') as f:
            raw_data = json.loads(f.read())
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Access Denied to the file: {e}")
        print("Please temporarily close any app using 'database.json' and run again.")
        sys.exit(1)

# 3. Optimize processing syntax settings for AWS RDS MySQL imports
sql_statements = [
    "SET FOREIGN_KEY_CHECKS = 0;",
    "SET UNIQUE_CHECKS = 0;",
    "SET AUTOCOMMIT = 0;\n"
]

def flatten_dict(d, parent_key='', sep='_'):
    """Flattens deeply nested JSON structures into clean database columns."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            items.append((new_key, json.dumps(v, ensure_ascii=False)))
        else:
            items.append((new_key, v))
    return dict(items)

# 4. Advanced unpacking to find real arrays instead of grabbing a single master object
datasets = {}
if isinstance(raw_data, dict):
    # Check if the dictionary values contain data lists (e.g., {"users": [...], "orders": [...]})
    has_lists = any(isinstance(v, list) for v in raw_data.values())
    
    if has_lists:
        for k, v in raw_data.items():
            if isinstance(v, list) and len(v) > 0:
                datasets[k] = v
    else:
        # Fallback: Look inside a sub-key if it wraps the main array (e.g., {"data": [...]})
        nested_array_found = False
        for k, v in raw_data.items():
            if isinstance(v, list):
                datasets[k] = v
                nested_array_found = True
                break
        
        if not nested_array_found:
            # Genuinely just a single object dataset record
            datasets["main_table"] = [raw_data]
elif isinstance(raw_data, list):
    # Perfect structure: Root-level array
    datasets["main_table"] = raw_data

# 5. Extract, format, and generate DDL/DML SQL structures for all data rows
for table_name, rows in datasets.items():
    if not rows:
        continue
    
    print(f"Processing table `{table_name}` containing {len(rows)} data rows...")
    
    flattened_rows = []
    all_columns = set()
    
    for row in rows:
        if isinstance(row, dict):
            flat_row = flatten_dict(row)
            flattened_rows.append(flat_row)
            all_columns.update(flat_row.keys())
        else:
            flat_row = {"value": row}
            flattened_rows.append(flat_row)
            all_columns.update(flat_row.keys())
            
    sorted_columns = sorted(list(all_columns))
    
    # Generate Drop and Create DDL schemas
    create_table = f"DROP TABLE IF EXISTS `{table_name}`;\n"
    create_table += f"CREATE TABLE `{table_name}` (\n"
    create_table += "    `id_auto` INT AUTO_INCREMENT PRIMARY KEY,\n" # Auto PK optimal for RDS performance
    
    col_definitions = []
    for col in sorted_columns:
        col_definitions.append(f"    `{col}` LONGTEXT NULL")
        
    create_table += ",\n".join(col_definitions)
    create_table += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
    sql_statements.append(create_table)
    
    # Generate individual SQL rows insertions
    for flat_row in flattened_rows:
        columns_present = []
        values_present = []
        
        for col in sorted_columns:
            val = flat_row.get(col)
            columns_present.append(f"`{col}`")
            
            if val is None:
                values_present.append("NULL")
            elif isinstance(val, bool):
                values_present.append("1" if val else "0")
            elif isinstance(val, (int, float)):
                values_present.append(str(val))
            else:
                # Thorough escaping for strings and escape slashes to prevent MySQL injection errors
                escaped_val = str(val).replace("\\", "\\\\").replace("'", "''")
                values_present.append(f"'{escaped_val}'")
                
        col_str = ", ".join(columns_present)
        val_str = ", ".join(values_present)
        sql_statements.append(f"INSERT INTO `{table_name}` ({col_str}) VALUES ({val_str});")
        
    sql_statements.append("COMMIT;\n")

sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;")
sql_statements.append("SET UNIQUE_CHECKS = 1;")

# 6. Save the output results cleanly onto disk storage
with open(sql_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print(f"\n[SUCCESS] Conversion complete! Check your new '{sql_file}' file.")
