import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your quiz statistics and manage your quizzes',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
