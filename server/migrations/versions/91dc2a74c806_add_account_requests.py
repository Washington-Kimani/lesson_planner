"""add account requests

Revision ID: 91dc2a74c806
Revises: be49d128604c
Create Date: 2026-10-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "91dc2a74c806"
down_revision: Union[str, None] = "be49d128604c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "account_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("employee_number", sa.String(length=50), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("qualification", sa.String(length=150), nullable=True),
        sa.Column("subjects", sa.String(length=200), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_id", sa.Uuid(), nullable=True),
        sa.Column("review_note", sa.String(length=500), nullable=True),
        sa.Column("teacher_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"], ["users.id"], ondelete="SET NULL",
            name=op.f("fk_account_requests_reviewed_by_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"], ["users.id"], ondelete="SET NULL",
            name=op.f("fk_account_requests_teacher_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_account_requests")),
    )
    op.create_index(
        op.f("ix_account_requests_email"), "account_requests", ["email"], unique=False
    )
    op.create_index(
        op.f("ix_account_requests_status"), "account_requests", ["status"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_account_requests_status"), table_name="account_requests")
    op.drop_index(op.f("ix_account_requests_email"), table_name="account_requests")
    op.drop_table("account_requests")
