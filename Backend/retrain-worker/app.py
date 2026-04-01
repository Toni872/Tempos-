import base64
import json
import os
import traceback
from flask import Flask, request, jsonify
from google.cloud import aiplatform

app = Flask(__name__)


@app.get("/")
def info():
    return jsonify(
        {
            "service": "tempos-retrain-worker",
            "status": "ok",
            "usage": "POST / with Pub/Sub payload to trigger retraining",
            "health": "/health",
        }
    ), 200


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


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

    if payload.get("action", "vertex_retrain") != "vertex_retrain":
        return jsonify({"ok": True, "ignored": True}), 200

    project = os.environ.get("PROJECT_ID", "tempos-project")
    region = os.environ.get("VERTEX_REGION", "europe-west4")
    display_name = os.environ.get("VERTEX_JOB_NAME", "tempos-retrain-job")
    staging_bucket = os.environ.get("VERTEX_STAGING_BUCKET", "gs://bucket-quickstart_tempos-project")

    try:
        aiplatform.init(project=project, location=region, staging_bucket=staging_bucket)

        custom_job = aiplatform.CustomJob(
            display_name=display_name,
            worker_pool_specs=[
                {
                    "machine_spec": {"machine_type": "n1-standard-4"},
                    "replica_count": 1,
                    "container_spec": {
                        "image_uri": "us-docker.pkg.dev/vertex-ai/training/tf-cpu.2-13.py310:latest",
                        "command": ["python", "-c", "print('retraining placeholder')"],
                    },
                }
            ],
        )

        custom_job.run(sync=False)
        return jsonify({"ok": True, "job": display_name}), 200
    except Exception as ex:
        print("retrain_worker_error:", str(ex), flush=True)
        print(traceback.format_exc(), flush=True)
        return jsonify({"ok": False, "error": str(ex)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
