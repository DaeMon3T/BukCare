"""Merge multiple heads

Revision ID: 183cba512121
Revises: 45420a2aa798, 7b8c9d0e1f2a
Create Date: 2026-04-26 15:23:36.383403

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '183cba512121'
down_revision: Union[str, Sequence[str], None] = ('45420a2aa798', '7b8c9d0e1f2a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
