import { buildQuiz, seededRandom } from './quiz';

describe('buildQuiz', () => {
  it('produces the requested number of well-formed questions', () => {
    const quiz = buildQuiz(10, seededRandom(42));
    expect(quiz).toHaveLength(10);
    for (const question of quiz) {
      expect(question.options).toHaveLength(4);
      expect(question.options).toContain(question.answer);
      expect(new Set(question.options).size).toBe(4);
      expect(question.straitId).toBeTruthy();
    }
  });

  it('is deterministic for a fixed seed', () => {
    const first = buildQuiz(5, seededRandom(7));
    const second = buildQuiz(5, seededRandom(7));
    expect(first).toEqual(second);
  });

  it('varies with the seed', () => {
    const a = buildQuiz(5, seededRandom(1)).map((q) => q.prompt);
    const b = buildQuiz(5, seededRandom(2)).map((q) => q.prompt);
    expect(a).not.toEqual(b);
  });
});
