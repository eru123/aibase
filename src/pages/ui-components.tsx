import { useCallback, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Modal,
  confirmModal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Dropdown,
  type DropdownOption,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DataTable,
  DropdownMenuItem,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui'
import { DataTableFilterField } from '@/components/ui/data-table-toolbar'
import { useAuth } from '@/lib/auth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Check, Eye, EyeOff, Loader2, Plus, Sparkles, Menu, Calendar, CreditCard, DollarSign } from 'lucide-react'


type ExampleBlock = {
  id: string
  title: string
  code: string
  render: () => React.ReactNode
  componentName: string
  imports: string[]
  setup?: string
}

type Section = {
  id: string
  title: string
  description: string
  blocks: ExampleBlock[]
}

const normalizeSnippet = (snippet: string): string => {
  const trimmed = snippet.replace(/^\n/, '').replace(/\n\s*$/, '')
  const lines = trimmed.split('\n')
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0)
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0
  return lines.map((line) => line.slice(minIndent)).join('\n')
}

const indentLines = (value: string, spaces: number): string => {
  const padding = ' '.repeat(spaces)
  return value
    .split('\n')
    .map((line) => (line.length > 0 ? `${padding}${line}` : line))
    .join('\n')
}

const buildSnippet = (block: ExampleBlock): string => {
  const importBlock = block.imports.join('\n')
  const body = indentLines(normalizeSnippet(block.code), 4)
  const setupBlock = block.setup ? `${indentLines(block.setup.trim(), 2)}\n` : ''

  return `
${importBlock}

export default function ${block.componentName}() {
${setupBlock}  return (
${body}
  )
}
`
}

