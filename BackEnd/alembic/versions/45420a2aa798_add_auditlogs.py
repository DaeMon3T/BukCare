"""Add AuditLogs

Revision ID: 45420a2aa798
Revises: 1a2b3c4d5e6f
Create Date: 2026-04-18 20:19:51.568525

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '45420a2aa798'
down_revision: Union[str, Sequence[str], None] = '1a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('audit_logs',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('action', postgresql.ENUM('CREATE', 'UPDATE', 'DELETE', 'SYSTEM', name='auditactiontype', create_type=False), autoincrement=False, nullable=False),
    sa.Column('entity_name', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('entity_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('details', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('ip_address', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('audit_logs_user_id_fkey')),
    sa.PrimaryKeyConstraint('id', name=op.f('audit_logs_pkey'))
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
