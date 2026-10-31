import { describe, expect, it } from 'vitest';
import { renderTemplate } from './github';

describe('renderTemplate', () => {
  it('substitutes known {{keys}}', () => {
    expect(
      renderTemplate('Thanks @{{sender}} on {{repo}}#{{number}}', {
        sender: 'javier',
        repo: 'srdiotest',
        number: '1',
      })
    ).toBe('Thanks @javier on srdiotest#1');
  });

  it('replaces unknown keys with empty string', () => {
    expect(renderTemplate('Hi {{missing}}!', {})).toBe('Hi !');
  });

  it('allows spaces inside braces', () => {
    expect(renderTemplate('{{ sender }}', { sender: 'Ada' })).toBe('Ada');
  });
});
