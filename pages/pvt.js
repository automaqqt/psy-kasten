import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import PVTTest from '../components/tests/pvt/test';

export const getStaticProps = createGetStaticProps('pvt');

export default function PVTPage() {
  return <TestPageWrapper TestComponent={PVTTest} testId="pvt" namespace="pvt" route="/pvt" />;
}
