"""Add doctor_staff_access table

Revision ID: 7b8c9d0e1f2a
Revises: 1a2b3c4d5e6f
Create Date: 2026-04-26 14:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7b8c9d0e1f2a'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('doctor_staff_access',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('staff_user_id', sa.Integer(), nullable=False),
        sa.Column('can_view_appointments', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('can_manage_appointments', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('can_book_walkins', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('can_register_patients', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['staff_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('doctor_id', 'staff_user_id', name='uq_doctor_staff')
    )

def downgrade() -> None:
    op.drop_table('doctor_staff_access')
