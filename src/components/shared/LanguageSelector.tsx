import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { languages, changeLanguage } from '@/lib/i18n'

export function LanguageSelector() {
  const { i18n } = useTranslation()

  const handleChange = (value: string) => {
    changeLanguage(value)
  }

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 me-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
