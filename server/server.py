from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# 🔧 Config
GITHUB_TOKEN = "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"
REPO_OWNER = "dioufousmane"
REPO_NAME = "calendriermosae"
EVENT_TYPE = "refresh-events"

@app.route("/trigger-workflow", methods=["POST"])
def trigger_workflow():
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json"
    }

    payload = {
        "event_type": EVENT_TYPE
    }

    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/dispatches"

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 204:
        return jsonify({"success": True, "message": "Workflow déclenché !"})
    else:
        return jsonify({
            "success": False,
            "message": "Erreur GitHub",
            "status": response.status_code,
            "details": response.text
        }), response.status_code

if __name__ == "__main__":
    app.run(debug=True)
