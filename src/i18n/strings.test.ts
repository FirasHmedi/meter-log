import { en } from './en';
import { fr } from './fr';

describe('strings', () => {
  it('has the same keys and placeholders in French and English', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const params = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect([key, params(fr[key])]).toEqual([key, params(en[key])]);
    }
  });

  it('uses typographic apostrophes in visible French text', () => {
    for (const value of Object.values(fr)) expect(value).not.toContain("'");
  });

  it('keeps French double punctuation on the same line as the word before it', () => {
    // A normal space before : ; ! ? lets Android wrap the line before the sign.
    for (const value of Object.values(fr)) expect(value).not.toMatch(/ [:;!?]/);
  });
});
