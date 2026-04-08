import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import GNGTest from '../components/tests/gng/test';

export const getStaticProps = createGetStaticProps('gng');

export default function GNGPage() {
  return <TestPageWrapper TestComponent={GNGTest} testId="gng-sst" namespace="gng" route="/gng" />;
}
