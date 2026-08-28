'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Command } from 'cmdk'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutGrid,
  Trophy,
  Activity,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Laptop,
} from 'lucide-react'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const paletteRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Fetch models on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/leaderboard')
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch((err) => console.error('Failed to load models in palette:', err))
  }, [])

  // Bind Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pathname?.startsWith('/report')) {
        return
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // Helper to run action and close
  const runCommand = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop Blur Overlay */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            ref={paletteRef}
            initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-[#0d0d0e] shadow-2xl z-50 text-zinc-200"
          >
            <Command className="flex flex-col h-full w-full">
              {/* Search Input */}
              <div className="flex items-center border-b border-border px-3">
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search models..."
                  className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 text-zinc-100"
                />
              </div>

              {/* Commands List */}
              <Command.List className="max-h-[300px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                  No results found.
                </Command.Empty>

                {/* Navigation Group */}
                <Command.Group
                  heading="Navigation"
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5"
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/'))}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    <span>Go to Overview</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/leaderboard'))}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    <Trophy className="h-4 w-4 shrink-0" />
                    <span>Go to Leaderboard</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/runs/demo_heuristics_results'))}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    <Activity className="h-4 w-4 shrink-0" />
                    <span>Go to Runs Explorer</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/compare'))}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Go to Compare Models</span>
                  </Command.Item>
                </Command.Group>

                {/* Preferences Group */}
                <Command.Group
                  heading="Preferences"
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5 pt-3 border-t border-border/30 mt-2"
                >
                  <Command.Item
                    onSelect={() =>
                      runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))
                    }
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0 text-indigo-400" />
                    )}
                    <span>Toggle light/dark theme</span>
                  </Command.Item>
                </Command.Group>

                {/* Models Group */}
                <Command.Group
                  heading="Models (Quick Jump)"
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5 pt-3 border-t border-border/30 mt-2"
                >
                  {models.map((model) => (
                    <Command.Item
                      key={model.id}
                      onSelect={() =>
                        runCommand(() => router.push(`/leaderboard#${model.id}`))
                      }
                      className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none hover:bg-muted/50 data-[selected=true]:bg-muted data-[selected=true]:text-zinc-100 transition-colors"
                    >
                      <Laptop className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{model.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
