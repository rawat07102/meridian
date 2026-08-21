import { redirect } from 'next/navigation';

export default function Home() {
  return redirect(`/workspaces/${process.env.NEXT_PUBLIC_WORKSPACE_ID}`);
}
