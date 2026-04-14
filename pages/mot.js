import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import MotTest from '../components/tests/mot/test';

export const getStaticProps = createGetStaticProps('mot');

export default function MotPage() {
  return <TestPageWrapper TestComponent={MotTest} testId="mot" namespace="mot" route="/mot" />;
}
