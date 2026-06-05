import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from '../../styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Trading Dashboard',
  description = 'Professional trading platform'
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.appShell}>
        <Header />
        <div className={styles.mainRow}>
          <aside className={styles.sidebar}>
            <Sidebar />
          </aside>
          <main className={styles.content}>
            <div className={styles.containerNarrow}>{children}</div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;










