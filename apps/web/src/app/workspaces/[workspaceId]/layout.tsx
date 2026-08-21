import { AppSidebar } from '@/components/layout/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col gap-4 flex-1 ml-1 min-w-0">
        <SidebarTrigger />
        <Separator />
        {children}
      </main>
    </SidebarProvider>
  );
}
