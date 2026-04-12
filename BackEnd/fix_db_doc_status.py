import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE doctors ADD COLUMN status VARCHAR(20) DEFAULT 'available';"))
        conn.commit()
        print('Column status added successfully')
except Exception as e:
    print('Error:', e)
