"""Initial migration

Revision ID: 6ab6108b5685
Revises: 
Create Date: 2025-09-18 00:23:03.559119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ab6108b5685'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create strategies table
    op.create_table('strategies',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('parameters', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_running', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('stopped_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_strategies_user_id'), 'strategies', ['user_id'], unique=False)
    
    # Create orders table
    op.create_table('orders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('stop_price', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('filled_quantity', sa.Float(), nullable=True),
        sa.Column('average_price', sa.Float(), nullable=True),
        sa.Column('commission', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('filled_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_user_id'), 'orders', ['user_id'], unique=False)
    op.create_index(op.f('ix_orders_strategy_id'), 'orders', ['strategy_id'], unique=False)
    
    # Create positions table
    op.create_table('positions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('current_price', sa.Float(), nullable=False),
        sa.Column('unrealized_pnl', sa.Float(), nullable=True),
        sa.Column('realized_pnl', sa.Float(), nullable=True),
        sa.Column('margin', sa.Float(), nullable=True),
        sa.Column('stop_loss', sa.Float(), nullable=True),
        sa.Column('take_profit', sa.Float(), nullable=True),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_positions_user_id'), 'positions', ['user_id'], unique=False)
    op.create_index(op.f('ix_positions_strategy_id'), 'positions', ['strategy_id'], unique=False)
    
    # Create trades table
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
    op.create_index(op.f('ix_trades_user_id'), 'trades', ['user_id'], unique=False)
    op.create_index(op.f('ix_trades_strategy_id'), 'trades', ['strategy_id'], unique=False)
    
    # Create backtest_results table
    op.create_table('backtest_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('initial_balance', sa.Float(), nullable=False),
        sa.Column('final_balance', sa.Float(), nullable=False),
        sa.Column('total_return', sa.Float(), nullable=False),
        sa.Column('max_drawdown', sa.Float(), nullable=False),
        sa.Column('sharpe_ratio', sa.Float(), nullable=False),
        sa.Column('win_rate', sa.Float(), nullable=False),
        sa.Column('total_trades', sa.Integer(), nullable=False),
        sa.Column('winning_trades', sa.Integer(), nullable=False),
        sa.Column('losing_trades', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_backtest_results_user_id'), 'backtest_results', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_backtest_results_user_id'), table_name='backtest_results')
    op.drop_table('backtest_results')
    op.drop_index(op.f('ix_trades_strategy_id'), table_name='trades')
    op.drop_index(op.f('ix_trades_user_id'), table_name='trades')
    op.drop_table('trades')
    op.drop_index(op.f('ix_positions_strategy_id'), table_name='positions')
    op.drop_index(op.f('ix_positions_user_id'), table_name='positions')
    op.drop_table('positions')
    op.drop_index(op.f('ix_orders_strategy_id'), table_name='orders')
    op.drop_index(op.f('ix_orders_user_id'), table_name='orders')
    op.drop_table('orders')
    op.drop_index(op.f('ix_strategies_user_id'), table_name='strategies')
    op.drop_table('strategies')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
