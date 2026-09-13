import { Construction } from "lucide-react"

export function ComingSoon({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15">
          <Construction className="size-7 text-primary" />
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">
          {title} is coming soon
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This section is under construction. Check back shortly for the full
          experience.
        </p>
      </div>
    </div>
  )
}
