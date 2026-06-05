import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import type { PropiedadMock } from '../../services/mockData'

interface Props {
  property:  PropiedadMock
  asesorId:  string
  clientId:  string
  onDismiss: () => void
}

export default function ScheduleModal({ property, asesorId, clientId, onDismiss }: Props) {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minStr = minDate.toISOString().slice(0, 16)

  const [fecha,  setFecha]  = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleConfirm() {
    if (!fecha) { setError('Selecciona una fecha y hora.'); return }
    setSaving(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('citas').insert({
      cliente_id:   clientId,
      asesor_id:    asesorId,
      propiedad_id: property.id,
      fecha_cita:   new Date(fecha).toISOString(),
      estado:       'pendiente',
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    alert('¡Cita agendada! El asesor la confirmará pronto.')
    onDismiss()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[300]"
        style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onDismiss}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[301] rounded-t-[28px] px-6 pt-5 pb-10"
        style={{ background: '#FDFAF6' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#D8C9BB' }} />

        <h2 className="font-display text-[20px] font-bold mb-1" style={{ color: '#1A1A1A' }}>
          Agendar visita
        </h2>
        <p className="text-[13px] mb-5 truncate" style={{ color: '#9B9B9B' }}>
          {property.titulo}
        </p>

        <label className="block text-[12px] font-semibold mb-2" style={{ color: '#6B6B6B' }}>
          Fecha y hora *
        </label>
        <input
          type="datetime-local"
          min={minStr}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none mb-4"
          style={{ background: '#F0EAE1', color: '#1A1A1A' }}
        />

        {error && (
          <p className="text-[12px] mb-3 px-3 py-2 rounded-[10px]" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full py-[14px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
        >
          {saving ? 'Agendando…' : 'Confirmar cita'}
        </button>

        <button
          onClick={onDismiss}
          className="w-full mt-3 text-[13px] cursor-pointer bg-transparent border-none py-1 text-center"
          style={{ color: '#9B9B9B' }}
        >
          Cancelar
        </button>
      </motion.div>
    </>
  )
}
