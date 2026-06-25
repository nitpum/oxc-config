// Minimal, dependency-free glob matcher for file patterns.
// Supports: ** (zero or more path segments), * (within a segment, not "/"),
// ? (single char, not "/"), [char-class] and [!negated], and {a,b,c} brace expansion.
// Relative patterns are matched against any path suffix (so they work with both
// absolute and relative filenames reported by the linter).

function escapeRegex(ch: string): string {
  return /[$()*+.?[\\\]^{|}]/.test(ch) ? "\\" + ch : ch;
}

function splitTopLevelCommas(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "," && depth === 0) {
      out.push(input.slice(start, i));
      start = i + 1;
    }
  }
  out.push(input.slice(start));
  return out;
}

function expandBraces(pattern: string): string[] {
  const open = pattern.indexOf("{");
  if (open === -1) return [pattern];
  let depth = 0;
  let close = -1;
  for (let i = open; i < pattern.length; i++) {
    if (pattern[i] === "{") depth++;
    else if (pattern[i] === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) return [pattern];
  const before = pattern.slice(0, open);
  const after = pattern.slice(close + 1);
  const inner = pattern.slice(open + 1, close);
  const out: string[] = [];
  for (const part of splitTopLevelCommas(inner)) {
    out.push(...expandBraces(before + part + after));
  }
  return out;
}

function isGlobstar(segment: string): boolean {
  return segment.length > 0 && /^[*]+$/.test(segment);
}

function segmentBody(segment: string): string {
  let re = "";
  let i = 0;
  while (i < segment.length) {
    const c = segment[i];
    if (c === "*") {
      re += "[^/]*";
      i++;
    } else if (c === "?") {
      re += "[^/]";
      i++;
    } else if (c === "[") {
      let j = i + 1;
      let negated = false;
      if (segment[j] === "!" || segment[j] === "^") {
        negated = true;
        j++;
      }
      let body = "";
      while (j < segment.length && segment[j] !== "]") {
        body += segment[j];
        j++;
      }
      if (j >= segment.length || body === "") {
        re += "\\[";
        i++;
        continue;
      }
      re += "[" + (negated ? "^" : "") + body + "]";
      i = j + 1;
    } else {
      re += escapeRegex(c);
      i++;
    }
  }
  return re;
}

function globBody(pattern: string): string {
  const segments = pattern.split("/");
  let re = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "") {
      if (i === 0) re += "/";
      continue;
    }
    if (isGlobstar(seg)) {
      const prevExists = re !== "" && !re.endsWith("/");
      const isLast = i === segments.length - 1;
      const nextIsReal = !isLast && segments[i + 1] !== "";
      if (isLast || !nextIsReal) {
        re += prevExists ? "(?:/.*)?" : ".*";
      } else if (prevExists) {
        re += "/(?:[^/]+/)*";
      } else {
        re += "(?:[^/]+/)*";
      }
      continue;
    }
    re += segmentBody(seg);
    const next = segments[i + 1];
    if (i < segments.length - 1 && next !== "" && !isGlobstar(next)) {
      re += "/";
    }
  }
  return re;
}

export function isGlobMatch(pattern: string, filename: string): boolean {
  const normalized = filename.replace(/\\/g, "/");
  const relative = !pattern.startsWith("/");
  const prefix = relative ? "(?:.*/)?" : "";
  const cleaned = pattern.replace(/^\.\//, "");
  const bodies = expandBraces(cleaned).map(globBody);
  if (bodies.length === 0) return false;
  try {
    return new RegExp(`^${prefix}(?:${bodies.join("|")})$`).test(normalized);
  } catch {
    return false;
  }
}

export function matchesAny(patterns: readonly string[], filename: string): boolean {
  return patterns.some((p) => isGlobMatch(p, filename));
}
