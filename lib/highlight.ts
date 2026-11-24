/* Minimal C++/Arduino tokenizer for syntax highlighting.
   Produces arrays of { text, cls } spans per line — safe for React rendering. */

export interface Token {
  text: string;
  cls: string;
}

const KEYWORDS = new Set([
  "void", "int", "long", "bool", "if", "else", "for", "while", "do",
  "return", "const", "unsigned", "char", "byte", "float", "double",
  "static", "break", "continue", "switch", "case", "default", "true", "false",
]);

const TYPES = new Set(["SoftwareSerial", "String"]);

const COLORS: Record<string, string> = {
  keyword: "#5eb2ff",
  type: "#4fd6c8",
  preproc: "#c792ea",
  comment: "#54687d",
  string: "#e8c07d",
  number: "#f78c6c",
  func: "#82aaff",
  plain: "#b8c4d4",
  punct: "#6d7f96",
};

export function highlightLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const push = (text: string, cls: string) => {
    if (text) tokens.push({ text, cls });
  };

  // Whole-line preprocessor directive
  if (/^\s*#/.test(line)) {
    const m = line.match(/^(\s*#\s*\w+)(.*)$/);
    if (m) {
      push(m[1], "preproc");
      // rest of preprocessor line: highlight <...> as string
      const rest = m[2];
      const lt = rest.indexOf("<");
      if (lt >= 0) {
        push(rest.slice(0, lt), "plain");
        push(rest.slice(lt), "string");
      } else {
        push(rest, "plain");
      }
      return tokens;
    }
  }

  while (i < line.length) {
    // comment
    if (line.startsWith("//", i)) {
      push(line.slice(i), "comment");
      break;
    }
    // block comment start (rest of line)
    if (line.startsWith("/*", i)) {
      const end = line.indexOf("*/", i + 2);
      push(line.slice(i, end === -1 ? undefined : end + 2), "comment");
      i = end === -1 ? line.length : end + 2;
      continue;
    }
    // string
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") j++;
        j++;
      }
      push(line.slice(i, j + 1), "string");
      i = j + 1;
      continue;
    }
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === "\\") j++;
        j++;
      }
      push(line.slice(i, j + 1), "string");
      i = j + 1;
      continue;
    }
    // number
    const numMatch = line.slice(i).match(/^\d+(\.\d+)?([uUlLfF])?/);
    if (numMatch && !/\w/.test(line[i - 1] || "")) {
      push(numMatch[0], "number");
      i += numMatch[0].length;
      continue;
    }
    // identifier / keyword
    const idMatch = line.slice(i).match(/^[A-Za-z_]\w*/);
    if (idMatch) {
      const word = idMatch[0];
      let cls = "plain";
      if (KEYWORDS.has(word)) cls = "keyword";
      else if (TYPES.has(word)) cls = "type";
      else {
        // function call: identifier followed by (
        const rest = line.slice(i + word.length);
        if (/^\s*\(/.test(rest)) cls = "func";
        else if (/^[A-Z_]/.test(word)) cls = "type"; // MACROS / defines
      }
      push(word, cls);
      i += word.length;
      continue;
    }
    // punctuation / operators
    const opMatch = line.slice(i).match(/^[{}()\[\];,.<>=+\-*/%&|!~?:^]+/);
    if (opMatch) {
      push(opMatch[0], "punct");
      i += opMatch[0].length;
      continue;
    }
    // whitespace and anything else
    push(line[i], "plain");
    i++;
  }
  return tokens;
}

export { COLORS as TOKEN_COLORS };
