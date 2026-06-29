// Atribusi "Powered by InspiraLabs". Warna diatur lewat className agar pas di
// background terang (publik) maupun gelap (login).
export default function PoweredBy({ className = 'text-slate-400' }: { className?: string }) {
  return (
    <p className={`text-center text-xs ${className}`}>
      Powered by{' '}
      <a
        href="https://inspiralabs.id"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline"
      >
        InspiraLabs
      </a>
    </p>
  )
}
