import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'VERIFIED' | 'PENDING' | 'REJECTED'
  size?: 'sm' | 'md'
}

const STATUS_CONFIG = {
  VERIFIED: {
    label: 'Lunas',
    className: 'badge-verified',
    Icon: CheckCircle,
  },
  PENDING: {
    label: 'Menunggu',
    className: 'badge-pending',
    Icon: Clock,
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'badge-rejected',
    Icon: XCircle,
  },
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const { Icon } = config
  return (
    <span className={`${config.className} ${size === 'sm' ? 'text-[11px]' : ''}`}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {config.label}
    </span>
  )
}
