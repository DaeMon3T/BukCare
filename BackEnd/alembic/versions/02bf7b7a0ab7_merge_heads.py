"""merge heads

Revision ID: 02bf7b7a0ab7
Revises: 9340d21ea9f7, 0fca99b1f677
Create Date: 2025-11-24 22:47:28.174215

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02bf7b7a0ab7'
down_revision: Union[str, Sequence[str], None] = ('9340d21ea9f7', '0fca99b1f677')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
