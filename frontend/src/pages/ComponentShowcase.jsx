import { useState } from 'react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Card,
  Badge,
  Avatar,
  Alert,
  Modal,
  Tooltip,
  Dropdown,
  Breadcrumb,
  ProgressBar,
  ProgressStepper,
  Pagination,
  Accordion,
  Icon,
} from '@/components/ui'
import { useTheme } from '@/contexts'

function ComponentShowcase() {
  const { toggleTheme, isDark } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [radioValue, setRadioValue] = useState('a')

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-main dark:text-white">
            Component Library
          </h1>
          <Button variant="ghost" onClick={toggleTheme}>
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
          </Button>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Form Controls */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">
            Form Controls
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Email" type="email" placeholder="name@example.com" />
            <Input label="With Error" error="This field is required" />
            <Textarea label="Description" placeholder="Enter description..." />
            <Select
              label="Category"
              options={[
                { value: 'a', label: 'Category A' },
                { value: 'b', label: 'Category B' },
              ]}
            />
          </div>
          <div className="mt-4 space-y-4">
            <Checkbox label="I agree to the terms" description="You must agree to continue" />
            <RadioGroup
              name="risk"
              value={radioValue}
              onChange={setRadioValue}
              label="Risk Category"
            >
              <RadioGroup.Item value="a" label="Category A" description="High Risk" />
              <RadioGroup.Item value="b" label="Category B" description="Medium Risk" />
            </RadioGroup>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning" dot>
              Warning
            </Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="primary">Primary</Badge>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Alerts</h2>
          <div className="space-y-3">
            <Alert variant="info" title="Information">
              This is an info message.
            </Alert>
            <Alert variant="success" title="Success" dismissible>
              Operation completed.
            </Alert>
            <Alert variant="warning">Warning message without title.</Alert>
            <Alert variant="error" title="Error">
              Something went wrong.
            </Alert>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>Project Overview</Card.Title>
                <Card.Description>View project details and status</Card.Description>
              </Card.Header>
              <Card.Body>
                <p className="text-text-secondary dark:text-gray-400">Card content goes here...</p>
              </Card.Body>
              <Card.Footer>
                <Button size="sm">View Details</Button>
              </Card.Footer>
            </Card>
          </div>
        </section>

        {/* Avatar */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Avatars</h2>
          <div className="flex gap-4 items-end">
            <Avatar size="xs" fallback="XS" />
            <Avatar size="sm" fallback="SM" />
            <Avatar size="md" fallback="MD" status="online" />
            <Avatar size="lg" fallback="LG" status="away" />
            <Avatar size="xl" fallback="XL" status="busy" />
          </div>
        </section>

        {/* Progress */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Progress</h2>
          <div className="space-y-4">
            <ProgressBar value={75} showLabel label="Project Progress" />
            <ProgressBar value={30} variant="warning" size="lg" />
          </div>
          <div className="mt-6">
            <ProgressStepper
              steps={[
                { id: '1', label: 'Screening', description: 'Risk assessment' },
                { id: '2', label: 'Assessment', description: 'Impact evaluation' },
                { id: '3', label: 'SEMP', description: 'Management plan' },
                { id: '4', label: 'Monitoring', description: 'Track progress' },
              ]}
              currentStep={1}
            />
          </div>
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">
            Pagination
          </h2>
          <Pagination currentPage={currentPage} totalPages={20} onPageChange={setCurrentPage} />
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Modal</h2>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirm Action"
            description="Are you sure you want to proceed?"
          >
            <p className="text-text-secondary dark:text-gray-400">
              This action cannot be undone.
            </p>
            <Modal.Footer>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </Modal.Footer>
          </Modal>
        </section>

        {/* Accordion */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">Accordion</h2>
          <Accordion defaultOpen="section-1">
            <Accordion.Item value="section-1">
              <Accordion.Trigger>Section 1</Accordion.Trigger>
              <Accordion.Content>Content for section 1...</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="section-2">
              <Accordion.Trigger>Section 2</Accordion.Trigger>
              <Accordion.Content>Content for section 2...</Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </section>

        {/* Tooltip & Dropdown */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">
            Tooltip & Dropdown
          </h2>
          <div className="flex gap-4">
            <Tooltip content="This is a tooltip">
              <Button variant="ghost">
                <Icon name="info" />
              </Button>
            </Tooltip>
            <Dropdown
              trigger={
                <Button variant="ghost">
                  <Icon name="more_vert" />
                </Button>
              }
              items={[
                { label: 'Edit', icon: 'edit', onClick: () => console.log('Edit') },
                { label: 'Delete', icon: 'delete', onClick: () => console.log('Delete'), danger: true },
              ]}
            />
          </div>
        </section>

        {/* Breadcrumb */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-main dark:text-white">
            Breadcrumb
          </h2>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/app/dashboard' },
              { label: 'Projects', href: '/app/projects' },
              { label: 'Project A' },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

export default ComponentShowcase
