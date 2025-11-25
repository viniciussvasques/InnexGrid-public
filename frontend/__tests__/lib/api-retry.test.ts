import { retry } from '@/lib/api-retry'

describe('API Retry Utility', () => {
  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success')
    
    const result = await retry(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success')
    
    const result = await retry(fn, { maxRetries: 3, initialDelay: 5 })
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should fail after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'))
    
    await expect(retry(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('always fail')
    expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('should not retry on non-retryable errors', async () => {
    const error: any = new Error('not retryable')
    error.response = { status: 400 }
    const fn = jest.fn().mockRejectedValue(error)
    
    await expect(retry(fn, { maxRetries: 3, initialDelay: 100 })).rejects.toThrow('not retryable')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call onRetry callback', async () => {
    const onRetry = jest.fn()
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')
    
    const result = await retry(fn, { maxRetries: 3, initialDelay: 5, onRetry })
    
    expect(result).toBe('success')
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })
})

