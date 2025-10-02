import psycopg2
from psycopg2 import sql

# Step 1: Set up the connection credentials
DB_HOST = "localhost"  # The address of the PostgreSQL server
DB_PORT = 5432         # Default PostgreSQL port
DB_USER = "ken"  # PostgreSQL username
DB_PASSWORD = "kenetwork"  # PostgreSQL password
DB_NAME = "bukcare"  # The database name to create


# Step 2: Function to connect to PostgreSQL
def connect_to_postgres():
    try:
        # Connect to the PostgreSQL server (using the default database 'postgres')
        conn = psycopg2.connect(
            dbname="postgres",  # Connect to the default database to create a new one
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        print("Connection to PostgreSQL server successful.")
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

# Step 3: Function to check if a database exists
def check_if_database_exists(conn, db_name):
    try:
        # Create a cursor object
        cur = conn.cursor()
        
        # Check if the database exists by querying the pg_catalog
        cur.execute(
            sql.SQL("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s"),
            [db_name]
        )
        
        # Fetch the result
        result = cur.fetchone()
        cur.close()

        # If the database exists, result will not be None
        return result is not None
    except Exception as e:
        print(f"Error checking database existence: {e}")
        return False

# Step 4: Function to create a new database
def create_database():
    conn = connect_to_postgres()
    
    if conn:
        # Set autocommit to True to avoid running inside a transaction block
        conn.autocommit = True
        
        # Step 5: Check if the database exists
        if check_if_database_exists(conn, DB_NAME):
            print(f"Database '{DB_NAME}' already exists.")
        else:
            try:
                # Create a cursor object
                cur = conn.cursor()
                
                # Create the new database
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME)))
                print(f"Database '{DB_NAME}' created successfully.")
                
                # Close cursor
                cur.close()
            except Exception as e:
                print(f"Error creating database: {e}")
        
        # Close the connection to PostgreSQL
        conn.close()

# Step 6: Run the script to create the database
if __name__ == "__main__":
    create_database()
