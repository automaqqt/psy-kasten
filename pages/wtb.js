import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import WtbTest from '../components/tests/WtbTest';

export const getStaticProps = createGetStaticProps('wtb');

export default function WtbPage() {
  return <TestPageWrapper TestComponent={WtbTest} testId="wtb" namespace="wtb" route="/wtb" />;
}
