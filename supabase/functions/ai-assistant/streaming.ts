/**
 * Extrai blocos `data:` completos de um buffer SSE e preserva o restante incompleto.
 */
export function extractSsePayloads(
  input: string,
  flush = false,
): { payloads: string[]; rest: string } {
  const normalized = input.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const completeBlocks = flush ? blocks : blocks.slice(0, -1);
  const rest = flush ? '' : (blocks.at(-1) ?? '');
  const payloads = completeBlocks
    .map((block) => block
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6).trim())
      .join('\n'))
    .filter(Boolean);

  return { payloads, rest };
}
