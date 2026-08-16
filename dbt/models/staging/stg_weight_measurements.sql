select
    measurement_id,
    user_id,
    measured_at at time zone 'Europe/Berlin' as measured_at_local,
    (measured_at at time zone 'Europe/Berlin')::date as measurement_date,
    weight_kg,
    source_system,
    source_ingestion_id
from {{ source('staging_source', 'weight_measurements') }}
