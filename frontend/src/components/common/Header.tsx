import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../../styles/Header.module.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ticker = useMemo(
    () => [
      { sym: 'EURUSD', price: '1.0784', up: true },
      { sym: 'BTCUSDT', price: '64320', up: false },
      { sym: 'ETHUSDT', price: '3195', up: true },
    ],
    []
  );

  return (
    <header className={styles.header}>
      <div className={styles.wrap}>
        <div className={styles.headerInner}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" className={styles.brand}>
              <div className={styles.brandLogo}>T</div>
              <span className={styles.brandName}>Trading Bot</span>
            </Link>
            <div className={styles.ticker}>
              {ticker.map((t) => (
                <span key={t.sym} className={styles.tickerItem}>
                  {t.sym}{' '}
                  <span className={t.up ? styles.tickerUp : styles.tickerDown}>{t.price}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Dashboard</Link>
            <Link href="/trading" className={styles.navLink}>Trading</Link>
            <Link href="/portfolio" className={styles.navLink}>Portfolio</Link>
            <Link href="/strategies" className={styles.navLink}>Strategies</Link>
            <Link href="/backtest" className={styles.navLink}>Backtest</Link>
          </nav>

          {/* Right area */}
          <div className={styles.status}>
            <span className={styles.statusDot} />
            <span>Connected</span>
            <button className={styles.mobileBtn} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className="container">
              <div style={{ display: 'grid', gap: 8, padding: '8px 0' }}>
                <Link href="/" className={styles.navLink}>Dashboard</Link>
                <Link href="/trading" className={styles.navLink}>Trading</Link>
                <Link href="/portfolio" className={styles.navLink}>Portfolio</Link>
                <Link href="/strategies" className={styles.navLink}>Strategies</Link>
                <Link href="/backtest" className={styles.navLink}>Backtest</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;










