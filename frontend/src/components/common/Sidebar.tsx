import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Squares2X2Icon,
  ArrowsRightLeftIcon,
  BriefcaseIcon,
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import styles from '../../styles/Sidebar.module.css';

const Sidebar: React.FC = () => {
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/', Icon: Squares2X2Icon },
    { name: 'Trading', href: '/trading', Icon: ArrowsRightLeftIcon },
    { name: 'Portfolio', href: '/portfolio', Icon: BriefcaseIcon },
    { name: 'Strategies', href: '/strategies', Icon: ChartBarSquareIcon },
    { name: 'Backtest', href: '/backtest', Icon: PresentationChartLineIcon },
    { name: 'Settings', href: '/settings', Icon: Cog6ToothIcon },
  ];

  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  return (
    <div className={styles.sidebarRoot}>
      <div className={styles.inner}>
        <p className={styles.navLabel}>Menu</p>
        <nav className={styles.nav} aria-label="Main">
          {navigation.map(({ name, href, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={name}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`${styles.link} ${active ? styles.linkActive : ''}`}
              >
                <Icon className={styles.icon} aria-hidden="true" />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.account}>
            <div className={styles.avatar} aria-hidden="true">D</div>
            <div className={styles.accountInfo}>
              <div className={styles.accountName}>Demo Account</div>
              <div className={styles.balance}>$10,000.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
