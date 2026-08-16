with daily as (
    select
        user_id,
        activity_date,
        sum(steps)::bigint as steps,
        round(sum(distance_km), 3) as distance_km,
        round(sum(duration_min), 1) as active_minutes,
        round(sum(calories_kcal), 1) as active_calories_kcal,
        count(*) filter (where activity_type = 'workout') as workout_count,
        max(activity_ts_local) as source_max_timestamp
    from {{ ref('stg_activities') }}
    group by 1, 2
)

select
    *,
    steps >= 10000 as steps_goal_met,
    case when steps >= 10000 then 1.0 else steps / 10000.0 end as steps_goal_rate
from daily
