import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  return (
    <main className="flex min-h-svh w-full">
      {/* Left — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm />
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-sidebar lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col justify-between p-14">
          <Logo />

          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Trusted by 24,000+ researchers
            </div>
            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground">
              Your research, verified and recognized.
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              FolioLabs turns your projects, contributions and collaborations
              into a portfolio the world can trust — with authenticity scoring
              built in.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified contributions",
                  desc: "Every milestone peer-attested on-chain.",
                },
                {
                  icon: CheckCircle2,
                  title: "Authenticity scoring",
                  desc: "Build credibility with a transparent score.",
                },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                    <f.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {f.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            &ldquo;FolioLabs helped me land my first research grant.&rdquo; —
            <span className="text-foreground"> Dr. Elena Voss</span>
          </p>
        </div>
      </div>
    </main>
  )
}
