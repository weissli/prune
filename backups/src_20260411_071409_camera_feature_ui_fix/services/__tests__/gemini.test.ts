import { describe, it, expect, vi } from 'vitest';
import { parsePruningMonths, generatePlantInfo, identifyPlant } from '../gemini';

// Mock GoogleGenAI
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn()
}));

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
      generateImages: vi.fn().mockResolvedValue({
        generatedImages: [{ image: { imageBytes: 'base64bytes' } }]
      })
    };
    constructor(config: { apiKey: string }) {}
  }
  return { GoogleGenAI };
});

// Set default implementation for mockGenerateContent
mockGenerateContent.mockImplementation(async (args) => {
  const prompt = args.contents[0];
  if (typeof prompt === 'string' && prompt.includes("Identify the plant")) {
    return {
      text: JSON.stringify({
        matches: [
          { name: 'Monstera', description: 'Split leaf', confidence: 'high' }
        ]
      })
    };
  }
  return {
    text: JSON.stringify({
      careInstructions: 'Prune technique: cut back.',
      tasks: [{ name: 'Spring Prune', type: 'once', months: [2, 3] }]
    })
  };
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

  describe('identifyPlant()', () => {
    it('calls generateContent with image and returns matches', async () => {
      const result = await identifyPlant('data:image/jpeg;base64,base64bytes', 'test-api-key');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].name).toBe('Monstera');
      expect(result.matches[0].confidence).toBe('high');
    });

    it('returns multiple matches when available', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          matches: [
            { name: 'Monstera', description: 'Split leaf', confidence: 'high' },
            { name: 'Pothos', description: 'Trailing vine', confidence: 'medium' }
          ]
        })
      });

      const result = await identifyPlant('data:image/jpeg;base64,base64bytes', 'test-api-key');
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].name).toBe('Monstera');
      expect(result.matches[1].name).toBe('Pothos');
    });

    it('throws error if API key is missing', async () => {
      await expect(identifyPlant('image-data', '')).rejects.toThrow('API Key required');
    });
  });
});
