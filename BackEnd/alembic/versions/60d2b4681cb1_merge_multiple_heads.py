"""Merge multiple heads

Revision ID: 60d2b4681cb1
Revises: a425c576ce82, ee0a5cbc3a6a
Create Date: 2025-11-24 22:21:43.313483

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60d2b4681cb1'
down_revision: Union[str, Sequence[str], None] = ('a425c576ce82', 'ee0a5cbc3a6a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
