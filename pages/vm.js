import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import VMTest from '../components/tests/vm/test';

export const getStaticProps = createGetStaticProps('vm');

export default function VMPage() {
  return <TestPageWrapper TestComponent={VMTest} testId="vm" namespace="vm" route="/vm" />;
}
