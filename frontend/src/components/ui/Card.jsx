import { cn } from '@/utils/cn'

/**
 * Card component with compound pattern
 *
 * @example
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Project Overview</Card.Title>
 *     <Card.Description>View project details</Card.Description>
 *   </Card.Header>
 *   <Card.Body>Content here...</Card.Body>
 *   <Card.Footer>Footer actions</Card.Footer>
 * </Card>
 */
function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface dark:bg-surface-dark',
        'rounded-xl border border-border-default dark:border-border-dark',
        'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-border-default dark:border-border-dark', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-text-main dark:text-white', className)} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-text-secondary dark:text-gray-400 mt-1', className)} {...props}>
      {children}
    </p>
  )
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-border-default dark:border-border-dark',
        'bg-background/50 dark:bg-background-dark/50',
        'rounded-b-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
