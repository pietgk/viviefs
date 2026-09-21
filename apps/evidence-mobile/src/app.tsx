import { useEffect, useState, type ComponentType } from 'react'
import { StatusBar } from 'expo-status-bar'

const gate = process.env.EXPO_PUBLIC_GATE ?? 'P01'

const loadGateApp = async (): Promise<ComponentType> => {
  switch (gate) {
    case 'P07':
      return (await import('./p07-app.tsx')).default
    case 'P05':
      return (await import('./p05-app.tsx')).default
    case 'P04':
      return (await import('./p04-app.tsx')).default
    case 'P03':
      return (await import('./p03-app.tsx')).default
    case 'P02':
      return (await import('./p02-app.tsx')).default
    default:
      return (await import('./p01-app.tsx')).default
  }
}

export default function App() {
  const [GateApp, setGateApp] = useState<ComponentType | null>(null)
  useEffect(() => {
    let cancelled = false
    void loadGateApp().then((loaded) => {
      if (!cancelled) setGateApp(() => loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])
  if (!GateApp) return null
  return (
    <>
      <GateApp />
      <StatusBar style="auto" />
    </>
  )
}
