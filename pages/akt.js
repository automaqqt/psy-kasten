import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import AktTest from '../components/tests/AktTest';

export const getStaticProps = createGetStaticProps('akt');

export default function AktPage() {
  return <TestPageWrapper TestComponent={AktTest} testId="akt" namespace="akt" route="/akt" landscapeHint />;
}
