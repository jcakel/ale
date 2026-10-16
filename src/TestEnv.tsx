import React from 'react';
export function TestEnv() {
  return <div>{process.env.GEMINI_API_KEY ? "KEY EXISTS" : "NO KEY"}</div>;
}
