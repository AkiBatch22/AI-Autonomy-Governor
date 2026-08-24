"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MetricsSnapshot,
  SegmentMetric,
} from "@/types/agent";


interface AnalyticsChartsProps {
  metrics: MetricsSnapshot;
}


function toPercent(value: number) {
  return Number(
    (value * 100).toFixed(2)
  );
}


function getSegmentLabel(
  row: SegmentMetric,
  possibleKeys: string[]
) {

  for (const key of possibleKeys) {

    const value = row[key];

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value);
    }

  }

  return "Unknown";
}


export default function AnalyticsCharts({
  metrics,
}: AnalyticsChartsProps) {

  const confidenceData =
    metrics.confidence_performance.map(
      (row) => ({
        band: getSegmentLabel(
          row,
          [
            "confidence_band",
            "confidence_range",
            "segment",
          ]
        ),

        accuracy:
          toPercent(row.accuracy),

        humanReviewRate:
          toPercent(
            row.human_review_rate
          ),

        errorRate:
          toPercent(
            row.error_rate
          ),
      })
    );


  const riskData =
    metrics.risk_performance.map(
      (row) => ({
        risk: getSegmentLabel(
          row,
          [
            "risk_level",
            "risk",
            "segment",
          ]
        ),

        errorRate:
          toPercent(
            row.error_rate
          ),

        humanReviewRate:
          toPercent(
            row.human_review_rate
          ),

        accuracy:
          toPercent(
            row.accuracy
          ),
      })
    );


  return (
    <div className="mt-10 grid gap-6 xl:grid-cols-2">

      {/* CONFIDENCE RELIABILITY */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <div>

          <p className="text-sm font-medium text-gray-500">
            MODEL RELIABILITY
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Accuracy by Confidence Band
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Validates whether higher model confidence
            corresponds to stronger historical accuracy.
          </p>

        </div>


        {confidenceData.length === 0 ? (

          <div className="mt-8 rounded-lg bg-gray-50 p-6 text-sm text-gray-500">
            No confidence performance data available.
          </div>

        ) : (

          <div className="mt-8 h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={confidenceData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="band"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  domain={[
                    "dataMin - 1",
                    "dataMax + 1",
                  ]}
                  tickFormatter={
                    (value) =>
                      `${Number(value).toFixed(0)}%`
                  }
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)}%`,
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="#111827"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        )}

      </section>


      {/* RISK EXPOSURE */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <div>

          <p className="text-sm font-medium text-gray-500">
            RISK EXPOSURE
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-900">
            Error Rate by Risk Level
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Shows where autonomous execution creates
            the greatest historical decision risk.
          </p>

        </div>


        {riskData.length === 0 ? (

          <div className="mt-8 rounded-lg bg-gray-50 p-6 text-sm text-gray-500">
            No risk-segment performance data available.
          </div>

        ) : (

          <div className="mt-8 h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={riskData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="risk"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tickFormatter={
                    (value) =>
                      `${Number(value).toFixed(1)}%`
                  }
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)}%`,
                    "Error Rate",
                  ]}
                />

                <Bar
                  dataKey="errorRate"
                  name="Error Rate"
                  fill="#111827"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        )}

      </section>

    </div>
  );
}