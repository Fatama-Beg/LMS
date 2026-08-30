import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../src/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Educore LMS - Learning Management System</title>
        <meta name="description" content="Production-ready LMS with RBAC, course creation, auto-graded quizzes, and progress tracking." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
