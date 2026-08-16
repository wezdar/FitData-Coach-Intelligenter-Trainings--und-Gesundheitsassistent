select
    user_id,
    date_trunc('week', activity_date)::date as week_start,
    sum(steps) as steps,
    round(sum(distance_km), 2) as distance_km,
    round(sum(active_calories_kcal), 0) as active_calories_kcal,
    sum(workout_count) as completed_workouts,
    count(*) filter (where steps_goal_met) as days_steps_goal_met,
    round(avg(steps_goal_rate) * 100, 1) as average_steps_adherence_percent,
    max(source_max_timestamp) as source_max_timestamp
from {{ ref('fct_daily_activity') }}
group by 1, 2
