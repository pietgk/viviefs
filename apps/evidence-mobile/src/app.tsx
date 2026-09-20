import { StatusBar } from 'expo-status-bar'
import P01App from './p01-app.tsx'
import P02App from './p02-app.tsx'

const gate = process.env.EXPO_PUBLIC_GATE ?? 'P01'

export default function App() {
  return (
    <>
      {gate === 'P02' ? <P02App /> : <P01App />}
      <StatusBar style="auto" />
    </>
  )
}
