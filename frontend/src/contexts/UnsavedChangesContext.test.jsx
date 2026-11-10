import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom'
import AppShell from '@/routes/AppShell'
import { allowLeaving, resetLeaveGuard } from '@/utils/leaveGuard'
import { useConfirmLeave, useUnsavedChanges } from './useUnsavedChanges'

// A page with one field; `save` is what the guard's "Save" runs.
function EditPage({ save, withSave = true }) {
  const [value, setValue] = useState('')
  const { navigateAway } = useUnsavedChanges(value !== '', withSave ? () => save(value) : null)
  const confirmLeave = useConfirmLeave()
  return (
    <div>
      <label>
        Name
        <input value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <Link to="/elsewhere">Elsewhere</Link>
      <button type="button" onClick={() => navigateAway('/elsewhere')}>
        Saved, continue
      </button>
      <button type="button" onClick={() => confirmLeave(() => save('signed out'))}>
        Sign out
      </button>
    </div>
  )
}

function setup({ save = vi.fn(async () => ({ success: true })), withSave = true } = {}) {
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: '/start', element: <p>Start page</p> },
          { path: '/edit', element: <EditPage save={save} withSave={withSave} /> },
          { path: '/elsewhere', element: <p>Elsewhere page</p> },
        ],
      },
    ],
    { initialEntries: ['/start', '/edit'], initialIndex: 1 }
  )
  render(<RouterProvider router={router} />)
  const type = (text) =>
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: text } })
  return { router, save, type }
}

const dialog = () => screen.queryByRole('dialog', { name: 'Unsaved changes' })

describe('unsaved-changes guard (D61)', () => {
  beforeEach(() => resetLeaveGuard())
  afterEach(() => resetLeaveGuard())

  it('no dialog without an edit: a link leaves at once', async () => {
    setup()
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))
    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument()
    expect(dialog()).toBeNull()
  })

  it('an in-app link after an edit opens Save / Discard / Stay', async () => {
    setup()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Typed' } })
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    for (const name of ['Save', 'Discard changes', 'Stay']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.queryByText('Elsewhere page')).toBeNull()
  })

  it('Stay keeps the page and what was typed', async () => {
    const { type } = setup()
    type('Typed')
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Stay' }))

    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getByLabelText('Name')).toHaveValue('Typed')
    expect(screen.queryByText('Elsewhere page')).toBeNull()
  })

  it('Discard leaves without saving', async () => {
    const { type, save } = setup()
    type('Typed')
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('Save runs the page save, then leaves', async () => {
    const { type, save } = setup()
    type('Typed')
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith('Typed')
  })

  it('a failed Save stays on the page with the input', async () => {
    const save = vi.fn(async () => ({ success: false, error: 'Row 1: required' }))
    const { type } = setup({ save })
    type('Typed')
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))

    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getByLabelText('Name')).toHaveValue('Typed')
    expect(screen.queryByText('Elsewhere page')).toBeNull()
  })

  it('the browser Back after an edit asks too', async () => {
    const { router, type } = setup()
    type('Typed')
    act(() => {
      router.navigate(-1)
    })

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(await screen.findByText('Start page')).toBeInTheDocument()
  })

  it('the page own navigation after a successful save does not ask', async () => {
    const { type } = setup()
    type('Typed')
    fireEvent.click(screen.getByRole('button', { name: 'Saved, continue' }))

    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument()
    expect(dialog()).toBeNull()
  })

  it('beforeunload is registered only while there are unsaved changes', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { type } = setup()
    const registered = () => add.mock.calls.filter(([name]) => name === 'beforeunload')
    expect(registered()).toHaveLength(0)

    type('Typed')
    await waitFor(() => expect(registered()).toHaveLength(1))
    const handler = registered()[0][1]
    const event = new Event('beforeunload', { cancelable: true })
    handler(event)
    expect(event.defaultPrevented).toBe(true)

    type('')
    await waitFor(() =>
      expect(
        remove.mock.calls.some(([name, fn]) => name === 'beforeunload' && fn === handler)
      ).toBe(true)
    )
    add.mockRestore()
    remove.mockRestore()
  })

  it('an exit chosen on purpose (allowLeaving) is not asked again by the browser', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const { type } = setup()
    type('Typed')
    await waitFor(() => expect(add.mock.calls.some(([name]) => name === 'beforeunload')).toBe(true))
    const handler = add.mock.calls.find(([name]) => name === 'beforeunload')[1]

    allowLeaving()
    const event = new Event('beforeunload', { cancelable: true })
    handler(event)
    expect(event.defaultPrevented).toBe(false)
    add.mockRestore()
  })

  it('signing out asks first when the page has changes, and runs the action after Discard', async () => {
    const { type, save } = setup()
    type('Typed')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith('signed out'))
  })

  it('signing out without changes runs at once', () => {
    const { save } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(save).toHaveBeenCalledWith('signed out')
    expect(dialog()).toBeNull()
  })

  it('a form without a save (creating a user) offers Discard / Stay only', async () => {
    const { type } = setup({ withSave: false })
    type('Typed')
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()
  })
})
