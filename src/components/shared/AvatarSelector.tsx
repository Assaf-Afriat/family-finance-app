import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
  { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
  { id: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { id: 'red', bg: 'bg-red-500', ring: 'ring-red-500' },
  { id: 'teal', bg: 'bg-teal-500', ring: 'ring-teal-500' },
]

const AVATAR_EMOJIS = [
  '😀', '😎', '🤓', '😊', '🥳', '😇',
  '👨', '👩', '👴', '👵', '👦', '👧',
  '🧑‍💼', '👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🍳', '👩‍🔬',
  '🦁', '🐱', '🐶', '🦊', '🐼', '🐨',
]

interface AvatarSelectorProps {
  value: string | null
  onChange: (avatar: string) => void
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

export function parseAvatar(avatar: string | null): { emoji: string | null; color: string } {
  if (!avatar) return { emoji: null, color: 'blue' }
  
  const parts = avatar.split(':')
  if (parts.length === 2) {
    return { emoji: parts[0] || null, color: parts[1] }
  }
  
  if (AVATAR_EMOJIS.includes(avatar)) {
    return { emoji: avatar, color: 'blue' }
  }
  
  if (AVATAR_COLORS.some(c => c.id === avatar)) {
    return { emoji: null, color: avatar }
  }
  
  return { emoji: null, color: 'blue' }
}

export function getAvatarColorClass(colorId: string): string {
  const color = AVATAR_COLORS.find(c => c.id === colorId)
  return color?.bg || 'bg-blue-500'
}

export function AvatarSelector({ value, onChange, name, size = 'md' }: AvatarSelectorProps) {
  const { t } = useTranslation()
  const { emoji, color } = parseAvatar(value)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(emoji)
  const [selectedColor, setSelectedColor] = useState(color)

  const handleEmojiSelect = (newEmoji: string | null) => {
    setSelectedEmoji(newEmoji)
    onChange(newEmoji ? `${newEmoji}:${selectedColor}` : selectedColor)
  }

  const handleColorSelect = (newColor: string) => {
    setSelectedColor(newColor)
    onChange(selectedEmoji ? `${selectedEmoji}:${newColor}` : newColor)
  }

  const sizeClasses = {
    sm: 'h-12 w-12 text-lg',
    md: 'h-16 w-16 text-2xl',
    lg: 'h-20 w-20 text-3xl',
  }

  const previewSize = sizeClasses[size]
  const colorClass = getAvatarColorClass(selectedColor)

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex justify-center">
        <div
          className={cn(
            'flex items-center justify-center rounded-full text-white font-bold',
            colorClass,
            previewSize
          )}
        >
          {selectedEmoji || name?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('avatar.selectColor')}</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                'h-8 w-8 rounded-full transition-all',
                c.bg,
                selectedColor === c.id && 'ring-2 ring-offset-2',
                selectedColor === c.id && c.ring
              )}
              onClick={() => handleColorSelect(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Emoji Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('avatar.selectEmoji')}</p>
          {selectedEmoji && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleEmojiSelect(null)}
            >
              {t('avatar.useInitial')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all hover:bg-accent',
                selectedEmoji === e && 'bg-accent ring-2 ring-primary'
              )}
              onClick={() => handleEmojiSelect(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AvatarDisplayProps {
  avatar: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AvatarDisplay({ avatar, name, size = 'md', className }: AvatarDisplayProps) {
  const { emoji, color } = parseAvatar(avatar)
  const colorClass = getAvatarColorClass(color)

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-lg',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-20 w-20 text-3xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-bold',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {emoji || name.charAt(0).toUpperCase()}
    </div>
  )
}

export { AVATAR_COLORS, AVATAR_EMOJIS }
