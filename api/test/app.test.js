import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('GET /api', () => {
  it('should return 200 and an array', async () => {
    const res = await request(app).get('/api/')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})