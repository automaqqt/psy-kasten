import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import WcstTest from '../components/tests/wcst/test';

export const getStaticProps = createGetStaticProps('wcst');

export default function WcstPage() {
  return <TestPageWrapper TestComponent={WcstTest} testId="wcst" namespace="wcst" route="/wcst" />;
}
