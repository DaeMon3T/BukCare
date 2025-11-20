import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

# Database connection credentials from .env
DB_HOST = os.getenv("DATABASE_HOST")
DB_PORT = os.getenv("DATABASE_PORT")
DB_USER = os.getenv("DATABASE_USER")
DB_PASSWORD = os.getenv("DATABASE_PASSWORD")
DB_NAME = os.getenv("DATABASE_NAME")


def connect_to_postgres():
    """Connect to PostgreSQL server (system 'postgres' DB)."""
    try:
        conn = psycopg2.connect(
            dbname="postgres",   # Use default system database
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        print("✅ Connection to PostgreSQL server successful.")
        return conn
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        return None


def check_if_database_exists(conn, db_name):
    """Check if the database exists."""
    try:
        cur = conn.cursor()
        cur.execute(
            sql.SQL("SELECT 1 FROM pg_database WHERE datname = %s"),
            [db_name]
        )
        result = cur.fetchone()
        cur.close()
        return result is not None
    except Exception as e:
        print(f"❌ Error checking database existence: {e}")
        return False


def terminate_database_connections(conn, db_name):
    """Force terminate all open database connections."""
    try:
        cur = conn.cursor()
        cur.execute(
            sql.SQL("""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s
                AND pid <> pg_backend_pid()
            """),
            [db_name]
        )
        cur.close()
        print(f"⚠️ Terminated active connections to '{db_name}'.")
    except Exception as e:
        print(f"❌ Error terminating connections: {e}")


def delete_database():
    """Delete the specified database."""
    conn = connect_to_postgres()

    if conn:
        conn.autocommit = True

        if not check_if_database_exists(conn, DB_NAME):
            print(f"ℹ️ Database '{DB_NAME}' does NOT exist.")
        else:
            try:
                terminate_database_connections(conn, DB_NAME)

                cur = conn.cursor()
                cur.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(DB_NAME)))
                cur.close()

                print(f"🗑️ Database '{DB_NAME}' deleted successfully.")
            except Exception as e:
                print(f"❌ Error deleting database: {e}")

        conn.close()


if __name__ == "__main__":
    confirm = input(f"⚠️ Are you sure you want to DELETE the database '{DB_NAME}'? (yes/no): ")

    if confirm.lower() == "yes":
        delete_database()
    else:
        print("❌ Database deletion cancelled.")
