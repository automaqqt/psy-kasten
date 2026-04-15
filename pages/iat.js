import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import IatTest from '../components/tests/iat/test';

export const getStaticProps = createGetStaticProps('iat');

export default function IatPage() {
  return <TestPageWrapper TestComponent={IatTest} testId="iat" namespace="iat" route="/iat" />;
}
