import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useCategoryStore, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/stores/categoryStore'
import { CATEGORY_ICON_OPTIONS, renderCategoryIcon } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS = [
  { id: 'blue', bg: 'bg-blue-500', text: 'Blue' },
  { id: 'green', bg: 'bg-green-500', text: 'Green' },
  { id: 'purple', bg: 'bg-purple-500', text: 'Purple' },
  { id: 'orange', bg: 'bg-orange-500', text: 'Orange' },
  { id: 'pink', bg: 'bg-pink-500', text: 'Pink' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'Cyan' },
  { id: 'red', bg: 'bg-red-500', text: 'Red' },
  { id: 'amber', bg: 'bg-amber-500', text: 'Amber' },
]

export function CategoryManagement() {
  const { t } = useTranslation()
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore()
  const { showToast } = useToast()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<'Income' | 'Expense'>('Expense')
  const [icon, setIcon] = useState('Package')
  const [color, setColor] = useState('blue')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setName('')
    setType('Expense')
    setIcon('Package')
    setColor('blue')
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setName(category.name)
    setType(category.type as 'Income' | 'Expense')
    setIcon(category.icon || 'Package')
    setColor(category.color || 'blue')
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await createCategory({ name: name.trim(), icon, color, type })
      showToast(t('toast.categoryCreated'), 'success')
      setIsAddOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create category:', error)
      showToast(t('toast.categoryCreateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCategory || !name.trim()) return

    setIsSubmitting(true)
    try {
      await updateCategory(selectedCategory.id, { name: name.trim(), icon, color, type })
      showToast(t('toast.categoryUpdated'), 'success')
      setIsEditOpen(false)
      setSelectedCategory(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update category:', error)
      showToast(t('toast.categoryUpdateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    setIsSubmitting(true)
    try {
      await deleteCategory(selectedCategory.id)
      showToast(t('toast.categoryDeleted'), 'success')
      setIsDeleteOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error('Failed to delete category:', error)
      showToast(t('toast.categoryDeleteFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const expenseCategories = categories.filter((category) => category.type === 'Expense')
  const incomeCategories = categories.filter((category) => category.type === 'Income')

  const getColorClass = (colorId: string | null | undefined) => {
    const found = CATEGORY_COLORS.find((categoryColor) => categoryColor.id === colorId)
    return found?.bg || 'bg-gray-500'
  }

  const renderCategoryForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('categories.name')}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('categories.namePlaceholder')}
          data-testid="category-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label>{t('categories.type')}</Label>
        <Select value={type} onValueChange={(value) => setType(value as 'Income' | 'Expense')}>
          <SelectTrigger data-testid="category-type-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Expense" data-testid="category-type-option-expense">{t('common.expense')}</SelectItem>
            <SelectItem value="Income" data-testid="category-type-option-income">{t('common.income')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('categories.icon')}</Label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_ICON_OPTIONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-accent',
                icon === iconName && 'bg-accent ring-2 ring-primary'
              )}
              onClick={() => setIcon(iconName)}
              data-testid={`category-icon-option-${iconName.toLowerCase()}`}
            >
              {renderCategoryIcon(iconName)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('categories.color')}</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((categoryColor) => (
            <button
              key={categoryColor.id}
              type="button"
              className={cn(
                'h-8 w-8 rounded-full transition-all',
                categoryColor.bg,
                color === categoryColor.id && 'ring-2 ring-offset-2 ring-primary'
              )}
              onClick={() => setColor(categoryColor.id)}
              data-testid={`category-color-option-${categoryColor.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('categories.title')}
        </CardTitle>
        <CardDescription>{t('categories.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetForm()
              setIsAddOpen(true)
            }}
            data-testid="add-category-button"
          >
            <Plus className="me-2 h-4 w-4" />
            {t('categories.addCategory')}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('common.expense')}</h4>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('categories.noCustomExpense')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="cursor-pointer gap-2 px-3 py-1.5 hover:bg-accent"
                  onClick={() => openEditDialog(category)}
                  data-testid={`category-badge-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className={cn('h-3 w-3 rounded-full', getColorClass(category.color))} />
                  {renderCategoryIcon(category.icon)}
                  <span>{category.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('common.income')}</h4>
          {incomeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('categories.noCustomIncome')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="cursor-pointer gap-2 px-3 py-1.5 hover:bg-accent"
                  onClick={() => openEditDialog(category)}
                >
                  <span className={cn('h-3 w-3 rounded-full', getColorClass(category.color))} />
                  {renderCategoryIcon(category.icon)}
                  <span>{category.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-medium">{t('categories.defaultCategories')}</h4>
          <p className="mb-3 text-xs text-muted-foreground">{t('categories.defaultDescription')}</p>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium">{t('common.expense')}:</span>
              <p className="text-xs text-muted-foreground">
                {DEFAULT_EXPENSE_CATEGORIES.join(', ')}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium">{t('common.income')}:</span>
              <p className="text-xs text-muted-foreground">
                {DEFAULT_INCOME_CATEGORIES.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('categories.addCategory')}</DialogTitle>
            <DialogDescription>{t('categories.addDescription')}</DialogDescription>
          </DialogHeader>
          {renderCategoryForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !name.trim()} data-testid="category-submit-button">
              {isSubmitting ? t('common.saving') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('categories.editCategory')}</DialogTitle>
            <DialogDescription>{t('categories.editDescription')}</DialogDescription>
          </DialogHeader>
          {renderCategoryForm()}
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                setIsEditOpen(false)
                setIsDeleteOpen(true)
              }}
              data-testid="category-delete-button"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting || !name.trim()} data-testid="category-edit-submit-button">
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('categories.deleteCategory')}</DialogTitle>
            <DialogDescription>
              {t('categories.deleteConfirm', { name: selectedCategory?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="category-delete-confirm-button"
            >
              {isSubmitting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
