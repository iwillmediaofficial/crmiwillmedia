import React from 'react'
import { MessageSquare } from 'lucide-react'

interface WhatsAppButtonProps {
  phone: string
  name: string
  className?: string
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, name, className }) => {
  // Sanitize phone number into international digits
  const cleanNumber = phone.replace(/[^0-9]/g, '')
  if (!cleanNumber) return null

  const message = encodeURIComponent(`Hi ${name}, this is IWILLMEDIA following up regarding your inquiry. How can we assist you today?`)
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Chat with ${name} on WhatsApp`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 ${className || ''}`}
    >
      <MessageSquare className="w-3.5 h-3.5 fill-current" />
      <span>WhatsApp</span>
    </a>
  )
}
