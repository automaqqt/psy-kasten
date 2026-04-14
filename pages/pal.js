import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import PalTest from '../components/tests/pal/test';

export const getStaticProps = createGetStaticProps('pal');

export default function PalPage() {
  return <TestPageWrapper TestComponent={PalTest} testId="pal" namespace="pal" route="/pal" />;
}
