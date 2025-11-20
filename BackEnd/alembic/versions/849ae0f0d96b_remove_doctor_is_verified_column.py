"""Remove doctor is_verified column

Revision ID: 849ae0f0d96b
Revises: 1b71d029f906
Create Date: 2025-11-20 19:30:56.335774

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '849ae0f0d96b'
down_revision: Union[str, Sequence[str], None] = '1b71d029f906'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
