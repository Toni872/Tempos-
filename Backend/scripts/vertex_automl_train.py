#!/usr/bin/env python3
"""
Crea un dataset Tabular en Vertex AI y lanza un job de entrenamiento AutoML.
Uso mínimo (requiere credenciales GCP en ambiente):
  python vertex_automl_train.py --project tempos-project --bucket bucket-quickstart_tempos-project

Este script es un punto de partida: ajusta `target_column` y `budget_milli_node_hours` según tu caso.
"""
import argparse
import os
from google.cloud import aiplatform


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', default=os.environ.get('PROJECT_ID') or os.environ.get('GOOGLE_CLOUD_PROJECT'))
    parser.add_argument('--location', default='europe-west4')
    parser.add_argument('--gcs-uri', default=None, help='URI CSV en GCS (p. ej. gs://bucket/poc/fichas.csv)')
    parser.add_argument('--bucket', default=None, help='bucket para staging')
    parser.add_argument('--target-column', default='label', help='Columna objetivo en el CSV')
    args = parser.parse_args()

    if not args.project:
        raise SystemExit('Project ID required via --project or env GOOGLE_CLOUD_PROJECT/PROJECT_ID')

    if not args.gcs_uri and not args.bucket:
        raise SystemExit('Debes indicar --gcs-uri o --bucket')

    aiplatform.init(project=args.project, location=args.location, staging_bucket=args.bucket)

    dataset_uri = args.gcs_uri or f'gs://{args.bucket}/poc/fichas.csv'
    print('Creando dataset desde', dataset_uri)
    dataset = aiplatform.TabularDataset.create(display_name='tempos-fichas-dataset', gcs_source=[dataset_uri])
    print('Dataset creado:', dataset.resource_name)

    job = aiplatform.AutoMLTabularTrainingJob(display_name='tempos-automl-job', optimization_prediction_type='classification')
    model = job.run(
        dataset=dataset,
        target_column=args.target_column,
        optimization_objective='balanced_accuracy',
        budget_milli_node_hours=8000,
        model_display_name='tempos-automl-model',
        sync=True,
    )
    print('Model creado:', model.resource_name)

if __name__ == '__main__':
    main()
