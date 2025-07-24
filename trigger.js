// trigger.js
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

const token = process.env.GITHUB_TOKEN;
const owner = "dioufousmane";
const repo = "calendriermosae";
const workflowId = "all_events.yml";
const ref = "master";

app.post("/trigger", async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(`Erreur GitHub API : ${text}`);
    }

    res.send("Déclenchement réussi !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur.");
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Serveur backend lancé sur http://localhost:${PORT}`));
