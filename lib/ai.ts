export type MentorMode = "hint" | "explain" | "example"

export async function askMentor(input: { message: string; mode?: MentorMode; context?: string }) {
  const mode = input.mode ?? "hint"
  const responses = {
    hint: "Look closely at the relationship between the original and transformed vector. Which directions appear unchanged in proportion?",
    explain: "An eigenvector keeps its direction after a transformation; only its scale changes. Try aligning your vector with one of the invariant directions.",
    example: "For a symmetric matrix, compare the vector before and after multiplication. A vector that remains on the same line is an eigenvector.",
  }
  return { text: responses[mode], recorded: true, mode, context: input.context ?? "" }
}
