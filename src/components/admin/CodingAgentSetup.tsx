import React from 'react'

/** The starter every coding agent gets: read the portable instructions first. */
export const BUILD_FEATURE_STARTER = 'Read AGENTS.md first. Then add to my UltimaPress site: '

/**
 * The common "open the folder and launch your agent" step. Shared by the dashboard, Build a
 * feature and Site code so the launchers never drift apart.
 */
export function CodingAgentSetup() {
  return (
    <span>
      Open the extracted folder in any coding agent. In that folder&apos;s terminal, launch the
      client you use: <code>claude</code>, <code>omp</code>, <code>opencode</code> (V2) or{' '}
      <code>pi</code>. In the Claude desktop app, open Code and choose the folder. Pi asks you to
      review and accept project trust the first time; accept it so the skill loads. Another client
      works too: ask it to read <code>AGENTS.md</code> and the Payload guide directly.
    </span>
  )
}
