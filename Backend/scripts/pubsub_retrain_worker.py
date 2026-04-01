import base64
import json
import os
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)


def _run(command: list[str]) -> str:
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return result.stdout.strip()


@app.post("/")
def handle_pubsub_push():
    body = request.get_json(silent=True) or {}
    msg = body.get("message", {})
    data_b64 = msg.get("data", "")

    payload = {}
    if data_b64:
        try:
            payload = json.loads(base64.b64decode(data_b64).decode("utf-8"))
        except Exception:
            payload = {}

    action = payload.get("action", "vertex_retrain")
    if action != "vertex_retrain":
        return jsonify({"ok": True, "ignored": action}), 200

    project = os.environ.get("PROJECT_ID", "tempos-project")
    region = os.environ.get("VERTEX_REGION", "europe-west4")
    display_name = os.environ.get("VERTEX_JOB_NAME", "tempos-retrain-job")

    # Placeholder operativo: dispara un custom job minimo en Vertex AI.
    # Ajusta worker-pool-spec y contenedor segun tu entrenamiento real.
    cmd = [
        "gcloud",
        "ai",
        "custom-jobs",
        "create",
        "--project",
        project,
        "--region",
        region,
        "--display-name",
        display_name,
        "--worker-pool-spec",
        "machine-type=n1-standard-4,replica-count=1,container-image-uri=us-docker.pkg.dev/vertex-ai/training/tf-cpu.2-13.py310:latest,command=python,args=-c,\"print('retraining placeholder')\"",
    ]

    try:
        out = _run(cmd)
        return jsonify({"ok": True, "result": out}), 200
    except Exception as ex:
        return jsonify({"ok": False, "error": str(ex)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
