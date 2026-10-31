"""add lesson start time

Revision ID: 4f826a5d19c3
Revises: 91dc2a74c806
Create Date: 2026-10-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f826a5d19c3"
down_revision: Union[str, None] = "91dc2a74c806"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column(
            "start_time",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'09:00:00'"),
        ),
    )
    op.alter_column("lessons", "start_time", server_default=None)


def downgrade() -> None:
    op.drop_column("lessons", "start_time")
