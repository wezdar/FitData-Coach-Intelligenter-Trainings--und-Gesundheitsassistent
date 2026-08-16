# Metric lineage and assumptions

| Metric | Formula | Unit | Source lineage | Primary limitation |
|---|---|---|---|---|
| BMI | `weight_kg / height_m²` | kg/m² | `analytics.latest_measurement.weight_kg`, `profile.height_cm` | Does not distinguish muscle and fat mass |
| Indicative weight range | BMI 18.5–24.9 × `height_m²` | kg | `profile.height_cm`, reference boundaries | Population interval, not an individual prescription |
| BMR | Mifflin–St Jeor | kcal/day | weight, height, age, sex profile fields | Individual metabolism varies |
| TDEE | `BMR × activity_factor` | kcal/day | derived BMR, configured activity factor | Broad activity categories |
| Distance | `steps × stride_cm / 100000` | km | staging steps, profile stride length | Constant stride assumption |
| Exercise calories | `MET × 3.5 × kg × min / 200` | kcal | workout MET, weight, duration | Does not measure individual efficiency |
| Adherence | `completed / planned × 100` | % | completed and planned session aggregates | Completion is not exercise quality |

The Python implementation is authoritative for the API. The TypeScript version
keeps instant client-side presentation consistent and is tested with matching
reference cases.
