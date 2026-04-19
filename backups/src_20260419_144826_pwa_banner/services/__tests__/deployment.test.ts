import { describe, it, expect } from 'vitest';

describe('Deployment', () => {
  it('is live at the expected URL', async () => {
    const response = await fetch('http://everyeye.org.uk/pwa/prune/');
    expect(response.status).toBe(200);
  });
});
