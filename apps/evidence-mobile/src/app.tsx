import { StatusBar } from 'expo-status-bar'
import P01App from './p01-app.tsx'
import P02App from './p02-app.tsx'
import P03App from './p03-app.tsx'

const gate = process.env.EXPO_PUBLIC_GATE ?? 'P01'

const GateApp =
  gate === 'P03' ? P03App : gate === 'P02' ? P02App : P01App

export default function App() {
  return (
    <>
      <GateApp />
      <StatusBar style="auto" />
    </>
  )
}
