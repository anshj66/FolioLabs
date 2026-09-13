export const storage = {
  provider: "aws-s3" as const,
  async upload(file: File, prefix = "evidence") {
    return { key: `${prefix}/${Date.now()}-${file.name}`, url: URL.createObjectURL(file) }
  },
}
