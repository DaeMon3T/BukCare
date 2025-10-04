import psycopg2
from psycopg2 import sql

# Database connection credentials
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "ken"
DB_PASSWORD = "kenetwork"
DB_NAME = "bukcare"


def connect_to_postgres():
    """Connect to PostgreSQL server (default postgres database)"""
    try:
        conn = psycopg2.connect(
            dbname="postgres",
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


def check_if_database_exists(conn, db_name):
    """Check if a database exists"""
    try:
        cur = conn.cursor()
        cur.execute(
            sql.SQL("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s"),
            [db_name]
        )
        result = cur.fetchone()
        cur.close()
        return result is not None
    except Exception as e:
        print(f"Error checking database existence: {e}")
        return False


def terminate_database_connections(conn, db_name):
    """Terminate all active connections to the database before dropping it"""
    try:
        cur = conn.cursor()
        cur.execute(
            sql.SQL("""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = %s
                AND pid <> pg_backend_pid()
            """),
            [db_name]
        )
        print(f"Terminated active connections to '{db_name}'.")
        cur.close()
    except Exception as e:
        print(f"Error terminating connections: {e}")


def delete_database():
    """Delete the database if it exists"""
    conn = connect_to_postgres()
    
    if conn:
        conn.autocommit = True
        
        # Check if the database exists
        if not check_if_database_exists(conn, DB_NAME):
            print(f"Database '{DB_NAME}' does not exist.")
        else:
            try:
                # Terminate all connections to the database
                terminate_database_connections(conn, DB_NAME)
                
                # Create a cursor object
                cur = conn.cursor()
                
                # Drop the database
                cur.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(DB_NAME)))
                print(f"Database '{DB_NAME}' deleted successfully.")
                
                cur.close()
            except Exception as e:
                print(f"Error deleting database: {e}")
        
        conn.close()


if __name__ == "__main__":
    # Confirmation prompt for safety
    confirm = input(f"Are you sure you want to DELETE the database '{DB_NAME}'? (yes/no): ")
    if confirm.lower() == 'yes':
        delete_database()
    else:
        print("Database deletion cancelled.")