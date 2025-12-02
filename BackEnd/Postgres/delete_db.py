import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from pathlib import Path
import os

# ----------------------------
# Load .env explicitly
# ----------------------------
env_path = Path(__file__).parent.parent / ".env.development"  # adjust if your .env is in BackEnd
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DATABASE_HOST", "localhost")
DB_PORT = os.getenv("DATABASE_PORT", "5432")
DB_USER = os.getenv("DATABASE_USER")
DB_PASSWORD = os.getenv("DATABASE_PASSWORD")
DB_NAME = os.getenv("DATABASE_NAME")

print("DEBUG:", DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)  # remove after testing

# ----------------------------
# Connect to PostgreSQL
# ----------------------------
def connect_to_postgres():
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        print("✅ Connected to PostgreSQL server.")
        return conn
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        return None

# ----------------------------
# Check if DB exists
# ----------------------------
def check_if_database_exists(conn, db_name):
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
        exists = cur.fetchone() is not None
        cur.close()
        return exists
    except Exception as e:
        print(f"❌ Error checking database existence: {e}")
        return False

# ----------------------------
# Terminate active connections
# ----------------------------
def terminate_database_connections(conn, db_name):
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = %s AND pid <> pg_backend_pid()
        """, [db_name])
        cur.close()
        print(f"⚠️ Terminated active connections to '{db_name}'.")
    except Exception as e:
        print(f"❌ Error terminating connections: {e}")

# ----------------------------
# Delete database
# ----------------------------
def delete_database():
    conn = connect_to_postgres()
    if not conn:
        return

    conn.autocommit = True

    if not check_if_database_exists(conn, DB_NAME):
        print(f"ℹ️ Database '{DB_NAME}' does NOT exist.")
    else:
        terminate_database_connections(conn, DB_NAME)
        try:
            cur = conn.cursor()
            cur.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(DB_NAME)))
            cur.close()
            print(f"🗑️ Database '{DB_NAME}' deleted successfully.")
        except Exception as e:
            print(f"❌ Error deleting database: {e}")

    conn.close()

# ----------------------------
# Main
# ----------------------------
if __name__ == "__main__":
    confirm = input(f"⚠️ Are you sure you want to DELETE the database '{DB_NAME}'? (yes/no): ")
    if confirm.lower() == "yes":
        delete_database()
    else:
        print("❌ Database deletion cancelled.")
