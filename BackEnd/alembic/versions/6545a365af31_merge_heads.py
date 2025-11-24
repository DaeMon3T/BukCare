"""merge heads

Revision ID: 6545a365af31
Revises: a425c576ce82, ee0a5cbc3a6a
Create Date: 2025-11-22 15:35:56.508676

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6545a365af31'
down_revision: Union[str, Sequence[str], None] = ('a425c576ce82', 'ee0a5cbc3a6a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
