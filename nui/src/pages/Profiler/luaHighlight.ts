// Lightweight Lua syntax highlighter — returns an array of { text, className } tokens
// Zero dependencies, ~2KB, handles keywords, strings, comments, numbers, globals

export type Token = { text: string; className: string }

const KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while',
])

const BUILTINS = new Set([
  'print', 'pairs', 'ipairs', 'type', 'tonumber', 'tostring', 'select', 'unpack',
  'setmetatable', 'getmetatable', 'rawget', 'rawset', 'rawequal', 'pcall', 'xpcall',
  'error', 'assert', 'next', 'load', 'loadstring', 'dofile', 'require',
  'math', 'string', 'table', 'os', 'bit32', 'coroutine', 'debug', 'io', 'package',
])

// Tokenize a single line of Lua code
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // --- Long comment [[--...]] ---
    if (line[i] === '-' && line[i + 1] === '-' && line[i + 2] === '[' && line[i + 3] === '[') {
      const endIdx = line.indexOf(']]', i + 4)
      const close = endIdx === -1 ? line.length : endIdx + 2
      tokens.push({ text: line.slice(i, close), className: 'code-comment' })
      i = close
      continue
    }

    // --- Long string [[...]] ---
    if (line[i] === '[' && line[i + 1] === '[') {
      const endIdx = line.indexOf(']]', i + 2)
      const close = endIdx === -1 ? line.length : endIdx + 2
      tokens.push({ text: line.slice(i, close), className: 'code-string' })
      i = close
      continue
    }

    // --- Single-line comment ---
    if (line[i] === '-' && line[i + 1] === '-') {
      tokens.push({ text: line.slice(i), className: 'code-comment' })
      break
    }

    // --- Double-quoted string ---
    if (line[i] === '"') {
      const token = readString(line, i, '"')
      tokens.push({ text: token.text, className: 'code-string' })
      i = token.end
      continue
    }

    // --- Single-quoted string ---
    if (line[i] === "'") {
      const token = readString(line, i, "'")
      tokens.push({ text: token.text, className: 'code-string' })
      i = token.end
      continue
    }

    // --- Number ---
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      const end = readNumber(line, i)
      tokens.push({ text: line.slice(i, end), className: 'code-number' })
      i = end
      continue
    }

    // --- Identifier / keyword ---
    if (/[a-zA-Z_]/.test(line[i])) {
      const end = readIdentifier(line, i)
      const word = line.slice(i, end)

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, className: 'code-keyword' })
      } else if (BUILTINS.has(word)) {
        tokens.push({ text: word, className: 'code-builtin' })
      } else {
        // Check if it looks like a FiveM native (all caps with underscores)
        if (/^[A-Z][A-Z0-9_]*$/.test(word)) {
          tokens.push({ text: word, className: 'code-native' })
        } else {
          tokens.push({ text: word, className: '' })
        }
      }
      i = end
      continue
    }

    // --- Punctuation / operators ---
    if ('=<>~+*-*/#(){}[]:,;.'.includes(line[i])) {
      tokens.push({ text: line[i], className: 'code-operator' })
      i++
      continue
    }

    // --- Whitespace / other ---
    tokens.push({ text: line[i], className: '' })
    i++
  }

  return tokens
}

function readString(line: string, start: number, quote: string): { text: string; end: number } {
  let i = start + 1
  while (i < line.length) {
    if (line[i] === '\\') {
      i += 2 // skip escaped char
      continue
    }
    if (line[i] === quote) {
      i++
      break
    }
    i++
  }
  return { text: line.slice(start, i), end: i }
}

function readNumber(line: string, start: number): number {
  let i = start
  while (i < line.length && /[0-9.xXa-fA-F_eE+-]/.test(line[i])) {
    i++
  }
  return i
}

function readIdentifier(line: string, start: number): number {
  let i = start
  while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
    i++
  }
  return i
}
