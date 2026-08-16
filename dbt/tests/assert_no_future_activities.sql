select *
from {{ ref('stg_activities') }}
where activity_ts_local > current_timestamp + interval '5 minutes'
