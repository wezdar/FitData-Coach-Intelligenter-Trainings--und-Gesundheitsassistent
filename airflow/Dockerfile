FROM apache/airflow:3.0.3-python3.12

USER airflow
RUN pip install --no-cache-dir \
    "pandas>=2.2,<3" \
    "pandera>=0.24,<1" \
    "minio>=7.2,<8" \
    "psycopg[binary]>=3.2,<4" \
    "dbt-postgres>=1.9,<2"
