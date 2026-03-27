import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Briefcase,
  Car,
  Coins,
  Film,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Lightbulb,
  Package,
  Plane,
  Scissors,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Tv,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

const CATEGORY_ICON_COMPONENTS: Record<string, LucideIcon> = {
  Home,
  Cart: ShoppingCart,
  Car,
  Bolt: Lightbulb,
  Film,
  HeartPulse,
  Utensils: UtensilsCrossed,
  ShoppingBag,
  BookOpen,
  Shield,
  Scissors,
  Tv,
  Plane,
  Gift,
  Briefcase,
  Wallet,
  TrendingUp,
  Laptop,
  Coins,
  Package,
}

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_COMPONENTS)

export function renderCategoryIcon(iconName?: string | null, className = 'h-4 w-4') {
  const Icon = CATEGORY_ICON_COMPONENTS[iconName || 'Package'] || Package
  return <Icon className={className} />
}
