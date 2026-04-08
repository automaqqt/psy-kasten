import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import TOLTest from '../components/tests/tol/test';

export const getStaticProps = createGetStaticProps('tol');

export default function TOLPage() {
  return <TestPageWrapper TestComponent={TOLTest} testId="tol" namespace="tol" route="/tol" landscapeHint />;
}
