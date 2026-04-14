import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import PrltTest from '../components/tests/prlt/test';

export const getStaticProps = createGetStaticProps('prlt');

export default function PrltPage() {
  return <TestPageWrapper TestComponent={PrltTest} testId="prlt" namespace="prlt" route="/prlt" />;
}
