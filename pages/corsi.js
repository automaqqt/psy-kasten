import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import CorsiTest from '../components/tests/corsi/test';

export const getStaticProps = createGetStaticProps('corsi');

export default function CorsiPage() {
  return <TestPageWrapper TestComponent={CorsiTest} testId="corsi" namespace="corsi" route="/corsi" landscapeHint />;
}
