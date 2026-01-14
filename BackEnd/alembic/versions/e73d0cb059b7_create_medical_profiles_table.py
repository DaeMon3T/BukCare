"""create medical_profiles table

Revision ID: e73d0cb059b7
Revises: 7ad46a294169
Create Date: 2026-01-13 19:04:21.340018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e73d0cb059b7'
down_revision: Union[str, Sequence[str], None] = '7ad46a294169'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create the new table
    op.create_table('medical_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('medical_uid', sa.UUID(), nullable=False),
        sa.Column('blood_type', sa.String(length=5), nullable=True),
        sa.Column('emergency_contact_name', sa.String(), nullable=True),
        sa.Column('emergency_contact_number', sa.String(), nullable=True),
        sa.Column('philhealth_number', sa.String(), nullable=True),
        sa.Column('pwd_id_number', sa.String(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('chronic_conditions', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    # 2. Create the index for the QR Code ID
    op.create_index(op.f('ix_medical_profiles_medical_uid'), 'medical_profiles', ['medical_uid'], unique=True)
    
    # NOTE: We removed the dangerous drop_table commands here.


def downgrade() -> None:
    """Downgrade schema."""
    # If we undo this, we only want to drop the medical_profiles table.
    # We do NOT want to touch messages or patient_vitals.
    op.drop_index(op.f('ix_medical_profiles_medical_uid'), table_name='medical_profiles')
    op.drop_table('medical_profiles')