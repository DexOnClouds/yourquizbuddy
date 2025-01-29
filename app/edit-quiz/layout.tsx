import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Quiz',
  description: 'Modify and update your existing quiz',
};

export default function EditQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
