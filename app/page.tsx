"use client"

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function HomePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="min-h-svh bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("features")}
            >
              Features
            </Button>
            <Button variant="ghost" size="sm" onClick={() => scrollToSection("how")}>
              How It Works
            </Button>
            <Button variant="default" size="sm">
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Trusted by 24,000+ researchers
          </div>

          <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
            Build your academic portfolio the world can trust
          </h1>

          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
            FolioLabs turns your projects, learning evidence, and verifications into a
            recognized portfolio. Track achievements, collect proof, defend your work, and
            share verified credentials.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2">
              Start Building
              <ArrowRight className="size-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("how")}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* The Loop: BUILD → CAPTURE → DEFEND → VERIFY */}
      <section id="how" className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Your journey: Build → Capture → Defend → Verify
          </h2>
          <p className="mt-4 text-center text-lg text-muted-foreground">
            A complete workflow for learning evidence and academic credibility
          </p>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "BUILD",
                description: "Organize projects and experiments",
                details: "Track research, maker projects, and community work in one workspace.",
                icon: Zap,
              },
              {
                step: "02",
                title: "CAPTURE",
                description: "Record evidence and reasoning",
                details:
                  "Attach artifacts, reflections, assessments, and peer feedback as proof.",
                icon: FileText,
              },
              {
                step: "03",
                title: "DEFEND",
                description: "Explain and justify your work",
                details:
                  "Answer questions, articulate impact, and demonstrate deep understanding.",
                icon: MessageSquare,
              },
              {
                step: "04",
                title: "VERIFY",
                description: "Get faculty and peer validation",
                details:
                  "Earn verified credentials and authenticity scoring across your portfolio.",
                icon: ShieldCheck,
              },
            ].map((phase, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between">
                  <phase.icon className="size-6 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {phase.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{phase.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {phase.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Built for authentic learning
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              {
                icon: BookOpen,
                title: "Learning Lab",
                desc: "Interactive workspace for experiments, matrix computations, and hypothesis testing.",
              },
              {
                icon: FileText,
                title: "Evidence Timeline",
                desc: "Chronological record of artifacts, milestones, and verifications.",
              },
              {
                icon: Shield,
                title: "Authenticity Scoring",
                desc: "Transparent credential scoring based on verification patterns.",
              },
              {
                icon: MessageSquare,
                title: "Defense Flow",
                desc: "Structure for articulating impact and responding to peer questions.",
              },
              {
                icon: CheckCircle2,
                title: "Faculty Verification",
                desc: "Mentors and reviewers provide official credibility validation.",
              },
              {
                icon: Sparkles,
                title: "Verified Portfolios",
                desc: "Share verified work publicly and build recognized credentials.",
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                <f.icon className="size-6 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="flex gap-1 mb-6">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Sparkles
                  key={i}
                  className="size-4 fill-primary text-primary"
                  aria-hidden="true"
                />
              ))}
          </div>
          <p className="text-lg leading-relaxed text-foreground">
            "FolioLabs didn't just help me organize my research. It gave me the structure
            to prove what I&apos;d learned, explain why it mattered, and earn credentials
            that employers and universities actually trust. It&apos;s the difference between
            having a portfolio and having proof."
          </p>
          <p className="mt-6 font-medium text-foreground">
            Alex Morgan
            <span className="block text-sm text-muted-foreground font-normal">
              Student, Applied Mathematics
            </span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Ready to build your verified portfolio?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start capturing evidence of your learning today.
          </p>
          <Button size="lg" className="mt-8 gap-2">
            Get Started
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo />
            <p className="text-sm text-muted-foreground">
              © 2025 FolioLabs. Built for authentic learning.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
