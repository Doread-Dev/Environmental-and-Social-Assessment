import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Select from './Select'
import Input from './Input'
import Textarea from './Textarea'
import Badge from './Badge'
import StatusBadge from './StatusBadge'
import Button from './Button'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import ConfirmDialog from './ConfirmDialog'
import Modal from './Modal'
import PageHeader from './PageHeader'
import { controlClasses } from './formControl'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', disabled: true },
]

describe('Select (the one select box, D71)', () => {
  it('is a native select linked to its label, with the given options', () => {
    render(<Select label="Role" options={OPTIONS} defaultValue="a" />)
    const select = screen.getByLabelText('Role')
    expect(select.tagName).toBe('SELECT')
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Alpha', 'Beta'])
    expect(within(select).getByRole('option', { name: 'Beta' })).toBeDisabled()
  })

  it('takes option / optgroup children and an optional placeholder with value ""', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="Place filter" placeholder="All places" value="" onChange={onChange}>
        <optgroup label="Project workflow">
          <option value="screening">Screening</option>
        </optgroup>
      </Select>
    )
    const select = screen.getByRole('combobox', { name: 'Place filter' })
    expect(within(select).getByRole('option', { name: 'All places' })).toHaveValue('')
    expect(within(select).getByRole('option', { name: 'All places' })).not.toBeDisabled()
    fireEvent.change(select, { target: { value: 'screening' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('has no placeholder unless asked; a disabled placeholder cannot be picked again', () => {
    const { rerender } = render(<Select aria-label="x" options={OPTIONS} />)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    rerender(<Select aria-label="x" options={OPTIONS} placeholder="Pick one" placeholderDisabled />)
    expect(screen.getByRole('option', { name: 'Pick one' })).toBeDisabled()
  })

  it('shows an error, marks the select invalid and describes it by the message', () => {
    render(<Select label="Role" options={OPTIONS} error="Pick a role" />)
    const select = screen.getByLabelText('Role')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Pick a role')
    expect(select.className).toContain('border-error')
  })

  it('can be disabled; required is announced without native form validation', () => {
    render(<Select label="Role" options={OPTIONS} disabled required />)
    const select = screen.getByLabelText(/Role/)
    expect(select).toBeDisabled()
    expect(select).toHaveAttribute('aria-required', 'true')
    expect(select).not.toHaveAttribute('required')
  })

  it('has the shared look in light and dark mode, and a borderless cell variant', () => {
    const { rerender } = render(<Select aria-label="x" options={OPTIONS} />)
    const cls = screen.getByRole('combobox').className
    expect(cls).toContain('bg-surface')
    expect(cls).toContain('dark:bg-black/20')
    expect(cls).toContain('dark:border-input-border-dark')
    expect(cls).toContain('focus:ring-primary/20')
    rerender(<Select aria-label="x" options={OPTIONS} variant="cell" />)
    expect(screen.getByRole('combobox').className).toContain('border-transparent')
  })
})

describe('Input and Textarea (shared form-control look)', () => {
  it('link the label, show errors and helper text', () => {
    render(
      <>
        <Input label="Title" error="Required" />
        <Textarea label="Notes" helperText="Optional" />
      </>
    )
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Required')
    expect(screen.getByLabelText('Notes')).toHaveAccessibleDescription('Optional')
  })

  it('use the same control classes as the Select, plus the read-only look', () => {
    render(<Input aria-label="Name" readOnly value="Sara" />)
    const cls = screen.getByRole('textbox', { name: 'Name' }).className
    for (const c of controlClasses().split(' ')) expect(cls).toContain(c)
    expect(cls).toContain('read-only:bg-background')
    expect(cls).toContain('dark:read-only:bg-white/5')
  })

  it('controlClasses: error replaces the normal border', () => {
    expect(controlClasses({ error: true })).toContain('border-error')
    expect(controlClasses({ error: true })).not.toContain('border-input-border ')
  })
})

describe('Badge and StatusBadge', () => {
  it('Badge variants use the palette with a dark counterpart', () => {
    const { rerender } = render(<Badge>Neutral</Badge>)
    expect(screen.getByText('Neutral').className).toContain('bg-background')
    expect(screen.getByText('Neutral').className).toContain('dark:bg-white/5')
    rerender(<Badge variant="error">Bad</Badge>)
    expect(screen.getByText('Bad').className).toContain('dark:bg-red-900/30')
  })

  it.each([
    ['approved', 'Approved', 'bg-green-100'],
    ['completed', 'Completed', 'bg-green-100'],
    ['submitted', 'Submitted', 'bg-amber-100'],
    ['rejected', 'Rejected', 'bg-red-100'],
    ['needs_action', 'Needs Action', 'bg-red-100'],
    ['in_progress', 'In Progress', 'bg-blue-100'],
    ['not_started', 'Not Started', 'bg-background'],
    ['locked', 'Locked', 'bg-background'],
  ])('StatusBadge %s reads "%s"', (status, label, cls) => {
    render(<StatusBadge status={status} />)
    const badge = screen.getByText(label).closest('[data-status]')
    expect(badge).toHaveAttribute('data-status', status)
    expect(badge.className).toContain(cls)
  })

  it('StatusBadge: unknown status reads Not Started; the label can be overridden', () => {
    const { rerender } = render(<StatusBadge status="whatever" />)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    rerender(<StatusBadge status="submitted" label="Pending Approval" />)
    expect(screen.getByText('Pending Approval')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('has a visible keyboard focus ring and the danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const cls = screen.getByRole('button', { name: 'Delete' }).className
    expect(cls).toContain('focus-visible:ring-2')
    expect(cls).toContain('bg-red-600')
  })

  it('keeps icons and text apart with the button gap (no inner wrapper)', () => {
    render(<Button leftIcon={<span>i</span>}>Save</Button>)
    const button = screen.getByRole('button', { name: /Save/ })
    expect(button.className).toContain('gap-2')
    expect(button.lastChild.nodeType).toBe(Node.TEXT_NODE)
  })
})

describe('Loading, empty and error states', () => {
  it('LoadingState is a polite status with its message', () => {
    render(<LoadingState message="Loading projects..." />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects...')
  })

  it('LoadingState screen variant fills the viewport in both themes', () => {
    render(<LoadingState variant="screen" />)
    expect(screen.getByRole('status').className).toContain('dark:bg-background-dark')
  })

  it('EmptyState shows title, description and action', () => {
    render(
      <EmptyState
        title="No projects found"
        description="Create one"
        action={<button>New</button>}
      />
    )
    expect(screen.getByText('No projects found')).toBeInTheDocument()
    expect(screen.getByText('Create one')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
  })

  it('ErrorState is an alert with "Try again" that retries', () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Failed to load" message="Network Error" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load')
    expect(screen.getByRole('alert')).toHaveTextContent('Network Error')
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('ErrorState without onRetry has no button', () => {
    render(<ErrorState message="Nope" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ConfirmDialog and Modal', () => {
  it('confirms and cancels in an in-app dialog', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        title="Delete project"
        message="Delete it?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    )
    const dialog = screen.getByRole('dialog', { name: 'Delete project' })
    fireEvent.click(within(dialog).getByRole('button', { name: /Delete/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('while running, both buttons are disabled and Escape does nothing', () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialog title="Archive" message="?" isLoading onConfirm={vi.fn()} onClose={onClose} />
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Modal takes focus, closes on Escape and gives focus back', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <>
        <button>Opener</button>
        <Modal isOpen={false} onClose={onClose} title="Edit" />
      </>
    )
    screen.getByRole('button', { name: 'Opener' }).focus()
    rerender(
      <>
        <button>Opener</button>
        <Modal isOpen onClose={onClose} title="Edit">
          body
        </Modal>
      </>
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    rerender(
      <>
        <button>Opener</button>
        <Modal isOpen={false} onClose={onClose} title="Edit" />
      </>
    )
    expect(screen.getByRole('button', { name: 'Opener' })).toHaveFocus()
  })

  it('two open modals have their own title ids; the close button closes', () => {
    const onClose = vi.fn()
    render(
      <>
        <Modal isOpen onClose={vi.fn()} title="First" />
        <Modal isOpen onClose={onClose} title="Second" />
      </>
    )
    expect(screen.getByRole('dialog', { name: 'First' })).toBeInTheDocument()
    const second = screen.getByRole('dialog', { name: 'Second' })
    fireEvent.click(within(second).getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('PageHeader', () => {
  it('renders the page h1, its description and actions', () => {
    render(<PageHeader title="Library" description="Guidance" actions={<button>Upload</button>} />)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Library' })
    expect(h1.className).toContain('md:text-3xl')
    expect(screen.getByText('Guidance')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
  })
})
