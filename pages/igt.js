import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import IgtTest from '../components/tests/igt/test';

export const getStaticProps = createGetStaticProps('igt');

export default function IgtPage() {
  return <TestPageWrapper TestComponent={IgtTest} testId="igt" namespace="igt" route="/igt" />;
}
