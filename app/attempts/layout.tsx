import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Attempts',
  description: 'View your quiz attempt history and performance',
};

export default function AttemptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
