import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from '../../styles/Header.module.css';

const NAV = [
  { name: 'Dashboard', href: '/' },
  { name: 'Trading', href: '/trading' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Strategies', href: '/strategies' },
  { name: 'Backtest', href: '/backtest' },
];

const Header: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  const ticker = useMemo(
    () => [
      { sym: 'EURUSD', price: '1.0784', up: true },
      { sym: 'BTCUSDT', price: '64,320', up: false },
      { sym: 'ETHUSDT', price: '3,195', up: true },
    ],
    []
  );

  return (
    <header className={styles.header}>
      <div className={styles.wrap}>
        <div className={styles.headerInner}>
          <div className={styles.left}>
            <Link href="/" className={styles.brand}>
              <div className={styles.brandLogo} aria-hidden="true">T</div>
              <span className={styles.brandName}>TradeDesk</span>
            </Link>
            <div className={styles.ticker} aria-hidden="true">
              {ticker.map((t) => (
                <span key={t.sym} className={styles.tickerItem}>
                  <span className={styles.tickerSym}>{t.sym}</span>
                  <span className={t.up ? styles.tickerUp : styles.tickerDown}>{t.price}</span>
                </span>
              ))}
            </div>
          </div>

          <nav className={styles.nav} aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className={styles.status}>
            <span className={styles.connected}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>Connected</span>
            </span>
            <button
              className={styles.mobileBtn}
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <XMarkIcon width={24} height={24} />
              ) : (
                <Bars3Icon width={24} height={24} />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            {[...NAV, { name: 'Settings', href: '/settings' }].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`${styles.mobileLink} ${isActive(item.href) ? styles.mobileLinkActive : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
