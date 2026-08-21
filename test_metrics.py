from backend.app.services.metrics import (
    load_execution_data,
    get_overview_metrics,
    performance_by_confidence_band,
    performance_by_segment,
)

df = load_execution_data("data/demo_executions.csv")

print("\nOVERVIEW")
print(get_overview_metrics(df))

print("\nCONFIDENCE")
print(performance_by_confidence_band(df))

print("\nRISK")
print(performance_by_segment(df, "risk_level"))

print("\nVENDOR")
print(performance_by_segment(df, "vendor_type"))