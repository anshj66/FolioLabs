import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"

export default function SignInPage() {
  return (
    <main className="flex min-h-svh w-full bg-background">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm />
      </div>
      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-sidebar lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-between p-14">
          <Logo />
          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> Your learning, with a trail</div>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground">Welcome back to your evidence workspace.</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">Continue building the projects, reflections, and verified portfolio that show how you think.</p>
            <ul className="mt-8 flex flex-col gap-4">
              {[{ icon: ShieldCheck, title: "Verified contributions", desc: "Keep the work behind your claims visible." }, { icon: CheckCircle2, title: "One connected workspace", desc: "Move from projects to opportunities without losing context." }].map((item) => <li key={item.title} className="flex items-start gap-3"><div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card"><item.icon className="size-4 text-primary" /></div><div><p className="text-sm font-medium text-foreground">{item.title}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div></li>)}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">Built for thoughtful work and credible progress.</p>
        </div>
      </div>
    </main>
  )
}
