import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import EftTest from '../components/tests/eft/test';

export const getStaticProps = createGetStaticProps('eft');

export default function EftPage() {
  return <TestPageWrapper TestComponent={EftTest} testId="eft" namespace="eft" route="/eft" />;
}
