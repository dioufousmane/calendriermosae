// fichiers trigger.js
import fetch from "node-fetch";

const REPO = "dioufousmane/calendriermosae";
const WORKFLOW_FILE = "all_events.yml"; // nom exact du fichier dans .github/workflows

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const token = process.env.GITHUB_TOKEN;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer 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`
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ success: false, message: err });
    }

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
