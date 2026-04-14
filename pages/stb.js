import TestPageWrapper from '../components/TestPageWrapper';
import { createGetStaticProps } from '../lib/getStaticProps';
import StbTest from '../components/tests/stb/test';

export const getStaticProps = createGetStaticProps('stb');

export default function StbPage() {
  return <TestPageWrapper TestComponent={StbTest} testId="stb" namespace="stb" route="/stb" />;
}
