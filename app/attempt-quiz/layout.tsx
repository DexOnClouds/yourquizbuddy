import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Attempt Quiz',
  description: 'Take a quiz and test your knowledge',
};

export default function AttemptQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
