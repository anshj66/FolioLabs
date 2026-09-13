export function generateDefenseQuestion(evidence: { title: string; description: string }, index = 0) {
  const prompts = [
    `Why did you make the decision described in “${evidence.title}”?`,
    `What evidence supports the conclusion in “${evidence.title}”?`,
    "Would your reasoning still hold if the matrix changed? Explain.",
  ]
  return { id: `question-${index}`, question: prompts[index % prompts.length], evidenceTitle: evidence.title }
}

export function scoreDefense(answers: string[]) {
  const quality = answers.reduce((sum, answer) => sum + Math.min(answer.trim().length / 80, 1), 0)
  return Math.round((quality / Math.max(answers.length, 1)) * 100)
}
