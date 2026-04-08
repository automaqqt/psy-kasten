import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import RPMTest from '../components/tests/rpm/test';

export const getStaticProps = createGetStaticProps('rpm');

export default function RPMPage() {
  return <TestPageWrapper TestComponent={RPMTest} testId="rpm" namespace="rpm" route="/rpm" landscapeHint />;
}
