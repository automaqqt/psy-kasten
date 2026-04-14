import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import NbackTest from '../components/tests/nback/test';

export const getStaticProps = createGetStaticProps('nback');

export default function NbackPage() {
  return <TestPageWrapper TestComponent={NbackTest} testId="nback" namespace="nback" route="/nback" />;
}
