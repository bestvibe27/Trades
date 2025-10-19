"""Add enhanced trades table with all trading fields

Revision ID: d86e764cf663
Revises: 6ab6108b5685
Create Date: 2025-10-18 10:12:53.898683

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd86e764cf663'
down_revision: Union[str, Sequence[str], None] = '6ab6108b5685'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop existing trades table and recreate with enhanced schema
    op.drop_table('trades')
    
    # Create enhanced trades table with all required fields
    op.create_table('trades',
        sa.Column('trade_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=True),
        sa.Column('strategy_id', sa.Integer(), nullable=True),
        sa.Column('symbol', sa.String(length=10), nullable=False),
        sa.Column('trade_type', sa.String(length=10), nullable=True),
        sa.Column('volume', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('open_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('close_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('stop_loss', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('take_profit', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('commission', sa.Numeric(precision=10, scale=2), nullable=True, default=0.00),
        sa.Column('swap', sa.Numeric(precision=10, scale=2), nullable=True, default=0.00),
        sa.Column('profit_loss', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('status', sa.String(length=10), nullable=True, default='OPEN'),
        sa.Column('order_id', sa.String(length=50), nullable=True),
        sa.Column('execution_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('execution_time', sa.TIMESTAMP(), nullable=True),
        sa.Column('source', sa.String(length=20), nullable=True, default='AI'),
        sa.Column('base_currency', sa.String(length=10), nullable=True, default='USD'),
        sa.Column('profit_currency', sa.String(length=10), nullable=True, default='USD'),
        sa.Column('risk_reward_ratio', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('pip_gain', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('duration', sa.Interval(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('open_time', sa.TIMESTAMP(), nullable=True, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('close_time', sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint('trade_id')
    )
    
    # Add check constraints
    op.create_check_constraint(
        'ck_trades_trade_type',
        'trades',
        "trade_type IN ('BUY', 'SELL')"
    )
    
    op.create_check_constraint(
        'ck_trades_status',
        'trades',
        "status IN ('OPEN', 'CLOSED', 'CANCELLED', 'PENDING')"
    )
    
    op.create_check_constraint(
        'ck_trades_source',
        'trades',
        "source IN ('AI', 'MANUAL', 'SIGNAL', 'BACKTEST')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the enhanced trades table
    op.drop_table('trades')
    
    # Recreate the original trades table structure
    op.create_table('trades',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=True),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('exit_price', sa.Float(), nullable=False),
        sa.Column('pnl', sa.Float(), nullable=False),
        sa.Column('commission', sa.Float(), nullable=True),
        sa.Column('entry_time', sa.DateTime(), nullable=False),
        sa.Column('exit_time', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
