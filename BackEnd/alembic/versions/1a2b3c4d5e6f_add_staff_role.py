"""Add staff role

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-04-11 15:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Update the ENUM Type in Postgres
    # Note: IF NOT EXISTS is supported in Postgres 10+
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'staff';")
    
    # 2. Add is_staff_approved column to users table
    op.add_column('users', sa.Column('is_staff_approved', sa.Boolean(), server_default='false', nullable=True))
    
    # 3. Create the staffs table
    op.create_table('staffs',
        sa.Column('staff_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('proof_front', sa.String(), nullable=True),
        sa.Column('proof_back', sa.String(), nullable=True),
        sa.Column('proof_selfie', sa.String(), nullable=True),
        sa.Column('job_title', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('staff_id'),
        sa.UniqueConstraint('user_id')
    )

def downgrade() -> None:
    op.drop_table('staffs')
    op.drop_column('users', 'is_staff_approved')
    # Dropping enum values is not supported without rebuilding the entire type.
