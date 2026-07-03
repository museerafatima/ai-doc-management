from app.core.database import engine

try:
    with engine.connect() as conn:
        print("✅ Connected to PostgreSQL successfully!")
except Exception as e:
    print(f"❌ Connection failed: {e}")