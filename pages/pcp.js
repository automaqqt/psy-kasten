import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import PcpTest from '../components/tests/pcp/test';

export const getStaticProps = createGetStaticProps('pcp');

export default function PcpPage() {
  return <TestPageWrapper TestComponent={PcpTest} testId="pcp" namespace="pcp" route="/pcp" />;
}
