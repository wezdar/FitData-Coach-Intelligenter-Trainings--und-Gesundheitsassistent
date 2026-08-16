with ranked as (
    select
        *,
        row_number() over (partition by user_id order by measured_at_local desc) as row_number
    from {{ ref('stg_weight_measurements') }}
)

select
    user_id,
    measurement_date,
    weight_kg,
    measured_at_local,
    source_ingestion_id
from ranked
where row_number = 1
