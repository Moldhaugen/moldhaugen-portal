import { Home } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Home className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Moldhaugen</h1>
        <p className="text-sm text-muted-foreground">Nabolagsportalen</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
