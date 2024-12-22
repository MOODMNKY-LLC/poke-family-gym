export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-8">
      <div className="max-w-sm w-full">
        {children}
      </div>
    </div>
  )
}
