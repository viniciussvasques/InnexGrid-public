import { render, screen } from '@testing-library/react'
import { Skeleton, ResourceCardSkeleton, StatsCardSkeleton } from '@/app/components/ui/skeleton'

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default props', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton.className).toContain('bg-gray-200')
      expect(skeleton.className).toContain('rounded-lg')
    })

    it('should render with circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.className).toContain('rounded-full')
    })

    it('should apply custom width and height', () => {
      const { container } = render(<Skeleton width={100} height={50} />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.style.width).toBe('100px')
      expect(skeleton.style.height).toBe('50px')
    })

    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton.className).toContain('custom-class')
    })
  })

  describe('ResourceCardSkeleton', () => {
    it('should render resource card skeleton', () => {
      const { container } = render(<ResourceCardSkeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton.className).toContain('bg-white')
    })
  })

  describe('StatsCardSkeleton', () => {
    it('should render stats card skeleton', () => {
      const { container } = render(<StatsCardSkeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toBeInTheDocument()
      expect(skeleton.className).toContain('bg-white')
    })
  })
})

