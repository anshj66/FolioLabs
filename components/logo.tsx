import Image from "next/image"
import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icon.svg"
        alt="FolioLabs"
        width={32}
        height={32}
        className="size-8 rounded-lg"
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        FolioLabs
      </span>
    </div>
  )
}