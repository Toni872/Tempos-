#!/usr/bin/env python3
"""
Exporta tablas relevantes (fichas, ausencias) de Postgres a CSV y las sube a un bucket GCS.
Uso:
  python export_fichas_to_gcs.py --bucket gs://bucket-name
Dependencias: sqlalchemy, pandas, google-cloud-storage, psycopg2-binary
"""
import os
import argparse
import tempfile
import pandas as pd
from sqlalchemy import create_engine
from google.cloud import storage


def export_table_to_csv(engine, table_name, csv_path):
    df = pd.read_sql_table(table_name, con=engine)
    df.to_csv(csv_path, index=False)


def upload_file(bucket_name, source_file, dest_blob_name):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)
    blob.upload_from_filename(source_file)
    print(f'Uploaded {source_file} to gs://{bucket_name}/{dest_blob_name}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket', required=True, help='gcs bucket full path (gs://...) or bucket name')
    parser.add_argument('--database-url', default=os.environ.get('DATABASE_URL'), help='Postgres DATABASE_URL')
    args = parser.parse_args()

    if not args.database_url:
        raise SystemExit('DATABASE_URL not set')

    # normalizar bucket
    bucket = args.bucket
    if bucket.startswith('gs://'):
        bucket_name = bucket[5:]
    else:
        bucket_name = bucket

    engine = create_engine(args.database_url)
    tables = ['ficha','fichas','absences','absence']  # nombres comunes a intentar

    with tempfile.TemporaryDirectory() as tmpdir:
        for t in tables:
            try:
                csv_path = f'{tmpdir}/{t}.csv'
                export_table_to_csv(engine, t, csv_path)
                upload_file(bucket_name, csv_path, f'poc/{t}.csv')
            except Exception as e:
                print(f'No se pudo exportar la tabla {t}: {e}')

if __name__ == '__main__':
    main()
