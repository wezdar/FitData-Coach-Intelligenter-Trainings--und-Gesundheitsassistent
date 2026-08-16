with source as (
    select * from {{ source('staging_source', 'activities') }}
),

typed as (
    select
        activity_id,
        user_id,
        activity_ts at time zone 'Europe/Berlin' as activity_ts_local,
        (activity_ts at time zone 'Europe/Berlin')::date as activity_date,
        lower(trim(activity_type)) as activity_type,
        greatest(steps, 0) as steps,
        greatest(distance_km, 0) as distance_km,
        greatest(duration_min, 0) as duration_min,
        greatest(calories_kcal, 0) as calories_kcal,
        source_system,
        source_ingestion_id,
        transformed_at
    from source
)

select * from typed
