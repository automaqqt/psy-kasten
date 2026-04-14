import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import TmtTest from '../components/tests/tmt/test';

export const getStaticProps = createGetStaticProps('tmt');

export default function TmtPage() {
  return <TestPageWrapper TestComponent={TmtTest} testId="tmt" namespace="tmt" route="/tmt" />;
}
