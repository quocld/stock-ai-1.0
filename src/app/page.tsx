import { ChatWindow } from '@/components/ChatWindow'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Chat Application
        </h1>
        <ChatWindow />
      </div>
    </main>
  )
}
