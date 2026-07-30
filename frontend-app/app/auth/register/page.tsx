import { RegisterForm } from "@/components/auth/RegisterForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { pageShell } from "@/components/ui/styles";

export default function AuthRegisterPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className={`${pageShell} flex flex-1 items-center justify-center py-16`}>
        <RegisterForm />
      </main>
      <SiteFooter />
    </div>
  );
}