export default function UIComponentsPage() {
  const { user } = useAuth()
  const { data: systemSettings, isLoading } = useSystemSettings()
  const [selectValue, setSelectValue] = useState('design')
  const [multiDropdownValue, setMultiDropdownValue] = useState<string[]>(['alerts'])
  const [modalOpen, setModalOpen] = useState(false)
  const [lockedModalOpen, setLockedModalOpen] = useState(false)
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [confirmOutcome, setConfirmOutcome] = useState<string | null>(null)

  const invoices = useMemo(() => [
    { id: '1', invoice: "INV001", status: "Paid", totalAmount: "$250.00", paymentMethod: "Credit Card", date: "2024-05-01" },
    { id: '2', invoice: "INV002", status: "Pending", totalAmount: "$150.00", paymentMethod: "PayPal", date: "2024-05-02" },
    { id: '3', invoice: "INV003", status: "Unpaid", totalAmount: "$350.00", paymentMethod: "Bank Transfer", date: "2024-05-03" },
    { id: '4', invoice: "INV004", status: "Paid", totalAmount: "$450.00", paymentMethod: "Credit Card", date: "2024-05-05" },
    { id: '5', invoice: "INV005", status: "Paid", totalAmount: "$550.00", paymentMethod: "PayPal", date: "2024-05-10" },
    { id: '6', invoice: "INV006", status: "Paid", totalAmount: "$200.00", paymentMethod: "Bank Transfer", date: "2024-05-12" },
    { id: '7', invoice: "INV007", status: "Unpaid", totalAmount: "$300.00", paymentMethod: "Credit Card", date: "2024-05-15" },
    { id: '8', invoice: "INV008", status: "Pending", totalAmount: "$120.00", paymentMethod: "PayPal", date: "2024-05-18" },
    { id: '9', invoice: "INV009", status: "Paid", totalAmount: "$500.00", paymentMethod: "Bank Transfer", date: "2024-05-20" },
    { id: '10', invoice: "INV010", status: "Paid", totalAmount: "$600.00", paymentMethod: "Credit Card", date: "2024-05-22" },
    { id: '11', invoice: "INV011", status: "Paid", totalAmount: "$250.00", paymentMethod: "Credit Card", date: "2024-05-25" },
    { id: '12', invoice: "INV012", status: "Pending", totalAmount: "$150.00", paymentMethod: "PayPal", date: "2024-05-28" },
    { id: '13', invoice: "INV013", status: "Unpaid", totalAmount: "$350.00", paymentMethod: "Bank Transfer", date: "2024-06-01" },
    { id: '14', invoice: "INV014", status: "Paid", totalAmount: "$450.00", paymentMethod: "Credit Card", date: "2024-06-03" },
    { id: '15', invoice: "INV015", status: "Paid", totalAmount: "$550.00", paymentMethod: "PayPal", date: "2024-06-05" },
  ], [])

  const [tableSelected, setTableSelected] = useState<(string | number)[]>([])
  const [tableSorting, setTableSorting] = useState<{ column: string, direction: 'asc' | 'desc' } | undefined>(undefined)
  const [tablePagination, setTablePagination] = useState({ page: 1, limit: 5 })
  const [tableSearch, setTableSearch] = useState("")
  const [tableFilters, setTableFilters] = useState<Record<string, any>>({}) // Changed to any to support ranges
  const [openCode, setOpenCode] = useState<Record<string, boolean>>({})

  const filterFields: DataTableFilterField<any>[] = [
    {
      label: 'Status',
      value: 'status',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Unpaid', value: 'unpaid' },
      ]
    },
    {
      label: 'Method',
      value: 'paymentMethod',
      options: [
        { label: 'Credit Card', value: 'credit card', icon: CreditCard },
        { label: 'PayPal', value: 'paypal', icon: DollarSign },
        { label: 'Bank Transfer', value: 'bank transfer' },
      ]
    },
    {
      label: 'Price',
      value: 'totalAmount',
      type: 'price-range',
    },
    {
      label: 'Date',
      value: 'date',
      type: 'daterange',
    }
  ]

  const columns = useMemo<any[]>(() => [
    { header: "Invoice", accessorKey: "invoice", className: "font-medium", enableSorting: true },
    {
      header: "Status",
      enableSorting: true,
      cell: (row: any) => (
        <Badge variant={row.status === 'Paid' ? 'outline' : row.status === 'Unpaid' ? 'destructive' : 'subtle'}>
          {row.status}
        </Badge>
      )
    },
    { header: "Method", accessorKey: "paymentMethod", enableSorting: true },
    { header: "Date", accessorKey: "date", enableSorting: true },
    { header: <div className="text-right">Amount</div>, accessorKey: "totalAmount", className: "text-right", enableSorting: true },
  ], [])

  // Filter logic for mock data
  const filteredInvoices = useMemo(() => {
    let data = [...invoices]

    if (tableSearch) {
      data = data.filter(i =>
        i.invoice.toLowerCase().includes(tableSearch.toLowerCase()) ||
        i.paymentMethod.toLowerCase().includes(tableSearch.toLowerCase())
      )
    }

    Object.keys(tableFilters).forEach(key => {
      const filterValue = tableFilters[key]

      // Handle Price Range (Array [min, max])
      if (key === 'totalAmount') {
        const [min, max] = filterValue as [number | undefined, number | undefined]
        if (min !== undefined || max !== undefined) {
          data = data.filter(i => {
            const amount = parseFloat(i.totalAmount.replace('$', ''))
            if (min !== undefined && amount < min) return false
            if (max !== undefined && amount > max) return false
            return true
          })
        }
      }
      // Handle Date Range (Array [start, end])
      else if (key === 'date') {
        const [start, end] = filterValue as [string | undefined, string | undefined]
        if (start || end) {
          data = data.filter(i => {
            if (!i.date) return false
            const rowDate = i.date // YYYY-MM-DD string comparisons work reliably
            if (start && rowDate < start) return false
            if (end && rowDate > end) return false
            return true
          })
        }
      }
      // Handle Set-based faceted filters
      else if (filterValue instanceof Set && filterValue.size > 0) {
        data = data.filter(i => filterValue.has(i[key as keyof typeof i]?.toString().toLowerCase()))
      }
    })

    if (tableSorting) {
      data.sort((a, b) => {
        const aValue = a[tableSorting.column as keyof typeof a]
        const bValue = b[tableSorting.column as keyof typeof b]
        if (aValue < bValue) return tableSorting.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return tableSorting.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return data
  }, [tableSearch, tableSorting, tableFilters])

  // Pagination logic
  const paginatedInvoices = useMemo(() => {
    const start = (tablePagination.page - 1) * tablePagination.limit
    return filteredInvoices.slice(start, start + tablePagination.limit)
  }, [filteredInvoices, tablePagination])

  const runs = useMemo(() => [
    { id: 'run-1', job: 'Payroll sync', status: 'Success', durationMinutes: 18, startTime: '08:15', runDate: '2024-05-02' },
    { id: 'run-2', job: 'Invoice export', status: 'Running', durationMinutes: 6, startTime: '09:30', runDate: '2024-05-03' },
    { id: 'run-3', job: 'Ledger rebuild', status: 'Failed', durationMinutes: 42, startTime: '10:45', runDate: '2024-05-04' },
    { id: 'run-4', job: 'Usage snapshot', status: 'Success', durationMinutes: 12, startTime: '11:20', runDate: '2024-05-05' },
    { id: 'run-5', job: 'Customer import', status: 'Success', durationMinutes: 28, startTime: '13:05', runDate: '2024-05-06' },
    { id: 'run-6', job: 'Tax validation', status: 'Running', durationMinutes: 9, startTime: '14:10', runDate: '2024-05-07' },
    { id: 'run-7', job: 'Overdue scan', status: 'Success', durationMinutes: 16, startTime: '15:40', runDate: '2024-05-08' },
    { id: 'run-8', job: 'Charge retry', status: 'Failed', durationMinutes: 33, startTime: '16:25', runDate: '2024-05-09' },
  ], [])

  const [runSorting, setRunSorting] = useState<{ column: string, direction: 'asc' | 'desc' } | undefined>(undefined)
  const [runPagination, setRunPagination] = useState({ page: 1, limit: 5 })
  const [runSearch, setRunSearch] = useState("")
  const [runFilters, setRunFilters] = useState<Record<string, any>>({})

  const runFilterFields: DataTableFilterField<any>[] = [
    {
      label: 'Status',
      value: 'status',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Running', value: 'running' },
        { label: 'Failed', value: 'failed' },
      ]
    },
    {
      label: 'Duration (min)',
      value: 'durationMinutes',
      type: 'number-range',
    },
    {
      label: 'Start time',
      value: 'startTime',
      type: 'time-range',
    },
    {
      label: 'Run date',
      value: 'runDate',
      type: 'daterange',
    }
  ]

  const runColumns = useMemo<any[]>(() => [
    { header: "Job", accessorKey: "job", className: "font-medium", enableSorting: true },
    {
      header: "Status",
      enableSorting: true,
      cell: (row: any) => (
        <Badge variant={row.status === 'Failed' ? 'destructive' : row.status === 'Running' ? 'subtle' : 'outline'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: "Duration",
      accessorKey: "durationMinutes",
      enableSorting: true,
      cell: (row: any) => row.durationMinutes + "m"
    },
    { header: "Start Time", accessorKey: "startTime", enableSorting: true },
    { header: "Run Date", accessorKey: "runDate", enableSorting: true },
  ], [])

  const filteredRuns = useMemo(() => {
    let data = [...runs]

    if (runSearch) {
      data = data.filter(run =>
        run.job.toLowerCase().includes(runSearch.toLowerCase()) ||
        run.status.toLowerCase().includes(runSearch.toLowerCase())
      )
    }

    Object.keys(runFilters).forEach(key => {
      const filterValue = runFilters[key]

      if (key === 'durationMinutes') {
        const [min, max] = filterValue as [number | undefined, number | undefined]
        if (min !== undefined || max !== undefined) {
          data = data.filter(run => {
            const duration = Number(run.durationMinutes)
            if (min !== undefined && duration < min) return false
            if (max !== undefined && duration > max) return false
            return true
          })
        }
      } else if (key === 'runDate') {
        const [start, end] = filterValue as [string | undefined, string | undefined]
        if (start || end) {
          data = data.filter(run => {
            const rowDate = run.runDate
            if (start && rowDate < start) return false
            if (end && rowDate > end) return false
            return true
          })
        }
      } else if (key === 'startTime') {
        const [start, end] = filterValue as [string | undefined, string | undefined]
        if (start || end) {
          data = data.filter(run => {
            const rowTime = run.startTime
            if (start && rowTime < start) return false
            if (end && rowTime > end) return false
            return true
          })
        }
      } else if (filterValue instanceof Set && filterValue.size > 0) {
        data = data.filter(run => filterValue.has(run[key as keyof typeof run]?.toString().toLowerCase()))
      }
    })

    if (runSorting) {
      data.sort((a, b) => {
        const aValue = a[runSorting.column as keyof typeof a]
        const bValue = b[runSorting.column as keyof typeof b]
        if (aValue < bValue) return runSorting.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return runSorting.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return data
  }, [runs, runSearch, runSorting, runFilters])

  const paginatedRuns = useMemo(() => {
    const start = (runPagination.page - 1) * runPagination.limit
    return filteredRuns.slice(start, start + runPagination.limit)
  }, [filteredRuns, runPagination])

  const navLinks = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'textarea', label: 'Textarea' },
    { id: 'badges', label: 'Badges' },
    { id: 'cards', label: 'Cards' },
    { id: 'switches', label: 'Switches' },
    { id: 'selects', label: 'Select' },
    { id: 'tabs', label: 'Tabs' },
    { id: 'dropdowns', label: 'Dropdown' },
    { id: 'modals', label: 'Modal' },
    { id: 'table', label: 'Table' },
  ]

  const dropdownOptions = useMemo<DropdownOption[]>(
    () => [
      { value: 'alerts', label: 'Alerts', description: 'Activity and system notices' },
      { value: 'reports', label: 'Reports', description: 'Monthly rollups' },
      { value: 'exports', label: 'Exports', description: 'CSV + PDF deliveries' },
      { value: 'billing', label: 'Billing', description: 'Invoices and usage', disabled: true },
    ],
    []
  )

  const runConfirm = useCallback(
    async (type?: 'success' | 'warning' | 'danger' | 'error' | 'info') => {
      const label = type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : 'Default'
      const confirmed = await confirmModal({
        title: `${label} confirmation`,
        message: 'This action will update billing preferences.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type,
      })
      setConfirmOutcome(`${label}: ${confirmed ? 'Confirmed' : 'Cancelled'}`)
    },
    [confirmModal, setConfirmOutcome]
  )

  const sections = useMemo<Section[]>(
    () => [
      {
        id: 'buttons',
        title: 'Buttons',
        description: 'Entry: use buttons for actions and navigation.',
        blocks: [
          {
            id: 'buttons-variants',
            title: 'Variants',
            componentName: 'ButtonsVariantsExample',
            imports: ["import { Button } from '@/components/ui'"],
            code: `
<div className="flex flex-wrap gap-3">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
</div>
`,
            render: () => (
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            ),
          },
          {
            id: 'buttons-sizes',
            title: 'Sizes + Icons',
            componentName: 'ButtonSizesExample',
            imports: ["import { Button } from '@/components/ui'", "import { Plus } from 'lucide-react'"],
            code: `
<div className="flex flex-wrap items-center gap-3">
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">XL</Button>
  <Button size="icon" aria-label="Add">
    <Plus className="h-4 w-4" />
  </Button>
</div>
`,
            render: () => (
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">XL</Button>
                <Button size="icon" aria-label="Add">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ],
      },
      {
        id: 'inputs',
        title: 'Inputs',
        description: 'Entry: pair inputs with labels and helper text.',
        blocks: [
          {
            id: 'inputs-basic',
            title: 'Basic inputs',
            componentName: 'InputsBasicExample',
            imports: ["import { Input, Label } from '@/components/ui'"],
            code: `
<div className="space-y-4">
  <div>
    <Label htmlFor="example-email">Email</Label>
    <Input id="example-email" type="email" placeholder="you@billing.local" />
  </div>
  <div>
    <Label htmlFor="example-password">Password</Label>
    <Input id="example-password" type="password" placeholder="********" />
  </div>
</div>
`,
            render: () => (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="example-email">Email</Label>
                  <Input id="example-email" type="email" placeholder="you@billing.local" />
                </div>
                <div>
                  <Label htmlFor="example-password">Password</Label>
                  <Input id="example-password" type="password" placeholder="********" />
                </div>
              </div>
            ),
          },
          {
            id: 'inputs-password-toggle',
            title: 'Password visibility',
            componentName: 'PasswordInputExample',
            imports: [
              "import { useState } from 'react'",
              "import { Input, Label } from '@/components/ui'",
              "import { Eye, EyeOff } from 'lucide-react'",
            ],
            setup: `
const [showPasswordInput, setShowPasswordInput] = useState(false)
`,
            code: `
<div className="space-y-2">
  <Label htmlFor="example-password-toggle">Password</Label>
  <div className="relative">
    <Input
      id="example-password-toggle"
      type={showPasswordInput ? 'text' : 'password'}
      placeholder="Enter a secure password"
      className="pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPasswordInput((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
      aria-label={showPasswordInput ? 'Hide password' : 'Show password'}
    >
      {showPasswordInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
  <p className="text-xs text-gray-500">Use 8+ characters.</p>
</div>
`,
            render: () => (
              <div className="space-y-2">
                <Label htmlFor="example-password-toggle">Password</Label>
                <div className="relative">
                  <Input
                    id="example-password-toggle"
                    type={showPasswordInput ? 'text' : 'password'}
                    placeholder="Enter a secure password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                    aria-label={showPasswordInput ? 'Hide password' : 'Show password'}
                  >
                    {showPasswordInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Use 8+ characters.</p>
              </div>
            ),
          },
          {
            id: 'inputs-states',
            title: 'States',
            componentName: 'InputStatesExample',
            imports: ["import { Input, Label } from '@/components/ui'"],
            code: `
<div className="space-y-4">
  <div>
    <Label htmlFor="example-error">Error state</Label>
    <Input
      id="example-error"
      className="border-red-400 focus-visible:ring-red-400"
      placeholder="Invalid value"
    />
    <p className="mt-1 text-xs text-red-500">Please enter a valid value.</p>
  </div>
  <div>
    <Label htmlFor="example-disabled">Disabled</Label>
    <Input id="example-disabled" disabled placeholder="Disabled input" />
  </div>
</div>
`,
            render: () => (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="example-error">Error state</Label>
                  <Input
                    id="example-error"
                    className="border-red-400 focus-visible:ring-red-400"
                    placeholder="Invalid value"
                  />
                  <p className="mt-1 text-xs text-red-500">Please enter a valid value.</p>
                </div>
                <div>
                  <Label htmlFor="example-disabled">Disabled</Label>
                  <Input id="example-disabled" disabled placeholder="Disabled input" />
                </div>
              </div>
            ),
          },
        ],
      },
      {
        id: 'textarea',
        title: 'Textarea',
        description: 'Entry: use textarea for longer messages or notes.',
        blocks: [
          {
            id: 'textarea-basic',
            title: 'Example',
            componentName: 'TextareaExample',
            imports: ["import { Label, Textarea } from '@/components/ui'"],
            code: `
<div className="space-y-4">
  <div>
    <Label htmlFor="example-message">Message</Label>
    <Textarea id="example-message" rows={4} placeholder="Share a brief summary..." />
    <p className="mt-1 text-xs text-gray-500">Markdown supported.</p>
  </div>
  <div>
    <Label htmlFor="example-disabled-textarea">Disabled</Label>
    <Textarea id="example-disabled-textarea" rows={3} disabled placeholder="Disabled textarea" />
  </div>
</div>
`,
            render: () => (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="example-message">Message</Label>
                  <Textarea id="example-message" rows={4} placeholder="Share a brief summary..." />
                  <p className="mt-1 text-xs text-gray-500">Markdown supported.</p>
                </div>
                <div>
                  <Label htmlFor="example-disabled-textarea">Disabled</Label>
                  <Textarea id="example-disabled-textarea" rows={3} disabled placeholder="Disabled textarea" />
                </div>
              </div>
            ),
          },
        ],
      },
      {
        id: 'badges',
        title: 'Badges',
        description: 'Entry: show status, category, or emphasis.',
        blocks: [
          {
            id: 'badges-variants',
            title: 'Variants',
            componentName: 'BadgeVariantsExample',
            imports: ["import { Badge } from '@/components/ui'"],
            code: `
<div className="flex flex-wrap gap-3">
  <Badge>Active</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="subtle">Subtle</Badge>
  <Badge variant="destructive">Blocked</Badge>
</div>
`,
            render: () => (
              <div className="flex flex-wrap gap-3">
                <Badge>Active</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="subtle">Subtle</Badge>
                <Badge variant="destructive">Blocked</Badge>
              </div>
            ),
          },
          {
            id: 'badges-icons',
            title: 'Icons',
            componentName: 'BadgeIconExample',
            imports: ["import { Badge } from '@/components/ui'", "import { Check, Sparkles } from 'lucide-react'"],
            code: `
<div className="flex flex-wrap gap-3">
  <Badge leadingIcon={<Check className="h-3 w-3" />}>Verified</Badge>
  <Badge variant="subtle" trailingIcon={<Sparkles className="h-3 w-3" />}>
    New
  </Badge>
</div>
`,
            render: () => (
              <div className="flex flex-wrap gap-3">
                <Badge leadingIcon={<Check className="h-3 w-3" />}>Verified</Badge>
                <Badge variant="subtle" trailingIcon={<Sparkles className="h-3 w-3" />}>
                  New
                </Badge>
              </div>
            ),
          },
        ],
      },
      {
        id: 'cards',
        title: 'Cards',
        description: 'Entry: combine header, content, and footer layouts.',
        blocks: [
          {
            id: 'cards-samples',
            title: 'Layout',
            componentName: 'CardLayoutsExample',
            imports: [
              "import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'",
            ],
            code: `
<div className="grid gap-4 md:grid-cols-2">
  <Card className="border border-border/70 shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg">Standard Card</CardTitle>
      <CardDescription>Compact overview content.</CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-gray-600">
      Build small, focused summaries with clear hierarchy.
    </CardContent>
  </Card>
  <Card className="border border-border/70 shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg">Action Card</CardTitle>
      <CardDescription>Include actions in the footer.</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between gap-3 text-sm text-gray-600">
      <span>Launch the onboarding wizard</span>
      <Button size="sm" variant="outline">Open</Button>
    </CardContent>
  </Card>
</div>
`,
            render: () => (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Standard Card</CardTitle>
                    <CardDescription>Compact overview content.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    Build small, focused summaries with clear hierarchy.
                  </CardContent>
                </Card>
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Action Card</CardTitle>
                    <CardDescription>Include actions in the footer.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3 text-sm text-gray-600">
                    <span>Launch the onboarding wizard</span>
                    <Button size="sm" variant="outline">Open</Button>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ],
      },
      {
        id: 'switches',
        title: 'Switches',
        description: 'Entry: toggle binary settings with clear labeling.',
        blocks: [
          {
            id: 'switches-default',
            title: 'Defaults',
            componentName: 'SwitchDefaultsExample',
            imports: ["import { Switch } from '@/components/ui'"],
            code: `
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-900">Default switch</p>
      <p className="text-xs text-gray-500">Primary preset is on by default.</p>
    </div>
    <Switch initialState />
  </div>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-900">Outline variant</p>
      <p className="text-xs text-gray-500">Works well on tinted backgrounds.</p>
    </div>
    <Switch variant="outline" initialState={false} />
  </div>
</div>
`,
            render: () => (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Default switch</p>
                    <p className="text-xs text-gray-500">Primary preset is on by default.</p>
                  </div>
                  <Switch initialState />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Outline variant</p>
                    <p className="text-xs text-gray-500">Works well on tinted backgrounds.</p>
                  </div>
                  <Switch variant="outline" initialState={false} />
                </div>
              </div>
            ),
          },
          {
            id: 'switches-sizes',
            title: 'Sizes',
            componentName: 'SwitchSizesExample',
            imports: ["import { Switch } from '@/components/ui'"],
            code: `
<div className="flex flex-wrap gap-4">
  <Switch size="xs" />
  <Switch size="sm" />
  <Switch size="md" />
  <Switch size="lg" />
  <Switch size="xl" />
</div>
`,
            render: () => (
              <div className="flex flex-wrap gap-4">
                <Switch size="xs" />
                <Switch size="sm" />
                <Switch size="md" />
                <Switch size="lg" />
                <Switch size="xl" />
              </div>
            ),
          },
        ],
      },
      {
        id: 'selects',
        title: 'Select',
        description: 'Entry: use select for compact single-choice inputs.',
        blocks: [
          {
            id: 'selects-basic',
            title: 'Single select',
            componentName: 'SelectExample',
            imports: [
              "import { useState } from 'react'",
              "import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'",
            ],
            setup: `
const [selectValue, setSelectValue] = useState('design')
`,
            code: `
<div className="space-y-3">
  <Label htmlFor="example-select">Workspace focus</Label>
  <Select value={selectValue} onValueChange={setSelectValue}>
    <SelectTrigger id="example-select">
      <SelectValue placeholder="Select focus" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="design">Design review</SelectItem>
      <SelectItem value="ops">Operations</SelectItem>
      <SelectItem value="finance">Finance</SelectItem>
    </SelectContent>
  </Select>
</div>
`,
            render: () => (
              <div className="space-y-3">
                <Label htmlFor="example-select">Workspace focus</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="example-select">
                    <SelectValue placeholder="Select focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Design review</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            id: 'selects-disabled',
            title: 'Disabled select',
            componentName: 'SelectDisabledExample',
            imports: [
              "import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'",
            ],
            code: `
<div className="space-y-3">
  <Label htmlFor="example-select-disabled">Disabled select</Label>
  <Select value="disabled">
    <SelectTrigger id="example-select-disabled" disabled>
      <SelectValue placeholder="Unavailable" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="disabled">Disabled</SelectItem>
    </SelectContent>
  </Select>
</div>
`,
            render: () => (
              <div className="space-y-3">
                <Label htmlFor="example-select-disabled">Disabled select</Label>
                <Select value="disabled">
                  <SelectTrigger id="example-select-disabled" disabled>
                    <SelectValue placeholder="Unavailable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
        ],
      },
      {
        id: 'tabs',
        title: 'Tabs',
        description: 'Entry: organize related content without navigation.',
        blocks: [
          {
            id: 'tabs-basic',
            title: 'Example',
            componentName: 'TabsExample',
            imports: ["import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'"],
            code: `
<Tabs defaultValue="activity">
  <TabsList>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
    <TabsTrigger value="files">Files</TabsTrigger>
  </TabsList>
  <TabsContent value="activity" className="text-sm text-gray-600">
    Recent actions and status updates live here.
  </TabsContent>
  <TabsContent value="notes" className="text-sm text-gray-600">
    Capture internal notes and follow-ups.
  </TabsContent>
  <TabsContent value="files" className="text-sm text-gray-600">
    Store reference documents and exports.
  </TabsContent>
</Tabs>
`,
            render: () => (
              <Tabs defaultValue="activity">
                <TabsList>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="text-sm text-gray-600">
                  Recent actions and status updates live here.
                </TabsContent>
                <TabsContent value="notes" className="text-sm text-gray-600">
                  Capture internal notes and follow-ups.
                </TabsContent>
                <TabsContent value="files" className="text-sm text-gray-600">
                  Store reference documents and exports.
                </TabsContent>
              </Tabs>
            ),
          },
        ],
      },
      {
        id: 'dropdowns',
        title: 'Dropdown',
        description: 'Entry: searchable dropdown for single and multi-select.',
        blocks: [
          {
            id: 'dropdowns-single',
            title: 'Single select',
            componentName: 'DropdownSingleExample',
            imports: ["import { Dropdown, type DropdownOption } from '@/components/ui'"],
            setup: `
const dropdownOptions: DropdownOption[] = [
  { value: 'alerts', label: 'Alerts', description: 'Activity and system notices' },
  { value: 'reports', label: 'Reports', description: 'Monthly rollups' },
  { value: 'exports', label: 'Exports', description: 'CSV + PDF deliveries' },
  { value: 'billing', label: 'Billing', description: 'Invoices and usage', disabled: true },
]
`,
            code: `
<Dropdown
  options={dropdownOptions}
  defaultValue="reports"
  placeholder="Select a channel"
/>
`,
            render: () => (
              <Dropdown
                options={dropdownOptions}
                defaultValue="reports"
                placeholder="Select a channel"
              />
            ),
          },
          {
            id: 'dropdowns-searchable',
            title: 'Searchable dropdown',
            componentName: 'DropdownSearchExample',
            imports: ["import { Dropdown, type DropdownOption } from '@/components/ui'"],
            setup: `
const dropdownOptions: DropdownOption[] = [
  { value: 'alerts', label: 'Alerts', description: 'Activity and system notices' },
  { value: 'reports', label: 'Reports', description: 'Monthly rollups' },
  { value: 'exports', label: 'Exports', description: 'CSV + PDF deliveries' },
  { value: 'billing', label: 'Billing', description: 'Invoices and usage', disabled: true },
]
`,
            code: `
<Dropdown
  options={dropdownOptions}
  defaultValue="reports"
  placeholder="Search templates"
  searchable
/>
`,
            render: () => (
              <Dropdown
                options={dropdownOptions}
                defaultValue="reports"
                placeholder="Search templates"
                searchable
              />
            ),
          },
          {
            id: 'dropdowns-multi',
            title: 'Multi select',
            componentName: 'DropdownMultiExample',
            imports: [
              "import { useState } from 'react'",
              "import { Dropdown, type DropdownOption } from '@/components/ui'",
            ],
            setup: `
const dropdownOptions: DropdownOption[] = [
  { value: 'alerts', label: 'Alerts', description: 'Activity and system notices' },
  { value: 'reports', label: 'Reports', description: 'Monthly rollups' },
  { value: 'exports', label: 'Exports', description: 'CSV + PDF deliveries' },
  { value: 'billing', label: 'Billing', description: 'Invoices and usage', disabled: true },
]
const [multiDropdownValue, setMultiDropdownValue] = useState<string[]>(['alerts'])
`,
            code: `
<Dropdown
  options={dropdownOptions}
  value={multiDropdownValue}
  onChange={(next) => setMultiDropdownValue(next as string[])}
  multiple
  searchable
  placeholder="Pick delivery channels"
/>
`,
            render: () => (
              <Dropdown
                options={dropdownOptions}
                value={multiDropdownValue}
                onChange={(next) => setMultiDropdownValue(next as string[])}
                multiple
                searchable
                placeholder="Pick delivery channels"
              />
            ),
          },
        ],
      },
      {
        id: 'modals',
        title: 'Modal',
        description: 'Entry: confirm or collect input with minimal context switching.',
        blocks: [
          {
            id: 'modals-basic',
            title: 'Example',
            componentName: 'ModalExample',
            imports: [
              "import { useState } from 'react'",
              "import { Button, Modal } from '@/components/ui'",
              "import { Loader2 } from 'lucide-react'",
            ],
            setup: `
const [modalOpen, setModalOpen] = useState(false)
`,
            code: `
<>
  <div className="flex flex-wrap items-center gap-3">
    <Button onClick={() => setModalOpen(true)}>Open modal</Button>
    <Button variant="outline" disabled>
      Disabled action
    </Button>
  </div>
  <Modal show={modalOpen} onClose={() => setModalOpen(false)} sm>
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Review changes</h3>
        <p className="text-sm text-gray-600">
          This modal shows a short confirmation flow with actions.
        </p>
      </div>
      <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm text-gray-600">
        Changes pending: 3 new updates, 1 removal.
      </div>
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="secondary" onClick={() => setModalOpen(false)}>
          Cancel
        </Button>
        <Button>
          <Loader2 className="mr-2 h-4 w-4" />
          Confirm
        </Button>
      </div>
    </div>
  </Modal>
</>
`,
            render: () => (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                  <Button variant="outline" disabled>
                    Disabled action
                  </Button>
                </div>
                <Modal show={modalOpen} onClose={() => setModalOpen(false)} sm>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Review changes</h3>
                      <p className="text-sm text-gray-600">
                        This modal shows a short confirmation flow with actions.
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm text-gray-600">
                      Changes pending: 3 new updates, 1 removal.
                    </div>
                    <div className="flex flex-wrap gap-3 justify-end">
                      <Button variant="secondary" onClick={() => setModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                </Modal>
              </>
            ),
          },
          {
            id: 'modals-locked',
            title: 'Overlay locked',
            componentName: 'ModalLockedExample',
            imports: [
              "import { useState } from 'react'",
              "import { Button, Modal } from '@/components/ui'",
            ],
            setup: `
const [lockedModalOpen, setLockedModalOpen] = useState(false)
`,
            code: `
<>
  <div className="flex flex-wrap items-center gap-3">
    <Button onClick={() => setLockedModalOpen(true)}>Open locked modal</Button>
  </div>
  <Modal
    show={lockedModalOpen}
    onClose={() => setLockedModalOpen(false)}
    sm
    closeOnOverlayClick={false}
  >
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Overlay locked</h3>
        <p className="text-sm text-gray-600">
          Clicking the backdrop shakes the modal instead of closing it.
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => setLockedModalOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  </Modal>
</>
`,
            render: () => (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => setLockedModalOpen(true)}>Open locked modal</Button>
                </div>
                <Modal
                  show={lockedModalOpen}
                  onClose={() => setLockedModalOpen(false)}
                  sm
                  closeOnOverlayClick={false}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Overlay locked</h3>
                      <p className="text-sm text-gray-600">
                        Clicking the backdrop shakes the modal instead of closing it.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button variant="outline" onClick={() => setLockedModalOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </Modal>
              </>
            ),
          },
          {
            id: 'modals-confirm',
            title: 'Confirm modal helper',
            componentName: 'ConfirmModalExample',
            imports: [
              "import { useState } from 'react'",
              "import { Button, confirmModal } from '@/components/ui'",
            ],
            setup: `
const [confirmOutcome, setConfirmOutcome] = useState<string | null>(null)

const runConfirm = async (type?: 'success' | 'warning' | 'danger' | 'error' | 'info') => {
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Default'
  const confirmed = await confirmModal({
    title: label + ' confirmation',
    message: 'This action will update billing preferences.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type,
  })
  setConfirmOutcome(label + ': ' + (confirmed ? 'Confirmed' : 'Cancelled'))
}
`,
            code: `
<div className="space-y-3">
  <div className="flex flex-wrap gap-2">
    <Button onClick={() => runConfirm()}>Default</Button>
    <Button variant="outline" onClick={() => runConfirm('success')}>
      Success
    </Button>
    <Button variant="outline" onClick={() => runConfirm('warning')}>
      Warning
    </Button>
    <Button variant="outline" onClick={() => runConfirm('danger')}>
      Danger
    </Button>
    <Button variant="outline" onClick={() => runConfirm('error')}>
      Error
    </Button>
    <Button variant="outline" onClick={() => runConfirm('info')}>
      Info
    </Button>
  </div>
  {confirmOutcome && (
    <p className="text-xs text-gray-500">Last result: {confirmOutcome}</p>
  )}
</div>
`,
            render: () => (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => runConfirm()}>Default</Button>
                  <Button variant="outline" onClick={() => runConfirm('success')}>
                    Success
                  </Button>
                  <Button variant="outline" onClick={() => runConfirm('warning')}>
                    Warning
                  </Button>
                  <Button variant="outline" onClick={() => runConfirm('danger')}>
                    Danger
                  </Button>
                  <Button variant="outline" onClick={() => runConfirm('error')}>
                    Error
                  </Button>
                  <Button variant="outline" onClick={() => runConfirm('info')}>
                    Info
                  </Button>
                </div>
                {confirmOutcome && (
                  <p className="text-xs text-gray-500">Last result: {confirmOutcome}</p>
                )}
              </div>
            ),
          },
        ],
      },
      {
        id: 'tables',
        title: 'Table',
        description: 'Entry: robust data table with selection and actions.',
        blocks: [
          {
            id: 'tables-advanced',
            title: 'Data Table',
            componentName: 'DataTableExample',
            imports: [
              "import { useMemo, useState } from 'react'",
              "import { DataTable, type Column, Badge, DropdownMenuItem } from '@/components/ui'",
              "import { Check, Sparkles, CreditCard, DollarSign } from 'lucide-react'",
            ],
            setup: `type Invoice = {
  id: string
  invoice: string
  status: 'Paid' | 'Pending' | 'Unpaid'
  totalAmount: string
  paymentMethod: string
  date: string
}

const invoices = useMemo(() => [
  { id: '1', invoice: "INV001", status: "Paid", totalAmount: "$250.00", paymentMethod: "Credit Card", date: "2024-05-01" },
  { id: '2', invoice: "INV002", status: "Pending", totalAmount: "$150.00", paymentMethod: "PayPal", date: "2024-05-02" },
  { id: '3', invoice: "INV003", status: "Unpaid", totalAmount: "$350.00", paymentMethod: "Bank Transfer", date: "2024-05-03" },
  { id: '4', invoice: "INV004", status: "Paid", totalAmount: "$450.00", paymentMethod: "Credit Card", date: "2024-05-05" },
  { id: '5', invoice: "INV005", status: "Paid", totalAmount: "$550.00", paymentMethod: "PayPal", date: "2024-05-10" },
], [])

const filterFields = [
  { label: 'Status', value: 'status', options: [{ label: 'Paid', value: 'paid' }, { label: 'Pending', value: 'pending' }, { label: 'Unpaid', value: 'unpaid' }] },
  { label: 'Method', value: 'paymentMethod', options: [{ label: 'Credit Card', value: 'credit card', icon: CreditCard }, { label: 'PayPal', value: 'paypal', icon: DollarSign }, { label: 'Bank Transfer', value: 'bank transfer' }] },
  { label: 'Price', value: 'totalAmount', type: 'price-range' },
  { label: 'Date', value: 'date', type: 'daterange' },
]

const columns: Column<Invoice>[] = [
  { header: "Invoice", accessorKey: "invoice", className: "font-medium", enableSorting: true },
  {
    header: "Status",
    enableSorting: true,
    cell: (row) => (
      <Badge variant={row.status === 'Paid' ? 'outline' : row.status === 'Unpaid' ? 'destructive' : 'subtle'}>
        {row.status}
      </Badge>
    )
  },
  { header: "Method", accessorKey: "paymentMethod", enableSorting: true },
  { header: "Date", accessorKey: "date", enableSorting: true },
  { header: <div className="text-right">Amount</div>, accessorKey: "totalAmount", className: "text-right", enableSorting: true },
]

const [selected, setSelected] = useState<(string | number)[]>([])
const [tableSorting, setTableSorting] = useState<{ column: string, direction: 'asc' | 'desc' } | undefined>(undefined)
const [tablePagination, setTablePagination] = useState({ page: 1, limit: 5 })
const [tableSearch, setTableSearch] = useState("")
const [tableFilters, setTableFilters] = useState<Record<string, any>>({})

const filteredInvoices = useMemo(() => {
  let filtered = [...invoices]

  if (tableSearch) {
    filtered = filtered.filter(i =>
      i.invoice.toLowerCase().includes(tableSearch.toLowerCase()) ||
      i.paymentMethod.toLowerCase().includes(tableSearch.toLowerCase())
    )
  }

  Object.keys(tableFilters).forEach(key => {
    const filterValue = tableFilters[key]

    if (key === 'totalAmount') {
      const [min, max] = filterValue as [number | undefined, number | undefined]
      if (min !== undefined || max !== undefined) {
        filtered = filtered.filter(i => {
          const amount = parseFloat(i.totalAmount.replace('$', ''))
          if (min !== undefined && amount < min) return false
          if (max !== undefined && amount > max) return false
          return true
        })
      }
    } else if (key === 'date') {
      const [start, end] = filterValue as [string | undefined, string | undefined]
      if (start || end) {
        filtered = filtered.filter(i => {
          if (!i.date) return false
          const rowDate = i.date
          if (start && rowDate < start) return false
          if (end && rowDate > end) return false
          return true
        })
      }
    } else if (filterValue instanceof Set && filterValue.size > 0) {
      filtered = filtered.filter(i => filterValue.has(i[key as keyof typeof i]?.toString().toLowerCase()))
    }
  })

  if (tableSorting) {
    filtered.sort((a, b) => {
      const aValue = a[tableSorting.column as keyof typeof a]
      const bValue = b[tableSorting.column as keyof typeof b]
      if (aValue < bValue) return tableSorting.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return tableSorting.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  return filtered
}, [invoices, tableSearch, tableSorting, tableFilters])

const paginatedInvoices = useMemo(() => {
  const start = (tablePagination.page - 1) * tablePagination.limit
  return filteredInvoices.slice(start, start + tablePagination.limit)
}, [filteredInvoices, tablePagination])`,
            code: `<div className="space-y-4">
  <div className="text-sm text-muted-foreground">
    Selected rows: {selected.length}
  </div>
  <DataTable
    data={paginatedInvoices}
    columns={columns}
    selectable
    selectedIds={selected}
    onSelectionChange={setSelected}
    keyField="id"
    filters={filterFields}
    filterValues={tableFilters}
    onFilterChange={(key, values) => {
      setTableFilters(prev => ({
        ...prev,
        [key]: values
      }))
    }}
    actions={(row) => (
      <>
        <DropdownMenuItem onClick={() => alert('Edit ' + row.invoice)}>
          <span className="flex items-center"><Sparkles className="mr-2 h-4 w-4" /> Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert('Delete ' + row.invoice)}>
          <span className="flex items-center text-red-600"><Check className="mr-2 h-4 w-4" /> Delete</span>
        </DropdownMenuItem>
      </>
    )}
    sortColumn={tableSorting?.column}
    sortDirection={tableSorting?.direction}
    onSortingChange={(column, direction) => setTableSorting({ column, direction })}
    page={tablePagination.page}
    limit={tablePagination.limit}
    total={filteredInvoices.length}
    onPageChange={(page) => setTablePagination(prev => ({ ...prev, page }))}
    onPageSizeChange={(limit) => setTablePagination({ page: 1, limit })}
    searchKey="invoice"
    searchValue={tableSearch}
    onSearchChange={(value) => {
      setTableSearch(value)
      setTablePagination(prev => ({ ...prev, page: 1 }))
    }}
  />
</div>`,
            render: () => {
              return (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Selected rows: {tableSelected.length}
                  </div>
                  <DataTable
                    data={paginatedInvoices}
                    columns={columns}
                    selectable
                    selectedIds={tableSelected}
                    onSelectionChange={setTableSelected}
                    keyField="id"
                    filters={filterFields}
                    filterValues={tableFilters}
                    onFilterChange={(key, values) => {
                      setTableFilters(prev => ({
                        ...prev,
                        [key]: values
                      }))
                    }}
                    actions={(row) => (
                      <>
                        <DropdownMenuItem onClick={() => alert('Edit ' + row.invoice)}>
                          <span className="flex items-center"><Sparkles className="mr-2 h-4 w-4" /> Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('Delete ' + row.invoice)}>
                          <span className="flex items-center text-red-600"><Check className="mr-2 h-4 w-4" /> Delete</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    sortColumn={tableSorting?.column}
                    sortDirection={tableSorting?.direction}
                    onSortingChange={(column, direction) => setTableSorting({ column, direction })}
                    page={tablePagination.page}
                    limit={tablePagination.limit}
                    total={filteredInvoices.length}
                    onPageChange={(page) => setTablePagination(prev => ({ ...prev, page }))}
                    onPageSizeChange={(limit) => setTablePagination({ page: 1, limit })}
                    searchKey="invoice"
                    searchValue={tableSearch}
                    onSearchChange={(value) => {
                      setTableSearch(value)
                      setTablePagination(prev => ({ ...prev, page: 1 }))
                    }}
                  />
                </div>
              )
            },
          },
          {
            id: 'tables-range',
            title: 'Data Table (Range Filters)',
            componentName: 'DataTableRangeFiltersExample',
            imports: [
              "import { useMemo, useState } from 'react'",
              "import { DataTable, type Column, Badge } from '@/components/ui'",
            ],
            setup: `type Run = {
  id: string
  job: string
  status: 'Success' | 'Running' | 'Failed'
  durationMinutes: number
  startTime: string
  runDate: string
}

const runs = useMemo(() => [
  { id: 'run-1', job: "Payroll sync", status: "Success", durationMinutes: 18, startTime: "08:15", runDate: "2024-05-02" },
  { id: 'run-2', job: "Invoice export", status: "Running", durationMinutes: 6, startTime: "09:30", runDate: "2024-05-03" },
  { id: 'run-3', job: "Ledger rebuild", status: "Failed", durationMinutes: 42, startTime: "10:45", runDate: "2024-05-04" },
  { id: 'run-4', job: "Usage snapshot", status: "Success", durationMinutes: 12, startTime: "11:20", runDate: "2024-05-05" },
  { id: 'run-5', job: "Customer import", status: "Success", durationMinutes: 28, startTime: "13:05", runDate: "2024-05-06" },
  { id: 'run-6', job: "Tax validation", status: "Running", durationMinutes: 9, startTime: "14:10", runDate: "2024-05-07" },
  { id: 'run-7', job: "Overdue scan", status: "Success", durationMinutes: 16, startTime: "15:40", runDate: "2024-05-08" },
  { id: 'run-8', job: "Charge retry", status: "Failed", durationMinutes: 33, startTime: "16:25", runDate: "2024-05-09" },
], [])

const runFilterFields = [
  { label: 'Status', value: 'status', options: [{ label: 'Success', value: 'success' }, { label: 'Running', value: 'running' }, { label: 'Failed', value: 'failed' }] },
  { label: 'Duration (min)', value: 'durationMinutes', type: 'number-range' },
  { label: 'Start time', value: 'startTime', type: 'time-range' },
  { label: 'Run date', value: 'runDate', type: 'daterange' },
]

const runColumns: Column<Run>[] = [
  { header: "Job", accessorKey: "job", className: "font-medium", enableSorting: true },
  {
    header: "Status",
    enableSorting: true,
    cell: (row) => (
      <Badge variant={row.status === 'Failed' ? 'destructive' : row.status === 'Running' ? 'subtle' : 'outline'}>
        {row.status}
      </Badge>
    )
  },
  { header: "Duration", accessorKey: "durationMinutes", enableSorting: true, cell: (row) => row.durationMinutes + "m" },
  { header: "Start Time", accessorKey: "startTime", enableSorting: true },
  { header: "Run Date", accessorKey: "runDate", enableSorting: true },
]

const [runSorting, setRunSorting] = useState<{ column: string, direction: 'asc' | 'desc' } | undefined>(undefined)
const [runPagination, setRunPagination] = useState({ page: 1, limit: 5 })
const [runSearch, setRunSearch] = useState("")
const [runFilters, setRunFilters] = useState<Record<string, any>>({})

const filteredRuns = useMemo(() => {
  let filtered = [...runs]

  if (runSearch) {
    filtered = filtered.filter(run =>
      run.job.toLowerCase().includes(runSearch.toLowerCase()) ||
      run.status.toLowerCase().includes(runSearch.toLowerCase())
    )
  }

  Object.keys(runFilters).forEach(key => {
    const filterValue = runFilters[key]

    if (key === 'durationMinutes') {
      const [min, max] = filterValue as [number | undefined, number | undefined]
      if (min !== undefined || max !== undefined) {
        filtered = filtered.filter(run => {
          const duration = Number(run.durationMinutes)
          if (min !== undefined && duration < min) return false
          if (max !== undefined && duration > max) return false
          return true
        })
      }
    } else if (key === 'runDate') {
      const [start, end] = filterValue as [string | undefined, string | undefined]
      if (start || end) {
        filtered = filtered.filter(run => {
          const rowDate = run.runDate
          if (start && rowDate < start) return false
          if (end && rowDate > end) return false
          return true
        })
      }
    } else if (key === 'startTime') {
      const [start, end] = filterValue as [string | undefined, string | undefined]
      if (start || end) {
        filtered = filtered.filter(run => {
          const rowTime = run.startTime
          if (start && rowTime < start) return false
          if (end && rowTime > end) return false
          return true
        })
      }
    } else if (filterValue instanceof Set && filterValue.size > 0) {
      filtered = filtered.filter(run => filterValue.has(run[key as keyof typeof run]?.toString().toLowerCase()))
    }
  })

  if (runSorting) {
    filtered.sort((a, b) => {
      const aValue = a[runSorting.column as keyof typeof a]
      const bValue = b[runSorting.column as keyof typeof b]
      if (aValue < bValue) return runSorting.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return runSorting.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  return filtered
}, [runs, runSearch, runSorting, runFilters])

const paginatedRuns = useMemo(() => {
  const start = (runPagination.page - 1) * runPagination.limit
  return filteredRuns.slice(start, start + runPagination.limit)
}, [filteredRuns, runPagination])`,
            code: `<div className="space-y-4">
  <DataTable
    data={paginatedRuns}
    columns={runColumns}
    filters={runFilterFields}
    filterValues={runFilters}
    onFilterChange={(key, values) => {
      setRunFilters(prev => ({
        ...prev,
        [key]: values
      }))
    }}
    sortColumn={runSorting?.column}
    sortDirection={runSorting?.direction}
    onSortingChange={(column, direction) => setRunSorting({ column, direction })}
    page={runPagination.page}
    limit={runPagination.limit}
    total={filteredRuns.length}
    onPageChange={(page) => setRunPagination(prev => ({ ...prev, page }))}
    onPageSizeChange={(limit) => setRunPagination({ page: 1, limit })}
    searchKey="job"
    searchValue={runSearch}
    onSearchChange={(value) => {
      setRunSearch(value)
      setRunPagination(prev => ({ ...prev, page: 1 }))
    }}
  />
</div>`,
            render: () => {
              return (
                <div className="space-y-4">
                  <DataTable
                    data={paginatedRuns}
                    columns={runColumns}
                    filters={runFilterFields}
                    filterValues={runFilters}
                    onFilterChange={(key, values) => {
                      setRunFilters(prev => ({
                        ...prev,
                        [key]: values
                      }))
                    }}
                    sortColumn={runSorting?.column}
                    sortDirection={runSorting?.direction}
                    onSortingChange={(column, direction) => setRunSorting({ column, direction })}
                    page={runPagination.page}
                    limit={runPagination.limit}
                    total={filteredRuns.length}
                    onPageChange={(page) => setRunPagination(prev => ({ ...prev, page }))}
                    onPageSizeChange={(limit) => setRunPagination({ page: 1, limit })}
                    searchKey="job"
                    searchValue={runSearch}
                    onSearchChange={(value) => {
                      setRunSearch(value)
                      setRunPagination(prev => ({ ...prev, page: 1 }))
                    }}
                  />
                </div>
              )
            },
          },
        ],
      },
    ],
    [
      confirmOutcome,
      dropdownOptions,
      lockedModalOpen,
      modalOpen,
      multiDropdownValue,
      runConfirm,
      selectValue,
      showPasswordInput,
      tableSelected,
      tableSorting,
      tablePagination,
      tableSearch,
      filteredInvoices,
      paginatedInvoices,
      runSorting,
      runPagination,
      runSearch,
      filteredRuns,
      paginatedRuns,
      tableFilters,
      filterFields,
      columns,
      invoices,
      runFilters,
      runFilterFields,
      runColumns,
      runs,
    ]
  )

  if (!user) {
    return null
  }

  if (user.role !== 'admin') {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">UI Components</h2>
          <p className="text-sm text-gray-600">Component previews are available to administrators only.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to view this page. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isLoading && !systemSettings?.show_ui_components) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">UI Components</h2>
          <p className="text-sm text-gray-600">
            This page is disabled in developer settings.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              Ask an administrator to enable "Show UI Components page" in Developer Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const toggleCode = (blockId: string) => {
    setOpenCode((prev) => ({ ...prev, [blockId]: !prev[blockId] }))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">UI Components</h2>
          <p className="text-sm text-gray-600">
            Quick reference for common components, variants, and example usage.
          </p>
        </div>
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[200px] p-4">
              <div className="mt-4 space-y-4">
                <h2 className="text-lg font-semibold tracking-tight">Sections</h2>
                <div className="flex flex-col space-y-1">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      {section.title}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 rounded-xl border border-border/60 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</p>
            <ul className="space-y-1 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-md px-2 py-1 text-gray-600 transition-colors hover:bg-muted/40 hover:text-gray-900"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.blocks.map((block) => {
                    const formattedSnippet = normalizeSnippet(buildSnippet(block))
                    return (
                      <div
                        key={block.id}
                        className="rounded-lg border border-dashed border-border/70 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase text-gray-500">{block.title}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCode(block.id)}
                          >
                            {openCode[block.id] ? 'Hide code' : 'Show code'}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {block.render()}
                        </div>
                        {openCode[block.id] && (
                          <pre className="mt-3 rounded-md bg-gray-900 p-4 text-xs text-gray-100 overflow-x-auto">
                            <code>{formattedSnippet}</code>
                          </pre>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
