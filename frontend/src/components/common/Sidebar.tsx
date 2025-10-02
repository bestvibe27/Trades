import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../../styles/Sidebar.module.css';

const Sidebar: React.FC = () => {
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Trading', href: '/trading', icon: '💹' },
    { name: 'Portfolio', href: '/portfolio', icon: '💼' },
    { name: 'Strategies', href: '/strategies', icon: '🎯' },
    { name: 'Backtest', href: '/backtest', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    return router.pathname === href;
  };

  return (
    <div className={styles.sidebarRoot}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.link} ${isActive(item.href) ? styles.linkActive : ''}`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className={styles.footer}>
          <div className={styles.account}>
            <div className={styles.avatar}>U</div>
            <div>
              <div>Demo Account</div>
              <div className={styles.balance}>$10,000.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;










