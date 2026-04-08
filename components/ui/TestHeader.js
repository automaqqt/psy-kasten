// components/ui/TestHeader.js
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/TestTakePage.module.css';

/**
 * Shared header for all test pages — logo + optional metrics slot.
 *
 * Props:
 *  - children: optional metrics/controls rendered next to the logo
 */
export default function TestHeader({ children }) {
  return (
    <div className={styles.header}>
      <Link href="/" passHref>
        <div className={styles.logoLink}>
          <Image src="/logo.png" alt="psykasten Logo" width={50} height={50} />
        </div>
      </Link>
      {children}
    </div>
  );
}
