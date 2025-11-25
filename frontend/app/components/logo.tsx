'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  onClick?: () => void
}

export function Logo({ className = '', size = 'md', animated = true, onClick }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      whileHover={animated ? { scale: 1.1 } : {}}
      whileTap={animated ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Main Logo - Modern Interlocking Grid Design */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Glow */}
        <defs>
          <radialGradient id="logoGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.4" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer Glow Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#logoGlow)"
          className="opacity-20"
        />

        {/* Main Hexagonal Grid Network */}
        <g className="text-orange-500">
          {/* Central Hub */}
          <circle
            cx="50"
            cy="50"
            r="8"
            className="fill-orange-500 animate-pulse"
            style={{ animationDuration: '3s' }}
          />

          {/* Connecting Nodes */}
          <g className="fill-orange-400 opacity-80">
            {/* Top Node */}
            <circle cx="50" cy="25" r="4" />
            {/* Right Node */}
            <circle cx="75" cy="37.5" r="4" />
            {/* Bottom Right Node */}
            <circle cx="75" cy="62.5" r="4" />
            {/* Bottom Node */}
            <circle cx="50" cy="75" r="4" />
            {/* Bottom Left Node */}
            <circle cx="25" cy="62.5" r="4" />
            {/* Top Left Node */}
            <circle cx="25" cy="37.5" r="4" />
          </g>

          {/* Energy Flow Lines */}
          <g className="stroke-orange-400" strokeWidth="2" strokeLinecap="round">
            {/* Main Connections */}
            <line x1="50" y1="50" x2="50" y2="29" /> {/* Top */}
            <line x1="50" y1="50" x2="71" y2="39" /> {/* Top Right */}
            <line x1="50" y1="50" x2="71" y2="61" /> {/* Bottom Right */}
            <line x1="50" y1="50" x2="50" y2="71" /> {/* Bottom */}
            <line x1="50" y1="50" x2="29" y2="61" /> {/* Bottom Left */}
            <line x1="50" y1="50" x2="29" y2="39" /> {/* Top Left */}
          </g>

          {/* Data Flow Particles */}
          <g className="fill-orange-300">
            <circle cx="50" cy="35" r="1.5" className="animate-ping opacity-60" />
            <circle cx="65" cy="42" r="1.5" className="animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
            <circle cx="65" cy="58" r="1.5" className="animate-ping opacity-60" style={{ animationDelay: '1s' }} />
            <circle cx="50" cy="65" r="1.5" className="animate-ping opacity-60" style={{ animationDelay: '1.5s' }} />
            <circle cx="35" cy="58" r="1.5" className="animate-ping opacity-60" style={{ animationDelay: '2s' }} />
            <circle cx="35" cy="42" r="1.5" className="animate-ping opacity-60" style={{ animationDelay: '2.5s' }} />
          </g>
        </g>

        {/* Inner Geometric Pattern - Represents Resources */}
        <g className="fill-orange-500/20 stroke-orange-400/40" strokeWidth="0.5">
          <polygon points="50,20 60,35 50,50 40,35" />
          <polygon points="70,50 80,65 70,80 60,65" />
          <polygon points="30,50 40,65 30,80 20,65" />
          <circle cx="50" cy="50" r="2" className="fill-orange-500 animate-pulse" />
        </g>
      </svg>

      {/* Floating Animation Overlary */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(249, 115, 22, 0)',
              '0 0 0 10px rgba(249, 115, 22, 0)',
              '0 0 0 0 rgba(249, 115, 22, 0)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}
    </motion.div>
  )
}

interface LogoWithTextProps extends LogoProps {
  showText?: boolean
}

export function LogoWithText({ showText = true, className = '', ...props }: LogoWithTextProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo {...props} />
      {showText && (
        <motion.span
          className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          InnexGrid
        </motion.span>
      )}
    </div>
  )
}

// Export for custom implementations
export const innexGridLogoSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="logoGlow" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#ea580c" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#dc2626" stop-opacity="0.4"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#logoGlow)" opacity="0.2"/>
  <g class="text-orange-500">
    <circle cx="50" cy="50" r="8" fill="#f97316" opacity="0.8"/>
    <circle cx="50" cy="25" r="4" fill="#fb923c" opacity="0.8"/>
    <circle cx="75" cy="37.5" r="4" fill="#fb923c" opacity="0.8"/>
    <circle cx="75" cy="62.5" r="4" fill="#fb923c" opacity="0.8"/>
    <circle cx="50" cy="75" r="4" fill="#fb923c" opacity="0.8"/>
    <circle cx="25" cy="62.5" r="4" fill="#fb923c" opacity="0.8"/>
    <circle cx="25" cy="37.5" r="4" fill="#fb923c" opacity="0.8"/>
    <line x1="50" y1="50" x2="50" y2="29" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="71" y2="39" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="71" y2="61" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="50" y2="71" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="29" y2="61" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="29" y2="39" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="35" r="1.5" fill="#fcd34d" opacity="0.6"/>
    <circle cx="65" cy="42" r="1.5" fill="#fcd34d" opacity="0.6"/>
    <circle cx="65" cy="58" r="1.5" fill="#fcd34d" opacity="0.6"/>
    <circle cx="50" cy="65" r="1.5" fill="#fcd34d" opacity="0.6"/>
    <circle cx="35" cy="58" r="1.5" fill="#fcd34d" opacity="0.6"/>
    <circle cx="35" cy="42" r="1.5" fill="#fcd34d" opacity="0.6"/>
  </g>
</svg>
`
