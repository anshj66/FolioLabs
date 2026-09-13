import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
export default function ProjectDefense() { return <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6"><p className="text-sm font-medium text-primary">Prove & Launch / Defense</p><h1 className="text-3xl font-semibold">Defend your work</h1><div className="rounded-2xl border border-border bg-card p-8"><ShieldCheck className="size-8 text-primary" /><h2 className="mt-4 text-xl font-semibold">Defense Bot is ready</h2><p className="mt-2 text-muted-foreground">Questions will be grounded in your experiments, parameter changes, reflections, and faculty feedback.</p><Button className="mt-6" asChild><Link href="/dashboard/defense">Start defense</Link></Button></div></main> }
