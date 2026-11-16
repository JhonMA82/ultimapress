# Deep check rules

`deep-check-rules.yaml` holds the JavaScript and TypeScript security rules from
semgrep-rules, as published by the Opengrep project at
https://github.com/opengrep/opengrep-rules (commit f1d2b562b414783763fd02a6ed2736eaed622efa).
Only rules with `category: security` are included; they are unchanged.

They are used by the optional Deep check add-on (Settings > Security), which runs them with
the Opengrep scanner (https://github.com/opengrep/opengrep, LGPL 2.1).

Licence of the rules:

    "Commons Clause" License Condition v1.0

    The Software is provided to you by the Licensor under the License, as defined below,
    subject to the following condition.

    Without limiting other conditions in the License, the grant of rights under the License
    will not include, and the License does not grant to you, the right to Sell the Software.

    For purposes of the foregoing, "Sell" means practicing any or all of the rights granted
    to you under the License to provide to third parties, for a fee or other consideration
    (including without limitation fees for hosting or consulting/ support services related
    to the Software), a product or service whose value derives, entirely or substantially,
    from the functionality of the Software. Any license notice or attribution required by
    the License must also include this Commons Clause License Condition notice.

    Software: semgrep-rules (https://github.com/semgrep/semgrep-rules)
    License: LGPL 2.1 (GNU Lesser General Public License, Version 2.1)
    Licensor: Semgrep, Inc. (https://semgrep.dev)

The Deep check add-on is free and must stay free: it may not be sold, or offered as a paid
feature or service, under the condition above.
