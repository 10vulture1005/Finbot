"""add risk_analysis to users

Revision ID: a3f1bc92d4e5
Revises: d1037539c3e4
Create Date: 2026-03-31

"""
from alembic import op
import sqlalchemy as sa

revision = 'a3f1bc92d4e5'
down_revision = 'd1037539c3e4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('risk_analysis', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('users', 'risk_analysis')
