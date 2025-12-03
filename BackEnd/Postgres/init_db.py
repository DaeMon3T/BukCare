import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables from .env
env_path = Path(__file__).parent.parent / ".env.development"  # adjust if your .env is in BackEnd
load_dotenv(dotenv_path=env_path)


# Step 1: Get DB credentials from .env
DB_HOST = os.getenv("DATABASE_HOST")
DB_PORT = os.getenv("DATABASE_PORT")
DB_USER = os.getenv("DATABASE_USER")
DB_PASSWORD = os.getenv("DATABASE_PASSWORD")
DB_NAME = os.getenv("DATABASE_NAME")


# Step 2: Function to connect to PostgreSQL
def connect_to_postgres():
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
        print(f"❌ Error connecting to PostgreSQL: {e}")
        return None


# Step 3: Function to check if database exists
def check_if_database_exists(conn, db_name):
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
        print(f"❌ Error checking database existence: {e}")
        return False


# Step 4: Function to create a new database
def create_database():
    conn = connect_to_postgres()

    if conn:
        conn.autocommit = True

        if check_if_database_exists(conn, DB_NAME):
            print(f"✔ Database '{DB_NAME}' already exists.")
        else:
            try:
                cur = conn.cursor()
                cur.execute(
                    sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME))
                )
                print(f"🎉 Database '{DB_NAME}' created successfully.")
                cur.close()
            except Exception as e:
                print(f"❌ Error creating database: {e}")

        conn.close()


# Step 6: Run the script
if __name__ == "__main__":
    create_database()
