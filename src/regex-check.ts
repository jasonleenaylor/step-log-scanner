export function regexCheck(
  errorExpression: string,
  logToMatch: string
): boolean {
  const regex = new RegExp(errorExpression)
  return regex.test(logToMatch)
}
