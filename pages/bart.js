import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import BartTest from '../components/tests/bart/test';

export const getStaticProps = createGetStaticProps('bart');

export default function BartPage() {
  return <TestPageWrapper TestComponent={BartTest} testId="bart" namespace="bart" route="/bart" />;
}
