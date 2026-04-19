import { describe, it, expect, vi } from 'vitest';
import { parsePruningMonths, generatePlantInfo } from '../gemini';

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          careInstructions: 'Prune technique: cut back.',
          tasks: [{ name: 'Spring Prune', type: 'once', months: [2, 3] }]
        })
      }),
      generateImages: vi.fn().mockResolvedValue({
        generatedImages: [{ image: { imageBytes: 'base64bytes' } }]
      })
    };
    constructor(config: { apiKey: string }) {}
  }
  return { GoogleGenAI };
});

describe('gemini.ts', () => {
  describe('parsePruningMonths()', () => {
    it('parses single month', () => {
      const months = parsePruningMonths('Prune in March');
      expect(months).toEqual([2]); // March is index 2
    });

    it('parses multiple months', () => {
      const months = parsePruningMonths('Months: March, April');
      expect(months).toEqual([2, 3]); // March (2), April (3)
    });

    it('is case insensitive', () => {
      const months = parsePruningMonths('march, MAY');
      expect(months).toEqual([2, 4]); // March (2), May (4)
    });

    it('returns empty for no months', () => {
      const months = parsePruningMonths('Water weekly');
      expect(months).toEqual([]);
    });
  });

  describe('generatePlantInfo()', () => {
    it('calls generateContent and returns parsed JSON', async () => {
      const result = await generatePlantInfo('Fern', 'test-api-key');
      expect(result.careInstructions).toBe('Prune technique: cut back.');
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].name).toBe('Spring Prune');
    });

    it('throws error if API key is missing', async () => {
      await expect(generatePlantInfo('Fern', '')).rejects.toThrow('API Key required');
    });
  });
});
