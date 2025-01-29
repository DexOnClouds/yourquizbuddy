import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Quiz',
  description: 'Create a new quiz with custom questions and topics',
};

export default function CreateQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
